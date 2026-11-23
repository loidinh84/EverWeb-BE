import userRepository from "../repositories/userRepository.js";
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Vui lòng đăng nhập để tiếp tục!", 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new AppError("Vui lòng đăng nhập lại!", 401);
    }

    const currentUser = await userRepository.findById(decoded.id);
    if (!currentUser) {
      throw new AppError("Tài khoản không tồn tại hoặc đã bị xóa!", 401);
    }

    if (!currentUser.is_active) {
      throw new AppError("Tài khoản của bạn đã bị khóa!", 403);
    }

    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "Bạn không có quyền thực hiện thao tác này!",
          403
        )
      );
    }


    next();
  };
};

/**
 * Middleware xác thực tùy chọn (Optional Authentication).
 * Nếu có token hợp lệ -> gán req.user.
 * Nếu không có token hoặc token hết hạn -> vẫn cho đi tiếp (req.user = null).
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded?.id) {
          const currentUser = await userRepository.findById(decoded.id);
          if (currentUser && currentUser.is_active) {
            req.user = currentUser;
          }
        }
      } catch {
        // Token không hợp lệ thì bỏ qua, không ném lỗi
      }
    }

    next();
  } catch {
    next();
  }
};
