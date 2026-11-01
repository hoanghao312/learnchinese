const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const target1 = `          {/* Header Row (Desktop) */}
          {filteredWords.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">`;

const replace1 = `          {/* Header Row (Desktop) */}
          {filteredWords.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-[210px] bg-white dark:bg-slate-900 z-20 shadow-sm">`;

if (content.includes(target1)) {
    content = content.replace(target1, replace1);
    console.log("Header made sticky");
}

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
