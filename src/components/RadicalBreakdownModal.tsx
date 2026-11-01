import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { X, RotateCcw, Volume2, Play, Pause, Edit3, Sparkles, BookOpen, Layers, Search, Check, ChevronRight, Lightbulb, Video, Image as ImageIcon, Loader2, Eye } from 'lucide-react';
import { speakMandarin } from '../utils/speech';
import { PRECOMPUTED_CHARACTERS, CharacterDecomposition, WordDecompositionResult, decomposeWordInstantly } from '../data/hanziDecompositions';
import YouglishModal from './YouglishModal';
import GoogleImagesModal from './GoogleImagesModal';

interface RadicalBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  lessonWords?: string[]; // Quick list of Chinese words from the current lesson
  hideLessonWords?: boolean; // When opened from vocabulary, hide the "Từ đã tô đen" row
}

// Memory cache for HanziWriter stroke data for ultra-fast 0ms rendering
const strokeDataMemoryCache = new Map<string, any>();

// Prefetch helper for character strokes
const prefetchHanziStroke = (char: string) => {
  if (!char || strokeDataMemoryCache.has(char)) return;
  try {
    const cached = localStorage.getItem("hanzi_stroke_" + char);
    if (cached) {
      strokeDataMemoryCache.set(char, JSON.parse(cached));
      return;
    }
  } catch (_) {}

  fetch(`/api/hanzi-data/${encodeURIComponent(char)}`)
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (data) {
        strokeDataMemoryCache.set(char, data);
        try {
          localStorage.setItem("hanzi_stroke_" + char, JSON.stringify(data));
        } catch (_) {}
      }
    })
    .catch(() => {});
};

// Tách bạch rõ ràng giữa Mẹo chiết tự (cấu tạo, ghép bộ) và Câu chuyện dễ nhớ (liên tưởng sinh động)
const getBreakdownAndStory = (charData?: CharacterDecomposition | null) => {
  if (!charData) return { breakdownTip: "", story: "" };

  let breakdownTip = charData.breakdownTip?.trim() || "";
  let story = charData.story?.trim() || "";

  if (!breakdownTip || !story) {
    const raw = charData.mnemonic?.trim() || "";
    
    // Nếu có dấu xuống dòng
    if (raw.includes("\n")) {
      const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        if (!breakdownTip) breakdownTip = lines[0];
        if (!story) story = lines.slice(1).join(" ");
      }
    }

    if (!breakdownTip || !story) {
      // Tách theo câu kết thúc (. ! ? 。！？)
      const sentences = raw.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
      if (sentences.length >= 2) {
        if (!breakdownTip) breakdownTip = sentences[0];
        if (!story) story = sentences.slice(1).join(" ");
      } else {
        if (!story) story = raw || `Hãy ghi nhớ chữ ${charData.char} (${charData.hanviet}) qua câu chuyện liên tưởng trực quan.`;
        if (!breakdownTip) {
          const compNames = charData.components && charData.components.length > 0
            ? charData.components.map(c => `${c.name} (${c.component})`).join(" + ")
            : (charData.radicalName || `Bộ ${charData.mainRadical}`);
          breakdownTip = `Chữ ${charData.char} có kết cấu ${charData.structure || 'chuẩn'}, chiết tự gồm: ${compNames}.`;
        }
      }
    }
  }

  return { breakdownTip, story };
};

const LOCAL_STORAGE_CACHE_KEY = "cached_radical_breakdowns_v4";

// Bộ nhớ đệm trong RAM cho truy xuất tức thì 0ms
const memoryBreakdownCache: Map<string, WordDecompositionResult> = new Map();

// Hàm lấy dữ liệu đã lưu từ bộ nhớ đệm (localStorage & RAM)
const getCachedBreakdown = (word: string): WordDecompositionResult | null => {
  const clean = word.trim();
  if (!clean) return null;
  if (memoryBreakdownCache.has(clean)) {
    return memoryBreakdownCache.get(clean)!;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed[clean]) {
        memoryBreakdownCache.set(clean, parsed[clean]);
        return parsed[clean];
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc cache chiết tự:", e);
  }
  return null;
};

