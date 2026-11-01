const fs = require('fs');
const files = ['src/components/NotebookChat.tsx', 'src/components/AssistantChat.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  
  const oldHelper = `function cleanMarkdown(text: string) {
  if (!text) return text;
  return text
    .replace(/\\*\\*\\*\\*/g, '') // Xóa các lỗi 4 dấu sao do AI sinh ra
    .replace(/\\*\\*(<span[^>]*>)/g, '$1') // Xóa sao thừa trước thẻ HTML
    .replace(/(<\\/span>)\\*\\*/g, '$1'); // Xóa sao thừa sau thẻ HTML
}`;

  const newHelper = `function cleanMarkdown(text: string) {
  if (!text) return text;
  return text
    .replace(/\\*\\*\\*\\*/g, '') // Xóa các lỗi 4 dấu sao do AI sinh ra
    .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>') // Chuyển đổi in đậm thành HTML để tránh lỗi Markdown
    .replace(/\\*\\*/g, ''); // Xóa toàn bộ các dấu sao đôi còn sót lại
}`;

  if (code.includes(oldHelper)) {
    code = code.replace(oldHelper, newHelper);
    fs.writeFileSync(file, code);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find oldHelper in ${file}`);
  }
}
