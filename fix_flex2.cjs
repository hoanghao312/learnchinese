const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const t2 = 'className={`p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] ${';
const r2 = 'className={`flex-1 p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] ${';
content = content.replace(t2, r2);
content = content.replace(t2, r2); // two times for two buttons

fs.writeFileSync('src/components/TextReader.tsx', content);
