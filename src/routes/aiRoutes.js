import express from "express";
import aiController from "../controllers/aiController.js";
import { optionalAuthenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// [POST] /api/ai/chat - Chat tự do (quick chat / multi-turn)
router.post("/chat", aiController.chat);

// [POST] /api/ai/session-chat - Chat theo phiên có lưu lịch sử vào CSDL
router.post("/session-chat", optionalAuthenticate, aiController.sessionChat);

// [GET] /api/ai/sessions - Lấy danh sách các phiên trò chuyện (lịch sử)
router.get("/sessions", optionalAuthenticate, aiController.getSessions);

// [POST] /api/ai/sessions - Tạo phiên trò chuyện mới (New Chat)
router.post("/sessions", optionalAuthenticate, aiController.createSession);

// [GET] /api/ai/sessions/:sessionId - Xem chi tiết 1 phiên trò chuyện kèm lịch sử tin nhắn
router.get("/sessions/:sessionId", optionalAuthenticate, aiController.getSessionDetail);

// [DELETE] /api/ai/sessions/:sessionId - Xóa 1 phiên trò chuyện
router.delete("/sessions/:sessionId", optionalAuthenticate, aiController.deleteSession);

// [DELETE] /api/ai/sessions - Xóa tất cả các phiên trò chuyện của đám cưới
router.delete("/sessions", optionalAuthenticate, aiController.clearAllSessions);

// [GET] /api/ai/prompt - Xem nội dung System Prompt Trợ lý Kế hoạch Cưới
router.get("/prompt", aiController.getSystemPrompt);

export default router;

