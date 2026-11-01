const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetModalHtml = `      {/* Left Sidebar - Sources */}`;
const replaceModalHtml = `      {/* Story Generation Modal */}
      <AnimatePresence>
        {showStoryModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Tạo câu chuyện
                </h3>
                <button onClick={() => setShowStoryModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
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
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Chọn thư mục từ vựng
                    </label>
                    <div className="relative">
                      <select
                        value={storyFolderId}
                        onChange={(e) => setStoryFolderId(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-8"
                      >
                        {folders && folders.length > 0 ? (
                          folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))
                        ) : (
                          <option value="">Không có thư mục nào</option>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => setShowStoryModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    let prompt = "";
                    if (storyFilterType === 'vocab') {
                      const unknownWords = savedWords.filter(w => !w.isKnown);
                      const knownWords = savedWords.filter(w => w.isKnown);
                      
                      const shuffledUnknown = [...unknownWords].sort(() => 0.5 - Math.random()).slice(0, storyUnknownCount).map(w => w.text);
                      const shuffledKnown = [...knownWords].sort(() => 0.5 - Math.random()).slice(0, storyKnownCount).map(w => w.text);
                      
                      let reqStr = "";
                      if (shuffledUnknown.length > 0) reqStr += \`\\n- Từ chưa biết (\${shuffledUnknown.length} từ): \${shuffledUnknown.join(', ')}\`;
                      if (shuffledKnown.length > 0) reqStr += \`\\n- Từ đã biết (\${shuffledKnown.length} từ): \${shuffledKnown.join(', ')}\`;

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
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Gợi ý Prompt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Sidebar - Sources */}`;

content = content.replace(targetModalHtml, replaceModalHtml);
fs.writeFileSync('src/components/NotebookChat.tsx', content);
