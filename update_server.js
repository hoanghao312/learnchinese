const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const oldCode = `    const { words, type, requiredTotal } = req.body;
    
    if (!words || words.length === 0) {
      return res.status(400).json({ error: "Không có từ vựng" });
    }

    const wordListStr = words.map((w: any) => \`\${w.text} (\${w.pinyin}): \${w.translation}\`).join("\\n");
    const count = requiredTotal || (words.length === 1 ? 5 : words.length);`;

const newCode = `    const { words, type, requiredTotal, targetWordForContext, contextWords } = req.body;
    
    if ((!words || words.length === 0) && !targetWordForContext) {
      return res.status(400).json({ error: "Không có từ vựng" });
    }

    let wordListStr = "";
    if (words && words.length > 0) {
      wordListStr = words.map((w: any) => \`\${w.text} (\${w.pinyin}): \${w.translation}\`).join("\\n");
    }
    
    let contextStr = "";
    if (contextWords && contextWords.length > 0) {
       contextStr = contextWords.map((w: any) => \`\${w.text}\`).join(", ");
    }

    const count = requiredTotal || (words && words.length === 1 ? 5 : (words ? words.length : 10));`;

content = content.replace(oldCode, newCode);

const oldPromptOrdering = `      prompt = \`Tạo một bài tập sắp xếp từ thành câu tiếng Trung sử dụng các từ vựng sau đây.
Từ vựng:
\${wordListStr}

Bạn phải tạo ra CHÍNH XÁC \${count} câu bài tập.
YÊU CẦU QUAN TRỌNG: MỖI CÂU TIẾNG TRUNG PHẢI CÓ TỪ 6 ĐẾN 8 TỪ (tính theo số từ trong mảng shuffledWords). Không dài hơn và không ngắn hơn.

Trả về dưới dạng JSON với cấu trúc:`;

const newPromptOrdering = `      if (targetWordForContext && contextWords) {
        prompt = \`Tạo \${count} câu bài tập sắp xếp từ thành câu tiếng Trung. 
Mục tiêu là luyện tập từ vựng: \${targetWordForContext.text} (\${targetWordForContext.pinyin} - \${targetWordForContext.translation}).
YÊU CẦU QUAN TRỌNG:
1. Bạn phải tạo ra CHÍNH XÁC \${count} câu bài tập. TẤT CẢ \${count} câu đều phải chứa từ "\${targetWordForContext.text}".
2. CÁC TỪ VỰNG KHÁC TRONG CÂU: Bạn CHỈ ĐƯỢC PHÉP sử dụng các từ vựng trong danh sách sau đây để cấu tạo phần còn lại của câu (không được dùng từ ngoài danh sách này, trừ các hư từ cơ bản như 的, 了, 在 nếu bắt buộc):
Danh sách từ vựng cho phép: \${contextStr}
3. MỖI CÂU TIẾNG TRUNG PHẢI CÓ TỪ 6 ĐẾN 8 TỪ (thành phần trong shuffledWords).

Trả về dưới dạng JSON với cấu trúc:\`;
      } else {
        prompt = \`Tạo một bài tập sắp xếp từ thành câu tiếng Trung sử dụng các từ vựng sau đây.
Từ vựng:
\${wordListStr}

Bạn phải tạo ra CHÍNH XÁC \${count} câu bài tập.
YÊU CẦU QUAN TRỌNG: MỖI CÂU TIẾNG TRUNG PHẢI CÓ TỪ 6 ĐẾN 8 TỪ (tính theo số từ trong mảng shuffledWords). Không dài hơn và không ngắn hơn.

Trả về dưới dạng JSON với cấu trúc:\`;
      }`;

content = content.replace(oldPromptOrdering, newPromptOrdering);

fs.writeFileSync('server.ts', content);
console.log("Updated server.ts successfully");
