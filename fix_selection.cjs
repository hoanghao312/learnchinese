const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const target = `if (selection && !selection.isCollapsed && selection.toString().trim() !== "") {
        // Ensure the selection is within our container
        if (containerRef.current && !containerRef.current.contains(selection.anchorNode)) {
          return;
        }`;

const replacement = `if (selection && !selection.isCollapsed && selection.toString().trim() !== "") {
        // Ensure the selection is within our container
        if (containerRef.current && !containerRef.current.contains(selection.anchorNode)) {
          return;
        }
        
        // Ignore selection inside the floating button itself
        const anchorEl = selection.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : (selection.anchorNode as Element);
        if (anchorEl?.closest('#floating-audio-btn')) {
          return;
        }`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/TextReader.tsx', content);
