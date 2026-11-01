const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// Replace local interfaces with imported ones
content = content.replace(/interface ClozeExercise \{[\s\S]*?\}/, '');
content = content.replace(/interface OrderingExercise \{[\s\S]*?\}/, '');
content = content.replace(/import \{ SavedWord \} from '\.\.\/types';/, `import { SavedWord, ClozeExercise, OrderingExercise } from '../types';`);

// Add onUpdateWord
content = content.replace(/interface PracticeProps \{/, `interface PracticeProps {\n  onUpdateWord?: (id: string, updatedData: Partial<SavedWord>) => void;`);
content = content.replace(/export default function Practice\(\{ savedWords, autoGenerateTimestamp, autoGenerateType \}: PracticeProps\) \{/, `export default function Practice({ savedWords, autoGenerateTimestamp, autoGenerateType, onUpdateWord }: PracticeProps) {`);

fs.writeFileSync('src/components/Practice.tsx', content);
