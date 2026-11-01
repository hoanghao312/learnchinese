const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const analyzeTarget = `const handleAnalyzeGrammar = async () => {
    if (!selectedText) return;
    setIsAnalyzingGrammar(true);
    setSelectionGrammar(null);
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      const data = await res.json();
      if (data.analysis) {
        setSelectionGrammar(data.analysis);
      } else {
        setSelectionGrammar("Không thể phân tích đoạn này.");
      }
    } catch (err) {
      console.error("Lỗi khi phân tích:", err);
      setSelectionGrammar("Lỗi khi phân tích đoạn này.");
    } finally {
      setIsAnalyzingGrammar(false);
    }
  };`;

const analyzeReplacement = `const handleAnalyzeGrammar = async () => {
    if (!selectedText) return;
    setIsAnalyzingGrammar(true);
    setSelectionGrammar("");
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setSelectionGrammar((prev) => (prev || "") + chunk);
        }
      }
    } catch (err) {
      console.error("Lỗi khi phân tích:", err);
      setSelectionGrammar("Lỗi khi phân tích đoạn này.");
    } finally {
      setIsAnalyzingGrammar(false);
    }
  };`;

content = content.replace(analyzeTarget, analyzeReplacement);

const translateTarget = `const handleTranslateSelection = async () => {
    if (!selectedText) return;
    setIsTranslatingSelection(true);
    setSelectionTranslation(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      const data = await res.json();
      if (data.translation) {
        setSelectionTranslation(data.translation);
      } else {
        setSelectionTranslation("Không thể dịch đoạn này.");
      }
    } catch (err) {
      console.error("Lỗi khi dịch:", err);
      setSelectionTranslation("Lỗi khi dịch đoạn này.");
    } finally {
      setIsTranslatingSelection(false);
    }
  };`;

const translateReplacement = `const handleTranslateSelection = async () => {
    if (!selectedText) return;
    setIsTranslatingSelection(true);
    setSelectionTranslation("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setSelectionTranslation((prev) => (prev || "") + chunk);
        }
      }
    } catch (err) {
      console.error("Lỗi khi dịch:", err);
      setSelectionTranslation("Lỗi khi dịch đoạn này.");
    } finally {
      setIsTranslatingSelection(false);
    }
  };`;

content = content.replace(translateTarget, translateReplacement);
fs.writeFileSync('src/components/TextReader.tsx', content);
