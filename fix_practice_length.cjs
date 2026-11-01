const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

content = content.replace(/if \\(savedWords\\.length < 5\\) \\{/g, 'if (savedWords.length < 1) {');
content = content.replace(/alert\\("Bạn cần lưu ít nhất 5 từ vựng để tạo bài tập!"\\);/g, 'alert("Bạn cần lưu ít nhất 1 từ vựng để tạo bài tập!");');

content = content.replace(/const selectedWords = shuffled\\.slice\\(0, 10\\);/g, 'const selectedWords = shuffled;');

fs.writeFileSync('src/components/Practice.tsx', content);
