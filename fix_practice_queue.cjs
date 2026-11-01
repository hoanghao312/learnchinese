const fs = require('fs');
const content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const searchStr1 = `                                    onPointerDown={(e) => {
                                      e.currentTarget.dataset.startX = e.clientX.toString();
                                      e.currentTarget.dataset.startY = e.clientY.toString();
                                      speakMandarin(item.text, 0.9);
                                    }}`;

const replaceStr1 = `                                    onPointerDown={(e) => {
                                      e.currentTarget.dataset.startX = e.clientX.toString();
                                      e.currentTarget.dataset.startY = e.clientY.toString();
                                      speakMandarin(item.text, 0.9, undefined, undefined, undefined, true);
                                    }}`;

const searchStr2 = `                                    onPointerDown={() => {
                                      if (!orderingChecked && !isUsed) {
                                        speakMandarin(word, 0.9);
                                      }
                                    }}`;

const replaceStr2 = `                                    onPointerDown={() => {
                                      if (!orderingChecked && !isUsed) {
                                        speakMandarin(word, 0.9, undefined, undefined, undefined, true);
                                      }
                                    }}`;

let newContent = content;

if (newContent.includes(searchStr1)) {
    newContent = newContent.replace(searchStr1, replaceStr1);
    console.log("Updated Reorder.Item audio call");
} else {
    console.log("Could not find Reorder.Item audio call");
}

if (newContent.includes(searchStr2)) {
    newContent = newContent.replace(searchStr2, replaceStr2);
    console.log("Updated Word Bank audio call");
} else {
    console.log("Could not find Word Bank audio call");
}

fs.writeFileSync('src/components/Practice.tsx', newContent);
