const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// Title
content = content.replace('className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"', 'className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"');
content = content.replace('<Book className="w-5 h-5 text-amber-500" />', '<Book className="w-4 h-4 text-amber-500" />');

// Search bar
content = content.replace('className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50', 'className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50');
content = content.replace('<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />', '<Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />');

// Mode toggle
content = content.replace('className="flex w-full sm:w-auto bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 sm:p-1 shrink-0"', 'className="flex w-full sm:w-auto bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0"');
content = content.replace(/px-4 py-2 sm:px-3 sm:py-1\.5 rounded-xl text-sm sm:text-xs/g, 'px-2.5 py-1 rounded-lg text-[11px] sm:text-[11px]');

// Flashcards button
content = content.replace('className="px-3 py-2.5 sm:p-2.5 rounded-2xl border transition-all', 'className="px-2.5 py-1.5 rounded-xl border transition-all');
content = content.replace('<span className="text-sm font-semibold hidden sm:inline whitespace-nowrap">Flashcards</span>', '<span className="text-[11px] font-semibold hidden sm:inline whitespace-nowrap">Flashcards</span>');

// Import / Export / Add buttons
content = content.replace(/relative p-2\.5 rounded-2xl border transition-all/g, 'relative p-1.5 rounded-xl border transition-all');
content = content.replace(/p-2\.5 rounded-2xl border transition-all/g, 'p-1.5 rounded-xl border transition-all');
content = content.replace(/className="w-4 h-4"/g, 'className="w-3.5 h-3.5"');
content = content.replace(/<Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" \/>/g, '<Plus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />'); // check this line


// Filter buttons
content = content.replace(/px-4 py-2 sm:px-3 sm:py-1\.5 rounded-xl text-sm/g, 'px-2.5 py-1.5 rounded-lg text-xs');
content = content.replace(/px-3 py-1\.5 rounded-lg border border-amber-200/g, 'px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs');

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
console.log('Made contents smaller');
