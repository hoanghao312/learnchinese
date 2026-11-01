const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldVocabClose = `            />
          </div>
        </div>
        )}
        
      {/* Account & Sync Tab */}`;

const newVocabClose = `            />
          </div>
        </div>
        
      {/* Account & Sync Tab */}`;

content = content.replace(oldVocabClose, newVocabClose);

fs.writeFileSync('src/App.tsx', content);
