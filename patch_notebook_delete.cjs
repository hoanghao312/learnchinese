const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStr1 = `  const confirmDeleteSession = (id: string) => {
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
  };`;

const replaceStr1 = `  const confirmDeleteSession = (id: string) => {
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
  };`;

content = content.replace(targetStr1, replaceStr1);

const targetStr2 = `<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Xác nhận xóa</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Bạn có chắc chắn muốn xóa đoạn chat này không? Thao tác này không thể hoàn tác.</p>`;

const replaceStr2 = `<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Xóa nội dung</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Bạn có chắc chắn muốn xóa toàn bộ tin nhắn trong đoạn chat này không? (Tên đoạn chat sẽ được giữ nguyên)</p>`;

content = content.replace(targetStr2, replaceStr2);

fs.writeFileSync('src/components/NotebookChat.tsx', content);
