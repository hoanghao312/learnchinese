const fs = require('fs');

let code = fs.readFileSync('src/components/NotebookChat.tsx', 'utf-8');

if (!code.includes('import { Send, Bot, User, Loader2, BookOpen, X, FileText, ArrowLeft, Plus, CheckSquare, Square, Search, PanelLeftClose, PanelLeft, Check, Trash2 } from')) {
  code = code.replace("Search, PanelLeftClose, PanelLeft, Check } from 'lucide-react';", "Search, PanelLeftClose, PanelLeft, Check, Trash2 } from 'lucide-react';");
}

const clearButton = `
          {messages.length > 1 && (
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
          )}
          {onClose && (
`;

code = code.replace("{onClose && (", clearButton);

fs.writeFileSync('src/components/NotebookChat.tsx', code);
