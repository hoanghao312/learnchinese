const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

content = content.replace(/\}\)\(\)\}/g, '})()}\n                    </div>');

fs.writeFileSync('src/components/Practice.tsx', content);
