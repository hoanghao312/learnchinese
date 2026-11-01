// Common radicals and character decomposition data for Chinese character component breakdown

export interface HanziComponent {
  component: string;
  name: string;
  hanviet?: string;
  pinyin?: string;
  color: string; // '#dc2626' (Red for main radical) or '#1e3a8a' (Navy for other parts)
  meaning: string;
  role: string;
  strokes?: number;
}

export interface CharacterDecomposition {
  char: string;
  pinyin: string;
  hanviet: string;
  meaning: string;
  structure: string; // e.g., "Trên - Dưới (上下结构)", "Trái - Phải (左右结构)"
  strokeCount: number;
  mainRadical: string;
  radicalName: string;
  radicalMeaning: string;
  radicalPosition: string;
  mnemonic: string;
  breakdownTip?: string;
  story?: string;
  components: HanziComponent[];
}

export interface WordDecompositionResult {
  word: string;
  pinyin: string;
  hanviet: string;
  translation: string;
  characters: CharacterDecomposition[];
}

// 214 Kangxi Radicals with Vietnamese names and meanings
export const KANGXI_RADICALS: Record<string, { name: string; hanviet: string; pinyin: string; meaning: string; strokes: number }> = {
  "一": { name: "Bộ Nhất", hanviet: "NHẤT", pinyin: "yī", meaning: "Số một, nét ngang", strokes: 1 },
  "丨": { name: "Bộ Cổn", hanviet: "CỔN", pinyin: "gǔn", meaning: "Nét sổ đứng", strokes: 1 },
  "丶": { name: "Bộ Chủ", hanviet: "CHỦ", pinyin: "zhǔ", meaning: "Dấu chấm", strokes: 1 },
  "丿": { name: "Bộ Phiệt", hanviet: "PHIỆT", pinyin: "piě", meaning: "Nét phẩy, nghiêng qua trái", strokes: 1 },
  "乙": { name: "Bộ Ất", hanviet: "ẤT", pinyin: "yǐ", meaning: "Vị trí thứ hai thiên can, nét cong", strokes: 1 },
  "亅": { name: "Bộ Quyết", hanviet: "QUYẾT", pinyin: "jué", meaning: "Nét móc đứng", strokes: 1 },
  "二": { name: "Bộ Nhị", hanviet: "NHỊ", pinyin: "èr", meaning: "Số hai", strokes: 2 },
  "亠": { name: "Bộ Đầu", hanviet: "ĐẦU", pinyin: "tóu", meaning: "Không có nghĩa riêng, nằm phía trên chữ", strokes: 2 },
  "人": { name: "Bộ Nhân", hanviet: "NHÂN", pinyin: "rén", meaning: "Người, loài người", strokes: 2 },
  "亻": { name: "Bộ Nhân đứng", hanviet: "NHÂN", pinyin: "rén", meaning: "Người (dạng biến thể nằm bên trái)", strokes: 2 },
  "儿": { name: "Bộ Nhi", hanviet: "NHI", pinyin: "ér", meaning: "Trẻ con, người con trai", strokes: 2 },
  "入": { name: "Bộ Nhập", hanviet: "NHẬP", pinyin: "rù", meaning: "Vào trong, gia nhập", strokes: 2 },
  "八": { name: "Bộ Bát", hanviet: "BÁT", pinyin: "bā", meaning: "Số tám", strokes: 2 },
  "冂": { name: "Bộ Quynh", hanviet: "QUYNH", pinyin: "jiōng", meaning: "Vùng đất xa xôi, biên giới", strokes: 2 },
  "冖": { name: "Bộ Mịch", hanviet: "MỊCH", pinyin: "mì", meaning: "Khăn trùm, che phủ", strokes: 2 },
  "冫": { name: "Bộ Băng", hanviet: "BĂNG", pinyin: "bīng", meaning: "Băng tuyết, giá lạnh, nước đá", strokes: 2 },
  "几": { name: "Bộ Kỷ", hanviet: "KỶ", pinyin: "jī", meaning: "Cái bàn nhỏ, chiếc ghế thấp", strokes: 2 },
  "凵": { name: "Bộ Khảm", hanviet: "KHẢM", pinyin: "kǎn", meaning: "Hố đất lõm sâu xuống", strokes: 2 },
  "刀": { name: "Bộ Đao", hanviet: "ĐAO", pinyin: "dāo", meaning: "Con dao, vũ khí chém", strokes: 2 },
  "刂": { name: "Bộ Đao đứng", hanviet: "ĐAO", pinyin: "dāo", meaning: "Con dao (dạng đứng nằm bên phải)", strokes: 2 },
  "力": { name: "Bộ Lực", hanviet: "LỰC", pinyin: "lì", meaning: "Sức lực, sức mạnh", strokes: 2 },
  "勹": { name: "Bộ Bao", hanviet: "BAO", pinyin: "bāo", meaning: "Bọc lại, ôm ấp", strokes: 2 },
  "匕": { name: "Bộ Chủy", hanviet: "CHỦY", pinyin: "bǐ", meaning: "Cái thìa, cái muỗng", strokes: 2 },
  "匚": { name: "Bộ Phương", hanviet: "PHƯƠNG", pinyin: "fāng", meaning: "Tủ đựng đồ, hộp chứa", strokes: 2 },
  "十": { name: "Bộ Thập", hanviet: "THẬP", pinyin: "shí", meaning: "Số mười, hoàn chỉnh", strokes: 2 },
  "卜": { name: "Bộ Bặc", hanviet: "BẶC", pinyin: "bǔ", meaning: "Bói toán, xem quẻ", strokes: 2 },
  "卩": { name: "Bộ Tiết", hanviet: "TIẾT", pinyin: "jié", meaning: "Đốt tre, khớp xương, tiết chế", strokes: 2 },
  "厂": { name: "Bộ Hán", hanviet: "HÁN", pinyin: "chǎng", meaning: "Sườn núi dốc, nhà xưởng", strokes: 2 },
  "厶": { name: "Bộ Khư", hanviet: "KHƯ", pinyin: "sī", meaning: "Riêng tư, bản thân", strokes: 2 },
  "又": { name: "Bộ Hựu", hanviet: "HỰU", pinyin: "yòu", meaning: "Lại một lần nữa, bàn tay phải", strokes: 2 },
  "口": { name: "Bộ Khẩu", hanviet: "KHẨU", pinyin: "kǒu", meaning: "Cái miệng, ăn uống, lời nói", strokes: 3 },
  "囗": { name: "Bộ Vi", hanviet: "VI", pinyin: "wéi", meaning: "Vây quanh, bao bọc bốn phía", strokes: 3 },
  "土": { name: "Bộ Thổ", hanviet: "THỔ", pinyin: "tǔ", meaning: "Đất đai, thổ nhưỡng", strokes: 3 },
  "士": { name: "Bộ Sĩ", hanviet: "SĨ", pinyin: "shì", meaning: "Kẻ sĩ, người có học, quan chức", strokes: 3 },
  "夂": { name: "Bộ Truy", hanviet: "TRUY", pinyin: "zhǐ", meaning: "Đi chậm chạp từ phía sau", strokes: 3 },
  "夕": { name: "Bộ Tịch", hanviet: "TỊCH", pinyin: "xī", meaning: "Buổi chiều tối, đêm", strokes: 3 },
  "大": { name: "Bộ Đại", hanviet: "ĐẠI", pinyin: "dà", meaning: "To lớn, vĩ đại", strokes: 3 },
  "女": { name: "Bộ Nữ", hanviet: "NỮ", pinyin: "nǚ", meaning: "Phụ nữ, con gái", strokes: 3 },
  "子": { name: "Bộ Tử", hanviet: "TỬ", pinyin: "zǐ", meaning: "Đứa con, đứa trẻ", strokes: 3 },
  "宀": { name: "Bộ Miên", hanviet: "MIÊN", pinyin: "mián", meaning: "Mái nhà, nơi che mưa nắng", strokes: 3 },
  "寸": { name: "Bộ Thốn", hanviet: "THỐN", pinyin: "cùn", meaning: "Tấc (đơn vị đo), đo lường", strokes: 3 },
  "小": { name: "Bộ Tiểu", hanviet: "TIỂU", pinyin: "xiǎo", meaning: "Nhỏ bé, khiêm tốn", strokes: 3 },
  "⺌": { name: "Bộ Tiểu (dạng trên)", hanviet: "TIỂU", pinyin: "xiǎo", meaning: "Nhỏ bé, phần trên của chữ", strokes: 3 },
  "⺍": { name: "Bộ Tiếu", hanviet: "TIẾU", pinyin: "xiào", meaning: "Nét tỏa ra trên đầu (như trong chữ 学)", strokes: 3 },
  "尸": { name: "Bộ Thi", hanviet: "THI", pinyin: "shī", meaning: "Thi thể, nằm bất động, mái hiên", strokes: 3 },
  "山": { name: "Bộ Sơn", hanviet: "SƠN", pinyin: "shān", meaning: "Núi non, đồi núi", strokes: 3 },
  "工": { name: "Bộ Công", hanviet: "CÔNG", pinyin: "gōng", meaning: "Công việc, người thợ, chế tác", strokes: 3 },
  "己": { name: "Bộ Kỷ", hanviet: "KỶ", pinyin: "jǐ", meaning: "Bản thân mình", strokes: 3 },
  "巾": { name: "Bộ Cân", hanviet: "CÂN", pinyin: "jīn", meaning: "Cái khăn, vải vóc", strokes: 3 },
  "广": { name: "Bộ Quảng", hanviet: "QUẢNG", pinyin: "guǎng", meaning: "Ngôi nhà rộng lớn tựa vào sườn đồi", strokes: 3 },
  "弓": { name: "Bộ Cung", hanviet: "CUNG", pinyin: "gōng", meaning: "Cây cung, uốn cong", strokes: 3 },
  "彡": { name: "Bộ Tam", hanviet: "TAM", pinyin: "shān", meaning: "Lông tóc sam sáp, hoa văn bóng mượt", strokes: 3 },
  "彳": { name: "Bộ Xích", hanviet: "XÍCH", pinyin: "chì", meaning: "Bước chân trái, đi lại trên đường", strokes: 3 },
  "心": { name: "Bộ Tâm", hanviet: "TÂM", pinyin: "xīn", meaning: "Trái tim, tấm lòng, tình cảm, suy nghĩ", strokes: 4 },
  "忄": { name: "Bộ Tâm đứng", hanviet: "TÂM", pinyin: "xīn", meaning: "Trái tim (biến thể bên trái chỉ tâm trạng)", strokes: 3 },
  "戈": { name: "Bộ Qua", hanviet: "QUA", pinyin: "gē", meaning: "Ngọn kích, vũ khí thời cổ", strokes: 4 },
  "手": { name: "Bộ Thủ", hanviet: "THỦ", pinyin: "shǒu", meaning: "Bàn tay, hoạt động của tay", strokes: 4 },
  "扌": { name: "Bộ Thủ (tay gảy)", hanviet: "THỦ", pinyin: "shǒu", meaning: "Bàn tay (biến thể bên trái chỉ hành động cầm nắm)", strokes: 3 },
  "支": { name: "Bộ Chi", hanviet: "CHI", pinyin: "zhī", meaning: "Cành nhánh, chống đỡ", strokes: 4 },
  "攵": { name: "Bộ Phộc", hanviet: "PHỘC", pinyin: "pū", meaning: "Đánh nhẹ, khẽ gõ, hành động", strokes: 4 },
  "文": { name: "Bộ Văn", hanviet: "VĂN", pinyin: "wén", meaning: "Văn chương, chữ viết, hoa văn", strokes: 4 },
  "斗": { name: "Bộ Đẩu", hanviet: "ĐẨU", pinyin: "dǒu", meaning: "Cái đấu đong gạo, sao Bắc Đẩu", strokes: 4 },
  "斤": { name: "Bộ Cân", hanviet: "CÂN", pinyin: "jīn", meaning: "Cái rìu đẽo cây, cân nặng", strokes: 4 },
  "方": { name: "Bộ Phương", hanviet: "PHƯƠNG", pinyin: "fāng", meaning: "Vuông vắn, hướng phương vị", strokes: 4 },
  "日": { name: "Bộ Nhật", hanviet: "NHẬT", pinyin: "rì", meaning: "Mặt trời, ngày, thời gian, ánh sáng", strokes: 4 },
  "曰": { name: "Bộ Viết", hanviet: "VIẾT", pinyin: "yuē", meaning: "Nói rằng, phát ngôn", strokes: 4 },
  "月": { name: "Bộ Nguyệt", hanviet: "NGUYỆT", pinyin: "yuè", meaning: "Mặt trăng, tháng, thịt thân thể", strokes: 4 },
  "木": { name: "Bộ Mộc", hanviet: "MỘC", pinyin: "mù", meaning: "Cây cối, gỗ, thực vật", strokes: 4 },
  "欠": { name: "Bộ Khiếm", hanviet: "KHIẾM", pinyin: "qiàn", meaning: "Thiếu thốn, há miệng ngáp", strokes: 4 },
  "止": { name: "Bộ Chỉ", hanviet: "CHỈ", pinyin: "zhǐ", meaning: "Dừng lại, bàn chân dừng", strokes: 4 },
  "歹": { name: "Bộ Đãi", hanviet: "ĐÃI", pinyin: "dǎi", meaning: "Xương tàn, chết chóc, tai ương", strokes: 4 },
  "殳": { name: "Bộ Thù", hanviet: "THÙ", pinyin: "shū", meaning: "Cây gậy gỗ để đập, tấn công", strokes: 4 },
  "母": { name: "Bộ Mẫu", hanviet: "MẪU", pinyin: "mǔ", meaning: "Mẹ, cội nguồn", strokes: 5 },
  "水": { name: "Bộ Thủy", hanviet: "THỦY", pinyin: "shuǐ", meaning: "Nước, sông suối, chất lỏng", strokes: 4 },
  "氵": { name: "Bộ Ba chấm Thủy", hanviet: "THỦY", pinyin: "shuǐ", meaning: "Nước (biến thể bên trái chỉ chất lỏng)", strokes: 3 },
  "火": { name: "Bộ Hỏa", hanviet: "HỎA", pinyin: "huǒ", meaning: "Lửa, cháy, nóng bỏng", strokes: 4 },
  "灬": { name: "Bộ Bốn chấm Hỏa", hanviet: "HỎA", pinyin: "huǒ", meaning: "Ngọn lửa nấu bên dưới", strokes: 4 },
  "父": { name: "Bộ Phụ", hanviet: "PHỤ", pinyin: "fù", meaning: "Cha, người cha", strokes: 4 },
  "牛": { name: "Bộ Ngưu", hanviet: "NGƯU", pinyin: "niú", meaning: "Con trâu, con bò", strokes: 4 },
  "牜": { name: "Bộ Ngưu (biến thể)", hanviet: "NGƯU", pinyin: "niú", meaning: "Con trâu bò (dạng đứng bên trái)", strokes: 4 },
  "犬": { name: "Bộ Khuyển", hanviet: "KHUYỂN", pinyin: "quǎn", meaning: "Con chó", strokes: 4 },
  "犭": { name: "Bộ Khuyển (thú)", hanviet: "KHUYỂN", pinyin: "quǎn", meaning: "Động vật bốn chân, thú dữ", strokes: 3 },
  "玉": { name: "Bộ Ngọc", hanviet: "NGỌC", pinyin: "yù", meaning: "Viên ngọc quý, đá đẹp", strokes: 5 },
  "王": { name: "Bộ Vương", hanviet: "VƯƠNG", pinyin: "wáng", meaning: "Vua chúa, ngọc quý", strokes: 4 },
  "生": { name: "Bộ Sinh", hanviet: "SINH", pinyin: "shēng", meaning: "Sinh sôi, sống, nảy mầm", strokes: 5 },
  "田": { name: "Bộ Điền", hanviet: "ĐIỀN", pinyin: "tián", meaning: "Ruộng đất, đồng lúa", strokes: 5 },
  "白": { name: "Bộ Bạch", hanviet: "BẠCH", pinyin: "bái", meaning: "Màu trắng, trong sáng, rõ ràng", strokes: 5 },
  "目": { name: "Bộ Mục", hanviet: "MỤC", pinyin: "mù", meaning: "Mắt, nhìn ngắm", strokes: 5 },
  "示": { name: "Bộ Thị", hanviet: "THỊ", pinyin: "shì", meaning: "Bày tỏ, thần linh, bàn thờ tổ tiên", strokes: 5 },
  "礻": { name: "Bộ Thị (biến thể)", hanviet: "THỊ", pinyin: "shì", meaning: "Thần linh, phúc đức, nghi lễ", strokes: 4 },
  "禾": { name: "Bộ Hòa", hanviet: "HÒA", pinyin: "hé", meaning: "Cây lúa non, ngũ cốc", strokes: 5 },
  "穴": { name: "Bộ Huyệt", hanviet: "HUYỆT", pinyin: "xué", meaning: "Hang hốc, hang đất", strokes: 5 },
  "竹": { name: "Bộ Trúc", hanviet: "TRÚC", pinyin: "zhú", meaning: "Cây tre, đồ dùng tre trúc", strokes: 6 },
  "⺮": { name: "Bộ Trúc (đầu)", hanviet: "TRÚC", pinyin: "zhú", meaning: "Tre trúc (nằm trên đầu chữ)", strokes: 6 },
  "米": { name: "Bộ Mễ", hanviet: "MỄ", pinyin: "mǐ", meaning: "Hạt gạo, lương thực", strokes: 6 },
  "糸": { name: "Bộ Mịch (tơ)", hanviet: "MỊCH", pinyin: "sī", meaning: "Sợi tơ nhỏ, chỉ may", strokes: 6 },
  "纟": { name: "Bộ Tơ (giản thể)", hanviet: "TƠ", pinyin: "sī", meaning: "Sợi dây, dệt may, liên kết", strokes: 3 },
  "耳": { name: "Bộ Nhĩ", hanviet: "NHĨ", pinyin: "ěr", meaning: "Lỗ tai, lắng nghe", strokes: 6 },
  "肉": { name: "Bộ Nhục", hanviet: "NHỤC", pinyin: "ròu", meaning: "Thịt, bộ phận cơ thể", strokes: 6 },
  "草": { name: "Bộ Thảo", hanviet: "THẢO", pinyin: "cǎo", meaning: "Cỏ non, thực vật", strokes: 9 },
  "艹": { name: "Bộ Đầu Thảo", hanviet: "THẢO", pinyin: "cǎo", meaning: "Cỏ cây, thực vật, hoa lá", strokes: 3 },
  "言": { name: "Bộ Ngôn", hanviet: "NGÔN", pinyin: "yán", meaning: "Lời nói, ngôn ngữ", strokes: 7 },
  "讠": { name: "Bộ Ngôn (giản thể)", hanviet: "NGÔN", pinyin: "yán", meaning: "Lời nói, đàm thoại, từ ngữ", strokes: 2 },
  "辶": { name: "Bộ Quai Xước", hanviet: "XƯỚC", pinyin: "chuò", meaning: "Chợt đi chợt dừng, đường sá, chuyển động", strokes: 3 },
  "走": { name: "Bộ Tẩu", hanviet: "TẨU", pinyin: "zǒu", meaning: "Chạy, đi bộ", strokes: 7 },
  "足": { name: "Bộ Túc", hanviet: "TÚC", pinyin: "zú", meaning: "Bàn chân, đầy đủ", strokes: 7 },
  "𧾷": { name: "Bộ Túc (chân)", hanviet: "TÚC", pinyin: "zú", meaning: "Bàn chân, đá, bước nhảy", strokes: 7 },
  "车": { name: "Bộ Xa", hanviet: "XA", pinyin: "chē", meaning: "Chiếc xe, xe cộ di chuyển", strokes: 4 },
  "门": { name: "Bộ Môn", hanviet: "MÔN", pinyin: "mén", meaning: "Cánh cổng, lối vào nhà", strokes: 3 },
  "阝": { name: "Bộ Phụ / Ấp", hanviet: "PHỤ / ẤP", pinyin: "fù / yà", meaning: "Bên trái là gò đồi (Phụ), bên phải là thành quách/làng xóm (Ấp)", strokes: 2 },
  "雨": { name: "Bộ Vũ", hanviet: "VŨ", pinyin: "yǔ", meaning: "Mưa, thời tiết mây gió tuyết", strokes: 8 },
  "食": { name: "Bộ Thực", hanviet: "THỰC", pinyin: "shí", meaning: "Ăn uống, thức ăn", strokes: 9 },
  "饣": { name: "Bộ Thực (giản thể)", hanviet: "THỰC", pinyin: "shí", meaning: "Thức ăn, món ăn, ẩm thực", strokes: 3 },
  "金": { name: "Bộ Kim", hanviet: "KIM", pinyin: "jīn", meaning: "Kim loại, vàng, tiền bạc", strokes: 8 },
  "钅": { name: "Bộ Kim (giản thể)", hanviet: "KIM", pinyin: "jīn", meaning: "Kim loại, dụng cụ sắt thép", strokes: 5 },
  "隹": { name: "Bộ Chuy", hanviet: "CHUY", pinyin: "zhuī", meaning: "Chim đuôi ngắn", strokes: 8 },
  "鸟": { name: "Bộ Điểu", hanviet: "ĐIỂU", pinyin: "niǎo", meaning: "Con chim, loài chim", strokes: 5 },
  "鱼": { name: "Bộ Ngư", hanviet: "NGƯ", pinyin: "yú", meaning: "Con cá, loài cá", strokes: 8 },
  "页": { name: "Bộ Hiệt", hanviet: "HIỆT", pinyin: "yè", meaning: "Đầu người, trang giấy", strokes: 6 },
};

