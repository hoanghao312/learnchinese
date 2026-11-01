const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetAll = `<button
                onClick={() => setActiveFolderId('all')}
                className={\`w-full px-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-start gap-1.5 transition-all \${
                  activeFolderId === 'all'
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }\`}
              >
                <FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Tất cả từ vựng</span>
              </button>
              <div className="absolute right-2 flex gap-1 opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">`;

const repAll = `<div className="relative group flex items-center">
              <button
                onClick={() => setActiveFolderId('all')}
                className={\`w-full px-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-start gap-1.5 transition-all \${
                  activeFolderId === 'all'
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }\`}
              >
                <FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Tất cả từ vựng</span>
              </button>
              <div className="absolute right-2 flex gap-1 opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">`;

content = content.replace(targetAll, repAll);

const targetAllEnd = `<Dumbbell className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => setActiveFolderId('uncategorized')}`;

const repAllEnd = `<Dumbbell className="w-3.5 h-3.5" />
                </button>
              </div>
              </div>
              <div className="relative group flex items-center">
              <button
                onClick={() => setActiveFolderId('uncategorized')}`;

content = content.replace(targetAllEnd, repAllEnd);

const targetUncatEnd = `<Dumbbell className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {folders`;

const repUncatEnd = `<Dumbbell className="w-3.5 h-3.5" />
                </button>
              </div>
              </div>
              
              {folders`;

content = content.replace(targetUncatEnd, repUncatEnd);


const targetFolder = `) : (
                          <>
                            <button
                              onClick={() => setActiveFolderId(f.id)}`;

const repFolder = `) : (
                          <div className="relative w-full flex items-center group">
                            <button
                              onClick={() => setActiveFolderId(f.id)}`;
content = content.replace(targetFolder, repFolder);

const targetFolderEnd = `<Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>`;
const repFolderEnd = `<Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>`;
content = content.replace(targetFolderEnd, repFolderEnd);


fs.writeFileSync('src/components/SavedWordsList.tsx', content);
