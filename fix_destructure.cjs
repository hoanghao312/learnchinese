const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const target = `  onResetProgress,
  onUpdateWord,
  onSelectWord,
  onAddWord,
  onAddWords,
}: SavedWordsListProps) {`;

const replacement = `  onResetProgress,
  onNavigateToPractice,
  onUpdateWord,
  onSelectWord,
  onAddWord,
  onAddWords,
}: SavedWordsListProps) {`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/SavedWordsList.tsx', content);
