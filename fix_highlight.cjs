const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const target1 = `{(() => {
              const paginatedWords = filteredWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              return paginatedWords.map((word, index) => {`;
const rep1 = `{(() => {
              const textCounts = new Map<string, number>();
              savedWords.forEach(w => textCounts.set(w.text, (textCounts.get(w.text) || 0) + 1));
              const paginatedWords = filteredWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              return paginatedWords.map((word, index) => {
                const isDuplicate = textCounts.get(word.text)! > 1;`;
content = content.replace(target1, rep1);

const target2 = `{col.id === 'text' && (
                              <span 
                                className="word-token-element text-[18px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition leading-none select-none"
                                style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                              >
                                {word.text}
                              </span>
                            )}`;
const rep2 = `{col.id === 'text' && (
                              <span 
                                className={\`word-token-element text-[18px] font-bold transition leading-none select-none \${isDuplicate ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-900/30 dark:border-rose-600 px-1.5 py-1 -ml-1.5 rounded-sm text-slate-800 dark:text-slate-100' : 'text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400'}\`}
                                style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                              >
                                {word.text}
                              </span>
                            )}`;
content = content.replace(target2, rep2);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
