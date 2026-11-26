import crypto from "node:crypto";
import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { DEFAULT_FEATURE_DATA } from "../constants/featureDefaults.js";

export async function getPublicContactForm(slug) {
  const wedding = await prisma.weddings.findFirst({
    where: { slug },
    select: {
      id: true,
      slug: true,
      groom_name: true,
      bride_name: true,
    },
  });
  if (!wedding) {
    throw new AppError("Không tìm thấy hồ sơ đám cưới", 404);
  }

  const rows = await prisma.$queryRaw`
    SELECT collect_contacts
    FROM wedding_feature_configs
    WHERE wedding_id = ${wedding.id}::uuid
    LIMIT 1
  `;
  const saved =
    rows.length > 0 && rows[0].collect_contacts
      ? { ...DEFAULT_FEATURE_DATA.collect_contacts, ...rows[0].collect_contacts }
      : DEFAULT_FEATURE_DATA.collect_contacts;

  const coupleNames =
    [wedding.groom_name, wedding.bride_name].filter(Boolean).join(" & ") ||
    "EverWed";

  return {
    weddingId: wedding.id,
    slug: wedding.slug,
    coupleNames,
    collectContacts: saved,
  };
}

export async function submitPublicContactForm(slug, payload = {}) {
  const wedding = await prisma.weddings.findFirst({
    where: { slug },
    select: { id: true, slug: true },
  });
  if (!wedding) {
    throw new AppError("Không tìm thấy hồ sơ đám cưới", 404);
  }

  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const email = String(payload.email || "").trim();
  const address = String(payload.address || "").trim();
  const wishes = String(payload.wishes || "").trim();

  if (!name) {
    throw new AppError("Vui lòng nhập họ tên của bạn", 400);
  }

  let existingGuest = null;
  if (email) {
    existingGuest = await prisma.guests.findFirst({
      where: { wedding_id: wedding.id, email },
    });
  }
  if (!existingGuest && phone) {
    existingGuest = await prisma.guests.findFirst({
      where: { wedding_id: wedding.id, phone },
    });
  }

  const guest = existingGuest
    ? await prisma.guests.update({
        where: { id: existingGuest.id },
        data: {
          full_name: name,
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
          ...(wishes ? { wish_message: wishes } : {}),
        },
      })
    : await prisma.guests.create({
        data: {
          wedding_id: wedding.id,
          full_name: name,
          phone: phone || null,
          email: email || null,
          wish_message: wishes || null,
          invite_token: crypto.randomBytes(16).toString("hex"),
          rsvp_status: "pending",
        },
      });

  const submission = {
    id: `sub-${Date.now()}`,
    name,
    phone,
    email,
    address,
    group: "Khách tự điền",
    wishes,
    time: "Vừa xong",
    status: "Đã đồng bộ",
  };

  const rows = await prisma.$queryRaw`
    SELECT collect_contacts
    FROM wedding_feature_configs
    WHERE wedding_id = ${wedding.id}::uuid
    LIMIT 1
  `;
  if (rows.length > 0) {
    const current = rows[0].collect_contacts || {};
    const prevSubmissions = Array.isArray(current.submissions)
      ? current.submissions
      : [];
    const nextSection = {
      ...DEFAULT_FEATURE_DATA.collect_contacts,
      ...current,
      submissions: [submission, ...prevSubmissions],
    };
    await prisma.$executeRawUnsafe(
      `UPDATE wedding_feature_configs
       SET "collect_contacts" = $1::jsonb, updated_at = NOW()
       WHERE wedding_id = $2::uuid`,
      JSON.stringify(nextSection),
      wedding.id
    );
  }

  return { guest, submission };
}
