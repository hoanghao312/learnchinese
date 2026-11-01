const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const clozeCheckedTarget = `{clozeChecked && clozeAnswers[i] !== ex.answer && (
                      <div className="mt-4 text-emerald-600 font-medium text-sm flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        <CheckCircle className="w-4 h-4" /> Đáp án đúng: {ex.answer}
                      </div>
                    )}`;
const clozeCheckedReplacement = `{clozeChecked && (
                      <div className="mt-4 flex flex-col gap-1.5">
                        {clozeAnswers[i] !== ex.answer && (
                          <div className="text-emerald-600 font-medium text-sm flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                            <CheckCircle className="w-4 h-4" /> Đáp án đúng: <span style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }} className="ml-1">{ex.answer}</span>
                          </div>
                        )}
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 pl-1">
                          <span className="font-semibold">Nghĩa: </span>{ex.translation}
                        </div>
                      </div>
                    )}`;
content = content.replace(clozeCheckedTarget, clozeCheckedReplacement);

const orderingCheckedTarget = `{orderingChecked && (
                        <div className="mt-6 flex flex-col gap-1.5">
                          {!isCorrect && (
                            <div className="text-emerald-600 font-medium text-sm flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                              <CheckCircle className="w-4 h-4" /> Đáp án đúng: <span style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }} className="ml-1">{ex.correctSentence}</span>
                            </div>
                          )}
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 pl-1">
                            <span className="font-semibold">Nghĩa: </span>{ex.translation}
                          </div>
                        </div>
                      )}`;
                      
const orderingCheckedTargetAlt = `{orderingChecked && !isCorrect && (
                        <div className="mt-6 text-emerald-600 font-medium text-sm flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                          <CheckCircle className="w-4 h-4" /> Đáp án đúng: <span style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }} className="ml-1">{ex.correctSentence}</span>
                        </div>
                      )}`;

const orderingCheckedReplacement = `{orderingChecked && (
                        <div className="mt-6 flex flex-col gap-1.5">
                          {!isCorrect && (
                            <div className="text-emerald-600 font-medium text-sm flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                              <CheckCircle className="w-4 h-4" /> Đáp án đúng: <span style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '18px' }} className="ml-1">{ex.correctSentence}</span>
                            </div>
                          )}
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 pl-1">
                            <span className="font-semibold">Nghĩa: </span>{ex.translation}
                          </div>
                        </div>
                      )}`;

if (content.includes(orderingCheckedTarget)) {
    // Already good
} else if (content.includes(orderingCheckedTargetAlt)) {
    content = content.replace(orderingCheckedTargetAlt, orderingCheckedReplacement);
}

fs.writeFileSync('src/components/Practice.tsx', content);
