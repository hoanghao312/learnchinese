const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const propsTarget = `interface PracticeProps {
  savedWords: SavedWord[];
  autoGenerateTimestamp?: number;
}`;
const propsReplacement = `interface PracticeProps {
  savedWords: SavedWord[];
  autoGenerateTimestamp?: number;
  autoGenerateType?: 'cloze' | 'ordering';
}`;
content = content.replace(propsTarget, propsReplacement);

const compTarget = `export default function Practice({ savedWords, autoGenerateTimestamp }: PracticeProps) {`;
const compReplacement = `export default function Practice({ savedWords, autoGenerateTimestamp, autoGenerateType }: PracticeProps) {`;
content = content.replace(compTarget, compReplacement);

const effectTarget = `  useEffect(() => {
    if (autoGenerateTimestamp && autoGenerateTimestamp > 0) {
      setActiveTab('cloze');
      // Use setTimeout to allow state to settle if needed, but direct call is okay
      generatePractice('cloze');
    }
  }, [autoGenerateTimestamp]);`;
const effectReplacement = `  useEffect(() => {
    if (autoGenerateTimestamp && autoGenerateTimestamp > 0) {
      setActiveTab(autoGenerateType || 'cloze');
      generatePractice(autoGenerateType || 'cloze');
    }
  }, [autoGenerateTimestamp, autoGenerateType]);`;
content = content.replace(effectTarget, effectReplacement);


fs.writeFileSync('src/components/Practice.tsx', content);
