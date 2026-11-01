const fs = require('fs');
let content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

// 1. Remove the title row and fix top padding of sticky header
const target1 = `      {/* Sticky Header Section */}
      <div className="sticky top-[68px] z-30 bg-white dark:bg-slate-900 pb-3 pt-1 -mx-4 px-4 md:-mx-6 md:px-6 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-5">
        <div className="flex justify-center w-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Book className="w-4 h-4 text-amber-500" />
            <span>TỪ VỰNG ({savedWords.length})</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">`;

const replace1 = `      {/* Sticky Header Section */}
      <div className="sticky top-[68px] z-30 bg-white dark:bg-slate-900 pb-4 pt-4 -mx-4 px-4 md:-mx-6 md:px-6 mb-6 border-b border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">`;
content = content.replace(target1, replace1);

// 2. Put the filter bar inside the sticky header
const target2 = `            </button>
            </div>
          </div>
        </div>
      </div>
      {/* Drive-style Filter Bar */}
      <div className="flex items-center gap-2 mb-4 w-full">`;

const replace2 = `            </button>
            </div>
          </div>
          {/* Drive-style Filter Bar */}
          <div className="flex items-center gap-2 mt-2 w-full">`;
content = content.replace(target2, replace2);

// 3. Remove the extra closing div and close the sticky header instead
const target3 = `            {activeFilter !== 'known' && <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
          </button>
      </div>
      </div>
      {/* Add Custom Word Form */}`;

const replace3 = `            {activeFilter !== 'known' && <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
          </button>
        </div>
      </div>
      {/* Add Custom Word Form */}`;
content = content.replace(target3, replace3);

fs.writeFileSync('src/components/SavedWordsList.tsx', content);
console.log('Done cleaning');
