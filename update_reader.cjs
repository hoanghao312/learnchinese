const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// 1. Add BookOpen to lucide-react imports
content = content.replace('Languages } from "lucide-react";', 'Languages, BookOpen } from "lucide-react";');

// 2. Add React Markdown import
content = content.replace("import { speakMandarin", "import Markdown from 'react-markdown';\nimport { speakMandarin");

// 3. Add states
const stateTarget = `const [selectionTranslation, setSelectionTranslation] = useState<string | null>(null);\n  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false);`;
const newStates = `${stateTarget}
  const [selectionGrammar, setSelectionGrammar] = useState<string | null>(null);
  const [isAnalyzingGrammar, setIsAnalyzingGrammar] = useState(false);`;
content = content.replace(stateTarget, newStates);

// 4. Reset states on mouse up
const resetTarget = `setSelectionTranslation(null);
    }`;
const newReset = `setSelectionTranslation(null);
      setSelectionGrammar(null);
    }`;
content = content.replace(resetTarget, newReset);

// 5. Add handleAnalyzeGrammar
const handleTranslateTarget = `const handleTranslateSelection = async () => {`;
const newHandleAnalyze = `const handleAnalyzeGrammar = async () => {
    if (!selectedText) return;
    setIsAnalyzingGrammar(true);
    setSelectionGrammar(null);
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      const data = await res.json();
      if (data.analysis) {
        setSelectionGrammar(data.analysis);
      } else {
        setSelectionGrammar("Không thể phân tích đoạn này.");
      }
    } catch (err) {
      console.error("Lỗi khi phân tích:", err);
      setSelectionGrammar("Lỗi khi phân tích đoạn này.");
    } finally {
      setIsAnalyzingGrammar(false);
    }
  };

  const handleTranslateSelection = async () => {`;
content = content.replace(handleTranslateTarget, newHandleAnalyze);

// 6. Add button to floating menu
const buttonTarget = `<button
                onClick={handleTranslateSelection}
                disabled={isTranslatingSelection}
                className="p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                title="Dịch đoạn đã chọn"
              >
                {isTranslatingSelection ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Languages className="w-4 h-4" />}
              </button>`;
const newButton = `${buttonTarget}
              <button
                onClick={handleAnalyzeGrammar}
                disabled={isAnalyzingGrammar}
                className="p-3 flex items-center justify-center border-l border-slate-100 transition-colors min-w-[48px] min-h-[48px] hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                title="Phân tích ngữ pháp"
              >
                {isAnalyzingGrammar ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <BookOpen className="w-4 h-4" />}
              </button>`;
content = content.replace(buttonTarget, newButton);

// 7. Add grammar display
const grammarTarget = `{selectionTranslation && (
            <div className="flex flex-col items-start gap-2 py-2.5 px-3.5 border-t border-slate-100 bg-slate-50 w-full">`;
const newGrammarDisplay = `{selectionGrammar && (
            <div className="flex flex-col items-start gap-2 py-3 px-4 border-t border-slate-100 bg-white w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] max-w-sm max-h-[300px] overflow-y-auto">
              <div className="prose prose-sm prose-slate max-w-none w-full
                prose-p:leading-relaxed prose-p:my-1.5
                prose-li:my-0.5
                prose-ul:my-2
                prose-headings:text-slate-700 prose-headings:font-bold prose-headings:mb-2
                [&>strong]:text-slate-800 [&>strong]:text-base [&>strong]:block [&>strong]:mb-3 [&>strong]:pb-2 [&>strong]:border-b [&>strong]:border-slate-100
                [&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:bg-blue-50/50 [&>blockquote]:py-1 [&>blockquote]:px-3 [&>blockquote]:text-blue-800 [&>blockquote]:font-medium [&>blockquote]:text-[13px] [&>blockquote]:rounded-r-md [&>blockquote]:my-3
                [&>p:has(strong)]:text-blue-600
                markdown-body
                ">
                <Markdown>{selectionGrammar}</Markdown>
              </div>
            </div>
          )}
          
          ${grammarTarget}`;
content = content.replace(grammarTarget, newGrammarDisplay);

fs.writeFileSync('src/components/TextReader.tsx', content);
