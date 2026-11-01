const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const regex1 = /\{showPinyin && !isPunctuation && <span className="text-\[10px\] text-slate-500 font-sans leading-none mb-\[2px\]">\{pinyinArr\[i\]\}<\/span>\}/g;
content = content.replace(regex1, `{showPinyin && !isPunctuation && <span className="text-[10px] text-slate-500 font-sans leading-none mb-[2px] select-none">{pinyinArr[i]}</span>}`);

const regex2 = /\{!isPunctuation && <span className="text-\[13px\] text-\[\#0066FF\] dark:text-\[\#3b82f6\] mb-0\.5 font-medium">\{pinyinArr\[i\]\}<\/span>\}/g;
content = content.replace(regex2, `{!isPunctuation && <span className="text-[13px] text-[#0066FF] dark:text-[#3b82f6] mb-0.5 font-medium select-none">{pinyinArr[i]}</span>}`);

fs.writeFileSync('src/components/TextReader.tsx', content);
