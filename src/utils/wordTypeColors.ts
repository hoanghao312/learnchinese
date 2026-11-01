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

export function classifyWordType(desc?: string): WordTypeKey {
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

const WORD_TYPE_TEXT_COLORS: Record<WordTypeKey, string> = {
  pho_tu: 'text-purple-600 dark:text-purple-400',
  tinh_tu: 'text-amber-600 dark:text-amber-400',
  dong_tu: 'text-emerald-600 dark:text-emerald-400',
  danh_tu: 'text-sky-600 dark:text-sky-400',
  dai_tu: 'text-rose-600 dark:text-rose-400',
  tan_ngu: 'text-indigo-600 dark:text-indigo-400',
  chu_ngu: 'text-blue-600 dark:text-blue-400',
  gioi_tu: 'text-teal-600 dark:text-teal-400',
  lien_tu: 'text-cyan-600 dark:text-cyan-400',
  luong_tu: 'text-fuchsia-600 dark:text-fuchsia-400',
  tro_tu: 'text-lime-600 dark:text-lime-400',
  bo_ngu: 'text-orange-600 dark:text-orange-400',
  dinh_tu: 'text-violet-600 dark:text-violet-400',
  trang_ngu: 'text-purple-600 dark:text-purple-400',
  than_tu: 'text-yellow-600 dark:text-yellow-400',
  other: 'text-slate-600 dark:text-slate-400',
};

/**
 * Returns purple text color for part of speech without background or border.
 */
export function getPartOfSpeechTextColor(partOfSpeech?: string): string {
  if (!partOfSpeech || partOfSpeech === '-') return 'text-slate-400 dark:text-slate-500';
  return 'text-purple-600 dark:text-purple-400';
}

/**
 * Returns text color for HSK level without background or border.
 */
export function getHskTextColor(hskLevel?: string): string {
  if (!hskLevel || hskLevel === '-') return 'text-slate-400 dark:text-slate-500';
  return 'text-red-600 dark:text-red-400';
}
