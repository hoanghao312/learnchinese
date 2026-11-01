const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetStr = `              });
            })()}
          </AnimatePresence>
          </div>`;

const replacementStr = `              });
            })()}
            </motion.div>
          </AnimatePresence>
          </div>`;

const newContent = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/SavedWordsList.tsx', newContent);
