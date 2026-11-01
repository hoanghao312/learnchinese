import React, { useState, useEffect } from "react";
import { SavedWord, Token, Folder } from "../types";
import { Search, Filter, Volume2, Trash2, Dumbbell, AlignLeft, BookOpen, Book, Play, Clock, Award, Star, Plus, X, Check, Loader2, FileSpreadsheet, ArrowLeftRight, Pencil, ChevronDown, ChevronUp, Download, Library, Folder as FolderIcon, FolderPlus, MoreVertical, PlusSquare, MinusSquare, ChevronRight, ArrowLeft, Eraser, Sparkles, Layers } from "lucide-react";
import { speakMandarin } from "../utils/speech";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import Flashcards from "./Flashcards";
import CustomFolderSelect from "./CustomFolderSelect";
import GoogleDrivePickerModal from "./GoogleDrivePickerModal";
import { getPartOfSpeechTextColor, getHskTextColor } from "../utils/wordTypeColors";

interface SavedWordsListProps {
  savedWords: SavedWord[];
  folders: Folder[];
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onUpdateFolder: (id: string, newName: string) => void;
  onMoveFolder?: (draggedId: string, targetId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (wordIds: string[], folderId: string | null) => void;
  onRemoveWord: (id: string | string[]) => void;
  onToggleWordStatus?: (id: string, isKnown: boolean) => void;
  onReviewWord?: (id: string, grade: number, mode: 'zh-vi' | 'vi-zh') => void;
  onResetProgress?: (folderId: string | null, mode: 'zh-vi' | 'vi-zh') => void;
  onNavigateToPractice?: (targetId: string | 'all' | 'uncategorized', type: 'cloze' | 'ordering', isSingleWord?: boolean) => void;
  onOpenRadicalBreakdown?: (word: string) => void;
  onUpdateWord?: (id: string, updatedData: Partial<SavedWord>) => void;
  onSelectWord: (token: Token) => void;
  onAddWord: (wordData: Omit<SavedWord, 'id' | 'savedAt'>) => void;
  onAddWords?: (wordsData: Omit<SavedWord, 'id' | 'savedAt'>[]) => Promise<void>;
}

export default function SavedWordsList({
  savedWords,
  folders,
  onCreateFolder,
  onUpdateFolder,
  onMoveFolder,
  onDeleteFolder,
  onMoveToFolder,
  onRemoveWord,
  onToggleWordStatus,
  onReviewWord,
  onResetProgress,
  onNavigateToPractice,
  onOpenRadicalBreakdown,
  onUpdateWord,
  onSelectWord,
  onAddWord,
  onAddWords,
}: SavedWordsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [hskFilter, setHskFilter] = useState<string[]>([]);
  const [missingDataFilter, setMissingDataFilter] = useState<("pinyin"|"translation"|"partOfSpeech"|"hskLevel")[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('default');
  const [showAddForm, setShowAddForm] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState<'zh-vi' | 'vi-zh' | null>(null);
  const [newText, setNewText] = useState("");
  const [newPinyin, setNewPinyin] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newPartOfSpeech, setNewPartOfSpeech] = useState("");
  const [newHskLevel, setNewHskLevel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [updatingWordIds, setUpdatingWordIds] = useState<Set<string>>(new Set());
  const [editPinyin, setEditPinyin] = useState("");
  const [editTranslation, setEditTranslation] = useState("");
  const [editPartOfSpeech, setEditPartOfSpeech] = useState("");
  const [editHskLevel, setEditHskLevel] = useState("");

  const [activeFilter, setActiveFilter] = useState<'learning' | 'known' | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  
  const [addingSubfolderTo, setAddingSubfolderTo] = useState<string | null>(null);
  const [subfolderName, setSubfolderName] = useState("");

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const hasInitializedExpandedRef = React.useRef(false);

  useEffect(() => {
    if (!hasInitializedExpandedRef.current && folders.length > 0) {
      hasInitializedExpandedRef.current = true;
      setExpandedFolders(new Set(folders.map(f => f.id)));
    }
  }, [folders]);

  // Folders that have children
  const parentFolders = folders.filter(f => folders.some(c => c.parentId === f.id));
  const areAllFoldersExpanded = parentFolders.length > 0 && parentFolders.every(f => expandedFolders.has(f.id));

  const handleToggleAllFolders = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (areAllFoldersExpanded) {
      setExpandedFolders(new Set());
    } else {
      setExpandedFolders(new Set(folders.map(f => f.id)));
    }
  };

  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [dragAction, setDragAction] = useState<'select' | 'deselect' | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    wordId: string;
    x: number;
    y: number;
    showFolders: boolean;
    folderParentId: string | null;
  } | null>(null);

