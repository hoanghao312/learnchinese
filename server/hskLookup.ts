import hsk1 from "hsk-grader/vocab/hsk-level-1.json";
import hsk2 from "hsk-grader/vocab/hsk-level-2.json";
import hsk3 from "hsk-grader/vocab/hsk-level-3.json";
import hsk4 from "hsk-grader/vocab/hsk-level-4.json";
import hsk5 from "hsk-grader/vocab/hsk-level-5.json";
import hsk6 from "hsk-grader/vocab/hsk-level-6.json";

const hskMap = new Map<string, string>();

function buildMap() {
  const addWords = (list: any[], level: string) => {
    for (const item of list) {
      if (item.hanzi && !hskMap.has(item.hanzi)) {
        hskMap.set(item.hanzi, level);
      }
    }
  };

  addWords(hsk1, "HSK 1");
  addWords(hsk2, "HSK 2");
  addWords(hsk3, "HSK 3");
  addWords(hsk4, "HSK 4");
  addWords(hsk5, "HSK 5");
  addWords(hsk6, "HSK 6");

  // Fix common omissions in standard lists
  if (!hskMap.has("你好")) hskMap.set("你好", "HSK 1");
}

buildMap();

export function getHskLevel(word: string): string {
  return hskMap.get(word) || "";
}
