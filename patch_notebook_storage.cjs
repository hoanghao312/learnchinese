const fs = require('fs');

let code = fs.readFileSync('src/components/NotebookChat.tsx', 'utf-8');

if (!code.includes('import localforage from')) {
  code = code.replace("import FileUploader from './FileUploader';", "import FileUploader from './FileUploader';\nimport localforage from 'localforage';");
}

const loadingState = `
  const [sources, setSources] = useState<Source[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
`;
code = code.replace("const [sources, setSources] = useState<Source[]>([]);", loadingState);

const loadEffect = `
  useEffect(() => {
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
  }, [messages, isInitializing]);
`;

code = code.replace("const messagesEndRef = useRef<HTMLDivElement>(null);", "const messagesEndRef = useRef<HTMLDivElement>(null);\n" + loadEffect);

// Add a clear chat / clear sources function maybe? Or just keep it as is.
// I will also add a delete button for sources since they are now persistent, otherwise they can never be removed!
const sourceRender = `
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
`;

// Replace the old map
code = code.replace(/sources\.map\(\(source\) => \([\s\S]*?\}\)\n                  \)\)/, sourceRender + '\n                  ))');

fs.writeFileSync('src/components/NotebookChat.tsx', code);
