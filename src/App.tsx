import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Token, SavedWord, Lesson, Folder, SavedLesson } from "./types";
import { SAMPLE_LESSONS } from "./data/lessons";
import { speakMandarin, pauseSpeech, resumeSpeech, cancelSpeech, isManuallyPaused, getCuratedChineseVoices, setGlobalVoiceURI } from "./utils/speech";
import TextReader from "./components/TextReader";
import WordPopup from "./components/WordPopup";
import SavedWordsList from "./components/SavedWordsList";
import ConfirmModal from "./components/ConfirmModal";
import FileUploader from "./components/FileUploader";
import DictUploader from "./components/DictUploader";
import PracticeDocUploader from "./components/PracticeDocUploader";
import AssistantChat from "./components/AssistantChat";
import NotebookChat from "./components/NotebookChat";
import Practice from "./components/Practice";
import AudacityAudioPlayer from "./components/AudacityAudioPlayer";
import SavedLessonsList from "./components/SavedLessonsList";
import SaveLessonModal from "./components/SaveLessonModal";
import RadicalBreakdownModal from "./components/RadicalBreakdownModal";
import { MessageSquare } from "lucide-react";
import { calculateSM2 } from "./utils/sm2";
import { getHskLevel } from "./utils/hskLookup";
import { initAuth, googleSignIn, logout } from "./utils/auth";
import { syncDataToFirestore, fetchDataFromFirestore } from "./utils/firestore";
import { mergeSavedWords, mergeFolders, mergeMissingWords, mergeCustomDict, mergeLessons } from "./utils/sync";
import { User } from "firebase/auth";
import { Cloud, CloudOff, LogOut, RefreshCw
} from "lucide-react";
import { 
  Sparkles, 
  Volume2, 
  Eye, 
  EyeOff, 
  History, 
  BookOpen, 
  PlusCircle, 
  HelpCircle, 
  Flame, 
  Layers,
  FileText,
  BadgeAlert,
  ChevronRight,
  Bookmark,
  Upload,
  Maximize2,
  Minimize2,
  Droplets,
  Pause,
  Play,
  Repeat,
  Database,
  AlertCircle,
  X,
  Check,
  Download,
  ScanText,
  Loader2,
  Home,
  Book,
  User as UserIcon,
  Dumbbell,
  Edit2,
  Headphones,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx";

export default function App() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(SAMPLE_LESSONS[0]);
  const [customText, setCustomText] = useState<string>("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Interactive reader state
  const [showPinyin, setShowPinyin] = useState<boolean>(false);
  const [showHanzi, setShowHanzi] = useState<boolean>(true);
  const [isTextDisplayMenuOpen, setIsTextDisplayMenuOpen] = useState<boolean>(false);
  const [showBackground, setShowBackground] = useState<boolean>(false);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [paragraphSpeaking, setParagraphSpeaking] = useState<boolean>(false);
  const [paragraphPaused, setParagraphPaused] = useState<boolean>(false);
  const [isLoopingParagraph, setIsLoopingParagraphState] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushing' | 'pulling' | 'success_push' | 'success_pull'>('idle');
  const [syncWordCount, setSyncWordCount] = useState<number>(0);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const syncAbortControllerRef = React.useRef<AbortController | null>(null);

  // Removed fake interval, progress is now updated by callbacks
  
  const handleStopSync = () => {
    if (syncAbortControllerRef.current) {
      syncAbortControllerRef.current.abort();
      syncAbortControllerRef.current = null;
    }
    setSyncStatus('idle');
  };


  const isLoopingRef = React.useRef(false);
  
  const setIsLoopingParagraph = (val: boolean) => {
    isLoopingRef.current = val;
    setIsLoopingParagraphState(val);
  };
  const [speakingCharIndex, setSpeakingCharIndex] = useState<number | null>(null);
  const [mispronouncedWords, setMispronouncedWords] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Wordbook / saved words
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const sortedFolders = React.useMemo(() => {
    return [...folders].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [folders]);

  // Saved lessons
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);

  // Historical missing words explicitly tracked
  const [historicalMissingWords, setHistoricalMissingWords] = useState<Token[]>([]);
  const [selectedMissingWords, setSelectedMissingWords] = useState<string[]>([]);
  const [isLookingUpMerged, setIsLookingUpMerged] = useState(false);
  
  // Custom dictionary edits mapping (persists across document segmentations)
  const [customDict, setCustomDict] = useState<Record<string, Partial<Token>>>({});
  
  // Streak simulator
  const [streakDays, setStreakDays] = useState<number>(12);
  const [practiceFolderId, setPracticeFolderId] = useState<string | 'all' | 'uncategorized' | null>(null);
  const [practiceWordId, setPracticeWordId] = useState<string | null>(null);
  const [practiceTrigger, setPracticeTrigger] = useState<{timestamp: number, type: 'cloze' | 'ordering'}>({timestamp: 0, type: 'cloze'});

  // Tab indicator for source entry (Dán chữ vs Upload File)
  const [mainTab, setMainTab] = useState<"home" | "vocabulary" | "practice" | "chat" | "notebook" | "account" | "lessons">("home");
  const [studyMode, setStudyMode] = useState<"reader" | "listening_room">("reader");
  const [isListeningRoomMaximized, setIsListeningRoomMaximized] = useState(false);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [inputSourceTab, setInputSourceTab] = useState<"paste" | "file" | "dict" | "practice_docs" | "missing_words">("paste");
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [isSaveLessonModalOpen, setIsSaveLessonModalOpen] = useState(false);
  const [isRadicalModalOpen, setIsRadicalModalOpen] = useState(false);
  const [radicalModalWord, setRadicalModalWord] = useState<string>("是");
  const [isInputExpanded, setIsInputExpanded] = useState<boolean>(false);
  const [highlightedRadicalWords, setHighlightedRadicalWords] = useState<string[]>([]);
  const [radicalModalSource, setRadicalModalSource] = useState<'text' | 'vocabulary'>('text');

  const handleOpenRadicalBreakdown = (word: string, source: 'text' | 'vocabulary' = 'text') => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setRadicalModalWord(trimmed);
    setRadicalModalSource(source);
    if (source === 'text') {
      setHighlightedRadicalWords(prev => {
        if (!prev.includes(trimmed)) {
          return [...prev, trimmed];
        }
        return prev;
      });
    }
    setIsRadicalModalOpen(true);
  };
  const [viewingLessonId, setViewingLessonId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  const isDraggingRef = useRef(false);
  const initialLoadCompletedRef = useRef(false);
  const autoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [voices, setVoices] = useState<{ id: string, name: string, uri: string, gender: string }[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mainTab]);

  // Initialize auth and load from cloud or local
  
  const handleSendToLearning = (text: string) => {
    // 1. Dọn dẹp Markdown để chỉ lấy văn bản thô tiếng Trung (nếu muốn)
    // Nhưng text ở đây thường là raw Markdown content. Text area có thể tự render hoặc xử lý text thô.
    let cleanText = text;
    // Dọn các ký tự markdown ** nếu có
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*\*\*/g, '');
    
    setMainTab('home');
    setInputSourceTab('paste');
    setCustomText(cleanText);
    setIsChatWindowOpen(false);
  };
