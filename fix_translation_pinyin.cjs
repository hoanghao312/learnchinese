const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const regex = /\{selectionTranslation && \(\n\s*<div className="flex flex-col items-start gap-1\.5 py-2\.5 px-3\.5 border-t border-slate-100 bg-slate-50">\n\s*<p className="text-\[15px\] font-medium text-slate-800 dark:text-slate-200 leading-relaxed" style=\{\{ fontFamily: '"DFKAI-SB", "KaiTi", serif' \}\}>\{selectedText\}<\/p>\n\s*<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">\{selectionTranslation\}<\/p>\n\s*<\/div>\n\s*\)\}/;

content = content.replace(regex, `{selectionTranslation && (
            <div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full">
              <div className="flex flex-wrap gap-x-[1px] gap-y-1" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                {(() => {
                  const pinyinArr = pinyin(selectedText, { type: 'array' });
                  return selectedText.split('').map((char, i) => {
                    const isPunctuation = /[.,!?;:\\s\\n\\r\\t，。！？、：；（）《》“”‘’]/.test(char);
                    return (
                      <div key={i} className="flex flex-col items-center justify-end">
                        {showPinyin && !isPunctuation && <span className="text-[10px] text-slate-500 font-sans leading-none mb-[2px]">{pinyinArr[i]}</span>}
                        <span className="text-[15px] font-medium text-slate-800 dark:text-slate-200 leading-none">{char}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectionTranslation}</p>
            </div>
          )}`);

fs.writeFileSync('src/components/TextReader.tsx', content);
