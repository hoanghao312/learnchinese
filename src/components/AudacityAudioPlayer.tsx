import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { pinyin } from 'pinyin-pro';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Upload, 
  Music, 
  FastForward, 
  Rewind, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  X, 
  Check, 
  Headphones, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Keyboard,
  FileText,
  RefreshCw,
  ArrowLeft,
  BookOpen,
  Radio,
  MessageSquare,
  Eye,
  EyeOff,
  GripHorizontal,
  Mic,
  Loader2,
  Heart,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Token, SavedWord } from '../types';
import { getMicrophoneStream } from '../microphone';
import { speakMandarin } from '../utils/speech';
import { getHskLevel } from '../utils/hskLookup';
import { getPartOfSpeechTextColor, getHskTextColor } from '../utils/wordTypeColors';
import YouglishModal from './YouglishModal';
import GoogleImagesModal from './GoogleImagesModal';
import RadicalBreakdownModal from './RadicalBreakdownModal';

interface AudacityAudioPlayerProps {
  initialAudioUrl?: string;
  initialTrackName?: string;
  lessonText?: string;
  lessonTokens?: Token[];
  lessonTitle?: string;
  selectedVoice?: string;
  selectedVoiceName?: string;
  selectedVoiceGender?: string;
  availableVoices?: { id: string; name: string; uri: string; gender: string }[];
  onVoiceChange?: (uri: string) => void;
  onMaximizeChange?: (isMaximized: boolean) => void;
  onBackToReader?: () => void;
  onClose?: () => void;
  waveformOnly?: boolean;
  savedWords?: SavedWord[];
  customDict?: Record<string, Partial<Token>>;
  mispronouncedWords?: string[];
  onOpenRadicalBreakdown?: (word: string) => void;
  onToggleSave?: (token: Token) => void;
  onMarkKnown?: (token: Token) => void;
}

export interface TtsSubtitleItem {
  part: string;
  start: number;
  end: number;
}

export interface CharTimingItem {
  char: string;
  pinyin: string;
  isPunctuation: boolean;
  startSec: number;
  endSec: number;
  weight: number;
}

export interface SentenceTimingItem {
  start: number;
  end: number;
  voiceStart?: number;
  voiceEnd?: number;
  text: string;
  pinyinText: string;
  charTimings?: CharTimingItem[];
}

// Global client-side in-memory cache for synthesized lesson audio blobs + WordBoundary subtitles
// Key format: `v4_edge_neural:${voice}:${normalizedText}` -> { blobUrl, subtitles }
const clientAudioBlobCache = new Map<string, { blobUrl: string; subtitles: TtsSubtitleItem[] }>();

