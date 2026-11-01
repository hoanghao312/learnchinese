const fs = require('fs');
let content = fs.readFileSync('server/fallbackData.ts', 'utf-8');

const newVocab = `
  "太极拳": { pinyin: "tài jí quán", translation: "Thái cực quyền", partOfSpeech: "Danh từ", example: { chinese: "他每天早上打太极拳。", pinyin: "tā měitiān zǎoshang dǎ tàijíquán.", vietnamese: "Ông ấy tập thái cực quyền mỗi sáng." } },
  "夏令营": { pinyin: "xià lìng yíng", translation: "trại hè", partOfSpeech: "Danh từ", example: { chinese: "我参加了中文夏令营。", pinyin: "wǒ cānjiā le zhōngwén xiàlìngyíng.", vietnamese: "Tôi đã tham gia trại hè tiếng Trung." } },
  "志愿者": { pinyin: "zhì yuàn zhě", translation: "tình nguyện viên", partOfSpeech: "Danh từ", example: { chinese: "她是一名奥运会志愿者。", pinyin: "tā shì yī míng àoyùnhuì zhìyuànzhě.", vietnamese: "Cô ấy là một tình nguyện viên thế vận hội." } },
  "家人": { pinyin: "jiā rén", translation: "người nhà, gia đình", partOfSpeech: "Danh từ", example: { chinese: "我和家人一起去旅行。", pinyin: "wǒ hé jiārén yīqǐ qù lǚxíng.", vietnamese: "Tôi đi du lịch cùng người nhà." } },
  "任何人": { pinyin: "rèn hé rén", translation: "bất kỳ ai", partOfSpeech: "Đại từ", example: { chinese: "任何人都可以参加。", pinyin: "rènhérén dōu kěyǐ cānjiā.", vietnamese: "Bất kỳ ai cũng có thể tham gia." } },
  "老先生": { pinyin: "lǎo xiān sheng", translation: "lão tiên sinh, ông cụ", partOfSpeech: "Danh từ", example: { chinese: "那位老先生是我的邻居。", pinyin: "nà wèi lǎo xiānsheng shì wǒ de línjū.", vietnamese: "Cụ ông đó là hàng xóm của tôi." } },
  "不知道": { pinyin: "bù zhī dào", translation: "không biết", partOfSpeech: "Động từ", example: { chinese: "我不知道他在哪里。", pinyin: "wǒ bù zhīdào tā zài nǎlǐ.", vietnamese: "Tôi không biết anh ấy ở đâu." } },
  "吃饭": { pinyin: "chī fàn", translation: "ăn cơm", partOfSpeech: "Động từ", example: { chinese: "我们去吃饭吧。", pinyin: "wǒmen qù chīfàn ba.", vietnamese: "Chúng ta đi ăn cơm thôi." } },
  "那里": { pinyin: "nà lǐ", translation: "nơi đó, chỗ đó", partOfSpeech: "Đại từ", example: { chinese: "那里有很多书。", pinyin: "nàlǐ yǒu hěnduō shū.", vietnamese: "Chỗ đó có rất nhiều sách." } },
  "这里": { pinyin: "zhè lǐ", translation: "nơi này, chỗ này", partOfSpeech: "Đại từ", example: { chinese: "这里很安静。", pinyin: "zhèlǐ hěn ānjièng.", vietnamese: "Chỗ này rất yên tĩnh." } },
  "还有": { pinyin: "hái yǒu", translation: "còn có, vẫn còn", partOfSpeech: "Liên từ", example: { chinese: "我还有一件事要说。", pinyin: "wǒ háiyǒu yī jiàn shì yào shuō.", vietnamese: "Tôi còn một việc nữa muốn nói." } },
  "学会": { pinyin: "xué huì", translation: "học được, nắm được", partOfSpeech: "Động từ", example: { chinese: "我学会了游泳。", pinyin: "wǒ xuéhuì le yóuyǒng.", vietnamese: "Tôi đã biết bơi rồi." } },
  "最好": { pinyin: "zuì hǎo", translation: "tốt nhất", partOfSpeech: "Phó từ", example: { chinese: "你最好早点休息。", pinyin: "nǐ zuìhǎo zǎodiǎn xiūxi.", vietnamese: "Tốt nhất bạn nên nghỉ ngơi sớm một chút." } },
  "最后": { pinyin: "zuì hòu", translation: "cuối cùng", partOfSpeech: "Danh từ/Phó từ", example: { chinese: "最后，他成功了。", pinyin: "zuìhòu, tā chénggōng le.", vietnamese: "Cuối cùng anh ấy đã thành công." } },
  "不能": { pinyin: "bù néng", translation: "không thể", partOfSpeech: "Động từ năng nguyện", example: { chinese: "我不能去。", pinyin: "wǒ bùnéng qù.", vietnamese: "Tôi không thể đi." } },
  "点儿": { pinyin: "diǎn r", translation: "một chút, tí xíu", partOfSpeech: "Lượng từ", example: { chinese: "我喝了一点儿水。", pinyin: "wǒ hē le yīdiǎnr shuǐ.", vietnamese: "Tôi đã uống một chút nước." } },
  "纸": { pinyin: "zhǐ", translation: "giấy", partOfSpeech: "Danh từ", example: { chinese: "给我一张纸。", pinyin: "gěi wǒ yī zhāng zhǐ.", vietnamese: "Đưa cho tôi một tờ giấy." } },
`;

content = content.replace(
  'export const OFFLINE_VOCAB_DICT: Record<string, { pinyin: string; translation: string; partOfSpeech: string; example: any }> = {',
  'export const OFFLINE_VOCAB_DICT: Record<string, { pinyin: string; translation: string; partOfSpeech: string; example: any }> = {\n' + newVocab
);

fs.writeFileSync('server/fallbackData.ts', content);
