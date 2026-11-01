import express from "express";
import path from "path";
import vm from "node:vm";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { EdgeTTS } from "node-edge-tts";
import { synthesizeEdgeNeuralV2 } from "./server/edgeTtsV2";
import fs from "fs";
import os from "os";
import { PRESEGMENTED_LESSONS_CACHE, offlineSegmentText } from "./server/fallbackData";
import { getHskLevel } from "./server/hskLookup";
import { decomposeWordInstantly } from "./src/data/hanziDecompositions";

dotenv.config();

function injectHskLevels(tokens: any[]) {
  return tokens.map(token => {
    if (token.type === 'word' && !token.hskLevel) {
      const level = getHskLevel(token.text);
      if (level) {
        return { ...token, hskLevel: level };
      }
    }
    return token;
  });
}

function parseGeminiJson(text: string) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/```$/, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.log("Failed to parse Gemini JSON:", text);
    throw e;
  }
}


// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY_FOR_FALLBACK",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Candidate Flash models with prioritized fallback - prioritizing healthy gemini-2.5-flash
const CANDIDATE_FLASH_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];
let activePrimaryModel = "gemini-2.5-flash";
const PRIMARY_FLASH_MODEL = CANDIDATE_FLASH_MODELS[0];
const BACKUP_FLASH_MODEL = CANDIDATE_FLASH_MODELS[1];

async function generateContentWithRetry(params: any, timeoutMs = 25000, maxPasses = 2) {
  let lastError: any = null;
  const initialModel = params.model || activePrimaryModel;
  const modelList = [initialModel, ...CANDIDATE_FLASH_MODELS.filter(m => m !== initialModel)];

  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = 0; i < modelList.length; i++) {
      const model = modelList[i];
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise<any>((_, reject) => 
          timeoutId = setTimeout(() => reject(new Error("Gemini API Timeout")), timeoutMs)
        );
        const currentParams = { ...params, model };
        const result = await Promise.race([
          ai.models.generateContent(currentParams),
          timeoutPromise
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        // Successful response - remember this healthy model for future calls
        activePrimaryModel = model;
        return result;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        const errorMsg = String(error?.message || error?.status || error);
        const isOverloaded = error?.status === 503 || errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("spikes in demand");
        const isRateLimited = error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
        const isTimeout = errorMsg.includes("Timeout");

        console.log(`[Gemini candidate switch] Model ${model} unavailable (status: ${error?.status || 'network'}). Switching to next candidate...`);

        // Apply backoff on 503 high demand or 429 rate limit to give Google API gateway time to clear
        if (isOverloaded || isRateLimited) {
          const waitTime = Math.min(2200, 400 * Math.pow(1.5, i) + Math.floor(Math.random() * 250));
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (!isTimeout) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    // If all models failed in the current pass, wait briefly before next pass
    if (pass < maxPasses - 1) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.floor(Math.random() * 400)));
    }
  }
  throw lastError || new Error("All Gemini models failed or timed out");
}

async function generateContentStreamWithRetry(params: any, timeoutMs = 25000, maxPasses = 2) {
  let lastError: any = null;
  const initialModel = params.model || activePrimaryModel;
  const modelList = [initialModel, ...CANDIDATE_FLASH_MODELS.filter(m => m !== initialModel)];

  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = 0; i < modelList.length; i++) {
      const model = modelList[i];
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise<any>((_, reject) => 
          timeoutId = setTimeout(() => reject(new Error("Gemini API Timeout")), timeoutMs)
        );
        const currentParams = { ...params, model };
        const result = await Promise.race([
          ai.models.generateContentStream(currentParams),
          timeoutPromise
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        activePrimaryModel = model;
        return result;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        const errorMsg = String(error?.message || error?.status || error);
        const isOverloaded = error?.status === 503 || errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("spikes in demand");
        const isRateLimited = error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
        const isTimeout = errorMsg.includes("Timeout");

        console.log(`[Gemini stream switch] Model ${model} unavailable. Switching candidate...`);

        if (isOverloaded || isRateLimited) {
          const waitTime = Math.min(2200, 400 * Math.pow(1.5, i) + Math.floor(Math.random() * 250));
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (!isTimeout) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    if (pass < maxPasses - 1) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.floor(Math.random() * 400)));
    }
  }
  throw lastError || new Error("All Gemini models failed or timed out");
}

async function sendMessageStreamWithRetry(chatParams: any, message: any, timeoutMs = 25000, maxPasses = 2) {
  let lastError: any = null;
  const initialModel = chatParams.model || activePrimaryModel;
  const modelList = [initialModel, ...CANDIDATE_FLASH_MODELS.filter(m => m !== initialModel)];

  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = 0; i < modelList.length; i++) {
      const model = modelList[i];
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise<any>((_, reject) => 
          timeoutId = setTimeout(() => reject(new Error("Gemini Chat Timeout")), timeoutMs)
        );
        const currentParams = { ...chatParams, model };
        const chat = ai.chats.create(currentParams);
        const streamPromise = chat.sendMessageStream(message);
        const result = await Promise.race([streamPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        activePrimaryModel = model;
        return result;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        const errorMsg = String(error?.message || error?.status || error);
        const isOverloaded = error?.status === 503 || errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("spikes in demand");
        const isRateLimited = error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
        const isTimeout = errorMsg.includes("Timeout");

        console.log(`[Gemini chat switch] Model ${model} unavailable. Switching candidate...`);

        if (isOverloaded || isRateLimited) {
          const waitTime = Math.min(2200, 400 * Math.pow(1.5, i) + Math.floor(Math.random() * 250));
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (!isTimeout) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    if (pass < maxPasses - 1) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.floor(Math.random() * 400)));
    }
  }
  throw lastError || new Error("All Gemini chat models failed or timed out");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to normalize text for reliable comparison
function normalizeTextForMatch(input: string): string {
  return input.replace(/\s+/g, "").trim();
}

// Map normalized lesson texts to their lesson ids
const NORMALIZED_LESSON_MAP: Record<string, string> = {
  [normalizeTextForMatch("你好！我叫李华。我是中国留学生，今年二十岁。很高兴认识你！你叫什么名字？也是学生吗？")]: "lesson-1",
  [normalizeTextForMatch("阿姨，请问 cái này 新鲜的苹果一斤多少钱？八块钱。太贵了，可以便宜一点儿吗？那给你七块钱一斤。好的，我买三斤，可以用微信支付吗？当然可以。")]: "lesson-2",
  [normalizeTextForMatch("阿姨，请问这个新鲜的苹果一斤多少钱？八块钱。太贵了，可以便宜一点儿吗？那给你七块钱一斤。好的，我买三斤，可以用微信支付吗？当然可以。")]: "lesson-2",
  [normalizeTextForMatch("周末你有什么打算？我特别喜欢运动，打算和朋友去体育馆打篮球。如果下雨的话，我就在家里听中文歌、看电影。你呢？我喜欢静静地写汉字和看书。")]: "lesson-3",
  [normalizeTextForMatch("最近公司的工作非常多，大家每天都要加班，感觉有些累。虽然辛苦，但是通过这个大项目，我学到了很多宝贵的经验。下个月结项后，我一定要向经理请假，去海边好好旅游一次。")]: "lesson-4",
  [normalizeTextForMatch("服务员，我们要一个鸳鸯火锅。请问你们能吃辣吗？我们可以吃微辣。好的，那再点一份肥牛、一份豆腐和新鲜的蔬菜。请问要喝点什么？给我们两瓶冰镇可乐，谢谢。")]: "lesson-5"
};


// API proxy for YouGlish Chinese video queries and subtitles
app.get("/api/youglish", async (req, res): Promise<any> => {
  try {
    const query = (req.query.query as string || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Yêu cầu cung cấp từ khóa tra cứu (query)." });
    }

    const youglishUrl = `https://youglish.com/pronounce/${encodeURIComponent(query)}/chinese/all`;
    const response = await fetch(youglishUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Không thể lấy dữ liệu từ YouGlish" });
    }

    const html = await response.text();
    const match = html.match(/params\.jsonData\s*=\s*'([\s\S]*?)'\s*;/);
    if (!match || !match[1]) {
      return res.json({ totalResults: 0, results: [] });
    }

    let parsed: any = null;
    try {
      // Evaluate JavaScript string literal natively to unescape quotes and special characters without corruption
      const jsonStr = vm.runInNewContext("'" + match[1] + "'");
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      try {
        const cleaned = match[1]
          .replace(/\\'/g, "'")
          .split('\\"').join('"');
        parsed = JSON.parse(cleaned);
      } catch (fbErr) {
        console.warn("[YouGlish Parse Warning]:", parseErr);
        return res.json({ totalResults: 0, results: [] });
      }
    }

    if (!parsed || !Array.isArray(parsed.results)) {
      return res.json({ totalResults: 0, results: [] });
    }

    return res.json({
      totalResults: parseInt(parsed.total_results || "0", 10),
      total: parseInt(parsed.total || "0", 10),
      results: (parsed.results || []).map((r: any) => ({
        display: r.display || "",
        seg: r.seg || "",
        pinyin: r.pinyin || "",
        vid: r.vid || "",
        start: parseInt(r.start || "0", 10),
        end: parseInt(r.end || "0", 10),
        speaker: r.speaker || "",
        id: r.id || ""
      }))
    });
  } catch (err: any) {
    console.error("[YouGlish Proxy Error]", err);
    return res.status(500).json({ error: err.message || "Lỗi máy chủ khi tra YouGlish" });
  }
});