useEffect(() => {
    const unsubscribe = initAuth(
      async (user) => {
        setCurrentUser(user);
        setSyncStatus('pulling');
        try {
          syncAbortControllerRef.current = new AbortController();
          const cloudData = await fetchDataFromFirestore(syncAbortControllerRef.current.signal, (progress, total) => {
            setSyncProgress(progress);
            setSyncWordCount(total);
          });
          if (!cloudData) return; // Prevent overwriting if cloudData is unexpectedly null due to some error handled elsewhere
          
          // Trộn dữ liệu local với cloud khi khởi động
          const localWordsStr = localStorage.getItem("saved_chinese_words");
          const localWords = localWordsStr ? JSON.parse(localWordsStr) : [];
          const localFoldersStr = localStorage.getItem("saved_chinese_folders");
          const localFolders = localFoldersStr ? JSON.parse(localFoldersStr) : [];
          const localMissingStr = localStorage.getItem("historical_missing_words");
          const localMissing = localMissingStr ? JSON.parse(localMissingStr) : [];
          const localDictStr = localStorage.getItem("custom_chinese_dictionary");
          const localDict = localDictStr ? JSON.parse(localDictStr) : {};
          
          const localLessonsStr = localStorage.getItem("saved_chinese_lessons");
          const localLessons = localLessonsStr ? JSON.parse(localLessonsStr) : [];

          const deletedIdsStr = localStorage.getItem("deleted_word_ids");
          const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

          // Chỉ gộp nếu cloud có dữ liệu để tránh xóa cloud khi cloud chưa có
          if (Object.keys(cloudData).length > 0) {
            const mergedSavedWords = mergeSavedWords(localWords, cloudData.savedWords || [], deletedIds);
            
            // Migrate legacy lessonFolders if they exist in cloud
            const legacyCloudLessonFolders = cloudData.lessonFolders || [];
            const mergedFolders = mergeFolders(localFolders, [...(cloudData.folders || []), ...legacyCloudLessonFolders]);
            
            const mergedMissingWords = mergeMissingWords(localMissing, cloudData.historicalMissingWords || []);
            const mergedCustomDict = mergeCustomDict(localDict, cloudData.customDict || {});
            
            const mergedLessons = mergeLessons(localLessons, cloudData.savedLessons || []);
            
            // Cập nhật lại cloud với dữ liệu hợp nhất để đồng bộ ngược nếu thiết bị mới có sample data
            await syncDataToFirestore({
              savedWords: mergedSavedWords,
              folders: mergedFolders,
              historicalMissingWords: mergedMissingWords,
              customDict: mergedCustomDict,
              savedLessons: mergedLessons
            }, syncAbortControllerRef.current.signal, (progress, total) => {
              setSyncProgress(progress);
              setSyncWordCount(total);
            });

            localStorage.removeItem("deleted_word_ids");

            setSavedWords(mergedSavedWords);
            localStorage.setItem("saved_chinese_words", JSON.stringify(mergedSavedWords));
            
            setFolders(mergedFolders);
            localStorage.setItem("saved_chinese_folders", JSON.stringify(mergedFolders));
            
            setHistoricalMissingWords(mergedMissingWords);
            localStorage.setItem("historical_missing_words", JSON.stringify(mergedMissingWords));
            
            setCustomDict(mergedCustomDict);
            localStorage.setItem("custom_chinese_dictionary", JSON.stringify(mergedCustomDict));

            setSavedLessons(mergedLessons);
            localStorage.setItem("saved_chinese_lessons", JSON.stringify(mergedLessons));
          } else {
            // Nếu cloud chưa có dữ liệu (user mới tinh), đồng bộ dữ liệu local lên cloud
            await syncDataToFirestore({
              savedWords: localWords,
              folders: localFolders,
              historicalMissingWords: localMissing,
              customDict: localDict,
              savedLessons: localLessons
            }, syncAbortControllerRef.current.signal, (progress, total) => {
              setSyncProgress(progress);
              setSyncWordCount(total);
            });
            localStorage.removeItem("deleted_word_ids");
          }
          setSyncWordCount(cloudData?.savedWords?.length || localWords.length || 0);
          setLastSyncTime(new Date());
          setSyncStatus('success_pull');
          setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error: any) {
          setSyncStatus('idle');
          if (error.message === "Aborted") return;
          console.warn("Lỗi khi đồng bộ từ Cloud (có thể do offline):", error.message);
          if (error?.message?.includes('offline')) {
             console.warn("Chưa thể đồng bộ tự động vì mạng đang gián đoạn (hoặc trình duyệt chặn kết nối).")
          }
        } finally {
          syncAbortControllerRef.current = null;
          initialLoadCompletedRef.current = true;
        }
      },
      () => {
        setCurrentUser(null);
        initialLoadCompletedRef.current = true;
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-sync effect
  useEffect(() => {
    if (!initialLoadCompletedRef.current || !currentUser) return;

    if (autoSyncTimeoutRef.current) {
      clearTimeout(autoSyncTimeoutRef.current);
    }
    
    autoSyncTimeoutRef.current = setTimeout(() => {
      setSyncStatus('pushing');
      syncDataToFirestore({
        savedWords,
        folders,
        historicalMissingWords,
        customDict,
        savedLessons
      }).then(() => {
        localStorage.removeItem("deleted_word_ids"); // Clear tombstones on successful sync
        setLastSyncTime(new Date());
        setSyncStatus('success_push');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }).catch(e => {
        console.warn("Auto-sync failed:", e);
        setSyncStatus('idle');
      });
    }, 2000);
  }, [savedWords, folders, historicalMissingWords, customDict, savedLessons, currentUser]);

  // Initialize and load saved words
  useEffect(() => {
    const saved = localStorage.getItem("saved_chinese_words");
    const hasInitializedSamples = localStorage.getItem("has_initialized_samples");
    
    if (saved) {
      try {
        setSavedWords(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi đọc dữ liệu từ vựng đã lưu:", e);
      }
    } else if (!hasInitializedSamples) {
      localStorage.setItem("has_initialized_samples", "true");
      const sampleWords: SavedWord[] = [
        {
          id: 'sample-1',
          text: "学习",
          pinyin: "xuéxí",
          translation: "Học tập",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 1",
          savedAt: Date.now() - 0,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-2',
          text: "词汇",
          pinyin: "cíhuì",
          translation: "Từ vựng",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 4",
          savedAt: Date.now() - 1000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-3',
          text: "朋友",
          pinyin: "péngyou",
          translation: "Bạn bè",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 1",
          savedAt: Date.now() - 2000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-4',
          text: "喜欢",
          pinyin: "xǐhuan",
          translation: "Thích",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 1",
          savedAt: Date.now() - 3000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-5',
          text: "工作",
          pinyin: "gōngzuò",
          translation: "Công việc",
          partOfSpeech: "Danh từ, Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 4000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-6',
          text: "时间",
          pinyin: "shíjiān",
          translation: "Thời gian",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 5000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-7',
          text: "知道",
          pinyin: "zhīdào",
          translation: "Biết",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 6000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-8',
          text: "现在",
          pinyin: "xiànzài",
          translation: "Bây giờ",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 1",
          savedAt: Date.now() - 7000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-9',
          text: "问题",
          pinyin: "wèntí",
          translation: "Vấn đề",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 8000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-10',
          text: "觉得",
          pinyin: "juéde",
          translation: "Cảm thấy",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 9000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-11',
          text: "意思",
          pinyin: "yìsi",
          translation: "Ý nghĩa",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 10000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-12',
          text: "准备",
          pinyin: "zhǔnbèi",
          translation: "Chuẩn bị",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 11000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-13',
          text: "希望",
          pinyin: "xīwàng",
          translation: "Hy vọng",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 12000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-14',
          text: "开始",
          pinyin: "kāishǐ",
          translation: "Bắt đầu",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 13000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-15',
          text: "帮助",
          pinyin: "bāngzhù",
          translation: "Giúp đỡ",
          partOfSpeech: "Động từ",
          hskLevel: "HSK 2",
          savedAt: Date.now() - 14000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        },
        {
          id: 'sample-16',
          text: "生活",
          pinyin: "shēnghuó",
          translation: "Cuộc sống",
          partOfSpeech: "Danh từ",
          hskLevel: "HSK 3",
          savedAt: Date.now() - 15000000,
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        }
      ];
      setSavedWords(sampleWords);
      localStorage.setItem("saved_chinese_words", JSON.stringify(sampleWords));
    }
    
    const savedFolders = localStorage.getItem("saved_chinese_folders");
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (e) {
        console.error("Lỗi đọc dữ liệu thư mục:", e);
      }
    }

    const savedMissing = localStorage.getItem("historical_missing_words");
    if (savedMissing) {
      try {
        const parsed = JSON.parse(savedMissing) as Token[];
        const filtered = parsed.filter(t => /[\u4e00-\u9fa5]/.test(t.text));
        setHistoricalMissingWords(filtered);
        if (filtered.length !== parsed.length) {
          localStorage.setItem("historical_missing_words", JSON.stringify(filtered));
        }
      } catch (e) {
        console.error("Lỗi đọc dữ liệu từ vựng chưa nội dung:", e);
      }
    }

    const savedDict = localStorage.getItem("custom_chinese_dictionary");
    if (savedDict) {
      try {
        setCustomDict(JSON.parse(savedDict));
      } catch (e) {
        console.error("Lỗi đọc dữ liệu từ điển tùy chỉnh:", e);
      }
    }
    
    const savedLessonsStr = localStorage.getItem("saved_chinese_lessons");
    if (savedLessonsStr) {
      try {
        setSavedLessons(JSON.parse(savedLessonsStr));
      } catch (e) {
        console.error("Lỗi đọc dữ liệu bài học đã lưu:", e);
      }
    }

    const lessonFoldersStr = localStorage.getItem("saved_lesson_folders");
    if (lessonFoldersStr) {
      try {
        const lf = JSON.parse(lessonFoldersStr);
        if (lf.length > 0) {
          setFolders(prev => {
            const newFolders = [...prev, ...lf];
            localStorage.setItem("saved_chinese_folders", JSON.stringify(newFolders));
            return newFolders;
          });
          localStorage.removeItem("saved_lesson_folders");
        }
      } catch (e) {
        console.error("Lỗi đọc dữ liệu thư mục bài học:", e);
      }
    }
    
    // Automatically segment the first sample lesson on load
    handleAnalyzeText(SAMPLE_LESSONS[0].text);
  }, []);

  // Load voices for text-to-speech (chỉ 2 giọng chuẩn: Xiaoxiao & Yunxi)
  useEffect(() => {
    const loadVoices = () => {
      const zhVoices = getCuratedChineseVoices();
      setVoices(zhVoices);
      
      setSelectedVoice((currentSelected) => {
        if (currentSelected?.toLowerCase().includes('yunxi')) {
          setGlobalVoiceURI('zh-CN-YunxiNeural');
          return 'zh-CN-YunxiNeural';
        }
        setGlobalVoiceURI('zh-CN-XiaoxiaoNeural');
        return 'zh-CN-XiaoxiaoNeural';
      });
    };

    loadVoices();
    
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);

  useEffect(() => {
    if (selectedVoice) {
      setGlobalVoiceURI(selectedVoice);
    }
  }, [selectedVoice]);

  // Quản lý hiển thị thanh điều hướng dưới (Bottom Nav):
  // 1. Mặc định ẩn khi vào phòng luyện nghe đoạn văn (listening_room); hiển thị lại khi ra chế độ khác
  useEffect(() => {
    if (studyMode === 'listening_room') {
      setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
  }, [studyMode]);

  // 2. Xử lý lăn chuột (Wheel) và cuộn trang:
  // - Ở phòng luyện nghe: Lăn chuột lên => Hiện thanh menu; Lăn chuột xuống => Ẩn thanh menu
  // - Ở các chế độ đọc thông thường: Cuộn trang lên => Hiện; Cuộn trang xuống => Ẩn
  useEffect(() => {
    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      // Bỏ qua nếu đang giữ Ctrl/Cmd (đang zoom sóng âm) hoặc Shift (cuộn ngang)
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      // Bỏ qua nếu đang cuộn ngang rõ rệt
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 4) return;

      if (e.deltaY < -8) {
        // Lăn chuột lên => Hiện thanh menu dưới
        setIsNavVisible(true);
      } else if (e.deltaY > 8) {
        // Lăn chuột xuống => Ẩn thanh menu dưới
        setIsNavVisible(false);
      }
    };

    const handleScroll = () => {
      if (studyMode === 'listening_room') return; // Phòng nghe dùng sự kiện wheel do layout fixed
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY;
      if (diff > 25) {
        // Vuốt xuống (kéo xem phần trên) => Hiện menu
        setIsNavVisible(true);
      } else if (diff < -25) {
        // Vuốt lên (kéo xem phần dưới) => Ẩn menu
        setIsNavVisible(false);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [studyMode, lastScrollY]);

  // Phím tắt P toàn cục: Ẩn/Hiện Pinyin khi xem văn bản
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        const tagName = target.tagName ? target.tagName.toUpperCase() : '';
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'p' || e.key === 'P')) {
        // Nếu đang ở phòng luyện nghe, AudacityAudioPlayer tự xử lý
        if (studyMode === 'listening_room') return;
        e.preventDefault();
        setShowPinyin(prev => !prev);
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'h' || e.key === 'H')) {
        // Nếu đang ở phòng luyện nghe, AudacityAudioPlayer tự xử lý
        if (studyMode === 'listening_room') return;
        e.preventDefault();
        setShowHanzi(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [studyMode]);

  // Save to local storage whenever list changes
  const saveWordsList = (updated: SavedWord[]) => {
    setSavedWords(updated);
    localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
  };

  // Segment Chinese text utilizing the local server endpoint
  const handlePushToCloud = async () => {
    if (!currentUser) return;
    setSyncWordCount(savedWords.length);
    setSyncStatus('pushing');
    syncAbortControllerRef.current = new AbortController();
    try {
      await syncDataToFirestore({
        savedWords,
        folders,
        historicalMissingWords,
        customDict,
        savedLessons
      }, syncAbortControllerRef.current.signal, (progress, total) => {
        setSyncProgress(progress);
        setSyncWordCount(total);
      });
      localStorage.removeItem("deleted_word_ids"); // Clear tombstones on successful sync
      setLastSyncTime(new Date());
      setSyncStatus('success_push');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error: any) {
      console.warn("Lỗi tải lên:", error.message);
      if (error?.message === "QuotaExceeded") {
        setErrorMessage("Đã đạt giới hạn dung lượng đồng bộ Cloud miễn phí hằng ngày. Dữ liệu của bạn vẫn được lưu an toàn trên máy này.");
      } else {
        setErrorMessage("Tải lên thất bại: " + (error?.message || "Lỗi mạng."));
      }
      setSyncStatus('idle');
    }
  };

  const handlePullFromCloud = async () => {
    if (!currentUser) return;
    setSyncWordCount(savedWords.length > 0 ? savedWords.length : 50);
    setSyncStatus('pulling');
    syncAbortControllerRef.current = new AbortController();
    try {
      const cloudData = await fetchDataFromFirestore(syncAbortControllerRef.current.signal, (progress, total) => {
        // Since download is a single request, we just set it to complete at the end
        setSyncProgress(progress);
        setSyncWordCount(total);
      });
      if (!cloudData) {
        throw new Error("Không có dữ liệu trên cloud.");
      }
      
      const newSavedWords = cloudData.savedWords || [];
      const newFolders = cloudData.folders || [];
      const newMissingWords = cloudData.historicalMissingWords || [];
      const newCustomDict = cloudData.customDict || {};
      const newSavedLessons = mergeLessons(savedLessons, cloudData.savedLessons || []);

      setSavedWords(newSavedWords);
      localStorage.setItem("saved_chinese_words", JSON.stringify(newSavedWords));
      
      setFolders(newFolders);
      localStorage.setItem("saved_chinese_folders", JSON.stringify(newFolders));
      
      setHistoricalMissingWords(newMissingWords);
      localStorage.setItem("historical_missing_words", JSON.stringify(newMissingWords));
      
      setCustomDict(newCustomDict);
      localStorage.setItem("custom_chinese_dictionary", JSON.stringify(newCustomDict));

      setSavedLessons(newSavedLessons);
      localStorage.setItem("saved_chinese_lessons", JSON.stringify(newSavedLessons));
      
      setSyncWordCount(newSavedWords.length);
      setLastSyncTime(new Date());
      setSyncStatus('success_pull');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error: any) {
      setSyncStatus('idle');
      if (error.message === "Aborted") return;
      console.warn("Lỗi tải về:", error.message);
      if (error?.message === "QuotaExceeded") {
        setErrorMessage("Đã đạt giới hạn dung lượng đồng bộ Cloud miễn phí hằng ngày. Dữ liệu của bạn vẫn được lưu an toàn trên máy này.");
      } else {
        setErrorMessage("Tải về thất bại: " + (error?.message || "Lỗi mạng."));
      }
    } finally {
      syncAbortControllerRef.current = null;
    }
  };

  const handleSaveTitle = () => {
    if (!editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = editingTitleValue.trim();
    
    // Update selectedLesson
    setSelectedLesson(prev => ({ ...prev, title: newTitle }));
    
    // If it's a saved lesson, update it in the database/localStorage
    if (viewingLessonId) {
      const updated = savedLessons.map(l => l.id === viewingLessonId ? { ...l, title: newTitle } : l);
      setSavedLessons(updated);
      localStorage.setItem("saved_chinese_lessons", JSON.stringify(updated));
    }
    
    setIsEditingTitle(false);
  };

  const handleAnalyzeText = async (textToAnalyze: string, precomputedTokens?: Token[]) => {
    if (!textToAnalyze.trim()) return;

    // Lọc chỉ giữ lại tiếng Trung, số, khoảng trắng và dấu câu (loại bỏ các ngôn ngữ khác)
    const filteredText = textToAnalyze.replace(/[^\u4e00-\u9fa5\u3000-\u303F\uFF00-\uFFEF\s\n\r0-9\p{P}]/gu, '');
    
    if (!filteredText.trim()) {
      setErrorMessage("Văn bản không chứa tiếng Trung.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setActiveToken(null);
    
    try {
      if (precomputedTokens) {
        // Enrich precomputed tokens with custom dictionary corrections from local storage
        const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
        let parsedDict: Record<string, Partial<Token>> = {};
        try {
          parsedDict = JSON.parse(savedDictStr);
        } catch (_) {}

        const enriched = precomputedTokens.map((t: Token) => {
          if (t.type === "word" && parsedDict[t.text]) {
            return {
              ...t,
              ...parsedDict[t.text],
            };
          }
          return t;
        });

        setTokens(enriched);
        setIsLoading(false);
        return;
      }

      // Get latest custom dict keys to send to segmentation for better logic
      const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
      let parsedDict: Record<string, Partial<Token>> = {};
      try {
        parsedDict = JSON.parse(savedDictStr);
      } catch (_) {}
      const customDictKeys = Object.keys(parsedDict);

      const response = await fetch("/api/segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: filteredText, customDictKeys }),
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        let errMsg = "Gặp lỗi khi phân tích văn bản.";
        if (isJson) {
          try {
            const errorData = await response.json();
            errMsg = errorData.error || errMsg;
          } catch (_) {}
        } else {
          try {
            const rawText = await response.text();
            console.warn("Non-JSON error response received:", rawText.slice(0, 200));
          } catch (_) {}
        }
        throw new Error(errMsg);
      }

      if (!isJson) {
        const rawText = await response.text();
        throw new Error(`Phản hồi từ máy chủ không hợp lệ. Content-Type: ${contentType}. Body: ${rawText.slice(0, 100)}`);
      }

      const data = await response.json();
      
      if (data.isOfflineFallback) {
        if (data.offlineReason === "no_key") {
          setErrorMessage("Cảnh báo: Bạn chưa cấu hình GEMINI_API_KEY ở nền tảng. Một số từ sẽ bị thiếu Pinyin và vắng nghĩa tiếng Việt (do ứng dụng buộc phải chạy bằng bộ từ điển ngoại tuyến thu gọn).");
        } else {
          setErrorMessage("Cảnh báo: Hệ thống AI đang quá tải hoặc phản hồi chậm. Đang tạm thời sử dụng từ điển ngoại tuyến thu gọn.");
        }
      }

      if (data && data.tokens && Array.isArray(data.tokens)) {
        // Enrich segmented tokens with custom dictionary corrections from local storage
        const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
        let parsedDict: Record<string, Partial<Token>> = {};
        try {
          parsedDict = JSON.parse(savedDictStr);
        } catch (_) {}

        const enriched = data.tokens.map((t: Token) => {
          if (t.type === "word" && parsedDict[t.text]) {
            return {
              ...t,
              ...parsedDict[t.text],
            };
          }
          return t;
        });
        setTokens(enriched);
      } else {
        throw new Error("Dữ liệu phản hồi sai định dạng mong đợi.");
      }
    } catch (err: any) {
      console.warn("Lỗi phân tích đoạn văn:", err?.message || err);
      setErrorMessage(err.message || "Không thể kết nối đến máy chủ phân tích tiếng Trung.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switching lessons
  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCustomText("");
    handleAnalyzeText(lesson.text);
  };

  // Submit custom paragraph
  const handleAnalyzeCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    
    const customLesson: Lesson = {
      id: "custom-lesson",
      title: "Văn bản tự nhập",
      level: "Học đường",
      description: "Đoạn văn tiếng Trung do bạn tự cung cấp và phân tích.",
      text: customText
    };
    setSelectedLesson(customLesson);
    setIsInputExpanded(false);
    handleAnalyzeText(customText);
  };

  // Handle text loaded from an uploaded file
  const handleFileTextLoaded = (text: string, fileName: string) => {
    setCustomText(text);
    const fileLesson: Lesson = {
      id: `file-lesson-${Date.now()}`,
      title: fileName || "Tệp tin tải lên",
      level: "Tập tin",
      description: `Nội dung từ tệp tin "${fileName}"`,
      text: text
    };
    setSelectedLesson(fileLesson);
    setIsInputExpanded(false);
    handleAnalyzeText(text);
  };

  // Speaking whole paragraph
  const handleSpeakFullParagraph = async () => {
    if (tokens.length === 0) return;
    
    // If currently paused, resume it
    if (paragraphSpeaking && paragraphPaused) {
      resumeSpeech();
      setParagraphPaused(false);
      return;
    }
    
    // If currently speaking, pause it
    if (paragraphSpeaking && !paragraphPaused) {
      pauseSpeech();
      setParagraphPaused(true);
      return;
    }
    
    // Otherwise start fresh
    setParagraphSpeaking(true);
    setParagraphPaused(false);
    setSpeakingCharIndex(0);
    
    // To prevent TTS engines from stripping spaces/newlines and destroying charIndex sync:
    // We map the readable text strictly to non-whitespace characters, replacing newlines with pauses (，).
    const plainChineseText = tokens.map(t => t.text).join("");
    let optimizedText = "";
    const optimizedToActualMap = new Map<number, number>();
    
    for (let i = 0; i < plainChineseText.length; i++) {
        const char = plainChineseText[i];
        if (char === '\n' || char === '\r') {
            optimizedText += '，'; // replace newline with comma to force a pause
            optimizedToActualMap.set(optimizedText.length - 1, i);
        } else if (char === ' ' || char === '\t') {
            // Ignore spaces completely to prevent the TTS engine from silently stripping them
        } else {
            optimizedText += char;
            optimizedToActualMap.set(optimizedText.length - 1, i);
        }
    }
    
    let hasReceivedBoundary = false;
    let fallbackIndex = 0;
    
    // Fallback simulation timer for browsers where Chinese onBoundary doesn't fire
    // roughly 240ms per character at 0.9 rate
    const fallbackMs = 240 / 0.9; 
    let fallbackTimer: any = null;
    
    const speakSegment = () => {
      return speakMandarin(optimizedText, 0.9, (charIndex) => {
        hasReceivedBoundary = true;
        setSpeakingCharIndex(optimizedToActualMap.get(charIndex) ?? charIndex);
      }, undefined, () => {
        // Start fallback timer ONLY when speech actually starts
        fallbackTimer = setInterval(() => {
          // Only advance fallback interval if it is speaking and not paused
          if (!hasReceivedBoundary) {
            setSpeakingCharIndex(prevIndex => {
              if (isManuallyPaused) return prevIndex;
              
              fallbackIndex++;
              // find the actual index for the current fallback step
              const actualIndex = optimizedToActualMap.get(fallbackIndex);
              if (actualIndex !== undefined) {
                 return actualIndex;
              }
              return fallbackIndex >= optimizedText.length ? plainChineseText.length : prevIndex;
            });
          }
        }, fallbackMs);
      });
    };
    
    let shouldLoop = true;
    while (shouldLoop) {
      hasReceivedBoundary = false;
      fallbackIndex = 0;
      setSpeakingCharIndex(0);
      
      await speakSegment();
      
      if (fallbackTimer) clearInterval(fallbackTimer);
      
      // Stop looping if the user manually paused/canceled or if loop is turned off
      if (!isLoopingRef.current || isManuallyPaused) {
        shouldLoop = false;
      }
    }
    
    setSpeakingCharIndex(null);
    if (!paragraphPaused) {
      setParagraphSpeaking(false);
    }
  };

  // Check if a specific word is saved
  const isWordSaved = (token: Token) => {
    return savedWords.some(w => w.text === token.text);
  };

  // Toggle saving a vocab
  const handleToggleSaveWord = (token: Token) => {
    if (token.type !== "word") return;
    
    const exists = savedWords.some(w => w.text === token.text);
    if (exists) {
      setConfirmAction({
        title: "Xác nhận bỏ lưu",
        message: "Bạn có chắc chắn muốn bỏ lưu từ này khỏi danh sách?",
        onConfirm: () => {
          setSavedWords(prev => {
            const updated = prev.filter(w => w.text !== token.text);
            localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
            return updated;
          });
        }
      });
      return;
    }

    setSavedWords(prev => {
      let updated: SavedWord[];
      if (exists) {
        // Fallback for types
        updated = prev;
      } else {
        // Find if dictionary has this latest token
        const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
        let latestDict: Record<string, Partial<Token>> = {};
        try { latestDict = JSON.parse(savedDictStr); } catch (_) {}
        const customEntry = latestDict[token.text];
        
        const newSavedWord: SavedWord = {
          id: `saved-${Date.now()}-${token.text}`,
          text: token.text,
          pinyin: customEntry?.pinyin || token.pinyin || "",
          translation: customEntry?.translation || token.translation || "Chưa có nghĩa dịch",
          partOfSpeech: customEntry?.partOfSpeech || token.partOfSpeech,
          hskLevel: customEntry?.hskLevel || token.hskLevel || getHskLevel(token.text),
          example: customEntry?.example || token.example,
          savedAt: Date.now(),
          isKnown: false
        };
        updated = [newSavedWord, ...prev];
      }
      localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkKnown = (token: Token) => {
    if (token.type !== "word") return;
    
    setSavedWords(prev => {
      const existingIdx = prev.findIndex(w => w.text === token.text);
      let updated: SavedWord[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], isKnown: !updated[existingIdx].isKnown };
      } else {
        const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
        let latestDict: Record<string, Partial<Token>> = {};
        try { latestDict = JSON.parse(savedDictStr); } catch (_) {}
        const customEntry = latestDict[token.text];
        
        const newSavedWord: SavedWord = {
          id: `saved-${Date.now()}-${token.text}`,
          text: token.text,
          pinyin: customEntry?.pinyin || token.pinyin || "",
          translation: customEntry?.translation || token.translation || "Chưa có nghĩa dịch",
          partOfSpeech: customEntry?.partOfSpeech || token.partOfSpeech,
          hskLevel: customEntry?.hskLevel || token.hskLevel || getHskLevel(token.text),
          example: customEntry?.example || token.example,
          savedAt: Date.now(),
          isKnown: true
        };
        updated = [newSavedWord, ...prev];
      }
      localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveSavedWord = (id: string | string[]) => {
    setConfirmAction({
      title: "Xác nhận xóa",
      message: Array.isArray(id) ? `Bạn có chắc chắn muốn xóa ${id.length} từ này khỏi danh sách?` : "Bạn có chắc chắn muốn xóa từ này khỏi danh sách?",
      onConfirm: () => {
        setSavedWords(prev => {
          const updated = prev.filter(w => Array.isArray(id) ? !id.includes(w.id) : w.id !== id);
          localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
          
          // Track deleted IDs for sync tombstones
          const existingDeletedStr = localStorage.getItem("deleted_word_ids");
          let existingDeleted = existingDeletedStr ? JSON.parse(existingDeletedStr) : [];
          if (Array.isArray(id)) {
            existingDeleted = [...existingDeleted, ...id];
          } else {
            existingDeleted.push(id);
          }
          localStorage.setItem("deleted_word_ids", JSON.stringify(existingDeleted));
          
          return updated;
        });
      }
    });
  };

  const missingWords = React.useMemo(() => {
    // Determine if a part of speech indicates a proper noun, person name, or number
    const isExcludedWord = (text: string, pos?: string) => {
      // Exclude if text is strictly numbers
      if (/^\d+$/.test(text)) return true;
      // Exclude if text does not contain any Chinese characters
      if (!/[\u4e00-\u9fa5]/.test(text)) return true;
      
      if (!pos) return false;
      const lowerPos = pos.toLowerCase();
      // Exclude proper nouns and numbers (m = numeral)
      return (
        lowerPos === 'nr' || 
        lowerPos === 'm' || 
        lowerPos.includes("tên riêng") || 
        lowerPos.includes("proper noun") || 
        lowerPos.includes("đại từ nhân xưng") ||
        lowerPos.includes("số") ||
        lowerPos.includes("số từ")
      );
    };

    const isMissing = (text: string) => {
      return !customDict[text] || !customDict[text].translation || customDict[text].translation === "(Chưa cấp nghĩa)";
    };

    const missingFromTokens = tokens.filter(
      (t) => t.type === "word" && isMissing(t.text) && !isExcludedWord(t.text, t.partOfSpeech)
    );

    const missingFromSaved = savedWords.filter(
      (sw) => isMissing(sw.text) && !isExcludedWord(sw.text, sw.partOfSpeech)
    ).map(sw => ({
      type: "word" as const,
      text: sw.text,
      pinyin: sw.pinyin || "?",
      translation: sw.translation,
      partOfSpeech: sw.partOfSpeech,
      hskLevel: sw.hskLevel,
    }));

    const unique = new Map<string, Token>();
    missingFromTokens.forEach((t) => unique.set(t.text, t));
    missingFromSaved.forEach((t) => unique.set(t.text, t));
    
    return Array.from(unique.values());
  }, [tokens, customDict, savedWords]);

  useEffect(() => {
    if (missingWords.length > 0) {
      setHistoricalMissingWords(prev => {
        let changed = false;
        const newMap = new Map<string, Token>();
        prev.forEach(t => newMap.set(t.text, t));
        missingWords.forEach(t => {
          if (!newMap.has(t.text)) {
            newMap.set(t.text, t);
            changed = true;
          }
        });
        if (changed) {
          const updated = Array.from(newMap.values());
          localStorage.setItem("historical_missing_words", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [missingWords]);

  useEffect(() => {
    setHistoricalMissingWords(prev => {
      const next = prev.filter(t => {
        // Also clean up any historical garbage that doesn't contain Chinese characters
        if (!/[\u4e00-\u9fa5]/.test(t.text)) return false;
        
        return !customDict[t.text] || !customDict[t.text].translation || customDict[t.text].translation === "(Chưa cấp nghĩa)";
      });
      if (next.length !== prev.length) {
        localStorage.setItem("historical_missing_words", JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [customDict]);

  // Cache fetched tokens into the opened saved lesson to prevent future API calls
  useEffect(() => {
    if (tokens.length > 0 && viewingLessonId) {
      setSavedLessons(prev => {
        const targetLesson = prev.find(l => l.id === viewingLessonId);
        // Only update if it doesn't already have tokens
        if (targetLesson && (!targetLesson.tokens || targetLesson.tokens.length === 0)) {
          const updated = prev.map(l => 
            l.id === viewingLessonId ? { ...l, tokens: tokens } : l
          );
          localStorage.setItem("saved_chinese_lessons", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [tokens, viewingLessonId]);

  const handleSelectSavedWordPreview = (token: Token) => {
    if (activeToken && activeToken.text === token.text) {
      setActiveToken(null);
    } else {
      const enrichedToken = { ...token, ...(customDict[token.text] || {}) };
      setActiveToken(enrichedToken);
      if (enrichedToken && enrichedToken.type === "word") {
        speakMandarin(enrichedToken.text, 1.0);
      }
    }
  };

  
  const toggleMissingWordSelection = (text: string) => {
    setSelectedMissingWords(prev => prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]);
  };

  const handleMergeAndLookup = async (wordsToProcess?: string[]) => {
    const targets = wordsToProcess || selectedMissingWords;
    if (targets.length < 1) return;
    const mergedText = targets.join("");
    
    // Clear selection immediately for UX
    const partsToRemove = [...targets];
    setSelectedMissingWords(prev => prev.filter(w => !targets.includes(w)));
    setIsLookingUpMerged(true);

    try {
      const response = await fetch("/api/lookup-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: mergedText })
      });
      if (response.ok) {
        const result = await response.json();
        
        // Remove parts from historical missing
        setHistoricalMissingWords(prev => {
          const next = prev.filter(t => !partsToRemove.includes(t.text));
          localStorage.setItem("historical_missing_words", JSON.stringify(next));
          return next;
        });

        // Add to custom dictionary
        setCustomDict(prev => {
          const next = { ...prev, [mergedText]: result };
          localStorage.setItem("custom_chinese_dictionary", JSON.stringify(next));
          return next;
        });

        // Save to saved words
        setSavedWords(prev => {
           const exists = prev.some(w => w.text === mergedText);
           if (exists) return prev;
           const next = [...prev, { ...result, folderId: null }];
           localStorage.setItem("saved_chinese_words", JSON.stringify(next));
           return next;
        });

        setActiveToken(result);
      }
    } catch (e) {
      console.warn("Tra từ ghép thất bại:", e);
    } finally {
      setIsLookingUpMerged(false);
    }
  };

  const handleBulkDeleteMissing = (wordsToProcess?: string[]) => {
    const targets = wordsToProcess || selectedMissingWords;
    if (targets.length === 0) return;
    setConfirmAction({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa ${targets.length} từ đã chọn?`,
      onConfirm: () => {
         setHistoricalMissingWords(prev => {
            const next = prev.filter(t => !targets.includes(t.text));
            localStorage.setItem("historical_missing_words", JSON.stringify(next));
            return next;
         });
         setSelectedMissingWords(prev => prev.filter(w => !targets.includes(w)));
      }
    });
  };

  const handleUpdateToken = (updatedToken: Token) => {
    // 1. Update active list of tokens
    setTokens(prev => prev.map(t => {
      if (t.text === updatedToken.text && t.type === "word") {
        return { ...t, ...updatedToken };
      }
      return t;
    }));

    // 2. Keep active drawer token up-to-date
    if (activeToken && activeToken.text === updatedToken.text) {
      setActiveToken(updatedToken);
    }

    // 3. Keep Saved word library updated if present
    setSavedWords(prevSaved => {
      let changed = false;
      const updatedSaved = prevSaved.map(sw => {
        if (sw.text === updatedToken.text) {
          changed = true;
          return {
            ...sw,
            pinyin: updatedToken.pinyin || sw.pinyin,
            translation: updatedToken.translation || sw.translation,
            partOfSpeech: updatedToken.partOfSpeech || sw.partOfSpeech,
            hskLevel: updatedToken.hskLevel || sw.hskLevel,
            example: updatedToken.example || sw.example,
          };
        }
        return sw;
      });
      if (changed) {
        localStorage.setItem("saved_chinese_words", JSON.stringify(updatedSaved));
        return updatedSaved;
      }
      return prevSaved;
    });

    // 4. Persist in customDictionary mapping
    setCustomDict(prev => {
      const newDict = {
        ...prev,
        [updatedToken.text]: {
          pinyin: updatedToken.pinyin,
          translation: updatedToken.translation,
          partOfSpeech: updatedToken.partOfSpeech,
          hskLevel: updatedToken.hskLevel,
          example: updatedToken.example,
        }
      };
      localStorage.setItem("custom_chinese_dictionary", JSON.stringify(newDict));
      return newDict;
    });

    // 5. Remove from historical missing words
    setHistoricalMissingWords(prev => {
      const exists = prev.some(t => t.text === updatedToken.text);
      if (exists) {
        const next = prev.filter(t => t.text !== updatedToken.text);
        localStorage.setItem("historical_missing_words", JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  const handleDeleteFolder = (id: string) => {
    const getIdsToDelete = (folderId: string): string[] => {
      const children = folders.filter(f => f.parentId === folderId).map(f => f.id);
      return [folderId, ...children.flatMap(getIdsToDelete)];
    };
    const idsToDelete = getIdsToDelete(id);
    
    const updatedFolders = folders.filter(f => !idsToDelete.includes(f.id));
    setFolders(updatedFolders);
    localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
    
    // Clear folderId from words that were in any of these deleted folders
    const updatedWords = savedWords.map(w => w.folderId && idsToDelete.includes(w.folderId) ? { ...w, folderId: null } : w);
    saveWordsList(updatedWords);

    // Clear folderId from lessons that were in any of these deleted folders
    const updatedLessons = savedLessons.map(l => l.folderId && idsToDelete.includes(l.folderId) ? { ...l, folderId: null } : l);
    setSavedLessons(updatedLessons);
    localStorage.setItem("saved_chinese_lessons", JSON.stringify(updatedLessons));
  };

  const wordsForPractice = practiceWordId
    ? savedWords.filter(w => w.id === practiceWordId)
    : practiceFolderId === 'all' 
    ? savedWords 
    : practiceFolderId === 'uncategorized'
    ? savedWords.filter(w => !w.folderId)
    : practiceFolderId 
    ? savedWords.filter(w => w.folderId === practiceFolderId)
    : savedWords;

  return (
    <div className={`bg-slate-50 text-slate-800 flex flex-col font-sans ${mainTab === 'vocabulary' || mainTab === 'practice' || mainTab === 'chat' || mainTab === 'notebook' || (mainTab === 'home' && studyMode === 'listening_room') ? 'fixed inset-0 overflow-hidden' : 'min-h-[100dvh]'}`} id="interactive-app-root">
      
      {/* Brilliant Active Header Panel mimicking "Vibrant Palette" aesthetic */}
      <header className="shrink-0 bg-white border-b border-slate-100 px-3 sm:px-4 h-12 sm:h-[52px] md:px-12 flex items-center justify-center sticky top-0 z-50 shadow-xs" id="app-header">
        <div className="absolute left-3 sm:left-4 md:left-12 flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-md shadow-orange-500/20">
            T
          </div>
        </div>
        <h1 className="text-base sm:text-xl font-black text-slate-900 leading-tight flex items-center justify-center tracking-tight">
          THẢO MOCHI
        </h1>
      </header>

      {/* Main Container Layout */}
      <div className={`flex-1 w-full mx-auto flex flex-col gap-2.5 sm:gap-4 ${
        studyMode === "listening_room" && mainTab === 'home'
          ? (isNavVisible ? 'max-w-[1920px] px-2 sm:px-6 pt-1.5 sm:pt-2 pb-[64px] sm:pb-[72px] flex-1 min-h-0' : 'max-w-[1920px] px-2 sm:px-6 pt-1.5 sm:pt-2 pb-2 sm:pb-3 flex-1 min-h-0')
          : mainTab === 'chat' || mainTab === 'notebook' 
          ? 'max-w-[1920px] px-2.5 sm:px-6 pt-2 pb-16 sm:pb-20 flex-1 min-h-0 overflow-hidden' 
          : mainTab === 'vocabulary' 
          ? 'max-w-[1920px] px-2.5 sm:px-6 pt-2 pb-16 sm:pb-20 flex-1 min-h-0 overflow-hidden' 
          : mainTab === 'practice' 
          ? 'max-w-[1920px] px-2.5 sm:px-6 pt-2 pb-16 sm:pb-20 flex-1 min-h-0 overflow-hidden' 
          : 'max-w-[1920px] px-3 sm:px-6 pt-2 pb-20 sm:pb-22'
      }`}>
        
        {mainTab === 'home' && (
          <div className={`w-full ${studyMode === "listening_room" ? "space-y-2 flex-1 flex flex-col min-h-0" : "space-y-2.5 sm:space-y-3.5"}`}>
            {/* Header sub-tabs: Phân tích văn bản vs Phòng luyện nghe */}
            <div className="flex items-center justify-between bg-white rounded-xl p-1 border border-slate-100 shadow-xs">
              <div className="grid grid-cols-2 sm:flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStudyMode("reader")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    studyMode === "reader"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <ScanText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Phân tích & Đọc</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudyMode("listening_room");
                    setTimeout(() => {
                      document.getElementById('listening-room-audacity-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    studyMode === "listening_room"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                  <span className="truncate">Luyện nghe</span>
                  <span className="hidden xs:inline-block sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-extrabold uppercase shrink-0">Mới</span>
                </button>
              </div>
            </div>

            {studyMode === "listening_room" ? (
              <div id="listening-room-audacity-section" className="w-full flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AudacityAudioPlayer 
                  lessonText={tokens.length > 0 ? tokens.map(t => t.text).join('') : (customText || selectedLesson.text)} 
                  lessonTokens={tokens}
                  lessonTitle={selectedLesson.title && selectedLesson.title !== "Văn bản tự nhập" ? selectedLesson.title : "Đoạn văn bài học"}
                  initialTrackName={selectedLesson.title && selectedLesson.title !== "Văn bản tự nhập" ? `Track 1 - ${selectedLesson.title}` : "Track 1 - Đoạn văn bài học"}
                  selectedVoice={selectedVoice?.toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural'}
                  selectedVoiceName={selectedVoice?.toLowerCase().includes('yunxi') ? '云希 Online (Natural) - Chinese (Mandarin, Simplified)' : '晓晓 Online (Natural) - Chinese (Mandarin, Simplified)'}
                  selectedVoiceGender={selectedVoice?.toLowerCase().includes('yunxi') ? 'Nam' : 'Nữ'}
                  availableVoices={[
                    {
                      id: 'zh-CN-XiaoxiaoNeural',
                      name: '晓晓 Online (Natural) - Chinese (Mandarin, Simplified)',
                      uri: 'zh-CN-XiaoxiaoNeural',
                      gender: 'Nữ'
                    },
                    {
                      id: 'zh-CN-YunxiNeural',
                      name: '云希 Online (Natural) - Chinese (Mandarin, Simplified)',
                      uri: 'zh-CN-YunxiNeural',
                      gender: 'Nam'
                    }
                  ]}
                  onVoiceChange={(newUri) => {
                    setSelectedVoice(newUri);
                    setGlobalVoiceURI(newUri);
                  }}
                  onMaximizeChange={setIsListeningRoomMaximized}
                  onBackToReader={() => setStudyMode("reader")}
                  onClose={() => setStudyMode("reader")}
                  savedWords={savedWords}
                  customDict={customDict}
                  mispronouncedWords={mispronouncedWords}
                  onOpenRadicalBreakdown={handleOpenRadicalBreakdown}
                  onToggleSave={handleToggleSaveWord}
                  onMarkKnown={handleMarkKnown}
                />
              </div>
            ) : (
              <>
                {/* Top Side: Inputs / Presets Library */}
                <div className={`w-full ${isFullscreen ? 'hidden' : ''}`}>
                  {tokens.length > 0 && !isInputExpanded ? (
                    <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <ScanText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {selectedLesson.title === "Văn bản tự nhập" ? "Bài đọc hiện tại" : selectedLesson.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                            • {tokens.filter(w => w.type === "word").length} từ phân tách
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInputExpanded(true)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition border border-slate-200 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                        <span>Nhập / Tải văn bản khác</span>
                      </button>
                    </div>
                  ) : (
                    /* Pasting Custom text / Uploading File container */
                    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <ScanText className="w-4 h-4 text-slate-600" />
                          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">PHÂN TÍCH VĂN BẢN</h2>
                        </div>
                        {tokens.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsInputExpanded(false)}
                            className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 font-medium"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Thu gọn</span>
                          </button>
                        )}
                      </div>

                      {/* Premium Selector Tabs */}
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600">
                        <button
                          type="button"
                          onClick={() => setInputSourceTab("paste")}
                          className={`py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            inputSourceTab === "paste"
                              ? "bg-white text-slate-800 shadow-xs border border-slate-200/60 font-bold"
                              : "hover:bg-white/40 hover:text-slate-800"
                          }`}
                          id="tab-paste-text"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Dán văn bản</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputSourceTab("file")}
                          className={`py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            inputSourceTab === "file"
                              ? "bg-white text-slate-800 shadow-xs border border-slate-200/60 font-bold"
                              : "hover:bg-white/40 hover:text-slate-800"
                          }`}
                          id="tab-upload-file"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tài liệu</span>
                        </button>
                      </div>

                      {inputSourceTab === "paste" ? (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400">
                            Nhập hoặc dán đoạn văn tiếng Trung để tự động phân tích và tra từ vựng kèm Pinyin:
                          </p>

                          <form onSubmit={handleAnalyzeCustomText} className="space-y-2.5">
                            <textarea
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              placeholder="Nhập hoặc dán văn bản chữ Hán của bạn tại đây... (Ví dụ: 今天天气很好，我想去公园跑步。)"
                              rows={3}
                              className="w-full p-3.5 rounded-2xl bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all resize-none"
                              id="custom-text-textarea"
                            />
                            <button
                              type="submit"
                              disabled={isLoading || !customText.trim()}
                              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-orange-500/10 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                              id="btn-submit-custom-text"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Bắt đầu phân tích văn bản</span>
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400">
                            Hãy kéo thả tài liệu tiếng Trung (.docx, .txt, .md, .xlsx) của bạn vào khung bên dưới. Hệ thống sẽ tự động phân tích & tách từ vựng tức thì.
                          </p>
                          <FileUploader onTextLoaded={handleFileTextLoaded} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {studyMode === 'reader' && (mainTab === 'home' || (mainTab === 'lessons' && viewingLessonId)) && (
          <>
        {/* Bottom Side: Reading Area */}
        <div className={`w-full space-y-3.5 transition-all duration-300 ${tokens.length === 0 && !isLoading ? 'hidden' : ''}`}>
          
          {/* Main Reading Workspace Panel */}
          <div className={`bg-white shadow-sm border border-slate-100 p-4 sm:p-6 md:p-7 relative space-y-4 overflow-y-auto rounded-3xl ${isFullscreen ? 'min-h-[85vh]' : ''}`} id="reading-desk">
            
            {mainTab === 'lessons' && viewingLessonId && (
              <div className="flex items-center justify-between gap-2 mb-2 -mt-1 flex-wrap">
                <button 
                  onClick={() => {
                    setViewingLessonId(null);
                    setStudyMode("reader");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium text-xs border border-slate-200 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Quay lại danh sách bài học
                </button>
              </div>
            )}

            {/* Control banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0 sm:pr-4">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 shrink-0" />
                  {isEditingTitle ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        className="flex-1 min-w-[120px] text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border-2 border-blue-400 rounded-lg px-2 py-1 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle();
                          if (e.key === 'Escape') setIsEditingTitle(false);
                        }}
                      />
                      <button onClick={handleSaveTitle} className="p-1.5 shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsEditingTitle(false)} className="p-1.5 shrink-0 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group min-w-0 flex-1">
                      <span className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate max-w-[230px] sm:max-w-[300px] md:max-w-[400px]">
                        {selectedLesson.title === "Văn bản tự nhập" ? "BÀI ĐỌC" : selectedLesson.title}
                      </span>
                      <button
                        onClick={() => {
                          setEditingTitleValue(selectedLesson.title === "Văn bản tự nhập" ? "BÀI ĐỌC" : selectedLesson.title);
                          setIsEditingTitle(true);
                        }}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 shrink-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        title="Đổi tiêu đề bài học"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                </div>

              {/* Functional parameters */}
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                
                {/* Voice Selection - Chỉ sử dụng 2 giọng đọc chuẩn trong toàn bộ app */}
                <div className="flex-1 sm:flex-initial min-w-[130px] max-w-full sm:max-w-[260px]">
                  <select
                    value={selectedVoice?.toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural'}
                    onChange={(e) => {
                      const newUri = e.target.value;
                      setSelectedVoice(newUri);
                      setGlobalVoiceURI(newUri);
                      cancelSpeech();
                      speakMandarin("你好，这是我的声音。", 1.0, undefined, newUri);
                    }}
                    disabled={isInlineEditing}
                    className="w-full px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold border transition bg-white text-slate-700 border-slate-200 outline-none hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed truncate shadow-xs"
                    title="Chỉ sử dụng 2 giọng đọc chuẩn: Xiaoxiao và Yunxi"
                  >
                    <option value="zh-CN-XiaoxiaoNeural">
                      晓晓 Online (Natural) - Nữ
                    </option>
                    <option value="zh-CN-YunxiNeural">
                      云希 Online (Natural) - Nam
                    </option>
                  </select>
                </div>

                {/* Save Lesson Button */}
                <button
                  onClick={() => setIsSaveLessonModalOpen(true)}
                  disabled={tokens.length === 0 || isInlineEditing}
                  className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border transition disabled:opacity-50 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer min-w-[38px] min-h-[38px]"
                  title="Lưu bài học"
                >
                  <Bookmark className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline font-semibold text-sm">Lưu</span>
                </button>

                {/* Edit Text Button */}
                <button
                  onClick={() => {
                    setIsInlineEditing(true);
                    setCustomText(tokens.map(t => t.text).join(''));
                    setTimeout(() => {
                      document.getElementById("inline-edit-textarea")?.focus();
                    }, 100);
                  }}
                  disabled={tokens.length === 0}
                  className={`flex items-center justify-center p-2 rounded-xl border transition min-w-[38px] min-h-[38px] ${isInlineEditing ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                  title="Chỉnh sửa bài đọc"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hidden sm:flex items-center justify-center p-2 rounded-xl border transition bg-white hover:bg-slate-50 text-slate-600 border-slate-200 min-w-[38px] min-h-[38px]"
                  id="btn-toggle-fullscreen"
                  title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Speech Synthesis Trigger */}
                <div className="flex bg-white hover:bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition focus-within:ring-2 focus-within:ring-slate-300/40">
                  <button
                    onClick={handleSpeakFullParagraph}
                    disabled={tokens.length === 0 || isInlineEditing}
                    className={`flex items-center justify-center px-2.5 sm:px-3 py-2 transition min-w-[38px] min-h-[38px] ${
                      paragraphSpeaking && !paragraphPaused
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 disabled:opacity-50"
                    }`}
                    title={paragraphSpeaking && !paragraphPaused ? "Đang đọc..." : (paragraphSpeaking && paragraphPaused ? "Tiếp tục đọc" : "Đọc toàn bài")}
                    id="btn-speak-full-paragraph"
                  >
                    {paragraphSpeaking && !paragraphPaused ? (
                      <Pause className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsLoopingParagraph(!isLoopingParagraph)}
                    disabled={tokens.length === 0 || isInlineEditing}
                    className={`flex items-center justify-center px-2 py-2 border-l border-slate-200 transition min-w-[36px] min-h-[38px] ${
                      isLoopingParagraph 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    }`}
                    title={isLoopingParagraph ? "Tắt lặp vòng" : "Lặp vòng vô tận"}
                  >
                    <Repeat className={`w-4 h-4 ${isLoopingParagraph ? 'animate-pulse' : ''}`} />
                  </button>
                </div>

                {/* Nút Icon Con Mắt: Ấn vào trực tiếp để Hiện / Ẩn Pinyin */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHanzi(true);
                    setShowPinyin((prev) => !prev);
                  }}
                  disabled={isInlineEditing}
                  className={`flex items-center justify-center p-2 rounded-xl border transition min-w-[38px] min-h-[38px] disabled:opacity-50 cursor-pointer shadow-xs ${
                    showPinyin
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                  title={showPinyin ? "Đang hiện Pinyin (Nhấp để ẩn Pinyin - Phím P)" : "Nhấp để hiện Pinyin (Phím P)"}
                  id="btn-toggle-pinyin"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                </button>

                {/* Switch to Luyện nghe đoạn văn */}
                <button
                  onClick={() => {
                    setStudyMode("listening_room");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer min-w-[38px] min-h-[38px]"
                  title="Mở Luyện nghe đoạn văn"
                >
                  <Headphones className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Luyện nghe đoạn văn</span>
                </button>
              </div>
            </div>

            {/* Error logs */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-850 text-sm border border-amber-200 flex items-start gap-2.5">
                <BadgeAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Không thể tải và phân tích đoạn văn</p>
                  <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Active interactive rendered reader wrapper */}
            {isInlineEditing ? (
              <div className="w-full flex flex-col space-y-4 animate-in fade-in zoom-in-95 mt-4">
                <textarea
                  id="inline-edit-textarea"
                  className="w-full h-[400px] p-5 text-lg sm:text-xl border border-slate-200 rounded-3xl resize-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 text-slate-700 leading-relaxed shadow-inner"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Chỉnh sửa văn bản tiếng Trung tại đây..."
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsInlineEditing(false)}
                    className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                       setIsInlineEditing(false);
                       handleAnalyzeText(customText);
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Lưu & Phân tích
                  </button>
                </div>
              </div>
            ) : (
              <TextReader
                tokens={tokens}
                showPinyin={showPinyin}
                showHanzi={showHanzi}
                showBackground={showBackground}
                selectedToken={null}
                onWordClick={() => {}}
                isLoading={isLoading}
                speakingCharIndex={speakingCharIndex}
                savedWords={savedWords}
                missingWords={historicalMissingWords}
                mispronouncedWords={mispronouncedWords}
                onOpenRadicalBreakdown={handleOpenRadicalBreakdown}
                onToggleSave={handleToggleSaveWord}
                onMarkKnown={handleMarkKnown}
              />
            )}
          </div>
        </div>

        </>
        )}

        {mainTab === 'lessons' && !viewingLessonId && (
          <div className="w-full h-full transition-all duration-300 flex-1 min-h-0 px-2 sm:px-0 pt-2 pb-16">
            <SavedLessonsList
                lessons={savedLessons}
                folders={sortedFolders}
                activeFolderId={activeFolderId}
                setActiveFolderId={setActiveFolderId}
                onEditLessonTitle={(lessonId, newTitle) => {
                  const updated = savedLessons.map(l => l.id === lessonId ? { ...l, title: newTitle } : l);
                  setSavedLessons(updated);
                  localStorage.setItem("saved_chinese_lessons", JSON.stringify(updated));
                }}
                onOpenLesson={(lesson) => {
                  setCustomText(lesson.text);
                  setSelectedLesson({
                    id: lesson.id,
                    title: lesson.title,
                    level: "Tập tin",
                    description: "Bài đọc đã lưu",
                    text: lesson.text
                  });
                  handleAnalyzeText(lesson.text, lesson.tokens);
                  setViewingLessonId(lesson.id);
                  setStudyMode("reader");
                }}
                onOpenListening={(lesson) => {
                  setCustomText(lesson.text);
                  setSelectedLesson({
                    id: lesson.id,
                    title: lesson.title,
                    level: "Tập tin",
                    description: "Bài đọc đã lưu",
                    text: lesson.text
                  });
                  handleAnalyzeText(lesson.text, lesson.tokens);
                  setViewingLessonId(lesson.id);
                  setStudyMode("listening_room");
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDeleteLesson={(lessonId) => {
                  const updated = savedLessons.filter(l => l.id !== lessonId);
                  setSavedLessons(updated);
                  localStorage.setItem("saved_chinese_lessons", JSON.stringify(updated));
                }}
                onDeleteFolder={handleDeleteFolder}
                onCreateFolder={(name, parentId = null) => {
                  const newFolder = { id: crypto.randomUUID(), name, createdAt: Date.now(), parentId };
                  const updatedFolders = [...folders, newFolder];
                  setFolders(updatedFolders);
                  localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
                }}
                onUpdateFolder={(id, newName) => {
                  const updatedFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
                  setFolders(updatedFolders);
                  localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
                }}
                onMoveFolder={(draggedId, targetId) => {
                  const getDescendants = (id: string): string[] => {
                    const children = folders.filter(f => f.parentId === id).map(f => f.id);
                    return [...children, ...children.flatMap(getDescendants)];
                  };
                  if (draggedId === targetId || (targetId && getDescendants(draggedId).includes(targetId))) {
                    return; 
                  }
                  const updatedFolders = folders.map(f => f.id === draggedId ? { ...f, parentId: targetId } : f);
                  setFolders(updatedFolders);
                  localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
                }}
              />
          </div>
        )}

        {mainTab === 'lessons' && viewingLessonId && studyMode === "listening_room" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 pb-2">
            <AudacityAudioPlayer 
              lessonText={tokens.length > 0 ? tokens.map(t => t.text).join('') : (customText || selectedLesson.text)} 
              lessonTokens={tokens}
              lessonTitle={selectedLesson.title && selectedLesson.title !== "Văn bản tự nhập" ? selectedLesson.title : "Đoạn văn bài học"}
              initialTrackName={selectedLesson.title && selectedLesson.title !== "Văn bản tự nhập" ? `Track 1 - ${selectedLesson.title}` : "Track 1 - Đoạn văn bài học"}
              selectedVoice={selectedVoice?.toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural'}
              selectedVoiceName={selectedVoice?.toLowerCase().includes('yunxi') ? '云希 Online (Natural) - Chinese (Mandarin, Simplified)' : '晓晓 Online (Natural) - Chinese (Mandarin, Simplified)'}
              selectedVoiceGender={selectedVoice?.toLowerCase().includes('yunxi') ? 'Nam' : 'Nữ'}
              availableVoices={[
                {
                  id: 'zh-CN-XiaoxiaoNeural',
                  name: '晓晓 Online (Natural) - Chinese (Mandarin, Simplified)',
                  uri: 'zh-CN-XiaoxiaoNeural',
                  gender: 'Nữ'
                },
                {
                  id: 'zh-CN-YunxiNeural',
                  name: '云希 Online (Natural) - Chinese (Mandarin, Simplified)',
                  uri: 'zh-CN-YunxiNeural',
                  gender: 'Nam'
                }
              ]}
              onVoiceChange={(newUri) => {
                setSelectedVoice(newUri);
                setGlobalVoiceURI(newUri);
              }}
              onMaximizeChange={setIsListeningRoomMaximized}
              onBackToReader={() => setStudyMode("reader")}
              onClose={() => setStudyMode("reader")}
              savedWords={savedWords}
              customDict={customDict}
              mispronouncedWords={mispronouncedWords}
              onOpenRadicalBreakdown={handleOpenRadicalBreakdown}
              onToggleSave={handleToggleSaveWord}
              onMarkKnown={handleMarkKnown}
            />
          </div>
        )}

        {/* Full width row for Tabular saved words / Lexicon library */}
        <div className={`w-full h-full transition-all duration-300 flex-1 min-h-0 ${mainTab === 'vocabulary' ? 'block' : 'hidden'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 md:p-3 pb-1 md:pb-2 border border-slate-150/80 dark:border-slate-800 shadow-xs h-full overflow-hidden flex flex-col">
            <SavedWordsList
              onOpenRadicalBreakdown={(word) => handleOpenRadicalBreakdown(word, 'vocabulary')}
              onNavigateToPractice={(targetId, type, isSingleWord) => {
                if (isSingleWord) {
                  setPracticeWordId(targetId);
                  setPracticeFolderId(null);
                } else {
                  setPracticeFolderId(targetId);
                  setPracticeWordId(null);
                }
                setPracticeTrigger({ timestamp: Date.now(), type });
                setMainTab('practice');
              }}
              savedWords={savedWords}
              folders={sortedFolders}
              onCreateFolder={(name, parentId = null) => {
                const newFolder = { id: crypto.randomUUID(), name, createdAt: Date.now(), parentId };
                const updatedFolders = [...folders, newFolder];
                setFolders(updatedFolders);
                localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
              }}
              onUpdateFolder={(id, newName) => {
                const updatedFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
                setFolders(updatedFolders);
                localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
              }}
              onMoveFolder={(draggedId, targetId) => {
                const getDescendants = (id: string): string[] => {
                  const children = folders.filter(f => f.parentId === id).map(f => f.id);
                  return [...children, ...children.flatMap(getDescendants)];
                };
                if (draggedId === targetId || (targetId && getDescendants(draggedId).includes(targetId))) {
                  return; 
                }
                const updatedFolders = folders.map(f => f.id === draggedId ? { ...f, parentId: targetId } : f);
                setFolders(updatedFolders);
                localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
              }}
              onMoveToFolder={(wordIds, folderId) => {
                const updatedWords = savedWords.map(w => wordIds.includes(w.id) ? { ...w, folderId, lastModified: Date.now() } : w);
                saveWordsList(updatedWords);
              }}
              onDeleteFolder={handleDeleteFolder}
              onRemoveWord={handleRemoveSavedWord}
              onToggleWordStatus={(id, isKnown) => {
                setSavedWords(prev => {
                  const updated = prev.map(w => w.id === id ? { ...w, isKnown, lastModified: Date.now() } : w);
                  localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
                  return updated;
                });
              }}
              onUpdateWord={(id, updatedData) => {
                setSavedWords(prev => {
                  const updated = prev.map(w => w.id === id ? { ...w, ...updatedData, lastModified: Date.now() } : w);
                  localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
                  return updated;
                });
              }}
              onReviewWord={(id, grade, mode) => {
                 setSavedWords(prev => {
                   const updated = prev.map(w => {
                     if (w.id === id) {
                        if (mode === 'zh-vi') {
                          const sm2 = calculateSM2(grade, w.easinessFactorZhVi, w.repetitionCountZhVi, w.intervalZhVi);
                          return {
                            ...w,
                            easinessFactorZhVi: sm2.easiness,
                            repetitionCountZhVi: sm2.repetitions,
                            intervalZhVi: sm2.interval,
                            nextReviewDateZhVi: sm2.nextReviewDate,
                            lastModified: Date.now()
                          };
                        } else {
                          const sm2 = calculateSM2(grade, w.easinessFactorViZh, w.repetitionCountViZh, w.intervalViZh);
                          return {
                            ...w,
                            easinessFactorViZh: sm2.easiness,
                            repetitionCountViZh: sm2.repetitions,
                            intervalViZh: sm2.interval,
                            nextReviewDateViZh: sm2.nextReviewDate,
                            lastModified: Date.now()
                          };
                        }
                     }
                     return w;
                   });
                   // persist to local storage
                   localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
                   return updated;
                 });
              }}
              onResetProgress={(folderId, mode) => {
                setSavedWords(prev => {
                  const updated = prev.map(w => {
                    const match = folderId ? w.folderId === folderId : true;
                    if (match) {
                      return {
                        ...w,
                        isKnown: false,
                        easinessFactorZhVi: 2.5,
                        repetitionCountZhVi: 0,
                        intervalZhVi: 0,
                        nextReviewDateZhVi: 0,
                        easinessFactorViZh: 2.5,
                        repetitionCountViZh: 0,
                        intervalViZh: 0,
                        nextReviewDateViZh: 0,
                        lastModified: Date.now()
                      };
                    }
                    return w;
                  });
                  localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
                  
                  // Force a manual event dispatch if we want to ensure other components know?
                  // Or just use the state update. State update is enough.
                  return updated;
                });
                
                // Show a brief success message
                alert("Đã thiết lập lại quá trình học!");
              }}
              onSelectWord={handleSelectSavedWordPreview}
              onAddWord={async (newWordData) => {
                let finalWordData = { ...newWordData };
                
                // Read from localStorage to ensure we have the absolute latest dictionary
                const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
                let latestDict: Record<string, Partial<Token>> = {};
                try { latestDict = JSON.parse(savedDictStr); } catch (_) {}
                
                const customEntry = latestDict[newWordData.text];
                if (customEntry) {
                   finalWordData.pinyin = finalWordData.pinyin || customEntry.pinyin;
                   finalWordData.translation = finalWordData.translation || customEntry.translation;
                   finalWordData.partOfSpeech = finalWordData.partOfSpeech || customEntry.partOfSpeech;
                }
                
                if (!finalWordData.translation || !finalWordData.pinyin || !finalWordData.hskLevel) {
                   try {
                     const response = await fetch("/api/lookup-word", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ word: newWordData.text })
                     });
                     const data = await response.json();
                     if (data) {
                        if (!finalWordData.translation && data.translation) finalWordData.translation = data.translation;
                        if (!finalWordData.pinyin && data.pinyin) finalWordData.pinyin = data.pinyin;
                        if (!finalWordData.partOfSpeech && data.partOfSpeech) finalWordData.partOfSpeech = data.partOfSpeech;
                        if (!finalWordData.hskLevel && data.hskLevel) finalWordData.hskLevel = data.hskLevel;
                        if (!finalWordData.example && data.example) finalWordData.example = data.example;
                     }
                   } catch (e) {
                     console.warn("Tra từ phụ trợ thất bại:", e);
                   }
                }
                
                if (!finalWordData.translation) finalWordData.translation = "(Chưa cấp nghĩa)";
                if (!finalWordData.pinyin) finalWordData.pinyin = "?";

                if (!latestDict[finalWordData.text] || latestDict[finalWordData.text].translation === "(Chưa cấp nghĩa)") {
                   latestDict[finalWordData.text] = {
                      pinyin: finalWordData.pinyin,
                      translation: finalWordData.translation !== "(Chưa cấp nghĩa)" ? finalWordData.translation : undefined,
                      partOfSpeech: finalWordData.partOfSpeech,
                   };
                   localStorage.setItem("custom_chinese_dictionary", JSON.stringify(latestDict));
                   setCustomDict(latestDict);
                }

                const newWord = {
                  ...finalWordData,
                  id: crypto.randomUUID(),
                  savedAt: Date.now(),
                  isKnown: false
                };
                saveWordsList([newWord, ...savedWords]);
              }}
              onAddWords={async (newWordsData) => {
                const newWordsToAdd = [];
                const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
                let latestDict = {};
                try { latestDict = JSON.parse(savedDictStr); } catch (_) {}
                let dictChanged = false;
                
                const processWord = async (wordData) => {
                  let finalWordData = { ...wordData };
                  
                  const customEntry = latestDict[wordData.text];
                  if (customEntry) {
                     finalWordData.pinyin = finalWordData.pinyin || customEntry.pinyin;
                     finalWordData.translation = finalWordData.translation || customEntry.translation;
                     finalWordData.partOfSpeech = finalWordData.partOfSpeech || customEntry.partOfSpeech;
                  }
                  
                  if (!finalWordData.translation || !finalWordData.pinyin || !finalWordData.hskLevel) {
                     try {
                       const response = await fetch("/api/lookup-word", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ word: wordData.text })
                       });
                       const data = await response.json();
                       if (data) {
                          if (!finalWordData.translation && data.translation) finalWordData.translation = data.translation;
                          if (!finalWordData.pinyin && data.pinyin) finalWordData.pinyin = data.pinyin;
                          if (!finalWordData.partOfSpeech && data.partOfSpeech) finalWordData.partOfSpeech = data.partOfSpeech;
                          if (!finalWordData.hskLevel && data.hskLevel) finalWordData.hskLevel = data.hskLevel;
                          if (!finalWordData.example && data.example) finalWordData.example = data.example;
                       }
                     } catch (e) {
                       console.warn("Tra từ phụ trợ thất bại:", e);
                     }
                  }
                  
                  if (!finalWordData.translation) finalWordData.translation = "(Chưa cấp nghĩa)";
                  if (!finalWordData.pinyin) finalWordData.pinyin = "?";
                  return finalWordData;
                };

                const chunkSize = 5;
                for (let i = 0; i < newWordsData.length; i += chunkSize) {
                  const chunk = newWordsData.slice(i, i + chunkSize);
                  const processedChunk = await Promise.all(chunk.map(processWord));
                  
                  for (const finalWordData of processedChunk) {
                    if (!latestDict[finalWordData.text] || latestDict[finalWordData.text].translation === "(Chưa cấp nghĩa)") {
                       latestDict[finalWordData.text] = {
                          pinyin: finalWordData.pinyin,
                          translation: finalWordData.translation !== "(Chưa cấp nghĩa)" ? finalWordData.translation : undefined,
                          partOfSpeech: finalWordData.partOfSpeech,
                       };
                       dictChanged = true;
                    }
                    newWordsToAdd.push({
                      ...finalWordData,
                      id: crypto.randomUUID(),
                      savedAt: Date.now(),
                      isKnown: false
                    });
                  }
                }
                
                if (dictChanged) {
                    localStorage.setItem("custom_chinese_dictionary", JSON.stringify(latestDict));
                    setCustomDict(latestDict);
                }
                
                const currentSaved = savedWords;
                const newCombined = [...newWordsToAdd, ...currentSaved];
                saveWordsList(newCombined);
              }}
            />
          </div>
        </div>
      
      {/* Account & Sync Tab */}
        
        {mainTab === 'notebook' && (
          <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4">
            <NotebookChat onSendToLearning={handleSendToLearning} savedWords={savedWords} folders={sortedFolders} />
          </div>
        )}

        {mainTab === 'chat' && (
          <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4">
            <AssistantChat onSendToLearning={handleSendToLearning} />
          </div>
        )}

        {mainTab === 'practice' && (
          <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4">
            <Practice 
              allSavedWords={savedWords}
              savedWords={wordsForPractice} 
              currentLessonText={tokens.length > 0 ? tokens.map(t => t.text).join('') : (customText || selectedLesson.text)}
              currentLessonTitle={selectedLesson.title && selectedLesson.title !== "Văn bản tự nhập" ? selectedLesson.title : "Đoạn văn bài học"}
              currentVoice={selectedVoice?.toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural'}
              availableVoices={voices}
              onVoiceChange={(newUri) => {
                setSelectedVoice(newUri);
                setGlobalVoiceURI(newUri);
              }}
              autoGenerateTimestamp={practiceTrigger.timestamp} 
              autoGenerateType={practiceTrigger.type} 
              onBack={() => setMainTab('vocabulary')}
              onUpdateWord={(id, updatedData) => {
              setSavedWords(prev => {
                const updated = prev.map(w => w.id === id ? { ...w, ...updatedData } : w);
                localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
                return updated;
              });
            }} />
          </div>
        )}

        {mainTab === 'account' && (
          <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Tài khoản & Sao lưu</h2>
              </div>
              
              {currentUser ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <img src={currentUser.photoURL || ""} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-lg truncate">{currentUser.displayName}</div>
                      <div className="text-slate-500 text-sm truncate">{currentUser.email}</div>
                    </div>
                    <button 
                      onClick={() => logout()}
                      className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Đồng bộ Cloud</h3>
                    
                    {syncStatus === 'pushing' || syncStatus === 'pulling' ? (
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" /> 
                          <span>{syncStatus === 'pushing' ? `Đang đồng bộ dữ liệu bài học & từ vựng (${syncProgress}/${syncWordCount})...` : `Đang đồng bộ dữ liệu bài học & từ vựng (${syncProgress}/${syncWordCount})...`}</span>
                        </div>
                        <button 
                          onClick={handleStopSync}
                          className="p-2 hover:bg-blue-100 rounded-full transition-colors shrink-0"
                          title="Dừng đồng bộ"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={handlePushToCloud}
                          className="flex items-center justify-center gap-2 font-semibold transition-colors px-4 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm" 
                        >
                          <Upload className="w-5 h-5" /> Tải lên Cloud
                        </button>
                        <button 
                          onClick={handlePullFromCloud}
                          className="flex items-center justify-center gap-2 font-semibold transition-colors px-4 py-3 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm" 
                        >
                          <Download className="w-5 h-5" /> Tải về máy
                        </button>
                      </div>
                    )}
                    
                    {syncStatus === 'success_push' && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                        <Cloud className="w-4 h-4" /> Đã hoàn thành tải lên (dữ liệu & {syncWordCount} từ)
                      </div>
                    )}
                    {syncStatus === 'success_pull' && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                        <Download className="w-4 h-4" /> Đã hoàn thành tải về (dữ liệu & {syncWordCount} từ)
                      </div>
                    )}
                    {lastSyncTime && syncStatus !== 'pushing' && syncStatus !== 'pulling' && (
                      <div className="text-center text-xs text-slate-500">
                        Đồng bộ lần cuối: {lastSyncTime.toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CloudOff className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Chưa đăng nhập</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Đăng nhập bằng tài khoản Google để có thể đồng bộ và sao lưu dữ liệu từ vựng của bạn lên Cloud.</p>
                  <button 
                    onClick={() => googleSignIn()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Đăng nhập bằng Google
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      
      </div>


      
  {/* Persistent Word Definition Drawer at bottom of layout */}
      <WordPopup
        token={activeToken}
        onClose={() => setActiveToken(null)}
        onToggleSave={handleToggleSaveWord}
        isSaved={activeToken ? isWordSaved(activeToken) : false}
        onUpdateToken={handleUpdateToken}
        onMarkKnown={handleMarkKnown}
        isKnown={activeToken ? savedWords.find(w => w.text === activeToken.text)?.isKnown || false : false}
        onOpenRadicalBreakdown={handleOpenRadicalBreakdown}
      />
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

      <SaveLessonModal
        isOpen={isSaveLessonModalOpen}
        onClose={() => setIsSaveLessonModalOpen(false)}
        folders={sortedFolders}
        defaultLessonTitle={selectedLesson.title !== "Văn bản tự nhập" ? selectedLesson.title : undefined}
        onSave={(folderId, newFolderName, lessonTitle) => {
          let targetFolderId = folderId;
          
          if (newFolderName) {
            const newFolder = {
              id: `folder-${Date.now()}`,
              name: newFolderName,
              createdAt: Date.now()
            };
            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            localStorage.setItem("saved_chinese_folders", JSON.stringify(updatedFolders));
            targetFolderId = newFolder.id;
          }

          const newSavedLesson = {
            id: `lesson-${Date.now()}`,
            title: lessonTitle || `Bài đọc ${new Date().toLocaleDateString('vi-VN')}`,
            text: customText || selectedLesson.text,
            folderId: targetFolderId,
            savedAt: Date.now(),
            tokens: tokens.length > 0 ? tokens : undefined
          };

          const updatedLessons = [newSavedLesson, ...savedLessons];
          setSavedLessons(updatedLessons);
          localStorage.setItem("saved_chinese_lessons", JSON.stringify(updatedLessons));
          setIsSaveLessonModalOpen(false);
        }}
      />

      {/* Radical Breakdown Modal (Chia các bộ thủ) */}
      <RadicalBreakdownModal
        isOpen={isRadicalModalOpen}
        onClose={() => setIsRadicalModalOpen(false)}
        initialWord={radicalModalWord}
        lessonWords={radicalModalSource === 'vocabulary' ? [] : highlightedRadicalWords}
        hideLessonWords={radicalModalSource === 'vocabulary'}
      />

      {/* Floating Assistant Button */}
      {(mainTab !== 'chat' && mainTab !== 'notebook' && !isChatWindowOpen && !isListeningRoomMaximized) && (
        <motion.button
          drag
          dragMomentum={false}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          onClick={(e) => {
            if (isDraggingRef.current) return;
            setIsChatWindowOpen(true);
          }}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={() => {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 150);
          }}
          className={`fixed right-3 sm:right-4 md:right-8 z-40 w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white hover:scale-105 active:scale-95 transition-all duration-300 ${isNavVisible ? 'bottom-[74px] sm:bottom-[88px]' : 'bottom-4'}`}
          title="Mở trợ lý AI"
        >
          <Sparkles className="w-4 h-4" />
        </motion.button>
      )}

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isChatWindowOpen && mainTab !== 'chat' && mainTab !== 'notebook' && !isListeningRoomMaximized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed right-3 sm:right-4 md:right-8 z-50 w-[calc(100vw-1.5rem)] sm:w-[400px] h-[460px] sm:h-[500px] max-h-[72dvh] shadow-2xl rounded-3xl sm:rounded-[32px] overflow-hidden transition-all duration-300 ${isNavVisible ? 'bottom-[74px] sm:bottom-[88px]' : 'bottom-4'}`}
          >
            <AssistantChat onClose={() => setIsChatWindowOpen(false)} onSendToLearning={handleSendToLearning} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-1 py-1.5 sm:px-6 sm:py-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe grid grid-cols-6 sm:flex sm:justify-center sm:gap-6 items-center transition-all duration-300 transform ${isNavVisible && !isListeningRoomMaximized ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <button 
          onClick={() => setMainTab('home')}
          className={`flex flex-col items-center justify-center w-full sm:w-20 h-13 sm:h-14 gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl transition-all min-w-0 px-0.5 ${mainTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${mainTab === 'home' ? 'bg-blue-100 text-blue-600' : ''}`}>
            <Home className={`${mainTab === 'home' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${mainTab === 'home' ? 'opacity-100' : 'opacity-70'}`}>Học tập</span>
        </button>

        <button 
          onClick={() => setMainTab('lessons')}
          className={`flex flex-col items-center justify-center w-full sm:w-20 h-13 sm:h-14 gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl transition-all min-w-0 px-0.5 ${mainTab === 'lessons' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${mainTab === 'lessons' ? 'bg-rose-100 text-rose-600' : ''}`}>
            <BookOpen className={`${mainTab === 'lessons' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${mainTab === 'lessons' ? 'opacity-100' : 'opacity-70'}`}>Bài học</span>
        </button>

        <button 
          onClick={() => setMainTab('notebook')}
          className={`flex flex-col items-center justify-center w-full sm:w-20 h-13 sm:h-14 gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl transition-all min-w-0 px-0.5 ${mainTab === 'notebook' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${mainTab === 'notebook' ? 'bg-teal-100 text-teal-600' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${mainTab === 'notebook' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <span className={`text-[9.5px] sm:text-xs font-semibold truncate max-w-full ${mainTab === 'notebook' ? 'opacity-100' : 'opacity-70'}`}>Câu chuyện</span>
        </button>

        <button 
          onClick={() => setMainTab('vocabulary')}
          className={`flex flex-col items-center justify-center w-full sm:w-20 h-13 sm:h-14 gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl transition-all min-w-0 px-0.5 ${mainTab === 'vocabulary' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${mainTab === 'vocabulary' ? 'bg-amber-100 text-amber-600' : ''}`}>
            <Book className={`${mainTab === 'vocabulary' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${mainTab === 'vocabulary' ? 'opacity-100' : 'opacity-70'}`}>Từ vựng</span>
        </button>

        <button 
          onClick={() => setMainTab('chat')}
          className={`flex flex-col items-center justify-center w-full sm:w-20 h-13 sm:h-14 gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl transition-all min-w-0 px-0.5 ${mainTab === 'chat' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${mainTab === 'chat' ? 'bg-indigo-100 text-indigo-600' : ''}`}>
            <MessageSquare className={`${mainTab === 'chat' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${mainTab === 'chat' ? 'opacity-100' : 'opacity-70'}`}>Trợ lý AI</span>
        </button>

        <button 
          onClick={() => setMainTab('account')}
          className={`flex flex-col items-center justify-center w-full sm:w-20 h-13 sm:h-14 gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl transition-all min-w-0 px-0.5 ${mainTab === 'account' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${mainTab === 'account' ? 'bg-emerald-100 text-emerald-600' : ''}`}>
            <UserIcon className={`${mainTab === 'account' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${mainTab === 'account' ? 'opacity-100' : 'opacity-70'}`}>Tài khoản</span>
        </button>
      </div>
    </div>
  );
}
