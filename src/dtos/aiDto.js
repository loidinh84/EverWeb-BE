import { z } from "zod";

const messageRoleSchema = z.enum(["user", "assistant"]);

export const chatMessageItemSchema = z.object({
  role: messageRoleSchema,
  content: z.string().trim().min(1, "Nội dung tin nhắn không được để trống"),
});

/** Schema xác thực request Chat cơ bản */
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Nội dung tin nhắn không được để trống").optional(),
  messages: z.array(chatMessageItemSchema).min(1, "Cần ít nhất một tin nhắn").optional(),
  provider: z.string().optional(),
  model: z.string().trim().optional(),
  weddingId: z.string().uuid("weddingId phải là UUID hợp lệ").optional().nullable().or(z.literal("")),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
}).refine((data) => data.message || (data.messages && data.messages.length > 0), {
  message: "Vui lòng cung cấp 'message' hoặc danh sách 'messages'",
});

/** Schema xác thực request Chat theo phiên lưu trữ (Session-based) */
export const sessionChatRequestSchema = z.object({
  sessionId: z.string().uuid("sessionId phải là UUID hợp lệ").optional().nullable().or(z.literal("")),
  weddingId: z.string().optional().nullable().or(z.literal("")),
  message: z.string().trim().min(1, "Nội dung tin nhắn không được để trống"),
  provider: z.string().optional(),
  model: z.string().trim().optional(),
});

/** Schema tạo phiên trò chuyện mới */
export const createSessionSchema = z.object({
  weddingId: z.string().optional().nullable().or(z.literal("")),
  title: z.string().trim().max(255).optional(),
});

/** Schema truy vấn danh sách phiên trò chuyện */
export const sessionQuerySchema = z.object({
  weddingId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

