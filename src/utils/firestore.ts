import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, disableNetwork, setLogLevel, deleteField } from 'firebase/firestore';
setLogLevel('silent');
import { app, auth } from './auth';
import firebaseConfig from '../../firebase-applet-config.json';

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export const syncDataToFirestore = async (
  data: any, 
  signal?: AbortSignal, 
  onProgress?: (progress: number, total: number) => void
) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    if (signal?.aborted) throw new Error("Aborted");
    
    // Upload main document
    const mainData = { ...data };
    mainData.savedWords = deleteField(); 
    
    if (mainData.savedLessons && Array.isArray(mainData.savedLessons)) { mainData.savedLessons = mainData.savedLessons.map((l: any) => { const copy = { ...l }; delete copy.tokens; return copy; }); }
    const setPromise = setDoc(doc(db, "users", user.uid), mainData, { merge: true });
    
    if (signal) {
      await Promise.race([
        setPromise,
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error("Aborted")));
        })
      ]);
    } else {
      await setPromise;
    }

    // Upload words in chunks for extreme speed but still showing progress
    if (data.savedWords && Array.isArray(data.savedWords)) {
      const words = data.savedWords;
      const total = words.length;
      let completed = 0;
      
      if (onProgress) onProgress(0, total);
      
      const chunkSize = 200; // Mỗi chunk chứa 200 từ, upload toàn bộ 1500 từ chỉ mất ~8 request.
      
      for (let i = 0; i < words.length; i += chunkSize) {
        if (signal?.aborted) throw new Error("Aborted");
        
        const chunk = words.slice(i, i + chunkSize);
        
        // Ghi thẳng chunk vào 1 document để tối ưu tốc độ.
        const chunkIndex = Math.floor(i / chunkSize);
        const chunkRef = doc(db, "users", user.uid, "word_chunks", `chunk_${chunkIndex}`);
        
        const chunkPromise = setDoc(chunkRef, { words: chunk });
        
        if (signal) {
          await Promise.race([
            chunkPromise,
            new Promise((_, reject) => {
              signal.addEventListener('abort', () => reject(new Error("Aborted")));
            })
          ]);
        } else {
          await chunkPromise;
        }
        
        completed += chunk.length;
        if (onProgress) onProgress(Math.min(completed, total), total);
      }
      
      // Save metadata about how many chunks we have
      const totalChunks = Math.ceil(words.length / chunkSize);
      await setDoc(doc(db, "users", user.uid), { totalWordChunks: totalChunks, hasMigratedToChunks: true }, { merge: true });
    }
  } catch (error: any) {
    if (error.message === "Aborted") {
      console.log("Đồng bộ bị hủy.");
      throw error;
    }
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn("Đã đạt giới hạn dung lượng đồng bộ Firestore miễn phí hằng ngày. Dữ liệu của bạn vẫn được lưu an toàn trên máy này.");
      disableNetwork(db).catch(() => {});
      throw new Error("QuotaExceeded");
    }
    console.warn("Lỗi đẩy dữ liệu:", error.message);
    throw error;
  }
};

export const fetchDataFromFirestore = async (
  signal?: AbortSignal,
  onProgress?: (progress: number, total: number) => void
) => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    if (signal?.aborted) throw new Error("Aborted");
    const docRef = doc(db, "users", user.uid);
    const getPromise = getDoc(docRef);
    
    let docSnap;
    if (signal) {
      docSnap = await Promise.race([
        getPromise,
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error("Aborted")));
        })
      ]) as any;
    } else {
      docSnap = await getPromise;
    }
    
    const data = docSnap.exists() ? docSnap.data() : {};
    
    // Fetch word chunks
    const totalChunks = data.totalWordChunks || 0;
    let allWords: any[] = [];
    
    if (totalChunks > 0 || data.hasMigratedToChunks) {
      // Calculate total words by summing chunk lengths if needed, but we don't know yet.
      // We will just report fake progress per chunk or total chunks.
      for (let i = 0; i < totalChunks; i++) {
        if (signal?.aborted) throw new Error("Aborted");
        
        const chunkRef = doc(db, "users", user.uid, "word_chunks", `chunk_${i}`);
        const chunkPromise = getDoc(chunkRef);
        
        let chunkSnap;
        if (signal) {
          chunkSnap = await Promise.race([
            chunkPromise,
            new Promise((_, reject) => {
              signal.addEventListener('abort', () => reject(new Error("Aborted")));
            })
          ]) as any;
        } else {
          chunkSnap = await chunkPromise;
        }
        
        if (chunkSnap.exists()) {
          const chunkData = chunkSnap.data();
          if (chunkData && chunkData.words) {
            allWords = allWords.concat(chunkData.words);
          }
        }
        
        // Report progress by chunks (rough estimate of words)
        const estimatedTotal = totalChunks * 200;
        const currentProgress = (i + 1) * 200;
        if (onProgress) onProgress(currentProgress, estimatedTotal);
      }
    } else {
      // Fallback for old data format
      const wordsRef = collection(db, "users", user.uid, "words");
      const wordsPromise = getDocs(wordsRef);
      let wordsSnap;
      if (signal) {
        wordsSnap = await Promise.race([
          wordsPromise,
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(new Error("Aborted")));
          })
        ]) as any;
      } else {
        wordsSnap = await wordsPromise;
      }
      
      const subcollectionWords = wordsSnap.docs.map((d: any) => d.data());
      allWords = allWords.concat(subcollectionWords);
    }
    
    // Merge legacy savedWords with chunks
    const legacyWords = data.savedWords || [];
    const mergedWordsMap = new Map();
    legacyWords.forEach((w: any) => mergedWordsMap.set(w.id, w));
    allWords.forEach((w: any) => mergedWordsMap.set(w.id, w));
    
    data.savedWords = Array.from(mergedWordsMap.values());
    
    const total = data.savedWords.length;
    if (onProgress) {
      onProgress(total, total);
    }

    return data;
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn("Đã đạt giới hạn dung lượng đồng bộ Firestore miễn phí hằng ngày. Dữ liệu của bạn vẫn được tải từ máy này.");
      disableNetwork(db).catch(() => {});
      throw new Error("QuotaExceeded");
    }
    console.warn("Lỗi tải dữ liệu:", error.message);
    throw error;
  }
};
