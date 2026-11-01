const fs = require('fs');
let code = fs.readFileSync('src/components/NotebookChat.tsx', 'utf-8');

// 1. Add Message, Source, ChatSession interfaces and lucide icons
const iconImports = `import { Send, Bot, User, Loader2, BookOpen, X, FileText, ArrowLeft, Plus, CheckSquare, Square, Search, PanelLeftClose, PanelLeft, Check, Trash2, Edit2, MessageSquare } from 'lucide-react';`;
code = code.replace(/import \{ Send[^\}]+ \} from 'lucide-react';/, iconImports);

const newInterfaces = `interface Message {
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

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  updatedAt: number;
}
`;
code = code.replace(/interface Message \{[\s\S]*?\}\n\ninterface Source \{[\s\S]*?\}/, newInterfaces);


// 2. Add new states
const oldStates = `  const [sources, setSources] = useState<Source[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Chào mừng bạn đến với Notebook Chat! Hãy thêm tài liệu vào cột bên trái và bắt đầu đặt câu hỏi. Mình sẽ chỉ trả lời dựa trên những tài liệu bạn đã chọn.'
    }
  ]);`;

const newStates = `  const [sources, setSources] = useState<Source[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'sources' | 'history'>('sources');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState('');
  
  const defaultMessage: Message = {
    id: 'welcome',
    role: 'model',
    content: 'Chào mừng bạn đến với Notebook Chat! Hãy thêm tài liệu vào cột bên trái và bắt đầu đặt câu hỏi. Mình sẽ chỉ trả lời dựa trên những tài liệu bạn đã chọn.'
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  const [messages, setMessages] = useState<Message[]>([defaultMessage]);`;
code = code.replace(oldStates, newStates);


// 3. Update loadData and hooks
const oldLoadEffect = `  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSources = await localforage.getItem<Source[]>('notebook_sources');
        if (savedSources && savedSources.length > 0) {
          setSources(savedSources);
        }
        
        const savedMessages = await localforage.getItem<Message[]>('notebook_messages');
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
        }
      } catch (err) {
        console.error("Failed to load notebook data", err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      localforage.setItem('notebook_sources', sources).catch(console.error);
    }
  }, [sources, isInitializing]);

  useEffect(() => {
    if (!isInitializing) {
      localforage.setItem('notebook_messages', messages).catch(console.error);
    }
  }, [messages, isInitializing]);`;

const newLoadEffect = `  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSources = await localforage.getItem<Source[]>('notebook_sources');
        if (savedSources && savedSources.length > 0) {
          setSources(savedSources);
        }
        
        const savedSessions = await localforage.getItem<ChatSession[]>('notebook_sessions');
        if (savedSessions && savedSessions.length > 0) {
          setSessions(savedSessions);
          
          // Khôi phục session gần đây nhất hoặc session cuối cùng lưu
          const lastSessionId = await localforage.getItem<string>('notebook_current_session_id');
          const sessionToLoad = savedSessions.find(s => s.id === lastSessionId) || savedSessions[0];
          
          setCurrentSessionId(sessionToLoad.id);
          setMessages(sessionToLoad.messages);
        } else {
          // Tạo session mới nếu chưa có
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
        console.error("Failed to load notebook data", err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      localforage.setItem('notebook_sources', sources).catch(console.error);
    }
  }, [sources, isInitializing]);

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
    setSidebarTab('history');
  };

  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa đoạn chat này?")) {
      setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== id);
        if (newSessions.length === 0) {
          const newSessionId = Date.now().toString();
          setCurrentSessionId(newSessionId);
          setMessages([defaultMessage]);
          return [{ id: newSessionId, name: 'Đoạn chat mới', messages: [defaultMessage], updatedAt: Date.now() }];
        } else if (id === currentSessionId) {
          setCurrentSessionId(newSessions[0].id);
          setMessages(newSessions[0].messages);
        }
        return newSessions;
      });
    }
  };

  const saveSessionName = (id: string) => {
    if (editSessionName.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, name: editSessionName.trim() } : s));
    }
    setEditingSessionId(null);
  };
`;
code = code.replace(oldLoadEffect, newLoadEffect);


