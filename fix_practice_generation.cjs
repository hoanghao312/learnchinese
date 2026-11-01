const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const generateTarget = `      // Only call API if we need more
      if (finalSaved.length < requiredTotal) {
        // We can just ask API to generate the difference. 
        // We'll pass the difference as a hint to the backend by duplicating words if needed, 
        // but backend is hardcoded to words.length.
        // We'll just generate based on selectedWords and then take the difference.
        const response = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords, type })
      });

      if (!response.ok) throw new Error("Lỗi khi tạo bài tập");

      const data = await response.json();
      
      generatedExs = data.exercises || [];
      }`;

const generateReplacement = `      // Only call API if we need more
      if (finalSaved.length < requiredTotal) {
        try {
          const response = await fetch('/api/practice/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: selectedWords, type })
          });

          if (!response.ok) {
            console.error("Lỗi khi tạo bài tập, API có thể bị quá tải.");
            if (finalSaved.length === 0) {
              throw new Error("Không thể tạo bài tập mới lúc này. Có thể API đang quá tải.");
            } else {
              alert("Lưu ý: Không thể tạo thêm bài tập mới (API đang bận), chỉ hiển thị các bài tập đã lưu.");
            }
          } else {
            const data = await response.json();
            generatedExs = data.exercises || [];
          }
        } catch (err) {
          console.error(err);
          if (finalSaved.length === 0) {
            throw err;
          } else {
            alert("Lưu ý: Không thể kết nối với AI (API đang bận), chỉ hiển thị các bài tập đã lưu.");
          }
        }
      }`;

content = content.replace(generateTarget, generateReplacement);
fs.writeFileSync('src/components/Practice.tsx', content);
