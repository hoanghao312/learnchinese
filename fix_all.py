import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# Fix setSidebarTab
content = re.sub(r'setSidebarTab\(\'history\'\);', '', content)

# Fix sources in useEffect
pattern = r"  useEffect\(\(\) => \{\s*if \(!isInitializing\) \{\s*localforage\.setItem\(\'notebook_sources\', sources\)\.catch\(console\.error\);\s*\}\s*\}, \[sources, isInitializing\]\);"
content = re.sub(pattern, "", content)

# Fix sources.length === 0 in render
content = content.replace("sources.length === 0 &&", "")

# Fix showUploader and modal
modal_pattern = r'\{showUploader && \([\s\S]*?\}\)\}\s*/>\s*</div>\s*</motion\.div>\s*</motion\.div>\s*\)\}'
content = re.sub(modal_pattern, '', content)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
