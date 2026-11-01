import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SavedWord, ClozeExercise, OrderingExercise } from '../types';
import { 
  Loader2, Dumbbell, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff, 
  ArrowLeft, Volume2, Sparkles, RotateCcw, Award, Headphones, 
  Play, Pause, ChevronRight, ChevronLeft, Trophy, BarChart3, ChevronDown, ChevronUp, Radio, BookOpen,
  Activity
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { speakMandarin } from '../utils/speech';
import AudacityAudioPlayer from './AudacityAudioPlayer';
import { GrammarAnalysisView } from './GrammarAnalysisView';

interface PracticeProps {
  onUpdateWord?: (id: string, updatedData: Partial<SavedWord>) => void;
  allSavedWords?: SavedWord[];
  savedWords: SavedWord[];
  currentLessonText?: string;
  currentLessonTitle?: string;
  currentVoice?: string;
  availableVoices?: { id: string; name: string; uri: string; gender: string }[];
  onVoiceChange?: (uri: string) => void;
  autoGenerateTimestamp?: number;
  autoGenerateType?: 'cloze' | 'ordering';
  onBack?: () => void;
}

type PracticeType = 'cloze' | 'ordering' | 'listening';

export interface ListeningQuestion {
  id: string;
  correctSentence: string;
  pinyin: string;
  translation: string;
  targetWord?: string;
  structureExplanation?: string;
}

// Normalizer to compare Chinese sentences (ignoring whitespaces, fullwidth spaces, punctuation)
export const normalizeChinese = (str: string) => {
  return (str || '').replace(/[\s\u3000.,!?。，！？、"'“”‘’;:；：—–\-~…()（）《》【】]/g, '').trim();
};

// Check if user's typed Chinese sentence is correct for listening exercises.
// 1. Removes all punctuation, symbols, whitespace and fullwidth spaces.
// 2. Pronouns 他 (he) and 她 (she) sound identical ('tā') in listening audio,
//    so sentences with either 他 or 她 are treated as equivalent and both correct!
export const isListeningAnswerCorrect = (typed: string, target: string): boolean => {
  const normTyped = normalizeChinese(typed);
  const normTarget = normalizeChinese(target);
  if (!normTyped || !normTarget) return false;
  if (normTyped === normTarget) return true;

  // Normalize all occurrences of 他 and 她 to the same character '他'
  const unifyPronoun = (s: string) => s.replace(/[他她]/g, '他');
  return unifyPronoun(normTyped) === unifyPronoun(normTarget);
};

// Helper to build 10 listening dictation questions
function buildListeningQuestions(exercises: OrderingExercise[]): ListeningQuestion[] {
  return exercises.slice(0, 10).map((ex, idx) => ({
    id: ex.targetWord ? `${ex.targetWord}-${idx}` : `listen-${idx}`,
    correctSentence: ex.correctSentence,
    pinyin: ex.pinyin,
    translation: ex.translation,
    targetWord: ex.targetWord,
    structureExplanation: ex.structureExplanation,
  }));
}

// In-memory cache for audio blob URLs to make replaying instant
const ttsBlobCache = new Map<string, string>();

export default function Practice({ 
  allSavedWords = [], 
  savedWords, 
  currentLessonText, 
  currentLessonTitle, 
  currentVoice,
  availableVoices = [],
  onVoiceChange,
  autoGenerateTimestamp, 
  autoGenerateType, 
  onUpdateWord, 
  onBack 
}: PracticeProps) {
  const [activeTab, setActiveTab] = useState<PracticeType>('ordering');
  // 2 Đề mục cho phần luyện tập 1 từ vựng: null = hiện 2 đề mục trước, 'ordering' = Sắp xếp câu, 'listening' = Luyện nghe
  const [selectedTopic, setSelectedTopic] = useState<'ordering' | 'listening' | null>(null);
  const isSingleWordPractice = Boolean(savedWords && savedWords.length === 1);
  const singleTargetWord = isSingleWordPractice ? savedWords[0] : null;

  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = React.useRef(false);

  // Ordering exercises state
  const [orderingExercises, setOrderingExercises] = useState<OrderingExercise[]>([]);
  const [orderingAnswers, setOrderingAnswers] = useState<Record<number, {id: string, text: string}[]>>({});
  const [insertWordAnswers, setInsertWordAnswers] = useState<Record<number, string>>({});
  const [orderingChecked, setOrderingChecked] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [changingIndex, setChangingIndex] = useState<number | null>(null);

  // Listening practice state (10 questions, audio only, type the exact Chinese sentence)
  const [listeningQuestions, setListeningQuestions] = useState<ListeningQuestion[]>([]);
  const [listeningIndex, setListeningIndex] = useState<number>(0);
  const [typedAnswers, setTypedAnswers] = useState<Record<number, string>>({});
  const [listeningChecked, setListeningChecked] = useState<Record<number, boolean>>({});
  const [listeningPlayCounts, setListeningPlayCounts] = useState<Record<number, number>>({});
  const [listeningSpeed, setListeningSpeed] = useState<number>(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showListeningSummary, setShowListeningSummary] = useState<boolean>(false);
  const [showAudacityPlayer, setShowAudacityPlayer] = useState<boolean>(false);
  const [showCharHints, setShowCharHints] = useState<boolean>(false);
  const [sentenceAnalyses, setSentenceAnalyses] = useState<Record<number, { text: string; loading: boolean }>>({});
  // Trạng thái ẩn/hiện phân tích cấu trúc & ngữ pháp (mặc định là ẩn)
  const [expandedAnalyses, setExpandedAnalyses] = useState<Record<number, boolean>>({});
  const [expandedOrderingAnalyses, setExpandedOrderingAnalyses] = useState<Record<number, boolean>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const typingInputRef = useRef<HTMLInputElement | null>(null);
  const audacityPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const listeningResultRef = useRef<HTMLDivElement | null>(null);
  const orderingResultRef = useRef<HTMLDivElement | null>(null);

  // Cuộn tự động vào vùng sóng âm khi mở audio player
  const scrollToAudioPlayer = useCallback(() => {
    setTimeout(() => {
      audacityPlayerContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
    setTimeout(() => {
      audacityPlayerContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 280);
  }, []);

  const handleToggleAudacityPlayer = useCallback(() => {
    setShowAudacityPlayer(prev => {
      const next = !prev;
      if (next) {
        scrollToAudioPlayer();
      }
      return next;
    });
  }, [scrollToAudioPlayer]);

  useEffect(() => {
    if (showAudacityPlayer) {
      scrollToAudioPlayer();
    }
  }, [showAudacityPlayer, listeningIndex, scrollToAudioPlayer]);

  // Fetch AI sentence grammar & vocabulary breakdown if not pre-embedded
  const fetchSentenceAnalysis = async (sentence: string, idx: number) => {
    if (!sentence) return;
    if (sentenceAnalyses[idx]?.text || sentenceAnalyses[idx]?.loading) return;
    setSentenceAnalyses(prev => ({ ...prev, [idx]: { text: '', loading: true } }));
    try {
      const res = await fetch('/api/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentence })
      });
      if (res.ok) {
        const reader = res.body?.getReader();
        if (reader) {
          let accumulated = '';
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setSentenceAnalyses(prev => ({ ...prev, [idx]: { text: accumulated, loading: false } }));
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Lỗi tải phân tích câu:", err);
    }
    setSentenceAnalyses(prev => ({ ...prev, [idx]: { text: '', loading: false } }));
  };

  // Auto-play audio sentence using /api/tts or fallback to SpeechSynthesis
  const playSentenceAudio = async (text: string, rate: number = 1.0, qIdx?: number) => {
    if (!text) return;
    if (qIdx !== undefined) {
      setListeningPlayCounts(prev => ({ ...prev, [qIdx]: (prev[qIdx] || 0) + 1 }));
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsPlayingAudio(true);
    try {
      const voiceKey = (currentVoice || 'zh-CN-XiaoxiaoNeural').toLowerCase().includes('yunxi') ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural';
      const cacheKey = `${voiceKey}:${text}`;
      let blobUrl = ttsBlobCache.get(cacheKey);
      if (!blobUrl) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceKey })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const binary = atob(data.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
            blobUrl = URL.createObjectURL(blob);
            ttsBlobCache.set(cacheKey, blobUrl);
          }
        }
      }

      if (blobUrl) {
        const audio = new Audio(blobUrl);
        audio.playbackRate = rate;
        activeAudioRef.current = audio;
        audio.onended = () => {
          setIsPlayingAudio(false);
          activeAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          activeAudioRef.current = null;
          speakMandarin(text, rate, undefined, currentVoice);
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("TTS failed, using speech synthesis:", err);
    }

    await speakMandarin(text, rate, undefined, currentVoice);
    setIsPlayingAudio(false);
  };

  // Sync listening questions whenever ordering exercises change
  useEffect(() => {
    if (orderingExercises.length > 0) {
      const qList = buildListeningQuestions(orderingExercises);
      setListeningQuestions(qList);
      setTypedAnswers({});
      setListeningChecked({});
      setListeningPlayCounts({});
      setSentenceAnalyses({});
      setListeningIndex(0);
      setShowListeningSummary(false);
    }
  }, [orderingExercises]);

  // Requirement 3: Khi bắt đầu 1 câu mới, mặc định tắt sóng âm và chỉ phát ở nút nghe câu một lần (dừng mọi âm thanh trước đó)
  useEffect(() => {
    if (activeTab === 'listening' && listeningQuestions.length > 0 && !showListeningSummary) {
      // Dừng toàn bộ âm thanh đang phát trước đó (audio element và speech synthesis)
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      setShowAudacityPlayer(false);

      const q = listeningQuestions[listeningIndex];
      if (q && q.correctSentence) {
        const timer = setTimeout(() => {
          playSentenceAudio(q.correctSentence, listeningSpeed, listeningIndex);
        }, 180);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, listeningIndex, listeningQuestions.length, showListeningSummary]);

  // Requirement: Phím tắt Enter chuyển câu/kiểm tra, Space nghe lại, R gõ lại câu, G bật/tắt sóng âm
  useEffect(() => {
    if (activeTab !== 'listening' || showListeningSummary) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi đang gõ bộ gõ IME tiếng Trung
      if (e.isComposing || (e as any).keyCode === 229) return;

      const isInputFocused = document.activeElement === typingInputRef.current;
      const isChecked = Boolean(listeningChecked[listeningIndex]);

      // Requirement: Phím Enter: ấn lần 1 để hiện đáp án, ấn lần 2 để qua câu tiếp theo
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isChecked) {
          handleCheckCurrentQuestion(listeningIndex);
        } else {
          if (listeningIndex < listeningQuestions.length - 1) {
            const nextIdx = listeningIndex + 1;
            setListeningIndex(nextIdx);
            setTimeout(() => typingInputRef.current?.focus(), 60);
          } else {
            setShowListeningSummary(true);
          }
        }
        return;
      }

      // Requirement 4: Phím tắt lặp lại của nút nghe câu là space (hoặc phím F, hoặc phím A khi không mở sóng âm và không đang gõ chữ)
      if (
        e.code === 'Space' ||
        e.key === ' ' ||
        e.key === 'f' ||
        e.key === 'F' ||
        ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey && !isInputFocused && !showAudacityPlayer)
      ) {
        // Cho phép gõ bộ gõ IME tiếng Trung nếu đang chọn từ candidate
        if (e.isComposing || (e as any).keyCode === 229) {
          return;
        }
        e.preventDefault();
        const q = listeningQuestions[listeningIndex];
        if (q && q.correctSentence) {
          playSentenceAudio(q.correctSentence, listeningSpeed, listeningIndex);
        }
        return;
      }

      // Requirement: Phím tắt R để gõ lại câu
      if ((e.key === 'r' || e.key === 'R') && (isChecked || !isInputFocused || e.altKey)) {
        e.preventDefault();
        setListeningChecked(prev => ({ ...prev, [listeningIndex]: false }));
        setTypedAnswers(prev => ({ ...prev, [listeningIndex]: '' }));
        const q = listeningQuestions[listeningIndex];
        if (q && q.correctSentence) {
          playSentenceAudio(q.correctSentence, listeningSpeed, listeningIndex);
        }
        setTimeout(() => typingInputRef.current?.focus(), 60);
        return;
      }

      // Requirement: Phím tắt G để hiện/ẩn audio player sóng âm
      if ((e.key === 'g' || e.key === 'G') && (isChecked || !isInputFocused || e.altKey)) {
        e.preventDefault();
        handleToggleAudacityPlayer();
        return;
      }

      // Phím tắt P để ẩn/hiện Pinyin
      if ((e.key === 'p' || e.key === 'P') && !isInputFocused) {
        e.preventDefault();
        setShowPinyin(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, showListeningSummary, listeningIndex, listeningChecked, listeningQuestions, listeningSpeed, showAudacityPlayer, handleToggleAudacityPlayer, scrollToAudioPlayer]);

  const handleCheckCurrentQuestion = (idx: number) => {
    // Cho phép hiển thị đáp án khi nhấn Enter kể cả khi chưa gõ gì
    setListeningChecked(prev => ({ ...prev, [idx]: true }));

    // Replay audio of this sentence when displaying the answer
    const targetQ = listeningQuestions[idx];
    if (targetQ && targetQ.correctSentence) {
      playSentenceAudio(targetQ.correctSentence, listeningSpeed, idx);
      // Fetch analysis if missing in background
      if (!targetQ.structureExplanation) {
        fetchSentenceAnalysis(targetQ.correctSentence, idx);
      }
    }

    // Requirement 2: khi ấn kết quả thì tự động di chuyển xuống phần kết quả
    setTimeout(() => {
      listeningResultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 80);
    setTimeout(() => {
      listeningResultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 250);
  };

  const calculateListeningScore = () => {
    let score = 0;
    listeningQuestions.forEach((q, idx) => {
      const userTyped = typedAnswers[idx] || '';
      if (isListeningAnswerCorrect(userTyped, q.correctSentence)) {
        score++;
      }
    });
    return score;
  };

  const generatePractice = async (type: PracticeType, isAutoGenerate: boolean = false, isRetry: boolean = false) => {
    if (isGeneratingRef.current && !isRetry) return;
    setIsGenerating(true);
    isGeneratingRef.current = true;
    
    setOrderingChecked(false);
    setOrderingAnswers({});
    setInsertWordAnswers({});
    
    try {
      const selectedWords = savedWords.slice(0, 50); // limit to avoid heavy payload
      // Provide known words (up to 150) to the backend for sentence generation context
      const knownWords = (allSavedWords || []).filter(w => w.isKnown).slice(0, 150);
      
      const response = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords, type, requiredTotal: 10, knownWords })
      });
      if (!response.ok) {
        throw new Error(`API trả về lỗi: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      let generatedExs = data.exercises || [];
      // Assign unique ID and shuffle words
      generatedExs = generatedExs.map((ex: any) => {
         if (!ex.id) ex.id = Date.now().toString() + Math.random().toString();
         // Use the shuffledWords from the API directly.
         return ex;
      });
      
      if (type === 'ordering' && generatedExs.length > 0) {
        while (generatedExs.length < 10) {
          generatedExs.push({ ...generatedExs[generatedExs.length - 1], id: Date.now().toString() + Math.random().toString() });
        }
        generatedExs = generatedExs.slice(0, 10);
        
        generatedExs.forEach((ex: any) => {
          if (ex.shuffledWords) {
            ex.shuffledWords = [...ex.shuffledWords].sort(() => 0.5 - Math.random());
          }
        });
      }

      // Sort to guarantee order: shortest to longest (5, 6, 7 words)
      generatedExs.sort((a: any, b: any) => (a.shuffledWords?.length || 0) - (b.shuffledWords?.length || 0));

      setOrderingExercises(generatedExs);

      // Permanently save generated sentences
      if (onUpdateWord && type === 'ordering') {
        const newExercisesByWordId: Record<string, any[]> = {};

        generatedExs.forEach((ex: any) => {
          let word = null;
          if (ex.targetWord) word = savedWords.find(w => w.text === ex.targetWord);
          if (!word) word = savedWords.find(w => ex.correctSentence && ex.correctSentence.includes(w.text));
          if (!word) word = savedWords.find(w => ex.shuffledWords && ex.shuffledWords.includes(w.text));
          
          if (word) {
            if (!newExercisesByWordId[word.id]) {
              newExercisesByWordId[word.id] = [];
            }
            newExercisesByWordId[word.id].push(ex);
          }
        });

        Object.entries(newExercisesByWordId).forEach(([wordId, newExs]) => {
          const word = savedWords.find(w => w.id === wordId);
          if (word) {
            const currentSaved = word.savedExercises || { cloze: [], ordering: [] };
            const currentList = currentSaved.ordering || [];
            
            const uniqueNewExs = newExs.filter(newEx => !currentList.some((e: any) => e.correctSentence === newEx.correctSentence));
            
            if (uniqueNewExs.length > 0) {
              onUpdateWord(wordId, {
                savedExercises: {
                  ...currentSaved,
                  ordering: [...currentList, ...uniqueNewExs]
                }
              });
            }
          }
        });
      }
    } catch (err) {
      console.warn("Warning generating practice:", err);
      if (!isAutoGenerate) {
        alert("Lỗi: Không thể tạo bài tập mới lúc này. Có thể hệ thống AI đang quá tải. Vui lòng thử lại sau.");
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  // Hàm chọn đề mục luyện tập cho 1 từ vựng (Sắp xếp câu hoặc Luyện nghe)
  const handleSelectTopic = (topic: 'ordering' | 'listening') => {
    setSelectedTopic(topic);
    setActiveTab(topic);

    // Nếu bài tập đã có sẵn, chuẩn bị câu hỏi cho đề mục tương ứng
    if (orderingExercises.length > 0) {
      if (topic === 'listening') {
        const qList = buildListeningQuestions(orderingExercises);
        setListeningQuestions(qList);
      }
      return;
    }

    // Khôi phục bài tập đã lưu nếu có
    const restoredOrdering: OrderingExercise[] = [];
    savedWords.forEach(w => {
      if (w.savedExercises?.ordering) {
        restoredOrdering.push(...w.savedExercises.ordering);
      }
    });

    if (restoredOrdering.length > 0) {
      restoredOrdering.sort(() => 0.5 - Math.random());
      const len5 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length === 5);
      const len6 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length === 6);
      const len7 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length >= 7);

      let selected = [
        ...len5.slice(0, 4),
        ...len6.slice(0, 3),
        ...len7.slice(0, 3)
      ];

      if (selected.length < 10) {
        const usedIds = new Set(selected.map(s => s.correctSentence));
        const remaining = restoredOrdering.filter(e => !usedIds.has(e.correctSentence));
        selected = [...selected, ...remaining.slice(0, 10 - selected.length)];
      }

      selected.sort((a, b) => (a.shuffledWords?.length || 0) - (b.shuffledWords?.length || 0));

      setOrderingExercises(selected);
      setOrderingAnswers({});
      setOrderingChecked(false);
      const qList = buildListeningQuestions(selected);
      setListeningQuestions(qList);
    } else {
      generatePractice('ordering', true);
    }
  };

  useEffect(() => {
    if (autoGenerateTimestamp) {
      if (savedWords.length === 1) {
        // Yêu cầu: khi ấn vào phần luyện tập 1 từ vựng thì trước tiên nên hiện 2 đề mục (sắp xếp câu & luyện nghe)
        setSelectedTopic(null);
        return;
      }

      if (autoGenerateType) {
        setActiveTab(autoGenerateType);
        
        if (autoGenerateType === 'ordering') {
          const restoredOrdering: OrderingExercise[] = [];
          savedWords.forEach(w => {
            if (w.savedExercises?.ordering) {
              restoredOrdering.push(...w.savedExercises.ordering);
            }
          });
          
          if (restoredOrdering.length > 0) {
            restoredOrdering.sort(() => 0.5 - Math.random());
            const len5 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length === 5);
            const len6 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length === 6);
            const len7 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length >= 7);
            
            let selected = [
              ...len5.slice(0, 4),
              ...len6.slice(0, 3),
              ...len7.slice(0, 3)
            ];
            
            if (selected.length < 10) {
              const usedIds = new Set(selected.map(s => s.correctSentence));
              const remaining = restoredOrdering.filter(e => !usedIds.has(e.correctSentence));
              selected = [...selected, ...remaining.slice(0, 10 - selected.length)];
            }
            
            selected.sort((a, b) => (a.shuffledWords?.length || 0) - (b.shuffledWords?.length || 0));
            
            setOrderingExercises(selected);
            setOrderingAnswers({});
            setOrderingChecked(false);
          } else {
            generatePractice(autoGenerateType, true);
          }
        } else {
          generatePractice(autoGenerateType, true);
        }
      }
    } else if (orderingExercises.length === 0) {
      if (savedWords.length === 1) {
        // Cho 1 từ vựng: giữ ở màn hình chọn 2 đề mục trước
        return;
      }
      // Restore permanently saved ordering exercises
      const restoredOrdering: OrderingExercise[] = [];
      savedWords.forEach(w => {
        if (w.savedExercises?.ordering) {
          restoredOrdering.push(...w.savedExercises.ordering);
        }
      });
      if (restoredOrdering.length > 0) {
        restoredOrdering.sort(() => 0.5 - Math.random());
        const len5 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length === 5);
        const len6 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length === 6);
        const len7 = restoredOrdering.filter(e => e.shuffledWords && e.shuffledWords.length >= 7);
        
        let selected = [
          ...len5.slice(0, 4),
          ...len6.slice(0, 3),
          ...len7.slice(0, 3)
        ];
        
        if (selected.length < 10) {
          const usedIds = new Set(selected.map(s => s.correctSentence));
          const remaining = restoredOrdering.filter(e => !usedIds.has(e.correctSentence));
          selected = [...selected, ...remaining.slice(0, 10 - selected.length)];
        }
        
        selected.sort((a, b) => (a.shuffledWords?.length || 0) - (b.shuffledWords?.length || 0));
        
        setOrderingExercises(selected);
      }
    }
  }, [autoGenerateTimestamp, autoGenerateType, savedWords]);

  const calculateOrderingScore = () => {
    let score = 0;
    const normalize = (str) => (str || '').replace(/[\s.,!?。，！？、]/g, '');
    orderingExercises.forEach((ex, i) => {
      if (ex.type === 'insert_word') {
        if (insertWordAnswers[i] === ex.correctOption) score++;
      } else {
        if (normalize(orderingAnswers[i]?.map(u => u.text).join('')) === normalize(ex.correctSentence)) score++;
      }
    });
    return score;
  };

  const handleChangeExercise = async (index: number, currentEx: any, type: PracticeType) => {
    setChangingIndex(index);
    try {
      let word = null;
      if (currentEx.targetWord) word = savedWords.find(w => w.text === currentEx.targetWord);
      if (!word) word = savedWords.find(w => currentEx.correctSentence && currentEx.correctSentence.includes(w.text));
      if (!word) word = savedWords.find(w => currentEx.sentence && currentEx.sentence.includes(w.text));
      
      if (!word) {
        alert("Không tìm thấy từ vựng gốc để tạo câu mới.");
        return;
      }

      const response = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [word], type, requiredTotal: 1, sentenceIndex: index })
      });

      if (!response.ok) throw new Error("API lỗi");
      
      const data = await response.json();
      if (data.exercises && data.exercises.length > 0) {
        const newEx = data.exercises[0];
        
        if (type === 'ordering') {
          if (newEx.shuffledWords) {
            newEx.shuffledWords = [...newEx.shuffledWords].sort(() => 0.5 - Math.random());
          }
          const newExercises = [...orderingExercises];
          newExercises[index] = newEx;
          setOrderingExercises(newExercises);
          setOrderingAnswers(prev => ({ ...prev, [index]: [] }));
        }

        // Cập nhật lại trong DB (xóa câu cũ, thêm câu mới)
        if (onUpdateWord) {
          const currentSaved = word.savedExercises || { cloze: [], ordering: [] };
          const currentList = type === 'cloze' ? (currentSaved.cloze || []) : (currentSaved.ordering || []);
          const filteredList = currentList.filter((e: any) => type === 'cloze' ? e.sentence !== currentEx.sentence : e.correctSentence !== currentEx.correctSentence);
          
          if (type === 'cloze' && !filteredList.some((e: any) => e.sentence === newEx.sentence)) {
            filteredList.push(newEx);
          } else if (type === 'ordering' && !filteredList.some((e: any) => e.correctSentence === newEx.correctSentence)) {
            filteredList.push(newEx);
          }
          
          onUpdateWord(word.id, {
            savedExercises: {
              ...currentSaved,
              [type]: filteredList
            }
          });
        }
      }
    } catch (err) {
      console.log(err);
      alert("Không thể tạo câu mới lúc này, vui lòng thử lại sau.");
    } finally {
      setChangingIndex(null);
    }
  };

  const handleSaveExercise = (ex: any, type: PracticeType) => {
    if (!onUpdateWord) return;
    
    // Find the word
    const targetWord = ex.targetWord;
    let word = null;
    if (targetWord) {
      word = savedWords.find(w => w.text === targetWord);
    }
    if (!word) {
      // Fallback
      
        word = savedWords.find(w => ex.correctSentence.includes(w.text) || ex.shuffledWords.includes(w.text));
      
    }
    
    if (word) {
      const currentSaved = word.savedExercises || { cloze: [], ordering: [] };
      const currentList = type === 'cloze' ? (currentSaved.cloze || []) : (currentSaved.ordering || []);
      
      // Check if already saved
      const isSaved = type === 'cloze' 
        ? currentList.some((e: any) => e.sentence === ex.sentence)
        : currentList.some((e: any) => e.correctSentence === ex.correctSentence);
        
      if (!isSaved) {
        const newList = [...currentList, ex];
        onUpdateWord(word.id, {
          savedExercises: {
            ...currentSaved,
            [type]: newList
          }
        });
        alert("Đã lưu bài tập cho từ: " + word.text);
      } else {
        const newList = currentList.filter((e: any) => type === 'cloze' ? e.sentence !== ex.sentence : e.correctSentence !== ex.correctSentence);
        onUpdateWord(word.id, {
          savedExercises: {
            ...currentSaved,
            [type]: newList
          }
        });
        alert("Đã bỏ lưu bài tập cho từ: " + word.text);
      }
    } else {
      alert("Không tìm thấy từ vựng gốc để lưu bài tập này.");
    }
  };

  // Khi ấn vào phần luyện tập 1 từ vựng, trước tiên hiển thị 2 đề mục: Sắp xếp câu & Luyện nghe
  // Khi ấn vào phần luyện tập 1 từ vựng, trước tiên hiển thị 2 đề mục: Sắp xếp câu & Luyện nghe
  if (isSingleWordPractice && !selectedTopic && singleTargetWord) {
    const word = singleTargetWord;
    return (
      <div className="w-full min-h-full flex flex-col mx-auto p-3 sm:p-6 max-w-4xl animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
        {/* Top bar with back button & badge */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5 shrink-0">
          {onBack && (
            <button 
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors font-semibold bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 cursor-pointer text-xs sm:text-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách từ vựng</span>
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs shrink-0 ml-auto">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Luyện tập theo từ vựng
          </span>
        </div>

        {/* Word Profile Hero Card - Never clipped, clean typography */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-5 shrink-0 text-center flex flex-col items-center justify-center relative">
          {/* Chinese word & Pronounce button */}
          <div className="flex items-center justify-center gap-3">
            <span 
              className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-wide"
              style={{ fontFamily: '"DFKAI-SB", "KaiTi", "PingFang SC", "Microsoft YaHei", serif' }}
            >
              {word.text}
            </span>
            <button
              type="button"
              onClick={() => speakMandarin(word.text, 0.9, undefined, currentVoice)}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-blue-400 transition-all cursor-pointer shadow-2xs active:scale-90"
              title="Nghe phát âm từ này"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2 Practice Topic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full items-stretch mb-6">
          {/* Sắp xếp câu */}
          <button
            type="button"
            onClick={() => handleSelectTopic('ordering')}
            className="group flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer relative overflow-hidden active:scale-[0.99] min-h-[160px]"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs mb-3.5">
              <Dumbbell className="w-7 h-7" />
            </div>

            {/* Title */}
            <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Sắp xếp câu
            </h4>
          </button>

          {/* Luyện nghe (Chép chính tả) */}
          <button
            type="button"
            onClick={() => handleSelectTopic('listening')}
            className="group flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer relative overflow-hidden active:scale-[0.99] min-h-[160px]"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs mb-3.5">
              <Headphones className="w-7 h-7" />
            </div>

            {/* Title */}
            <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Luyện nghe (Chép chính tả)
            </h4>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 cursor-pointer text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          )}

          {isSingleWordPractice && (
            <button 
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer text-xs sm:text-sm transition-all shadow-2xs"
              title="Quay lại màn hình 2 đề mục"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2 Đề mục</span>
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => {
              setActiveTab('ordering');
              if (isSingleWordPractice) setSelectedTopic('ordering');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ordering'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Sắp xếp câu</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('listening');
              if (isSingleWordPractice) setSelectedTopic('listening');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'listening'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Luyện nghe</span>
          </button>
        </div>
      </div>
      
      <div className="w-full flex-1 overflow-y-auto pb-16 custom-scrollbar pr-1 flex flex-col items-center">
        {/* Listening Tab */}
        {activeTab === 'listening' && (
          <div className="w-full flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {listeningQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <Headphones className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Luyện nghe chép chính tả (10 câu)</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
                  Lắng nghe phát âm chuẩn của từng câu tiếng Trung và thử thách gõ lại chính xác câu bạn nghe được.
                </p>
                <button
                  onClick={() => generatePractice('ordering', false, true)}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  <span>{isGenerating ? 'Đang tạo câu hỏi...' : 'Tạo 10 câu luyện nghe (AI)'}</span>
                </button>
              </div>
            ) : showListeningSummary ? (
              /* Summary Scoreboard View */
              <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 rounded-3xl p-6 md:p-8 w-full text-center border border-blue-100 dark:border-slate-700 shadow-xl">
                  <div className="inline-flex p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mb-3 shadow-xs">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Kết quả Luyện nghe & Gõ câu</h4>
                  
                  <div className="text-5xl font-black text-blue-600 dark:text-blue-400 my-3">
                    {calculateListeningScore()} <span className="text-2xl text-slate-400 font-semibold">/ {listeningQuestions.length}</span>
                  </div>

                  <p className="text-sm font-medium mb-5 text-slate-600 dark:text-slate-300">
                    {calculateListeningScore() === listeningQuestions.length 
                      ? '🎉 Xuất sắc! Bạn đã nghe và gõ chính xác 100% tất cả các câu.' 
                      : calculateListeningScore() >= Math.ceil(listeningQuestions.length * 0.7)
                      ? '👏 Rất tốt! Bạn nghe và nhận diện chữ Hán rất chuẩn.'
                      : '💪 Hãy tiếp tục luyện tập! Nghe lại nhiều lần và gõ lại sẽ giúp nhớ mặt chữ và ngữ điệu rất nhanh.'}
                  </p>

                  <div className="flex items-center justify-center gap-3 max-w-sm mx-auto mb-6">
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{calculateListeningScore()} câu gõ đúng</span>
                    </div>
                    {listeningQuestions.length - calculateListeningScore() > 0 && (
                      <div className="flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        <span>{listeningQuestions.length - calculateListeningScore()} câu cần ôn lại</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex w-full gap-3 flex-col sm:flex-row justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTypedAnswers({});
                        setListeningChecked({});
                        setListeningIndex(0);
                        setShowListeningSummary(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Luyện gõ lại 10 câu này</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        generatePractice('ordering', false, true);
                        setShowListeningSummary(false);
                      }}
                      disabled={isGenerating}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3 px-5 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>Tạo 10 câu mới (AI)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowListeningSummary(false)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 px-5 rounded-2xl font-bold text-sm transition-all cursor-pointer"
                    >
                      <span>Xem lại các câu hỏi</span>
                    </button>
                  </div>
                </div>

                {/* Review All 10 Sentences */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Chi tiết 10 câu luyện nghe & gõ</span>
                  </h4>

                  <div className="flex flex-col gap-3">
                    {listeningQuestions.map((q, qIdx) => {
                      const userTyped = typedAnswers[qIdx] || '';
                      const isCorrect = isListeningAnswerCorrect(userTyped, q.correctSentence);
                      const usedTaVariant = isCorrect && (normalizeChinese(userTyped) !== normalizeChinese(q.correctSentence));

                      return (
                        <div 
                          key={q.id || qIdx}
                          className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isCorrect 
                              ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40' 
                              : 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: '"DFKAI-SB", "KaiTi", "PingFang SC", "Microsoft YaHei", serif' }}>
                                  {q.correctSentence}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => playSentenceAudio(q.correctSentence, listeningSpeed, qIdx)}
                                  className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                {q.pinyin}
                              </span>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Nghĩa: {q.translation}
                              </span>
                              <div className="text-xs pt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-slate-400">Bạn đã gõ: </span>
                                <span className={`text-base md:text-lg ${isCorrect ? "font-bold text-emerald-700 dark:text-emerald-300" : "font-bold text-rose-700 dark:text-rose-300"}`} style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                                  {userTyped ? `"${userTyped}"` : '(Chưa gõ)'}
                                </span>
                                {usedTaVariant && (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100/60 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                    ✓ Hợp lệ: 他/她 đồng âm
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đúng</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cần ôn lại</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Single Question Step-by-Step View */
              (() => {
                const q = listeningQuestions[listeningIndex] || listeningQuestions[0];
                const isChecked = Boolean(listeningChecked[listeningIndex]);
                const userTyped = typedAnswers[listeningIndex] || '';
                const isCorrectAnswer = isListeningAnswerCorrect(userTyped, q?.correctSentence || '');
                const usedTaVariant = isCorrectAnswer && (normalizeChinese(userTyped) !== normalizeChinese(q?.correctSentence || ''));
                const answeredCount = Object.keys(listeningChecked).length;

                return (
                  <div className="flex flex-col gap-3.5 w-full animate-in fade-in duration-300">
                    {/* Top Question Navigation Bar */}
                    <div className="bg-white dark:bg-slate-900 py-2.5 px-3.5 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                      {/* Question Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {listeningQuestions.map((item, pIdx) => {
                          const isPillChecked = Boolean(listeningChecked[pIdx]);
                          const isPillCorrect = isListeningAnswerCorrect(typedAnswers[pIdx] || '', item.correctSentence);
                          const isCurrent = pIdx === listeningIndex;

                          let pillClasses = "w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ";
                          if (isCurrent) {
                            pillClasses += "bg-blue-600 text-white ring-2 ring-blue-400 shadow-2xs scale-105";
                          } else if (isPillChecked) {
                            pillClasses += isPillCorrect 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700" 
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-700";
                          } else {
                            pillClasses += "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300";
                          }

                          return (
                            <button
                              key={pIdx}
                              onClick={() => {
                                setListeningIndex(pIdx);
                              }}
                              className={pillClasses}
                              title={`Chuyển đến câu ${pIdx + 1}`}
                            >
                              {pIdx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Controls on the right */}
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Summary link if at least 1 answered */}
                        {answeredCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowListeningSummary(true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>({calculateListeningScore()}/{answeredCount})</span>
                          </button>
                        )}

                        {/* Quick Waveform toggle button */}
                        <button
                          type="button"
                          onClick={handleToggleAudacityPlayer}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                            showAudacityPlayer 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'
                          }`}
                          title="Bật/tắt sóng âm thay thế chỗ nghe câu (Phím G)"
                        >
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                        </button>

                        <button
                          type="button"
                          onClick={() => generatePractice('ordering', false, true)}
                          disabled={isGenerating}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Tạo bộ 10 câu mới"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Main Question Listening Card (Compact & Space Efficient) */}
                    <motion.div
                      key={listeningIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xs border transition-all ${
                        isChecked
                          ? isCorrectAnswer
                            ? "border-emerald-500/80 ring-2 ring-emerald-500/10"
                            : "border-rose-500/80 ring-2 ring-rose-500/10"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {/* Compact Header */}
                      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                            Câu {listeningIndex + 1} / {listeningQuestions.length}
                          </span>
                          {isChecked && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isCorrectAnswer 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {isCorrectAnswer ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đúng</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Chưa đúng</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          Đã nghe: {listeningPlayCounts[listeningIndex] || 0} lần
                        </span>
                      </div>

                      {/* Unified Audio & Waveform Console: Độ rộng và độ cao của 2 mục bằng nhau tuyệt đối (h-[204px]), chuyển đổi siêu mượt mà và trực quan */}
                      <div 
                        ref={audacityPlayerContainerRef}
                        className={`w-full bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-2 sm:p-2.5 shadow-2xs mb-3.5 flex flex-col justify-between overflow-hidden relative select-none ${
                          showAudacityPlayer ? 'min-h-[216px] h-[216px]' : 'h-[204px] min-h-[204px] max-h-[204px]'
                        }`}
                      >
                        {/* 1. Header cố định: Cùng vị trí, cùng độ cao, cùng kiểu dáng, chuyển đổi êm ái */}
                        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0 h-[36px]">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                              {!showAudacityPlayer ? (
                                <Volume2 className="w-3.5 h-3.5" />
                              ) : (
                                <Activity className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {!showAudacityPlayer 
                                ? `Nghe phát âm câu ${listeningIndex + 1}` 
                                : `Sóng âm câu ${listeningIndex + 1}`}
                            </span>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                              {!showAudacityPlayer ? 'Phím Space' : 'Phím G'}
                            </kbd>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleToggleAudacityPlayer}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer shadow-2xs group"
                              title={!showAudacityPlayer ? "Mở Audio Player sóng âm (Phím tắt: G)" : "Quay lại nghe câu thông thường (Phím tắt: G)"}
                            >
                              {!showAudacityPlayer ? (
                                <>
                                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                                  <span>Sóng âm</span>
                                  <kbd className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold border border-blue-200 dark:border-slate-700">
                                    G
                                  </kbd>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                                  <span>Về nghe câu</span>
                                  <kbd className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold border border-blue-200 dark:border-slate-700">
                                    G
                                  </kbd>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 2. Body: Chiều cao bằng nhau tuyệt đối (~148px), chuyển đổi cực kỳ mượt mà qua AnimatePresence */}
                        <div className="flex-1 min-h-0 w-full relative overflow-hidden flex items-center justify-center">
                          <AnimatePresence mode="wait" initial={false}>
                            {!showAudacityPlayer ? (
                              /* Chế độ Nghe Câu trực quan: Soundwave visualizer + Audio Transport */
                              <motion.div
                                key="compact-audio-bar"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="w-full h-full flex flex-col justify-between items-center py-1 px-2 select-none"
                              >
                                {/* Thanh điều khiển phát âm thanh */}
                                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                  {/* Nút phát chính (Play) */}
                                  <button
                                    type="button"
                                    onClick={() => playSentenceAudio(q.correctSentence, listeningSpeed, listeningIndex)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-sm ${
                                      isPlayingAudio
                                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/30 animate-pulse'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                                    }`}
                                    title="Nghe phát âm câu tiếng Trung (Phím Space)"
                                  >
                                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                                    <span>{isPlayingAudio ? 'Đang phát âm...' : 'Nghe câu'}</span>
                                    <kbd className="px-1.5 py-0.5 rounded bg-blue-700 text-blue-100 font-mono text-[10px] font-bold">
                                      Space
                                    </kbd>
                                  </button>

                                  {/* Tốc độ chậm 0.75x */}
                                  <button
                                    type="button"
                                    onClick={() => playSentenceAudio(q.correctSentence, 0.75, listeningIndex)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                                      listeningSpeed === 0.75 && isPlayingAudio
                                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                    }`}
                                    title="Nghe tốc độ chậm 0.75x"
                                  >
                                    <span>🐢 0.75x</span>
                                  </button>

                                  {/* Tốc độ chuẩn 1.0x */}
                                  <button
                                    type="button"
                                    onClick={() => playSentenceAudio(q.correctSentence, 1.0, listeningIndex)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                                      listeningSpeed === 1.0 && isPlayingAudio
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                    }`}
                                    title="Nghe tốc độ chuẩn 1.0x"
                                  >
                                    <span>⚡ 1.0x</span>
                                  </button>
                                </div>

                                {/* Dải sóng âm mô phỏng trực quan nhịp điệu âm thanh (Interactive Soundwave Visualizer) */}
                                <div className="w-full max-w-lg mx-auto flex items-center justify-center gap-1 sm:gap-1.5 h-11 px-3 my-auto bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                  {[
                                    0.25, 0.45, 0.7, 0.5, 0.85, 1.0, 0.75, 0.4, 0.6, 0.9, 0.7, 0.5, 0.35, 
                                    0.65, 0.95, 0.8, 0.6, 0.4, 0.75, 1.0, 0.85, 0.55, 0.35, 0.65, 0.9, 0.7, 
                                    0.45, 0.3, 0.2
                                  ].map((amp, bIdx) => {
                                    const h = isPlayingAudio 
                                      ? Math.max(8, Math.min(36, amp * 36))
                                      : Math.max(4, Math.min(24, amp * 20));
                                    return (
                                      <span
                                        key={bIdx}
                                        className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
                                          isPlayingAudio
                                            ? 'bg-gradient-to-t from-blue-600 to-indigo-500 animate-pulse'
                                            : 'bg-blue-300/80 dark:bg-blue-700/60 hover:bg-blue-400'
                                        }`}
                                        style={{
                                          height: `${h}px`,
                                          animationDelay: isPlayingAudio ? `${(bIdx % 8) * 0.09}s` : undefined,
                                          animationDuration: isPlayingAudio ? '0.65s' : undefined
                                        }}
                                      />
                                    );
                                  })}
                                </div>

                                {/* Gợi ý thao tác & Trạng thái */}
                                <div className="flex items-center justify-between w-full px-2 text-[11px] text-slate-400 dark:text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Ấn <strong>Space</strong> để nghe lại câu • Ấn <strong>G</strong> để xem sóng âm chi tiết</span>
                                  </span>
                                  <span>Đã nghe: <strong>{listeningPlayCounts[listeningIndex] || 0}</strong> lần</span>
                                </div>
                              </motion.div>
                            ) : (
                              /* Chế độ Sóng âm chi tiết Audacity */
                              <motion.div 
                                key="waveform-audio-player"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="w-full h-full flex flex-col justify-center overflow-hidden"
                              >
                                <AudacityAudioPlayer 
                                  key={`audacity-q-${listeningIndex}-${q.correctSentence}`}
                                  lessonText={q.correctSentence}
                                  lessonTitle={`Câu ${listeningIndex + 1}`}
                                  initialTrackName={`Track 1 - Câu ${listeningIndex + 1}`}
                                  initialAudioUrl={ttsBlobCache.get(q.correctSentence)}
                                  selectedVoice={currentVoice}
                                  availableVoices={availableVoices}
                                  onVoiceChange={onVoiceChange}
                                  waveformOnly={true}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Chinese Sentence Typing Area */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Gõ câu tiếng Trung bạn nghe được:</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowCharHints(!showCharHints)}
                              className={`text-xs px-2 py-0.5 rounded-lg border transition-colors flex items-center gap-1 font-semibold cursor-pointer ${
                                showCharHints 
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                              title="Bật/tắt bàn phím ký tự nếu chưa có bộ gõ tiếng Trung"
                            >
                              <span>{showCharHints ? 'Ẩn phím gợi ý' : 'Bàn phím gợi ý'}</span>
                            </button>
                            {userTyped && !isChecked && (
                              <button
                                type="button"
                                onClick={() => setTypedAnswers(prev => ({ ...prev, [listeningIndex]: '' }))}
                                className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer font-medium px-1.5"
                              >
                                <span>Xóa</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Optional Character Hint Keyboard with scrambled characters (Requirement 4) */}
                        {showCharHints && (
                          <div className="p-2 bg-amber-50/40 dark:bg-slate-800/80 rounded-xl border border-amber-200/60 dark:border-slate-700 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mr-1">Phím gợi ý (xáo trộn):</span>
                            {(() => {
                              const chars = Array.from(new Set(normalizeChinese(q.correctSentence).split('')));
                              // Deterministic shuffle per question index so order remains stable while typing
                              const shuffled = [...chars];
                              let seed = (listeningIndex + 1) * 37 + chars.length;
                              for (let i = shuffled.length - 1; i > 0; i--) {
                                seed = (seed * 9301 + 49297) % 233280;
                                const j = Math.floor((seed / 233280) * (i + 1));
                                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                              }
                              // Ensure it differs from original order if more than 1 character
                              if (shuffled.join('') === chars.join('') && shuffled.length > 1) {
                                [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
                              }
                              return shuffled.map((char, charIdx) => (
                                <button
                                  key={charIdx}
                                  type="button"
                                  disabled={isChecked}
                                  onClick={() => {
                                    setTypedAnswers(prev => ({
                                      ...prev,
                                      [listeningIndex]: (prev[listeningIndex] || '') + char
                                    }));
                                    typingInputRef.current?.focus();
                                  }}
                                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600 text-base font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                                  style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                                >
                                  {char}
                                </button>
                              ));
                            })()}
                            <button
                              type="button"
                              disabled={isChecked}
                              onClick={() => {
                                setTypedAnswers(prev => ({
                                  ...prev,
                                  [listeningIndex]: (prev[listeningIndex] || '').slice(0, -1)
                                }));
                                typingInputRef.current?.focus();
                              }}
                              className="px-2 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              <span>⌫ Xóa</span>
                            </button>
                          </div>
                        )}

                        {/* Compact Input + Check row (Requirement 5: Font size matches answer display text-xl md:text-2xl) */}
                        <div className="flex items-center gap-2">
                          <input
                            ref={typingInputRef}
                            type="text"
                            value={userTyped}
                            readOnly={isChecked}
                            onChange={(e) => setTypedAnswers(prev => ({ ...prev, [listeningIndex]: e.target.value }))}
                            onKeyDown={(e) => {
                              // Don't trigger if user is composing via IME
                              if (e.nativeEvent.isComposing || e.key === 'Process' || (e as any).keyCode === 229) {
                                return;
                              }
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isChecked) {
                                  handleCheckCurrentQuestion(listeningIndex);
                                } else if (listeningIndex < listeningQuestions.length - 1) {
                                  const nextIdx = listeningIndex + 1;
                                  setListeningIndex(nextIdx);
                                  setTimeout(() => typingInputRef.current?.focus(), 60);
                                } else {
                                  setShowListeningSummary(true);
                                }
                              }
                            }}
                            placeholder={isChecked ? "Chuyển câu tiếp theo hoặc gõ lại câu này..." : "Nhập chữ Hán vào đây để kiểm tra..."}
                            className={`flex-1 px-3.5 py-2.5 rounded-xl border-2 transition-all outline-none font-bold text-xl md:text-2xl shadow-2xs ${
                              !isChecked
                                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal'
                                : isCorrectAnswer
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-950 dark:text-rose-100'
                            }`}
                            style={{ fontFamily: '"DFKAI-SB", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif' }}
                          />

                          {!isChecked && (
                            <button
                              type="button"
                              onClick={() => handleCheckCurrentQuestion(listeningIndex)}
                              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                              title="Kiểm tra câu trả lời hoặc xem đáp án"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Kiểm tra</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Streamlined & Compact Reveal Section */}
                      {isChecked && (
                        <motion.div
                          ref={listeningResultRef}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-2.5"
                        >
                          <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                            isCorrectAnswer 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' 
                              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                          }`}>
                            {/* Top row of card: Status, Sentence & Replay */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isCorrectAnswer ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Chính xác 100%!</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Chưa chính xác!</span>
                                  </span>
                                )}

                                {/* Requirement 5: Chinese answer font size matches typing input text-xl md:text-2xl */}
                                <span 
                                  className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-wide" 
                                  style={{ fontFamily: '"DFKAI-SB", "KaiTi", "PingFang SC", "Microsoft YaHei", serif' }}
                                >
                                  {q.correctSentence}
                                </span>

                                {q.pinyin && (
                                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/40">
                                    {q.pinyin}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Requirement 1: Explanation when user used 他 vs 她 pronoun variation */}
                            {usedTaVariant && (
                              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-300/60 dark:border-emerald-800 flex items-center gap-1.5">
                                <span>💡</span>
                                <span>
                                  Chính xác! Trong tiếng Trung, <strong>{userTyped.includes('她') ? '她 (cô ấy)' : '他 (anh ấy)'}</strong> và <strong>{q.correctSentence.includes('她') ? '她' : '他'}</strong> đều phát âm là <em>"tā"</em> nên đều được tính là đáp án đúng!
                                </span>
                              </div>
                            )}

                            {/* Comparison if incorrect */}
                            {!isCorrectAnswer && (
                              <div className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5 px-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-rose-200/50 dark:border-rose-900/30">
                                <span className="text-slate-500 font-medium">Bạn gõ:</span>
                                <span className="font-bold text-xl md:text-2xl text-rose-700 dark:text-rose-400 line-through" style={{ fontFamily: '"DFKAI-SB", "KaiTi", "PingFang SC", "Microsoft YaHei", serif' }}>
                                  {userTyped || '(Chưa gõ)'}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-500 font-medium">Đáp án chuẩn:</span>
                                <span className="font-bold text-xl md:text-2xl text-emerald-700 dark:text-emerald-300" style={{ fontFamily: '"DFKAI-SB", "KaiTi", "PingFang SC", "Microsoft YaHei", serif' }}>
                                  {q.correctSentence}
                                </span>
                              </div>
                            )}

                            {/* Vietnamese Translation */}
                            <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              <span className="text-slate-400 font-normal mr-1">Nghĩa:</span>
                              {q.translation}
                            </div>

                            {/* Requirement 1: Nút ẩn/hiện phần phân tích cấu trúc và ngữ pháp, mặc định là ẩn */}
                            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => setExpandedAnalyses(prev => ({ ...prev, [listeningIndex]: !prev[listeningIndex] }))}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none bg-blue-50/70 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-slate-700 active:scale-98 shadow-2xs"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Phân tích cấu trúc & ngữ pháp câu</span>
                                  {expandedAnalyses[listeningIndex] ? (
                                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 ml-1">
                                      (Ẩn <ChevronUp className="w-3.5 h-3.5" />)
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 ml-1">
                                      (Hiện <ChevronDown className="w-3.5 h-3.5" />)
                                    </span>
                                  )}
                                </button>
                              </div>

                              <AnimatePresence>
                                {expandedAnalyses[listeningIndex] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0, y: -4 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-3 bg-white/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                                      {q.structureExplanation ? (
                                        <GrammarAnalysisView content={q.structureExplanation} />
                                      ) : sentenceAnalyses[listeningIndex]?.loading ? (
                                        <div className="flex items-center gap-2 text-slate-500 py-1 text-xs sm:text-sm">
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                          <span>Đang phân tích cấu trúc ngữ pháp câu...</span>
                                        </div>
                                      ) : sentenceAnalyses[listeningIndex]?.text ? (
                                        <GrammarAnalysisView content={sentenceAnalyses[listeningIndex].text} />
                                      ) : (
                                        <div className="flex flex-col gap-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                          <div>• <strong>Câu chuẩn:</strong> {q.correctSentence} ({q.pinyin})</div>
                                          <div>• <strong>Dịch nghĩa:</strong> {q.translation}</div>
                                          {q.targetWord && <div>• <strong>Từ vựng trọng tâm:</strong> {q.targetWord}</div>}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={listeningIndex === 0}
                          onClick={() => {
                            const prevIdx = Math.max(0, listeningIndex - 1);
                            setListeningIndex(prevIdx);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Câu trước</span>
                        </button>

                        {/* Retry typing this question button if checked */}
                        {isChecked && (
                          <button
                            type="button"
                            onClick={() => {
                              setListeningChecked(prev => ({ ...prev, [listeningIndex]: false }));
                              setTypedAnswers(prev => ({ ...prev, [listeningIndex]: '' }));
                              if (q && q.correctSentence) {
                                playSentenceAudio(q.correctSentence, listeningSpeed, listeningIndex);
                              }
                              setTimeout(() => typingInputRef.current?.focus(), 60);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                            title="Gõ lại câu này"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Gõ lại</span>
                          </button>
                        )}

                        {listeningIndex < listeningQuestions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextIdx = listeningIndex + 1;
                              setListeningIndex(nextIdx);
                              setTimeout(() => typingInputRef.current?.focus(), 60);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer ml-auto sm:ml-0"
                            title="Chuyển câu tiếp theo"
                          >
                            <span>Câu tiếp theo</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowListeningSummary(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer ml-auto sm:ml-0"
                            title="Xem bảng kết quả tổng kết"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Xem kết quả</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Ordering Tab */}
        {activeTab === 'ordering' && (
          <div className="flex flex-col gap-6 w-full">
            {orderingExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <Dumbbell className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Bài tập sắp xếp câu</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">AI sẽ tự động tạo các câu từ vựng lộn xộn để bạn rèn luyện kỹ năng ghép câu.</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <button
                    onClick={() => generatePractice('ordering', false, true)}
                    disabled={isGenerating}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    {isGenerating ? 'Đang tạo bài tập...' : 'Tạo bài tập mới'}
                  </button>
                  
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span>Sắp xếp các từ thành câu hoàn chỉnh</span>
                    </h3>
                    <button 
                      onClick={() => setShowPinyin(!showPinyin)} 
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        showPinyin 
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                      title={showPinyin ? "Ẩn Pinyin" : "Hiện Pinyin"}
                    >
                      {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{showPinyin ? "Đang hiện Pinyin" : "Hiện Pinyin"}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => generatePractice('ordering', false, true)}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isGenerating ? 'Đang tạo...' : 'Tạo bài tập mới (AI)'}
                  </button>
                </div>
                
                {orderingExercises.map((ex, i) => {
                  const userAnswer = orderingAnswers[i] || [];
                  const normalize = (str: string) => (str || '').replace(/[\s.,!?。，！？、]/g, '');
                  const isCorrect = ex.type === 'insert_word' 
                    ? insertWordAnswers[i] === ex.correctOption
                    : normalize(userAnswer.map(u => u.text).join('')) === normalize(ex.correctSentence);

                  const userFormedSentence = userAnswer.map(u => u.text).join('');

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border transition-all ${
                        orderingChecked 
                          ? (isCorrect 
                              ? "border-2 border-emerald-500/80 dark:border-emerald-500/80 ring-4 ring-emerald-500/10" 
                              : "border-2 border-rose-500/80 dark:border-rose-500/80 ring-4 ring-rose-500/10") 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Header with question number and status */}
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                            Câu {i + 1} / {orderingExercises.length}
                          </span>

                          {orderingChecked && (
                            <AnimatePresence>
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                                  isCorrect 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60' 
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Chính xác</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                    <span>Chưa chính xác</span>
                                  </>
                                )}
                              </motion.span>
                            </AnimatePresence>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {!orderingChecked && (
                            <button 
                              onClick={() => handleChangeExercise(i, ex, 'ordering')} 
                              disabled={changingIndex === i} 
                              className="p-1.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-medium" 
                              title="Đổi câu khác"
                            >
                              {changingIndex === i ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <RefreshCw className="w-4 h-4" />}
                              <span className="hidden sm:inline">Đổi câu</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {showPinyin && (
                        <div className="mb-4 text-sm font-mono text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          {ex.pinyin}
                        </div>
                      )}
                      
                      {ex.type === 'insert_word' ? (
                        <div className="flex flex-col gap-5 mb-5">
                          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Từ cần điền:</span>
                            <span className="text-2xl font-bold text-amber-900 dark:text-amber-200" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                              {ex.targetWord}
                            </span>
                          </div>
                          
                          <div className="text-2xl font-medium leading-[2.5] text-slate-800 dark:text-slate-100" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                            {(ex.sentenceWithGaps || '').split(/(【[A-D]】)/g).map((part, partIdx) => {
                              const match = part.match(/【([A-D])】/);
                              if (match) {
                                const option = match[1];
                                const isSelected = insertWordAnswers[i] === option;
                                const isOptionCorrect = option === ex.correctOption;

                                let btnStyle = "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-300";

                                if (!orderingChecked) {
                                  if (isSelected) {
                                    btnStyle = "bg-blue-600 text-white border-blue-700 shadow-md scale-110";
                                  }
                                } else {
                                  if (isOptionCorrect) {
                                    btnStyle = "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 scale-105";
                                  } else if (isSelected && !isOptionCorrect) {
                                    btnStyle = "bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400 line-through scale-105";
                                  } else {
                                    btnStyle = "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-600 dark:border-slate-800 opacity-60";
                                  }
                                }

                                return (
                                  <button
                                    key={partIdx}
                                    onClick={() => {
                                      if (!orderingChecked) {
                                        setInsertWordAnswers(prev => ({ ...prev, [i]: option }));
                                      }
                                    }}
                                    disabled={orderingChecked}
                                    className={`mx-2 inline-flex items-center justify-center w-10 h-10 rounded-full border-2 text-base font-bold transition-all cursor-pointer ${btnStyle}`}
                                  >
                                    {option}
                                  </button>
                                );
                              }
                              return <span key={partIdx}>{part}</span>;
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Answer Drop Zone */}
                          <div className={`min-h-[70px] p-3.5 rounded-2xl border-2 flex flex-wrap gap-2.5 mb-5 items-center transition-all ${
                            !orderingChecked 
                              ? (userAnswer.length === 0 ? 'bg-slate-50 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700' : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700')
                              : (isCorrect 
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60' 
                                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60')
                          }`}>
                            {userAnswer.length === 0 && (
                              <span className="text-slate-400 dark:text-slate-500 text-sm ml-2 font-medium select-none">
                                {orderingChecked ? '(Bạn chưa sắp xếp câu này)' : 'Bấm vào các từ bên dưới để ghép câu theo thứ tự đúng...'}
                              </span>
                            )}
                            {userAnswer.length > 0 && (
                              <Reorder.Group 
                                axis="x" 
                                values={userAnswer} 
                                onReorder={(newOrder) => {
                                  if (!orderingChecked) {
                                    setOrderingAnswers(prev => ({ ...prev, [i]: newOrder }));
                                  }
                                }}
                                className="flex flex-wrap gap-2.5 w-full items-center"
                              >
                                {userAnswer.map((item) => (
                                  <Reorder.Item
                                    key={item.id}
                                    value={item}
                                    dragListener={!orderingChecked}
                                    className="relative"
                                    onPointerDown={(e) => {
                                      e.currentTarget.dataset.startX = e.clientX.toString();
                                      e.currentTarget.dataset.startY = e.clientY.toString();
                                      speakMandarin(item.text, 0.9, undefined, undefined, undefined, true);
                                    }}
                                    onPointerUp={(e) => {
                                      const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                                      const startY = parseFloat(e.currentTarget.dataset.startY || '0');
                                      const distance = Math.hypot(e.clientX - startX, e.clientY - startY);
                                      if (distance < 5 && !orderingChecked) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: userAnswer.filter(u => u.id !== item.id) }));
                                      }
                                    }}
                                  >
                                    <div
                                      className={`px-4 py-2 rounded-xl shadow-xs border-2 transition-all font-bold select-none ${
                                        !orderingChecked 
                                          ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 cursor-grab active:cursor-grabbing' 
                                          : (isCorrect 
                                              ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 pointer-events-none' 
                                              : 'bg-rose-50 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 pointer-events-none')
                                      }`}
                                      style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '19px' }}
                                    >
                                      {item.text}
                                    </div>
                                  </Reorder.Item>
                                ))}
                              </Reorder.Group>
                            )}
                          </div>

                          {/* Word Bank (Only active before check) */}
                          {!orderingChecked && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(ex.shuffledWords || []).map((wordRaw, wordIdx) => {
                                const word = typeof wordRaw === 'string' ? wordRaw : (wordRaw as any).text;
                                const usedCount = userAnswer.filter(w => w.text === word).length;
                                  
                                const shuffledIndexForThisWord = (ex.shuffledWords || []).slice(0, wordIdx).filter(w => {
                                    const wText = typeof w === 'string' ? w : (w as any).text;
                                    return wText === word;
                                }).length;
                                const isUsed = shuffledIndexForThisWord < usedCount;

                                return (
                                  <button
                                    key={`bank-${i}-${wordIdx}`}
                                    onPointerDown={() => {
                                      if (!orderingChecked && !isUsed) {
                                        speakMandarin(word, 0.9, undefined, undefined, undefined, true);
                                      }
                                    }}
                                    onClick={() => {
                                      if (!orderingChecked && !isUsed) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                      }
                                    }}
                                    disabled={isUsed || orderingChecked}
                                    className={`px-4 py-2 rounded-xl border-2 transition-all cursor-pointer font-bold ${
                                      isUsed 
                                        ? 'bg-slate-100 text-slate-300 border-slate-100 dark:bg-slate-800/40 dark:text-slate-600 dark:border-slate-800/40 cursor-not-allowed shadow-none scale-95 opacity-50' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700/80 shadow-xs active:scale-95'
                                    }`}
                                    style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif', fontSize: '19px' }}
                                  >
                                    {word}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}

                      {/* Detailed Solution Box when checked */}
                      {orderingChecked && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-5 pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-3"
                        >
                          {/* If incorrect, show user sentence vs correct sentence comparison */}
                          {!isCorrect && (
                            <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex flex-col gap-1 text-sm">
                              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Câu của bạn:</span>
                              <div className="text-base text-rose-900 dark:text-rose-200 font-medium" style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}>
                                {ex.type === 'insert_word' 
                                  ? (insertWordAnswers[i] ? `Bạn chọn đáp án 【${insertWordAnswers[i]}】` : '(Bạn chưa chọn đáp án)')
                                  : (userFormedSentence || '(Chưa sắp xếp)')}
                              </div>
                            </div>
                          )}

                          {/* Correct Sentence Card */}
                          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Đáp án chuẩn:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => speakMandarin(ex.correctSentence, 0.9)}
                                className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 hover:bg-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
                                title="Phát âm câu"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div 
                              className="text-xl md:text-2xl font-bold text-emerald-950 dark:text-emerald-100 tracking-wide leading-relaxed" 
                              style={{ fontFamily: '"DFKAI-SB", "KaiTi", serif' }}
                            >
                              {ex.correctSentence}
                            </div>

                            {ex.pinyin && (
                              <div className="text-xs font-mono text-blue-600 dark:text-blue-400 tracking-wide">
                                {ex.pinyin}
                              </div>
                            )}

                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-1 border-t border-emerald-200/50 dark:border-emerald-900/40">
                              <span className="text-slate-500 dark:text-slate-400 mr-1.5">Nghĩa:</span>
                              {ex.translation}
                            </div>
                            {ex.structureExplanation && (
                              <div className="pt-2 mt-2 border-t border-emerald-200/50 dark:border-emerald-900/40">
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderingAnalyses(prev => ({ ...prev, [i]: !prev[i] }))}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 hover:bg-emerald-200/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Phân tích cấu trúc & ngữ pháp</span>
                                  {expandedOrderingAnalyses[i] ? (
                                    <span className="flex items-center gap-0.5 text-[11px] opacity-80">(Ẩn <ChevronUp className="w-3 h-3" />)</span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-[11px] opacity-80">(Hiện <ChevronDown className="w-3 h-3" />)</span>
                                  )}
                                </button>
                                <AnimatePresence>
                                  {expandedOrderingAnalyses[i] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="pt-2 overflow-hidden"
                                    >
                                      <GrammarAnalysisView content={ex.structureExplanation} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}

                <div className="flex flex-col mt-4 w-full">
                  {!orderingChecked ? (
                    <button
                      onClick={() => {
                        setOrderingChecked(true);
                        const normalize = (str: string) => (str || '').replace(/[\s.,!?。，！？、]/g, '');
                        const scoreMap: Record<string, { correct: number, total: number }> = {};
                        
                        orderingExercises.forEach((ex, i) => {
                          const isCorrect = ex.type === 'insert_word' 
                            ? insertWordAnswers[i] === ex.correctOption
                            : normalize(orderingAnswers[i]?.map(u => u.text).join('')) === normalize(ex.correctSentence);
                          
                          let word = null;
                          if (ex.targetWord) word = savedWords.find(w => w.text === ex.targetWord);
                          if (!word) word = savedWords.find(w => ex.correctSentence && ex.correctSentence.includes(w.text));
                          
                          if (word) {
                            if (!scoreMap[word.id]) scoreMap[word.id] = { correct: 0, total: 0 };
                            scoreMap[word.id].total += 1;
                            if (isCorrect) scoreMap[word.id].correct += 1;
                          }
                        });
                        
                        if (onUpdateWord) {
                          Object.keys(scoreMap).forEach(wordId => {
                            const stats = scoreMap[wordId];
                            const newScore = Math.round((stats.correct / stats.total) * 10);
                            const word = savedWords.find(w => w.id === wordId);
                            const highestScore = Math.max(newScore, word?.lastPracticeScore || 0);
                            onUpdateWord(wordId, { lastPracticeScore: highestScore });
                          });
                        }

                        // Requirement 2: Tự động cuộn xuống phần kết quả khi ấn kiểm tra
                        setTimeout(() => {
                          orderingResultRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                          });
                        }, 80);
                        setTimeout(() => {
                          orderingResultRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                          });
                        }, 250);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Kiểm tra đáp án</span>
                    </button>
                  ) : (
                    <div ref={orderingResultRef} className="flex flex-col items-center w-full">
                      {/* Summary Scoreboard */}
                      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 rounded-3xl p-6 md:p-8 w-full text-center mb-6 border border-blue-100 dark:border-slate-700 shadow-xl">
                        <div className="inline-flex p-3 rounded-2xl bg-blue-100/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
                          <Award className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Kết quả bài luyện tập</h4>
                        <div className="text-5xl font-black text-blue-600 dark:text-blue-400 my-3">
                          {calculateOrderingScore()} <span className="text-2xl text-slate-400 font-semibold">/ {orderingExercises.length}</span>
                        </div>
                        
                        {/* Motivational message based on score */}
                        <p className="text-sm font-medium mb-4 text-slate-600 dark:text-slate-300">
                          {calculateOrderingScore() === orderingExercises.length 
                            ? '🎉 Xuất sắc! Bạn đã trả lời chính xác tất cả các câu.'
                            : calculateOrderingScore() >= Math.ceil(orderingExercises.length * 0.7)
                            ? '👏 Rất tốt! Bạn đã nắm vững hầu hết cấu trúc câu.'
                            : '💪 Hãy tiếp tục cố gắng! Bạn có thể làm lại các câu chưa đúng để ghi nhớ tốt hơn.'}
                        </p>

                        {/* Breakdown pills */}
                        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
                          <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{calculateOrderingScore()} câu đúng</span>
                          </div>
                          {orderingExercises.length - calculateOrderingScore() > 0 && (
                            <div className="flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5">
                              <XCircle className="w-4 h-4" />
                              <span>{orderingExercises.length - calculateOrderingScore()} câu cần ôn lại</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex w-full gap-3 flex-col sm:flex-row">
                        {calculateOrderingScore() < orderingExercises.length && (
                          <button
                            type="button"
                            onClick={() => {
                              const normalize = (str: string) => (str || '').replace(/[\s.,!?。，！？、]/g, '');
                              const wrongExercises = orderingExercises.filter((ex, i) => {
                                if (ex.type === 'insert_word') {
                                  return insertWordAnswers[i] !== ex.correctOption;
                                }
                                return normalize(orderingAnswers[i]?.map(u => u.text).join('')) !== normalize(ex.correctSentence);
                              });
                              setOrderingExercises(wrongExercises);
                              setOrderingAnswers({});
                              setInsertWordAnswers({});
                              setOrderingChecked(false);
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3.5 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Làm lại {orderingExercises.length - calculateOrderingScore()} câu sai</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setOrderingAnswers({});
                            setInsertWordAnswers({});
                            setOrderingChecked(false);
                          }}
                          className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Làm lại toàn bộ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => generatePractice('ordering', false, true)}
                          disabled={isGenerating}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 py-3.5 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                          <span>Tạo bộ câu mới</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      
    </div>
  );
}
