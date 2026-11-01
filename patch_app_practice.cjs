const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  '<Practice savedWords={wordsForPractice} autoGenerateTimestamp={practiceTrigger.timestamp} autoGenerateType={practiceTrigger.type} />',
  '<Practice savedWords={wordsForPractice} autoGenerateTimestamp={practiceTrigger.timestamp} autoGenerateType={practiceTrigger.type} onUpdateWord={handleUpdateSavedWord} />'
);

fs.writeFileSync('src/App.tsx', content);
