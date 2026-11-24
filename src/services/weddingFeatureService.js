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
};

export default weddingFeatureService;
