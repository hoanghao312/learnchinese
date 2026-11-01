const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');
console.log(content.match(/activeFolderId && activeFolderId !== 'uncategorized' && activeFolderId !== 'all'.{0,100}/g));
