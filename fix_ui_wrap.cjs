const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const translateUITarget = `<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectionTranslation}</p>`;
const translateUIReplacement = `<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words whitespace-pre-wrap">{selectionTranslation}</p>`;

content = content.replace(translateUITarget, translateUIReplacement);

const translateContainerTarget = `<div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full">`;
const translateContainerReplacement = `<div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full max-h-[250px] overflow-y-auto">`;

content = content.replace(translateContainerTarget, translateContainerReplacement);

fs.writeFileSync('src/components/TextReader.tsx', content);
