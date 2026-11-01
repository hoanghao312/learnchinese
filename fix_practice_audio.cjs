const fs = require('fs');
const content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const searchStr1 = `                                    onPointerUp={(e) => {
                                      const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                                      const startY = parseFloat(e.currentTarget.dataset.startY || '0');
                                      const distance = Math.hypot(e.clientX - startX, e.clientY - startY);
                                      if (distance < 5 && !orderingChecked) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: userAnswer.filter(u => u.id !== item.id) }));
                                      }
                                    }}`;

const replaceStr1 = `                                    onPointerUp={(e) => {
                                      const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                                      const startY = parseFloat(e.currentTarget.dataset.startY || '0');
                                      const distance = Math.hypot(e.clientX - startX, e.clientY - startY);
                                      if (distance < 5 && !orderingChecked) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: userAnswer.filter(u => u.id !== item.id) }));
                                      } else if (distance < 5 && orderingChecked) {
                                        speakMandarin(item.text, 0.9);
                                      }
                                    }}`;

const searchStr2 = `                                    onClick={() => {
                                      if (!orderingChecked && !isUsed) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                      }
                                    }}`;

const replaceStr2 = `                                    onClick={() => {
                                      if (!orderingChecked && !isUsed) {
                                        speakMandarin(word, 0.9);
                                        setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                      }
                                    }}`;

let newContent = content;

if (newContent.includes(searchStr1)) {
  newContent = newContent.replace(searchStr1, replaceStr1);
  console.log("Successfully added audio to ordered words");
} else {
  console.log("Could not find search string 1");
}

if (newContent.includes(searchStr2)) {
  newContent = newContent.replace(searchStr2, replaceStr2);
  console.log("Successfully added audio to word bank words");
} else {
  console.log("Could not find search string 2");
}

fs.writeFileSync('src/components/Practice.tsx', newContent);
