const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const searchStr = `            </button>
            )}
            <button
              onClick={() => setShowFolderModal(true)}`;

const replaceStr = `            </button>
            )}
              </>
            )}
            <button
              onClick={() => setShowFolderModal(true)}`;

if (content.includes(searchStr)) {
  fs.writeFileSync('src/components/SavedWordsList.tsx', content.replace(searchStr, replaceStr));
  console.log("Successfully replaced header search part 2");
} else {
  console.log("Could not find search string part 2");
}
