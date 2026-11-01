import { getMicrophoneStream } from "../microphone";
import { pinyin } from 'pinyin-pro';
import React, { useState, useEffect, useRef } from "react";
import { Token } from "../types";
import { speakMandarin } from "../utils/speech";
import { Volume2, Heart, X, Sparkles, Edit2, Save, Undo, Loader2, HelpCircle, Check, Mic, Square, Pause, Play, Layers, Video, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getHskLevel } from "../utils/hskLookup";
import YouglishModal from "./YouglishModal";
import GoogleImagesModal from "./GoogleImagesModal";
import { getPartOfSpeechTextColor, getHskTextColor } from "../utils/wordTypeColors";

interface WordPopupProps {
  token: Token | null;
  onClose: () => void;
  onToggleSave: (token: Token) => void;
  isSaved: boolean;
  onUpdateToken?: (updatedToken: Token) => void;
  onMarkKnown?: (token: Token) => void;
  isKnown?: boolean;
  onOpenRadicalBreakdown?: (word: string) => void;
}

export default function WordPopup({ token, onClose, onToggleSave, isSaved, onUpdateToken, onMarkKnown, isKnown, onOpenRadicalBreakdown }: WordPopupProps) {

  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showYouglish, setShowYouglish] = useState<boolean>(false);
  const [showGoogleImages, setShowGoogleImages] = useState<boolean>(false);
  const [imageSearchKeyword, setImageSearchKeyword] = useState<string>("");
  const [isSpeakingWord, setIsSpeakingWord] = useState<boolean>(false);
  const [isSpeakingExample, setIsSpeakingExample] = useState<boolean>(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<string | null>(null);
  const [pronunciationMispronounced, setPronunciationMispronounced] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await getMicrophoneStream();
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              setIsEvaluating(true);
              setPronunciationScore(null);
              setPronunciationFeedback(null);
              setPronunciationMispronounced([]);
              try {
                const res = await fetch("/api/evaluate-pronunciation", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audioBase64: base64data,
                    mimeType: mediaRecorder.mimeType,
                    text: token!.text
                  })
                });
                const data = await res.json();
                if (data.score !== undefined) {
                  setPronunciationScore(data.score);
                  setPronunciationFeedback(data.feedback);
                  setPronunciationMispronounced(data.mispronounced || []);
                }
              } catch (error) {
                console.warn("Evaluation warning:", error);
              } finally {
                setIsEvaluating(false);
              }
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
        setPronunciationScore(null);
        setRecordedAudioUrl(null);
        setIsPlayingRecord(false);
        setPronunciationFeedback(null);
        setPronunciationMispronounced([]);
      } catch (err) {
        console.error("Lỗi microphone:", err);
        alert("Không thể truy cập microphone. Vui lòng cấp quyền.");
      }
    }
  };


  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore click if it's on a word token to prevent conflict with click handler
      if ((event.target as Element).closest?.(".word-token-element")) {
        return;
      }
      
      // Check if clicking inside popup
      if (popupRef.current && popupRef.current.contains(event.target as Node)) {
        return;
      }
      
      // Clicked outside and not on a word token
      onClose();
    };
    
    if (token) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [token, onClose]);

  // Tự động phát âm khi nhấp vào từ vựng hoặc mở bảng tra từ
  useEffect(() => {
    if (token?.text && (token.type === "word" || /[\u4e00-\u9fa5]/.test(token.text))) {
      speakMandarin(token.text, speechRate);
    }
  }, [token?.text]);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editPinyin, setEditPinyin] = useState<string>("");
  const [editTranslation, setEditTranslation] = useState<string>("");
  const [editPartOfSpeech, setEditPartOfSpeech] = useState<string>("");

  // AI Lookup state
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
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
        console.error("Word popup audio init error:", err);
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
  // Initialize edit fields when token shifts
  useEffect(() => {
    if (token) {
      setEditPinyin(token.pinyin || "");
      setEditTranslation(token.translation || "");
      setEditPartOfSpeech(token.partOfSpeech || "Từ vựng");
      setIsEditing(false);
      setLookupError(null);
    }
  }, [token]);

  if (!token || token.type !== "word") return null;

  const handleSpeakWord = async (rate: number) => {
    setSpeechRate(rate);
    setIsSpeakingWord(true);
    await speakMandarin(token.text, rate);
    setIsSpeakingWord(false);
  };

  const handleSpeakExample = async () => {
    if (!token.example?.chinese) return;
    setIsSpeakingExample(true);
    await speakMandarin(token.example.chinese, 0.95);
    setIsSpeakingExample(false);
  };

  // Tra cứu tự động bằng AI / Từ điển
  const handleAiLookup = async () => {
    setIsAiLoading(true);
    setLookupError(null);
    try {
      const response = await fetch("/api/lookup-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: token.text }),
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối máy chủ tra cứu.");
      }

      const data = await response.json();
      if (data.isOfflineFallback) {
         setLookupError("Bạn chưa cấu hình GEMINI_API_KEY. Trả về kết quả từ điển rút gọn.");
      }
      if (data && data.pinyin && data.translation) {
        // Cập nhật lại form
        setEditPinyin(data.pinyin);
        setEditTranslation(data.translation);
        setEditPartOfSpeech(data.partOfSpeech || "Từ vựng");

        // Báo cho cha biết
        if (onUpdateToken) {
          onUpdateToken(data);
        }
      } else {
        throw new Error("Đữ liệu giải nghĩa không đúng định dạng.");
      }
    } catch (err: any) {
      console.warn("Lỗi tra cứu từ vựng:", err?.message || err);
      setLookupError(err.message || "Không thể tải nghĩa tự động. Vui lòng thử lại hoặc tự định nghĩa.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Lưu chỉnh sửa thủ công
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPinyin.trim() || !editTranslation.trim()) return;

    const updatedToken: Token = {
      ...token,
      pinyin: editPinyin.trim(),
      translation: editTranslation.trim(),
      partOfSpeech: editPartOfSpeech.trim() || undefined
    };

    if (onUpdateToken) {
      onUpdateToken(updatedToken);
    }
    setIsEditing(false);
  };

  const isMissingData = !token.pinyin || token.pinyin === "?" || !token.translation || token.translation.includes("chưa rõ nghĩa") || token.translation.includes("bổ sung nghĩa");

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-[60] mx-auto max-w-sm px-4 pb-6 pt-2"
        id="word-popup-wrapper"
      >
        <div 
          className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md overflow-y-auto w-fit mx-auto min-w-0"
          id={`word-popup-${token.text}`}
        >
          {/* Action buttons list in top absolute banner removed */}

          {/* Form edit mode */}
          {isEditing ? (
            <form onSubmit={handleSaveEdits} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-base">
                  <Edit2 className="w-4 h-4 text-amber-500" />
                  <span>Cập nhật cho từ "{token.text}"</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Huỷ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Phiên âm Pinyin</label>
                  <input
                    type="text"
                    value={editPinyin}
                    onChange={(e) => setEditPinyin(e.target.value)}
                    placeholder="ví dụ: nǐ hǎo"
                    className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-850 dark:border-slate-800 text-sm font-mono text-amber-600 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Từ loại</label>
                  <input
                    type="text"
                    value={editPartOfSpeech}
                    onChange={(e) => setEditPartOfSpeech(e.target.value)}
                    placeholder="Danh từ, Động từ..."
                    className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-850 dark:border-slate-800 text-sm focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Nghĩa tiếng Việt</label>
                <input
                  type="text"
                  value={editTranslation}
                  onChange={(e) => setEditTranslation(e.target.value)}
                  placeholder="ví dụ: xin chào"
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-850 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-505 to-amber-600 text-white font-semibold text-sm rounded-xl flex items-center gap-1 hover:brightness-105 transition shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 flex flex-col items-center space-y-2">
              {/* Vietnamese meaning in card - Clickable to search images directly */}
              <button
                type="button"
                onClick={() => {
                  setImageSearchKeyword(token.translation || token.text);
                  setShowGoogleImages(true);
                }}
                className="w-full text-center px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-amber-50/70 dark:bg-slate-900/60 dark:hover:bg-amber-950/30 border border-slate-200/80 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-700/60 transition cursor-pointer active:scale-98 group flex flex-col items-center justify-center gap-0.5"
                title={`Ấn vào nghĩa "${token.translation}" để tự động tìm kiếm hình ảnh`}
              >
                <div className="flex items-center gap-1.5 justify-center flex-wrap">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300 leading-snug break-words transition">
                    {token.translation || "(Chưa có nghĩa)"}
                  </p>
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition shrink-0" />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-medium transition">
                  (Ấn vào nghĩa để tìm ảnh)
                </span>
              </button>

              {/* Tags: Part of speech and HSK Level without background */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                {token.partOfSpeech && (
                  <span className={`text-xs font-semibold ${getPartOfSpeechTextColor(token.partOfSpeech)}`}>
                    {token.partOfSpeech}
                  </span>
                )}
                {token.partOfSpeech && (token.hskLevel || getHskLevel(token.text)) && (
                  <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                )}
                {(token.hskLevel || getHskLevel(token.text)) && (
                  <span className={`text-xs font-semibold ${getHskTextColor(token.hskLevel || getHskLevel(token.text))}`}>
                    {token.hskLevel || getHskLevel(token.text)}
                  </span>
                )}
                {isMissingData && !token.partOfSpeech && (
                  <span className="text-xs font-normal text-red-500 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Chưa đầy đủ nghĩa
                  </span>
                )}
              </div>

              {/* Actions: Pronunciation and Save with accurate color scheme */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-3 w-full border-t border-slate-100 dark:border-slate-800 pt-3">
                {/* 1. Loa: Màu xanh dương */}
                <button
                  onClick={() => handleSpeakWord(1.0)}
                  className="flex items-center justify-center p-3 bg-white hover:bg-blue-50 text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-full shadow-md active:scale-95 transition"
                  title="Nghe phát âm (Loa xanh dương)"
                  id="btn-pronounce-normal"
                >
                  <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </button>

                {/* 2. Voice: Màu nâu */}
                <button
                  onClick={handleToggleRecord}
                  className={`flex items-center justify-center p-3 rounded-full shadow-md active:scale-95 transition ${
                    isRecording 
                      ? "bg-[#78350f] hover:bg-[#5c280b] text-white animate-pulse" 
                      : "bg-white hover:bg-amber-50/80 text-[#78350f] dark:bg-slate-800 dark:text-amber-500 border border-[#b45309]/30 dark:border-amber-900"
                  }`}
                  title={isRecording ? "Dừng ghi âm" : "Luyện đọc (Voice màu nâu)"}
                >
                  {isRecording ? <Square className="w-5 h-5" fill="currentColor" /> : <Mic className="w-5 h-5 text-[#78350f] dark:text-amber-500" />}
                </button>

                {/* 3. Lưu: Màu hồng */}
                <button
                  onClick={() => onToggleSave(token)}
                  className={`flex items-center justify-center p-3 rounded-full shadow-md active:scale-95 transition ${
                    isSaved 
                      ? "bg-pink-500 hover:bg-pink-600 text-white" 
                      : "bg-white hover:bg-pink-50 text-pink-500 dark:bg-slate-800 dark:text-pink-400 border border-pink-200 dark:border-pink-900"
                  }`}
                  title={isSaved ? "Bỏ lưu" : "Lưu vào từ điển (Màu hồng)"}
                  id="btn-toggle-save-word"
                >
                  <Heart className={`w-5 h-5 ${isSaved ? "fill-white text-white" : "text-pink-500 dark:text-pink-400"}`} />
                </button>

                {onMarkKnown && isSaved && !isKnown && (
                  <button
                    onClick={() => onMarkKnown(token)}
                    className="flex items-center justify-center p-3 rounded-full shadow-md active:scale-95 transition bg-white hover:bg-emerald-50 text-emerald-500 border border-emerald-100"
                    title="Đánh dấu đã biết"
                    id="btn-mark-known-word"
                  >
                    <Check className="w-5 h-5" strokeWidth={2} />
                  </button>
                )}

                {/* 4. Chia các bộ thủ: Màu đỏ */}
                {onOpenRadicalBreakdown && (
                  <button
                    onClick={() => onOpenRadicalBreakdown(token.text)}
                    className="flex items-center justify-center p-3 rounded-full shadow-md active:scale-95 transition bg-white hover:bg-red-50 text-red-600 dark:bg-slate-800 dark:text-red-400 border border-red-200 dark:border-red-900"
                    title="Chia các bộ thủ (Màu đỏ)"
                    id="btn-popup-radical-breakdown"
                  >
                    <Layers className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                )}

                {/* 5. Video: Màu tím */}
                <button
                  onClick={() => setShowYouglish(true)}
                  className="flex items-center justify-center p-3 rounded-full shadow-md active:scale-95 transition bg-white hover:bg-purple-50 text-purple-600 dark:bg-slate-800 dark:text-purple-400 border border-purple-200 dark:border-purple-900"
                  title="Xem video ngữ cảnh YouGlish (Màu tím)"
                  id="btn-popup-youglish"
                >
                  <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </button>

                {/* 6. Ảnh: Màu vàng */}
                <button
                  onClick={() => {
                    setImageSearchKeyword("");
                    setShowGoogleImages(true);
                  }}
                  className="flex items-center justify-center p-3 rounded-full shadow-md active:scale-95 transition bg-white hover:bg-amber-50 text-amber-500 dark:bg-slate-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                  title="Xem hình ảnh trực tiếp trong app (Màu vàng)"
                  id="btn-popup-google-images"
                >
                  <ImageIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </button>
              </div>
              
              {/* Pronunciation Feedback */}
              {isEvaluating && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  Đang đánh giá phát âm...
                </div>
              )}
              {pronunciationScore !== null && (                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm w-full max-w-[280px]">                  <div className="p-3 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col items-center justify-center">                    <div className="flex items-center gap-3 relative">
                      <div className={`px-4 py-1.5 rounded-full text-lg font-bold ${pronunciationScore >= 80 ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : pronunciationScore >= 50 ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {Math.round(pronunciationScore)}<span className="text-sm font-semibold opacity-60">/100</span>
                      </div>
                      {recordedAudioUrl && (
                        <button 
                          onClick={togglePlayRecord}
                          onMouseUp={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50"
                          title="Nghe lại bản ghi âm"
                        >
                          {isPlayingRecord ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}
                    </div>                    {pronunciationFeedback && (                      <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-2 text-center font-medium leading-relaxed px-1">                        {pronunciationFeedback}                      </p>                    )}                  </div>                  <div className="p-3 bg-white dark:bg-slate-800">                    {token?.text && (                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-2">                        {(() => {                          const pinyinArr = pinyin(token.text, { type: 'array' });                          return token.text.split('').map((char, i) => {                            const isPunctuation = /[.,!?;:\s\n\r\t，。！？、：；（）《》“”‘’]/.test(char);                            const isMispronounced = pronunciationMispronounced.some((w) => w.includes(char) || char.includes(w));                            return (                              <div key={i} className="flex flex-col items-center">                                {!isPunctuation && <span className="text-[11px] text-blue-600 dark:text-blue-400 mb-0.5 font-medium">{pinyinArr[i]}</span>}                                <span className={`text-lg ${isPunctuation ? 'text-slate-300 dark:text-slate-600' : isMispronounced ? 'text-red-500 font-bold' : 'text-emerald-500 font-medium'}`}>{char}</span>                              </div>                            );                          });                        })()}                      </div>                    )}                  </div>                </div>              )}


              {lookupError && (
                <div className="text-[11px] text-red-500 text-center font-medium max-w-[220px]">
                  {lookupError}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* YouGlish Video Modal */}
      {token && (
        <YouglishModal
          isOpen={showYouglish}
          onClose={() => setShowYouglish(false)}
          initialWord={token.text}
          pinyin={token.pinyin}
          translation={token.translation}
        />
      )}

      {/* Google Images Modal */}
      {token && (
        <GoogleImagesModal
          isOpen={showGoogleImages}
          onClose={() => {
            setShowGoogleImages(false);
            setImageSearchKeyword("");
          }}
          initialWord={token.text}
          pinyin={token.pinyin}
          translation={token.translation}
          initialQuery={imageSearchKeyword || token.text}
        />
      )}
    </AnimatePresence>
  );
}
