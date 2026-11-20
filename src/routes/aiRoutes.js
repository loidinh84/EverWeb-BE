import express from "express";
import aiController from "../controllers/aiController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// [POST] /api/ai/chat - Chat tự do (quick chat / multi-turn)
router.post("/chat", aiController.chat);

// [POST] /api/ai/session-chat - Chat theo phiên có lưu lịch sử vào CSDL
router.post("/session-chat", authenticate, aiController.sessionChat);

// [GET] /api/ai/prompt - Xem nội dung System Prompt Trợ lý Kế hoạch Cưới
router.get("/prompt", aiController.getSystemPrompt);

export default router;