// Rich precomputed character decompositions matching the exact red/blue breakdown
export const PRECOMPUTED_CHARACTERS: Record<string, CharacterDecomposition> = {
  "好": {
    char: "好",
    pinyin: "hǎo",
    hanviet: "HẢO",
    meaning: "Tốt, đẹp, hay, thân thiện, bình an",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 6,
    mainRadical: "女",
    radicalName: "Bộ Nữ (Phụ nữ)",
    radicalMeaning: "Người phụ nữ, người mẹ giàu đức hy sinh và tình yêu thương",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Hảo (好) kết cấu Trái - Phải: bên trái là bộ Nữ (女: người mẹ/phụ nữ), bên phải là chữ Tử (子: đứa con).",
    story: "Mẹ (女) âu yếm ôm đứa con (子) vào lòng là một hình ảnh vô cùng tốt đẹp (好).",
    mnemonic: "Mẹ (女) bên cạnh đứa con (子) là điều tốt đẹp trọn vẹn nhất (HẢO - 好).",
    components: [
      {
        component: "女",
        name: "Bộ Nữ (Phụ nữ, người mẹ)",
        hanviet: "NỮ",
        pinyin: "nǚ",
        color: "#dc2626", // ĐỎ - Bộ thủ chính bên trái
        meaning: "Người phụ nữ, người mẹ giàu lòng yêu thương",
        role: "Bộ thủ chính biểu ý (Nằm bên trái, 3 nét)",
        strokes: 3
      },
      {
        component: "子",
        name: "Chữ Tử (Đứa con)",
        hanviet: "TỬ",
        pinyin: "zǐ",
        color: "#1e3a8a", // XANH NAVY - Thành phần bên phải
        meaning: "Đứa con thơ bé bỏng, tương lai",
        role: "Thành phần kết hợp (Nằm bên phải, 3 nét)",
        strokes: 3
      }
    ]
  },
  "岁": {
    char: "岁",
    pinyin: "suì",
    hanviet: "TUẾ",
    meaning: "Tuổi, năm, năm tháng",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 6,
    mainRadical: "山",
    radicalName: "Bộ Sơn (Ngọn núi)",
    radicalMeaning: "Ngọn núi cao sừng sững, thời gian vững chãi",
    radicalPosition: "Phần trên (Trên cùng)",
    breakdownTip: "Chữ Tuế (岁) kết cấu Trên - Dưới: phía trên là bộ Sơn (山: ngọn núi), phía dưới là bộ Tịch (夕: đêm trăng, chiều tà).",
    story: "Thời gian trôi qua, từng đêm trăng (夕 - Tịch) lặn dần sau rặng núi cao (山 - Sơn), hết một năm lại thêm một tuổi (岁 - Tuế).",
    mnemonic: "Núi (山) ngắm trăng chiều (夕) qua đi, thêm một tuổi (TUẾ - 岁).",
    components: [
      {
        component: "山",
        name: "Bộ Sơn (Ngọn núi)",
        hanviet: "SƠN",
        pinyin: "shān",
        color: "#dc2626", // ĐỎ - Bộ thủ chính ở trên giống trong nét vẽ
        meaning: "Ngọn núi cao sừng sững",
        role: "Bộ thủ chính (Nằm ở phía trên, 3 nét)",
        strokes: 3
      },
      {
        component: "夕",
        name: "Bộ Tịch (Chiều tà, đêm trăng)",
        hanviet: "TỊCH",
        pinyin: "xī",
        color: "#1e3a8a", // XANH NAVY - Thành phần ở dưới giống trong nét vẽ
        meaning: "Chiều tối, ánh trăng khuyết, thời gian trôi qua",
        role: "Thành phần biểu ý (Nằm ở phía dưới, 3 nét)",
        strokes: 3
      }
    ]
  },
  "是": {
    char: "是",
    pinyin: "shì",
    hanviet: "THỊ",
    meaning: "Là, phải, đúng, chính là",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 9,
    mainRadical: "日",
    radicalName: "Bộ Nhật (Mặt trời)",
    radicalMeaning: "Mặt trời chiếu sáng, ngày, thời gian, sự thật hiển nhiên",
    radicalPosition: "Phần trên (Trên cùng)",
    breakdownTip: "Chữ Thị (是) kết cấu Trên - Dưới: phía trên là bộ Nhật (日: mặt trời), phía dưới là chữ Chính/Thất (疋/正: ngay ngắn).",
    story: "Mặt trời (日) trên cao chiếu rọi ngay thẳng xuống bước chân (疋/正) đi trên mặt đất, biểu tượng cho chân lý và sự thật hiển nhiên (THỊ - 是).",
    mnemonic: "Mặt trời (日 - Nhật) trên cao chiếu sáng ngay thẳng (疋/正) xuống đất -> đó là lẽ phải, sự thật, điều đúng đắn hiển nhiên (THỊ - 是).",
    components: [
      {
        component: "日",
        name: "Bộ Nhật (日)",
        hanviet: "NHẬT",
        pinyin: "rì",
        color: "#dc2626", // RED like in the user's image!
        meaning: "Mặt trời, ban ngày, ánh sáng quang minh",
        role: "Bộ thủ chính biểu ý (Nằm phần trên, 4 nét)",
        strokes: 4
      },
      {
        component: "疋",
        name: "Chân / Hạ bộ (疋/正)",
        hanviet: "THẤT / CHÍNH",
        pinyin: "pǐ / zhèng",
        color: "#1e3a8a", // NAVY BLUE like in the user's image!
        meaning: "Bước chân ngay ngắn, đứng thẳng, không xiêu vẹo",
        role: "Thành phần kết hợp (Nằm phần dưới, 5 nét)",
        strokes: 5
      }
    ]
  },
  "认": {
    char: "认",
    pinyin: "rèn",
    hanviet: "NHẬN",
    meaning: "Nhận biết, nhận ra, công nhận, thừa nhận",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 4,
    mainRadical: "讠",
    radicalName: "Bộ Ngôn (Lời nói)",
    radicalMeaning: "Lời nói, phát ngôn, giao tiếp chân thành",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Nhận (认) kết cấu Trái - Phải: bên trái là bộ Ngôn (讠: lời nói), bên phải là bộ Nhân (人: con người).",
    story: "Dùng lời nói (讠) chân thành để nhận biết và thấu hiểu một con người (人) chính là sự nhận biết, làm quen (认).",
    mnemonic: "Lời nói (讠) gắn với con người (人) tạo thành sự nhận biết, công nhận (NHẬN - 认).",
    components: [
      {
        component: "讠",
        name: "Bộ Ngôn (Lời nói)",
        hanviet: "NGÔN",
        pinyin: "yán",
        color: "#dc2626",
        meaning: "Lời nói, ngôn ngữ chân thành",
        role: "Bộ thủ chính biểu ý (Nằm bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "人",
        name: "Bộ Nhân (Con người)",
        hanviet: "NHÂN",
        pinyin: "rén",
        color: "#1e3a8a",
        meaning: "Con người, nhân cách",
        role: "Thành phần kết hợp (Nằm bên phải, 2 nét)",
        strokes: 2
      }
    ]
  },
  "识": {
    char: "识",
    pinyin: "shí",
    hanviet: "THỨC",
    meaning: "Quen biết, hiểu biết, tri thức, nhận biết",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 7,
    mainRadical: "讠",
    radicalName: "Bộ Ngôn (Lời nói)",
    radicalMeaning: "Lời nói, trò chuyện, trao đổi giao tiếp",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Thức (识) kết cấu Trái - Phải: bên trái là bộ Ngôn (讠: lời nói), bên phải là chữ Chỉ (只: chỉ, vẻn vẹn).",
    story: "Chỉ cần (只) vài ba lời nói (讠) chân tình cất lên là ta đã có thể quen biết, thấu hiểu (识) được một người bạn mới.",
    mnemonic: "Chỉ (只) vài lời nói (讠) là quen biết (THỨC - 识).",
    components: [
      {
        component: "讠",
        name: "Bộ Ngôn (Lời nói)",
        hanviet: "NGÔN",
        pinyin: "yán",
        color: "#dc2626",
        meaning: "Lời nói, giao tiếp cởi mở",
        role: "Bộ thủ chính biểu ý (Nằm bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "只",
        name: "Chữ Chỉ (Chỉ vẻn vẹn)",
        hanviet: "CHỈ",
        pinyin: "zhǐ",
        color: "#1e3a8a",
        meaning: "Chỉ, chỉ có, ngắn gọn",
        role: "Thành phần kết hợp (Nằm bên phải, 5 nét)",
        strokes: 5
      }
    ]
  },
  "想": {
    char: "想",
    pinyin: "xiǎng",
    hanviet: "TƯỞNG",
    meaning: "Nghĩ, nhớ, muốn, suy nghĩ, tưởng nhớ",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 13,
    mainRadical: "心",
    radicalName: "Bộ Tâm (Trái tim)",
    radicalMeaning: "Tâm tư, suy nghĩ, tấm lòng, tình cảm bên trong",
    radicalPosition: "Phần dưới (Dưới cùng)",
    breakdownTip: "Chữ Tưởng (想) kết cấu Trên - Dưới: phía trên là chữ Tương (相: cây cối và mắt nhìn), phía dưới là bộ Tâm (心: trái tim).",
    story: "Đôi mắt nhìn chăm chú lên cây (相) rồi khắc sâu hình bóng vào tận đáy lòng (心) tạo thành nỗi nhớ nhung, mong muốn (TƯỞNG - 想).",
    mnemonic: "Mắt (目 - Mục) nhìn chăm chú lên cây (木 - Mộc) là chữ Tương (相 - xem xét), để hình ảnh đó trong lòng (心 - Tâm) suy ngẫm tạo thành chữ TƯỞNG (想 - nghĩ, nhớ, mong muốn).",
    components: [
      {
        component: "心",
        name: "Bộ Tâm (心)",
        hanviet: "TÂM",
        pinyin: "xīn",
        color: "#dc2626",
        meaning: "Trái tim, tâm trí, suy tư, tình cảm",
        role: "Bộ thủ chính biểu ý (Nằm ở dưới)",
        strokes: 4
      },
      {
        component: "相",
        name: "Chữ Tương (相 = 木 + 目)",
        hanviet: "TƯƠNG",
        pinyin: "xiāng",
        color: "#1e3a8a",
        meaning: "Nhìn nhau, xem xét, hình tướng (Cây 木 + Mắt 目)",
        role: "Thành phần biểu âm & ý (Nằm ở trên)",
        strokes: 9
      }
    ]
  },
  "你": {
    char: "你",
    pinyin: "nǐ",
    hanviet: "NHĨ",
    meaning: "Bạn, anh, cậu (ngôi thứ 2 số ít)",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 7,
    mainRadical: "亻",
    radicalName: "Bộ Nhân đứng (亻)",
    radicalMeaning: "Con người, đối tượng giao tiếp",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Nhĩ (你) kết cấu Trái - Phải: bên trái là bộ Nhân đứng (亻: con người), bên phải là chữ Nhĩ (尔: người ấy).",
    story: "Con người (亻) hướng về người đối diện (尔) trong giao tiếp chân thành chính là bạn, anh, chị (NHĨ - 你).",
    mnemonic: "Con người (亻- Nhân) đứng đối diện với một người khác (尔 - Nhĩ) để trò chuyện -> nghĩa là Bạn, Mày, Cậu (NHĨ - 你).",
    components: [
      {
        component: "亻",
        name: "Bộ Nhân đứng (亻)",
        hanviet: "NHÂN",
        pinyin: "rén",
        color: "#dc2626",
        meaning: "Con người, người đối diện",
        role: "Bộ thủ chính biểu ý (Bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "尔",
        name: "Chữ Nhĩ (尔)",
        hanviet: "NHĨ",
        pinyin: "ěr",
        color: "#1e3a8a",
        meaning: "Người ấy, ngươi, ấy vậy",
        role: "Thành phần biểu âm (Bên phải, 5 nét)",
        strokes: 5
      }
    ]
  },
  "学": {
    char: "学",
    pinyin: "xué",
    hanviet: "HỌC",
    meaning: "Học, học tập, nghiên cứu, bắt chước",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 8,
    mainRadical: "子",
    radicalName: "Bộ Tử (Đứa con)",
    radicalMeaning: "Đứa trẻ, thế hệ trẻ tiếp thu tri thức",
    radicalPosition: "Phần dưới cùng",
    breakdownTip: "Chữ Học (学) kết cấu Trên - Dưới: phía trên là ngọn lửa tri thức và mái che (⺍ + 冖), phía dưới là bộ Tử (子: đứa trẻ).",
    story: "Đứa trẻ (子) ngồi dưới mái che (冖) chăm chú đón nhận ngọn lửa tri thức (⺍) mở mang con đường học tập, học hành (HỌC - 学).",
    mnemonic: "Đứa trẻ (子 - Tử) ngồi dưới mái nhà (冖 - Mịch) tiếp thu những tia sáng tri thức tỏa ra (⺍) -> chính là việc HỌC (学).",
    components: [
      {
        component: "子",
        name: "Bộ Tử (子)",
        hanviet: "TỬ",
        pinyin: "zǐ",
        color: "#dc2626",
        meaning: "Đứa trẻ, đứa con",
        role: "Bộ thủ chính biểu ý (Phần dưới, 3 nét)",
        strokes: 3
      },
      {
        component: "⺍冖",
        name: "Đầu tiếu & Mái che (⺍ + 冖)",
        hanviet: "TIẾU MỊCH",
        pinyin: "xiào mì",
        color: "#1e3a8a",
        meaning: "Ánh sáng tri thức phía trên mái trường che chở",
        role: "Phần trên (5 nét)",
        strokes: 5
      }
    ]
  },
  "习": {
    char: "习",
    pinyin: "xí",
    hanviet: "TẬP",
    meaning: "Tập, rèn luyện, quen thuộc, ôn tập",
    structure: "Kết cấu Bao bọc nửa phần (半包围结构)",
    strokeCount: 3,
    mainRadical: "𠃌",
    radicalName: "Bộ Kỷ / Khung bao",
    radicalMeaning: "Khung vòm, nét bao ngoài",
    radicalPosition: "Bao ngoài bên trái",
    breakdownTip: "Chữ Tập (习) gồm bộ Băng/Dực (羽 biến thể: đôi cánh chim) bay liệng dưới bầu trời.",
    story: "Chú chim non vỗ đôi cánh (习) tập bay hàng ngày để bay lượn vững vàng chính là rèn luyện, học tập (TẬP - 习).",
    mnemonic: "Chữ gốc là 羽 (lông cánh chim): chim non dang cánh tập bay lặp đi lặp lại nhiều lần dưới bầu trời -> thành thói quen rèn LUYỆN TẬP (习).",
    components: [
      {
        component: "𠃌",
        name: "Nét gập bao (𠃌)",
        hanviet: "KHUNG",
        pinyin: "gōu",
        color: "#dc2626",
        meaning: "Khung vòm chuyển động",
        role: "Bộ thủ / Nét chính (1 nét)",
        strokes: 1
      },
      {
        component: "冫",
        name: "Bộ Băng (冫)",
        hanviet: "BĂNG",
        pinyin: "bīng",
        color: "#1e3a8a",
        meaning: "Hai chiếc lông vũ chim non bay lượn",
        role: "Thành phần bên trong (2 nét)",
        strokes: 2
      }
    ]
  },
  "语": {
    char: "语",
    pinyin: "yǔ",
    hanviet: "NGỮ",
    meaning: "Ngôn ngữ, tiếng nói, lời nói",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 9,
    mainRadical: "讠",
    radicalName: "Bộ Ngôn (讠/言)",
    radicalMeaning: "Lời nói, ngôn từ, đàm thoại",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Ngữ (语) kết cấu Trái - Phải: bên trái là bộ Ngôn (讠: lời nói), bên phải là chữ Ngô (吾 = 五 + 口: bản thân tôi).",
    story: "Dùng lời nói (讠) từ tận đáy lòng của chính bản thân mình (吾) để giãi bày tâm tư chính là tiếng nói, ngôn ngữ (NGỮ - 语).",
    mnemonic: "Lời nói (讠- Ngôn) thốt ra từ bản thân tôi (吾 = Ngũ 五 + Khẩu 口) -> đó chính là NGÔN NGỮ (语 - tiếng nói truyền đạt suy nghĩ).",
    components: [
      {
        component: "讠",
        name: "Bộ Ngôn (讠)",
        hanviet: "NGÔN",
        pinyin: "yán",
        color: "#dc2626",
        meaning: "Lời nói, ngôn từ",
        role: "Bộ thủ chính biểu ý (Bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "吾",
        name: "Chữ Ngô (吾 = 五 + 口)",
        hanviet: "NGÔ",
        pinyin: "wú",
        color: "#1e3a8a",
        meaning: "Bản thân tôi, ta, lời nói từ miệng (Khẩu 口) tôi",
        role: "Thành phần biểu âm & ý (Bên phải, 7 nét)",
        strokes: 7
      }
    ]
  },
  "汉": {
    char: "汉",
    pinyin: "hàn",
    hanviet: "HÁN",
    meaning: "Người Hán, tiếng Hán, sông Hán",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 5,
    mainRadical: "氵",
    radicalName: "Bộ Ba chấm Thủy (氵)",
    radicalMeaning: "Nước, dòng sông, lưu vực sông Hán Thủy",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Hán (汉) kết cấu Trái - Phải: bên trái là bộ Thủy (氵: dòng sông), bên phải là chữ Hựu (又: đất đai, bàn tay).",
    story: "Dòng nước sông Hán (氵) tưới mát mảnh đất màu mỡ (又) làm nên cội nguồn rực rỡ của dân tộc Hán (HÁN - 汉).",
    mnemonic: "Dòng nước (氵- Thủy) của con sông Hán Thủy, nơi dân tộc Hán sinh sôi và dùng bàn tay (又 - Hựu) dựng xây đất nước (HÁN - 汉).",
    components: [
      {
        component: "氵",
        name: "Bộ Ba chấm Thủy (氵)",
        hanviet: "THỦY",
        pinyin: "shuǐ",
        color: "#dc2626",
        meaning: "Nước, dòng sông Hán",
        role: "Bộ thủ chính biểu ý (Bên trái, 3 nét)",
        strokes: 3
      },
      {
        component: "又",
        name: "Bộ Hựu (又)",
        hanviet: "HỰU",
        pinyin: "yòu",
        color: "#1e3a8a",
        meaning: "Bàn tay phải, cần cù lao động",
        role: "Thành phần kết hợp (Bên phải, 2 nét)",
        strokes: 2
      }
    ]
  },
  "明": {
    char: "明",
    pinyin: "míng",
    hanviet: "MINH",
    meaning: "Sáng sủa, thông minh, ngày mai, rõ ràng",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 8,
    mainRadical: "日",
    radicalName: "Bộ Nhật (Mặt trời)",
    radicalMeaning: "Mặt trời, nguồn ánh sáng ban ngày",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Minh (明) kết cấu Trái - Phải: bên trái là bộ Nhật (日: mặt trời), bên phải là bộ Nguyệt (月: mặt trăng).",
    story: "Vầng mặt trời (日) cùng ánh trăng (月) rực rỡ tỏa sáng khắp nhân gian mang lại sự sáng tỏ, quang minh (MINH - 明).",
    mnemonic: "Mặt trời (日 - Nhật) rực rỡ ban ngày kết hợp cùng Mặt trăng (月 - Nguyệt) sáng tỏ ban đêm tạo nên ánh sáng rực rỡ, chiếu rọi vạn vật (MINH - 明 - sáng tỏ).",
    components: [
      {
        component: "日",
        name: "Bộ Nhật (日)",
        hanviet: "NHẬT",
        pinyin: "rì",
        color: "#dc2626",
        meaning: "Mặt trời, ánh sáng ban ngày",
        role: "Bộ thủ chính biểu ý (Bên trái, 4 nét)",
        strokes: 4
      },
      {
        component: "月",
        name: "Bộ Nguyệt (月)",
        hanviet: "NGUYỆT",
        pinyin: "yuè",
        color: "#1e3a8a",
        meaning: "Mặt trăng, ánh sáng ban đêm",
        role: "Thành phần biểu ý kết hợp (Bên phải, 4 nét)",
        strokes: 4
      }
    ]
  },
  "休": {
    char: "休",
    pinyin: "xiū",
    hanviet: "HƯU",
    meaning: "Nghỉ ngơi, ngừng lại, hưu trí",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 6,
    mainRadical: "亻",
    radicalName: "Bộ Nhân đứng (亻)",
    radicalMeaning: "Con người, người lao động",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Hưu (休) kết cấu Trái - Phải: bên trái là bộ Nhân đứng (亻: con người), bên phải là bộ Mộc (木: gốc cây).",
    story: "Người đi đường (亻) mỏi gối dừng chân tựa lưng vào gốc cây (木) để nghỉ ngơi (HƯU - 休).",
    mnemonic: "Con người (亻- Nhân) sau giờ làm việc mệt mỏi ra tựa lưng vào gốc cây (木 - Mộc) rợp bóng mát để nghỉ ngơi (HƯU - 休 - nghỉ ngơi).",
    components: [
      {
        component: "亻",
        name: "Bộ Nhân đứng (亻)",
        hanviet: "NHÂN",
        pinyin: "rén",
        color: "#dc2626",
        meaning: "Con người lao động",
        role: "Bộ thủ chính biểu ý (Bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "木",
        name: "Bộ Mộc (木)",
        hanviet: "MỘC",
        pinyin: "mù",
        color: "#1e3a8a",
        meaning: "Cây cối rợp bóng râm",
        role: "Thành phần biểu ý kết hợp (Bên phải, 4 nét)",
        strokes: 4
      }
    ]
  },
  "听": {
    char: "听",
    pinyin: "tīng",
    hanviet: "THÍNH",
    meaning: "Nghe, lắng nghe, nghe theo",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 7,
    mainRadical: "口",
    radicalName: "Bộ Khẩu (Cái miệng)",
    radicalMeaning: "Miệng, phát âm, thanh âm",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Thính (听) kết cấu Trái - Phải: bên trái là bộ Khẩu (口: chiếc miệng), bên phải là chữ Cân (斤: chiếc rìu).",
    story: "Mở miệng (口) lắng tai nghe tiếng chiếc rìu (斤) đốn gỗ vang vọng giữa rừng sâu (THÍNH - 听).",
    mnemonic: "Cái miệng (口 - Khẩu) phát ra thanh âm, cây rìu gõ nhẹ (斤 - Cân) tạo tiếng động bên tai để người ta chú ý lắng NGHE (听).",
    components: [
      {
        component: "口",
        name: "Bộ Khẩu (口)",
        hanviet: "KHẨU",
        pinyin: "kǒu",
        color: "#dc2626",
        meaning: "Cái miệng phát ra âm thanh",
        role: "Bộ thủ chính biểu ý (Bên trái, 3 nét)",
        strokes: 3
      },
      {
        component: "斤",
        name: "Bộ Cân (斤)",
        hanviet: "CÂN",
        pinyin: "jīn",
        color: "#1e3a8a",
        meaning: "Cái búa, cái rìu gõ âm vang",
        role: "Thành phần biểu âm & ý (Bên phải, 4 nét)",
        strokes: 4
      }
    ]
  },
  "说": {
    char: "说",
    pinyin: "shuō",
    hanviet: "THUYẾT",
    meaning: "Nói, giảng giải, trình bày, câu chuyện",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 9,
    mainRadical: "讠",
    radicalName: "Bộ Ngôn (讠)",
    radicalMeaning: "Lời nói, phát ngôn",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Thuyết (说) kết cấu Trái - Phải: bên trái là bộ Ngôn (讠: lời nói), bên phải là chữ Đoái (兑: nụ cười hân hoan).",
    story: "Dùng lời nói (讠) chân thành, hòa nhã làm cho người đối diện nở nụ cười hân hoan vui sướng (兑) khi tâm sự, giải thích và nói ra (THUYẾT - 说).",
    mnemonic: "Dùng lời nói (讠- Ngôn) chân thành trao đổi làm cho người khác (兑 - Đoái) mỉm cười vui vẻ thấu hiểu (THUYẾT - 说 - nói năng).",
    components: [
      {
        component: "讠",
        name: "Bộ Ngôn (讠)",
        hanviet: "NGÔN",
        pinyin: "yán",
        color: "#dc2626",
        meaning: "Lời nói, ngôn ngữ",
        role: "Bộ thủ chính biểu ý (Bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "兑",
        name: "Chữ Đoái (兑)",
        hanviet: "ĐOÁI",
        pinyin: "duì",
        color: "#1e3a8a",
        meaning: "Vui vẻ, hân hoan, giải tỏa",
        role: "Thành phần biểu âm & ý (Bên phải, 7 nét)",
        strokes: 7
      }
    ]
  },
  "读": {
    char: "读",
    pinyin: "dú",
    hanviet: "ĐỘC",
    meaning: "Đọc, đọc sách, học bài",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 10,
    mainRadical: "讠",
    radicalName: "Bộ Ngôn (讠)",
    radicalMeaning: "Lời nói, phát âm chữ nghĩa",
    radicalPosition: "Bên trái",
    breakdownTip: "Chữ Độc (读) kết cấu Trái - Phải: bên trái là bộ Ngôn (讠: lời nói), bên phải là chữ Mại (卖: trao đổi, truyền bá).",
    story: "Dùng lời nói (讠) đọc to từng con chữ để tiếp thu và lan tỏa (卖) tri thức sách vở chính là đọc sách (ĐỘC - 读).",
    mnemonic: "Dùng lời nói (讠- Ngôn) xướng lên chữ nghĩa buôn bán giao thương (卖 - Mại) đã được khắc ghi trên sách vở -> chính là việc ĐỌC (读).",
    components: [
      {
        component: "讠",
        name: "Bộ Ngôn (讠)",
        hanviet: "NGÔN",
        pinyin: "yán",
        color: "#dc2626",
        meaning: "Lời nói, đọc thành tiếng",
        role: "Bộ thủ chính biểu ý (Bên trái, 2 nét)",
        strokes: 2
      },
      {
        component: "卖",
        name: "Chữ Mại (卖)",
        hanviet: "MẠI",
        pinyin: "mài",
        color: "#1e3a8a",
        meaning: "Giao thương, sổ sách buôn bán",
        role: "Thành phần biểu âm (Bên phải, 8 nét)",
        strokes: 8
      }
    ]
  },
  "写": {
    char: "写",
    pinyin: "xiě",
    hanviet: "TẢ",
    meaning: "Viết, vẽ, miêu tả",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 5,
    mainRadical: "冖",
    radicalName: "Bộ Mịch (Mái che)",
    radicalMeaning: "Mái nhà, tấm lụa phủ để đặt giấy viết",
    radicalPosition: "Phần trên",
    breakdownTip: "Chữ Tả (写) kết cấu Trên - Dưới: phía trên là bộ Mịch (冖: mái che), phía dưới là chữ Dữ (与: ban tặng, vẽ ra).",
    story: "Ngồi dưới mái bàn (冖) cẩn thận đặt bút vẽ ra (与) từng con chữ ngay ngắn chính là viết, ghi chép (TẢ - 写).",
    mnemonic: "Ngồi dưới mái phòng (冖 - Mịch) cầm bút chim (与 - cánh én/bút lông) lượn nét trên mặt giấy -> đó là hành động VIẾT (写).",
    components: [
      {
        component: "冖",
        name: "Bộ Mịch (冖)",
        hanviet: "MỊCH",
        pinyin: "mì",
        color: "#dc2626",
        meaning: "Mái phòng, bàn viết che phủ",
        role: "Bộ thủ chính biểu ý (Phần trên, 2 nét)",
        strokes: 2
      },
      {
        component: "与",
        name: "Chữ Dữ (与)",
        hanviet: "DỮ",
        pinyin: "yǔ",
        color: "#1e3a8a",
        meaning: "Trao cho, nét vẽ uốn lượn",
        role: "Thành phần kết hợp (Phần dưới, 3 nét)",
        strokes: 3
      }
    ]
  },
  "老": {
    char: "老",
    pinyin: "lǎo",
    hanviet: "LÃO",
    meaning: "Già, người lớn tuổi, thầy, nhiều kinh nghiệm",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 6,
    mainRadical: "老",
    radicalName: "Bộ Lão (老/耂)",
    radicalMeaning: "Người già, tóc bạc, chống gậy",
    radicalPosition: "Toàn bộ / Phần trên",
    breakdownTip: "Chữ Lão (老) gồm người già tóc dài chống gậy (耂) và chiếc muỗng/lưng còng (匕).",
    story: "Hình ảnh người cao tuổi lưng còng, chống gậy (耂) tóc dài bạc trắng, bước đi chậm rãi chính là người già, lão sư (LÃO - 老).",
    mnemonic: "Hình ảnh một cụ già (耂) tóc dài bạc trắng lưng còng chống chiếc gậy (匕) đi từng bước chậm rãi -> chữ LÃO (老 - già dặn, tôn kính).",
    components: [
      {
        component: "耂",
        name: "Bộ Lão đầu (耂)",
        hanviet: "LÃO",
        pinyin: "lǎo",
        color: "#dc2626",
        meaning: "Cụ già tóc bạc, người từng trải",
        role: "Bộ thủ chính biểu ý (Phần trên, 4 nét)",
        strokes: 4
      },
      {
        component: "匕",
        name: "Cái gậy chống (匕)",
        hanviet: "CHỦY",
        pinyin: "bǐ",
        color: "#1e3a8a",
        meaning: "Chiếc gậy chống đỡ bước chân",
        role: "Thành phần kết hợp (Phần dưới, 2 nét)",
        strokes: 2
      }
    ]
  },
  "师": {
    char: "师",
    pinyin: "shī",
    hanviet: "SƯ",
    meaning: "Thầy giáo, sư phụ, người dạy bảo, đạo quân",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 6,
    mainRadical: "巾",
    radicalName: "Bộ Cân (Cái khăn)",
    radicalMeaning: "Khăn quàng kẻ sĩ, cờ lệnh chỉ huy",
    radicalPosition: "Bên phải",
    breakdownTip: "Chữ Sư (师) kết cấu Trái - Phải: bên trái là đồi cao gò đất (𠂤), bên phải là dải khăn lệnh (巾).",
    story: "Vị tướng chỉ huy đứng trên gò đất cao (𠂤) tay cầm cờ khăn lệnh (巾) truyền dạy phép tắc, tri thức cho ba quân chính là người thầy giáo, đạo sư (SƯ - 师).",
    mnemonic: "Người đứng trên sườn đồi (丨丿) cầm lá cờ hiệu/khăn cân (巾) dẫn dắt đạo quân và học trò đi đúng hướng -> chính là SƯ (师 - người thầy, người dẫn đường).",
    components: [
      {
        component: "巾",
        name: "Bộ Cân (巾)",
        hanviet: "CÂN",
        pinyin: "jīn",
        color: "#dc2626",
        meaning: "Khăn lễ, cờ dẫn đường của kẻ sĩ",
        role: "Bộ thủ chính biểu ý (Bên phải, 3 nét)",
        strokes: 3
      },
      {
        component: "𠂤",
        name: "Đôi chân & Sườn đồi",
        hanviet: "ĐÔI",
        pinyin: "duī",
        color: "#1e3a8a",
        meaning: "Gò đất cao chỉ lối cho đoàn người",
        role: "Thành phần biểu ý kết hợp (Bên trái, 3 nét)",
        strokes: 3
      }
    ]
  },
  "朋": {
    char: "朋",
    pinyin: "péng",
    hanviet: "BẰNG",
    meaning: "Bạn bè bè bạn bè hữu, cùng chung chí hướng",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 8,
    mainRadical: "月",
    radicalName: "Bộ Nguyệt (Mặt trăng / Vỏ sò)",
    radicalMeaning: "Hai vầng trăng song hành hoặc hai chuỗi vỏ sò quý",
    radicalPosition: "Bên trái & Bên phải",
    breakdownTip: "Chữ Bằng (朋) gồm hai chữ Nguyệt (月 + 月) song hành đứng cạnh nhau.",
    story: "Hai vầng trăng (月 + 月) song hành kề vai sát cánh cùng soi sáng màn đêm đen chính là bạn bè tri kỷ (BẰNG - 朋).",
    mnemonic: "Hai vầng trăng sáng (月 + 月) luôn song hành cùng tỏa ánh dịu êm trên bầu trời -> tượng trưng cho BẠN BÈ (朋 - cùng chí hướng keo sơn).",
    components: [
      {
        component: "月",
        name: "Vầng trăng bên trái (月)",
        hanviet: "NGUYỆT",
        pinyin: "yuè",
        color: "#dc2626",
        meaning: "Vầng trăng thứ nhất, người bạn thứ nhất",
        role: "Bộ thủ chính (Bên trái, 4 nét)",
        strokes: 4
      },
      {
        component: "月",
        name: "Vầng trăng bên phải (月)",
        hanviet: "NGUYỆT",
        pinyin: "yuè",
        color: "#1e3a8a",
        meaning: "Vầng trăng thứ hai, người bạn thứ hai",
        role: "Thành phần song hành (Bên phải, 4 nét)",
        strokes: 4
      }
    ]
  },
  "友": {
    char: "友",
    pinyin: "yǒu",
    hanviet: "HỮU",
    meaning: "Bạn hữu, thân thiết, giúp đỡ lẫn nhau",
    structure: "Kết cấu Bao bọc nửa phần (半包围结构)",
    strokeCount: 4,
    mainRadical: "又",
    radicalName: "Bộ Hựu (Bàn tay)",
    radicalMeaning: "Bàn tay dang ra nắm lấy bàn tay nhau",
    radicalPosition: "Phần dưới bên phải",
    breakdownTip: "Chữ Hữu (友) gồm hai bàn tay (又) đan chéo vào nhau.",
    story: "Hai bàn tay (又) đan chặt lấy nhau trong gian khó hoạn nạn không rời chính là tình bạn bè, bằng hữu (HỮU - 友).",
    mnemonic: "Hai bàn tay (𠂇 + 又) chìa ra nắm chặt lấy nhau cùng vượt qua hoạn nạn -> chính là TÌNH BẠN HỮU (友).",
    components: [
      {
        component: "又",
        name: "Bộ Hựu (又)",
        hanviet: "HỰU",
        pinyin: "yòu",
        color: "#dc2626",
        meaning: "Bàn tay nắm lấy",
        role: "Bộ thủ chính biểu ý (Phần dưới, 2 nét)",
        strokes: 2
      },
      {
        component: "𠂇",
        name: "Nét tay trái (𠂇)",
        hanviet: "TẢ",
        pinyin: "zuǒ",
        color: "#1e3a8a",
        meaning: "Bàn tay kia đưa ra đón nhận",
        role: "Thành phần kết hợp (Phần trên, 2 nét)",
        strokes: 2
      }
    ]
  },
  "喜": {
    char: "喜",
    pinyin: "xǐ",
    hanviet: "HỈ",
    meaning: "Mừng rỡ, yêu thích, điều hân hoan may mắn",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 12,
    mainRadical: "口",
    radicalName: "Bộ Khẩu (Cái miệng)",
    radicalMeaning: "Miệng cười toe toét hân hoan ca hát",
    radicalPosition: "Phần dưới cùng",
    breakdownTip: "Chữ Hỉ (喜) kết cấu Trên - Dưới: phía trên là chiếc trống đại hỉ (壴), phía dưới là chiếc miệng cười (口).",
    story: "Tiếng trống đại hỉ rộn ràng (壴) hòa cùng chiếc miệng (口) cười tươi đón tin vui mừng, hoan hỉ (HỈ - 喜).",
    mnemonic: "Tiếng trống đàn (壴 - Trú) vang lên rộn rã trong ngày hội làm mọi cái miệng (口 - Khẩu) đều nở nụ cười hân hoan mừng rỡ (HỈ - 喜).",
    components: [
      {
        component: "口",
        name: "Bộ Khẩu (口)",
        hanviet: "KHẨU",
        pinyin: "kǒu",
        color: "#dc2626",
        meaning: "Miệng mỉm cười chúc mừng",
        role: "Bộ thủ chính biểu ý (Dưới cùng, 3 nét)",
        strokes: 3
      },
      {
        component: "壴",
        name: "Cái trống hội (壴 = 士 + 口)",
        hanviet: "TRÚ",
        pinyin: "zhù",
        color: "#1e3a8a",
        meaning: "Trống nhạc gióng lên trong ngày vui mừng",
        role: "Thành phần trên (9 nét)",
        strokes: 9
      }
    ]
  },
  "欢": {
    char: "欢",
    pinyin: "huān",
    hanviet: "HOAN",
    meaning: "Hoan hỉ, vui vẻ, hân hoan",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 6,
    mainRadical: "欠",
    radicalName: "Bộ Khiếm (欠)",
    radicalMeaning: "Há to miệng reo hò, há to miệng cười",
    radicalPosition: "Bên phải",
    breakdownTip: "Chữ Hoan (欢) kết cấu Trái - Phải: bên trái là cánh chim vỗ (又), bên phải là chiếc mỏ há to (欠).",
    story: "Con chim nhỏ (又) há to chiếc mỏ (欠) reo hò ríu rít thể hiện sự hân hoan, niềm vui thích (HOAN - 欢).",
    mnemonic: "Nhìn thấy chim quý (又 - biến thể từ 雚), người ta há to miệng reo hò (欠 - Khiếm) trong sự hân HOAN (欢).",
    components: [
      {
        component: "欠",
        name: "Bộ Khiếm (欠)",
        hanviet: "KHIẾM",
        pinyin: "qiàn",
        color: "#dc2626",
        meaning: "Há miệng reo hò vui mừng",
        role: "Bộ thủ chính biểu ý (Bên phải, 4 nét)",
        strokes: 4
      },
      {
        component: "又",
        name: "Bộ Hựu (又)",
        hanviet: "HỰU",
        pinyin: "yòu",
        color: "#1e3a8a",
        meaning: "Bàn tay vỗ tay hưởng ứng",
        role: "Thành phần bên trái (2 nét)",
        strokes: 2
      }
    ]
  },
  "国": {
    char: "国",
    pinyin: "guó",
    hanviet: "QUỐC",
    meaning: "Đất nước, quốc gia",
    structure: "Kết cấu Bao bọc hoàn toàn (全包围结构)",
    strokeCount: 8,
    mainRadical: "囗",
    radicalName: "Bộ Vi (Khung vây quanh)",
    radicalMeaning: "Đường biên giới quốc gia, tường thành bảo vệ bờ cõi",
    radicalPosition: "Bao bọc bốn phía bên ngoài",
    breakdownTip: "Chữ Quốc (国) kết cấu Bao bọc: bên ngoài là bộ Vi (囗: tường thành), bên trong là chữ Ngọc (玉: viên ngọc quý).",
    story: "Bức tường thành vững chắc (囗) bảo vệ viên ngọc quý (玉) của giang sơn chính là đất nước, quốc gia (QUỐC - 国).",
    mnemonic: "Bên trong tường thành biên cương kiên cố (囗 - Vi) gìn giữ viên ngọc quý giang sơn (玉 - Ngọc) -> tạo nên một ĐẤT NƯỚC (QUỐC - 国).",
    components: [
      {
        component: "囗",
        name: "Bộ Vi (囗)",
        hanviet: "VI",
        pinyin: "wéi",
        color: "#dc2626",
        meaning: "Biên giới bờ cõi khép kín bốn phương",
        role: "Bộ thủ chính biểu ý (Bao ngoài, 3 nét)",
        strokes: 3
      },
      {
        component: "玉",
        name: "Bộ Ngọc (玉)",
        hanviet: "NGỌC",
        pinyin: "yù",
        color: "#1e3a8a",
        meaning: "Viên ngọc báu giang sơn của dân tộc",
        role: "Thành phần bên trong (5 nét)",
        strokes: 5
      }
    ]
  },
  "中": {
    char: "中",
    pinyin: "zhōng",
    hanviet: "TRUNG",
    meaning: "Trung tâm, ở giữa, chính xác",
    structure: "Kết cấu Đơn thể (独体字)",
    strokeCount: 4,
    mainRadical: "丨",
    radicalName: "Bộ Cổn (Nét sổ đứng)",
    radicalMeaning: "Nét tên cắm thẳng chính giữa tâm bia",
    radicalPosition: "Nét sổ đứng xuyên qua giữa",
    breakdownTip: "Chữ Trung (中) gồm chiếc hộp vuông ở giữa và một đường sổ dọc (丨) xuyên qua hồng tâm.",
    story: "Mũi tên bắn xuyên qua hồng tâm hình chữ nhật (口) chính giữa mục tiêu chính là trung tâm, ở giữa (TRUNG - 中).",
    mnemonic: "Một hình vuông bia bắn (口) bị một mũi tên sắc bén (丨) cắm xuyên thẳng qua chính GIỮA (TRUNG - 中).",
    components: [
      {
        component: "丨",
        name: "Bộ Cổn (丨)",
        hanviet: "CỔN",
        pinyin: "gǔn",
        color: "#dc2626",
        meaning: "Mũi tên cắm thẳng chính giữa tâm",
        role: "Bộ thủ chính (Nét sổ dọc, 1 nét)",
        strokes: 1
      },
      {
        component: "口",
        name: "Tâm bia vuông (口)",
        hanviet: "KHẨU",
        pinyin: "kǒu",
        color: "#1e3a8a",
        meaning: "Khung bia ngắm bắn",
        role: "Thành phần thân chữ (3 nét)",
        strokes: 3
      }
    ]
  },
  "虽": {
    char: "虽",
    pinyin: "suī",
    hanviet: "TUY",
    meaning: "Tuy, dẫu rằng, tuy nhiên",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 9,
    mainRadical: "虫",
    radicalName: "Bộ Trùng (Sâu bọ, côn trùng)",
    radicalMeaning: "Chỉ loài côn trùng, sâu bọ nhỏ bé",
    radicalPosition: "Nằm ở phần dưới",
    breakdownTip: "Chữ 虽 cấu tạo trên Khẩu (口 - cái miệng), dưới Trùng (虫 - sâu bọ).",
    story: "Tuy (虽) chỉ là con sâu bọ (虫) nhỏ bé nhưng vẫn có miệng (口) cất tiếng kêu kiên cường.",
    mnemonic: "Miệng (口) của loài sâu bọ (虫) tuy nhỏ nhưng bền bỉ (TUY - 虽).",
    components: [
      {
        component: "虫",
        name: "Bộ Trùng (虫)",
        hanviet: "TRÙNG",
        pinyin: "chóng",
        color: "#dc2626",
        meaning: "Con sâu, loài côn trùng",
        role: "Bộ thủ chính (6 nét)",
        strokes: 6
      },
      {
        component: "口",
        name: "Bộ Khẩu (口)",
        hanviet: "KHẨU",
        pinyin: "kǒu",
        color: "#1e3a8a",
        meaning: "Cái miệng ở phía trên",
        role: "Thành phần biểu ý phía trên (3 nét)",
        strokes: 3
      }
    ]
  },
  "然": {
    char: "然",
    pinyin: "rán",
    hanviet: "NHIÊN",
    meaning: "Như thế, tự nhiên, nhiên liệu, đúng vậy",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 12,
    mainRadical: "灬",
    radicalName: "Bộ Hỏa (4 chấm lửa)",
    radicalMeaning: "Ngọn lửa bốc cháy bên dưới",
    radicalPosition: "Nằm ở đáy chữ",
    breakdownTip: "Chữ 然 gồm chữ Nhiên cổ (月 thịt + 犬 chó) ở trên và 4 chấm Hỏa (灬 ngọn lửa) ở dưới.",
    story: "Thịt (月) thú săn (犬) được nướng vàng trên ngọn lửa (灬) tự nhiên (然).",
    mnemonic: "Thịt (月) chó săn (犬) nướng trên 4 chấm lửa (灬) là lẽ đương nhiên (然).",
    components: [
      {
        component: "灬",
        name: "Bộ Hỏa (灬 - 4 chấm lửa)",
        hanviet: "HỎA",
        pinyin: "huǒ",
        color: "#dc2626",
        meaning: "Ngọn lửa nung nấu bốc lên bên dưới",
        role: "Bộ thủ chính (4 nét)",
        strokes: 4
      },
      {
        component: "月",
        name: "Bộ Nhục/Nguyệt (月 - miếng thịt)",
        hanviet: "NHỤC",
        pinyin: "ròu",
        color: "#1e3a8a",
        meaning: "Miếng thịt tươi ngon",
        role: "Thành phần trên bên trái (4 nét)",
        strokes: 4
      },
      {
        component: "犬",
        name: "Bộ Khuyển (犬 - con chó săn)",
        hanviet: "KHUYỂN",
        pinyin: "quǎn",
        color: "#1e3a8a",
        meaning: "Con vật săn bắt",
        role: "Thành phần trên bên phải (4 nét)",
        strokes: 4
      }
    ]
  },
  "而": {
    char: "而",
    pinyin: "ér",
    hanviet: "NHI",
    meaning: "Mà, và, hơn nữa (liên từ nối)",
    structure: "Kết cấu Đơn thể tượng hình (独体字)",
    strokeCount: 6,
    mainRadical: "而",
    radicalName: "Bộ Nhi (Râu mép, râu cằm)",
    radicalMeaning: "Hình tượng chòm râu mềm mại dưới cằm",
    radicalPosition: "Toàn bộ chữ là một bộ thủ",
    breakdownTip: "Chữ 而 là chữ tượng hình vẽ chòm râu cằm buông xuống, làm bộ thủ độc lập.",
    story: "Chòm râu (而) vuốt dài uyển chuyển kết nối các ý niệm 'mà, và, hơn nữa' trong câu.",
    mnemonic: "Khung mặt có những sợi râu dài (而) buông xuống tự nhiên.",
    components: [
      {
        component: "而",
        name: "Bộ Nhi (而)",
        hanviet: "NHI",
        pinyin: "ér",
        color: "#dc2626",
        meaning: "Hình tượng râu dưới cằm người",
        role: "Bộ thủ độc lập (6 nét)",
        strokes: 6
      }
    ]
  },
  "且": {
    char: "且",
    pinyin: "qiě",
    hanviet: "THẢ",
    meaning: "Hơn nữa, vả lại, lại còn, tạm thời",
    structure: "Kết cấu Đơn thể (独体字)",
    strokeCount: 5,
    mainRadical: "一",
    radicalName: "Bộ Nhất (Nét đế ngang bên dưới)",
    radicalMeaning: "Mặt đất, nền tảng đặt bài vị thờ cúng",
    radicalPosition: "Nét ngang đáy chịu lực",
    breakdownTip: "Chữ 且 tượng hình bàn thờ hoặc cột mốc xếp tầng, nét đáy là bộ Nhất (一).",
    story: "Chiếc kệ thờ xếp từng tầng chất thêm lễ vật: vừa tôn nghiêm lại còn (且) rạng rỡ.",
    mnemonic: "Khung chữ Mục (目) đứng vững trên đế ngang (一) thể hiện sự vững vàng, tăng thêm (且).",
    components: [
      {
        component: "一",
        name: "Bộ Nhất (一 - nét đế dưới)",
        hanviet: "NHẤT",
        pinyin: "yī",
        color: "#dc2626",
        meaning: "Mặt phẳng đế nâng đỡ bên dưới",
        role: "Bộ thủ chính chỉ định vị trí (1 nét)",
        strokes: 1
      },
      {
        component: "月",
        name: "Khung thân xếp tầng (且)",
        hanviet: "THẢ",
        pinyin: "qiě",
        color: "#1e3a8a",
        meaning: "Khung bài vị xếp chồng nối tiếp",
        role: "Thành phần thân chính (4 nét)",
        strokes: 4
      }
    ]
  },
  "但": {
    char: "但",
    pinyin: "dàn",
    hanviet: "ĐÃN",
    meaning: "Nhưng, nhưng mà, chỉ",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 7,
    mainRadical: "亻",
    radicalName: "Bộ Nhân đứng (Con người)",
    radicalMeaning: "Chỉ người, hành động và tâm tư con người",
    radicalPosition: "Nằm bên trái",
    breakdownTip: "Chữ 但 ghép từ bộ Nhân đứng (亻) bên trái và chữ Đán (旦 - sớm mai) bên phải.",
    story: "Con người (亻) thức dậy đón bình minh sớm mai (旦), nhưng (但) việc đời còn nhiều lo toan.",
    mnemonic: "Người (亻) hướng về ánh bình minh (旦) thốt lên lời 'nhưng mà' (但).",
    components: [
      {
        component: "亻",
        name: "Bộ Nhân đứng (亻)",
        hanviet: "NHÂN",
        pinyin: "rén",
        color: "#dc2626",
        meaning: "Con người, nhân cách",
        role: "Bộ thủ chính biểu ý (2 nét)",
        strokes: 2
      },
      {
        component: "旦",
        name: "Chữ Đán (旦 - sớm mai)",
        hanviet: "ĐÁN",
        pinyin: "dàn",
        color: "#1e3a8a",
        meaning: "Mặt trời (日) mọc trên đường chân trời (一)",
        role: "Thành phần biểu âm và ý (5 nét)",
        strokes: 5
      }
    ]
  },
  "因": {
    char: "因",
    pinyin: "yīn",
    hanviet: "NHÂN",
    meaning: "Bởi vì, nguyên nhân, căn cứ vào",
    structure: "Kết cấu Toàn bao bọc (全包围结构)",
    strokeCount: 6,
    mainRadical: "囗",
    radicalName: "Bộ Vi (Khung vây quanh)",
    radicalMeaning: "Bức tường thành bao bọc xung quanh",
    radicalPosition: "Bao bọc bên ngoài",
    breakdownTip: "Chữ 因 có bộ Vi (囗 - bờ cõi) bọc bên ngoài chữ Đại (大 - người dang tay) bên trong.",
    story: "Con người (大) nằm gọn trong căn phòng chiếu chăn (囗), an ổn tìm hiểu nguyên nhân (因) sự việc.",
    mnemonic: "Người (大) ở trong khuôn phép (囗) là gốc rễ của nguyên nhân (因).",
    components: [
      {
        component: "囗",
        name: "Bộ Vi (囗 - khung thành bao)",
        hanviet: "VI",
        pinyin: "wéi",
        color: "#dc2626",
        meaning: "Bức tường bao quanh",
        role: "Bộ thủ chính (3 nét)",
        strokes: 3
      },
      {
        component: "大",
        name: "Chữ Đại (大 - to lớn, người)",
        hanviet: "ĐẠI",
        pinyin: "dà",
        color: "#1e3a8a",
        meaning: "Hình người to lớn dang rộng tay",
        role: "Thành phần cốt lõi bên trong (3 nét)",
        strokes: 3
      }
    ]
  },
  "为": {
    char: "为",
    pinyin: "wèi",
    hanviet: "VI / VỊ",
    meaning: "Bởi vì, làm, trở thành",
    structure: "Kết cấu Đơn thể (独体字)",
    strokeCount: 4,
    mainRadical: "丶",
    radicalName: "Bộ Chủ (Dấu chấm trên cùng)",
    radicalMeaning: "Điểm xuất phát, tia sáng khởi đầu",
    radicalPosition: "Chấm trên đỉnh chữ",
    breakdownTip: "Chữ 为 giản thể bắt đầu bằng nét chấm (丶) và các nét uốn tạo lực.",
    story: "Bàn tay thoăn thoắt làm việc (为), bắt đầu từ một giọt mồ hôi chấm nhỏ (丶).",
    mnemonic: "Dấu chấm khởi đầu (丶) thôi thúc hành động vì (为) mục tiêu lớn.",
    components: [
      {
        component: "丶",
        name: "Bộ Chủ (丶 - nét chấm)",
        hanviet: "CHỦ",
        pinyin: "zhǔ",
        color: "#dc2626",
        meaning: "Tia sáng, nét chấm chỉ dẫn",
        role: "Bộ thủ chính (1 nét)",
        strokes: 1
      },
      {
        component: "力",
        name: "Khung nét uốn cong (为)",
        hanviet: "VI",
        pinyin: "wéi",
        color: "#1e3a8a",
        meaning: "Đường nét mô phỏng bàn tay làm việc",
        role: "Thành phần thân chính (3 nét)",
        strokes: 3
      }
    ]
  },
  "我": {
    char: "我",
    pinyin: "wǒ",
    hanviet: "NGÃ",
    meaning: "Tôi, bản thân tôi",
    structure: "Kết cấu Đơn thể (独体字)",
    strokeCount: 7,
    mainRadical: "戈",
    radicalName: "Bộ Qua (Binh khí, ngọn giáo)",
    radicalMeaning: "Vũ khí bảo vệ chủ quyền cái tôi",
    radicalPosition: "Nằm ở phần bên phải",
    breakdownTip: "Chữ 我 gồm tay cầm binh khí (戈) khẳng định và bảo vệ bản thân (NGÃ).",
    story: "Người chiến binh tay cầm ngọn kích (戈) dõng dạc xưng 'Tôi' (NGÃ - 我).",
    mnemonic: "Tay cầm binh khí (戈) tự vệ khẳng định cái tôi (我).",
    components: [
      {
        component: "戈",
        name: "Bộ Qua (戈 - ngọn kích)",
        hanviet: "QUA",
        pinyin: "gē",
        color: "#dc2626",
        meaning: "Binh khí bảo vệ cái tôi",
        role: "Bộ thủ chính (4 nét)",
        strokes: 4
      },
      {
        component: "丿",
        name: "Tay cầm phía bên trái",
        hanviet: "PHIỆT",
        pinyin: "piě",
        color: "#1e3a8a",
        meaning: "Tư thế nâng kích đứng thẳng",
        role: "Thành phần thân chữ (3 nét)",
        strokes: 3
      }
    ]
  },
  "们": {
    char: "们",
    pinyin: "men",
    hanviet: "MÔN",
    meaning: "Chúng, các (hậu tố chỉ số nhiều)",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 5,
    mainRadical: "亻",
    radicalName: "Bộ Nhân đứng (Con người)",
    radicalMeaning: "Chỉ người và tập thể con người",
    radicalPosition: "Nằm bên trái",
    breakdownTip: "Chữ 们 gồm bộ Nhân đứng (亻) bên trái và chữ Môn (门 - cửa) bên phải.",
    story: "Nhiều người (亻) cùng bước qua cánh cửa (门) tạo thành tập thể 'chúng tôi, các bạn' (们).",
    mnemonic: "Người (亻) trước cửa (门) thành số đông (们).",
    components: [
      {
        component: "亻",
        name: "Bộ Nhân đứng (亻)",
        hanviet: "NHÂN",
        pinyin: "rén",
        color: "#dc2626",
        meaning: "Con người",
        role: "Bộ thủ chính biểu ý (2 nét)",
        strokes: 2
      },
      {
        component: "门",
        name: "Chữ Môn (门 - cánh cửa)",
        hanviet: "MÔN",
        pinyin: "mén",
        color: "#1e3a8a",
        meaning: "Cánh cửa lớn đón mọi người",
        role: "Thành phần biểu âm Môn (3 nét)",
        strokes: 3
      }
    ]
  },
  "的": {
    char: "的",
    pinyin: "de",
    hanviet: "ĐÍCH",
    meaning: "Của (trợ từ sở hữu), đích xác",
    structure: "Kết cấu Trái - Phải (左右结构)",
    strokeCount: 8,
    mainRadical: "白",
    radicalName: "Bộ Bạch (Màu trắng, sáng tỏ)",
    radicalMeaning: "Màu trắng sáng tỏ của tâm bia",
    radicalPosition: "Nằm bên trái",
    breakdownTip: "Chữ 的 gồm bộ Bạch (白 - màu trắng) bên trái và chiếc thìa/muỗng (勺 - thược) bên phải.",
    story: "Tia sáng trắng (白) nhắm trúng chiếc thìa (勺) ngay hồng tâm bia đích xác (的).",
    mnemonic: "Tâm bia trắng (白) có chiếc thìa (勺) là đích nhắm của (的) mọi mũi tên.",
    components: [
      {
        component: "白",
        name: "Bộ Bạch (白 - màu trắng)",
        hanviet: "BẠCH",
        pinyin: "bái",
        color: "#dc2626",
        meaning: "Màu trắng tinh khiết, sáng tỏ",
        role: "Bộ thủ chính (5 nét)",
        strokes: 5
      },
      {
        component: "勺",
        name: "Chữ Thược (勺 - chiếc thìa)",
        hanviet: "THƯỢC",
        pinyin: "sháo",
        color: "#1e3a8a",
        meaning: "Chiếc thìa, muỗng múc nước",
        role: "Thành phần bên phải (3 nét)",
        strokes: 3
      }
    ]
  },
  "在": {
    char: "在",
    pinyin: "zài",
    hanviet: "TẠI",
    meaning: "Ở, tại, đang (ở nơi chốn / đang làm)",
    structure: "Kết cấu Bán bao bọc (半包围结构)",
    strokeCount: 6,
    mainRadical: "土",
    radicalName: "Bộ Thổ (Đất đai, mặt đất)",
    radicalMeaning: "Nền đất, cội nguồn nơi chốn",
    radicalPosition: "Nằm ở phần bên trong / dưới",
    breakdownTip: "Chữ 在 gồm khung Tồn bên ngoài bao bọc bộ Thổ (土 - đất) bên trong.",
    story: "Bàn tay cắm cây mốc vững chãi trên mảnh đất (土) khẳng định sự hiện diện đang ở tại (在).",
    mnemonic: "Đứng vững trên mảnh đất (土) là đang hiện diện tại (在) đây.",
    components: [
      {
        component: "土",
        name: "Bộ Thổ (土 - mảnh đất)",
        hanviet: "THỔ",
        pinyin: "tǔ",
        color: "#dc2626",
        meaning: "Mặt đất, nền tảng sinh sống",
        role: "Bộ thủ chính chỉ nơi chốn (3 nét)",
        strokes: 3
      },
      {
        component: "𠂇",
        name: "Khung vươn cắm mốc",
        hanviet: "TẢ",
        pinyin: "zuǒ",
        color: "#1e3a8a",
        meaning: "Bàn tay định vị vị trí",
        role: "Thành phần bao bọc bên ngoài (3 nét)",
        strokes: 3
      }
    ]
  },
  "有": {
    char: "有",
    pinyin: "yǒu",
    hanviet: "HỮU",
    meaning: "Có, sở hữu, tồn tại",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 6,
    mainRadical: "月",
    radicalName: "Bộ Nguyệt / Nhục (Miếng thịt)",
    radicalMeaning: "Của cải, đồ ăn tích lũy",
    radicalPosition: "Nằm ở phần dưới",
    breakdownTip: "Chữ 有 gồm bàn tay (𠂇) phía trên nắm lấy miếng thịt tươi (月/肉) phía dưới.",
    story: "Bàn tay cầm chắc miếng thịt (月/肉) biểu thị có thức ăn, có của cải dư dả (有).",
    mnemonic: "Tay cầm miếng thịt (月) là có (HỮU - 有) tất cả.",
    components: [
      {
        component: "月",
        name: "Bộ Nguyệt / Nhục (月 - miếng thịt)",
        hanviet: "NHỤC",
        pinyin: "ròu",
        color: "#dc2626",
        meaning: "Miếng thịt, của cải thức ăn",
        role: "Bộ thủ chính biểu ý (4 nét)",
        strokes: 4
      },
      {
        component: "𠂇",
        name: "Bộ Hựu biến thể (bàn tay)",
        hanviet: "HỰU",
        pinyin: "yòu",
        color: "#1e3a8a",
        meaning: "Bàn tay nắm bắt",
        role: "Thành phần cầm nắm phía trên (2 nét)",
        strokes: 2
      }
    ]
  },
  "不": {
    char: "不",
    pinyin: "bù",
    hanviet: "BẤT",
    meaning: "Không, chẳng (phủ định)",
    structure: "Kết cấu Đơn thể (独体字)",
    strokeCount: 4,
    mainRadical: "一",
    radicalName: "Bộ Nhất (Nét ngang trên cùng)",
    radicalMeaning: "Mặt trời hoặc ranh giới ngăn cản",
    radicalPosition: "Nằm trên đỉnh chữ",
    breakdownTip: "Chữ 不 tượng hình con chim non muốn bay lên nhưng bị ranh giới (一) chặn lại.",
    story: "Chim sải cánh bay lên gặp vòm chắn (一) không bay tiếp được, sinh ra nghĩa phủ định 'Không' (BẤT - 不).",
    mnemonic: "Muốn bay nhưng vướng nét ngang (一) thì không (不) được.",
    components: [
      {
        component: "一",
        name: "Bộ Nhất (一 - ranh giới ngang)",
        hanviet: "NHẤT",
        pinyin: "yī",
        color: "#dc2626",
        meaning: "Ranh giới chặn bên trên",
        role: "Bộ thủ chính (1 nét)",
        strokes: 1
      },
      {
        component: "小",
        name: "Hình chim sải cánh",
        hanviet: "TIỂU",
        pinyin: "xiǎo",
        color: "#1e3a8a",
        meaning: "Đôi cánh rũ xuống",
        role: "Thành phần thân chữ (3 nét)",
        strokes: 3
      }
    ]
  },
  "看": {
    char: "看",
    pinyin: "kàn",
    hanviet: "KHÁN",
    meaning: "Nhìn, xem, trông coi",
    structure: "Kết cấu Trên - Dưới (上下结构)",
    strokeCount: 9,
    mainRadical: "目",
    radicalName: "Bộ Mục (Đôi mắt)",
    radicalMeaning: "Cơ quan thị giác, nhìn ngắm",
    radicalPosition: "Nằm ở phần dưới",
    breakdownTip: "Chữ 看 gồm bàn tay (手/龵) ở trên che trán, bên dưới là đôi mắt (目).",
    story: "Đưa bàn tay (手) lên che ánh nắng chói lòa phía trên đôi mắt (目) để phóng tầm mắt nhìn xa (看).",
    mnemonic: "Tay (手) che trên Mắt (目) để nhìn ngắm (KHÁN - 看).",
    components: [
      {
        component: "目",
        name: "Bộ Mục (目 - đôi mắt)",
        hanviet: "MỤC",
        pinyin: "mù",
        color: "#dc2626",
        meaning: "Đôi mắt nhìn ngắm",
        role: "Bộ thủ chính (5 nét)",
        strokes: 5
      },
      {
        component: "手",
        name: "Bộ Thủ biến thể (龵 - bàn tay)",
        hanviet: "THỦ",
        pinyin: "shǒu",
        color: "#1e3a8a",
        meaning: "Bàn tay đưa lên che nắng",
        role: "Thành phần phía trên (4 nét)",
        strokes: 4
      }
    ]
  }
};

