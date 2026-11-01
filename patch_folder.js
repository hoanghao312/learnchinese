const fs = require('fs');
let code = fs.readFileSync('src/components/SavedLessonsList.tsx', 'utf8');

code = code.replace(
  /<div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">[\s\S]*?<Folder className="w-8 h-8 fill-blue-500\/20" \/>[\s\S]*?<\/div>[\s\S]*?<span className="font-semibold text-slate-700 text-center line-clamp-1 w-full">{folder.name}<\/span>[\s\S]*?<span className="text-xs text-slate-400 mt-1">{count} bài đọc<\/span>/g,
  `<div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Folder className="w-6 h-6 fill-blue-500/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold text-slate-700 line-clamp-1">{folder.name}</span>
                      <span className="block text-sm text-slate-400 mt-0.5">{count} bài đọc</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />`
);

fs.writeFileSync('src/components/SavedLessonsList.tsx', code);
