const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const targetTry = `    try {
      // Pick 10 random words
      const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled; // Lấy tất cả từ vựng

      const response = await fetch('/api/practice/generate', {`;

const repTry = `    try {
      // Pick random words
      const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled;
      
      let savedExs = [];
      if (type === 'cloze') {
        savedExs = selectedWords.flatMap(w => w.savedExercises?.cloze || []);
      } else {
        savedExs = selectedWords.flatMap(w => w.savedExercises?.ordering || []);
      }
      
      // Shuffle saved exercises and take up to the required amount
      savedExs = savedExs.sort(() => 0.5 - Math.random());
      
      const requiredTotal = selectedWords.length === 1 ? 5 : selectedWords.length;
      let finalSaved = savedExs.slice(0, requiredTotal);
      
      let generatedExs = [];
      
      // Only call API if we need more
      if (finalSaved.length < requiredTotal) {
        // We can just ask API to generate the difference. 
        // We'll pass the difference as a hint to the backend by duplicating words if needed, 
        // but backend is hardcoded to words.length.
        // We'll just generate based on selectedWords and then take the difference.
        const response = await fetch('/api/practice/generate', {`;

content = content.replace(targetTry, repTry);

const targetSet = `      if (type === 'cloze') {
        setClozeExercises(data.exercises || []);
      } else {
        // Initialize ordering answers as empty arrays
        const initialAnswers: Record<number, string[]> = {};
        (data.exercises || []).forEach((_: any, i: number) => {
          initialAnswers[i] = [];
        });
        setOrderingAnswers(initialAnswers);
        setOrderingExercises(data.exercises || []);
      }`;
      
const repSet = `      generatedExs = data.exercises || [];
      }
      
      // Combine saved and generated
      const combined = [...finalSaved, ...generatedExs].slice(0, requiredTotal);
      
      if (type === 'cloze') {
        setClozeExercises(combined);
      } else {
        const initialAnswers: Record<number, string[]> = {};
        combined.forEach((_: any, i: number) => {
          initialAnswers[i] = [];
        });
        setOrderingAnswers(initialAnswers);
        setOrderingExercises(combined);
      }`;
      
content = content.replace(targetSet, repSet);

fs.writeFileSync('src/components/Practice.tsx', content);
