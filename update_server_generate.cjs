const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr1 = `    const { words, type, requiredTotal, targetWordForContext, contextWords } = req.body;`;
const repStr1 = `    const { words, type, requiredTotal, targetWordForContext, contextWords, knownWords } = req.body;`;
content = content.replace(targetStr1, repStr1);

const targetStr2 = `    } else if (type === 'ordering') {
      if (targetWordForContext && contextWords) {`;

const repStr2 = `    } else if (type === 'ordering') {
      let knownWordsStr = "";
      if (knownWords && knownWords.length > 0) {
          knownWordsStr = knownWords.map((w: any) => w.text).join(", ");
      }
      
      if (targetWordForContext && contextWords) {`;
content = content.replace(targetStr2, repStr2);

// Now update the else block for ordering
const targetStr3 = `      } else {
        prompt = \`Tạo một bài tập sắp xếp từ thành câu tiếng Trung sử dụng các từ vựng sau đây.
Từ vựng:
\${wordListStr}

Bạn phải tạo ra CHÍNH XÁC \${count} câu bài tập.
YÊU CẦU QUAN TRỌNG: MỖI CÂU TIẾNG TRUNG PHẢI CÓ TỪ 6 ĐẾN 8 TỪ (tính theo số từ trong mảng \`shuffledWords\`). Không dài hơn và không ngắn hơn.

Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "targetWord": "Từ vựng mục tiêu (lấy chính xác từ danh sách trên)",
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3", "Từ 4", "Từ 5", "Từ 6"], // Các từ bị xáo trộn, MỖI CÂU PHẢI CÓ TỪ 6 ĐẾN 8 TỪ (thành phần).
      "correctSentence": "Câu tiếng Trung hoàn chỉnh (tương ứng với các từ trong shuffledWords ghép lại)",
      "pinyin": "Pinyin của câu",
      "translation": "Nghĩa tiếng Việt của câu"
    }
  ]
}\`;
      }`;

const repStr3 = `      } else {
        prompt = \`Tạo bài tập sắp xếp từ thành câu tiếng Trung sử dụng các TỪ VỰNG MỤC TIÊU sau đây.
Từ vựng mục tiêu (từ cần học):
\${wordListStr}

\${knownWordsStr ? \`Các từ vựng đã biết (để tạo ngữ cảnh):\\n\${knownWordsStr}\` : ''}

Bạn phải tạo ra CHÍNH XÁC \${count} câu bài tập.
YÊU CẦU QUAN TRỌNG: 
1. Mỗi câu trong bài tập phải chứa ĐÚNG 1 từ nằm trong "Từ vựng mục tiêu". 
2. Các từ còn lại trong câu phải được chọn từ "Các từ vựng đã biết" ở trên (có thể thêm các hư từ cơ bản như 的, 了, 在, 是 nếu thực sự cần thiết).
3. ĐỘ DÀI CÂU (tính theo số từ trong mảng shuffledWords): 
   - 4 câu đầu tiên: CHÍNH XÁC 6 từ
   - 4 câu tiếp theo: CHÍNH XÁC 7 từ
   - 3 câu cuối cùng: CHÍNH XÁC 8 từ
   (Tổng cộng 11 câu nếu \${count} là 11, nếu ít hơn thì phân bổ độ dài tương tự tăng dần).

Trả về dưới dạng JSON với cấu trúc:
{
  "exercises": [
    {
      "targetWord": "Từ vựng mục tiêu (lấy đúng 1 từ trong danh sách cần học)",
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3", "Từ 4", "Từ 5", "Từ 6"], // Các từ bị xáo trộn, đúng số lượng từ yêu cầu
      "correctSentence": "Câu tiếng Trung hoàn chỉnh (tương ứng với các từ trong shuffledWords ghép lại)",
      "pinyin": "Pinyin của câu",
      "translation": "Nghĩa tiếng Việt của câu"
    }
  ]
}\`;
      }`;
      
content = content.replace(targetStr3, repStr3);

fs.writeFileSync('server.ts', content);
