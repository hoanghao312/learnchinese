const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf8');

const targetStr = `      generatedExs = generatedExs.map((ex: any) => {
         if (!ex.id) ex.id = Date.now().toString() + Math.random().toString();
         if (ex.correctSentence) {
             const wordsArray = ex.correctSentence.match(/[\\w一-龥]+|[^\\s\\w一-龥]+/g) || [];
             ex.shuffledWords = wordsArray.map((text: string) => ({ id: Date.now().toString() + Math.random().toString(), text })).sort(() => 0.5 - Math.random());
         }
         return ex;
      });`;

const replaceStr = `      generatedExs = generatedExs.map((ex: any) => {
         if (!ex.id) ex.id = Date.now().toString() + Math.random().toString();
         // Use the shuffledWords from the API directly.
         return ex;
      });`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/Practice.tsx', content);
