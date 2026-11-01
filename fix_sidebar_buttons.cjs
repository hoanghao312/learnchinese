const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetAll = `<FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Tất cả từ vựng</span>
              </button>
              <button
                onClick={() => setActiveFolderId('uncategorized')}`;

const repAll = `<FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Tất cả từ vựng</span>
              </button>
              <div className="absolute right-2 flex gap-1 opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveFolderId('all');
                    setFlashcardMode(displayMode);
                  }}
                  className="w-6 h-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-md flex items-center justify-center transition-colors"
                  title="Học Flashcards"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (onNavigateToPractice) onNavigateToPractice('all');
                  }}
                  className="w-6 h-6 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-md flex items-center justify-center transition-colors"
                  title="Luyện tập"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => setActiveFolderId('uncategorized')}`;

content = content.replace(targetAll, repAll);

const targetUncat = `<FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Chưa phân loại</span>
              </button>
              
              {folders`;

const repUncat = `<FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Chưa phân loại</span>
              </button>
              <div className="absolute right-2 flex gap-1 opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveFolderId('uncategorized');
                    setFlashcardMode(displayMode);
                  }}
                  className="w-6 h-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-md flex items-center justify-center transition-colors"
                  title="Học Flashcards"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (onNavigateToPractice) onNavigateToPractice('uncategorized');
                  }}
                  className="w-6 h-6 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-md flex items-center justify-center transition-colors"
                  title="Luyện tập"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {folders`;

content = content.replace(targetUncat, repUncat);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
