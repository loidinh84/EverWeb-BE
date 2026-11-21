import dotenv from "dotenv";
import path from "path";

// Đảm bảo load đúng file .env của EverWeb-BE dù chạy từ bất kỳ thư mục nào
const envPath = path.resolve(import.meta.dirname, "../../.env");
dotenv.config({ path: envPath });
dotenv.config();

/**
 * Cấu hình AI Provider (OpenAI / Groq)
 */
const aiConfig = {
  defaultProvider: "openai",

  // Cấu hình OpenAI / Groq API
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    defaultModel: process.env.OPENAI_MODEL || "openai/gpt-oss-120b",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  },

  // Cấu hình tham số sinh văn bản mặc định
  defaults: {
    temperature: 0.7,
    maxTokens: 1024, // Tối ưu để không vượt quá giới hạn 8,000 TPM của Groq on-demand tier
    topP: 0.95,
  },
};

export default aiConfig;
