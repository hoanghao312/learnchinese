const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace('User as UserIcon', 'User as UserIcon,\n  Dumbbell');

fs.writeFileSync('src/App.tsx', content);
