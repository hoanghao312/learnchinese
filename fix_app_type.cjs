const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const stateTarget = `const [practiceTrigger, setPracticeTrigger] = useState<number>(0);`;
const stateReplacement = `const [practiceTrigger, setPracticeTrigger] = useState<{timestamp: number, type: 'cloze' | 'ordering'}>({timestamp: 0, type: 'cloze'});`;
content = content.replace(stateTarget, stateReplacement);


const navTarget = `onNavigateToPractice={(folderId) => {
                setPracticeFolderId(folderId);
                setPracticeTrigger(Date.now());
                setMainTab('practice');
              }}`;
const navReplacement = `onNavigateToPractice={(folderId, type) => {
                setPracticeFolderId(folderId);
                setPracticeTrigger({ timestamp: Date.now(), type });
                setMainTab('practice');
              }}`;
content = content.replace(navTarget, navReplacement);

const propTarget = `<Practice savedWords={wordsForPractice} autoGenerateTimestamp={practiceTrigger} />`;
const propReplacement = `<Practice savedWords={wordsForPractice} autoGenerateTimestamp={practiceTrigger.timestamp} autoGenerateType={practiceTrigger.type} />`;
content = content.replace(propTarget, propReplacement);


fs.writeFileSync('src/App.tsx', content);
