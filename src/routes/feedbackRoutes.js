import { Router } from "express";
import prisma from "../config/db.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import AppError from "../utils/AppError.js";

const router = Router();

router.use(authenticate);

router.post("/", async (req, res, next) => {
  try {
    const category = String(req.body?.category || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!category || !message) {
      throw new AppError("Vui lòng chọn loại góp ý và nhập nội dung", 400);
    }

    const created = await prisma.audit_logs.create({
      data: {
        actor_id: req.user.id,
        action: "USER_FEEDBACK",
        entity_type: "feedback",
        new_value: { category, message },
      },
    });

    res.status(201).json({
      status: "success",
      message: "Cảm ơn bạn đã gửi góp ý cho EverWed!",
      data: {
        id: created.id,
        category,
        message,
        createdAt: created.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
