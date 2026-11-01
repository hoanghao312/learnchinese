const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

content = content.replace(
  '<span className="font-sans font-bold text-slate-400 mr-2 flex items-center gap-1">',
  '<span className="font-sans font-bold text-slate-400 mr-2 inline-flex items-center gap-1">'
);

content = content.replace(
  '<div className="font-bold text-slate-400 mb-1 flex items-center gap-1">',
  '<div className="font-bold text-slate-400 mb-1 flex items-center gap-1">' // This one is fine as flex
);

fs.writeFileSync('src/components/Practice.tsx', content);
