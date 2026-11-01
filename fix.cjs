const fs = require('fs');
const content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

// 1. Add getFolderPath before NotebookChat component or inside it.
// Let's just add it inside the component, near the top.
const insertHelperRegex = /(const \[storyFolderId, setStoryFolderId\] = useState<string>\(""\);)/;
const helperCode = `
  const getFolderPath = (folderId: string): string => {
    const folder = folders?.find(f => f.id === folderId);
    if (!folder) return '';
    if (!folder.parentId) return folder.name;
    return \`\${getFolderPath(folder.parentId)} / \${folder.name}\`;
  };
`;
let newContent = content.replace(insertHelperRegex, "$1\n" + helperCode);

// 2. Replace the select dropdown rendering
const selectRegex = /folders\.map\(f => \{[\s\S]*?return \([\s\S]*?<option key=\{f\.id\} value=\{f\.id\}>\{f\.name\} \(\{wordCount\} từ\)<\/option>\n\s*\);\n\s*\}\)/;
const newSelectCode = `[...folders].sort((a, b) => getFolderPath(a.id).localeCompare(getFolderPath(b.id))).map(f => {
                            const getDescendantFolderIds = (parentId: string): string[] => {
                              if (!folders) return [];
                              const children = folders.filter(cf => cf.parentId === parentId).map(cf => cf.id);
                              return children.reduce((acc, childId) => [...acc, childId, ...getDescendantFolderIds(childId)], [] as string[]);
                            };
                            const validFolderIds = [f.id, ...getDescendantFolderIds(f.id)];
                            const wordCount = savedWords.filter(w => w.folderId && validFolderIds.includes(w.folderId)).length;
                            return (
                              <option key={f.id} value={f.id}>{getFolderPath(f.id)} ({wordCount} từ)</option>
                            );
                          })`;
newContent = newContent.replace(selectRegex, newSelectCode);

// 3. Update folderWords to use sortedSavedWords
const folderWordsRegex = /const folderWords = savedWords\.filter\(w => w\.folderId && validFolderIds\.includes\(w\.folderId\)\)\.map\(w => w\.text\);/;
newContent = newContent.replace(folderWordsRegex, "const folderWords = sortedSavedWords.filter(w => w.folderId && validFolderIds.includes(w.folderId)).map(w => w.text);");

// 4. Update folderName to use getFolderPath
const folderNameRegex = /const folderName = folders\?\.find\(f => f\.id === storyFolderId\)\?\.name \|\| 'Thư mục';/;
newContent = newContent.replace(folderNameRegex, "const folderName = getFolderPath(storyFolderId) || 'Thư mục';");

fs.writeFileSync('src/components/NotebookChat.tsx', newContent, 'utf8');
