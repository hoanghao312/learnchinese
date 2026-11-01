const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  '<Practice \n              savedWords={wordsForPractice}',
  '<Practice \n              allSavedWords={savedWords}\n              savedWords={wordsForPractice}'
);
fs.writeFileSync('src/App.tsx', content);
