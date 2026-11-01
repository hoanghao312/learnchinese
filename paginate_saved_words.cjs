const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// Add states
content = content.replace(
  '  const [draggedColId, setDraggedColId] = useState<string | null>(null);',
  `  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;`
);

// Reset current page when filters change
content = content.replace(
  '  useEffect(() => {',
  `  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, activeFolderId]);

  useEffect(() => {`
);

// Add paginatedWords
content = content.replace(
  '  const filteredWords = activeFilter === null ? [] : savedWords.filter((word) => {',
  `  const filteredWords = activeFilter === null ? [] : savedWords.filter((word) => {`
);

// Change mapping from filteredWords to paginatedWords
content = content.replace(
  '{filteredWords.map((word, index) => {',
  `{(() => {
              const paginatedWords = filteredWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              return paginatedWords.map((word, index) => {
                const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;`
);
// replace index + 1 with actualIndex + 1
content = content.replace(
  '{index + 1}',
  '{actualIndex + 1}'
);

content = content.replace(
  '              );\\n            })}\\n          </AnimatePresence>\\n        </div>\\n      ) : null}',
  `              );
              });
            })()}
          </AnimatePresence>
        </div>
        
        {/* Pagination Controls */}
        {filteredWords.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Hiển thị <span className="font-medium text-slate-700 dark:text-slate-300">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, filteredWords.length)}</span> trong số <span className="font-medium text-slate-700 dark:text-slate-300">{filteredWords.length}</span> từ
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <div className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                {currentPage} / {Math.ceil(filteredWords.length / ITEMS_PER_PAGE)}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredWords.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(filteredWords.length / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      ) : null}`
);


fs.writeFileSync('src/components/SavedWordsList.tsx', content);
