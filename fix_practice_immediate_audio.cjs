const fs = require('fs');
const content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// Update Reorder.Item
let newContent = content;
const searchReorderDown = `                                    onPointerDown={(e) => {
                                      e.currentTarget.dataset.startX = e.clientX.toString();
                                      e.currentTarget.dataset.startY = e.clientY.toString();
                                    }}`;

const replaceReorderDown = `                                    onPointerDown={(e) => {
                                      e.currentTarget.dataset.startX = e.clientX.toString();
                                      e.currentTarget.dataset.startY = e.clientY.toString();
                                      speakMandarin(item.text, 0.9);
                                    }}`;

if (newContent.includes(searchReorderDown)) {
    newContent = newContent.replace(searchReorderDown, replaceReorderDown);
} else {
    console.log("Could not find searchReorderDown");
}

const searchReorderUp = `                                      if (distance < 5 && !orderingChecked) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: userAnswer.filter(u => u.id !== item.id) }));
                                      } else if (distance < 5 && orderingChecked) {
                                        speakMandarin(item.text, 0.9);
                                      }`;

const replaceReorderUp = `                                      if (distance < 5 && !orderingChecked) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: userAnswer.filter(u => u.id !== item.id) }));
                                      }`;

if (newContent.includes(searchReorderUp)) {
    newContent = newContent.replace(searchReorderUp, replaceReorderUp);
} else {
    console.log("Could not find searchReorderUp");
}

// Update Word Bank Item
const searchWordBankClick = `                                    onClick={() => {
                                      if (!orderingChecked && !isUsed) {
                                        speakMandarin(word, 0.9);
                                        setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                      }
                                    }}`;

const replaceWordBankClick = `                                    onPointerDown={() => {
                                      if (!orderingChecked && !isUsed) {
                                        speakMandarin(word, 0.9);
                                      }
                                    }}
                                    onClick={() => {
                                      if (!orderingChecked && !isUsed) {
                                        setOrderingAnswers(prev => ({ ...prev, [i]: [...(prev[i] || []), { id: Math.random().toString(36).substr(2, 9), text: word }] }));
                                      }
                                    }}`;

if (newContent.includes(searchWordBankClick)) {
    newContent = newContent.replace(searchWordBankClick, replaceWordBankClick);
} else {
    console.log("Could not find searchWordBankClick");
}

fs.writeFileSync('src/components/Practice.tsx', newContent);
console.log("Done updating practice audio triggers");
