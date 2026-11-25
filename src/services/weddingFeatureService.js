import crypto from "node:crypto";
import nodemailer from "nodemailer";
import prisma from "../config/db.js";
import weddingRepository from "../repositories/weddingRepository.js";
import AppError from "../utils/AppError.js";

export const FEATURE_SECTIONS = [
  "website_config",
  "collect_contacts",
  "rsvp_config",
  "messaging_config",
  "travel_config",
  "stationery_config",
  "registry_config",
];

export const DEFAULT_FEATURE_DATA = {
  website_config: {
    themeId: "royal",
    fontPair: "Cormorant + Be Vietnam Pro",
    pages: [
      { id: "welcome", label: "Trang chủ (Chào mừng)", visible: true },
      { id: "story", label: "Chuyện tình yêu", visible: true },
      { id: "schedule", label: "Lịch trình ngày cưới", visible: true },
      { id: "stay", label: "Lưu trú & Khách sạn", visible: true },
      { id: "travel", label: "Hướng dẫn di chuyển", visible: true },
      { id: "party", label: "Phù dâu & Phù rể", visible: true },
      { id: "qa", label: "Hỏi đáp (Q&A)", visible: true },
      { id: "registry", label: "Quà mừng", visible: true },
      { id: "gallery", label: "Album ảnh cưới", visible: true },
      { id: "dresscode", label: "Trang phục (Dresscode)", visible: false },
    ],
    checklistDone: ["info", "theme"],
  },
  collect_contacts: {
    isActive: true,
    channel: "sms",
    subject: "Gửi thông tin nhận thiệp cưới",
    message:
      "Chào bạn, tụi mình đang chuẩn bị cho ngày vui sắp tới! Nhờ bạn điền nhanh địa chỉ & email để tụi mình gửi thiệp mời chính thức nhé.",
    buttonText: "Cập nhật thông tin",
    activities: [
      {
        id: "cc1",
        guest: "Nguyễn Thị Lan",
        channel: "SMS",
        status: "Đã điền địa chỉ",
        time: "Hôm nay, 10:15",
      },
      {
        id: "cc2",
        guest: "Lê Hoàng Nam",
        channel: "Email",
        status: "Đã gửi lời nhắc",
        time: "Hôm qua, 19:30",
      },
    ],
  },
  rsvp_config: {
    isRsvpOpen: true,
    requirePassword: false,
    rsvpPassword: "",
    questions: [
      {
        id: "q1",
        title: "Bạn có thể đến chung vui cùng chúng mình không?",
        type: "Lựa chọn (Có / Không)",
        required: true,
        active: true,
        followUps: [
          "Chọn thực đơn (Mặn / Chay / Kiêng dị ứng)",
          "Bạn có cần hỗ trợ đặt phòng khách sạn gần sảnh không?",
          "Lời chúc gửi đến cô dâu & chú rể",
        ],
      },
      {
        id: "q2",
        title: "Số lượng người đi cùng bạn (bao gồm trẻ em)?",
        type: "Số lượng",
        required: true,
        active: true,
        followUps: [],
      },
      {
        id: "q3",
        title: "Bạn có tham dự tiệc tối thân mật trước ngày cưới không?",
        type: "Lựa chọn",
        required: false,
        active: false,
        followUps: [],
      },
    ],
    answers: [
      {
        id: "a1",
        guest: "Nguyễn Thị Lan",
        status: "Vui vẻ nhận lời",
        meal: "Mặn",
        companions: 1,
        note: "Chúc hai bạn trăm năm hạnh phúc!",
      },
      {
        id: "a2",
        guest: "Trần Văn Minh",
        status: "Vui vẻ nhận lời",
        meal: "Ăn chay",
        companions: 2,
        note: "Sẽ có mặt đúng giờ",
      },
      {
        id: "a3",
        guest: "Nguyễn Văn Hùng",
        status: "Tiếc quá không dự được",
        meal: "—",
        companions: 0,
        note: "Chúc mừng hai em nhé!",
      },
    ],
  },
  messaging_config: {
    sentMessages: [
      {
        id: "m1",
        title: "Nhắc lịch tham dự lễ cưới",
        channel: "SMS + Email",
        recipients: 86,
        date: "Hôm nay, 09:30",
        body: "Chỉ còn ít ngày nữa là tới ngày vui của tụi mình. Hẹn gặp bạn tại sảnh tiệc nhé!",
      },
      {
        id: "m2",
        title: "Cập nhật địa chỉ nhận thiệp giấy",
        channel: "Email",
        recipients: 120,
        date: "2 ngày trước",
        body: "Nhờ mọi người kiểm tra lại địa chỉ để tụi mình gửi thiệp mời tận tay.",
      },
    ],
  },
  travel_config: {
    guestNote:
      "Tụi mình đã giữ giá ưu đãi cho khách tham dự lễ cưới tại các khách sạn gần sảnh tiệc. Nhớ đọc mã EVERWEB khi đặt phòng nhé!",
    hotels: [
      {
        id: "h1",
        name: "Lotte Hotel Saigon",
        distance: "Cách sảnh 0.8 km",
        rating: "9.4",
        price: "2.800.000 đ / đêm",
        code: "EVERWEB20",
      },
      {
        id: "h2",
        name: "Fusion Original Saigon",
        distance: "Cách sảnh 1.4 km",
        rating: "9.1",
        price: "2.250.000 đ / đêm",
        code: "KHANGAN",
      },
    ],
  },
  stationery_config: {
    favorites: ["c1", "c3"],
    selectedCardId: "c1",
    activeColors: {},
  },
  registry_config: {
    gifts: [
      {
        id: "rg1",
        title: "Quỹ Tuần Trăng Mật Đà Lạt",
        category: "Quỹ tiền mặt",
        target: "20.000.000 đ",
        received: "12.500.000 đ",
        status: "active",
      },
      {
        id: "rg2",
        title: "Máy pha cà phê Espresso",
        category: "Đồ gia dụng",
        target: "8.500.000 đ",
        received: "8.500.000 đ",
        status: "fulfilled",
      },
      {
        id: "rg3",
        title: "Bộ ấm trà gốm sứ Minh Long",
        category: "Bàn ăn",
        target: "2.200.000 đ",
        received: "0 đ",
        status: "active",
      },
    ],
  },
};

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
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      throw new AppError(
        "Chưa cấu hình SMTP_USER / SMTP_PASS trong .env của Backend",
        500
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let targetEmails = [];

    if (Array.isArray(payload.recipients)) {
      targetEmails = payload.recipients
        .map((e) => String(e).trim())
        .filter((e) => emailRegex.test(e));
    } else if (typeof payload.recipients === "string" && payload.recipients.trim()) {
      targetEmails = payload.recipients
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter((e) => emailRegex.test(e));
    }

    if (targetEmails.length === 0) {
      const features = await this.getFeatures(weddingId, user);
      const guestList = Array.isArray(features?.collect_contacts?.guestList)
        ? features.collect_contacts.guestList
        : [];
      const fromFeature = guestList
        .map((g) => String(g.email || "").trim())
        .filter((e) => emailRegex.test(e));

      const dbGuests = await prisma.guests.findMany({
        where: { wedding_id: weddingId },
        select: { email: true },
      });
      const fromDb = dbGuests
        .map((g) => String(g.email || "").trim())
        .filter((e) => emailRegex.test(e));

      targetEmails = Array.from(new Set([...fromFeature, ...fromDb]));
    }

    if (targetEmails.length === 0) {
      throw new AppError(
        "Không tìm thấy địa chỉ email hợp lệ nào để gửi",
        400
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const senderTitle =
      String(payload.senderName || wedding.title || "EverWed").trim();
    const subject =
      String(payload.subject || `Thư mời từ ${senderTitle}`).trim();
    const bodyText = String(payload.body || "").trim();
    const buttonText = String(payload.buttonText || "").trim();
    const ctaUrl = String(payload.ctaUrl || "").trim();

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #FAF8F5; border: 1px solid #EAE3D8; border-radius: 16px; padding: 32px; color: #1F1A17;">
        <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8C7A68; margin: 0 0 8px;">EverWed · Thiệp & Thông báo</p>
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #1F1A17;">${senderTitle}</h2>
        <p style="font-size: 14px; line-height: 1.7; white-space: pre-line; color: #3B2A1A;">${bodyText}</p>
        ${
          buttonText && ctaUrl
            ? `<div style="margin-top: 24px; text-align: center;">
                <a href="${ctaUrl}" style="display: inline-block; background: #3B52DE; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-size: 13px; font-weight: 600;">${buttonText}</a>
              </div>`
            : ""
        }
        <hr style="border: none; border-top: 1px solid #EAE3D8; margin: 28px 0 14px;" />
        <p style="font-size: 11px; color: #8C7A68; margin: 0;">Gửi từ hệ thống quản lý lễ cưới EverWeb.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${senderTitle}" <${smtpUser}>`,
      to: targetEmails.join(", "),
      subject,
      text: ctaUrl ? `${bodyText}\n\n${buttonText || "Mở liên kết"}: ${ctaUrl}` : bodyText,
      html,
    });

    return {
      sentCount: targetEmails.length,
      recipients: targetEmails,
    };
  },

  async getPublicContactForm(slug) {
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

    const coupleNames = [wedding.groom_name, wedding.bride_name]
      .filter(Boolean)
      .join(" & ") || "EverWed";

    return {
      weddingId: wedding.id,
      slug: wedding.slug,
      coupleNames,
      collectContacts: saved,
    };
  },

  async submitPublicContactForm(slug, payload = {}) {
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

    let guest;
    if (existingGuest) {
      guest = await prisma.guests.update({
        where: { id: existingGuest.id },
        data: {
          full_name: name,
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
          ...(wishes ? { wish_message: wishes } : {}),
        },
      });
    } else {
      guest = await prisma.guests.create({
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
    }

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
  },
};

export default weddingFeatureService;
