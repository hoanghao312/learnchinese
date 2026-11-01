const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

content = content.replace(/(\s+})([\s\n]*)(<div className="grid grid-cols-2)/g, '$1\n                    </div>$2$3');

fs.writeFileSync('src/components/Practice.tsx', content);
