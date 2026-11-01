const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

// 1. Add State
const targetStateStr = `  const [storyUnknownStart, setStoryUnknownStart] = useState(1);
  const [storyUnknownEnd, setStoryUnknownEnd] = useState(20);
  const [storyLength, setStoryLength] = useState(200);`;

const replaceStateStr = `  const [storyUnknownStart, setStoryUnknownStart] = useState(1);
  const [storyUnknownEnd, setStoryUnknownEnd] = useState(20);
  const [storyLength, setStoryLength] = useState(200);
  const [storyCount, setStoryCount] = useState(1);`;

content = content.replace(targetStateStr, replaceStateStr);

// 2. Add UI for storyCount
const targetInputsStr = `                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Độ dài câu chuyện (chữ)
                  </label>
                  <div className="flex gap-2">
                    {[100, 200, 300].map(len => (`;

const replaceInputsStr = `                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Số lượng câu chuyện
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(count => (
                      <button
                        key={count}
                        onClick={() => setStoryCount(count)}
                        className={\`flex-1 py-2 text-sm font-bold rounded-xl border transition-all \${storyCount === count ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}\`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Độ dài câu chuyện (chữ)
                  </label>
                  <div className="flex gap-2">
                    {[100, 200, 300].map(len => (`;

content = content.replace(targetInputsStr, replaceInputsStr);

// 3. Update Prompt Generation
const targetActionStr = `                    if (storyFilterType === 'vocab') {
                      const unknownWords = sortedSavedWords.filter(w => !w.isKnown);
                      
                      const uStart = Math.max(0, storyUnknownStart - 1);
                      const uEnd = Math.min(unknownWords.length, storyUnknownEnd);
                      const selectedUnknown = unknownWords.slice(uStart, uEnd).map(w => w.text);
                      
                      let reqStr = "";
                      if (selectedUnknown.length > 0) reqStr += \`\\n- Từ vựng bắt buộc (\${selectedUnknown.length} từ): \${selectedUnknown.join(', ')}\`;

                      prompt = \`Tạo một câu chuyện tiếng Trung khoảng \${storyLength} từ chứa các từ vựng bắt buộc sau đây:\${reqStr}\\n\\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.\${knownStr}\`;
                    } else {
                      if (!storyFolderId) {
                        alert("Vui lòng chọn một thư mục.");
                        return;
                      }
                      const folderName = folders?.find(f => f.id === storyFolderId)?.name || 'Thư mục';
                      const folderWords = savedWords.filter(w => w.folderId === storyFolderId).map(w => w.text);
                      
                      if (folderWords.length === 0) {
                        alert("Thư mục này chưa có từ vựng nào.");
                        return;
                      }
                      
                      prompt = \`Tạo một câu chuyện tiếng Trung khoảng \${storyLength} từ chứa toàn bộ \${folderWords.length} từ vựng trong thư mục "\${folderName}" bắt buộc sau đây:\\n\${folderWords.join(', ')}\\n\\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.\${knownStr}\`;
                    }`;

const replaceActionStr = `                    const constraintsStr = \`\\n\\nYÊU CẦU QUAN TRỌNG:\\n1. Tạo chính xác \${storyCount} câu chuyện khác nhau.\\n2. CHỈ trả về phần văn bản tiếng Trung của (các) câu chuyện. KHÔNG trả về pinyin, KHÔNG dịch nghĩa tiếng Việt, và KHÔNG liệt kê lại danh sách từ vựng.\`;

                    if (storyFilterType === 'vocab') {
                      const unknownWords = sortedSavedWords.filter(w => !w.isKnown);
                      
                      const uStart = Math.max(0, storyUnknownStart - 1);
                      const uEnd = Math.min(unknownWords.length, storyUnknownEnd);
                      const selectedUnknown = unknownWords.slice(uStart, uEnd).map(w => w.text);
                      
                      let reqStr = "";
                      if (selectedUnknown.length > 0) reqStr += \`\\n- Từ vựng bắt buộc (\${selectedUnknown.length} từ): \${selectedUnknown.join(', ')}\`;

                      prompt = \`Tạo \${storyCount} câu chuyện tiếng Trung, mỗi câu chuyện khoảng \${storyLength} từ, chứa các từ vựng bắt buộc sau đây:\${reqStr}\\n\\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.\${knownStr}\${constraintsStr}\`;
                    } else {
                      if (!storyFolderId) {
                        alert("Vui lòng chọn một thư mục.");
                        return;
                      }
                      const folderName = folders?.find(f => f.id === storyFolderId)?.name || 'Thư mục';
                      const folderWords = savedWords.filter(w => w.folderId === storyFolderId).map(w => w.text);
                      
                      if (folderWords.length === 0) {
                        alert("Thư mục này chưa có từ vựng nào.");
                        return;
                      }
                      
                      prompt = \`Tạo \${storyCount} câu chuyện tiếng Trung, mỗi câu chuyện khoảng \${storyLength} từ, chứa toàn bộ \${folderWords.length} từ vựng trong thư mục "\${folderName}" bắt buộc sau đây:\\n\${folderWords.join(', ')}\\n\\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.\${knownStr}\${constraintsStr}\`;
                    }`;

content = content.replace(targetActionStr, replaceActionStr);

fs.writeFileSync('src/components/NotebookChat.tsx', content);
