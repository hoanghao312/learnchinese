const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const volumeTarget = `isSelectionSpeaking ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-700'`;
const volumeReplacement = `isSelectionSpeaking ? 'bg-sky-50 text-sky-600' : 'hover:bg-sky-50/50 text-sky-500 hover:text-sky-600'`;
content = content.replace(volumeTarget, volumeReplacement);

const micTarget = `isSelectionRecording ? 'bg-red-50 text-red-600' : 'hover:bg-slate-50 text-slate-700'`;
const micReplacement = `isSelectionRecording ? 'bg-rose-50 text-rose-600' : 'hover:bg-rose-50/50 text-rose-500 hover:text-rose-600'`;
content = content.replace(micTarget, micReplacement);

const repeatTarget = `isSelectionLooping ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-700'`;
const repeatReplacement = `isSelectionLooping ? 'bg-violet-50 text-violet-600' : 'hover:bg-violet-50/50 text-violet-500 hover:text-violet-600'`;
content = content.replace(repeatTarget, repeatReplacement);

const translateTarget = `className="p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                title="Dịch đoạn đã chọn"`;
const translateReplacement = `className="p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-amber-50/50 text-amber-500 hover:text-amber-600 disabled:opacity-50"
                title="Dịch đoạn đã chọn"`;
content = content.replace(translateTarget, translateReplacement);

const grammarTarget = `className="p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                title="Phân tích ngữ pháp"`;
const grammarReplacement = `className="p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-emerald-50/50 text-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                title="Phân tích ngữ pháp"`;
content = content.replace(grammarTarget, grammarReplacement);

fs.writeFileSync('src/components/TextReader.tsx', content);
