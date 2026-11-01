const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const searchStr = `<h3 className="text-xs font-bold text-slate-700">Chưa xuất hiện trong từ điển Excel ({missingDict.length})</h3>`;
const replaceStr = `<div className="flex items-center gap-3">
                                          <h3 className="text-xs font-bold text-slate-700">Chưa xuất hiện trong từ điển Excel ({missingDict.length})</h3>
                                          {selectedMissingWords.length !== missingDict.length && (
                                            <button onClick={() => setSelectedMissingWords(missingDict.map(w => w.text))} className="text-[11px] text-orange-600 hover:text-orange-700 font-medium hover:underline">
                                              Chọn tất cả
                                            </button>
                                          )}
                                          {selectedMissingWords.length > 0 && selectedMissingWords.length === missingDict.length && (
                                            <button onClick={() => setSelectedMissingWords([])} className="text-[11px] text-slate-500 hover:text-slate-700 font-medium hover:underline">
                                              Bỏ chọn tất cả
                                            </button>
                                          )}
                                        </div>`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/App.tsx', content);
