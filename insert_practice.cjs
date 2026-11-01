const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Insert the Practice view rendering
const viewTarget = `{mainTab === 'account' && (`;
const viewReplacement = `{mainTab === 'practice' && (
          <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4">
            <Practice savedWords={savedWords} />
          </div>
        )}

        {mainTab === 'account' && (`;
content = content.replace(viewTarget, viewReplacement);

// Update class for the main container
const containerClassTarget = `max-w-7xl px-2 sm:px-4 pt-2 pb-20 sm:pb-24 flex-1 min-h-0 overflow-hidden' : 'max-w-7xl p-4 md:p-8 pb-32'}\`}>`;
const containerClassReplacement = `max-w-7xl px-2 sm:px-4 pt-2 pb-20 sm:pb-24 flex-1 min-h-0 overflow-hidden' : mainTab === 'practice' ? 'max-w-7xl px-2 sm:px-4 pt-4 pb-20 sm:pb-24 flex-1 min-h-0 overflow-hidden' : 'max-w-7xl p-4 md:p-8 pb-32'}\`}>`;
content = content.replace(containerClassTarget, containerClassReplacement);

const htmlBodyClassTarget = `mainTab === 'vocabulary' || mainTab === 'chat' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}\`}`;
const htmlBodyClassReplacement = `mainTab === 'vocabulary' || mainTab === 'practice' || mainTab === 'chat' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}\`}`;
content = content.replace(htmlBodyClassTarget, htmlBodyClassReplacement);


// Insert the Nav Button
const navTarget = `<button 
          onClick={() => setMainTab('chat')}`;
const navReplacement = `<button 
          onClick={() => setMainTab('practice')}
          className={\`flex flex-col items-center justify-center w-20 h-14 gap-1 rounded-2xl transition-all \${mainTab === 'practice' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}\`}
        >
          <div className={\`flex items-center justify-center w-8 h-8 rounded-xl transition-all \${mainTab === 'practice' ? 'bg-rose-100 text-rose-600' : ''}\`}>
            <Dumbbell className={\`\${mainTab === 'practice' ? 'w-5 h-5' : 'w-6 h-6'}\`} />
          </div>
          <span className={\`text-[10px] sm:text-xs font-semibold \${mainTab === 'practice' ? 'opacity-100' : 'opacity-70'}\`}>Luyện tập</span>
        </button>

        <button 
          onClick={() => setMainTab('chat')}`;
content = content.replace(navTarget, navReplacement);

fs.writeFileSync('src/App.tsx', content);
