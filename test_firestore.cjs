const fs = require('fs');
let content = fs.readFileSync('src/utils/firestore.ts', 'utf-8');

if (!content.includes('disableNetwork')) {
    content = content.replace("import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';", "import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, disableNetwork } from 'firebase/firestore';");
}

content = content.replace(`if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn("Đã đạt giới hạn dung lượng đồng bộ Firestore miễn phí hằng ngày. Dữ liệu của bạn vẫn được lưu an toàn trên máy này.");
      throw new Error("QuotaExceeded");
    }`, `if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn("Đã đạt giới hạn dung lượng đồng bộ Firestore miễn phí hằng ngày. Dữ liệu của bạn vẫn được lưu an toàn trên máy này.");
      disableNetwork(db).catch(() => {});
      throw new Error("QuotaExceeded");
    }`);

content = content.replace(`if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn("Đã đạt giới hạn dung lượng đồng bộ Firestore miễn phí hằng ngày. Dữ liệu của bạn vẫn được tải từ máy này.");
      throw new Error("QuotaExceeded");
    }`, `if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      console.warn("Đã đạt giới hạn dung lượng đồng bộ Firestore miễn phí hằng ngày. Dữ liệu của bạn vẫn được tải từ máy này.");
      disableNetwork(db).catch(() => {});
      throw new Error("QuotaExceeded");
    }`);

fs.writeFileSync('src/utils/firestore.ts', content);
