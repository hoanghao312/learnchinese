const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

// 1. Remove "Gợi ý 1"
const targetSuggestion1 = `          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInput("Hãy liệt kê 20 từ vựng đầu tiên trong mục chưa biết")}
              className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">Gợi ý 1:</span> Liệt kê 20 từ chưa biết
            </button>
            <button
              type="button"
              onClick={() => setShowStoryModal(true)}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">✨</span> Tạo câu chuyện
            </button>
          </div>`;

const replaceSuggestion1 = `          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowStoryModal(true)}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">✨</span> Tạo câu chuyện
            </button>
          </div>`;

content = content.replace(targetSuggestion1, replaceSuggestion1);

// 2. Change modal button action
const targetModalBtn = `                    setInput(prompt);
                    setShowStoryModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Gợi ý Prompt
                </button>`;

const replaceModalBtn = `                    setShowStoryModal(false);
                    setTimeout(() => {
                      executeChat(prompt, messages);
                    }, 100);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Gửi
                </button>`;

content = content.replace(targetModalBtn, replaceModalBtn);

fs.writeFileSync('src/components/NotebookChat.tsx', content);
