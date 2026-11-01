const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add practiceFolderId state
const stateTarget = `const [streakDays, setStreakDays] = useState<number>(12);`;
const stateReplacement = `const [streakDays, setStreakDays] = useState<number>(12);
  const [practiceFolderId, setPracticeFolderId] = useState<string | 'all' | 'uncategorized' | null>(null);`;
content = content.replace(stateTarget, stateReplacement);

// 2. Add wordsForPractice calculation
const logicTarget = `return (
    <div className={\`bg-slate-50`;
const logicReplacement = `const wordsForPractice = practiceFolderId === 'all' 
    ? savedWords 
    : practiceFolderId === 'uncategorized'
    ? savedWords.filter(w => !w.folderId)
    : practiceFolderId 
    ? savedWords.filter(w => w.folderId === practiceFolderId)
    : savedWords;

  return (
    <div className={\`bg-slate-50`;
content = content.replace(logicTarget, logicReplacement);

// 3. Update the Practice component props
const practiceTarget = `<Practice savedWords={savedWords} />`;
const practiceReplacement = `<Practice savedWords={wordsForPractice} />`;
content = content.replace(practiceTarget, practiceReplacement);

// 4. Pass onNavigateToPractice to SavedWordsList
const savedWordsListTarget = `<SavedWordsList
              savedWords={savedWords}`;
const savedWordsListReplacement = `<SavedWordsList
              onNavigateToPractice={(folderId) => {
                setPracticeFolderId(folderId);
                setMainTab('practice');
              }}
              savedWords={savedWords}`;
content = content.replace(savedWordsListTarget, savedWordsListReplacement);

fs.writeFileSync('src/App.tsx', content);
