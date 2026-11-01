const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const stateTarget = `  const [practiceFolderId, setPracticeFolderId] = useState<string | 'all' | 'uncategorized' | null>(null);`;
const stateRep = `  const [practiceFolderId, setPracticeFolderId] = useState<string | 'all' | 'uncategorized' | null>(null);
  const [practiceWordId, setPracticeWordId] = useState<string | null>(null);`;
content = content.replace(stateTarget, stateRep);

const navTarget = `              onNavigateToPractice={(folderId, type) => {
                setPracticeFolderId(folderId);
                setPracticeTrigger({ timestamp: Date.now(), type });
                setMainTab('practice');
              }}`;
const navRep = `              onNavigateToPractice={(targetId, type, isSingleWord) => {
                if (isSingleWord) {
                  setPracticeWordId(targetId);
                  setPracticeFolderId(null);
                } else {
                  setPracticeFolderId(targetId);
                  setPracticeWordId(null);
                }
                setPracticeTrigger({ timestamp: Date.now(), type });
                setMainTab('practice');
              }}`;
content = content.replace(navTarget, navRep);

const wordsTarget = `  const wordsForPractice = practiceFolderId === 'all' 
    ? savedWords 
    : practiceFolderId === 'uncategorized'
    ? savedWords.filter(w => !w.folderId)
    : practiceFolderId 
    ? savedWords.filter(w => w.folderId === practiceFolderId)
    : savedWords;`;
const wordsRep = `  const wordsForPractice = practiceWordId
    ? savedWords.filter(w => w.id === practiceWordId)
    : practiceFolderId === 'all' 
    ? savedWords 
    : practiceFolderId === 'uncategorized'
    ? savedWords.filter(w => !w.folderId)
    : practiceFolderId 
    ? savedWords.filter(w => w.folderId === practiceFolderId)
    : savedWords;`;
content = content.replace(wordsTarget, wordsRep);

fs.writeFileSync('src/App.tsx', content);