// Format Time Helper (MM:SS.ms)
const formatTime = (secs: number) => {
  if (isNaN(secs)) return '00:00.00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export default function AudacityAudioPlayer({
  initialAudioUrl = '/sample-lesson.mp3',
  initialTrackName = 'Track 1 - Đoạn văn bài học',
  lessonText = '',
  lessonTokens = [],
  lessonTitle = 'Đoạn văn bài học',
  selectedVoice = '',
  selectedVoiceName,
  selectedVoiceGender,
  availableVoices = [],
  onVoiceChange,
  onMaximizeChange,
  onBackToReader,
  onClose,
  waveformOnly = false,
  savedWords = [],
  customDict = {},
  mispronouncedWords = [],
  onOpenRadicalBreakdown,
  onToggleSave,
  onMarkKnown
}: AudacityAudioPlayerProps) {
  // Container refs
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null);
  const activeRegionRef = useRef<Region | null>(null);
  const lessonTokensRef = useRef(lessonTokens);
  lessonTokensRef.current = lessonTokens;
  const savedWordsRef = useRef<SavedWord[]>(savedWords);
  savedWordsRef.current = savedWords;
  const customDictRef = useRef<Record<string, Partial<Token>>>(customDict);
  customDictRef.current = customDict;
  const mispronouncedWordsRef = useRef<string[]>(mispronouncedWords);
  mispronouncedWordsRef.current = mispronouncedWords;

  // Interactive Word Context Menu ('info' on left-click, 'tools' on right-click) — giống hệt phần đọc TextReader
  const [wordContextMenu, setWordContextMenu] = useState<{
    token: Token;
    x: number;
    top?: number;
    bottom?: number;
    mode: 'info' | 'tools';
  } | null>(null);
  const wordContextMenuRef = useRef<{
    token: Token;
    x: number;
    top?: number;
    bottom?: number;
    mode: 'info' | 'tools';
  } | null>(null);
  wordContextMenuRef.current = wordContextMenu;
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const lookedUpTokensRef = useRef<Record<string, Partial<Token>>>({});
  const activeSpeakingWordRef = useRef<string | null>(null);
  const lastWordClickTimestampRef = useRef<number>(0);

  // YouGlish video modal state
  const [youglishWord, setYouglishWord] = useState<string | null>(null);
  const [youglishPinyin, setYouglishPinyin] = useState<string | undefined>(undefined);
  const [youglishTranslation, setYouglishTranslation] = useState<string | undefined>(undefined);

  // Google Images modal state
  const [googleImagesWord, setGoogleImagesWord] = useState<string | null>(null);
  const [googleImagesPinyin, setGoogleImagesPinyin] = useState<string | undefined>(undefined);
  const [googleImagesTranslation, setGoogleImagesTranslation] = useState<string | undefined>(undefined);

  // Fallback local RadicalBreakdownModal if parent doesn't pass onOpenRadicalBreakdown
  const [localRadicalWord, setLocalRadicalWord] = useState<string | null>(null);

  // Context word pronunciation recording & AI evaluation state
  const [isContextRecording, setIsContextRecording] = useState(false);
  const [contextAudioUrl, setContextAudioUrl] = useState<string | null>(null);
  const [contextScore, setContextScore] = useState<number | null>(null);
  const [contextFeedback, setContextFeedback] = useState<string | null>(null);
  const [contextMispronounced, setContextMispronounced] = useState<string[]>([]);
  const contextMispronouncedRef = useRef<string[]>([]);
  contextMispronouncedRef.current = contextMispronounced;
  const [isContextEvaluating, setIsContextEvaluating] = useState(false);
  const [isContextPlaying, setIsContextPlaying] = useState(false);
  const contextAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const contextMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const contextAudioChunksRef = useRef<Blob[]>([]);

  // Đồng bộ class .selected-char-col và .saved-char-col trên các từ trong Shadow DOM mà không cần dựng lại toàn bộ vùng sóng
  const syncWordClassesInShadowDOM = useCallback(() => {
    const shadow = waveformRef.current?.shadowRoot || waveformRef.current?.querySelector('div')?.shadowRoot;
    if (!shadow) return;
    const selectedWord = wordContextMenuRef.current?.token.text || null;
    const speakingWord = activeSpeakingWordRef.current;
    const cols = shadow.querySelectorAll<HTMLElement>('.region-char-col:not(.region-punct-col)');
    cols.forEach(col => {
      const w = col.getAttribute('data-word') || '';
      if (!w) return;
      const isSel = selectedWord === w;
      const isSpk = speakingWord === w;
      const isSaved = savedWordsRef.current.some(sw => sw.text === w && !sw.isKnown);
      const isMis =
        mispronouncedWordsRef.current.some(mw => w.includes(mw) || mw.includes(w)) ||
        contextMispronouncedRef.current.some(mw => w.includes(mw) || mw.includes(w));

      if (isSel) col.classList.add('selected-char-col');
      else col.classList.remove('selected-char-col');

      if (isSpk) col.classList.add('active-char-col');
      else if (!wavesurferRef.current?.isPlaying()) col.classList.remove('active-char-col');

      if (isSaved) col.classList.add('saved-char-col');
      else col.classList.remove('saved-char-col');

      if (isMis) col.classList.add('mispronounced-char-col');
      else col.classList.remove('mispronounced-char-col');
    });
  }, []);

  useEffect(() => {
    syncWordClassesInShadowDOM();
  }, [wordContextMenu, savedWords, mispronouncedWords, contextMispronounced, syncWordClassesInShadowDOM]);

  // Tra cứu thông tin đầy đủ của từ vựng (từ lessonTokens, savedWords, customDict hoặc API /api/lookup-word)
  const resolveWordToken = useCallback((wordText: string, fallbackPinyin?: string): Token => {
    const cleanWord = (wordText || '').trim();
    const tokMatch = lessonTokensRef.current?.find(t => t.text === cleanWord && t.type === 'word') ||
                     lessonTokensRef.current?.find(t => t.text === cleanWord);
    const savedMatch = savedWordsRef.current?.find(w => w.text === cleanWord);
    let localDictEntry: Partial<Token> | undefined = customDictRef.current?.[cleanWord] || lookedUpTokensRef.current[cleanWord];
    if (!localDictEntry) {
      try {
        const raw = localStorage.getItem('custom_chinese_dictionary');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed[cleanWord]) localDictEntry = parsed[cleanWord];
        }
      } catch {}
    }

    let computedPy = localDictEntry?.pinyin || savedMatch?.pinyin || tokMatch?.pinyin || fallbackPinyin || '';
    if (!computedPy && cleanWord) {
      try {
        computedPy = pinyin(cleanWord);
      } catch {}
    }

    const translation =
      localDictEntry?.translation ||
      savedMatch?.translation ||
      tokMatch?.translation ||
      '';
    const partOfSpeech =
      localDictEntry?.partOfSpeech ||
      savedMatch?.partOfSpeech ||
      tokMatch?.partOfSpeech;
    const hskLevel =
      localDictEntry?.hskLevel ||
      savedMatch?.hskLevel ||
      tokMatch?.hskLevel ||
      getHskLevel(cleanWord);
    const example =
      localDictEntry?.example ||
      savedMatch?.example ||
      tokMatch?.example;

    const resolved: Token = {
      text: cleanWord,
      type: 'word',
      pinyin: computedPy,
      translation: translation || undefined,
      partOfSpeech,
      hskLevel,
      example
    };

    // Nếu chưa có nghĩa tiếng Việt thì tự động gọi /api/lookup-word để bổ sung ngay tức thì
    if (!resolved.translation || resolved.translation === '(Chưa cấp nghĩa)' || resolved.translation === '(Chưa có nghĩa)') {
      fetch('/api/lookup-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord })
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data && (data.translation || data.pinyin || data.partOfSpeech || data.hskLevel)) {
            const enriched: Partial<Token> = {
              pinyin: data.pinyin || resolved.pinyin,
              translation: data.translation || resolved.translation,
              partOfSpeech: data.partOfSpeech || resolved.partOfSpeech,
              hskLevel: data.hskLevel || resolved.hskLevel,
              example: data.example || resolved.example
            };
            lookedUpTokensRef.current[cleanWord] = enriched;
            setWordContextMenu(prev => {
              if (!prev || prev.token.text !== cleanWord) return prev;
              return {
                ...prev,
                token: {
                  ...prev.token,
                  ...enriched
                }
              };
            });
          }
        })
        .catch(() => {});
    }

    return resolved;
  }, []);

  // Mở popup thông tin từ vựng (Chuột trái: mode='info') hoặc thanh công cụ (Chuột phải: mode='tools') giống hệt phần đọc TextReader
  const handleWordColInteract = useCallback((
    targetRectOrEl: HTMLElement | DOMRect,
    wordText: string,
    fallbackPinyin: string,
    mode: 'info' | 'tools',
    clientXFallback?: number,
    clientYFallback?: number
  ) => {
    const cleanWord = (wordText || '').trim();
    if (!cleanWord || !/[\u4e00-\u9fa5]/.test(cleanWord)) return;
    lastWordClickTimestampRef.current = Date.now();

    // Tạm dừng phát sóng âm bài học nếu đang phát để nghe rõ phát âm của từ vựng
    if (wavesurferRef.current?.isPlaying()) {
      wavesurferRef.current.pause();
      setIsPlaying(false);
    }

    const currentMenu = wordContextMenuRef.current;
    // Nếu đang mở cùng từ và cùng chế độ: đóng menu (và nếu là chuột trái 'info' thì đọc lại từ đó giống hệt TextReader)
    if (currentMenu && currentMenu.token.text === cleanWord && currentMenu.mode === mode) {
      setWordContextMenu(null);
      if (mode === 'info') {
        activeSpeakingWordRef.current = cleanWord;
        syncWordClassesInShadowDOM();
        speakMandarin(cleanWord).finally(() => {
          if (activeSpeakingWordRef.current === cleanWord) {
            activeSpeakingWordRef.current = null;
            syncWordClassesInShadowDOM();
          }
        });
      }
      return;
    }

    const token = resolveWordToken(cleanWord, fallbackPinyin);

    // Phát âm từ vựng và tạo hiệu ứng phóng to màu xanh lá cây giống phần đọc
    activeSpeakingWordRef.current = cleanWord;
    syncWordClassesInShadowDOM();
    speakMandarin(cleanWord).finally(() => {
      if (activeSpeakingWordRef.current === cleanWord) {
        activeSpeakingWordRef.current = null;
        syncWordClassesInShadowDOM();
      }
    });

    // Reset trạng thái ghi âm nếu đang ghi
    if (isContextRecording) {
      contextMediaRecorderRef.current?.stop();
      setIsContextRecording(false);
    }
    setContextScore(null);
    setContextFeedback(null);
    setContextAudioUrl(null);
    setContextMispronounced([]);

    const rect = targetRectOrEl instanceof HTMLElement ? targetRectOrEl.getBoundingClientRect() : targetRectOrEl;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 12;
    const menuWidth = mode === 'tools' ? Math.min(320, vw - padding * 2) : Math.min(260, vw - padding * 2);

    const centerX = rect && rect.width > 0 ? (rect.left + rect.width / 2) : (clientXFallback ?? vw / 2);
    let x = centerX - menuWidth / 2;
    if (x + menuWidth > vw - padding) {
      x = vw - menuWidth - padding;
    }
    if (x < padding) x = padding;

    const anchorTop = rect && rect.height > 0 ? rect.top : (clientYFallback ?? vh / 2);
    const anchorBottom = rect && rect.height > 0 ? rect.bottom : (clientYFallback ?? vh / 2);

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
      mode
    });
  }, [isContextRecording, resolveWordToken, syncWordClassesInShadowDOM]);

  const handleWordColInteractRef = useRef(handleWordColInteract);
  handleWordColInteractRef.current = handleWordColInteract;

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
                const res = await fetch('/api/evaluate-pronunciation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
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
                console.warn('Evaluation warning:', error);
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
        console.warn('Lỗi microphone:', err);
        showToast('⚠️ Không thể truy cập microphone. Vui lòng cấp quyền.');
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
        console.error('Context audio init error:', err);
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
        // Nếu người dùng vừa click trực tiếp lên 1 từ trên sóng âm thì không đóng đè lên lệnh mở mới
        if (Date.now() - lastWordClickTimestampRef.current < 80) return;
        setWordContextMenu(null);
        if (isContextRecording) {
          contextMediaRecorderRef.current?.stop();
          setIsContextRecording(false);
        }
      }
    };

    const handleKeyDownCloseMenu = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWordContextMenu(null);
        if (isContextRecording) {
          contextMediaRecorderRef.current?.stop();
          setIsContextRecording(false);
        }
      }
    };

    const handleScrollOrWheelCloseMenu = (e: Event) => {
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
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDownCloseMenu);
      window.addEventListener('scroll', handleScrollOrWheelCloseMenu, true);
      window.addEventListener('wheel', handleScrollOrWheelCloseMenu, { passive: true });
      window.addEventListener('touchmove', handleScrollOrWheelCloseMenu, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDownCloseMenu);
      window.removeEventListener('scroll', handleScrollOrWheelCloseMenu, true);
      window.removeEventListener('wheel', handleScrollOrWheelCloseMenu);
      window.removeEventListener('touchmove', handleScrollOrWheelCloseMenu);
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

  // Thu gọn cột Track Controls bên trái trên màn hình điện thoại để mở rộng tối đa diện tích sóng âm
  const [showMobileTrackControls, setShowMobileTrackControls] = useState<boolean>(false);

  // Chế độ hiển thị chữ Hán & Pinyin trên dải sóng âm ('hanzi' | 'both' | 'none') - Mặc định ẩn cả 2 ('none')
  const [textOverlayMode, setTextOverlayMode] = useState<'both' | 'hanzi' | 'pinyin' | 'none'>('none');
  const [isOverlayMenuOpen, setIsOverlayMenuOpen] = useState<boolean>(false);
  const overlayMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [overlayMenuCoords, setOverlayMenuCoords] = useState<{ top: number; left: number } | null>(null);

  const handleToggleOverlayMenu = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const target = (e?.currentTarget as HTMLElement | null) || overlayMenuButtonRef.current;
    setIsOverlayMenuOpen((prev) => {
      const next = !prev;
      if (next && target) {
        const rect = target.getBoundingClientRect();
        const menuHeight = 260;
        // Kiểm tra nếu gần đáy màn hình thì bật menu hướng lên trên để luôn hiển thị trọn vẹn
        const fitsBelow = rect.bottom + menuHeight + 12 <= window.innerHeight;
        const top = fitsBelow ? (rect.bottom + 6) : Math.max(10, rect.top - menuHeight - 6);
        const left = Math.max(8, Math.min(window.innerWidth - 275, rect.left));
        setOverlayMenuCoords({ top, left });
      } else if (next) {
        setOverlayMenuCoords({ top: 120, left: 100 });
      }
      return next;
    });
  }, []);

  const textOverlayModeRef = useRef<'both' | 'hanzi' | 'pinyin' | 'none'>('none');
  useEffect(() => {
    textOverlayModeRef.current = textOverlayMode;
  }, [textOverlayMode]);

  // Mặc định khi nạp bài đọc hoặc âm thanh mới: ẩn cả chữ Hán và Pinyin ('none')
  useEffect(() => {
    setTextOverlayMode('none');
    textOverlayModeRef.current = 'none';
  }, [lessonText, initialAudioUrl]);

  // Chiều cao sóng âm tự động chuẩn (85px cho mini/luyện nghe, 180px cho Audacity đầy đủ) để thanh cuộn màu xám luôn hiện mặc định
  const [waveformHeight, setWaveformHeight] = useState<number>(waveformOnly ? 85 : 180);
  const waveformWrapperRef = useRef<HTMLDivElement | null>(null);

  // Web Audio refs for Gain & Stereo Pan
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const panNodeRef = useRef<StereoPannerNode | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Active reader voice state (defaulting to the reader's selected voice)
  const [activeVoiceUri, setActiveVoiceUri] = useState<string>(selectedVoice || '');

  // Keep in sync when parent selectedVoice updates
  useEffect(() => {
    if (selectedVoice && selectedVoice !== activeVoiceUri) {
      setActiveVoiceUri(selectedVoice);
    }
  }, [selectedVoice]);

  // Track State
  const [trackName, setTrackName] = useState<string>(
    lessonTitle ? `Track 1 - ${lessonTitle}` : initialTrackName
  );
  const [isEditingTrackName, setIsEditingTrackName] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>(
    (initialAudioUrl && initialAudioUrl.trim()) || '/sample-lesson.mp3'
  );
  const [audioSourceType, setAudioSourceType] = useState<'lesson' | 'sample' | 'custom'>('lesson');
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // WaveSurfer playback state
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  // Audacity Track Controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSolo, setIsSolo] = useState<boolean>(false);
  const [gainDb, setGainDb] = useState<number>(0); // -24dB to +12dB
  const [panValue, setPanValue] = useState<number>(0); // -1.0 (L) to +1.0 (R)
  
  // Audacity Transport & Language Learning Controls
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number; duration: number } | null>(null);
  const [loopCount, setLoopCount] = useState<number>(0);
  const loopCountRef = useRef<number>(0);
  const [maxLoopCount, setMaxLoopCount] = useState<number>(0); // 0 = Infinite
  const [zoomLevel, setZoomLevel] = useState<number>(80); // px per second (mặc định 80 để có dải cuộn sóng rõ ràng)
  const zoomLevelRef = useRef<number>(80);
  zoomLevelRef.current = zoomLevel;
  const isUserZoomedRef = useRef<boolean>(false);
  const wheelAccumulatorRef = useRef<number>(0);
  const wheelMouseXRef = useRef<number | null>(null);
  const wheelRafRef = useRef<number | null>(null);
  const zoomToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setShortcutToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setShortcutToast(null), 1800);
  }, []);

  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const activeSentenceIndexRef = useRef<number | null>(null);

  // Synchronized waveform & sentence track timeline
  const waveformScrollWidthRef = useRef<number>(0);
  const showSentenceTrack = true;
  const showSentenceTrackRef = useRef<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Audacity Viewport & Scrolling refs:
  const userScrolledAwayRef = useRef<boolean>(false);
  const mouseClientXRef = useRef<number | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const scrollMetricsUpdateRafRef = useRef<number | null>(null);

  // Dải câu tùy chỉnh có thể kéo dãn đồng bộ trực tiếp với vùng sóng âm
  const [customSentences, setCustomSentences] = useState<SentenceTimingItem[]>([]);
  const customSentencesRef = useRef<SentenceTimingItem[]>([]);
  const [ttsSubtitles, setTtsSubtitles] = useState<TtsSubtitleItem[]>([]);
  const ttsSubtitlesRef = useRef<TtsSubtitleItem[]>([]);
  useEffect(() => {
    ttsSubtitlesRef.current = ttsSubtitles;
  }, [ttsSubtitles]);

  // Vị trí con trỏ chuột trên sóng âm dùng cho phím tắt F
  const mouseHoverTimeRef = useRef<number | null>(null);

  const selectedRegionRef = useRef<{ start: number; end: number; duration: number } | null>(null);
  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  // Lịch sử hoàn tác (Undo - Ctrl+Z)
  interface EditorSnapshot {
    sentences: SentenceTimingItem[];
    activeIndex: number | null;
    selectedRegion: { start: number; end: number; duration: number } | null;
    currentTime: number;
    description?: string;
  }
  const historyStackRef = useRef<EditorSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const isDraggingWaveRegionRef = useRef<boolean>(false);
  const lastRegionDragEndTimeRef = useRef<number>(0);

  const isMaximizedRef = useRef(isMaximized);
  isMaximizedRef.current = isMaximized;

  // Lấy DOM element cuộn ngang của sóng âm (WaveSurfer Shadow DOM / wrapper)
  const getScrollEl = useCallback((): HTMLElement | null => {
    try {
      const wsWrapper = wavesurferRef.current?.getWrapper();
      if (wsWrapper?.parentElement) return wsWrapper.parentElement as HTMLElement;
    } catch {}
    const wf = waveformRef.current;
    if (!wf) return null;
    return (
      wf.shadowRoot?.querySelector('[part="scroll"]') ||
      wf.querySelector('div')?.shadowRoot?.querySelector('[part="scroll"]') ||
      wf.querySelector('[part="scroll"]') ||
      wf.querySelector('.scroll')
    ) as HTMLElement | null;
  }, []);

  // Lưu kích thước và vị trí cuộn bằng Ref (không dùng React state để tránh re-render toàn bộ component gây giật lắc khi kéo)
  const scrollMetricsRef = useRef<{
    scrollLeft: number;
    scrollWidth: number;
    clientWidth: number;
  }>({
    scrollLeft: 0,
    scrollWidth: 1,
    clientWidth: 1
  });
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingThumbRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);
  const dragStartThumbLeftPxRef = useRef<number>(0);
  const dragScrollRafRef = useRef<number | null>(null);
  // Lưu trực tiếp vị trí % và độ rộng % của con chạy (mặc định nằm bên trái 0%, độ dài 50% = 1/2 thanh cuộn)
  const thumbPosRef = useRef<{ left: number; width: number }>({ left: 0, width: 50 });

  // Đồng bộ trực tiếp CSS DOM của nút trượt màu xám (Thumb) để đảm bảo 60fps/120fps không trễ khung hình
  const updateScrollThumbDOM = useCallback((sLeft: number, sWidth: number, cWidth: number) => {
    const isOver = sWidth > cWidth + 1;
    const maxS = Math.max(1, sWidth - cWidth);
    const visRatio = Math.min(1, cWidth / Math.max(1, sWidth));
    // Con chạy chiếm 1/2 độ dài thanh cuộn (tối đa 50%), mặc định 50% để luôn có không gian kéo trượt sang phải
    const widthPct = isOver ? Math.max(10, Math.min(50, visRatio * 100)) : 50;
    const leftPct = isOver ? Math.max(0, Math.min(1, sLeft / maxS)) * (100 - widthPct) : thumbPosRef.current.left;
    thumbPosRef.current = { left: leftPct, width: widthPct };
    if (thumbRef.current) {
      thumbRef.current.style.width = `${widthPct}%`;
      thumbRef.current.style.left = `${leftPct}%`;
    }
  }, []);

  const updateScrollMetrics = useCallback(() => {
    if (isDraggingThumbRef.current) return;
    const ws = wavesurferRef.current;
    const scrollEl = getScrollEl();
    const cw = scrollEl?.clientWidth || waveformRef.current?.clientWidth || 800;
    const sw = scrollEl ? Math.max(cw, scrollEl.scrollWidth) : cw;
    const sl = scrollEl ? scrollEl.scrollLeft : (ws?.getScroll() || 0);

    scrollMetricsRef.current = {
      scrollLeft: sl,
      scrollWidth: sw,
      clientWidth: cw
    };
    updateScrollThumbDOM(sl, sw, cw);
  }, [getScrollEl, updateScrollThumbDOM]);

  // Gom các lần cập nhật vị trí cuộn vào requestAnimationFrame (không gọi setState để không re-render React)
  const scheduleScrollMetricsUpdate = useCallback(() => {
    if (isDraggingThumbRef.current) return;
    if (scrollMetricsUpdateRafRef.current !== null) return;
    scrollMetricsUpdateRafRef.current = requestAnimationFrame(() => {
      scrollMetricsUpdateRafRef.current = null;
      updateScrollMetrics();
    });
  }, [updateScrollMetrics]);

  // Đảm bảo sóng âm luôn có không gian cuộn ngang (chỉ gọi 1 lần khi bắt đầu thao tác, không gọi trong vòng lặp mousemove)
  const ensureScrollableWaveform = useCallback(() => {
    const ws = wavesurferRef.current;
    let scrollEl = getScrollEl();
    const dur = ws?.getDuration() || duration || 0;
    const cw = scrollEl?.clientWidth || waveformRef.current?.clientWidth || 800;
    let sw = scrollEl ? scrollEl.scrollWidth : cw;

    if (sw <= cw + 2 && dur > 0 && ws) {
      const targetZoom = Math.max(100, Math.ceil((cw * 2) / dur));
      zoomLevelRef.current = targetZoom;
      isUserZoomedRef.current = true;
      try {
        ws.zoom(targetZoom);
      } catch {}
      scrollEl = getScrollEl();
      const tWidth = Math.ceil(dur * targetZoom);
      try {
        const wrapper = ws.getWrapper();
        if (wrapper && wrapper.clientWidth < tWidth) {
          wrapper.style.width = `${tWidth}px`;
        }
        if (scrollEl) {
          scrollEl.style.overflowX = 'scroll';
        }
      } catch {}
      sw = scrollEl ? Math.max(cw * 2, scrollEl.scrollWidth) : cw * 2;
    }
    const actualMaxScroll = scrollEl ? Math.max(1, scrollEl.scrollWidth - scrollEl.clientWidth) : Math.max(1, sw - cw);
    return { scrollEl, ws, cw, sw, maxScroll: actualMaxScroll };
  }, [getScrollEl, duration]);

  // Helper cuộn ngang sóng âm an toàn, trực tiếp qua DOM
  const scrollWaveformBy = useCallback((deltaX: number) => {
    userScrolledAwayRef.current = true;
    const { scrollEl, cw, sw, maxScroll } = ensureScrollableWaveform();
    if (scrollEl) {
      const target = Math.max(0, Math.min(maxScroll, scrollEl.scrollLeft + deltaX));
      scrollEl.scrollLeft = target;
      updateScrollThumbDOM(target, sw, cw);
      return;
    }
  }, [ensureScrollableWaveform, updateScrollThumbDOM]);

  // Nhảy nhanh về vị trí con trỏ phát (Playhead) khi người dùng muốn theo dõi lại
  const handleJumpToPlayhead = useCallback(() => {
    userScrolledAwayRef.current = false;
    const ws = wavesurferRef.current;
    const scrollEl = getScrollEl();
    if (!ws || !scrollEl) return;
    const t = ws.getCurrentTime() ?? currentTime ?? 0;
    const containerW = scrollEl.clientWidth;
    const playheadX = t * zoomLevelRef.current;
    const maxScroll = Math.max(0, scrollEl.scrollWidth - containerW);
    const target = Math.max(0, Math.min(maxScroll, playheadX - containerW * 0.15));
    scrollEl.scrollLeft = target;
    updateScrollThumbDOM(target, scrollEl.scrollWidth, containerW);
    showToast(`🎯 Đã cuộn về vạch đỏ phát (${formatTime(t)})`);
  }, [currentTime, getScrollEl, updateScrollThumbDOM, showToast, formatTime]);

  // Cuộn sóng âm theo chiều ngang nhanh bằng nút bấm mũi tên Trái / Phải
  const continuousScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continuousScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopContinuousScroll = useCallback(() => {
    if (continuousScrollTimerRef.current) {
      clearTimeout(continuousScrollTimerRef.current);
      continuousScrollTimerRef.current = null;
    }
    if (continuousScrollIntervalRef.current) {
      clearInterval(continuousScrollIntervalRef.current);
      continuousScrollIntervalRef.current = null;
    }
  }, []);

  const handleScrollHorizontal = useCallback((offset: number) => {
    scrollWaveformBy(offset);
  }, [scrollWaveformBy]);

  const startContinuousScroll = useCallback((offset: number) => {
    stopContinuousScroll();
    continuousScrollTimerRef.current = setTimeout(() => {
      continuousScrollIntervalRef.current = setInterval(() => {
        scrollWaveformBy(offset * 0.75);
      }, 80);
    }, 300);
  }, [scrollWaveformBy, stopContinuousScroll]);

  useEffect(() => {
    return () => {
      stopContinuousScroll();
    };
  }, [stopContinuousScroll]);

  // Kéo nút trượt màu xám siêu mượt (Zero layout-thrashing & Zero React re-render trong lúc kéo)
  const handleThumbMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trackEl = scrollTrackRef.current;
    const thumbEl = thumbRef.current;
    if (!trackEl || !thumbEl) return;

    const { scrollEl, maxScroll } = ensureScrollableWaveform();
    const startX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

    // Đo kích thước DUY NHẤT 1 LẦN khi bắt đầu nhấn chuột để tránh ép trình duyệt tính lại bố cục (reflow) khi di chuột
    const trackWidth = trackEl.getBoundingClientRect().width || 200;
    const widthPct = thumbPosRef.current.width || 50;
    const thumbWidth = (trackWidth * widthPct) / 100;
    const availTrack = Math.max(1, trackWidth - thumbWidth);
    const maxLeftPct = Math.max(1, 100 - widthPct);
    const initialRatio = Math.max(0, Math.min(1, thumbPosRef.current.left / maxLeftPct));

    isDraggingThumbRef.current = true;
    userScrolledAwayRef.current = true;
    dragStartXRef.current = startX;
    dragStartThumbLeftPxRef.current = initialRatio * availTrack;
    dragStartScrollLeftRef.current = scrollEl ? scrollEl.scrollLeft : 0;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    let pendingScrollTarget = dragStartScrollLeftRef.current;

    const flushWaveformScroll = () => {
      dragScrollRafRef.current = null;
      if (scrollEl) {
        scrollEl.scrollLeft = pendingScrollTarget;
      }
    };

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDraggingThumbRef.current) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();

      const clientX = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const deltaX = clientX - dragStartXRef.current;
      const newThumbLeftPx = Math.max(0, Math.min(availTrack, dragStartThumbLeftPxRef.current + deltaX));
      const ratio = newThumbLeftPx / availTrack;

      const leftPct = ratio * maxLeftPct;
      thumbPosRef.current.left = leftPct;
      // Cập nhật vị trí con chạy tức thì theo con trỏ chuột (0ms delay)
      thumbEl.style.left = `${leftPct}%`;

      // Gom lệnh cuộn sóng âm vào requestAnimationFrame để khớp nhịp quét màn hình, chống giật lắc
      pendingScrollTarget = ratio * maxScroll;
      if (dragScrollRafRef.current === null) {
        dragScrollRafRef.current = requestAnimationFrame(flushWaveformScroll);
      }
    };

    const onEnd = () => {
      if (dragScrollRafRef.current !== null) {
        cancelAnimationFrame(dragScrollRafRef.current);
        dragScrollRafRef.current = null;
      }
      if (scrollEl) {
        scrollEl.scrollLeft = pendingScrollTarget;
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      requestAnimationFrame(() => {
        isDraggingThumbRef.current = false;
      });
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }, [ensureScrollableWaveform]);

  // Nhấp vào rãnh thanh trượt màu xám để nhảy cuộn mượt mà đến vị trí tương ứng và hỗ trợ kéo tiếp ngay lập tức
  const handleTrackMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.audacity-scroll-thumb')) return;
    e.preventDefault();
    e.stopPropagation();

    const trackEl = scrollTrackRef.current;
    const thumbEl = thumbRef.current;
    if (!trackEl || !thumbEl) return;

    const { scrollEl, maxScroll } = ensureScrollableWaveform();
    userScrolledAwayRef.current = true;

    const rect = trackEl.getBoundingClientRect();
    const trackWidth = rect.width || 200;
    const widthPct = thumbPosRef.current.width || 50;
    const thumbWidth = (trackWidth * widthPct) / 100;
    const availTrack = Math.max(1, trackWidth - thumbWidth);
    const maxLeftPct = Math.max(1, 100 - widthPct);

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clickThumbLeftPx = Math.max(0, Math.min(availTrack, clientX - rect.left - thumbWidth / 2));
    const clickRatio = clickThumbLeftPx / availTrack;

    const leftPct = clickRatio * maxLeftPct;
    thumbPosRef.current = { left: leftPct, width: widthPct };
    thumbEl.style.width = `${widthPct}%`;
    thumbEl.style.left = `${leftPct}%`;

    const targetScroll = clickRatio * maxScroll;
    if (scrollEl) {
      scrollEl.scrollLeft = targetScroll;
    }

    // Hỗ trợ giữ chuột kéo tiếp ngay sau khi nhấp vào rãnh trượt
    isDraggingThumbRef.current = true;
    dragStartXRef.current = clientX;
    dragStartThumbLeftPxRef.current = clickThumbLeftPx;
    dragStartScrollLeftRef.current = targetScroll;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    let pendingScrollTarget = targetScroll;

    const flushWaveformScroll = () => {
      dragScrollRafRef.current = null;
      if (scrollEl) {
        scrollEl.scrollLeft = pendingScrollTarget;
      }
    };

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDraggingThumbRef.current) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();

      const mClientX = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const delta = mClientX - dragStartXRef.current;
      const newThumbLeftPx = Math.max(0, Math.min(availTrack, dragStartThumbLeftPxRef.current + delta));
      const ratio = newThumbLeftPx / availTrack;

      const lPct = ratio * maxLeftPct;
      thumbPosRef.current.left = lPct;
      thumbEl.style.left = `${lPct}%`;

      pendingScrollTarget = ratio * maxScroll;
      if (dragScrollRafRef.current === null) {
        dragScrollRafRef.current = requestAnimationFrame(flushWaveformScroll);
      }
    };

    const onEnd = () => {
      if (dragScrollRafRef.current !== null) {
        cancelAnimationFrame(dragScrollRafRef.current);
        dragScrollRafRef.current = null;
      }
      if (scrollEl) {
        scrollEl.scrollLeft = pendingScrollTarget;
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      requestAnimationFrame(() => {
        isDraggingThumbRef.current = false;
      });
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }, [ensureScrollableWaveform]);

  const thumbWidthPercent = thumbPosRef.current.width || 50;
  const thumbLeftPercent = thumbPosRef.current.left || 0;

  // Kéo chuột để cuộn ngang sóng âm (Pan Horizontally bằng chuột giữa hoặc Shift + kéo chuột trái)
  const isHorizontalPanningRef = useRef<boolean>(false);
  const panStartXRef = useRef<number>(0);
  const panStartScrollLeftRef = useRef<number>(0);

  const handleWaveformMouseDown = useCallback((e: React.MouseEvent) => {
    // Kích hoạt Pan ngang khi nhấp nút chuột giữa (button 1) hoặc giữ Shift + chuột trái (button 0)
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      const ws = wavesurferRef.current;
      const scrollEl = getScrollEl();
      if (!ws && !scrollEl) return;

      userScrolledAwayRef.current = true;
      isHorizontalPanningRef.current = true;
      panStartXRef.current = e.clientX;
      try {
        panStartScrollLeftRef.current = scrollEl ? scrollEl.scrollLeft : (ws?.getScroll() || 0);
      } catch {
        panStartScrollLeftRef.current = 0;
      }
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEv: MouseEvent) => {
        if (!isHorizontalPanningRef.current) return;
        const deltaX = moveEv.clientX - panStartXRef.current;
        const el = getScrollEl();
        if (el) {
          const maxS = Math.max(0, el.scrollWidth - el.clientWidth);
          const target = Math.max(0, Math.min(maxS, panStartScrollLeftRef.current - deltaX));
          el.scrollLeft = target;
          try { wavesurferRef.current?.setScroll(target); } catch {}
          updateScrollThumbDOM(target, el.scrollWidth, el.clientWidth);
          scheduleScrollMetricsUpdate();
        } else if (wavesurferRef.current) {
          try {
            wavesurferRef.current.setScroll(panStartScrollLeftRef.current - deltaX);
          } catch {}
        }
      };

      const onMouseUp = () => {
        if (isHorizontalPanningRef.current) {
          isHorizontalPanningRef.current = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          updateScrollMetrics();
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  }, [getScrollEl, updateScrollThumbDOM, scheduleScrollMetricsUpdate, updateScrollMetrics]);

  // Phóng to / Thu nhỏ phòng nghe - đồng bộ ẩn thanh tabbar bên dưới
  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => {
      const next = !prev;
      showToast(next ? '⛶ Đã phóng to toàn màn hình phòng luyện nghe' : '🗗 Đã thu nhỏ phòng nghe');
      return next;
    });
  }, [showToast]);

  // Đồng bộ trạng thái phóng to với App component và body class một cách an toàn
  useEffect(() => {
    onMaximizeChange?.(isMaximized);
    if (isMaximized) {
      document.body.classList.add('audacity-maximized-active');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('audacity-maximized-active');
      document.body.style.overflow = '';
    }
  }, [isMaximized, onMaximizeChange]);

  // Dọn dẹp body class khi unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('audacity-maximized-active');
      document.body.style.overflow = '';
      if (isMaximizedRef.current) {
        onMaximizeChange?.(false);
      }
    };
  }, [onMaximizeChange]);

  // Quản lý kéo dãn chiều cao vùng sóng âm bằng chuột (Drag resize waveform height)
  const isResizingWaveformRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(360);
  const isManualHeightRef = useRef<boolean>(false);

  const handleStartWaveformResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingWaveformRef.current = true;
    isManualHeightRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = waveformHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEv: MouseEvent) => {
      if (!isResizingWaveformRef.current) return;
      const deltaY = moveEv.clientY - startYRef.current;
      const nextH = Math.max(160, Math.min(850, Math.round(startHeightRef.current + deltaY)));
      setWaveformHeight(nextH);
    };

    const onMouseUp = () => {
      if (isResizingWaveformRef.current) {
        isResizingWaveformRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [waveformHeight]);

  const handleResetWaveformHeight = useCallback(() => {
    isManualHeightRef.current = false;
    if (waveformOnly) {
      setWaveformHeight(140);
      return;
    }
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const defaultH = isMaximized 
      ? Math.max(260, Math.min(850, vh - 110)) 
      : Math.max(200, Math.min(520, vh - 295));
    setWaveformHeight(defaultH);
    showToast('📐 Đã khôi phục chiều cao sóng âm ban đầu');
  }, [isMaximized, waveformOnly, showToast]);

  // Tự động tính toán chiều cao sóng âm ban đầu hoặc khi đổi kích thước cửa sổ trình duyệt.
  // Không quan sát parentElement để tránh vòng lặp co giãn chiều dọc khi xuất hiện thanh cuộn ngang lúc zoom!
  useEffect(() => {
    const updateHeight = () => {
      if (typeof window === 'undefined' || isManualHeightRef.current) return;
      if (waveformOnly) {
        setWaveformHeight(140);
        return;
      }
      const vh = window.innerHeight;
      let targetHeight = 320;

      if (isMaximized) {
        // Trong chế độ Toàn màn hình: chiếm tối đa chiều cao trừ header và lề
        targetHeight = Math.max(260, Math.min(850, vh - 110));
      } else {
        // Trong chế độ thông thường: tính toán vừa khít chính xác viewport
        // vh trừ đi khoảng 295px (header app 52px, sub-tabs 42px, toolbar 44px, timeline 22px, resize bar 10px, bottom nav 68px, lề padding ~57px)
        targetHeight = Math.max(200, Math.min(520, vh - 295));
      }

      setWaveformHeight((prev) => (Math.abs(prev - targetHeight) > 4 ? targetHeight : prev));
    };

    updateHeight();
    const handleResize = () => updateHeight();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMaximized, waveformOnly]);

  // Đồng bộ chiều cao vào WaveSurfer instance khi waveformHeight hoặc isReady thay đổi.
  // QUAN TRỌNG: normalize: false và maxPeak: 1.0 cố định biên độ dọc, chỉ zoom theo chiều ngang!
  useEffect(() => {
    if (!isReady) return;
    const ws = wavesurferRef.current;
    if (ws) {
      try {
        ws.setOptions({
          height: waveformHeight,
          barHeight: waveformOnly ? 0.8 : 0.45,
          normalize: false,
          maxPeak: 1.0
        });
      } catch {}
    }
  }, [isReady, waveformHeight]);

  // Keep references to prevent stale closures in WaveSurfer events
  const isLoopingRef = useRef<boolean>(false);
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const maxLoopCountRef = useRef<number>(0);
  useEffect(() => {
    maxLoopCountRef.current = maxLoopCount;
  }, [maxLoopCount]);

  const isLoopSeekingRef = useRef<boolean>(false);
  const seekLockTimeoutRef = useRef<any>(null);

  const toggleLooping = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      isLoopingRef.current = next;
      showToast(next ? '🔁 Lặp lại: BẬT' : '🔁 Lặp lại: TẮT');
      return next;
    });
  }, [showToast]);

  // Effects Modal
  const [isEffectsModalOpen, setIsEffectsModalOpen] = useState<boolean>(false);
  const [activeEffectTab, setActiveEffectTab] = useState<'eq' | 'noise' | 'reverb' | 'pitch'>('eq');
  const [effectSliders, setEffectSliders] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    noiseGate: -40,
    reverbWet: 15,
    pitchSemitones: 0
  });

  // Track Format Info
  const [trackInfo] = useState<{ sampleRate: string; bitDepth: string; channels: string }>({
    sampleRate: '44100Hz',
    bitDepth: '32-bit float',
    channels: 'Stereo'
  });

  // Chia phần sóng âm theo dấu phẩy và dấu chấm của đoạn văn (Chinese & standard punctuation)
  const lessonSentences = useMemo(() => {
    if (!lessonText || !lessonText.trim()) return [];
    // Tách theo dấu phẩy, dấu chấm, chấm than, chấm hỏi, chấm phẩy
    const raw = lessonText
      .split(/([。！？；，、,!?;.\n\r]+)/)
      .filter(Boolean);
    const sentences: string[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const main = raw[i];
      const punct = raw[i + 1] || '';
      const combined = (main + punct).trim();
      if (combined) sentences.push(combined);
    }
    return sentences.length > 0 ? sentences : [lessonText.trim()];
  }, [lessonText]);

  // ============================================================================
  // THUẬT TOÁN ĐỒNG BỘ SÓNG ÂM & PINYIN/CHỮ HÁN CHÍNH XÁC TỪNG ÂM TIẾT (SYLLABLE-LEVEL)
  // Kết hợp:
  // 1. WordBoundary Subtitles (mili-giây chính xác từ TTS nếu có)
  // 2. Phân tích đường bao năng lượng RMS (10ms hop) từ AudioBuffer đã giải mã:
  //    - Phát hiện chính xác khoảng lặng đầu/cuối bài & các thung lũng khoảng nghỉ (silence valleys) giữa các vế câu
  //    - Trong từng câu [start, end], xác định chính xác vùng có tiếng nói thực tế [voiceStart, voiceEnd] (loại bỏ đoạn im lặng nghỉ dấu phẩy/chấm)
  //    - Phân bổ từng cột Pinyin + Chữ Hán khớp 1:1 ngay trên đỉnh sóng âm (syllable burst) của âm tiết đó
  // ============================================================================
  const getSyllablePhoneticWeight = useCallback((char: string, py: string): number => {
    if (/[.,!?;:\s\n\r\t，。！？、：；（）《》“”‘’"']/.test(char)) return 0;
    const cleanPy = (py || '').toLowerCase();
    // Trợ từ nhẹ / thanh nhẹ thường phát âm ngắn hơn
    if ('的了么吗呢吧着过们子儿地得'.includes(char)) return 0.72;
    // Vận mẫu kép / mũi dài (ang, eng, ing, ong, iang, uang, uan, iao, iou, uai)
    if (/(ang|eng|ing|ong|iang|uang|uan|iao|iou|uai|uang)/.test(cleanPy)) return 1.15;
    if (/(an|en|in|un|ai|ei|ao|ou|ia|ie|ua|uo|ue)/.test(cleanPy)) return 1.05;
    return 1.0;
  }, []);

  // Tinh chỉnh vùng tiếng nói [voiceStart, voiceEnd] và thời gian từng chữ Hán/Pinyin cho 1 câu cụ thể dựa trên dữ liệu sóng âm PCM
  const computeClauseSyllableAlignment = useCallback((
    segStart: number,
    segEnd: number,
    text: string,
    decoded?: AudioBuffer | null,
    explicitCharBounds?: Array<{ startSec: number; endSec: number } | null>
  ): { voiceStart: number; voiceEnd: number; charTimings: CharTimingItem[] } => {
    const safeStart = Math.max(0, segStart);
    const safeEnd = Math.max(safeStart + 0.06, segEnd);
    const segDur = safeEnd - safeStart;

    let pinyinArr: string[] = [];
    try {
      pinyinArr = pinyin(text, { type: 'array' });
    } catch {
      pinyinArr = [];
    }
    const chars = Array.from(text);

    // 1. Tìm [voiceStart, voiceEnd] thực tế trên sóng âm trong khoảng [safeStart, safeEnd]
    let voiceStart = safeStart;
    let voiceEnd = safeEnd;

    let rmsEnvelope: Float32Array | null = null;
    const hopSec = 0.008; // Độ phân giải 8ms cho từng âm tiết
    let numFrames = 0;

    if (decoded && decoded.length > 0) {
      const channelData = decoded.getChannelData(0);
      const sr = decoded.sampleRate;
      const startSample = Math.max(0, Math.floor(safeStart * sr));
      const endSample = Math.min(channelData.length, Math.ceil(safeEnd * sr));
      const totalSamples = endSample - startSample;

      if (totalSamples > 64) {
        const hopSamples = Math.max(1, Math.floor(hopSec * sr));
        const winSamples = Math.max(hopSamples, Math.floor(0.02 * sr));
        numFrames = Math.max(1, Math.floor(totalSamples / hopSamples));
        rmsEnvelope = new Float32Array(numFrames);

        let maxLocalRms = 0;
        for (let f = 0; f < numFrames; f++) {
          const s0 = startSample + f * hopSamples;
          const s1 = Math.min(endSample, s0 + winSamples);
          let sumSq = 0;
          const step = Math.max(1, Math.floor((s1 - s0) / 32));
          let count = 0;
          for (let s = s0; s < s1; s += step) {
            const v = channelData[s];
            sumSq += v * v;
            count++;
          }
          const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
          rmsEnvelope[f] = rms;
          if (rms > maxLocalRms) maxLocalRms = rms;
        }

        if (maxLocalRms > 0.002) {
          // Ngưỡng phát hiện bắt đầu và kết thúc cụm sóng âm của câu
          const sorted = Array.from(rmsEnvelope).sort((a, b) => a - b);
          const noiseFloor = sorted[Math.floor(sorted.length * 0.12)] || 0;
          const activeThresh = Math.max(noiseFloor * 2.0, maxLocalRms * 0.075);

          let firstActiveFrame = 0;
          while (firstActiveFrame < numFrames - 1 && rmsEnvelope[firstActiveFrame] < activeThresh) {
            firstActiveFrame++;
          }
          let lastActiveFrame = numFrames - 1;
          while (lastActiveFrame > firstActiveFrame && rmsEnvelope[lastActiveFrame] < activeThresh) {
            lastActiveFrame--;
          }

          // Mở rộng nhẹ 20ms ở đầu và 28ms ở cuối để bao trọn phụ âm đầu và âm cuối trên đồ thị sóng
          const detectedStart = safeStart + Math.max(0, firstActiveFrame * hopSec - 0.022);
          const detectedEnd = safeStart + Math.min(segDur, (lastActiveFrame + 1) * hopSec + 0.028);

          if (detectedEnd - detectedStart >= Math.min(0.08, segDur * 0.35)) {
            voiceStart = Number(detectedStart.toFixed(3));
            voiceEnd = Number(detectedEnd.toFixed(3));
          }
        }
      }
    }

    // Nếu có explicitCharBounds từ TTS WordBoundary thì ưu tiên lấy bao phủ chính xác và tinh chỉnh với sóng âm
    const validExplicit = explicitCharBounds?.filter((b): b is { startSec: number; endSec: number } => Boolean(b && b.endSec > b.startSec)) || [];
    if (validExplicit.length > 0) {
      const expStart = Math.max(safeStart, validExplicit[0].startSec);
      const expEnd = Math.min(safeEnd, validExplicit[validExplicit.length - 1].endSec);
      if (expEnd > expStart + 0.04) {
        // Kết hợp biên WordBoundary và biên sóng âm thực tế để khớp tuyệt đối với mắt nhìn
        voiceStart = Number(Math.min(voiceStart, expStart).toFixed(3));
        voiceEnd = Number(Math.max(voiceEnd, expEnd).toFixed(3));
        voiceStart = Math.max(safeStart, voiceStart);
        voiceEnd = Math.min(safeEnd, voiceEnd);
      }
    }

    const activeVoiceDur = Math.max(0.04, voiceEnd - voiceStart);

    // 2. Tính trọng số âm học cho từng ký tự trong câu
    const weights = chars.map((ch, idx) => getSyllablePhoneticWeight(ch, pinyinArr[idx] || ''));
    const spokenIndices: number[] = [];
    weights.forEach((w, idx) => {
      if (w > 0) spokenIndices.push(idx);
    });

    if (spokenIndices.length === 0) {
      return {
        voiceStart,
        voiceEnd,
        charTimings: chars.map((ch, idx) => ({
          char: ch,
          pinyin: '',
          isPunctuation: true,
          startSec: voiceStart,
          endSec: voiceEnd,
          weight: 0
        }))
      };
    }

    // 3. Xác định mốc thời gian [startSec, endSec] cho từng âm tiết có phát âm (spokenIndices)
    const spokenBounds: Array<{ startSec: number; endSec: number }> = new Array(spokenIndices.length);
    const hasFullExplicit =
      explicitCharBounds &&
      spokenIndices.every(charIdx => {
        const b = explicitCharBounds[charIdx];
        return b && b.endSec > b.startSec;
      });

    if (hasFullExplicit && explicitCharBounds) {
      spokenIndices.forEach((charIdx, k) => {
        const b = explicitCharBounds[charIdx]!;
        spokenBounds[k] = {
          startSec: Math.max(voiceStart, Math.min(voiceEnd, b.startSec)),
          endSec: Math.max(voiceStart, Math.min(voiceEnd, b.endSec))
        };
      });
      // Đảm bảo tính liên tục giữa các âm tiết trong phạm vi [voiceStart, voiceEnd]
      spokenBounds[0].startSec = voiceStart;
      spokenBounds[spokenBounds.length - 1].endSec = voiceEnd;
      for (let k = 0; k < spokenBounds.length - 1; k++) {
        const mid = Number(((spokenBounds[k].endSec + spokenBounds[k + 1].startSec) / 2).toFixed(3));
        spokenBounds[k].endSec = mid;
        spokenBounds[k + 1].startSec = mid;
      }
    } else {
      // Phân bổ theo trọng số ngữ âm + Bắt dính vào thung lũng năng lượng giữa các âm tiết (Syllable Dip Alignment)
      const totalSpokenWeight = spokenIndices.reduce((acc, idx) => acc + weights[idx], 0) || 1;
      const internalBoundaries: number[] = [voiceStart];
      let accumW = 0;
      for (let k = 0; k < spokenIndices.length - 1; k++) {
        accumW += weights[spokenIndices[k]];
        internalBoundaries.push(voiceStart + (accumW / totalSpokenWeight) * activeVoiceDur);
      }
      internalBoundaries.push(voiceEnd);

      // Tinh chỉnh ranh giới giữa các âm tiết dựa vào điểm lõm năng lượng (local minimum giữa 2 đỉnh nguyên âm)
      if (rmsEnvelope && numFrames > 4 && spokenIndices.length > 1) {
        const avgSyllableDur = activeVoiceDur / spokenIndices.length;
        const searchRadius = Math.min(0.085, avgSyllableDur * 0.34);

        for (let k = 1; k < internalBoundaries.length - 1; k++) {
          const expectedSec = internalBoundaries[k];
          const minSec = Math.max(internalBoundaries[k - 1] + avgSyllableDur * 0.35, expectedSec - searchRadius);
          const maxSec = Math.min(internalBoundaries[k + 1] - avgSyllableDur * 0.35, expectedSec + searchRadius);

          if (maxSec > minSec) {
            const minF = Math.max(0, Math.floor((minSec - safeStart) / hopSec));
            const maxF = Math.min(numFrames - 1, Math.ceil((maxSec - safeStart) / hopSec));
            let bestF = Math.round((expectedSec - safeStart) / hopSec);
            let bestScore = Infinity;

            for (let f = minF; f <= maxF; f++) {
              // Trung bình trượt 3 frame để mượt nhiễu
              const ePrev = rmsEnvelope[Math.max(0, f - 1)];
              const eCur = rmsEnvelope[f];
              const eNext = rmsEnvelope[Math.min(numFrames - 1, f + 1)];
              const smoothRms = (ePrev + eCur * 2 + eNext) / 4;
              const distRatio = Math.abs((safeStart + f * hopSec) - expectedSec) / Math.max(0.01, searchRadius);
              const score = smoothRms * (1 + distRatio * 0.35);
              if (score < bestScore) {
                bestScore = score;
                bestF = f;
              }
            }
            internalBoundaries[k] = Number((safeStart + bestF * hopSec).toFixed(3));
          }
        }
      }

      for (let k = 0; k < spokenIndices.length; k++) {
        spokenBounds[k] = {
          startSec: Number(internalBoundaries[k].toFixed(3)),
          endSec: Number(Math.max(internalBoundaries[k] + 0.02, internalBoundaries[k + 1]).toFixed(3))
        };
      }
    }

    // 4. Ghép vào danh sách charTimings cho toàn bộ ký tự (kể cả dấu câu)
    const charTimings: CharTimingItem[] = [];
    let spokenPtr = 0;
    for (let idx = 0; idx < chars.length; idx++) {
      const ch = chars[idx];
      const rawPy = pinyinArr[idx] || '';
      const isPunct = weights[idx] === 0;
      if (!isPunct && spokenPtr < spokenBounds.length) {
        const b = spokenBounds[spokenPtr];
        const dur = Math.max(0.03, b.endSec - b.startSec);
        charTimings.push({
          char: ch,
          pinyin: rawPy,
          isPunctuation: false,
          startSec: b.startSec,
          endSec: b.endSec,
          weight: dur
        });
        spokenPtr++;
      } else {
        // Dấu câu bám sát ngay sau âm tiết liền trước, không chiếm độ rộng sóng âm
        const anchorSec = spokenPtr > 0
          ? spokenBounds[spokenPtr - 1].endSec
          : voiceStart;
        charTimings.push({
          char: ch,
          pinyin: '',
          isPunctuation: true,
          startSec: anchorSec,
          endSec: anchorSec,
          weight: 0
        });
      }
    }

    return { voiceStart, voiceEnd, charTimings };
  }, [getSyllablePhoneticWeight]);

  // Hàm tổng hợp và đồng bộ toàn bộ danh sách câu + từng âm tiết Pinyin với sóng âm
  const computeSynchronizedSentences = useCallback((
    sentencesList: string[],
    rawDuration: number,
    decoded?: AudioBuffer | null,
    subtitles?: TtsSubtitleItem[]
  ): SentenceTimingItem[] => {
    if (!sentencesList || sentencesList.length === 0 || rawDuration <= 0) return [];
    const totalDuration = rawDuration;

    // ------------------------------------------------------------------------
    // BƯỚC 1: Nếu có WordBoundary Subtitles từ Edge Neural TTS, ánh xạ từng chữ Hán sang mốc mili-giây thực tế
    // ------------------------------------------------------------------------
    const normalizeChar = (c: string) => !/[.,!?;:\s\n\r\t，。！？、：；（）《》“”‘’"']/.test(c);

    // Trích xuất danh sách từng ký tự đọc từ subtitles (chia đều nếu 1 part gồm từ 2 chữ trở lên)
    const flatSubChars: Array<{ char: string; startSec: number; endSec: number }> = [];
    if (subtitles && subtitles.length > 0) {
      for (const item of subtitles) {
        const partChars = Array.from(item.part || '').filter(normalizeChar);
        if (partChars.length === 0) continue;
        const sSec = Math.max(0, (item.start || 0) / 1000);
        const eSec = Math.max(sSec + 0.03, (item.end || 0) / 1000);
        const step = (eSec - sSec) / partChars.length;
        partChars.forEach((ch, i) => {
          flatSubChars.push({
            char: ch,
            startSec: Number((sSec + i * step).toFixed(3)),
            endSec: Number((sSec + (i + 1) * step).toFixed(3))
          });
        });
      }
    }

    // Kiểm tra xem flatSubChars có khớp với các chữ Hán trong bài học không
    const sentenceExplicitCharMap: Array<Array<{ startSec: number; endSec: number } | null>> = [];
    let subCursor = 0;
    let matchedCount = 0;
    let totalSpokenCount = 0;

    if (flatSubChars.length > 0) {
      for (let sIdx = 0; sIdx < sentencesList.length; sIdx++) {
        const sChars = Array.from(sentencesList[sIdx]);
        const charBounds: Array<{ startSec: number; endSec: number } | null> = new Array(sChars.length).fill(null);

        for (let cIdx = 0; cIdx < sChars.length; cIdx++) {
          const ch = sChars[cIdx];
          if (!normalizeChar(ch)) continue;
          totalSpokenCount++;

          // Tìm trong cửa sổ nhỏ phía trước của flatSubChars
          let foundAt = -1;
          for (let look = subCursor; look < Math.min(flatSubChars.length, subCursor + 6); look++) {
            if (flatSubChars[look].char === ch) {
              foundAt = look;
              break;
            }
          }
          if (foundAt !== -1) {
            charBounds[cIdx] = {
              startSec: flatSubChars[foundAt].startSec,
              endSec: flatSubChars[foundAt].endSec
            };
            subCursor = foundAt + 1;
            matchedCount++;
          } else if (subCursor < flatSubChars.length) {
            charBounds[cIdx] = {
              startSec: flatSubChars[subCursor].startSec,
              endSec: flatSubChars[subCursor].endSec
            };
            subCursor++;
          }
        }
        sentenceExplicitCharMap.push(charBounds);
      }
    }

    const useSubtitles = totalSpokenCount > 0 && matchedCount >= totalSpokenCount * 0.65;

    // ------------------------------------------------------------------------
    // BƯỚC 2: Tính toán đường bao năng lượng toàn bài (Global RMS Envelope) từ AudioBuffer
    // ------------------------------------------------------------------------
    let globalVoiceStart = 0;
    let globalVoiceEnd = totalDuration;
    const hopSec = 0.01; // 10ms mỗi frame
    let globalRms: Float32Array | null = null;
    let globalFrames = 0;
    let globalSilenceThresh = 0.01;

    if (decoded && decoded.length > 0) {
      const channelData = decoded.getChannelData(0);
      const sr = decoded.sampleRate;
      const hopSamples = Math.max(1, Math.floor(hopSec * sr));
      const winSamples = Math.max(hopSamples, Math.floor(0.025 * sr));
      globalFrames = Math.max(1, Math.floor(channelData.length / hopSamples));
      globalRms = new Float32Array(globalFrames);

      let maxRms = 0;
      for (let f = 0; f < globalFrames; f++) {
        const s0 = f * hopSamples;
        const s1 = Math.min(channelData.length, s0 + winSamples);
        let sumSq = 0;
        const step = Math.max(1, Math.floor((s1 - s0) / 32));
        let cnt = 0;
        for (let s = s0; s < s1; s += step) {
          const val = channelData[s];
          sumSq += val * val;
          cnt++;
        }
        const rms = cnt > 0 ? Math.sqrt(sumSq / cnt) : 0;
        globalRms[f] = rms;
        if (rms > maxRms) maxRms = rms;
      }

      if (maxRms > 0.002) {
        const sorted = Array.from(globalRms).sort((a, b) => a - b);
        const noiseFloor = sorted[Math.floor(sorted.length * 0.15)] || 0;
        globalSilenceThresh = Math.max(noiseFloor * 2.2, maxRms * 0.055);

        let firstF = 0;
        while (firstF < globalFrames - 1 && globalRms[firstF] < globalSilenceThresh) firstF++;
        let lastF = globalFrames - 1;
        while (lastF > firstF && globalRms[lastF] < globalSilenceThresh) lastF--;

        globalVoiceStart = Math.max(0, firstF * hopSec - 0.03);
        globalVoiceEnd = Math.min(totalDuration, (lastF + 1) * hopSec + 0.04);
        if (globalVoiceEnd - globalVoiceStart < totalDuration * 0.3) {
          globalVoiceStart = 0;
          globalVoiceEnd = totalDuration;
        }
      }
    }

    // ------------------------------------------------------------------------
    // BƯỚC 3: Xác định ranh giới từng câu (refinedBoundaries)
    // ------------------------------------------------------------------------
    const refinedBoundaries: number[] = new Array(sentencesList.length + 1);
    refinedBoundaries[0] = 0;
    refinedBoundaries[sentencesList.length] = totalDuration;

    if (useSubtitles && sentenceExplicitCharMap.length === sentencesList.length) {
      // Nếu có WordBoundary: đặt vạch chia câu chính xác tại điểm lặng giữa câu i và câu i+1
      const clauseSpans = sentenceExplicitCharMap.map((charMap) => {
        const valid = charMap.filter((b): b is { startSec: number; endSec: number } => Boolean(b));
        if (valid.length === 0) return null;
        return {
          firstStart: valid[0].startSec,
          lastEnd: valid[valid.length - 1].endSec
        };
      });

      for (let i = 1; i < sentencesList.length; i++) {
        const prevSpan = clauseSpans[i - 1];
        const nextSpan = clauseSpans[i];
        if (prevSpan && nextSpan && nextSpan.firstStart >= prevSpan.lastEnd) {
          // Tìm điểm có năng lượng sóng âm thấp nhất trong khoảng nghỉ [prevSpan.lastEnd, nextSpan.firstStart]
          let boundarySec = (prevSpan.lastEnd + nextSpan.firstStart) / 2;
          if (globalRms && globalFrames > 0) {
            const f0 = Math.max(0, Math.floor(prevSpan.lastEnd / hopSec));
            const f1 = Math.min(globalFrames - 1, Math.ceil(nextSpan.firstStart / hopSec));
            let minE = Infinity;
            let bestF = Math.round(boundarySec / hopSec);
            for (let f = f0; f <= f1; f++) {
              if (globalRms[f] < minE) {
                minE = globalRms[f];
                bestF = f;
              }
            }
            boundarySec = bestF * hopSec;
          }
          refinedBoundaries[i] = Number(Math.max(refinedBoundaries[i - 1] + 0.12, Math.min(totalDuration - 0.12, boundarySec)).toFixed(2));
        } else {
          const fallbackRatio = i / sentencesList.length;
          refinedBoundaries[i] = Number((fallbackRatio * totalDuration).toFixed(2));
        }
      }
    } else {
      // Không có WordBoundary: Tính trọng số âm tiết + trọng số khoảng nghỉ dấu câu trong khoảng [globalVoiceStart, globalVoiceEnd]
      const activeSpan = Math.max(0.2, globalVoiceEnd - globalVoiceStart);
      const clauseMeta = sentencesList.map((text, idx) => {
        let pyArr: string[] = [];
        try {
          pyArr = pinyin(text, { type: 'array' });
        } catch {}
        const chars = Array.from(text);
        let speechW = 0;
        chars.forEach((ch, cIdx) => {
          speechW += getSyllablePhoneticWeight(ch, pyArr[cIdx] || '');
        });
        speechW = Math.max(0.8, speechW);

        // Trọng số khoảng lặng sau dấu câu (chỉ tính cho các câu trước câu cuối cùng)
        let pauseW = 0;
        if (idx < sentencesList.length - 1) {
          if (/[。！？.!?\n\r]/.test(text)) pauseW = 1.65;
          else if (/[；;：:]/.test(text)) pauseW = 1.25;
          else if (/[，、,]/.test(text)) pauseW = 0.95;
          else pauseW = 0.5;
        }
        return { speechW, pauseW, totalW: speechW + pauseW };
      });

      const totalW = clauseMeta.reduce((acc, m) => acc + m.totalW, 0) || 1;
      const expectedBoundaries: number[] = [0];
      let accumW = 0;
      for (let i = 0; i < clauseMeta.length - 1; i++) {
        // Đặt mốc dự kiến ngay giữa khoảng nghỉ sau câu i
        const endOfSpeechI = accumW + clauseMeta[i].speechW + clauseMeta[i].pauseW * 0.55;
        const expectedSec = globalVoiceStart + (endOfSpeechI / totalW) * activeSpan;
        expectedBoundaries.push(expectedSec);
        accumW += clauseMeta[i].totalW;
      }
      expectedBoundaries.push(totalDuration);

      // Tinh chỉnh từng ranh giới câu vào đúng thung lũng khoảng lặng (silence valley) trên sóng âm
      for (let i = 1; i < expectedBoundaries.length - 1; i++) {
        const expSec = expectedBoundaries[i];
        const prevDur = expectedBoundaries[i] - refinedBoundaries[i - 1];
        const nextDur = expectedBoundaries[i + 1] - expectedBoundaries[i];
        const searchBack = Math.min(0.85, Math.max(0.18, prevDur * 0.45));
        const searchForward = Math.min(0.85, Math.max(0.18, nextDur * 0.45));

        const minSec = Math.max(refinedBoundaries[i - 1] + 0.18, expSec - searchBack);
        const maxSec = Math.min(totalDuration - 0.18, expSec + searchForward);

        if (globalRms && globalFrames > 4 && maxSec > minSec) {
          const minF = Math.max(0, Math.floor(minSec / hopSec));
          const maxF = Math.min(globalFrames - 1, Math.ceil(maxSec / hopSec));
          let bestF = Math.round(expSec / hopSec);
          let bestScore = Infinity;

          // Cửa sổ 50ms (5 frames) để tìm thung lũng khoảng nghỉ thật sự thay vì khe hẹp ngẫu nhiên
          const halfWin = 2;
          for (let f = minF; f <= maxF; f++) {
            let sumE = 0;
            let count = 0;
            for (let k = Math.max(0, f - halfWin); k <= Math.min(globalFrames - 1, f + halfWin); k++) {
              sumE += globalRms[k];
              count++;
            }
            const winRms = count > 0 ? sumE / count : globalRms[f];
            const distSec = Math.abs(f * hopSec - expSec);
            const distPenalty = 1 + (distSec / Math.max(0.15, searchBack + searchForward)) * 0.75;

            // Ưu tiên mạnh những vùng thực sự im lặng (dưới ngưỡng globalSilenceThresh)
            const silenceBonus = winRms <= globalSilenceThresh * 1.25 ? 0.35 : 1.0;
            const score = winRms * distPenalty * silenceBonus;

            if (score < bestScore) {
              bestScore = score;
              bestF = f;
            }
          }
          refinedBoundaries[i] = Number((bestF * hopSec).toFixed(2));
        } else {
          refinedBoundaries[i] = Number(expSec.toFixed(2));
        }
      }
    }

    // ------------------------------------------------------------------------
    // BƯỚC 4: Tính toán chi tiết [voiceStart, voiceEnd] và vị trí từng âm tiết Pinyin cho mỗi câu
    // ------------------------------------------------------------------------
    const segments: SentenceTimingItem[] = [];
    for (let i = 0; i < sentencesList.length; i++) {
      const start = Number(refinedBoundaries[i].toFixed(2));
      const end = Number(Math.max(start + 0.08, refinedBoundaries[i + 1]).toFixed(2));
      const text = sentencesList[i];
      let pinyinText = '';
      try {
        pinyinText = pinyin(text);
      } catch {
        pinyinText = '';
      }

      const explicitMap = useSubtitles ? sentenceExplicitCharMap[i] : undefined;
      const { voiceStart, voiceEnd, charTimings } = computeClauseSyllableAlignment(
        start,
        end,
        text,
        decoded,
        explicitMap
      );

      segments.push({
        start,
        end,
        voiceStart,
        voiceEnd,
        text,
        pinyinText,
        charTimings
      });
    }
    return segments;
  }, [computeClauseSyllableAlignment, getSyllablePhoneticWeight]);

  // Compute sentence time segments using phonetic weighting + silence valley detection + TTS WordBoundary
  const sentenceTimings = useMemo(() => {
    if (!isReady || lessonSentences.length === 0 || duration <= 0) return [];
    const wsDur = wavesurferRef.current?.getDuration() || 0;
    const totalDuration = wsDur > 0 ? wsDur : duration;
    if (totalDuration <= 0) return [];
    const decoded = wavesurferRef.current?.getDecodedData();
    return computeSynchronizedSentences(lessonSentences, totalDuration, decoded, ttsSubtitles);
  }, [lessonSentences, duration, isReady, audioUrl, ttsSubtitles, computeSynchronizedSentences]);

  const sentenceTimingsRef = useRef<SentenceTimingItem[]>([]);
  sentenceTimingsRef.current = sentenceTimings;

  // Cấu hình DOM element của region: cân giữa chữ Hán và Pinyin ở chính giữa từng vùng sóng âm tương ứng, tự động co vừa khung vùng sóng
  const configureRegionElement = useCallback((reg: Region | null | undefined) => {
    if (!reg || !reg.element) return;
    reg.element.style.pointerEvents = 'none';
    reg.element.style.cursor = 'crosshair';
    reg.element.style.overflow = 'hidden';

    const applyContentStyle = () => {
      if (!reg.element) return;
      const isNone = textOverlayModeRef.current === 'none';
      const contentEl = reg.element.querySelector<HTMLElement>('[part*="region-content"]');
      if (contentEl) {
        contentEl.setAttribute('data-mode', textOverlayModeRef.current);
        if (isNone) {
          contentEl.innerHTML = '';
          contentEl.style.setProperty('display', 'none', 'important');
          contentEl.style.setProperty('visibility', 'hidden', 'important');
          contentEl.style.setProperty('opacity', '0', 'important');
          contentEl.style.setProperty('width', '0px', 'important');
          contentEl.style.setProperty('height', '0px', 'important');
          contentEl.style.setProperty('overflow', 'hidden', 'important');
          contentEl.style.setProperty('pointer-events', 'none', 'important');
          return;
        }
        contentEl.style.setProperty('visibility', 'visible', 'important');
        contentEl.style.setProperty('opacity', '1', 'important');
        contentEl.style.pointerEvents = 'none';
        contentEl.style.position = 'absolute';
        contentEl.style.top = '32px';
        contentEl.style.left = '50%';
        contentEl.style.right = 'auto';
        contentEl.style.width = 'max-content';
        contentEl.style.height = 'auto';
        contentEl.style.maxWidth = 'none';
        contentEl.style.marginTop = '0px';
        contentEl.style.marginLeft = '0px';
        contentEl.style.setProperty('display', 'flex', 'important');
        contentEl.style.alignItems = 'flex-end';
        contentEl.style.justifyContent = 'center';
        contentEl.style.boxSizing = 'border-box';
        contentEl.style.padding = '0 2px';
        contentEl.style.whiteSpace = 'nowrap';
        contentEl.style.overflow = 'visible';
        contentEl.style.transformOrigin = 'top center';

        const badge = contentEl.classList.contains('region-badge-content')
          ? contentEl
          : contentEl.querySelector<HTMLElement>('.region-badge-content');

        if (badge && badge !== contentEl) {
          badge.style.setProperty('display', 'flex', 'important');
          badge.style.flexDirection = 'row';
          badge.style.flexWrap = 'nowrap';
          badge.style.alignItems = 'flex-end';
          badge.style.justifyContent = 'center';
          badge.style.gap = '0px';
          badge.style.width = 'max-content';
          badge.style.minWidth = 'max-content';
          badge.style.maxWidth = 'none';
          badge.style.marginLeft = '0';
          badge.style.flexGrow = '0';
          badge.style.flexShrink = '0';
          badge.style.boxSizing = 'border-box';
          badge.style.whiteSpace = 'nowrap';
          badge.style.overflow = 'visible';
        }

        // Tự động tính tỷ lệ scale nếu câu dài hơn chiều rộng pixel của vùng sóng để không bao giờ tràn/đè qua vạch xanh
        const ws = wavesurferRef.current;
        const totalDur = ws?.getDuration() || duration || 1;
        const regDur = Math.max(0.05, reg.end - reg.start);
        const wrapperW = waveformScrollWidthRef.current || (totalDur * zoomLevelRef.current);
        const elemW = reg.element.clientWidth || ((regDur / Math.max(0.01, totalDur)) * wrapperW);
        const targetBadge = badge || contentEl;
        const naturalW = targetBadge.scrollWidth || targetBadge.offsetWidth || 0;

        if (elemW > 0 && naturalW > 0) {
          const availW = Math.max(14, elemW - 8);
          const scale = naturalW > availW
            ? Math.max(0.42, Math.min(1, availW / naturalW))
            : 1;
          contentEl.style.setProperty('transform', `translateX(-50%) scale(${scale.toFixed(3)})`, 'important');
        } else {
          contentEl.style.setProperty('transform', 'translateX(-50%)', 'important');
        }
      }
    };
    applyContentStyle();
    requestAnimationFrame(applyContentStyle);
    setTimeout(applyContentStyle, 35);

    const handles = reg.element.querySelectorAll<HTMLElement>('[part*="region-handle"], [part*="handle"]');
    handles.forEach(h => {
      h.style.pointerEvents = 'all';
      h.style.cursor = 'ew-resize';
      h.style.width = '10px';
      h.style.zIndex = '30';
    });
  }, [duration]);

  // Tạo DOM hiển thị Pinyin + Chữ Hán cân giữa tại từng vùng sóng âm tương ứng
  const buildSentenceBadgeDOM = useCallback((sent: SentenceTimingItem, idx: number): HTMLDivElement => {
    const mode = textOverlayModeRef.current;
    const isHanziVisible = mode === 'both' || mode === 'hanzi';
    const isPinyinVisible = mode === 'both' || mode === 'pinyin';
    const isNoneMode = mode === 'none';

    // Wrapper ngoài sẽ nhận part="region-content" từ WaveSurfer RegionsPlugin
    const wrapperEl = document.createElement('div');
    wrapperEl.className = 'region-content-wrapper';
    wrapperEl.setAttribute('data-mode', mode);

    // Nếu ở chế độ 'none' (Ẩn cả 2 - mặc định): KHÔNG tạo bất kỳ DOM chữ Hán hay Pinyin nào để đảm bảo ẩn tuyệt đối 100%
    if (isNoneMode) {
      wrapperEl.style.setProperty('display', 'none', 'important');
      wrapperEl.style.setProperty('visibility', 'hidden', 'important');
      wrapperEl.style.setProperty('opacity', '0', 'important');
      wrapperEl.style.setProperty('width', '0px', 'important');
      wrapperEl.style.setProperty('height', '0px', 'important');
      wrapperEl.style.setProperty('overflow', 'hidden', 'important');
      wrapperEl.style.setProperty('pointer-events', 'none', 'important');
      return wrapperEl;
    }

    const sentText = sent.text || `#${idx + 1}`;
    const decoded = wavesurferRef.current?.getDecodedData();

    const alignment = (sent.charTimings && sent.charTimings.length > 0 && sent.voiceStart !== undefined && sent.voiceEnd !== undefined)
      ? { voiceStart: sent.voiceStart, voiceEnd: sent.voiceEnd, charTimings: sent.charTimings }
      : computeClauseSyllableAlignment(sent.start, sent.end, sentText, decoded);

    wrapperEl.style.setProperty('display', 'flex', 'important');
    wrapperEl.style.setProperty('visibility', 'visible', 'important');
    wrapperEl.style.setProperty('opacity', '1', 'important');
    wrapperEl.style.alignItems = 'flex-end';
    wrapperEl.style.justifyContent = 'center';
    wrapperEl.style.width = 'max-content';
    wrapperEl.style.minWidth = 'max-content';
    wrapperEl.style.maxWidth = 'none';
    wrapperEl.style.pointerEvents = 'none';
    wrapperEl.style.whiteSpace = 'nowrap';
    wrapperEl.style.overflow = 'visible';

    const badgeContent = document.createElement('div');
    badgeContent.className = 'region-badge-content';
    badgeContent.style.setProperty('display', 'flex', 'important');
    badgeContent.style.flexDirection = 'row';
    badgeContent.style.flexWrap = 'nowrap';
    badgeContent.style.alignItems = 'flex-end';
    badgeContent.style.justifyContent = 'center';
    badgeContent.style.textAlign = 'center';
    badgeContent.style.lineHeight = '1.1';
    badgeContent.style.width = 'max-content';
    badgeContent.style.minWidth = 'max-content';
    badgeContent.style.maxWidth = 'none';
    badgeContent.style.marginLeft = '0';
    badgeContent.style.flexGrow = '0';
    badgeContent.style.flexShrink = '0';
    badgeContent.style.boxSizing = 'border-box';
    badgeContent.style.padding = '0 2px';
    badgeContent.style.pointerEvents = 'none';
    badgeContent.style.gap = '0px';
    badgeContent.style.whiteSpace = 'nowrap';
    badgeContent.style.overflow = 'visible';

    // Nhóm các ký tự thành từng từ (word group) giống hệt phần Phân tích và đọc văn bản (TextReader)
    const charTimings = alignment.charTimings;
    const knownCompoundWords = new Set<string>([
      '你好', '您好', '李华', '王明', '大卫', '玛丽', '中国', '美国', '英国', '日本', '韩国', '越南',
      '留学生', '学生', '老师', '同学', '朋友', '同事', '先生', '小姐', '医生', '医院', '学校', '大学',
      '今年', '明年', '去年', '今天', '明天', '昨天', '现在', '时候', '时间', '上午', '下午', '晚上', '早上', '中午',
      '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十', '十几',
      '什么', '怎么', '怎么样', '哪里', '哪儿', '多少', '几个', '这个', '那个', '这些', '那些', '这里', '那里', '这儿', '那儿',
      '我们', '你们', '他们', '她们', '它们', '大家', '自己',
      '喜欢', '高兴', '认识', '知道', '觉得', '希望', '可以', '应该', '需要', '帮助', '准备', '开始', '已经',
      '学习', '工作', '汉语', '中文', '汉字', '发音', '意思', '问题', '名字', '身体', '天气', '生日', '快乐',
      '爸爸', '妈妈', '哥哥', '姐姐', '弟弟', '妹妹', '儿子', '女儿', '丈夫', '妻子', '家人',
      '北京', '上海', '广州', '深圳', '香港', '台湾',
      '因为', '所以', '虽然', '但是', '如果', '或者', '还是', '而且', '不过',
      '非常', '漂亮', '好看', '好吃', '好喝', '好玩', '一点儿', '一下', '一起',
      '谢谢', '不客气', '对不起', '没关系', '再见', '请问',
      '米饭', '水果', '苹果', '杯子', '桌子', '椅子', '电脑', '电视', '电影', '手机', '飞机', '出租车', '火车站',
      '打电话', '踢足球', '打篮球', '游泳', '跑步', '唱歌', '跳舞', '旅游', '买东西', '看书', '做饭', '睡觉', '起床'
    ]);

    if (lessonTokensRef.current && lessonTokensRef.current.length > 0) {
      lessonTokensRef.current.forEach((tok) => {
        const w = (tok.text || '').trim();
        if (w.length >= 2 && /^[\u4e00-\u9fa5]+$/.test(w)) {
          knownCompoundWords.add(w);
        }
      });
    }
    if (ttsSubtitlesRef.current && ttsSubtitlesRef.current.length > 0) {
      ttsSubtitlesRef.current.forEach((sub) => {
        const w = (sub.part || '').trim();
        if (w.length >= 2 && w.length <= 4 && /^[\u4e00-\u9fa5]+$/.test(w)) {
          knownCompoundWords.add(w);
        }
      });
    }

    const nonMergedPairs = new Set<string>(['我是', '你是', '他是', '她是', '也是', '我叫', '你叫', '他叫', '她叫', '是中']);
    try {
      if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        const seg = new (Intl as any).Segmenter('zh-CN', { granularity: 'word' });
        for (const item of seg.segment(sentText)) {
          const w = (item.segment || '').trim();
          if (w.length >= 2 && w.length <= 4 && /^[\u4e00-\u9fa5]+$/.test(w) && !nonMergedPairs.has(w)) {
            knownCompoundWords.add(w);
          }
        }
      }
    } catch {}

    const wordGroups: CharTimingItem[][] = [];
    let cIdx = 0;
    while (cIdx < charTimings.length) {
      const current = charTimings[cIdx];
      if (current.isPunctuation) {
        wordGroups.push([current]);
        cIdx++;
        continue;
      }
      let matchedLen = 1;
      const maxLen = Math.min(5, charTimings.length - cIdx);
      for (let len = maxLen; len >= 2; len--) {
        const slice = charTimings.slice(cIdx, cIdx + len);
        if (slice.some(item => item.isPunctuation)) continue;
        const candidateWord = slice.map(item => item.char).join('');
        if (knownCompoundWords.has(candidateWord) && !nonMergedPairs.has(candidateWord)) {
          matchedLen = len;
          break;
        }
      }
      wordGroups.push(charTimings.slice(cIdx, cIdx + matchedLen));
      cIdx += matchedLen;
    }

    wordGroups.forEach((group) => {
      const isPunctGroup = group.every(c => c.isPunctuation);
      const spokenItems = group.filter(c => !c.isPunctuation);
      const isCompound = spokenItems.length > 1;
      const startSec = spokenItems.length > 0 ? spokenItems[0].startSec : -1;
      const endSec = spokenItems.length > 0 ? spokenItems[spokenItems.length - 1].endSec : -1;
      const wordText = group.map(c => c.char).join('');
      const wordPinyin = spokenItems.map(c => c.pinyin).filter(Boolean).join(' ');
      const isSavedWord = !isPunctGroup && savedWordsRef.current.some(w => w.text === wordText && !w.isKnown);
      const isSelectedWord = !isPunctGroup && wordContextMenuRef.current?.token.text === wordText;
      const isSpeakingWord = !isPunctGroup && activeSpeakingWordRef.current === wordText;
      const isMispronouncedWord = !isPunctGroup && (
        mispronouncedWordsRef.current.some(w => wordText.includes(w) || w.includes(wordText)) ||
        contextMispronouncedRef.current.some(w => wordText.includes(w) || w.includes(wordText))
      );

      const wordCol = document.createElement('div');
      let colClasses = isPunctGroup ? 'region-char-col region-punct-col' : 'region-char-col';
      if (isSavedWord) colClasses += ' saved-char-col';
      if (isSelectedWord) colClasses += ' selected-char-col';
      if (isSpeakingWord) colClasses += ' active-char-col';
      if (isMispronouncedWord) colClasses += ' mispronounced-char-col';
      wordCol.className = colClasses;
      wordCol.setAttribute('data-start', startSec >= 0 ? startSec.toFixed(3) : '-1');
      wordCol.setAttribute('data-end', endSec >= 0 ? endSec.toFixed(3) : '-1');
      wordCol.setAttribute('data-word', wordText);
      wordCol.setAttribute('data-pinyin', wordPinyin);
      wordCol.style.display = 'inline-flex';
      wordCol.style.flexDirection = 'column';
      wordCol.style.alignItems = 'center';
      wordCol.style.justifyContent = 'flex-end';
      wordCol.style.flex = '0 0 auto';
      wordCol.style.width = 'max-content';
      wordCol.style.minWidth = 'max-content';
      wordCol.style.flexGrow = '0';
      wordCol.style.flexShrink = '0';
      wordCol.style.textAlign = 'center';
      wordCol.style.padding = isPunctGroup ? '2px 0px' : '2px 4px';
      wordCol.style.borderRadius = '8px';
      wordCol.style.border = '1px solid transparent';
      wordCol.style.transformOrigin = 'bottom center';
      wordCol.style.pointerEvents = isPunctGroup ? 'none' : 'auto';
      wordCol.style.cursor = isPunctGroup ? 'default' : 'pointer';

      if (!isPunctGroup && /[\u4e00-\u9fa5]/.test(wordText)) {
        wordCol.addEventListener('mouseenter', () => {
          wordCol.classList.add('hover-char-col');
        });
        wordCol.addEventListener('mouseleave', () => {
          wordCol.classList.remove('hover-char-col');
        });
        wordCol.addEventListener('mousedown', (ev: MouseEvent) => {
          if ((ev.button === 0 && !ev.shiftKey) || ev.button === 2) {
            ev.stopPropagation();
          }
        });
        wordCol.addEventListener('click', (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          handleWordColInteractRef.current(wordCol, wordText, wordPinyin, 'info', ev.clientX, ev.clientY);
        });
        wordCol.addEventListener('contextmenu', (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          handleWordColInteractRef.current(wordCol, wordText, wordPinyin, 'tools', ev.clientX, ev.clientY);
        });
      }

      const charsRow = document.createElement('div');
      charsRow.className = 'region-word-chars-row';
      charsRow.style.display = 'flex';
      charsRow.style.flexDirection = 'row';
      charsRow.style.alignItems = 'flex-end';
      charsRow.style.justifyContent = 'center';
      charsRow.style.gap = '0px';

      group.forEach((ct) => {
        const charUnit = document.createElement('div');
        charUnit.className = 'region-char-unit';
        charUnit.style.display = 'flex';
        charUnit.style.flexDirection = 'column';
        charUnit.style.alignItems = 'center';
        charUnit.style.justifyContent = 'flex-end';

        // 1. PINYIN Ở TRÊN ĐẦU (Chỉ tạo khi chế độ hiển thị có Pinyin)
        if (isPinyinVisible) {
          const pinyinSpan = document.createElement('span');
          pinyinSpan.className = 'region-badge-pinyin';
          pinyinSpan.textContent = ct.isPunctuation ? '' : ct.pinyin;
          pinyinSpan.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
          pinyinSpan.style.fontWeight = '500';
          pinyinSpan.style.fontSize = '13px';
          pinyinSpan.style.letterSpacing = '0.025em';
          pinyinSpan.style.color = isSavedWord ? '#f97316' : (isCompound ? '#0f172a' : '#1e293b');
          pinyinSpan.style.textAlign = 'center';
          pinyinSpan.style.whiteSpace = 'nowrap';
          pinyinSpan.style.height = '20px';
          pinyinSpan.style.maxHeight = '20px';
          pinyinSpan.style.marginBottom = '2px';
          pinyinSpan.style.padding = ct.isPunctuation ? '0px' : '0 2px';
          pinyinSpan.style.transformOrigin = 'bottom center';
          pinyinSpan.style.setProperty('display', 'flex', 'important');
          pinyinSpan.style.alignItems = 'center';
          pinyinSpan.style.justifyContent = 'center';
          charUnit.appendChild(pinyinSpan);
        }

        // 2. CHỮ HÁN Ở DƯỚI (Chỉ tạo khi chế độ hiển thị có Chữ Hán)
        if (isHanziVisible) {
          const hanziSpan = document.createElement('span');
          hanziSpan.className = 'region-badge-hanzi';
          hanziSpan.textContent = ct.char;
          hanziSpan.style.fontFamily = '"Microsoft YaHei", "微软雅黑", sans-serif';
          hanziSpan.style.fontWeight = '700';
          hanziSpan.style.fontSize = '24px';
          hanziSpan.style.letterSpacing = '-0.05em';
          hanziSpan.style.color = isSavedWord ? '#f97316' : (isCompound ? '#0f172a' : '#1e293b');
          hanziSpan.style.textAlign = 'center';
          hanziSpan.style.whiteSpace = 'nowrap';
          hanziSpan.style.lineHeight = '1';
          hanziSpan.style.setProperty('display', 'block', 'important');
          charUnit.appendChild(hanziSpan);
        }

        charsRow.appendChild(charUnit);
      });

      wordCol.appendChild(charsRow);
      badgeContent.appendChild(wordCol);
    });

    wrapperEl.appendChild(badgeContent);
    return wrapperEl;
  }, [computeClauseSyllableAlignment]);

  // Hàm tạo và đồng bộ sẵn từng vùng của sóng âm tương ứng với mỗi câu
  const syncAllSentenceRegions = useCallback((
    sentencesToRender?: SentenceTimingItem[],
    highlightIndex?: number | null
  ) => {
    const ws = wavesurferRef.current;
    const wsRegions = regionsPluginRef.current;
    if (!ws || !wsRegions) return;
    // Bắt buộc phải lấy thời lượng thực từ WaveSurfer đã giải mã (> 0) để tránh RegionsPlugin kẹp start=0, end=0
    const totalDur = ws.getDuration();
    if (!Number.isFinite(totalDur) || totalDur <= 0) return;

    if (!showSentenceTrackRef.current) {
      const existing = wsRegions.getRegions().slice();
      existing.forEach(r => {
        if (r.id.startsWith('sentence-region-')) {
          r.remove();
        }
      });
      return;
    }

    const list = sentencesToRender || (customSentencesRef.current.length > 0 ? customSentencesRef.current : sentenceTimingsRef.current);
    if (!list || list.length === 0) return;

    // Loại bỏ ngay mọi region bị trùng ID hoặc bị co về 0s (marker) do khởi tạo sớm
    const seenIds = new Set<string>();
    wsRegions.getRegions().slice().forEach(r => {
      if (r.id.startsWith('sentence-region-')) {
        const regTotal = (r as any).totalDuration;
        if (seenIds.has(r.id) || r.end <= r.start + 0.01 || (regTotal && Math.abs(regTotal - totalDur) > 0.05)) {
          r.remove();
        } else {
          seenIds.add(r.id);
        }
      }
    });

    const activeIdx = highlightIndex !== undefined ? highlightIndex : activeSentenceIndexRef.current;
    const existingRegions = wsRegions.getRegions();
    const isNoneMode = textOverlayModeRef.current === 'none';

    list.forEach((sent, idx) => {
      const regionId = `sentence-region-${idx}`;
      const existing = existingRegions.find(r => r.id === regionId);
      const isActive = idx === activeIdx;

      const regionColor = isActive 
        ? 'rgba(59, 130, 246, 0.28)' 
        : 'rgba(255, 255, 255, 0)';

      const badgeContent = buildSentenceBadgeDOM(sent, idx);

      if (existing) {
        (existing as any).totalDuration = totalDur;
        existing.setOptions({
          start: sent.start,
          end: sent.end,
          color: regionColor,
          drag: false,
          resize: true,
          content: badgeContent
        });
        const isLast = idx === list.length - 1;
        if (existing.element) {
          if (isActive) {
            existing.element.classList.add('active-sentence-region');
          } else {
            existing.element.classList.remove('active-sentence-region');
          }
          if (isLast) {
            existing.element.classList.add('is-last-sentence-region');
          } else {
            existing.element.classList.remove('is-last-sentence-region');
          }
          const contentEl = existing.element.querySelector('[part*="region-content"]') as HTMLElement | null;
          if (contentEl) {
            contentEl.style.setProperty('display', isNoneMode ? 'none' : 'flex', 'important');
          }
        }
        configureRegionElement(existing);
        if (isActive && (!activeRegionRef.current || activeRegionRef.current.id.startsWith('sentence-region-'))) {
          activeRegionRef.current = existing;
        }
      } else {
        const newRegion = wsRegions.addRegion({
          id: regionId,
          start: sent.start,
          end: sent.end,
          color: regionColor,
          drag: false,
          resize: true,
          content: badgeContent
        });
        const isLast = idx === list.length - 1;
        if (newRegion.element) {
          if (isActive) {
            newRegion.element.classList.add('active-sentence-region');
          } else {
            newRegion.element.classList.remove('active-sentence-region');
          }
          if (isLast) {
            newRegion.element.classList.add('is-last-sentence-region');
          } else {
            newRegion.element.classList.remove('is-last-sentence-region');
          }
          const contentEl = newRegion.element.querySelector('[part*="region-content"]') as HTMLElement | null;
          if (contentEl) {
            contentEl.style.setProperty('display', isNoneMode ? 'none' : 'flex', 'important');
          }
        }
        configureRegionElement(newRegion);
        if (isActive && (!activeRegionRef.current || activeRegionRef.current.id.startsWith('sentence-region-'))) {
          activeRegionRef.current = newRegion;
        }
      }
    });

    // Dọn dẹp regions thừa nếu số lượng câu giảm
    wsRegions.getRegions().slice().forEach(r => {
      const match = r.id.match(/^sentence-region-(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx >= list.length) {
          r.remove();
        }
      }
    });
  }, [buildSentenceBadgeDOM, configureRegionElement]);

  const syncAllSentenceRegionsRef = useRef(syncAllSentenceRegions);
  syncAllSentenceRegionsRef.current = syncAllSentenceRegions;

  // Khởi tạo và đồng bộ customSentences khi nạp bài đọc mới hoặc khi giải mã xong sóng âm
  useEffect(() => {
    if (isReady && sentenceTimings && sentenceTimings.length > 0) {
      setCustomSentences(sentenceTimings);
      customSentencesRef.current = sentenceTimings;
      if (wavesurferRef.current && regionsPluginRef.current && showSentenceTrackRef.current) {
        syncAllSentenceRegions(sentenceTimings, activeSentenceIndexRef.current);
      }
    }
  }, [isReady, sentenceTimings, syncAllSentenceRegions]);

  // Khi thay đổi chế độ hiển thị chữ Hán & Pinyin hoặc danh sách từ vựng trên dải sóng âm
  useEffect(() => {
    if (wavesurferRef.current && regionsPluginRef.current) {
      syncAllSentenceRegions();
    }
  }, [textOverlayMode, lessonTokens, syncAllSentenceRegions]);

  // Khi bấm ẩn/hiện dải câu: tự động dọn sạch hoặc khôi phục các vùng chia sẵn trên sóng âm
  useEffect(() => {
    showSentenceTrackRef.current = showSentenceTrack;
    const wsRegions = regionsPluginRef.current;
    if (!showSentenceTrack) {
      // Ẩn dải câu: xóa bỏ các vùng tách câu trên sóng âm, đưa sóng về dạng liền mạch
      if (wsRegions) {
        const existing = wsRegions.getRegions();
        existing.forEach(r => {
          if (r.id.startsWith('sentence-region-')) {
            r.remove();
          }
        });
      }
      activeRegionRef.current = null;
      setSelectedRegion(null);
      if (selectedRegionRef.current) selectedRegionRef.current = null;
      activeSentenceIndexRef.current = null;
      setActiveSentenceIndex(null);
    } else {
      // Hiện dải câu: chia sẵn lại từng vùng tương ứng với mỗi câu
      const currentList = customSentencesRef.current.length > 0 ? customSentencesRef.current : sentenceTimingsRef.current;
      if (currentList && currentList.length > 0 && wavesurferRef.current && wsRegions) {
        syncAllSentenceRegions(currentList, activeSentenceIndexRef.current);
      }
    }
  }, [showSentenceTrack, syncAllSentenceRegions]);

  useEffect(() => {
    customSentencesRef.current = customSentences;
  }, [customSentences]);

  useEffect(() => {
    activeSentenceIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  // Lưu trạng thái hiện tại vào stack trước khi thay đổi (cho Ctrl+Z)
  const pushHistory = useCallback((description?: string) => {
    const currentSentences = customSentencesRef.current.length > 0 
      ? customSentencesRef.current 
      : sentenceTimingsRef.current;

    const snapshot: EditorSnapshot = {
      sentences: (currentSentences || []).map(s => ({ ...s })),
      activeIndex: activeSentenceIndexRef.current,
      selectedRegion: selectedRegionRef.current ? { ...selectedRegionRef.current } : null,
      currentTime: wavesurferRef.current?.getCurrentTime() || 0,
      description
    };

    historyStackRef.current.push(snapshot);
    if (historyStackRef.current.length > 50) {
      historyStackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  // Thực hiện hoàn tác (Ctrl + Z)
  const handleUndo = useCallback(() => {
    if (historyStackRef.current.length === 0) {
      showToast('⚠️ Không có thao tác nào để hoàn tác (Ctrl+Z)');
      return;
    }

    const previousState = historyStackRef.current.pop();
    if (!previousState) return;

    setCanUndo(historyStackRef.current.length > 0);

    const restoredSentences = (previousState.sentences || []).map(s => ({ ...s }));
    if (restoredSentences.length > 0) {
      setCustomSentences(restoredSentences);
      customSentencesRef.current = restoredSentences;
    }

    const restoredIdx = previousState.activeIndex;
    setActiveSentenceIndex(restoredIdx);
    activeSentenceIndexRef.current = restoredIdx;

    if (restoredSentences.length > 0) {
      syncAllSentenceRegions(restoredSentences, restoredIdx);
    }

    if (restoredIdx !== null && restoredSentences[restoredIdx]) {
      const seg = restoredSentences[restoredIdx];
      const rObj = {
        start: seg.start,
        end: seg.end,
        duration: Number((seg.end - seg.start).toFixed(2))
      };
      setSelectedRegion(rObj);
      selectedRegionRef.current = rObj;
      wavesurferRef.current?.setTime(seg.start);
      setCurrentTime(seg.start);
    } else if (previousState.selectedRegion) {
      setSelectedRegion(previousState.selectedRegion);
      selectedRegionRef.current = previousState.selectedRegion;
      wavesurferRef.current?.setTime(previousState.selectedRegion.start);
      setCurrentTime(previousState.selectedRegion.start);
    } else {
      setSelectedRegion(null);
      selectedRegionRef.current = null;
      if (previousState.currentTime !== undefined) {
        wavesurferRef.current?.setTime(previousState.currentTime);
        setCurrentTime(previousState.currentTime);
      }
    }

    showToast(`↩️ Đã hoàn tác: ${previousState.description || 'Thao tác trước'} (Ctrl+Z)`);
  }, [showToast, syncAllSentenceRegions]);

  // Đo đạc và đồng bộ chiều rộng chính xác giữa sóng âm và dải phân đoạn câu
  useEffect(() => {
    const updateWidth = () => {
      const scrollEl = waveformRef.current?.querySelector('[part="scroll"]') as HTMLElement | null;
      if (scrollEl) {
        const wrapperEl = scrollEl.querySelector('[part="wrapper"]') as HTMLElement | null;
        const w = wrapperEl?.offsetWidth || scrollEl.scrollWidth || scrollEl.clientWidth;
        if (w > 0) waveformScrollWidthRef.current = w;
      }
    };

    updateWidth();
    const t1 = setTimeout(updateWidth, 80);
    const t2 = setTimeout(updateWidth, 250);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateWidth);
    };
  }, [zoomLevel, isReady, duration]);

  // Đồng bộ cuộn ngang siêu mượt 60fps giữa sóng âm và thanh trượt màu xám
  useEffect(() => {
    const scrollEl = getScrollEl();
    if (!scrollEl) return;

    const onWaveScroll = () => {
      if (isDraggingThumbRef.current) return;
      updateScrollThumbDOM(scrollEl.scrollLeft, scrollEl.scrollWidth, scrollEl.clientWidth);
      scheduleScrollMetricsUpdate();
    };

    scrollEl.addEventListener('scroll', onWaveScroll, { passive: true });
    window.addEventListener('resize', scheduleScrollMetricsUpdate);
    updateScrollMetrics();

    return () => {
      scrollEl.removeEventListener('scroll', onWaveScroll);
      window.removeEventListener('resize', scheduleScrollMetricsUpdate);
    };
  }, [isReady, getScrollEl, updateScrollThumbDOM, scheduleScrollMetricsUpdate, updateScrollMetrics]);

  // Resolve voice object and human-friendly display name
  const activeVoiceObj = useMemo(() => {
    if (availableVoices && availableVoices.length > 0) {
      const found = availableVoices.find(v => v.uri === activeVoiceUri || v.name === activeVoiceUri);
      if (found) return found;
    }
    return null;
  }, [availableVoices, activeVoiceUri]);

  const displayVoiceName = useMemo(() => {
    if (activeVoiceObj) {
      return `${activeVoiceObj.name} (${activeVoiceObj.gender})`;
    }
    if (selectedVoiceName) {
      return `${selectedVoiceName} (${selectedVoiceGender || 'Giọng chuẩn'})`;
    }
    const lower = (activeVoiceUri || selectedVoice || '').toLowerCase();
    if (lower.includes('yunxi') || lower.includes('nam') || lower.includes('male') || lower.includes('puck')) {
      return '云希 Online (Natural) - Chinese (Mandarin, Simplified) (Nam)';
    }
    return '晓晓 Online (Natural) - Chinese (Mandarin, Simplified) (Nữ)';
  }, [activeVoiceObj, selectedVoiceName, selectedVoiceGender, activeVoiceUri, selectedVoice]);

  // Load and synthesize the lesson passage audio using the active voice
  const loadLessonAudio = useCallback(async (textToSpeak: string, voiceOverride?: string) => {
    if (!textToSpeak || !textToSpeak.trim()) {
      setAudioUrl(initialAudioUrl);
      setAudioSourceType('sample');
      return;
    }

    const clean = textToSpeak.trim();
    const voiceCandidate = (voiceOverride || activeVoiceUri || selectedVoice || '').toLowerCase();
    const effectiveVoice = (voiceCandidate.includes('yunxi') || voiceCandidate.includes('nam') || voiceCandidate.includes('male') || voiceCandidate.includes('puck'))
      ? 'zh-CN-YunxiNeural'
      : 'zh-CN-XiaoxiaoNeural';
    const effectiveVoiceName = effectiveVoice === 'zh-CN-YunxiNeural'
      ? '云希 Online (Natural) - Chinese (Mandarin, Simplified)'
      : '晓晓 Online (Natural) - Chinese (Mandarin, Simplified)';
    const cacheKey = `v5_edge_neural:${effectiveVoice}:${clean}`;

    // Xóa customSentences cũ khi chuyển bài hoặc đổi giọng đọc để luôn đồng bộ mới với sóng âm
    setCustomSentences([]);
    customSentencesRef.current = [];

    // 1. If valid initialAudioUrl is passed from parent and no override requested, use it
    if (initialAudioUrl && initialAudioUrl !== '/sample-lesson.mp3' && !voiceOverride) {
      setTtsSubtitles([]);
      ttsSubtitlesRef.current = [];
      setAudioUrl(initialAudioUrl);
      setAudioSourceType('lesson');
      setTrackName(lessonTitle ? `Track 1 - ${lessonTitle}` : 'Track 1 - Đoạn văn bài học');
      return;
    }

    // 2. Check client-side in-memory cache
    if (clientAudioBlobCache.has(cacheKey)) {
      const cached = clientAudioBlobCache.get(cacheKey)!;
      setTtsSubtitles(cached.subtitles || []);
      ttsSubtitlesRef.current = cached.subtitles || [];
      setAudioUrl(cached.blobUrl);
      setAudioSourceType('lesson');
      setTrackName(lessonTitle ? `Track 1 - ${lessonTitle}` : 'Track 1 - Đoạn văn bài học');
      showToast(`🎵 Đã nạp audio: ${effectiveVoiceName}`);
      return;
    }

    setIsLoadingAudio(true);
    setAudioError(null);
    showToast(`🎙️ Đang nạp giọng đọc: ${effectiveVoiceName}...`);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: effectiveVoice })
      });

      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã ${res.status}`);
      }

      const data = await res.json();
      if (data.audioBase64) {
        // Convert base64 to binary ArrayBuffer and create a local Blob URL
        const binaryString = atob(data.audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const blobUrl = URL.createObjectURL(audioBlob);
        const subs: TtsSubtitleItem[] = Array.isArray(data.subtitles) ? data.subtitles : [];

        // Store into cache for lightning-fast re-entry
        clientAudioBlobCache.set(cacheKey, { blobUrl, subtitles: subs });
        setTtsSubtitles(subs);
        ttsSubtitlesRef.current = subs;
        setAudioUrl(blobUrl);
        setAudioSourceType('lesson');
        setTrackName(lessonTitle ? `Track 1 - ${lessonTitle}` : 'Track 1 - Đoạn văn bài học');
        showToast(`✅ Đã nạp giọng đọc ${effectiveVoiceName} thành công!`);
      } else {
        throw new Error(data.error || 'Không nhận được dữ liệu âm thanh');
      }
    } catch (err: any) {
      console.warn('Lỗi khi tổng hợp audio bài học:', err?.message || err);
      setAudioError(`Không thể tạo giọng đọc ${effectiveVoiceName}. Vui lòng thử lại.`);
      showToast('⚠️ Không thể nạp giọng đọc bài học');
    } finally {
      setIsLoadingAudio(false);
    }
  }, [initialAudioUrl, lessonTitle, showToast, activeVoiceUri, selectedVoice, displayVoiceName]);

  const handleVoiceChange = (newUri: string) => {
    const cleanUri = newUri.toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural';
    setActiveVoiceUri(cleanUri);
    if (onVoiceChange) {
      onVoiceChange(cleanUri);
    }
    if (lessonText && lessonText.trim()) {
      loadLessonAudio(lessonText, cleanUri);
    }
  };

  // DEFAULT BEHAVIOR: Khi ấn vào nghe Audacity, mặc định lấy audio từ giọng đọc đã chọn ở bài học
  useEffect(() => {
    if (lessonText && lessonText.trim()) {
      loadLessonAudio(lessonText, activeVoiceUri || selectedVoice);
    } else if (initialAudioUrl && initialAudioUrl !== '/sample-lesson.mp3') {
      setAudioUrl(initialAudioUrl);
      setAudioSourceType('sample');
    }
  }, [lessonText, activeVoiceUri, selectedVoice, loadLessonAudio, initialAudioUrl]);

  // Initialize Web Audio Graph (Stereo Panner & Gain Node)
  const setupWebAudioNodes = useCallback((mediaElement: HTMLMediaElement) => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        const resumeAudio = () => {
          ctx.resume();
          window.removeEventListener('click', resumeAudio);
        };
        window.addEventListener('click', resumeAudio, { once: true });
      }

      // Avoid creating multiple media element sources for the same element
      if (!mediaElementSourceRef.current) {
        mediaElementSourceRef.current = ctx.createMediaElementSource(mediaElement);
        
        const gainNode = ctx.createGain();
        gainNodeRef.current = gainNode;

        let panNode: StereoPannerNode | null = null;
        if (ctx.createStereoPanner) {
          panNode = ctx.createStereoPanner();
          panNodeRef.current = panNode;
        }

        // Connect graph
        if (panNode) {
          mediaElementSourceRef.current.connect(panNode);
          panNode.connect(gainNode);
        } else {
          mediaElementSourceRef.current.connect(gainNode);
        }
        gainNode.connect(ctx.destination);
      }
    } catch {
      // Fallback to standard HTML5 audio attributes if Web Audio routing is restricted
    }
  }, []);

  // Update Gain
  useEffect(() => {
    const linearGain = isMuted ? 0 : Math.pow(10, gainDb / 20);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(linearGain, audioContextRef.current.currentTime);
    }
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(Math.min(1.0, Math.max(0, isMuted ? 0 : linearGain)));
    }
  }, [gainDb, isMuted]);

  // Update Stereo Pan
  useEffect(() => {
    if (panNodeRef.current && audioContextRef.current) {
      panNodeRef.current.pan.setValueAtTime(panValue, audioContextRef.current.currentTime);
    }
  }, [panValue]);

  // Update Playback Rate
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(playbackRate, true); // true = preservePitch
    }
  }, [playbackRate]);

  // Initialize WaveSurfer and Plugins
  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    setIsReady(false);
    setDuration(0);
    setIsPlaying(false);
    setSelectedRegion(null);
    selectedRegionRef.current = null;
    activeRegionRef.current = null;
    activeSentenceIndexRef.current = null;
    setActiveSentenceIndex(null);
    setLoopCount(0);

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // 1. Regions Plugin
    const wsRegions = RegionsPlugin.create();
    regionsPluginRef.current = wsRegions;

    // 2. Timeline Plugin (Thước đo thời gian đặt ở phía trên cùng chung container cuộn ngang với sóng âm)
    const wsTimeline = TimelinePlugin.create({
      height: 24,
      insertPosition: 'beforebegin',
      timeInterval: 0.5,
      primaryLabelInterval: 1,
      secondaryLabelInterval: 0.5,
      formatTimeCallback: (seconds: number) => {
        const isWhole = Math.abs(seconds - Math.round(seconds)) < 0.01;
        if (!isWhole) return '';
        const rounded = Math.round(seconds);
        if (rounded < 60) {
          return `${rounded}s`;
        }
        const m = Math.floor(rounded / 60);
        const s = rounded % 60;
        return `${m}:${s.toString().padStart(2, '0')}s`;
      },
      style: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#334155',
        backgroundColor: '#f1f5f9'
      }
    });

    // 3. WaveSurfer Instance (Khởi tạo trước rồi gắn plugin sau khi khóa virtualizer để cuộn 60fps mượt tuyệt đối)
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#3b82f6', // Vibrant clean blue waveform
      progressColor: '#1d4ed8', // Vivid royal blue for played progress
      cursorColor: '#dc2626', // Audacity classic red cursor line
      cursorWidth: 2,
      height: waveformHeight,
      barHeight: waveformOnly ? 0.8 : 0.45,
      normalize: false,
      maxPeak: 1.0, // Khóa đỉnh biên độ chuẩn 1.0 để sóng âm chỉ phóng to / thu nhỏ theo chiều ngang
      minPxPerSec: zoomLevel,
      fillParent: false, // Sóng âm có thể co nhỏ lại mượt mà khi zoom out mà không bị gò ép
      autoScroll: false, // Kiểm soát cuộn chủ động để sóng âm cố định, không giật liên tục
      autoCenter: false, // Tắt autoCenter để WaveSurfer không tự kéo giật vị trí khi zoom
      plugins: [],
      url: audioUrl
    });

    // Tối ưu 60fps/120fps: Ngăn RegionsPlugin và TimelinePlugin xóa/thêm lại DOM khi kéo thanh cuộn ngang
    ws.getScroll = () => -10000;
    ws.getWidth = () => 10000000;

    // Vẽ sẵn toàn bộ các mảnh Canvas sóng âm ngay từ đầu (tránh tạo/vẽ lại canvas giữa chừng khi kéo thanh trượt)
    const renderer = (ws as any).renderer;
    if (renderer && typeof renderer.renderMultiCanvas === 'function') {
      const origRenderMultiCanvas = renderer.renderMultiCanvas.bind(renderer);
      renderer.renderMultiCanvas = function (
        channelData: any,
        options: any,
        width: number,
        height: number,
        canvasContainer: HTMLElement,
        progressContainer: HTMLElement
      ) {
        const pixelRatio = this.getPixelRatio ? this.getPixelRatio() : window.devicePixelRatio || 1;
        const clientWidth = this.scrollContainer?.clientWidth || 800;
        const totalWidth = width / pixelRatio;
        const numCanvases = Math.ceil(totalWidth / Math.max(1, clientWidth));
        if (numCanvases <= 12 && this.isScrollable) {
          const origSignal = this.isScrollable;
          this.isScrollable = { value: false };
          try {
            return origRenderMultiCanvas(channelData, options, width, height, canvasContainer, progressContainer);
          } finally {
            this.isScrollable = origSignal;
          }
        }
        return origRenderMultiCanvas(channelData, options, width, height, canvasContainer, progressContainer);
      };
    }

    ws.registerPlugin(wsRegions);
    ws.registerPlugin(wsTimeline);

    // Đồng bộ khung nhìn sóng âm luôn hiển thị theo vị trí thanh trỏ màu đỏ (Playhead)
    const syncViewportToPlayhead = (targetTime: number, forceFollow = false) => {
      const scrollEl = getScrollEl();
      if (!scrollEl) return;
      const totalDur = ws.getDuration() || duration || 1;
      if (totalDur <= 0) return;
      const containerW = scrollEl.clientWidth;
      const totalW = scrollEl.scrollWidth;
      if (totalW <= containerW + 1) return;

      const maxScroll = Math.max(0, totalW - containerW);
      const currentScroll = scrollEl.scrollLeft;
      const playheadX = (targetTime / totalDur) * totalW;

      const activeReg = activeRegionRef.current;
      const regEndX =
        activeReg && targetTime >= activeReg.start - 0.05 && targetTime <= activeReg.end + 0.05
          ? (activeReg.end / totalDur) * totalW
          : playheadX;

      if (forceFollow) {
        // Khi chuyển câu / tua bằng phím tắt / đặt vị trí con trỏ: luôn đưa vùng sóng có vạch đỏ vào khung nhìn rõ ràng
        if (
          playheadX < currentScroll + containerW * 0.10 ||
          playheadX > currentScroll + containerW * 0.70 ||
          (regEndX > currentScroll + containerW * 0.95 && playheadX > currentScroll + containerW * 0.18)
        ) {
          const nextScroll = Math.max(0, Math.min(maxScroll, playheadX - containerW * 0.15));
          scrollEl.scrollLeft = nextScroll;
          updateScrollThumbDOM(nextScroll, totalW, containerW);
        }
        return;
      }

      // Khi đang phát hoặc di chuyển vạch đỏ: hễ vạch đỏ ra ngoài vùng nhìn hoặc chạm 85% mép phải thì cuộn theo ngay
      if (playheadX < currentScroll + containerW * 0.05 || playheadX >= currentScroll + containerW * 0.85) {
        const nextScroll = Math.max(0, Math.min(maxScroll, playheadX - containerW * 0.12));
        scrollEl.scrollLeft = nextScroll;
        updateScrollThumbDOM(nextScroll, totalW, containerW);
      }
    };

    // Chặn đệ quy đồng bộ khi gọi ws.setTime (do setTime phát sự kiện timeupdate/seeking ngay lập tức trên cùng call stack)
    const origSetTime = ws.setTime.bind(ws);
    let isSettingTimeSync = false;
    ws.setTime = (time: number) => {
      if (isSettingTimeSync) return;
      isSettingTimeSync = true;
      try {
        origSetTime(time);
        syncViewportToPlayhead(time, true);
      } finally {
        isSettingTimeSync = false;
      }
    };

    wavesurferRef.current = ws;

    // Enable drag selection for listening region highlight (quét vùng chính xác)
    wsRegions.enableDragSelection({
      color: 'rgba(59, 130, 246, 0.28)',
      minLength: 0.05,
      drag: false
    });

    // Events
    ws.on('ready', () => {
      setIsReady(true);
      const total = ws.getDuration();
      setDuration(total);

      // Enforce pure white background on waveform DOM and shadowRoot elements & inject badge styles
      if (waveformRef.current) {
        waveformRef.current.style.backgroundColor = '#ffffff';
        const shadow = waveformRef.current.shadowRoot || waveformRef.current.querySelector('div')?.shadowRoot;
        if (shadow) {
          const sEl = shadow.querySelector('[part="scroll"]') as HTMLElement | null;
          if (sEl) sEl.style.backgroundColor = '#ffffff';
          const wEl = shadow.querySelector('[part="wrapper"]') as HTMLElement | null;
          if (wEl) wEl.style.backgroundColor = '#ffffff';

          let styleEl = shadow.querySelector('#audacity-overlay-style') as HTMLStyleElement | null;
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'audacity-overlay-style';
            shadow.appendChild(styleEl);
          }
          styleEl.textContent = `
            .region-content-wrapper[data-mode="none"],
            [part*="region-content"][data-mode="none"],
            [part*="region-content"]:empty {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              width: 0px !important;
              height: 0px !important;
              overflow: hidden !important;
              pointer-events: none !important;
            }
            .region-content-wrapper:not([data-mode="none"]) { display: flex; align-items: flex-end !important; justify-content: center !important; width: max-content !important; min-width: max-content !important; max-width: none !important; white-space: nowrap !important; overflow: visible !important; pointer-events: none !important; }
            .region-badge-content { display: flex; flex-direction: row !important; flex-wrap: nowrap !important; align-items: flex-end !important; justify-content: center !important; width: max-content !important; min-width: max-content !important; max-width: none !important; gap: 0px !important; box-sizing: border-box !important; flex-shrink: 0 !important; flex-grow: 0 !important; white-space: nowrap !important; overflow: visible !important; pointer-events: none !important; }
            .region-char-col { display: inline-flex; flex-direction: column !important; align-items: center !important; justify-content: flex-end !important; flex: 0 0 auto !important; width: max-content !important; min-width: max-content !important; flex-grow: 0 !important; flex-shrink: 0 !important; text-align: center !important; padding: 2px 4px !important; border-radius: 8px !important; border: 1px solid transparent !important; background-color: transparent !important; transition: all 150ms ease-out !important; transform-origin: bottom center !important; pointer-events: auto !important; cursor: pointer !important; user-select: none !important; }
            .region-char-col.region-punct-col { padding: 2px 0px !important; pointer-events: none !important; cursor: default !important; }
            .region-word-chars-row { display: flex; flex-direction: row !important; align-items: flex-end !important; justify-content: center !important; gap: 0px !important; }
            .region-char-unit { display: flex; flex-direction: column !important; align-items: center !important; justify-content: flex-end !important; }
            .region-badge-pinyin { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; font-weight: 500 !important; font-size: 13px !important; letter-spacing: 0.025em !important; color: #0f172a !important; padding: 0 2px !important; display: flex; align-items: center !important; justify-content: center !important; text-align: center !important; white-space: nowrap !important; transform-origin: bottom center !important; transition: all 300ms ease !important; }
            .region-punct-col .region-badge-pinyin { padding: 0px !important; }
            .region-badge-hanzi { font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important; font-weight: 700 !important; font-size: 24px !important; letter-spacing: -0.05em !important; color: #0f172a !important; text-align: center !important; white-space: nowrap !important; line-height: 1 !important; transition: all 200ms ease !important; }
            .region-char-col.saved-char-col:not(.region-punct-col) .region-badge-pinyin { color: #f97316 !important; font-weight: 600 !important; }
            .region-char-col.saved-char-col:not(.region-punct-col) .region-badge-hanzi { color: #f97316 !important; }
            .region-char-col.mispronounced-char-col:not(.region-punct-col) { box-shadow: 0 0 0 2px #f87171 !important; background-color: rgba(254, 242, 242, 0.5) !important; border-radius: 6px !important; }
            .region-char-col.selected-char-col:not(.region-punct-col) { background-color: rgba(219, 234, 254, 0.7) !important; border-color: #93c5fd !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; transform: scale(1.05) !important; transform-origin: bottom center !important; z-index: 15 !important; }
            .region-char-col.selected-char-col:not(.region-punct-col) .region-badge-pinyin { color: #32CD32 !important; font-weight: 700 !important; text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff !important; }
            .region-char-col.selected-char-col:not(.region-punct-col) .region-badge-hanzi { color: #32CD32 !important; font-weight: 700 !important; text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff !important; }
            .region-char-col:not(.region-punct-col):hover,
            .region-char-col.hover-char-col:not(.region-punct-col) { border-color: #93c5fd !important; background-color: rgba(239, 246, 255, 0.9) !important; box-shadow: 0 1px 2px 0 rgba(59, 130, 246, 0.15) !important; z-index: 12 !important; }
            .region-char-col:not(.region-punct-col):hover .region-badge-pinyin,
            .region-char-col.hover-char-col:not(.region-punct-col) .region-badge-pinyin { color: #32CD32 !important; text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff !important; }
            .region-char-col:not(.region-punct-col):hover .region-badge-hanzi,
            .region-char-col.hover-char-col:not(.region-punct-col) .region-badge-hanzi { color: #32CD32 !important; text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff !important; }
            .region-char-col.active-char-col { background-color: rgba(209, 250, 229, 0.85) !important; border-color: #34d399 !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; transform: translateY(-2px) scale(1.18) !important; transform-origin: bottom center !important; z-index: 20 !important; }
            .region-char-col.active-char-col .region-badge-pinyin { color: #32CD32 !important; font-weight: 700 !important; text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff !important; }
            .region-char-col.active-char-col .region-badge-hanzi { color: #32CD32 !important; font-weight: 700 !important; text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff !important; }
            [part*="region-content"]:not([data-mode="none"]):not(:empty) {
              position: absolute !important;
              top: 32px !important;
              left: 50% !important;
              right: auto !important;
              margin-top: 0px !important;
              margin-left: 0px !important;
              transform: translateX(-50%);
              transform-origin: top center !important;
              width: max-content !important;
              min-width: max-content !important;
              max-width: none !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              display: flex;
              align-items: flex-end !important;
              justify-content: center !important;
              white-space: nowrap !important;
              overflow: visible !important;
              pointer-events: none !important;
              z-index: 4 !important;
            }
            [part~="region"] {
              border-left: 2px solid #3b82f6 !important;
              border-right: none !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              contain: layout style !important;
            }
            [part~="region"].is-last-sentence-region {
              border-right: 2px solid #3b82f6 !important;
            }
            [part~="region"].active-sentence-region {
              border-left: 2.5px solid #1d4ed8 !important;
            }
            [part~="region"].active-sentence-region.is-last-sentence-region {
              border-right: 2.5px solid #1d4ed8 !important;
            }
            [part*="region-handle"] {
              width: 8px !important;
              background: transparent !important;
              border: none !important;
            }
            [part*="region-handle"]:hover {
              background: rgba(59, 130, 246, 0.35) !important;
            }
            [part="scroll"] {
              overflow-x: scroll !important;
              overflow-y: hidden !important;
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
              will-change: scroll-position !important;
            }
            [part="wrapper"] {
              padding-top: 24px !important;
              box-sizing: content-box !important;
              contain: layout style !important;
            }
            [part="timeline-wrapper"] {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              height: 24px !important;
              background-color: #f1f5f9 !important;
              border-bottom: 1px solid #cbd5e1 !important;
              z-index: 6 !important;
              box-sizing: border-box !important;
              contain: layout style paint !important;
            }
            [part="timeline"] {
              height: 24px !important;
              background-color: #f1f5f9 !important;
              contain: layout style paint !important;
            }
            [part~="timeline-notch"] {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              font-weight: 700 !important;
              font-size: 10px !important;
              color: #334155 !important;
              border-left: 1px solid #64748b !important;
            }
            [part="canvases"] {
              contain: layout style paint !important;
            }
            [part="progress"] {
              top: 24px !important;
              height: calc(100% - 24px) !important;
              contain: layout style paint !important;
            }
            [part="regions-container"] {
              top: 24px !important;
              height: calc(100% - 24px) !important;
              z-index: 8 !important;
              pointer-events: none !important;
            }
            [part="cursor"] {
              top: 0 !important;
              height: 100% !important;
              z-index: 10 !important;
            }
            [part="scroll"]::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
          `;
        }
      }

      // Tính toán ngay lập tức ranh giới câu & vị trí từng âm tiết Pinyin từ AudioBuffer vừa giải mã
      const decodedBuffer = ws.getDecodedData();
      const freshTimings = computeSynchronizedSentences(
        lessonSentences,
        total,
        decodedBuffer,
        ttsSubtitlesRef.current
      );

      // Đặt mức zoom ban đầu: đảm bảo đủ độ rộng cho chữ Hán + Pinyin ở mọi vùng câu và con chạy thanh cuộn mượt mà
      if (waveformRef.current && total > 0) {
        const containerWidth = waveformRef.current.clientWidth || 800;
        const fitZoom = Math.max(1, Math.floor(containerWidth / total));
        let minClauseZoom = 120;
        if (freshTimings.length > 0) {
          freshTimings.forEach((seg) => {
            const charCount = Math.max(1, Array.from(seg.text || '').length);
            const segDur = Math.max(0.4, seg.end - seg.start);
            const requiredWidthPx = charCount * 34 + 22;
            const neededZoom = Math.ceil(requiredWidthPx / segDur);
            if (neededZoom > minClauseZoom) {
              minClauseZoom = neededZoom;
            }
          });
        }
        const defaultZoom = Math.min(
          400,
          Math.max(120, Math.ceil((containerWidth * 2) / total), Math.round(fitZoom * 2), minClauseZoom)
        );
        isUserZoomedRef.current = true;
        thumbPosRef.current = { left: 0, width: 50 };
        setZoomLevel(defaultZoom);
        zoomLevelRef.current = defaultZoom;
        try {
          ws.zoom(defaultZoom);
          ws.setScroll(0);
        } catch {}
      }

      // Connect Web Audio Nodes
      const mediaEl = ws.getMediaElement();
      if (mediaEl) {
        mediaEl.preservesPitch = true;
        setupWebAudioNodes(mediaEl);
      }

      // Ensure horizontal scrollbar metrics and width are accurately measured
      setTimeout(() => {
        updateScrollMetrics();
        const scrollEl = getScrollEl();
        if (scrollEl) {
          scrollEl.scrollLeft = 0;
          try { ws.setScroll(0); } catch {}
          updateScrollThumbDOM(0, scrollEl.scrollWidth, scrollEl.clientWidth);
          const wrapperEl = scrollEl.querySelector('[part="wrapper"]') as HTMLElement | null;
          waveformScrollWidthRef.current = wrapperEl?.offsetWidth || scrollEl.scrollWidth || scrollEl.clientWidth;
        }
      }, 80);

      if (freshTimings.length > 0) {
        sentenceTimingsRef.current = freshTimings;
        customSentencesRef.current = freshTimings;
        setCustomSentences(freshTimings);
        if (showSentenceTrackRef.current) {
          syncAllSentenceRegionsRef.current(freshTimings, activeSentenceIndexRef.current);
          setTimeout(() => {
            wsRegions.getRegions().forEach(r => configureRegionElement(r));
          }, 60);
        }
      }
    });

    ws.on('redraw', () => {
      scheduleScrollMetricsUpdate();
    });

    ws.on('redrawcomplete', () => {
      scheduleScrollMetricsUpdate();
      wsRegions.getRegions().forEach(r => configureRegionElement(r));
    });

    ws.on('scroll', () => {
      if (isDraggingThumbRef.current) return;
      scheduleScrollMetricsUpdate();
    });

    ws.on('zoom', () => {
      scheduleScrollMetricsUpdate();
      wsRegions.getRegions().forEach(r => configureRegionElement(r));
    });

    // Đồng bộ hiệu ứng phóng to + đổi màu xanh lá cho chữ Hán & Pinyin ngay khi âm thanh phát tới (60fps)
    let charHighlightRafId: number | null = null;
    const updateActiveCharHighlight = (time: number, playing: boolean) => {
      const shadow = waveformRef.current?.shadowRoot || waveformRef.current?.querySelector('div')?.shadowRoot;
      if (!shadow) return;
      const cols = shadow.querySelectorAll<HTMLElement>('.region-char-col');
      if (!playing) {
        cols.forEach(col => {
          if (col.classList.contains('active-char-col')) {
            col.classList.remove('active-char-col');
          }
        });
        return;
      }

      let matchedCol: HTMLElement | null = null;
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        const s = parseFloat(col.getAttribute('data-start') || '-1');
        const e = parseFloat(col.getAttribute('data-end') || '-1');
        if (s >= 0 && e > s && time >= s && time < e) {
          matchedCol = col;
          break;
        }
      }
      if (!matchedCol) {
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i];
          const s = parseFloat(col.getAttribute('data-start') || '-1');
          const e = parseFloat(col.getAttribute('data-end') || '-1');
          if (s >= 0 && e > s && time >= s - 0.015 && time <= e + 0.015) {
            matchedCol = col;
            break;
          }
        }
      }

      cols.forEach(col => {
        if (col === matchedCol) {
          if (!col.classList.contains('active-char-col')) {
            col.classList.add('active-char-col');
          }
        } else if (col.classList.contains('active-char-col')) {
          col.classList.remove('active-char-col');
        }
      });
    };

    // Kiểm tra và khóa chặt phạm vi phát trong vùng sóng đang chọn [region.start, region.end] ở tốc độ 60fps
    const enforceRegionPlaybackBounds = (time: number): boolean => {
      if (!ws.isPlaying() || isDraggingWaveRegionRef.current || isLoopSeekingRef.current) {
        return false;
      }

      const region = activeRegionRef.current || selectedRegionRef.current;
      if (region && region.end > region.start + 0.03) {
        // Nếu con trỏ đang nằm trước đầu vùng chọn, đưa ngay về đúng đầu vùng để phát
        if (time < region.start - 0.05) {
          isLoopSeekingRef.current = true;
          if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);
          ws.setTime(region.start);
          setCurrentTime(region.start);
          seekLockTimeoutRef.current = setTimeout(() => {
            isLoopSeekingRef.current = false;
          }, 80);
          return true;
        }

        // Khi chạm cuối vùng chọn: lặp lại hoặc dừng ngay lập tức (độ chính xác 60fps ~16ms, không tràn sang câu sau)
        if (time >= region.end - 0.012) {
          isLoopSeekingRef.current = true;
          if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);
          try {
            if (isLoopingRef.current) {
              const nextCount = loopCountRef.current + 1;
              loopCountRef.current = nextCount;
              setLoopCount(nextCount);
              if (maxLoopCountRef.current > 0 && nextCount >= maxLoopCountRef.current) {
                ws.pause();
                ws.setTime(region.start);
                setCurrentTime(region.start);
                setIsPlaying(false);
                updateActiveCharHighlight(region.start, false);
              } else {
                ws.setTime(region.start);
                setCurrentTime(region.start);
                if (!ws.isPlaying()) {
                  ws.play().catch(() => {});
                }
              }
            } else {
              // Mặc định không lặp: dừng ngay lập tức khi hết vùng chọn và đưa con trỏ về đầu vùng
              ws.pause();
              ws.setTime(region.start);
              setCurrentTime(region.start);
              setIsPlaying(false);
              updateActiveCharHighlight(region.start, false);
              showToast('⏹ Đã phát hết vùng sóng đã chọn');
            }
          } finally {
            seekLockTimeoutRef.current = setTimeout(() => {
              isLoopSeekingRef.current = false;
            }, 90);
          }
          return true;
        }
      }
      return false;
    };

    const startCharHighlightLoop = () => {
      if (charHighlightRafId !== null) cancelAnimationFrame(charHighlightRafId);
      const tick = () => {
        if (!ws.isPlaying()) {
          updateActiveCharHighlight(ws.getCurrentTime(), false);
          charHighlightRafId = null;
          return;
        }
        const curTime = ws.getCurrentTime();
        if (enforceRegionPlaybackBounds(curTime)) {
          if (!ws.isPlaying()) {
            charHighlightRafId = null;
            return;
          }
        }
        updateActiveCharHighlight(ws.getCurrentTime(), true);
        charHighlightRafId = requestAnimationFrame(tick);
      };
      charHighlightRafId = requestAnimationFrame(tick);
    };

    const stopCharHighlightLoop = () => {
      if (charHighlightRafId !== null) {
        cancelAnimationFrame(charHighlightRafId);
        charHighlightRafId = null;
      }
      updateActiveCharHighlight(ws.getCurrentTime(), false);
    };

    ws.on('play', () => {
      userScrolledAwayRef.current = false;
      setIsPlaying(true);
      startCharHighlightLoop();
    });
    ws.on('pause', () => {
      setIsPlaying(false);
      stopCharHighlightLoop();
    });
    ws.on('finish', () => {
      if (isLoopSeekingRef.current) return;
      isLoopSeekingRef.current = true;
      try {
        const reg = activeRegionRef.current || selectedRegionRef.current;
        if (isLoopingRef.current) {
          const startTarget = reg ? reg.start : 0;
          ws.setTime(startTarget);
          ws.play().catch(() => {});
          setIsPlaying(true);
          startCharHighlightLoop();
          loopCountRef.current += 1;
          setLoopCount(loopCountRef.current);
          showToast('🔁 Đang lặp lại');
          return;
        }
        setIsPlaying(false);
        stopCharHighlightLoop();
        if (reg) {
          ws.setTime(reg.start);
          setCurrentTime(reg.start);
        } else {
          ws.setTime(0);
          setCurrentTime(0);
        }
        showToast('✓ Đã phát xong');
      } finally {
        setTimeout(() => {
          isLoopSeekingRef.current = false;
        }, 80);
      }
    });

    // Update current time on seeking or interaction click
    ws.on('seeking', (time: number) => {
      if (isLoopSeekingRef.current) return;
      userScrolledAwayRef.current = false;
      setCurrentTime(time);
      syncViewportToPlayhead(time, false);
    });

    ws.on('interaction', (newTime: number) => {
      userScrolledAwayRef.current = false;
      // Nếu người dùng vừa click vào chữ Hán / Pinyin để tra từ thì không thay đổi vùng chọn sóng âm
      if (Date.now() - lastWordClickTimestampRef.current < 260) return;
      // Nếu đang trong quá trình quét chuột hoặc vừa mới nhả chuột quét vùng xong, bỏ qua để không ghi đè vùng vừa quét
      if (isDraggingWaveRegionRef.current || Date.now() - lastRegionDragEndTimeRef.current < 280) return;
      setCurrentTime(newTime);
      const allRegions = wsRegions.getRegions();
      const currentActive = activeRegionRef.current;

      // Tìm câu tương ứng với vị trí nhấp (nếu dải câu đang hiển thị)
      const clickedSentenceReg = showSentenceTrackRef.current
        ? allRegions.find(r => r.id.startsWith('sentence-region-') && newTime >= r.start && newTime <= r.end)
        : null;

      // 1. Nếu đang chọn 1 câu cụ thể và người dùng lại nhấp vào chính câu đó:
      // Hủy chọn câu đó, đưa con trỏ đến vị trí nhấp để sẵn sàng chọn/quét vùng mới
      if (currentActive && clickedSentenceReg && currentActive.id === clickedSentenceReg.id) {
        currentActive.setOptions({ color: 'rgba(255, 255, 255, 0)' });
        if (currentActive.element) {
          currentActive.element.classList.remove('active-sentence-region');
        }
        activeRegionRef.current = null;
        setSelectedRegion(null);
        if (selectedRegionRef.current) selectedRegionRef.current = null;
        activeSentenceIndexRef.current = null;
        setActiveSentenceIndex(null);
        setLoopCount(0);
        showToast(`📍 Đã bỏ chọn - Sẵn sàng chọn vùng mới từ ${formatTime(newTime)}`);
        return;
      }

      // 2. Nếu đang có vùng quét tự do và người dùng nhấp vào một vị trí trong vùng đó:
      if (currentActive && !currentActive.id.startsWith('sentence-region-') && newTime >= currentActive.start && newTime <= currentActive.end) {
        currentActive.remove();
        if (clickedSentenceReg && showSentenceTrackRef.current) {
          // Nếu vị trí nhấp trùng với một câu có sẵn: chọn câu đó và đưa con trỏ về đầu câu
          const match = clickedSentenceReg.id.match(/^sentence-region-(\d+)$/);
          const targetIdx = match ? parseInt(match[1], 10) : null;
          setActiveSentenceIndex(targetIdx);
          activeSentenceIndexRef.current = targetIdx;
          activeRegionRef.current = clickedSentenceReg;

          const exactStart = Number(clickedSentenceReg.start.toFixed(2));
          const exactEnd = Number(clickedSentenceReg.end.toFixed(2));
          const exactDur = Number((exactEnd - exactStart).toFixed(2));

          const regObj = {
            start: exactStart,
            end: exactEnd,
            duration: exactDur
          };
          setSelectedRegion(regObj);
          selectedRegionRef.current = regObj;

          allRegions.forEach((r) => {
            if (!r.id.startsWith('sentence-region-')) return;
            const isThis = r.id === clickedSentenceReg.id;
            const col = isThis 
              ? 'rgba(59, 130, 246, 0.28)' 
              : 'rgba(255, 255, 255, 0)';
            r.setOptions({ color: col });
            if (r.element) {
              if (isThis) r.element.classList.add('active-sentence-region');
              else r.element.classList.remove('active-sentence-region');
            }
          });
          ws.setTime(exactStart);
          setCurrentTime(exactStart);
          setLoopCount(0);
          return;
        } else {
          // Bỏ chọn vùng quét tự do, đặt con trỏ tại vị trí nhấp
          activeRegionRef.current = null;
          setSelectedRegion(null);
          selectedRegionRef.current = null;
          activeSentenceIndexRef.current = null;
          setActiveSentenceIndex(null);
          setLoopCount(0);
          showToast(`📍 Đã bỏ chọn - Sẵn sàng chọn vùng mới từ ${formatTime(newTime)}`);
          return;
        }
      }

      // 3. Nếu người dùng nhấp vào một câu trên sóng âm (chưa được chọn):
      if (clickedSentenceReg && showSentenceTrackRef.current) {
        // Xóa mọi vùng quét tự do khác
        allRegions.forEach(r => {
          if (!r.id.startsWith('sentence-region-')) {
            r.remove();
          }
        });

        const match = clickedSentenceReg.id.match(/^sentence-region-(\d+)$/);
        const targetIdx = match ? parseInt(match[1], 10) : null;
        setActiveSentenceIndex(targetIdx);
        activeSentenceIndexRef.current = targetIdx;
        activeRegionRef.current = clickedSentenceReg;

        const exactStart = Number(clickedSentenceReg.start.toFixed(2));
        const exactEnd = Number(clickedSentenceReg.end.toFixed(2));
        const exactDur = Number((exactEnd - exactStart).toFixed(2));

        const regObj = {
          start: exactStart,
          end: exactEnd,
          duration: exactDur
        };
        setSelectedRegion(regObj);
        selectedRegionRef.current = regObj;

        allRegions.forEach((r) => {
          if (!r.id.startsWith('sentence-region-')) return;
          const isThis = r.id === clickedSentenceReg.id;
          const col = isThis 
            ? 'rgba(59, 130, 246, 0.28)' 
            : 'rgba(255, 255, 255, 0)';
          r.setOptions({ color: col });
          if (r.element) {
            if (isThis) r.element.classList.add('active-sentence-region');
            else r.element.classList.remove('active-sentence-region');
          }
        });

        // Đưa con trỏ về đúng điểm bắt đầu của vùng vừa chọn để khi phát chỉ phát đoạn đó
        ws.setTime(exactStart);
        setCurrentTime(exactStart);
        setLoopCount(0);
        showToast(`🎯 Đã chọn vùng câu #${(targetIdx ?? 0) + 1}: ${formatTime(exactStart)} - ${formatTime(exactEnd)}`);
      } else {
        // Nhấp vào vùng trống ngoài các câu: hủy mọi vùng chọn
        allRegions.forEach(r => {
          if (!r.id.startsWith('sentence-region-')) {
            r.remove();
          } else {
            r.setOptions({ color: 'rgba(255, 255, 255, 0)' });
            if (r.element) {
              r.element.classList.remove('active-sentence-region');
            }
          }
        });
        activeRegionRef.current = null;
        setSelectedRegion(null);
        if (selectedRegionRef.current) selectedRegionRef.current = null;
        activeSentenceIndexRef.current = null;
        setActiveSentenceIndex(null);
      }
    });

    ws.on('timeupdate', (time) => {
      updateActiveCharHighlight(time, ws.isPlaying());
      if (isLoopSeekingRef.current) return;
      setCurrentTime(time);

      // Thanh trỏ màu đỏ ở đâu thì vùng sóng âm hiển thị ở đó
      if (!isDraggingThumbRef.current && !isHorizontalPanningRef.current) {
        syncViewportToPlayhead(time, false);
      }

      const region = activeRegionRef.current;
      const effectiveRegion = region || selectedRegionRef.current;
      const lockedSentenceMatch = region?.id ? region.id.match(/^sentence-region-(\d+)$/) : null;
      if (lockedSentenceMatch) {
        const lockedIdx = parseInt(lockedSentenceMatch[1], 10);
        if (activeSentenceIndexRef.current !== lockedIdx) {
          activeSentenceIndexRef.current = lockedIdx;
          setActiveSentenceIndex(lockedIdx);
        }
      } else if (!effectiveRegion && ws.isPlaying()) {
        // Chỉ tự động cập nhật chỉ số câu theo thời gian thực khi đang phát toàn bài (không khóa vào 1 vùng chọn cụ thể)
        const activeList = customSentencesRef.current.length > 0 ? customSentencesRef.current : sentenceTimingsRef.current;
        if (activeList.length > 0) {
          const currentIdx = activeList.findIndex(s => time >= s.start && time < s.end);
          if (currentIdx !== -1 && activeSentenceIndexRef.current !== currentIdx) {
            activeSentenceIndexRef.current = currentIdx;
            setActiveSentenceIndex(currentIdx);
          }
        }
      }

      // Chỉ kiểm tra giới hạn vùng phát khi ĐANG PHÁT (ws.isPlaying()) và không đang kéo quét vùng
      if (!ws.isPlaying() || isDraggingWaveRegionRef.current) {
        return;
      }

      if (enforceRegionPlaybackBounds(time)) {
        return;
      }

      if (!effectiveRegion && isLoopingRef.current) {
        // Không có vùng chọn: phát toàn bài
        const totalDur = ws.getDuration() || duration;
        if (totalDur > 0 && time >= totalDur - 0.25) {
          isLoopSeekingRef.current = true;
          try {
            const nextCount = loopCountRef.current + 1;
            loopCountRef.current = nextCount;
            setLoopCount(nextCount);
            if (maxLoopCountRef.current > 0 && nextCount >= maxLoopCountRef.current) {
              ws.pause();
              ws.setTime(0);
              setCurrentTime(0);
              setIsPlaying(false);
            } else {
              ws.setTime(0);
              setCurrentTime(0);
              if (!ws.isPlaying()) {
                ws.play().catch(() => {});
              }
            }
          } finally {
            setTimeout(() => {
              isLoopSeekingRef.current = false;
            }, 150);
          }
        }
      }
    });

    // Đồng bộ thời gian, vị trí cụm sóng âm [voiceStart, voiceEnd] và từng âm tiết Pinyin khi người dùng kéo chỉnh ranh giới câu
    const syncRegionToSentence = (region: Region, isFinishedResize = false) => {
      activeRegionRef.current = region;
      const regObj = {
        start: Number(region.start.toFixed(2)),
        end: Number(region.end.toFixed(2)),
        duration: Number((region.end - region.start).toFixed(2))
      };
      setSelectedRegion(regObj);
      selectedRegionRef.current = regObj;

      // Chỉ đồng bộ khi vùng này thuộc về một câu cụ thể (sentence-region-X)
      const match = region.id.match(/^sentence-region-(\d+)$/);
      if (!match) return;

      const targetIdx = parseInt(match[1], 10);
      const list = customSentencesRef.current.length > 0 ? customSentencesRef.current : sentenceTimingsRef.current;
      if (!list || list.length === 0 || !list[targetIdx]) return;

      if (!isFinishedResize && !isDraggingWaveRegionRef.current) {
        pushHistory('Kéo chỉnh ranh giới câu');
        isDraggingWaveRegionRef.current = true;
      }

      if (activeSentenceIndexRef.current !== targetIdx) {
        setActiveSentenceIndex(targetIdx);
        activeSentenceIndexRef.current = targetIdx;
      }

      const newStart = Number(region.start.toFixed(2));
      const newEnd = Math.max(newStart + 0.05, Number(region.end.toFixed(2)));
      const decoded = ws.getDecodedData();

      // Tinh chỉnh lại vị trí từng chữ Hán/Pinyin khớp với sóng âm bên trong ranh giới mới
      const recalcTarget = computeClauseSyllableAlignment(newStart, newEnd, list[targetIdx].text, decoded);
      const updatedTargetSent: SentenceTimingItem = {
        ...list[targetIdx],
        start: newStart,
        end: newEnd,
        voiceStart: recalcTarget.voiceStart,
        voiceEnd: recalcTarget.voiceEnd,
        charTimings: recalcTarget.charTimings
      };

      const targetBadge = buildSentenceBadgeDOM(updatedTargetSent, targetIdx);
      region.setOptions({ content: targetBadge });
      configureRegionElement(region);

      // Đồng bộ ranh giới liền kề để đường phân cách giữa 2 câu co giãn cùng nhau
      const wsRegions = regionsPluginRef.current;
      const allRegs = wsRegions?.getRegions() || [];

      let updatedNextSent: SentenceTimingItem | null = null;
      const nextReg = allRegs.find(r => r.id === `sentence-region-${targetIdx + 1}`);
      if (nextReg && list[targetIdx + 1] && Math.abs(nextReg.start - newEnd) > 0.01) {
        const nextEnd = Math.max(newEnd + 0.05, list[targetIdx + 1].end);
        const recalcNext = computeClauseSyllableAlignment(newEnd, nextEnd, list[targetIdx + 1].text, decoded);
        updatedNextSent = {
          ...list[targetIdx + 1],
          start: newEnd,
          end: nextEnd,
          voiceStart: recalcNext.voiceStart,
          voiceEnd: recalcNext.voiceEnd,
          charTimings: recalcNext.charTimings
        };
        const nextBadge = buildSentenceBadgeDOM(updatedNextSent, targetIdx + 1);
        nextReg.setOptions({ start: newEnd, content: nextBadge });
        configureRegionElement(nextReg);
      }

      let updatedPrevSent: SentenceTimingItem | null = null;
      const prevReg = allRegs.find(r => r.id === `sentence-region-${targetIdx - 1}`);
      if (prevReg && list[targetIdx - 1] && Math.abs(prevReg.end - newStart) > 0.01) {
        const prevStart = Math.min(newStart - 0.05, list[targetIdx - 1].start);
        const recalcPrev = computeClauseSyllableAlignment(prevStart, newStart, list[targetIdx - 1].text, decoded);
        updatedPrevSent = {
          ...list[targetIdx - 1],
          start: prevStart,
          end: newStart,
          voiceStart: recalcPrev.voiceStart,
          voiceEnd: recalcPrev.voiceEnd,
          charTimings: recalcPrev.charTimings
        };
        const prevBadge = buildSentenceBadgeDOM(updatedPrevSent, targetIdx - 1);
        prevReg.setOptions({ end: newStart, content: prevBadge });
        configureRegionElement(prevReg);
      }

      setCustomSentences(prev => {
        const base = prev.length > 0 ? prev : list;
        const next = [...base];
        next[targetIdx] = updatedTargetSent;
        if (updatedNextSent && next[targetIdx + 1]) {
          next[targetIdx + 1] = updatedNextSent;
        }
        if (updatedPrevSent && next[targetIdx - 1]) {
          next[targetIdx - 1] = updatedPrevSent;
        }
        customSentencesRef.current = next;
        return next;
      });
    };

    // Handle Regions
    // Khi người dùng bắt đầu quét chuột tạo 1 vùng tự do mới:
    wsRegions.on('region-initialized', (region: Region) => {
      // Nếu là vùng chia sẵn của câu, không xử lý ở đây
      const match = region.id.match(/^sentence-region-(\d+)$/);
      if (match) return;

      if (!isDraggingWaveRegionRef.current) {
        pushHistory('Quét chọn vùng sóng');
      }

      // Người dùng bắt đầu quét chuột tạo 1 vùng mới (kể cả quét từ bên trong vùng đang được chọn):
      // 1. Hủy chọn và xóa ngay tất cả các vùng đã chọn trước đó
      const allRegions = wsRegions.getRegions();
      allRegions.forEach(r => {
        if (r.id !== region.id) {
          if (r.id.startsWith('sentence-region-')) {
            r.setOptions({ color: 'rgba(255, 255, 255, 0)' });
            if (r.element) {
              r.element.classList.remove('active-sentence-region');
            }
          } else {
            r.remove();
          }
        }
      });

      activeRegionRef.current = region;
      activeSentenceIndexRef.current = null;
      setActiveSentenceIndex(null);
      isDraggingWaveRegionRef.current = true;

      // Không cho phép kéo trượt cả khối vùng (drag: false), cho phép co giãn 2 mép (resize: true)
      region.setOptions({ drag: false, resize: true });
      configureRegionElement(region);

      // Cập nhật tọa độ thời gian thực chính xác từng pixel khi đang quét chuột
      region.on('update', () => {
        activeRegionRef.current = region;
        const exactStart = Number(region.start.toFixed(2));
        const exactEnd = Number(region.end.toFixed(2));
        const exactDur = Number((exactEnd - exactStart).toFixed(2));

        const regObj = {
          start: exactStart,
          end: exactEnd,
          duration: exactDur
        };
        setSelectedRegion(regObj);
        selectedRegionRef.current = regObj;
      });
    });

    // Lưu ý quan trọng: Trong WaveSurfer v7 RegionsPlugin, enableDragSelection phát 'region-created' ngay khi người dùng nhả chuột kết thúc quét vùng!
    wsRegions.on('region-created', (region: Region) => {
      // Nếu là vùng chia sẵn của câu, không xử lý ở đây
      const match = region.id.match(/^sentence-region-(\d+)$/);
      if (match) {
        configureRegionElement(region);
        return;
      }

      // Hoàn tất quét vùng tự do mới: mở khóa ngay isDraggingWaveRegionRef để bộ kiểm soát phạm vi phát hoạt động
      isDraggingWaveRegionRef.current = false;
      lastRegionDragEndTimeRef.current = Date.now();

      // Đảm bảo không kéo khối và không chặn sự kiện chuột
      region.setOptions({ drag: false, resize: true });
      configureRegionElement(region);

      activeRegionRef.current = region;
      activeSentenceIndexRef.current = null;
      setActiveSentenceIndex(null);

      const exactStart = Number(region.start.toFixed(2));
      const exactEnd = Number(region.end.toFixed(2));
      const exactDur = Number((exactEnd - exactStart).toFixed(2));

      const regObj = {
        start: exactStart,
        end: exactEnd,
        duration: exactDur
      };
      setSelectedRegion(regObj);
      selectedRegionRef.current = regObj;

      // Đặt con trỏ phát ngay tại điểm bắt đầu của vùng vừa quét chọn
      ws.setTime(exactStart);
      setCurrentTime(exactStart);
      setLoopCount(0);
      loopCountRef.current = 0;
      showToast(`🎯 Đã chọn vùng: ${formatTime(exactStart)} - ${formatTime(exactEnd)} (${exactDur}s)`);
    });

    // Cập nhật tọa độ chính xác thời gian thực khi đang rê/chỉnh mép vùng
    (wsRegions as any).on('region-update', (region: Region) => {
      activeRegionRef.current = region;
      const exactStart = Number(region.start.toFixed(2));
      const exactEnd = Number(region.end.toFixed(2));
      const exactDur = Number((exactEnd - exactStart).toFixed(2));

      const regObj = {
        start: exactStart,
        end: exactEnd,
        duration: exactDur
      };
      setSelectedRegion(regObj);
      selectedRegionRef.current = regObj;

      if (region.id.startsWith('sentence-region-')) {
        syncRegionToSentence(region, false);
      }
    });

    // Hoàn tất co giãn / chỉnh sửa mép vùng chọn
    wsRegions.on('region-updated', (region: Region) => {
      activeRegionRef.current = region;
      isDraggingWaveRegionRef.current = false;
      lastRegionDragEndTimeRef.current = Date.now();

      const exactStart = Number(region.start.toFixed(2));
      const exactEnd = Number(region.end.toFixed(2));
      const exactDur = Number((exactEnd - exactStart).toFixed(2));

      const regObj = {
        start: exactStart,
        end: exactEnd,
        duration: exactDur
      };
      setSelectedRegion(regObj);
      selectedRegionRef.current = regObj;

      if (region.id.startsWith('sentence-region-')) {
        syncRegionToSentence(region, true);
        configureRegionElement(region);
        ws.setTime(exactStart);
        setCurrentTime(exactStart);
      } else {
        region.setOptions({ drag: false, resize: true });
        configureRegionElement(region);
        // Vùng quét tự do: đặt con trỏ tại đầu vùng và sẵn sàng phát
        ws.setTime(exactStart);
        setCurrentTime(exactStart);
        setLoopCount(0);
        loopCountRef.current = 0;
        showToast(`🎯 Vùng chọn: ${formatTime(exactStart)} - ${formatTime(exactEnd)} (${exactDur}s)`);
      }
    });

    wsRegions.on('region-clicked', (region: Region, e: MouseEvent) => {
      configureRegionElement(region);
      // Nếu người dùng vừa click vào chữ Hán / Pinyin trên vùng sóng để tra từ thì không hủy/đổi vùng chọn sóng âm
      if (Date.now() - lastWordClickTimestampRef.current < 260) return;
      // Nếu nhấp vào chính vùng đang được chọn: hủy chọn vùng này để cho phép chọn vùng mới
      if (activeRegionRef.current && activeRegionRef.current.id === region.id) {
        if (!region.id.startsWith('sentence-region-')) {
          region.remove();
        } else {
          region.setOptions({ color: 'rgba(255, 255, 255, 0)' });
          if (region.element) {
            region.element.classList.remove('active-sentence-region');
          }
        }
        activeRegionRef.current = null;
        setSelectedRegion(null);
        if (selectedRegionRef.current) selectedRegionRef.current = null;
        activeSentenceIndexRef.current = null;
        setActiveSentenceIndex(null);

        // Đặt con trỏ chính xác tại vị trí người dùng nhấp chuột để sẵn sàng chọn vùng mới
        const container = waveformRef.current;
        if (container) {
          const scrollEl = container.querySelector('[part="scroll"]') as HTMLElement | null;
          const rect = container.getBoundingClientRect();
          const scrollLeft = scrollEl?.scrollLeft || 0;
          const scrollWidth = scrollEl?.scrollWidth || rect.width;
          const total = ws.getDuration() || duration;
          if (scrollWidth > 0 && total > 0) {
            const clickX = e.clientX - rect.left + scrollLeft;
            const clickTime = Math.max(0, Math.min(total, (clickX / scrollWidth) * total));
            ws.setTime(clickTime);
            setCurrentTime(clickTime);
            showToast(`📍 Đã bỏ chọn - Sẵn sàng chọn vùng mới từ ${formatTime(clickTime)}`);
          }
        }
        return;
      }

      const match = region.id.match(/^sentence-region-(\d+)$/);
      const targetIdx = match ? parseInt(match[1], 10) : null;

      // Xóa các vùng quét tự do khác để không bị chọn cùng lúc
      const allRegions = wsRegions.getRegions();
      allRegions.forEach(r => {
        if (r.id !== region.id && !r.id.startsWith('sentence-region-')) {
          r.remove();
        }
      });

      const exactStart = Number(region.start.toFixed(2));
      const exactEnd = Number(region.end.toFixed(2));
      const exactDur = Number((exactEnd - exactStart).toFixed(2));
      const regObj = {
        start: exactStart,
        end: exactEnd,
        duration: exactDur
      };

      activeRegionRef.current = region;
      setSelectedRegion(regObj);
      selectedRegionRef.current = regObj;

      if (targetIdx !== null) {
        setActiveSentenceIndex(targetIdx);
        activeSentenceIndexRef.current = targetIdx;
      } else {
        activeSentenceIndexRef.current = null;
        setActiveSentenceIndex(null);
      }

      // Đảm bảo chỉ DUY NHẤT vùng này được chọn, tất cả các vùng đã chọn trước đó bị bỏ chọn
      const currentRegions = wsRegions.getRegions();
      currentRegions.forEach((r) => {
        const isThis = r.id === region.id;
        const col = isThis 
          ? 'rgba(59, 130, 246, 0.28)' 
          : 'rgba(255, 255, 255, 0)';
        r.setOptions({ color: col });
        if (r.element) {
          if (isThis) {
            r.element.classList.add('active-sentence-region');
          } else {
            r.element.classList.remove('active-sentence-region');
          }
        }
      });

      // Đặt con trỏ tại điểm bắt đầu của vùng chọn để chỉ phát âm thanh của đoạn đó
      ws.setTime(exactStart);
      setCurrentTime(exactStart);
      setLoopCount(0);
    });

    // Đảm bảo khi nhả chuột ở bất kỳ đâu thì cờ isDraggingWaveRegionRef luôn được giải phóng
    const handleGlobalPointerUp = () => {
      if (isDraggingWaveRegionRef.current) {
        lastRegionDragEndTimeRef.current = Date.now();
        setTimeout(() => {
          isDraggingWaveRegionRef.current = false;
        }, 60);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      if (charHighlightRafId !== null) {
        cancelAnimationFrame(charHighlightRafId);
        charHighlightRafId = null;
      }
      ws.destroy();
    };
  }, [audioUrl, setupWebAudioNodes]);

  // Transport Controls
  const handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current) return;
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (wavesurferRef.current.isPlaying()) {
      // Dừng lại ngay vị trí của con trỏ phát màu đỏ (không tua lùi về đầu)
      wavesurferRef.current.pause();
      setIsPlaying(false);
      showToast('⏸ Đã tạm dừng tại con trỏ');
    } else {
      const cur = wavesurferRef.current.getCurrentTime();
      const dur = wavesurferRef.current.getDuration() || duration;
      const reg = activeRegionRef.current || selectedRegionRef.current;
      if (reg && reg.end > reg.start + 0.03) {
        // Nếu con trỏ đang nằm ngoài vùng chọn hoặc ở sát cuối vùng chọn, đưa về đầu vùng chọn
        if (cur < reg.start - 0.02 || cur >= reg.end - 0.04) {
          wavesurferRef.current.setTime(reg.start);
          setCurrentTime(reg.start);
        }
      } else {
        // Play entire passage from current cursor position
        if (dur > 0 && cur >= dur - 0.25) {
          wavesurferRef.current.setTime(0);
          setCurrentTime(0);
        }
      }
      wavesurferRef.current.play();
      setIsPlaying(true);
      showToast(reg ? `▶ Đang phát vùng chọn (${formatTime(reg.start)} - ${formatTime(reg.end)})` : '▶ Đang phát từ con trỏ');
    }
  }, [showToast, duration, formatTime]);

  // Cập nhật vị trí hover chuột trên sóng âm và hiệu ứng hover trên từng từ giống phần đọc TextReader
  const handleWaveformMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingThumbRef.current || isHorizontalPanningRef.current) return;
    mouseClientXRef.current = e.clientX;
    const ws = wavesurferRef.current;

    // 1. Đồng bộ hiệu ứng hover từ vựng giống hệt TextReader (khung viền xanh nhạt bo góc + chữ xanh lá #32CD32 viền trắng)
    const shadow = waveformRef.current?.shadowRoot || waveformRef.current?.querySelector('div')?.shadowRoot;
    if (shadow && textOverlayModeRef.current !== 'none') {
      let anyHit = false;
      const cols = shadow.querySelectorAll<HTMLElement>('.region-char-col:not(.region-punct-col)');
      cols.forEach(col => {
        const r = col.getBoundingClientRect();
        const isHit = r.width > 0 && r.height > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (isHit) {
          anyHit = true;
          if (!col.classList.contains('hover-char-col')) col.classList.add('hover-char-col');
        } else if (col.classList.contains('hover-char-col')) {
          col.classList.remove('hover-char-col');
        }
      });
      if (waveformRef.current) {
        waveformRef.current.style.cursor = anyHit ? 'pointer' : '';
      }
    } else if (waveformRef.current) {
      waveformRef.current.style.cursor = '';
    }

    // 2. Tính mốc thời gian dưới trỏ chuột (dùng cho phím tắt F)
    if (!ws) return;
    const scrollEl = getScrollEl();
    if (!scrollEl) return;
    const wrapperEl = scrollEl.querySelector('[part="wrapper"]') as HTMLElement | null;
    const rect = scrollEl.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) + scrollEl.scrollLeft;
    const totalW = wrapperEl?.offsetWidth || scrollEl.scrollWidth || rect.width;
    const totalDur = ws.getDuration() || duration;
    if (totalW > 0 && totalDur > 0) {
      const sec = Math.max(0, Math.min(totalDur, (relativeX / totalW) * totalDur));
      mouseHoverTimeRef.current = sec;
    }
  }, [duration, getScrollEl]);

  const handleWaveformMouseLeave = useCallback(() => {
    mouseClientXRef.current = null;
    mouseHoverTimeRef.current = null;
    if (waveformRef.current) {
      waveformRef.current.style.cursor = '';
    }
    const shadow = waveformRef.current?.shadowRoot || waveformRef.current?.querySelector('div')?.shadowRoot;
    if (shadow) {
      shadow.querySelectorAll<HTMLElement>('.region-char-col.hover-char-col').forEach(col => {
        col.classList.remove('hover-char-col');
      });
    }
  }, []);

  // Bắt sự kiện click chuột trái / chuột phải trên chữ Hán & Pinyin (dự phòng hit-test nếu sự kiện đi xuyên qua Shadow DOM)
  const findHitWordCol = useCallback((clientX: number, clientY: number): HTMLElement | null => {
    if (textOverlayModeRef.current === 'none') return null;
    const shadow = waveformRef.current?.shadowRoot || waveformRef.current?.querySelector('div')?.shadowRoot;
    if (!shadow) return null;
    const cols = shadow.querySelectorAll<HTMLElement>('.region-char-col:not(.region-punct-col)');
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const r = col.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return col;
      }
    }
    return null;
  }, []);

  const handleWaveformWrapperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastWordClickTimestampRef.current < 80) return;
    const hitCol = findHitWordCol(e.clientX, e.clientY);
    if (hitCol) {
      const wordText = hitCol.getAttribute('data-word') || '';
      const wordPinyin = hitCol.getAttribute('data-pinyin') || '';
      if (wordText && /[\u4e00-\u9fa5]/.test(wordText)) {
        e.preventDefault();
        e.stopPropagation();
        handleWordColInteract(hitCol, wordText, wordPinyin, 'info', e.clientX, e.clientY);
      }
    }
  }, [findHitWordCol, handleWordColInteract]);

  const handleWaveformWrapperContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const hitCol = findHitWordCol(e.clientX, e.clientY);
    if (hitCol) {
      const wordText = hitCol.getAttribute('data-word') || '';
      const wordPinyin = hitCol.getAttribute('data-pinyin') || '';
      if (wordText && /[\u4e00-\u9fa5]/.test(wordText)) {
        e.preventDefault();
        e.stopPropagation();
        if (Date.now() - lastWordClickTimestampRef.current < 80) return;
        handleWordColInteract(hitCol, wordText, wordPinyin, 'tools', e.clientX, e.clientY);
      }
    }
  }, [findHitWordCol, handleWordColInteract]);

  // Phím F: Phát phần sóng âm (WaveSurfer), nếu đang chọn vùng thì chỉ phát đúng vùng đó từ đầu đến cuối vùng
  const handlePlayFromHoverToEnd = useCallback(() => {
    if (!wavesurferRef.current) return;
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const ws = wavesurferRef.current;
    const totalDur = ws.getDuration() || duration;
    const reg = activeRegionRef.current || selectedRegionRef.current;

    if (reg && reg.end > reg.start + 0.03) {
      // Nếu đã chọn 1 vùng sóng âm bất kỳ, phát trọn vẹn đoạn vùng chọn đó [reg.start, reg.end]
      ws.setTime(reg.start);
      setCurrentTime(reg.start);
      ws.play().catch(() => {});
      setIsPlaying(true);
      showToast(`▶️ Đang phát vùng chọn (${formatTime(reg.start)} - ${formatTime(reg.end)}) [Phím F]`);
      return;
    }

    let targetTime = mouseHoverTimeRef.current;
    if (targetTime === null || isNaN(targetTime) || targetTime >= totalDur - 0.1) {
      targetTime = 0;
    }
    ws.setTime(targetTime);
    setCurrentTime(targetTime);
    ws.play().catch(() => {});
    setIsPlaying(true);
    showToast(`▶️ Phát phần sóng âm từ ${formatTime(targetTime)} [Phím F]`);
  }, [duration, formatTime, showToast]);

  // Lắng nghe sự kiện phát sóng âm từ phím tắt F toàn cục (từ Practice)
  useEffect(() => {
    const handleTrigger = () => {
      handlePlayFromHoverToEnd();
    };
    window.addEventListener('audacity-play-waveform', handleTrigger);
    return () => {
      window.removeEventListener('audacity-play-waveform', handleTrigger);
    };
  }, [handlePlayFromHoverToEnd]);

  // Cập nhật DOM trực tiếp trên toàn bộ vùng sóng và Shadow DOM để ẩn/hiện chữ Hán và Pinyin ngay lập tức
  const updateOverlayModeDOM = useCallback((mode: 'both' | 'hanzi' | 'pinyin' | 'none') => {
    const container = waveformRef.current;
    if (container) {
      container.setAttribute('data-overlay-mode', mode);

      const roots: (Document | ShadowRoot | HTMLElement)[] = [container];
      const shadow = container.querySelector('div')?.shadowRoot || container.shadowRoot;
      if (shadow) roots.push(shadow);

      roots.forEach(root => {
        const wrappers = root.querySelectorAll('.region-content-wrapper');
        wrappers.forEach((el) => {
          (el as HTMLElement).style.setProperty('display', mode === 'none' ? 'none' : 'flex', 'important');
        });

        const badges = root.querySelectorAll('.region-badge-content');
        badges.forEach((el) => {
          (el as HTMLElement).style.setProperty('display', mode === 'none' ? 'none' : 'flex', 'important');
        });

        const hanzis = root.querySelectorAll('.region-badge-hanzi');
        hanzis.forEach((el) => {
          const isVisible = mode === 'both' || mode === 'hanzi';
          (el as HTMLElement).style.setProperty('display', isVisible ? 'block' : 'none', 'important');
        });

        const pinyins = root.querySelectorAll('.region-badge-pinyin');
        pinyins.forEach((el) => {
          const isVisible = mode === 'both' || mode === 'pinyin';
          const htmlEl = el as HTMLElement;
          htmlEl.style.setProperty('display', isVisible ? 'flex' : 'none', 'important');
          htmlEl.style.height = isVisible ? '20px' : '0px';
          htmlEl.style.maxHeight = isVisible ? '20px' : '0px';
          htmlEl.style.marginBottom = isVisible ? '2px' : '0px';
        });

        const regionContents = root.querySelectorAll('[part*="region-content"]');
        regionContents.forEach((el) => {
          (el as HTMLElement).style.setProperty('display', mode === 'none' ? 'none' : 'flex', 'important');
        });
      });
    }

    // Cập nhật trực tiếp trên từng Region element của WaveSurfer
    const wsRegions = regionsPluginRef.current;
    if (wsRegions) {
      const regions = wsRegions.getRegions();
      regions.forEach(region => {
        if (!region.element) return;
        const wrappers = region.element.querySelectorAll('.region-content-wrapper');
        wrappers.forEach((el) => {
          (el as HTMLElement).style.setProperty('display', mode === 'none' ? 'none' : 'flex', 'important');
        });
        const badges = region.element.querySelectorAll('.region-badge-content');
        badges.forEach((el) => {
          (el as HTMLElement).style.setProperty('display', mode === 'none' ? 'none' : 'flex', 'important');
        });
        const hanzis = region.element.querySelectorAll('.region-badge-hanzi');
        hanzis.forEach((el) => {
          const isVisible = mode === 'both' || mode === 'hanzi';
          (el as HTMLElement).style.setProperty('display', isVisible ? 'block' : 'none', 'important');
        });
        const pinyins = region.element.querySelectorAll('.region-badge-pinyin');
        pinyins.forEach((el) => {
          const isVisible = mode === 'both' || mode === 'pinyin';
          const htmlEl = el as HTMLElement;
          htmlEl.style.setProperty('display', isVisible ? 'flex' : 'none', 'important');
          htmlEl.style.height = isVisible ? '20px' : '0px';
          htmlEl.style.maxHeight = isVisible ? '20px' : '0px';
          htmlEl.style.marginBottom = isVisible ? '2px' : '0px';
        });
        const contentEl = region.element.querySelector('[part*="region-content"]') as HTMLElement | null;
        if (contentEl) {
          contentEl.style.setProperty('display', mode === 'none' ? 'none' : 'flex', 'important');
        }
      });
    }
  }, []);

  const handleSetOverlayMode = useCallback((mode: 'both' | 'hanzi' | 'pinyin' | 'none') => {
    if (mode === 'none') {
      setWordContextMenu(null);
    }
    setTextOverlayMode(mode);
    textOverlayModeRef.current = mode;
    updateOverlayModeDOM(mode);
    syncAllSentenceRegions();

    const labels: Record<string, string> = {
      hanzi: '🈯 Hiển thị: Chữ Hán',
      both: '👁️ Hiển thị: Chữ Hán và Pinyin',
      pinyin: '🔤 Hiển thị: Chỉ Pinyin',
      none: '🙈 Đã ẩn cả 2 (Chữ Hán & Pinyin)'
    };
    showToast(labels[mode]);
  }, [updateOverlayModeDOM, syncAllSentenceRegions, showToast]);

  // Phím P / T: Chuyển đổi vòng tròn giữa 3 chế độ: Chữ Hán -> Chữ Hán và Pinyin -> Ẩn cả 2
  const toggleTextOverlayMode = useCallback(() => {
    const cur = textOverlayModeRef.current;
    const nextMode: 'hanzi' | 'both' | 'none' =
      cur === 'none' ? 'hanzi' : cur === 'hanzi' ? 'both' : 'none';
    handleSetOverlayMode(nextMode);
  }, [handleSetOverlayMode]);

  const handleStop = useCallback(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.pause();
    const reg = activeRegionRef.current || selectedRegionRef.current;
    if (reg) {
      wavesurferRef.current.setTime(reg.start);
      setCurrentTime(reg.start);
    }
    setIsPlaying(false);
    showToast('⏹ Đã dừng');
  }, [showToast]);

  const handleRestart = useCallback(() => {
    if (!wavesurferRef.current) return;
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const reg = activeRegionRef.current || selectedRegionRef.current;
    const target = reg ? reg.start : 0;
    wavesurferRef.current.setTime(target);
    setCurrentTime(target);
    wavesurferRef.current.play();
    setIsPlaying(true);
    setLoopCount(0);
    loopCountRef.current = 0;
    showToast(reg ? `⏮ Phát lại từ đầu vùng chọn (${formatTime(reg.start)} - ${formatTime(reg.end)})` : '⏮ Phát lại từ đầu (Restart)');
  }, [showToast, formatTime]);

  const handleRewindToStart = useCallback(() => {
    if (!wavesurferRef.current) return;
    const reg = activeRegionRef.current || selectedRegionRef.current;
    const target = reg ? reg.start : 0;
    wavesurferRef.current.setTime(target);
    setCurrentTime(target);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    if (!wavesurferRef.current) return;
    const cur = wavesurferRef.current.getCurrentTime();
    const total = wavesurferRef.current.getDuration() || duration;
    const reg = activeRegionRef.current || selectedRegionRef.current;
    const minBound = reg && reg.end > reg.start + 0.03 ? reg.start : 0;
    const maxBound = reg && reg.end > reg.start + 0.03 ? reg.end : total;
    const newTime = Math.max(minBound, Math.min(maxBound, cur + seconds));
    wavesurferRef.current.setTime(newTime);
    setCurrentTime(newTime);

    const scrollEl = getScrollEl();
    if (scrollEl) {
      const containerW = scrollEl.clientWidth;
      const targetPx = newTime * zoomLevelRef.current;
      const curScroll = scrollEl.scrollLeft;
      if (targetPx < curScroll || targetPx > curScroll + containerW * 0.85) {
        const maxScroll = Math.max(0, scrollEl.scrollWidth - containerW);
        scrollEl.scrollLeft = Math.max(0, Math.min(maxScroll, targetPx - containerW * 0.2));
      }
    }
  }, [duration, getScrollEl]);

  const handleClearRegion = useCallback(() => {
    pushHistory('Bỏ chọn vùng sóng');
    activeRegionRef.current = null;
    setSelectedRegion(null);
    if (selectedRegionRef.current) selectedRegionRef.current = null;
    activeSentenceIndexRef.current = null;
    setActiveSentenceIndex(null);
    setLoopCount(0);
    loopCountRef.current = 0;
    if (regionsPluginRef.current) {
      const allRegions = regionsPluginRef.current.getRegions().slice();
      allRegions.forEach((r) => {
        if (!r.id.startsWith('sentence-region-')) {
          r.remove();
        } else {
          r.setOptions({ color: 'rgba(255, 255, 255, 0)' });
          if (r.element) {
            r.element.classList.remove('active-sentence-region');
          }
        }
      });
    }
    showToast('✕ Đã chuyển sang phát toàn bài');
  }, [showToast, pushHistory]);

  // Phím A: Phát đoạn luyện nghe từ đầu đến cuối (hủy khóa vùng chọn nếu có, đưa con trỏ về 0.00s và phát xuyên suốt toàn bài)
  const handlePlayFullFromStart = useCallback(() => {
    if (!wavesurferRef.current) return;
    const ws = wavesurferRef.current;

    pushHistory('Phát toàn bài từ đầu đến cuối');

    activeRegionRef.current = null;
    setSelectedRegion(null);
    if (selectedRegionRef.current) selectedRegionRef.current = null;
    activeSentenceIndexRef.current = 0;
    setActiveSentenceIndex(0);
    setLoopCount(0);
    loopCountRef.current = 0;

    if (regionsPluginRef.current) {
      const allRegions = regionsPluginRef.current.getRegions().slice();
      allRegions.forEach((r) => {
        if (!r.id.startsWith('sentence-region-')) {
          r.remove();
        } else {
          r.setOptions({ color: 'rgba(255, 255, 255, 0)' });
          if (r.element) {
            r.element.classList.remove('active-sentence-region');
          }
        }
      });
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    isLoopSeekingRef.current = true;
    if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);

    ws.setTime(0);
    setCurrentTime(0);

    userScrolledAwayRef.current = false;
    const scrollEl = getScrollEl();
    if (scrollEl) {
      scrollEl.scrollLeft = 0;
      try {
        ws.setScroll(0);
      } catch {}
      updateScrollThumbDOM(0, scrollEl.scrollWidth, scrollEl.clientWidth);
      scheduleScrollMetricsUpdate();
    }

    ws.play().catch(() => {});
    setIsPlaying(true);

    seekLockTimeoutRef.current = setTimeout(() => {
      isLoopSeekingRef.current = false;
    }, 40);

    showToast('▶ Phát đoạn luyện nghe từ đầu đến cuối [Phím A]');
  }, [pushHistory, getScrollEl, updateScrollThumbDOM, scheduleScrollMetricsUpdate, showToast]);

  // Select Entire Audio (Ctrl + A)
  const handleSelectAll = useCallback(() => {
    if (!wavesurferRef.current) return;
    pushHistory('Chọn toàn bộ audio');
    const ws = wavesurferRef.current;
    const total = ws.getDuration() || duration;
    if (total <= 0) return;

    activeRegionRef.current = null;
    const allSel = {
      start: 0,
      end: Number(total.toFixed(2)),
      duration: Number(total.toFixed(2))
    };
    setSelectedRegion(allSel);
    selectedRegionRef.current = allSel;
    activeSentenceIndexRef.current = null;
    setActiveSentenceIndex(null);
    if (regionsPluginRef.current) {
      const allRegions = regionsPluginRef.current.getRegions();
      allRegions.forEach((r) => {
        r.setOptions({ color: 'rgba(59, 130, 246, 0.22)' });
        if (r.element) {
          r.element.classList.remove('active-sentence-region');
        }
      });
    }
    setLoopCount(0);
    showToast('✨ Đã chọn toàn bộ audio (Ctrl + A)');
  }, [duration, showToast, pushHistory]);

  // Phát âm thanh chính xác của từng dòng/câu trong bài đọc
  const handleSelectSentence = useCallback((index: number) => {
    if (!wavesurferRef.current || !regionsPluginRef.current) return;
    const ws = wavesurferRef.current;
    const wsRegions = regionsPluginRef.current;
    const total = ws.getDuration() || duration;
    if (total <= 0) return;

    const timings = customSentencesRef.current.length > 0 ? customSentencesRef.current : (sentenceTimingsRef.current.length > 0 ? sentenceTimingsRef.current : sentenceTimings);
    const seg = timings[index];
    if (!seg) return;

    // Khóa tạm thời sự kiện timeupdate cũ để tránh ghi đè chỉ số vùng hoặc dừng nhầm khi chuyển vùng bằng phím D/S
    isLoopSeekingRef.current = true;
    if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);

    activeSentenceIndexRef.current = index;
    setActiveSentenceIndex(index);

    // Xóa các vùng quét tự do cũ để không bị chọn song song
    const allRegions = wsRegions.getRegions().slice();
    allRegions.forEach(r => {
      if (!r.id.startsWith('sentence-region-')) {
        r.remove();
      }
    });

    let targetRegion = wsRegions.getRegions().find(r => r.id === `sentence-region-${index}`);

    if (!targetRegion && showSentenceTrackRef.current) {
      syncAllSentenceRegions(timings, index);
      targetRegion = wsRegions.getRegions().find(r => r.id === `sentence-region-${index}`);
    } else if (targetRegion) {
      // Cập nhật màu sắc: duy nhất câu đang chọn nổi bật màu xanh dương (active), các câu khác hoàn toàn trong suốt để giữ nền trắng
      const updatedRegions = wsRegions.getRegions();
      updatedRegions.forEach((r) => {
        const isThis = r.id === `sentence-region-${index}`;
        const col = isThis 
          ? 'rgba(59, 130, 246, 0.28)' 
          : 'rgba(255, 255, 255, 0)';
        r.setOptions({ color: col });
        if (r.element) {
          if (isThis) {
            r.element.classList.add('active-sentence-region');
          } else {
            r.element.classList.remove('active-sentence-region');
          }
        }
      });
    }

    const regObj = {
      start: seg.start,
      end: seg.end,
      duration: Number((seg.end - seg.start).toFixed(2))
    };
    activeRegionRef.current = targetRegion || null;
    setSelectedRegion(regObj);
    selectedRegionRef.current = regObj;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Đặt thời gian chính xác tại đầu câu và phát ngay lập tức
    ws.setTime(seg.start);
    setCurrentTime(seg.start);
    ws.play().catch(() => {});
    setIsPlaying(true);
    setLoopCount(0);
    loopCountRef.current = 0;

    seekLockTimeoutRef.current = setTimeout(() => {
      isLoopSeekingRef.current = false;
    }, 150);

    showToast(`▶ Đang phát câu #${index + 1}: "${seg.text}"`);

    // Cuộn câu vào tầm nhìn trên sóng âm nếu cần
    userScrolledAwayRef.current = false;
    const scrollEl = getScrollEl();
    if (scrollEl) {
      const containerW = scrollEl.clientWidth;
      const targetPx = seg.start * zoomLevelRef.current;
      const curScroll = scrollEl.scrollLeft;
      if (targetPx < curScroll || targetPx > curScroll + containerW * 0.85) {
        const maxScroll = Math.max(0, scrollEl.scrollWidth - containerW);
        const target = Math.max(0, Math.min(maxScroll, targetPx - containerW * 0.10));
        scrollEl.scrollLeft = target;
        try {
          ws.setScroll(target);
        } catch {}
        updateScrollThumbDOM(target, scrollEl.scrollWidth, containerW);
        scheduleScrollMetricsUpdate();
      }
    }
  }, [duration, showToast, syncAllSentenceRegions, sentenceTimings, getScrollEl, updateScrollThumbDOM, scheduleScrollMetricsUpdate]);

  // Chuyển sang vùng sóng tiếp theo (Phím D) — Di chuyển tuần tự từng vùng một, không quay vòng khi ở vùng cuối cùng
  const handleNextRegion = useCallback(() => {
    const list = customSentencesRef.current.length > 0 ? customSentencesRef.current : (sentenceTimingsRef.current.length > 0 ? sentenceTimingsRef.current : sentenceTimings);
    if (list && list.length > 0) {
      let curIdx: number | null = null;
      if (activeRegionRef.current && activeRegionRef.current.id.startsWith('sentence-region-')) {
        const match = activeRegionRef.current.id.match(/^sentence-region-(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (parsed >= 0 && parsed < list.length) {
            curIdx = parsed;
          }
        }
      }
      if (curIdx === null && activeSentenceIndexRef.current !== null && activeSentenceIndexRef.current >= 0 && activeSentenceIndexRef.current < list.length) {
        curIdx = activeSentenceIndexRef.current;
      }

      let nextIdx = 0;
      if (curIdx !== null) {
        if (curIdx >= list.length - 1) {
          showToast(`⚠️ Đã ở vùng sóng cuối cùng (#${list.length}) [Phím D]`);
          return;
        }
        nextIdx = curIdx + 1;
      } else {
        const cur = wavesurferRef.current?.getCurrentTime() || 0;
        const found = list.findIndex((s, i) => cur >= s.start - 0.01 && (cur < s.end - 0.01 || i === list.length - 1));
        if (cur <= (list[0]?.start ?? 0) + 0.05 || found === -1) {
          nextIdx = 0;
        } else if (found >= list.length - 1) {
          nextIdx = list.length - 1;
        } else {
          nextIdx = found + 1;
        }
      }

      pushHistory(`Chuyển đến vùng #${nextIdx + 1}`);
      handleSelectSentence(nextIdx);
      showToast(`➡️ Vùng tiếp theo (#${nextIdx + 1}/${list.length}): "${list[nextIdx]?.text.slice(0, 15)}..." [Phím D]`);
      return;
    }

    if (regionsPluginRef.current) {
      const allRegions = regionsPluginRef.current.getRegions().slice().sort((a, b) => a.start - b.start);
      if (allRegions.length > 0) {
        let curIdx = -1;
        if (activeRegionRef.current) {
          curIdx = allRegions.findIndex(r => r.id === activeRegionRef.current?.id);
        }
        if (curIdx === -1) {
          const cur = wavesurferRef.current?.getCurrentTime() || 0;
          const found = allRegions.findIndex((r, i) => cur >= r.start - 0.01 && (cur < r.end - 0.01 || i === allRegions.length - 1));
          if (cur <= (allRegions[0]?.start ?? 0) + 0.05 || found === -1) {
            curIdx = -1;
          } else {
            curIdx = found;
          }
        }

        if (curIdx >= allRegions.length - 1) {
          showToast(`⚠️ Đã ở vùng sóng cuối cùng (#${allRegions.length}) [Phím D]`);
          return;
        }

        const nextIdx = curIdx === -1 ? 0 : curIdx + 1;
        const targetRegion = allRegions[nextIdx];
        if (targetRegion) {
          pushHistory(`Chuyển đến vùng sóng #${nextIdx + 1}`);
          isLoopSeekingRef.current = true;
          if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);

          allRegions.forEach(r => {
            const isThis = r.id === targetRegion.id;
            r.setOptions({
              color: isThis ? 'rgba(59, 130, 246, 0.28)' : 'rgba(255, 255, 255, 0)'
            });
            if (r.element) {
              if (isThis) r.element.classList.add('active-sentence-region');
              else r.element.classList.remove('active-sentence-region');
            }
          });
          activeRegionRef.current = targetRegion;
          const match = targetRegion.id.match(/^sentence-region-(\d+)$/);
          const matchedIdx = match ? parseInt(match[1], 10) : nextIdx;
          activeSentenceIndexRef.current = matchedIdx;
          setActiveSentenceIndex(matchedIdx);

          const regObj = {
            start: Number(targetRegion.start.toFixed(2)),
            end: Number(targetRegion.end.toFixed(2)),
            duration: Number((targetRegion.end - targetRegion.start).toFixed(2))
          };
          setSelectedRegion(regObj);
          selectedRegionRef.current = regObj;
          wavesurferRef.current?.setTime(targetRegion.start);
          setCurrentTime(targetRegion.start);
          wavesurferRef.current?.play().catch(() => {});
          setIsPlaying(true);

          seekLockTimeoutRef.current = setTimeout(() => {
            isLoopSeekingRef.current = false;
          }, 150);

          showToast(`➡️ Vùng sóng tiếp theo (#${nextIdx + 1}/${allRegions.length}): ${formatTime(targetRegion.start)} - ${formatTime(targetRegion.end)} [Phím D]`);
        }
      }
    }
  }, [handleSelectSentence, sentenceTimings, showToast, pushHistory, formatTime]);

  // Trở về vùng sóng phía trước (Phím S) — Di chuyển tuần tự từng vùng một, không quay vòng về vùng cuối khi ở vùng đầu tiên
  const handlePrevRegion = useCallback(() => {
    const list = customSentencesRef.current.length > 0 ? customSentencesRef.current : (sentenceTimingsRef.current.length > 0 ? sentenceTimingsRef.current : sentenceTimings);
    if (list && list.length > 0) {
      let curIdx: number | null = null;
      if (activeRegionRef.current && activeRegionRef.current.id.startsWith('sentence-region-')) {
        const match = activeRegionRef.current.id.match(/^sentence-region-(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (parsed >= 0 && parsed < list.length) {
            curIdx = parsed;
          }
        }
      }
      if (curIdx === null && activeSentenceIndexRef.current !== null && activeSentenceIndexRef.current >= 0 && activeSentenceIndexRef.current < list.length) {
        curIdx = activeSentenceIndexRef.current;
      }

      let prevIdx = 0;
      if (curIdx !== null) {
        if (curIdx <= 0) {
          showToast(`⚠️ Đã ở vùng sóng đầu tiên (#1) [Phím S]`);
          return;
        }
        prevIdx = curIdx - 1;
      } else {
        const cur = wavesurferRef.current?.getCurrentTime() || 0;
        const found = list.findIndex((s, i) => cur >= s.start - 0.01 && (cur < s.end - 0.01 || i === list.length - 1));
        if (found <= 0) {
          showToast(`⚠️ Đã ở vùng sóng đầu tiên (#1) [Phím S]`);
          return;
        }
        prevIdx = found - 1;
      }

      pushHistory(`Trở về vùng #${prevIdx + 1}`);
      handleSelectSentence(prevIdx);
      showToast(`⬅️ Vùng phía trước (#${prevIdx + 1}/${list.length}): "${list[prevIdx]?.text.slice(0, 15)}..." [Phím S]`);
      return;
    }

    if (regionsPluginRef.current) {
      const allRegions = regionsPluginRef.current.getRegions().slice().sort((a, b) => a.start - b.start);
      if (allRegions.length > 0) {
        let curIdx = -1;
        if (activeRegionRef.current) {
          curIdx = allRegions.findIndex(r => r.id === activeRegionRef.current?.id);
        }
        if (curIdx === -1) {
          const cur = wavesurferRef.current?.getCurrentTime() || 0;
          curIdx = allRegions.findIndex((r, i) => cur >= r.start - 0.01 && (cur < r.end - 0.01 || i === allRegions.length - 1));
        }

        if (curIdx <= 0) {
          showToast(`⚠️ Đã ở vùng sóng đầu tiên (#1) [Phím S]`);
          return;
        }

        const prevIdx = curIdx - 1;
        const targetRegion = allRegions[prevIdx];
        if (targetRegion) {
          pushHistory(`Trở về vùng sóng #${prevIdx + 1}`);
          isLoopSeekingRef.current = true;
          if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);

          allRegions.forEach(r => {
            const isThis = r.id === targetRegion.id;
            r.setOptions({
              color: isThis ? 'rgba(59, 130, 246, 0.28)' : 'rgba(255, 255, 255, 0)'
            });
            if (r.element) {
              if (isThis) r.element.classList.add('active-sentence-region');
              else r.element.classList.remove('active-sentence-region');
            }
          });
          activeRegionRef.current = targetRegion;
          const match = targetRegion.id.match(/^sentence-region-(\d+)$/);
          const matchedIdx = match ? parseInt(match[1], 10) : prevIdx;
          activeSentenceIndexRef.current = matchedIdx;
          setActiveSentenceIndex(matchedIdx);

          const regObj = {
            start: Number(targetRegion.start.toFixed(2)),
            end: Number(targetRegion.end.toFixed(2)),
            duration: Number((targetRegion.end - targetRegion.start).toFixed(2))
          };
          setSelectedRegion(regObj);
          selectedRegionRef.current = regObj;
          wavesurferRef.current?.setTime(targetRegion.start);
          setCurrentTime(targetRegion.start);
          wavesurferRef.current?.play().catch(() => {});
          setIsPlaying(true);

          seekLockTimeoutRef.current = setTimeout(() => {
            isLoopSeekingRef.current = false;
          }, 150);

          showToast(`⬅️ Vùng sóng phía trước (#${prevIdx + 1}/${allRegions.length}): ${formatTime(targetRegion.start)} - ${formatTime(targetRegion.end)} [Phím S]`);
        }
      }
    }
  }, [handleSelectSentence, sentenceTimings, showToast, pushHistory, formatTime]);

  // Tính toán mức zoom vừa khít 100% khung nhìn (toàn bộ audio từ đầu đến cuối hiển thị đầy đủ, không có khoảng trống thừa)
  const getFitZoom = useCallback((): number => {
    const ws = wavesurferRef.current;
    if (!ws) return 20;
    const d = ws.getDuration() || duration || 1;
    if (d <= 0) return 20;
    const scrollEl = getScrollEl();
    const containerWidth = scrollEl?.clientWidth || waveformRef.current?.clientWidth || 800;
    return Math.max(1, Math.floor(containerWidth / d));
  }, [duration, getScrollEl]);

  // Fit waveform to container width: dãn trọn không gian trống có sẵn
  const handleZoomFit = useCallback(() => {
    if (!wavesurferRef.current || !isReady) return;
    const ws = wavesurferRef.current;
    try {
      isUserZoomedRef.current = false;
      userScrolledAwayRef.current = false;
      if (!ws.getDecodedData?.()) return;
      const fitZoom = getFitZoom();
      setZoomLevel(fitZoom);
      zoomLevelRef.current = fitZoom;
      ws.zoom(fitZoom);
      ws.setScroll(0);
      const scrollEl = getScrollEl();
      if (scrollEl) scrollEl.scrollLeft = 0;
      updateScrollMetrics();
      showToast(`🔍 Đã dãn sóng âm vừa khít toàn bộ màn hình (${fitZoom} px/s)`);
    } catch {}
  }, [isReady, getFitZoom, getScrollEl, updateScrollMetrics, showToast]);

  // Điều chỉnh phóng to / thu nhỏ sóng âm (nút bấm +, -, phím tắt, thanh toolbar)
  // - Khi phóng to / thu nhỏ: Cố định vị trí trọng tâm (vùng chọn, hoặc playhead, hoặc tâm khung nhìn)
  // - Cho phép thu nhỏ (zoom out) co sóng âm lại tự nhiên mà không bị kẹt hay cứng ngắc
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!isReady || !wavesurferRef.current) return;
    const ws = wavesurferRef.current;
    if (!ws.getDecodedData?.()) return;
    isUserZoomedRef.current = true;

    const currentZoom = zoomLevelRef.current;
    const fitZoom = getFitZoom();
    const totalDur = ws.getDuration() || duration || 1;
    // Cho phép thu nhỏ co sóng âm lại mượt mà tới 10% fitZoom
    const minZoom = Math.max(1, Math.floor(fitZoom * 0.10));

    let nextZoom: number;
    if (direction === 'in') {
      nextZoom = Math.min(3000, Math.max(currentZoom + 4, Math.round(currentZoom * 1.25)));
    } else {
      nextZoom = Math.max(minZoom, Math.min(currentZoom - 4, Math.round(currentZoom / 1.25)));
    }

    if (nextZoom === currentZoom) return;

    const scrollEl = getScrollEl();
    const containerWidth = scrollEl?.clientWidth || waveformRef.current?.clientWidth || 800;
    const currentScroll = scrollEl ? scrollEl.scrollLeft : 0;

    let anchorTime: number;
    let anchorScreenX: number;
    let toastLabel: string;

    if (selectedRegionRef.current && selectedRegionRef.current.end > selectedRegionRef.current.start) {
      anchorTime = (selectedRegionRef.current.start + selectedRegionRef.current.end) / 2;
      anchorScreenX = anchorTime * currentZoom - currentScroll;
      if (anchorScreenX < 0 || anchorScreenX > containerWidth) {
        anchorScreenX = containerWidth / 2;
      }
      toastLabel = `vùng chọn (${formatTime(selectedRegionRef.current.start)} - ${formatTime(selectedRegionRef.current.end)})`;
    } else {
      const playhead = ws.getCurrentTime() ?? currentTime ?? 0;
      const playheadScreenX = playhead * currentZoom - currentScroll;
      if (playheadScreenX >= 0 && playheadScreenX <= containerWidth) {
        anchorTime = playhead;
        anchorScreenX = playheadScreenX;
        toastLabel = `vạch đỏ (${formatTime(anchorTime)})`;
      } else {
        anchorScreenX = containerWidth / 2;
        anchorTime = (currentScroll + anchorScreenX) / Math.max(1, currentZoom);
        toastLabel = `tâm màn hình (${formatTime(anchorTime)})`;
      }
    }

    anchorTime = Math.max(0, Math.min(totalDur, anchorTime));
    const targetScroll = anchorTime * nextZoom - anchorScreenX;
    const maxScroll = Math.max(0, totalDur * nextZoom - containerWidth);
    const finalScroll = Math.max(0, Math.min(maxScroll, targetScroll));

    try {
      ws.zoom(nextZoom);
      if (scrollEl) scrollEl.scrollLeft = finalScroll;
      try { ws.setScroll(finalScroll); } catch {}
      setZoomLevel(nextZoom);
      zoomLevelRef.current = nextZoom;
      updateScrollThumbDOM(finalScroll, totalDur * nextZoom, containerWidth);
      scheduleScrollMetricsUpdate();

      showToast(
        direction === 'in'
          ? `🎯 Phóng to tại ${toastLabel}: ${nextZoom} px/s`
          : nextZoom === fitZoom
          ? `🔍 Toàn bộ audio vừa khít khung nhìn (${fitZoom} px/s)`
          : `🔍 Thu nhỏ tại ${toastLabel}: ${nextZoom} px/s`
      );
    } catch {}
  }, [isReady, duration, currentTime, getFitZoom, getScrollEl, updateScrollThumbDOM, scheduleScrollMetricsUpdate, showToast, formatTime]);

  // Xử lý zoom bằng con lăn chuột (Ctrl + Wheel hoặc Trackpad pinch) với requestAnimationFrame mượt mà 60fps
  // Chuẩn Audacity: Lấy vị trí con trỏ chuột hiện tại làm tâm neo (anchor point)
  // (tức mốc thời gian ngay dưới trỏ chuột giữ nguyên vị trí chính xác trên màn hình khi zoom)
  const applyWheelZoom = useCallback(() => {
    if (!wavesurferRef.current || !isReady) return;
    const ws = wavesurferRef.current;
    if (!ws.getDecodedData?.()) return;

    const deltaY = wheelAccumulatorRef.current;
    wheelAccumulatorRef.current = 0;
    const mouseClientX = wheelMouseXRef.current ?? mouseClientXRef.current;
    wheelMouseXRef.current = null;

    if (Math.abs(deltaY) < 0.5) return;

    isUserZoomedRef.current = true;
    const currentZoom = zoomLevelRef.current;
    const fitZoom = getFitZoom();
    const totalDur = ws.getDuration() || duration || 1;
    const minZoom = Math.max(1, Math.floor(fitZoom * 0.10));

    let nextZoom: number;
    const zoomFactor = Math.exp(-deltaY * 0.0018);
    nextZoom = Math.round(currentZoom * zoomFactor);

    if (deltaY > 0) {
      // Thu nhỏ
      if (nextZoom >= currentZoom) nextZoom = currentZoom - 1;
      nextZoom = Math.max(minZoom, nextZoom);
    } else {
      // Phóng to
      if (nextZoom <= currentZoom) nextZoom = currentZoom + 1;
      nextZoom = Math.min(3000, nextZoom);
    }

    if (nextZoom === currentZoom) return;

    const scrollEl = getScrollEl();
    const containerRect = waveformRef.current?.getBoundingClientRect();
    const containerWidth = scrollEl?.clientWidth || containerRect?.width || 800;
    const currentScroll = scrollEl ? scrollEl.scrollLeft : 0;

    let anchorTime: number;
    let anchorScreenX: number;

    if (mouseClientX !== null && containerRect) {
      anchorScreenX = Math.max(0, Math.min(containerWidth, mouseClientX - containerRect.left));
      anchorTime = (currentScroll + anchorScreenX) / Math.max(1, currentZoom);
      anchorTime = Math.max(0, Math.min(totalDur, anchorTime));
    } else if (selectedRegionRef.current && selectedRegionRef.current.end > selectedRegionRef.current.start) {
      anchorTime = (selectedRegionRef.current.start + selectedRegionRef.current.end) / 2;
      anchorScreenX = anchorTime * currentZoom - currentScroll;
      if (anchorScreenX < 0 || anchorScreenX > containerWidth) {
        anchorScreenX = containerWidth / 2;
      }
    } else {
      const playhead = ws.getCurrentTime() ?? currentTime ?? 0;
      const playheadScreenX = playhead * currentZoom - currentScroll;
      if (playheadScreenX >= 0 && playheadScreenX <= containerWidth) {
        anchorTime = playhead;
        anchorScreenX = playheadScreenX;
      } else {
        anchorScreenX = containerWidth / 2;
        anchorTime = (currentScroll + anchorScreenX) / Math.max(1, currentZoom);
      }
    }

    anchorTime = Math.max(0, Math.min(totalDur, anchorTime));
    const targetScroll = anchorTime * nextZoom - anchorScreenX;
    const maxScroll = Math.max(0, totalDur * nextZoom - containerWidth);
    const finalScroll = Math.max(0, Math.min(maxScroll, targetScroll));

    try {
      ws.zoom(nextZoom);
      if (scrollEl) scrollEl.scrollLeft = finalScroll;
      try { ws.setScroll(finalScroll); } catch {}
      setZoomLevel(nextZoom);
      zoomLevelRef.current = nextZoom;
      updateScrollThumbDOM(finalScroll, totalDur * nextZoom, containerWidth);
      scheduleScrollMetricsUpdate();

      if (zoomToastTimeoutRef.current) clearTimeout(zoomToastTimeoutRef.current);
      zoomToastTimeoutRef.current = setTimeout(() => {
        showToast(
          deltaY < 0 
            ? `🎯 Dãn sóng: ${nextZoom} px/s` 
            : nextZoom === fitZoom
            ? `🔍 Toàn bộ audio vừa khít khung nhìn (${fitZoom} px/s)`
            : `🔍 Thu nhỏ sóng: ${nextZoom} px/s`
        );
      }, 150);
    } catch {}
  }, [isReady, duration, currentTime, getFitZoom, getScrollEl, updateScrollThumbDOM, scheduleScrollMetricsUpdate, showToast]);

  const handleZoomWheel = useCallback((deltaY: number, mouseClientX?: number) => {
    wheelAccumulatorRef.current += deltaY;
    if (mouseClientX !== undefined) {
      wheelMouseXRef.current = mouseClientX;
    }
    if (wheelRafRef.current === null) {
      wheelRafRef.current = requestAnimationFrame(() => {
        applyWheelZoom();
        wheelRafRef.current = null;
      });
    }
  }, [applyWheelZoom]);

  // Lắng nghe sự kiện Mouse Wheel:
  // - Khi giữ Ctrl: ZOOM CUỘN SÓNG (Neo chính xác ngay tại vị trí con trỏ chuột)
  // - Khi giữ Shift hoặc vuốt ngang Touchpad: Cuộn ngang sóng âm mượt mà theo trục thời gian
  // - Khi KHÔNG giữ Ctrl: Lăn chuột thông thường CHO PHÉP CUỘN TRANG BÌNH THƯỜNG!
  useEffect(() => {
    const el = playerContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Nếu đang mở modal (như Hướng dẫn phím tắt hoặc DSP Effects) và chuột nằm trong modal thì cho phép cuộn bình thường
      const target = e.target as HTMLElement | null;
      if (target?.closest('.fixed.z-50')) {
        return;
      }

      // 1. Phóng to / thu nhỏ khi giữ phím Ctrl / Cmd (Ctrl + Cuộn chuột = Dãn sóng âm theo chiều ngang)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoomWheel(e.deltaY, e.clientX);
        return;
      }

      // 2. Nếu giữ Shift + Cuộn chuột: Cuộn ngang sóng âm
      if (e.shiftKey) {
        e.preventDefault();
        userScrolledAwayRef.current = true;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        scrollWaveformBy(delta);
        return;
      }

      // 3. Nếu dùng trackpad cử chỉ cuộn ngang rõ rệt (deltaX):
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 1.5) {
        e.preventDefault();
        userScrolledAwayRef.current = true;
        scrollWaveformBy(e.deltaX);
        return;
      }

      // 4. Lăn chuột thông thường KHÔNG giữ Ctrl:
      // Cho phép cuộn thanh bên phải trang web một cách tự nhiên (KHÔNG gọi e.preventDefault())
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (zoomToastTimeoutRef.current) clearTimeout(zoomToastTimeoutRef.current);
    };
  }, [handleZoomWheel, scrollWaveformBy]);

  // Tự động dãn sóng âm và các vùng regions chiếm trọn không gian trống có sẵn
  useEffect(() => {
    const el = waveformRef.current;
    if (!el || !wavesurferRef.current || !isReady) return;

    const handleResize = () => {
      const ws = wavesurferRef.current;
      if (!ws) return;
      try {
        if (!ws.getDecodedData?.()) return;
        const total = ws.getDuration() || duration;
        if (total <= 0) return;
        updateScrollMetrics();
      } catch {
        // Tránh quăng lỗi No audio loaded khi sóng âm chưa nạp xong
      }
    };

    handleResize();

    let rafId: number | null = null;
    let prevWidth = 0;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        // Chỉ kích hoạt khi bề ngang thực sự thay đổi ít nhất 4px
        if (Math.abs(cr.width - prevWidth) >= 4) {
          prevWidth = cr.width;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            handleResize();
          });
        }
      }
    });
    ro.observe(el);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [isReady, duration, getFitZoom, getScrollEl, updateScrollMetrics]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Kiểm tra: Không kích hoạt nếu người dùng đang gõ trong input, textarea, select hoặc contenteditable
      const target = e.target as HTMLElement | null;
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

      // 0. Phím Escape: Thoát toàn màn hình nếu đang phóng to
      if (e.key === 'Escape' && isMaximized) {
        e.preventDefault();
        setIsMaximized(false);
        showToast('🗗 Đã thu nhỏ phòng nghe');
        return;
      }

      // 1. Phím Ctrl+Z / Cmd+Z: Quay lại thao tác (Undo)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 1.2. Phím D: Chuyển sang vùng sóng tiếp theo (từng vùng một, không lặp nhảy cóc)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        handleNextRegion();
        return;
      }

      // 1.3. Phím S: Trở về vùng sóng phía trước (từng vùng một, không lặp nhảy cóc)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        handlePrevRegion();
        return;
      }

      // 1.4. Phím A: Phát đoạn luyện nghe từ đầu đến cuối
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        handlePlayFullFromStart();
        return;
      }

      // 1.5. Phím Ctrl+A / Cmd+A: Chọn toàn bộ đoạn audio
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // 2. Phím Space: Phát / Dừng (Chặn cuộn trang mặc định)
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
        return;
      }

      // 3. Phím Mũi tên Trái / Phải trên bàn phím: Di chuyển thanh trỏ màu đỏ lùi / tới 2 giây (sóng âm tự động cuộn theo vạch đỏ)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-2);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(2);
        return;
      }

      // 4. Phím L: Bật/Tắt chế độ lặp lại
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        toggleLooping();
        return;
      }

      // 5. Phím M: Bật/Tắt tiếng
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => {
          const next = !prev;
          showToast(next ? '🔇 Đã tắt tiếng (Mute)' : '🔊 Đã bật tiếng (Unmute)');
          return next;
        });
        return;
      }

      // 6. Phím R: Phát lại từ đầu đoạn region đang chọn, hoặc phát lại từ đầu toàn bộ file nếu không có region
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
        return;
      }

      // 7. Phím Delete / Backspace: Xóa/hủy bỏ vùng đang quét chọn
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleClearRegion();
        return;
      }

      // 8. Chặn phím Ctrl+S / Cmd+S lưu trang mặc định của trình duyệt
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }

      // 9. Phím Thu phóng: + / = phóng to, - thu nhỏ, 0 vừa màn hình
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoom('in');
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom('out');
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        handleZoomFit();
        return;
      }

      // 10. Phím F: Phát từ vị trí con trỏ chuột đến hết vùng quét
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handlePlayFromHoverToEnd();
        return;
      }

      // 10.5. Phím P hoặc T: Ẩn/Hiện Chữ Hán & Pinyin trên dải sóng âm
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        e.stopPropagation();
        toggleTextOverlayMode();
        return;
      }

      // 11. Phím ? hoặc H: Bật/Tắt bảng hướng dẫn phím tắt
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowShortcutHelp((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowShortcutHelp(false);
        setIsOverlayMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handleSkip, handleRestart, handleClearRegion, handlePlayFullFromStart, handleZoom, handleZoomFit, handleSelectAll, toggleLooping, handlePlayFromHoverToEnd, handleUndo, handleNextRegion, handlePrevRegion, isMaximized, showToast, setShowShortcutHelp, toggleTextOverlayMode]);

  return (
    <div
      ref={playerContainerRef}
      className={
        waveformOnly
          ? "w-full flex flex-col select-none"
          : isMaximized
          ? "fixed inset-0 z-[99999] bg-white w-screen h-screen m-0 p-0 overflow-hidden flex flex-col select-none"
          : "w-full flex-1 min-h-0 flex flex-col select-none"
      }
    >
      <div
        className={`w-full flex-1 min-h-0 bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden ${
          waveformOnly
            ? "rounded-xl overflow-hidden border border-slate-200 shadow-2xs"
            : isMaximized
            ? "h-screen w-screen rounded-none border-0 shadow-none"
            : "rounded-3xl overflow-hidden shadow-xl border border-slate-200/90"
        }`}
      >
        {/* 1. AUDACITY MAIN APP HEADER BAR (GỌN GÀNG 1 HÀNG, KHÔNG CHIẾM DIỆN TÍCH) */}
        {!waveformOnly && (
          <div className="bg-white px-3 sm:px-4 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap select-none">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Music className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide text-slate-900 shrink-0">
                  LUYỆN NGHE ĐOẠN VĂN
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold uppercase hidden sm:inline shrink-0">
                  PRO
                </span>
                {lessonTitle && (
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[150px] sm:max-w-[300px] hidden md:inline">
                    • {lessonTitle}
                  </span>
                )}
              </div>
            </div>

            {/* Header Controls: Close button */}
            {onClose && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="Đóng phòng nghe"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. AUDACITY MAIN TRANSPORT & TIME TOOLBAR (THANH ĐIỀU KHIỂN GỌN GÀNG 1 HÀNG) */}
        {!waveformOnly && (
          <div className="bg-slate-100/90 px-2.5 sm:px-3 py-1 border-b border-slate-200 flex items-center justify-between gap-1.5 sm:gap-2 text-slate-700 overflow-x-auto no-scrollbar">
            {/* Left controls: Transport, Loop, Speed */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Playback Transport Buttons */}
              <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={handleRestart}
                  disabled={!isReady}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition disabled:opacity-40 cursor-pointer"
                  title="Phát lại từ đầu (Phím R)"
                >
                  <Rewind className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  disabled={!isReady}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition text-xs shadow-xs cursor-pointer ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 ring-1 ring-rose-400/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 ring-1 ring-emerald-400/40'
                  } disabled:opacity-40`}
                  title={isPlaying ? 'Dừng (Phím Space)' : 'Phát (Phím Space)'}
                >
                  {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Dừng' : 'Phát'}</span>
                </button>

                <button
                  onClick={handleStop}
                  disabled={!isReady}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-rose-600 rounded-lg transition disabled:opacity-40 cursor-pointer"
                  title="Dừng và về đầu (Stop)"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  onClick={() => handleSkip(-3)}
                  disabled={!isReady}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition disabled:opacity-40 cursor-pointer"
                  title="Tua lùi 3 giây (Phím ←)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleSkip(3)}
                  disabled={!isReady}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition disabled:opacity-40 cursor-pointer"
                  title="Tua tới 3 giây (Phím →)"
                >
                  <FastForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Loop Button */}
              <button
                onClick={toggleLooping}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
                  isLooping
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#FFFFF0] border-slate-200 text-slate-700 hover:bg-amber-50/50'
                }`}
                title="Bật/Tắt chế độ lặp lại (Phím L)"
              >
                <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'animate-spin-slow' : ''}`} />
                <span className="hidden sm:inline">Lặp</span>
                {isLooping && (
                  <span className="text-[10px] px-1 rounded-full bg-blue-800 text-blue-100 font-mono">
                    {loopCount > 0 ? `#${loopCount}` : 'ON'}
                  </span>
                )}
              </button>

              {/* Playback Rate */}
              <div className="flex items-center gap-0.5 bg-[#FFFFF0] px-1.5 py-1 rounded-xl border border-slate-200 text-xs shadow-xs">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold transition cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={`Tốc độ ${rate}x`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Nút Trước, Sau và Quay lại di chuyển qua gần tốc độ âm thanh */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={handlePrevRegion}
                  disabled={!isReady}
                  className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl border text-xs font-bold bg-[#FFFFF0] border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer disabled:opacity-40 shadow-xs"
                  title="Vùng trước (Phím S)"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden md:inline">Trước (S)</span>
                </button>

                <button
                  onClick={handleNextRegion}
                  disabled={!isReady}
                  className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl border text-xs font-bold bg-[#FFFFF0] border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer disabled:opacity-40 shadow-xs"
                  title="Vùng sau / tiếp theo (Phím D)"
                >
                  <span className="hidden md:inline">Sau (D)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                </button>

                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`p-1.5 sm:px-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs bg-[#FFFFF0] ${
                    canUndo
                      ? 'border-slate-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                      : 'border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                  }`}
                  title="Quay lại thao tác / Hoàn tác (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Ô thời gian đặt ở giữa nút quay lại và nút ẩn hiện (sắp xếp gần nhau) */}
              <div className="flex items-center gap-1.5 bg-[#FFFFF0] px-2.5 py-1 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 shadow-xs">
                <span className="text-emerald-600 font-bold">{formatTime(currentTime)}</span>
                <span className="text-slate-300">/</span>
                {selectedRegion ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1" title={`Vùng chọn: ${selectedRegion.duration}s`}>
                    <span>{formatTime(selectedRegion.start)} - {formatTime(selectedRegion.end)}</span>
                    <button
                      onClick={handleClearRegion}
                      className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Bỏ chọn vùng (Delete)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium text-[11px] font-sans">Toàn bài</span>
                )}
              </div>

              {/* 3 nút lựa chọn chế độ hiển thị trên dải sóng: 1. Chữ Hán, 2. Chữ Hán và Pinyin, 3. Ẩn cả 2 */}
              <div className="flex items-center gap-0.5 bg-[#FFFFF0] p-0.5 rounded-xl border border-slate-200 text-xs shadow-xs select-none">
                <button
                  type="button"
                  onClick={() => handleSetOverlayMode('hanzi')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    textOverlayMode === 'hanzi'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="1. Chỉ hiển thị Chữ Hán"
                >
                  <span>Chữ Hán</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOverlayMode('both')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    textOverlayMode === 'both'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="2. Hiển thị cả Chữ Hán và Pinyin"
                >
                  <span>Chữ Hán và Pinyin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOverlayMode('none')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    textOverlayMode === 'none'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="3. Ẩn cả Chữ Hán và Pinyin"
                >
                  <span>Ẩn cả 2</span>
                </button>
              </div>
            </div>

            {/* Right controls: Cuộn & Phím tắt */}
            <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Cuộn ngang */}
              <div className="flex items-center bg-white px-1 py-0.5 rounded-xl border border-slate-200 gap-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleScrollHorizontal(-260)}
                  className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-md transition cursor-pointer"
                  title="Cuộn sang trái"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollHorizontal(260)}
                  className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-md transition cursor-pointer"
                  title="Cuộn sang phải"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Nút bật/tắt bảng Giọng đọc & Track trên màn hình điện thoại (< md) */}
              <button
                type="button"
                onClick={() => setShowMobileTrackControls(prev => !prev)}
                className={`md:hidden px-2 py-1 rounded-xl transition cursor-pointer border shadow-xs flex items-center gap-1 text-xs font-semibold ${
                  showMobileTrackControls
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                }`}
                title="Bật/Tắt bảng Giọng đọc & Track"
              >
                <Sliders className={`w-3.5 h-3.5 ${showMobileTrackControls ? 'text-white' : 'text-blue-600'}`} />
                <span>Giọng</span>
              </button>

              {/* Nút Hướng dẫn phím tắt */}
              <button
                type="button"
                onClick={() => setShowShortcutHelp(true)}
                className="px-2 py-1 rounded-xl transition cursor-pointer border shadow-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 flex items-center gap-1 text-xs font-semibold"
                title="Hướng dẫn phím tắt (H)"
              >
                <Keyboard className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Phím tắt</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. AUDACITY SPLIT-PANE LAYOUT: CỘT TRÁI CỐ ĐỊNH (FIXED LEFT PANEL) & CỘT PHẢI CUỘN NGANG ĐỒNG BỘ (SCROLLABLE VIEWPORT) */}
        <div className={`flex flex-row w-full flex-1 min-h-0 bg-white ${waveformOnly ? '' : 'border-b border-slate-200'}`}>
          {/* ======================================================== */}
          {/* CỘT TRÁI CỐ ĐỊNH (FIXED LEFT PANEL: flex-shrink-0) */}
          {/* Gồm: 1. Khoảng trống góc trên khớp Time Ruler (24px) */}
          {/*      2. Track Controls (Mute, Solo, Volume...) + Thước đo biên độ dọc (1.0, 0.5, 0.0, -0.5, -1.0) */}
          {/*      3. Góc dưới khớp với Thanh cuộn ngang (26px) */}
          {/* ======================================================== */}
          <div className="flex flex-col shrink-0 select-none bg-slate-50 border-r border-slate-300 z-20">
            {/* 1. Khoảng trống góc trên khớp chính xác chiều cao 24px với Thước đo thời gian (Time Ruler) */}
            <div className="h-[24px] bg-[#e8edf2] border-b border-slate-300 flex items-center justify-between px-1.5 sm:px-2 font-mono text-[10px] text-slate-600 font-bold shrink-0">
              {!waveformOnly && <span className={`${showMobileTrackControls ? 'inline' : 'hidden md:inline'} truncate text-[9px] uppercase tracking-wider text-slate-500`}>Track Controls</span>}
              <span className="ml-auto pr-0.5 text-slate-700" title="Đơn vị thời gian: Giây (seconds)">s</span>
            </div>

            {/* 2. Phần thân Cột Trái: Bảng điều khiển Track + Thước đo biên độ dọc (1.0, 0.5, 0.0, -0.5, -1.0) */}
            <div
              className="flex flex-row shrink-0 overflow-hidden"
              style={{ height: `${waveformHeight}px` }}
            >
              {/* Bảng điều khiển Track (Mute, Solo, Volume/Gain, Pan, TTS Voice) - Ẩn mặc định trên mobile để nhường chỗ cho sóng âm */}
              {!waveformOnly && (
                <div className={`${showMobileTrackControls ? 'flex' : 'hidden md:flex'} w-44 sm:w-56 h-full bg-slate-50/95 p-2 sm:p-2.5 border-r border-slate-200 flex-col justify-between gap-2 shrink-0 overflow-y-auto text-slate-700`}>
                  {/* 1. Track Name & Format Info */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs text-slate-800 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      {isEditingTrackName ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={trackName}
                            onChange={(e) => setTrackName(e.target.value)}
                            onBlur={() => setIsEditingTrackName(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTrackName(false)}
                            autoFocus
                            className="w-full bg-white text-xs px-2 py-1 rounded-md border border-blue-500 text-slate-900 outline-none"
                          />
                          <button
                            onClick={() => setIsEditingTrackName(false)}
                            className="p-1 text-emerald-600 hover:bg-slate-100 rounded-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsEditingTrackName(true)}
                          className="flex items-center gap-1.5 cursor-pointer group flex-1 min-w-0"
                          title="Nhấn để đổi tên track"
                        >
                          <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-600">
                            <Music className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-600 transition">
                            {trackName}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto group-hover:text-blue-500 transition" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                        {trackInfo.channels}
                      </span>
                      <span className="font-mono font-medium text-slate-500">
                        {trackInfo.sampleRate}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        32-bit
                      </span>
                    </div>
                  </div>

                  {/* 2. Giọng đọc chuẩn đoạn văn */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-center gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Giọng đọc AI</span>
                      <span className="text-[9px] font-semibold text-blue-600 normal-case">Online (Natural)</span>
                    </div>
                    <select
                      value={activeVoiceUri?.toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural'}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition bg-slate-50 text-slate-800 border-slate-200 outline-none hover:bg-slate-100 focus:border-blue-400 cursor-pointer truncate shadow-2xs"
                      title="Chọn giọng đọc: 晓晓 Online (Natural) hoặc 云希 Online (Natural)"
                    >
                      <option value="zh-CN-XiaoxiaoNeural">
                        晓晓 Online (Natural) - Chinese (Mandarin, Simplified)
                      </option>
                      <option value="zh-CN-YunxiNeural">
                        云希 Online (Natural) - Chinese (Mandarin, Simplified)
                      </option>
                    </select>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleVoiceChange('zh-CN-XiaoxiaoNeural')}
                        className={`py-1 px-1.5 rounded-lg font-bold text-center transition cursor-pointer border flex items-center justify-center gap-1 ${
                          !activeVoiceUri?.toLowerCase().includes('yunxi')
                            ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="晓晓 Online (Natural) - Chinese (Mandarin, Simplified)"
                      >
                        <span>👩 晓晓 (Nữ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVoiceChange('zh-CN-YunxiNeural')}
                        className={`py-1 px-1.5 rounded-lg font-bold text-center transition cursor-pointer border flex items-center justify-center gap-1 ${
                          activeVoiceUri?.toLowerCase().includes('yunxi')
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="云希 Online (Natural) - Chinese (Mandarin, Simplified)"
                      >
                        <span>👨 云希 (Nam)</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Mute, Solo & Effects */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-center gap-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                          isMuted
                            ? 'bg-rose-600 text-white border-rose-500 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                        title="Tắt tiếng track (Phím M)"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>Mute</span>
                      </button>

                      <button
                        onClick={() => setIsSolo(!isSolo)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                          isSolo
                            ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                        title="Phát độc lập track này (Solo)"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Solo</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setIsEffectsModalOpen(true)}
                      className="w-full py-1.5 px-2.5 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Mở bảng hiệu ứng âm thanh DSP"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Effects (DSP)...</span>
                    </button>
                  </div>

                  {/* 4. Gain (Volume) & Pan Sliders */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex-1 flex flex-col justify-between gap-2 min-h-[124px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Volume (Gain)</span>
                        <button
                          type="button"
                          onClick={() => setGainDb(0)}
                          title="Nhấn để đặt lại 0 dB"
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            gainDb === 0
                              ? 'bg-slate-50 text-slate-600 border-slate-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {gainDb > 0 ? `+${gainDb}` : gainDb} dB
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">-</span>
                        <input
                          type="range"
                          min="-24"
                          max="12"
                          step="1"
                          value={gainDb}
                          onChange={(e) => setGainDb(Number(e.target.value))}
                          onDoubleClick={() => setGainDb(0)}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-[10px] text-slate-400 font-mono font-bold">+</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 px-2">
                        <span>-24dB</span>
                        <span>0dB</span>
                        <span>+12dB</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Pan (Cân bằng)</span>
                        <button
                          type="button"
                          onClick={() => setPanValue(0)}
                          title="Nhấn để đặt lại Center"
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            panValue === 0
                              ? 'bg-slate-50 text-indigo-600 border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {panValue === 0
                            ? 'Center'
                            : panValue < 0
                            ? `${Math.round(Math.abs(panValue) * 100)}% L`
                            : `${Math.round(panValue * 100)}% R`}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">L</span>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.05"
                          value={panValue}
                          onChange={(e) => setPanValue(Number(e.target.value))}
                          onDoubleClick={() => setPanValue(0)}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-mono font-bold">R</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 px-2">
                        <span>100% L</span>
                        <span>C</span>
                        <span>100% R</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thước đo biên độ dọc (Vertical Amplitude Scale: 1.0, 0.5, 0.0, -0.5, -1.0) luôn cố định ở mép phải của Cột Trái */}
              <div
                className="w-10 sm:w-12 bg-white flex flex-col justify-between items-end pr-1 py-2 font-mono text-[9px] text-slate-600 shrink-0"
                style={{ height: `${waveformHeight}px`, backgroundColor: '#ffffff' }}
              >
                <div className="flex items-center gap-0.5">
                  <span>1.0</span>
                  <div className="w-1.5 h-px bg-slate-400" />
                </div>
                <div className="flex items-center gap-0.5">
                  <span>0.5</span>
                  <div className="w-1 h-px bg-slate-400" />
                </div>
                <div className="flex items-center gap-0.5 text-slate-800 font-bold">
                  <span>0.0</span>
                  <div className="w-2 h-px bg-blue-600" />
                </div>
                <div className="flex items-center gap-0.5">
                  <span>-0.5</span>
                  <div className="w-1 h-px bg-slate-400" />
                </div>
                <div className="flex items-center gap-0.5">
                  <span>-1.0</span>
                  <div className="w-1.5 h-px bg-slate-400" />
                </div>
              </div>
            </div>

            {/* 3. Khoảng trống góc dưới của Cột Trái khớp chiều cao 26px với Thanh cuộn ngang */}
            <div className="h-[26px] bg-[#d9dde2] border-t border-[#b8bec5] flex items-center justify-center shrink-0">
              <div className="w-3 h-1 bg-[#8c96a0] rounded-xs opacity-75" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* CỘT PHẢI: KHU VỰC CUỘN NGANG ĐỒNG BỘ (SCROLLABLE VIEWPORT) */}
          {/* Chứa: 1. Thước đo thời gian (Time Ruler - 24px ở trên) + Biểu đồ sóng âm & Chữ Hán/Pinyin (ở dưới) trong cùng scroll container */}
          {/*       2. Thanh cuộn ngang cổ điển Audacity (2 nút mũi tên 2 đầu + con trượt xám 60fps) ở đáy */}
          {/* ======================================================== */}
          <div
            ref={waveformWrapperRef}
            className="flex-1 relative flex flex-col justify-start min-w-0 bg-white overflow-hidden"
            style={{ backgroundColor: '#ffffff' }}
            onMouseMove={handleWaveformMouseMove}
            onMouseLeave={handleWaveformMouseLeave}
            onClick={handleWaveformWrapperClick}
            onContextMenu={handleWaveformWrapperContextMenu}
          >
            {/* Floating minimal play/pause control when in waveformOnly mode */}
            {waveformOnly && (
              <div className="absolute top-7 right-2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-xs border border-slate-300 select-none">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying) {
                      handlePlayPause();
                    } else {
                      handlePlayFromHoverToEnd();
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs ${
                    isPlaying
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={isPlaying ? 'Dừng phát sóng âm (Phím Space)' : 'Phát phần sóng âm (Phím F)'}
                >
                  {isPlaying ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                  <span>{isPlaying ? 'Dừng' : 'Phát sóng âm (F)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
                  title="Phát lại từ đầu (Phím R)"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomFit}
                  className="px-1 py-0.5 hover:bg-slate-200 text-[9px] text-blue-700 font-bold rounded transition cursor-pointer"
                  title="Dãn đều vừa màn hình (Fit)"
                >
                  Fit
                </button>
                <div className="flex items-center gap-0.5 pl-1 border-l border-slate-300">
                  <button
                    type="button"
                    onClick={() => handleSetOverlayMode('hanzi')}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition cursor-pointer ${
                      textOverlayMode === 'hanzi'
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                    title="1. Chữ Hán"
                  >
                    Chữ Hán
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetOverlayMode('both')}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition cursor-pointer ${
                      textOverlayMode === 'both'
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                    title="2. Chữ Hán và Pinyin"
                  >
                    Chữ Hán và Pinyin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetOverlayMode('none')}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition cursor-pointer ${
                      textOverlayMode === 'none'
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                    title="3. Ẩn cả 2"
                  >
                    Ẩn cả 2
                  </button>
                </div>
                <span className="text-[9px] font-mono font-semibold text-slate-700 px-1 border-l border-slate-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Đường kẻ chuẩn biên độ ngang (0.0, +0.5, -0.5) dịch xuống 24px để khớp với vùng sóng âm bên dưới Time Ruler */}
            <div
              className="absolute left-0 right-0 h-px bg-blue-500/60 pointer-events-none z-0"
              style={{ top: `${24 + waveformHeight / 2}px` }}
            />
            <div
              className="absolute left-0 right-0 h-px border-t border-dashed border-slate-300/60 pointer-events-none z-0"
              style={{ top: `${24 + waveformHeight / 4}px` }}
            />
            <div
              className="absolute left-0 right-0 h-px border-t border-dashed border-slate-300/60 pointer-events-none z-0"
              style={{ top: `${24 + (waveformHeight * 3) / 4}px` }}
            />

            {/* Container đồng bộ chứa Time Ruler (24px ở trên) + Biểu đồ sóng âm & Chữ Hán/Pinyin (ở dưới) */}
            <div
              ref={waveformRef}
              data-overlay-mode={textOverlayMode}
              className="w-full relative z-10 cursor-crosshair audacity-waveform bg-white"
              style={{ minHeight: `${waveformHeight + 24}px`, backgroundColor: '#ffffff' }}
              onMouseDown={handleWaveformMouseDown}
              title="Kéo thanh cuộn ngang bên dưới để trượt đồng bộ Thước đo thời gian và Sóng âm"
            />

            {/* 3. THANH CUỘN NGANG CỔ ĐIỂN CHUẨN AUDACITY (CUSTOM HORIZONTAL SCROLLBAR) */}
            <div
              className="w-full bg-[#d9dde2] border-t border-[#b8bec5] flex items-center px-1 py-0.5 select-none z-20 shrink-0 h-[26px] gap-1"
              title="Thanh cuộn ngang đồng bộ Thước đo thời gian và Sóng âm (Chuẩn Audacity)"
            >
              {/* Nút mũi tên đầu Trái (◀) */}
              <button
                type="button"
                onClick={() => handleScrollHorizontal(-140)}
                onMouseDown={() => startContinuousScroll(-140)}
                onMouseUp={stopContinuousScroll}
                onMouseLeave={stopContinuousScroll}
                onTouchStart={() => startContinuousScroll(-140)}
                onTouchEnd={stopContinuousScroll}
                className="w-6 h-[20px] bg-gradient-to-b from-[#f0f2f5] to-[#d5dbe0] hover:from-[#ffffff] hover:to-[#e2e7ec] active:from-[#cbd2d9] active:to-[#b8c0c8] text-slate-700 rounded-[2px] border border-[#8e98a2] shadow-2xs flex items-center justify-center text-[10px] font-bold cursor-pointer shrink-0 transition-colors"
                title="Cuộn sóng âm sang trái"
              >
                ◀
              </button>

              {/* Rãnh trượt (Scrollbar Track) & Con trượt xám (Thumb) cập nhật mượt 60fps */}
              <div
                ref={scrollTrackRef}
                onMouseDown={handleTrackMouseDown}
                onTouchStart={handleTrackMouseDown}
                className="flex-1 h-[20px] bg-[#c2c8ce] hover:bg-[#b8bfc6] rounded-[2px] relative cursor-pointer border border-[#959fa8] shadow-inner overflow-hidden"
                title="Nhấp vào rãnh hoặc nhấn giữ và kéo con trượt xám để cuộn ngang sóng âm (60fps)"
              >
                <div
                  ref={thumbRef}
                  onMouseDown={handleThumbMouseDown}
                  onTouchStart={handleThumbMouseDown}
                  className="audacity-scroll-thumb absolute top-0 bottom-0 bg-gradient-to-b from-[#828c96] to-[#636d77] hover:from-[#747e88] hover:to-[#555f69] active:from-[#525c66] active:to-[#3f4750] rounded-[2px] border border-[#454e57] shadow-xs cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors touch-none will-change-[left,width]"
                  style={{
                    left: `${thumbLeftPercent}%`,
                    width: `${thumbWidthPercent}%`
                  }}
                  title="Nhấn giữ và kéo con trượt để di chuyển khung nhìn sóng âm mượt mà (60fps)"
                >
                  {/* 3 vạch gờ nổi đặc trưng trên con trượt của Audacity */}
                  <div className="flex items-center gap-[2px] px-1 pointer-events-none select-none opacity-85">
                    <div className="w-[1.5px] h-2.5 bg-slate-100/90 rounded-full" />
                    <div className="w-[1.5px] h-2.5 bg-slate-100/90 rounded-full" />
                    <div className="w-[1.5px] h-2.5 bg-slate-100/90 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Nút mũi tên đầu Phải (▶) */}
              <button
                type="button"
                onClick={() => handleScrollHorizontal(140)}
                onMouseDown={() => startContinuousScroll(140)}
                onMouseUp={stopContinuousScroll}
                onMouseLeave={stopContinuousScroll}
                onTouchStart={() => startContinuousScroll(140)}
                onTouchEnd={stopContinuousScroll}
                className="w-6 h-[20px] bg-gradient-to-b from-[#f0f2f5] to-[#d5dbe0] hover:from-[#ffffff] hover:to-[#e2e7ec] active:from-[#cbd2d9] active:to-[#b8c0c8] text-slate-700 rounded-[2px] border border-[#8e98a2] shadow-2xs flex items-center justify-center text-[10px] font-bold cursor-pointer shrink-0 transition-colors"
                title="Cuộn sóng âm sang phải"
              >
                ▶
              </button>

              {/* Cụm Zoom nhanh trực tiếp ở góc dưới bên phải */}
              <div className="flex items-center gap-0.5 ml-0.5 pl-1.5 border-l border-slate-400/80 shrink-0">
                <button
                  type="button"
                  onClick={() => handleZoom('out')}
                  className="w-5 h-[20px] bg-[#e4e7eb] hover:bg-[#ccd1d8] text-slate-700 rounded-[2px] border border-[#959fa8] flex items-center justify-center text-[11px] font-bold cursor-pointer"
                  title="Thu nhỏ (-)"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={handleZoomFit}
                  className="px-1.5 h-[20px] bg-white hover:bg-slate-100 text-blue-700 font-mono text-[9px] font-bold border border-[#959fa8] rounded-[2px] flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Khớp vừa màn hình (Fit)"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom('in')}
                  className="w-5 h-[20px] bg-[#e4e7eb] hover:bg-[#ccd1d8] text-slate-700 rounded-[2px] border border-[#959fa8] flex items-center justify-center text-[11px] font-bold cursor-pointer"
                  title="Phóng to (+)"
                >
                  +
                </button>
              </div>
            </div>

                {/* Loading / TTS Generating Overlay */}
                {isLoadingAudio && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3 z-30 animate-in fade-in">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="text-xs text-blue-800 font-bold">
                        Đang tạo dải sóng âm...
                      </p>
                    </div>
                  </div>
                )}

                {!isLoadingAudio && !isReady && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2 z-20">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-700 font-semibold">Đang nạp và render sóng âm...</span>
                  </div>
                )}
              </div>
            </div>

        {/* Audio Error message if any */}
        {audioError && (
          <div className="bg-amber-50 px-4 py-2 border-t border-amber-200 text-xs text-amber-700 italic">
            {audioError}
          </div>
        )}
      </div>

      {/* 6. EFFECTS MODAL (AUDACITY DSP EFFECTS) */}
      {isEffectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  Bảng hiệu ứng âm thanh
                </h3>
              </div>
              <button
                onClick={() => setIsEffectsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Effect Category Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
              <button
                onClick={() => setActiveEffectTab('eq')}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${
                  activeEffectTab === 'eq' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Graphic EQ (Cân bằng)
              </button>
              <button
                onClick={() => setActiveEffectTab('noise')}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${
                  activeEffectTab === 'noise' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Noise Gate (Khử ồn)
              </button>
              <button
                onClick={() => setActiveEffectTab('pitch')}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${
                  activeEffectTab === 'pitch' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pitch Shift (Cao độ)
              </button>
              <button
                onClick={() => setActiveEffectTab('reverb')}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${
                  activeEffectTab === 'reverb' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reverb (Vang phòng)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-300">
              {activeEffectTab === 'eq' && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Tinh chỉnh dải tần âm học để làm rõ giọng đọc ngoại ngữ (tăng dải Mid và Treble giúp nghe rõ thanh mẫu và phụ âm).
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Bass (Âm trầm 100Hz):</span>
                        <span className="font-mono text-indigo-400">{effectSliders.bass} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={effectSliders.bass}
                        onChange={(e) => setEffectSliders(prev => ({ ...prev, bass: Number(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Mid (Dải giọng nói 1kHz - 3kHz):</span>
                        <span className="font-mono text-indigo-400">{effectSliders.mid} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={effectSliders.mid}
                        onChange={(e) => setEffectSliders(prev => ({ ...prev, mid: Number(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Treble (Âm sáng 8kHz):</span>
                        <span className="font-mono text-indigo-400">{effectSliders.treble} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={effectSliders.treble}
                        onChange={(e) => setEffectSliders(prev => ({ ...prev, treble: Number(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEffectTab === 'noise' && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Khử tiếng xì gà và tạp âm nền (Background Noise Removal) để âm thanh phát âm trong trẻo nhất.
                  </p>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Threshold (Ngưỡng chặn tiếng ồn):</span>
                      <span className="font-mono text-indigo-400">{effectSliders.noiseGate} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="-10"
                      value={effectSliders.noiseGate}
                      onChange={(e) => setEffectSliders(prev => ({ ...prev, noiseGate: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}

              {activeEffectTab === 'pitch' && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Dịch cao độ giọng nói theo nửa cung (Semitones) mà không thay đổi tốc độ đàm thoại.
                  </p>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Cao độ (Pitch Semitones):</span>
                      <span className="font-mono text-indigo-400">{effectSliders.pitchSemitones > 0 ? `+${effectSliders.pitchSemitones}` : effectSliders.pitchSemitones}</span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      value={effectSliders.pitchSemitones}
                      onChange={(e) => setEffectSliders(prev => ({ ...prev, pitchSemitones: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}

              {activeEffectTab === 'reverb' && (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Mô phỏng không gian phòng học hoặc thính phòng (Room Simulation) tạo cảm giác tự nhiên khi nghe tai nghe.
                  </p>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Tỉ lệ vang (Wet Mix):</span>
                      <span className="font-mono text-indigo-400">{effectSliders.reverbWet}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={effectSliders.reverbWet}
                      onChange={(e) => setEffectSliders(prev => ({ ...prev, reverbWet: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setEffectSliders({ bass: 0, mid: 0, treble: 0, noiseGate: -40, reverbWet: 15, pitchSemitones: 0 })}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Đặt lại mặc định
              </button>
              <button
                onClick={() => {
                  setIsEffectsModalOpen(false);
                  showToast('✨ Đã áp dụng cấu hình Effects');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Áp dụng hiệu ứng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL HƯỚNG DẪN PHÍM TẮT & THAO TÁC CHUỘT */}
      {showShortcutHelp && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShortcutHelp(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] animate-in zoom-in-95 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Hướng dẫn phím tắt & thao tác chuột
                  </h3>
                  <p className="text-xs text-slate-500">
                    Làm chủ các thao tác luyện nghe và chỉnh sửa sóng âm chuyên nghiệp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutHelp(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-xl transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Categorized Shortcuts */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6 text-xs max-h-[65vh]">
              {/* Nhóm 1: Điều khiển phát lại */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    Điều khiển phát lại (Playback Transport)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Phát / Tạm dừng</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      Space
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Phát lại từ đầu vùng chọn</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      R
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Tua lùi / Tua tới 3 giây</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        ←
                      </kbd>
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        →
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Bật / Tắt lặp lại vô tận</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      L
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Phát đoạn luyện nghe từ đầu đến cuối</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      A
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Phát từ vị trí con trỏ chuột đến hết vùng chọn</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      F
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Thao tác vùng sóng & Phân đoạn câu */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    Vùng sóng âm & Luyện câu thoại
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Quét chọn phân đoạn âm thanh</span>
                    <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium text-[11px]">
                      Kéo chuột
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Co / Dãn hai mép vùng chọn</span>
                    <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium text-[11px]">
                      Kéo 2 mép
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Chuyển sang câu trước / tiếp theo</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        S
                      </kbd>
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        D
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Hủy vùng chọn để phát toàn bài</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[10px]">
                        Del
                      </kbd>
                      <kbd className="px-1.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[10px]">
                        ⌫
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Chọn toàn bộ audio</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      Ctrl + A
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Hoàn tác thao tác vùng sóng</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      Ctrl + Z
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Thu phóng & Cuộn ngang sóng âm */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    Thu phóng & Cuộn sóng âm theo chiều ngang
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Cuộn thanh bên phải (Trang web)</span>
                    <span className="px-2 py-1 bg-slate-200/80 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px]">
                      Lăn chuột (Không Ctrl)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Zoom cuộn sóng (Tập trung vùng quét)</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[10px]">
                      Ctrl + Cuộn chuột
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Cuộn sóng theo chiều ngang</span>
                    <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-semibold text-[11px]">
                      Shift + Lăn chuột
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Kéo dãn độ cao vùng sóng</span>
                    <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-[11px]">
                      Kéo viền dưới sóng
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Căn độ cao sóng vừa vặn</span>
                    <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-[11px]">
                      Nhấp đúp viền dưới
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Pan di chuyển ngang tự do</span>
                    <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium text-[11px]">
                      Chuột giữa hoặc Shift + Kéo
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Nút cuộn ngang nhanh</span>
                    <span className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      Nút Trái / Phải
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Phóng to / Thu nhỏ trục thời gian</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        +
                      </kbd>
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        -
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Khớp vừa toàn bộ màn hình</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      0 (Fit)
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Nhóm 4: Tiện ích & Hiển thị */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                    Hiển thị & Tiện ích
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Bật / Tắt tiếng (Mute track)</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      M
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Bật/Tắt sóng âm câu (Luyện nghe)</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      G
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Ẩn/Hiện Chữ Hán & Pinyin (Chuyển chế độ)</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      P
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Đóng hướng dẫn / Thoát Fullscreen</span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                      Esc
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-700 font-medium">Mở bảng phím tắt này</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        H
                      </kbd>
                      <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                        ?
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <span className="text-slate-500 text-[11px]">
                💡 Mẹo: Bạn có thể nhấn phím <kbd className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300">H</kbd> bất kỳ lúc nào để bật/tắt bảng này.
              </span>
              <button
                type="button"
                onClick={() => setShowShortcutHelp(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer ml-auto"
              >
                Đã hiểu (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MENU LỰA CHỌN HIỂN THỊ: CẢ HAI, CHỮ HÁN, PINYIN, ẨN TẤT CẢ (RENDER TOÀN CỤC) */}
      {isOverlayMenuOpen && overlayMenuCoords && (
        <>
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setIsOverlayMenuOpen(false)} 
          />
          <div 
            className="fixed z-[99999] w-64 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 select-none"
            style={{
              top: `${overlayMenuCoords.top}px`,
              left: `${overlayMenuCoords.left}px`,
            }}
          >
            <div className="px-2.5 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
              <span>Chế độ hiển thị dải câu</span>
              <span className="text-[10px] text-blue-600 font-mono font-normal bg-blue-50 px-1.5 py-0.5 rounded">Phím P</span>
            </div>

            {/* 1. Chữ Hán */}
            <button
              type="button"
              onClick={() => {
                handleSetOverlayMode('hanzi');
                setIsOverlayMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left cursor-pointer ${
                textOverlayMode === 'hanzi'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 text-emerald-600 font-bold text-sm flex items-center justify-center shrink-0">字</span>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-xs text-slate-800">Chữ Hán</span>
                  <span className="text-[10px] text-slate-500 font-normal">Chỉ hiển thị chữ Hán</span>
                </div>
              </div>
              {textOverlayMode === 'hanzi' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
            </button>

            {/* 2. Chữ Hán và Pinyin */}
            <button
              type="button"
              onClick={() => {
                handleSetOverlayMode('both');
                setIsOverlayMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left cursor-pointer ${
                textOverlayMode === 'both'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-xs text-slate-800">Chữ Hán và Pinyin</span>
                  <span className="text-[10px] text-slate-500 font-normal">Hiển thị cả chữ Hán và Pinyin</span>
                </div>
              </div>
              {textOverlayMode === 'both' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
            </button>

            {/* 3. Ẩn cả 2 */}
            <button
              type="button"
              onClick={() => {
                handleSetOverlayMode('none');
                setIsOverlayMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left cursor-pointer ${
                textOverlayMode === 'none'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-xs text-slate-800">Ẩn cả 2</span>
                  <span className="text-[10px] text-slate-500 font-normal">Không hiển thị chữ Hán hoặc Pinyin</span>
                </div>
              </div>
              {textOverlayMode === 'none' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
            </button>
          </div>
        </>
      )}

      {/* 8. CONTEXT MENU TỪ VỰNG: Mode 'info' (Chuột trái) & Mode 'tools' (Chuột phải) - Giống hệt phần đọc TextReader */}
      {wordContextMenu && wordContextMenu.mode === 'info' && (
        <div
          key={`${wordContextMenu.token.text}-${wordContextMenu.x}-${wordContextMenu.top ?? wordContextMenu.bottom}`}
          ref={contextMenuRef}
          id="listening-word-context-menu"
          className="fixed z-[100010] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/85 dark:border-slate-800/90 rounded-2xl shadow-[0_10px_30px_-5px_rgba(15,23,42,0.12),0_4px_12px_-2px_rgba(15,23,42,0.06)] px-4 pt-3.5 pb-3 flex flex-col items-center min-w-[220px] max-w-[280px] word-popover-enter"
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
                    {translation || '(Chưa có nghĩa)'}
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

      {/* CHUỘT PHẢI: Chỉ hiện các icon công cụ giống hệt phần đọc TextReader */}
      {wordContextMenu && wordContextMenu.mode === 'tools' && (
        <div
          ref={contextMenuRef}
          id="listening-word-context-menu"
          className="fixed z-[100010] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 sm:p-2.5 flex flex-col gap-2 min-w-[260px] sm:min-w-[280px] max-w-[calc(100vw-24px)] sm:max-w-[360px] word-popover-enter"
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
                  ? 'bg-amber-800 text-white animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300'
              }`}
              title={isContextRecording ? 'Dừng ghi âm' : 'Ghi âm & Chấm điểm phát âm AI'}
            >
              {isContextRecording ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* 3. Chia các bộ thủ / Chiết tự (Layers - Màu đỏ) */}
            <button
              onClick={() => {
                if (onOpenRadicalBreakdown) {
                  onOpenRadicalBreakdown(wordContextMenu.token.text);
                } else {
                  setLocalRadicalWord(wordContextMenu.token.text);
                }
                setWordContextMenu(null);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-all flex items-center justify-center active:scale-95 group shadow-xs cursor-pointer"
              title="Chia các bộ thủ (Chiết tự)"
            >
              <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

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
                      ? 'bg-pink-500 text-white'
                      : 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/60 text-pink-600 dark:text-pink-400'
                  }`}
                  title={isSaved ? 'Bỏ lưu từ' : 'Lưu vào sổ từ'}
                >
                  <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isSaved ? 'fill-white' : ''}`} />
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
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                  }`}
                  title={isKnown ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
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
        initialWord={youglishWord || ''}
        pinyin={youglishPinyin}
        translation={youglishTranslation}
      />

      {/* Google Images Modal */}
      <GoogleImagesModal
        isOpen={!!googleImagesWord}
        onClose={() => setGoogleImagesWord(null)}
        initialWord={googleImagesWord || ''}
        pinyin={googleImagesPinyin}
        translation={googleImagesTranslation}
      />

      {/* Fallback Radical Breakdown Modal */}
      {localRadicalWord && (
        <RadicalBreakdownModal
          isOpen={!!localRadicalWord}
          onClose={() => setLocalRadicalWord(null)}
          initialWord={localRadicalWord}
          lessonWords={[localRadicalWord]}
          hideLessonWords={false}
        />
      )}
    </div>
  );
}
