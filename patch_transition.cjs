const fs = require('fs');
const content = fs.readFileSync('src/components/SavedWordsList.tsx', 'utf-8');

const targetStr = `<div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
            {(() => {
              const paginatedWords = filteredWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              return paginatedWords.map((word, index) => {`;

const replacementStr = `<div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar relative">
            <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPage + (activeFilter || "") + (activeFolderId || "")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2"
            >
            {(() => {
              const paginatedWords = filteredWords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              return paginatedWords.map((word, index) => {`;

const newContent = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/SavedWordsList.tsx', newContent);
