import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Database, Book, FileSpreadsheet, Trash2, Download, HardDrive, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { Token } from "../types";
import GoogleDrivePickerModal from "./GoogleDrivePickerModal";

interface PracticeDocUploaderProps {
  onDictLoaded: (newDict: Record<string, Partial<Token>>, count: number) => void;
  onDictFileDeleted?: (keysToRemove: string[]) => void;
  customDict?: Record<string, Partial<Token>>;
}

interface UploadedDictFile {
  id: string;
  name: string;
  wordCount: number;
  status: "success" | "error";
  errorMessage?: string;
  timestamp: number;
  keys?: string[];
}

export default function PracticeDocUploader({ onDictLoaded, onDictFileDeleted, customDict = {} }: PracticeDocUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDictFile[]>([]);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khôi phục lịch sử file đã upload (nếu muốn, nhưng không bắt buộc do localStorage đã lưu dict)
  useEffect(() => {
    const history = localStorage.getItem("practice_doc_history");
    if (history) {
      try {
        setUploadedFiles(JSON.parse(history));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveHistory = (files: UploadedDictFile[]) => {
    setUploadedFiles(files);
    localStorage.setItem("practice_doc_history", JSON.stringify(files));
  };


  const processExcel = async (file: File): Promise<{ dict: Record<string, Partial<Token>>; count: number; error?: string }> => {
    try {
      const data = await file.arrayBuffer();
      let rows: any[][] = [];

      if (file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.convertToHtml({ arrayBuffer: data });
        const html = result.value;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const tables = doc.querySelectorAll("table");
        if (tables.length === 0) {
          throw new Error("Không tìm thấy bảng dữ liệu trong file Word.");
        }
        // Lấy bảng đầu tiên
        const trs = tables[0].querySelectorAll("tr");
        trs.forEach(tr => {
          const row: string[] = [];
          const tds = tr.querySelectorAll("td, th");
          tds.forEach(td => {
            row.push(td.textContent || "");
          });
          rows.push(row);
        });
      } else {
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      }

      
      if (!rows || rows.length === 0) {
        throw new Error("File trắng hoặc không có dữ liệu.");
      }

      const parsedDict: Record<string, Partial<Token>> = {};
      let validCount = 0;

      const maxCols = Math.max(...rows.map(r => r?.length || 0));
      // Detect if user used rows for attributes instead of columns
      const isTransposed = rows.length >= 3 && maxCols > rows.length;

      if (isTransposed) {
        // user actually put data row by row:
        // row 0: Hán tự (nihao, wo...)
        // row 1: Pinyin
        // row 2: Nghĩa
        // row 3: Loại từ
        const maxCols = Math.max(...rows.map(r => r.length));
        for (let col = 0; col < maxCols; col++) {
          let text = (rows[0]?.[col] || "").toString().trim();
          text = text.replace(/[^\u4e00-\u9fa5]/g, "");
          if (text) {
             parsedDict[text] = {
               pinyin: (rows[1]?.[col] || "").toString().trim(),
               translation: (rows[2]?.[col] || "").toString().trim(),
               partOfSpeech: (rows[3]?.[col] || "").toString().trim(),
               hskLevel: (rows[4]?.[col] || "").toString().trim()
             };
             validCount++;
          }
        }
      } else {
        // Standard expected format: columns
        
        let startIdx = 0;
        const firstCell = (rows[0]?.[0] || "").toString().toLowerCase();
        if (["hán tự", "tiếng trung", "trung", "hanzi", "chữ", "từ vựng"].includes(firstCell) || (rows[0]?.[1] || "").toString().toLowerCase().includes("pinyin")) {
           startIdx = 1;
        }

        for (let i = startIdx; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;
          
          let chineseColIdx = -1;
          for (let j = 0; j < row.length; j++) {
              const val = String(row[j] || "").trim();
              if (val && /[\u4e00-\u9fa5]/.test(val)) {
                  chineseColIdx = j;
                  break;
              }
          }
          
          let text = "";
          let pinyin = "";
          let translation = "";
          let partOfSpeech = "";
          let hskLevel = "";

          if (chineseColIdx !== -1) {
              text = String(row[chineseColIdx] || "").trim();
              pinyin = String(row[chineseColIdx + 1] || "").trim();
              translation = String(row[chineseColIdx + 2] || "").trim();
              partOfSpeech = String(row[chineseColIdx + 3] || "").trim();
              hskLevel = String(row[chineseColIdx + 4] || "").trim();
          } else {
              text = String(row[0] || "").trim();
              pinyin = String(row[1] || "").trim();
              translation = String(row[2] || "").trim();
              partOfSpeech = String(row[3] || "").trim();
              hskLevel = String(row[4] || "").trim();
          }

          text = text.replace(/[^\u4e00-\u9fa5]/g, "");
          if (text) {
             parsedDict[text] = {
               pinyin: pinyin,
               translation: translation,
               partOfSpeech: partOfSpeech,
               hskLevel: hskLevel
             };
             validCount++;
          }
        }
      }

      if (validCount === 0) {
        throw new Error("Không tìm thấy từ vựng hợp lệ nào trong file này.");
      }

      return { dict: parsedDict, count: validCount };

    } catch (error: any) {
      console.error(error);
      return { dict: {}, count: 0, error: error.message || "Không thể phân tích dữ liệu Excel." };
    }
  };

  const processMultipleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newHistory = [...uploadedFiles];
    
    for (let i = 0; i < files.length; i++) {
       const file = files[i];
       const result = await processExcel(file);
       
       const fileRecord: UploadedDictFile = {
         id: crypto.randomUUID(),
         name: file.name,
         wordCount: result.count,
         status: result.error ? "error" : "success",
         errorMessage: result.error,
         timestamp: Date.now(),
         keys: Object.keys(result.dict)
       };
       
       newHistory.push(fileRecord);
       
       if (!result.error && result.count > 0) {
         onDictLoaded(result.dict, result.count);
       }
    }
    
    saveHistory(newHistory);
    setIsProcessing(false);
  };

  const handleDeleteFile = (id: string, keys?: string[]) => {
    const updated = uploadedFiles.filter(f => f.id !== id);
    saveHistory(updated);
    if (keys && keys.length > 0 && onDictFileDeleted) {
      onDictFileDeleted(keys);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processMultipleFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGoogleDriveClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent file input click
    if (isProcessing) return;
    
    if (!window.googleAuth?.token) {
      try {
        await window.googleAuth?.signIn(['https://www.googleapis.com/auth/drive.readonly']);
        if (window.googleAuth?.token) {
          setShowDrivePicker(true);
        }
      } catch (err) {
        console.error("Không thể đăng nhập Google Drive", err);
      }
    } else {
      setShowDrivePicker(true);
    }
  };

  const exportFile = (file: UploadedDictFile) => {
    const keysToExport = file.keys || [];
    
    if (keysToExport.length === 0) {
      // Just export a dummy or empty to satisfy user interaction
      const ws = XLSX.utils.json_to_sheet([{"Thông báo": "Không có dữ liệu chi tiết cho file này (file cũ)."}]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tài liệu luyện tập");
      XLSX.writeFile(wb, `export-${file.name.replace(/\.docx?$/, '')}.xlsx`);
      return;
    }

    const data = keysToExport.map(key => ({
      "Hán tự": key,
      "Pinyin": customDict[key]?.pinyin || "",
      "Nghĩa": customDict[key]?.translation || "",
      "Loại từ": customDict[key]?.partOfSpeech || "",
      "Cấp độ HSK": customDict[key]?.hskLevel || ""
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tài liệu luyện tập");
    XLSX.writeFile(wb, `export-${file.name.replace(/\.docx?$/, '')}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
          isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${
          isDragActive
            ? "border-amber-400 bg-amber-50"
            : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInput}
        />
        
        <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-slate-400">
           {isProcessing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
           ) : (
             <UploadCloud className="w-7 h-7 text-slate-500" />
           )}
        </div>
        
        <p className="text-sm font-medium text-slate-700 text-center mb-1">
          {isProcessing ? "Đang xử lý dữ liệu..." : "Kéo thả file Excel (.xlsx) hoặc Word (.docx) vào đây"}
        </p>
        <p className="text-xs text-slate-500 text-center mb-4">hoặc click để chọn file từ máy tính</p>
        
        <button
          onClick={handleGoogleDriveClick}
          disabled={isProcessing}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition z-10"
        >
          <HardDrive className="w-4 h-4" />
          Chọn từ Google Drive
        </button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Lịch sử tải lên tài liệu luyện tập ({uploadedFiles.length} file)</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {uploadedFiles.map((f, index) => (
               <div key={f.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <span className="w-6 h-6 flex-shrink-0 bg-slate-100 text-slate-500 rounded-md flex items-center justify-center text-xs font-bold">
                        {index + 1}
                     </span>
                     {f.name.endsWith('.docx') ? <FileText className={`w-5 h-5 flex-shrink-0 ${f.status === 'success' ? 'text-blue-500' : 'text-red-400'}`} /> : <FileSpreadsheet className={`w-5 h-5 flex-shrink-0 ${f.status === 'success' ? 'text-emerald-500' : 'text-red-400'}`} />}
                     <div className="truncate">
                        <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                        {f.status === "success" ? (
                          <p className="text-xs text-emerald-600">Đã thêm {f.wordCount} từ vựng</p>
                        ) : (
                          <p className="text-xs text-red-500 truncate" title={f.errorMessage}>{f.errorMessage}</p>
                        )}
                     </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                     {f.status === "success" ? (
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     ) : (
                       <AlertCircle className="w-5 h-5 text-red-500" />
                     )}
                     {f.status === "success" && (
                        <button
                           onClick={() => exportFile(f)}
                           className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 ml-1"
                           title="Xuất file này"
                        >
                           <Download className="w-4 h-4" />
                        </button>
                     )}
                     <button
                        onClick={() => handleDeleteFile(f.id, f.keys)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 ml-1"
                        title="Xóa file này"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {showDrivePicker && (
        <GoogleDrivePickerModal
          mode="both"
          onClose={() => setShowDrivePicker(false)}
          onFilePicked={(file) => processMultipleFiles([file])}
        />
      )}
    </div>
  );
}
