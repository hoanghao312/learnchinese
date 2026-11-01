const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `<Practice savedWords={wordsForPractice} autoGenerateTimestamp={practiceTrigger.timestamp} autoGenerateType={practiceTrigger.type} onUpdateWord={handleUpdateSavedWord} />`;
const rep = `<Practice savedWords={wordsForPractice} autoGenerateTimestamp={practiceTrigger.timestamp} autoGenerateType={practiceTrigger.type} onUpdateWord={(id, updatedData) => {
              setSavedWords(prev => {
                const updated = prev.map(w => w.id === id ? { ...w, ...updatedData } : w);
                localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
                return updated;
              });
            }} />`;
content = content.replace(target, rep);

fs.writeFileSync('src/App.tsx', content);
