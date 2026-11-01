const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const targetCombine = `      // Combine saved and generated
      const combined = [...finalSaved, ...generatedExs].slice(0, requiredTotal);`;
const repCombine = `      // Combine saved and generated
      const deduplicatedGenerated = generatedExs.filter((g: any) => {
        if (type === 'cloze') {
          return !finalSaved.some((s: any) => s.sentence === g.sentence);
        } else {
          return !finalSaved.some((s: any) => s.correctSentence === g.correctSentence);
        }
      });
      const combined = [...finalSaved, ...deduplicatedGenerated].slice(0, requiredTotal);`;
content = content.replace(targetCombine, repCombine);

fs.writeFileSync('src/components/Practice.tsx', content);
