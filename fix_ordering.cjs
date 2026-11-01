const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// 1. Change State Type
content = content.replace(
  /const \[orderingAnswers, setOrderingAnswers\] = useState<Record<number, string\[\]>>\(\{\}\);/,
  'const [orderingAnswers, setOrderingAnswers] = useState<Record<number, {id: string, text: string}[]>>({});'
);

// 2. Change getWordCounts to use text
content = content.replace(
  /const answerCounts = getWordCounts\(userAnswer\);/,
  'const answerCounts = getWordCounts(userAnswer.map(u => u.text));'
);

// 3. Change isCorrect to use text
content = content.replace(
  /const isCorrect = normalize\(userAnswer\.join\(''\)\) === normalize\(ex\.correctSentence\);/,
  "const isCorrect = normalize(userAnswer.map(u => u.text).join('')) === normalize(ex.correctSentence);"
);

// 4. Change Add Word logic
content = content.replace(
  /setOrderingAnswers\(prev => \(\{ \.\.\.prev, \[i\]: \[\.\.\.\(prev\[i\] \|\| \[\]\), word\] \}\)\);/,
  "setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));"
);

// 5. Change usedCount calculation
content = content.replace(
  /const usedCount = userAnswer\.filter\(w => w === word\)\.length;/,
  "const usedCount = userAnswer.filter(w => w.text === word).length;"
);

// 6. Replace custom drag and drop with Reorder
const dndTarget = `                      {/* Answer Drop Zone */}
                      <div className="min-h-[60px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 mb-6 items-center">
                        {userAnswer.length === 0 && <span className="text-slate-400 text-sm ml-2">Bấm vào các từ bên dưới để ghép câu...</span>}
                        {userAnswer.map((word, wordIdx) => (
                          <button
                            key={\`ans-\${i}-\${wordIdx}\`}
                            draggable={!orderingChecked}
                            onDragStart={(e) => {
                              if (!orderingChecked) {
                                e.dataTransfer.setData('text/plain', wordIdx.toString());
                                e.dataTransfer.effectAllowed = 'move';
                              }
                            }}
                            onDragOver={(e) => {
                              if (!orderingChecked) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }
                            }}
                            onDrop={(e) => {
                              if (!orderingChecked) {
                                e.preventDefault();
                                const sourceIdxStr = e.dataTransfer.getData('text/plain');
                                if (!sourceIdxStr) return;
                                const sourceIdx = parseInt(sourceIdxStr, 10);
                                if (isNaN(sourceIdx) || sourceIdx === wordIdx) return;
                                
                                const newAnswers = [...userAnswer];
                                const [movedItem] = newAnswers.splice(sourceIdx, 1);
                                newAnswers.splice(wordIdx, 0, movedItem);
                                
                                setOrderingAnswers(prev => ({ ...prev, [i]: newAnswers }));
                              }
                            }}
                            onClick={() => {
                              if (!orderingChecked) {
                                const newAnswers = [...userAnswer];
                                newAnswers.splice(wordIdx, 1);
                                setOrderingAnswers(prev => ({ ...prev, [i]: newAnswers }));
                              }
                            }}
                            disabled={orderingChecked}
                            className={\`px-4 py-2 bg-blue-100 text-blue-800 rounded-xl shadow-sm border border-blue-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200 transition-colors \${!orderingChecked ? 'cursor-grab active:cursor-grabbing' : ''}\`}
                            style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }}
                          >
                            {word}
                          </button>
                        ))}
                      </div>`;

const reorderReplacement = `                      {/* Answer Drop Zone */}
                      <div className="min-h-[60px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 mb-6 items-center">
                        {userAnswer.length === 0 && <span className="text-slate-400 text-sm ml-2">Bấm vào các từ bên dưới để ghép câu...</span>}
                        {userAnswer.length > 0 && (
                          <Reorder.Group 
                            axis="x" 
                            values={userAnswer} 
                            onReorder={(newOrder) => {
                              if (!orderingChecked) {
                                setOrderingAnswers(prev => ({ ...prev, [i]: newOrder }));
                              }
                            }}
                            className="flex flex-wrap gap-2 w-full"
                          >
                            {userAnswer.map((item) => (
                              <Reorder.Item
                                key={item.id}
                                value={item}
                                dragListener={!orderingChecked}
                                className="relative"
                              >
                                <button
                                  onClick={() => {
                                    if (!orderingChecked) {
                                      setOrderingAnswers(prev => ({ ...prev, [i]: userAnswer.filter(u => u.id !== item.id) }));
                                    }
                                  }}
                                  disabled={orderingChecked}
                                  className={\`px-4 py-2 bg-blue-100 text-blue-800 rounded-xl shadow-sm border border-blue-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200 transition-colors \${!orderingChecked ? 'cursor-grab active:cursor-grabbing' : ''}\`}
                                  style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }}
                                >
                                  {item.text}
                                </button>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        )}
                      </div>`;

content = content.replace(dndTarget, reorderReplacement);

fs.writeFileSync('src/components/Practice.tsx', content);
