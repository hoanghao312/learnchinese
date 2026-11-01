const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const targetStr1 = 'Tạo bài tập cho TẤT CẢ các từ vựng được cung cấp ở trên (mỗi từ ít nhất 1 câu, tổng cộng ${words.length} câu bài tập). Trả về dưới dạng JSON với cấu trúc:';
const repStr1 = 'Bạn phải tạo ra CHÍNH XÁC ${words.length === 1 ? 5 : words.length} câu bài tập. Trả về dưới dạng JSON với cấu trúc:';

content = content.replace(targetStr1, repStr1);
content = content.replace(targetStr1, repStr1);

fs.writeFileSync('server.ts', content);
