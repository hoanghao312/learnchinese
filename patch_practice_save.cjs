const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const targetImport = `import { Loader2, Dumbbell, AlignLeft, RefreshCw, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';`;
const repImport = `import { Loader2, Dumbbell, AlignLeft, RefreshCw, CheckCircle, XCircle, Eye, EyeOff, Bookmark, BookmarkCheck } from 'lucide-react';`;
content = content.replace(targetImport, repImport);

const targetBeforeReturn = `  return (
    <div className="flex flex-col items-center">`;
const repBeforeReturn = `  const handleSaveExercise = (ex: any, type: PracticeType) => {
    if (!onUpdateWord) return;
    
    // Find the word
    const targetWord = ex.targetWord;
    let word = null;
    if (targetWord) {
      word = savedWords.find(w => w.text === targetWord);
    }
    if (!word) {
      // Fallback
      if (type === 'cloze') {
        word = savedWords.find(w => w.text === ex.answer || ex.sentence.includes(w.text) || ex.options.includes(w.text));
      } else {
        word = savedWords.find(w => ex.correctSentence.includes(w.text) || ex.shuffledWords.includes(w.text));
      }
    }
    
    if (word) {
      const currentSaved = word.savedExercises || { cloze: [], ordering: [] };
      const currentList = type === 'cloze' ? (currentSaved.cloze || []) : (currentSaved.ordering || []);
      
      // Check if already saved
      const isSaved = type === 'cloze' 
        ? currentList.some((e: any) => e.sentence === ex.sentence)
        : currentList.some((e: any) => e.correctSentence === ex.correctSentence);
        
      if (!isSaved) {
        const newList = [...currentList, ex];
        onUpdateWord(word.id, {
          savedExercises: {
            ...currentSaved,
            [type]: newList
          }
        });
        alert("Đã lưu bài tập cho từ: " + word.text);
      } else {
        const newList = currentList.filter((e: any) => type === 'cloze' ? e.sentence !== ex.sentence : e.correctSentence !== ex.correctSentence);
        onUpdateWord(word.id, {
          savedExercises: {
            ...currentSaved,
            [type]: newList
          }
        });
        alert("Đã bỏ lưu bài tập cho từ: " + word.text);
      }
    } else {
      alert("Không tìm thấy từ vựng gốc để lưu bài tập này.");
    }
  };

  return (
    <div className="flex flex-col items-center">`;
content = content.replace(targetBeforeReturn, repBeforeReturn);

fs.writeFileSync('src/components/Practice.tsx', content);
