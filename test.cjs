const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');
const target = `<div className="sticky top-[68px] z-30 bg-white dark:bg-slate-900 pb-4 pt-2 -mx-4 px-4 md:-mx-6 md:px-6 mb-6 border-b border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">`;
const replace = `<div className="sticky top-[68px] z-40 bg-white dark:bg-slate-900 pb-4 pt-2 -mx-4 px-4 md:-mx-6 md:px-6 mb-6 border-b border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">`;
content = content.replace(target, replace);
fs.writeFileSync('src/components/SavedWordsList.tsx', content);
