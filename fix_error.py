import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

pattern = r'''if \(!response\.ok\) \{
        throw new Error\('Network response was not ok'\);
      \}'''

replacement = '''if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }'''

content = content.replace(pattern, replacement)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done notebook")

with open('src/components/AssistantChat.tsx', 'r') as f:
    content = f.read()

content = content.replace(pattern, replacement)

with open('src/components/AssistantChat.tsx', 'w') as f:
    f.write(content)

print("Done assistant")
