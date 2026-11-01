import re

with open('src/components/NotebookChat.tsx', 'r') as f:
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

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

with open('src/components/AssistantChat.tsx', 'r') as f:
    content = f.read()

pattern_assistant = r"""catch \(error\) \{
      console\.error\('Chat error:', error\);
      // .*
      setMessages\(prev => \{
        const newMessages = \[\.\.\.prev\];
        const lastMsg = newMessages\[newMessages\.length - 1\];
        if \(lastMsg\.role === 'model' && lastMsg\.content === ''\) \{
          newMessages\.pop\(\);
        \}
        return newMessages;
      \}\);
      // .*
      setMessages\(prev => \[
        \.\.\.prev, 
        \{ 
          id: Date\.now\(\)\.toString\(\), 
          role: 'model', 
          content: 'Lỗi kết nối hoặc phản hồi bị lỗi\.' 
        \}
      \]\);
    \}"""

replacement_assistant = """catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'model' && lastMsg.content === '') {
          newMessages.pop();
        }
        return newMessages;
      });
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'model', 
          content: error.message || 'Lỗi kết nối hoặc phản hồi bị lỗi.' 
        }
      ]);
    }"""

content = re.sub(pattern_assistant, replacement_assistant, content, flags=re.DOTALL)

with open('src/components/AssistantChat.tsx', 'w') as f:
    f.write(content)

print("Done")
