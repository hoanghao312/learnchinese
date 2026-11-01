const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const handleSendFn = `
  const handleSendToLearning = (text: string) => {
    // 1. Dọn dẹp Markdown để chỉ lấy văn bản thô tiếng Trung (nếu muốn)
    // Nhưng text ở đây thường là raw Markdown content. Text area có thể tự render hoặc xử lý text thô.
    let cleanText = text;
    // Dọn các ký tự markdown ** nếu có
    cleanText = cleanText.replace(/\\*\\*(.*?)\\*\\*/g, '$1').replace(/\\*\\*\\*\\*/g, '');
    
    setMainTab('home');
    setInputSourceTab('paste');
    setCustomText(cleanText);
    setIsChatWindowOpen(false);
  };
`;

// Insert the handler inside App component
const insertIndex = code.indexOf('const [customText, setCustomText] = useState<string>("");');
if (insertIndex !== -1) {
  // Find the end of states
  const useEffectIndex = code.indexOf('useEffect(() => {');
  code = code.substring(0, useEffectIndex) + handleSendFn + code.substring(useEffectIndex);
}

// Add the props
code = code.replace(/<AssistantChat \/>/g, '<AssistantChat onSendToLearning={handleSendToLearning} />');
code = code.replace(/<AssistantChat onClose=\{\(\) => setIsChatWindowOpen\(false\)\} \/>/g, '<AssistantChat onClose={() => setIsChatWindowOpen(false)} onSendToLearning={handleSendToLearning} />');
code = code.replace(/<NotebookChat \/>/g, '<NotebookChat onSendToLearning={handleSendToLearning} />');

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx');

