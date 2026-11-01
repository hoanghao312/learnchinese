const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const translateContainerTarget = `<div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full max-h-[250px] overflow-y-auto">`;
const translateContainerReplacement = `<div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full max-w-sm max-h-[250px] overflow-y-auto">`;

content = content.replace(translateContainerTarget, translateContainerReplacement);

fs.writeFileSync('src/components/TextReader.tsx', content);
