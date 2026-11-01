import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# We want to find `{sidebarTab === 'sources' ? (` and remove it and the first branch, up to `) : (`
pattern = r"\{sidebarTab === 'sources' \? \([\s\S]*?\) : \(\s*<>"
replacement = "<>"
content = re.sub(pattern, replacement, content)

# We also need to remove the closing brace `)}` of the ternary
# It's right before `</div>\s*</motion.div>\s*)}\s*</AnimatePresence>`
pattern2 = r"                </>\s*\)\}\s*</div>\s*</motion\.div>\s*\)\}\s*</AnimatePresence>"
replacement2 = "                </>\n            </div>\n          </motion.div>\n        )}\n      </AnimatePresence>"
content = re.sub(pattern2, replacement2, content)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Fixed")
