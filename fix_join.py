with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

content = content.replace("}).join('');", "}).join('\\n');")

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)
