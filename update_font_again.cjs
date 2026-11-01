const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// Replace font family
content = content.replace(
  /style=\{\{ fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' \}\}/g,
  'style={{ fontFamily: \'"Microsoft YaHei", "微软雅黑", sans-serif\' }}'
);

// Adjust margins for words
content = content.replace(
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[2px] sm:mx-0 py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;',
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[1px] sm:mx-[1px] py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;'
);

// Adjust margins for punctuation
content = content.replace(
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0.5 -mx-[2px] sm:mx-0 select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tighter sm:tracking-normal"',
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0.5 -mx-[1px] sm:mx-[1px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tight sm:tracking-normal"'
);

// Adjust tracking for words
content = content.replace(
  'className={`font-normal tracking-tighter sm:tracking-normal',
  'className={`font-normal tracking-tight sm:tracking-normal'
);

fs.writeFileSync('src/components/TextReader.tsx', content);
