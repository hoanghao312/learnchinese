const fs = require('fs');

const files = ['src/components/AssistantChat.tsx', 'src/components/NotebookChat.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  
  const oldCode = `              onContextMenu={(e) => {
                if (msg.role === 'model') {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, text: msg.content });
                }
              }}`;
              
  const oldCode2 = `                  onContextMenu={(e) => {
                    if (msg.role === 'model') {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, text: msg.content });
                    }
                  }}`;

  const newCode = `              onContextMenu={(e) => {
                if (msg.role === 'model') {
                  e.preventDefault();
                  const selectedText = window.getSelection()?.toString().trim();
                  const textToUse = selectedText ? selectedText : msg.content;
                  setContextMenu({ x: e.clientX, y: e.clientY, text: textToUse });
                }
              }}`;
              
  const newCode2 = `                  onContextMenu={(e) => {
                    if (msg.role === 'model') {
                      e.preventDefault();
                      const selectedText = window.getSelection()?.toString().trim();
                      const textToUse = selectedText ? selectedText : msg.content;
                      setContextMenu({ x: e.clientX, y: e.clientY, text: textToUse });
                    }
                  }}`;

  if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    console.log('Patched format 1 in', file);
  } else if (code.includes(oldCode2)) {
    code = code.replace(oldCode2, newCode2);
    console.log('Patched format 2 in', file);
  } else {
    console.log('Could not find onContextMenu block in', file);
  }

  fs.writeFileSync(file, code);
}
