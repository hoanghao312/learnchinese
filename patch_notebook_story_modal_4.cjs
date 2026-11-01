const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

// 1. Replace State
const targetStateStr = `  const [storyUnknownStart, setStoryUnknownStart] = useState(1);
  const [storyUnknownEnd, setStoryUnknownEnd] = useState(20);
  const [storyKnownStart, setStoryKnownStart] = useState(1);
  const [storyKnownEnd, setStoryKnownEnd] = useState(30);`;

const replaceStateStr = `  const [storyUnknownStart, setStoryUnknownStart] = useState(1);
  const [storyUnknownEnd, setStoryUnknownEnd] = useState(20);
  const [storyLength, setStoryLength] = useState(200);`;

content = content.replace(targetStateStr, replaceStateStr);

// 2. Replace Inputs
const targetInputsStr = `                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setStoryFilterType('vocab')}
                    className={\`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all \${storyFilterType === 'vocab' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                  >
                    Theo từ vựng
                  </button>
                  <button
                    onClick={() => {
                        setStoryFilterType('folder');
                        if (folders && folders.length > 0 && !storyFolderId) {
                            setStoryFolderId(folders[0].id);
                        }
                    }}
                    className={\`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all \${storyFilterType === 'folder' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                  >
                    Theo thư mục
                  </button>
                </div>

                {storyFilterType === 'vocab' ? (
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

const replaceInputsStr = `                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Độ dài câu chuyện (chữ)
                  </label>
                  <div className="flex gap-2">
                    {[100, 200, 300].map(len => (
                      <button
                        key={len}
                        onClick={() => setStoryLength(len)}
                        className={\`flex-1 py-2 text-sm font-bold rounded-xl border transition-all \${storyLength === len ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}\`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setStoryFilterType('vocab')}
                    className={\`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all \${storyFilterType === 'vocab' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                  >
                    Theo từ vựng
                  </button>
                  <button
                    onClick={() => {
                        setStoryFilterType('folder');
                        if (folders && folders.length > 0 && !storyFolderId) {
                            setStoryFolderId(folders[0].id);
                        }
                    }}
                    className={\`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all \${storyFilterType === 'folder' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                  >
                    Theo thư mục
                  </button>
                </div>

                {storyFilterType === 'vocab' ? (
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
                  </div>
                ) : (`;

content = content.replace(targetInputsStr, replaceInputsStr);

// 3. Replace Button Action
const targetActionStr = `                  onClick={() => {
                    let prompt = "";
                    if (storyFilterType === 'vocab') {
                      const unknownWords = savedWords.filter(w => !w.isKnown);
                      const knownWords = savedWords.filter(w => w.isKnown);
                      
                      const uStart = Math.max(0, storyUnknownStart - 1);
                      const uEnd = Math.min(unknownWords.length, storyUnknownEnd);
                      const selectedUnknown = unknownWords.slice(uStart, uEnd).map(w => w.text);
                      
                      const kStart = Math.max(0, storyKnownStart - 1);
                      const kEnd = Math.min(knownWords.length, storyKnownEnd);
                      const selectedKnown = knownWords.slice(kStart, kEnd).map(w => w.text);
                      
                      let reqStr = "";
                      if (selectedUnknown.length > 0) reqStr += \`\\n- Từ chưa biết (\${selectedUnknown.length} từ): \${selectedUnknown.join(', ')}\`;
                      if (selectedKnown.length > 0) reqStr += \`\\n- Từ đã biết (\${selectedKnown.length} từ): \${selectedKnown.join(', ')}\`;

                      prompt = \`Tạo một câu chuyện tiếng Trung khoảng 200 từ chứa các từ vựng sau đây:\${reqStr}\\n\\nHãy làm nổi bật (in đậm) các từ vựng trên trong câu chuyện.\`;
                    } else {
                      if (!storyFolderId) {
                        alert("Vui lòng chọn một thư mục.");
                        return;
                      }
                      const folderName = folders?.find(f => f.id === storyFolderId)?.name || 'Thư mục';
                      const folderWords = savedWords.filter(w => w.folderId === storyFolderId).map(w => w.text);
                      
                      if (folderWords.length === 0) {
                        alert("Thư mục này chưa có từ vựng nào.");
                        return;
                      }
                      
                      prompt = \`Tạo một câu chuyện tiếng Trung khoảng 200 từ chứa toàn bộ \${folderWords.length} từ vựng trong thư mục "\${folderName}" sau đây:\\n\${folderWords.join(', ')}\\n\\nHãy làm nổi bật (in đậm) các từ vựng trên trong câu chuyện, các từ vựng còn lại ưu tiên dùng từ trong phần "Đã biết" của tôi.\`;
                    }
                    
                    setInput(prompt);
                    setShowStoryModal(false);
                  }}`;

const replaceActionStr = `                  onClick={() => {
                    let prompt = "";
                    const knownWords = savedWords.filter(w => w.isKnown).map(w => w.text);
                    const knownStr = knownWords.length > 0 ? \`\\n\\nĐối với CÁC TỪ VỰNG CÒN LẠI trong câu chuyện (ngoài danh sách bắt buộc), hãy CỐ GẮNG TỐI ĐA chỉ sử dụng các từ trong danh sách "Đã biết" sau đây của tôi:\\n\${knownWords.join(', ')}\` : "";

                    if (storyFilterType === 'vocab') {
                      const unknownWords = savedWords.filter(w => !w.isKnown);
                      
                      const uStart = Math.max(0, storyUnknownStart - 1);
                      const uEnd = Math.min(unknownWords.length, storyUnknownEnd);
                      const selectedUnknown = unknownWords.slice(uStart, uEnd).map(w => w.text);
                      
                      let reqStr = "";
                      if (selectedUnknown.length > 0) reqStr += \`\\n- Từ vựng bắt buộc (\${selectedUnknown.length} từ): \${selectedUnknown.join(', ')}\`;

                      prompt = \`Tạo một câu chuyện tiếng Trung khoảng \${storyLength} từ chứa các từ vựng bắt buộc sau đây:\${reqStr}\\n\\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.\${knownStr}\`;
                    } else {
                      if (!storyFolderId) {
                        alert("Vui lòng chọn một thư mục.");
                        return;
                      }
                      const folderName = folders?.find(f => f.id === storyFolderId)?.name || 'Thư mục';
                      const folderWords = savedWords.filter(w => w.folderId === storyFolderId).map(w => w.text);
                      
                      if (folderWords.length === 0) {
                        alert("Thư mục này chưa có từ vựng nào.");
                        return;
                      }
                      
                      prompt = \`Tạo một câu chuyện tiếng Trung khoảng \${storyLength} từ chứa toàn bộ \${folderWords.length} từ vựng trong thư mục "\${folderName}" bắt buộc sau đây:\\n\${folderWords.join(', ')}\\n\\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.\${knownStr}\`;
                    }
                    
                    setInput(prompt);
                    setShowStoryModal(false);
                  }}`;

content = content.replace(targetActionStr, replaceActionStr);

fs.writeFileSync('src/components/NotebookChat.tsx', content);
