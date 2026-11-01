import re

with open('src/components/AssistantChat.tsx', 'r') as f:
    content = f.read()

pattern = r"""catch \(error\) \{
      console\.error\("Chat error:", error\);
      setMessages\(prev => \[\.\.\.prev, \{
        id: Date\.now\(\)\.toString\(\),
        role: 'model',
        content: 'Xin lỗi, đã có lỗi xảy ra\. Bạn thử lại nhé\.'
      \}\]\);
    \}"""

replacement = """catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: error.message || 'Xin lỗi, đã có lỗi xảy ra. Bạn thử lại nhé.'
      }]);
    }"""

content = re.sub(pattern, replacement, content)

with open('src/components/AssistantChat.tsx', 'w') as f:
    f.write(content)

print("Done")
