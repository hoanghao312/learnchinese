import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# Add states
state_injection = """  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [hskFilter, setHskFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('default');"""
content = re.sub(r'(const \[searchQuery, setSearchQuery\] = useState\(""\);)', r'\1\n' + state_injection, content)

# Modify filtering logic
# Find: const filteredWords = savedWords.filter((word) => { ... });
filter_pattern = r'const filteredWords = savedWords\.filter\(\(word\) => \{[\s\S]*?\}\);'

match = re.search(filter_pattern, content)
if match:
    old_filter_logic = match.group(0)
    
    new_filter_logic = """const filteredWords = savedWords.filter((word) => {
    if (activeFilter === 'learning' && word.isKnown) return false;
    if (activeFilter === 'known' && !word.isKnown) return false;
    
    if (hskFilter.length > 0) {
      const lvl = word.hskLevel || 'Chưa phân loại';
      if (!hskFilter.includes(lvl)) return false;
    }
    
    if (activeFolderId === 'uncategorized' && word.folderId) return false;
    if (activeFolderId && activeFolderId !== 'uncategorized' && activeFolderId !== 'all') {
      if (word.folderId !== activeFolderId) {
        let isDescendant = false;
        let currentParent = folders.find(f => f.id === word.folderId)?.parentId;
        while (currentParent) {
          if (currentParent === activeFolderId) {
            isDescendant = true;
            break;
          }
          currentParent = folders.find(f => f.id === currentParent)?.parentId;
        }
        if (!isDescendant) return false;
      }
    }
    const query = searchQuery.toLowerCase();
    return (
      word.text.includes(query) ||
      word.pinyin.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query) ||
      (word.partOfSpeech && word.partOfSpeech.toLowerCase().includes(query))
    );
  });

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortBy === 'date_desc') return (b.savedAt || 0) - (a.savedAt || 0);
    if (sortBy === 'date_asc') return (a.savedAt || 0) - (b.savedAt || 0);
    if (sortBy === 'score_desc') return (b.lastPracticeScore || 0) - (a.lastPracticeScore || 0);
    if (sortBy === 'score_asc') return (a.lastPracticeScore || 0) - (b.lastPracticeScore || 0);
    
    // default sort: HSK level ascending (HSK 1 -> HSK 6). No level -> 3.5 (above HSK 4)
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
    
    // fallback to newest date if same HSK
    return (b.savedAt || 0) - (a.savedAt || 0);
  });"""

    content = content.replace(old_filter_logic, new_filter_logic)

# Update render to use sortedWords instead of filteredWords
content = content.replace("filteredWords.slice(", "sortedWords.slice(")
content = content.replace("filteredWords.length", "sortedWords.length")
content = content.replace("filteredWords.map", "sortedWords.map")

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)