  const [folderContextMenu, setFolderContextMenu] = useState<{
    folderId: string | 'all' | 'uncategorized';
    folderName: string;
    x: number;
    y: number;
  } | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFolderId, setExportFolderId] = useState<string | null>(null);
  const [exportIncludeSubfolders, setExportIncludeSubfolders] = useState(true);
  const [exportFilterStatus, setExportFilterStatus] = useState<'all' | 'learning' | 'known'>('all');

  const handleOpenExportModal = (targetFolderId?: string | null) => {
    if (savedWords.length === 0) return;
    let initialFolder: string | null = null;
    if (targetFolderId !== undefined) {
      initialFolder = targetFolderId === 'all' ? null : targetFolderId;
    } else if (activeFolderId && activeFolderId !== 'all') {
      initialFolder = activeFolderId;
    }
    setExportFolderId(initialFolder);
    setExportIncludeSubfolders(true);
    setExportFilterStatus(activeFilter || 'all');
    setShowExportModal(true);
  };

  const getExportWordsList = () => {
    return savedWords.filter(word => {
      // Filter by status
      if (exportFilterStatus === 'learning' && word.isKnown) return false;
      if (exportFilterStatus === 'known' && !word.isKnown) return false;

      // Filter by folder
      if (exportFolderId === null || exportFolderId === 'all') return true;
      if (exportFolderId === 'uncategorized') return !word.folderId;
      
      if (word.folderId === exportFolderId) return true;
      
      if (exportIncludeSubfolders) {
        let isDescendant = false;
        let currentParent = folders.find(f => f.id === word.folderId)?.parentId;
        while (currentParent) {
          if (currentParent === exportFolderId) {
            isDescendant = true;
            break;
          }
          currentParent = folders.find(f => f.id === currentParent)?.parentId;
        }
        return isDescendant;
      }
      return false;
    });
  };

  const handleExecuteExport = () => {
    const wordsToExport = getExportWordsList();
    if (wordsToExport.length === 0) return;

    let filename = "tu-vung-tat-ca.xlsx";
    if (exportFolderId === 'uncategorized') {
      filename = "tu-vung-chua-phan-loai.xlsx";
    } else if (exportFolderId) {
      const folder = folders.find(f => f.id === exportFolderId);
      const cleanName = (folder?.name || 'thu-muc').replace(/[/\\?%*:|"<>]/g, '-').trim();
      filename = `tu-vung-${cleanName}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(
      wordsToExport.map((w, idx) => ({
        "Số TT": idx + 1,
        "Hán tự": w.text,
        "Pinyin": w.pinyin === "?" ? "" : w.pinyin,
        "Nghĩa tiếng Việt": w.translation === "(Chưa cấp nghĩa)" ? "" : w.translation,
        "Loại từ": w.partOfSpeech || "",
        "Cấp độ HSK": w.hskLevel || "",
        "Thư mục": w.folderId ? getFolderPath(w.folderId) : "Chưa phân loại",
        "Điểm số": w.lastPracticeScore != null ? `${w.lastPracticeScore}/10` : "",
        "Trạng thái": w.isKnown ? "Đã biết" : "Chưa biết"
      })),
      { header: ["Số TT", "Hán tự", "Pinyin", "Nghĩa tiếng Việt", "Loại từ", "Cấp độ HSK", "Thư mục", "Điểm số", "Trạng thái"] }
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Từ vựng");
    XLSX.writeFile(wb, filename);
    setShowExportModal(false);
  };

  const [columns, setColumns] = useState([
    { id: 'text', title: 'Hán tự', flexStyle: { width: 85, flexShrink: 0 } },
    { id: 'pinyin', title: 'Pinyin', flexStyle: { width: 105, flexShrink: 0 } },
    { id: 'translation', title: 'Nghĩa tiếng Việt', flexStyle: { flex: 1, minWidth: 100 } },
    { id: 'partOfSpeech', title: 'Loại từ', flexStyle: { width: 80, flexShrink: 0 } },
    { id: 'hsk', title: 'Cấp độ HSK', flexStyle: { width: 80, flexShrink: 0 } },
    { id: 'createdAt', title: 'Ngày tạo', flexStyle: { width: 88, flexShrink: 0 } },
  ]);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, activeFolderId, hskFilter, sortBy, missingDataFilter]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setFolderContextMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedColId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === id) return;
    
    const draggedIndex = columns.findIndex(c => c.id === draggedColId);
    const targetIndex = columns.findIndex(c => c.id === id);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newColumns = [...columns];
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);
      setColumns(newColumns);
    }
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
  };

  const getFolderPath = (folderId: string) => {
    let current = folders.find(f => f.id === folderId);
    if (!current) return '-';
    let path = current.name;
    while (current?.parentId) {
      current = folders.find(f => f.id === current?.parentId);
      if (current) path = current.name + ' / ' + path;
    }
    return path;
  };

  const filteredWords = savedWords.filter((word) => {
    if (activeFilter === 'learning' && word.isKnown) return false;
    if (activeFilter === 'known' && !word.isKnown) return false;
    
    if (hskFilter.length > 0) {
      const lvl = word.hskLevel || 'Chưa phân loại';
      if (!hskFilter.includes(lvl)) return false;
    }

    if (missingDataFilter.length > 0) {
      const isMissingPinyin = !word.pinyin || word.pinyin === '?';
      const isMissingTranslation = !word.translation || word.translation === '(Chưa cấp nghĩa)';
      const isMissingPoS = !word.partOfSpeech;
      const isMissingHsk = !word.hskLevel;

      let matchMissing = false;
      if (missingDataFilter.includes('pinyin') && isMissingPinyin) matchMissing = true;
      if (missingDataFilter.includes('translation') && isMissingTranslation) matchMissing = true;
      if (missingDataFilter.includes('partOfSpeech') && isMissingPoS) matchMissing = true;
      if (missingDataFilter.includes('hskLevel') && isMissingHsk) matchMissing = true;

      if (!matchMissing) return false;
    }
    
    if (activeFolderId === 'uncategorized' && word.folderId) return false;
    if (activeFolderId && activeFolderId !== 'uncategorized' && activeFolderId !== 'all') {
      if (word.folderId !== activeFolderId) {
        let isDescendant = false;
        let currentParent = folders.find(f => f.id === word.folderId)?.parentId;
        while (currentParent) {
          if (currentParent === activeFolderId) {
            isDescendant = true;
            break;
          }
          currentParent = folders.find(f => f.id === currentParent)?.parentId;
        }
        if (!isDescendant) return false;
      }
    }
    const query = searchQuery.toLowerCase();
    return (
      word.text.includes(query) ||
      word.pinyin.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query) ||
      (word.partOfSpeech && word.partOfSpeech.toLowerCase().includes(query))
    );
  });

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortBy === 'date_desc') return (b.savedAt || 0) - (a.savedAt || 0);
    if (sortBy === 'date_asc') return (a.savedAt || 0) - (b.savedAt || 0);
    if (sortBy === 'score_desc') return (b.lastPracticeScore || 0) - (a.lastPracticeScore || 0);
    if (sortBy === 'score_asc') return (a.lastPracticeScore || 0) - (b.lastPracticeScore || 0);
    
    // default sort: HSK level ascending (HSK 1 -> HSK 6). No level -> 3.5 (above HSK 4)
    const getHskWeight = (level?: string) => {
      if (!level) return 3.5;
      const match = level.match(/HSK\s*(\d+)/i);
      if (match) return parseInt(match[1]);
      return 3.5;
    };
    
    const weightA = getHskWeight(a.hskLevel);
    const weightB = getHskWeight(b.hskLevel);
    
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    
    // fallback to newest date if same HSK
    return (b.savedAt || 0) - (a.savedAt || 0);
  });

  const handleSpeak = (text: string) => {
    speakMandarin(text, 1.0);
  };

  const handleAutoUpdateWords = async (targets: {id: string, text: string}[]) => {
    if (!onUpdateWord) return;
    
    setUpdatingWordIds(prev => {
      const next = new Set(prev);
      targets.forEach(t => next.add(t.id));
      return next;
    });

    for (const target of targets) {
      try {
        const response = await fetch('/api/lookup-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: target.text })
        });
        if (response.ok) {
          const data = await response.json();
          onUpdateWord(target.id, {
            pinyin: data.pinyin || undefined,
            translation: data.translation || undefined,
            partOfSpeech: data.partOfSpeech || undefined,
            hskLevel: data.hskLevel || undefined,
            example: data.example || undefined
          });
        }
      } catch (error) {
        console.log("Failed to auto update word:", error);
      } finally {
        setUpdatingWordIds(prev => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    
    setIsAdding(true);
    
    const hskLvl = newHskLevel.trim();
    
    await onAddWord({
      text: newText.trim(),
      pinyin: newPinyin.trim(),
      translation: newTranslation.trim(),
      partOfSpeech: newPartOfSpeech.trim(),
      ...(hskLvl ? { hskLevel: hskLvl } : {})
    });
    setIsAdding(false);
    
    // Reset form but keep it open in case they want to add more
    setNewText("");
    setNewPinyin("");
    setNewTranslation("");
    setNewPartOfSpeech("");
    setNewHskLevel("");
  };

  const handleRemoveDuplicates = () => {
    const seenText = new Set<string>();
    const duplicateIds: string[] = [];
    
    for (const word of savedWords) {
      if (seenText.has(word.text)) {
        duplicateIds.push(word.id);
      } else {
        seenText.add(word.text);
      }
    }
    
    if (duplicateIds.length > 0) {
      onRemoveWord(duplicateIds);
    } else {
      alert("Không tìm thấy từ vựng trùng lặp nào!");
    }
  };

  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [targetExcelFolderId, setTargetExcelFolderId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processExcelFile = async (file: File) => {
    setIsProcessingExcel(true);
    let timerId: any = null;
    try {
      let jsonStr: any[][] = [];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'txt') {
        const textData = await file.text();
        const lines = textData.split('\n');
        for (const line of lines) {
           const cleanedLine = line.trim();
           if (!cleanedLine) continue;
           if (cleanedLine.includes('\t')) {
             jsonStr.push(cleanedLine.split('\t').map(c => c.trim()));
           } else if (cleanedLine.includes(',')) {
             jsonStr.push(cleanedLine.split(',').map(c => c.trim()));
           } else {
             jsonStr.push([cleanedLine]);
           }
        }
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        jsonStr = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }

      let validRows: { text: string; pinyin: string; translation: string; partOfSpeech: string }[] = [];
      let estimatedSecs = 0;
      const seenWords = new Set<string>(savedWords.map(w => w.text));

      for (let i = 0; i < jsonStr.length; i++) {
        const row = jsonStr[i] as any[];
        if (!row || !Array.isArray(row) || row.length === 0) continue;

        let chineseColIdx = -1;
        for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || "").trim();
            if (val && /[\u4e00-\u9fa5]/.test(val)) {
                chineseColIdx = j;
                break;
            }
        }

        let text = "";
        let pinyin = "";
        let translation = "";
        let partOfSpeech = "";
        let hskLevel = "";

        if (chineseColIdx !== -1) {
            text = String(row[chineseColIdx] || "").trim();
            pinyin = String(row[chineseColIdx + 1] || "").trim();
            translation = String(row[chineseColIdx + 2] || "").trim();
            partOfSpeech = String(row[chineseColIdx + 3] || "").trim();
            hskLevel = String(row[chineseColIdx + 4] || "").trim();
        } else {
            text = String(row[0] || "").trim();
            pinyin = String(row[1] || "").trim();
            translation = String(row[2] || "").trim();
            partOfSpeech = String(row[3] || "").trim();
            hskLevel = String(row[4] || "").trim();
        }

        // Chỉ giữ lại Hán tự, xoá các số, ký tự đặc biệt, v.v.
        text = text.replace(/[^\u4e00-\u9fa5]/g, "");

        if (!text) continue;
        const textLower = text.toLowerCase();
        if (textLower === "hán" || textLower === "từ vựng" || textLower === "word" || textLower === "text") {
            continue;
        }

        // Bỏ qua các từ vựng đã có trong danh sách
        if (seenWords.has(text)) {
            continue;
        }

        seenWords.add(text);
        validRows.push({ text, pinyin, translation, partOfSpeech, hskLevel, folderId: targetExcelFolderId } as any);
        
        const hasTranslation = translation !== "";
        const hasPinyin = pinyin !== "";
        if (!hasTranslation || !hasPinyin) {
          estimatedSecs += 1.5;
        } else {
          estimatedSecs += 0.1;
        }
      }

      const totalEstimated = Math.ceil(estimatedSecs);
      setEstimatedTimeRemaining(totalEstimated);

      timerId = setInterval(() => {
        setEstimatedTimeRemaining((prev) => {
          if (prev === null) return null;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
      
      if (onAddWords) {
        await onAddWords(validRows as any[]);
      } else {
        for (const rowData of validRows as any[]) {
          const w: any = {
            text: rowData.text,
            pinyin: rowData.pinyin,
            translation: rowData.translation,
            partOfSpeech: rowData.partOfSpeech
          };
          if (rowData.hskLevel && String(rowData.hskLevel).trim() !== "") {
            w.hskLevel = String(rowData.hskLevel).trim();
          }
          if (rowData.folderId) {
            w.folderId = rowData.folderId;
          }
          await onAddWord(w);
        }
      }
    } catch (err) {
      console.log("Lỗi đọc file:", err);
      alert("Đã xảy ra lỗi khi đọc file. Định dạng dữ liệu chưa phù hợp.");
    } finally {
      if (timerId) clearInterval(timerId);
      setIsProcessingExcel(false);
      setEstimatedTimeRemaining(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelFile(file);
  };

  if (flashcardMode) {
    return (
      <Flashcards 
        words={savedWords} 
        folders={folders}
        initialFolderId={activeFolderId}
        onReviewWord={(id, grade, mode) => {
          if (onReviewWord) onReviewWord(id, grade, mode);
        }} 
        onResetProgress={onResetProgress}
        onClose={() => setFlashcardMode(null)} 
        learningMode={flashcardMode}
        onChangeMode={setFlashcardMode}
        onOpenRadicalBreakdown={onOpenRadicalBreakdown}
      />
    );
  }

  return (
    <div className="flex flex-col relative h-full w-full overflow-hidden">
            {/* Sticky Header Section */}
      <div className="shrink-0 z-40 bg-white dark:bg-slate-900 pb-2 pt-1 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2">
        <div className="flex justify-center w-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Book className="w-4 h-4 text-amber-500" />
            <span>TỪ VỰNG ({savedWords.length})</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Dynamic Search Bar & Add Folder */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:flex-1">
            {activeFolderId !== null && (
              <>
                <div className="relative flex-1 min-w-[110px] sm:flex-none sm:w-56 shrink-0">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                id="saved-words-search"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`shrink-0 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 h-[34px] rounded-xl border text-xs font-medium transition-colors ${showAdvancedFilters ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lọc & Sắp xếp</span>
            </button>
              </>
            )}
            <button
              onClick={() => setShowFolderModal(true)}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl border border-amber-200 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/50 font-medium transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm thư mục</span>
            </button>
            {parentFolders.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAllFolders}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium transition-colors shadow-2xs cursor-pointer"
                title={areAllFoldersExpanded ? "Ẩn các thư mục con (Thu gọn)" : "Hiện các thư mục con (Mở rộng)"}
              >
                {areAllFoldersExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Thu gọn</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Mở rộng</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto md:justify-end">
          {/* Advanced Filter Modal */}
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

                    {/* Missing Data Filter */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Từ vựng thiếu thông tin</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'pinyin', label: 'Thiếu Pinyin' },
                          { id: 'translation', label: 'Thiếu Nghĩa' },
                          { id: 'partOfSpeech', label: 'Thiếu Loại từ' },
                          { id: 'hskLevel', label: 'Thiếu HSK' }
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setMissingDataFilter(prev => 
                                prev.includes(item.id as any) 
                                  ? prev.filter(i => i !== item.id) 
                                  : [...prev, item.id as any]
                              );
                            }}
                            className={`px-4 py-2 rounded text-sm transition-colors border ${missingDataFilter.includes(item.id as any) ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                          >
                            {item.label}
                          </button>
                        ))}
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
                        setMissingDataFilter([]);
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
          </AnimatePresence>
            
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFlashcardMode('zh-vi')}
              className="px-2.5 py-1.5 rounded-xl border transition-all duration-300 flex-shrink-0 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center justify-center gap-2"
              title="Ôn tập Flashcards"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold hidden sm:inline whitespace-nowrap">Flashcards</span>
            </button>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv, .txt" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => setShowExcelUploadModal(true)}
              disabled={isProcessingExcel}
              className={`relative p-1.5 rounded-xl border transition-all duration-300 flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50`}
              title="Nhập từ vựng bằng file Excel"
            >
              {estimatedTimeRemaining !== null && (
                <span className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center shadow-sm">
                  {estimatedTimeRemaining}s
                </span>
              )}
              {isProcessingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => handleOpenExportModal()}
              disabled={savedWords.length === 0}
              className={`p-1.5 rounded-xl border transition-all duration-300 flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50`}
              title="Xuất từ vựng ra file Excel"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleRemoveDuplicates}
              disabled={savedWords.length === 0}
              className={`p-1.5 rounded-xl border transition-all duration-300 flex-shrink-0 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50`}
              title="Xóa từ trùng lặp"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`p-1.5 rounded-xl border transition-all duration-300 flex-shrink-0 ${showAddForm ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 text-amber-700 dark:text-amber-400' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 hover:opacity-90'}`}
              title="Thêm từ vựng mới"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
            </div>
          </div>
        </div>
      </div>
          
      {/* Drive-style Filter Bar */}
      <div className="grid grid-cols-2 gap-2 mt-3 mb-2 w-full">
        <button
            onClick={() => setActiveFilter(activeFilter === 'learning' ? null : 'learning')}
            className={`w-full flex justify-center items-center gap-1.5 px-2 py-2 rounded-xl border text-[13px] font-medium transition-colors ${
              activeFilter === 'learning' 
                ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750'
            }`}
          >
            <span className="truncate">Chưa biết ({savedWords.filter(w => !w.isKnown).length})</span>
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'known' ? null : 'known')}
            className={`w-full flex justify-center items-center gap-1.5 px-2 py-2 rounded-xl border text-[13px] font-medium transition-colors ${
              activeFilter === 'known' 
                ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750'
            }`}
          >
            <span className="truncate">Đã biết ({savedWords.filter(w => w.isKnown).length})</span>
          </button>
        </div>
      {/* Add Custom Word Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
            onSubmit={handleAddSubmit}
          >
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 items-end">
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Chữ Hán *</label>
                <input 
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="VD: 学习" 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-sm focus:outline-none focus:border-amber-400 dark:text-slate-200" 
                />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Pinyin</label>
                <input 
                  value={newPinyin}
                  onChange={(e) => setNewPinyin(e.target.value)}
                  placeholder="VD: xuéxí" 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-sm focus:outline-none focus:border-amber-400 dark:text-slate-200" 
                />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Dịch nghĩa</label>
                <input 
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="Tự động tra nếu để trống" 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-sm focus:outline-none focus:border-amber-400 dark:text-slate-200" 
                />
              </div>
              <div className="w-full md:w-[15%]">
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Cấp độ HSK</label>
                <input 
                  value={newHskLevel}
                  onChange={(e) => setNewHskLevel(e.target.value)}
                  placeholder="VD: HSK 1" 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-sm focus:outline-none focus:border-amber-400 dark:text-slate-200" 
                />
              </div>
              <div className="w-full md:w-[15%]">
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Từ loại</label>
                <input 
                  value={newPartOfSpeech}
                  onChange={(e) => setNewPartOfSpeech(e.target.value)}
                  placeholder="VD: Động từ" 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-sm focus:outline-none focus:border-amber-400 dark:text-slate-200" 
                />
              </div>
              <div className="w-full md:w-[10%]">
                <button disabled={isAdding} type="submit" className="w-full h-10 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-colors">
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> <span className="md:hidden">Thêm</span></>}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Layout Wrapper */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 sm:gap-3 mt-2 items-stretch h-full pb-2">
        {/* Compact Horizontal Folder Bar on Mobile */}
        {activeFolderId !== null && (
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 shrink-0 select-none">
            <button
              onClick={() => setActiveFolderId(null)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Thư mục</span>
            </button>
            <button
              onClick={() => setActiveFolderId('all')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeFolderId === 'all'
                  ? 'bg-amber-500 text-white border border-amber-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FolderIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Tất cả</span>
            </button>
            <button
              onClick={() => setActiveFolderId('uncategorized')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeFolderId === 'uncategorized'
                  ? 'bg-amber-500 text-white border border-amber-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FolderIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Chưa phân loại</span>
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  activeFolderId === folder.id
                    ? 'bg-amber-500 text-white border border-amber-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <FolderIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="max-w-[110px] truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Folders Sidebar (Desktop) */}
        {activeFolderId !== null && (
          <div className="hidden md:flex md:w-64 shrink-0 flex-col h-full bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden select-none">
            <div className="shrink-0 p-4 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thư mục</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
              <button
                onClick={() => setActiveFolderId(null)}
                className="w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-start gap-2 transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Quay lại</span>
              </button>
              <div className="relative group flex items-center">
              <button
                onClick={() => setActiveFolderId('all')}
                onContextMenu={(e) => {
                  e.preventDefault();
                }}
                className={`w-full px-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-start gap-1.5 transition-all ${
                  activeFolderId === 'all'
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Tất cả từ vựng</span>
              </button>
              </div>
              <div 
                className={`relative group flex items-center ${dragOverFolderId === 'root' ? 'ring-2 ring-amber-400 rounded-xl' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId('root'); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null); }}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  setDragOverFolderId(null); 
                  if (draggedFolderId && onMoveFolder) { 
                    onMoveFolder(draggedFolderId, null); 
                  } 
                  setDraggedFolderId(null); 
                }}
              >
              <button
                onClick={() => setActiveFolderId('uncategorized')}
                onContextMenu={(e) => {
                  e.preventDefault();
                }}
                className={`w-full px-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-start gap-1.5 transition-all ${
                  activeFolderId === 'uncategorized'
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Chưa phân loại</span>
              </button>
              </div>
              
              {folders.filter(f => !f.parentId).map(folder => {
                const renderFolder = (f: Folder, level: number) => {
                  const children = folders.filter(child => child.parentId === f.id);
                  const isEditing = editingFolderId === f.id;
                  const isAddingSubfolder = addingSubfolderTo === f.id;
                  const isExpanded = expandedFolders.has(f.id);

                  return (
                    <React.Fragment key={f.id}>
                      <div className="group relative flex items-center w-full" style={{ paddingLeft: `${16 + level * 20}px` }}>
                        {isEditing ? (
                          <div className="flex w-full gap-1 items-center mt-1 mb-1">
                            <input
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              className="flex-1 px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 outline-none focus:ring-1 focus:ring-amber-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingFolderName.trim()) {
                                  onUpdateFolder(f.id, editingFolderName.trim());
                                  setEditingFolderId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingFolderId(null);
                                }
                              }}
                            />
                            <button onClick={() => { if(editingFolderName.trim()) { onUpdateFolder(f.id, editingFolderName.trim()); setEditingFolderId(null); } }} className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] bg-amber-500 flex items-center justify-center hover:bg-amber-600 text-white rounded-lg transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingFolderId(null)} className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] bg-slate-200 flex items-center justify-center hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className={`relative w-full flex items-center group ${dragOverFolderId === f.id ? 'ring-2 ring-amber-400 rounded-xl' : ''}`}
                            draggable={true}
                            onDragStart={(e) => { 
                              e.stopPropagation(); 
                              setDraggedFolderId(f.id); 
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={(e) => {
                              setDraggedFolderId(null);
                              setDragOverFolderId(null);
                            }}
                            onDragOver={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              if (draggedFolderId !== f.id) {
                                setDragOverFolderId(f.id);
                              }
                            }}
                            onDragLeave={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              if (dragOverFolderId === f.id) {
                                setDragOverFolderId(null);
                              }
                            }}
                            onDrop={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              setDragOverFolderId(null); 
                              if (draggedFolderId && draggedFolderId !== f.id && onMoveFolder) { 
                                onMoveFolder(draggedFolderId, f.id); 
                              } 
                              setDraggedFolderId(null); 
                            }}
                          >
                            {children.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedFolders(prev => {
                                    const next = new Set(prev);
                                    if (next.has(f.id)) next.delete(f.id);
                                    else next.add(f.id);
                                    return next;
                                  });
                                }}
                                className="absolute left-[-20px] top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              >
                                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-amber-500" : ""}`} />
                              </button>
                            )}
                            <button
                              onClick={() => setActiveFolderId(f.id)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setFolderContextMenu({ folderId: f.id, folderName: f.name, x: e.clientX, y: e.clientY });
                              }}
                              className={`w-full px-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-start gap-1.5 transition-all ${
                                activeFolderId === f.id 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                              }`}
                            >
                              <FolderIcon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isAddingSubfolder && (
                        <div className="flex w-full gap-1 items-center mt-1 mb-1" style={{ paddingLeft: `${16 + (level + 1) * 20}px` }}>
                          <input
                            value={subfolderName}
                            onChange={(e) => setSubfolderName(e.target.value)}
                            placeholder="Tên thư mục con..."
                            className="flex-1 px-2 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && subfolderName.trim()) {
                                onCreateFolder(subfolderName.trim(), f.id);
                                setAddingSubfolderTo(null);
                              } else if (e.key === 'Escape') {
                                setAddingSubfolderTo(null);
                              }
                            }}
                          />
                          <button onClick={() => { if(subfolderName.trim()) { onCreateFolder(subfolderName.trim(), f.id); setAddingSubfolderTo(null); } }} className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setAddingSubfolderTo(null)} className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] bg-slate-200 flex items-center justify-center hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {children.map(c => renderFolder(c, level + 1))}
                    </React.Fragment>
                  );
                };
                return renderFolder(folder, 0);
              })}

            </div>


          </div>
        )}

        <div className="flex-1 flex flex-col w-full min-w-0 min-h-0 gap-3">
{activeFolderId === null ? (
<div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-2 gap-2 items-center px-2 py-3 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 uppercase tracking-wider select-none">
                <div className="text-center">Tên thư mục</div>
                <div className="text-center">Số lượng từ</div>
              </div>

              
              <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/50"
              onMouseUp={() => setDragAction(null)}
              onMouseLeave={() => setDragAction(null)}
            >
                {(() => {
                  const allCount = savedWords.length;
                  return (
                    <div 
                      onClick={() => setActiveFolderId('all')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                      }}
                      className="group grid grid-cols-2 gap-2 items-center px-2 py-3 text-xs md:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-center min-w-0">
                        <div className="w-full max-w-[190px] sm:max-w-[220px] flex items-center gap-2 min-w-0">
                          <span className="w-5 shrink-0" />
                          <FolderIcon className="w-5 h-5 text-slate-400 fill-slate-400 dark:text-slate-500 dark:fill-slate-500 shrink-0" />
                          <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200 truncate">Tất cả từ vựng</span>
                        </div>
                      </div>
                      <div className="text-center text-[15px] font-medium text-slate-500">
                        {allCount}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const uncategorizedCount = savedWords.filter(w => !w.folderId).length;
                  return (
                    <div 
                      onClick={() => setActiveFolderId('uncategorized')}
                      onContextMenu={(e) => {
                        e.preventDefault();
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId('root'); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null); }}
                      onDrop={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        setDragOverFolderId(null); 
                        if (draggedFolderId && onMoveFolder) { 
                          onMoveFolder(draggedFolderId, null); 
                        } 
                        setDraggedFolderId(null); 
                      }}
                      className={`group grid grid-cols-2 gap-2 items-center px-2 py-3 text-xs md:text-sm cursor-pointer transition-colors ${dragOverFolderId === 'root' ? 'bg-amber-100 dark:bg-amber-900 ring-2 ring-inset ring-amber-400 rounded-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    >
                      <div className="flex items-center justify-center min-w-0">
                        <div className="w-full max-w-[190px] sm:max-w-[220px] flex items-center gap-2 min-w-0">
                          <span className="w-5 shrink-0" />
                          <FolderIcon className="w-5 h-5 text-slate-400 fill-slate-400 dark:text-slate-500 dark:fill-slate-500 shrink-0" />
                          <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200 truncate">Chưa phân loại</span>
                        </div>
                      </div>
                      <div className="text-center text-[15px] font-medium text-slate-500">
                        {uncategorizedCount}
                      </div>
                    </div>
                  );
                })()}

                {folders.filter(f => !f.parentId).map(folder => {
                  const renderFolderRow = (f, level) => {
                    const children = folders.filter(child => child.parentId === f.id);
                    const isExpanded = expandedFolders.has(f.id);
                    const folderWordsCount = savedWords.filter(w => {
                      if (w.folderId === f.id) return true;
                      let isDescendant = false;
                      let currentParent = folders.find(pf => pf.id === w.folderId)?.parentId;
                      while (currentParent) {
                        if (currentParent === f.id) {
                          isDescendant = true;
                          break;
                        }
                        currentParent = folders.find(pf => pf.id === currentParent)?.parentId;
                      }
                      return isDescendant;
                    }).length;
                    
                    return (
                      <React.Fragment key={f.id}>
                        <div 
                          onClick={() => setActiveFolderId(f.id)}
                          onContextMenu={(e) => {
                            if (editingFolderId === f.id) return;
                            e.preventDefault();
                            setFolderContextMenu({ folderId: f.id, folderName: f.name, x: e.clientX, y: e.clientY });
                          }}
                          draggable={true}
                          onDragStart={(e) => { 
                            e.stopPropagation(); 
                            setDraggedFolderId(f.id); 
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={(e) => {
                            setDraggedFolderId(null);
                            setDragOverFolderId(null);
                          }}
                          onDragOver={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            if (draggedFolderId !== f.id) {
                              setDragOverFolderId(f.id);
                            }
                          }}
                          onDragLeave={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            if (dragOverFolderId === f.id) {
                              setDragOverFolderId(null);
                            }
                          }}
                          onDrop={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setDragOverFolderId(null); 
                            if (draggedFolderId && draggedFolderId !== f.id && onMoveFolder) { 
                              onMoveFolder(draggedFolderId, f.id); 
                            } 
                            setDraggedFolderId(null); 
                          }}
                          className={`group grid grid-cols-2 gap-2 items-center px-2 py-3 text-xs md:text-sm cursor-pointer transition-colors ${dragOverFolderId === f.id ? 'bg-amber-100 dark:bg-amber-900 ring-2 ring-inset ring-amber-400 rounded-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                          <div className="flex items-center justify-center min-w-0">
                            <div
                              className="w-full max-w-[190px] sm:max-w-[220px] flex items-center gap-2 min-w-0"
                              style={{ paddingLeft: `${level * 20}px` }}
                            >
                              {children.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedFolders(prev => {
                                      const next = new Set(prev);
                                      if (next.has(f.id)) next.delete(f.id);
                                      else next.add(f.id);
                                      return next;
                                    });
                                  }}
                                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                                  title={isExpanded ? "Ẩn các thư mục con" : "Hiện các thư mục con"}
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-amber-500" : ""}`} />
                                </button>
                              ) : (
                                <span className="w-5 shrink-0" />
                              )}
                              <FolderIcon className="w-5 h-5 text-slate-400 fill-slate-400 dark:text-slate-500 dark:fill-slate-500 shrink-0" />
                              {editingFolderId === f.id ? (
                                <div className="flex w-full gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    value={editingFolderName}
                                    onChange={(e) => setEditingFolderName(e.target.value)}
                                    className="flex-1 px-2 py-1 rounded-md text-sm bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 outline-none focus:ring-1 focus:ring-amber-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && editingFolderName.trim()) {
                                        onUpdateFolder(f.id, editingFolderName.trim());
                                        setEditingFolderId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingFolderId(null);
                                      }
                                    }}
                                  />
                                  <button onClick={() => { if(editingFolderName.trim()) { onUpdateFolder(f.id, editingFolderName.trim()); setEditingFolderId(null); } }} className="p-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setEditingFolderId(null)} className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-md transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-center text-[15px] font-medium text-slate-500">
                            {folderWordsCount}
                          </div>
                        </div>
                        {addingSubfolderTo === f.id && (
                          <div className="group grid grid-cols-2 gap-2 items-center px-2 py-2 text-xs md:text-sm bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center justify-center min-w-0">
                              <div
                                className="w-full max-w-[190px] sm:max-w-[220px] flex items-center gap-2 min-w-0"
                                style={{ paddingLeft: `${(level + 1) * 20}px` }}
                              >
                                <input
                                  value={subfolderName}
                                  onChange={(e) => setSubfolderName(e.target.value)}
                                  placeholder="Tên thư mục con..."
                                  className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && subfolderName.trim()) {
                                      onCreateFolder(subfolderName.trim(), f.id);
                                      setAddingSubfolderTo(null);
                                    } else if (e.key === 'Escape') {
                                      setAddingSubfolderTo(null);
                                    }
                                  }}
                                />
                                <button onClick={() => { if(subfolderName.trim()) { onCreateFolder(subfolderName.trim(), f.id); setAddingSubfolderTo(null); } }} className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setAddingSubfolderTo(null)} className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] bg-slate-200 flex items-center justify-center hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div></div>
                          </div>
                        )}
                        {isExpanded && children.map(c => renderFolderRow(c, level + 1))}
                      </React.Fragment>
                    );
                  };
                  return renderFolderRow(folder, 0);
                })}


              </div>
            </div>
          ) : sortedWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl bg-slate-50/20">
              <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery ? "Không tìm thấy từ vựng nào trùng khớp" : "Thư viện từ vựng còn trống"}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                {searchQuery 
                  ? "Hãy thử tìm bằng từ khoá khác xem sao nhé." 
                  : "Bấm vào bất cứ từ vựng nào trong đoạn văn và tích vào hình Trái Tim để lưu trữ tại đây."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          {/* Header Row (Desktop) */}
          {sortedWords.length > 0 && (
            <div className="hidden sm:flex shrink-0 items-center gap-2 px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 select-none">
              <div className="w-5 shrink-0 flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={sortedWords.length > 0 && selectedWordIds.size === sortedWords.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedWordIds(new Set(sortedWords.map(w => w.id)));
                    } else {
                      setSelectedWordIds(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>
              <div className="w-8 shrink-0 text-center">STT</div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {columns.map((col, idx) => (
                  <React.Fragment key={`${col.id}-${idx}`}>
                    {idx > 0 && <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />}
                    <div 
                      className="relative shrink-0 flex items-center group cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors select-none px-1 min-w-0"
                      style={col.flexStyle}
                      draggable
                      onDragStart={(e) => handleDragStart(e, col.id)}
                      onDragOver={(e) => handleDragOver(e, col.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="truncate flex-1 py-1">{col.title}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className="hidden sm:flex shrink-0 items-center justify-end pr-1 text-xs text-slate-500 font-medium gap-2">
                <span className="w-[120px] lg:w-[150px] text-right">Thư mục</span>
                <span className="w-[52px] text-right">Điểm số</span>
                <div className="w-[88px] shrink-0"></div>
              </div>
            </div>
          )}

            
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar relative"
            onMouseUp={() => setDragAction(null)}
            onMouseLeave={() => setDragAction(null)}
          >
            <div
              key={currentPage + (activeFilter || "") + (activeFolderId || "")}
              className="flex flex-col gap-1 sm:gap-0.5 w-full sm:min-w-fit"
            >
            {(() => {
              const textCounts = new Map<string, number>();
              savedWords.forEach(w => textCounts.set(w.text, (textCounts.get(w.text) || 0) + 1));
              const paginatedWords = sortedWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              return paginatedWords.map((word, index) => {
                const isDuplicate = textCounts.get(word.text)! > 1;
                const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
              const isSelected = selectedWordIds.has(word.id);
              if (editingWordId === word.id) {
                return (
                  <motion.div
                    key={`${word.id}-${index}`}
                    layout
                    transition={{ type: "spring", damping: 20 }}
                    className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 shadow-md w-full sm:w-[280px] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                        {word.text}
                      </span>
                      <button 
                        onClick={() => setEditingWordId(null)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Đóng"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Pinyin</label>
                        <input
                          autoFocus
                          type="text"
                          value={editPinyin}
                          onChange={(e) => setEditPinyin(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          placeholder="Pinyin..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Nghĩa tiếng Việt</label>
                        <input
                          type="text"
                          value={editTranslation}
                          onChange={(e) => setEditTranslation(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          placeholder="Nghĩa..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Từ loại (tuỳ chọn)</label>
                        <input
                          type="text"
                          value={editPartOfSpeech}
                          onChange={(e) => setEditPartOfSpeech(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          placeholder="VD: Danh từ..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Cấp độ HSK</label>
                        <input
                          type="text"
                          value={editHskLevel}
                          onChange={(e) => setEditHskLevel(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          placeholder="VD: HSK 1..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 justify-end mt-1">
                      <button 
                        onClick={() => setEditingWordId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                      >
                        Huỷ
                      </button>
                      <button 
                        onClick={() => {
                          if (onUpdateWord) {
                            onUpdateWord(word.id, {
                              pinyin: editPinyin,
                              translation: editTranslation,
                              partOfSpeech: editPartOfSpeech,
                              hskLevel: editHskLevel
                            });
                          }
                          setEditingWordId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition"
                      >
                        Lưu lại
                      </button>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={`${word.id}-${index}`}
                  layout
                  transition={{ type: "spring", damping: 20 }}
                  className={`group relative flex items-center gap-1.5 sm:gap-2 cursor-pointer ${isDuplicate ? 'bg-rose-50/50 dark:bg-rose-900/20' : 'bg-white dark:bg-slate-900'} border ${isSelected ? 'border-amber-400 bg-slate-200 dark:bg-slate-700' : isDuplicate ? 'border-rose-300 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-600' : 'border-slate-200 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-700/80'} rounded-xl px-2 py-1.5 sm:py-1 shadow-sm hover:shadow-md transition-all duration-300 w-full sm:min-w-fit select-none`}
                  id={`saved-card-${word.id}`}
                  onMouseDown={(e) => {
                    if (e.button === 0 && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                      if (e.ctrlKey || e.metaKey) {
                        const isCurrentlySelected = selectedWordIds.has(word.id);
                        const action = isCurrentlySelected ? 'deselect' : 'select';
                        setDragAction(action);
                        const newSet = new Set(selectedWordIds);
                        if (isCurrentlySelected) {
                          newSet.delete(word.id);
                        } else {
                          newSet.add(word.id);
                          setLastSelectedIndex(index);
                        }
                        setSelectedWordIds(newSet);
                      } else if (e.shiftKey && lastSelectedIndex !== null) {
                        const newSet = new Set(selectedWordIds);
                        const start = Math.min(lastSelectedIndex, index);
                        const end = Math.max(lastSelectedIndex, index);
                        for (let i = start; i <= end; i++) {
                          newSet.add(paginatedWords[i].id);
                        }
                        setSelectedWordIds(newSet);
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (dragAction && (e.ctrlKey || e.metaKey)) {
                      const newSet = new Set(selectedWordIds);
                      if (dragAction === 'select') {
                        newSet.add(word.id);
                      } else if (dragAction === 'deselect') {
                        newSet.delete(word.id);
                      }
                      setSelectedWordIds(newSet);
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && (e.target as HTMLElement).tagName !== 'INPUT') {
                      const newSet = new Set([word.id]);
                      setSelectedWordIds(newSet);
                      setLastSelectedIndex(index);
                      speakMandarin(word.text);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      wordId: word.id,
                      x: e.clientX,
                      y: e.clientY,
                      showFolders: false,
                      folderParentId: null
                    });
                  }}
                >
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                        const newSet = new Set(selectedWordIds);
                        if (e.target.checked) {
                          newSet.add(word.id);
                          setLastSelectedIndex(index);
                        } else {
                          newSet.delete(word.id);
                        }
                        setSelectedWordIds(newSet);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-center w-8 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0">
                    {actualIndex + 1}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col sm:hidden gap-0.5 py-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span 
                        className="word-token-element text-[19px] font-bold text-[#32CD32] group-hover:text-emerald-500 transition leading-tight select-none"
                        style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                      >
                        {word.text}
                      </span>
                      {word.pinyin && word.pinyin !== '?' && (
                        <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
                          {word.pinyin}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white line-clamp-2 break-words leading-snug">
                      {word.translation || '(Chưa có nghĩa)'}
                    </span>
                    <div className="flex gap-1.5 flex-wrap mt-0.5 items-center">
                      {word.partOfSpeech && (
                        <span className={`text-[11px] font-semibold ${getPartOfSpeechTextColor(word.partOfSpeech)}`}>
                          {word.partOfSpeech}
                        </span>
                      )}
                      {word.partOfSpeech && word.hskLevel && (
                        <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                      )}
                      <span className={`text-[11px] font-semibold ${getHskTextColor(word.hskLevel)}`}>
                        {word.hskLevel || '-'}
                      </span>
                      {word.lastPracticeScore != null && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${word.lastPracticeScore >= 5 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30'}`}>
                            {word.lastPracticeScore}/10
                          </span>
                        </>
                      )}
                      {word.folderId && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                            {getFolderPath(word.folderId)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-1 min-w-0 items-center gap-2">
                    {columns.map((col, idx) => {
                      const showDivider = idx > 0;
                      return (
                        <React.Fragment key={`${col.id}-${idx}`}>
                          {showDivider && <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />}
                          <div style={col.flexStyle} className="shrink-0 truncate px-1 flex items-center min-w-0">
                            {col.id === 'text' && (
                              <span 
                                className="word-token-element text-[18px] font-bold text-[#32CD32] group-hover:text-emerald-500 transition leading-none select-none"
                                style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                              >
                                {word.text}
                              </span>
                            )}
                            {col.id === 'pinyin' && (
                              <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 truncate">
                                {word.pinyin !== '?' ? word.pinyin : ''}
                              </span>
                            )}
                            {col.id === 'translation' && (
                              <span className="text-sm font-medium text-black dark:text-white truncate" title={word.translation}>
                                {word.translation || '(Chưa có nghĩa)'}
                              </span>
                            )}
                            {col.id === 'partOfSpeech' && (
                              word.partOfSpeech ? (
                                <span className={`text-[12px] font-semibold ${getPartOfSpeechTextColor(word.partOfSpeech)} truncate`} title={word.partOfSpeech}>
                                  {word.partOfSpeech}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 px-1">-</span>
                              )
                            )}
                            {col.id === 'hsk' && (
                              <span className={`text-[12px] font-semibold ${getHskTextColor(word.hskLevel)} truncate`}>
                                {word.hskLevel || '-'}
                              </span>
                            )}
                            {col.id === 'createdAt' && (
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                {new Date(word.savedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  <div className="flex shrink-0 items-center justify-end pr-1 gap-2">
                    <span className="hidden sm:inline-block text-[11px] font-medium px-1.5 py-0.5 text-slate-500 dark:text-slate-400 truncate w-[120px] lg:w-[150px] text-right" title={word.folderId ? getFolderPath(word.folderId) : ''}>
                      {word.folderId ? getFolderPath(word.folderId) : '-'}
                    </span>
                    <span className={`hidden sm:flex text-[11px] font-bold px-2 py-0.5 rounded text-right w-[52px] justify-end ${word.lastPracticeScore != null ? (word.lastPracticeScore >= 5 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30') : 'text-slate-400'}`}>
                      {word.lastPracticeScore != null ? `${word.lastPracticeScore}/10` : '-'}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {onOpenRadicalBreakdown && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onOpenRadicalBreakdown(word.text);
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          title="Chia các bộ thủ (Chiết tự)"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (onNavigateToPractice) onNavigateToPractice(word.id, 'ordering', true);
                        }}
                        className="p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Luyện tập từ vựng này (Sắp xếp câu & Luyện nghe)"
                      >
                        <Dumbbell className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            wordId: word.id,
                            x: rect.right,
                            y: rect.bottom,
                            showFolders: false,
                            folderParentId: null
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>


                </motion.div>
              );
              });
            })()}
            </div>
          </div>

          {/* Pagination Controls */}
          {sortedWords.length > ITEMS_PER_PAGE && (
            <div className="shrink-0 flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                <span className="hidden sm:inline">Hiển thị </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                <span className="hidden sm:inline"> đến </span>
                <span className="sm:hidden">–</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, sortedWords.length)}</span>
                <span className="hidden sm:inline"> trong số </span>
                <span className="sm:hidden"> / </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{sortedWords.length}</span>
                <span className="hidden sm:inline"> từ</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Trước
                </button>
                <div className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currentPage} / {Math.ceil(sortedWords.length / ITEMS_PER_PAGE)}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedWords.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(sortedWords.length / ITEMS_PER_PAGE)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
        </div>
      </div>

      {/* Folder Context Menu */}
      <AnimatePresence>
        {folderContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-[180px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/50 py-1 overflow-hidden"
            style={{
              left: Math.max(12, Math.min(folderContextMenu.x, window.innerWidth - 196)),
              ...(folderContextMenu.y > window.innerHeight - 280
                ? { bottom: Math.max(76, window.innerHeight - folderContextMenu.y) }
                : { top: Math.max(12, folderContextMenu.y) }),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="w-full text-left px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActiveFolderId(folderContextMenu.folderId);
                setFlashcardMode('zh-vi');
                setFolderContextMenu(null);
              }}
            >
              <Play className="w-4 h-4 text-emerald-500" /> Học Flashcards
            </button>

            <button 
              className="w-full text-left px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenExportModal(folderContextMenu.folderId === 'all' ? null : folderContextMenu.folderId);
                setFolderContextMenu(null);
              }}
            >
              <Download className="w-4 h-4 text-blue-500" /> Xuất từ vựng
            </button>
            
            {folderContextMenu.folderId !== 'all' && folderContextMenu.folderId !== 'uncategorized' && (
              <>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                <button 
                  className="w-full text-left px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingSubfolderTo(folderContextMenu.folderId);
                    setSubfolderName("");
                    setFolderContextMenu(null);
                  }}
                >
                  <Plus className="w-4 h-4 text-blue-500" /> Thêm thư mục con
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
                  <Pencil className="w-4 h-4 text-slate-500" /> Đổi tên
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                <button 
                  className="w-full text-left px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeFolderId === folderContextMenu.folderId) setActiveFolderId(null);
                    setFolderToDelete(folderContextMenu.folderId);
                    setFolderContextMenu(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Xoá thư mục
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[180px] max-w-[calc(100vw-24px)] overflow-hidden"
            style={{ 
              left: Math.max(12, Math.min(contextMenu.x, window.innerWidth - 220)),
              ...(contextMenu.y > window.innerHeight - 320
                ? { bottom: Math.max(76, window.innerHeight - contextMenu.y) }
                : { top: Math.max(12, contextMenu.y) })
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
                                    {!contextMenu.showFolders ? (
              (() => {
                const isBulk = selectedWordIds.size > 0 && selectedWordIds.has(contextMenu.wordId);
                const targetIds = isBulk ? Array.from(selectedWordIds) : [contextMenu.wordId];
                const targetWord = savedWords.find(w => w.id === contextMenu.wordId);
                const isCurrentlyKnown = targetWord?.isKnown;
                const isMissingData = targetWord && (!targetWord.pinyin || targetWord.pinyin === '?' || !targetWord.translation || targetWord.translation === '(Chưa cấp nghĩa)' || !targetWord.partOfSpeech || !targetWord.hskLevel);

                return (
                  <>
                    {!isBulk && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (targetWord) {
                            setEditPinyin(targetWord.pinyin);
                            setEditTranslation(targetWord.translation);
                            setEditPartOfSpeech(targetWord.partOfSpeech || "");
                            setEditHskLevel(targetWord.hskLevel || "");
                            setEditingWordId(targetWord.id);
                          }
                          setContextMenu(null);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-blue-500" /> Sửa từ
                      </button>
                    )}

                    {onNavigateToPractice && !isBulk && targetWord && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToPractice(targetWord.id, 'ordering', true);
                          setContextMenu(null);
                        }}
                      >
                        <Dumbbell className="w-4 h-4 text-blue-500" /> Luyện tập từ này
                      </button>
                    )}

                    {onOpenRadicalBreakdown && !isBulk && targetWord && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRadicalBreakdown(targetWord.text);
                          setContextMenu(null);
                        }}
                      >
                        <Layers className="w-4 h-4 text-rose-500" /> Chia các bộ thủ
                      </button>
                    )}
                    
                    {/* Bulk update support */}
                    {(isBulk || isMissingData) && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-between transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targets = isBulk 
                            ? targetIds.map(id => savedWords.find(w => w.id === id)).filter(Boolean) as {id: string, text: string}[]
                            : (targetWord ? [{id: targetWord.id, text: targetWord.text}] : []);
                          
                          if (targets.length > 0) {
                            handleAutoUpdateWords(targets);
                          }
                          
                          if (isBulk) setSelectedWordIds(new Set());
                          setContextMenu(null);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" /> Cập nhật (AI) {isBulk && `(${targetIds.length})`}
                        </div>
                      </button>
                    )}
                    {onToggleWordStatus && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          targetIds.forEach(id => {
                            onToggleWordStatus(id, !isCurrentlyKnown);
                          });
                          if (isBulk) setSelectedWordIds(new Set());
                          setContextMenu(null);
                        }}
                      >
                        <Check className="w-4 h-4 text-green-500" /> {isCurrentlyKnown ? "Đánh dấu chưa học" : "Đánh dấu đã biết"}
                      </button>
                    )}
                    <button 
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ ...contextMenu, showFolders: true });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FolderIcon className="w-4 h-4 text-amber-500" /> Chuyển thư mục
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                    <button 
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWord(isBulk ? targetIds : contextMenu.wordId);
                        if (isBulk) setSelectedWordIds(new Set());
                        setContextMenu(null);
                      }}
                    >
                      <X className="w-3.5 h-3.5" /> Xóa khỏi thư viện
                    </button>
                  </>
                );
              })()
            ) : (
              <div className="max-h-[300px] overflow-y-auto py-1 scrollbar-thin">
                <div 
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contextMenu.folderParentId) {
                      const parentFolder = folders.find(f => f.id === contextMenu.folderParentId);
                      setContextMenu({ ...contextMenu, folderParentId: parentFolder?.parentId || null });
                    } else {
                      setContextMenu({ ...contextMenu, showFolders: false, folderParentId: null });
                    }
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                </div>
                {!contextMenu.folderParentId && (
                  <button 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 truncate transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetWordIds = selectedWordIds.has(contextMenu.wordId) ? Array.from(selectedWordIds) : [contextMenu.wordId];
                      onMoveToFolder(targetWordIds, null);
                      if (selectedWordIds.has(contextMenu.wordId)) setSelectedWordIds(new Set());
                      setContextMenu(null);
                    }}
                  >
                    Bỏ thư mục (Mặc định)
                  </button>
                )}
                
                {contextMenu.folderParentId && (
                  <button 
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 truncate transition-colors border-b border-slate-100 dark:border-slate-700/50 mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetWordIds = selectedWordIds.has(contextMenu.wordId) ? Array.from(selectedWordIds) : [contextMenu.wordId];
                      onMoveToFolder(targetWordIds, contextMenu.folderParentId);
                      if (selectedWordIds.has(contextMenu.wordId)) setSelectedWordIds(new Set());
                      setContextMenu(null);
                    }}
                  >
                    Bỏ vào thư mục này
                  </button>
                )}

                {folders.filter(f => f.parentId === contextMenu.folderParentId || (!f.parentId && !contextMenu.folderParentId)).map(f => {
                   const hasChildren = folders.some(child => child.parentId === f.id);
                   return (
                     <div key={f.id} className="flex items-center w-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                       <button
                         className="flex-1 text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 truncate"
                         onClick={(e) => {
                           e.stopPropagation();
                           const targetWordIds = selectedWordIds.has(contextMenu.wordId) ? Array.from(selectedWordIds) : [contextMenu.wordId];
                           onMoveToFolder(targetWordIds, f.id);
                           if (selectedWordIds.has(contextMenu.wordId)) setSelectedWordIds(new Set());
                           setContextMenu(null);
                         }}
                         title={f.name}
                       >
                         {f.name}
                       </button>
                       {hasChildren && (
                         <button
                           className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
                           onClick={(e) => {
                             e.stopPropagation();
                             setContextMenu({ ...contextMenu, folderParentId: f.id });
                           }}
                         >
                           <ChevronRight className="w-3.5 h-3.5" />
                         </button>
                       )}
                     </div>
                   );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                Thêm thư mục mới
              </h3>
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Tên thư mục mới..."
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none mb-4 text-slate-700 dark:text-slate-200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    onCreateFolder(newFolderName.trim());
                    setNewFolderName("");
                    setShowFolderModal(false);
                  } else if (e.key === 'Escape') {
                    setShowFolderModal(false);
                    setNewFolderName("");
                  }
                }}
              />
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  Huỷ
                </button>
                <button 
                  onClick={() => {
                    if (newFolderName.trim()) {
                      onCreateFolder(newFolderName.trim());
                      setNewFolderName("");
                      setShowFolderModal(false);
                    }
                  }}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors"
                >
                  Tạo mới
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExcelUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Nhập từ vựng (Excel/TXT)
              </h3>
              
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Chọn thư mục lưu (tùy chọn):
                </label>
                <CustomFolderSelect 
                  folders={folders} 
                  selectedFolderId={targetExcelFolderId} 
                  onSelectFolder={setTargetExcelFolderId} 
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                <button
                  onClick={() => setShowExcelUploadModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  Hủy
                </button>
                <div className="flex w-full sm:w-auto gap-2">
                  <button
                    onClick={async () => {
                       setShowExcelUploadModal(false);
                       if (!window.googleAuth?.token) {
                         try {
                           await window.googleAuth?.signIn(['https://www.googleapis.com/auth/drive.readonly']);
                           if (window.googleAuth?.token) {
                             setShowDrivePicker(true);
                           }
                         } catch (err) {
                           console.error("Lỗi đăng nhập Google:", err);
                         }
                       } else {
                         setShowDrivePicker(true);
                       }
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center justify-center"
                  >
                    Google Drive
                  </button>
                  <button
                    onClick={() => {
                       setShowExcelUploadModal(false);
                       fileInputRef.current?.click();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center"
                  >
                    Tải từ máy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {showDrivePicker && (
        <GoogleDrivePickerModal
          mode="excel"
          onClose={() => setShowDrivePicker(false)}
          onFilePicked={(file) => {
            setShowDrivePicker(false);
            processExcelFile(file);
          }}
        />
      )}

      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  Xuất từ vựng ra file Excel
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Folder Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chọn thư mục cần xuất
                </label>
                <CustomFolderSelect
                  folders={folders}
                  selectedFolderId={exportFolderId}
                  onSelectFolder={setExportFolderId}
                  rootLabel="Tất cả thư mục"
                  allowUncategorized={true}
                  className="w-full"
                />
              </div>

              {/* Subfolders checkbox if selected folder has children */}
              {exportFolderId && exportFolderId !== 'uncategorized' && exportFolderId !== 'all' && folders.some(f => f.parentId === exportFolderId) && (
                <label className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={exportIncludeSubfolders}
                    onChange={(e) => setExportIncludeSubfolders(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-700"
                  />
                  <span>Bao gồm từ vựng trong các thư mục con</span>
                </label>
              )}

              {/* Status Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lọc theo trạng thái
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setExportFilterStatus('all')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${exportFilterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFilterStatus('learning')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${exportFilterStatus === 'learning' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    Chưa biết
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFilterStatus('known')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${exportFilterStatus === 'known' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    Đã biết
                  </button>
                </div>
              </div>

              {/* Word Count Summary Preview */}
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 flex items-center justify-between">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Số lượng từ vựng sẽ xuất:
                </div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{getExportWordsList().length} từ</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExport}
                  disabled={getExportWordsList().length === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất file Excel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {folderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Xóa thư mục
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác và các từ vựng trong thư mục sẽ bị xóa thư mục liên kết.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setFolderToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  Huỷ
                </button>
                <button 
                  onClick={() => {
                    if (folderToDelete) {
                      onDeleteFolder(folderToDelete);
                      setFolderToDelete(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
