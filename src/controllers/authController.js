import authService from "../services/authService.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../dtos/authDto.js";

const authController = {
  // [POST]
  async register(req, res, next) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);

      res.status(201).json({
        status: "success",
        message: "Đăng ký tài khoản thành công!",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // [POST]
  async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);

      res.status(200).json({
        status: "success",
        message: "Đăng nhập thành công!",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // [PATCH]
  async changePassword(req, res, next) {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const result = await authService.changePassword(
        req.user.id,
        validatedData,
      );

      res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  // [POST]
  async forgotPassword(req, res, next) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(validatedData.email);

      res.status(200).json({
        status: "success",
        message: result.message,
        resetToken: result.resetToken,
      });
    } catch (err) {
      next(err);
    }
  },

  // [POST]
  async resetPassword(req, res, next) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(validatedData);

      res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  // [GET]
  async getMe(req, res, next) {
    try {
      res.status(200).json({
        status: "success",
        data: { user: req.user },
      });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
