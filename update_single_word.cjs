const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetType = `onNavigateToPractice?: (folderId: string | 'all' | 'uncategorized', type: 'cloze' | 'ordering') => void;`;
const repType = `onNavigateToPractice?: (targetId: string | 'all' | 'uncategorized', type: 'cloze' | 'ordering', isSingleWord?: boolean) => void;`;
content = content.replace(targetType, repType);


const targetActions = `                  <div className="flex shrink-0 items-center justify-end pr-2 gap-2">
                    <button
                      onClick={(e) => {`;
const repActions = `                  <div className="flex shrink-0 items-center justify-end pr-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onNavigateToPractice) onNavigateToPractice(word.id, 'ordering', true);
                      }}
                      className="p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Tạo bài tập sắp xếp câu cho từ này"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {`;
content = content.replace(targetActions, repActions);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
