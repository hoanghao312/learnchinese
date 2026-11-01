const fs = require('fs');
const content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const newContent = content.replace(/speakMandarin\(([^,]+),\s*0\.9,\s*undefined,\s*undefined,\s*undefined,\s*true\)/g, 'speakMandarin($1, 0.9)');

if (newContent !== content) {
    fs.writeFileSync('src/components/Practice.tsx', newContent);
    console.log("Successfully reverted to immediate playback.");
} else {
    console.log("No changes made.");
}
