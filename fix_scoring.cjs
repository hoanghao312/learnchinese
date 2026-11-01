const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const target1 = `  const calculateOrderingScore = () => {
    let score = 0;
    orderingExercises.forEach((ex, i) => {
      if (orderingAnswers[i]?.join('') === ex.correctSentence) score++;
    });
    return score;
  };`;

const rep1 = `  const calculateOrderingScore = () => {
    let score = 0;
    const normalize = (str) => (str || '').replace(/[\\s.,!?。，！？、]/g, '');
    orderingExercises.forEach((ex, i) => {
      if (normalize(orderingAnswers[i]?.join('')) === normalize(ex.correctSentence)) score++;
    });
    return score;
  };`;

content = content.replace(target1, rep1);

const target2 = `const answerCounts = getWordCounts(userAnswer);

                  const isCorrect = userAnswer.join('') === ex.correctSentence;`;

const rep2 = `const answerCounts = getWordCounts(userAnswer);

                  const normalize = (str) => (str || '').replace(/[\\s.,!?。，！？、]/g, '');
                  const isCorrect = normalize(userAnswer.join('')) === normalize(ex.correctSentence);`;

content = content.replace(target2, rep2);

fs.writeFileSync('src/components/Practice.tsx', content);