// API endpoint to search images from Google Images / web for vocabulary visual learning
app.get("/api/images", async (req, res): Promise<any> => {
  try {
    const query = (req.query.query as string || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Yêu cầu cung cấp từ khóa tra cứu (query)." });
    }

    const requestedSource = ((req.query.source as string) || "all").toLowerCase();
    const meaning = ((req.query.meaning as string) || "").trim();
    const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

    // Helper 1: Fetch Baidu Images
    const fetchBaidu = async (): Promise<any[]> => {
      try {
        const baiduUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&logid=123&ipn=rj&ct=201326592&is=&fp=result&queryWord=${encodeURIComponent(query)}&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=&ic=0&hd=&latest=&copyright=&word=${encodeURIComponent(query)}&s=&se=&tab=&width=&height=&face=0&istype=2&qc=&nc=1&fr=&expermode=&nojc=&pn=0&rn=30`;
        const baiduRes = await fetch(baiduUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://image.baidu.com/"
          }
        });

        if (!baiduRes.ok) return [];
        const rawText = await baiduRes.text();
        let bData: any = null;

        try {
          bData = JSON.parse(rawText);
        } catch (_) {
          try {
            // Clean bad escapes in JSON: replace \' and invalid escape backslashes
            let sanitized = rawText.replace(/\\'/g, "'");
            sanitized = sanitized.replace(/\\(?![/\\bfnrt"']|u[0-9a-fA-F]{4})/g, "\\\\");
            bData = JSON.parse(sanitized);
          } catch (__) {
            bData = null;
          }
        }

        if (bData && Array.isArray(bData.data) && bData.data.length > 0) {
          const rawItems = bData.data.filter((x: any) => x && (x.thumbURL || x.middleURL || x.hoverURL));
          if (rawItems.length > 0) {
            return rawItems.map((item: any, idx: number) => ({
              id: `baidu-${idx}-${item.di || idx}`,
              thumbnail: item.middleURL || item.thumbURL || item.hoverURL,
              image: item.middleURL || item.thumbURL || item.hoverURL,
              title: item.fromPageTitleEnc ? item.fromPageTitleEnc.replace(/<[^>]+>/g, "") : query,
              source: "Baidu Images",
              sourceType: "baidu",
              url: item.fromURL || `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(query)}`,
              width: item.width || 0,
              height: item.height || 0
            }));
          }
        }

        // Resilient regex extraction fallback when JSON has non-standard encoding
        const items: any[] = [];
        const thumbMatches = [...rawText.matchAll(/"thumbURL"\s*:\s*"([^"]+)"/g)];
        const middleMatches = [...rawText.matchAll(/"middleURL"\s*:\s*"([^"]+)"/g)];
        const hoverMatches = [...rawText.matchAll(/"hoverURL"\s*:\s*"([^"]+)"/g)];
        const titleMatches = [...rawText.matchAll(/"fromPageTitleEnc"\s*:\s*"([^"]+)"/g)];
        const count = Math.max(thumbMatches.length, middleMatches.length, hoverMatches.length);

        for (let i = 0; i < count; i++) {
          const thumb = thumbMatches[i]?.[1] || middleMatches[i]?.[1] || hoverMatches[i]?.[1];
          const middle = middleMatches[i]?.[1] || hoverMatches[i]?.[1] || thumb;
          const title = titleMatches[i]?.[1] ? titleMatches[i][1].replace(/<[^>]+>/g, "") : query;
          if (thumb || middle) {
            items.push({
              id: `baidu-rgx-${i}`,
              thumbnail: middle || thumb,
              image: middle || thumb,
              title: title,
              source: "Baidu Images",
              sourceType: "baidu",
              url: `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(query)}`,
              width: 0,
              height: 0
            });
          }
        }
        return items;
      } catch {
        return [];
      }
    };

    // Helper 2: Fetch Google / Web Images (Openverse + Wikimedia Commons)
    const fetchGoogle = async (): Promise<any[]> => {
      const googleItems: any[] = [];
      const seenUrls = new Set<string>();

      // Search terms: Chinese word + Vietnamese meaning (e.g. "高兴", "vui vẻ")
      const searchTerms: string[] = [query];
      if (meaning && meaning.toLowerCase() !== query.toLowerCase()) {
        searchTerms.push(meaning);
        if (meaning.includes(",") || meaning.includes(";")) {
          const firstMeaning = meaning.split(/[,;]/)[0].trim();
          if (firstMeaning && !searchTerms.includes(firstMeaning)) {
            searchTerms.push(firstMeaning);
          }
        }
      }

      // 1. Fetch from Openverse (High quality global photography)
      for (const term of searchTerms) {
        if (googleItems.length >= 30) break;
        try {
          const ovUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}&page_size=20`;
          const ovRes = await fetch(ovUrl, {
            headers: { "User-Agent": "ChineseLearningApp/1.0" }
          });
          if (ovRes.ok) {
            const ovData = await ovRes.json();
            if (ovData && Array.isArray(ovData.results)) {
              for (const item of ovData.results) {
                const imgUrl = item.thumbnail || item.url;
                if (imgUrl && !seenUrls.has(imgUrl)) {
                  seenUrls.add(imgUrl);
                  googleItems.push({
                    id: `google-ov-${item.id || googleItems.length}`,
                    thumbnail: item.thumbnail || item.url,
                    image: item.url || item.thumbnail,
                    title: item.title || query,
                    source: "Google Images",
                    sourceType: "google",
                    url: item.foreign_landing_url || item.url || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
                    width: item.width || 0,
                    height: item.height || 0
                  });
                }
              }
            }
          }
        } catch {
          // silently handle
        }
      }

      // 2. Fetch from Wikimedia Commons
      for (const term of searchTerms) {
        if (googleItems.length >= 30) break;
        try {
          const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(term)}&gsrlimit=15&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;
          const wikiRes = await fetch(wikiUrl, {
            headers: { "User-Agent": "ChineseLearningApp/1.0" }
          });
          if (wikiRes.ok) {
            const wData = await wikiRes.json();
            const pages = wData.query?.pages ? Object.values(wData.query.pages) : [];
            for (const p of pages as any[]) {
              const info = p.imageinfo?.[0];
              if (info?.url && !seenUrls.has(info.url)) {
                seenUrls.add(info.url);
                const desc = (info.extmetadata?.ObjectName?.value || p.title?.replace(/^File:/, "").replace(/\.[^.]+$/, "") || query);
                googleItems.push({
                  id: `google-wiki-${p.pageid || googleItems.length}`,
                  thumbnail: info.url,
                  image: info.url,
                  title: desc,
                  source: "Google Images",
                  sourceType: "google",
                  url: info.descriptionurl || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
                  width: info.width || 0,
                  height: info.height || 0
                });
              }
            }
          }
        } catch {
          // silently handle
        }
      }

      return googleItems.slice(0, 30);
    };

    let results: any[] = [];

    if (requestedSource === "google") {
      // ONLY Google / Web Images - NEVER fallback to Baidu to prevent mixing sources!
      results = await fetchGoogle();
    } else if (requestedSource === "baidu") {
      // ONLY Baidu Images
      results = await fetchBaidu();
    } else {
      // Both sources in parallel
      const [googleItems, baiduItems] = await Promise.all([fetchGoogle(), fetchBaidu()]);
      // Interleave results to show both sources nicely
      const maxLen = Math.max(googleItems.length, baiduItems.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < googleItems.length) results.push(googleItems[i]);
        if (i < baiduItems.length) results.push(baiduItems[i]);
      }
    }

    // Fallback to Wikimedia Commons if all returned nothing
    if (results.length === 0) {
      try {
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=20&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;
        const wikiRes = await fetch(wikiUrl, {
          headers: { "User-Agent": "ChineseLearningApp/1.0" }
        });
        if (wikiRes.ok) {
          const wData = await wikiRes.json();
          const pages = wData.query ? Object.values(wData.query.pages) : [];
          results = pages
            .filter((p: any) => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url)
            .map((p: any, idx: number) => {
              const info = p.imageinfo[0];
              const desc = (info.extmetadata && info.extmetadata.ObjectName ? info.extmetadata.ObjectName.value : p.title.replace(/^File:/, "").replace(/\.[^.]+$/, ""));
              return {
                id: `wiki-${idx}-${p.pageid || idx}`,
                thumbnail: info.url,
                image: info.url,
                title: desc || query,
                source: "Google Images",
                sourceType: "google",
                url: info.descriptionurl || googleImagesUrl,
                width: info.width || 0,
                height: info.height || 0
              };
            });
        }
      } catch (wErr) {
        console.warn("[Wikimedia Images Error]:", wErr);
      }
    }

    return res.json({
      query,
      source: requestedSource,
      googleImagesUrl,
      total: results.length,
      results
    });
  } catch (err: any) {
    console.error("[API Images Error]:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi tìm kiếm hình ảnh." });
  }
});

