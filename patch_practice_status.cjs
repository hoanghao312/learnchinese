const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const clozeNumTarget = `<span className="font-sans font-bold text-slate-400 mr-2">Câu {i + 1}:</span>`;
const clozeNumRep = `<span className="font-sans font-bold text-slate-400 mr-2 flex items-center gap-1">
                          Câu {i + 1}:
                          {clozeChecked && (
                            clozeAnswers[i] === ex.answer 
                              ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                              : <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </span>`;
content = content.replace(clozeNumTarget, clozeNumRep);


const orderingNumTarget = `<div className="font-bold text-slate-400 mb-1">Câu {i + 1}:</div>`;
const orderingNumRep = `<div className="font-bold text-slate-400 mb-1 flex items-center gap-1">
                            Câu {i + 1}:
                            {orderingChecked && (
                              isCorrect 
                                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                : <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>`;
content = content.replace(orderingNumTarget, orderingNumRep);

fs.writeFileSync('src/components/Practice.tsx', content);
