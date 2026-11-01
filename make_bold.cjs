const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// For punctuation
content = content.replace(
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-normal text-slate-800 dark:text-slate-200 px-0 sm:px-0 -mx-[0.5px] sm:-mx-[2px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tighter sm:tracking-tighter"',
  'className="text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] font-bold text-slate-800 dark:text-slate-200 px-0 sm:px-0 -mx-[0.5px] sm:-mx-[2px] select-text transition-all duration-200 py-1 self-end leading-none align-bottom tracking-tighter sm:tracking-tighter"'
);

// For words
content = content.replace(
  'className={`font-normal tracking-tighter sm:tracking-tighter select-text whitespace-nowrap leading-none transition-colors duration-200 group-hover:text-[#32CD32] group-hover:[text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] ${',
  'className={`font-bold tracking-tighter sm:tracking-tighter select-text whitespace-nowrap leading-none transition-colors duration-200 group-hover:text-[#32CD32] group-hover:[text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff] text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem] ${'
);

fs.writeFileSync('src/components/TextReader.tsx', content);
