import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# Remove remaining source variables and functions
content = re.sub(r'const \[sources, setSources\].*\n', '', content)
content = re.sub(r'const \[showUploader, setShowUploader\].*\n', '', content)
content = re.sub(r'const \[sidebarTab, setSidebarTab\].*\n', '', content)
content = re.sub(r'interface Source \{[\s\S]*?\}', '', content)

# Remove selectAllSources, toggleSourceSelection if they exist
content = re.sub(r'const selectAllSources = \(\) => \{[\s\S]*?\};\n', '', content)
content = re.sub(r'const toggleSourceSelection = \(.*?\) => \{[\s\S]*?\};\n', '', content)
content = re.sub(r'useEffect\(\(\) => \{\s*localforage\.setItem\(\'notebook_sources\', sources\);\s*\}, \[sources\]\);\n', '', content)

# Remove the header buttons
header_pattern = r'<div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">[\s\S]*?</div>'
header_replacement = '''<div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
                  <div className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">
                    Đoạn chat
                  </div>
                </div>'''
content = re.sub(header_pattern, header_replacement, content)

# Remove modal
modal_pattern = r'\{showUploader && \([\s\S]*?\}\)\}\s*/>\s*</div>\s*</motion\.div>\s*</motion\.div>\s*\)\}'
content = re.sub(modal_pattern, '', content)

# Remove handleSend selectedSources check if they still exist somehow?
# They shouldn't if my previous script worked, but let's check
if "const selectedSources = sources" in content:
    print("Found old handleSend!")

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
