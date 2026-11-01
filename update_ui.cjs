const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const searchStr = `
                               {missingDict.length > 0 && (
                                  <div className="space-y-2">
                                     <h3 className="text-xs font-bold text-slate-700">Chưa xuất hiện trong từ điển Excel ({missingDict.length})</h3>
                                     <div className="flex flex-wrap gap-2">
                                        {missingDict.map(w => (
                                           <div key={w.text} className="flex items-center bg-orange-50 border border-orange-200 hover:border-orange-400 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 min-w-[40px] min-h-[32px]">
                                              <button onClick={() => handleSelectSavedWordPreview(w)} className="px-3 py-1.5 text-orange-700 text-sm font-medium cursor-pointer rounded-l-lg hover:bg-orange-100">
                                                 {w.text}
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ title: "Xác nhận xóa", message: \`Bạn có chắc chắn muốn xóa từ "\${w.text}" khỏi danh sách?\`, onConfirm: () => { setHistoricalMissingWords(prev => { const next = prev.filter(t => t.text !== w.text); localStorage.setItem("historical_missing_words", JSON.stringify(next)); return next; }); } }); }} className="p-1.5 text-orange-400 hover:text-orange-700 hover:bg-orange-100 rounded-r-lg transition-colors border-l border-orange-200/50" title="Xóa khỏi danh sách">
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               )}
`;

const replaceStr = `
                               {missingDict.length > 0 && (
                                  <div className="space-y-3">
                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <h3 className="text-xs font-bold text-slate-700">Chưa xuất hiện trong từ điển Excel ({missingDict.length})</h3>
                                        {selectedMissingWords.length > 0 && (
                                          <div className="flex items-center gap-2">
                                             <button onClick={handleMergeAndLookup} disabled={isLookingUpMerged} className="text-[11px] px-3 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shadow-sm">
                                                {isLookingUpMerged && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Gộp từ & Tra cứu ({selectedMissingWords.length})
                                             </button>
                                             <button onClick={handleBulkDeleteMissing} className="text-[11px] px-2.5 py-1.5 bg-rose-100 text-rose-700 rounded font-medium hover:bg-rose-200">
                                                Xóa ({selectedMissingWords.length})
                                             </button>
                                             <button onClick={() => setSelectedMissingWords([])} className="text-[11px] px-2.5 py-1.5 bg-slate-200 text-slate-600 rounded font-medium hover:bg-slate-300">
                                                Hủy
                                             </button>
                                          </div>
                                        )}
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                        {missingDict.map(w => {
                                           const isSelected = selectedMissingWords.includes(w.text);
                                           return (
                                           <div key={w.text} className={\`flex items-center border rounded-lg shadow-sm transition-all hover:-translate-y-0.5 min-w-[40px] min-h-[32px] \${isSelected ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-200' : 'bg-orange-50 border-orange-200 hover:border-orange-400'}\`}>
                                              <button onClick={(e) => { e.stopPropagation(); toggleMissingWordSelection(w.text); }} className={\`px-2.5 py-2 border-r transition-colors flex items-center justify-center \${isSelected ? 'border-orange-300 bg-orange-200 rounded-l-lg' : 'border-orange-200/50 hover:bg-orange-100 rounded-l-lg'}\`} title="Chọn từ này">
                                                 <input type="checkbox" checked={isSelected} readOnly className="w-3.5 h-3.5 accent-orange-600 cursor-pointer pointer-events-none" />
                                              </button>
                                              <button onClick={() => handleSelectSavedWordPreview(w)} className={\`px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors \${isSelected ? 'text-orange-900 bg-orange-100 hover:bg-orange-200' : 'text-orange-700 hover:bg-orange-100'}\`}>
                                                 {w.text}
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ title: "Xác nhận xóa", message: \`Bạn có chắc chắn muốn xóa từ "\${w.text}" khỏi danh sách?\`, onConfirm: () => { setHistoricalMissingWords(prev => { const next = prev.filter(t => t.text !== w.text); localStorage.setItem("historical_missing_words", JSON.stringify(next)); return next; }); } }); }} className="p-1.5 text-orange-400 hover:text-orange-700 hover:bg-orange-100 rounded-r-lg transition-colors border-l border-orange-200/50" title="Xóa khỏi danh sách">
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
