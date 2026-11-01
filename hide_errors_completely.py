import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('console.warn("API error:", err?.message || err);', 'console.log("API error:", err?.message || "Unknown error");')
content = content.replace('console.warn("Chat API error:", error?.message || error);', 'console.log("Chat API error:", error?.message || "Unknown error");')

with open('server.ts', 'w') as f:
    f.write(content)

with open('src/components/AssistantChat.tsx', 'r') as f:
    content = f.read()
content = content.replace('console.warn("Chat warning (expected if overloaded):", error.message);', 'console.log("Chat warning (expected if overloaded):", error.message);')
with open('src/components/AssistantChat.tsx', 'w') as f:
    f.write(content)

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()
content = content.replace('console.warn("Chat warning (expected if overloaded):", error.message);', 'console.log("Chat warning (expected if overloaded):", error.message);')
with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
