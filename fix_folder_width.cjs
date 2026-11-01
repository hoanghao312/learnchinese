const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// Change the column header
let newContent = content.replace(/<span className="w-\[100px\] text-right">Thư mục<\/span>/, '<span className="w-[180px] text-right">Thư mục</span>');

// Change the column content
newContent = newContent.replace(/truncate w-\[100px\] text-right/g, 'truncate w-[180px] text-right');

if (newContent !== content) {
    fs.writeFileSync('src/components/SavedWordsList.tsx', newContent);
    console.log("Successfully increased folder column width.");
} else {
    console.log("No changes made.");
}
