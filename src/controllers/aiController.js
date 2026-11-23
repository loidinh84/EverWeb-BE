import aiService from "../services/aiService.js";
import prisma from "../config/db.js";
import weddingRepository from "../repositories/weddingRepository.js";
import {
  chatRequestSchema,
  sessionChatRequestSchema,
  createSessionSchema,
  sessionQuerySchema,
} from "../dtos/aiDto.js";
import {
  WEDDING_PLANNER_SYSTEM_PROMPT,
  buildWeddingPlannerPrompt,
} from "../prompts/weddingPlannerPrompt.js";
import AppError from "../utils/AppError.js";

/**
 * Tìm hoặc lấy đám cưới hợp lệ để gắn phiên trò chuyện.
 * Ưu tiên: weddingId truyền vào -> đám cưới của user -> đám cưới mẫu có sẵn trong DB.
 */
async function resolveWedding(weddingId, userId) {
  if (weddingId && typeof weddingId === "string" && weddingId.length === 36) {
    try {
      const wedding = await weddingRepository.findById(weddingId);
      if (wedding) return wedding;
    } catch {
      // Bỏ qua nếu không tìm thấy
    }
  }

  if (userId) {
    try {
      const userWedding = await prisma.weddings.findFirst({
        where: { owner_id: userId },
      });
      if (userWedding) return userWedding;
    } catch {
      // Bỏ qua
    }
  }

  const fallbackWedding = await prisma.weddings.findFirst();
  return fallbackWedding;
}

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
   * Tự động duy trì bộ nhớ ngữ cảnh đối thoại (Conversation Memory) qua các lượt chat.
   */
  async sessionChat(req, res, next) {
    try {
      const validatedData = sessionChatRequestSchema.parse(req.body);
      const { sessionId, weddingId, message, provider, model } = validatedData;
      const userId = req.user?.id;

      // 1. Xác định đám cưới tương ứng (hoặc fallback thông minh)
      const wedding = await resolveWedding(weddingId, userId);
      const effectiveWeddingId = wedding?.id;

      if (!effectiveWeddingId) {
        throw new AppError(
          "Không tìm thấy thông tin đám cưới trong hệ thống để lưu phiên chat",
          400
        );
      }

      // 2. Tìm hoặc tạo mới chat_session
      let session;
      if (sessionId && sessionId.length === 36) {
        session = await prisma.chat_sessions.findUnique({
          where: { id: sessionId },
          include: {
            chat_messages: {
              orderBy: { created_at: "asc" },
            },
          },
        });
      }

      if (!session) {
        session = await prisma.chat_sessions.create({
          data: {
            wedding_id: effectiveWeddingId,
            user_id: userId || null,
            mode: userId ? "owner" : "guest",
          },
          include: {
            chat_messages: true,
          },
        });
      }

      // 3. Chuẩn bị lịch sử hội thoại từ CSDL để AI có trí nhớ ngữ cảnh
      const historyMessages = (session.chat_messages || []).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      // Thêm câu hỏi mới của user
      historyMessages.push({ role: "user", content: message });

      // 4. Nhúng ngữ cảnh đám cưới vào prompt
      let systemPrompt = WEDDING_PLANNER_SYSTEM_PROMPT;
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

      // 5. Gọi AI Service (đã tích hợp sliding window và auto-recovery)
      const aiResult = await aiService.generateChatResponse({
        messages: historyMessages,
        systemPrompt,
        provider,
        model,
      });

      // 6. Lưu tin nhắn của user & assistant vào CSDL trong Transaction
      const [userMsgRecord, assistantMsgRecord] = await prisma.$transaction([
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
          weddingId: session.wedding_id,
          reply: aiResult.reply,
          provider: aiResult.provider,
          model: aiResult.model,
          usage: aiResult.usage,
          userMessage: userMsgRecord,
          assistantMessage: assistantMsgRecord,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [GET] /api/ai/sessions
   * Lấy danh sách các phiên trò chuyện (lịch sử chat)
   */
  async getSessions(req, res, next) {
    try {
      const { weddingId, limit = 20 } = sessionQuerySchema.parse(req.query);
      const userId = req.user?.id;

      // Xây dựng điều kiện lọc linh hoạt
      const whereClause = {};
      if (weddingId && weddingId.length === 36) {
        whereClause.wedding_id = weddingId;
      } else if (userId) {
        whereClause.user_id = userId;
      }

      const sessions = await prisma.chat_sessions.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        take: Number(limit),
        include: {
          chat_messages: {
            orderBy: { created_at: "asc" },
          },
        },
      });

      const formattedSessions = sessions.map((s) => {
        const msgs = s.chat_messages || [];
        const firstUserMsg = msgs.find((m) => m.role === "user");
        const lastMsg = msgs[msgs.length - 1];

        // Tạo tiêu đề tóm tắt từ câu hỏi đầu tiên
        let title = "Cuộc trò chuyện mới";
        if (firstUserMsg?.content) {
          title =
            firstUserMsg.content.length > 50
              ? `${firstUserMsg.content.slice(0, 50)}...`
              : firstUserMsg.content;
        }

        return {
          id: s.id,
          weddingId: s.wedding_id,
          title,
          messageCount: msgs.length,
          lastMessage: lastMsg?.content || "",
          createdAt: s.created_at,
          updatedAt: lastMsg?.created_at || s.created_at,
        };
      });

      res.status(200).json({
        status: "success",
        data: formattedSessions,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [POST] /api/ai/sessions
   * Tạo một phiên trò chuyện mới (New Chat)
   */
  async createSession(req, res, next) {
    try {
      const validatedData = createSessionSchema.parse(req.body);
      const userId = req.user?.id;
      const wedding = await resolveWedding(validatedData.weddingId, userId);

      if (!wedding) {
        throw new AppError("Không tìm thấy thông tin đám cưới trong hệ thống", 400);
      }

      const session = await prisma.chat_sessions.create({
        data: {
          wedding_id: wedding.id,
          user_id: userId || null,
          mode: userId ? "owner" : "guest",
        },
        include: {
          chat_messages: true,
        },
      });

      res.status(201).json({
        status: "success",
        message: "Khởi tạo phiên trò chuyện mới thành công",
        data: {
          id: session.id,
          weddingId: session.wedding_id,
          title: validatedData.title || "Cuộc trò chuyện mới",
          createdAt: session.created_at,
          messages: [],
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [GET] /api/ai/sessions/:sessionId
   * Lấy chi tiết một phiên trò chuyện kèm toàn bộ lịch sử tin nhắn
   */
  async getSessionDetail(req, res, next) {
    try {
      const { sessionId } = req.params;

      if (!sessionId || sessionId.length !== 36) {
        throw new AppError("Mã phiên trò chuyện (sessionId) không hợp lệ", 400);
      }

      const session = await prisma.chat_sessions.findUnique({
        where: { id: sessionId },
        include: {
          chat_messages: {
            orderBy: { created_at: "asc" },
          },
        },
      });

      if (!session) {
        throw new AppError("Không tìm thấy phiên trò chuyện này", 404);
      }

      const msgs = session.chat_messages || [];
      const firstUserMsg = msgs.find((m) => m.role === "user");
      const title = firstUserMsg?.content
        ? firstUserMsg.content.length > 50
          ? `${firstUserMsg.content.slice(0, 50)}...`
          : firstUserMsg.content
        : "Cuộc trò chuyện mới";

      res.status(200).json({
        status: "success",
        data: {
          id: session.id,
          weddingId: session.wedding_id,
          title,
          createdAt: session.created_at,
          messages: msgs.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.created_at,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [DELETE] /api/ai/sessions/:sessionId
   * Xóa một phiên trò chuyện cụ thể
   */
  async deleteSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      if (!sessionId || sessionId.length !== 36) {
        throw new AppError("Mã phiên trò chuyện (sessionId) không hợp lệ", 400);
      }

      const session = await prisma.chat_sessions.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new AppError("Không tìm thấy phiên trò chuyện để xóa", 404);
      }

      await prisma.chat_sessions.delete({
        where: { id: sessionId },
      });

      res.status(200).json({
        status: "success",
        message: "Đã xóa phiên trò chuyện thành công",
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * [DELETE] /api/ai/sessions
   * Xóa toàn bộ lịch sử trò chuyện của một đám cưới
   */
  async clearAllSessions(req, res, next) {
    try {
      const { weddingId } = req.query;
      const userId = req.user?.id;

      const whereClause = {};
      if (weddingId && weddingId.length === 36) {
        whereClause.wedding_id = weddingId;
      } else if (userId) {
        whereClause.user_id = userId;
      }

      const deleteResult = await prisma.chat_sessions.deleteMany({
        where: whereClause,
      });

      res.status(200).json({
        status: "success",
        message: `Đã xóa sạch ${deleteResult.count} phiên trò chuyện`,
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

