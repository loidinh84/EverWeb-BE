import { z } from "zod";

const uuidField = (label) =>
  z.string().uuid(`${label} phải là UUID hợp lệ`);

const optionalUrl = z
  .string()
  .trim()
  .url("URL không hợp lệ")
  .max(255, "URL tối đa 255 ký tự")
  .optional()
  .nullable();

const personContentSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên không được để trống"),
  fatherName: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  avatarUrl: z.string().trim().url("URL ảnh không hợp lệ").optional(),
});

const eventContentSchema = z.object({
  name: z.string().trim().min(1, "Tên sự kiện không được để trống"),
  startTime: z.string().trim().min(1, "Thời gian sự kiện là bắt buộc"),
  venueName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  mapUrl: z.string().trim().url("URL bản đồ không hợp lệ").optional(),
});

/** Cấu trúc JSON lưu trong cột `invitations.content` */
export const InvitationContentSchema = z
  .object({
    groom: personContentSchema.optional(),
    bride: personContentSchema.optional(),
    weddingDate: z.string().trim().optional(),
    message: z.string().trim().max(2000, "Lời mời tối đa 2000 ký tự").optional(),
    musicUrl: z.string().trim().url("URL nhạc nền không hợp lệ").optional(),
    gallery: z.array(z.string().trim().url("URL ảnh không hợp lệ")).default([]),
    events: z.array(eventContentSchema).default([]),
  })
  .passthrough();

/** Input DTO khi tạo thiệp mời (khớp bảng `invitations` trong Prisma) */
export const CreateInvitationDto = z.object({
  wedding_id: uuidField("wedding_id"),
  template_id: uuidField("template_id"),
  content: InvitationContentSchema.default({}),
  cover_image: optionalUrl,
  is_published: z.boolean().default(false),
});

/** Input DTO khi cập nhật thiệp mời */
export const UpdateInvitationDto = z
  .object({
    template_id: uuidField("template_id"),
    content: InvitationContentSchema,
    cover_image: optionalUrl,
    is_published: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

/**
 * Validate dữ liệu theo Zod DTO.
 * @returns {{ success: true, data: any } | { success: false, errors: { field: string, message: string }[] }}
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

/** Output DTO: chuẩn hoá bản ghi `invitations` từ Prisma sang camelCase cho client */
export const toInvitationResponse = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    weddingId: row.wedding_id,
    templateId: row.template_id,
    content: row.content ?? {},
    coverImage: row.cover_image ?? null,
    isPublished: Boolean(row.is_published),
    ...(row.invitation_templates && {
      template: {
        id: row.invitation_templates.id,
        name: row.invitation_templates.name,
        previewUrl: row.invitation_templates.preview_url ?? null,
      },
    }),
    ...(row.weddings && {
      wedding: {
        id: row.weddings.id,
        title: row.weddings.title,
        slug: row.weddings.slug,
        weddingDate: row.weddings.wedding_date,
      },
    }),
  };
};
