import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# 1. Add new state for editing and abortController
state_additions = """  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgContent, setEditMsgContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);"""
content = re.sub(r'const \[isLoading, setIsLoading\] = useState\(false\);', r'const [isLoading, setIsLoading] = useState(false);\n' + state_additions, content)

# 2. Extract executeChat and handleStop logic
execute_chat = """  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const executeChat = async (text: string, currentHistory: Message[]) => {
    if (!savedWords || savedWords.length === 0) {
      alert("Bạn chưa có từ vựng nào trong thư viện để làm ngữ cảnh.");
      return;
    }

    const sortedWords = [...savedWords].sort((a, b) => {
      const getHskWeight = (level?: string) => {
        if (!level) return 3.5;
        const match = level.match(/HSK\\s*(\\d+)/i);
        if (match) return parseInt(match[1]);
        return 3.5;
      };
      const weightA = getHskWeight(a.hskLevel);
      const weightB = getHskWeight(b.hskLevel);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return (b.savedAt || 0) - (a.savedAt || 0);
    });

    const vocabularyList = sortedWords.map((w, index) => {
      let info = `${index + 1}. Từ vựng: ${w.text} | Pinyin: ${w.pinyin} | Nghĩa: ${w.translation}`;
      if (w.hskLevel) info += ` | Cấp độ: ${w.hskLevel}`;
      if (w.partOfSpeech) info += ` | Từ loại: ${w.partOfSpeech}`;
      if (w.example) info += ` | Ví dụ: ${w.example.chinese} (${w.example.pinyin}) - ${w.example.vietnamese}`;
      return info;
    }).join('\\n');
    
    const combinedContext = `TÀI LIỆU (DANH SÁCH TỪ VỰNG CỦA TÔI):\\n${vocabularyList}`;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const historyWithUser = [...currentHistory, userMsg];
    setMessages(historyWithUser);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/notebook-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          history: currentHistory.filter(m => m.id !== 'welcome'),
          message: text,
          documentContext: combinedContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const textChunk = decoder.decode(value, { stream: true });
          assistantMsg.content += textChunk;
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...assistantMsg };
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: error.message || 'Xin lỗi, đã có lỗi xảy ra. Bạn thử lại nhé.'
      }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');
    setInputHeight(52);
    await executeChat(userText, messages);
  };

  const handleEditSubmit = async (msgId: string) => {
    const index = messages.findIndex(m => m.id === msgId);
    if (index === -1) return;
    const newHistory = messages.slice(0, index);
    const newText = editMsgContent.trim();
    if (!newText) {
       setEditingMsgId(null);
       return;
    }
    setEditingMsgId(null);
    await executeChat(newText, newHistory);
  };"""

# Replace the existing handleSend with the new executeChat and handleSend
import re
# We need to find `const handleSend = async` and replace up to `setIsLoading(false); \n    }\n  };`
pattern = r'const handleSend = async \(e\?: React\.FormEvent\) => \{[\s\S]*?setIsLoading\(false\);\s*\}\s*\};'
content = re.sub(pattern, execute_chat, content)

# 3. Update UI: Edit button for user message
user_msg_pattern = r'\{msg\.role === \'user\' \? \(\s*<div className="flex flex-col items-end gap-1 w-full max-w-\[85%\] sm:max-w-\[75%\] ml-auto">\s*<div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-2\.5 text-\[15px\] shadow-sm whitespace-pre-wrap leading-relaxed">\s*\{msg\.content\}\s*</div>\s*</div>\s*\)'
user_msg_replacement = """{msg.role === 'user' ? (
                      <div className="flex flex-col items-end gap-1 w-full max-w-[85%] sm:max-w-[75%] ml-auto">
                        <div className="group relative flex items-start justify-end w-full">
                          {editingMsgId === msg.id ? (
                            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                              <textarea
                                className="w-full bg-transparent resize-none focus:outline-none text-slate-800 dark:text-slate-200 text-[15px]"
                                value={editMsgContent}
                                onChange={e => setEditMsgContent(e.target.value)}
                                rows={Math.min(10, editMsgContent.split('\\n').length || 1)}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setEditingMsgId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Hủy</button>
                                <button onClick={() => handleEditSubmit(msg.id)} className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors">Gửi lại</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {!isLoading && (
                                <button 
                                  onClick={() => { setEditingMsgId(msg.id); setEditMsgContent(msg.content); }}
                                  className="absolute -left-10 top-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800 rounded-lg"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-[15px] shadow-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )"""
content = re.sub(user_msg_pattern, user_msg_replacement, content)

# 4. Update UI: Stop button replacing Send button when loading
send_button_pattern = r'<button\s*type="submit"\s*disabled=\{!input\.trim\(\)\}\s*className="absolute right-2 top-1\.5 p-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:hover:bg-teal-600 rounded-xl shadow-sm flex items-center justify-center"\s*>\s*<Send className="w-5 h-5" />\s*</button>'
send_button_replacement = """{isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="absolute right-2 top-1.5 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors rounded-xl shadow-sm flex items-center justify-center"
                  title="Dừng tạo"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="absolute right-2 top-1.5 p-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:hover:bg-teal-600 rounded-xl shadow-sm flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}"""
content = re.sub(send_button_pattern, send_button_replacement, content)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done notebook")