// Common radical affixes lookup for instant sub-millisecond dynamic parsing
const DYNAMIC_RADICAL_RULES: { radical: string; position: string; structure: string }[] = [
  { radical: "氵", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "亻", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "讠", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "扌", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "忄", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "饣", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "纟", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "钅", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "犭", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "禾", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "弓", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "彳", position: "Bên trái", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "阝", position: "Bên trái/phải", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "刂", position: "Bên phải", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "攵", position: "Bên phải", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "欠", position: "Bên phải", structure: "Kết cấu Trái - Phải (左右结构)" },
  { radical: "艹", position: "Phía trên", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "宀", position: "Phía trên", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "⺮", position: "Phía trên", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "竹", position: "Phía trên", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "雨", position: "Phía trên", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "穴", position: "Phía trên", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "灬", position: "Phía dưới", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "心", position: "Phía dưới", structure: "Kết cấu Trên - Dưới (上下结构)" },
  { radical: "囗", position: "Bao quanh bốn phía", structure: "Kết cấu Toàn bao bọc (全包围结构)" },
  { radical: "门", position: "Bao bọc bên ngoài", structure: "Kết cấu Bán bao bọc (半包围结构)" },
  { radical: "辶", position: "Bao bọc góc dưới", structure: "Kết cấu Bán bao bọc (半包围结构)" },
  { radical: "广", position: "Góc trên bên trái", structure: "Kết cấu Bán bao bọc (半包围结构)" },
  { radical: "厂", position: "Sườn núi góc trên", structure: "Kết cấu Bán bao bọc (半包围结构)" },
  { radical: "尸", position: "Mái hiên góc trên", structure: "Kết cấu Bán bao bọc (半包围结构)" }
];

