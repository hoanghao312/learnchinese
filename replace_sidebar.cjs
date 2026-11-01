const fs = require('fs');
const content = fs.readFileSync('src/components/SavedLessonsList.tsx', 'utf-8');

const startMarker = '{/* Folders Sidebar */}';
const endMarker = '{/* Main Content */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers.");
  process.exit(1);
}

const newCode = content.substring(0, startIndex) + endMarker + content.substring(endIndex + endMarker.length);
fs.writeFileSync('src/components/SavedLessonsList.tsx', newCode);
console.log("Replaced Sidebar successfully!");
