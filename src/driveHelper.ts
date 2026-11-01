import * as XLSX from "xlsx";

export async function fetchVocabularyFromDriveFile(token: string): Promise<any[]> {
  // 1. Find folder HỌC TỪ VỰNG HSK 5
  let qFolder = "mimeType='application/vnd.google-apps.folder' and name='HỌC TỪ VỰNG HSK 5' and trashed=false";
  let resFolder = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qFolder)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resFolder.ok) throw new Error("Could not find folder HỌC TỪ VỰNG HSK 5");
  let dataFolder = await resFolder.json();
  if (!dataFolder.files || dataFolder.files.length === 0) throw new Error("Folder HỌC TỪ VỰNG HSK 5 not found on Drive.");
  const folderId = dataFolder.files[0].id;

  // 2. Find file YES
  let qFile = `name='YES' and '${folderId}' in parents and trashed=false`;
  let resFile = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qFile)}&fields=files(id,mimeType,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resFile.ok) throw new Error("Could not find file YES");
  let dataFile = await resFile.json();
  if (!dataFile.files || dataFile.files.length === 0) throw new Error("File YES not found in folder HỌC TỪ VỰNG HSK 5.");
  const driveFile = dataFile.files[0];

  // 3. Download file
  let downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`;
  if (driveFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
  }
  let resDownload = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resDownload.ok) throw new Error("Could not download file YES");
  const blob = await resDownload.blob();
  const arrayBuffer = await blob.arrayBuffer();

  // 4. Parse Excel
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (!rows || rows.length === 0) return [];

  const words = [];
  const maxCols = Math.max(...rows.map(r => r?.length || 0));
  const isTransposed = rows.length >= 3 && maxCols > rows.length;

  if (isTransposed) {
    for (let col = 0; col < maxCols; col++) {
      let text = (rows[0]?.[col] || "").toString().trim();
      if (text && !text.toLowerCase().includes("hán tự") && !text.toLowerCase().includes("từ vựng")) {
         words.push({
           id: Date.now().toString() + Math.random().toString(),
           text,
           pinyin: (rows[1]?.[col] || "").toString().trim(),
           translation: (rows[2]?.[col] || "").toString().trim(),
           timestamp: Date.now()
         });
      }
    }
  } else {
    for (let row of rows) {
      if (!row || row.length === 0) continue;
      let text = (row[0] || "").toString().trim();
      if (text && !text.toLowerCase().includes("hán tự") && !text.toLowerCase().includes("cột 1") && !text.toLowerCase().includes("từ vựng")) {
        words.push({
          id: Date.now().toString() + Math.random().toString(),
          text,
          pinyin: (row[1] || "").toString().trim(),
          translation: (row[2] || "").toString().trim(),
          timestamp: Date.now()
        });
      }
    }
  }
  return words;
}
