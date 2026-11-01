const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const searchStr = `            </div>
            { (activeFilter === 'learning' || activeFilter === 'known') && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}`;

const replaceStr = `            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}`;

if (content.includes(searchStr)) {
  fs.writeFileSync('src/components/SavedWordsList.tsx', content.replace(searchStr, replaceStr));
  console.log("Successfully fixed advanced filters button condition");
} else {
  console.log("Could not find advanced filters button string");
}
