const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStr = `                  onClick={() => {
                    let prompt = "";
                    const knownWords = savedWords.filter(w => w.isKnown).map(w => w.text);
                    const knownStr = knownWords.length > 0 ? \`\\n\\nĐối với CÁC TỪ VỰNG CÒN LẠI trong câu chuyện (ngoài danh sách bắt buộc), hãy CỐ GẮNG TỐI ĐA chỉ sử dụng các từ trong danh sách "Đã biết" sau đây của tôi:\\n\${knownWords.join(', ')}\` : "";

                    if (storyFilterType === 'vocab') {
                      const unknownWords = savedWords.filter(w => !w.isKnown);`;

const replaceStr = `                  onClick={() => {
                    let prompt = "";
                    
                    const sortedSavedWords = [...savedWords].sort((a, b) => {
                      const getHskWeight = (level) => {
                        if (!level) return 3.5;
                        const match = level.match(/HSK\\s*(\\d+)/i);
                        if (match) return parseInt(match[1]);
                        return 3.5;
                      };
                      const weightA = getHskWeight(a.hskLevel);
                      const weightB = getHskWeight(b.hskLevel);
                      if (weightA !== weightB) {
                        return weightA - weightB;
                      }
                      return (b.savedAt || 0) - (a.savedAt || 0);
                    });

                    const knownWords = sortedSavedWords.filter(w => w.isKnown).map(w => w.text);
                    const knownStr = knownWords.length > 0 ? \`\\n\\nĐối với CÁC TỪ VỰNG CÒN LẠI trong câu chuyện (ngoài danh sách bắt buộc), hãy CỐ GẮNG TỐI ĐA chỉ sử dụng các từ trong danh sách "Đã biết" sau đây của tôi:\\n\${knownWords.join(', ')}\` : "";

                    if (storyFilterType === 'vocab') {
                      const unknownWords = sortedSavedWords.filter(w => !w.isKnown);`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/NotebookChat.tsx', content);
