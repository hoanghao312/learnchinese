import { getMicrophoneStream } from "../microphone";
import { pinyin } from 'pinyin-pro';
import React, { useState, useRef, useEffect } from "react";
import { Token, SavedWord } from "../types";
import { Sparkles, MessageCircleCode, Volume2, Repeat, Play, Pause, Mic, Square, Loader2, Languages, BookOpen, Layers, Heart, Check, X, Video, Image as ImageIcon } from "lucide-react";
import Markdown from 'react-markdown';
import { speakMandarin, cancelSpeech } from "../utils/speech";
import { getHskLevel } from "../utils/hskLookup";
import YouglishModal from "./YouglishModal";
import GoogleImagesModal from "./GoogleImagesModal";
import { GrammarAnalysisView } from "./GrammarAnalysisView";
import { getPartOfSpeechTextColor, getHskTextColor } from "../utils/wordTypeColors";

interface TextReaderProps {
  tokens: Token[];
  showPinyin: boolean;
  showHanzi?: boolean;
  showBackground: boolean;
  selectedToken: Token | null;
  onWordClick: (token: Token) => void;
  isLoading: boolean;
  speakingCharIndex?: number | null;
  savedWords?: SavedWord[];
  missingWords?: Token[];
  mispronouncedWords?: string[];
  onOpenRadicalBreakdown?: (word: string) => void;
  onToggleSave?: (token: Token) => void;
  onMarkKnown?: (token: Token) => void;
}

