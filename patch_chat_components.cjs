const fs = require('fs');

function patchComponent(filePath, componentName) {
  let code = fs.readFileSync(filePath, 'utf-8');

  // Add BookOpen to lucide-react if not present
  if (!code.includes('BookOpen,')) {
    code = code.replace("from 'lucide-react'", "BookOpen, from 'lucide-react'"); // might be hacky, let's use a regex
  }
  
  const iconImportsMatch = code.match(/import \{([^}]+)\} from 'lucide-react'/);
  if (iconImportsMatch && !iconImportsMatch[1].includes('BookOpen')) {
    const newImports = iconImportsMatch[1] + ', BookOpen, Copy';
    code = code.replace(iconImportsMatch[0], `import {${newImports}} from 'lucide-react'`);
  }

  // Update Props interface
  const propsRegex = new RegExp(`interface ${componentName}Props \\{([\\s\\S]*?)\\}`);
  if (propsRegex.test(code)) {
    code = code.replace(propsRegex, `interface ${componentName}Props {$1\n  onSendToLearning?: (text: string) => void;\n}`);
  } else {
    // If no props interface, create one. Actually, both have it.
    console.log(`Could not find Props interface in ${filePath}`);
  }

  // Update component signature
  const sigRegex = new RegExp(`export default function ${componentName}\\(\\{ onClose \\}: ${componentName}Props\\) \\{`);
  if (sigRegex.test(code)) {
    code = code.replace(sigRegex, `export default function ${componentName}({ onClose, onSendToLearning }: ${componentName}Props) {`);
  } else {
    const sigRegex2 = new RegExp(`export default function ${componentName}\\(\\w*\\s*\\) \\{`);
    if (sigRegex2.test(code)) {
      code = code.replace(sigRegex2, `export default function ${componentName}({ onClose, onSendToLearning }: ${componentName}Props = {}) {`);
    } else {
      console.log(`Could not update signature in ${filePath}`);
    }
  }

  // Add context menu state
  const insertStateAfter = `export default function ${componentName}`;
  const contextMenuState = `\n  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string} | null>(null);`;
  code = code.replace(/(export default function [^{]+\{)/, `$1${contextMenuState}`);

  // Find the model message div to add onContextMenu
  // We need to inject onContextMenu={(e) => { ... }} into the message bubble or container
  // For model messages, they are wrapped in a div. 
  
  if (componentName === 'AssistantChat') {
    const modelDivRegex = /<div className=\{`max-w-\[95%\] sm:max-w-\[90%\] rounded-2xl px-4 py-3 \$\{[\s\S]*?msg\.role === 'user'[\s\S]*?\}`\}>/m;
    code = code.replace(modelDivRegex, (match) => {
      return match.replace('>', `\n              onContextMenu={(e) => {\n                if (msg.role === 'model') {\n                  e.preventDefault();\n                  setContextMenu({ x: e.clientX, y: e.clientY, text: msg.content });\n                }\n              }}\n            >`);
    });
  } else if (componentName === 'NotebookChat') {
    const modelDivRegex = /<div className=\{`rounded-2xl px-5 py-3\.5 \$\{[\s\S]*?msg\.role === 'user'[\s\S]*?\}`\}>/m;
    code = code.replace(modelDivRegex, (match) => {
      return match.replace('>', `\n                  onContextMenu={(e) => {\n                    if (msg.role === 'model') {\n                      e.preventDefault();\n                      setContextMenu({ x: e.clientX, y: e.clientY, text: msg.content });\n                    }\n                  }}\n                >`);
    });
  }

  // Add the Context Menu UI near the end of the component (before the final closing div)
  const contextMenuUI = `
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
          </div>
        </>
      )}
  `;

  // Insert before the last </div>
  const lastDivIndex = code.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    code = code.substring(0, lastDivIndex) + contextMenuUI + code.substring(lastDivIndex);
  }

  fs.writeFileSync(filePath, code);
  console.log(`Patched ${componentName}`);
}

patchComponent('src/components/AssistantChat.tsx', 'AssistantChat');
patchComponent('src/components/NotebookChat.tsx', 'NotebookChat');