// In-memory cache for Chinese word definitions to prevent redundant Gemini API calls
const wordDefinitionCache = new Map<string, any>();

// API endpoint to segment Chinese text and translate/provide pinyin, optimized for Vietnamese learners
app.post("/api/segment", async (req, res): Promise<any> => {
  try {
    const { text, customDictKeys = [] } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Yêu cầu cung cấp đoạn văn tiếng Trung (text)." });
    }

    // 1. Check offline lesson cache first to guarantee 0 latency and 100% success for samples
    const normInput = normalizeTextForMatch(text);
    const matchedLessonId = NORMALIZED_LESSON_MAP[normInput];
    if (matchedLessonId && PRESEGMENTED_LESSONS_CACHE[matchedLessonId]) {
      console.log(`[Cache Hit] Trả về dữ liệu phân tích sẵn cho bài học: ${matchedLessonId}`);
      return res.json({ tokens: injectHskLevels(PRESEGMENTED_LESSONS_CACHE[matchedLessonId]) });
    }

    // 2. Pre-segment using offline segmenter to GUARANTEE 100% coverage without skipping any text
    // This solves the problem of Gemini dropping text when hitting output token limits on long paragraphs.
    const initialTokens = offlineSegmentText(text, customDictKeys);

    // 3. Find unique unknown words that need definition from Gemini
    const unknownWords = Array.from(new Set(
      initialTokens
        .filter(t => t.type === "word" && t.translation === "(Từ chưa rõ nghĩa)" && !/^\d+$/.test(t.text))
        .map(t => t.text)
    ));

    const definitionsMap: Record<string, any> = {};
    const wordsToFetch: string[] = [];

    for (const w of unknownWords) {
      if (wordDefinitionCache.has(w)) {
        definitionsMap[w] = wordDefinitionCache.get(w);
      } else {
        wordsToFetch.push(w);
      }
    }

    if (wordsToFetch.length === 0 || !process.env.GEMINI_API_KEY) {
      // Return immediately if everything is in cache, known, or no API key
      const enrichedTokens = initialTokens.map(token => {
        if (token.type === "word" && definitionsMap[token.text]) {
          const def = definitionsMap[token.text];
          return {
            ...token,
            pinyin: def.pinyin,
            translation: def.translation,
            partOfSpeech: def.partOfSpeech,
            hskLevel: def.hskLevel,
            example: def.example
          };
        }
        return token;
      });

      return res.json({ 
        tokens: injectHskLevels(enrichedTokens), 
        isOfflineFallback: wordsToFetch.length > 0,
        offlineReason: !process.env.GEMINI_API_KEY ? "no_key" : undefined
      });
    }

    // 4. Batch query in chunks of at most 10 words to prevent timeouts
    const systemInstruction = 
      "You are a Chinese-Vietnamese linguist tool. Provide precise vocabulary details: " +
      "pinyin with tone marks, Vietnamese translation, part of speech (Danh từ, Động từ, Tính từ...), " +
      "and a short example sentence in Chinese, its pinyin, and Vietnamese translation.";

    const CHUNK_SIZE = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < wordsToFetch.length; i += CHUNK_SIZE) {
      chunks.push(wordsToFetch.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const prompt = `Hãy giải nghĩa chi tiết các từ tiếng Trung sau: ${JSON.stringify(chunk)}`;
      try {
        const response = await generateContentWithRetry({
          model: PRIMARY_FLASH_MODEL,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["definitions"],
              properties: {
                definitions: {
                  type: Type.ARRAY,
                  description: "Danh sách giải nghĩa cho từng từ vựng được yêu cầu.",
                  items: {
                    type: Type.OBJECT,
                    required: ["text", "pinyin", "translation", "partOfSpeech", "example"],
                    properties: {
                      text: { type: Type.STRING, description: "Từ vựng tiếng Trung tương ứng." },
                      pinyin: { type: Type.STRING, description: "Phiên âm pinyin kèm dấu." },
                      translation: { type: Type.STRING, description: "Nghĩa tiếng Việt." },
                      partOfSpeech: { type: Type.STRING, description: "Loại từ." },
                      hskLevel: { type: Type.STRING, description: "Cấp độ HSK tương ứng (VD: HSK 1, HSK 2, ...). Trả về chuỗi rỗng nếu không thuộc cấp HSK nào." },
                      example: {
                        type: Type.OBJECT,
                        required: ["chinese", "pinyin", "vietnamese"],
                        properties: {
                          chinese: { type: Type.STRING },
                          pinyin: { type: Type.STRING },
                          vietnamese: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }, 20000);

        const parsedData = parseGeminiJson(response.text || "{}");
        const definitionsArr = parsedData.definitions || [];
        definitionsArr.forEach((def: any) => {
          if (def.text) {
            definitionsMap[def.text] = def;
            wordDefinitionCache.set(def.text, def);
          }
        });
      } catch (chunkErr: any) {
        console.warn("[Segment] Chunk failed, continuing with remaining:", chunkErr?.message || chunkErr);
      }
    }

    // Merge definitions back to initialTokens
    const enrichedTokens = initialTokens.map(token => {
      if (token.type === "word" && definitionsMap[token.text]) {
        const def = definitionsMap[token.text];
        return {
          ...token,
          pinyin: def.pinyin,
          translation: def.translation,
          partOfSpeech: def.partOfSpeech,
          hskLevel: def.hskLevel,
          example: def.example
        };
      }
      return token;
    });

    return res.json({ tokens: injectHskLevels(enrichedTokens) });
  } catch (error: any) {
    console.warn("Lỗi hệ thống phân tích văn bản:", error?.message || error);
    try {
      const { text, customDictKeys = [] } = req.body;
      return res.json({ tokens: injectHskLevels(offlineSegmentText(text, customDictKeys)), isOfflineFallback: true, offlineReason: "api_error" });
    } catch (fallbackError: any) {
      return res.status(500).json({ 
        error: "Không thể phân tích đoạn văn.",
        details: error.message 
      });
    }
  }
});

// API endpoint to lookup a single Chinese word using Gemini (with robust offline fallback catalog search)
app.post("/api/lookup-word", async (req, res): Promise<any> => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({ error: "Yêu cầu cung cấp từ vựng tiếng Trung (word)." });
    }

    const trimmedWord = word.trim();

    let offlineReason = "api_key_missing";
    // 1. Try process.env.GEMINI_API_KEY
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemInstruction = 
          "You are a Chinese-Vietnamese linguist tool. Provide precise single vocabulary details: " +
          "pinyin with correct tone marks, Vietnamese translation, part of speech (e.g. Danh từ, Động từ, Tính từ...), " +
          "and a clear, short example sentence in Chinese, its pinyin, and Vietnamese translation. " +
          "If the provided word is completely unknown, meaningless, or not a valid Chinese word, do not struggle. " +
          "Instead, quickly return pinyin: '?', translation: 'Từ lạ / Không có nghĩa', partOfSpeech: 'N/A', and use '?' for example fields.";

        const prompt = `Hãy giải nghĩa chi tiết từ tiếng Trung sau: "${trimmedWord}"`;
        
        const response = await generateContentWithRetry({
          model: PRIMARY_FLASH_MODEL,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["pinyin", "translation", "partOfSpeech", "example"],
              properties: {
                pinyin: { type: Type.STRING, description: "Accurate pinyin with tone marks, e.g. 'nǐ hǎo'" },
                translation: { type: Type.STRING, description: "Correct Vietnamese translation according to typical context, e.g. 'xin chào'" },
                partOfSpeech: { type: Type.STRING, description: "Vietnamese part of speech, e.g. 'Danh từ', 'Động từ', 'Tính từ'..." },
                hskLevel: { type: Type.STRING, description: "HSK level (e.g. 'HSK 1', 'HSK 2', ...). Return empty string if none." },
                example: {
                  type: Type.OBJECT,
                  required: ["chinese", "pinyin", "vietnamese"],
                  properties: {
                    chinese: { type: Type.STRING, description: "Short example sentence using this word" },
                    pinyin: { type: Type.STRING, description: "Pinyin of example" },
                    vietnamese: { type: Type.STRING, description: "Vietnamese meaning of example" }
                  }
                }
              }
            }
          }
        });
        const parsed = parseGeminiJson(response.text || "{}");
        if (parsed.pinyin && parsed.translation) {
          return res.json({
            text: trimmedWord,
            type: "word",
            hskLevel: parsed.hskLevel || getHskLevel(trimmedWord),
            ...parsed
          });
        }
      } catch (geminiErr: any) {
        const errorStr = String(geminiErr?.message || geminiErr || "");
        const isQuotaError = errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED");
        const isTimeout = errorStr.includes("Timeout");
        if (isQuotaError) {
          offlineReason = "quota_exceeded";
          console.log(`[Gemini Quota Limit] Chạm hạn mức cuộc gọi Gemini (429) khi tra cứu từ "${trimmedWord}". Kích hoạt bộ từ điển Offline.`);
        } else if (isTimeout) {
          offlineReason = "timeout";
          console.log("[Lookup Gemini Error] Failed to fetch lookup via Gemini. Falling back to offline dictionaries for word:", trimmedWord, "Error: Gemini API Timeout");
        } else {
          offlineReason = "api_error";
          console.log("[Lookup Gemini Error] Failed to fetch lookup via Gemini. Falling back to offline dictionaries for word:", trimmedWord, geminiErr);
        }
      }
    }

    // 2. Offline dictionary fallback if Gemini failed or is not configured
    const { OFFLINE_VOCAB_DICT, OFFLINE_CHAR_DICT } = await import("./server/fallbackData");

    const vocabMatch = OFFLINE_VOCAB_DICT[trimmedWord];
    if (vocabMatch) {
      return res.json({
        text: trimmedWord,
        type: "word",
        ...vocabMatch,
        hskLevel: getHskLevel(trimmedWord),
        isOfflineFallback: true,
        offlineReason
      });
    }

    // 3. Try letter-by-letter matching if length = 1
    if (trimmedWord.length === 1) {
      const charMatch = OFFLINE_CHAR_DICT[trimmedWord];
      if (charMatch) {
        return res.json({
          text: trimmedWord,
          type: "word",
          pinyin: charMatch.pinyin,
          translation: charMatch.translation,
          partOfSpeech: charMatch.partOfSpeech,
          hskLevel: getHskLevel(trimmedWord),
          isOfflineFallback: true,
          offlineReason,
          example: {
            chinese: `${trimmedWord}是常用的字。`,
            pinyin: `${charMatch.pinyin} shì chángyòng de zì.`,
            vietnamese: `"${trimmedWord}" là một chữ Hán rất thông dụng hàng ngày.`
          }
        });
      }
    }

    // 4. Default dynamic construction fallback
    return res.json({
      text: trimmedWord,
      type: "word",
      pinyin: "?",
      translation: "(Chuẩn bị bổ sung nghĩa)",
      partOfSpeech: "Từ vựng",
      hskLevel: getHskLevel(trimmedWord),
      isOfflineFallback: true,
      offlineReason,
      example: {
        chinese: `我正在学习 "${trimmedWord}" 這個詞。`,
        pinyin: `wǒ zhèngzài xuéxí "${trimmedWord}" zhège cí.`,
        vietnamese: `Tôi đang học từ vựng "${trimmedWord}".`
      }
    });

  } catch (err: any) {
    console.warn("Lỗi trong lookup-word API:", err?.message || err);
    return res.status(500).json({ error: "Lỗi máy chủ khi tra cứu từ vựng." });
  }
});

