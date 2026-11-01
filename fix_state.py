import re

with open('src/components/Practice.tsx', 'r') as f:
    content = f.read()

state_code = """
  const [orderingExercises, setOrderingExercises] = useState<OrderingExercise[]>([]);
  const [orderingAnswers, setOrderingAnswers] = useState<Record<number, {id: string, text: string}[]>>({});
  const [orderingChecked, setOrderingChecked] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [changingIndex, setChangingIndex] = useState<number | null>(null);

  const generatePractice = async (type: PracticeType, isAutoGenerate: boolean = false, isRetry: boolean = false) => {
    if (isGeneratingRef.current && !isRetry) return;
    setIsGenerating(true);
    isGeneratingRef.current = true;
    
    setOrderingChecked(false);
    setOrderingAnswers({});
    
    try {
      const selectedWords = savedWords.slice(0, 50); // limit to avoid heavy payload
      const response = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords, type, requiredTotal: 10 })
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      let generatedExs = data.exercises || [];
      // Assign unique ID and shuffle words
      generatedExs = generatedExs.map((ex: any) => {
         if (!ex.id) ex.id = Date.now().toString() + Math.random().toString();
         if (ex.correctSentence) {
             const wordsArray = ex.correctSentence.match(/[\w\u4e00-\u9fa5]+|[^\s\w\u4e00-\u9fa5]+/g) || [];
             ex.shuffledWords = wordsArray.map((text: string) => ({ id: Date.now().toString() + Math.random().toString(), text })).sort(() => 0.5 - Math.random());
         }
         return ex;
      });
      
      setOrderingExercises(generatedExs);
    } catch (err) {
      console.error("Error generating practice:", err);
      if (!isAutoGenerate) {
        alert("Lỗi: Không thể tạo bài tập mới lúc này. Có thể hệ thống AI đang quá tải. Vui lòng thử lại sau.");
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  useEffect(() => {
    if (autoGenerateTimestamp && autoGenerateType) {
      setActiveTab(autoGenerateType);
      generatePractice(autoGenerateType, true);
    }
  }, [autoGenerateTimestamp, autoGenerateType]);
"""

# Insert state_code before `const calculateOrderingScore = () => {`
if "const [orderingExercises," not in content:
    content = content.replace("const calculateOrderingScore = () => {", state_code + "\n  const calculateOrderingScore = () => {")

with open('src/components/Practice.tsx', 'w') as f:
    f.write(content)
