// Audio element singleton and client blob cache for unified high-fidelity Edge Neural TTS
interface CachedSpeechAudio {
  blobUrl: string;
  subtitles: Array<{ part: string; start: number; end: number }>;
}

let currentAudioElement: HTMLAudioElement | null = null;
let currentRafId: number | null = null;
const speechAudioBlobCache = new Map<string, CachedSpeechAudio>();

let synthTimeout: any = null;
let currentResumeInterval: any = null;
export let isManuallyPaused = false;

let globalVoiceURI: string | undefined;

export const setGlobalVoiceURI = (uri: string) => {
  globalVoiceURI = uri;
};

export const pauseSpeech = () => {
  isManuallyPaused = true;
  if (currentAudioElement) {
    try { currentAudioElement.pause(); } catch {}
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
};

export const resumeSpeech = () => {
  isManuallyPaused = false;
  if (currentAudioElement) {
    try { currentAudioElement.play().catch(() => {}); } catch {}
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
};

export const cancelSpeech = () => {
  isManuallyPaused = false;
  if (currentRafId !== null && typeof window !== "undefined") {
    cancelAnimationFrame(currentRafId);
    currentRafId = null;
  }
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {}
    currentAudioElement = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (synthTimeout) {
    clearTimeout(synthTimeout);
    synthTimeout = null;
  }
  if (currentResumeInterval) {
    clearInterval(currentResumeInterval);
    currentResumeInterval = null;
  }
};

export const speakMandarin = async (
  text: string, 
  rate: number = 1.0, 
  onBoundary?: (charIndex: number, charLength: number) => void, 
  voiceURI?: string, 
  onStart?: () => void, 
  queue: boolean = false
): Promise<void> => {
  if (typeof window === "undefined") return;

  const cleanText = (text || "").trim();
  if (!cleanText) return;

  if (!queue) {
    cancelSpeech();
  }

  isManuallyPaused = false;

  const targetURI = (voiceURI || globalVoiceURI || "").toLowerCase();
  const isYunxi = targetURI.includes("yunxi") || targetURI.includes("云希") || targetURI.includes("nam") || targetURI.includes("male");
  const effectiveVoice = isYunxi ? "zh-CN-YunxiNeural" : "zh-CN-XiaoxiaoNeural";
  const cacheKey = `v5_edge_neural:${effectiveVoice}:${cleanText}`;

  // Fallback helper using standard browser SpeechSynthesis
  const fallbackToSpeechSynthesis = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "zh-CN";
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      let zhVoice: SpeechSynthesisVoice | undefined;

      if (isYunxi) {
        zhVoice = voices.find(v => v.voiceURI === "zh-CN-YunxiNeural" || v.voiceURI.toLowerCase().includes("yunxi") || v.name.toLowerCase().includes("yunxi") || v.name.includes("云希") || v.voiceURI.includes("云希"));
        if (!zhVoice) {
          zhVoice = voices.find(v => (v.lang.startsWith("zh-") || v.name.toLowerCase().includes("chinese")) && 
            (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("kangkang") || v.name.toLowerCase().includes("zhiwei") || v.name.toLowerCase().includes("yunjian") || v.name.toLowerCase().includes("yunyang")));
        }
        if (!zhVoice) {
          const zhVoices = voices.filter(v => v.lang.startsWith("zh-"));
          zhVoice = zhVoices.length > 1 ? zhVoices[1] : zhVoices[0];
        }
      } else {
        zhVoice = voices.find(v => v.voiceURI === "zh-CN-XiaoxiaoNeural" || v.voiceURI.toLowerCase().includes("xiaoxiao") || v.name.toLowerCase().includes("xiaoxiao") || v.name.includes("晓晓") || v.voiceURI.includes("晓晓"));
        if (!zhVoice) {
          zhVoice = voices.find(v => (v.lang.startsWith("zh-") || v.name.toLowerCase().includes("chinese")) && 
            (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("tingting") || v.name.toLowerCase().includes("huihui") || v.name.toLowerCase().includes("xiaoyi") || v.name.toLowerCase().includes("meijia")));
        }
        if (!zhVoice) {
          const zhVoices = voices.filter(v => v.lang.startsWith("zh-"));
          zhVoice = zhVoices[0];
        }
      }

      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      let isFinished = false;
      const finish = () => {
        if (!isFinished) {
          isFinished = true;
          if (synthTimeout) clearTimeout(synthTimeout);
          if (currentResumeInterval) clearInterval(currentResumeInterval);
          resolve();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      utterance.onstart = () => {
        if (onStart) onStart();
        const dynamicTimeout = Math.max(10000, cleanText.length * 500 / rate);
        if (synthTimeout) clearTimeout(synthTimeout);
        synthTimeout = setTimeout(() => {
          if (!isFinished && !isManuallyPaused) {
            window.speechSynthesis.cancel();
            finish();
          }
        }, dynamicTimeout);

        if (currentResumeInterval) clearInterval(currentResumeInterval);
        currentResumeInterval = setInterval(() => {
          if (!isFinished && window.speechSynthesis.speaking && !isManuallyPaused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else if (isFinished) {
            clearInterval(currentResumeInterval);
          }
        }, 12000);
      };

      utterance.onboundary = (event) => {
        if (onBoundary) {
          onBoundary(event.charIndex, event.charLength);
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // 1. Primary: Use exact Edge Neural TTS (/api/tts) so voices across the entire app match 100%
  try {
    let cached = speechAudioBlobCache.get(cacheKey);

    if (!cached) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: effectiveVoice }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: data.mimeType || "audio/mp3" });
          const blobUrl = URL.createObjectURL(blob);
          const subtitles = Array.isArray(data.subtitles) ? data.subtitles : [];
          cached = { blobUrl, subtitles };
          speechAudioBlobCache.set(cacheKey, cached);
        }
      }
    }

    if (cached && cached.blobUrl) {
      const { blobUrl, subtitles } = cached;

      // Map subtitles onto cleanText character indices for exact WordBoundary tracking
      const mappedTimeline: Array<{ charIndex: number; charLength: number; startMs: number; endMs: number }> = [];
      if (onBoundary && subtitles && subtitles.length > 0) {
        let searchCursor = 0;
        for (const sub of subtitles) {
          const part = (sub.part || "").trim();
          if (!part) continue;
          const foundIdx = cleanText.indexOf(part, searchCursor);
          if (foundIdx !== -1) {
            mappedTimeline.push({
              charIndex: foundIdx,
              charLength: part.length,
              startMs: sub.start || 0,
              endMs: Math.max((sub.start || 0) + 40, sub.end || 0)
            });
            searchCursor = foundIdx + part.length;
          } else {
            // Try matching first character within a small window
            const firstCh = part[0];
            const windowIdx = cleanText.indexOf(firstCh, searchCursor);
            if (windowIdx !== -1 && windowIdx - searchCursor <= 6) {
              mappedTimeline.push({
                charIndex: windowIdx,
                charLength: part.length,
                startMs: sub.start || 0,
                endMs: Math.max((sub.start || 0) + 40, sub.end || 0)
              });
              searchCursor = windowIdx + part.length;
            }
          }
        }
      }

      return new Promise((resolve) => {
        const audio = new Audio(blobUrl);
        audio.playbackRate = rate;
        currentAudioElement = audio;

        let started = false;
        let lastReportedCharIdx = -1;

        const updateBoundaryAtCurrentTime = () => {
          if (!onBoundary || !audio || audio.paused || audio.ended) return;
          const currentMs = audio.currentTime * 1000;

          if (mappedTimeline.length > 0) {
            let activeItem = mappedTimeline.find(
              item => currentMs >= item.startMs - 25 && currentMs <= item.endMs + 40
            );
            if (!activeItem) {
              // Find the most recent started item before currentMs
              for (let i = mappedTimeline.length - 1; i >= 0; i--) {
                if (currentMs >= mappedTimeline[i].startMs - 25) {
                  activeItem = mappedTimeline[i];
                  break;
                }
              }
            }
            if (activeItem && activeItem.charIndex !== lastReportedCharIdx) {
              lastReportedCharIdx = activeItem.charIndex;
              onBoundary(activeItem.charIndex, activeItem.charLength);
            }
          } else if (audio.duration > 0) {
            const progress = audio.currentTime / audio.duration;
            const charIdx = Math.min(cleanText.length - 1, Math.floor(progress * cleanText.length));
            if (charIdx !== lastReportedCharIdx) {
              lastReportedCharIdx = charIdx;
              onBoundary(charIdx, 1);
            }
          }
        };

        const tickLoop = () => {
          if (currentAudioElement !== audio) return;
          updateBoundaryAtCurrentTime();
          if (!audio.paused && !audio.ended) {
            currentRafId = requestAnimationFrame(tickLoop);
          }
        };

        audio.onplay = () => {
          if (!started) {
            started = true;
            if (onStart) onStart();
          }
          if (onBoundary) {
            if (currentRafId !== null) cancelAnimationFrame(currentRafId);
            currentRafId = requestAnimationFrame(tickLoop);
          }
        };

        audio.ontimeupdate = updateBoundaryAtCurrentTime;

        const cleanupRaf = () => {
          if (currentRafId !== null) {
            cancelAnimationFrame(currentRafId);
            currentRafId = null;
          }
        };

        audio.onpause = cleanupRaf;

        audio.onended = () => {
          cleanupRaf();
          currentAudioElement = null;
          resolve();
        };

        audio.onerror = () => {
          cleanupRaf();
          currentAudioElement = null;
          fallbackToSpeechSynthesis().then(resolve);
        };

        audio.play().catch(() => {
          cleanupRaf();
          currentAudioElement = null;
          fallbackToSpeechSynthesis().then(resolve);
        });
      });
    }
  } catch {
    // If network fails or timed out, fallback to browser SpeechSynthesis
  }

  return fallbackToSpeechSynthesis();
};

export interface CuratedVoice {
  id: string;
  name: string;
  uri: string;
  gender: 'Nữ' | 'Nam' | string;
  description?: string;
}

/**
 * 2 giọng đọc chuẩn duy nhất được sử dụng trong toàn bộ ứng dụng:
 * 1. 晓晓 (Xiaoxiao) - Giọng Nữ Chuẩn
 * 2. 云希 (Yunxi) - Giọng Nam Chuẩn
 */
export const DEFAULT_CURATED_CHINESE_VOICES: CuratedVoice[] = [
  { 
    id: 'zh-CN-XiaoxiaoNeural', 
    name: '晓晓 Online (Natural) - Chinese (Mandarin, Simplified)', 
    uri: 'zh-CN-XiaoxiaoNeural', 
    gender: 'Nữ', 
    description: 'Giọng Nữ chuẩn Phổ thông (Xiaoxiao)' 
  },
  { 
    id: 'zh-CN-YunxiNeural', 
    name: '云希 Online (Natural) - Chinese (Mandarin, Simplified)', 
    uri: 'zh-CN-YunxiNeural', 
    gender: 'Nam', 
    description: 'Giọng Nam chuẩn Phổ thông (Yunxi)' 
  }
];

/**
 * Chỉ trả về đúng 2 giọng đọc chuẩn Xiaoxiao và Yunxi trong toàn bộ app
 */
export const getCuratedChineseVoices = (): CuratedVoice[] => {
  return [...DEFAULT_CURATED_CHINESE_VOICES];
};
