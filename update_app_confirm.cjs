const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add ConfirmModal import
if (!content.includes('import ConfirmModal')) {
  content = content.replace('import SavedWordsList from "./components/SavedWordsList";', 'import SavedWordsList from "./components/SavedWordsList";\nimport ConfirmModal from "./components/ConfirmModal";');
}

// 2. Add state
const stateDeclaration = '  const [isSidebarOpen, setIsSidebarOpen] = useState(false);';
if (!content.includes('const [confirmAction, setConfirmAction] =')) {
  content = content.replace(stateDeclaration, stateDeclaration + '\n  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);');
}

// 3. Render ConfirmModal at the end
const endOfApp = '    </div>\n  );\n}';
if (!content.includes('<ConfirmModal')) {
  const renderModal = `      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}`;
  content = content.replace(endOfApp, renderModal);
}

// 4. Update window.confirm instances
content = content.replace(
  /if \(window\.confirm\("Bạn có chắc chắn muốn bỏ lưu từ này khỏi danh sách\?"\)\) \{\n\s*setSavedWords\(prev => \{\n\s*const updated = prev\.filter\(w => w\.text !== token\.text\);\n\s*localStorage\.setItem\("saved_chinese_words", JSON\.stringify\(updated\)\);\n\s*return updated;\n\s*\}\);\n\s*\}/g,
  `setConfirmAction({
        title: "Xác nhận bỏ lưu",
        message: "Bạn có chắc chắn muốn bỏ lưu từ này khỏi danh sách?",
        onConfirm: () => {
          setSavedWords(prev => {
            const updated = prev.filter(w => w.text !== token.text);
            localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
            return updated;
          });
        }
      });`
);

content = content.replace(
  /if \(window\.confirm\("Bạn có chắc chắn muốn xóa từ này khỏi danh sách\?"\)\) \{\n\s*setSavedWords\(prev => \{\n\s*const updated = prev\.filter\(w => w\.id !== id\);\n\s*localStorage\.setItem\("saved_chinese_words", JSON\.stringify\(updated\)\);\n\s*return updated;\n\s*\}\);\n\s*\}/g,
  `setConfirmAction({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa từ này khỏi danh sách?",
      onConfirm: () => {
        setSavedWords(prev => {
          const updated = prev.filter(w => w.id !== id);
          localStorage.setItem("saved_chinese_words", JSON.stringify(updated));
          return updated;
        });
      }
    });`
);

const missingReplace = 'if (window.confirm("Bạn có chắc chắn muốn xóa từ này khỏi danh sách?")) { setHistoricalMissingWords(prev => { const next = prev.filter(t => t.text !== w.text); localStorage.setItem("historical_missing_words", JSON.stringify(next)); return next; }); }';
const missingNew = 'setConfirmAction({ title: "Xác nhận xóa", message: `Bạn có chắc chắn muốn xóa từ "${w.text}" khỏi danh sách?`, onConfirm: () => { setHistoricalMissingWords(prev => { const next = prev.filter(t => t.text !== w.text); localStorage.setItem("historical_missing_words", JSON.stringify(next)); return next; }); } });';

content = content.replaceAll(missingReplace, missingNew);

fs.writeFileSync('src/App.tsx', content);
