const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleDrivePickerModal.tsx', 'utf-8');
code = code.replace(
  `      if (!response.ok) {\n        throw new Error("Lỗi khi tải danh sách từ Google Drive");\n      }`,
  `      if (!response.ok) {\n        const errorData = await response.json();\n        console.error("Drive API Error:", errorData);\n        throw new Error("Lỗi khi tải danh sách từ Google Drive: " + (errorData.error?.message || response.statusText));\n      }`
);
fs.writeFileSync('src/components/GoogleDrivePickerModal.tsx', code);
