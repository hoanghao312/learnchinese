import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';

export type WordTypeKey =
  | 'pho_tu'     // Phó từ, trạng từ (Adv) -> Purple
  | 'tinh_tu'    // Tính từ (Adj) -> Amber
  | 'dong_tu'    // Động từ (Verb) -> Emerald
  | 'danh_tu'    // Danh từ (Noun) -> Sky
  | 'dai_tu'     // Đại từ (Pron) -> Rose
  | 'tan_ngu'    // Tân ngữ (Object) -> Indigo
  | 'chu_ngu'    // Chủ ngữ (Subject) -> Blue
  | 'gioi_tu'    // Giới từ (Prep) -> Teal
  | 'lien_tu'    // Liên từ (Conj) -> Cyan
  | 'luong_tu'   // Lượng từ / Số từ (Measure/Num) -> Fuchsia
  | 'tro_tu'     // Trợ từ (Particle) -> Lime
  | 'bo_ngu'     // Bổ ngữ (Complement) -> Orange
  | 'dinh_tu'    // Định ngữ (Attributive) -> Violet
  | 'trang_ngu'  // Trạng ngữ (Adverbial) -> Purple
  | 'than_tu'    // Thán từ (Interj) -> Yellow
  | 'other';     // Khác -> Slate

export interface WordTypeStyle {
  name: string;
  badge: string;
  text: string;
  bg: string;
  border: string;
  chip: string;
  dot: string;
}

