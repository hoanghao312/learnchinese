const { execSync } = require('child_process');
const fs = require('fs');

let attempts = 0;
while (attempts < 20) {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('Build succeeded!');
    break;
  } catch (error) {
    const output = error.stdout.toString() + error.stderr.toString();
    const match = output.match(/ERROR: Expected "\)" but found "\}"\n\s*file: [^\n]+:(\d+):\d+/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      console.log(`Fixing line ${lineNum}`);
      const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');
      const lines = content.split('\n');
      
      const line = lines[lineNum - 1];
      lines[lineNum - 1] = line.replace('}', ')}');
      
      fs.writeFileSync('src/components/SavedWordsList.tsx', lines.join('\n'));
    } else {
      console.log('Unknown error:', output);
      break;
    }
  }
  attempts++;
}
