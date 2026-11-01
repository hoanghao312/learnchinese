import React, { useState, useRef, useEffect } from 'react';
import { Folder } from '../types';
import { ChevronDown, ChevronRight, Folder as FolderIcon } from 'lucide-react';

interface CustomFolderSelectProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  rootLabel?: string;
  className?: string;
  allowUncategorized?: boolean;
}

export default function CustomFolderSelect({ 
  folders, 
  selectedFolderId, 
  onSelectFolder,
  rootLabel = "Tất cả thư mục",
  className = "",
  allowUncategorized = false
}: CustomFolderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const children = folders.filter(f => (parentId === null ? !f.parentId : f.parentId === parentId));
    if (children.length === 0) return null;

    return children.map(child => {
      const hasChildren = folders.some(f => f.parentId === child.id);
      const isExpanded = expandedFolders.has(child.id);

      return (
        <React.Fragment key={child.id}>
          <div
            className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedFolderId === child.id ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
            style={{ paddingLeft: `${0.75 + level * 1}rem` }}
            onClick={() => {
              onSelectFolder(child.id);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div 
                className="w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" 
                onClick={(e) => hasChildren ? toggleExpand(e, child.id) : undefined}
              >
                {hasChildren ? (
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-90 text-amber-500" : ""}`} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                )}
              </div>
              <FolderIcon className="w-4 h-4 text-amber-500/80 shrink-0" />
              <span className="truncate text-sm">{child.name}</span>
            </div>
          </div>
          {hasChildren && isExpanded && renderTree(child.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  let displayText = rootLabel;
  if (selectedFolderId === 'uncategorized') {
    displayText = "Chưa phân loại";
  } else if (selectedFolder) {
    displayText = selectedFolder.name;
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate text-left font-medium">
            {displayText}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 scrollbar-thin">
          <div
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedFolderId === null || selectedFolderId === 'all' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
            onClick={() => {
              onSelectFolder(null);
              setIsOpen(false);
            }}
          >
             <FolderIcon className="w-4 h-4 text-amber-500 ml-0.5 shrink-0" />
             <span className="truncate text-sm">{rootLabel}</span>
          </div>

          {allowUncategorized && (
            <div
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedFolderId === 'uncategorized' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
              onClick={() => {
                onSelectFolder('uncategorized');
                setIsOpen(false);
              }}
            >
               <FolderIcon className="w-4 h-4 text-slate-400 ml-0.5 shrink-0" />
               <span className="truncate text-sm">Chưa phân loại</span>
            </div>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
          {renderTree(null, 0)}
        </div>
      )}
    </div>
  );
}
