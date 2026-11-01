const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const searchStr = `            </button>
            )}
              </>
            )}`;

const replaceStr = `            </button>
              </>
            )}`;

if (content.includes(searchStr)) {
  fs.writeFileSync('src/components/SavedWordsList.tsx', content.replace(searchStr, replaceStr));
  console.log("Successfully removed extra brace");
} else {
  console.log("Could not find extra brace string");
}
