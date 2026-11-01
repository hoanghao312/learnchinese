const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update useState
content = content.replace(
  'const [mainTab, setMainTab] = useState<"home" | "vocabulary" | "chat" | "account">("home");',
  'const [mainTab, setMainTab] = useState<"home" | "vocabulary" | "practice" | "chat" | "account">("home");'
);

// 2. Add Practice icon import
content = content.replace(
  'import { MessageSquare, Book, Home, Settings, Search, Image as ImageIcon, Wand2, RefreshCw, Upload, Volume2, Save, FileText, Check, ChevronDown, Trash2, Library, Folder, Tag, AlertCircle, FileAudio, BookOpen, Clock, Activity, Target, Zap, Headphones, X, Lightbulb, Share2, Expand, Shrink, BookText, GraduationCap, Layout, LogIn, LogOut, User as UserIcon, RefreshCcw, LayoutGrid, FileEdit } from "lucide-react";',
  'import { MessageSquare, Book, Home, Settings, Search, Image as ImageIcon, Wand2, RefreshCw, Upload, Volume2, Save, FileText, Check, ChevronDown, Trash2, Library, Folder, Tag, AlertCircle, FileAudio, BookOpen, Clock, Activity, Target, Zap, Headphones, X, Lightbulb, Share2, Expand, Shrink, BookText, GraduationCap, Layout, LogIn, LogOut, User as UserIcon, RefreshCcw, LayoutGrid, FileEdit, Dumbbell } from "lucide-react";'
);

// 3. Add Import for Practice component
const importAppReplacement = `import AssistantChat from "./components/AssistantChat";
import Practice from "./components/Practice";`;
content = content.replace('import AssistantChat from "./components/AssistantChat";', importAppReplacement);


fs.writeFileSync('src/App.tsx', content);
