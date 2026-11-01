import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# Split content by renderFolderRow to only affect grid
parts = content.split('const renderFolderRow = (f, level) => {')

if len(parts) == 2:
    grid_part = parts[1]
    
    grid_part = grid_part.replace('style={{ paddingLeft: `${level * 24}px` }}', 'style={{ paddingLeft: `calc(1rem + ${(level + 1) * 24}px)` }}')
    grid_part = grid_part.replace('style={{ paddingLeft: `${(level + 1) * 24}px` }}', 'style={{ paddingLeft: `calc(1rem + ${(level + 2) * 24}px)` }}')
    
    content = parts[0] + 'const renderFolderRow = (f, level) => {' + grid_part

    with open('src/components/SavedWordsList.tsx', 'w') as f:
        f.write(content)
    print("Fixed grid indent")
else:
    print("Could not find renderFolderRow")

