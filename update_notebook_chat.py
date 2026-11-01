import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# Replace the vocabularyList formatting
pattern = r"""// Build context from vocabulary
    const vocabularyList = savedWords\.map\(w => 
      `- \$\{w\.text\} \(\$\{w\.pinyin\}\): \$\{w\.translation\} \$\{w\.partOfSpeech \? '\[' \+ w\.partOfSpeech \+ '\]' : ''\}`
    \)\.join\('\\n'\);"""

replacement = """// Build context from vocabulary
    const vocabularyList = savedWords.map(w => {
      let info = `- Từ vựng: ${w.text} | Pinyin: ${w.pinyin} | Nghĩa: ${w.translation}`;
      if (w.hskLevel) info += ` | Cấp độ: ${w.hskLevel}`;
      if (w.partOfSpeech) info += ` | Từ loại: ${w.partOfSpeech}`;
      if (w.example) info += ` | Ví dụ: ${w.example.chinese} (${w.example.pinyin}) - ${w.example.vietnamese}`;
      return info;
    }).join('\\n');"""

content = re.sub(pattern, replacement, content)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
