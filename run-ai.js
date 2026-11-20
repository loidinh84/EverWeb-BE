import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(import.meta.dirname, "./.env");
dotenv.config({ path: envPath });
dotenv.config();

import aiService from "./src/services/aiService.js";
import { WEDDING_PLANNER_SYSTEM_PROMPT } from "./src/prompts/weddingPlannerPrompt.js";

async function runTest() {
  console.log("==================================================");
  console.log("   KIỂM TRA MODULE AI TRỢ LÝ CƯỚI EVERWEB       ");
  console.log("==================================================");

  const model = process.env.OPENAI_MODEL || "openai/gpt-oss-120b";
  console.log(`📌 Model đang chạy: ${model}`);

  const prompt = "Phân bổ ngân sách cưới 200 triệu đồng hợp lý nhất.";
  console.log(`\n💬 Đang gửi câu hỏi test: "${prompt}"...\n`);

  try {
    const result = await aiService.generateChatResponse({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: WEDDING_PLANNER_SYSTEM_PROMPT,
      model,
    });

    console.log("--------------------------------------------------");
    console.log("✅ PHẢN HỒI TỪ TRỢ LÝ ÉN HỶ:");
    console.log("--------------------------------------------------");
    console.log(result.reply);
    console.log("\n--------------------------------------------------");
    console.log(
      `📊 Thống kê: Model = ${result.model} | Input tokens = ${result.usage.inputTokens} | Output tokens = ${result.usage.outputTokens}`
    );
    console.log("--------------------------------------------------");
  } catch (err) {
    console.error("❌ Lỗi khi gọi AI API:", err.message);
  }
}

runTest();
