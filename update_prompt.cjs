const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

const searchStr = `"structureExplanation": "Giải thích ngắn gọn (bằng tiếng Việt, tối đa 2 câu) về cấu trúc ngữ pháp hoặc cách sắp xếp các từ trong câu này."`;

const replaceStr = `"structureExplanation": "Phân tích cấu trúc câu chi tiết theo đúng format sau (dùng kí tự \\n để xuống dòng):\\nPhân tích từ vựng:\\n[Từ 1] = [Loại từ] ([nghĩa])\\n[Từ 2] = [Loại từ] ([nghĩa])\\n...\\n\\n📌 Cấu trúc: [Công thức cấu trúc, vd: S + V + N]\\n\\n[Câu tiếng Trung] [Nghĩa tiếng Việt] (vd: 你叫什么名字？ Bạn tên là gì?)"`;

if (content.includes(searchStr)) {
    // Note: We need to do a global replace because there are two branches (one for standard and one for context)
    const newContent = content.split(searchStr).join(replaceStr);
    fs.writeFileSync('server.ts', newContent);
    console.log("Updated prompt in server.ts");
} else {
    console.log("Could not find prompt in server.ts");
}
