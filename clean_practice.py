import re

with open('src/components/Practice.tsx', 'r') as f:
    content = f.read()

# Remove imports
content = re.sub(r'import \* as XLSX from "xlsx";\n?', '', content)
content = re.sub(r'import GoogleDrivePickerModal from "\./GoogleDrivePickerModal";\n?', '', content)
content = re.sub(r'import \{ fetchVocabularyFromDriveFile \} from "\.\./driveHelper";\n?', '', content)

# Remove HardDrive from lucide-react
content = re.sub(r'HardDrive,\s*', '', content)

# Remove showDrivePicker state
content = re.sub(r'const \[showDrivePicker, setShowDrivePicker\] = useState\(false\);\n?', '', content)

# Remove handleGoogleDriveClick
content = re.sub(r'const handleGoogleDriveClick = async \(\) => \{.*?\n  \};\n?', '', content, flags=re.DOTALL)

# Remove handleDriveFilePicked
content = re.sub(r'const handleDriveFilePicked = async \(file: File\) => \{.*?\n  \};\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'const handleDriveFilePicked = async \(file: File\) => \{.*?\n  \};\n', '', content, flags=re.DOTALL)

# Remove the buttons
# <button\s+onClick=\{handleGoogleDriveClick\}[^>]*>.*?</button>
content = re.sub(r'<button\s+onClick=\{handleGoogleDriveClick\}[^>]*>.*?Tạo từ Google Sheets\s*</button>', '', content, flags=re.DOTALL)

# Remove the modal
content = re.sub(r'\{showDrivePicker && \([\s\S]*?</GoogleDrivePickerModal>\s*\)\}', '', content)

# Add Redo buttons instead
old_buttons_block = """                      <button
                        onClick={() => generatePractice('ordering', false, true)}
                        disabled={isGenerating}
                        className="flex-1 bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 py-4 rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2"
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Tạo bài tập khác
                      </button>"""

new_buttons_block = """                      <button
                        onClick={() => {
                          setOrderingAnswers({});
                          setOrderingChecked(false);
                        }}
                        className="flex-1 bg-amber-50 border-2 border-amber-200 text-amber-600 hover:bg-amber-100 py-4 rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Làm lại toàn bộ
                      </button>
                      <button
                        onClick={() => {
                          const newAnswers = { ...orderingAnswers };
                          const normalize = (str: string) => (str || '').replace(/[\s.,!?。，！？、]/g, '');
                          orderingExercises.forEach((ex, i) => {
                            const isCorrect = normalize(newAnswers[i]?.map(u => u.text).join('')) === normalize(ex.correctSentence);
                            if (isCorrect) {
                              // keep it
                            } else {
                              delete newAnswers[i];
                            }
                          });
                          setOrderingAnswers(newAnswers);
                          setOrderingChecked(false);
                        }}
                        className="flex-1 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-100 py-4 rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Làm lại những câu sai
                      </button>
                      <button
                        onClick={() => generatePractice('ordering', false, true)}
                        disabled={isGenerating}
                        className="flex-1 bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 py-4 rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2"
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Tạo bài tập khác
                      </button>"""

content = content.replace(old_buttons_block, new_buttons_block)

with open('src/components/Practice.tsx', 'w') as f:
    f.write(content)
print("Done")
