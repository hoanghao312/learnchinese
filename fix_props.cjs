const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const interfaceTarget = `onResetProgress?: (folderId: string | null, mode: 'zh-vi' | 'vi-zh') => void;`;
const interfaceReplacement = `onResetProgress?: (folderId: string | null, mode: 'zh-vi' | 'vi-zh') => void;
  onNavigateToPractice?: (folderId: string | 'all' | 'uncategorized') => void;`;

content = content.replace(interfaceTarget, interfaceReplacement);

const propsTarget = `  onResetProgress
}: SavedWordsListProps) {`;
const propsReplacement = `  onResetProgress,
  onNavigateToPractice
}: SavedWordsListProps) {`;
content = content.replace(propsTarget, propsReplacement);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
