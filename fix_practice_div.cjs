const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

// first remove the wrongly placed </div>
content = content.replace('                    </div>\n                      })()}', '                      })()}');

// then add it after })()}
content = content.replace('                      })()}\n                                        <div className="grid', '                      })()}\n                    </div>\n                    <div className="grid');

fs.writeFileSync('src/components/Practice.tsx', content);
