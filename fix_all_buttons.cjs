const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const allCountTarget = `<div className="text-center text-[15px] font-medium text-slate-500">
                        {allCount}
                      </div>
                      <div></div>
                    </div>`;
const allCountReplacement = `<div className="text-center text-[15px] font-medium text-slate-500">
                        {allCount}
                      </div>
                      <div className="flex justify-center gap-1.5 opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderId('all');
                            setFlashcardMode(displayMode);
                          }}
                          className="w-6 h-6 md:w-7 md:h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-md flex items-center justify-center transition-colors"
                          title="Học Flashcards"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToPractice) onNavigateToPractice('all');
                          }}
                          className="w-6 h-6 md:w-7 md:h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-md flex items-center justify-center transition-colors"
                          title="Luyện tập"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>`;

content = content.replace(allCountTarget, allCountReplacement);


const uncatCountTarget = `<div className="text-center text-[15px] font-medium text-slate-500">
                        {uncategorizedCount}
                      </div>
                      <div></div>
                    </div>`;
const uncatCountReplacement = `<div className="text-center text-[15px] font-medium text-slate-500">
                        {uncategorizedCount}
                      </div>
                      <div className="flex justify-center gap-1.5 opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderId('uncategorized');
                            setFlashcardMode(displayMode);
                          }}
                          className="w-6 h-6 md:w-7 md:h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-md flex items-center justify-center transition-colors"
                          title="Học Flashcards"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToPractice) onNavigateToPractice('uncategorized');
                          }}
                          className="w-6 h-6 md:w-7 md:h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-md flex items-center justify-center transition-colors"
                          title="Luyện tập"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>`;

content = content.replace(uncatCountTarget, uncatCountReplacement);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
