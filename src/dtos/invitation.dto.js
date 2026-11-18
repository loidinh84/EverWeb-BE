import { z } from "zod";
import { INVITATION_STATUS_VALUES } from "../constants/invitation.js";

const optionalUrl = z.url("URL không hợp lệ").optional();
const optionalText = z.string().trim().optional();

const personDto = z.object({
  fullName: z.string().trim().min(1, "Họ tên không được để trống"),
  fatherName: optionalText,
  motherName: optionalText,
  avatarUrl: optionalUrl,
}, { error: "Thiếu thông tin cô dâu / chú rể" });

const eventDto = z.object({
  name: z.string().trim().min(1, "Tên sự kiện không được để trống"),
  startTime: z.coerce.date({ error: "Thời gian sự kiện không hợp lệ" }),
  venueName: optionalText,
  address: optionalText,
  mapUrl: optionalUrl,
});

const slugDto = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu '-'");

/** Input DTO khi tạo thiệp mời */
export const CreateInvitationDto = z.object({
  slug: slugDto.optional(),
  groom: personDto,
  bride: personDto,
  weddingDate: z.coerce.date({ error: "Ngày cưới không hợp lệ" }),
  events: z.array(eventDto).default([]),
  coverImageUrl: optionalUrl,
  gallery: z.array(z.url("URL ảnh không hợp lệ")).default([]),
  templateId: optionalText,
  message: z.string().trim().max(2000, "Lời mời tối đa 2000 ký tự").optional(),
  musicUrl: optionalUrl,
  status: z.enum(INVITATION_STATUS_VALUES).optional(),
});

/** Input DTO khi cập nhật thiệp mời (mọi trường đều optional) */
export const UpdateInvitationDto = z
  .object({
    slug: slugDto,
    groom: personDto.partial(),
    bride: personDto.partial(),
    weddingDate: z.coerce.date({ error: "Ngày cưới không hợp lệ" }),
    events: z.array(eventDto),
    coverImageUrl: z.url("URL không hợp lệ"),
    gallery: z.array(z.url("URL ảnh không hợp lệ")),
    templateId: z.string().trim(),
    message: z.string().trim().max(2000, "Lời mời tối đa 2000 ký tự"),
    musicUrl: z.url("URL không hợp lệ"),
    status: z.enum(INVITATION_STATUS_VALUES),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

/**
 * Validate dữ liệu theo DTO.
 * @returns {{ success: true, data } | { success: false, errors: { field, message }[] }}
 */
export const validateDto = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (result.success) return { success: true, data: result.data };

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
};

/** Output DTO: chuẩn hoá dữ liệu trả về cho client */
export const toInvitationResponse = (doc) => {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;

  return {
    id: obj._id?.toString(),
    slug: obj.slug,
    groom: obj.groom,
    bride: obj.bride,
    weddingDate: obj.weddingDate,
    events: (obj.events || []).map(({ _id, ...event }) => ({
      id: _id?.toString(),
      ...event,
    })),
    coverImageUrl: obj.coverImageUrl ?? null,
    gallery: obj.gallery || [],
    templateId: obj.templateId,
    message: obj.message ?? "",
    musicUrl: obj.musicUrl ?? null,
    status: obj.status,
    ownerId: obj.ownerId?.toString() ?? null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};
