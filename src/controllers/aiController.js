import aiService from "../services/aiService.js";
import prisma from "../config/db.js";
import weddingRepository from "../repositories/weddingRepository.js";
import { chatRequestSchema, sessionChatRequestSchema } from "../dtos/aiDto.js";
import {
  WEDDING_PLANNER_SYSTEM_PROMPT,
  buildWeddingPlannerPrompt,
} from "../prompts/weddingPlannerPrompt.js";
import AppError from "../utils/AppError.js";

const aiController = {
  /**
   * [POST] /api/ai/chat
   * Chat linh hoạt (hỗ trợ cả gửi 1 câu hỏi hoặc gửi toàn bộ mảng lịch sử tin nhắn).
   * Không bắt buộc đăng nhập, phù hợp cho preview, quick-chat hoặc test.
   */
  async chat(req, res, next) {
    try {
      const validatedData = chatRequestSchema.parse(req.body);
      const {
        message,
        messages: inputMessages,
        provider,
        model,
        weddingId,
        temperature,
        maxTokens,
      } = validatedData;

      // Chuẩn bị danh sách tin nhắn
      let messages = inputMessages || [];
      if (!messages.length && message) {
        messages = [{ role: "user", content: message }];
      }

      // Xây dựng System Prompt (nhúng ngữ cảnh đám cưới nếu có weddingId)
      let systemPrompt = WEDDING_PLANNER_SYSTEM_PROMPT;
      if (weddingId) {
        try {
          const wedding = await weddingRepository.findById(weddingId);
          if (wedding) {
            systemPrompt = buildWeddingPlannerPrompt({
              groomName: wedding.groom_name,
              brideName: wedding.bride_name,
              weddingDate: wedding.wedding_date
                ? new Date(wedding.wedding_date).toLocaleDateString("vi-VN")
                : null,
              totalBudget: wedding.total_budget,
              venueName: wedding.venue_name,
              venueAddress: wedding.venue_address,
              guestCount: wedding._count?.guests,
            });
          }
        } catch (dbErr) {
          console.warn("Không thể lấy thông tin đám cưới từ DB, sử dụng prompt mặc định:", dbErr.message);
        }
      }

      // Gọi AI Service
      const result = await aiService.generateChatResponse({
        messages,
        systemPrompt,
        provider,
        model,
        temperature,
        maxTokens,
      });

      res.status(200).json({
        status: "success",
        message: "Phản hồi thành công từ Trợ lý Kế hoạch Cưới",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [POST] /api/ai/session-chat
   * Chat theo phiên (Session-based) có lưu lịch sử vào CSDL PostgreSQL (Prisma).
   * Yêu cầu người dùng đăng nhập hoặc có thông tin phiên.
   */
  async sessionChat(req, res, next) {
    try {
      const validatedData = sessionChatRequestSchema.parse(req.body);
      const { sessionId, weddingId, message, provider, model } = validatedData;
      const userId = req.user?.id;

      // 1. Kiểm tra quyền sở hữu đám cưới
      const wedding = await weddingRepository.findByIdOrThrow(weddingId);

      // 2. Tìm hoặc tạo mới chat_session
      let session;
      if (sessionId) {
        session = await prisma.chat_sessions.findUnique({
          where: { id: sessionId },
          include: {
            chat_messages: {
              orderBy: { created_at: "asc" },
            },
          },
        });

        if (!session) {
          throw new AppError("Không tìm thấy phiên trò chuyện (sessionId)", 404);
        }
      } else {
        session = await prisma.chat_sessions.create({
          data: {
            wedding_id: weddingId,
            user_id: userId || null,
            mode: "PLANNER",
          },
          include: {
            chat_messages: true,
          },
        });
      }

      // 3. Chuẩn bị lịch sử hội thoại từ CSDL
      const historyMessages = (session.chat_messages || []).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      // Thêm câu hỏi mới của user
      historyMessages.push({ role: "user", content: message });

      // 4. Nhúng ngữ cảnh đám cưới vào prompt
      const systemPrompt = buildWeddingPlannerPrompt({
        groomName: wedding.groom_name,
        brideName: wedding.bride_name,
        weddingDate: wedding.wedding_date
          ? new Date(wedding.wedding_date).toLocaleDateString("vi-VN")
          : null,
        totalBudget: wedding.total_budget,
        venueName: wedding.venue_name,
        venueAddress: wedding.venue_address,
        guestCount: wedding._count?.guests,
      });

      // 5. Gọi AI Service
      const aiResult = await aiService.generateChatResponse({
        messages: historyMessages,
        systemPrompt,
        provider,
        model,
      });

      // 6. Lưu tin nhắn của user & assistant vào CSDL trong Transaction
      await prisma.$transaction([
        prisma.chat_messages.create({
          data: {
            session_id: session.id,
            role: "user",
            content: message,
          },
        }),
        prisma.chat_messages.create({
          data: {
            session_id: session.id,
            role: "assistant",
            content: aiResult.reply,
          },
        }),
        prisma.llm_usage_logs.create({
          data: {
            session_id: session.id,
            model: aiResult.model,
            input_tokens: aiResult.usage.inputTokens,
            output_tokens: aiResult.usage.outputTokens,
          },
        }),
      ]);

      res.status(200).json({
        status: "success",
        message: "Phản hồi thành công từ Trợ lý Kế hoạch Cưới",
        data: {
          sessionId: session.id,
          reply: aiResult.reply,
          provider: aiResult.provider,
          model: aiResult.model,
          usage: aiResult.usage,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [GET] /api/ai/prompt
   * Lấy nội dung System Prompt đóng vai Trợ lý Kế hoạch Cưới
   */
  async getSystemPrompt(req, res, next) {
    try {
      const { weddingId } = req.query;
      let prompt = WEDDING_PLANNER_SYSTEM_PROMPT;

      if (weddingId) {
        const wedding = await weddingRepository.findById(weddingId);
        if (wedding) {
          prompt = buildWeddingPlannerPrompt({
            groomName: wedding.groom_name,
            brideName: wedding.bride_name,
            weddingDate: wedding.wedding_date
              ? new Date(wedding.wedding_date).toLocaleDateString("vi-VN")
              : null,
            totalBudget: wedding.total_budget,
            venueName: wedding.venue_name,
            venueAddress: wedding.venue_address,
            guestCount: wedding._count?.guests,
          });
        }
      }

      res.status(200).json({
        status: "success",
        data: { prompt },
      });
    } catch (err) {
      next(err);
    }
  },
};

export default aiController;

