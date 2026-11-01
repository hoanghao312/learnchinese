const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replace(/gemini-3\.6-flash/g, 'gemini-3.1-flash-lite');
fs.writeFileSync('server.ts', content);
