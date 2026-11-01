const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf8');

const targetStr = `                        {ex.shuffledWords.map((word, wordIdx) => {
                          const usedCount = userAnswer.filter(w => w.text === word).length;
                          const totalCount = ex.shuffledWords.filter(w => w === word).length;
                          
                          // If this instance of the word is already used (by index logic approximation)
                          // To make it simple, we just disable if usedCount >= totalCount for this word
                          // But we need to uniquely identify buttons. Let's just count occurrences.
                          const shuffledIndexForThisWord = ex.shuffledWords.slice(0, wordIdx).filter(w => w === word).length;
                          const isUsed = shuffledIndexForThisWord < usedCount;

                          return (
                            <button
                              key={\`bank-\${i}-\${wordIdx}\`}
                              onClick={() => {
                                if (!orderingChecked && !isUsed) {
                                  setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                }
                              }}
                              disabled={isUsed || orderingChecked}
                              className={\`px-4 py-2 rounded-xl border-2 transition-all \${isUsed ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed shadow-none' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50 shadow-sm active:scale-95'}\`}
                              style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }}
                            >
                              {word}
                            </button>
                          )
                        })}`;

const replaceStr = `                        {ex.shuffledWords.map((wordRaw, wordIdx) => {
                          const word = typeof wordRaw === 'string' ? wordRaw : (wordRaw as any).text;
                          const usedCount = userAnswer.filter(w => w.text === word).length;
                          const totalCount = ex.shuffledWords.filter(w => {
                              const wText = typeof w === 'string' ? w : (w as any).text;
                              return wText === word;
                          }).length;
                          
                          const shuffledIndexForThisWord = ex.shuffledWords.slice(0, wordIdx).filter(w => {
                              const wText = typeof w === 'string' ? w : (w as any).text;
                              return wText === word;
                          }).length;
                          const isUsed = shuffledIndexForThisWord < usedCount;

                          return (
                            <button
                              key={\`bank-\${i}-\${wordIdx}\`}
                              onClick={() => {
                                if (!orderingChecked && !isUsed) {
                                  setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                }
                              }}
                              disabled={isUsed || orderingChecked}
                              className={\`px-4 py-2 rounded-xl border-2 transition-all \${isUsed ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed shadow-none' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50 shadow-sm active:scale-95'}\`}
                              style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }}
                            >
                              {word}
                            </button>
                          )
                        })}`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/Practice.tsx', content);
