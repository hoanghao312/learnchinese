const fs = require('fs');
const content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const searchUI = `                            {ex.structureExplanation && (
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-1 border-t border-emerald-200/50 dark:border-emerald-900/40">
                                <span className="text-slate-500 dark:text-slate-400 mr-1.5">Cấu trúc:</span>
                                {ex.structureExplanation}
                              </div>
                            )}`;

const replaceUI = `                            {ex.structureExplanation && (
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-3 mt-2 border-t border-emerald-200/50 dark:border-emerald-900/40 whitespace-pre-wrap leading-relaxed">
                                {ex.structureExplanation}
                              </div>
                            )}`;

if (content.includes(searchUI)) {
    const newContent = content.split(searchUI).join(replaceUI);
    fs.writeFileSync('src/components/Practice.tsx', newContent);
    console.log("Updated Practice.tsx UI");
} else {
    console.log("Could not find Practice.tsx UI to update");
}
