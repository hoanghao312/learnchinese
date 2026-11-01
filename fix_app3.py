import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r'setSyncWordCount\(total\);\n            \}\);\n            setSavedWords\(mergedSavedWords\);'
# there might be spaces
pattern = r'setSyncWordCount\(total\);\s*\}\);\s*setSavedWords\(mergedSavedWords\);'
replacement = 'setSyncWordCount(total);\n            });\n            localStorage.removeItem("deleted_word_ids");\n            setSavedWords(mergedSavedWords);'

new_content = re.sub(pattern, replacement, content)

if content == new_content:
    print("Failed to replace")
else:
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced")

