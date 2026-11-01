const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// Replace font family
content = content.replace(
  /style=\{\{ fontFamily: '"DFKAI-SB", "KaiTi", serif' \}\}/g,
  'style={{ fontFamily: \'"PingFang SC", "Microsoft YaHei", sans-serif\' }}'
);

// We can also adjust the font weight to normal since the image looks normal weight
content = content.replace(
  'className={`font-semibold tracking-tighter sm:tracking-normal',
  'className={`font-normal tracking-tighter sm:tracking-normal'
);

fs.writeFileSync('src/components/TextReader.tsx', content);
