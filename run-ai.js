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
  console.log(`[MODEL] Model dang chay: ${model}`);

  const prompt = "Phan bo ngan sach cuoi 200 trieu dong hop ly nhat.";
  console.log(`\n[REQUEST] Dang gui cau hoi: "${prompt}"...\n`);

  try {
    const result = await aiService.generateChatResponse({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: WEDDING_PLANNER_SYSTEM_PROMPT,
      model,
    });

    console.log("--------------------------------------------------");
    console.log("[RESPONSE] PHAN HOI TU TRO LY EN HY:");
    console.log("--------------------------------------------------");
    console.log(result.reply);
    console.log("\n--------------------------------------------------");
    console.log(
      `[STATS] Model = ${result.model} | Input tokens = ${result.usage.inputTokens} | Output tokens = ${result.usage.outputTokens}`
    );
    console.log("--------------------------------------------------");
  } catch (err) {
    console.error("[ERROR] Loi khi goi AI API:", err.message);
  }
}

runTest();
