const fs = require('fs');
let content = fs.readFileSync('src/components/Flashcards.tsx', 'utf-8');
console.log("length:", content.length);
