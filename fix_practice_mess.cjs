const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// 1. In cloze section, let's find the injected ordering block and remove it.
const clozeInjection = `                    <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="font-bold text-slate-400 mb-1 flex items-center gap-1">
                            Câu {i + 1}:
                            {orderingChecked && (
                              isCorrect 
                                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                : <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                          {showPinyin && <div className="text-sm text-slate-500">{ex.pinyin}</div>}
                        </div>
                        
                      {(() => {
                        const word = savedWords.find(w => w.text === ex.targetWord || ex.correctSentence.includes(w.text));
                        const isSaved = word?.savedExercises?.ordering?.some(e => e.correctSentence === ex.correctSentence);
                        return (
                          <button onClick={() => handleSaveExercise(ex, 'ordering')} className={\`transition-colors p-1 \${isSaved ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}\`} title={isSaved ? "Bỏ lưu bài tập này" : "Lưu bài tập này"}>
                            <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                          </button>
                        );
                      })()}
                      </div>`;

content = content.replace(clozeInjection, '');

// 2. In ordering section, replace the old pinyin block with the proper ordering block.
const orderingTarget = `{showPinyin ? <div className="text-sm text-slate-500 mb-6">{ex.pinyin}</div> : <div className="mb-6"></div>}`;

const orderingReplacement = `
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="font-bold text-slate-400 mb-1 flex items-center gap-1">
                            Câu {i + 1}:
                            {orderingChecked && (
                              isCorrect 
                                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                : <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                          {showPinyin && <div className="text-sm text-slate-500">{ex.pinyin}</div>}
                        </div>
                        
                        {(() => {
                          const word = savedWords.find(w => w.text === ex.targetWord || ex.correctSentence.includes(w.text));
                          const isSaved = word?.savedExercises?.ordering?.some(e => e.correctSentence === ex.correctSentence);
                          return (
                            <button onClick={() => handleSaveExercise(ex, 'ordering')} className={\`transition-colors p-1 \${isSaved ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}\`} title={isSaved ? "Bỏ lưu bài tập này" : "Lưu bài tập này"}>
                              <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                            </button>
                          );
                        })()}
                      </div>
`;

content = content.replace(orderingTarget, orderingReplacement);

fs.writeFileSync('src/components/Practice.tsx', content);
