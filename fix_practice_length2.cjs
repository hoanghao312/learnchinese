const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const t1 = `if (savedWords.length < 5) {
      alert("Bạn cần lưu ít nhất 5 từ vựng để tạo bài tập!");`;
const r1 = `if (savedWords.length < 1) {
      alert("Bạn cần lưu ít nhất 1 từ vựng để tạo bài tập!");`;
content = content.replace(t1, r1);

const t2 = `const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, 10);`;
const r2 = `const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled; // Lấy tất cả từ vựng`;
content = content.replace(t2, r2);

fs.writeFileSync('src/components/Practice.tsx', content);
