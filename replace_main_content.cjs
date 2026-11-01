const fs = require('fs');
const content = fs.readFileSync('src/components/SavedLessonsList.tsx', 'utf-8');

const startMarker = '{/* Main Content */}';
const endMarker = '      {/* Context Menu Thư mục */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers.");
  process.exit(1);
}

const newMainContent = `{/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-w-0 min-h-0 gap-3">
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {activeFolderId !== null && (
                <button 
                  onClick={() => setActiveFolderId(folders.find(f => f.id === activeFolderId)?.parentId || null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors mr-1 shrink-0"
                  title="Quay lại"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              {activeFolderId === null ? (
                'Thư viện bài học'
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon className="w-6 h-6 text-blue-500 fill-blue-500/20 shrink-0" />
                  <span className="truncate">{folders.find(f => f.id === activeFolderId)?.name || 'Thư mục'}</span>
                </div>
              )}
            </h2>
            <button
              onClick={() => {
                setAddingSubfolderTo(activeFolderId);
                setNewFolderName("");
                setShowFolderModal(true);
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="text-sm font-semibold hidden sm:inline">Tạo thư mục</span>
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            {(() => {
              const displayedFolders = activeFolderId === null 
                ? folders.filter(f => !f.parentId)
                : folders.filter(f => f.parentId === activeFolderId);
                
              return (
                <div className="flex flex-col h-full">
                  {displayedFolders.length > 0 && (
                    <div className="mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {displayedFolders.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setActiveFolderId(f.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setFolderContextMenu({ folderId: f.id, folderName: f.name, x: e.clientX, y: e.clientY });
                            }}
                            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all text-left"
                          >
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                              <FolderIcon className="w-6 h-6 fill-blue-500/20" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{f.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {folders.filter(sub => sub.parentId === f.id).length} thư mục, {lessons.filter(l => l.folderId === f.id).length} bài đọc
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(displayedLessons.length > 0 || displayedFolders.length === 0) && (
                    <div className="flex flex-col flex-1">
                      {displayedFolders.length > 0 && (
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1 border-t border-slate-100 dark:border-slate-800 pt-4">Bài đọc</h3>
                      )}
                      
                      {displayedLessons.length === 0 ? (
                        <div className="text-center py-12 flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400">Chưa có bài đọc nào ở đây.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {displayedLessons.map(lesson => (
                            <div 
                              key={lesson.id}
                              className="group flex flex-col p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer relative"
                              onClick={() => {
                                if (editingLessonId !== lesson.id) {
                                  onOpenLesson(lesson);
                                }
                              }}
                            >
                              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                                {editingLessonId !== lesson.id && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingLessonId(lesson.id);
                                      setEditTitle(lesson.title);
                                    }}
                                    className="p-1.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                                    title="Sửa tên bài đọc"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({
                                      title: "Xóa bài đọc",
                                      message: "Bạn có chắc chắn muốn xóa bài đọc này?",
                                      onConfirm: () => onDeleteLesson(lesson.id)
                                    });
                                  }}
                                  className="p-1.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-start gap-3 mb-2 pr-16">
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                {editingLessonId === lesson.id ? (
                                  <div className="flex items-center gap-1 w-full mt-0.5" onClick={e => e.stopPropagation()}>
                                    <input
                                      autoFocus
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editTitle.trim()) {
                                          onEditLessonTitle(lesson.id, editTitle.trim());
                                          setEditingLessonId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingLessonId(null);
                                        }
                                      }}
                                      className="flex-1 w-full text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => {
                                        if (editTitle.trim()) {
                                          onEditLessonTitle(lesson.id, editTitle.trim());
                                          setEditingLessonId(null);
                                        }
                                      }}
                                      className="p-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg shrink-0"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2 mt-0.5">{lesson.title}</h4>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(lesson.savedAt).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      `;

const newCode = content.substring(0, startIndex) + newMainContent + content.substring(endIndex);
fs.writeFileSync('src/components/SavedLessonsList.tsx', newCode);
console.log("Replaced Main Content successfully!");
