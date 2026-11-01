const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// Replace state
content = content.replace(
  /const \[isDraggingToSelect, setIsDraggingToSelect\] = useState\(false\);/,
  `const [dragAction, setDragAction] = useState<'select' | 'deselect' | null>(null);`
);

// Replace onMouseUp and onMouseLeave
content = content.replace(/setIsDraggingToSelect\(false\)/g, `setDragAction(null)`);

const rowStartRegex = /className=\{\`group relative flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 border \$\{isSelected \? 'border-amber-400 bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-800\/80 hover:border-amber-300 dark:hover:border-amber-700\/80'\} rounded-xl px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300 w-full select-none\`\}\n\s*id=\{\`saved-card-\$\{word\.id\}\`\}\n\s*onMouseDown=\{\(e\) => \{\n\s*if \(e\.button === 0 && \(e\.ctrlKey \|\| e\.metaKey\) && \(e\.target as HTMLElement\)\.tagName !== 'BUTTON' && \(e\.target as HTMLElement\)\.tagName !== 'INPUT'\) \{\n\s*setIsDraggingToSelect\(true\);\n\s*\}\n\s*\}\}\n\s*onMouseEnter=\{\(e\) => \{\n\s*if \(isDraggingToSelect && \(e\.ctrlKey \|\| e\.metaKey\)\) \{\n\s*const newSet = new Set\(selectedWordIds\);\n\s*newSet\.add\(word\.id\);\n\s*setSelectedWordIds\(newSet\);\n\s*\}\n\s*\}\}\n\s*onClick=\{\(e\) => \{\n\s*e\.preventDefault\(\);\n\s*if \(e\.ctrlKey \|\| e\.metaKey\) \{\n\s*const newSet = new Set\(selectedWordIds\);\n\s*if \(newSet\.has\(word\.id\)\) \{\n\s*newSet\.delete\(word\.id\);\n\s*\} else \{\n\s*newSet\.add\(word\.id\);\n\s*setLastSelectedIndex\(index\);\n\s*\}\n\s*setSelectedWordIds\(newSet\);\n\s*\} else if \(e\.shiftKey && lastSelectedIndex !== null\) \{\n\s*const newSet = new Set\(selectedWordIds\);\n\s*const start = Math\.min\(lastSelectedIndex, index\);\n\s*const end = Math\.max\(lastSelectedIndex, index\);\n\s*for \(let i = start; i <= end; i\+\+\) \{\n\s*newSet\.add\(paginatedWords\[i\]\.id\);\n\s*\}\n\s*setSelectedWordIds\(newSet\);\n\s*\} else \{\n\s*speakMandarin\(word\.text\);\n\s*\}\n\s*\}\}/;

const rowReplacement = `className={\`group relative flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 border \${isSelected ? 'border-amber-400 bg-slate-200 dark:bg-slate-700' : 'border-slate-200 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-700/80'} rounded-xl px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300 w-full select-none\`}
                  id={\`saved-card-\${word.id}\`}
                  onMouseDown={(e) => {
                    if (e.button === 0 && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                      if (e.ctrlKey || e.metaKey) {
                        const isCurrentlySelected = selectedWordIds.has(word.id);
                        const action = isCurrentlySelected ? 'deselect' : 'select';
                        setDragAction(action);
                        const newSet = new Set(selectedWordIds);
                        if (isCurrentlySelected) {
                          newSet.delete(word.id);
                        } else {
                          newSet.add(word.id);
                          setLastSelectedIndex(index);
                        }
                        setSelectedWordIds(newSet);
                      } else if (e.shiftKey && lastSelectedIndex !== null) {
                        const newSet = new Set(selectedWordIds);
                        const start = Math.min(lastSelectedIndex, index);
                        const end = Math.max(lastSelectedIndex, index);
                        for (let i = start; i <= end; i++) {
                          newSet.add(paginatedWords[i].id);
                        }
                        setSelectedWordIds(newSet);
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (dragAction && (e.ctrlKey || e.metaKey)) {
                      const newSet = new Set(selectedWordIds);
                      if (dragAction === 'select') {
                        newSet.add(word.id);
                      } else if (dragAction === 'deselect') {
                        newSet.delete(word.id);
                      }
                      setSelectedWordIds(newSet);
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && (e.target as HTMLElement).tagName !== 'INPUT') {
                      const newSet = new Set([word.id]);
                      setSelectedWordIds(newSet);
                      setLastSelectedIndex(index);
                      speakMandarin(word.text);
                    }
                  }}`;

content = content.replace(rowStartRegex, rowReplacement);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
