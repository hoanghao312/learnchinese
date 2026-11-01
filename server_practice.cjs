const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const routeTarget = `app.post("/api/translate", async (req, res): Promise<any> => {`;
const newRoute = `app.post("/api/practice/generate", async (req, res): Promise<any> => {
  try {
    const { words, type } = req.body;
    
    if (!words || words.length === 0) {
      return res.status(400).json({ error: "Không có từ vựng" });
    }

    const wordListStr = words.map((w: any) => \`\${w.text} (\${w.pinyin}): \${w.translation}\`).join("\\n");
    
    let prompt = "";
    if (type === 'cloze') {
      prompt = \`Tạo một bài tập đục lỗ (điền từ vào chỗ trống) tiếng Trung sử dụng các từ vựng sau đây.
Từ vựng:
\${wordListStr}

Bạn phải tạo ra CHÍNH XÁC 5 câu bài tập. Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "sentence": "Câu tiếng Trung với chỗ trống được biểu diễn bằng ___",
      "pinyin": "Pinyin của câu đó, giữ nguyên ___ cho chỗ trống",
      "translation": "Nghĩa tiếng Việt của câu",
      "answer": "Từ tiếng Trung chính xác điền vào chỗ trống",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"] // Phải chứa đáp án đúng và 3 đáp án sai
    }
  ]
}\`;
    } else if (type === 'ordering') {
      prompt = \`Tạo một bài tập sắp xếp từ thành câu tiếng Trung sử dụng các từ vựng sau đây.
Từ vựng:
\${wordListStr}

Bạn phải tạo ra CHÍNH XÁC 5 câu bài tập. Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3"], // Các từ bị xáo trộn
      "correctSentence": "Câu tiếng Trung hoàn chỉnh",
      "pinyin": "Pinyin của câu",
      "translation": "Nghĩa tiếng Việt của câu"
    }
  ]
}\`;
    } else {
      return res.status(400).json({ error: "Loại bài tập không hợp lệ" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error) {
    console.error("Practice generation error:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ khi tạo bài tập" });
  }
});

app.post("/api/translate", async (req, res): Promise<any> => {`;

content = content.replace(routeTarget, newRoute);
fs.writeFileSync('server.ts', content);
