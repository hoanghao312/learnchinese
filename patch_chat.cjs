const fs = require('fs');

const files = ['src/components/NotebookChat.tsx', 'src/components/AssistantChat.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  
  const helperFn = `
function cleanMarkdown(text: string) {
  if (!text) return text;
  return text
    .replace(/\\*\\*\\*\\*/g, '') // Xóa các lỗi 4 dấu sao do AI sinh ra
    .replace(/\\*\\*(<span[^>]*>)/g, '$1') // Xóa sao thừa trước thẻ HTML
    .replace(/(<\\/span>)\\*\\*/g, '$1'); // Xóa sao thừa sau thẻ HTML
}
`;

  if (!code.includes('function cleanMarkdown')) {
    // Thêm helper function trước export default
    code = code.replace("export default function", helperFn + "\nexport default function");
  }

  // Thay thế msg.content bằng cleanMarkdown(msg.content) trong phần ReactMarkdown
  code = code.replace(/<ReactMarkdown rehypePlugins=\{\[rehypeRaw\]\}>\{msg\.content\}<\/ReactMarkdown>/g, '<ReactMarkdown rehypePlugins={[rehypeRaw]}>{cleanMarkdown(msg.content)}</ReactMarkdown>');
  
  fs.writeFileSync(file, code);
}
