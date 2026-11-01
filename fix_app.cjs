const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix SVG attributes
code = code.replace(/stroke-width/g, 'strokeWidth');
code = code.replace(/stroke-linecap/g, 'strokeLinecap');
code = code.replace(/stroke-linejoin/g, 'strokeLinejoin');

// Add missing import
if (!code.includes('import NotebookChat')) {
  code = code.replace('import AssistantChat from "./components/AssistantChat";', 'import AssistantChat from "./components/AssistantChat";\nimport NotebookChat from "./components/NotebookChat";');
}

fs.writeFileSync('src/App.tsx', code);
