export interface ExampleSentence {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface Token {
  type: "word" | "punctuation" | "whitespace";
  text: string;
  pinyin?: string;
  translation?: string;
  partOfSpeech?: string;
  example?: ExampleSentence;
  hskLevel?: string;
  imageUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  parentId?: string | null;
}

export interface SavedWord {
  id: string;
  text: string;
  pinyin: string;
  translation: string;
  partOfSpeech?: string;
  hskLevel?: string;
  example?: ExampleSentence;
  savedAt: number;
  isKnown?: boolean;
  folderId?: string | null;
  imageUrl?: string;
  // Spaced Repetition details (SuperMemo-2 inspired)
  nextReviewDateZhVi?: number;
  intervalZhVi?: number;
  repetitionCountZhVi?: number;
  easinessFactorZhVi?: number;

  nextReviewDateViZh?: number;
  intervalViZh?: number;
  repetitionCountViZh?: number;
  easinessFactorViZh?: number;
  lastPracticeScore?: number | null;
  lastModified?: number;
  savedExercises?: {
    cloze?: ClozeExercise[];
    ordering?: OrderingExercise[];
  };
}

export interface ClozeExercise {
  targetWord?: string;
  sentence: string;
  pinyin: string;
  translation: string;
  answer: string;
  options: string[];
}

export interface OrderingExercise {
  type?: 'insert_word' | 'ordering';
  targetWord?: string;
  shuffledWords?: string[];
  sentenceWithGaps?: string;
  correctOption?: string;
  correctSentence: string;
  pinyin: string;
  translation: string;
  structureExplanation?: string;
}

export interface SavedLesson {
  id: string;
  title: string;
  text: string;
  folderId?: string | null;
  savedAt: number;
  tokens?: Token[];
}

export interface Lesson {
  id: string;
  title: string;
  level: "HSK 1" | "HSK 2" | "HSK 3" | "HSK 4" | "Học đường" | "Đời sống" | "Tập tin";
  text: string;
  description: string;
}
