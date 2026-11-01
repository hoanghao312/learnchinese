const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  'const [historicalMissingWords, setHistoricalMissingWords] = useState<Token[]>([]);',
  'const [historicalMissingWords, setHistoricalMissingWords] = useState<Token[]>([]);\n  const [selectedMissingWords, setSelectedMissingWords] = useState<string[]>([]);\n  const [isLookingUpMerged, setIsLookingUpMerged] = useState(false);'
);

fs.writeFileSync('src/App.tsx', content);
