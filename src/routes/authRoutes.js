import { Router } from "express";
import authController from "../controllers/authController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

// Các route công khai
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Các route bắt buộc phải đăng nhập
router.get("/me", authenticate, authController.getMe);
router.patch("/change-password", authenticate, authController.changePassword);

// Route mẫu kiểm tra Phân quyền
router.get("/admin-only", authenticate, authorize("admin"), (req, res) => {
  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
});

export default router;
