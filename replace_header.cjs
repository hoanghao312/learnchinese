const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const searchStr = `          <div className="flex items-center gap-2 w-full sm:flex-1">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm..."`;

const replaceStr = `          <div className="flex items-center gap-2 w-full sm:flex-1">
            {activeFolderId !== null && (
              <>
                <div className="relative w-full sm:w-56 shrink-0">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."`;

if (content.includes(searchStr)) {
  fs.writeFileSync('src/components/SavedWordsList.tsx', content.replace(searchStr, replaceStr));
  console.log("Successfully replaced header search part 1");
} else {
  console.log("Could not find search string part 1");
}
