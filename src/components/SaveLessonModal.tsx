import React, { useState, useEffect } from 'react';
import { Folder as FolderType } from '../types';
import { X, Folder, Plus, FileText } from 'lucide-react';

interface SaveLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderId: string | null, newFolderName?: string, lessonTitle?: string) => void;
  folders: FolderType[];
  defaultLessonTitle?: string;
}

export default function SaveLessonModal({ isOpen, onClose, onSave, folders, defaultLessonTitle }: SaveLessonModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLessonTitle(defaultLessonTitle || `Bài đọc ${new Date().toLocaleDateString('vi-VN')}`);
      setSelectedFolderId(null);
      setIsCreatingNew(false);
      setNewFolderName('');
    }
  }, [isOpen, defaultLessonTitle]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalTitle = lessonTitle.trim() || defaultLessonTitle || `Bài đọc ${new Date().toLocaleDateString('vi-VN')}`;
    if (isCreatingNew) {
      if (!newFolderName.trim()) return;
      onSave(null, newFolderName.trim(), finalTitle);
    } else {
      onSave(selectedFolderId, undefined, finalTitle);
    }
    setNewFolderName('');
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">Lưu bài đọc</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Tên bài đọc</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Nhập tên bài đọc..."
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Chọn thư mục lưu</label>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!isCreatingNew && selectedFolderId === null ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="folder" 
                  checked={!isCreatingNew && selectedFolderId === null} 
                  onChange={() => { setSelectedFolderId(null); setIsCreatingNew(false); }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1 font-medium text-slate-700">Không có thư mục</span>
              </label>
              {folders.map(folder => (
                <label key={folder.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!isCreatingNew && selectedFolderId === folder.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="radio" 
                    name="folder" 
                    checked={!isCreatingNew && selectedFolderId === folder.id} 
                    onChange={() => { setSelectedFolderId(folder.id); setIsCreatingNew(false); }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Folder className="w-5 h-5 text-slate-400" />
                  <span className="flex-1 font-medium text-slate-700">{folder.name}</span>
                </label>
              ))}
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isCreatingNew ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="folder" 
                  checked={isCreatingNew} 
                  onChange={() => setIsCreatingNew(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <Plus className="w-5 h-5 text-slate-400" />
                <span className="flex-1 font-medium text-slate-700">Tạo thư mục mới...</span>
              </label>
            </div>

            {isCreatingNew && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  placeholder="Nhập tên thư mục mới..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={(isCreatingNew && !newFolderName.trim()) || !lessonTitle.trim()}
            className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
