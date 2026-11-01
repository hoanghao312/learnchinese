const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const searchStr = `
                               {missingMeaning.length > 0 && (
                                  <div className="space-y-2">
                                     <h3 className="text-xs font-bold text-slate-700">Từ chưa có nghĩa ({missingMeaning.length})</h3>
                                     <div className="flex flex-wrap gap-2">
                                        {missingMeaning.map(w => (
                                           <div key={w.text} className="flex items-center bg-rose-50 border border-rose-200 hover:border-rose-400 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 min-w-[40px] min-h-[32px]">
                                              <button onClick={() => handleSelectSavedWordPreview(w)} className="px-3 py-1.5 text-rose-700 text-sm font-medium cursor-pointer rounded-l-lg hover:bg-rose-100">
                                                 {w.text}
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ title: "Xác nhận xóa", message: \`Bạn có chắc chắn muốn xóa từ "\${w.text}" khỏi danh sách?\`, onConfirm: () => { setHistoricalMissingWords(prev => { const next = prev.filter(t => t.text !== w.text); localStorage.setItem("historical_missing_words", JSON.stringify(next)); return next; }); } }); }} className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-r-lg transition-colors border-l border-rose-200/50" title="Xóa khỏi danh sách">
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               )}
`;

const replaceStr = `
                               {missingMeaning.length > 0 && (
                                  <div className="space-y-3">
                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                          <h3 className="text-xs font-bold text-slate-700">Từ chưa có nghĩa ({missingMeaning.length})</h3>
                                          {selectedMissingWords.filter(w => missingMeaning.some(m => m.text === w)).length !== missingMeaning.length && (
                                            <button onClick={() => setSelectedMissingWords(prev => [...new Set([...prev, ...missingMeaning.map(w => w.text)])])} className="text-[11px] text-rose-600 hover:text-rose-700 font-medium hover:underline">
                                              Chọn tất cả
                                            </button>
                                          )}
                                          {selectedMissingWords.filter(w => missingMeaning.some(m => m.text === w)).length > 0 && selectedMissingWords.filter(w => missingMeaning.some(m => m.text === w)).length === missingMeaning.length && (
                                            <button onClick={() => setSelectedMissingWords(prev => prev.filter(w => !missingMeaning.some(m => m.text === w)))} className="text-[11px] text-slate-500 hover:text-slate-700 font-medium hover:underline">
                                              Bỏ chọn tất cả
                                            </button>
                                          )}
                                        </div>
                                        {selectedMissingWords.filter(w => missingMeaning.some(m => m.text === w)).length > 0 && (
                                          <div className="flex items-center gap-2">
                                             <button onClick={handleMergeAndLookup} disabled={isLookingUpMerged} className="text-[11px] px-3 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shadow-sm">
                                                {isLookingUpMerged && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Gộp từ & Tra cứu ({selectedMissingWords.filter(w => missingMeaning.some(m => m.text === w)).length})
                                             </button>
                                             <button onClick={handleBulkDeleteMissing} className="text-[11px] px-2.5 py-1.5 bg-rose-100 text-rose-700 rounded font-medium hover:bg-rose-200">
                                                Xóa ({selectedMissingWords.filter(w => missingMeaning.some(m => m.text === w)).length})
                                             </button>
                                             <button onClick={() => setSelectedMissingWords(prev => prev.filter(w => !missingMeaning.some(m => m.text === w)))} className="text-[11px] px-2.5 py-1.5 bg-slate-200 text-slate-600 rounded font-medium hover:bg-slate-300">
                                                Hủy
                                             </button>
                                          </div>
                                        )}
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                        {missingMeaning.map(w => {
                                           const isSelected = selectedMissingWords.includes(w.text);
                                           return (
                                           <div key={w.text} className={\`flex items-center border rounded-lg shadow-sm transition-all hover:-translate-y-0.5 min-w-[40px] min-h-[32px] \${isSelected ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-200' : 'bg-rose-50 border-rose-200 hover:border-rose-400'}\`}>
                                              <button onClick={(e) => { e.stopPropagation(); toggleMissingWordSelection(w.text); }} className={\`px-2.5 py-2 border-r transition-colors flex items-center justify-center \${isSelected ? 'border-rose-300 bg-rose-200 rounded-l-lg' : 'border-rose-200/50 hover:bg-rose-100 rounded-l-lg'}\`} title="Chọn từ này">
                                                 <input type="checkbox" checked={isSelected} readOnly className="w-3.5 h-3.5 accent-rose-600 cursor-pointer pointer-events-none" />
                                              </button>
                                              <button onClick={() => handleSelectSavedWordPreview(w)} className={\`px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors \${isSelected ? 'text-rose-900 bg-rose-100 hover:bg-rose-200' : 'text-rose-700 hover:bg-rose-100'}\`}>
                                                 {w.text}
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ title: "Xác nhận xóa", message: \`Bạn có chắc chắn muốn xóa từ "\${w.text}" khỏi danh sách?\`, onConfirm: () => { setHistoricalMissingWords(prev => { const next = prev.filter(t => t.text !== w.text); localStorage.setItem("historical_missing_words", JSON.stringify(next)); return next; }); } }); }} className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-r-lg transition-colors border-l border-rose-200/50" title="Xóa khỏi danh sách">
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                           </div>
                                        )})}
                                     </div>
                                  </div>
                               )}
`;

content = content.replace(searchStr.trim(), replaceStr.trim());
fs.writeFileSync('src/App.tsx', content);
