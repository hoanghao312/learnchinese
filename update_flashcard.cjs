const fs = require('fs');
let content = fs.readFileSync('src/components/Flashcards.tsx', 'utf-8');

// 1. Import FolderTree
content = content.replace(
  'Folder as FolderIcon } from "lucide-react";',
  'Folder as FolderIcon, FolderTree } from "lucide-react";'
);

// 2. Add includeSubfolders state
content = content.replace(
  'const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);',
  `const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);`
);

// 3. Update useEffect deps
content = content.replace(
  '}, [words, learningMode, selectedFolderId, hasStartedSession]);',
  '}, [words, learningMode, selectedFolderId, hasStartedSession, includeSubfolders]);'
);

// 4. Update due calculation
content = content.replace(
  `        // Check if w.folderId is a descendant of selectedFolderId
        let isDescendant = false;
        let currentParent = folders.find(f => f.id === w.folderId)?.parentId;
        while (currentParent) {
          if (currentParent === selectedFolderId) {
            isDescendant = true;
            break;
          }
          currentParent = folders.find(f => f.id === currentParent)?.parentId;
        }
        if (!isDescendant) return false;`,
  `        if (includeSubfolders) {
          // Check if w.folderId is a descendant of selectedFolderId
          let isDescendant = false;
          let currentParent = folders.find(f => f.id === w.folderId)?.parentId;
          while (currentParent) {
            if (currentParent === selectedFolderId) {
              isDescendant = true;
              break;
            }
            currentParent = folders.find(f => f.id === currentParent)?.parentId;
          }
          if (!isDescendant) return false;
        } else {
          return false;
        }`
);

// 5. Update totalWordsInFolder
content = content.replace(
  `    let isDescendant = false;
    let currentParent = folders.find(f => f.id === w.folderId)?.parentId;
    while (currentParent) {
      if (currentParent === selectedFolderId) {
        isDescendant = true;
        break;
      }
      currentParent = folders.find(f => f.id === currentParent)?.parentId;
    }
    return isDescendant;`,
  `    if (!includeSubfolders) return false;
    let isDescendant = false;
    let currentParent = folders.find(f => f.id === w.folderId)?.parentId;
    while (currentParent) {
      if (currentParent === selectedFolderId) {
        isDescendant = true;
        break;
      }
      currentParent = folders.find(f => f.id === currentParent)?.parentId;
    }
    return isDescendant;`
);

// 6. Update renderFolderOptions
content = content.replace(
  `      options.push(
        <option key={child.id} value={child.id}>
          {indent}{prefix}{child.name}
        </option>
      );
      options.push(...renderFolderOptions(child.id, level + 1));`,
  `      options.push(
        <option key={child.id} value={child.id}>
          {indent}{prefix}{child.name}
        </option>
      );
      if (includeSubfolders) {
        options.push(...renderFolderOptions(child.id, level + 1));
      }`
);

// 7. Render toggle button next to select
content = content.replace(
  `          {folders.length > 0 && (
            <select
              value={selectedFolderId || ""}
              onChange={(e) => {
                setSelectedFolderId(e.target.value || null);
                setHasStartedSession(false);
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-full text-xs shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer appearance-none max-w-[200px] truncate"
              style={{ backgroundImage: \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' class='w-4 h-4 text-slate-400'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' /%3E%3C/svg%3E")\`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em', paddingRight: '2rem' }}
            >
              <option value="">Tất cả thư mục</option>
              {renderFolderOptions()}
            </select>
          )}`,
  `          {folders.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value={selectedFolderId || ""}
                onChange={(e) => {
                  setSelectedFolderId(e.target.value || null);
                  setHasStartedSession(false);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-full text-xs shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer appearance-none max-w-[150px] sm:max-w-[200px] truncate"
                style={{ backgroundImage: \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' class='w-4 h-4 text-slate-400'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' /%3E%3C/svg%3E")\`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em', paddingRight: '2rem' }}
              >
                <option value="">Tất cả thư mục</option>
                {renderFolderOptions()}
              </select>
              <button
                onClick={() => setIncludeSubfolders(prev => !prev)}
                className={\`p-1.5 rounded-full border transition-colors shadow-sm \${includeSubfolders ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'}\`}
                title={includeSubfolders ? "Đang hiện thư mục con" : "Đang ẩn thư mục con"}
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
            </div>
          )}`
);

fs.writeFileSync('src/components/Flashcards.tsx', content);
