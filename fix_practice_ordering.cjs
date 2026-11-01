const fs = require('fs');
const content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const searchStr = `      if (type === 'ordering' && generatedExs.length > 0) {
        const targetLengths = [5, 5, 5, 5, 6, 6, 6, 7, 7, 7];
        while (generatedExs.length < 10) {
          generatedExs.push({ ...generatedExs[generatedExs.length - 1], id: Date.now().toString() + Math.random().toString() });
        }
        generatedExs = generatedExs.slice(0, 10);
        
        generatedExs.forEach((ex: any, i: number) => {
          const targetLength = targetLengths[i];
          let words = [...(ex.shuffledWords || [])];
          
          while (words.length < targetLength) {
            let maxLen = 0;
            let maxIdx = -1;
            for (let j = 0; j < words.length; j++) {
              if (words[j].length > maxLen) {
                maxLen = words[j].length;
                maxIdx = j;
              }
            }
            if (maxLen > 1) {
              const wordToSplit = words[maxIdx];
              const half = Math.floor(maxLen / 2);
              words.splice(maxIdx, 1, wordToSplit.substring(0, half), wordToSplit.substring(half));
            } else {
              break;
            }
          }
          
          while (words.length > targetLength && words.length > 1) {
            let merged = false;
            for (let j = 0; j < words.length && !merged; j++) {
              for (let k = 0; k < words.length; k++) {
                if (j === k) continue;
                const combined = words[j] + words[k];
                if (ex.correctSentence && ex.correctSentence.includes(combined)) {
                  words[j] = combined;
                  words.splice(k, 1);
                  merged = true;
                  break;
                }
              }
            }
            if (!merged) {
              words[0] = (words[0] || "") + (words[1] || "");
              words.splice(1, 1);
            }
          }
          
          ex.shuffledWords = words.sort(() => 0.5 - Math.random());
        });
      }`;

const replaceStr = `      if (type === 'ordering' && generatedExs.length > 0) {
        while (generatedExs.length < 10) {
          generatedExs.push({ ...generatedExs[generatedExs.length - 1], id: Date.now().toString() + Math.random().toString() });
        }
        generatedExs = generatedExs.slice(0, 10);
        
        generatedExs.forEach((ex: any) => {
          if (ex.shuffledWords) {
            ex.shuffledWords = [...ex.shuffledWords].sort(() => 0.5 - Math.random());
          }
        });
      }`;

if (content.includes(searchStr)) {
  fs.writeFileSync('src/components/Practice.tsx', content.replace(searchStr, replaceStr));
  console.log("Successfully removed manual splitting logic.");
} else {
  console.log("Could not find manual splitting logic.");
}