// Hàm tự động lưu dữ liệu chiết tự của từ đã xem vào bộ nhớ đệm bền vững
const saveCachedBreakdown = (word: string, data: WordDecompositionResult) => {
  const clean = word.trim();
  if (!clean || !data || !data.characters || data.characters.length === 0) return;
  memoryBreakdownCache.set(clean, data);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    let parsed: Record<string, WordDecompositionResult> = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    }
    parsed[clean] = data;
    // Giữ dung lượng tối đa 500 từ đã tra cứu
    const keys = Object.keys(parsed);
    if (keys.length > 500) {
      delete parsed[keys[0]];
    }
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn("Lỗi ghi cache chiết tự:", e);
  }
};

export default function RadicalBreakdownModal({
  isOpen,
  onClose,
  initialWord = "是",
  lessonWords = [],
  hideLessonWords = false
}: RadicalBreakdownModalProps) {
  const [currentWord, setCurrentWord] = useState<string>(initialWord);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showYouglish, setShowYouglish] = useState<boolean>(false);
  const [showGoogleImages, setShowGoogleImages] = useState<boolean>(false);
  const [imageSearchKeyword, setImageSearchKeyword] = useState<string>("");
  const [data, setData] = useState<WordDecompositionResult | null>(null);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number>(0);
  const currentRequestIdRef = useRef<number>(0);
  
  // HanziWriter state
  const writerContainerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<string | null>(null);
  const [isOutlineOnly, setIsOutlineOnly] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);

  // Filter unique valid Chinese words that the user highlighted/selected
  const filteredLessonWords = React.useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    // Add words passed from user selection (tô đen)
    lessonWords.forEach(w => {
      const clean = w.trim();
      if (clean && /[\u4e00-\u9fa5]/.test(clean) && !seen.has(clean)) {
        list.push(clean);
        seen.add(clean);
      }
    });

    // If initialWord is provided and not yet in list, include it
    if (initialWord && /[\u4e00-\u9fa5]/.test(initialWord.trim())) {
      const cleanInit = initialWord.trim();
      if (!seen.has(cleanInit)) {
        list.push(cleanInit);
      }
    }

    return list;
  }, [lessonWords, initialWord]);

  // Synchronize initialWord on open
  useEffect(() => {
    if (isOpen) {
      const target = initialWord?.trim() || "是";
      setCurrentWord(target);
      setSelectedCharIndex(0);
      setData(null);
      setIsLoading(true);
      loadDecomposition(target);
    }
  }, [isOpen, initialWord]);

  // Tự động tải trước nét chữ (prefetch) cho danh sách từ vựng khi mở modal
  useEffect(() => {
    if (isOpen && filteredLessonWords.length > 0) {
      filteredLessonWords.forEach(w => {
        Array.from(w).filter(c => /[\u4e00-\u9fa5]/.test(c)).forEach(c => prefetchHanziStroke(c));
      });
    }
  }, [isOpen, filteredLessonWords]);

  // Fetch or load decomposition in < 1ms (ngay lập tức dưới 1 giây)
  const loadDecomposition = (wordToLoad: string) => {
    const cleanWord = wordToLoad.trim();
    if (!cleanWord) return;

    // Track request ID to ignore any slow in-flight responses from previously viewed words
    currentRequestIdRef.current += 1;
    const thisRequestId = currentRequestIdRef.current;

    setIsQuizMode(false);
    setQuizScore(null);
    setSelectedCharIndex(0);

    // Xoá ngay lập tức dữ liệu cũ để không bao giờ hiện nội dung của từ vựng khác
    setData(null);
    setIsLoading(true);

    // 1. KIỂM TRA DỮ LIỆU ĐÃ TÍNH TOÁN SẴN CHUẨN XÁC (Ưu tiên số 1 - 0ms):
    // Đảm bảo các chữ như "岁" (gồm Sơn 山 + Tịch 夕) luôn luôn chính xác 100%
    const chineseChars = Array.from(cleanWord).filter(c => /[\u4e00-\u9fa5]/.test(c));
    const hasAllPrecomputed = chineseChars.length > 0 && chineseChars.every(c => PRECOMPUTED_CHARACTERS[c]);
    if (hasAllPrecomputed) {
      const instantResult = decomposeWordInstantly(cleanWord);
      if (currentRequestIdRef.current !== thisRequestId) return;
      setData(instantResult);
      saveCachedBreakdown(cleanWord, instantResult);
      setIsLoading(false);
      instantResult.characters.forEach(c => prefetchHanziStroke(c.char));
      return;
    }

    // 2. KIỂM TRA BỘ NHỚ ĐỆM (RAM / LocalStorage)
    const cached = getCachedBreakdown(cleanWord);
    if (cached && cached.word === cleanWord && cached.characters && cached.characters.length > 0) {
      if (currentRequestIdRef.current !== thisRequestId) return;
      setData(cached);
      setIsLoading(false);
      cached.characters.forEach(c => prefetchHanziStroke(c.char));
      return;
    }

    // 3. KHỞI TẠO TỨC THÌ BẰNG ENGINE NỘI BỘ (< 1ms, không chờ mạng):
    const instantResult = decomposeWordInstantly(cleanWord);
    if (instantResult && instantResult.characters && instantResult.characters.length > 0) {
      if (currentRequestIdRef.current !== thisRequestId) return;
      setData(instantResult);
      saveCachedBreakdown(cleanWord, instantResult);
      setIsLoading(false);
      instantResult.characters.forEach(c => prefetchHanziStroke(c.char));
    }

    // 4. Tải ngầm AI bổ trợ hoàn toàn bất đồng bộ
    if (!hasAllPrecomputed) {
      fetch("/api/decompose-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord })
      })
      .then(res => (res.ok ? res.json() : null))
      .then(result => {
        if (currentRequestIdRef.current !== thisRequestId) return;
        if (result && result.characters && result.characters.length > 0) {
          setData(result);
          saveCachedBreakdown(cleanWord, result);
        }
      })
      .catch(() => {});
    }
  };

  // Lấy các chữ Hán trong từ hiện tại
  const chineseCharsInCurrentWord = React.useMemo(() => {
    return Array.from(currentWord).filter(c => /[\u4e00-\u9fa5]/.test(c));
  }, [currentWord]);

  // Ký tự đang hiển thị: LUÔN LUÔN thuộc currentWord, tuyệt đối không lấy từ vựng cũ!
  const activeChar = chineseCharsInCurrentWord[selectedCharIndex] || chineseCharsInCurrentWord[0] || (currentWord ? currentWord[0] : "是");

  // Dữ liệu chỉ hợp lệ khi data thuộc đúng từ currentWord hiện tại
  const isDataMatching = Boolean(data && data.word === currentWord && data.characters && data.characters.length > 0);

  // activeCharData CHỈ ĐƯỢC PHÉP dùng khi đúng từ currentWord VÀ đúng chữ activeChar
  const activeCharData: CharacterDecomposition | null = React.useMemo(() => {
    if (!isDataMatching || !data?.characters) return null;
    return data.characters.find(c => c.char === activeChar) 
      || (data.characters[selectedCharIndex]?.char === activeChar ? data.characters[selectedCharIndex] : null) 
      || null;
  }, [isDataMatching, data, activeChar, selectedCharIndex]);

  // Trạng thái đang tải của chữ hiện tại
  const isCurrentCharLoading = isLoading || !isDataMatching || !activeCharData;

  // Initialize or re-render HanziWriter when activeChar changes
  useEffect(() => {
    if (!isOpen || !writerContainerRef.current || !activeChar) return;

    // Clear previous writer
    writerContainerRef.current.innerHTML = "";
    setIsAnimating(false);
    setIsQuizMode(false);
    setQuizScore(null);

    try {
      const writer = HanziWriter.create(writerContainerRef.current, activeChar, {
        width: 240,
        height: 240,
        padding: 18,
        showOutline: true,
        showCharacter: true,
        strokeAnimationSpeed: animationSpeed,
        delayBetweenStrokes: 120,
        // EXACT COLOR SCHEME AS IN USER'S IMAGE:
        // Radical strokes in RED (#dc2626), remaining component in NAVY BLUE (#1e3a8a)!
        radicalColor: '#dc2626',
        strokeColor: '#1e3a8a',
        outlineColor: '#94a3b8', // Nét mờ xám mềm mại, rõ nét chuẩn xác như ảnh mẫu
        drawingColor: '#2563eb',
        highlightColor: '#f59e0b',
        strokeHighlightSpeed: 1.6,
        showHintAfterMisses: 2,
        charDataLoader: (char, onComplete, onErr) => {
          // 0ms instant loading from RAM cache
          if (strokeDataMemoryCache.has(char)) {
            onComplete(strokeDataMemoryCache.get(char));
            return;
          }
          // 0ms instant loading from localStorage
          try {
            const cached = localStorage.getItem("hanzi_stroke_" + char);
            if (cached) {
              const parsed = JSON.parse(cached);
              strokeDataMemoryCache.set(char, parsed);
              onComplete(parsed);
              return;
            }
          } catch (_) {}

          // Use our cached server endpoint with fallback to CDN
          fetch(`/api/hanzi-data/${encodeURIComponent(char)}`)
            .then(res => {
              if (!res.ok) throw new Error("Server cache miss");
              return res.json();
            })
            .then(data => {
              strokeDataMemoryCache.set(char, data);
              try {
                localStorage.setItem("hanzi_stroke_" + char, JSON.stringify(data));
              } catch (_) {}
              onComplete(data);
            })
            .catch(() => {
              fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
                .then(r => r.json())
                .then(data => {
                  strokeDataMemoryCache.set(char, data);
                  try {
                    localStorage.setItem("hanzi_stroke_" + char, JSON.stringify(data));
                  } catch (_) {}
                  onComplete(data);
                })
                .catch(onErr);
            });
        }
      });

      writerRef.current = writer;

      // Nếu đang bật chế độ chỉ hiện nét mờ (như ảnh của user): ẩn nét màu, chỉ hiện nét mờ
      if (isOutlineOnly) {
        writer.hideCharacter();
        writer.showOutline();
        setIsAnimating(false);
      } else {
        // Animate once on load
        writer.showOutline();
        writer.animateCharacter({
          onComplete: () => setIsAnimating(false)
        });
        setIsAnimating(true);
      }
    } catch (e) {
      console.warn("HanziWriter initialization error:", e);
    }

    return () => {
      if (writerRef.current) {
        try {
          writerRef.current.cancelQuiz?.();
        } catch (_) {}
      }
    };
  }, [isOpen, activeChar, animationSpeed]);

  const [currentQuizStroke, setCurrentQuizStroke] = useState<number>(0);

  // Chỉ gợi ý đúng 1 nét hiện tại để người dùng nhớ lại, không vẽ lại nguyên từ
  const handleHintStroke = () => {
    if (!writerRef.current) return;
    const strokeIndex = currentQuizStroke;
    writerRef.current.highlightStroke(strokeIndex);
    setQuizScore(`💡 Gợi ý nét thứ ${strokeIndex + 1}! Nét vừa nháy sáng để bạn nhớ lại.`);
  };

  // Replay animation function (top-right circular button ↻)
  const handleReplay = () => {
    if (!writerRef.current) return;
    if (isQuizMode) {
      handleHintStroke();
      return;
    }
    setIsOutlineOnly(false);
    setIsQuizMode(false);
    setQuizScore(null);
    setIsAnimating(true);
    writerRef.current.showOutline();
    writerRef.current.animateCharacter({
      onComplete: () => setIsAnimating(false)
    });
  };

  // Bật/tắt chế độ chỉ hiện nét mờ (chuẩn như ảnh người dùng gửi)
  const handleToggleOutlineOnly = () => {
    if (!writerRef.current) return;
    if (isQuizMode) {
      writerRef.current.cancelQuiz();
      setIsQuizMode(false);
      setQuizScore(null);
    }
    if (!isOutlineOnly) {
      setIsOutlineOnly(true);
      setIsAnimating(false);
      writerRef.current.hideCharacter();
      writerRef.current.showOutline();
    } else {
      setIsOutlineOnly(false);
      writerRef.current.showOutline();
      writerRef.current.showCharacter();
    }
  };

  // Toggle quiz mode (tập viết)
  const handleToggleQuiz = () => {
    if (!writerRef.current) return;
    if (isQuizMode) {
      writerRef.current.cancelQuiz();
      setIsQuizMode(false);
      setQuizScore(null);
      if (isOutlineOnly) {
        writerRef.current.hideCharacter();
        writerRef.current.showOutline();
      } else {
        writerRef.current.showOutline();
        writerRef.current.showCharacter();
      }
    } else {
      setIsOutlineOnly(false);
      setIsQuizMode(true);
      setCurrentQuizStroke(0);
      setQuizScore("Hãy vẽ nét theo nét mờ mẫu trên ô...");
      // Đảm bảo nét mờ luôn hiện rõ trên ô kẻ khi tập viết để đồ theo
      writerRef.current.showOutline();
      writerRef.current.quiz({
        showHintAfterMisses: 2,
        highlightColor: '#f59e0b',
        strokeHighlightSpeed: 1.6,
        onMistake: (strokeData: any) => {
          setCurrentQuizStroke(strokeData.strokeNum);
          if (strokeData.mistakesOnStroke >= 2) {
            setQuizScore(`💡 Gợi ý: Nét thứ ${strokeData.strokeNum + 1} vừa nháy sáng trên ô!`);
          } else {
            setQuizScore(`Chưa đúng nét thứ ${strokeData.strokeNum + 1}! Hãy đồ theo nét mờ mẫu.`);
          }
        },
        onCorrectStroke: (strokeData: any) => {
          setCurrentQuizStroke(strokeData.strokeNum + 1);
          setQuizScore(`Đúng nét ${strokeData.strokeNum + 1}/${strokeData.totalStrokes}!`);
        },
        onComplete: (summary: any) => {
          if (summary.totalMistakes === 0) {
            setQuizScore("🎉 Xuất sắc! Bạn đã viết hoàn hảo không sai nét nào!");
          } else {
            setQuizScore(`Hoàn thành! Bạn mắc ${summary.totalMistakes} lỗi nhỏ.`);
          }
        }
      });
    }
  };

  const handleSpeak = (text: string) => {
    speakMandarin(text);
  };

  const [speakingComp, setSpeakingComp] = useState<string | null>(null);

  const handleSpeakComponent = (comp: { component: string; pinyin?: string; name: string }) => {
    const textToSpeak = comp.component;
    setSpeakingComp(comp.component);
    speakMandarin(textToSpeak);
    setTimeout(() => {
      setSpeakingComp((prev) => (prev === comp.component ? null : prev));
    }, 1200);
  };

  const handleSelectWord = (word: string) => {
    setCurrentWord(word);
    setSelectedCharIndex(0);
    loadDecomposition(word);
    speakMandarin(word);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      handleSelectWord(searchInput.trim());
      setSearchInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100020] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Chiết tự & Phân tích Bộ thủ
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                  Bộ thủ màu Đỏ
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân rã cấu tạo chữ Hán theo các bộ thủ & thành phần trực quan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập từ/chữ Hán..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-28 sm:w-44 px-3 py-1.5 pl-8 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition shrink-0"
              >
                Tra
              </button>
            </form>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Lesson Words Strip (Only show when not hidden and has highlighted words) */}
        {!hideLessonWords && filteredLessonWords.length > 0 && (
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Từ đã tô đen:
            </span>
            {filteredLessonWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectWord(word)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                  currentWord === word
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Word Overview & Character Tabs */}
          <div className="flex flex-col gap-3 p-4.5 rounded-2xl bg-gradient-to-r from-rose-50/90 via-orange-50/80 to-amber-50/90 dark:from-slate-850 dark:via-slate-800 dark:to-slate-850 border border-rose-100/80 dark:border-slate-700/80 shadow-xs">
            {/* Row 1: Word, Pinyin, Speaker button, Hán Việt, Meaning */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span 
                  className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-wide shrink-0"
                  style={{ fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif' }}
                >
                  {currentWord}
                </span>

                {data?.pinyin && (
                  <span className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-xl border border-rose-200/50 dark:border-rose-900/40 shadow-2xs whitespace-nowrap">
                    [{data.pinyin}]
                  </span>
                )}

                <button
                  onClick={() => handleSpeak(currentWord)}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 border border-blue-100 dark:border-slate-600 shadow-2xs hover:scale-105 active:scale-95 transition"
                  title="Phát âm toàn bộ từ"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowYouglish(true)}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-600 border border-purple-100 dark:border-slate-600 shadow-2xs hover:scale-105 active:scale-95 transition"
                  title="Xem video ngữ cảnh YouGlish"
                >
                  <Video className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setImageSearchKeyword("");
                    setShowGoogleImages(true);
                  }}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-600 border border-amber-200 dark:border-slate-600 shadow-2xs hover:scale-105 active:scale-95 transition"
                  title="Xem hình ảnh trực tiếp trong app (Google & Baidu)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {isDataMatching && data?.hanviet && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200/60 dark:border-rose-800/40 shadow-2xs">
                    Hán Việt: <span className="font-semibold">{data.hanviet}</span>
                  </span>
                )}
              </div>

              {/* Translation Meaning - Clickable to search images directly */}
              {isDataMatching && data?.translation && (
                <button
                  type="button"
                  onClick={() => {
                    setImageSearchKeyword(data.translation);
                    setShowGoogleImages(true);
                  }}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 hover:bg-amber-50 dark:bg-slate-800/80 dark:hover:bg-amber-950/30 px-3 py-1 rounded-xl border border-slate-200/60 hover:border-amber-300 dark:border-slate-700 dark:hover:border-amber-700/60 shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer group"
                  title={`Ấn vào nghĩa "${data.translation}" để tìm kiếm hình ảnh minh họa trong ứng dụng`}
                >
                  <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs">Nghĩa:</span>
                  <span className="font-bold text-slate-900 group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-300 transition">
                    {data.translation}
                  </span>
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100 transition shrink-0" />
                </button>
              )}
            </div>

            {/* Row 2: Character selector tabs when multi-character word */}
            {chineseCharsInCurrentWord.length > 1 && (
              <div className="pt-3 border-t border-rose-200/50 dark:border-slate-700/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  Chọn chữ phân tích bộ thủ:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {chineseCharsInCurrentWord.map((ch, idx) => {
                    const charData = isDataMatching ? data?.characters?.find(c => c.char === ch) : null;
                    const label = charData?.pinyin || charData?.hanviet;
                    const isSelected = selectedCharIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCharIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                          isSelected
                            ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300 dark:ring-rose-800"
                            : "bg-white/90 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-600 border border-rose-100 dark:border-slate-600"
                        }`}
                      >
                        <span 
                          className="text-sm font-extrabold"
                          style={{ fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif' }}
                        >
                          {ch}
                        </span>
                        {label && label !== "0" && (
                          <span className={`text-[11px] font-mono font-medium ${isSelected ? "text-rose-100" : "text-slate-500 dark:text-slate-400"}`}>
                            ({label})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Grid: Left (Mizi-ge Card) vs Right (Radical Breakdown Details) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: The Mizi-ge (米字格) Character Card matching user's image */}
            <div className="md:col-span-5 flex flex-col items-center">
              
              {/* Card Container exactly styled like the user's reference image */}
              <div className="relative w-[270px] h-[270px] bg-[#f8f9fa] dark:bg-slate-800/80 rounded-[36px] shadow-sm border border-slate-200 dark:border-slate-700/80 flex items-center justify-center p-3 select-none overflow-hidden group">
                
                {/* Rice-Grid (米字格) Guidelines: center vertical, center horizontal, and dashed diagonals */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Horizontal midline */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-300/60 dark:bg-slate-600/40 -translate-y-1/2" />
                  {/* Vertical midline */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300/60 dark:bg-slate-600/40 -translate-x-1/2" />
                  {/* Diagonal dashed line (top-left to bottom-right) */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(203, 213, 225, 0.45)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(203, 213, 225, 0.45)" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                </div>

                {/* Circular Replay Button ↻ at Top-Right matching the exact position in the image */}
                <button
                  onClick={handleReplay}
                  className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300/90 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-sm active:scale-90"
                  title={isQuizMode ? "Gợi ý 1 nét tiếp theo để nhớ lại" : "Xem lại hoạt họa viết từng nét"}
                >
                  <RotateCcw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                </button>

                {/* HanziWriter Canvas mount point */}
                <div 
                  ref={writerContainerRef} 
                  className={`relative z-0 flex items-center justify-center ${!isQuizMode ? "cursor-pointer" : "cursor-crosshair"}`}
                  onClick={!isQuizMode ? handleReplay : undefined}
                  title={!isQuizMode ? "Nhấn để xem lại hoạt họa nét vẽ" : undefined}
                />

                {/* Quiz feedback overlay */}
                {isQuizMode && quizScore && (
                  <div className="absolute bottom-2 left-2 right-2 text-center text-xs font-bold py-1 px-2 bg-white/95 dark:bg-slate-900/95 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800">
                    {quizScore}
                  </div>
                )}
              </div>

              {/* Color Legend below Mizi-ge Card */}
              <div className="flex items-center gap-4 mt-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#dc2626] shadow-sm inline-block" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Bộ thủ chính: <b className="text-rose-600">{activeCharData?.mainRadical || (isCurrentCharLoading ? "..." : "Đỏ")}</b>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#1e3a8a] shadow-sm inline-block" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Thành phần còn lại
                  </span>
                </div>
              </div>

              {/* Action Buttons below Mizi-ge Card */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {!isQuizMode ? (
                  <button
                    onClick={handleReplay}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    title="Xem hoạt họa viết cả chữ"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Phát nét
                  </button>
                ) : (
                  <button
                    onClick={handleHintStroke}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm active:scale-95"
                    title="Chỉ gợi ý 1 nét tiếp theo để nhớ lại, không vẽ lại nguyên từ"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Gợi ý 1 nét
                  </button>
                )}

                <button
                  onClick={handleToggleQuiz}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isQuizMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isQuizMode ? "Dừng viết" : "Tập viết"}
                </button>

                <button
                  onClick={handleToggleOutlineOnly}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                    isOutlineOnly
                      ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 shadow-sm ring-2 ring-slate-400/40"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                  }`}
                  title="Hiển thị nét mờ mẫu trên ô kẻ"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Nét mờ
                </button>

                <button
                  onClick={() => handleSpeak(activeChar)}
                  className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 transition"
                  title="Nghe phát âm chữ này"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tốc độ viết (0.5x, 1x, 1.5x) */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="text-slate-400 dark:text-slate-500">Tốc độ nét:</span>
                {[0.5, 1.0, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setAnimationSpeed(spd)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition active:scale-95 ${
                      animationSpeed === spd
                        ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Detailed Radical & Component Breakdown */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Character Attributes Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {!isCurrentCharLoading && activeCharData?.hanviet && (
                  <div className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                    Hán Việt: <span className="text-sm font-extrabold">{activeCharData.hanviet}</span>
                  </div>
                )}
                {!isCurrentCharLoading && activeCharData?.strokeCount ? (
                  <div className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    Tổng: <b>{activeCharData.strokeCount} nét</b>
                  </div>
                ) : null}
                {!isCurrentCharLoading && activeCharData?.structure && (
                  <div className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    Kết cấu: <b>{activeCharData.structure}</b>
                  </div>
                )}
              </div>

              {/* Components Breakdown Cards (Chia các bộ phận/bộ thủ) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Cấu tạo chia các bộ thủ & thành phần
                </h4>

                {isCurrentCharLoading ? (
                  <div className="p-8 rounded-2xl bg-[#f8f9fa] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center gap-2.5 text-slate-500 min-h-[140px]">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                    <span className="text-xs font-medium">Đang tải cấu tạo bộ thủ của chữ {activeChar}...</span>
                  </div>
                ) : activeCharData?.components && activeCharData.components.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {activeCharData.components.map((comp, cIdx) => {
                      const isMainRadical = comp.color === '#dc2626' || comp.component === activeCharData.mainRadical;
                      const isSpeakingThis = speakingComp === comp.component;
                      return (
                        <div
                          key={cIdx}
                          onClick={() => handleSpeakComponent(comp)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none group relative bg-[#f8f9fa] dark:bg-slate-800/80 active:scale-[0.99] ${
                            isMainRadical
                              ? "border-red-200/90 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 shadow-xs"
                              : "border-blue-200/90 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 shadow-xs"
                          } ${
                            isSpeakingThis
                              ? (isMainRadical
                                  ? "ring-2 ring-red-500 border-red-500 shadow-sm"
                                  : "ring-2 ring-blue-600 border-blue-600 shadow-sm")
                              : "hover:shadow-sm"
                          }`}
                          title={`Nhấn để nghe phát âm tiếng Trung: ${comp.component} (${comp.pinyin || ''})`}
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Radical Glyph Badge lớn, nổi bật */}
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-sm shrink-0 transition-transform group-hover:scale-105 ${
                                isMainRadical ? "bg-[#dc2626]" : "bg-[#1e3a8a]"
                              } ${isSpeakingThis ? "animate-pulse ring-2 ring-white" : ""}`}
                            >
                              {comp.component}
                            </div>

                            {/* Khối thông tin chi tiết rộng rãi */}
                            <div className="flex-1 min-w-0">
                              {/* Hàng 1: Tên bộ thủ + Huy hiệu phân loại + Nút loa */}
                              <div className="flex items-center justify-between gap-2">
                                <h5 className={`text-[15px] sm:text-base font-bold truncate ${isMainRadical ? "text-red-950 dark:text-red-100" : "text-blue-950 dark:text-blue-100"}`}>
                                  {comp.name}
                                </h5>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                                      isMainRadical
                                        ? "bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200"
                                        : "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200"
                                    }`}
                                  >
                                    {isMainRadical ? "Bộ thủ chính" : "Thành phần"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSpeakComponent(comp);
                                    }}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      isSpeakingThis
                                        ? (isMainRadical ? "bg-red-600 text-white shadow-sm animate-pulse" : "bg-blue-600 text-white shadow-sm animate-pulse")
                                        : (isMainRadical
                                            ? "bg-white dark:bg-slate-700 text-red-600 hover:bg-red-100 shadow-xs"
                                            : "bg-white dark:bg-slate-700 text-blue-600 hover:bg-blue-100 shadow-xs")
                                    }`}
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Hàng 2: Âm Hán Việt, Pinyin & số nét (ngay ngắn trên 1 dòng) */}
                              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {comp.hanviet && (
                                  <span>
                                    Âm Hán Việt: <b className="text-slate-800 dark:text-slate-200 font-semibold">{comp.hanviet}</b>
                                  </span>
                                )}
                                {comp.pinyin && (
                                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${isMainRadical ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400" : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"}`}>
                                    [{comp.pinyin}]
                                  </span>
                                )}
                                {comp.strokes ? (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                    • {comp.strokes} nét
                                  </span>
                                ) : null}
                              </div>

                              {/* Hàng 3: Ý nghĩa */}
                              {comp.meaning && (
                                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                                  {comp.meaning}
                                </p>
                              )}

                              {/* Hàng 4: Vai trò cấu tạo */}
                              {comp.role && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMainRadical ? "bg-red-500" : "bg-blue-500"}`} />
                                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Vai trò:</span>
                                  <span className="text-slate-800 dark:text-slate-200 font-medium">{comp.role}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-slate-800 text-xs text-slate-500 border border-slate-200 dark:border-slate-700">
                    Đang nạp chi tiết các bộ thủ cấu thành...
                  </div>
                )}
              </div>

            </div>

            {/* Câu chuyện dễ nhớ (Trải dài toàn bộ bề ngang qua bên phải, lấp đầy khoảng trống) */}
            <div className="md:col-span-12 w-full">
              {isCurrentCharLoading ? (
                <div className="p-4 rounded-2xl bg-[#f8f9fa] dark:bg-slate-800/80 border border-orange-200/90 dark:border-orange-900/50 flex flex-col items-center justify-center gap-2 text-slate-500 min-h-[90px]">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-xs font-medium">Đang tải câu chuyện chữ {activeChar}...</span>
                </div>
              ) : activeCharData ? (() => {
                const { story } = getBreakdownAndStory(activeCharData);
                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/30 border border-orange-200/90 dark:border-orange-900/60 shadow-xs">
                    <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-orange-200/60 dark:border-orange-900/40">
                      <div className="flex items-center gap-2 text-orange-950 dark:text-orange-200 font-bold text-sm">
                        <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-2xs">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <span>Câu chuyện dễ nhớ chữ {activeChar}</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 shrink-0">
                        Hình tượng sinh động
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13.5px] text-orange-950 dark:text-orange-100 leading-relaxed font-medium">
                      {story}
                    </p>
                  </div>
                );
              })() : null}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mẹo: Bạn có thể chọn bất kỳ từ vựng nào trong bài đọc để phân tích bộ thủ</span>
          </div>
        </div>
      </div>

      {/* YouGlish Video Modal */}
      <YouglishModal
        isOpen={showYouglish}
        onClose={() => setShowYouglish(false)}
        initialWord={currentWord}
        pinyin={data?.pinyin}
        translation={data?.translation}
      />

      {/* Google Images Modal */}
      <GoogleImagesModal
        isOpen={showGoogleImages}
        onClose={() => {
          setShowGoogleImages(false);
          setImageSearchKeyword("");
        }}
        initialWord={currentWord}
        pinyin={data?.pinyin}
        translation={data?.translation}
        initialQuery={imageSearchKeyword || currentWord}
      />
    </div>
  );
}
