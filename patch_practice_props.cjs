const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf8');

content = content.replace(
  '  savedWords: SavedWord[];',
  '  allSavedWords?: SavedWord[];\n  savedWords: SavedWord[];'
);

content = content.replace(
  'export default function Practice({ savedWords, autoGenerateTimestamp, autoGenerateType, onUpdateWord, onBack }: PracticeProps) {',
  'export default function Practice({ allSavedWords = [], savedWords, autoGenerateTimestamp, autoGenerateType, onUpdateWord, onBack }: PracticeProps) {'
);

fs.writeFileSync('src/components/Practice.tsx', content);
