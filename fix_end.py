import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

content = content.replace("        )}\n      {contextMenu && (", "        )}\n      </AnimatePresence>\n      {contextMenu && (")

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
