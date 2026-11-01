const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStr = `        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700/50">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-3xl mx-auto">
            <div className="relative w-full bg-slate-100 dark:bg-slate-700/50 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-slate-300 dark:focus-within:ring-slate-500 transition-all shadow-sm">`;

const replaceStr = `        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700/50">
          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInput("Hãy liệt kê 20 từ vựng đầu tiên trong mục chưa biết")}
              className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">Gợi ý 1:</span> Liệt kê 20 từ chưa biết
            </button>
            <button
              type="button"
              onClick={() => setInput("Tạo 5 câu chuyện tiếng trung khoảng 200 từ có chứa toàn bộ 20 từ vựng đó, các từ vựng còn lại lấy trong phần đã biết của mục từ vựng")}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">Gợi ý 2:</span> Tạo câu chuyện từ vựng
            </button>
          </div>
          <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-3xl mx-auto">
            <div className="relative w-full bg-slate-100 dark:bg-slate-700/50 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-slate-300 dark:focus-within:ring-slate-500 transition-all shadow-sm">`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/NotebookChat.tsx', content);
