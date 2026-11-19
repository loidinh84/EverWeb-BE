import bcrypt from "bcryptjs";
import userRepository from "../repositories/userRepository.js";
import AppError from "../utils/AppError.js";
import {
  generateToken,
  generateResetToken,
  verifyResetToken,
} from "../utils/jwt.js";

const authService = {
  //Đăng ký
  async register({ email, password, full_name, role }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email này đã được sử dụng!", 409);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      email,
      password_hash,
      full_name,
      role: role || "couple",
      is_active: true,
    });
    if (!newUser) {
      throw new AppError("Tạo tài khoản thất bại!", 500);
    }

    const token = generateToken({ id: newUser.id, role: newUser.role });

    return { user: newUser, token };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Email hoặc mật khẩu không chính xác!", 401);
    }
    if (!user.is_active) {
      throw new AppError("Tài khoản của bạn đã bị khóa!", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError("Email hoặc mật khẩu không chính xác!", 401);
    }

    const token = generateToken({ id: user.id, role: user.role });
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    };
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId))?.email,
    );
    if (!user) {
      throw new AppError("Tài khoản không tồn tại!", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError("Mật khẩu hiện tại không đúng!", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(userId, newPasswordHash);

    return { message: "Đổi mật khẩu thành công!" };
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: "Hãy kiểm tra email của bạn!" };
    }

    const resetToken = generateResetToken({ id: user.id });

    return { message: "Vui lòng kiểm tra email!", resetToken };
  },

  async resetPassword({ token, newPassword }) {
    let decoded;
    try {
      decoded = verifyResetToken(token);
    } catch (err) {
      throw new AppError("Vui lòng đăng nhập lại!", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(decoded.id, newPasswordHash);

    return { message: "Đã cập nhật mật khẩu thành công!" };
  },
};

export default authService;
