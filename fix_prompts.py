import re

def update_file(filename, storage_key):
    with open(filename, 'r') as f:
        content = f.read()

    # Replace useState('') with useState(() => localStorage.getItem(key) || '')
    content = content.replace("const [input, setInput] = useState('');", f"const [input, setInput] = useState(() => localStorage.getItem('{storage_key}') || '');")
    
    # Add useEffect to save to localStorage
    if "localStorage.setItem" not in content:
        # Find where to insert useEffect. After const messagesEndRef = useRef<HTMLDivElement>(null); is a good place
        insert_target = "const messagesEndRef = useRef<HTMLDivElement>(null);"
        use_effect_code = f"""const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {{
    localStorage.setItem('{storage_key}', input);
  }}, [input]);"""
        if insert_target in content:
             content = content.replace(insert_target, use_effect_code)
        else:
             print(f"Warning: Could not find insert target in {filename}")
             
    # Also, we should clear the prompt from local storage when the user SENDS a message, but `setInput('')` will trigger the useEffect and update local storage to '' anyway!
    
    with open(filename, 'w') as f:
        f.write(content)

update_file('src/components/NotebookChat.tsx', 'notebook_chat_draft')
update_file('src/components/AssistantChat.tsx', 'assistant_chat_draft')
print("Done")
