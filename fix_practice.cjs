const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// Modify generatePractice to accept isAutoGenerate
content = content.replace(
  "const generatePractice = async (type: PracticeType) => {",
  "const generatePractice = async (type: PracticeType, isAutoGenerate: boolean = false) => {"
);

// Modify useEffect to pass isAutoGenerate = true
content = content.replace(
  "generatePractice(autoGenerateType || 'ordering');",
  "generatePractice(autoGenerateType || 'ordering', true);"
);

// Modify the signIn block
const oldSignIn = `                if (!window.googleAuth?.token) {
                   await window.googleAuth?.signIn(['https://www.googleapis.com/auth/drive.readonly']);
                }`;
const newSignIn = `                if (!window.googleAuth?.token) {
                   if (!isAutoGenerate) {
                     await window.googleAuth?.signIn(['https://www.googleapis.com/auth/drive.readonly']);
                   } else {
                     console.log("Skipping auto sign-in to prevent popup blocker.");
                   }
                }`;
content = content.replace(oldSignIn, newSignIn);

// Fix the catch block for API overload
const oldCatch = `          } else {
            const data = await response.json();
            generatedExs = data.exercises || [];
          }
        } catch (err) {
          console.error(err);
          if (finalSaved.length === 0) {
            throw err;
          } else {
            alert("Lưu ý: Không thể kết nối với AI (API đang bận), chỉ hiển thị các bài tập đã lưu.");
          }`;

const newCatch = `          } else {
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            generatedExs = data.exercises || [];
          }
        } catch (err: any) {
          console.error(err);
          if (finalSaved.length === 0) {
            alert("Lỗi: Không thể tạo bài tập mới lúc này. Có thể hệ thống AI đang quá tải. Vui lòng thử lại sau.");
            setIsGenerating(false);
            return;
          } else {
            alert("Lưu ý: Không thể kết nối với AI (API đang bận), chỉ hiển thị các bài tập đã lưu.");
          }`;
content = content.replace(oldCatch, newCatch);

fs.writeFileSync('src/components/Practice.tsx', content);
