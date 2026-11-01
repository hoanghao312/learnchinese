import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

pattern = r'\{\/\* Advanced Filter Panel \*\/\}.*?<\/AnimatePresence>'

replacement = """{/* Advanced Filter Modal */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                  onClick={() => setShowAdvancedFilters(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-center relative px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tất cả bộ lọc</h3>
                    <button 
                      onClick={() => setShowAdvancedFilters(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" /> Đóng
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* HSK Level Filter */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Cấp độ HSK</h4>
                      <div className="flex flex-wrap gap-2">
                        {['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Chưa phân loại'].map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => {
                              setHskFilter(prev => 
                                prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
                              );
                            }}
                            className={`px-4 py-2 rounded text-sm transition-colors border ${hskFilter.includes(lvl) ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Sorting */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Ngày tạo</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSortBy(sortBy === 'date_desc' ? 'default' : 'date_desc')}
                          className={`px-4 py-2 rounded text-sm transition-colors border ${sortBy === 'date_desc' ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                        >
                          Ngày gần nhất
                        </button>
                        <button
                          onClick={() => setSortBy(sortBy === 'date_asc' ? 'default' : 'date_asc')}
                          className={`px-4 py-2 rounded text-sm transition-colors border ${sortBy === 'date_asc' ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                        >
                          Ngày xa nhất
                        </button>
                      </div>
                    </div>

                    {/* Score Sorting */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Điểm số</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSortBy(sortBy === 'score_desc' ? 'default' : 'score_desc')}
                          className={`px-4 py-2 rounded text-sm transition-colors border ${sortBy === 'score_desc' ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                        >
                          Từ cao đến thấp
                        </button>
                        <button
                          onClick={() => setSortBy(sortBy === 'score_asc' ? 'default' : 'score_asc')}
                          className={`px-4 py-2 rounded text-sm transition-colors border ${sortBy === 'score_asc' ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                        >
                          Từ thấp đến cao
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setHskFilter([]);
                        setSortBy('default');
                      }}
                      className="px-6 py-2.5 rounded text-sm font-medium text-red-500 bg-white dark:bg-slate-800 border border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-[180px]"
                    >
                      Bỏ chọn
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="px-6 py-2.5 rounded text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors w-[180px]"
                    >
                      Xem {sortedWords.length} kết quả
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(new_content)

print("Done replacing modal")
