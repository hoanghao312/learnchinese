import React, { useState, useEffect } from "react";
import { X, ExternalLink, Image as ImageIcon, Search, RefreshCw, Volume2, ZoomIn, Download, ArrowLeft, ArrowRight } from "lucide-react";
import { speakMandarin } from "../utils/speech";

interface ImageResult {
  id: string;
  thumbnail: string;
  image: string;
  title: string;
  source: string;
  sourceType?: "google" | "baidu";
  url: string;
  width?: number;
  height?: number;
}

interface GoogleImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord: string;
  pinyin?: string;
  translation?: string;
  initialQuery?: string;
  initialSource?: "google" | "baidu";
}

export default function GoogleImagesModal({
  isOpen,
  onClose,
  initialWord,
  pinyin,
  translation,
  initialQuery,
  initialSource = "google",
}: GoogleImagesModalProps) {
  const startQuery = (initialQuery || initialWord || "").trim();
  const [query, setQuery] = useState(startQuery);
  const [searchInput, setSearchInput] = useState(startQuery);
  const [currentSource, setCurrentSource] = useState<"google" | "baidu">(initialSource);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Sync initial word / initial query (always default to Google Images on open)
  useEffect(() => {
    if (!isOpen) return;
    const clean = (initialQuery || initialWord || "").trim();
    const sourceToUse = initialSource || "google";
    setCurrentSource(sourceToUse);
    if (clean) {
      setQuery(clean);
      setSearchInput(clean);
      fetchImages(clean, sourceToUse);
    }
  }, [isOpen, initialWord, initialQuery, initialSource]);

  const fetchImages = async (searchWord: string, source: "google" | "baidu" = currentSource) => {
    setIsLoading(true);
    setSelectedImageIndex(null);

    try {
      const meaningParam = translation ? `&meaning=${encodeURIComponent(translation)}` : "";
      const resp = await fetch(`/api/images?query=${encodeURIComponent(searchWord)}&source=${source}${meaningParam}`);
      if (!resp.ok) {
        throw new Error("Không thể tải hình ảnh.");
      }
      const data = await resp.json();
      if (data && Array.isArray(data.results)) {
        setImages(data.results);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.warn("[Fetch Images Error]:", err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (clean && clean !== query) {
      setQuery(clean);
      fetchImages(clean, currentSource);
    }
  };

  const handleSearchKeyword = (keyword: string) => {
    const clean = (keyword || "").trim();
    if (!clean) return;
    setQuery(clean);
    setSearchInput(clean);
    fetchImages(clean, currentSource);
  };

  const handleSwitchSource = (newSource: "google" | "baidu") => {
    setCurrentSource(newSource);
    fetchImages(query, newSource);
  };

  if (!isOpen) return null;

  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  return (
    <div
      className="fixed inset-0 z-[100020] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Google Images Branding */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-sky-50/70 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Google-colored Image Icon */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4285F4] via-[#EA4335] to-[#FBBC05] text-white flex items-center justify-center shadow-xs shrink-0">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  Hình ảnh:
                  {/* Clickable Chinese word */}
                  <button
                    type="button"
                    onClick={() => handleSearchKeyword(initialWord)}
                    className={`font-extrabold transition-all cursor-pointer px-1.5 py-0.5 rounded-lg active:scale-95 ${
                      query === initialWord
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 underline decoration-2 underline-offset-4"
                        : "text-slate-800 dark:text-slate-200 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={`Click để tìm ảnh theo chữ tiếng Trung: "${initialWord}"`}
                  >
                    {initialWord}
                  </button>
                </h3>
                {pinyin && (
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                    [{pinyin}]
                  </span>
                )}
                {/* Clickable Vietnamese translation */}
                {translation && (
                  <button
                    type="button"
                    onClick={() => handleSearchKeyword(translation)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border transition-all cursor-pointer active:scale-95 group ${
                      query.toLowerCase() === translation.toLowerCase()
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold"
                        : "bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 border-slate-200 dark:border-slate-700"
                    }`}
                    title={`Click vào đây để tự động tìm kiếm ảnh theo nghĩa tiếng Việt: "${translation}"`}
                  >
                    <span>• {translation}</span>
                    <Search className={`w-2.5 h-2.5 transition-transform group-hover:scale-110 ${query.toLowerCase() === translation.toLowerCase() ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {images.length > 0
                  ? `Tìm thấy ${images.length} hình ảnh minh họa cho "${query}"`
                  : `Nguồn hình ảnh trực quan từ Google Images cho "${query}"`}
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
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
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
              placeholder="Tìm kiếm hình ảnh khác (Ví dụ: 苹果, Cái gì, 化妆室)..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            Tìm ảnh
          </button>
        </form>

        {/* Quick Search Chips: Tiếng Trung & Nghĩa tiếng Việt */}
        <div className="px-5 py-1.5 bg-slate-100/60 dark:bg-slate-850/80 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Search className="w-3 h-3 text-emerald-500" />
            Tìm nhanh:
          </span>

          {/* Button: Tiếng Trung */}
          <button
            type="button"
            onClick={() => handleSearchKeyword(initialWord)}
            className={`px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs ${
              query === initialWord
                ? "bg-emerald-600 text-white font-bold"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 dark:border-slate-700"
            }`}
            title={`Tìm ảnh chữ tiếng Trung: "${initialWord}"`}
          >
            <span>Tiếng Trung:</span>
            <span className="font-extrabold">{initialWord}</span>
          </button>

          {/* Button: Nghĩa tiếng Việt */}
          {translation && (
            <button
              type="button"
              onClick={() => handleSearchKeyword(translation)}
              className={`px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs ${
                query.toLowerCase() === translation.toLowerCase()
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 dark:border-slate-700"
              }`}
              title={`Nhấn để tự động tìm kiếm ảnh theo nghĩa tiếng Việt: "${translation}"`}
            >
              <span>Nghĩa tiếng Việt:</span>
              <span className="font-bold underline decoration-dotted decoration-emerald-400">{translation}</span>
            </button>
          )}

          {/* Split sub-meanings if comma/semicolon separated */}
          {translation && (translation.includes(",") || translation.includes(";")) && (
            translation.split(/[,;]/).map((item, idx) => {
              const cleanItem = item.trim();
              if (!cleanItem || cleanItem.toLowerCase() === translation.toLowerCase()) return null;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSearchKeyword(cleanItem)}
                  className={`px-2 py-0.5 rounded-lg text-xs transition-all cursor-pointer active:scale-95 ${
                    query.toLowerCase() === cleanItem.toLowerCase()
                      ? "bg-emerald-600 text-white font-bold shadow-2xs"
                      : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/60 dark:border-slate-700"
                  }`}
                  title={`Tìm kiếm ảnh cho "${cleanItem}"`}
                >
                  {cleanItem}
                </button>
              );
            })
          )}
        </div>

        {/* 2 Nguồn ảnh: Google Images (mặc định) & Baidu */}
        <div className="px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Nguồn ảnh:
            </span>

            {/* 1. Mặc định: Google Images */}
            <button
              type="button"
              onClick={() => handleSwitchSource("google")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                currentSource === "google"
                  ? "bg-[#4285F4] text-white shadow-xs"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#EA4335] inline-block"></span>
              <span>Google Images</span>
              {currentSource === "google" && !isLoading && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-700 text-white font-extrabold">
                  {images.length}
                </span>
              )}
            </button>

            {/* 2. Baidu */}
            <button
              type="button"
              onClick={() => handleSwitchSource("baidu")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                currentSource === "baidu"
                  ? "bg-[#2932e1] text-white shadow-xs"
                  : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200/60 dark:border-red-800/50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#e12929] inline-block"></span>
              <span>Baidu (百度图片)</span>
              {currentSource === "baidu" && !isLoading && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-900 text-white font-extrabold">
                  {images.length}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
            Hiện ảnh trực tiếp trong app
          </span>
        </div>

        {/* Main Image Gallery Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Đang tìm hình ảnh cho "{query}" từ {currentSource === "google" ? "Google Images" : "Baidu Images"}...
              </p>
              <p className="text-xs text-slate-400 mt-1">Đang tải các hình ảnh sắc nét minh họa từ vựng trong ứng dụng</p>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* Nguồn ảnh Badge */}
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    {img.sourceType === "baidu" || img.source?.toLowerCase().includes("baidu") ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#2932e1]/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                        Baidu 百度
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EA4335]/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                        Google
                      </span>
                    )}
                  </div>

                  <img
                    src={img.thumbnail}
                    alt={img.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (img.image && target.src !== img.image) {
                        target.src = img.image;
                      } else {
                        target.style.display = "none";
                      }
                    }}
                  />
                  {/* Subtle hover overlay with title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                    <p className="text-[11px] text-white font-medium line-clamp-2 leading-tight">
                      {img.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-200 mt-1">
                      <span className="truncate max-w-[80%]">{img.source}</span>
                      <ZoomIn className="w-3.5 h-3.5 shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Không tìm thấy ảnh xem nhanh cho "{query}"
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                Bạn có thể mở trực tiếp toàn bộ kết quả trên Google Images để xem hàng ngàn ảnh minh họa phong phú.
              </p>
              <button
                type="button"
                onClick={() => fetchImages(query)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tải lại ảnh trong ứng dụng
              </button>
            </div>
          )}
        </div>

        {/* Footer info & in-app action */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {images.length > 0 ? `Hiển thị ${images.length} hình ảnh trực tiếp trong ứng dụng` : ""}
          </span>
          <button
            type="button"
            onClick={() => fetchImages(query)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Tải thêm hình ảnh trong app</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for enlarged view */}
      {selectedImage && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-[85] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* Close Lightbox */}
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Đóng xem lớn"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Prev/Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition active:scale-95 cursor-pointer"
                title="Ảnh trước"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition active:scale-95 cursor-pointer"
                title="Ảnh tiếp theo"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Enlarged Image */}
          <div
            className="relative max-w-4xl max-h-[78vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.image || selectedImage.thumbnail}
              alt={selectedImage.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl"
            />
            {/* Title & Actions Bar */}
            <div className="w-full mt-3 flex items-center justify-between gap-3 text-white text-xs px-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{selectedImage.title}</p>
                <p className="text-slate-300 text-[11px] truncate">Nguồn: {selectedImage.source || "Web"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedImage.url && (
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Xem trang gốc</span>
                  </a>
                )}
                <a
                  href={selectedImage.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ảnh gốc</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
