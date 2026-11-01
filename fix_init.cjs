const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

content = content.replace(
  /const initialAnswers: Record<number, string\[\]> = \{\};/,
  'const initialAnswers: Record<number, {id: string, text: string}[]> = {};'
);

const toggleTarget = `  const toggleOrderingWord = (exerciseIndex: number, word: string) => {
    if (orderingChecked) return;
    setOrderingAnswers(prev => {
      const current = prev[exerciseIndex] || [];
      if (current.includes(word)) {
        return { ...prev, [exerciseIndex]: current.filter(w => w !== word) };
      } else {
        return { ...prev, [exerciseIndex]: [...current, word] };
      }
    });
  };`;

content = content.replace(toggleTarget, '');

fs.writeFileSync('src/components/Practice.tsx', content);
