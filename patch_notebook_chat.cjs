const fs = require('fs');

const code = `import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen, X, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import FileUploader from './FileUploader';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface NotebookChatProps {
  onClose?: () => void;
}

export default function NotebookChat({ onClose }: NotebookChatProps) {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(52);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    if (documentContent && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'model',
          content: \`Tôi đã đọc xong tài liệu **\${fileName}**. Hãy đặt bất kỳ câu hỏi nào về nội dung tài liệu này, tôi sẽ trả lời dựa trên thông tin có sẵn nhé!\`
        }
      ]);
    }
  }, [documentContent]);

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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

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
          history: messages,
          message: userText,
          documentContext: documentContent
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

  if (!documentContent) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 md:p-12 items-center justify-center">
        <div className="max-w-xl w-full flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Notebook Chat</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Tải lên một tài liệu văn bản. Trợ lý AI sẽ **chỉ trả lời** các câu hỏi dựa trên nội dung có trong tài liệu này (không bịa thông tin).
            </p>
          </div>
          
          <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
             <FileUploader 
               onTextLoaded={(text, name) => {
                 setDocumentContent(text);
                 setFileName(name);
               }} 
             />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 shadow-sm z-10 relative">
        <button 
          onClick={() => {
            setDocumentContent(null);
            setFileName(null);
            setMessages([]);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors mr-1"
          title="Đổi tài liệu khác"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">Notebook: {fileName}</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Trả lời nghiêm ngặt theo tài liệu</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 max-w-full\`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 flex items-center justify-center shrink-0 mb-1">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            
            <div className={\`max-w-[95%] sm:max-w-[90%] rounded-2xl px-4 py-3 \${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-sm shadow-md shadow-emerald-600/10' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700 shadow-sm'
            }\`}>
              {msg.role === 'user' ? (
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              ) : (
                <div className="text-[15px] prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 flex items-center justify-center shrink-0 mb-1">
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full group-hover:bg-emerald-400 transition-colors" />
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
              placeholder="Hỏi bất cứ điều gì về tài liệu này..."
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border-0 rounded-2xl px-5 py-3.5 pr-14 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none resize-none"
              style={{ 
                height: \`\${inputHeight}px\`,
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
                  target.style.height = \`\${inputHeight}px\`;
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[11px] text-slate-400">Notebook Chat chỉ trả lời dựa trên nội dung tài liệu bạn đã tải lên.</p>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/NotebookChat.tsx', code);