export default function TextReader({
  tokens,
  showPinyin,
  showHanzi = true,
  showBackground,
  selectedToken,
  onWordClick,
  isLoading,
  speakingCharIndex,
  savedWords = [],
  missingWords = [],
  mispronouncedWords = [],
  onOpenRadicalBreakdown,
  onToggleSave,
  onMarkKnown,
}: TextReaderProps) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Context Menu State for each vocabulary word ('info' on right-click, 'tools' on left-click)
  const [wordContextMenu, setWordContextMenu] = useState<{
    token: Token;
    x: number;
    top?: number;
    bottom?: number;
    mode: 'info' | 'tools';
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // YouGlish video modal state
  const [youglishWord, setYouglishWord] = useState<string | null>(null);
  const [youglishPinyin, setYouglishPinyin] = useState<string | undefined>(undefined);
  const [youglishTranslation, setYouglishTranslation] = useState<string | undefined>(undefined);

  // Google Images modal state
  const [googleImagesWord, setGoogleImagesWord] = useState<string | null>(null);
  const [googleImagesPinyin, setGoogleImagesPinyin] = useState<string | undefined>(undefined);
  const [googleImagesTranslation, setGoogleImagesTranslation] = useState<string | undefined>(undefined);

  // Context word recording state
  const [isContextRecording, setIsContextRecording] = useState(false);
  const [contextAudioUrl, setContextAudioUrl] = useState<string | null>(null);
  const [contextScore, setContextScore] = useState<number | null>(null);
  const [contextFeedback, setContextFeedback] = useState<string | null>(null);
  const [contextMispronounced, setContextMispronounced] = useState<string[]>([]);
  const [isContextEvaluating, setIsContextEvaluating] = useState(false);
  const [isContextPlaying, setIsContextPlaying] = useState(false);
  const contextAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const contextMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const contextAudioChunksRef = useRef<Blob[]>([]);

  const [isSelectionSpeaking, setIsSelectionSpeaking] = useState(false);
  const [isSelectionLooping, setIsSelectionLoopingState] = useState(false);
  const [activeSpeakingTokenIndex, setActiveSpeakingTokenIndex] = useState<number | null>(null);
  const [selectionSpeakingCharIndex, setSelectionSpeakingCharIndex] = useState<number | null>(null);

  const isSelectionSpeakingRef = useRef(false);
  const isSelectionLoopingRef = useRef(false);

  const [isSelectionRecording, setIsSelectionRecording] = useState(false);
  const [selectionScore, setSelectionScore] = useState<number | null>(null);
  const [selectionFeedback, setSelectionFeedback] = useState<string | null>(null);
  const [selectionMispronounced, setSelectionMispronounced] = useState<string[]>([]);
  const [isSelectionEvaluating, setIsSelectionEvaluating] = useState(false);
  const [selectionTranslation, setSelectionTranslation] = useState<string | null>(null);
  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false);
  const [selectionGrammar, setSelectionGrammar] = useState<string | null>(null);
  const [isAnalyzingGrammar, setIsAnalyzingGrammar] = useState(false);
  const recordAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingRecord, setIsPlayingRecord] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (recordedAudioUrl) {
      if (recordAudioRef.current) {
        recordAudioRef.current.pause();
      }
      try {
        const audio = new Audio(recordedAudioUrl);
        audio.onended = () => setIsPlayingRecord(false);
        audio.onerror = () => setIsPlayingRecord(false);
        recordAudioRef.current = audio;
      } catch (err) {
        console.error("Audio init error:", err);
      }
    }
    return () => {
      if (recordAudioRef.current) {
        recordAudioRef.current.pause();
      }
    };
  }, [recordedAudioUrl]);

  const togglePlayRecord = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (recordAudioRef.current) {
      if (isPlayingRecord) {
        recordAudioRef.current.pause();
        recordAudioRef.current.currentTime = 0;
        setIsPlayingRecord(false);
      } else {
        recordAudioRef.current.play().catch(console.error);
        setIsPlayingRecord(true);
      }
    }
  };
  const selectionMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const selectionAudioChunksRef = useRef<Blob[]>([]);

  const handleToggleRecordSelection = async () => {
    if (isSelectionRecording) {
      selectionMediaRecorderRef.current?.stop();
      setIsSelectionRecording(false);
    } else {
      try {
        const stream = await getMicrophoneStream();
        const mediaRecorder = new MediaRecorder(stream);
        selectionMediaRecorderRef.current = mediaRecorder;
        selectionAudioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            selectionAudioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(selectionAudioChunksRef.current, { type: mediaRecorder.mimeType });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              setIsSelectionEvaluating(true);
              setSelectionScore(null);
              setSelectionFeedback(null);
              setSelectionMispronounced([]);
              try {
                const res = await fetch("/api/evaluate-pronunciation", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audioBase64: base64data,
                    mimeType: mediaRecorder.mimeType,
                    text: selectedText
                  })
                });
                const data = await res.json();
                if (data.score !== undefined) {
                  setSelectionScore(data.score);
                  setSelectionFeedback(data.feedback);
                  setSelectionMispronounced(data.mispronounced || []);
                }
              } catch (error) {
                console.warn("Evaluation warning:", error);
              } finally {
                setIsSelectionEvaluating(false);
              }
            }
          };
        };

        mediaRecorder.start();
        setIsSelectionRecording(true);
        setSelectionScore(null);
        setSelectionFeedback(null);
        setSelectionMispronounced([]);
      } catch (err) {
        console.warn("Lỗi microphone:", err);
        alert("Không thể truy cập microphone. Vui lòng cấp quyền.");
      }
    }
  };


  const setIsSelectionLooping = (val: boolean) => {
    setIsSelectionLoopingState(val);
    isSelectionLoopingRef.current = val;
  };

  const handleAnalyzeGrammar = async () => {
    if (!selectedText) return;
    setIsAnalyzingGrammar(true);
    setSelectionGrammar("");
    setSelectionTranslation(null); // Clear translation when analyzing grammar
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setSelectionGrammar((prev) => (prev || "") + chunk);
        }
      }
    } catch (err) {
      console.warn("Lỗi khi phân tích:", err);
      setSelectionGrammar("Lỗi khi phân tích đoạn này.");
    } finally {
      setIsAnalyzingGrammar(false);
    }
  };

  const handleTranslateSelection = async () => {
    if (!selectedText) return;
    setIsTranslatingSelection(true);
    setSelectionTranslation("");
    setSelectionGrammar(null); // Clear grammar when translating
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setSelectionTranslation((prev) => (prev || "") + chunk);
        }
      }
    } catch (err) {
      console.warn("Lỗi khi dịch:", err);
      setSelectionTranslation("Lỗi khi dịch đoạn này.");
    } finally {
      setIsTranslatingSelection(false);
    }
  };

  const handlePlaySelection = async () => {
    if (isSelectionSpeakingRef.current) {
       cancelSpeech();
       isSelectionSpeakingRef.current = false;
       setIsSelectionSpeaking(false);
       setSelectionSpeakingCharIndex(null);
       return;
    }
    
    cancelSpeech();
    isSelectionSpeakingRef.current = true;
    setIsSelectionSpeaking(true);

    const fullText = tokens.map(t => t.text).join('');
    const baseOffset = selectedText ? fullText.indexOf(selectedText) : -1;
    
    while (isSelectionSpeakingRef.current) {
        await speakMandarin(selectedText, 1.0, (charIdx) => {
          if (baseOffset !== -1) {
            setSelectionSpeakingCharIndex(baseOffset + charIdx);
          }
        });
        setSelectionSpeakingCharIndex(null);
        if (!isSelectionLoopingRef.current || !isSelectionSpeakingRef.current) {
             break;
        }
        await new Promise(r => setTimeout(r, 600));
    }
    
    isSelectionSpeakingRef.current = false;
    setIsSelectionSpeaking(false);
    setSelectionSpeakingCharIndex(null);
  };

  useEffect(() => {
     if (!selectedText) {
         if (isSelectionSpeakingRef.current) {
            cancelSpeech();
            isSelectionSpeakingRef.current = false;
            setIsSelectionSpeaking(false);
            setSelectionSpeakingCharIndex(null);
         }
     }
  }, [selectedText]);

  const handleSelectionChange = () => {
    // Add a slight delay to allow mobile selection to settle
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim() !== "") {
        // Ensure the selection is within our container
        if (containerRef.current && !containerRef.current.contains(selection.anchorNode)) {
          return;
        }
        
        // Ignore selection inside the floating button itself
        const anchorEl = selection.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : (selection.anchorNode as Element);
        if (anchorEl?.closest('#floating-audio-btn')) {
          return;
        }
        
        const text = selection.toString().replace(/\s+/g, '');
        if (text === "") return;
        
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
  
          if (containerRect && rect.width > 0) {
            const rawLeft = rect.left - containerRect.left + rect.width / 2;
            const halfMenuWidth = Math.min(155, (containerRect.width || 320) / 2 - 8);
            const clampedLeft = Math.max(
              halfMenuWidth,
              Math.min((containerRect.width || 320) - halfMenuWidth, rawLeft)
            );
            setSelectionRect({
              top: Math.max(4, rect.top - containerRect.top - 55),
              left: clampedLeft,
            });
            setSelectedText(text);
            
            // Only reset if text actually changed to avoid losing state on slight drag
            setSelectionScore(prev => prev); 
          }
        } catch(e) {}
      }
    }, 100);
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
      setSelectedText("");
      setSelectionRect(null);
      setSelectionScore(null);
      setSelectionFeedback(null);
      setSelectionMispronounced([]);
      setSelectionTranslation(null);
      setSelectionGrammar(null);
    }
  };

  useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      // Clear selection if clicking outside the container and outside the floating button
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("#floating-audio-btn")
      ) {
        setSelectedText("");
        setSelectionRect(null);
      }
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const handleWordContextMenu = (e: React.MouseEvent | { currentTarget: HTMLElement | null; clientX: number; clientY: number; preventDefault?: () => void; stopPropagation?: () => void }, token: Token, mode: 'info' | 'tools' = 'info', tokenIdx?: number) => {
    e.preventDefault?.();
    e.stopPropagation?.();

    // Tự động phát âm và phóng to nhẹ từ vựng khi nhấp vào
    if (token.type === "word" || /[\u4e00-\u9fa5]/.test(token.text)) {
      if (tokenIdx !== undefined) {
        setActiveSpeakingTokenIndex(tokenIdx);
      }
      speakMandarin(token.text).finally(() => {
        setActiveSpeakingTokenIndex(prev => (prev === tokenIdx ? null : prev));
      });
    }

    // Reset recording and evaluation on new menu open
    if (isContextRecording) {
      contextMediaRecorderRef.current?.stop();
      setIsContextRecording(false);
    }
    setContextScore(null);
    setContextFeedback(null);
    setContextAudioUrl(null);
    setContextMispronounced([]);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 12;
    const menuWidth = mode === 'tools' ? Math.min(320, vw - padding * 2) : Math.min(260, vw - padding * 2);

    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.();
    const centerX = rect ? (rect.left + rect.width / 2) : e.clientX;
    let x = centerX - menuWidth / 2;
    if (x + menuWidth > vw - padding) {
      x = vw - menuWidth - padding;
    }
    if (x < padding) x = padding;

    const anchorTop = rect ? rect.top : e.clientY;
    const anchorBottom = rect ? rect.bottom : e.clientY;

    // Check if there is enough space above the word (accounting for sticky header 52px)
    const requiredSpaceAbove = mode === 'tools' ? 80 : 195;
    const bottomSafeInset = vw < 640 ? 76 : 16;
    const spaceBelow = vh - anchorBottom - bottomSafeInset;
    const canFitAbove = anchorTop >= requiredSpaceAbove || (anchorTop > spaceBelow && anchorTop >= 120);

    let top: number | undefined;
    let bottom: number | undefined;

    if (canFitAbove) {
      bottom = Math.max(bottomSafeInset, vh - anchorTop + 8);
    } else {
      top = Math.min(vh - bottomSafeInset - 140, anchorBottom + 8);
    }

    setWordContextMenu({
      token,
      x,
      top,
      bottom,
      mode,
    });
  };

  const handleToggleRecordContextWord = async (textToPractice: string) => {
    if (isContextRecording) {
      contextMediaRecorderRef.current?.stop();
      setIsContextRecording(false);
    } else {
      try {
        const stream = await getMicrophoneStream();
        const mediaRecorder = new MediaRecorder(stream);
        contextMediaRecorderRef.current = mediaRecorder;
        contextAudioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            contextAudioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(contextAudioChunksRef.current, { type: mediaRecorder.mimeType });
          const url = URL.createObjectURL(audioBlob);
          setContextAudioUrl(url);

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              setIsContextEvaluating(true);
              setContextScore(null);
              setContextFeedback(null);
              setContextMispronounced([]);
              try {
                const res = await fetch("/api/evaluate-pronunciation", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audioBase64: base64data,
                    mimeType: mediaRecorder.mimeType,
                    text: textToPractice
                  })
                });
                const data = await res.json();
                if (data.score !== undefined) {
                  setContextScore(data.score);
                  setContextFeedback(data.feedback);
                  setContextMispronounced(data.mispronounced || []);
                }
              } catch (error) {
                console.warn("Evaluation warning:", error);
              } finally {
                setIsContextEvaluating(false);
              }
            }
          };
        };

        mediaRecorder.start();
        setIsContextRecording(true);
        setContextScore(null);
        setContextFeedback(null);
        setContextAudioUrl(null);
        setContextMispronounced([]);
      } catch (err) {
        console.warn("Lỗi microphone:", err);
        alert("Không thể truy cập microphone. Vui lòng cấp quyền.");
      }
    }
  };

  const handleTogglePlayContextAudio = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (contextAudioPlayerRef.current) {
      if (isContextPlaying) {
        contextAudioPlayerRef.current.pause();
        contextAudioPlayerRef.current.currentTime = 0;
        setIsContextPlaying(false);
      } else {
        contextAudioPlayerRef.current.play().catch(console.error);
        setIsContextPlaying(true);
      }
    }
  };

  useEffect(() => {
    if (contextAudioUrl) {
      if (contextAudioPlayerRef.current) {
        contextAudioPlayerRef.current.pause();
      }
      try {
        const audio = new Audio(contextAudioUrl);
        audio.onended = () => setIsContextPlaying(false);
        audio.onerror = () => setIsContextPlaying(false);
        contextAudioPlayerRef.current = audio;
      } catch (err) {
        console.error("Context audio init error:", err);
      }
    }
    return () => {
      if (contextAudioPlayerRef.current) {
        contextAudioPlayerRef.current.pause();
      }
    };
  }, [contextAudioUrl]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setWordContextMenu(null);
        if (isContextRecording) {
          contextMediaRecorderRef.current?.stop();
          setIsContextRecording(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWordContextMenu(null);
        if (isContextRecording) {
          contextMediaRecorderRef.current?.stop();
          setIsContextRecording(false);
        }
      }
    };

    const handleScrollOrWheel = (e: Event) => {
      if (contextMenuRef.current && contextMenuRef.current.contains(e.target as Node)) {
        return;
      }
      setWordContextMenu(null);
      if (isContextRecording) {
        contextMediaRecorderRef.current?.stop();
        setIsContextRecording(false);
      }
    };

    if (wordContextMenu) {
      document.addEventListener("mousedown", handleDocumentClick);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", handleScrollOrWheel, true);
      window.addEventListener("wheel", handleScrollOrWheel, { passive: true });
      window.addEventListener("touchmove", handleScrollOrWheel, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrWheel, true);
      window.removeEventListener("wheel", handleScrollOrWheel);
      window.removeEventListener("touchmove", handleScrollOrWheel);
    };
  }, [wordContextMenu, isContextRecording]);

  // Tự động căn chỉnh lại vị trí bảng tra từ sau khi render để không bao giờ tràn mép màn hình điện thoại
  useEffect(() => {
    if (!wordContextMenu || !contextMenuRef.current) return;
    const el = contextMenuRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;
    const bottomSafe = vw < 640 ? 74 : 12;

    if (rect.right > vw - pad) {
      el.style.left = `${Math.max(pad, vw - rect.width - pad)}px`;
    } else if (rect.left < pad) {
      el.style.left = `${pad}px`;
    }

    if (rect.bottom > vh - bottomSafe) {
      if (wordContextMenu.top !== undefined) {
        el.style.top = `${Math.max(56, vh - bottomSafe - rect.height)}px`;
      }
    }
    if (rect.top < 54) {
      if (wordContextMenu.bottom !== undefined) {
        el.style.bottom = 'auto';
        el.style.top = '56px';
      }
    }
  }, [wordContextMenu]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 space-y-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-amber-500 animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            AI đang phân tích & từ điển hóa...
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Gemini đang phân chia từ vựng, gán phiên âm Pinyin và tìm nghĩa tiếng Việt ngữ cảnh hữu ích nhất cho bạn.
          </p>
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30">
        <MessageCircleCode className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Chưa có bài văn nào được nạp
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
          Nhập đoạn văn của riêng bạn ở ô bên trái hoặc nhấp chọn một bài khoá có sẵn để trải nghiệm học tập đỉnh cao!
        </p>
      </div>
    );
  }

  // Pre-compute token start char indices
  let currentStart = 0;
  const tokenIndices = tokens.map(t => {
    const start = currentStart;
    currentStart += t.text.length;
    return start;
  });

  const effectiveSpeakingCharIndex = (speakingCharIndex !== undefined && speakingCharIndex !== null)
    ? speakingCharIndex
    : selectionSpeakingCharIndex;

  let highlightedTokenIndex = -1;
  if (effectiveSpeakingCharIndex !== undefined && effectiveSpeakingCharIndex !== null) {
    highlightedTokenIndex = tokenIndices.findIndex((start, i) => {
      const nextStart = i < tokenIndices.length - 1 ? tokenIndices[i + 1] : currentStart;
      return effectiveSpeakingCharIndex >= start && effectiveSpeakingCharIndex < nextStart;
    });
  }

  return (
    <div 
      className="relative p-4 sm:p-6 md:p-10 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm min-h-[300px]"
      ref={containerRef}
      onMouseUp={handleMouseUp}
    >
      {/* Floating Audio Button for Selection */}
      {selectedText && selectionRect && (
        <div
          id="floating-audio-btn"
          className="absolute z-50 transform -translate-x-1/2 flex flex-col bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden max-w-[calc(100vw-24px)] animate-in fade-in zoom-in duration-200"
          style={{ top: selectionRect.top, left: selectionRect.left }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div className="flex items-center w-full border-b border-slate-50 bg-white">
              <button
                onClick={handlePlaySelection}
                className={`flex-1 p-3 flex items-center justify-center gap-1.5 transition-colors min-w-[48px] min-h-[48px] ${
                  isSelectionSpeaking ? 'bg-sky-50 text-sky-600' : 'hover:bg-sky-50/50 text-sky-500 hover:text-sky-600'
                }`}
                title={isSelectionSpeaking ? "Dừng đọc" : "Nghe đoạn đã chọn"}
              >
                {isSelectionSpeaking ? <Pause className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleToggleRecordSelection}
                className={`flex-1 p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] ${
                  isSelectionRecording ? 'bg-rose-50 text-rose-600' : 'hover:bg-rose-50/50 text-rose-500 hover:text-rose-600'
                }`}
                title={isSelectionRecording ? "Dừng ghi âm" : "Luyện đọc đoạn này"}
              >
                {isSelectionRecording ? <Square className="w-4 h-4 fill-current animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsSelectionLooping(!isSelectionLooping)}
                className={`flex-1 p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] ${
                  isSelectionLooping ? 'bg-violet-50 text-violet-600' : 'hover:bg-violet-50/50 text-violet-500 hover:text-violet-600'
                }`}
                title={isSelectionLooping ? "Tắt lặp vòng" : "Bật lặp vòng đoạn đã chọn"}
              >
                <Repeat className={`w-4 h-4 ${isSelectionLooping ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={handleTranslateSelection}
                disabled={isTranslatingSelection}
                className="flex-1 p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-amber-50/50 text-amber-500 hover:text-amber-600 disabled:opacity-50"
                title="Dịch đoạn đã chọn"
              >
                {isTranslatingSelection ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Languages className="w-4 h-4" />}
              </button>
              <button
                onClick={handleAnalyzeGrammar}
                disabled={isAnalyzingGrammar}
                className="flex-1 p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-emerald-50/50 text-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                title="Phân tích ngữ pháp"
              >
                {isAnalyzingGrammar ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <BookOpen className="w-4 h-4" />}
              </button>
              {onOpenRadicalBreakdown && /[\u4e00-\u9fa5]/.test(selectedText) && (
                <button
                  onClick={() => {
                    onOpenRadicalBreakdown(selectedText.trim());
                  }}
                  className="flex-1 p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-rose-50/50 text-rose-500 hover:text-rose-600"
                  title="Xem chia các bộ thủ (Chiết tự)"
                  id="btn-selection-radical-breakdown"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}
          </div>
          
          {selectionGrammar && (
            <div className="flex flex-col items-start gap-2 py-3 px-3.5 border-t border-slate-100 bg-white dark:bg-slate-900 w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] max-w-sm max-h-[350px] overflow-y-auto">
              <GrammarAnalysisView content={selectionGrammar} className="w-full" />
            </div>
          )}
          
          {selectionTranslation && (
            <div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full max-w-sm max-h-[250px] overflow-y-auto">
              <div className="flex flex-wrap gap-x-[1px] gap-y-1" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                {(() => {
                  const pinyinArr = pinyin(selectedText, { type: 'array' });
                  return selectedText.split('').map((char, i) => {
                    const isPunctuation = /[.,!?;:\s\n\r\t，。！？、：；（）《》“”‘’]/.test(char);
                    return (
                      <div key={i} className="flex flex-col items-center justify-end">
                        {showPinyin && !isPunctuation && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold leading-none mb-[2px] select-none">{pinyinArr[i]}</span>}
                        <span className="text-[15px] font-bold text-emerald-700 dark:text-emerald-400 leading-none">{char}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words whitespace-pre-wrap">{selectionTranslation}</p>
            </div>
          )}
          
          {/* Pronunciation Feedback within Selection */}
          {isSelectionEvaluating && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium py-2 px-3 border-t border-slate-100 bg-slate-50">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              Đang chấm điểm...
            </div>
          )}
          {selectionScore !== null && (            <div className="bg-white border-t border-slate-100 w-full max-w-[280px] shadow-sm">              <div className="p-3 border-b border-slate-50 bg-slate-50/80 flex flex-col items-center justify-center">                                <div className="flex items-center gap-3 relative">
                  <div className={`px-4 py-1.5 rounded-full text-lg font-bold ${selectionScore >= 80 ? 'bg-emerald-100 text-emerald-700' : selectionScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {Math.round(selectionScore)}<span className="text-sm font-semibold opacity-60">/100</span>
                  </div>
                  {recordedAudioUrl && (
                    <button 
                      onClick={togglePlayRecord}
                      onMouseUp={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100"
                      title="Nghe lại bản ghi âm"
                    >
                      {isPlayingRecord ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                </div>                {selectionFeedback && (                  <p className="text-[13px] text-slate-600 mt-2 text-center font-medium leading-relaxed px-1">                    {selectionFeedback}                  </p>                )}              </div>              <div className="p-3 bg-white">                {selectedText && (                  <div className="flex flex-wrap justify-center gap-x-2 gap-y-2">                    {(() => {                      const pinyinArr = pinyin(selectedText, { type: 'array' });                      return selectedText.split('').map((char, i) => {                        const isPunctuation = /[.,!?;:\s\n\r\t，。！？、：；（）《》“”‘’]/.test(char);                        const isMispronounced = selectionMispronounced.some((w) => w.includes(char) || char.includes(w));                        return (                          <div key={i} className="flex flex-col items-center">                            {!isPunctuation && <span className="text-[13px] text-[#0066FF] dark:text-[#3b82f6] mb-0.5 font-medium select-none">{pinyinArr[i]}</span>}                            <span className={`text-lg ${isPunctuation ? 'text-slate-300' : isMispronounced ? 'text-red-500 font-bold' : 'text-emerald-500 font-medium'}`}>{char}</span>                          </div>                        );                      });                    })()}                  </div>                )}              </div>            </div>          )}
        </div>
      )}

      {/* Dynamic wrapping flow structure with perfectly balanced layout gap and no text row overlapping */}
      <div className="block text-justify leading-[2.5] sm:leading-[3] md:leading-[3.5]">
        {tokens.map((token, index) => {
          if (token.type === "whitespace") {
            if (token.text.includes("\n")) {
              return (
                <br key={`br-${index}`} />
              );
            }
            return <span key={`space-${index}`}>&nbsp;</span>;
          }

          if (token.type === "punctuation") {
            const isNewlinePunc = token.text === "\n";
            if (isNewlinePunc) {
              return <br key={`punc-br-${index}`} />;
            }
            return (
              <span
                key={`punc-${index}`}
                className="inline-flex flex-col items-center justify-end align-bottom select-text transition-all duration-200"
              >
                {/* Empty spacer to match pinyin height ensuring vertical alignment with Chinese characters */}
                <span className={`select-none h-4 md:h-5 ${showPinyin ? "max-h-5 mb-0.5" : "max-h-0 mb-0 opacity-0 overflow-hidden"}`}></span>
                <span
                  className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-bold text-slate-800 dark:text-slate-200 leading-none"
                  style={{ fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif' }}
                >
                  {token.text}
                </span>
              </span>
            );
          }

          const isCompound = token.text.length > 1;
          const isSelected = selectedToken?.text === token.text || wordContextMenu?.token.text === token.text;
          const isMispronounced = token.type === 'word' && mispronouncedWords.some(w => token.text.includes(w) || w.includes(token.text));
          const isKaraokeHighlighted = index === highlightedTokenIndex || index === activeSpeakingTokenIndex;
          const isSavedWord = savedWords.some(w => w.text === token.text && !w.isKnown);
          const isMissingWord = missingWords.some(w => w.text === token.text);

          // Build premium visual styling mapping
          let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end cursor-pointer transition-all duration-150 ease-out select-text whitespace-nowrap align-bottom px-1 py-0.5 rounded-lg border border-transparent hover:border-blue-200 hover:bg-blue-50/70 hover:shadow-xs dark:hover:border-blue-800/60 dark:hover:bg-blue-950/40 `;
          if (isMispronounced) buttonClasses += " ring-2 ring-red-400 bg-red-50/50 rounded-md ";
          
          if (isKaraokeHighlighted) {
             buttonClasses += " bg-emerald-100/85 border-emerald-400 shadow-sm scale-[1.18] -translate-y-0.5 z-20 origin-bottom ";
          } else if (isSelected) {
             buttonClasses += " bg-blue-100/70 border-blue-300 shadow-xs scale-[1.05] ";
          }

          return (
            <button
              key={`word-${index}`}
              onTouchStart={(e) => {
                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                longPressTriggeredRef.current = false;
                const targetEl = e.currentTarget;
                const touch = e.touches[0];
                const clientX = touch ? touch.clientX : 0;
                const clientY = touch ? touch.clientY : 0;
                longPressTimerRef.current = setTimeout(() => {
                  if (token.type === "word" || /[\u4e00-\u9fa5]/.test(token.text)) {
                    longPressTriggeredRef.current = true;
                    handleWordContextMenu({ currentTarget: targetEl, clientX, clientY }, token, 'tools', index);
                  }
                }, 450);
              }}
              onTouchEnd={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onTouchMove={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onClick={(e) => {
                if (longPressTriggeredRef.current) {
                  longPressTriggeredRef.current = false;
                  return;
                }
                const selection = window.getSelection();
                if (!selection || selection.toString().trim() === "") {
                  if (token.type === "word" || /[\u4e00-\u9fa5]/.test(token.text)) {
                    if (wordContextMenu?.token.text === token.text && wordContextMenu.mode === 'info') {
                      setWordContextMenu(null);
                      setActiveSpeakingTokenIndex(index);
                      speakMandarin(token.text).finally(() => {
                        setActiveSpeakingTokenIndex(prev => (prev === index ? null : prev));
                      });
                    } else {
                      handleWordContextMenu(e, token, 'info', index);
                    }
                  }
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (token.type === "word" || /[\u4e00-\u9fa5]/.test(token.text)) {
                  if (wordContextMenu?.token.text === token.text && wordContextMenu.mode === 'tools') {
                    setWordContextMenu(null);
                  } else {
                    handleWordContextMenu(e, token, 'tools', index);
                  }
                }
              }}
              className={buttonClasses}
              id={`interactive-word-${token.text}`}
            >
              {/* Chữ Hán và Pinyin cùng cột với nhau, Pinyin ở trên đầu tương ứng với mỗi chữ Hán */}
              {(() => {
                const chars = Array.from(token.text);
                let pinyinParts: string[] = [];
                if (token.pinyin) {
                  pinyinParts = token.pinyin.trim().split(/\s+/);
                }
                if (pinyinParts.length !== chars.length && token.text) {
                  try {
                    pinyinParts = pinyin(token.text, { type: 'array' });
                  } catch {
                    pinyinParts = chars.map((_, idx) => idx === 0 ? (token.pinyin || '') : '');
                  }
                }

                return (
                  <div className="flex items-end justify-center">
                    {chars.map((char, charIdx) => {
                      const charPy = pinyinParts[charIdx] || '';
                      return (
                        <div key={charIdx} className="flex flex-col items-center justify-end">
                          {/* Pinyin ở trên đầu */}
                          <span
                            className={`select-none h-4 md:h-5 flex items-center justify-center text-[9px] sm:text-[11px] md:text-[13px] font-mono font-medium tracking-wide transition-all duration-300 group-hover:text-[#32CD32] group-hover:[text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] px-0.5 ${
                              isSelected || isKaraokeHighlighted 
                                ? "text-[#32CD32] [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] font-bold" 
                                : isSavedWord
                                  ? "text-orange-500 dark:text-orange-400 font-semibold"
                                  : isCompound
                                    ? "text-slate-900 dark:text-slate-50"
                                    : "text-slate-800 dark:text-slate-250"
                            } ${
                              showPinyin ? "opacity-100 scale-100 max-h-5 mb-0.5" : "opacity-0 scale-75 max-h-0 mb-0 overflow-hidden"
                            }`}
                            style={{ transformOrigin: "bottom center" }}
                          >
                            {charPy}
                          </span>

                          {/* Chữ Hán tương ứng ở dưới (cùng cột) */}
                          <span 
                            className={`font-bold tracking-tighter sm:tracking-tighter select-text whitespace-nowrap leading-none transition-all duration-200 group-hover:text-[#32CD32] group-hover:[text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] ${
                              !showHanzi ? "opacity-0 select-none pointer-events-none" : ""
                            } ${
                              isSelected || isKaraokeHighlighted
                                ? "text-[#32CD32] [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff]"
                                : isSavedWord
                                  ? "text-orange-500 dark:text-orange-400"
                                  : isCompound 
                                    ? "text-slate-900 dark:text-slate-50" 
                                    : "text-slate-800 dark:text-slate-250"
                            }`}
                            style={{ fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif' }}
                          >
                            {char}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </button>
          );
        })}
      </div>

      {/* Context Menu: Mode 'info' (Chuột trái) & Mode 'tools' (Chuột phải) */}
      {wordContextMenu && wordContextMenu.mode === 'info' && (
        <div
          key={`${wordContextMenu.token.text}-${wordContextMenu.x}-${wordContextMenu.top ?? wordContextMenu.bottom}`}
          ref={contextMenuRef}
          id="word-context-menu"
          className="fixed z-[100] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/85 dark:border-slate-800/90 rounded-2xl shadow-[0_10px_30px_-5px_rgba(15,23,42,0.12),0_4px_12px_-2px_rgba(15,23,42,0.06)] px-4 pt-3.5 pb-3 flex flex-col items-center min-w-[220px] max-w-[280px] word-popover-enter"
          style={{
            top: wordContextMenu.top !== undefined ? `${wordContextMenu.top}px` : undefined,
            bottom: wordContextMenu.bottom !== undefined ? `${wordContextMenu.bottom}px` : undefined,
            left: `${wordContextMenu.x}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Nút đóng ở góc trên bên phải */}
          <button
            onClick={() => setWordContextMenu(null)}
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {(() => {
            const savedMatch = savedWords.find(w => w.text === wordContextMenu.token.text);
            const pinyinText = wordContextMenu.token.pinyin || savedMatch?.pinyin;
            const hsk = wordContextMenu.token.hskLevel || savedMatch?.hskLevel || getHskLevel(wordContextMenu.token.text);
            const partOfSpeech = wordContextMenu.token.partOfSpeech || savedMatch?.partOfSpeech;
            const translation = wordContextMenu.token.translation || savedMatch?.translation;

            return (
              <>
                {/* 1. Nhóm Từ vựng (Trung tâm sự chú ý): Chữ Hán xanh lá, Pinyin ngay dưới */}
                <div 
                  onClick={() => speakMandarin(wordContextMenu.token.text)}
                  className="flex flex-col items-center justify-center cursor-pointer group hover:opacity-85 transition-all duration-150 active:scale-95 px-4"
                  title="Nhấp để nghe phát âm"
                >
                  <span 
                    className="text-[26px] font-bold text-[#32CD32] tracking-tight text-center leading-none"
                    style={{ fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif' }}
                  >
                    {wordContextMenu.token.text}
                  </span>
                  {pinyinText && (
                    <span className="text-[15px] font-mono font-medium text-blue-600 dark:text-blue-400 mt-1.5 tracking-wide leading-tight">
                      {pinyinText}
                    </span>
                  )}
                </div>

                {/* 2. Nhóm Nghĩa: Ngăn cách bằng đường kẻ mảnh thoáng đãng thay vì khung hộp lồng ghép */}
                <div className="w-full text-center py-2 my-2 border-y border-slate-100 dark:border-slate-800/80 px-1">
                  <p className="text-[15.5px] font-semibold text-slate-900 dark:text-white leading-snug break-words">
                    {translation || "(Chưa có nghĩa)"}
                  </p>
                </div>

                {/* 3. Nhóm Thông tin Loại từ & Cấp độ HSK: Cỡ chữ cân đối, phân tách bằng dấu chấm tròn mảnh */}
                {(partOfSpeech || hsk) && (
                  <div className="flex items-center justify-center gap-2 flex-wrap w-full pt-0.5">
                    {partOfSpeech && (
                      <span className={`text-[13.5px] font-semibold ${getPartOfSpeechTextColor(partOfSpeech)}`}>
                        {partOfSpeech}
                      </span>
                    )}
                    {partOfSpeech && hsk && (
                      <span className="text-[12px] text-slate-300 dark:text-slate-600 select-none">•</span>
                    )}
                    {hsk && (
                      <span className={`text-[13.5px] font-semibold ${getHskTextColor(hsk)}`}>
                        {hsk}
                      </span>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* CHUỘT PHẢI: Chỉ hiện các icon công cụ */}
      {wordContextMenu && wordContextMenu.mode === 'tools' && (
        <div
          ref={contextMenuRef}
          id="word-context-menu"
          className="fixed z-[100] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 sm:p-2.5 flex flex-col gap-2 min-w-[260px] sm:min-w-[280px] max-w-[calc(100vw-24px)] sm:max-w-[360px] word-popover-enter"
          style={{
            top: wordContextMenu.top !== undefined ? `${wordContextMenu.top}px` : undefined,
            bottom: wordContextMenu.bottom !== undefined ? `${wordContextMenu.bottom}px` : undefined,
            left: `${wordContextMenu.x}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Toolbar with action icons (căn giữa) */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
            {/* 1. Phát âm (Volume2 - Màu xanh dương) */}
            <button
              onClick={() => {
                speakMandarin(wordContextMenu.token.text, 1.0);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* 2. Luyện đọc / Ghi âm (Mic - Màu nâu) */}
            <button
              onClick={() => handleToggleRecordContextWord(wordContextMenu.token.text)}
              className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer ${
                isContextRecording 
                  ? "bg-amber-800 text-white animate-pulse" 
                  : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300"
              }`}
              title={isContextRecording ? "Dừng ghi âm" : "Ghi âm & Chấm điểm phát âm AI"}
            >
              {isContextRecording ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* 3. Chia các bộ thủ / Chiết tự (Layers - Màu đỏ) */}
            {onOpenRadicalBreakdown && (
              <button
                onClick={() => {
                  onOpenRadicalBreakdown(wordContextMenu.token.text);
                  setWordContextMenu(null);
                }}
                className="p-2 sm:p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer"
                title="Chia các bộ thủ (Chiết tự)"
              >
                <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* 4. Xem video ngữ cảnh YouGlish (Video - Màu tím) */}
            <button
              onClick={() => {
                setYouglishWord(wordContextMenu.token.text);
                setYouglishPinyin(wordContextMenu.token.pinyin);
                setYouglishTranslation(wordContextMenu.token.translation);
                setWordContextMenu(null);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer"
              title="Xem video ngữ cảnh YouGlish"
            >
              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* 5. Xem hình ảnh Google Images (Ảnh - Màu vàng) */}
            <button
              onClick={() => {
                setGoogleImagesWord(wordContextMenu.token.text);
                setGoogleImagesPinyin(wordContextMenu.token.pinyin);
                setGoogleImagesTranslation(wordContextMenu.token.translation);
                setWordContextMenu(null);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-500 hover:text-amber-600 dark:text-amber-400 transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer"
              title="Xem hình ảnh Google Images"
            >
              <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* 6. Lưu từ vựng (Lưu - Màu hồng) */}
            {onToggleSave && (() => {
              const isSaved = savedWords.some(w => w.text === wordContextMenu.token.text);
              return (
                <button
                  onClick={() => {
                    onToggleSave(wordContextMenu.token);
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer ${
                    isSaved
                      ? "bg-pink-500 text-white"
                      : "bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/60 text-pink-600 dark:text-pink-400"
                  }`}
                  title={isSaved ? "Bỏ lưu từ" : "Lưu vào sổ từ"}
                >
                  <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isSaved ? "fill-white" : ""}`} />
                </button>
              );
            })()}

            {/* 7. Đánh dấu đã thuộc (Check) */}
            {onMarkKnown && (() => {
              const isSaved = savedWords.some(w => w.text === wordContextMenu.token.text);
              const isKnown = savedWords.some(w => w.text === wordContextMenu.token.text && w.isKnown);
              if (!isSaved) return null;
              return (
                <button
                  onClick={() => {
                    onMarkKnown(wordContextMenu.token);
                    setWordContextMenu(null);
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer ${
                    isKnown
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
                  }`}
                  title={isKnown ? "Đã thuộc" : "Đánh dấu đã thuộc"}
                >
                  <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              );
            })()}

            {/* Close button */}
            <button
              onClick={() => setWordContextMenu(null)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-0.5"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback & Score when practicing pronunciation */}
          {isContextEvaluating && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium py-1.5 border-t border-slate-100 dark:border-slate-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              Đang chấm điểm phát âm...
            </div>
          )}

          {contextScore !== null && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  contextScore >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                  contextScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {Math.round(contextScore)}/100
                </div>
                {contextFeedback && (
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[170px]">
                    {contextFeedback}
                  </span>
                )}
              </div>
              {contextAudioUrl && (
                <button
                  onClick={handleTogglePlayContextAudio}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 transition shrink-0"
                  title="Nghe lại"
                >
                  {isContextPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* YouGlish Video Modal */}
      <YouglishModal
        isOpen={!!youglishWord}
        onClose={() => setYouglishWord(null)}
        initialWord={youglishWord || ""}
        pinyin={youglishPinyin}
        translation={youglishTranslation}
      />

      {/* Google Images Modal */}
      <GoogleImagesModal
        isOpen={!!googleImagesWord}
        onClose={() => setGoogleImagesWord(null)}
        initialWord={googleImagesWord || ""}
        pinyin={googleImagesPinyin}
        translation={googleImagesTranslation}
      />
    </div>
  );
}