// API endpoint for Assistant Chat
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { history, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      res.setHeader("Content-Type", "text/plain");
      res.write("Tính năng chat đang cần được cấu hình API Key. Hãy thêm GEMINI_API_KEY vào biến môi trường.");
      return res.end();
    }
    
    // Format history for Gemini chat
    // Gemini chat expects history in the form of { role: 'user' | 'model', parts: [{ text: '...' }] }
    let chatHistory = (history || []).filter((msg: any) => msg.role === 'user' || msg.role === 'model').map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content || "" }]
    }));
    
    // Gemini API requires the history to start with a 'user' message
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const chatParams = {
      model: PRIMARY_FLASH_MODEL,
      config: {
        systemInstruction: "Bạn là một trợ lý ảo chuyên gia về ngôn ngữ tiếng Trung. Nhiệm vụ của bạn là giúp người dùng học tiếng Trung, dịch thuật, giải nghĩa từ vựng, hướng dẫn phát âm, và luyện giao tiếp. Hãy trả lời thân thiện, ngắn gọn, dễ hiểu và luôn sẵn sàng giải đáp thắc mắc bằng tiếng Việt.",
      },
      history: chatHistory
    };

    const responseStream = await sendMessageStreamWithRetry(chatParams, { message: message });
    
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    
    for await (const chunk of responseStream) {
       res.write(chunk.text);
    }
    
    res.end();
    } catch (err: any) {
    console.log("API error:", err?.message || "Unknown error");
    if (!res.headersSent) {
      let errorMessage = "Lỗi máy chủ khi xử lý yêu cầu.";
      const errMsg = (err.message || "").toLowerCase();
      if (err.status === 503 || errMsg.includes('503') || errMsg.includes('unavailable')) {
        errorMessage = "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau vài phút.";
      } else if (err.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted')) {
        errorMessage = "Hệ thống AI đang nhận quá nhiều yêu cầu hoặc đã hết hạn mức miễn phí. Vui lòng chờ 1-2 phút rồi thử lại.";
      }
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }
});

// API endpoint to translate Chinese text to Vietnamese
// API endpoint to analyze Chinese grammar structure

app.post("/api/notebook-chat", async (req, res): Promise<any> => {
  try {
    const { history, message, documentContext } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    
    if (!documentContext) {
      return res.status(400).json({ error: "Document context is required." });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      res.setHeader("Content-Type", "text/plain");
      res.write("Tính năng chat đang cần được cấu hình API Key. Hãy thêm GEMINI_API_KEY vào biến môi trường.");
      return res.end();
    }
    
    let chatHistory = (history || []).filter((msg: any) => msg.role === 'user' || msg.role === 'model').map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content || "" }]
    }));
    
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const systemInstruction = `Bạn là một trợ lý ảo hỗ trợ học tập dựa trên kho từ vựng cá nhân của người dùng (Notebook Chat).
TÀI LIỆU được cung cấp bên dưới là danh sách các từ vựng mà người dùng đã lưu.
Nhiệm vụ của bạn là trả lời các câu hỏi, yêu cầu của người dùng liên quan đến danh sách từ vựng này.

QUAN TRỌNG: Khi người dùng yêu cầu "tạo câu chuyện", "viết đoạn văn" hoặc "đặt câu", bạn CHỈ ĐƯỢC PHÉP sử dụng các từ vựng CÓ TRONG TÀI LIỆU. 
TUYỆT ĐỐI KHÔNG TỰ Ý THÊM BẤT KỲ TỪ VỰNG TIẾNG TRUNG NÀO BÊN NGOÀI (Ngoại trừ các trợ từ ngữ pháp cơ bản như de (的), le (了), ma (吗)... hoặc đại từ nhân xưng cơ bản cực kỳ cần thiết để nối câu). Mọi danh từ, động từ, tính từ đều phải lấy 100% từ danh sách TÀI LIỆU.

Bạn có thể kết hợp kiến thức ngôn ngữ tiếng Trung chuyên sâu của mình để giải thích thêm ngữ pháp, cách dùng, ví dụ, pinyin, cấp độ HSK hoặc dịch thuật.

TÀI LIỆU CỦA NGƯỜI DÙNG:
${documentContext}`;

    const chatParams = {
      model: PRIMARY_FLASH_MODEL,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2
      },
      history: chatHistory
    };

    const responseStream = await sendMessageStreamWithRetry(chatParams, { message: message });
    
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    
    for await (const chunk of responseStream) {
      res.write(chunk.text);
    }
    res.end();
    } catch (err: any) {
    console.log("API error:", err?.message || "Unknown error");
    if (!res.headersSent) {
      let errorMessage = "Lỗi máy chủ khi xử lý yêu cầu.";
      const errMsg = (err.message || "").toLowerCase();
      if (err.status === 503 || errMsg.includes('503') || errMsg.includes('unavailable')) {
        errorMessage = "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau vài phút.";
      } else if (err.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted')) {
        errorMessage = "Hệ thống AI đang nhận quá nhiều yêu cầu hoặc đã hết hạn mức miễn phí. Vui lòng chờ 1-2 phút rồi thử lại.";
      }
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }
});

