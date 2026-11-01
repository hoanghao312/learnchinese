const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// Revert colors for Cloze
content = content.replace(/\$\{clozeChecked \? \(clozeAnswers\[i\] === ex\.answer \? "border-red-300 bg-red-100 dark:bg-red-900\/30" : "border-blue-300 bg-blue-100 dark:bg-blue-900\/30"\) : "border-slate-150 dark:border-slate-800"\}/g, 
'${clozeChecked ? (clozeAnswers[i] === ex.answer ? "border-emerald-300 bg-emerald-100 dark:bg-emerald-900/30" : "border-rose-300 bg-rose-100 dark:bg-rose-900/30") : "border-slate-150 dark:border-slate-800"}');

content = content.replace(/<CheckCircle className="w-12 h-12 text-red-500" \/>/g, '<CheckCircle className="w-12 h-12 text-emerald-500" />');
content = content.replace(/<XCircle className="w-12 h-12 text-blue-500" \/>/g, '<XCircle className="w-12 h-12 text-rose-500" />');

// Revert correct answer text box color
content = content.replace(/bg-red-50 p-2\.5 rounded-lg border border-red-100/g, 'bg-emerald-50 p-2.5 rounded-lg border border-emerald-100');
content = content.replace(/text-red-600 font-medium/g, 'text-emerald-600 font-medium');

// Revert colors for Ordering
content = content.replace(/\$\{orderingChecked \? \(isCorrect \? "border-red-300 bg-red-100 dark:bg-red-900\/30" : "border-blue-300 bg-blue-100 dark:bg-blue-900\/30"\) : "border-slate-150 dark:border-slate-800"\}/g,
'${orderingChecked ? (isCorrect ? "border-emerald-300 bg-emerald-100 dark:bg-emerald-900/30" : "border-rose-300 bg-rose-100 dark:bg-rose-900/30") : "border-slate-150 dark:border-slate-800"}');

fs.writeFileSync('src/components/Practice.tsx', content);
