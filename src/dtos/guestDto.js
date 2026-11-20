import { z } from "zod";

export const createGuestSchema = z.object({
  wedding_id: z.string().uuid(),
  full_name: z.string().min(1, "Tên khách mời không được để trống!"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ!").optional(),
  group_id: z.string().uuid().optional(),
  max_companions: z.number().int().min(0).default(0),
});
