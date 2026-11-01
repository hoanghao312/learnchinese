const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const sampleWords = [
  { text: "学习", pinyin: "xuéxí", translation: "Học tập", partOfSpeech: "Động từ", hsk: "HSK 1" },
  { text: "词汇", pinyin: "cíhuì", translation: "Từ vựng", partOfSpeech: "Danh từ", hsk: "HSK 4" },
  { text: "朋友", pinyin: "péngyou", translation: "Bạn bè", partOfSpeech: "Danh từ", hsk: "HSK 1" },
  { text: "喜欢", pinyin: "xǐhuan", translation: "Thích", partOfSpeech: "Động từ", hsk: "HSK 1" },
  { text: "工作", pinyin: "gōngzuò", translation: "Công việc", partOfSpeech: "Danh từ, Động từ", hsk: "HSK 2" },
  { text: "时间", pinyin: "shíjiān", translation: "Thời gian", partOfSpeech: "Danh từ", hsk: "HSK 2" },
  { text: "知道", pinyin: "zhīdào", translation: "Biết", partOfSpeech: "Động từ", hsk: "HSK 2" },
  { text: "现在", pinyin: "xiànzài", translation: "Bây giờ", partOfSpeech: "Danh từ", hsk: "HSK 1" },
  { text: "问题", pinyin: "wèntí", translation: "Vấn đề", partOfSpeech: "Danh từ", hsk: "HSK 2" },
  { text: "觉得", pinyin: "juéde", translation: "Cảm thấy", partOfSpeech: "Động từ", hsk: "HSK 2" },
  { text: "意思", pinyin: "yìsi", translation: "Ý nghĩa", partOfSpeech: "Danh từ", hsk: "HSK 2" },
  { text: "准备", pinyin: "zhǔnbèi", translation: "Chuẩn bị", partOfSpeech: "Động từ", hsk: "HSK 2" },
  { text: "希望", pinyin: "xīwàng", translation: "Hy vọng", partOfSpeech: "Động từ", hsk: "HSK 2" },
  { text: "开始", pinyin: "kāishǐ", translation: "Bắt đầu", partOfSpeech: "Động từ", hsk: "HSK 2" },
  { text: "帮助", pinyin: "bāngzhù", translation: "Giúp đỡ", partOfSpeech: "Động từ", hsk: "HSK 2" },
  { text: "生活", pinyin: "shēnghuó", translation: "Cuộc sống", partOfSpeech: "Danh từ", hsk: "HSK 3" },
];

let replacement = `const sampleWords: SavedWord[] = [\n`;
sampleWords.forEach((word, index) => {
  replacement += `        {
          id: 'sample-${index + 1}',
          text: "${word.text}",
          pinyin: "${word.pinyin}",
          translation: "${word.translation}",
          partOfSpeech: "${word.partOfSpeech}",
          hskLevel: "${word.hsk}",
          savedAt: Date.now() - ${index * 1000000},
          isKnown: false,
          intervalZhVi: 0,
          repetitionCountZhVi: 0,
          easinessFactorZhVi: 2.5,
          nextReviewDateZhVi: 0
        }${index < sampleWords.length - 1 ? ',' : ''}\n`;
});
replacement += `      ];`;

const pattern = /const sampleWords: SavedWord\[\] = \[\s*\{[\s\S]*?\}\s*\];/;
const newContent = content.replace(pattern, replacement);

fs.writeFileSync('src/App.tsx', newContent);