// 4. Update Sidebar UI
const oldSidebarHeader = `              {/* Header */}
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
                      className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div 
                        className="flex-1 flex items-center gap-3 min-w-0"
                        onClick={() => toggleSourceSelection(source.id)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-sm font-medium truncate" title={source.name}>{source.name}</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSources(prev => prev.filter(s => s.id !== source.id));
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Xóa nguồn này"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div 
                        onClick={() => toggleSourceSelection(source.id)}
                        className={\`w-5 h-5 rounded flex items-center justify-center shrink-0 \${source.selected ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white' : 'bg-white border-2 border-slate-200 dark:border-slate-600'}\`}
                      >
                        {source.selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))
                )}
              </div>`;

const newSidebarContent = `              {/* Header */}
              <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button onClick={() => setSidebarTab('sources')} className={\`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors \${sidebarTab === 'sources' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}>
                    Nguồn
                  </button>
                  <button onClick={() => setSidebarTab('history')} className={\`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors \${sidebarTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}>
                    Đoạn chat
                  </button>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>

              {sidebarTab === 'sources' ? (
                <>
                  {/* Add Source Button */}
                  <div className="p-4 shrink-0">
                    <button 
                      onClick={() => setShowUploader(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm nguồn
                    </button>
                  </div>

                  {/* Search Box (Mock) */}
                  <div className="px-4 pb-3 shrink-0">
                    <div className="relative">
                      <input type="text" placeholder="Tìm nguồn mới trên web" className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 outline-none placeholder:text-slate-500" disabled />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Select All */}
                  {sources.length > 0 && (
                    <div className="px-6 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 shrink-0">
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
                          className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        >
                          <div 
                            className="flex-1 flex items-center gap-3 min-w-0"
                            onClick={() => toggleSourceSelection(source.id)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate" title={source.name}>{source.name}</span>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSources(prev => prev.filter(s => s.id !== source.id));
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Xóa nguồn này"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div 
                            onClick={() => toggleSourceSelection(source.id)}
                            className={\`w-5 h-5 rounded flex items-center justify-center shrink-0 \${source.selected ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white' : 'bg-white border-2 border-slate-200 dark:border-slate-600'}\`}
                          >
                            {source.selected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
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
                        className={\`group flex flex-col gap-1 p-3 rounded-2xl cursor-pointer transition-colors \${session.id === currentSessionId ? 'bg-blue-50 dark:bg-slate-700/80 border border-blue-100 dark:border-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent'}\`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className={\`w-4 h-4 shrink-0 \${session.id === currentSessionId ? 'text-blue-500' : 'text-slate-400'}\`} />
                          
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
                              className="flex-1 bg-white dark:bg-slate-900 px-2 py-1 text-sm rounded border border-blue-300 outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className={\`flex-1 text-sm font-medium truncate \${session.id === currentSessionId ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}\`}>
                              {session.name}
                            </span>
                          )}

                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
              )}`;

code = code.replace(oldSidebarHeader, newSidebarContent);


// 5. Delete the clear chat button (from Header of right area) since we now have multi-sessions
const clearChatCode = `          {messages.length > 1 && (
            <button 
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này?")) {
                  setMessages([
                    {
                      id: 'welcome',
                      role: 'model',
                      content: 'Chào mừng bạn đến với Notebook Chat! Hãy thêm tài liệu vào cột bên trái và bắt đầu đặt câu hỏi. Mình sẽ chỉ trả lời dựa trên những tài liệu bạn đã chọn.'
                    }
                  ]);
                }
              }} 
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors mr-2"
              title="Xóa đoạn chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}`;

code = code.replace(clearChatCode, "");

fs.writeFileSync('src/components/NotebookChat.tsx', code);
