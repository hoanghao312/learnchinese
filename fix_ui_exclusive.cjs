const fs = require('fs');
let content = fs.readFileSync('src/components/TextReader.tsx', 'utf-8');

const translateTarget = `  const handleTranslateSelection = async () => {
    if (!selectedText) return;
    setIsTranslatingSelection(true);
    setSelectionTranslation("");`;

const translateReplacement = `  const handleTranslateSelection = async () => {
    if (!selectedText) return;
    setIsTranslatingSelection(true);
    setSelectionTranslation("");
    setSelectionGrammar(null); // Clear grammar when translating`;

content = content.replace(translateTarget, translateReplacement);

const grammarTarget = `  const handleAnalyzeGrammar = async () => {
    if (!selectedText) return;
    setIsAnalyzingGrammar(true);
    setSelectionGrammar("");`;

const grammarReplacement = `  const handleAnalyzeGrammar = async () => {
    if (!selectedText) return;
    setIsAnalyzingGrammar(true);
    setSelectionGrammar("");
    setSelectionTranslation(null); // Clear translation when analyzing grammar`;

content = content.replace(grammarTarget, grammarReplacement);

fs.writeFileSync('src/components/TextReader.tsx', content);