/**
 * Phân tích tức thì một ký tự chữ Hán (< 1ms, 0 delay)
 */
export function decomposeCharacterInstant(char: string): CharacterDecomposition {
  // 1. Kiểm tra cơ sở dữ liệu đã tính toán sẵn
  if (PRECOMPUTED_CHARACTERS[char]) {
    return PRECOMPUTED_CHARACTERS[char];
  }

  // 2. Kiểm tra nếu chính ký tự này là 1 trong 214 Bộ thủ Khang Hy (chữ độc thể tượng hình)
  if (KANGXI_RADICALS[char]) {
    const rad = KANGXI_RADICALS[char];
    return {
      char,
      pinyin: rad.pinyin,
      hanviet: rad.hanviet,
      meaning: rad.meaning,
      structure: "Kết cấu Đơn thể (独体字)",
      strokeCount: rad.strokes,
      mainRadical: char,
      radicalName: rad.name,
      radicalMeaning: rad.meaning,
      radicalPosition: "Bộ thủ độc lập toàn chữ",
      breakdownTip: `Chữ ${char} là chữ Hán đơn thể tượng hình kiêm ${rad.name}.`,
      story: `Chữ tượng hình miêu tả hình ảnh trực quan: ${rad.meaning}.`,
      mnemonic: `Chữ ${char} (${rad.hanviet}): Biểu tượng gốc cho ${rad.meaning}.`,
      components: [
        {
          component: char,
          name: rad.name,
          hanviet: rad.hanviet,
          pinyin: rad.pinyin,
          color: "#dc2626", // Đỏ nổi bật cho bộ thủ chính
          meaning: rad.meaning,
          role: "Bộ thủ chính độc lập",
          strokes: rad.strokes
        }
      ]
    };
  }

  // 3. Phân tích động dựa trên quy tắc cấu tạo bộ thủ
  let matchedRule = DYNAMIC_RADICAL_RULES.find(r => char.includes(r.radical));
  if (!matchedRule) {
    // Thử tìm trong các bộ thủ 214
    for (const radChar of Object.keys(KANGXI_RADICALS)) {
      if (radChar.length === 1 && char !== radChar && char.includes(radChar)) {
        matchedRule = {
          radical: radChar,
          position: "Thành phần chính",
          structure: "Kết cấu Hợp thể (合体字)"
        };
        break;
      }
    }
  }

  const mainRad = matchedRule?.radical || char[0] || "一";
  const radInfo = KANGXI_RADICALS[mainRad] || {
    name: `Bộ thủ ${mainRad}`,
    hanviet: mainRad,
    pinyin: "",
    meaning: "Ý nghĩa cội nguồn của chữ",
    strokes: 3
  };

  return {
    char,
    pinyin: "",
    hanviet: radInfo.hanviet,
    meaning: `Chữ Hán: ${char}`,
    structure: matchedRule?.structure || "Kết cấu Hợp thể (合体字)",
    strokeCount: radInfo.strokes + 4,
    mainRadical: mainRad,
    radicalName: radInfo.name,
    radicalMeaning: radInfo.meaning,
    radicalPosition: matchedRule?.position || "Bộ phận biểu ý chính",
    breakdownTip: `Chữ ${char} có bộ thủ chính là ${radInfo.name} (${mainRad}) nằm ở ${matchedRule?.position || "thân chữ"}.`,
    story: `Chữ ${char} biểu đạt ý nghĩa gắn liền với ${radInfo.meaning}.`,
    mnemonic: `Nhận diện ${radInfo.name} (${mainRad}) để nhớ nhanh chữ ${char}.`,
    components: [
      {
        component: mainRad,
        name: radInfo.name,
        hanviet: radInfo.hanviet,
        pinyin: radInfo.pinyin,
        color: "#dc2626", // ĐỎ cho bộ thủ chính
        meaning: radInfo.meaning,
        role: "Bộ thủ chính biểu ý",
        strokes: radInfo.strokes
      },
      {
        component: "...",
        name: "Phần còn lại",
        color: "#1e3a8a", // XANH NAVY cho các thành phần phối hợp
        meaning: "Thành phần biểu âm hoặc bổ trợ ý nghĩa",
        role: "Thành phần kết hợp"
      }
    ]
  };
}

/**
 * Phân tích tức thì toàn bộ từ vựng (< 1ms, không chờ mạng)
 */
export function decomposeWordInstantly(word: string): WordDecompositionResult {
  const cleanWord = word.trim();
  const chineseChars = Array.from(cleanWord).filter(c => /[\u4e00-\u9fa5]/.test(c));
  
  if (chineseChars.length === 0) {
    return {
      word: cleanWord,
      pinyin: "",
      hanviet: "",
      translation: cleanWord,
      characters: []
    };
  }

  const characters = chineseChars.map(c => decomposeCharacterInstant(c));
  const pinyin = characters.map(c => c.pinyin).filter(Boolean).join(" ");
  const hanviet = characters.map(c => c.hanviet).filter(Boolean).join(" ");
  const translation = characters.map(c => c.meaning).filter(Boolean).join("; ") || cleanWord;

  return {
    word: cleanWord,
    pinyin,
    hanviet,
    translation,
    characters
  };
}

