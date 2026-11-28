import prisma from "../config/db.js";
import weddingRepository from "../repositories/weddingRepository.js";
import AppError from "../utils/AppError.js";
import {
  DEFAULT_FEATURE_DATA,
  FEATURE_SECTIONS,
} from "../constants/featureDefaults.js";
import { sendWeddingEmail as sendWeddingEmailInternal } from "./emailService.js";
import {
  getPublicContactForm,
  getPublicInvitation,
  submitPublicContactForm,
} from "./publicWeddingService.js";

export { FEATURE_SECTIONS, DEFAULT_FEATURE_DATA };

async function assertWeddingAccess(weddingId, user) {
  const wedding = await weddingRepository.findById(weddingId);
  if (!wedding) {
    throw new AppError("Không tìm thấy hồ sơ đám cưới", 404);
  }
  if (user?.role === "admin" || wedding.owner_id === user?.id) {
    return wedding;
  }
  const member = await prisma.wedding_members.findUnique({
    where: {
      wedding_id_user_id: {
        wedding_id: weddingId,
        user_id: user?.id,
      },
    },
  });
  if (!member) {
    throw new AppError("Bạn không có quyền truy cập hồ sơ đám cưới này", 403);
  }
  return wedding;
}

function mergeWithDefaults(row = {}) {
  const merged = {};
  for (const key of FEATURE_SECTIONS) {
    const val = row[key];
    merged[key] =
      val && typeof val === "object" && Object.keys(val).length > 0
        ? { ...DEFAULT_FEATURE_DATA[key], ...val }
        : DEFAULT_FEATURE_DATA[key];
  }
  return merged;
}

const weddingFeatureService = {
  async getFeatures(weddingId, user) {
    await assertWeddingAccess(weddingId, user);

    const rows = await prisma.$queryRaw`
      SELECT wedding_id, website_config, collect_contacts, rsvp_config,
             messaging_config, travel_config, stationery_config, registry_config
      FROM wedding_feature_configs
      WHERE wedding_id = ${weddingId}::uuid
      LIMIT 1
    `;

    if (rows.length > 0) {
      return mergeWithDefaults(rows[0]);
    }

    await prisma.$executeRaw`
      INSERT INTO wedding_feature_configs (
        wedding_id, website_config, collect_contacts, rsvp_config,
        messaging_config, travel_config, stationery_config, registry_config
      ) VALUES (
        ${weddingId}::uuid,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.website_config)}::jsonb,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.collect_contacts)}::jsonb,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.rsvp_config)}::jsonb,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.messaging_config)}::jsonb,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.travel_config)}::jsonb,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.stationery_config)}::jsonb,
        ${JSON.stringify(DEFAULT_FEATURE_DATA.registry_config)}::jsonb
      )
      ON CONFLICT (wedding_id) DO NOTHING
    `;

    return DEFAULT_FEATURE_DATA;
  },

  async updateFeatureSection(weddingId, section, payload, user) {
    if (!FEATURE_SECTIONS.includes(section)) {
      throw new AppError("Mục cấu hình không hợp lệ", 400);
    }

    await assertWeddingAccess(weddingId, user);
    const current = await this.getFeatures(weddingId, user);
    const nextSectionData = {
      ...current[section],
      ...(payload && typeof payload === "object" ? payload : {}),
    };
    const jsonStr = JSON.stringify(nextSectionData);

    await prisma.$executeRawUnsafe(
      `UPDATE wedding_feature_configs
       SET "${section}" = $1::jsonb, updated_at = NOW()
       WHERE wedding_id = $2::uuid`,
      jsonStr,
      weddingId
    );

    return {
      ...current,
      [section]: nextSectionData,
    };
  },

  async sendWeddingEmail(weddingId, payload = {}, user) {
    const wedding = await assertWeddingAccess(weddingId, user);
    const features = await this.getFeatures(weddingId, user);
    return sendWeddingEmailInternal({ wedding, features, payload });
  },

  getPublicContactForm,
  getPublicInvitation,
  submitPublicContactForm,
};

export default weddingFeatureService;
