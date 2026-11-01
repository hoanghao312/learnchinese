const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const helper = `
function parseGeminiJson(text: string) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('\`\`\`json')) {
      cleaned = cleaned.replace(/^\`\`\`json/, '');
    }
    if (cleaned.startsWith('\`\`\`')) {
      cleaned = cleaned.replace(/^\`\`\`/, '');
    }
    if (cleaned.endsWith('\`\`\`')) {
      cleaned = cleaned.replace(/\`\`\`$/, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text);
    throw e;
  }
}
`;

content = content.replace('const app = express();', helper + '\nconst app = express();');

content = content.replace(/JSON\.parse\(response\.text \|\| "{}"\)/g, 'parseGeminiJson(response.text || "{}")');
content = content.replace(/JSON\.parse\(resultText\)/g, 'parseGeminiJson(resultText)');

fs.writeFileSync('server.ts', content);
