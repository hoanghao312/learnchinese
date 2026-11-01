const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(/model:\s*"gemini-2\.5-flash"/g, 'model: "gemini-3.1-flash-lite"');
fs.writeFileSync('server.ts', content);
