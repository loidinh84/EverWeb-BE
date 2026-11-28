import crypto from "node:crypto";
import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { DEFAULT_FEATURE_DATA } from "../constants/featureDefaults.js";

export async function getPublicWeddingSite(slug) {
  const wedding = await prisma.weddings.findFirst({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      groom_name: true,
      bride_name: true,
      wedding_date: true,
      venue_name: true,
      venue_address: true,
      status: true,
    },
  });
  if (!wedding) {
    throw new AppError("Không tìm thấy trang đám cưới", 404);
  }

  const rows = await prisma.$queryRaw`
    SELECT website_config, collect_contacts, rsvp_config,
           travel_config, stationery_config, registry_config
    FROM wedding_feature_configs
    WHERE wedding_id = ${wedding.id}::uuid
    LIMIT 1
  `;
  const row = rows[0] || {};
  const features = {
    website_config: { ...DEFAULT_FEATURE_DATA.website_config, ...(row.website_config || {}) },
    collect_contacts: { ...DEFAULT_FEATURE_DATA.collect_contacts, ...(row.collect_contacts || {}) },
    rsvp_config: { ...DEFAULT_FEATURE_DATA.rsvp_config, ...(row.rsvp_config || {}) },
    travel_config: { ...DEFAULT_FEATURE_DATA.travel_config, ...(row.travel_config || {}) },
    stationery_config: { ...DEFAULT_FEATURE_DATA.stationery_config, ...(row.stationery_config || {}) },
    registry_config: { ...DEFAULT_FEATURE_DATA.registry_config, ...(row.registry_config || {}) },
  };

  return {
    wedding,
    features,
  };
}

export async function submitPublicRsvp(slug, payload = {}) {
  const wedding = await prisma.weddings.findFirst({
    where: { slug },
    select: { id: true, slug: true },
  });
  if (!wedding) {
    throw new AppError("Không tìm thấy hồ sơ đám cưới", 404);
  }

  const guestName = String(payload.guestName || payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const attending = payload.status !== "declined" && payload.attending !== false;
  const rsvpStatus = attending ? "attending" : "declined";
  const companions = Math.max(0, Number(payload.companions) || 0);
  const meal = String(payload.meal || "").trim();
  const allergy = String(payload.allergy || "").trim();
  const note = String(payload.note || payload.wishes || "").trim();

  if (!guestName) {
    throw new AppError("Vui lòng nhập họ tên khách mời", 400);
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
  if (!existingGuest) {
    existingGuest = await prisma.guests.findFirst({
      where: {
        wedding_id: wedding.id,
        full_name: { equals: guestName, mode: "insensitive" },
      },
    });
  }

  const dietaryNote = [meal, allergy].filter(Boolean).join(" · ") || null;
  const attendingCount = attending ? 1 + companions : 0;

  const guest = existingGuest
    ? await prisma.guests.update({
        where: { id: existingGuest.id },
        data: {
          full_name: guestName,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          rsvp_status: rsvpStatus,
          attending_count: attendingCount,
          ...(dietaryNote ? { dietary_note: dietaryNote } : {}),
          ...(note ? { wish_message: note } : {}),
          responded_at: new Date(),
        },
      })
    : await prisma.guests.create({
        data: {
          wedding_id: wedding.id,
          full_name: guestName,
          email: email || null,
          phone: phone || null,
          invite_token: crypto.randomBytes(16).toString("hex"),
          rsvp_status: rsvpStatus,
          attending_count: attendingCount,
          dietary_note: dietaryNote,
          wish_message: note || null,
          responded_at: new Date(),
        },
      });

  const answerItem = {
    id: `ans-${Date.now()}`,
    guest: guestName,
    status: attending ? "Vui vẻ nhận lời" : "Tiếc quá không dự được",
    attending,
    companions,
    meal: meal || "—",
    allergy: allergy || "Không",
    tableGroup: "Khách tự xác nhận",
    note,
    time: "Vừa xong",
  };

  const rows = await prisma.$queryRaw`
    SELECT rsvp_config
    FROM wedding_feature_configs
    WHERE wedding_id = ${wedding.id}::uuid
    LIMIT 1
  `;
  if (rows.length > 0) {
    const current = rows[0].rsvp_config || {};
    const prevAnswers = Array.isArray(current.answers) ? current.answers : [];
    const nextRsvp = {
      ...DEFAULT_FEATURE_DATA.rsvp_config,
      ...current,
      answers: [answerItem, ...prevAnswers],
    };
    await prisma.$executeRawUnsafe(
      `UPDATE wedding_feature_configs
       SET "rsvp_config" = $1::jsonb, updated_at = NOW()
       WHERE wedding_id = $2::uuid`,
      JSON.stringify(nextRsvp),
      wedding.id
    );
  }

  return { guest, answer: answerItem };
}

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

export async function getPublicInvitation({ weddingId, slug } = {}) {
  let wedding = null;
  if (weddingId) {
    wedding = await prisma.weddings.findUnique({
      where: { id: weddingId },
      select: {
        id: true,
        slug: true,
        title: true,
        groom_name: true,
        bride_name: true,
        wedding_date: true,
        venue_name: true,
        venue_address: true,
        status: true,
      },
    });
  }
  if (!wedding && slug) {
    wedding = await prisma.weddings.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        groom_name: true,
        bride_name: true,
        wedding_date: true,
        venue_name: true,
        venue_address: true,
        status: true,
      },
    });
  }
  if (!wedding) {
    wedding = await prisma.weddings.findFirst({
      orderBy: { id: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        groom_name: true,
        bride_name: true,
        wedding_date: true,
        venue_name: true,
        venue_address: true,
        status: true,
      },
    });
  }

  if (!wedding) {
    throw new AppError("Không tìm thấy hồ sơ đám cưới", 404);
  }

  const rows = await prisma.$queryRaw`
    SELECT stationery_config
    FROM wedding_feature_configs
    WHERE wedding_id = ${wedding.id}::uuid
    LIMIT 1
  `;
  const stationeryConfig =
    rows.length > 0 && rows[0].stationery_config
      ? { ...DEFAULT_FEATURE_DATA.stationery_config, ...rows[0].stationery_config }
      : DEFAULT_FEATURE_DATA.stationery_config;

  return {
    wedding,
    customCard: stationeryConfig?.customCard || null,
    stationeryConfig,
  };
}