app.post("/api/grammar", async (req, res): Promise<any> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing text to analyze." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key not configured." });
    }

    const prompt = `Phân tích cấu trúc ngữ pháp và từ vựng của câu tiếng Trung sau: "${text}".
Vui lòng xuất ra ĐÚNG định dạng Markdown giống như mẫu sau, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI:

**${text}**

[Phân tích từng từ cách nhau bởi dấu +, ví dụ: 很 + 高兴 + 认识 + 你]

Có thể hiểu:
- [Từ 1] = [Loại từ] (ví dụ: phó từ, tính từ, động từ, tân ngữ...)
- [Từ 2] = [Loại từ]
...

📌 Cấu trúc:
[Cấu trúc công thức chi tiết theo loại từ, ví dụ: Phó từ + Tính từ + Động từ + Tân ngữ (Adv + Adj + V + O)]

> ${text}
> [Ý nghĩa tiếng Việt]

Chỉ trả về nội dung phân tích theo chuẩn Markdown, không thêm lời chào hay giải thích gì thêm ngoài mẫu trên.`;

    try {
      const responseStream = await generateContentStreamWithRetry({
        contents: prompt,
        config: {
          temperature: 0.2
        }
      });

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
      return res.end();
    } catch (streamErr: any) {
      console.warn("Stream attempt failed in /api/grammar, falling back to non-streaming...", streamErr?.message || streamErr);
      const fallbackResult = await generateContentWithRetry({
        contents: prompt,
        config: {
          temperature: 0.2
        }
      });
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(fallbackResult.text || "");
    }
  } catch (err: any) {
    console.warn("Error in /api/grammar:", err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Lỗi máy chủ khi phân tích ngữ pháp." });
    }
    return res.end();
  }
});

app.post("/api/practice/generate", async (req, res): Promise<any> => {
  try {
    const { words, type, requiredTotal, targetWordForContext, contextWords, knownWords, sentenceIndex } = req.body;
    
    if ((!words || words.length === 0) && !targetWordForContext) {
      return res.status(400).json({ error: "Không có từ vựng" });
    }

    let wordListStr = "";
    if (words && words.length > 0) {
      wordListStr = words.map((w: any) => `${w.text} (${w.pinyin}): ${w.translation}`).join("\n");
    }
    
    let contextStr = "";
    if (contextWords && contextWords.length > 0) {
       contextStr = contextWords.map((w: any) => `${w.text}`).join(", ");
    }

    const count = requiredTotal || (words && words.length === 1 ? 5 : (words ? words.length : 10));
    
    let sentenceLengthPrompt = "";
    if (requiredTotal === 1 && sentenceIndex !== undefined) {
      let requiredWords = 5;
      if (sentenceIndex >= 4 && sentenceIndex <= 6) requiredWords = 6;
      if (sentenceIndex >= 7 && sentenceIndex <= 9) requiredWords = 7;
      
      sentenceLengthPrompt = `CẤU TRÚC VÀ ĐỘ DÀI CÂU:
Bạn phải tạo ra CHÍNH XÁC 1 câu bài tập dài CHÍNH XÁC ${requiredWords} "từ" (tính theo số phần tử trong mảng shuffledWords).`;
    } else {
      sentenceLengthPrompt = `CẤU TRÚC VÀ ĐỘ DÀI CÂU (10 CÂU):
- 4 câu đầu (câu 1-4): Mỗi câu dài CHÍNH XÁC 5 "từ" (tính theo số phần tử trong mảng shuffledWords).
- 3 câu tiếp theo (câu 5-7): Mỗi câu dài CHÍNH XÁC 6 "từ" (tính theo số phần tử trong mảng shuffledWords).
- 3 câu cuối cùng (câu 8-10): Mỗi câu dài CHÍNH XÁC 7 "từ" (tính theo số phần tử trong mảng shuffledWords).`;
    }
    
    let prompt = "";
    if (type === 'cloze') {
      prompt = `Tạo một bài tập đục lỗ (điền từ vào chỗ trống) tiếng Trung sử dụng các từ vựng sau đây.
Từ vựng:
${wordListStr}

Bạn phải tạo ra CHÍNH XÁC ${count} câu bài tập. Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "targetWord": "Từ vựng mục tiêu (lấy chính xác từ danh sách trên)",
      "sentence": "Câu tiếng Trung với chỗ trống được biểu diễn bằng ___",
      "pinyin": "Pinyin của câu đó, giữ nguyên ___ cho chỗ trống",
      "translation": "Nghĩa tiếng Việt của câu",
      "answer": "Từ tiếng Trung chính xác điền vào chỗ trống",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"]
    }
  ]
}`;
    } else if (type === 'ordering') {
      let knownWordsStr = "";
      if (knownWords && knownWords.length > 0) {
          knownWordsStr = knownWords.map((w: any) => w.text).join(", ");
      }
      
      if (targetWordForContext && contextWords) {
        prompt = `Tạo bài tập gồm ${count} câu tiếng Trung (dạng sắp xếp từ thành câu).
Mục tiêu là luyện tập từ vựng: ${targetWordForContext.text} (${targetWordForContext.pinyin} - ${targetWordForContext.translation}).

YÊU CẦU CHUNG:
1. Bạn phải tạo ra CHÍNH XÁC ${count} câu bài tập. TẤT CẢ các câu đều phải chứa từ "${targetWordForContext.text}".
2. CÁC TỪ VỰNG TRONG CÂU: Ưu tiên sử dụng các từ vựng trong danh sách sau đây để tạo câu dễ hiểu với người học:
Danh sách từ vựng ưu tiên: ${contextStr}
3. LOẠI BÀI TẬP: Tất cả ${count} câu đều là dạng sắp xếp các từ bị xáo trộn thành câu hoàn chỉnh (type: "ordering").
4. KHÔNG sử dụng bất kỳ dấu câu nào (như dấu chấm, phẩy, hỏi chấm, cảm thán...) trong mảng \`shuffledWords\` cũng như trong \`correctSentence\`. Câu chỉ bao gồm các chữ Hán.
5. QUAN TRỌNG VỀ TỪ GHÉP: Tuyệt đối KHÔNG được tách các từ ghép (compound words) thành các chữ Hán riêng lẻ trong mảng \`shuffledWords\`. Mỗi phần tử trong mảng phải là một "từ" (word) có nghĩa độc lập. Ví dụ: từ "总统" phải giữ nguyên là "总统", KHÔNG được tách thành "总" và "统". Từ "喜欢" phải giữ nguyên là "喜欢".

${sentenceLengthPrompt}

Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "type": "ordering",
      "targetWord": "${targetWordForContext.text}",
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3", "Từ 4", "Từ 5"],
      "correctSentence": "Câu tiếng Trung hoàn chỉnh (tương ứng với các từ trong shuffledWords ghép lại, KHÔNG có dấu câu)",
      "pinyin": "Pinyin của câu",
      "translation": "Nghĩa tiếng Việt của câu",
      "structureExplanation": "Phân tích cấu trúc câu chi tiết theo đúng format sau (dùng kí tự \n để xuống dòng):\nPhân tích từ vựng:\n[Từ 1] = [Loại từ] ([nghĩa])\n[Từ 2] = [Loại từ] ([nghĩa])\n...\n\n📌 Cấu trúc: [Công thức cấu trúc, vd: S + V + N]\n\n[Câu tiếng Trung] [Nghĩa tiếng Việt] (vd: 你叫什么名字？ Bạn tên là gì?)"
    }
  ]
}`;
      } else {
        prompt = `Tạo bài tập gồm ${count} câu tiếng Trung (dạng sắp xếp từ thành câu) sử dụng các TỪ VỰNG MỤC TIÊU sau đây.
Từ vựng mục tiêu (từ cần học):
${wordListStr}

${knownWordsStr ? `Các từ vựng đã biết (để tạo ngữ cảnh):\n${knownWordsStr}` : ''}

Bạn phải tạo ra CHÍNH XÁC ${count} câu bài tập.
YÊU CẦU CHUNG: 
1. Mỗi câu trong bài tập phải chứa ĐÚNG 1 từ nằm trong "Từ vựng mục tiêu". 
2. Ưu tiên sử dụng "Các từ vựng đã biết" ở trên để tạo phần còn lại của câu, nhằm giúp người học ôn tập lại.
3. LOẠI BÀI TẬP: Tất cả ${count} câu đều là dạng sắp xếp các từ bị xáo trộn thành câu hoàn chỉnh (type: "ordering").
4. KHÔNG sử dụng bất kỳ dấu câu nào (như dấu chấm, phẩy, hỏi chấm, cảm thán...) trong mảng \`shuffledWords\` cũng như trong \`correctSentence\`. Câu chỉ bao gồm các chữ Hán.
5. QUAN TRỌNG VỀ TỪ GHÉP: Tuyệt đối KHÔNG được tách các từ ghép (compound words) thành các chữ Hán riêng lẻ trong mảng \`shuffledWords\`. Mỗi phần tử trong mảng phải là một "từ" (word) có nghĩa độc lập. Ví dụ: từ "总统" phải giữ nguyên là "总统", KHÔNG được tách thành "总" và "统". Từ "喜欢" phải giữ nguyên là "喜欢".

${sentenceLengthPrompt}

Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "type": "ordering",
      "targetWord": "Từ vựng mục tiêu",
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3", "Từ 4", "Từ 5"],
      "correctSentence": "Câu tiếng Trung hoàn chỉnh (tương ứng với các từ trong shuffledWords ghép lại, KHÔNG có dấu câu)",
      "pinyin": "Pinyin của câu",
      "translation": "Nghĩa tiếng Việt của câu",
      "structureExplanation": "Phân tích cấu trúc câu chi tiết theo đúng format sau (dùng kí tự \n để xuống dòng):\nPhân tích từ vựng:\n[Từ 1] = [Loại từ] ([nghĩa])\n[Từ 2] = [Loại từ] ([nghĩa])\n...\n\n📌 Cấu trúc: [Công thức cấu trúc, vd: S + V + N]\n\n[Câu tiếng Trung] [Nghĩa tiếng Việt] (vd: 你叫什么名字？ Bạn tên là gì?)"
    }
  ]
}`;
      }
    } else {
      return res.status(400).json({ error: "Loại bài tập không hợp lệ" });
    }

    try {
      const response = await generateContentWithRetry({
        model: PRIMARY_FLASH_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text || "{}";
      const parsed = parseGeminiJson(resultText);
      if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
        return res.json(parsed);
      }
    } catch (geminiError: any) {
      console.warn("Gemini practice generation error, attempting offline fallback:", geminiError?.message || geminiError);
    }

    // Offline exercise builder fallback:
    // If Gemini is unreachable or temporarily overloaded, synthesize high quality exercises from available word examples or dictionary definitions
    const targetWordsList = (words && words.length > 0) 
      ? words 
      : (targetWordForContext ? [targetWordForContext] : []);

    if (targetWordsList.length > 0) {
      const fallbackExercises: any[] = [];
      for (let i = 0; i < count; i++) {
        const wordObj = targetWordsList[i % targetWordsList.length];
        const wordText = wordObj.text || "好";
        const exampleObj = wordObj.example || {};
        let sentence = (exampleObj.chinese || `${wordText}是非常好的词语`).replace(/[\s.,!?。，！？、]/g, '');
        if (!sentence.includes(wordText)) {
          sentence = `${wordText}很有意思`;
        }

        // Split sentence into chunks while keeping target word together
        let chunks: string[] = [];
        let remaining = sentence;
        if (remaining.startsWith(wordText)) {
          chunks.push(wordText);
          remaining = remaining.slice(wordText.length);
        }
        for (const char of remaining) {
          chunks.push(char);
        }
        if (chunks.length < 5) {
          chunks.push("呀", "呢");
          chunks = chunks.slice(0, 5);
        }

        fallbackExercises.push({
          id: `fallback-${Date.now()}-${i}`,
          type: type || "ordering",
          targetWord: wordText,
          shuffledWords: [...chunks].sort(() => 0.5 - Math.random()),
          correctSentence: chunks.join(''),
          pinyin: exampleObj.pinyin || wordObj.pinyin || "",
          translation: exampleObj.vietnamese || wordObj.translation || "Câu luyện tập",
          structureExplanation: `Phân tích từ vựng:\n${wordText} = (${wordObj.translation || "từ vựng"})\n\n📌 Cấu trúc: Câu luyện tập ôn tập`
        });
      }

      return res.json({ exercises: fallbackExercises });
    }

    return res.status(500).json({ error: "Lỗi máy chủ nội bộ khi tạo bài tập" });
  } catch (error) {
    console.warn("Practice generation error:", error?.message || error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ khi tạo bài tập" });
  }
});

app.post("/api/translate", async (req, res): Promise<any> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing text to translate." });
    }

    if (process.env.GEMINI_API_KEY) {
      const prompt = `Dịch đoạn văn tiếng Trung sau sang tiếng Việt một cách tự nhiên nhất. Chỉ xuất ra kết quả dịch, tuyệt đối không giải thích thêm:\n"${text}"`;
      
      try {
        const responseStream = await generateContentStreamWithRetry({
          contents: prompt,
          config: {
            temperature: 0.1
          }
        });
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(chunk.text);
          }
        }
        return res.end();
      } catch (streamErr: any) {
        console.warn("Stream attempt failed in /api/translate, falling back to non-streaming...", streamErr?.message || streamErr);
        const fallbackResult = await generateContentWithRetry({
          contents: prompt,
          config: {
            temperature: 0.1
          }
        });
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.send(fallbackResult.text || "");
      }
    }

    res.setHeader("Content-Type", "text/plain");
    res.write("(Tính năng dịch cần API Key)");
    return res.end();
  } catch (error: any) {
    console.warn("Lỗi khi dịch:", error?.message || error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Lỗi máy chủ khi dịch văn bản." });
    }
    return res.end();
  }
});

