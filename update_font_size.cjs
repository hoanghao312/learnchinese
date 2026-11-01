const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

// Update punctuation font size
content = content.replace(
  'text-[0.85rem] sm:text-[1.2rem] md:text-[1.45rem]',
  'text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem]'
);

// Update word font size
content = content.replace(
  'text-[0.85rem] sm:text-[1.2rem] md:text-[1.45rem]',
  'text-[1.1rem] sm:text-[1.3rem] md:text-[1.5rem]'
);

// Update font weight for punctuation to normal to match word
content = content.replace(
  'font-medium text-slate-800',
  'font-normal text-slate-800'
);

// Update gap to be very tight
content = content.replace(
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[3.5px] sm:-mx-[1px] md:mx-0 py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;',
  'let buttonClasses = `word-token-element group relative inline-flex flex-col items-center justify-end px-0 -mx-[2px] sm:mx-0 py-1 rounded-xl cursor-pointer transition-all duration-300 select-text whitespace-nowrap `;'
);

content = content.replace(
  '-mx-[3.5px] sm:mx-0 select-text',
  '-mx-[2px] sm:mx-0 select-text'
);

fs.writeFileSync('src/components/TextReader.tsx', content);
