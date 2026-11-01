import { SavedWord, Folder, Token } from "../types";

export const mergeSavedWords = (local: SavedWord[], cloud: SavedWord[], deletedIds: string[] = []): SavedWord[] => {
  const map = new Map<string, SavedWord>();
  cloud.forEach(w => {
    if (!deletedIds.includes(w.id)) {
      map.set(w.id, w);
    }
  });
  
  local.forEach(w => {
    const existing = map.get(w.id);
    if (!existing) {
      map.set(w.id, w);
    } else {
      const localReps = (w.repetitionCountZhVi || 0) + (w.repetitionCountViZh || 0);
      const cloudReps = (existing.repetitionCountZhVi || 0) + (existing.repetitionCountViZh || 0);
      
      const localModified = w.lastModified || w.savedAt || 0;
      const cloudModified = existing.lastModified || existing.savedAt || 0;

      if (localReps > cloudReps) {
        map.set(w.id, w);
      } else if (localReps === cloudReps) {
        if (localModified >= cloudModified) {
          map.set(w.id, w);
        }
      }
    }
  });
  
  // Deduplicate by text as well, keeping the one with more progress
  const uniqueByText = new Map<string, SavedWord>();
  for (const w of map.values()) {
    const existing = uniqueByText.get(w.text);
    if (!existing) {
      uniqueByText.set(w.text, w);
    } else {
      const wReps = (w.repetitionCountZhVi || 0) + (w.repetitionCountViZh || 0);
      const exReps = (existing.repetitionCountZhVi || 0) + (existing.repetitionCountViZh || 0);
      
      const wModified = w.lastModified || w.savedAt || 0;
      const exModified = existing.lastModified || existing.savedAt || 0;

      if (wReps > exReps) {
        uniqueByText.set(w.text, w);
      } else if (wReps === exReps) {
        if (wModified > exModified) {
          uniqueByText.set(w.text, w);
        }
      }
    }
  }
  
  const result = Array.from(uniqueByText.values());
  result.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return result;
};

export const mergeFolders = (local: Folder[], cloud: Folder[]): Folder[] => {
  const map = new Map<string, Folder>();
  cloud.forEach(f => map.set(f.id, f));
  local.forEach(f => {
    if (!map.has(f.id)) map.set(f.id, f);
  });
  return Array.from(map.values());
};

export const mergeMissingWords = (local: Token[], cloud: Token[]): Token[] => {
  const map = new Map<string, Token>();
  cloud.forEach(t => map.set(t.text, t));
  local.forEach(t => {
    if (!map.has(t.text)) map.set(t.text, t);
  });
  return Array.from(map.values());
};

export const mergeCustomDict = (
  local: Record<string, Partial<Token>>,
  cloud: Record<string, Partial<Token>>
): Record<string, Partial<Token>> => {
  // If a word is in both, merge their partial properties, preferring local
  const merged = { ...cloud };
  for (const key in local) {
    if (merged[key]) {
      merged[key] = { ...merged[key], ...local[key] };
    } else {
      merged[key] = local[key];
    }
  }
  return merged;
};

export const mergeLessons = (local: any[], cloud: any[]): any[] => {
  const map = new Map<string, any>();
  cloud.forEach(l => map.set(l.id, l));
  local.forEach(l => {
    if (!map.has(l.id)) {
      map.set(l.id, l);
    } else {
      const existing = map.get(l.id);
      const localModified = l.savedAt || 0;
      const cloudModified = existing.savedAt || 0;
      if (localModified > cloudModified) {
        map.set(l.id, l);
      }
    }
  });
  const result = Array.from(map.values());
  result.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return result;
};
