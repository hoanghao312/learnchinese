const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// 1. Add Dumbbell import if not present
if (!content.includes('Dumbbell')) {
  content = content.replace('Trash2,', 'Trash2, Dumbbell,');
}

// 2. Replace the first group (around line 695)
const target1 = `<button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveFolderId(f.id);
                                  setFlashcardMode(displayMode);
                                }}
                                className="w-6 h-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-md flex items-center justify-center transition-colors"
                                title="Học Flashcards"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>`;
const rep1 = `<button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveFolderId(f.id);
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
                                  if (onNavigateToPractice) onNavigateToPractice(f.id);
                                }}
                                className="w-6 h-6 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-md flex items-center justify-center transition-colors"
                                title="Luyện tập"
                              >
                                <Dumbbell className="w-3.5 h-3.5" />
                              </button>`;

content = content.replace(target1, rep1);

// 3. Replace the second group (around line 895)
const target2 = `<button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFolderId(f.id);
                                  setFlashcardMode(displayMode);
                                }}
                                className="w-6 h-6 md:w-7 md:h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-md flex items-center justify-center transition-colors"
                                title="Học Flashcards"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>`;
const rep2 = `<button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFolderId(f.id);
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
                                  if (onNavigateToPractice) onNavigateToPractice(f.id);
                                }}
                                className="w-6 h-6 md:w-7 md:h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-md flex items-center justify-center transition-colors"
                                title="Luyện tập"
                              >
                                <Dumbbell className="w-3.5 h-3.5" />
                              </button>`;
content = content.replace(target2, rep2);


fs.writeFileSync('src/components/SavedWordsList.tsx', content);
