import re

with open('src/components/SavedWordsList.tsx', 'r') as f:
    content = f.read()

# 1. Add state
state_pattern = r'const \[hskFilter, setHskFilter\] = useState<string\[\]>\(\[\]\);'
state_replacement = '''const [hskFilter, setHskFilter] = useState<string[]>([]);
  const [missingDataFilter, setMissingDataFilter] = useState<("pinyin"|"translation"|"partOfSpeech"|"hskLevel")[]>([]);'''
content = content.replace('const [hskFilter, setHskFilter] = useState<string[]>([]);', state_replacement)

# 2. Update useEffect
useEffect_pattern = r'\}, \[searchQuery, activeFilter, activeFolderId, hskFilter, sortBy\]\);'
useEffect_replacement = r'}, [searchQuery, activeFilter, activeFolderId, hskFilter, sortBy, missingDataFilter]);'
content = content.replace('}, [searchQuery, activeFilter, activeFolderId, hskFilter, sortBy]);', useEffect_replacement)

# 3. Update filtering logic
filter_pattern = r'''    if \(hskFilter\.length > 0\) \{
      const lvl = word\.hskLevel \|\| 'Chưa phân loại';
      if \(!hskFilter\.includes\(lvl\)\) return false;
    \}'''
filter_replacement = '''    if (hskFilter.length > 0) {
      const lvl = word.hskLevel || 'Chưa phân loại';
      if (!hskFilter.includes(lvl)) return false;
    }

    if (missingDataFilter.length > 0) {
      const isMissingPinyin = !word.pinyin || word.pinyin === '?';
      const isMissingTranslation = !word.translation || word.translation === '(Chưa cấp nghĩa)';
      const isMissingPoS = !word.partOfSpeech;
      const isMissingHsk = !word.hskLevel;

      let matchMissing = false;
      if (missingDataFilter.includes('pinyin') && isMissingPinyin) matchMissing = true;
      if (missingDataFilter.includes('translation') && isMissingTranslation) matchMissing = true;
      if (missingDataFilter.includes('partOfSpeech') && isMissingPoS) matchMissing = true;
      if (missingDataFilter.includes('hskLevel') && isMissingHsk) matchMissing = true;

      if (!matchMissing) return false;
    }'''
content = re.sub(filter_pattern, filter_replacement, content)

# 4. Update Reset button
reset_pattern = r'''                        setHskFilter\(\[\]\);
                        setSortBy\('default'\);
                      \}\}'''
reset_replacement = '''                        setHskFilter([]);
                        setSortBy('default');
                        setMissingDataFilter([]);
                      }}'''
content = re.sub(reset_pattern, reset_replacement, content)

# 5. Add to Advanced Filter Modal
modal_pattern = r'''                    \{/\* Score Sorting \*/\}'''
modal_replacement = '''                    {/* Missing Data Filter */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Từ vựng thiếu thông tin</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'pinyin', label: 'Thiếu Pinyin' },
                          { id: 'translation', label: 'Thiếu Nghĩa' },
                          { id: 'partOfSpeech', label: 'Thiếu Loại từ' },
                          { id: 'hskLevel', label: 'Thiếu HSK' }
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setMissingDataFilter(prev => 
                                prev.includes(item.id as any) 
                                  ? prev.filter(i => i !== item.id) 
                                  : [...prev, item.id as any]
                              );
                            }}
                            className={`px-4 py-2 rounded text-sm transition-colors border ${missingDataFilter.includes(item.id as any) ? 'bg-white text-blue-600 border-blue-500 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Score Sorting */}'''
content = content.replace('                    {/* Score Sorting */}', modal_replacement)

with open('src/components/SavedWordsList.tsx', 'w') as f:
    f.write(content)

print("Done")
