const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// 1. Import Eraser
const iconImportTarget = 'ArrowLeft } from "lucide-react";';
const iconImportReplacement = 'ArrowLeft, Eraser } from "lucide-react";';
content = content.replace(iconImportTarget, iconImportReplacement);

// 2. Add handleRemoveDuplicates function
const handlerTarget = `  const [isProcessingExcel, setIsProcessingExcel] = useState(false);`;
const handlerReplacement = `  const handleRemoveDuplicates = () => {
    const seenText = new Set<string>();
    const duplicateIds: string[] = [];
    
    for (const word of savedWords) {
      if (seenText.has(word.text)) {
        duplicateIds.push(word.id);
      } else {
        seenText.add(word.text);
      }
    }
    
    if (duplicateIds.length > 0) {
      onRemoveWord(duplicateIds);
    } else {
      alert("Không tìm thấy từ vựng trùng lặp nào!");
    }
  };

  const [isProcessingExcel, setIsProcessingExcel] = useState(false);`;
content = content.replace(handlerTarget, handlerReplacement);

// 3. Add the UI button
const uiTarget = `title="Xuất từ vựng ra file Excel"
            >
              <Download className="w-3.5 h-3.5" />
            </button>`;

const uiReplacement = `title="Xuất từ vựng ra file Excel"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleRemoveDuplicates}
              disabled={savedWords.length === 0}
              className={\`p-1.5 rounded-xl border transition-all duration-300 flex-shrink-0 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50\`}
              title="Xóa từ trùng lặp"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>`;

content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
