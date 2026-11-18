import mongoose from "mongoose";
import {
  DEFAULT_TEMPLATE_ID,
  INVITATION_STATUS,
  INVITATION_STATUS_VALUES,
} from "../constants/invitation.js";
import { slugify } from "../utils/slugify.js";

const { Schema } = mongoose;

const personSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { _id: false }
);

const eventSchema = new Schema({
  name: { type: String, required: true, trim: true }, // VD: Lễ Vu Quy, Lễ Thành Hôn, Tiệc cưới
  startTime: { type: Date, required: true },
  venueName: { type: String, trim: true },
  address: { type: String, trim: true },
  mapUrl: { type: String, trim: true },
});

const invitationSchema = new Schema(
  {
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    groom: { type: personSchema, required: true },
    bride: { type: personSchema, required: true },
    weddingDate: { type: Date, required: true },
    events: { type: [eventSchema], default: [] },
    coverImageUrl: { type: String, trim: true },
    gallery: { type: [String], default: [] },
    templateId: { type: String, default: DEFAULT_TEMPLATE_ID },
    message: { type: String, trim: true, maxlength: 2000 },
    musicUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: INVITATION_STATUS_VALUES,
      default: INVITATION_STATUS.DRAFT,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-generate slug from groom & bride names if not provided
invitationSchema.pre("validate", function () {
  if (!this.slug && this.groom?.fullName && this.bride?.fullName) {
    const base = slugify(`${this.groom.fullName} ${this.bride.fullName}`);
    const suffix = Date.now().toString(36).slice(-5);
    this.slug = `${base}-${suffix}`;
  }
});

const Invitation =
  mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);

export default Invitation;
