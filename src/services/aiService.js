import aiConfig from "../config/aiConfig.js";
import AppError from "../utils/AppError.js";
import { WEDDING_PLANNER_SYSTEM_PROMPT } from "../prompts/weddingPlannerPrompt.js";

/**
 * Service kết nối và xử lý yêu cầu AI với OpenAI / Groq API.
 * Sử dụng native fetch tiêu chuẩn (Node.js 18+), không phụ thuộc thêm thư viện ngoài.
 */
class AIService {
  /**
   * Gọi OpenAI / Groq API (Chat Completions)
   * @private
   */
  async _callOpenAI({
    messages = [],
    systemPrompt = WEDDING_PLANNER_SYSTEM_PROMPT,
    model = aiConfig.openai.defaultModel,
    temperature = aiConfig.defaults.temperature,
    maxTokens = aiConfig.defaults.maxTokens,
  }) {
    const apiKey = aiConfig.openai.apiKey;
    if (!apiKey) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      return {
        reply: this._generateDemoReply(lastMsg),
        provider: "demo-mode",
        model: "demo-assistant",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    }

    const endpoint = `${aiConfig.openai.baseUrl}/chat/completions`;

    // Định dạng messages theo chuẩn OpenAI
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ];

    const requestBody = {
      model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      throw new AppError(`Lỗi kết nối tới AI API: ${err.message}`, 502);
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data.error?.message ||
        `Lỗi AI API (Status ${response.status}): ${JSON.stringify(data)}`;
      throw new AppError(errMsg, response.status >= 500 ? 502 : 400);
    }

    const replyText = data.choices?.[0]?.message?.content || "";
    const usage = {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    return {
      reply: replyText,
      provider: "openai",
      model,
      usage,
    };
  }

  /**
   * Phương thức chính để gọi AI sinh phản hồi hội thoại.
   *
   * @param {Object} options
   * @param {Array<{role: 'user'|'assistant', content: string}>} options.messages - Lịch sử hội thoại
   * @param {string} [options.systemPrompt] - System Prompt
   * @param {string} [options.model] - Tên model cụ thể (tùy chọn)
   * @param {number} [options.temperature] - Độ sáng tạo (0.0 - 1.0)
   * @param {number} [options.maxTokens] - Số token tối đa
   * @returns {Promise<{reply: string, provider: string, model: string, usage: Object}>}
   */
  async generateChatResponse({
    messages = [],
    systemPrompt = WEDDING_PLANNER_SYSTEM_PROMPT,
    model = aiConfig.openai.defaultModel,
    temperature = aiConfig.defaults.temperature,
    maxTokens = aiConfig.defaults.maxTokens,
  } = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new AppError("Danh sách tin nhắn (messages) không được để trống", 400);
    }

