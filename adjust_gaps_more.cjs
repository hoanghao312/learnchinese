const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// For punctuation
content = content.replace(
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0 -mx-[1.5px] sm:-mx-[1px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tighter sm:tracking-tighter"',
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0 -mx-[2.5px] sm:-mx-[2px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tighter sm:tracking-tighter"'
);

// For words
content = content.replace(
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[1.5px] sm:-mx-[1px] py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;',
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[2.5px] sm:-mx-[2px] py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;'
);

fs.writeFileSync('src/components/TextReader.tsx', content);