// API endpoint to evaluate pronunciation using Gemini Audio
app.post("/api/evaluate-pronunciation", async (req, res): Promise<any> => {
  try {
    const { audioBase64, mimeType, text } = req.body;
    if (!audioBase64 || !text) {
      return res.status(400).json({ error: "Missing audio or text." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "API key not configured." });
    }

    const prompt = `Đánh giá phát âm tiếng Trung so với: "${text}".
Yêu cầu JSON:
- score: 0-100
- feedback: nhận xét cực ngắn (dưới 10 từ tiếng Việt)
- mispronounced: mảng các chữ Hán phát âm sai (hoặc rỗng)`;

    const response = await generateContentWithRetry({
      model: PRIMARY_FLASH_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || 'audio/webm'
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 150,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: { type: "NUMBER" },
            feedback: { type: "STRING" },
            mispronounced: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        }
      }
    });

    const parsed = parseGeminiJson(response.text || "{}");
    return res.json(parsed);

  } catch (error: any) {
    console.warn("Evaluate pronunciation error:", error?.message || error);
    return res.status(500).json({ error: "Lỗi máy chủ khi đánh giá phát âm." });
  }
});

// In-memory cache for high-fidelity TTS audio (keyed by voice:text)
const ttsAudioCache: Record<string, { audioBase64: string; mimeType: string; subtitles?: Array<{ part: string; start: number; end: number }> }> = {};

// Circuit breaker for Edge TTS (short backoff on transient errors)
let edgeTtsCooldownUntil = 0;

// Circuit breakers for Gemini TTS rate/daily limits
let geminiTtsQuotaExhaustedUntil = 0;
let geminiFlashTtsQuotaExhaustedUntil = 0;

// Helper to resolve Edge TTS voice, Gemini voice, and metadata
function resolveTtsVoice(voiceInput?: string): { edgeVoice: string; geminiVoice: string; googleLang: string; isMale: boolean; displayName: string } {
  const v = (voiceInput || "").toLowerCase();
  const googleLang = "zh-CN";

  // Only 2 voices allowed in the entire app: Yunxi (Male) and Xiaoxiao (Female)
  if (v.includes("yunxi") || v.includes("nam") || v.includes("male") || v.includes("puck")) {
    return {
      edgeVoice: "zh-CN-YunxiNeural",
      geminiVoice: "Puck",
      googleLang,
      isMale: true,
      displayName: "云希 Online (Natural) - Giọng Nam"
    };
  }
  // Default is female Xiaoxiao / Kore
  return {
    edgeVoice: "zh-CN-XiaoxiaoNeural",
    geminiVoice: "Kore",
    googleLang,
    isMale: false,
    displayName: "晓晓 Online (Natural) - Giọng Nữ"
  };
}

