const fs = require('fs');
const content = fs.readFileSync('src/utils/speech.ts', 'utf-8');

const searchStr = `export const speakMandarin = (text: string, rate: number = 1.0, onBoundary?: (charIndex: number, charLength: number) => void, voiceURI?: string, onStart?: () => void): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech to prevent overlap or freezing
    window.speechSynthesis.cancel();

    if (synthTimeout) {
      clearTimeout(synthTimeout);
    }
    if (currentResumeInterval) {
      clearInterval(currentResumeInterval);
    }
    isManuallyPaused = false;

    // A web speech bug in Chrome can sometimes keep the synthesis in standard paused state
    // We force resume to unblock potential frozen state
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate;

    // Filter and find the best Chinese pronunciation voice
    const voices = window.speechSynthesis.getVoices();
    let zhVoice: SpeechSynthesisVoice | undefined;
    
    if (voiceURI || globalVoiceURI) {
      zhVoice = voices.find(v => v.voiceURI === (voiceURI || globalVoiceURI));
    }
    
    if (!zhVoice) {
      const zhVoices = voices.filter(v => v.lang.startsWith("zh-"));
      zhVoice = zhVoices.length > 2 ? zhVoices[2] : zhVoices[0];
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

    utterance.onend = () => {
      finish();
    };

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onerror = () => {
      finish();
    };

    utterance.onboundary = (event) => {
      if (onBoundary) {
        onBoundary(event.charIndex, event.charLength);
      }
    };

    // Calculate a reasonable timeout based on string length (assume roughly 3 chars per second on average, giving plenty of buffer)
    const dynamicTimeout = Math.max(10000, text.length * 500 / rate);

    // Safety timeout fallback
    synthTimeout = setTimeout(() => {
      if (!isFinished && !isManuallyPaused) {
        console.warn("SpeechSynthesis timed out for text:", text);
        window.speechSynthesis.cancel();
        finish();
      }
    }, dynamicTimeout);

    // Fix Chrome's 15-second cutoff bug by periodically pausing and resuming
    currentResumeInterval = setInterval(() => {
      if (!isFinished && window.speechSynthesis.speaking && !isManuallyPaused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else if (isFinished) {
        clearInterval(currentResumeInterval);
      }
    }, 12000);

    window.speechSynthesis.speak(utterance);
  });
};`;

const replaceStr = `export const speakMandarin = (text: string, rate: number = 1.0, onBoundary?: (charIndex: number, charLength: number) => void, voiceURI?: string, onStart?: () => void, queue: boolean = false): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    if (!queue) {
      // Cancel any ongoing speech to prevent overlap or freezing
      window.speechSynthesis.cancel();

      if (synthTimeout) {
        clearTimeout(synthTimeout);
      }
      if (currentResumeInterval) {
        clearInterval(currentResumeInterval);
      }
    }
    isManuallyPaused = false;

    // A web speech bug in Chrome can sometimes keep the synthesis in standard paused state
    // We force resume to unblock potential frozen state
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate;

    // Filter and find the best Chinese pronunciation voice
    const voices = window.speechSynthesis.getVoices();
    let zhVoice: SpeechSynthesisVoice | undefined;
    
    if (voiceURI || globalVoiceURI) {
      zhVoice = voices.find(v => v.voiceURI === (voiceURI || globalVoiceURI));
    }
    
    if (!zhVoice) {
      const zhVoices = voices.filter(v => v.lang.startsWith("zh-"));
      zhVoice = zhVoices.length > 2 ? zhVoices[2] : zhVoices[0];
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

    utterance.onend = () => {
      finish();
    };

    utterance.onstart = () => {
      if (onStart) onStart();
      
      // Setup timeout handlers only when speech actually starts
      if (synthTimeout) clearTimeout(synthTimeout);
      if (currentResumeInterval) clearInterval(currentResumeInterval);
      
      const dynamicTimeout = Math.max(10000, text.length * 500 / rate);
      synthTimeout = setTimeout(() => {
        if (!isFinished && !isManuallyPaused) {
          console.warn("SpeechSynthesis timed out for text:", text);
          window.speechSynthesis.cancel();
          finish();
        }
      }, dynamicTimeout);

      currentResumeInterval = setInterval(() => {
        if (!isFinished && window.speechSynthesis.speaking && !isManuallyPaused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else if (isFinished) {
          clearInterval(currentResumeInterval);
        }
      }, 12000);
    };

    utterance.onerror = () => {
      finish();
    };

    utterance.onboundary = (event) => {
      if (onBoundary) {
        onBoundary(event.charIndex, event.charLength);
      }
    };

    window.speechSynthesis.speak(utterance);
  });
};`;

if (content.includes(searchStr)) {
  fs.writeFileSync('src/utils/speech.ts', content.replace(searchStr, replaceStr));
  console.log("Successfully updated speech.ts");
} else {
  console.log("Could not find speech block in speech.ts");
}
