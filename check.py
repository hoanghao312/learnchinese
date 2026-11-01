import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "AnimatePresence" in line or "</>" in line:
            print(f"{i+1}: {line.strip()}")
