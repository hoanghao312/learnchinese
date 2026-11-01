import React, { useRef, useState } from 'react';
import { Upload, File, Loader2 } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';

interface FileUploaderProps {
  onTextLoaded: (text: string, name: string) => void;
}

export default function FileUploader({ onTextLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.md')) {
        const text = await file.text();
        onTextLoaded(text, file.name);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onTextLoaded(result.value, file.name);
      } else if (file.name.endsWith('.xlsx')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = xlsx.utils.sheet_to_csv(worksheet);
        onTextLoaded(csv, file.name);
      } else {
        alert("Định dạng file không được hỗ trợ. Vui lòng tải lên file .txt, .md, .docx hoặc .xlsx");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Đã xảy ra lỗi khi đọc file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept=".txt,.md,.docx,.xlsx" 
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-slate-500 py-4">
          <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
          <p>Đang đọc file...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Upload className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Tải lên tài liệu</h4>
          <p className="text-sm text-slate-500 mb-6">Kéo thả file vào đây hoặc nhấn nút bên dưới (.txt, .md, .docx, .xlsx)</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            Chọn file
          </button>
        </div>
      )}
    </div>
  );
}
