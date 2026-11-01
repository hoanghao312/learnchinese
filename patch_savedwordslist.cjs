const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf8');

// 1. Hide filter icon when not activeFilter
const filterBtnStr = `<button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={\`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl border text-xs font-medium transition-colors \${showAdvancedFilters ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}\`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lọc & Sắp xếp</span>
            </button>`;
            
const filterBtnRep = `{ (activeFilter === 'learning' || activeFilter === 'known') && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={\`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl border text-xs font-medium transition-colors \${showAdvancedFilters ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}\`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lọc & Sắp xếp</span>
            </button>
            )}`;

content = content.replace(filterBtnStr, filterBtnRep);

// 2. Adjust Grid for Folder list
const headerStr = `<div className="grid grid-cols-[1fr_40px] md:grid-cols-[1fr_120px] items-center px-2 md:px-4 py-3 text-[11px] md:text-[14px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 uppercase tracking-wider select-none">
                <div className="pl-6 md:pl-6 md:pl-[44px]">Tên thư mục</div>
                <div className="text-center"><span className="hidden md:inline">Số lượng từ</span><span className="md:hidden">Từ</span></div>
              </div>`;

const headerRep = `<div className="grid grid-cols-[1fr_40px] md:grid-cols-[5fr_3fr] items-center px-2 md:px-4 py-3 text-[11px] md:text-[14px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 uppercase tracking-wider select-none">
                <div className="pl-6 md:pl-6 md:pl-[44px]">Tên thư mục</div>
                <div className="text-center md:text-left"><span className="hidden md:inline">Số lượng từ</span><span className="md:hidden">Từ</span></div>
              </div>`;
content = content.replace(headerStr, headerRep);

content = content.replaceAll(
  `md:grid-cols-[1fr_120px]`,
  `md:grid-cols-[5fr_3fr]`
);

content = content.replaceAll(
  `<div className="text-center text-[15px] font-medium text-slate-500">`,
  `<div className="text-center md:text-left text-[15px] font-medium text-slate-500">`
);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
