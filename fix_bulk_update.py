import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# 1. Update state
content = content.replace('const [isUpdatingWordId, setIsUpdatingWordId] = useState<string | null>(null);', 'const [updatingWordIds, setUpdatingWordIds] = useState<Set<string>>(new Set());')

# 2. Update handleAutoUpdateWord -> handleAutoUpdateWords
old_handle_pattern = r'const handleAutoUpdateWord = async \(wordId: string, wordText: string\) => \{[\s\S]*?setIsUpdatingWordId\(null\);\s*\}\s*\};'
new_handle = '''const handleAutoUpdateWords = async (targets: {id: string, text: string}[]) => {
    if (!onUpdateWord) return;
    
    setUpdatingWordIds(prev => {
      const next = new Set(prev);
      targets.forEach(t => next.add(t.id));
      return next;
    });

    for (const target of targets) {
      try {
        const response = await fetch('/api/lookup-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: target.text })
        });
        if (response.ok) {
          const data = await response.json();
          onUpdateWord(target.id, {
            pinyin: data.pinyin || undefined,
            translation: data.translation || undefined,
            partOfSpeech: data.partOfSpeech || undefined,
            hskLevel: data.hskLevel || undefined,
            example: data.example || undefined
          });
        }
      } catch (error) {
        console.error("Failed to auto update word:", error);
      } finally {
        setUpdatingWordIds(prev => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
      }
    }
  };'''
content = re.sub(old_handle_pattern, new_handle, content)

# 3. Fix word card rendering
# Note: I'll use regex to fix `isUpdatingWordId === word.id` to `updatingWordIds.has(word.id)`
content = content.replace('isUpdatingWordId === word.id', 'updatingWordIds.has(word.id)')

# 4. Fix Context Menu
menu_pattern = r'''\{!isBulk && \(\s*<>\s*<button\s*className="w-full text-left px-4 py-2\.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"[\s\S]*?<Pencil className="w-4 h-4 text-blue-500" /> Sửa từ\s*</button>\s*\{isMissingData && \(\s*<button[\s\S]*?Cập nhật \(AI\)\s*</div>\s*</button>\s*\)\}\s*</>\s*\)\}'''
new_menu = '''{!isBulk && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (targetWord) {
                            setEditPinyin(targetWord.pinyin);
                            setEditTranslation(targetWord.translation);
                            setEditPartOfSpeech(targetWord.partOfSpeech || "");
                            setEditHskLevel(targetWord.hskLevel || "");
                            setEditingWordId(targetWord.id);
                          }
                          setContextMenu(null);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-blue-500" /> Sửa từ
                      </button>
                    )}
                    
                    {/* Bulk update support */}
                    {(isBulk || isMissingData) && (
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-between transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targets = isBulk 
                            ? targetIds.map(id => savedWords.find(w => w.id === id)).filter(Boolean) as {id: string, text: string}[]
                            : (targetWord ? [{id: targetWord.id, text: targetWord.text}] : []);
                          
                          if (targets.length > 0) {
                            handleAutoUpdateWords(targets);
                          }
                          
                          if (isBulk) setSelectedWordIds(new Set());
                          setContextMenu(null);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" /> Cập nhật (AI) {isBulk && `(${targetIds.length})`}
                        </div>
                      </button>
                    )}'''
content = re.sub(menu_pattern, new_menu, content)

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)

print("Done")
