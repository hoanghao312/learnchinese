const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const spanTarget = `className={\`word-token-element text-[18px] font-bold transition leading-none select-none \${isDuplicate ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-900/30 dark:border-rose-600 px-1.5 py-1 -ml-1.5 rounded-sm text-slate-800 dark:text-slate-100' : 'text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400'}\`}`;
const spanReplacement = `className="word-token-element text-[18px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition leading-none select-none"`;
content = content.replace(spanTarget, spanReplacement);

const rowTarget = 'className={`group relative flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 border ${isSelected ? \'border-amber-400 bg-slate-200 dark:bg-slate-700\' : \'border-slate-200 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-700/80\'} rounded-xl px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300 w-full select-none`}';
const rowReplacement = 'className={`group relative flex items-center gap-2 cursor-pointer ${isDuplicate ? \'bg-rose-50/50 dark:bg-rose-900/20\' : \'bg-white dark:bg-slate-900\'} border ${isSelected ? \'border-amber-400 bg-slate-200 dark:bg-slate-700\' : isDuplicate ? \'border-rose-300 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-600\' : \'border-slate-200 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-700/80\'} rounded-xl px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300 w-full select-none`}';
content = content.replace(rowTarget, rowReplacement);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
