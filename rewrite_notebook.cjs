const fs = require('fs');

const code = `import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen, X, FileText, ArrowLeft, Plus, CheckSquare, Square, Search, PanelLeftClose, PanelLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import FileUploader from './FileUploader';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface Source {
  id: string;
  name: string;
  content: string;
  selected: boolean;
}

interface NotebookChatProps {
  onClose?: () => void;
}

export default function NotebookChat({ onClose }: NotebookChatProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Chào mừng bạn đến với Notebook Chat! Hãy thêm tài liệu vào cột bên trái và bắt đầu đặt câu hỏi. Mình sẽ chỉ trả lời dựa trên những tài liệu bạn đã chọn.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(52);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = inputHeight;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return;
    const deltaY = startYRef.current - e.clientY;
    const newHeight = Math.max(52, Math.min(300, startHeightRef.current + deltaY));
    setInputHeight(newHeight);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isResizingRef.current) {
      isResizingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleSourceSelection = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };
  
  const selectAllSources = () => {
    const allSelected = sources.every(s => s.selected);
    setSources(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const selectedSources = sources.filter(s => s.selected);
    if (selectedSources.length === 0) {
      alert("Vui lòng chọn ít nhất một nguồn tài liệu để đặt câu hỏi.");
      return;
    }

    const combinedContext = selectedSources.map(s => \`TÀI LIỆU: \${s.name}\\nNỘI DUNG:\\n\${s.content}\`).join('\\n\\n---\\n\\n');

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
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          assistantMsg.content += text;
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...assistantMsg };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: 'Xin lỗi, đã có lỗi xảy ra. Bạn thử lại nhé.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-4 p-2 bg-[#f0f4f9] dark:bg-slate-900 overflow-hidden text-slate-800 dark:text-slate-200">
      
      {/* Left Sidebar - Sources */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="h-full flex-shrink-0"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl h-full flex flex-col border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden w-[320px]">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-medium">Nguồn</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>

              {/* Add Source Button */}
              <div className="p-4">
                <button 
                  onClick={() => setShowUploader(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Thêm nguồn
                </button>
              </div>

              {/* Search Box (Mock) */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <input type="text" placeholder="Tìm nguồn mới trên web" className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 outline-none placeholder:text-slate-500" disabled />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Select All */}
              {sources.length > 0 && (
                <div className="px-6 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-500"></span>
                  <button onClick={selectAllSources} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2">
                    Chọn tất cả
                    <div className={\`w-5 h-5 rounded flex items-center justify-center \${sources.every(s => s.selected) ? 'bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-800 border border-slate-300'}\`}>
                       {sources.every(s => s.selected) && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />}
                    </div>
                  </button>
                </div>
              )}

              {/* Sources List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sources.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 text-sm">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Chưa có nguồn tài liệu nào.
                  </div>
                ) : (
                  sources.map((source) => (
                    <div 
                      key={source.id}
                      onClick={() => toggleSourceSelection(source.id)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium truncate" title={source.name}>{source.name}</span>
                      <div className={\`w-5 h-5 rounded flex items-center justify-center shrink-0 \${source.selected ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white' : 'bg-white border-2 border-slate-200 dark:border-slate-600'}\`}>
                        {source.selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Content - Chat Area */}
      <div className="flex-1 h-full flex flex-col min-w-0 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">Cuộc trò chuyện</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-full\`}>
              <div className={\`flex items-start gap-3 max-w-[85%] \${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}\`}>
                
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 mt-1">
                    <SparklesIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}

                <div className={\`rounded-2xl px-5 py-3.5 \${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
                    : 'bg-transparent text-slate-800 dark:text-slate-200'
                }\`}>
                  {msg.role === 'user' ? (
                    <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    <div className="text-[15px] prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700 prose-a:text-blue-600">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <div className="flex justify-start max-w-full">
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 mt-1">
                  <SparklesIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="px-5 py-3.5 flex items-center gap-1.5 h-12">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Floating Notification for new features */}
        {messages.length === 1 && sources.length === 0 && (
          <div className="mx-auto mb-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs flex items-center gap-2 border border-emerald-100 shadow-sm max-w-md text-center">
            <BookOpen className="w-4 h-4" />
            Gemini Notebook nay đã thông minh hơn. Hãy thêm nguồn tài liệu để bắt đầu.
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700/50">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-3xl mx-auto">
            <div className="relative w-full bg-slate-100 dark:bg-slate-700/50 rounded-3xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-slate-300 dark:focus-within:ring-slate-500 transition-all shadow-sm">
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-4 cursor-ns-resize flex items-center justify-center group z-10"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full group-hover:bg-slate-400 transition-colors" />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Chat về tài liệu..."
                className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 border-0 px-6 py-4 pr-16 focus:outline-none resize-none"
                style={{ 
                  height: \`\${inputHeight}px\`,
                  minHeight: '56px',
                  maxHeight: '300px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  const newHeight = Math.max(56, Math.min(target.scrollHeight, 300));
                  if (newHeight > inputHeight) {
                    setInputHeight(newHeight);
                  } else {
                    target.style.height = \`\${inputHeight}px\`;
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-white disabled:text-slate-500 transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5 rotate-180" />}
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
             <p className="text-[11px] text-slate-400">NotebookLM có thể mắc lỗi. Hãy xác minh lại thông tin quan trọng.</p>
          </div>
        </div>

      </div>

      {/* Uploader Modal */}
      <AnimatePresence>
        {showUploader && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Thêm nguồn tài liệu mới</h3>
                <button onClick={() => setShowUploader(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <FileUploader 
                  onTextLoaded={(text, name) => {
                    setSources(prev => {
                      if (!prev.find(s => s.name === name)) {
                        return [...prev, { id: Date.now().toString(), name, content: text, selected: true }];
                      }
                      return prev;
                    });
                    setShowUploader(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
`;

fs.writeFileSync('src/components/NotebookChat.tsx', code);
