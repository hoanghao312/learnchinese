import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# The grid view starts around line 913. We only want to modify the grid view.
# Let's just find the grid view part and apply the calc(1rem + ...) ONLY there.
# For now, let's revert everything first.

content = content.replace('`calc(1rem + ${(level + 1) * 24}px)`', '`${level * 24}px`')
content = content.replace('`calc(1rem + ${(level + 2) * 24}px)`', '`${(level + 1) * 24}px`')

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)

print("Reverted")
