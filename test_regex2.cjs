let text1 = '今天**<span style="color:red;">星期一</span>，<span style="color:red;">天气很好</span>**。';
let text2 = '今天**星期一**。';
let text3 = '我的**<span style="color:red;">先生</span>**是医生';

function cleanMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*\*\*/g, '')
    .replace(/\*\*(<span[^>]*>)/g, '$1')
    .replace(/(<\/span>)\*\*/g, '$1');
}

console.log("1:", cleanMarkdown(text1));
console.log("2:", cleanMarkdown(text2));
console.log("3:", cleanMarkdown(text3));
