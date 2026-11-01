import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, Minimize2, Maximize2, BookOpen, Copy, Trash2, Edit2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface AssistantChatProps {
  onClose?: () => void;

  onSendToLearning?: (text: string) => void;
}


function cleanMarkdown(text: string) {
  if (!text) return text;
  return text
    .replace(/\*\*\*\*/g, '') // Xóa các lỗi 4 dấu sao do AI sinh ra
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Chuyển đổi in đậm thành HTML để tránh lỗi Markdown
    .replace(/\*\*/g, '') // Xóa toàn bộ các dấu sao đôi còn sót lại
    .replace(/\bon[a-zA-Z]+\s*=\s*"[^"]*"/gi, '') // Xóa các sự kiện inline như onClick="..."
    .replace(/\bon[a-zA-Z]+\s*=\s*'[^']*'/gi, ''); // Xóa các sự kiện inline như onClick='...'
}

export default function AssistantChat({ onClose, onSendToLearning }: AssistantChatProps) {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string, msgId: string} | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const defaultMessage: Message = {
    id: '1',
    role: 'model',
    content: 'Chào bạn! Mình là trợ lý ảo tiếng Trung. Mình có thể giúp bạn dịch, giải nghĩa từ vựng, sửa lỗi phát âm, hoặc luyện giao tiếp. Bạn cần mình giúp gì nào?'
  };
  const [messages, setMessages] = useState<Message[]>([defaultMessage]);
  const [input, setInput] = useState(() => localStorage.getItem('assistant_chat_draft') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgContent, setEditMsgContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [inputHeight, setInputHeight] = useState(52);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('assistant_chat_draft', input);
  }, [input]);
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
    messagesEndRef.current?.scrollIntoView({ behavior: isLoading ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const executeChat = async (text: string, currentHistory: Message[]) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const historyWithUser = [...currentHistory, userMsg];
    setMessages(historyWithUser);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          // Send all previous messages for context
          history: currentHistory.map(m => ({ role: m.role, content: m.content })),
          message: userMsg.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); throw new Error(errorData.error || 'Network response was not ok');
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
      console.warn('Chat warning (expected if overloaded):', error.message);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'model' && lastMsg.content === '') {
          newMessages.pop();
        }
        return newMessages;
      });
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'model', 
          content: error.message || 'Lỗi kết nối hoặc phản hồi bị lỗi.' 
        }
      ]);
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
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 shadow-sm z-10 relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">Trợ lý AI</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Powered by Gemini</p>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 text-slate-400 transition-colors"
            title="Xóa đoạn chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 max-w-full`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center shrink-0 mb-1">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            
            <div className={`max-w-[95%] sm:max-w-[90%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/10' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700 shadow-sm'
            }`}
              onContextMenu={(e) => {
                e.preventDefault();
                const selectedText = window.getSelection()?.toString().trim();
                const textToUse = selectedText ? selectedText : msg.content;
                setContextMenu({ x: e.clientX, y: e.clientY, text: textToUse, msgId: msg.id });
              }}
            >
              {msg.role === 'user' ? (
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              ) : (
                <div className="text-[15px] prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{cleanMarkdown(msg.content)}</ReactMarkdown>
                </div>
              )}
            </div>
            
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mb-1">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
            )}
          </motion.div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start items-end gap-2 max-w-full"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center shrink-0 mb-1">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <div className="relative w-full">
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-4 cursor-ns-resize flex items-center justify-center group z-10"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full group-hover:bg-indigo-400 transition-colors" />
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi bất cứ điều gì về tiếng Trung..."
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border-0 rounded-2xl px-5 py-3.5 pr-14 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none resize-none"
              style={{ 
                height: `${inputHeight}px`,
                minHeight: '52px',
                maxHeight: '300px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                const newHeight = Math.max(52, Math.min(target.scrollHeight, 300));
                if (newHeight > inputHeight) {
                  setInputHeight(newHeight);
                } else {
                  target.style.height = `${inputHeight}px`;
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[11px] text-slate-400">Gemini có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.</p>
        </div>
      </div>
    
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setContextMenu(null)} 
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} 
          />
          <div 
            className="fixed z-[101] bg-white border border-slate-200 shadow-xl rounded-lg py-1 w-56 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              left: Math.min(contextMenu.x, window.innerWidth - 224), 
              top: Math.min(contextMenu.y, window.innerHeight - 100) 
            }}
          >
            <button 
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
              onClick={() => {
                if (onSendToLearning) onSendToLearning(contextMenu.text);
                setContextMenu(null);
              }}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Gửi sang mục Học tập
            </button>
            <button 
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.text);
                setContextMenu(null);
              }}
            >
              <Copy className="w-4 h-4 text-blue-600" />
              Sao chép văn bản
            </button>
            <div className="h-[1px] bg-slate-100 my-1"></div>
            <button 
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
              onClick={() => {
                setMessages(prev => prev.filter(m => m.id !== contextMenu.msgId));
                setContextMenu(null);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Xóa tin nhắn này
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Xác nhận xóa đoạn chat</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Bạn có chắc chắn muốn xóa toàn bộ nội dung đoạn chat này không? Thao tác này không thể hoàn tác.</p>
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={() => {
                      setMessages([defaultMessage]);
                      setShowClearConfirm(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  </div>
  );
}
