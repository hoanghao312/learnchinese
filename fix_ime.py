import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace the onKeyDown logic
    old_code = """onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}"""
    
    new_code = """onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    e.preventDefault();
                    handleSend();
                  }
                }}"""
                
    content = content.replace(old_code, new_code)
    
    old_code_2 = """onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}"""
              
    new_code_2 = """onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  e.preventDefault();
                  handleSend();
                }
              }}"""
              
    content = content.replace(old_code_2, new_code_2)

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('src/components/NotebookChat.tsx')
fix_file('src/components/AssistantChat.tsx')
print("Done")
