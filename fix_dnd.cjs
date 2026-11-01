const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const target = `                        {userAnswer.map((word, wordIdx) => (
                          <button
                            key={\`ans-\${i}-\${wordIdx}\`}
                            onClick={() => {
                              if (!orderingChecked) {
                                const newAnswers = [...userAnswer];
                                newAnswers.splice(wordIdx, 1);
                                setOrderingAnswers(prev => ({ ...prev, [i]: newAnswers }));
                              }
                            }}
                            disabled={orderingChecked}
                            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl shadow-sm border border-blue-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200 transition-colors"
                            style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }}
                          >
                            {word}
                          </button>
                        ))}
                      </div>`;

const replacement = `                        {userAnswer.map((word, wordIdx) => (
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

content = content.replace(target, replacement);

fs.writeFileSync('src/components/Practice.tsx', content);
