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
    channel: "email",
    subject: "Gửi thông tin nhận thiệp cưới",
    message:
      "Chào bạn, tụi mình đang chuẩn bị cho ngày vui sắp tới! Nhờ bạn điền nhanh địa chỉ & email để tụi mình gửi thiệp mời chính thức nhé.",
    buttonText: "Cập nhật thông tin",
    activities: [],
    submissions: [],
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
    ],
    answers: [],
  },
  messaging_config: {
    sentMessages: [],
    scheduledMessages: [],
    drafts: [],
  },
  travel_config: {
    guestNote:
      "Tụi mình đã chuẩn bị thông tin lưu trú và hướng dẫn di chuyển để bạn thuận tiện sắp xếp lịch trình tham dự lễ cưới.",
    hotels: [],
  },
  stationery_config: {
    favorites: [],
    selectedCardId: "",
    activeColors: {},
  },
  registry_config: {
    gifts: [],
  },
};
