import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# 1. Fix stop button
stop_button = """              {isLoading ? (
                <button
                  type="button"
                  onClick={() => {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                      abortControllerRef.current = null;
                    }
                    setIsLoading(false);
                  }}
                  className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                  title="Tạm dừng"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-white disabled:text-slate-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              )}"""

content = re.sub(r'<button\s+type="submit"\s+disabled=\{!input\.trim\(\) \|\| isLoading\}[^>]+>\s*\{isLoading \? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5 rotate-180" />\}\s*</button>', stop_button, content)


# 2. Fix Edit prompt
edit_handler = """  const handleEditPrompt = (msg: Message) => {
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx !== -1) {
      const newMessages = messages.slice(0, idx);
      setMessages(newMessages);
      setInput(msg.content);
    }
  };"""

# inject handleEditPrompt before handleSend
content = content.replace("const handleSend = async (e?: React.FormEvent) => {", edit_handler + "\n\n  const handleSend = async (e?: React.FormEvent) => {")

user_msg_render = """                <div className={`rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
                    : 'bg-transparent text-slate-800 dark:text-slate-200'
                }`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const selectedText = window.getSelection()?.toString().trim();
                    const textToUse = selectedText ? selectedText : msg.content;
                    setContextMenu({ x: e.clientX, y: e.clientY, text: textToUse, msgId: msg.id });
                  }}
                >
                  {msg.role === 'user' ? (
                    <div className="group/msg relative">
                      <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      <button
                        onClick={() => handleEditPrompt(msg)}
                        className="absolute top-1/2 -translate-y-1/2 right-[100%] mr-4 p-1.5 text-slate-400 opacity-0 group-hover/msg:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md"
                        title="Chỉnh sửa yêu cầu"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-[15px] prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700 prose-a:text-blue-600">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{cleanMarkdown(msg.content)}</ReactMarkdown>
                    </div>
                  )}
                </div>"""

content = re.sub(r'<div className={`rounded-2xl px-5 py-3.5 \$\{\s*msg\.role === \'user\' \s*\? \'bg-slate-100.*?</ReactMarkdown>\s*</div>\s*\)}\s*</div>', user_msg_render, content, flags=re.DOTALL)


# 3. Fix save session name losing on reload
# The problem is that the useEffect which syncs messages to sessions runs with dependencies [messages, currentSessionId, isInitializing]
# This effect can accidentally overwrite the name if it runs BEFORE the saveSessionName is persisted, OR if it runs with a stale prev state? No, prev is accurate.
# Let's add a sync immediately inside saveSessionName to localforage
save_session = """  const saveSessionName = (id: string) => {
    if (editSessionName.trim()) {
      setSessions(prev => {
        const newSessions = prev.map(s => s.id === id ? { ...s, name: editSessionName.trim() } : s);
        localforage.setItem('notebook_sessions', newSessions).catch(console.error);
        return newSessions;
      });
    }
    setEditingSessionId(null);
  };"""

content = re.sub(r'const saveSessionName = \(id: string\) => \{.*?setEditingSessionId\(null\);\s*\};', save_session, content, flags=re.DOTALL)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
