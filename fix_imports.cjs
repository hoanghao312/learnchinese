const fs = require('fs');

const files = ['src/components/AssistantChat.tsx', 'src/components/NotebookChat.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  // First, fix the broken 'BookOpen, from'
  code = code.replace(/\} BookOpen, from 'lucide-react';/g, ", BookOpen, Copy } from 'lucide-react';");
  
  // Actually let's just re-organize the imports
  code = code.replace(/import \{([^}]+)\} BookOpen, from 'lucide-react';/g, "import { $1, BookOpen, Copy } from 'lucide-react';");
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/g, (match, p1) => {
    let parts = p1.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.includes('BookOpen')) parts.push('BookOpen');
    if (!parts.includes('Copy')) parts.push('Copy');
    return `import { ${parts.join(', ')} } from 'lucide-react';`;
  });

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}