export const WORD_TYPE_STYLES: Record<WordTypeKey, WordTypeStyle> = {
  pho_tu: {
    name: 'Phó từ',
    badge: 'bg-purple-100/90 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80',
    text: 'text-purple-600 dark:text-purple-400 font-semibold',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    chip: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  tinh_tu: {
    name: 'Tính từ',
    badge: 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80',
    text: 'text-amber-600 dark:text-amber-400 font-semibold',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  dong_tu: {
    name: 'Động từ',
    badge: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80',
    text: 'text-emerald-600 dark:text-emerald-400 font-semibold',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  danh_tu: {
    name: 'Danh từ',
    badge: 'bg-sky-100/90 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80',
    text: 'text-sky-600 dark:text-sky-400 font-semibold',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  dai_tu: {
    name: 'Đại từ',
    badge: 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80',
    text: 'text-rose-600 dark:text-rose-400 font-semibold',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  tan_ngu: {
    name: 'Tân ngữ',
    badge: 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80',
    text: 'text-indigo-600 dark:text-indigo-400 font-semibold',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  chu_ngu: {
    name: 'Chủ ngữ',
    badge: 'bg-blue-100/90 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80',
    text: 'text-blue-600 dark:text-blue-400 font-semibold',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  gioi_tu: {
    name: 'Giới từ',
    badge: 'bg-teal-100/90 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/80',
    text: 'text-teal-600 dark:text-teal-400 font-semibold',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    chip: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-800',
    dot: 'bg-teal-500',
  },
  lien_tu: {
    name: 'Liên từ',
    badge: 'bg-cyan-100/90 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/80',
    text: 'text-cyan-600 dark:text-cyan-400 font-semibold',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800',
    chip: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800',
    dot: 'bg-cyan-500',
  },
  luong_tu: {
    name: 'Lượng từ / Số từ',
    badge: 'bg-fuchsia-100/90 text-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-300 border-fuchsia-200/80 dark:border-fuchsia-800/80',
    text: 'text-fuchsia-600 dark:text-fuchsia-400 font-semibold',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    chip: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border-fuchsia-200/80 dark:border-fuchsia-800',
    dot: 'bg-fuchsia-500',
  },
  tro_tu: {
    name: 'Trợ từ',
    badge: 'bg-lime-100/90 text-lime-800 dark:bg-lime-950/70 dark:text-lime-300 border-lime-200/80 dark:border-lime-800/80',
    text: 'text-lime-600 dark:text-lime-400 font-semibold',
    bg: 'bg-lime-50 dark:bg-lime-950/40',
    border: 'border-lime-200 dark:border-lime-800',
    chip: 'bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border-lime-200/80 dark:border-lime-800',
    dot: 'bg-lime-500',
  },
  bo_ngu: {
    name: 'Bổ ngữ',
    badge: 'bg-orange-100/90 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/80',
    text: 'text-orange-600 dark:text-orange-400 font-semibold',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    chip: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200/80 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  dinh_tu: {
    name: 'Định ngữ',
    badge: 'bg-violet-100/90 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/80',
    text: 'text-violet-600 dark:text-violet-400 font-semibold',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/80 dark:border-violet-800',
    dot: 'bg-violet-500',
  },
  trang_ngu: {
    name: 'Trạng ngữ',
    badge: 'bg-purple-100/90 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80',
    text: 'text-purple-600 dark:text-purple-400 font-semibold',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    chip: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  than_tu: {
    name: 'Thán từ',
    badge: 'bg-yellow-100/90 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-300 border-yellow-200/80 dark:border-yellow-800/80',
    text: 'text-yellow-600 dark:text-yellow-400 font-semibold',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    border: 'border-yellow-200 dark:border-yellow-800',
    chip: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200/80 dark:border-yellow-800',
    dot: 'bg-yellow-500',
  },
  other: {
    name: 'Khác',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400 font-semibold',
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-200 dark:border-slate-700',
    chip: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  }
};

export function classifyWordType(desc: string): WordTypeKey {
  if (!desc) return 'other';
  const s = desc.toLowerCase().trim();

  // Match specific compound types first
  if (s.includes('phó từ') || s.includes('trạng từ') || s.includes('adverb') || s === 'adv' || s.startsWith('adv')) {
    return 'pho_tu';
  }
  if (s.includes('tính từ') || s.includes('hình dung từ') || s.includes('adjective') || s === 'adj' || s.startsWith('adj')) {
    return 'tinh_tu';
  }
  if (s.includes('động từ') || s.includes('verb') || s === 'v' || s.includes('năng nguyện') || s.includes('li hợp')) {
    return 'dong_tu';
  }
  if (s.includes('đại từ') || s.includes('pronoun') || s === 'pron' || s.includes('nhân xưng') || s.includes('chỉ thị') || s.includes('nghi vấn')) {
    return 'dai_tu';
  }
  if (s.includes('tân ngữ') || s.includes('object') || s === 'o' || s.startsWith('o)')) {
    return 'tan_ngu';
  }
  if (s.includes('chủ ngữ') || s.includes('subject') || s === 's') {
    return 'chu_ngu';
  }
  if (s.includes('danh từ') || s.includes('noun') || s === 'n' || s.includes('nơi chốn') || s.includes('thời gian')) {
    return 'danh_tu';
  }
  if (s.includes('giới từ') || s.includes('preposition') || s === 'prep') {
    return 'gioi_tu';
  }
  if (s.includes('liên từ') || s.includes('conjunction') || s === 'conj') {
    return 'lien_tu';
  }
  if (s.includes('lượng từ') || s.includes('số từ') || s.includes('classifier') || s.includes('measure') || s === 'num' || s === 'clf') {
    return 'luong_tu';
  }
  if (s.includes('trợ từ') || s.includes('particle') || s === 'part' || s.includes('ngữ khí') || s.includes('kết cấu')) {
    return 'tro_tu';
  }
  if (s.includes('bổ ngữ') || s.includes('complement') || s === 'c') {
    return 'bo_ngu';
  }
  if (s.includes('định ngữ') || s.includes('attributive') || s === 'attr') {
    return 'dinh_tu';
  }
  if (s.includes('trạng ngữ') || s.includes('adverbial') || s === 'advl') {
    return 'trang_ngu';
  }
  if (s.includes('thán từ') || s.includes('interjection') || s === 'interj') {
    return 'than_tu';
  }
  return 'other';
}

interface GrammarWordItem {
  word: string;
  type: string;
  typeKey: WordTypeKey;
}

export function parseGrammarText(content: string) {
  if (!content) return null;

  const rawLines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  let title = '';
  let splitLine = '';
  const wordItems: GrammarWordItem[] = [];
  let intro = '';
  let structureLine = '';
  const translations: string[] = [];
  const otherLines: string[] = [];

  let inStructureSection = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Markdown title: **text**
    if (i === 0 && line.startsWith('**') && line.endsWith('**')) {
      title = line.replace(/^\*\*|\*\*$/g, '').trim();
      continue;
    }

    // Split line with + signs, e.g. "很 + 高兴 + 认识 + 你"
    if (!splitLine && line.includes('+') && !line.includes('Cấu trúc') && !line.toLowerCase().includes('công thức')) {
      // Check if it's mostly Chinese/words joined by +
      splitLine = line;
      continue;
    }

    // Bullet lines: "- word = type" or "• word = type" or "word = type"
    const cleanBullet = line.replace(/^[-*•]\s*/, '').trim();
    if (cleanBullet.includes('=')) {
      const parts = cleanBullet.split('=');
      if (parts.length >= 2) {
        const word = parts[0].trim();
        const typeDesc = parts.slice(1).join('=').trim();
        const typeKey = classifyWordType(typeDesc);
        wordItems.push({
          word,
          type: typeDesc,
          typeKey
        });
        continue;
      }
    }

    // Header for explanations: e.g. "Có thể hiểu:"
    if (line.toLowerCase().includes('có thể hiểu') || line.toLowerCase().includes('giải thích')) {
      intro = line;
      continue;
    }

    // Structure header: e.g. "📌 Cấu trúc:"
    if (line.includes('Cấu trúc') || line.includes('📌')) {
      inStructureSection = true;
      continue;
    }

    // Structure formula line right after structure header
    if (inStructureSection && !line.startsWith('>')) {
      if (!structureLine) {
        structureLine = line;
      } else {
        structureLine += ' ' + line;
      }
      continue;
    }

    // Translation lines starting with >
    if (line.startsWith('>')) {
      translations.push(line.replace(/^>\s*/, '').trim());
      continue;
    }

    otherLines.push(line);
  }

  // Tokenize the split line into word chips and assign matching colors
  const chips: { word: string; typeKey: WordTypeKey }[] = [];
  if (splitLine) {
    const rawTokens = splitLine.split('+').map(t => t.trim()).filter(Boolean);
    for (const rawToken of rawTokens) {
      // Try to find matching item from wordItems
      const matched = wordItems.find(it => it.word === rawToken || rawToken.includes(it.word) || it.word.includes(rawToken));
      const typeKey = matched ? matched.typeKey : classifyWordType(rawToken);
      chips.push({
        word: rawToken,
        typeKey
      });
    }
  }

  // Parse structure formula tokens
  // E.g. "Phó từ + Tính từ + Động từ + Tân ngữ (Adv + Adj + V + O)"
  const structureTokens: { text: string; isOperator: boolean; typeKey: WordTypeKey }[] = [];
  if (structureLine) {
    // Split by operators and keep punctuation like +, (, )
    const regex = /([+()]|\bAdv\b|\bAdj\b|\bV\b|\bO\b|\bS\b|\bN\b|\bPrep\b|\bConj\b|\bNum\b|\bClf\b|[^+\s()]+(?:\s+[^+\s()]+)*)/g;
    const parts = structureLine.match(regex) || [structureLine];
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed === '+' || trimmed === '(' || trimmed === ')') {
        structureTokens.push({ text: trimmed, isOperator: true, typeKey: 'other' });
      } else {
        const typeKey = classifyWordType(trimmed);
        structureTokens.push({ text: trimmed, isOperator: false, typeKey });
      }
    }
  }

  return {
    title,
    splitLine,
    chips,
    intro,
    wordItems,
    structureLine,
    structureTokens,
    translations,
    otherLines
  };
}

interface GrammarAnalysisViewProps {
  content: string;
  className?: string;
}

export const GrammarAnalysisView: React.FC<GrammarAnalysisViewProps> = ({ content, className = '' }) => {
  const parsed = useMemo(() => parseGrammarText(content), [content]);

  // If parsing failed or has minimal content, show clean styled fallback
  if (!parsed || (parsed.wordItems.length === 0 && !parsed.splitLine && !parsed.structureLine)) {
    return (
      <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 ${className}`}>
      {/* 1. Sentence title */}
      {parsed.title && (
        <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="tracking-wide">{parsed.title}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Ngữ pháp
          </span>
        </div>
      )}

      {/* 2. Top Decomposition Chips (Each word colored by its part of speech) */}
      {parsed.chips.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Phân tích thành phần câu:
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            {parsed.chips.map((chip, idx) => {
              const style = WORD_TYPE_STYLES[chip.typeKey] || WORD_TYPE_STYLES.other;
              return (
                <React.Fragment key={idx}>
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm sm:text-base font-bold shadow-2xs border transition-transform hover:scale-105 ${style.chip}`}
                    title={`${chip.word}: ${style.name}`}
                  >
                    <span className="select-text">{chip.word}</span>
                  </div>
                  {idx < parsed.chips.length - 1 && (
                    <span className="text-slate-400 dark:text-slate-500 font-bold text-xs select-none">
                      +
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Word-by-Word Part-of-Speech Breakdown with Distinct Colors */}
      {parsed.wordItems.length > 0 && (
        <div className="space-y-1.5">
          {parsed.intro ? (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {parsed.intro}
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chi tiết loại từ:
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {parsed.wordItems.map((item, idx) => {
              const style = WORD_TYPE_STYLES[item.typeKey] || WORD_TYPE_STYLES.other;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-xs sm:text-sm transition-all duration-150 ${style.bg} ${style.border}`}
                >
                  {/* Left: Chinese word with matching dot indicator */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {item.word}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">=</span>
                  </div>

                  {/* Right: Part of speech badge colored specifically for this type */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}
                  >
                    {item.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Structure Formula with Matching Color Codes */}
      {(parsed.structureTokens.length > 0 || parsed.structureLine) && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <span>📌</span>
            <span>Cấu trúc ngữ pháp:</span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 leading-relaxed shadow-2xs">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
              {parsed.structureTokens.length > 0 ? (
                parsed.structureTokens.map((tok, idx) => {
                  if (tok.isOperator) {
                    return (
                      <span
                        key={idx}
                        className="text-slate-400 dark:text-slate-500 font-bold select-none text-xs"
                      >
                        {tok.text}
                      </span>
                    );
                  }
                  const style = WORD_TYPE_STYLES[tok.typeKey] || WORD_TYPE_STYLES.other;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${style.badge}`}
                    >
                      {tok.text}
                    </span>
                  );
                })
              ) : (
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {parsed.structureLine}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Translation block */}
      {parsed.translations.length > 0 && (
        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 space-y-1 text-xs sm:text-sm">
          {parsed.translations.map((t, idx) => (
            <div key={idx} className={idx === 0 ? "font-bold text-slate-800 dark:text-slate-200" : "text-blue-700 dark:text-blue-300 font-medium"}>
              {idx === 0 ? `> ${t}` : `↳ ${t}`}
            </div>
          ))}
        </div>
      )}

      {/* 6. Any other remaining lines */}
      {parsed.otherLines.length > 0 && (
        <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {parsed.otherLines.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
};
