const fs = require('fs');
let content = fs.readFileSync('src/components/NotebookChat.tsx', 'utf8');

const targetStr = `export default function NotebookChat({ onClose, onSendToLearning, savedWords = [] }: NotebookChatProps) {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string, msgId: string} | null>(null);`;

const replaceStr = `export default function NotebookChat({ onClose, onSendToLearning, savedWords = [], folders = [] }: NotebookChatProps) {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string, msgId: string} | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyFilterType, setStoryFilterType] = useState<'vocab' | 'folder'>('vocab');
  const [storyUnknownCount, setStoryUnknownCount] = useState(20);
  const [storyKnownCount, setStoryKnownCount] = useState(30);
  const [storyFolderId, setStoryFolderId] = useState<string>('');`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/NotebookChat.tsx', content);
