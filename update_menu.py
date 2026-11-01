import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# Add Sparkles icon import
content = content.replace("Folder as FolderIcon } from 'lucide-react';", "Folder as FolderIcon, Sparkles } from 'lucide-react';")

# 1. Add state for updating word
state_pattern = r'const \[editingWordId, setEditingWordId\] = useState<string \| null>\(null\);'
state_replacement = '''const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [isUpdatingWordId, setIsUpdatingWordId] = useState<string | null>(null);'''
content = re.sub(state_pattern, state_replacement, content)

# 2. Add handleAutoUpdateWord
add_func_pattern = r'const handleAddSubmit = async \(e: React\.FormEvent\) => \{'
add_func_replacement = '''const handleAutoUpdateWord = async (wordId: string, wordText: string) => {
    if (!onUpdateWord) return;
    setIsUpdatingWordId(wordId);
    try {
      const response = await fetch('/api/lookup-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordText })
      });
      if (response.ok) {
        const data = await response.json();
        onUpdateWord(wordId, {
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
      setIsUpdatingWordId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {'''
content = re.sub(add_func_pattern, add_func_replacement, content)

# 3. Add context menu button
context_menu_pattern = r'const isCurrentlyKnown = targetWord\?\.isKnown;'
context_menu_replacement = '''const isCurrentlyKnown = targetWord?.isKnown;
                const isMissingData = targetWord && (!targetWord.pinyin || targetWord.pinyin === '?' || !targetWord.translation || targetWord.translation === '(Chưa cấp nghĩa)' || !targetWord.partOfSpeech || !targetWord.hskLevel);'''
content = re.sub(context_menu_pattern, context_menu_replacement, content)

context_menu_btn_pattern = r'\{!isBulk && \(\s*<button\s*className="w-full text-left px-4 py-2\.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*if \(targetWord\) \{\s*setEditPinyin\(targetWord\.pinyin\);\s*setEditTranslation\(targetWord\.translation\);\s*setEditPartOfSpeech\(targetWord\.partOfSpeech \|\| ""\);\s*setEditHskLevel\(targetWord\.hskLevel \|\| ""\);\s*setEditingWordId\(targetWord\.id\);\s*\}\s*setContextMenu\(null\);\s*\}\}\s*>\s*<Pencil className="w-4 h-4 text-blue-500" /> Sửa từ\s*</button>\s*\)\}'
context_menu_btn_replacement = '''{!isBulk && (
                      <>
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
                        {isMissingData && (
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-between transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (targetWord) handleAutoUpdateWord(targetWord.id, targetWord.text);
                              setContextMenu(null);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-500" /> Cập nhật (AI)
                            </div>
                          </button>
                        )}
                      </>
                    )}'''
content = re.sub(context_menu_btn_pattern, context_menu_btn_replacement, content)

# 4. Show a loading indicator on the word card itself if it's being updated
word_card_pattern = r'className=\{`group relative bg-white dark:bg-slate-800 rounded-2xl p-4 transition-all duration-300'
word_card_replacement = '''className={`group relative bg-white dark:bg-slate-800 rounded-2xl p-4 transition-all duration-300 ${isUpdatingWordId === word.id ? 'opacity-50 pointer-events-none' : ''}'''
content = content.replace(word_card_pattern, word_card_replacement)

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)

print("Done")
