const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const headerBlock = `                {/* Header for user folders */}
                <div className="grid grid-cols-[1fr_40px_120px] md:grid-cols-[1fr_120px_140px] items-center px-2 md:px-4 py-3 text-[11px] md:text-[14px] font-bold text-slate-500 dark:text-slate-400 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 uppercase tracking-wider sticky top-[170px] z-20 shadow-sm mt-2">
                  <div className="pl-6 md:pl-6 md:pl-[44px]">Tên thư mục</div>
                  <div className="text-center"><span className="hidden md:inline">Số lượng từ</span><span className="md:hidden">Từ</span></div>
                  <div className="text-center">Thao tác</div>
                </div>

`;

content = content.replace(headerBlock, "");

const insertTarget = `            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
`;
const newHeader = `            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_40px_120px] md:grid-cols-[1fr_120px_140px] items-center px-2 md:px-4 py-3 text-[11px] md:text-[14px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 uppercase tracking-wider sticky top-[170px] z-20 shadow-sm">
                <div className="pl-6 md:pl-6 md:pl-[44px]">Tên thư mục</div>
                <div className="text-center"><span className="hidden md:inline">Số lượng từ</span><span className="md:hidden">Từ</span></div>
                <div className="text-center">Thao tác</div>
              </div>
`;

content = content.replace(insertTarget, newHeader);
fs.writeFileSync('src/components/SavedWordsList.tsx', content);
