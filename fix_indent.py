import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# For custom folders
pattern_custom = r'style=\{\{\s*paddingLeft:\s*`\$\{\s*level\s*\*\s*24\s*\}px`\s*\}\}'
replacement_custom = r'style={{ paddingLeft: `calc(1rem + ${(level + 1) * 24}px)` }}' # 1rem = 16px (equivalent to px-4)

# For subfolder input
pattern_subfolder = r'style=\{\{\s*paddingLeft:\s*`\$\{\s*\(\s*level\s*\+\s*1\s*\)\s*\*\s*24\s*\}px`\s*\}\}'
replacement_subfolder = r'style={{ paddingLeft: `calc(1rem + ${(level + 2) * 24}px)` }}'

content = re.sub(pattern_custom, replacement_custom, content)
content = re.sub(pattern_subfolder, replacement_subfolder, content)

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)

print("Done")
