const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const targetCloze = `{
      "sentence": "Câu tiếng Trung với chỗ trống được biểu diễn bằng ___",`;
const repCloze = `{
      "targetWord": "Từ vựng mục tiêu (lấy chính xác từ danh sách trên)",
      "sentence": "Câu tiếng Trung với chỗ trống được biểu diễn bằng ___",`;
content = content.replace(targetCloze, repCloze);

const targetOrdering = `{
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3"], // Các từ bị xáo trộn`;
const repOrdering = `{
      "targetWord": "Từ vựng mục tiêu (lấy chính xác từ danh sách trên)",
      "shuffledWords": ["Từ 1", "Từ 2", "Từ 3"], // Các từ bị xáo trộn`;
content = content.replace(targetOrdering, repOrdering);

fs.writeFileSync('server.ts', content);
