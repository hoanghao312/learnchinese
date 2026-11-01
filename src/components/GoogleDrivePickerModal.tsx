import React, { useState, useEffect, useCallback } from "react";
import { X, Search, File as FileIcon, Loader2, AlertCircle, FileText, FileSpreadsheet, Folder, ChevronRight, ArrowLeft } from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface GoogleDrivePickerModalProps {
  onClose: () => void;
  onFilePicked: (file: File) => void;
  allowedMimeTypes?: string[];
  mode: 'document' | 'excel' | 'both';
}

export default function GoogleDrivePickerModal({ onClose, onFilePicked, mode }: GoogleDrivePickerModalProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Google Drive'}]);
  const currentFolder = folderHistory[folderHistory.length - 1];

  const fetchFiles = useCallback(async (query: string = "", folderId: string = 'root') => {
    try {
      setLoading(true);
      setError(null);
      const token = window.googleAuth?.token;
      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập.");
      }

      let q = "trashed = false";
      
      const docTypes = "mimeType='text/plain' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/vnd.google-apps.document' or name contains '.md'";
      const excelTypes = "mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.spreadsheet'";
      const folderType = "mimeType='application/vnd.google-apps.folder'";

      if (query) {
        // Search globally
        if (mode === 'document') {
          q += ` and (${docTypes} or ${folderType})`;
        } else if (mode === 'excel') {
          q += ` and (${excelTypes} or ${folderType})`;
        } else if (mode === 'both') {
          q += ` and (${docTypes} or ${excelTypes} or ${folderType})`;
        } else if (mode === 'both') {
          q += ` and (${docTypes} or ${excelTypes} or ${folderType})`;
        }
        q += ` and name contains '${query}'`;
      } else {
        // List in current folder
        q += ` and '${folderId}' in parents`;
        if (mode === 'document') {
          q += ` and (${docTypes} or ${folderType})`;
        } else if (mode === 'excel') {
          q += ` and (${excelTypes} or ${folderType})`;
        } else if (mode === 'both') {
          q += ` and (${docTypes} or ${excelTypes} or ${folderType})`;
        }
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=folder,modifiedTime desc&fields=files(id,name,mimeType,modifiedTime)&pageSize=100`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Drive API Error:", errorData);
        throw new Error("Lỗi khi tải danh sách từ Google Drive: " + (errorData.error?.message || response.statusText));
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!search) {
      fetchFiles("", currentFolder.id);
    } else {
      fetchFiles(search, currentFolder.id);
    }
  }, [currentFolder.id, fetchFiles]); // Re-fetch when folder changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(search, currentFolder.id);
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setSearch(""); // clear search when navigating
      setFolderHistory([...folderHistory, {id: file.id, name: file.name}]);
    } else {
      if (!downloadingId) {
        handlePickFile(file);
      }
    }
  };

  const navigateBack = () => {
    if (folderHistory.length > 1) {
      setFolderHistory(folderHistory.slice(0, -1));
      setSearch("");
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    setFolderHistory(folderHistory.slice(0, index + 1));
    setSearch("");
  };

  const handlePickFile = async (driveFile: DriveFile) => {
    try {
      setDownloadingId(driveFile.id);
      const token = window.googleAuth?.token;
      
      let downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`;
      
      // If it's a google workspace document, we need to export it
      if (driveFile.mimeType === 'application/vnd.google-apps.document') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
      } else if (driveFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
      }

      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Không thể tải tệp này.");
      }

      const blob = await response.blob();
      
      let finalName = driveFile.name;
      if (driveFile.mimeType === 'application/vnd.google-apps.document' && !finalName.endsWith('.docx')) {
        finalName += '.docx';
      } else if (driveFile.mimeType === 'application/vnd.google-apps.spreadsheet' && !finalName.endsWith('.xlsx')) {
        finalName += '.xlsx';
      }

      // Workaround for environments where new File() is not supported (e.g. some mobile browsers/WebViews)
      try {
        const file = new File([blob], finalName, { type: blob.type });
        onFilePicked(file);
      } catch (e) {
        // Fallback: append properties to blob to make it File-like
        const fileLike = blob as any;
        fileLike.name = finalName;
        fileLike.lastModified = new Date().getTime();
        onFilePicked(fileLike as File);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải tệp");
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {folderHistory.length > 1 && (
              <button onClick={navigateBack} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-lg font-bold text-slate-800">Chọn tệp từ Google Drive</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
          {/* Breadcrumbs */}
          {!search && (
            <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-600">
              {folderHistory.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <button 
                    onClick={() => navigateToBreadcrumb(idx)}
                    className={`hover:text-blue-600 transition-colors ${idx === folderHistory.length - 1 ? 'text-slate-900' : ''}`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tệp trong Drive..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-orange-500" />
              <p>Đang tải danh sách tệp...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-center px-4">{error}</p>
              <button 
                onClick={() => {
                  if (window.googleAuth?.signOut) {
                    window.googleAuth.signOut().then(() => {
                      onClose();
                    });
                  }
                }}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
              >
                Đăng xuất và thử lại
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p>Không tìm thấy tệp hoặc thư mục nào.</p>
            </div>
          ) : (
            files.map(file => {
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
              
              return (
                <div 
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 cursor-pointer transition-colors ${downloadingId === file.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isFolder ? (
                    <Folder className="w-8 h-8 text-amber-400 fill-amber-100" />
                  ) : (file.mimeType.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <FileText className="w-8 h-8 text-blue-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">Đã sửa: {new Date(file.modifiedTime).toLocaleDateString('vi-VN')}</p>
                  </div>
                  {downloadingId === file.id && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
