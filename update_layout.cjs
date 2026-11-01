const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// Ensure Home, UserIcon, Book are imported
app = app.replace(
  'ScanText,\n  Loader2\n} from "lucide-react";',
  'ScanText,\n  Loader2,\n  Home,\n  Book,\n  User as UserIcon\n} from "lucide-react";'
);

const headerStart = `<header className="bg-white border-b border-slate-100 px-4 py-3 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-40 shadow-xs" id="app-header">`;
const mainContainerStart = `<div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8 pb-32">`;

// I need to split the app into 3 sections.
// We'll wrap the inputs + reader in `{mainTab === 'home' && (...)}`
// We'll wrap the SavedWordsList in `{mainTab === 'vocabulary' && (...)}`
// We'll put the account things in `{mainTab === 'account' && (...)}`
// And we need to remove the account things from the header.

// Let's replace the header completely with a simpler one that just shows "HỌC TỪ VỰNG"
const newHeader = `<header className="bg-white border-b border-slate-100 px-4 py-3 md:px-12 flex flex-col sm:flex-row items-center justify-center sm:justify-start sticky top-0 z-40 shadow-xs" id="app-header">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-orange-500/20">
            H
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
              HỌC TỪ VỰNG
            </h1>
          </div>
        </div>
      </header>`;

// Use regex to find and replace the whole header
app = app.replace(/<header className="bg-white border-b border-slate-100 px-4 py-3 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-40 shadow-xs" id="app-header">[\s\S]*?<\/header>/, newHeader);

// Now wrap the content of `mainContainerStart`
app = app.replace(
  '{/* Top Side: Inputs / Presets Library */}',
  `{mainTab === 'home' && (
          <>\n        {/* Top Side: Inputs / Presets Library */}`
);

// Close the home tab and open the vocabulary tab
app = app.replace(
  '{/* Full width row for Tabular saved words / Lexicon library */}',
  `</>\n        )}

        {/* Full width row for Tabular saved words / Lexicon library */}
        {mainTab === 'vocabulary' && (`
);

// Close the vocabulary tab
app = app.replace(
  '            />\n          </div>\n        </div>',
  `            />\n          </div>\n        </div>\n        )}`
);

// Now add the Account tab content
const accountTabContent = `
        {/* Account & Sync Tab */}
        {mainTab === 'account' && (
          <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-slate-800">Tài khoản & Sao lưu</h2>
              </div>
              
              {currentUser ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <img src={currentUser.photoURL || ""} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-lg truncate">{currentUser.displayName}</div>
                      <div className="text-slate-500 text-sm truncate">{currentUser.email}</div>
                    </div>
                    <button 
                      onClick={() => logout()}
                      className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Đồng bộ Cloud</h3>
                    
                    {syncStatus === 'pushing' || syncStatus === 'pulling' ? (
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" /> 
                          <span>{syncStatus === 'pushing' ? \`Đang tải lên \${syncProgress}/\${syncWordCount}...\` : \`Đang tải về \${syncProgress}/\${syncWordCount}...\`}</span>
                        </div>
                        <button 
                          onClick={handleStopSync}
                          className="p-2 hover:bg-blue-100 rounded-full transition-colors shrink-0"
                          title="Dừng đồng bộ"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={handlePushToCloud}
                          className="flex items-center justify-center gap-2 font-semibold transition-colors px-4 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm" 
                        >
                          <Upload className="w-5 h-5" /> Tải lên Cloud
                        </button>
                        <button 
                          onClick={handlePullFromCloud}
                          className="flex items-center justify-center gap-2 font-semibold transition-colors px-4 py-3 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm" 
                        >
                          <Download className="w-5 h-5" /> Tải về máy
                        </button>
                      </div>
                    )}
                    
                    {syncStatus === 'success_push' && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                        <Cloud className="w-4 h-4" /> Đã hoàn thành tải lên ({syncWordCount} từ)
                      </div>
                    )}
                    {syncStatus === 'success_pull' && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                        <Download className="w-4 h-4" /> Đã hoàn thành tải về ({syncWordCount} từ)
                      </div>
                    )}
                    {lastSyncTime && syncStatus !== 'pushing' && syncStatus !== 'pulling' && (
                      <div className="text-center text-xs text-slate-500">
                        Đồng bộ lần cuối: {lastSyncTime.toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CloudOff className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Chưa đăng nhập</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Đăng nhập bằng tài khoản Google để có thể đồng bộ và sao lưu dữ liệu từ vựng của bạn lên Cloud.</p>
                  <button 
                    onClick={() => googleSignIn()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
`;

app = app.replace(
  '        {/* Modals & Overlays */}',
  accountTabContent + '\n        {/* Modals & Overlays */}'
);

// Add bottom navigation bar before the closing of #interactive-app-root
const bottomNav = `
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 sm:px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe flex justify-around sm:justify-center sm:gap-16 items-center">
        <button 
          onClick={() => setMainTab('home')}
          className={\`flex flex-col items-center justify-center w-20 h-14 gap-1 rounded-2xl transition-all \${mainTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}\`}
        >
          <div className={\`flex items-center justify-center w-8 h-8 rounded-xl transition-all \${mainTab === 'home' ? 'bg-blue-100 text-blue-600' : ''}\`}>
            <Home className={\`\${mainTab === 'home' ? 'w-5 h-5' : 'w-6 h-6'}\`} />
          </div>
          <span className={\`text-[10px] sm:text-xs font-semibold \${mainTab === 'home' ? 'opacity-100' : 'opacity-70'}\`}>Học tập</span>
        </button>

        <button 
          onClick={() => setMainTab('vocabulary')}
          className={\`flex flex-col items-center justify-center w-20 h-14 gap-1 rounded-2xl transition-all \${mainTab === 'vocabulary' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}\`}
        >
          <div className={\`flex items-center justify-center w-8 h-8 rounded-xl transition-all \${mainTab === 'vocabulary' ? 'bg-amber-100 text-amber-600' : ''}\`}>
            <Book className={\`\${mainTab === 'vocabulary' ? 'w-5 h-5' : 'w-6 h-6'}\`} />
          </div>
          <span className={\`text-[10px] sm:text-xs font-semibold \${mainTab === 'vocabulary' ? 'opacity-100' : 'opacity-70'}\`}>Từ vựng</span>
        </button>

        <button 
          onClick={() => setMainTab('account')}
          className={\`flex flex-col items-center justify-center w-20 h-14 gap-1 rounded-2xl transition-all \${mainTab === 'account' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}\`}
        >
          <div className={\`flex items-center justify-center w-8 h-8 rounded-xl transition-all \${mainTab === 'account' ? 'bg-emerald-100 text-emerald-600' : ''}\`}>
            <UserIcon className={\`\${mainTab === 'account' ? 'w-5 h-5' : 'w-6 h-6'}\`} />
          </div>
          <span className={\`text-[10px] sm:text-xs font-semibold \${mainTab === 'account' ? 'opacity-100' : 'opacity-70'}\`}>Tài khoản</span>
        </button>
      </div>
    </div>
  );
}`;

app = app.replace(
  '    </div>\n  );\n}',
  bottomNav
);

fs.writeFileSync('src/App.tsx', app);
