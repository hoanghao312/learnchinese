const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetImport = 'Trash2, Dumbbell, BookOpen,';
const repImport = 'Trash2, Dumbbell, AlignLeft, BookOpen,';
content = content.replace(targetImport, repImport);

const targetType = `onNavigateToPractice?: (folderId: string | 'all' | 'uncategorized') => void;`;
const repType = `onNavigateToPractice?: (folderId: string | 'all' | 'uncategorized', type: 'cloze' | 'ordering') => void;`;
content = content.replace(targetType, repType);

// Add state
const targetState = `  const [searchQuery, setSearchQuery] = useState("");`;
const repState = `  const [searchQuery, setSearchQuery] = useState("");
  const [showPracticeModal, setShowPracticeModal] = useState<{folderId: string | 'all' | 'uncategorized' | null} | null>(null);`;
content = content.replace(targetState, repState);

// Replace the click handlers
content = content.replace(/if \(onNavigateToPractice\) onNavigateToPractice\('all'\);/g, "setShowPracticeModal({folderId: 'all'});");
content = content.replace(/if \(onNavigateToPractice\) onNavigateToPractice\('uncategorized'\);/g, "setShowPracticeModal({folderId: 'uncategorized'});");
content = content.replace(/if \(onNavigateToPractice\) onNavigateToPractice\(f\.id\);/g, "setShowPracticeModal({folderId: f.id});");

const targetEnd = `      {/* Delete Category Modal */}`;
const repEnd = `      {/* Practice Type Modal */}
      <AnimatePresence>
        {showPracticeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">Chọn chế độ luyện tập</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    if (onNavigateToPractice && showPracticeModal.folderId) onNavigateToPractice(showPracticeModal.folderId, 'cloze');
                    setShowPracticeModal(null);
                  }}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 font-semibold transition-colors"
                >
                  <AlignLeft className="w-5 h-5" />
                  Bài tập đục lỗ
                </button>
                <button 
                  onClick={() => {
                    if (onNavigateToPractice && showPracticeModal.folderId) onNavigateToPractice(showPracticeModal.folderId, 'ordering');
                    setShowPracticeModal(null);
                  }}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 font-semibold transition-colors"
                >
                  <Dumbbell className="w-5 h-5" />
                  Sắp xếp câu
                </button>
              </div>
              <button 
                onClick={() => setShowPracticeModal(null)}
                className="mt-4 w-full p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                Hủy
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Category Modal */}`;
content = content.replace(targetEnd, repEnd);


fs.writeFileSync('src/components/SavedWordsList.tsx', content);
