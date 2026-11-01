const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

content = content.replace('{showPinyin && <div className="text-sm text-slate-500 mb-1">{ex.pinyin}</div>}', '{showPinyin ? <div className="text-sm text-slate-500 mb-6">{ex.pinyin}</div> : <div className="mb-6"></div>}');

content = content.replace('{showPinyin && <div className="text-sm text-slate-500 mb-6">{ex.pinyin}</div>}', '{showPinyin ? <div className="text-sm text-slate-500 mb-6">{ex.pinyin}</div> : <div className="mb-6"></div>}');

fs.writeFileSync('src/components/Practice.tsx', content);
