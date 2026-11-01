import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# Add Filter Panel right after the header rows
header_end = r'(title="Hiển thị Việt-Hán"\s*>\s*Việt-Hán\s*</button>\s*</div>)'

filter_panel = r"""\1

          {/* Advanced Filter Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden w-full flex-none"
              >
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 mt-2 mb-3 space-y-4">
                  {/* HSK Level Filter */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Cấp độ HSK</h4>
                    <div className="flex flex-wrap gap-2">
                      {['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Chưa phân loại'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => {
                            setHskFilter(prev => 
                              prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hskFilter.includes(lvl) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sorting Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Ngày tạo</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSortBy(sortBy === 'date_desc' ? 'default' : 'date_desc')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortBy === 'date_desc' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          Ngày gần nhất
                        </button>
                        <button
                          onClick={() => setSortBy(sortBy === 'date_asc' ? 'default' : 'date_asc')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortBy === 'date_asc' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          Ngày xa nhất
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Điểm số</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSortBy(sortBy === 'score_desc' ? 'default' : 'score_desc')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortBy === 'score_desc' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          Từ cao đến thấp
                        </button>
                        <button
                          onClick={() => setSortBy(sortBy === 'score_asc' ? 'default' : 'score_asc')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortBy === 'score_asc' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          Từ thấp đến cao
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setHskFilter([]);
                        setSortBy('default');
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>"""
content = re.sub(header_end, filter_panel, content)

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)

print("Done")
