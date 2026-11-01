import React, { useState, useEffect } from 'react';
import { SavedLesson, Folder as FolderType } from '../types';
import { Folder as FolderIcon, FileText, ChevronRight, Clock, Trash2, X, Edit2, Check, FolderPlus, Plus, ChevronDown, ChevronUp, MoreVertical, Headphones, Sparkles } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface SavedLessonsListProps {
  lessons: SavedLesson[];
  folders: FolderType[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  onOpenLesson: (lesson: SavedLesson) => void;
  onOpenListening?: (lesson: SavedLesson) => void;
  onOpenVirtualTutor?: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onUpdateFolder: (id: string, newName: string) => void;
  onMoveFolder: (draggedId: string, targetId: string | null) => void;
  onEditLessonTitle: (lessonId: string, newTitle: string) => void;
}

export default function SavedLessonsList({ 
  lessons, 
  folders, 
  activeFolderId, 
  setActiveFolderId, 
  onOpenLesson, 
  onOpenListening,
  onOpenVirtualTutor,
  onDeleteLesson, 
  onDeleteFolder, 
  onCreateFolder, 
  onUpdateFolder, 
  onMoveFolder, 
  onEditLessonTitle 
}: SavedLessonsListProps) {
  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [addingSubfolderTo, setAddingSubfolderTo] = useState<string | null>(null);
  const [subfolderName, setSubfolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folderId: string | 'all' | 'uncategorized';
    folderName: string;
    x: number;
    y: number;
  } | null>(null);

  const displayedLessons = (activeFolderId === null
    ? lessons.filter(l => !l.folderId)
    : lessons.filter(l => l.folderId === activeFolderId)
  ).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

  useEffect(() => {
    const handleClickOutside = () => setFolderContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto h-[calc(100vh-100px)] min-h-[600px] flex flex-col md:flex-row gap-6 relative">
      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Delete Folder Modal */}
      <ConfirmModal
        isOpen={!!folderToDelete}
        title="Xóa thư mục"
        message="Bạn có chắc chắn muốn xóa thư mục này? Các bài đọc bên trong cũng sẽ bị xóa."
        onConfirm={() => {
          if (folderToDelete) {
            onDeleteFolder(folderToDelete);
            setFolderToDelete(null);
          }
        }}
        onCancel={() => setFolderToDelete(null)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-w-0 min-h-0 gap-3">
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {activeFolderId !== null && (
                <button 
                  onClick={() => setActiveFolderId(folders.find(f => f.id === activeFolderId)?.parentId || null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors mr-1 shrink-0 cursor-pointer"
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
            <div className="flex items-center gap-2">
              {onOpenVirtualTutor && (
                <button
                  type="button"
                  onClick={onOpenVirtualTutor}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-xs shrink-0 cursor-pointer text-sm font-semibold hover:shadow-md"
                  title="Học phát âm cùng nhân vật ảo AI (Virtual Pronunciation Tutor)"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Học cùng nhân vật AI</span>
                </button>
              )}
              <button
                onClick={() => {
                  setAddingSubfolderTo(activeFolderId);
                  setNewFolderName("");
                  setShowFolderModal(true);
                }}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm font-semibold hidden sm:inline">Tạo thư mục</span>
              </button>
            </div>
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
                      <div className="flex flex-col gap-3">
                        {displayedFolders.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setActiveFolderId(f.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setFolderContextMenu({ folderId: f.id, folderName: f.name, x: e.clientX, y: e.clientY });
                            }}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all text-left"
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
                              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all z-10">
                                {onOpenVirtualTutor && editingLessonId !== lesson.id && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenVirtualTutor();
                                    }}
                                    className="p-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg transition shadow-xs cursor-pointer"
                                    title="Học phát âm cùng nhân vật AI"
                                  >
                                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </button>
                                )}
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
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-400 font-medium mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/40">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(lesson.savedAt).toLocaleDateString('vi-VN')}
                                </div>
                                {onOpenListening && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenListening(lesson);
                                    }}
                                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-0.5 rounded-md transition cursor-pointer"
                                    title="Luyện nghe đoạn văn này"
                                  >
                                    <Headphones className="w-3 h-3" />
                                    <span>Luyện nghe đoạn văn</span>
                                  </button>
                                )}
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

            {/* Context Menu Thư mục */}
      {folderContextMenu && (
        <div 
          className="fixed z-50 min-w-[200px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: Math.min(folderContextMenu.x, window.innerWidth - 200), 
            top: Math.min(folderContextMenu.y, window.innerHeight - 300) 
          }}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
              {folderContextMenu.folderName}
            </span>
          </div>
          
          <div className="p-1">
            {folderContextMenu.folderId !== 'all' && folderContextMenu.folderId !== 'uncategorized' && (
              <>
                <button 
                  className="w-full text-left px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingSubfolderTo(folderContextMenu.folderId);
                    setSubfolderName("");
                    setFolderContextMenu(null);
                  }}
                >
                  <FolderPlus className="w-4 h-4 text-blue-500" /> Thêm thư mục con
                </button>
                <button 
                  className="w-full text-left px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(folderContextMenu.folderId);
                    setEditingFolderName(folderContextMenu.folderName);
                    setFolderContextMenu(null);
                  }}
                >
                  <Edit2 className="w-4 h-4 text-amber-500" /> Đổi tên thư mục
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                <button 
                  className="w-full text-left px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderToDelete(folderContextMenu.folderId);
                    setFolderContextMenu(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Xóa thư mục
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tạo thư mục chính */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Thêm thư mục mới</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên thư mục</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  placeholder="VD: Giáo trình HSK, Bài đọc 1..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      onCreateFolder(newFolderName.trim());
                      setShowFolderModal(false);
                      setNewFolderName("");
                    }
                  }}
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button 
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (newFolderName.trim()) {
                    onCreateFolder(newFolderName.trim());
                    setShowFolderModal(false);
                    setNewFolderName("");
                  }
                }}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                Tạo thư mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
