const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const propsTarget = `interface PracticeProps {
  savedWords: SavedWord[];
}`;
const propsReplacement = `interface PracticeProps {
  savedWords: SavedWord[];
  autoGenerateTimestamp?: number;
}`;
content = content.replace(propsTarget, propsReplacement);

const componentTarget = `export default function Practice({ savedWords }: PracticeProps) {
  const [activeTab, setActiveTab] = useState<PracticeType>('cloze');`;
const componentReplacement = `import { useEffect } from 'react';\n\nexport default function Practice({ savedWords, autoGenerateTimestamp }: PracticeProps) {
  const [activeTab, setActiveTab] = useState<PracticeType>('cloze');`;
content = content.replace(componentTarget, componentReplacement);

const effectTarget = `  const [orderingChecked, setOrderingChecked] = useState(false);`;
const effectReplacement = `  const [orderingChecked, setOrderingChecked] = useState(false);

  useEffect(() => {
    if (autoGenerateTimestamp && autoGenerateTimestamp > 0) {
      setActiveTab('cloze');
      // Use setTimeout to allow state to settle if needed, but direct call is okay
      generatePractice('cloze');
    }
  }, [autoGenerateTimestamp]);`;
content = content.replace(effectTarget, effectReplacement);

fs.writeFileSync('src/components/Practice.tsx', content);
