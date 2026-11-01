const fs = require('fs');
let code = fs.readFileSync('src/components/NotebookChat.tsx', 'utf-8');

// Add sessionToDelete state
const statePattern = "const [editSessionName, setEditSessionName] = useState('');";
if (!code.includes('sessionToDelete')) {
  code = code.replace(statePattern, statePattern + "\n  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);");
}

// Modify deleteSession
const oldDeleteSession = `  const deleteSession = (e: React.MouseEvent, id: string) => {
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
  };`;

const newDeleteSession = `  const confirmDeleteSession = (id: string) => {
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
    setSessionToDelete(null);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessionToDelete(id);
  };`;

code = code.replace(oldDeleteSession, newDeleteSession);

// Add the modal UI just above {showUploader && (
const modalUi = `        {sessionToDelete && (
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Xác nhận xóa</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Bạn có chắc chắn muốn xóa đoạn chat này không? Thao tác này không thể hoàn tác.</p>
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
        
        {showUploader && (`;

code = code.replace("{showUploader && (", modalUi);

fs.writeFileSync('src/components/NotebookChat.tsx', code);
