// Quick sanity check for Invitation DTO + Model (no DB connection needed)
// Run: node scripts/check-invitation-dto.js
import Invitation from "../src/models/invitation.model.js";
import {
  CreateInvitationDto,
  UpdateInvitationDto,
  toInvitationResponse,
  validateDto,
} from "../src/dtos/invitation.dto.js";

const valid = validateDto(CreateInvitationDto, {
  groom: { fullName: "Nguyễn Văn Nam" },
  bride: { fullName: "Trần Thị Lan" },
  weddingDate: "2026-12-20",
  events: [{ name: "Lễ Thành Hôn", startTime: "2026-12-20T10:00:00+07:00" }],
});
console.log("valid create ->", valid.success);

const invalid = validateDto(CreateInvitationDto, {
  groom: { fullName: "" },
  weddingDate: "not-a-date",
  coverImageUrl: "abc",
});
console.log("invalid create ->", invalid.success, invalid.errors);

console.log("empty update ->", validateDto(UpdateInvitationDto, {}).success);

const doc = new Invitation(valid.data);
await doc.validate();
console.log("model response ->", toInvitationResponse(doc));
