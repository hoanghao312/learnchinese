import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# Replace NotebookChatProps
content = re.sub(
    r'interface NotebookChatProps \{[\s\S]*?\}',
    'interface NotebookChatProps {\n  onClose?: () => void;\n  onSendToLearning?: (text: string) => void;\n  savedWords?: any[];\n}',
    content
)

# Replace function signature
content = re.sub(
    r'export default function NotebookChat\(\{ onClose, onSendToLearning \}: NotebookChatProps\) \{',
    'export default function NotebookChat({ onClose, onSendToLearning, savedWords = [] }: NotebookChatProps) {',
    content
)

# Remove source states
content = re.sub(r'const \[sources, setSources\] = useState<Source\[\]>\(\[\]\);\n', '', content)
content = re.sub(r'const \[showUploader, setShowUploader\] = useState\(false\);\n', '', content)
content = re.sub(r'const \[sidebarTab, setSidebarTab\] = useState<\'sources\' \| \'history\'>\(\'sources\'\);\n', '', content)


# Remove localforage notebook_sources load
loadData_old = r"""        const savedSources = await localforage.getItem<Source\[\]>\('notebook_sources'\);
        if \(savedSources && savedSources.length > 0\) \{
          setSources\(savedSources\);
        \}
        
        const savedSessions ="""
loadData_new = r"""        const savedSessions ="""
content = re.sub(loadData_old, loadData_new, content)

# Remove localforage notebook_sources save
save_sources = r"""  useEffect\(\(\) => \{
    localforage.setItem\('notebook_sources', sources\);
  \}, \[sources\]\);"""
content = re.sub(save_sources, '', content)

# Remove selectAllSources, toggleSourceSelection
funcs_to_remove = r"""  const selectAllSources = \(\) => \{
    const allSelected = sources.every\(s => s.selected\);
    setSources\(prev => prev.map\(s => \(\{ \.\.\.s, selected: !allSelected \}\)\)\);
  \};

  const toggleSourceSelection = \(id: string\) => \{
    setSources\(prev => prev.map\(s => s.id === id \? \{ \.\.\.s, selected: !s.selected \} : s\)\);
  \};"""
content = re.sub(funcs_to_remove, '', content)

# Rewrite handleSend
def replace_handle_send(match):
    return """  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!savedWords || savedWords.length === 0) {
      alert("Bạn chưa có từ vựng nào trong thư viện để làm ngữ cảnh.");
      return;
    }

    // Build context from vocabulary
    const vocabularyList = savedWords.map(w => 
      `- ${w.text} (${w.pinyin}): ${w.translation} ${w.partOfSpeech ? '[' + w.partOfSpeech + ']' : ''}`
    ).join('\\n');
    
    const combinedContext = `TÀI LIỆU (DANH SÁCH TỪ VỰNG CỦA TÔI):\\n${vocabularyList}`;

    const userText = input.trim();
    setInput('');
    setInputHeight(52);
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/notebook-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: messages.filter(m => m.id !== 'welcome'),
          message: userText,
          documentContext: combinedContext
        })"""

content = re.sub(
    r'  const handleSend = async \(e\?: React\.FormEvent\) => \{[\s\S]*?body: JSON\.stringify\(\{\n          history: messages\.filter\(m => m\.id !== \'welcome\'\),\n          message: userText,\n          documentContext: combinedContext\n        \}\)',
    replace_handle_send,
    content
)

# Rewrite Sidebar UI (remove tabs, show only history)
sidebar_ui_old = r"""              <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
                  <button 
                    onClick=\{\(\) => setSidebarTab\('sources'\)\}
                    className=\{`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors \$\{sidebarTab === 'sources' \? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'\}\`\}
                  >
                    Nguồn
                  </button>
                  <button 
                    onClick=\{\(\) => setSidebarTab\('history'\)\}
                    className=\{`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors \$\{sidebarTab === 'history' \? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'\}\`\}
                  >
                    Đoạn chat
                  </button>
                </div>
                <button onClick=\{\(\) => setIsSidebarOpen\(false\)\} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>

              \{sidebarTab === 'sources' \? \(
                <>
                  \{\/\* Add Source Button \*\/\}
                  <div className="p-4 shrink-0">
                    <button 
                      onClick=\{\(\) => setShowUploader\(true\)\}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm nguồn
                    </button>
                  </div>

                  \{\/\* Search Box \(Mock\) \*\/\}
                  <div className="px-4 pb-3 shrink-0">
                    <div className="relative">
                      <input type="text" placeholder="Tìm nguồn mới trên web" className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 outline-none placeholder:text-slate-500" disabled />
                      <Search className="absolute right-4 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  \{\/\* Select All \*\/\}
                  \{sources.length > 0 && \(
                    <div className="px-6 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 shrink-0">
                      <span className="text-sm font-medium text-slate-500"></span>
                      <button onClick=\{selectAllSources\} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2">
                        Chọn tất cả
                        <div className=\{`w-5 h-5 rounded flex items-center justify-center \$\{sources.every\(s => s.selected\) \? 'bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-800 border border-slate-300'\}\`\}>
                          \{sources.every\(s => s.selected\) && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />\}
                        </div>
                      </button>
                    </div>
                  \)\}
                  
                  \{\/\* Sources List \*\/\}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    \{sources.length === 0 \? \(
                      <div className="text-center p-6 text-slate-400 text-sm">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Chưa có nguồn tài liệu nào.
                      </div>
                    \) : \(
                      sources.map\(\(source\) => \(
                        <div 
                          key=\{source.id\}
                          className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        >
                          <div 
                            className="flex-1 flex items-center gap-3 min-w-0"
                            onClick=\{\(\) => toggleSourceSelection\(source.id\)\}
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate" title=\{source.name\}>\{source.name\}</span>
                          </div>
                          
                          <button 
                            onClick=\{\(e\) => \{
                              e.stopPropagation\(\);
                              setSources\(prev => prev.filter\(s => s.id !== source.id\)\);
                            \}\}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Xóa nguồn này"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div 
                            onClick=\{\(\) => toggleSourceSelection\(source.id\)\}
                            className=\{`w-5 h-5 rounded flex items-center justify-center shrink-0 \$\{source.selected \? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white' : 'bg-white border-2 border-slate-200 dark:border-slate-600'\}\`\}
                          >
                            \{source.selected && <Check className="w-3.5 h-3.5" />\}
                          </div>
                        </div>
                      \)\)
                    \)\}
                  </div>
                </>
              \) : \("""

sidebar_ui_new = r"""              <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
                  <div className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">
                    Đoạn chat
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>

              <>"""
content = re.sub(sidebar_ui_old, sidebar_ui_new, content)

# Remove the closing brace of the conditional we just removed
closing_old = r"""                  </div>
                </>
              \)}"""
closing_new = r"""                  </div>
                </>"""
content = re.sub(closing_old, closing_new, content)

# Remove Uploader modal
content = re.sub(r'\{showUploader && \([\s\S]*?\}\)\}\s*/>\s*</div>\s*</motion\.div>\s*</motion\.div>\s*\)\}', '', content)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)
