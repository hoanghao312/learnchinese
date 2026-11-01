import React, { useState, useEffect } from "react";
import { SavedWord, Folder } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { speakMandarin } from "../utils/speech";
import CustomFolderSelect from "./CustomFolderSelect";
import { calculateSM2 } from "../utils/sm2";
import { Loader2, ArrowRight, RotateCcw, Volume2, Check, X, BrainCircuit, RefreshCw, Maximize2, Minimize2, ArrowLeftRight, Folder as FolderIcon, FolderTree, Layers } from "lucide-react";
import RadicalBreakdownModal from "./RadicalBreakdownModal";
import { getHskLevel } from "../utils/hskLookup";
import { getPartOfSpeechTextColor, getHskTextColor } from "../utils/wordTypeColors";

interface FlashcardsProps {
  words: SavedWord[];
  folders?: Folder[];
  initialFolderId?: string | null;
  onReviewWord: (id: string, grade: number, mode: 'zh-vi' | 'vi-zh') => void; 
  onResetProgress?: (folderId: string | null, mode: 'zh-vi' | 'vi-zh') => void;
  onClose: () => void;
  learningMode: 'zh-vi' | 'vi-zh';
  onChangeMode?: (mode: 'zh-vi' | 'vi-zh') => void;
  onOpenRadicalBreakdown?: (word: string) => void;
}

