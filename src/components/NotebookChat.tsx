import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen, X, FileText, ArrowLeft, Plus, CheckSquare, Square, Search, PanelLeftClose, PanelLeft, Check, Trash2, Edit2, MessageSquare, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import FileUploader from './FileUploader';
import localforage from 'localforage';
import { Folder } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}



interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  updatedAt: number;
}


interface NotebookChatProps {
  onClose?: () => void;
  onSendToLearning?: (text: string) => void;
  savedWords?: any[];
  folders?: Folder[];
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

export default function NotebookChat({ onClose, onSendToLearning, savedWords = [], folders = [] }: NotebookChatProps) {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string, msgId: string} | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyFilterType, setStoryFilterType] = useState<'vocab' | 'folder'>('vocab');
  const [storyUnknownStart, setStoryUnknownStart] = useState(1);
  const [storyUnknownEnd, setStoryUnknownEnd] = useState(20);
  const [storyLength, setStoryLength] = useState(200);
  const [storyCount, setStoryCount] = useState(1);
  const [storyFolderId, setStoryFolderId] = useState<string>('');
  
  const getFolderPath = (folderId: string): string => {
    const folder = folders?.find(f => f.id === folderId);
    if (!folder) return '';
    if (!folder.parentId) return folder.name;
    return `${getFolderPath(folder.parentId)} / ${folder.name}`;
  };
  const defaultMessage: Message = {
    id: 'welcome',
    role: 'model',
    content: 'Chào mừng bạn đến với Notebook Chat! Mình đã được kết nối với toàn bộ **Kho từ vựng** của bạn. Bạn có thể yêu cầu mình:\n- Liệt kê các từ vựng theo HSK, ngày tạo...\n- Dịch thuật hoặc tạo câu chuyện sử dụng từ vựng của bạn.\n- Giải thích chi tiết ngữ pháp, pinyin hoặc cho thêm ví dụ.'
  };

    const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  
    const [isInitializing, setIsInitializing] = useState(true);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([defaultMessage]);
  const [input, setInput] = useState(() => localStorage.getItem('notebook_chat_draft') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgContent, setEditMsgContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [inputHeight, setInputHeight] = useState(52);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('notebook_chat_draft', input);
  }, [input]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSessions = await localforage.getItem<ChatSession[]>('notebook_sessions');
        if (savedSessions && savedSessions.length > 0) {
          setSessions(savedSessions);
          
          const lastSessionId = await localforage.getItem<string>('notebook_current_session_id');
          const sessionToLoad = savedSessions.find(s => s.id === lastSessionId) || savedSessions[0];
          
          setCurrentSessionId(sessionToLoad.id);
          setMessages(sessionToLoad.messages);
        } else {
          const newSessionId = Date.now().toString();
          setCurrentSessionId(newSessionId);
          const newSession: ChatSession = {
            id: newSessionId,
            name: 'Đoạn chat mới',
            messages: [defaultMessage],
            updatedAt: Date.now()
          };
          setSessions([newSession]);
          setMessages([defaultMessage]);
        }
      } catch (err) {
        console.log("Failed to load notebook data", err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadData();
  }, []);



  useEffect(() => {
    if (!isInitializing) {
      localforage.setItem('notebook_sessions', sessions).catch(console.error);
    }
  }, [sessions, isInitializing]);

  useEffect(() => {
    if (!isInitializing && currentSessionId) {
      localforage.setItem('notebook_current_session_id', currentSessionId).catch(console.error);
    }
  }, [currentSessionId, isInitializing]);

  // Cập nhật messages vào session hiện tại
  useEffect(() => {
    if (!isInitializing && currentSessionId) {
      setSessions(prev => {
        const sessionExists = prev.some(s => s.id === currentSessionId);
        if (sessionExists) {
          return prev.map(s => s.id === currentSessionId ? { ...s, messages, updatedAt: Date.now() } : s);
        } else {
          return [{ id: currentSessionId, name: 'Đoạn chat mới', messages, updatedAt: Date.now() }, ...prev];
        }
      });
    }
  }, [messages, currentSessionId, isInitializing]);
  
  const createNewSession = () => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    setMessages([defaultMessage]);
    
  };

  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
    }
  };

  const confirmDeleteSession = (id: string) => {
    setSessions(prev => {
      return prev.map(s => {
        if (s.id === id) {
          return { ...s, messages: [defaultMessage], updatedAt: Date.now() };
        }
        return s;
      });
    });
    if (id === currentSessionId) {
      setMessages([defaultMessage]);
    }
    setSessionToDelete(null);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessionToDelete(id);
  };

    const saveSessionName = (id: string) => {
    if (editSessionName.trim()) {
      setSessions(prev => {
        const newSessions = prev.map(s => s.id === id ? { ...s, name: editSessionName.trim() } : s);
        localforage.setItem('notebook_sessions', newSessions).catch(console.error);
        return newSessions;
      });
    }
    setEditingSessionId(null);
  };


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
    if (!savedWords || savedWords.length === 0) {
      alert("Bạn chưa có từ vựng nào trong thư viện để làm ngữ cảnh.");
      return;
    }

    const sortedWords = [...savedWords].sort((a, b) => {
      const getHskWeight = (level?: string) => {
        if (!level) return 3.5;
        const match = level.match(/HSK\s*(\d+)/i);
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
    }).join('\n');
    
    const combinedContext = `TÀI LIỆU (DANH SÁCH TỪ VỰNG CỦA TÔI):\n${vocabularyList}`;

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
      console.log("Chat warning (expected if overloaded):", error.message);
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

    const handleEditPrompt = (msg: Message) => {
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx !== -1) {
      const newMessages = messages.slice(0, idx);
      setMessages(newMessages);
      setInput(msg.content);
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
  };

  return (
    <div className="flex h-full gap-4 bg-transparent overflow-hidden text-slate-800 dark:text-slate-200">
      
      {/* Story Generation Modal */}
      <AnimatePresence>
        {showStoryModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Tạo câu chuyện
                </h3>
                <button onClick={() => setShowStoryModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Số lượng câu chuyện
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(count => (
                      <button
                        key={count}
                        onClick={() => setStoryCount(count)}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${storyCount === count ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Độ dài câu chuyện (chữ)
                  </label>
                  <div className="flex gap-2">
                    {[100, 200, 300].map(len => (
                      <button
                        key={len}
                        onClick={() => setStoryLength(len)}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${storyLength === len ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setStoryFilterType('vocab')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${storyFilterType === 'vocab' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Theo từ vựng
                  </button>
                  <button
                    onClick={() => {
                        setStoryFilterType('folder');
                        if (folders && folders.length > 0 && !storyFolderId) {
                            setStoryFolderId(folders[0].id);
                        }
                    }}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${storyFilterType === 'folder' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Theo thư mục
                  </button>
                </div>

                {storyFilterType === 'vocab' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phạm vi từ "Chưa biết" (Có {savedWords.filter(w => !w.isKnown).length} từ)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Từ số</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={savedWords.filter(w => !w.isKnown).length}
                          value={storyUnknownStart}
                          onChange={(e) => setStoryUnknownStart(Math.max(1, Math.min(parseInt(e.target.value) || 1, savedWords.filter(w => !w.isKnown).length)))}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-500">đến</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={savedWords.filter(w => !w.isKnown).length}
                          value={storyUnknownEnd}
                          onChange={(e) => setStoryUnknownEnd(Math.max(1, Math.min(parseInt(e.target.value) || 1, savedWords.filter(w => !w.isKnown).length)))}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Chọn thư mục từ vựng
                    </label>
                    <div className="relative">
                      <select
                        value={storyFolderId}
                        onChange={(e) => setStoryFolderId(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-8"
                      >
                        {folders && folders.length > 0 ? (
                          [...folders].sort((a, b) => getFolderPath(a.id).localeCompare(getFolderPath(b.id))).map(f => {
                            const getDescendantFolderIds = (parentId: string): string[] => {
                              if (!folders) return [];
                              const children = folders.filter(cf => cf.parentId === parentId).map(cf => cf.id);
                              return children.reduce((acc, childId) => [...acc, childId, ...getDescendantFolderIds(childId)], [] as string[]);
                            };
                            const validFolderIds = [f.id, ...getDescendantFolderIds(f.id)];
                            const wordCount = savedWords.filter(w => w.folderId && validFolderIds.includes(w.folderId)).length;
                            return (
                              <option key={f.id} value={f.id}>{getFolderPath(f.id)} ({wordCount} từ)</option>
                            );
                          })
                        ) : (
                          <option value="">Không có thư mục nào</option>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => setShowStoryModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    let prompt = "";
                    
                    const sortedSavedWords = [...savedWords].sort((a, b) => {
                      const getHskWeight = (level) => {
                        if (!level) return 3.5;
                        const match = level.match(/HSK\s*(\d+)/i);
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

                    const knownWords = sortedSavedWords.filter(w => w.isKnown).map(w => w.text);
                    let knownStr = knownWords.length > 0 ? `\n\nĐối với CÁC TỪ VỰNG CÒN LẠI trong câu chuyện (ngoài danh sách bắt buộc), hãy CỐ GẮNG TỐI ĐA chỉ sử dụng các từ trong danh sách "Đã biết" sau đây của tôi:\n${knownWords.join(', ')}` : "";

                    const constraintsStr = `\n\nYÊU CẦU QUAN TRỌNG:\n1. Tạo chính xác ${storyCount} câu chuyện khác nhau.\n2. Tuyệt đối KHÔNG trả về pinyin, KHÔNG dịch nghĩa tiếng Việt trong phần nội dung câu chuyện. Phần đoạn văn câu chuyện phải là 100% câu tiếng Trung (chỉ giữ lại ký hiệu in đậm **).\n3. Nếu như có xuất hiện 1 từ tiếng Anh để bù đắp cho đủ nghĩa thì hãy dịch từ đó ra tiếng Trung để phần đoạn văn là 100% câu tiếng Trung, sau đó hãy note lại từ vựng tiếng Trung đó (kèm nghĩa tiếng Việt) ở bên dưới cùng.`;

                    if (storyFilterType === 'vocab') {
                      const unknownWords = sortedSavedWords.filter(w => !w.isKnown);
                      
                      const uStart = Math.max(0, storyUnknownStart - 1);
                      const uEnd = Math.min(unknownWords.length, storyUnknownEnd);
                      const selectedUnknown = unknownWords.slice(uStart, uEnd).map(w => w.text);
                      
                      let reqStr = "";
                      if (selectedUnknown.length > 0) reqStr += `\n- Từ vựng bắt buộc (${selectedUnknown.length} từ): ${selectedUnknown.join(', ')}`;

                      prompt = `Tạo ${storyCount} câu chuyện tiếng Trung, mỗi câu chuyện khoảng ${storyLength} từ, chứa các từ vựng bắt buộc sau đây:${reqStr}\n\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.${knownStr}${constraintsStr}`;
                    } else {
                      if (!storyFolderId) {
                        alert("Vui lòng chọn một thư mục.");
                        return;
                      }
                      const folderName = getFolderPath(storyFolderId) || 'Thư mục';
                      
                      const getDescendantFolderIds = (parentId) => {
                        if (!folders) return [];
                        const children = folders.filter(cf => cf.parentId === parentId).map(cf => cf.id);
                        return children.reduce((acc, childId) => [...acc, childId, ...getDescendantFolderIds(childId)], []);
                      };
                      
                      const validFolderIds = [storyFolderId, ...getDescendantFolderIds(storyFolderId)];
                      const folderWords = sortedSavedWords.filter(w => w.folderId && validFolderIds.includes(w.folderId)).map(w => w.text);
                      
                      if (folderWords.length === 0) {
                        alert("Thư mục này (và các thư mục con) chưa có từ vựng nào.");
                        return;
                      }
                      
                      const strictKnownStr = knownWords.length > 0 ? `\n\nĐIỀU KIỆN NGHIÊM NGẶT CHO CÁC TỪ CÒN LẠI:\nCác từ vựng còn lại (ngoài danh sách bắt buộc trên) dùng để nối câu TUYỆT ĐỐI CHỈ ĐƯỢC LẤY trong danh sách "Đã biết" sau đây của tôi:\n${knownWords.join(', ')}\n(Không được tự ý dùng từ mới, ngoại trừ các trợ từ ngữ pháp cơ bản như de, le, ma...)` : `\n\nĐIỀU KIỆN NGHIÊM NGẶT CHO CÁC TỪ CÒN LẠI:\nHãy dùng càng ít từ vựng bên ngoài càng tốt vì danh sách "Đã biết" của tôi đang trống. Chỉ dùng các đại từ và trợ từ ngữ pháp thật sự cơ bản.`;
                      
                      prompt = `Tạo ${storyCount} câu chuyện tiếng Trung, mỗi câu chuyện khoảng ${storyLength} từ, CHỨA TOÀN BỘ TẤT CẢ ${folderWords.length} từ vựng trong thư mục "${folderName}" bắt buộc sau đây:\n${folderWords.join(', ')}\n\nHãy làm nổi bật (in đậm) các từ vựng bắt buộc trên trong câu chuyện.${strictKnownStr}${constraintsStr}`;
                    }

                    
                    setShowStoryModal(false);
                    setTimeout(() => {
                      executeChat(prompt, messages);
                    }, 100);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Gửi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
                  <div className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">
                    Đoạn chat
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>

              <>
                  <div className="p-4 shrink-0">
                    <button 
                      onClick={createNewSession}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-full hover:bg-slate-900 dark:hover:bg-white transition-colors font-medium shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Chat mới
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
                      <div 
                        key={session.id}
                        onClick={() => switchSession(session.id)}
                        className={`group flex flex-col gap-1 p-3 rounded-2xl cursor-pointer transition-colors ${session.id === currentSessionId ? 'bg-blue-50 dark:bg-slate-700/80 border border-blue-100 dark:border-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className={`w-4 h-4 shrink-0 ${session.id === currentSessionId ? 'text-blue-500' : 'text-slate-400'}`} />
                          
                          {editingSessionId === session.id ? (
                            <input
                              autoFocus
                              value={editSessionName}
                              onChange={(e) => setEditSessionName(e.target.value)}
                              onBlur={() => saveSessionName(session.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSessionName(session.id);
                                if (e.key === 'Escape') setEditingSessionId(null);
                              }}
                              className="flex-1 bg-white dark:bg-slate-900 px-2 py-1 text-sm rounded border border-blue-300 outline-none w-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className={`flex-1 text-sm font-medium truncate ${session.id === currentSessionId ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {session.name}
                            </span>
                          )}

                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(session.id);
                                setEditSessionName(session.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-600 rounded-md"
                              title="Đổi tên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => deleteSession(e, session.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-slate-600 rounded-md"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-7 truncate">
                          {new Date(session.updatedAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setSessionToDelete(currentSessionId)}
              className="p-1.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 rounded-lg text-slate-500 transition-colors"
              title="Xóa đoạn chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}
            >
              <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 mt-1 shadow-sm">
                    <SparklesIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}

                                <div className={`rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-sm shadow-sm' 
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
                </div>

              </div>
            </motion.div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start max-w-full"
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 mt-1 shadow-sm">
                  <SparklesIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="px-5 py-3.5 flex items-center gap-1.5 h-12">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700/50">
          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowStoryModal(true)}
              className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-full transition-colors text-left"
            >
              <span className="font-semibold mr-1">✨</span> Tạo câu chuyện
            </button>
          </div>
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
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Hỏi về từ vựng của bạn..."
                className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 border-0 px-6 py-4 pr-16 focus:outline-none resize-none"
                style={{ 
                  height: `${inputHeight}px`,
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
                    target.style.height = `${inputHeight}px`;
                  }
                }}
              />
                            {isLoading ? (
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
                  title="Dừng"
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
              )}
            </div>
          </form>
          <div className="text-center mt-3">
             <p className="text-[11px] text-slate-400">NotebookLM có thể mắc lỗi. Hãy xác minh lại thông tin quan trọng.</p>
          </div>
        </div>

      </div>

      {/* Uploader Modal */}
      <AnimatePresence>
                {sessionToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Xóa nội dung</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Bạn có chắc chắn muốn xóa toàn bộ tin nhắn trong đoạn chat này không? (Tên đoạn chat sẽ được giữ nguyên)</p>
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => setSessionToDelete(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={() => confirmDeleteSession(sessionToDelete)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    Xóa đoạn chat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
