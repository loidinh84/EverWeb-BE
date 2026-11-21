import { z } from "zod";
import { validateAndNormalizePhone } from "../utils/phoneValidator.js";

const phoneField = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val, ctx) => {
    const result = validateAndNormalizePhone(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error,
      });
      return z.NEVER;
    }
    return result.normalized;
  });

const emailField = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === "" ? null : val))
  .refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Email không hợp lệ!",
  });

const optionalUuidField = (errorMessage) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: errorMessage,
    });

export const createGuestSchema = z.object({
  wedding_id: z.string().uuid("Thông tin đám cưới không hợp lệ!"),
  full_name: z
    .string()
    .trim()
    .min(1, "Họ và tên không được để trống")
    .max(100, "Tên khách mời tối đa 100 ký tự"),
  phone: phoneField,
  email: emailField,
  group_id: optionalUuidField("Nhóm khách mời không hợp lệ!"),
  max_companions: z.coerce
    .number()
    .int("Số người đi cùng không hợp lệ!")
    .min(0, "Số người đi cùng không hợp lệ!")
    .max(10, "Số người đi cùng tối đa 10 người!")
    .default(0),
});

export const updateGuestSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Họ và tên không được để trống!")
      .max(100, "Tên khách mời tối đa 100 ký tự!")
      .optional(),
    phone: phoneField,
    email: emailField,
    group_id: optionalUuidField("Nhóm khách mời không hợp lệ!"),
    max_companions: z.coerce
      .number()
      .int("Số người đi cùng không hợp lệ")
      .min(0, "Số người đi cùng không hợp lệ")
      .max(10, "Số người đi cùng tối đa 10 người")
      .optional(),
    rsvp_status: z
      .enum(["pending", "attending", "declined"], {
        errorMap: () => ({
          message: "Trạng thái tham dự không hợp lệ!",
        }),
      })
      .optional(),
    dietary_note: z
      .string()
      .trim()
      .max(255, "Ghi chú ăn uống tối đa 255 ký tự.")
      .optional()
      .nullable(),
    wish_message: z.string().trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật.",
  });

export const filterGuestQuerySchema = z.object({
  wedding_id: z.string().uuid("Thông tin đám cưới không hợp lệ!"),
  group_id: optionalUuidField("Nhóm khách mời không hợp lệ!"),
  rsvp_status: z.enum(["pending", "attending", "declined"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const rsvpResponseSchema = z.object({
  rsvp_status: z.enum(["attending", "declined"], {
    errorMap: () => ({
      message: "Trạng thái tham dự không hợp lệ!",
    }),
  }),
  attending_count: z.coerce
    .number()
    .int("Số người tham dự không hợp lệ!")
    .min(1, "Số người tham dự không hợp lệ!")
    .max(20, "Số người tham dự không hợp lệ!")
    .default(1),
  dietary_note: z
    .string()
    .trim()
    .max(255, "Ghi chú ăn uống tối đa 255 ký tự.")
    .optional()
    .nullable(),
  wish_message: z.string().trim().optional().nullable(),
});
