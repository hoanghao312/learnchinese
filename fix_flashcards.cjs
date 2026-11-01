const fs = require('fs');
let content = fs.readFileSync('src/components/Flashcards.tsx', 'utf-8');

content = content.replace(/currentWord\.example\.zh/g, 'currentWord.example.chinese');
content = content.replace(/currentWord\.example\.en/g, 'currentWord.example.vietnamese');

fs.writeFileSync('src/components/Flashcards.tsx', content);
