const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// Add import
if (!content.includes('fetchVocabularyFromDriveFile')) {
  content = content.replace('import GoogleDrivePickerModal from "./GoogleDrivePickerModal";', 'import GoogleDrivePickerModal from "./GoogleDrivePickerModal";\nimport { fetchVocabularyFromDriveFile } from "../driveHelper";');
}

// Modify generatePractice
const oldCode = `      // Only call API if we need more
      if (finalSaved.length < requiredTotal) {
        try {
          const response = await fetch('/api/practice/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: selectedWords, type, requiredTotal })
          });`;

const newCode = `      // Only call API if we need more
      if (finalSaved.length < requiredTotal) {
        try {
          let requestBody: any = { words: selectedWords, type, requiredTotal };
          
          if (savedWords.length === 1 && type === 'ordering') {
             try {
                // Ensure googleAuth is available, if not prompt login or fail gracefully
                if (!window.googleAuth?.token) {
                   await window.googleAuth?.signIn(['https://www.googleapis.com/auth/drive.readonly']);
                }
                if (window.googleAuth?.token) {
                   const driveWords = await fetchVocabularyFromDriveFile(window.googleAuth.token);
                   if (driveWords.length > 0) {
                      requestBody = {
                        type,
                        requiredTotal: 10,
                        targetWordForContext: savedWords[0],
                        contextWords: driveWords
                      };
                   }
                }
             } catch (err) {
                console.error("Lỗi khi lấy từ vựng từ Drive:", err);
                // Fallback to normal if drive fetch fails
                requestBody = { words: selectedWords, type, requiredTotal: 10 };
             }
          }

          const response = await fetch('/api/practice/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/Practice.tsx', content);
console.log("Updated Practice.tsx successfully");
