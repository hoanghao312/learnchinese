const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// For punctuation, remove mx classes completely and use negative margin
content = content.replace(
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0.5 -mx-[1px] sm:mx-[1px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tight sm:tracking-normal"',
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0 -mx-[1.5px] sm:-mx-[1px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tighter sm:tracking-tighter"'
);

// For words, change buttonClasses to negative margins
content = content.replace(
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[1px] sm:mx-[1px] py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;',
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[1.5px] sm:-mx-[1px] py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;'
);

// For words tracking
content = content.replace(
  'className={`font-normal tracking-tight sm:tracking-normal select-text whitespace-nowrap leading-none transition-colors duration-200 group-hover:text-[#32CD32] group-hover:[text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] ${',
  'className={`font-normal tracking-tighter sm:tracking-tighter select-text whitespace-nowrap leading-none transition-colors duration-200 group-hover:text-[#32CD32] group-hover:[text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] ${'
);

fs.writeFileSync('src/components/TextReader.tsx', content);
