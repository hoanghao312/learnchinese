with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

pattern = """    // Build context from vocabulary
    const vocabularyList = savedWords.map(w => {
      let info = `- Từ vựng: ${w.text} | Pinyin: ${w.pinyin} | Nghĩa: ${w.translation}`;
      if (w.hskLevel) info += ` | Cấp độ: ${w.hskLevel}`;
      if (w.partOfSpeech) info += ` | Từ loại: ${w.partOfSpeech}`;
      if (w.example) info += ` | Ví dụ: ${w.example.chinese} (${w.example.pinyin}) - ${w.example.vietnamese}`;
      return info;
    }).join('\\\\n');"""

replacement = """    // Sắp xếp từ vựng giống y hệt phần Từ vựng (ưu tiên HSK)
    const sortedWords = [...savedWords].sort((a, b) => {
      const getHskWeight = (level?: string) => {
        if (!level) return 3.5;
        const match = level.match(/HSK\\s*(\\d+)/i);
        if (match) return parseInt(match[1]);
        return 3.5;
      };
      const weightA = getHskWeight(a.hskLevel);
      const weightB = getHskWeight(b.hskLevel);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return (b.savedAt || 0) - (a.savedAt || 0);
    });

    // Build context from vocabulary with explicit numbering
    const vocabularyList = sortedWords.map((w, index) => {
      let info = `${index + 1}. Từ vựng: ${w.text} | Pinyin: ${w.pinyin} | Nghĩa: ${w.translation}`;
      if (w.hskLevel) info += ` | Cấp độ: ${w.hskLevel}`;
      if (w.partOfSpeech) info += ` | Từ loại: ${w.partOfSpeech}`;
      if (w.example) info += ` | Ví dụ: ${w.example.chinese} (${w.example.pinyin}) - ${w.example.vietnamese}`;
      return info;
    }).join('\\\\n');"""

content = content.replace(pattern, replacement)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)
print("Done")