export default function Flashcards({ words, folders = [], initialFolderId = null, onReviewWord, onResetProgress, onClose, learningMode, onChangeMode, onOpenRadicalBreakdown }: FlashcardsProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [dueWords, setDueWords] = useState<SavedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [initialDueCount, setInitialDueCount] = useState(0);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hanziInput, setHanziInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isInternalRadicalOpen, setIsInternalRadicalOpen] = useState(false);
  const [internalRadicalWord, setInternalRadicalWord] = useState<string>("是");

  const handleOpenRadicals = (wordText: string) => {
    if (onOpenRadicalBreakdown) {
      onOpenRadicalBreakdown(wordText);
    } else {
      setInternalRadicalWord(wordText);
      setIsInternalRadicalOpen(true);
    }
  };
  useEffect(() => {
    if (hasStartedSession) return;
    // Filter due words
    const now = Date.now();
    const due = words.filter(w => {
      if (selectedFolderId && w.folderId !== selectedFolderId) {
        if (includeSubfolders) {
          // Check if w.folderId is a descendant of selectedFolderId
          let isDescendant = false;
          let currentParent = folders.find(f => f.id === w.folderId)?.parentId;
          while (currentParent) {
            if (currentParent === selectedFolderId) {
              isDescendant = true;
              break;
            }
            currentParent = folders.find(f => f.id === currentParent)?.parentId;
          }
          if (!isDescendant) return false;
        } else {
          return false;
        }
      }
      if (w.isKnown) return false;
      const nextReviewDate = learningMode === 'zh-vi' ? w.nextReviewDateZhVi : w.nextReviewDateViZh;
      return !nextReviewDate || nextReviewDate <= now;
    });
    // Shuffle the due words slightly for randomness
    console.log("Flashcards useEffect triggered. Due words length:", due.length, "Total words:", words.length); setDueWords(due.sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionCompleted(false);
    setCompletedCount(0);
    setInitialDueCount(due.length);
  }, [words, learningMode, selectedFolderId, hasStartedSession, includeSubfolders]);

  useEffect(() => {
    if (!showAnswer) {
      setHanziInput("");
      setIsCorrect(null);
    }
  }, [showAnswer]);

  const currentWord = dueWords[currentIndex];


  useEffect(() => {
    if (showAnswer && currentWord) {
      speakMandarin(currentWord.text, 1.0);
    }
  }, [showAnswer, currentWord]);

  const handleSpeak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentWord) {
      speakMandarin(currentWord.text, 1.0);
    }
  };

  const handleGrade = (grade: number) => {
    if (currentWord) {
      if (!hasStartedSession) setHasStartedSession(true);
      
      onReviewWord(currentWord.id, grade, learningMode);

      let newDueWords = [...dueWords];
      let newLength = dueWords.length;

      if (grade === 4) { // Easy
        setCompletedCount(prev => prev + 1);
      }
      
      if (grade === 1) { // Again
        const insertIndex = Math.min(currentIndex + 3, newDueWords.length);
        newDueWords.splice(insertIndex, 0, currentWord);
        newLength++;
      } else if (grade === 2) { // Hard
        const insertIndex = Math.min(currentIndex + 5, newDueWords.length);
        newDueWords.splice(insertIndex, 0, currentWord);
        newLength++;
      } else if (grade === 3) { // Good
        newDueWords.push(currentWord);
        newLength++;
      }
      
      setDueWords(newDueWords);

      if (currentIndex < newLength - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setSessionCompleted(true);
      }
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!currentWord || sessionCompleted) return;

      if (!showAnswer && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        if (learningMode === 'vi-zh' && hanziInput.trim()) {
          setIsCorrect(hanziInput.trim() === currentWord.text);
        }
        setShowAnswer(true);
      } else if (showAnswer) {
        if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setShowAnswer(false);
        } else if (e.key === '1') {
          e.preventDefault();
          handleGrade(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleGrade(2);
        } else if (e.key === '3' || e.code === 'Space') {
          e.preventDefault();
          handleGrade(3);
        } else if (e.key === '4') {
          e.preventDefault();
          handleGrade(4);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, showAnswer, sessionCompleted, dueWords, currentIndex, hasStartedSession, learningMode, onReviewWord, hanziInput]); // added dependencies because handleGrade uses them

  const containerClass = isExpanded 
    ? "fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex flex-col items-center overflow-y-auto px-4 py-4 sm:py-6"
    : "max-w-xl mx-auto py-4 flex flex-col items-center";

  const totalWordsInFolder = words.filter(w => {
    if (w.isKnown) return false;
    if (!selectedFolderId) return true;
    if (w.folderId === selectedFolderId) return true;
    if (!includeSubfolders) return false;
    let isDescendant = false;
    let currentParent = folders.find(f => f.id === w.folderId)?.parentId;
    while (currentParent) {
      if (currentParent === selectedFolderId) {
        isDescendant = true;
        break;
      }
      currentParent = folders.find(f => f.id === currentParent)?.parentId;
    }
    return isDescendant;
  }).length;

  return (
    <div className={containerClass}>
      <div className={`w-full flex justify-between items-center mb-4 max-w-xl mx-auto gap-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              if (onChangeMode) {
                onChangeMode(learningMode === 'zh-vi' ? 'vi-zh' : 'zh-vi');
                setHasStartedSession(false);
              }
            }}
            className="flex w-fit items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 rounded-full shadow-sm cursor-pointer"
            title="Đổi chiều ôn tập"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {learningMode === 'zh-vi' ? 'Hán-Việt' : 'Việt-Hán'}
          </button>
          {folders.length > 0 && (
            <div className="flex items-center gap-1">
              <CustomFolderSelect
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  setHasStartedSession(false);
                }}
              />
              <button
                onClick={() => setIncludeSubfolders(prev => !prev)}
                className={`p-1.5 rounded-full border transition-colors shadow-sm ${includeSubfolders ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'}`}
                title={includeSubfolders ? "Đang hiện thư mục con" : "Đang ẩn thư mục con"}
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {onResetProgress && (
            <button
              onClick={() => {
              setHasStartedSession(false);
              console.log("Reset button clicked!", { selectedFolderId, learningMode });
              if (onResetProgress) {
                onResetProgress(selectedFolderId, learningMode);
              }
            }}
              className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm"
              title="Học lại từ đầu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {dueWords.length > 0 && !sessionCompleted && (
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:inline mr-2">
              <span className="text-slate-800 dark:text-slate-100">{Math.min(completedCount, initialDueCount)}</span> / {initialDueCount}
            </span>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {dueWords.length > 0 && (
        <div className="w-full max-w-xl mx-auto mb-4 px-1">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out relative" 
              style={{ width: `${sessionCompleted || initialDueCount === 0 ? 100 : (completedCount / initialDueCount) * 100}%` }}
            >
              <div className="absolute top-1 left-2 right-2 h-1.5 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      )}


      {totalWordsInFolder === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center flex-1">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Không còn từ vựng nào</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Thư mục này hiện không có từ vựng nào cần học.</p>
          {onResetProgress && (
            <button
              onClick={() => {
              setHasStartedSession(false);
              console.log("Reset button clicked!", { selectedFolderId, learningMode });
              if (onResetProgress) {
                onResetProgress(selectedFolderId, learningMode);
              }
            }}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-full shadow-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Học lại từ đầu
            </button>
          )}
        </div>
      ) : dueWords.length === 0 || sessionCompleted ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center flex-1">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-4">
            <BrainCircuit className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Tuyệt vời!</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Bạn đã hoàn thành phiên ôn tập flashcard hiện tại.</p>
          {onResetProgress && (
            <button
              onClick={() => {
              setHasStartedSession(false);
              console.log("Reset button clicked!", { selectedFolderId, learningMode });
              if (onResetProgress) {
                onResetProgress(selectedFolderId, learningMode);
              }
            }}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-full shadow-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Học lại từ đầu
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`w-full mt-2 relative max-w-xl mx-auto perspective-1200 ${isExpanded ? 'flex-1 flex flex-col justify-center' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentWord.id + "-" + learningMode}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full relative"
              >
                <motion.div
                  className="relative w-full min-h-[260px] md:min-h-[280px] cursor-pointer preserve-3d"
                  animate={{ rotateY: showAnswer ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                  onClick={() => {
                    if (!showAnswer) {
                      if (learningMode === 'vi-zh' && hanziInput.trim()) {
                        setIsCorrect(hanziInput.trim() === currentWord.text);
                      }
                      setShowAnswer(true);
                    } else {
                      setShowAnswer(false);
                    }
                  }}
                >
                  {/* FRONT FACE */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 md:p-8 flex flex-col items-center justify-between bg-white text-slate-800 border-2 border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-xl hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    {/* Top Action Buttons (Front Face) */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                      {currentWord && /[\u4e00-\u9fa5]/.test(currentWord.text) && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRadicals(currentWord.text);
                          }}
                          className="p-3 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors bg-white/80 dark:bg-slate-800/80 shadow-xs"
                          title="Chia các bộ thủ (Chiết tự)"
                        >
                          <Layers className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={handleSpeak}
                        className={`p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-amber-500 bg-white/80 dark:bg-slate-800/80 shadow-xs ${
                          learningMode === 'vi-zh' ? 'hidden' : ''
                        }`}
                        title="Phát âm"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="w-full flex-1 flex flex-col items-center justify-center py-4">
                      {learningMode === 'zh-vi' ? (
                        <div 
                          className="text-6xl md:text-7xl font-bold text-center tracking-wide text-[#32CD32]" 
                          style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                        >
                          {currentWord.text}
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center">
                          <div className="w-full max-w-sm text-center px-5 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 mb-6">
                            <p className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-relaxed break-words">
                              {currentWord.translation}
                            </p>
                          </div>
                          <input 
                            type="text" 
                            value={hanziInput}
                            onChange={(e) => setHanziInput(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (hanziInput.trim()) {
                                  setIsCorrect(hanziInput.trim() === currentWord.text);
                                }
                                setShowAnswer(true);
                              }
                            }}
                            placeholder="Nhập Hán tự..."
                            className="w-full max-w-[240px] text-center text-2xl py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 outline-none transition-all dark:text-slate-100 placeholder:text-slate-400/70"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    <div className="w-full flex flex-col items-center gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (learningMode === 'vi-zh' && hanziInput.trim()) {
                            setIsCorrect(hanziInput.trim() === currentWord.text);
                          }
                          setShowAnswer(true);
                        }}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-full shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <RefreshCw className="w-4 h-4" /> Xem đáp án
                      </button>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 md:p-8 flex flex-col items-center justify-between bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 text-slate-800 dark:text-slate-100 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-xl overflow-y-auto custom-scrollbar"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {/* Top Action Buttons (Back Face) */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                      {currentWord && /[\u4e00-\u9fa5]/.test(currentWord.text) && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRadicals(currentWord.text);
                          }}
                          className="p-3 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors bg-white/80 dark:bg-slate-800/80 shadow-xs"
                          title="Chia các bộ thủ (Chiết tự)"
                        >
                          <Layers className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={handleSpeak}
                        className="p-3 rounded-full hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors text-amber-600 dark:text-amber-400 bg-white/80 dark:bg-slate-800/80 shadow-xs"
                        title="Phát âm"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Result Tag for vi-zh mode */}
                    {learningMode === 'vi-zh' && isCorrect !== null && (
                      <div className={`absolute top-4 left-6 text-xs font-bold px-3 py-1 rounded-full ${
                        isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      }`}>
                        {isCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}
                      </div>
                    )}

                    <div className="w-full flex-1 flex flex-col items-center justify-center py-2 space-y-3 text-center">
                      <div 
                        className="text-5xl md:text-6xl font-bold text-center tracking-wide text-[#32CD32]" 
                        style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                      >
                        {currentWord.text}
                      </div>
                      
                      <div className="flex flex-col items-center justify-center gap-3 w-full">
                        <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 tracking-wide font-mono">
                          {currentWord.pinyin}
                        </div>
                        <div className="w-full max-w-sm text-center px-4 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                          <p className="text-xl md:text-2xl font-bold text-black dark:text-white leading-snug break-words">
                            {currentWord.translation}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {currentWord.partOfSpeech && (
                            <span className={`text-sm font-semibold ${getPartOfSpeechTextColor(currentWord.partOfSpeech)}`}>
                              {currentWord.partOfSpeech}
                            </span>
                          )}
                          {currentWord.partOfSpeech && (currentWord.hskLevel || getHskLevel(currentWord.text)) && (
                            <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                          )}
                          {(() => {
                            const hsk = currentWord.hskLevel || getHskLevel(currentWord.text);
                            if (!hsk) return null;
                            return (
                              <span className={`text-sm font-semibold ${getHskTextColor(hsk)}`}>
                                {hsk}
                              </span>
                            );
                          })()}
                        </div>
                      </div>


                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showAnswer && (
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-xl mx-auto mt-3 md:mt-4 pb-4"
              >
                <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
                  <button 
                    type="button"
                    onClick={() => handleGrade(1)} 
                    className="py-2.5 px-2 bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-semibold flex flex-col items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm">Học lại</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleGrade(2)} 
                    className="py-2.5 px-2 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all font-semibold flex flex-col items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm">Khó</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleGrade(3)} 
                    className="py-2.5 px-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all font-semibold flex flex-col items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm">Tốt</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleGrade(4)} 
                    className="py-2.5 px-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all font-semibold flex flex-col items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm">Dễ</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </>
      )}

      {isInternalRadicalOpen && (
        <RadicalBreakdownModal
          isOpen={isInternalRadicalOpen}
          onClose={() => setIsInternalRadicalOpen(false)}
          initialWord={internalRadicalWord}
          hideLessonWords={true}
        />
      )}
    </div>
  );
}
