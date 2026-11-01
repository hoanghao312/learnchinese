let text1 = '今天**<span style="color:red;">星期一</span>，<span style="color:red;">天气很好</span>**。';
let text2 = '今天**星期一**。';
let text3 = '我的** 先生 **是医生';
let text4 = '今天**星期一**和**星期二**。';

function cleanMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*\*\*/g, '') // Remove 4 asterisks
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Convert bold to HTML
    .replace(/\*\*/g, ''); // Remove any remaining dangling asterisks
}

console.log("1:", cleanMarkdown(text1));
console.log("2:", cleanMarkdown(text2));
console.log("3:", cleanMarkdown(text3));
console.log("4:", cleanMarkdown(text4));
