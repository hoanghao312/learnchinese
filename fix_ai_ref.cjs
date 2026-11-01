const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Extract the ai init block
const aiBlockRegex = /\/\/ Initialize Gemini Client\nconst ai = new GoogleGenAI\(\{[\s\S]*?\}\);\n/m;
const aiBlockMatch = code.match(aiBlockRegex);

if (aiBlockMatch) {
  code = code.replace(aiBlockMatch[0], ''); // remove from current location
  // Insert before the retry functions
  const insertIndex = code.indexOf('async function generateContentWithRetry');
  code = code.substring(0, insertIndex) + aiBlockMatch[0] + '\n' + code.substring(insertIndex);
  fs.writeFileSync('server.ts', code);
}
