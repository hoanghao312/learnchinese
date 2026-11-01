const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const translateTarget = `    if (process.env.GEMINI_API_KEY) {
      const prompt = \`Dịch đoạn văn tiếng Trung sau sang tiếng Việt một cách tự nhiên nhất. Chỉ xuất ra kết quả dịch, tuyệt đối không giải thích thêm:\n"\${text}"\`;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.3
        }
      });
      return res.json({ translation: response.text?.trim() || "" });
    }`;

const translateReplacement = `    if (process.env.GEMINI_API_KEY) {
      const prompt = \`Dịch đoạn văn tiếng Trung sau sang tiếng Việt một cách tự nhiên nhất. Chỉ xuất ra kết quả dịch, tuyệt đối không giải thích thêm:\n"\${text}"\`;
      
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.3
        }
      });

      for await (const chunk of responseStream) {
        res.write(chunk.text);
      }
      return res.end();
    }`;

content = content.replace(translateTarget, translateReplacement);
fs.writeFileSync('server.ts', content);
