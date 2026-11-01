import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

# 1. Update Props
content = re.sub(
    r'interface NotebookChatProps \{',
    'interface NotebookChatProps {\n  savedWords: any[];',
    content
)
content = re.sub(
    r'export default function NotebookChat\(\{ onClose, onSendToLearning \}: NotebookChatProps\) \{',
    'export default function NotebookChat({ onClose, onSendToLearning, savedWords }: NotebookChatProps) {',
    content
)

# 2. Remove sources state and loadData parts for sources
content = re.sub(r'const \[sources, setSources\] = useState<Source\[\]>\(\[\]\);\n', '', content)
content = re.sub(r'const \[sidebarTab, setSidebarTab\] = useState<\'sources\' \| \'history\'>\(\'sources\'\);\n', '', content)

# 3. Rewrite handleSend
def replace_handle_send(match):
    return """  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!savedWords || savedWords.length === 0) {
      alert("Bạn chưa có từ vựng nào trong thư viện để làm ngữ cảnh.");
      return;
    }

    // Build context from vocabulary
    const vocabularyList = savedWords.map(w => 
      `- ${w.text} (${w.pinyin}): ${w.translation} ${w.partOfSpeech ? '[' + w.partOfSpeech + ']' : ''}`
    ).join('\\n');
    
    const combinedContext = `TÀI LIỆU (DANH SÁCH TỪ VỰNG CỦA TÔI):\\n${vocabularyList}`;

    const userText = input.trim();
    setInput('');
    setInputHeight(52);
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/notebook-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: messages.filter(m => m.id !== 'welcome'),
          message: userText,
          documentContext: combinedContext
        })"""

content = re.sub(r'  const handleSend = async \(e\?: React\.FormEvent\) => \{[\s\S]*?body: JSON\.stringify\(\{\n          history: messages\.filter\(m => m\.id !== \'welcome\'\),\n          message: userText,\n          documentContext: combinedContext\n        \}\)', replace_handle_send, content)

# 4. Remove sidebar rendering entirely or just keep History.
# Actually, it's easier to just strip the sidebar entirely or keep only the History part.
# The user's screenshot shows the Sidebar with Tabs: [Nguồn] [Đoạn chat].
# We can just remove the tabs and keep it as History (Đoạn chat).

# Let's write the whole file to make it cleaner, or use python script if possible.
# Using python script to replace the sidebar rendering:
