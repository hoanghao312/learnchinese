const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const targetClozeBtn = `<button onClick={() => handleSaveExercise(ex, 'cloze')} className="text-slate-400 hover:text-amber-500 transition-colors p-1" title="Lưu bài tập này">
                        <Bookmark className="w-5 h-5" />
                      </button>`;
const repClozeBtn = `
                      {(() => {
                        const word = savedWords.find(w => w.text === ex.targetWord || w.text === ex.answer);
                        const isSaved = word?.savedExercises?.cloze?.some(e => e.sentence === ex.sentence);
                        return (
                          <button onClick={() => handleSaveExercise(ex, 'cloze')} className={\`transition-colors p-1 \${isSaved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}\`} title={isSaved ? "Bỏ lưu bài tập này" : "Lưu bài tập này"}>
                            <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                          </button>
                        );
                      })()}
`;
content = content.replace(targetClozeBtn, repClozeBtn);


const targetOrderBtn = `<button onClick={() => handleSaveExercise(ex, 'ordering')} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Lưu bài tập này">
                          <Bookmark className="w-5 h-5" />
                        </button>`;
const repOrderBtn = `
                      {(() => {
                        const word = savedWords.find(w => w.text === ex.targetWord || ex.correctSentence.includes(w.text));
                        const isSaved = word?.savedExercises?.ordering?.some(e => e.correctSentence === ex.correctSentence);
                        return (
                          <button onClick={() => handleSaveExercise(ex, 'ordering')} className={\`transition-colors p-1 \${isSaved ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}\`} title={isSaved ? "Bỏ lưu bài tập này" : "Lưu bài tập này"}>
                            <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                          </button>
                        );
                      })()}
`;
content = content.replace(targetOrderBtn, repOrderBtn);

fs.writeFileSync('src/components/Practice.tsx', content);
