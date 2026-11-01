const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf8');

const targetStr = `      const selectedWords = savedWords.slice(0, 50); // limit to avoid heavy payload
      const response = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords, type, requiredTotal: 10 })
      });`;

const replaceStr = `      const selectedWords = savedWords.slice(0, 50); // limit to avoid heavy payload
      // Provide known words (up to 150) to the backend for sentence generation context
      const knownWords = (allSavedWords || []).filter(w => w.isKnown).slice(0, 150);
      
      const response = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use 11 questions as requested: 4 of 6 words, 4 of 7 words, 3 of 8 words.
        body: JSON.stringify({ words: selectedWords, type, requiredTotal: type === 'ordering' ? 11 : 10, knownWords })
      });`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/Practice.tsx', content);
