import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Let's find the broken string using regex and replace it
# The broken string starts with `if (!finalWordData              onAddWords`

pattern = re.compile(r'if \(!finalWordData              onAddWords=\{async \(newWordsData\) => \{.*?saveWordsList\(newCombined\);\s*\}\}\s*\/>', re.DOTALL)

replacement = """if (!finalWordData.hskLevel && data.hskLevel) finalWordData.hskLevel = data.hskLevel;
                        if (!finalWordData.example && data.example) finalWordData.example = data.example;
                     }
                   } catch (e) {
                     console.error("Tra từ phụ trợ thất bại:", e);
                   }
                }
                
                if (!finalWordData.translation) finalWordData.translation = "(Chưa cấp nghĩa)";
                if (!finalWordData.pinyin) finalWordData.pinyin = "?";

                if (!latestDict[finalWordData.text] || latestDict[finalWordData.text].translation === "(Chưa cấp nghĩa)") {
                   latestDict[finalWordData.text] = {
                      pinyin: finalWordData.pinyin,
                      translation: finalWordData.translation !== "(Chưa cấp nghĩa)" ? finalWordData.translation : undefined,
                      partOfSpeech: finalWordData.partOfSpeech,
                   };
                   localStorage.setItem("custom_chinese_dictionary", JSON.stringify(latestDict));
                   setCustomDict(latestDict);
                }

                const newWord = {
                  ...finalWordData,
                  id: crypto.randomUUID(),
                  savedAt: Date.now(),
                  isKnown: false
                };
                saveWordsList([newWord, ...savedWords]);
              }}
              onAddWords={async (newWordsData) => {
                const newWordsToAdd = [];
                const savedDictStr = localStorage.getItem("custom_chinese_dictionary") || "{}";
                let latestDict = {};
                try { latestDict = JSON.parse(savedDictStr); } catch (_) {}
                let dictChanged = false;
                
                const processWord = async (wordData) => {
                  let finalWordData = { ...wordData };
                  
                  const customEntry = latestDict[wordData.text];
                  if (customEntry) {
                     finalWordData.pinyin = finalWordData.pinyin || customEntry.pinyin;
                     finalWordData.translation = finalWordData.translation || customEntry.translation;
                     finalWordData.partOfSpeech = finalWordData.partOfSpeech || customEntry.partOfSpeech;
                  }
                  
                  if (!finalWordData.translation || !finalWordData.pinyin || !finalWordData.hskLevel) {
                     try {
                       const response = await fetch("/api/lookup-word", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ word: wordData.text })
                       });
                       const data = await response.json();
                       if (data) {
                          if (!finalWordData.translation && data.translation) finalWordData.translation = data.translation;
                          if (!finalWordData.pinyin && data.pinyin) finalWordData.pinyin = data.pinyin;
                          if (!finalWordData.partOfSpeech && data.partOfSpeech) finalWordData.partOfSpeech = data.partOfSpeech;
                          if (!finalWordData.hskLevel && data.hskLevel) finalWordData.hskLevel = data.hskLevel;
                          if (!finalWordData.example && data.example) finalWordData.example = data.example;
                       }
                     } catch (e) {
                       console.error("Tra từ phụ trợ thất bại:", e);
                     }
                  }
                  
                  if (!finalWordData.translation) finalWordData.translation = "(Chưa cấp nghĩa)";
                  if (!finalWordData.pinyin) finalWordData.pinyin = "?";
                  return finalWordData;
                };

                const chunkSize = 5;
                for (let i = 0; i < newWordsData.length; i += chunkSize) {
                  const chunk = newWordsData.slice(i, i + chunkSize);
                  const processedChunk = await Promise.all(chunk.map(processWord));
                  
                  for (const finalWordData of processedChunk) {
                    if (!latestDict[finalWordData.text] || latestDict[finalWordData.text].translation === "(Chưa cấp nghĩa)") {
                       latestDict[finalWordData.text] = {
                          pinyin: finalWordData.pinyin,
                          translation: finalWordData.translation !== "(Chưa cấp nghĩa)" ? finalWordData.translation : undefined,
                          partOfSpeech: finalWordData.partOfSpeech,
                       };
                       dictChanged = true;
                    }
                    newWordsToAdd.push({
                      ...finalWordData,
                      id: crypto.randomUUID(),
                      savedAt: Date.now(),
                      isKnown: false
                    });
                  }
                }
                
                if (dictChanged) {
                    localStorage.setItem("custom_chinese_dictionary", JSON.stringify(latestDict));
                    setCustomDict(latestDict);
                }
                
                const currentSaved = savedWords;
                const newCombined = [...newWordsToAdd, ...currentSaved];
                saveWordsList(newCombined);
              }}
            />"""

new_content = pattern.sub(replacement, content)

if content == new_content:
    print("Failed to replace string")
else:
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced string")

