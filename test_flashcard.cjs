const fs = require('fs');
const content = fs.readFileSync('src/components/Flashcards.tsx', 'utf-8');
console.log("Found selectedFolderId filter?", content.includes('w.folderId !== selectedFolderId'));
