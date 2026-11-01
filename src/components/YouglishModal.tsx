import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, ExternalLink, Video, Search, RefreshCw, Volume2, RotateCcw, RotateCw, SkipBack, SkipForward, Play, Pause, Repeat, Sparkles, Eye, Gauge } from "lucide-react";
import { speakMandarin } from "../utils/speech";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouglishResult {
  display: string;
  seg?: string;
  pinyin?: string;
  vid: string;
  start: number;
  end: number;
  speaker?: string;
  id?: string;
}

interface YouglishModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord: string;
  pinyin?: string;
  translation?: string;
}

export default function YouglishModal({
  isOpen,
  onClose,
  initialWord,
  pinyin,
  translation,
}: YouglishModalProps) {
  const [query, setQuery] = useState(initialWord);
  const [searchInput, setSearchInput] = useState(initialWord);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<YouglishResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [revealAsSpoken, setRevealAsSpoken] = useState(false); // Default to false: Sentence appears IMMEDIATELY
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  
  // Real-time playback synchronization from YouTube Player API
  const [currentTime, setCurrentTime] = useState<number>(0);
  const playerRef = useRef<any>(null);

  // Fetch YouGlish data when query or modal opens
  useEffect(() => {
    if (!isOpen) return;
    const cleanWord = (initialWord || "").trim();
    if (cleanWord) {
      setQuery(cleanWord);
      setSearchInput(cleanWord);
      fetchYouglishVideos(cleanWord);
    }
  }, [isOpen, initialWord]);

  const fetchYouglishVideos = async (searchWord: string) => {
    setIsLoading(true);
    setCurrentIndex(0);
    setIsPlaying(true);

    try {
      const resp = await fetch(`/api/youglish?query=${encodeURIComponent(searchWord)}`);
      if (!resp.ok) {
        throw new Error("Không thể tải video từ máy chủ.");
      }
      const data = await resp.json();
      if (data && data.results && data.results.length > 0) {
        setResults(data.results);
        setTotalResults(data.totalResults || data.results.length);
        const first = data.results[0];
        const initialStart = Math.max(0, Math.floor(Number(first.start) || 0));
        setCurrentTime(initialStart);
      } else {
        setResults([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.warn("[YouGlish fetch error]:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (clean && clean !== query) {
      setQuery(clean);
      fetchYouglishVideos(clean);
    }
  };

  const currentResult: YouglishResult | undefined = results[currentIndex];

  // Exact start time of the sentence containing the word (MUST be integer for YouTube API)
  const sentenceStartTime = useMemo(() => {
    if (!currentResult) return 0;
    return Math.max(0, Math.floor(Number(currentResult.start) || 0));
  }, [currentResult]);

  // Calculate realistic sentence duration so the sentence NEVER cuts off early
  const totalChars = useMemo(() => {
    if (!currentResult) return 10;
    return (currentResult.display || "").replace(/\s+/g, "").length || 10;
  }, [currentResult]);

  const realisticSentenceDuration = useMemo(() => {
    if (!currentResult) return 5.0;
    const rawDiff = currentResult.end > currentResult.start ? currentResult.end - currentResult.start : 2.0;
    return Math.max(
      rawDiff + 2.5,
      totalChars * 0.42 + 2.0,
      4.8
    );
  }, [currentResult, totalChars]);

  const sentenceEndTime = sentenceStartTime + realisticSentenceDuration;

  // Initialize or update YouTube Player directly at sentenceStartTime
  useEffect(() => {
    if (!isOpen || !currentResult || isLoading) return;

    const startSec = sentenceStartTime;

    // If player instance already exists and is active, switch video directly to startSec
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      try {
        playerRef.current.loadVideoById({
          videoId: currentResult.vid,
          startSeconds: startSec,
        });
        playerRef.current.seekTo(startSec, true);
        playerRef.current.playVideo();
        setCurrentTime(startSec);
        setIsPlaying(true);
        return;
      } catch (e) {
        // Fallback to recreation if loadVideoById throws
      }
    }

    let isDisposed = false;

    const createPlayer = () => {
      if (isDisposed) return;
      if (!window.YT || !window.YT.Player) {
        setTimeout(createPlayer, 100);
        return;
      }

      const container = document.getElementById("youglish-yt-player-slot");
      if (!container || isDisposed) return;

      container.innerHTML = '<div id="yt-player-target-element"></div>';

      try {
        const player = new window.YT.Player("yt-player-target-element", {
          width: "100%",
          height: "100%",
          videoId: currentResult.vid,
          playerVars: {
            start: startSec, // Starts strictly at the sentence containing the word!
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isDisposed) return;
              playerRef.current = event.target;
              // Explicitly seekTo startSec on ready to guarantee it never starts at 0:00!
              event.target.seekTo(startSec, true);
              event.target.playVideo();
              if (playbackRate !== 1 && typeof event.target.setPlaybackRate === "function") {
                event.target.setPlaybackRate(playbackRate);
              }
              setCurrentTime(startSec);
              setIsPlaying(true);
            },
            onStateChange: (event: any) => {
              if (isDisposed) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                // Fail-safe check: If video mistakenly started at 0:00, jump immediately to sentence start!
                try {
                  const liveTime = event.target.getCurrentTime();
                  if (startSec > 3 && liveTime < startSec - 4) {
                    event.target.seekTo(startSec, true);
                  }
                } catch (e) {}
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
              }
            },
          },
        });
        playerRef.current = player;
      } catch (err) {
        console.warn("[YT Player Init Error]", err);
      }
    };

    createPlayer();

    return () => {
      isDisposed = true;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [isOpen, currentResult?.vid, sentenceStartTime, currentIndex, isLoading]);

  // High-precision live polling of YouTube player currentTime (40ms = 25fps)
  useEffect(() => {
    if (!isOpen || !currentResult) return;

    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const liveTime = playerRef.current.getCurrentTime();
          if (typeof liveTime === "number" && !isNaN(liveTime) && liveTime > 0) {
            setCurrentTime(liveTime);

            // Handle auto-looping ONLY after the FULL sentence has been completely spoken!
            if (isLooping && sentenceEndTime > 0 && liveTime >= sentenceEndTime + 0.6) {
              handleReplay();
            }
          }
        } catch (err) {}
      }
    }, 40);

    return () => clearInterval(timer);
  }, [isOpen, currentResult, isLooping, sentenceEndTime]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      if (typeof playerRef.current.pauseVideo === "function") {
        playerRef.current.pauseVideo();
      }
      setIsPlaying(false);
    } else {
      if (typeof playerRef.current.playVideo === "function") {
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (!currentResult || !playerRef.current) return;
    if (typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(sentenceStartTime, true);
      playerRef.current.playVideo();
      setCurrentTime(sentenceStartTime);
      setIsPlaying(true);
    }
  };

  const handleRewind5s = () => {
    if (!currentResult || !playerRef.current) return;
    if (typeof playerRef.current.seekTo === "function") {
      // Keep rewind within 5s before sentence start, NEVER rewind all the way to 0:00!
      const minAllowed = Math.max(0, sentenceStartTime - 5);
      const newTime = Math.max(minAllowed, currentTime - 5);
      playerRef.current.seekTo(newTime, true);
      playerRef.current.playVideo();
      setCurrentTime(newTime);
      setIsPlaying(true);
    }
  };

  const handleForward5s = () => {
    if (!currentResult || !playerRef.current) return;
    if (typeof playerRef.current.seekTo === "function") {
      const newTime = currentTime + 5;
      playerRef.current.seekTo(newTime, true);
      playerRef.current.playVideo();
      setCurrentTime(newTime);
      setIsPlaying(true);
    }
  };

  const handleSetSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  // Jump to specific word in video on click
  const handleJumpToWord = (wordStartTime: number) => {
    if (!playerRef.current || typeof playerRef.current.seekTo !== "function") return;
    const targetTime = Math.max(sentenceStartTime, wordStartTime);
    playerRef.current.seekTo(targetTime, true);
    playerRef.current.playVideo();
    setCurrentTime(targetTime);
    setIsPlaying(true);
  };

  // Calculate synchronized word segments with timestamps across realistic sentence duration
  const segments = useMemo(() => {
    if (!currentResult) return [];

    let wordList: string[] = [];
    if (currentResult.seg && currentResult.seg.trim()) {
      wordList = currentResult.seg.trim().split(/\s+/).filter(Boolean);
    } else {
      wordList = Array.from(currentResult.display || "");
    }

    let pinyinList: string[] = [];
    if (currentResult.pinyin && currentResult.pinyin.trim()) {
      pinyinList = currentResult.pinyin.trim().split(/\s+/).filter(Boolean);
    }

    const start = sentenceStartTime;
    const totalWordChars = wordList.reduce((sum, w) => sum + w.length, 0) || 1;
    const duration = realisticSentenceDuration;

    let elapsedChars = 0;
    return wordList.map((word, idx) => {
      const wordChars = word.length;
      const wordStart = start + (elapsedChars / totalWordChars) * duration;
      elapsedChars += wordChars;
      const wordEnd = start + (elapsedChars / totalWordChars) * duration;

      const isTargetWord = query && (word.includes(query) || query.includes(word));
      const wordPinyin = pinyinList[idx] || "";

      return {
        word,
        pinyin: wordPinyin,
        index: idx,
        start: wordStart,
        end: wordEnd,
        isTargetWord,
      };
    });
  }, [currentResult, query, sentenceStartTime, realisticSentenceDuration]);

  if (!isOpen) return null;

  const externalUrl = `https://youglish.com/pronounce/${encodeURIComponent(query)}/chinese`;
  const progressRatio = Math.min(1, Math.max(0, (currentTime - sentenceStartTime) / Math.max(1, realisticSentenceDuration)));

  // Words that have been spoken up to current moment
  const spokenSegments = segments.filter((seg) => currentTime >= seg.start);
  const isSentenceCompleted = currentTime >= sentenceEndTime;

  return (
    <div 
      className="fixed inset-0 z-[100020] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching user reference */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-50/70 via-white to-orange-50/70 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  Video: <span className="text-red-600 dark:text-red-400 font-extrabold">{query}</span>
                </h3>
                {pinyin && (
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                    [{pinyin}]
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {results.length > 0
                  ? `Tìm thấy ${totalResults} video phát âm (Bắt đầu đúng câu có từ)`
                  : "Nguồn phát âm ngữ cảnh từ YouGlish.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => speakMandarin(query)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition cursor-pointer"
              title="Phát âm chuẩn"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition"
              title="Mở trên YouGlish.com"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick search input */}
        <form onSubmit={handleSearchSubmit} className="px-5 py-2 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nhập từ hoặc chữ Hán khác..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500/30 text-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            Tìm
          </button>
        </form>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/40 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-red-500 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Đang tìm video chứa từ "{query}"...
              </p>
              <p className="text-xs text-slate-400 mt-1">Đang trích xuất video và phụ đề đồng bộ từ YouGlish</p>
            </div>
          ) : results.length > 0 && currentResult ? (
            <div className="w-full flex flex-col items-center max-w-xl">
              {/* 1. YouTube Video Frame */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md bg-black border border-slate-200 dark:border-slate-800">
                <div id="youglish-yt-player-slot" className="w-full h-full" />
              </div>

              {/* 2. Control Bar underneath Video matching YouGlish design */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 py-3 w-full">
                {/* Previous Video */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                    currentIndex === 0
                      ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400"
                      : "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-[#0094d8] border-sky-200/80 dark:border-sky-800/80 shadow-2xs"
                  }`}
                  title="Video trước"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                {/* Rewind -5s (Keeps within sentence context) */}
                <button
                  onClick={handleRewind5s}
                  className="px-2.5 h-9 rounded-full flex items-center justify-center gap-0.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-[#0094d8] border border-sky-200/80 dark:border-sky-800/80 shadow-2xs text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Tua lùi 5 giây"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-5</span>
                </button>

                {/* Replay full sentence strictly from sentence start */}
                <button
                  onClick={handleReplay}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-[#0094d8] border border-sky-200/80 dark:border-sky-800/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Phát lại từ đầu câu này"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                  title={isPlaying ? "Tạm dừng" : "Tiếp tục phát"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Forward +5s */}
                <button
                  onClick={handleForward5s}
                  className="px-2.5 h-9 rounded-full flex items-center justify-center gap-0.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-[#0094d8] border border-sky-200/80 dark:border-sky-800/80 shadow-2xs text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Tua tới 5 giây"
                >
                  <span>+5</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Next Video */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= results.length - 1}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                    currentIndex >= results.length - 1
                      ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400"
                      : "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-[#0094d8] border-sky-200/80 dark:border-sky-800/80 shadow-2xs"
                  }`}
                  title="Video tiếp theo"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                {/* Auto Loop Toggle */}
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2.5 h-9 rounded-full flex items-center justify-center gap-1 border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                    isLooping
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                  title={isLooping ? "Đang bật lặp lại câu này" : "Bật lặp lại câu này"}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lặp</span>
                </button>

                {/* Speed Toggle (0.75x vs 1x) */}
                <button
                  onClick={() => handleSetSpeed(playbackRate === 1 ? 0.75 : 1)}
                  className={`px-2.5 h-9 rounded-full flex items-center justify-center gap-1 border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                    playbackRate === 0.75
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                  title="Thay đổi tốc độ phát (0.75x để nghe chậm rõ từng từ)"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{playbackRate === 1 ? "1.0x" : "0.75x"}</span>
                </button>
              </div>

              {/* 3. Subtitle Box: Full Sentence and Word Display */}
              <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl p-4 sm:p-6 text-center shadow-xs my-1 transition-all">
                {/* Mode toggle bar */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bắt đầu đúng câu có chứa từ cần nghe</span>
                  </div>
                  <button
                    onClick={() => setRevealAsSpoken(!revealAsSpoken)}
                    className="hover:text-sky-600 dark:hover:text-sky-400 underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{revealAsSpoken ? "Hiện toàn bộ ngay" : "Ẩn chữ chưa nói"}</span>
                  </button>
                </div>

                {/* Chinese sentence rendering synchronized with speaker voice */}
                <div 
                  className="text-2xl sm:text-3xl font-medium tracking-wide leading-relaxed min-h-[50px] flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5"
                  style={{ fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif' }}
                >
                  {segments.map((seg) => {
                    const isSpoken = currentTime >= seg.start || isSentenceCompleted;
                    const isCurrentlySpeaking = currentTime >= seg.start && currentTime <= seg.end;

                    // If "revealAsSpoken" is true and sentence not yet completed: do NOT show words that have not been spoken yet
                    if (revealAsSpoken && !isSpoken && !isSentenceCompleted) {
                      return null;
                    }

                    // Visual styles
                    let wordClass = "transition-all duration-100 inline-block px-1 py-0.5 rounded-sm select-none cursor-pointer ";

                    if (seg.isTargetWord) {
                      // Target searched word (e.g. 化妆室) always with prominent yellow background
                      if (isCurrentlySpeaking) {
                        wordClass += "bg-[#ffff00] text-black font-extrabold ring-4 ring-yellow-400 scale-105 shadow-md animate-in fade-in zoom-in-95";
                      } else {
                        wordClass += "bg-[#ffff00] text-black font-extrabold shadow-2xs";
                      }
                    } else {
                      // Normal spoken words
                      if (isCurrentlySpeaking) {
                        wordClass += "text-[#005fb8] dark:text-sky-200 font-extrabold scale-105 bg-sky-100/90 dark:bg-sky-950/90 shadow-2xs animate-in fade-in";
                      } else if (isSpoken) {
                        wordClass += "text-[#034b88] dark:text-sky-300 font-bold";
                      } else {
                        // Unspoken words: fully clear and readable immediately
                        wordClass += revealAsSpoken 
                          ? "text-slate-300 dark:text-slate-600 opacity-30" 
                          : "text-[#034b88] dark:text-sky-300 font-medium opacity-90";
                      }
                    }

                    return (
                      <span
                        key={seg.index}
                        onClick={() => handleJumpToWord(seg.start)}
                        className={wordClass}
                        title={`Bấm để tua đúng đoạn: "${seg.word}"`}
                      >
                        {seg.word}
                      </span>
                    );
                  })}
                </div>

                {/* Progress bar of current sentence */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 transition-all duration-75"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>

                {/* Synchronized Pinyin line */}
                {currentResult.pinyin && (
                  <div className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 mt-2.5 font-medium tracking-wide min-h-[20px] flex flex-wrap items-center justify-center gap-x-1.5">
                    {revealAsSpoken && !isSentenceCompleted
                      ? spokenSegments.map((seg) => (
                          <span 
                            key={`py-${seg.index}`}
                            className={seg.isTargetWord ? "font-bold text-amber-600 dark:text-amber-400" : ""}
                          >
                            {seg.pinyin}
                          </span>
                        ))
                      : currentResult.pinyin}
                  </div>
                )}
              </div>

              {/* 4. Footer info */}
              <div className="w-full flex items-center justify-between pt-1 px-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Video {currentIndex + 1} / {totalResults}
                </span>
                <span className="italic">
                  powered by{" "}
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-blue-600 underline"
                  >
                    YouGlish.com
                  </a>
                </span>
              </div>
            </div>
          ) : (
            /* Fallback when no direct video segments found */
            <div className="w-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Video className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Không tìm thấy video phát âm cho "{query}"
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                YouGlish chưa có đoạn cắt cụ thể cho cụm từ này, bạn có thể thử tìm từng chữ đơn hoặc mở trực tiếp trên YouGlish.
              </p>
              <div className="flex gap-2">
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở trên YouGlish.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