    return this._callOpenAI({
      messages,
      systemPrompt,
      model,
      temperature,
      maxTokens,
    });
  }

  /**
   * Phương thức hỗ trợ hỏi đáp nhanh (đơn câu hỏi)
   * @param {string} userPrompt - Câu hỏi của người dùng
   * @param {Object} [options] - Tuỳ chọn kèm theo (systemPrompt, ...)
   */
  async quickAsk(userPrompt, options = {}) {
    if (!userPrompt || !userPrompt.trim()) {
      throw new AppError("Nội dung câu hỏi không được để trống", 400);
    }

    return this.generateChatResponse({
      ...options,
      messages: [{ role: "user", content: userPrompt.trim() }],
    });
  }

  /**
   * Sinh câu trả lời Demo khi chưa có API key
   * @private
   */
  _generateDemoReply(lastUserMessage = "") {
    const text = (lastUserMessage || "").toLowerCase();
    let reply = "";

    if (
      text.includes("checklist") ||
      text.includes("kế hoạch") ||
      text.includes("6 tháng") ||
      text.includes("tiến độ")
    ) {
      reply = `### 📋 Lộ trình Checklist Chuẩn Bị Cưới 6 Tháng

Én Hỷ xin gửi hai bạn kế hoạch mẫu tối ưu nhất:

#### 1. Mốc 6 - 4 Tháng Trước Cưới:
- [ ] Chốt danh sách khách mời dự kiến (khoảng 200 - 300 khách)
- [ ] Chọn và đặt cọc địa điểm tiệc cưới (Sảnh tiệc, trung tâm hội nghị)
- [ ] Tìm kiếm & đặt lịch Studio chụp ảnh cưới (Pre-wedding album)
- [ ] Chọn phong cách tiệc cưới (Minimalist, Rustic, Truyền thống...)

#### 2. Mốc 3 - 2 Tháng Trước Cưới:
- [ ] Đi chọn và đặt nhẫn cưới
- [ ] Thử và chốt trang phục cưới (Váy cưới cô dâu, vest chú rể, áo dài gia tiên)
- [ ] Đặt thiệp cưới giấy & Tạo website thiệp cưới online trên **EverWeb**
- [ ] Lên danh sách đội bưng quả (phù dâu, phù rể)

#### 3. Mốc 1 Tháng & Tuần Cuối:
- [ ] Gửi thiệp cưới và theo dõi phản hồi RSVP
- [ ] Chốt thực đơn và số lượng bàn tiệc chính thức + bàn dự phòng
- [ ] Họp kịch bản ngày cưới với MC và ban điều phối
- [ ] Nghỉ ngơi, chăm sóc sức khỏe và tinh thần thoải mái.

💡 *Hai bạn có muốn Én Hỷ tư vấn sâu hơn về việc chọn thực đơn hay dự trù số bàn tiệc không?*`;
    } else if (
      text.includes("ngân sách") ||
      text.includes("tiền") ||
      text.includes("200") ||
      text.includes("chi phí")
    ) {
      reply = `### 💰 Bảng Phân Bổ Ngân Sách Cưới 200 Triệu Đồng Hợp Lý

| Hạng mục | Tỷ lệ (%) | Chi phí dự kiến | Gợi ý thực tế |
| :--- | :--- | :--- | :--- |
| **Tiệc cưới & Đồ uống** | 50% | 100 triệu VNĐ | ~20 - 25 bàn tiệc |
| **Hình ảnh & Phóng sự** | 12% | 24 triệu VNĐ | Gói chụp pre-wedding + ngày cưới |
| **Trang phục & Makeup** | 10% | 20 triệu VNĐ | Thuê 2 váy cưới, 1 vest, 2 áo dài |
| **Trang trí gia tiên & tiệc** | 10% | 20 triệu VNĐ | Backdrop hoa tươi nhẹ nhàng + bàn thờ gia tiên |
| **Nhẫn cưới & Sính lễ** | 8% | 16 triệu VNĐ | Cặp nhẫn vàng 18K + tráp quả cơ bản |
| **Thiệp cưới & Quà tặng** | 3% | 6 triệu VNĐ | Thiệp in + Website thiệp số EverWeb |
| **Quỹ dự phòng phát sinh** | 7% | 14 triệu VNĐ | Bắt buộc dự trù cho các chi phí phát sinh |

💡 *Bí quyết từ Én Hỷ: Hai bạn có thể tiết kiệm 10-15 triệu nếu tận dụng thiệp cưới online EverWeb và chọn hoa trang trí theo mùa đấy!*`;
    } else {
      reply = `Chào hai bạn! Én Hỷ đã nhận được câu hỏi: "${lastUserMessage}".

Để ngày trọng đại của hai bạn diễn ra trọn vẹn và hoàn hảo nhất, Én Hỷ luôn sẵn sàng đồng hành tư vấn:
1. **Lên kế hoạch & Timeline:** Chia nhỏ các đầu việc theo tuần/tháng.
2. **Cân đối tài chính:** Tối ưu ngân sách, kiểm soát chi tiêu không bị vượt hạn mức.
3. **Ý tưởng & Kịch bản:** Từ phong cách tiệc, thiệp cưới số EverWeb cho đến kịch bản MC xúc động.

Hai bạn hãy chia sẻ thêm cho Én Hỷ về ngày cưới dự kiến hoặc số lượng khách mời để mình tư vấn sát nhất nhé! 🕊️`;
    }

    return reply;
  }
}

export default new AIService();