// Synthesize exact Microsoft Edge Neural voice (zh-CN-XiaoxiaoNeural / zh-CN-YunxiNeural) along with WordBoundary subtitles
async function synthesizeEdgeNeuralTTS(text: string, voice: string): Promise<{ buffer: Buffer; subtitles: Array<{ part: string; start: number; end: number }> }> {
  let lastErr: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await synthesizeEdgeNeuralV2(text, voice, 12000);
      if (result.buffer && result.buffer.length > 0) {
        return result;
      }
    } catch (err) {
      lastErr = err;
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }
  throw lastErr || new Error("Edge TTS v2 synthesis failed");
}

// Fallback Mandarin MP3 synthesis via Google Translate / Youdao TTS when Edge & Gemini quotas are reached
async function synthesizeFallbackMandarinMp3(text: string): Promise<Buffer> {
  const rawChunks = text
    .split(/(?<=[。！？；，、,!?;.\n\r]+)/)
    .map(s => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const rc of (rawChunks.length > 0 ? rawChunks : [text])) {
    if (rc.length <= 120) {
      chunks.push(rc);
    } else {
      for (let i = 0; i < rc.length; i += 100) {
        chunks.push(rc.slice(i, i + 100));
      }
    }
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    let chunkBuf: Buffer | null = null;

    // Try Google Translate zh-CN TTS
    try {
      const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=zh-CN&client=tw-ob`;
      const gRes = await fetch(gUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/"
        }
      });
      if (gRes.ok) {
        const ab = await gRes.arrayBuffer();
        if (ab.byteLength > 100) {
          chunkBuf = Buffer.from(ab);
        }
      }
    } catch {}

    // Fallback to Youdao Mandarin TTS
    if (!chunkBuf) {
      try {
        const yUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(chunk)}&le=zh`;
        const yRes = await fetch(yUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          }
        });
        if (yRes.ok) {
          const ab = await yRes.arrayBuffer();
          if (ab.byteLength > 100) {
            chunkBuf = Buffer.from(ab);
          }
        }
      } catch {}
    }

    if (chunkBuf) {
      buffers.push(chunkBuf);
    }
  }

  return buffers.length > 0 ? Buffer.concat(buffers) : Buffer.alloc(0);
}

// API endpoint for Text-to-Speech using high-fidelity Edge Neural & Gemini TTS
// CHỈ SỬ DỤNG 2 GIỌNG CHUẨN: 晓晓 (Xiaoxiao - Nữ) và 云希 (Yunxi - Nam)
app.post("/api/tts", async (req, res): Promise<any> => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Vui lòng cung cấp văn bản cần đọc." });
    }
    const cleanText = text.trim();
    const { edgeVoice, geminiVoice, displayName } = resolveTtsVoice(voice);
    const cacheKey = `v5_edge_neural:${edgeVoice}:${cleanText}`;

    // 1. Return cached audio if already synthesized
    if (ttsAudioCache[cacheKey]) {
      return res.json({
        success: true,
        audioBase64: ttsAudioCache[cacheKey].audioBase64,
        mimeType: ttsAudioCache[cacheKey].mimeType,
        subtitles: ttsAudioCache[cacheKey].subtitles || [],
        voiceUsed: edgeVoice,
        engine: "edge-neural-tts",
        displayName,
        cached: true
      });
    }

    // 2. PRIMARY TIER: True Microsoft Edge Neural TTS (node-edge-tts)
    // Produces the EXACT SAME Xiaoxiao (Nữ) and Yunxi (Nam) as Microsoft Edge browser!
    if (Date.now() > edgeTtsCooldownUntil) {
      try {
        const { buffer: audioBuffer, subtitles } = await synthesizeEdgeNeuralTTS(cleanText, edgeVoice);
        if (audioBuffer && audioBuffer.length > 0) {
          const base64Audio = audioBuffer.toString("base64");
          ttsAudioCache[cacheKey] = {
            audioBase64: base64Audio,
            mimeType: "audio/mp3",
            subtitles
          };

          return res.json({
            success: true,
            audioBase64: base64Audio,
            mimeType: "audio/mp3",
            subtitles,
            voiceUsed: edgeVoice,
            engine: "edge-neural-tts",
            displayName,
            cached: false
          });
        }
      } catch {
        // Short 15s cooldown on transient failure so Edge TTS recovers quickly
        edgeTtsCooldownUntil = Date.now() + 15 * 1000;
        console.log("[TTS] Edge TTS temporarily unavailable, switching to backup TTS tier");
      }
    }

    // 3. SECONDARY TIER: Gemini Flash Lite TTS (Native Mandarin, distinct Female Kore & Male Puck)
    if (process.env.GEMINI_API_KEY && Date.now() > geminiTtsQuotaExhaustedUntil) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [
            {
              role: "user",
              parts: [{ text: cleanText }]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: geminiVoice }
              }
            }
          }
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          ttsAudioCache[cacheKey] = {
            audioBase64: base64Audio,
            mimeType: "audio/wav"
          };

          return res.json({
            success: true,
            audioBase64: base64Audio,
            mimeType: "audio/wav",
            voiceUsed: edgeVoice,
            engine: "gemini-tts",
            displayName,
            cached: false
          });
        }
      } catch (geminiError: any) {
        const errMsg = String(geminiError?.message || geminiError || "");
        const isDailyQuota = errMsg.includes("PerDay") || errMsg.includes("per day");
        const isQuota = isDailyQuota || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded");
        if (isQuota) {
          geminiTtsQuotaExhaustedUntil = Date.now() + (isDailyQuota ? 12 * 60 * 60 * 1000 : 10 * 60 * 1000);
          console.log("[TTS] Gemini Flash Lite TTS quota reached, switching to next TTS tier.");
        } else {
          console.log("[TTS] Gemini Flash Lite TTS unavailable, switching to next TTS tier.");
        }
      }
    }

    // 4. TERTIARY TIER: Gemini Flash TTS
    if (process.env.GEMINI_API_KEY && Date.now() > geminiFlashTtsQuotaExhaustedUntil) {
      try {
        const ttsResponse2 = await ai.models.generateContent({
          model: "gemini-3.8-flash-tts",
          contents: [
            {
              role: "user",
              parts: [{ text: cleanText }]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: geminiVoice }
              }
            }
          }
        });

        const base64Audio2 = ttsResponse2.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio2) {
          ttsAudioCache[cacheKey] = {
            audioBase64: base64Audio2,
            mimeType: "audio/wav"
          };

          return res.json({
            success: true,
            audioBase64: base64Audio2,
            mimeType: "audio/wav",
            voiceUsed: edgeVoice,
            engine: "gemini-flash-tts",
            displayName,
            cached: false
          });
        }
      } catch (gemini2Error: any) {
        const errMsg2 = String(gemini2Error?.message || gemini2Error || "");
        const isDailyQuota2 = errMsg2.includes("PerDay") || errMsg2.includes("per day");
        const isQuota2 = isDailyQuota2 || errMsg2.includes("429") || errMsg2.includes("RESOURCE_EXHAUSTED") || errMsg2.includes("Quota exceeded");
        if (isQuota2) {
          geminiFlashTtsQuotaExhaustedUntil = Date.now() + (isDailyQuota2 ? 12 * 60 * 60 * 1000 : 10 * 60 * 1000);
          console.log("[TTS] Gemini Flash TTS quota reached, switching to Mandarin MP3 fallback.");
        } else {
          console.log("[TTS] Gemini Flash TTS unavailable, switching to Mandarin MP3 fallback.");
        }
      }
    }

    // 5. QUATERNARY TIER: Direct Mandarin MP3 synthesis (Google Translate / Youdao TTS)
    try {
      const fallbackBuffer = await synthesizeFallbackMandarinMp3(cleanText);
      if (fallbackBuffer && fallbackBuffer.length > 0) {
        const base64Fallback = fallbackBuffer.toString("base64");
        ttsAudioCache[cacheKey] = {
          audioBase64: base64Fallback,
          mimeType: "audio/mp3",
          subtitles: []
        };

        return res.json({
          success: true,
          audioBase64: base64Fallback,
          mimeType: "audio/mp3",
          subtitles: [],
          voiceUsed: edgeVoice,
          engine: "mandarin-mp3-fallback",
          displayName,
          cached: false
        });
      }
    } catch {}

    return res.status(502).json({ error: "Không thể tạo âm thanh cho giọng đọc được chọn." });
  } catch (error: any) {
    console.warn("TTS generation warning:", error?.message || "Unknown error");
    return res.status(500).json({ error: "Lỗi khi tổng hợp giọng đọc." });
  }
});

// Memory cache for hanzi writer character data
const hanziDataCache: Record<string, any> = {};

