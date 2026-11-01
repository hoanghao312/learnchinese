const fs = require('fs');
let content = fs.readFileSync('src/components/Practice.tsx', 'utf-8');

const target = `                      })()}
                    
                    <div className="grid`;

const target2 = `                      })()}
                    <div className="grid`;

const target3 = `                      })()}
                                        <div className="grid`;

const replacement = `                      })()}
                    </div>
                    
                    <div className="grid`;

content = content.replace(target, replacement);
content = content.replace(target2, replacement);
content = content.replace(target3, replacement);

fs.writeFileSync('src/components/Practice.tsx', content);
