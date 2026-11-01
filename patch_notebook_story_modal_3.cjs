const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStr = `<button
              type="button"
              onClick={() => setInput("Tạo 5 câu chuyện tiếng trung khoảng 200 từ có chứa toàn bộ 20 từ vựng đó, các từ vựng còn lại lấy trong phần đã biết của mục từ vựng")}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">Gợi ý 2:</span> Tạo câu chuyện từ vựng
            </button>`;

const replaceStr = `<button
              type="button"
              onClick={() => setShowStoryModal(true)}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">✨</span> Tạo câu chuyện
            </button>`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/NotebookChat.tsx', content);
