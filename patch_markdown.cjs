const fs = require('fs');

const files = ['src/components/NotebookChat.tsx', 'src/components/AssistantChat.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  
  if (!code.includes('import rehypeRaw from "rehype-raw";')) {
    code = code.replace("import ReactMarkdown from 'react-markdown';", "import ReactMarkdown from 'react-markdown';\nimport rehypeRaw from 'rehype-raw';");
  }

  code = code.replace("<ReactMarkdown>{msg.content}</ReactMarkdown>", "<ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>");
  
  fs.writeFileSync(file, code);
}
