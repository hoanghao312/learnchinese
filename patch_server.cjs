const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const notebookChatRoute = `
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

    const systemInstruction = \`Bạn là một trợ lý ảo phân tích tài liệu (NotebookLM).
NHIỆM VỤ CỦA BẠN: Trả lời các câu hỏi của người dùng **CHỈ DỰA VÀO** nội dung tài liệu được cung cấp dưới đây.
TUYỆT ĐỐI KHÔNG sử dụng kiến thức bên ngoài hoặc bịa đặt thông tin.
Nếu thông tin để trả lời câu hỏi không có trong tài liệu, hãy trả lời rõ ràng: "Tôi không tìm thấy thông tin này trong tài liệu được cung cấp."

TÀI LIỆU CỦA NGƯỜI DÙNG:
\${documentContext}\`;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2
      },
      history: chatHistory
    });

    const responseStream = await chat.sendMessageStream({ message: message });
    
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    
    for await (const chunk of responseStream) {
      res.write(chunk.text);
    }
    res.end();
  } catch (error) {
    console.error("Notebook Chat API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Lỗi máy chủ khi xử lý notebook chat." });
    } else {
      res.end();
    }
  }
});
`;

code = code.replace('app.post("/api/grammar"', notebookChatRoute + '\napp.post("/api/grammar"');
fs.writeFileSync('server.ts', code);
