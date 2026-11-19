// Quick sanity check for Prisma-aligned Invitation DTOs (no DB needed)
// Run: node scripts/check-invitation-dto.js
import assert from "node:assert/strict";
import {
  CreateInvitationDto,
  UpdateInvitationDto,
  toInvitationResponse,
  validateDto,
} from "../src/dtos/invitation.dto.js";

const validPayload = {
  wedding_id: "11111111-1111-4111-8111-111111111111",
  template_id: "22222222-2222-4222-8222-222222222222",
  content: {
    groom: { fullName: "Nguyễn Văn Nam" },
    bride: { fullName: "Trần Thị Lan" },
    message: "Trân trọng kính mời!",
  },
  cover_image: "https://example.com/cover.jpg",
  is_published: true,
};

const valid = validateDto(CreateInvitationDto, validPayload);
assert.equal(valid.success, true);

const invalid = validateDto(CreateInvitationDto, {
  wedding_id: "not-a-uuid",
  template_id: "123",
  cover_image: "bad-url",
});
assert.equal(invalid.success, false);
assert.ok(invalid.errors.length >= 3);

const emptyUpdate = validateDto(UpdateInvitationDto, {});
assert.equal(emptyUpdate.success, false);

const formatted = toInvitationResponse({
  id: "33333333-3333-4333-8333-333333333333",
  ...valid.data,
});
assert.equal(formatted.weddingId, validPayload.wedding_id);
assert.equal(formatted.isPublished, true);

console.log("Prisma Invitation DTO check passed!");
