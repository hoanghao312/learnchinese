let text = '今天**<span style="color:red;">星期一</span>，<span style="color:red;">天气很好</span>**。我的****<span style="color:red;">先生</span>是<span style="color:red;">医生</span>，他很****<span style="color:red;">忙</span>。';

let cleanText = text
  .replace(/\*\*\*\*/g, '') 
  .replace(/\*\*(<span[^>]*>)/g, '$1') 
  .replace(/(<\/span>)\*\*/g, '$1');

console.log(cleanText);
