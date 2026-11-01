const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const target = `app.post("/api/translate", async (req, res): Promise<any> => {`;

const newEndpoint = `// API endpoint to analyze Chinese grammar structure
app.post("/api/grammar", async (req, res): Promise<any> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing text to analyze." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key not configured." });
    }

    const prompt = \`Phân tích cấu trúc ngữ pháp và từ vựng của câu tiếng Trung sau: "\${text}".
Vui lòng xuất ra ĐÚNG định dạng Markdown giống như mẫu sau, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI:

**\${text}**
[Phân tích từng từ cách nhau bởi dấu +, ví dụ: 很 + 高兴 + 认识 + 你]

Có thể hiểu:
- [Từ 1] = [Loại từ] (ví dụ: phó từ, tính từ, động từ, tân ngữ...)
- [Từ 2] = [Loại từ]
...

📌 Cấu trúc:
[Cấu trúc công thức, ví dụ: 很 + Adj + V + O]

> \${text}
> [Ý nghĩa tiếng Việt]

Chỉ trả về nội dung phân tích theo chuẩn Markdown, không thêm lời chào hay giải thích gì thêm ngoài mẫu trên.\`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    if (response.text) {
      return res.json({ analysis: response.text });
    } else {
      return res.status(500).json({ error: "Could not analyze text." });
    }
  } catch (err) {
    console.error("Error in /api/grammar:", err);
    return res.status(500).json({ error: "Lỗi máy chủ khi phân tích ngữ pháp." });
  }
});

`;

content = content.replace(target, newEndpoint + target);
fs.writeFileSync('server.ts', content);
