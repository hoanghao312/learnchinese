import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const start = Date.now();
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "Hãy giải nghĩa chi tiết từ tiếng Trung sau: 'từlạhoắc123'",
    });
    console.log("Success in", Date.now() - start, "ms", res.text);
  } catch (e) {
    console.log("Error in", Date.now() - start, "ms", e.message);
  }
}
test();
