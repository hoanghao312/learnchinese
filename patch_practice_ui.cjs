const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const targetClozeNum = `<div className="text-lg text-slate-800 dark:text-slate-100 mb-2 font-medium" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                      {i + 1}. {ex.sentence.split('___').map((part, idx, arr) => (`;
const repClozeNum = `<div className="flex justify-between items-start mb-2">
                      <div className="text-lg text-slate-800 dark:text-slate-100 font-medium" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                        <span className="font-sans font-bold text-slate-400 mr-2">Câu {i + 1}:</span>
                        {ex.sentence.split('___').map((part, idx, arr) => (`;
content = content.replace(targetClozeNum, repClozeNum);

const targetClozeClose = `                        </React.Fragment>
                      ))}
                    </div>`;
const repClozeClose = `                        </React.Fragment>
                      ))}
                      </div>
                      <button onClick={() => handleSaveExercise(ex, 'cloze')} className="text-slate-400 hover:text-amber-500 transition-colors p-1" title="Lưu bài tập này">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>`;
content = content.replace(targetClozeClose, repClozeClose);


const targetOrderingTop = `{showPinyin ? <div className="text-sm text-slate-500 mb-6">{ex.pinyin}</div> : <div className="mb-6"></div>}`;
const repOrderingTop = `<div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="font-bold text-slate-400 mb-1">Câu {i + 1}:</div>
                          {showPinyin && <div className="text-sm text-slate-500">{ex.pinyin}</div>}
                        </div>
                        <button onClick={() => handleSaveExercise(ex, 'ordering')} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Lưu bài tập này">
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>`;
content = content.replace(targetOrderingTop, repOrderingTop);

fs.writeFileSync('src/components/Practice.tsx', content);
