import z from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email không đúng định dạng!"),
  password: z.string().min(6, "Mật khẩu quá yếu, vui lòng đặt lại!"),
  full_name: z.string().min(2, "Họ và tên không được để trống!"),
  role: z.enum(["couple", "admin"]).optional().default("couple"),
});

export const loginSchema = z.object({
  email: z.string().email("Email không đúng định dạng!"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu!"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu cũ!"),
  newPassword: z
    .string()
    .min(6, "Mật khẩu quá yếu, vui lòng đặt mật khẩu mạnh hơn!"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không đúng định dạng!"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Vui lòng đăng nhập!"),
  newPassword: z.string().min(6, "Mật khẩu mới còn yế, bạn nên đặt mạnh hơn!"),
});
