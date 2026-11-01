import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r'setSyncWordCount\(total\);\n            \}\);\n            setSavedWords\(mergedSavedWords\);'
replacement = 'setSyncWordCount(total);\n            });\n            localStorage.removeItem("deleted_word_ids");\n            setSavedWords(mergedSavedWords);'

new_content = re.sub(pattern, replacement, content)

if content == new_content:
    print("Failed to replace string 1")
else:
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced string 1")


pattern2 = r'setSyncWordCount\(total\);\n            \}\);\n          \}\n          setSyncWordCount'
replacement2 = 'setSyncWordCount(total);\n            });\n            localStorage.removeItem("deleted_word_ids");\n          }\n          setSyncWordCount'

content = new_content
new_content2 = re.sub(pattern2, replacement2, content)

if content == new_content2:
    print("Failed to replace string 2")
else:
    with open('src/App.tsx', 'w') as f:
        f.write(new_content2)
    print("Successfully replaced string 2")

