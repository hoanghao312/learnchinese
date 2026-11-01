const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
const segments = segmenter.segment("医生和先生明天星期一去医院。");
for (const { segment, isWordLike } of segments) {
  console.log(segment, isWordLike);
}
