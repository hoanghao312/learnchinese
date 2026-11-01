import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern1 = r'nextReviewDateZhVi: sm2.nextReviewDate\s*};'
replacement1 = 'nextReviewDateZhVi: sm2.nextReviewDate,\n                            lastModified: Date.now()\n                          };'
content = re.sub(pattern1, replacement1, content)

pattern2 = r'nextReviewDateViZh: sm2.nextReviewDate\s*};'
replacement2 = 'nextReviewDateViZh: sm2.nextReviewDate,\n                            lastModified: Date.now()\n                          };'
content = re.sub(pattern2, replacement2, content)

pattern3 = r'nextReviewDateViZh: 0\s*};'
replacement3 = 'nextReviewDateViZh: 0,\n                        lastModified: Date.now()\n                      };'
content = re.sub(pattern3, replacement3, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