app.get("/api/hanzi-data/:char", async (req, res): Promise<any> => {
  try {
    const char = decodeURIComponent(req.params.char || "").trim();
    if (!char) {
      return res.status(400).json({ error: "Missing char" });
    }
    if (hanziDataCache[char]) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.json(hanziDataCache[char]);
    }
    const response = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch character stroke data" });
    }
    const data = await response.json();
    hanziDataCache[char] = data;
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.json(data);
  } catch (err: any) {
    console.warn("Hanzi data fetch warning:", err?.message || err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// In-memory cache for decomposed words
const decomposeWordCache: Record<string, any> = {};

// Endpoint to decompose word into radicals and components with colors
app.post("/api/decompose-word", async (req, res): Promise<any> => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({ error: "Missing word" });
    }
    const trimmedWord = word.trim();

    if (decomposeWordCache[trimmedWord]) {
      return res.json(decomposeWordCache[trimmedWord]);
    }

    const instantData = decomposeWordInstantly(trimmedWord);
    if (instantData && instantData.characters && instantData.characters.length > 0) {
      decomposeWordCache[trimmedWord] = instantData;
      return res.json(instantData);
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Phân tích chiết tự và chia các bộ thủ của từ/chữ tiếng Trung sau cho người Việt học tiếng Trung: "${trimmedWord}".
Yêu cầu phân tích từng chữ Hán trong từ (nếu có nhiều chữ thì phân tích từng chữ theo thứ tự xuất hiện).
Với mỗi chữ Hán, cung cấp:
- char: Chữ Hán
- pinyin: Phiên âm Pinyin kèm dấu thanh
- hanviet: Âm Hán Việt (viết hoa, ví dụ THỊ, HỌC, TÂM, NỮ, HẢO, TƯỞNG, MINH...)
- meaning: Nghĩa tiếng Việt của chữ
- structure: Kết cấu chữ (ví dụ "Trên - Dưới (上下结构)", "Trái - Phải (左右结构)", "Bao bọc (包围结构)", "Đơn thể (独体字)")
- strokeCount: Tổng số nét (số nguyên)
- mainRadical: Ký tự bộ thủ chính (ví dụ "日", "女", "亻", "心")
- radicalName: Tên bộ thủ bằng tiếng Việt (ví dụ "Bộ Nhật (Mặt trời)", "Bộ Nữ (Phụ nữ)")
- radicalMeaning: Ý nghĩa nguồn gốc của bộ thủ chính
- radicalPosition: Vị trí của bộ thủ chính (ví dụ "Phần trên", "Bên trái", "Bên dưới")
- breakdownTip: Mẹo chiết tự phân tích cấu tạo kết hợp các bộ thủ (ngắn gọn, chính xác: cấu tạo từ bộ nào, vị trí trên/dưới/trái/phải)
- story: Câu chuyện dễ nhớ, hình ảnh liên tưởng giàu cảm xúc để ghi nhớ chữ lâu dài theo đúng mẫu sau:
  Ví dụ chữ 好: "Mẹ (女) âu yếm ôm đứa con (子) vào lòng là một hình ảnh vô cùng tốt đẹp (好)."
  Ví dụ chữ 想: "Đôi mắt nhìn chăm chú lên cây (相) rồi khắc sâu hình bóng vào tận đáy lòng (心) tạo thành nỗi nhớ nhung, suy nghĩ (想)."
  Ví dụ chữ 休: "Người đi đường (亻) mỏi gối dừng chân tựa lưng vào gốc cây (木) để nghỉ ngơi (休)."
  Ví dụ chữ 岁: "Đêm trăng (夕) dần lặn khuất sau đỉnh núi (山) cao, mỗi năm trôi qua lại thêm một tuổi (岁)."
  Yêu cầu bắt buộc: Mỗi câu chuyện phải kết nối các bộ thủ (đặt ký tự bộ thủ trong ngoặc đơn) thành một hành động, bức tranh sinh động dẫn đến ý nghĩa của chữ Hán, không được viết chung chung sáo rỗng.
- mnemonic: Tóm tắt chiết tự và câu chuyện ghi nhớ
- components: Mảng các bộ phận cấu tạo nên chữ (gồm bộ thủ chính và các thành phần còn lại):
  - component: Ký tự thành phần (ví dụ "日", "疋")
  - name: Tên thành phần/bộ thủ
  - hanviet: Âm Hán Việt thành phần (nếu có)
  - pinyin: Pinyin thành phần (nếu có)
  - color: Màu sắc đại diện (chú ý: dùng "#dc2626" ĐỎ cho bộ thủ chính giống như hình mẫu, "#1e3a8a" XANH NAVY cho các thành phần còn lại)
  - meaning: Ý nghĩa thành phần
  - role: Vai trò (ví dụ "Bộ thủ chính biểu ý", "Thành phần biểu âm", "Thành phần kết hợp")
  - strokes: Số nét của thành phần`;

        const response = await generateContentWithRetry({
          model: PRIMARY_FLASH_MODEL,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["word", "pinyin", "hanviet", "translation", "characters"],
              properties: {
                word: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                hanviet: { type: Type.STRING },
                translation: { type: Type.STRING },
                characters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["char", "pinyin", "hanviet", "meaning", "structure", "strokeCount", "mainRadical", "radicalName", "radicalMeaning", "radicalPosition", "mnemonic", "components"],
                    properties: {
                      char: { type: Type.STRING },
                      pinyin: { type: Type.STRING },
                      hanviet: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      structure: { type: Type.STRING },
                      strokeCount: { type: Type.INTEGER },
                      mainRadical: { type: Type.STRING },
                      radicalName: { type: Type.STRING },
                      radicalMeaning: { type: Type.STRING },
                      radicalPosition: { type: Type.STRING },
                      mnemonic: { type: Type.STRING },
                      breakdownTip: { type: Type.STRING, description: "Mẹo chiết tự cấu tạo bộ thủ" },
                      story: { type: Type.STRING, description: "Câu chuyện dễ nhớ liên tưởng sinh động" },
                      components: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          required: ["component", "name", "color", "meaning", "role"],
                          properties: {
                            component: { type: Type.STRING },
                            name: { type: Type.STRING },
                            hanviet: { type: Type.STRING },
                            pinyin: { type: Type.STRING },
                            color: { type: Type.STRING },
                            meaning: { type: Type.STRING },
                            role: { type: Type.STRING },
                            strokes: { type: Type.INTEGER }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        const parsed = parseGeminiJson(response.text || "{}");
        if (parsed.characters && parsed.characters.length > 0) {
          decomposeWordCache[trimmedWord] = parsed;
          return res.json(parsed);
        }
      } catch (geminiErr: any) {
        console.log("Decompose word using local synthesis fallback for:", trimmedWord);
      }
    }

    // Fallback: use precomputed data
    const { PRECOMPUTED_CHARACTERS } = await import("./src/data/hanziDecompositions");
    const chars = Array.from(trimmedWord).filter(c => /[\u4e00-\u9fa5]/.test(c));
    const characterList = chars.map(char => {
      if (PRECOMPUTED_CHARACTERS[char]) {
        return PRECOMPUTED_CHARACTERS[char];
      }
      return {
        char,
        pinyin: "",
        hanviet: "",
        meaning: `Chữ Hán: ${char}`,
        structure: "Cấu tạo chữ Hán chuẩn",
        strokeCount: 0,
        mainRadical: char,
        radicalName: `Bộ thủ ${char}`,
        radicalMeaning: "Thành phần tự nhiên trong chữ",
        radicalPosition: "Bộ phận chính",
        mnemonic: `Chữ ${char} được cấu tạo từ các nét cơ bản tạo nên nghĩa hoàn chỉnh.`,
        components: [
          {
            component: char,
            name: `Chữ ${char}`,
            color: "#dc2626",
            meaning: `Ý nghĩa chính của chữ ${char}`,
            role: "Chữ / Bộ thủ chính"
          }
        ]
      };
    });

    const fallbackResult = {
      word: trimmedWord,
      pinyin: characterList.map(c => c.pinyin).filter(Boolean).join(" "),
      hanviet: characterList.map(c => c.hanviet).filter(Boolean).join(" "),
      translation: characterList.map(c => c.meaning).filter(Boolean).join("; ") || `Từ: ${trimmedWord}`,
      characters: characterList
    };
    decomposeWordCache[trimmedWord] = fallbackResult;
    return res.json(fallbackResult);
  } catch (error: any) {
    console.warn("Decompose word server error:", error?.message || error);
    return res.status(500).json({ error: "Lỗi máy chủ khi phân tích bộ thủ." });
  }
});

// Setup Vite & static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

start();
