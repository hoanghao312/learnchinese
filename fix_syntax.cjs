const fs = require('fs');
const files = ['src/components/AssistantChat.tsx', 'src/components/NotebookChat.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Clean up the messed up signature
  code = code.replace(/export default function (\w+)\(\{\s*const \[contextMenu[^;]+;\s*onClose, onSendToLearning \}\: (\w+)Props\) \{/, 
  "export default function $1({ onClose, onSendToLearning }: $2Props) {\n  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string} | null>(null);");

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}
