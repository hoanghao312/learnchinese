const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const retryLogic = `
async function generateContentWithRetry(params: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const isOverloaded = error.status === 503 || (error.message && error.message.includes('503')) || (error.status === 429) || (error.message && error.message.includes('429'));
      if (isOverloaded) {
        if (attempt >= maxRetries) throw error;
        console.warn(\`[Retry \${attempt}/\${maxRetries}] Gemini API Overloaded. Retrying in \${attempt * 2} seconds...\`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      } else {
        throw error;
      }
    }
  }
}

async function generateContentStreamWithRetry(params: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContentStream(params);
    } catch (error: any) {
      attempt++;
      const isOverloaded = error.status === 503 || (error.message && error.message.includes('503')) || (error.status === 429) || (error.message && error.message.includes('429'));
      if (isOverloaded) {
        if (attempt >= maxRetries) throw error;
        console.warn(\`[Retry \${attempt}/\${maxRetries}] Gemini API Overloaded. Retrying in \${attempt * 2} seconds...\`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      } else {
        throw error;
      }
    }
  }
}
`;

code = code.replace('const app = express();', retryLogic + '\nconst app = express();');

code = code.replace(/await ai\.models\.generateContent\(/g, 'await generateContentWithRetry(');
code = code.replace(/await ai\.models\.generateContentStream\(/g, 'await generateContentStreamWithRetry(');

fs.writeFileSync('server.ts', code);
