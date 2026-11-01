const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStr = 'const constraintsStr = `\\n\\nYÊU CẦU QUAN TRỌNG:\\n1. Tạo chính xác ${storyCount} câu chuyện khác nhau.\\n2. CHỈ trả về phần văn bản tiếng Trung của (các) câu chuyện. KHÔNG trả về pinyin, KHÔNG dịch nghĩa tiếng Việt, và KHÔNG liệt kê lại danh sách từ vựng.`;';

const replaceStr = 'const constraintsStr = `\\n\\nYÊU CẦU QUAN TRỌNG:\\n1. Tạo chính xác ${storyCount} câu chuyện khác nhau.\\n2. CHỈ trả về phần văn bản tiếng Trung của (các) câu chuyện. Tuyệt đối KHÔNG sử dụng tiếng Anh hay bất kỳ ngôn ngữ nào khác. KHÔNG trả về pinyin, KHÔNG dịch nghĩa tiếng Việt, và KHÔNG liệt kê lại danh sách từ vựng. Toàn bộ câu trả lời PHẢI là 100% tiếng Trung (chỉ giữ lại ký hiệu in đậm **).`;';

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/NotebookChat.tsx', content);
