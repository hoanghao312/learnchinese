const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStateStr = `  const [storyUnknownCount, setStoryUnknownCount] = useState(20);
  const [storyKnownCount, setStoryKnownCount] = useState(30);`;

const replaceStateStr = `  const [storyUnknownStart, setStoryUnknownStart] = useState(1);
  const [storyUnknownEnd, setStoryUnknownEnd] = useState(20);
  const [storyKnownStart, setStoryKnownStart] = useState(1);
  const [storyKnownEnd, setStoryKnownEnd] = useState(30);`;

content = content.replace(targetStateStr, replaceStateStr);

const targetInputsStr = `                {storyFilterType === 'vocab' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Số lượng từ "Chưa biết" (Tối đa: {savedWords.filter(w => !w.isKnown).length})
                      </label>
                      <input 
                        type="number" 
                        min={0} 
                        max={savedWords.filter(w => !w.isKnown).length}
                        value={storyUnknownCount}
                        onChange={(e) => setStoryUnknownCount(Math.min(parseInt(e.target.value) || 0, savedWords.filter(w => !w.isKnown).length))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Số lượng từ "Đã biết" (Tối đa: {savedWords.filter(w => w.isKnown).length})
                      </label>
                      <input 
                        type="number" 
                        min={0} 
                        max={savedWords.filter(w => w.isKnown).length}
                        value={storyKnownCount}
                        onChange={(e) => setStoryKnownCount(Math.min(parseInt(e.target.value) || 0, savedWords.filter(w => w.isKnown).length))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ) : (`;

const replaceInputsStr = `                {storyFilterType === 'vocab' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phạm vi từ "Chưa biết" (Có {savedWords.filter(w => !w.isKnown).length} từ)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Từ số</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={savedWords.filter(w => !w.isKnown).length}
                          value={storyUnknownStart}
                          onChange={(e) => setStoryUnknownStart(Math.max(1, Math.min(parseInt(e.target.value) || 1, savedWords.filter(w => !w.isKnown).length)))}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-500">đến</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={savedWords.filter(w => !w.isKnown).length}
                          value={storyUnknownEnd}
                          onChange={(e) => setStoryUnknownEnd(Math.max(1, Math.min(parseInt(e.target.value) || 1, savedWords.filter(w => !w.isKnown).length)))}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phạm vi từ "Đã biết" (Có {savedWords.filter(w => w.isKnown).length} từ)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Từ số</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={savedWords.filter(w => w.isKnown).length}
                          value={storyKnownStart}
                          onChange={(e) => setStoryKnownStart(Math.max(1, Math.min(parseInt(e.target.value) || 1, savedWords.filter(w => w.isKnown).length)))}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-500">đến</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={savedWords.filter(w => w.isKnown).length}
                          value={storyKnownEnd}
                          onChange={(e) => setStoryKnownEnd(Math.max(1, Math.min(parseInt(e.target.value) || 1, savedWords.filter(w => w.isKnown).length)))}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (`;

content = content.replace(targetInputsStr, replaceInputsStr);

const targetActionStr = `                    if (storyFilterType === 'vocab') {
                      const unknownWords = savedWords.filter(w => !w.isKnown);
                      const knownWords = savedWords.filter(w => w.isKnown);
                      
                      const shuffledUnknown = [...unknownWords].sort(() => 0.5 - Math.random()).slice(0, storyUnknownCount).map(w => w.text);
                      const shuffledKnown = [...knownWords].sort(() => 0.5 - Math.random()).slice(0, storyKnownCount).map(w => w.text);`;

const replaceActionStr = `                    if (storyFilterType === 'vocab') {
                      const unknownWords = savedWords.filter(w => !w.isKnown);
                      const knownWords = savedWords.filter(w => w.isKnown);
                      
                      const uStart = Math.max(0, storyUnknownStart - 1);
                      const uEnd = Math.min(unknownWords.length, storyUnknownEnd);
                      const selectedUnknown = unknownWords.slice(uStart, uEnd).map(w => w.text);
                      
                      const kStart = Math.max(0, storyKnownStart - 1);
                      const kEnd = Math.min(knownWords.length, storyKnownEnd);
                      const selectedKnown = knownWords.slice(kStart, kEnd).map(w => w.text);`;

content = content.replace(targetActionStr, replaceActionStr);

const targetPromptStr = `                      let reqStr = "";
                      if (shuffledUnknown.length > 0) reqStr += \`\\n- Từ chưa biết (\${shuffledUnknown.length} từ): \${shuffledUnknown.join(', ')}\`;
                      if (shuffledKnown.length > 0) reqStr += \`\\n- Từ đã biết (\${shuffledKnown.length} từ): \${shuffledKnown.join(', ')}\`;`;

const replacePromptStr = `                      let reqStr = "";
                      if (selectedUnknown.length > 0) reqStr += \`\\n- Từ chưa biết (\${selectedUnknown.length} từ): \${selectedUnknown.join(', ')}\`;
                      if (selectedKnown.length > 0) reqStr += \`\\n- Từ đã biết (\${selectedKnown.length} từ): \${selectedKnown.join(', ')}\`;`;

content = content.replace(targetPromptStr, replacePromptStr);

fs.writeFileSync('src/components/NotebookChat.tsx', content);
