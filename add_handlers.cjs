const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const handlers = `
  const toggleMissingWordSelection = (text: string) => {
    setSelectedMissingWords(prev => prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]);
  };

  const handleMergeAndLookup = async () => {
    if (selectedMissingWords.length < 1) return;
    const mergedText = selectedMissingWords.join("");
    
    // Clear selection immediately for UX
    const partsToRemove = [...selectedMissingWords];
    setSelectedMissingWords([]);
    setIsLookingUpMerged(true);

    try {
      const response = await fetch("/api/lookup-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: mergedText })
      });
      if (response.ok) {
        const result = await response.json();
        
        // Remove parts from historical missing
        setHistoricalMissingWords(prev => {
          const next = prev.filter(t => !partsToRemove.includes(t.text));
          localStorage.setItem("historical_missing_words", JSON.stringify(next));
          return next;
        });

        // Add to custom dictionary
        setCustomDict(prev => {
          const next = { ...prev, [mergedText]: result };
          localStorage.setItem("custom_chinese_dictionary", JSON.stringify(next));
          return next;
        });

        // Save to saved words
        setSavedWords(prev => {
           const exists = prev.some(w => w.text === mergedText);
           if (exists) return prev;
           const next = [...prev, { ...result, folderId: null }];
           localStorage.setItem("saved_chinese_words", JSON.stringify(next));
           return next;
        });

        setActiveToken(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLookingUpMerged(false);
    }
  };

  const handleBulkDeleteMissing = () => {
    if (selectedMissingWords.length === 0) return;
    setConfirmAction({
      title: "Xác nhận xóa",
      message: \`Bạn có chắc chắn muốn xóa \${selectedMissingWords.length} từ đã chọn?\`,
      onConfirm: () => {
         setHistoricalMissingWords(prev => {
            const next = prev.filter(t => !selectedMissingWords.includes(t.text));
            localStorage.setItem("historical_missing_words", JSON.stringify(next));
            return next;
         });
         setSelectedMissingWords([]);
      }
    });
  };
`;

content = content.replace(
  'const handleUpdateToken = (updatedToken: Token) => {',
  handlers + '\n  const handleUpdateToken = (updatedToken: Token) => {'
);

fs.writeFileSync('src/App.tsx', content);
