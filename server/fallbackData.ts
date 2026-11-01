import { Token } from "../src/types";
import { getHskLevel } from "./hskLookup";

// Presegmented cached tokens for the 5 sample lessons
export const PRESEGMENTED_LESSONS_CACHE: Record<string, Token[]> = {
  // Lesson 1: "你好！我叫李华。我是中国留学生，今年二十岁。很高兴认识你！你叫什么名字？也是学生吗？"
  "lesson-1": [
    { type: "word", text: "你好", pinyin: "nǐ hǎo", translation: "xin chào", partOfSpeech: "Thán từ", example: { chinese: "你好，很高兴见到你。", pinyin: "nǐ hǎo, hěn gāoxìng jiàndào nǐ.", vietnamese: "Xin chào, rất vui được gặp bạn." } },
    { type: "punctuation", text: "！" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi, tớ, mình", partOfSpeech: "Đại từ", example: { chinese: "我是留学生。", pinyin: "wǒ shì liúxuéshēng.", vietnamese: "Tôi là du học sinh." } },
    { type: "word", text: "叫", pinyin: "jiào", translation: "gọi là, tên là", partOfSpeech: "Động từ", example: { chinese: "他叫大卫。", pinyin: "tā jiào dàwèi.", vietnamese: "Anh ấy tên là David." } },
    { type: "word", text: "李华", pinyin: "lǐ huá", translation: "Lý Hoa (tên riêng)", partOfSpeech: "Danh từ", example: { chinese: "李华在中国大学学习。", pinyin: "lǐ huá zài zhōngguó dàxué xuéxí.", vietnamese: "Lý Hoa học tại trường đại học Trung Quốc." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi", partOfSpeech: "Đại từ", example: { chinese: "我也喜欢汉字。", pinyin: "wǒ yě xǐhuan hànzì.", vietnamese: "Tôi cũng thích chữ Hán." } },
    { type: "word", text: "是", pinyin: "shì", translation: "là", partOfSpeech: "Động từ", example: { chinese: "这是一本书。", pinyin: "zhè shì yī běn shū.", vietnamese: "Đây là một cuốn sách." } },
    { type: "word", text: "中国", pinyin: "zhōngguó", translation: "Trung Quốc", partOfSpeech: "Danh từ", example: { chinese: "我去过中国上海。", pinyin: "wǒ qù guo zhōngguó shànghǎi.", vietnamese: "Tôi đã từng đi Thượng Hải, Trung Quốc." } },
    { type: "word", text: "留学生", pinyin: "liúxuéshēng", translation: "du học sinh", partOfSpeech: "Danh từ", example: { chinese: "他在北京大学当留学生。", pinyin: "tā zài běijīng dàxué dāng liúxuéshēng.", vietnamese: "Anh ấy đang làm du học sinh học tại Đại học Bắc Kinh." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "今年", pinyin: "jīnnián", translation: "năm nay", partOfSpeech: "Danh từ", example: { chinese: "今年是二零二六年。", pinyin: "jīnnián shì èr líng èr liù nián.", vietnamese: "Năm nay là năm 2026." } },
    { type: "word", text: "二十", pinyin: "èrshí", translation: "hai mươi", partOfSpeech: "Số từ", example: { chinese: "这个苹果二十块钱一斤。", pinyin: "zhège píngguǒ èrshí kuài qián yī jīn.", vietnamese: "Táo này có giá hai mươi tệ một cân tàu." } },
    { type: "word", text: "岁", pinyin: "suì", translation: "tuổi", partOfSpeech: "Lượng từ", example: { chinese: "我弟弟今年十岁了。", pinyin: "wǒ dìdi jīnnián shí suì le.", vietnamese: "Em trai tôi năm nay 10 tuổi rồi." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "很", pinyin: "hěn", translation: "rất", partOfSpeech: "Phó từ", example: { chinese: "今天天气很好。", pinyin: "jīntiān tiānqì hěn hǎo.", vietnamese: "Hôm nay thời tiết rất đẹp." } },
    { type: "word", text: "高兴", pinyin: "gāoxìng", translation: "vui mừng, phấn khởi", partOfSpeech: "Tính từ", example: { chinese: "考得好大家都很高兴。", pinyin: "kǎo de hǎo dàjiā dōu hěn gāoxìng.", vietnamese: "Thi tốt mọi người đều rất vui vẻ." } },
    { type: "word", text: "认识", pinyin: "rènshi", translation: "quen biết, nhận biết", partOfSpeech: "Động từ", example: { chinese: "我不认识那个人。", pinyin: "wǒ bù rènshi nàge rén.", vietnamese: "Tôi không quen biết người kia." } },
    { type: "word", text: "你", pinyin: "nǐ", translation: "bạn, cậu, anh, chị", partOfSpeech: "Đại từ", example: { chinese: "谢谢你的帮助。", pinyin: "xièxie nǐ de bāngzhù.", vietnamese: "Cảm ơn sự giúp đỡ của bạn." } },
    { type: "punctuation", text: "！" },
    { type: "word", text: "你", pinyin: "nǐ", translation: "bạn, cậu", partOfSpeech: "Đại từ", example: { chinese: "你需要买什么？", pinyin: "nǐ xūyào mǎi shénme？", vietnamese: "Bạn cần mua gì?" } },
    { type: "word", text: "叫", pinyin: "jiào", translation: "gọi là, tên là", partOfSpeech: "Động từ", example: { chinese: "你叫什么名字？", pinyin: "nǐ jiào shénme míngzì?", vietnamese: "Tên bạn là gì?" } },
    { type: "word", text: "什么", pinyin: "shénme", translation: "cái gì, gì", partOfSpeech: "Đại từ", example: { chinese: "这是什么饮料？", pinyin: "zhè shì shénme yǐnliào?", vietnamese: "Đây là thức uống gì thế?" } },
    { type: "word", text: "名字", pinyin: "míngzì", translation: "tên gọi", partOfSpeech: "Danh từ", example: { chinese: "请在这儿写你的名字。", pinyin: "qǐng zài zhè'r xiě nǐ de míngzì.", vietnamese: "Xin vui lòng viết tên bạn ở chỗ này." } },
    { type: "punctuation", text: "？" },
    { type: "word", text: "也", pinyin: "yě", translation: "cũng", partOfSpeech: "Phó từ", example: { chinese: "我也喜欢游泳。", pinyin: "wǒ yě xǐhuan yóuyǒng.", vietnamese: "Tôi cũng thích bơi lội." } },
    { type: "word", text: "是", pinyin: "shì", translation: "là", partOfSpeech: "Động từ", example: { chinese: "他也是越南人吗？", pinyin: "tā yě shì yuènánrén ma?", vietnamese: "Cậu ấy cũng là người Việt Nam có đúng không?" } },
    { type: "word", text: "学生", pinyin: "xuéshēng", translation: "học sinh, sinh viên", partOfSpeech: "Danh từ", example: { chinese: "我们都是大学生。", pinyin: "wǒmen dōu shì dàxuéshēng.", vietnamese: "Chúng tôi đều là những sinh viên đại học." } },
    { type: "word", text: "吗", pinyin: "ma", translation: "không? (trợ từ nghi vấn cuối câu hỏi)", partOfSpeech: "Trợ từ", example: { chinese: "你想吃苹果吗？", pinyin: "nǐ xiǎng chī píngguǒ ma?", vietnamese: "Bạn có muốn ăn táo không?" } },
    { type: "punctuation", text: "？" }
  ],

  // Lesson 2: "阿姨，请问这个新鲜的苹果一斤多少钱？八块钱。太贵了，可以便宜一点儿吗？那给你七块钱一斤。好的，我买三斤，可以用微信支付吗？当然可以。"
  "lesson-2": [
    { type: "word", text: "阿姨", pinyin: "āyí", translation: "dì, cô, cô phục vụ dọn dẹp", partOfSpeech: "Danh từ", example: { chinese: "阿姨，请问洗手间在哪里？", pinyin: "āyí, qǐngwèn xǐshǒujiān zài nǎlǐ?", vietnamese: "Cô ơi, xin hỏi nhà vệ sinh ở đâu ạ?" } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "请问", pinyin: "qǐngwèn", translation: "cho hỏi, xin hỏi", partOfSpeech: "Động từ", example: { chinese: "请问去地铁站怎么走？", pinyin: "qǐngwèn qù dìtiězhàn zěnme zǒu?", vietnamese: "Xin hỏi đường đi đến ga tàu điện ngầm đi thế nào?" } },
    { type: "word", text: "这个", pinyin: "zhège", translation: "cái này", partOfSpeech: "Đại từ", example: { chinese: "这个很好吃。", pinyin: "zhège hěn hǎochī.", vietnamese: "Cái này ăn rất ngon." } },
    { type: "word", text: "新鲜", pinyin: "xīnxian", translation: "tươi, tươi ngon", partOfSpeech: "Tính từ", example: { chinese: "超市里的水果非常新鲜。", pinyin: "chāoshì lǐ de shuǐguǒ fēicháng xīnxian.", vietnamese: "Trái cây ở trong siêu thị vô cùng tươi ngon." } },
    { type: "word", text: "的", pinyin: "de", translation: "của / trợ từ định ngữ kết nối", partOfSpeech: "Trợ từ", example: { chinese: "这是我的手机。", pinyin: "zhè shì wǒ de shǒujī.", vietnamese: "Đây là chiếc điện thoại của tôi." } },
    { type: "word", text: "苹果", pinyin: "píngguǒ", translation: "quả táo, quả bom", partOfSpeech: "Danh từ", example: { chinese: "我每天都吃一个苹果。", pinyin: "wǒ měitiān dōu chī yīgè píngguǒ.", vietnamese: "Mỗi ngày tôi đều ăn một trái táo." } },
    { type: "word", text: "一斤", pinyin: "yī jīn", translation: "nửa kg (ở TQ 1 cân = 500g)", partOfSpeech: "Số lượng từ", example: { chinese: "帮我买一斤香蕉。", pinyin: "bāng wǒ mǎi yī jīn xiāngjiāo.", vietnamese: "Mua giúp tôi nửa cân chuối nhé." } },
    { type: "word", text: "多少", pinyin: "duōshao", translation: "bao nhiêu", partOfSpeech: "Đại từ", example: { chinese: "你们班有多少人？", pinyin: "nǐmen bān yǒu duōshǎo rén?", vietnamese: "Lớp của bạn có bao nhiêu người?" } },
    { type: "word", text: "钱", pinyin: "qián", translation: "tiền, ngân lượng", partOfSpeech: "Danh từ", example: { chinese: "一共多少钱？", pinyin: "yīgòng duōshao qián?", vietnamese: "Tổng cộng hết bao nhiêu tiền?" } },
    { type: "punctuation", text: "？" },
    { type: "word", text: "八", pinyin: "bā", translation: "Tám, số 8", partOfSpeech: "Số từ", example: { chinese: "我八点的飞机。", pinyin: "wǒ bā diǎn de fēijī.", vietnamese: "Tôi có chuyến bay chuyến 8 giờ." } },
    { type: "word", text: "块", pinyin: "kuài", translation: "tệ (đơn vị tiền tệ khẩu ngữ), cục, miếng", partOfSpeech: "Lượng từ", example: { chinese: "给你三块大西瓜。", pinyin: "gěi nǐ sān kuài dà xīguā.", vietnamese: "Gửi bạn ba miếng dưa hấu to." } },
    { type: "word", text: "钱", pinyin: "qián", translation: "tiền", partOfSpeech: "Danh từ", example: { chinese: "我的钱包里有很多钱。", pinyin: "wǒ de qiánbāo lǐ yǒu hěnduō qián.", vietnamese: "Trong ví của tôi có rất nhiều tiền." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "太", pinyin: "tài", translation: "quá, cực kỳ", partOfSpeech: "Phó từ", example: { chinese: "太谢谢你了！", pinyin: "tài xièxie nǐ le!", vietnamese: "Thực sự quá cảm ơn bạn nhé!" } },
    { type: "word", text: "贵", pinyin: "guì", translation: "đắt, quý giá", partOfSpeech: "Tính từ", example: { chinese: "这家商店的水果太贵了。", pinyin: "zhè jiā shāngdiàn de shuǐguǒ tài guì le.", vietnamese: "Hoa quả ở tiệm này mắc quá." } },
    { type: "word", text: "了", pinyin: "le", translation: "rồi (trợ từ kết thúc hành động/trạng thái)", partOfSpeech: "Trợ từ", example: { chinese: "下雨了，快回家吧。", pinyin: "xiàyǔ le, kuài huíjiā ba.", vietnamese: "Mưa rồi, mau về nhà thôi nào." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "可以", pinyin: "kěyǐ", translation: "có thể, được phép", partOfSpeech: "Động từ năng nguyện", example: { chinese: "请问我可以借用一下笔吗？", pinyin: "qǐngwèn wǒ kěyǐ jièyòng yīxià bǐ ma?", vietnamese: "Cho hỏi tôi có thể mượn cây viết một chút được không?" } },
    { type: "word", text: "便宜", pinyin: "piányi", translation: "rẻ, rẻ tiền", partOfSpeech: "Tính từ", example: { chinese: "淘宝网上的衣服很便宜。", pinyin: "táobǎo wǎngshàng de yīfu hěn piányi.", vietnamese: "Quần áo ở trên trang Taobao rất rẻ." } },
    { type: "word", text: "一点儿", pinyin: "yīdiǎnr", translation: "một chút, một ít", partOfSpeech: "Lượng từ", example: { chinese: "你可以说慢一点儿吗？", pinyin: "nǐ kěyǐ shuō màn yīdiǎnr ma?", vietnamese: "Bạn có thể nói chậm một chút được không?" } },
    { type: "word", text: "吗", pinyin: "ma", translation: "không? (trợ từ nghi vấn)", partOfSpeech: "Trợ từ", example: { chinese: "你有时间吗？", pinyin: "nǐ yǒu shíjiān ma?", vietnamese: "Bạn có thời gian rảnh không?" } },
    { type: "punctuation", text: "？" },
    { type: "word", text: "那", pinyin: "nà", translation: "vậy thì, kia, thế thì", partOfSpeech: "Phó từ / Liên từ", example: { chinese: "如果不去，那就在家看书。", pinyin: "rúguǒ bù qù, nà jiù zài jiā kànshū.", vietnamese: "Nếu không đi, thế thì ở nhà đọc sách." } },
    { type: "word", text: "给你", pinyin: "gěi nǐ", translation: "gửi bạn, cho bạn", partOfSpeech: "Cụm động từ", example: { chinese: "给你，这是找你的五块钱。", pinyin: "gěi nǐ, zhè shì zhǎo nǐ de wǔ kuài qián.", vietnamese: "Gửi bạn nè, đây là 5 tệ tiền thối lại." } },
    { type: "word", text: "七", pinyin: "qī", translation: "Bảy, số bảy", partOfSpeech: "Số từ", example: { chinese: "一星期有七天。", pinyin: "yī xīngqī yǒu qī tiān.", vietnamese: "Một tuần có bảy ngày." } },
    { type: "word", text: "块", pinyin: "kuài", translation: "tệ", partOfSpeech: "Lượng từ", example: { chinese: "只剩下两块钱。", pinyin: "zhǐ shèng xià liǎng kuài qián.", vietnamese: "Chỉ còn dư lại đúng hai tệ bạc." } },
    { type: "word", text: "钱", pinyin: "qián", translation: "tiền", partOfSpeech: "Danh từ", example: { chinese: "钱买不来时间。", pinyin: "qián mǎi bù lái shíjiān.", vietnamese: "Tiền không thể mua nổi thời gian rảnh." } },
    { type: "word", text: "一斤", pinyin: "yī jīn", translation: "nửa kg (500 gam)", partOfSpeech: "Số lượng từ", example: { chinese: "西红柿多钱一斤？", pinyin: "xīhóngshì duōqián yī jīn?", vietnamese: "Cà chua bao nhiêu tiền một cân tàu?" } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "好的", pinyin: "hǎo de", translation: "được rồi, ok, vâng", partOfSpeech: "Thán từ", example: { chinese: "好的，我马上过去找你。", pinyin: "hǎo de, wǒ mǎshàng guòqu zhǎo nǐ.", vietnamese: "Dạ được, tôi sẽ qua tìm bạn liền đây." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi, mình", partOfSpeech: "Đại từ", example: { chinese: "我喜欢学中文。", pinyin: "wǒ xǐhuān xué zhōngwén.", vietnamese: "Tôi thích học tiếng Trung." } },
    { type: "word", text: "买", pinyin: "mǎi", translation: "mua", partOfSpeech: "Động từ", example: { chinese: "用手机买单太快了。", pinyin: "yòng shǒujī mǎidān tài kuài le.", vietnamese: "Sử dụng điện thoại mua hóa đơn thật nhanh quá đi." } },
    { type: "word", text: "三", pinyin: "sān", translation: "Ba, số 3", partOfSpeech: "Số từ", example: { chinese: "我家有三口人。", pinyin: "wǒ jiā yǒu sān kǒu rén.", vietnamese: "Nhà tớ có ba miệng người." } },
    { type: "word", text: "斤", pinyin: "jīn", translation: "Cân Trung Quốc (bằng 500g)", partOfSpeech: "Lượng từ", example: { chinese: "这西瓜有十斤重。", pinyin: "zhè xīguā yǒu shí jīn zhòng.", vietnamese: "Trái dưa hấu này nặng tới mười cân tàu (5kg)." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "可以用", pinyin: "kěyǐ yòng", translation: "có thể dùng", partOfSpeech: "Cụm động từ", example: { chinese: "可以用微信付款吗？", pinyin: "kěyǐ yòng wēixìn fùkuǎn ma?", vietnamese: "Có thể thanh toán bằng WeChat được không?" } },
    { type: "word", text: "微信", pinyin: "wēixìn", translation: "WeChat", partOfSpeech: "Danh từ riêng", example: { chinese: "请扫我的微信二维码。", pinyin: "qǐng sǎo wǒ de wēixìn èrwéimǎ.", vietnamese: "Xin vui lòng quét mã QR WeChat của tôi." } },
    { type: "word", text: "支付", pinyin: "zhīfù", translation: "đóng tiền, thanh toán", partOfSpeech: "Động từ", example: { chinese: "微信支付在中国非常普遍。", pinyin: "wēixìn zhīfù zài zhōngguó fēicháng pǔbiàn.", vietnamese: "Thanh toán WeChat ở Trung Quốc vô cùng phổ cập." } },
    { type: "word", text: "吗", pinyin: "ma", translation: "không?", partOfSpeech: "Trợ từ", example: { chinese: "他是你的老师吗？", pinyin: "tā shì nǐ de lǎoshī ma?", vietnamese: "Ông ấy có phải là giáo viên của bạn không?" } },
    { type: "punctuation", text: "？" },
    { type: "word", text: "当然", pinyin: "dāngrán", translation: "tất nhiên, dĩ nhiên", partOfSpeech: "Phó từ", example: { chinese: "当然，你可以和我一起去。", pinyin: "dāngrán, nǐ kěyǐ hé wǒ yīqǐ qù.", vietnamese: "Tất nhiên rồi, bạn có thể đồng hành đi cùng tôi." } },
    { type: "word", text: "可以", pinyin: "kěyǐ", translation: "được chứ, có thể", partOfSpeech: "Động từ", example: { chinese: "当然可以。", pinyin: "dāngrán kěyǐ.", vietnamese: "Dĩ nhiên được rồi." } },
    { type: "punctuation", text: "。" }
  ],

  // Lesson 3: "周末你有什么打算？我特别喜欢运动，打算和朋友去体育馆打篮球。如果下雨的话，我就在家里听中文歌、看电影。你呢？我喜欢静静地写汉字和看书。"
  "lesson-3": [
    { type: "word", text: "周末", pinyin: "zhōumò", translation: "cuối tuần", partOfSpeech: "Danh từ", example: { chinese: "周末你想去哪里玩？", pinyin: "zhōumò nǐ xiǎng qù nǎlǐ wán?", vietnamese: "Cuối tuần bạn muốn đi đâu chơi?" } },
    { type: "word", text: "你", pinyin: "nǐ", translation: "bạn", partOfSpeech: "Đại từ", example: { chinese: "你喜欢唱歌吗？", pinyin: "nǐ xǐhuān chànggē ma?", vietnamese: "Bạn có thích ca hát không?" } },
    { type: "word", text: "有什么", pinyin: "yǒu shénme", translation: "có cái gì, có điều gì", partOfSpeech: "Cụm động từ", example: { chinese: "有什么问题可以问我。", pinyin: "yǒu shénme wèntí kěyǐ wèn wǒ.", vietnamese: "Có câu hỏi gì thì cứ hỏi mình nhé." } },
    { type: "word", text: "打算", pinyin: "dǎsuàn", translation: "dự định, kế hoạch", partOfSpeech: "Động từ / Danh từ", example: { chinese: "毕业以后你有什么打算？", pinyin: "bìyè yǐhòu nǐ yǒu shénme dǎsuàn?", vietnamese: "Sau khi tốt nghiệp bạn có dự định gì?" } },
    { type: "punctuation", text: "？" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi, tớ, mình", partOfSpeech: "Đại từ", example: { chinese: "我是留学生。", pinyin: "wǒ shì liúxuéshēng.", vietnamese: "Tôi là du học sinh." } },
    { type: "word", text: "特别", pinyin: "tèbié", translation: "đặc biệt, vô cùng", partOfSpeech: "Phó từ / Tính từ", example: { chinese: "这家川菜馆的麻婆豆腐特别好吃。", pinyin: "zhè jiā chuāncàiguǎn de mápó dòufu tèbié hǎochī.", vietnamese: "Món đậu hũ ma bà của tiệm ăn Tứ Xuyên này cực kỳ ngon miệng." } },
    { type: "word", text: "喜欢", pinyin: "xǐhuan", translation: "thích, yêu thích", partOfSpeech: "Động từ", example: { chinese: "我很喜欢这首歌。", pinyin: "wǒ hěn xǐhuan zhè shǒu gē.", vietnamese: "Tôi rất thích ca khúc này." } },
    { type: "word", text: "运动", pinyin: "yùndòng", translation: "thể thao, vận động", partOfSpeech: "Danh từ / Động từ", example: { chinese: "生命在于运动。", pinyin: "shēngmìng zàiyú yùndòng.", vietnamese: "Sự sống nằm ở sự vận động." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "打算", pinyin: "dǎsuàn", translation: "dự định", partOfSpeech: "Động từ", example: { chinese: "周末我打算去旅游。", pinyin: "zhōumò wǒ dǎsuàn qù lǚyóu.", vietnamese: "Cuối tuần tôi định đi du học/du lịch." } },
    { type: "word", text: "和", pinyin: "hé", translation: "và, cùng với", partOfSpeech: "Liên từ / Giới từ", example: { chinese: "我和朋友去图书馆看书。", pinyin: "wǒ hé péngyou qù túshūguǎn kànshū.", vietnamese: "Tôi cùng bạn bè đến thư viện đọc sách." } },
    { type: "word", text: "朋友", pinyin: "péngyou", translation: "bạn bè, bằng hữu", partOfSpeech: "Danh từ", example: { chinese: "他是我的好朋友。", pinyin: "tā shì wǒ de hǎo péngyou.", vietnamese: "Anh ấy là bạn thân của tôi." } },
    { type: "word", text: "去", pinyin: "qù", translation: "đi đến", partOfSpeech: "Động từ", example: { chinese: "我们明天去公园吧。", pinyin: "wǒmen míngtiān qù gōngyuán ba.", vietnamese: "Ngày mai chúng ta đi công viên chơi nhé." } },
    { type: "word", text: "体育馆", pinyin: "tǐyùguǎn", translation: "nhà thi đấu thể thao, phòng thể dục", partOfSpeech: "Danh từ", example: { chinese: "新建的体育馆非常大。", pinyin: "xīnjiàn de tǐyùguǎn fēicháng dà.", vietnamese: "Nhà thi đấu mới xây dựng rất to rộng." } },
    { type: "word", text: "打篮球", pinyin: "dǎ lánqiú", translation: "chơi bóng rổ, đánh bóng rổ", partOfSpeech: "Động từ", example: { chinese: "他打篮球打得非常好。", pinyin: "tā dǎ lánqiú dǎ de fēicháng hǎochī.", vietnamese: "Cậu ấy chơi bóng rổ cừ khôi vô cùng." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "如果", pinyin: "rúguǒ", translation: "nếu như, nếu", partOfSpeech: "Liên từ", example: { chinese: "如果下雨，我就不去了。", pinyin: "rúguǒ xiàyǔ, wǒ jiù bù qù le.", vietnamese: "Nếu đổ mưa lớn thì tớ không đi nữa đâu." } },
    { type: "word", text: "下雨", pinyin: "xià yǔ", translation: "đổ mưa, mưa rơi", partOfSpeech: "Động từ", example: { chinese: "外面正在下着暴雨。", pinyin: "wàimiàn zhèngzài xiàzhe bàoyǔ.", vietnamese: "Bên ngoài đang có mưa giông rất to." } },
    { type: "word", text: "的话", pinyin: "de huà", translation: "nếu như ... (đi kèm với 'nếu')", partOfSpeech: "Trợ từ", example: { chinese: "有空的话，我们见个面吧。", pinyin: "yǒu kòng de huà, wǒmen jiàn gè miàn ba.", vietnamese: "Nếu rảnh thì chúng mình có cuộc hẹn gặp mặt nhé." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi", partOfSpeech: "Đại từ" },
    { type: "word", text: "就", pinyin: "jiù", translation: "thì, ngay lập tức, liền", partOfSpeech: "Phó từ", example: { chinese: "你等我一下，我马上就来。", pinyin: "nǐ děng wǒ yīxià, wǒ mǎshàng jiù lái.", vietnamese: "Cậu đợi mình tí, mình đến ngay liền." } },
    { type: "word", text: "在", pinyin: "zài", translation: "ở, tại / đang (tiến trình)", partOfSpeech: "Giới từ / Động từ", example: { chinese: "我在家里写汉字。", pinyin: "wǒ zài jiālǐ xiě hànzì.", vietnamese: "Tôi đang ở nhà viết chữ Hán." } },
    { type: "word", text: "家里", pinyin: "jiāli", translation: "trong nhà, ở gia đình", partOfSpeech: "Danh từ chỉ nơi chốn", example: { chinese: "今天家里只有我一个人。", pinyin: "jīntiān jiālǐ zhǐyǒu wǒ yīgè rén.", vietnamese: "Hôm nay ở nhà chỉ có độc nhất mình tôi." } },
    { type: "word", text: "听", pinyin: "tīng", translation: "nghe", partOfSpeech: "Động từ", example: { chinese: "你听，外面好像有猫叫。", pinyin: "nǐ tīng, wàimiàn hǎoxiàng yǒu māo jiào.", vietnamese: "Cậu nghe kìa, hình như bên ngoài có tiếng mèo gào kêu." } },
    { type: "word", text: "中文歌", pinyin: "zhōngwén gē", translation: "bài hát nhạc Hoa, ca khúc tiếng Trung", partOfSpeech: "Danh từ", example: { chinese: "我喜欢听好听的中文歌。", pinyin: "wǒ xǐhuān tīng hǎotīng de zhōngwén gē.", vietnamese: "Tôi thích nghe hoa ca/bài hát nhạc Hoa hay." } },
    { type: "punctuation", text: "、" },
    { type: "word", text: "看", pinyin: "kàn", translation: "xem, nhìn, đọc, khám bệnh", partOfSpeech: "Động từ", example: { chinese: "医生正在给他看病。", pinyin: "yīshēng zhèngzài gěi tā kànbìng.", vietnamese: "Bác sĩ đang chẩn trị khám bệnh cho anh ta." } },
    { type: "word", text: "电影", pinyin: "diànyǐng", translation: "phim ảnh, rạp phim", partOfSpeech: "Danh từ", example: { chinese: "我们在电影院看电影。", pinyin: "wǒmen zài diànyǐnyuàn kàn diànyǐng.", vietnamese: "Chúng ta xem phim chiếu rạp tại rạp chiếu phim." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "你", pinyin: "nǐ", translation: "bạn", partOfSpeech: "Đại từ" },
    { type: "word", text: "呢", pinyin: "ne", translation: "thì sao? (câu hỏi tỉnh lược đuôi), nhỉ", partOfSpeech: "Trợ từ", example: { chinese: "我要一杯冰美式，你呢？", pinyin: "wǒ yào yībēi bīng měishì, nǐ ne?", vietnamese: "Tôi lấy cốc Americano đá, còn bạn thì sao?" } },
    { type: "punctuation", text: "？" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi", partOfSpeech: "Đại từ" },
    { type: "word", text: "喜欢", pinyin: "xǐhuan", translation: "yêu thích, thích", partOfSpeech: "Động từ" },
    { type: "word", text: "静静地", pinyin: "jìngjìng de", translation: "lặng lẽ, thong thả yên tĩnh", partOfSpeech: "Trạng từ", example: { chinese: "我很享受静静地听歌的时光。", pinyin: "wǒ hěn xiǎngshòu jìngjìng de tīnggē de shíguāng.", vietnamese: "Tôi rất tận hưởng quảng thời gian thong thả ngồi nghe hát." } },
    { type: "word", text: "写", pinyin: "xiě", translation: "viết, vẽ", partOfSpeech: "Động từ", example: { chinese: "他的汉字写得非常工整。", pinyin: "tā de hànzì xiě de fēicháng gōngzhěng.", vietnamese: "Chữ Hán của cậu ấy viết rất nắn nót gọn gàng." } },
    { type: "word", text: "汉字", pinyin: "hànzì", translation: "chữ Hán", partOfSpeech: "Danh từ", example: { chinese: "写汉字是我的很大爱好。", pinyin: "xiě hànzì shì wǒ de hěn dà àihào.", vietnamese: "Viết chữ Hán là thú vui lớn của tớ." } },
    { type: "word", text: "和", pinyin: "hé", translation: "và", partOfSpeech: "Liên từ" },
    { type: "word", text: "看书", pinyin: "kàn shū", translation: "đọc sách", partOfSpeech: "Cụm động từ", example: { chinese: "我喜欢睡前看一会书。", pinyin: "wǒ xǐhuān shuì qián kàn yīhuì shū.", vietnamese: "Tôi muốn dành thời gian đọc sách một lát trước khi ngủ." } },
    { type: "punctuation", text: "。" }
  ],

  // Lesson 4: "最近公司的工作非常多，大家每天都要加班，感觉有些累。虽然辛苦，但是通过这个大项目，我学到了很多宝贵的经验。下个月结项后，我一定要向经理请假，去海边好好旅游一次。"
  "lesson-4": [
    { type: "word", text: "最近", pinyin: "zuìjìn", translation: "gần đây, dạo này", partOfSpeech: "Danh từ thời gian", example: { chinese: "最近他的中文水平提高得很快。", pinyin: "zuìjìn tā de zhōngwén shuǐpíng tígāo de hěn kuài.", vietnamese: "Gần đây trình độ tiếng Trung của anh ấy tăng lên nhanh chóng." } },
    { type: "word", text: "公司", pinyin: "gōngsī", translation: "công ty, hãng", partOfSpeech: "Danh từ", example: { chinese: "他在一家外资公司上班。", pinyin: "tā zài yī jiā wàizī gōngsī shàngbān.", vietnamese: "Anh ấy làm việc ở một công ty nước ngoài." } },
    { type: "word", text: "的", pinyin: "de", translation: "của", partOfSpeech: "Trợ từ" },
    { type: "word", text: "工作", pinyin: "gōngzuò", translation: "công việc, làm việc", partOfSpeech: "Danh từ / Động từ", example: { chinese: "祝你工作顺利！", pinyin: "zhù nǐ gōngzuò shùnlì!", vietnamese: "Chúc bạn công tác suôn sẻ!" } },
    { type: "word", text: "非常", pinyin: "fēicháng", translation: "vô cùng, bất thường", partOfSpeech: "Phó từ", example: { chinese: "这里的天空非常美。", pinyin: "zhèlǐ de tiānkōng fēicháng měi.", vietnamese: "Trời ở chỗ này vô cùng xinh đẹp." } },
    { type: "word", text: "多", pinyin: "duō", translation: "nhiều", partOfSpeech: "Tính từ", example: { chinese: "这个问题有很多人关注。", pinyin: "zhège wèntí yǒu hěnduō rén guānzhù.", vietnamese: "Vấn đề này được rất nhiều người lưu tâm." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "大家", pinyin: "dàjiā", translation: "mọi người, cả nhà", partOfSpeech: "Đại từ", example: { chinese: "希望大家多提意见。", pinyin: "xīwàng dàjiā duō tí yìjiàn.", vietnamese: "Chúc mong mọi người góp ý thêm nhiều bàn luận." } },
    { type: "word", text: "每天", pinyin: "měitiān", translation: "mỗi ngày, thường nhật", partOfSpeech: "Danh từ thời gian", example: { chinese: "我每天跑三公里。", pinyin: "wǒ měitiān pǎo sān gōnglǐ.", vietnamese: "Mỗi ngày dạo bộ tôi chạy 3 cây số." } },
    { type: "word", text: "都要", pinyin: "dōu yào", translation: "đều phải, đều muốn", partOfSpeech: "Phó cụm", example: { chinese: "我们每天都要坚持锻炼。", pinyin: "wǒmen měitiān dōu yào jiānchí duànliàn.", vietnamese: "Mỗi ngày chúng ta đều phải kiên trì rèn luyện." } },
    { type: "word", text: "加班", pinyin: "jiā bān", translation: "tăng ca, làm thêm giờ", partOfSpeech: "Động từ ly hợp", example: { chinese: "因为项目紧急，所以今晚要加班。", pinyin: "yīnwèi xiàngmù jǐnjí, suǒyǐ jīnwǎn yào jiābān.", vietnamese: "Bởi công trình khẩn cấp nên tối nay lại phải tăng ca." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "感觉", pinyin: "gǎnjué", translation: "cảm giác, cảm thấy", partOfSpeech: "Động từ / Danh từ", example: { chinese: "来到海边，我的感觉真轻松。", pinyin: "láidào hǎibiān, wǒ de gǎnjué zhēn qīngsōng.", vietnamese: "Đến với miền biển, cảm giác của tôi thật là nhẹ nhõm." } },
    { type: "word", text: "有些", pinyin: "yǒuxiē", translation: "có chút, có một số", partOfSpeech: "Phó từ / Lượng từ", example: { chinese: "心里感觉有些憋屈。", pinyin: "xīnlǐ gǎnjué yǒuxiē biēqu.", vietnamese: "Trong lòng có phần tủi thân nhẫn nhịn." } },
    { type: "word", text: "累", pinyin: "lèi", translation: "mỏi mệt, mệt nhọc", partOfSpeech: "Tính từ", example: { chinese: "辛苦工作了一天，太累了。", pinyin: "xīnkǔ gōngzuò le yītiān, tài lèi le.", vietnamese: "Lao động cực khổ một ngày trời, mệt rã rời rồi." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "虽然", pinyin: "suīrán", translation: "mặc dù, tuy rằng", partOfSpeech: "Liên từ", example: { chinese: "虽然很累，但我很开心。", pinyin: "suīrán hěn lèi, dàn wǒ hěn kāixīn.", vietnamese: "Mặc dù rất mỏi nhưng tôi rất là vui lòng." } },
    { type: "word", text: "辛苦", pinyin: "xīnkǔ", translation: "vất vả, gian nan", partOfSpeech: "Tính từ / Động từ", example: { chinese: "爸爸妈妈每天都很辛苦工作。", pinyin: "bàba māmā měitiān dōu hěn xīnkǔ gōngzuò.", vietnamese: "Cha mẹ thường ngày lao động đều vô cùng vất vả." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "但是", pinyin: "dànshì", translation: "nhưng mà, thế nhưng", partOfSpeech: "Liên từ", example: { chinese: "虽然是雨天， tetapi 他还是出门锻炼。", pinyin: "suīrán shì yǔtiān, dànshì tā háishì chūmén duànliàn.", vietnamese: "Mặc dầu trời giông bão nhưng anh ta vẫn ra ngoài rèn luyện." } },
    { type: "word", text: "通过", pinyin: "tōngguò", translation: "thông qua, vượt qua", partOfSpeech: "Giới từ / Động từ", example: { chinese: "通过认真复习，他通过了考级。", pinyin: "tōngguò rènzhēn fùxí, tā tōngguò le kǎojí.", vietnamese: "Thông qua ôn tập nghiêm chỉnh, anh đã đỗ vượt tiêu chuẩn." } },
    { type: "word", text: "这个", pinyin: "zhège", translation: "cái này", partOfSpeech: "Đại từ" },
    { type: "word", text: "大项目", pinyin: "dà xiàngmù", translation: "dự án lớn, chuyên án siêu lớn", partOfSpeech: "Danh từ", example: { chinese: "这个大项目需要大量资金。", pinyin: "zhège dà xiàngmù xūyào dàliàng zījīn.", vietnamese: "Dự án lớn này cần lượng vốn đầu tư khủng." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi", partOfSpeech: "Đại từ" },
    { type: "word", text: "学到了", pinyin: "xué dào le", translation: "đã học được, tiếp thu được", partOfSpeech: "Cụm động từ", example: { chinese: "在大学里学到了很多本事。", pinyin: "zài dàxué lǐ xué dào le hěnduō běnshi.", vietnamese: "Tại học đường đại học, tớ đã tiếp thu được rất nhiều bản lĩnh." } },
    { type: "word", text: "很多", pinyin: "hěnduō", translation: "rất nhiều", partOfSpeech: "Lượng từ" },
    { type: "word", text: "宝贵", pinyin: "bǎoguì", translation: "quý giá, quý báu", partOfSpeech: "Tính từ", example: { chinese: "时间是人生最宝贵的财富。", pinyin: "shíjiān shì rénshēng zuì bǎoguì de cáifù.", vietnamese: "Thời gian là kho của tài phú quý báu nhất của cuộc đời." } },
    { type: "word", text: "的", pinyin: "de", translation: "trợ từ", partOfSpeech: "Trợ từ" },
    { type: "word", text: "经验", pinyin: "jīngyàn", translation: "kinh nghiệm, trải nghiệm thực tiễn", partOfSpeech: "Danh từ", example: { chinese: "积累成功的教训与经验。", pinyin: "jīlěi chénggōng de jiàoxun yǔ jīngyàn.", vietnamese: "Tích lũy những bài học cùng kinh nghiệm thắng lợi." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "下个月", pinyin: "xià gè yuè", translation: "tháng sau, tháng tiếp theo", partOfSpeech: "Danh từ thời gian", example: { chinese: "下个月我和丽丽要过生日。", pinyin: "xià gè yuè wǒ hé lìlì yào guò shēngrì.", vietnamese: "Tháng tới tôi và Lệ Lệ đón lễ sinh nhật." } },
    { type: "word", text: "结项", pinyin: "jié xiàng", translation: "kết thúc dự án, hoàn thành dự án", partOfSpeech: "Động từ ly hợp", example: { chinese: "顺利结项的话需要全部报告。", pinyin: "shùnlì jiéxiàng de huà xūyào quánbù bàogào.", vietnamese: "Để nghiệm thu dự án cần cung cấp toàn văn báo cáo." } },
    { type: "word", text: "后", pinyin: "hòu", translation: "sau, phía sau", partOfSpeech: "Danh từ phương vị", example: { chinese: "两周后他将出国留学。", pinyin: "liǎng zhōu hòu tā jiāng chūguó liúxué.", vietnamese: "Hai tuần sau anh sẽ đi du học hải ngoại." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "我", pinyin: "wǒ", translation: "tôi", partOfSpeech: "Đại từ" },
    { type: "word", text: "一定", pinyin: "yīdìng", translation: "nhất định, chắc chắn", partOfSpeech: "Phó từ / Tính từ", example: { chinese: "下周我一定会来探望你。", pinyin: "xiàzhōu wǒ yīdìng huì lái tànwàng nǐ.", vietnamese: "Tuần sau tớ nhất định sẽ đến hỏi thăm thăm bạn." } },
    { type: "word", text: "要", pinyin: "yào", translation: "muốn, cần phải", partOfSpeech: "Động từ năng nguyện", example: { chinese: "我要一杯热水，谢谢。", pinyin: "wǒ yào yībēi rèshuǐ, xièxie.", vietnamese: "Tôi muốn một ly nước ấm, cảm ơn." } },
    { type: "word", text: "向", pinyin: "xiàng", translation: "hướng về, đối với", partOfSpeech: "Giới từ / Động từ", example: { chinese: "向雷锋同志学习。", pinyin: "xiàng léifēng tóngzhì xuéxí.", vietnamese: "Học tập noi gương đồng chí Lôi Phong." } },
    { type: "word", text: "经理", pinyin: "jīnglǐ", translation: "giám đốc, quản lý", partOfSpeech: "Danh từ", example: { chinese: "这位是我们的总经理张先生。", pinyin: "zhè wèi shì wǒmen de zǒngjīnglǐ zhāng xiānshēng.", vietnamese: "Vị này là tổng giám đốc Trương của chúng tôi." } },
    { type: "word", text: "请假", pinyin: "qǐng jià", translation: "xin phép nghỉ, xin phép nghỉ phép", partOfSpeech: "Động từ ly hợp", example: { chinese: "他病了，今天要向学校请假。", pinyin: "tā bìng le, jīntiān yào xiàng xuéxiào qǐngjià.", vietnamese: "Cậu bị bệnh nên hôm nay phải xin phép trường nghỉ học." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "去", "pinyin": "qù", translation: "đi", partOfSpeech: "Động từ" },
    { type: "word", text: "海边", pinyin: "hǎibiān", translation: "bờ biển, bãi biển", partOfSpeech: "Danh từ chỉ nơi chốn", example: { chinese: "在海边听浪花的声音很舒服。", pinyin: "zài hǎibiān tīng lànghuā de shēngyīn hěn shūfu.", vietnamese: "Nằm ở bờ biển lắng nghe âm thanh sóng biển sảng khoái ghê." } },
    { type: "word", text: "好好", pinyin: "hǎohāo", translation: "một cách tốt đẹp, tử tế", partOfSpeech: "Phó từ", example: { chinese: "明天要考试，今晚要好好学习。", pinyin: "míngtiān yào kǎoshì, jīnwǎn yào hǎohāo xuéxí.", vietnamese: "Mai kiểm tra rồi, tối nay liệu mà chuyên cần học tập tử tế nha." } },
    { type: "word", text: "旅游", pinyin: "lǚyóu", translation: "du lịch, lữ hành", partOfSpeech: "Động từ / Danh từ", example: { chinese: "我最大的理想是全球旅游。", pinyin: "wǒ zuì dà de lǐxiǎng shì quánqiú lǚyóu.", vietnamese: "Lý tưởng lớn nhất của tôi là lữ hành thế giới." } },
    { type: "word", text: "一次", pinyin: "yī cì", translation: "một lần, một dịp", partOfSpeech: "Số lượng từ", example: { chinese: "我一年只回一次国。", pinyin: "wǒ yīnián zhǐ huí yīcì guó.", vietnamese: "Một năm tôi chỉ về nước đúng một lần." } },
    { type: "punctuation", text: "。" }
  ],

  // Lesson 5: "服务员，我们要一个鸳鸯火锅。请问你们能吃辣吗？我们可以吃微辣。好的，那再点一份肥牛、一份豆腐和新鲜的蔬菜。请问要喝点什么？给我们两瓶冰镇可乐，谢谢。"
  "lesson-5": [
    { type: "word", text: "服务员", pinyin: "fúwùyuán", translation: "nhân viên phục vụ", partOfSpeech: "Danh từ", example: { chinese: "服务员，买单！", pinyin: "fúwùyuán, mǎidān!", vietnamese: "Nhân viên ơi, tính tiền!" } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "我们", pinyin: "wǒmen", translation: "chúng tôi, chúng ta", partOfSpeech: "Đại từ", example: { chinese: "我们都是好朋友。", pinyin: "wǒmen dōu shì hǎo péngyou.", vietnamese: "Chúng tôi đều là những bạn tốt." } },
    { type: "word", text: "要", pinyin: "yào", translation: "muốn, gọi món", partOfSpeech: "Động từ" },
    { type: "word", text: "一个", pinyin: "yīgè", translation: "một cái, một suất", partOfSpeech: "Số lượng từ", example: { chinese: "我买一个大西瓜。", pinyin: "wǒ mǎi yīgè dà xīguā.", vietnamese: "Tớ mua một quả dưa hấu to." } },
    { type: "word", text: "鸳鸯火锅", pinyin: "yuānyāng huǒguō", translation: "lẩu uyên ương (gồm 2 ngăn cay và không cay)", partOfSpeech: "Danh từ", example: { chinese: "吃中国四川火锅，最经典的是鸳鸯火锅。", pinyin: "chī zhōngguó sìchuān huǒguō, zuì jīngdiǎn de shì yuānyāng huǒguō.", vietnamese: "Ăn lẩu Tứ Xuyên Trung Quốc, kinh điển nhất phải là lẩu uyên ương." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "请问", pinyin: "qǐngwèn", translation: "xin hỏi", partOfSpeech: "Động từ" },
    { type: "word", text: "你们", pinyin: "nǐmen", translation: "các bạn, các anh chị", partOfSpeech: "Đại từ", example: { chinese: "你们想喝什么果汁？", pinyin: "nǐmen xiǎng hē shénme guǒzhī?", vietnamese: "Các bạn muốn uống nước ép trái cây gì?" } },
    { type: "word", text: "能吃", pinyin: "néng chī", translation: "có thể ăn, biết ăn", partOfSpeech: "Cụm động từ", example: { chinese: "我们很能吃辣。", pinyin: "wǒmen hěn néng chī là.", vietnamese: "Chúng tôi ăn cay rất giỏi." } },
    { type: "word", text: "辣", pinyin: "là", translation: "cay, vị cay", partOfSpeech: "Tính từ / Danh từ", example: { chinese: "四川菜都非常辣。", pinyin: "sìchuāncài dōu fēicháng là.", vietnamese: "Các món Tứ Xuyên thảy đều rất cay." } },
    { type: "word", text: "吗", pinyin: "ma", translation: "không?", partOfSpeech: "Trợ từ" },
    { type: "punctuation", text: "？" },
    { type: "word", text: "我们", pinyin: "wǒmen", translation: "chúng tôi", partOfSpeech: "Đại từ" },
    { type: "word", text: "可以", pinyin: "kěyǐ", translation: "có thể", partOfSpeech: "Động từ" },
    { type: "word", text: "吃", pinyin: "chī", translation: "ăn", partOfSpeech: "Động từ", example: { chinese: "吃饱了吗？", pinyin: "chī bǎo le ma?", vietnamese: "Ăn no bụng chưa ạ?" } },
    { type: "word", text: "微辣", pinyin: "wēilà", translation: "cay nhẹ, hơi cay ít", partOfSpeech: "Tính từ", example: { chinese: "这盘麻辣烫只是微辣，不用怕。", pinyin: "zhè pán málàtàng zhǐshì wēilà, bùyòng pà.", vietnamese: "Đĩa ma lạt thảo này chỉ cay vừa thôi, chớ lo nhé." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "好的", pinyin: "hǎo de", translation: "dạ vâng, đồng ý", partOfSpeech: "Thán từ" },
    { type: "punctuation", text: "，" },
    { type: "word", text: "那", pinyin: "nà", translation: "thế thì, vậy", partOfSpeech: "Phó từ" },
    { type: "word", text: "再", pinyin: "zài", translation: "lại, thêm nữa (hành động tương lai)", partOfSpeech: "Phó từ", example: { chinese: "欢迎下次再来！", pinyin: "huānyíng xiàcì zàilái!", vietnamese: "Nhiệt liệt tiếp đón lần sau lại tới ghé tiệm!" } },
    { type: "word", text: "点", pinyin: "diǎn", translation: "gọi món, đặt trước", partOfSpeech: "Động từ", example: { chinese: "我要点这道红烧肉。", pinyin: "wǒ yào diǎn zhè dào hóngshāoròu.", vietnamese: "Tớ muốn gọi món thịt kho tàu này." } },
    { type: "word", text: "一份", pinyin: "yī fèn", translation: "một phần, một suất", partOfSpeech: "Số lượng từ", example: { chinese: "服务员，再来一份水饺。", pinyin: "fúwùyuán, zàilái yī fèn shuǐjiǎo.", vietnamese: "Phục vụ ơi, cho một suất sủi dảo nữa nhé." } },
    { type: "word", text: "肥牛", pinyin: "féiniú", translation: "thịt bò ba chỉ ăn lẩu, bò Mỹ", partOfSpeech: "Danh từ", example: { chinese: "新鲜的肥牛在火锅里涮着太好吃了。", pinyin: "xīnxian de féiniú zài huǒguō lǐ shuànzhe tài hǎochī le.", vietnamese: "Thịt ba chỉ bò tươi ăn nhúng lẩu thật sự ngon tuyệt." } },
    { type: "punctuation", text: "、" },
    { type: "word", text: "一份", pinyin: "yī fèn", translation: "một phần", partOfSpeech: "Số lượng từ" },
    { type: "word", text: "豆腐", pinyin: "dòufu", translation: "đậu phụ, đậu hũ", partOfSpeech: "Danh từ", example: { chinese: "凉拌豆腐是很好的消暑凉菜。", pinyin: "liángbàn dòufu shì hěn hǎo de xiāoshǔ liángcài.", vietnamese: "Món đậu hũ mát làm nộm chua ngọt giải nhiệt ngày hè cực đỉnh." } },
    { type: "word", text: "和", pinyin: "hé", translation: "và", partOfSpeech: "Liên từ" },
    { type: "word", text: "新鲜", pinyin: "xīnxian", translation: "tươi mát", partOfSpeech: "Tính từ" },
    { type: "word", text: "的", pinyin: "de", translation: "trợ từ sở hữu thuộc định ngữ", partOfSpeech: "Trợ từ" },
    { type: "word", text: "蔬菜", pinyin: "shūcài", translation: "rau tươi, rau quả", partOfSpeech: "Danh từ", example: { chinese: "多吃蔬菜对身体健康非常好。", pinyin: "duō chī shūcài duì shēntǐ jiànkāng fēicháng hǎo.", vietnamese: "Ăn nhiều rau xanh đối với sức khỏe cơ thể cực tốt." } },
    { type: "punctuation", text: "。" },
    { type: "word", text: "请问", pinyin: "qǐngwèn", translation: "xin hỏi", partOfSpeech: "Động từ" },
    { type: "word", text: "要", pinyin: "yào", translation: "muốn dùng", partOfSpeech: "Động từ" },
    { type: "word", text: "喝点", pinyin: "hē diǎn", translation: "uống chút gì, uống một ít", partOfSpeech: "Cụm động từ", example: { chinese: "天气很热，你要喝点冰水吗？", pinyin: "tiānqì hěn rè, nǐ yào hē diǎn bīng shuǐ ma?", vietnamese: "Thời tiết oi quá, bạn muốn uống miếng nước đá không?" } },
    { type: "word", text: "什么", pinyin: "shénme", translation: "cái gì, gì", partOfSpeech: "Đại từ" },
    { type: "punctuation", text: "？" },
    { type: "word", text: "给我们", pinyin: "gěi wǒmen", translation: "cho chúng tôi, mang ra chúng tôi", partOfSpeech: "Cụm động từ", example: { chinese: "请给我们两个杯子。", pinyin: "qǐng gěi wǒmen liǎng gè bēizi.", vietnamese: "Vui lòng cho chúng tôi hai cái cốc." } },
    { type: "word", text: "两瓶", pinyin: "liǎng píng", translation: "hai chai, hai lọ", partOfSpeech: "Số lượng từ", example: { chinese: "这里有两瓶红酒。", pinyin: "zhèlǐ yǒu liǎng píng hóngjiǔ.", vietnamese: "Tại chỗ này có hai chai rượu vang." } },
    { type: "word", text: "冰镇", pinyin: "bīngzhèn", translation: "ướp lạnh, ướp đá", partOfSpeech: "Tính từ", example: { chinese: "冰镇西瓜是夏天最好吃的美食。", pinyin: "bīngzhèn xīguā shì xiàtiān zuì hǎochī de měishí.", vietnamese: "Dưa hấu ướp lạnh là cao lương mỹ vị nhất trong mùa nóng." } },
    { type: "word", text: "可乐", pinyin: "kělè", translation: "Coca-Cola, nước ngọt có ga", partOfSpeech: "Danh từ", example: { chinese: "我不喜欢喝甜的可乐。", pinyin: "wǒ bù xǐhuān hē tián de kělè.", vietnamese: "Tớ không thích uống nước ga cô-la ngọt." } },
    { type: "punctuation", text: "，" },
    { type: "word", text: "谢谢", pinyin: "xièxie", translation: "cảm ơn", partOfSpeech: "Thán từ", example: { chinese: "非常谢谢你的帮助。", pinyin: "fēicháng xièxie nǐ de bāngzhù.", vietnamese: "Vô cùng cảm ơn sự hỗ trợ tận tình của bạn." } },
    { type: "punctuation", text: "。" }
  ]
};

// Simple wide-coverage offline token dictionary for maximum segment mapping of arbitrary custom inputs
export const OFFLINE_VOCAB_DICT: Record<string, { pinyin: string; translation: string; partOfSpeech: string; example: any }> = {

  "太极拳": { pinyin: "tài jí quán", translation: "Thái cực quyền", partOfSpeech: "Danh từ", example: { chinese: "他每天早上打太极拳。", pinyin: "tā měitiān zǎoshang dǎ tàijíquán.", vietnamese: "Ông ấy tập thái cực quyền mỗi sáng." } },
  "夏令营": { pinyin: "xià lìng yíng", translation: "trại hè", partOfSpeech: "Danh từ", example: { chinese: "我参加了中文夏令营。", pinyin: "wǒ cānjiā le zhōngwén xiàlìngyíng.", vietnamese: "Tôi đã tham gia trại hè tiếng Trung." } },
  "志愿者": { pinyin: "zhì yuàn zhě", translation: "tình nguyện viên", partOfSpeech: "Danh từ", example: { chinese: "她是一名奥运会志愿者。", pinyin: "tā shì yī míng àoyùnhuì zhìyuànzhě.", vietnamese: "Cô ấy là một tình nguyện viên thế vận hội." } },
  "家人": { pinyin: "jiā rén", translation: "người nhà, gia đình", partOfSpeech: "Danh từ", example: { chinese: "我和家人一起去旅行。", pinyin: "wǒ hé jiārén yīqǐ qù lǚxíng.", vietnamese: "Tôi đi du lịch cùng người nhà." } },
  "任何人": { pinyin: "rèn hé rén", translation: "bất kỳ ai", partOfSpeech: "Đại từ", example: { chinese: "任何人都可以参加。", pinyin: "rènhérén dōu kěyǐ cānjiā.", vietnamese: "Bất kỳ ai cũng có thể tham gia." } },
  "老先生": { pinyin: "lǎo xiān sheng", translation: "lão tiên sinh, ông cụ", partOfSpeech: "Danh từ", example: { chinese: "那位老先生是我的邻居。", pinyin: "nà wèi lǎo xiānsheng shì wǒ de línjū.", vietnamese: "Cụ ông đó là hàng xóm của tôi." } },
  "不知道": { pinyin: "bù zhī dào", translation: "không biết", partOfSpeech: "Động từ", example: { chinese: "我不知道他在哪里。", pinyin: "wǒ bù zhīdào tā zài nǎlǐ.", vietnamese: "Tôi không biết anh ấy ở đâu." } },
  "吃饭": { pinyin: "chī fàn", translation: "ăn cơm", partOfSpeech: "Động từ", example: { chinese: "我们去吃饭吧。", pinyin: "wǒmen qù chīfàn ba.", vietnamese: "Chúng ta đi ăn cơm thôi." } },
  "那里": { pinyin: "nà lǐ", translation: "nơi đó, chỗ đó", partOfSpeech: "Đại từ", example: { chinese: "那里有很多书。", pinyin: "nàlǐ yǒu hěnduō shū.", vietnamese: "Chỗ đó có rất nhiều sách." } },
  "这里": { pinyin: "zhè lǐ", translation: "nơi này, chỗ này", partOfSpeech: "Đại từ", example: { chinese: "这里很安静。", pinyin: "zhèlǐ hěn ānjièng.", vietnamese: "Chỗ này rất yên tĩnh." } },
  "还有": { pinyin: "hái yǒu", translation: "còn có, vẫn còn", partOfSpeech: "Liên từ", example: { chinese: "我还有一件事要说。", pinyin: "wǒ háiyǒu yī jiàn shì yào shuō.", vietnamese: "Tôi còn một việc nữa muốn nói." } },
  "学会": { pinyin: "xué huì", translation: "học được, nắm được", partOfSpeech: "Động từ", example: { chinese: "我学会了游泳。", pinyin: "wǒ xuéhuì le yóuyǒng.", vietnamese: "Tôi đã biết bơi rồi." } },
  "最好": { pinyin: "zuì hǎo", translation: "tốt nhất", partOfSpeech: "Phó từ", example: { chinese: "你最好早点休息。", pinyin: "nǐ zuìhǎo zǎodiǎn xiūxi.", vietnamese: "Tốt nhất bạn nên nghỉ ngơi sớm một chút." } },
  "最后": { pinyin: "zuì hòu", translation: "cuối cùng", partOfSpeech: "Danh từ/Phó từ", example: { chinese: "最后，他成功了。", pinyin: "zuìhòu, tā chénggōng le.", vietnamese: "Cuối cùng anh ấy đã thành công." } },
  "不能": { pinyin: "bù néng", translation: "không thể", partOfSpeech: "Động từ năng nguyện", example: { chinese: "我不能去。", pinyin: "wǒ bùnéng qù.", vietnamese: "Tôi không thể đi." } },
  "点儿": { pinyin: "diǎn r", translation: "một chút, tí xíu", partOfSpeech: "Lượng từ", example: { chinese: "我喝了一点儿水。", pinyin: "wǒ hē le yīdiǎnr shuǐ.", vietnamese: "Tôi đã uống một chút nước." } },
  "纸": { pinyin: "zhǐ", translation: "giấy", partOfSpeech: "Danh từ", example: { chinese: "给我一张纸。", pinyin: "gěi wǒ yī zhāng zhǐ.", vietnamese: "Đưa cho tôi một tờ giấy." } },

  // New Additions
  "先生": { pinyin: "xiānsheng", translation: "tiên sinh, ông (cách gọi trang trọng)", partOfSpeech: "Danh từ", example: { chinese: "王先生，您好！", pinyin: "wáng xiānsheng, nín hǎo!", vietnamese: "Xin chào ông Vương!" } },
  "医生": { pinyin: "yīshēng", translation: "bác sĩ, thầy thuốc", partOfSpeech: "Danh từ", example: { chinese: "我在医院看医生。", pinyin: "wǒ zài yīyuàn kàn yīshēng.", vietnamese: "Tôi đang khám bác sĩ ở bệnh viện." } },
  "星期": { pinyin: "xīngqī", translation: "tuần lễ, thứ", partOfSpeech: "Danh từ", example: { chinese: "今天星期几？", pinyin: "jīntiān xīngqī jǐ?", vietnamese: "Hôm nay là thứ mấy?" } },

  "哈罗": { pinyin: "hāluó", translation: "hello, xin chào", partOfSpeech: "Thán từ", example: { chinese: "哈罗，你过得好吗？", pinyin: "hāluó, nǐ guò de hǎo ma?", vietnamese: "Hello, cuộc sống của cậu dạo này ổn chứ?" } },
  "你好": { pinyin: "nǐ hǎo", translation: "xin chào", partOfSpeech: "Thán từ", example: { chinese: "你好，很高兴见到你。", pinyin: "nǐ hǎo, hěn gāoxìng jiàndào nǐ.", vietnamese: "Xin chào, rất vui được gặp bạn." } },
  "我们": { pinyin: "wǒmen", translation: "chúng tôi, chúng ta", partOfSpeech: "Đại từ", example: { chinese: "我们是朋友。", pinyin: "wǒmen shì péngyou.", vietnamese: "Chúng ta là bạn bè." } },
  "你们": { pinyin: "nǐmen", translation: "các bạn", partOfSpeech: "Đại từ", example: { chinese: "你们去哪儿？", pinyin: "nǐmen qù nǎ'r?", vietnamese: "Các cậu đi đâu thế?" } },
  "他们": { pinyin: "tāmen", translation: "họ, bọn họ", partOfSpeech: "Đại từ", example: { chinese: "他们是老师。", pinyin: "tāmen shì lǎoshī.", vietnamese: "Mọi người họ đều là giáo viên." } },
  "谢谢": { pinyin: "xièxie", translation: "cảm ơn", partOfSpeech: "Thán từ", example: { chinese: "谢谢你的帮助！", pinyin: "xièxie nǐ de bāngzhù!", vietnamese: "Cảm ơn sự giúp đỡ của bạn nhé!" } },
  "再见": { pinyin: "zàijiàn", translation: "tạm biệt, hẹn gặp lại", partOfSpeech: "Thán từ", example: { chinese: "明天再见！", pinyin: "míngtiān zàijiàn!", vietnamese: "Hẹn hò ngày mai gặp lại nhé!" } },
  "苹果": { pinyin: "píngguǒ", translation: "quả táo, trái táo, hãng Apple", partOfSpeech: "Danh từ", example: { chinese: "我想吃苹果。", pinyin: "wǒ xiǎng chī píngguǒ.", vietnamese: "Tớ thèm ăn quả táo quá." } },
  "中国": { pinyin: "zhōngguó", translation: "Trung Quốc", partOfSpeech: "Danh từ riêng", example: { chinese: "中国北京很大。", pinyin: "zhōngguó běijīng hěn dà.", vietnamese: "Thủ đô Bắc Kinh của Trung Quốc to lớn vô cùng." } },
  "越南": { pinyin: "yuènán", translation: "Việt Nam", partOfSpeech: "Danh từ riêng", example: { chinese: "越南河内是文化古城。", pinyin: "yuènán hénèi shì wénhuà gǔchéng.", vietnamese: "Hà Nội, Việt Nam là một cổ đô giàu tính văn hóa." } },
  "留学生": { pinyin: "liúxuéshēng", translation: "du học sinh", partOfSpeech: "Danh từ", example: { chinese: "很多外国人在中国当留学生。", pinyin: "hěnduō wàiguórén zài zhōngguó dāng liúxuéshēng.", vietnamese: "Có rất nhiều khách ngoại quốc đang học tập với danh nghĩa du học sinh tại Trung Quốc." } },
  "汉字": { pinyin: "hànzì", translation: "chữ Hán, ký tự Trung Hoa", partOfSpeech: "Danh từ", example: { chinese: "汉字很好玩。", pinyin: "hànzì hěn hǎowán.", vietnamese: "Chữ Hán thực sự rất kỳ thú và bổ ích." } },
  "中文": { pinyin: "zhōngwén", translation: "tiếng Trung, Hoa văn", partOfSpeech: "Danh từ", example: { chinese: "我爱学习中文。", pinyin: "wǒ ài xuéxí zhōngwén.", vietnamese: "Tôi cực kỳ yêu say mê việc học hỏi tiếng Trung." } },
  "汉语": { pinyin: "hànyǔ", translation: "tiếng Hoa, Hán ngữ", partOfSpeech: "Danh từ", example: { chinese: "汉语口语很重要。", pinyin: "hànyǔ kǒuyǔ hěn zhòngyào.", vietnamese: "Tiếng khẩu ngữ đàm thoại Hán ngữ cực kỳ cốt tử." } },
  "学习": { pinyin: "xuéxí", translation: "học tập, nghiên cứu học tập", partOfSpeech: "Động từ", example: { chinese: "我要天天学习。", pinyin: "wǒ yào tiāntiān xuéxí.", vietnamese: "Tôi muốn học hỏi mỗi ngày." } },
  "工作": { pinyin: "gōngzuò", translation: "công việc, làm việc, công sở", partOfSpeech: "Danh từ / Động từ", example: { chinese: "你做什么工作？", pinyin: "nǐ zuò shénme gōngzuò?", vietnamese: "Cậu làm công tác công việc gì vậy?" } },
  "公司": { pinyin: "gōngsī", translation: "công ty, doanh nghiệp", partOfSpeech: "Danh từ", example: { chinese: "我在大公司学习工作。", pinyin: "wǒ zài dà gōngsī xuéxí gōngzuò.", vietnamese: "Tớ đang thực hành nghiệp vụ ở một doanh nghiệp lớn." } },
  "超市": { pinyin: "chāoshì", translation: "siêu thị", partOfSpeech: "Danh từ", example: { chinese: "我们去超市买水果吧。", pinyin: "wǒmen qù chāoshì mǎi shuǐguǒ ba.", vietnamese: "Chúng ta ghé siêu thị sắm hoa quả tươi đi." } },
  "咖啡": { pinyin: "kāfēi", translation: "cá phê", partOfSpeech: "Danh từ", example: { chinese: "我想喝冰咖啡。", pinyin: "wǒ xiǎng hē bīng kāfēi.", vietnamese: "Tớ thèm uống ly cà phê đá lạnh." } },
  "茶": { pinyin: "chá", translation: "trà, chè", partOfSpeech: "Danh từ", example: { chinese: "中国人很喜欢喝绿茶。", pinyin: "zhōngguórén hěn xǐhuan hē lǜchá.", vietnamese: "Người Hoa vô lý thích thưởng thức trà xanh." } },
  "水": { pinyin: "shuǐ", translation: "nước", partOfSpeech: "Danh từ", example: { chinese: "多喝热水对身体好。", pinyin: "duō hē rèshuǐ duì shēntǐ hǎo.", vietnamese: "Nên uống dồi dào nước ấm có lợi cho cơ thể đó." } },
  "米饭": { pinyin: "mǐfàn", translation: "cơm, cơm chín", partOfSpeech: "Danh từ", example: { chinese: "午饭我吃了两碗米饭。", pinyin: "wǔfàn wǒ chī le liǎng wǎn mǐfàn.", vietnamese: "Bữa trưa tớ đã chén gọn hai bát cơm đầy." } },
  "喜欢": { pinyin: "xǐhuan", translation: "thích, thiện cảm", partOfSpeech: "Động từ", example: { chinese: "我很喜欢看电影。", pinyin: "wǒ hěn xǐhuan kàn diànyǐng.", vietnamese: "Tớ rất thích phiêu lưu xem phim." } },
  "高兴": { pinyin: "gāoxìng", translation: "vui vẻ, hạnh phúc, hân hoan", partOfSpeech: "Tính từ", example: { chinese: "今天发了工资很高兴。", pinyin: "jīntiān fā le gōngzī hěn gāoxìng.", vietnamese: "Hôm nay nhận phát lương nên lòng phấn chấn vui ghê." } },
  "认识": { pinyin: "rènshi", translation: "quen biết, nhận diện", partOfSpeech: "Động từ", example: { chinese: "很高兴认识你！", pinyin: "hěn gāoxìng rènshi nǐ!", vietnamese: "Rất hân hạnh phấn khởi quen biết bạn!" } },
  "名字": { pinyin: "míngzì", translation: "tên gọi, danh xưng", partOfSpeech: "Danh từ", example: { chinese: "你的名字很好听。", pinyin: "nǐ de míngzì hěn hǎotīng.", vietnamese: "Tên xưng hô của bạn nghe lọt tai hay thế." } },
  "老师": { pinyin: "lǎoshī", translation: "thầy giáo, cô giáo, lão sư", partOfSpeech: "Danh từ", example: { chinese: "他是我们的中文老师。", pinyin: "tā shì wǒmen de zhōngwén lǎoshī.", vietnamese: "Thầy ấy là giáo viên dạy tiếng Trung của bọn tôi." } },
  "学生": { pinyin: "xuesheng", translation: "học sinh, học đồ", partOfSpeech: "Danh từ", example: { chinese: "学校有很多外国留学生。", pinyin: "xuéxiào yǒu hěnduō wàiguó liúxuéshēng.", vietnamese: "Môi trường học đường này có vô cùng nhiều du học sinh nước ngoài." } },
  "中国菜": { pinyin: "zhōngguócài", translation: "món ăn Trung Hoa, món Trung", partOfSpeech: "Danh từ", example: { chinese: "你最爱吃什么中国菜？", pinyin: "nǐ zuì ài chī shénme zhōngguócài?", vietnamese: "Đĩa thức ăn món Trung nào cậu thích nhất dạo này?" } },
  "火锅": { pinyin: "huǒguō", translation: "lẩu, nổi lẩu", partOfSpeech: "Danh từ", example: { chinese: "冬天我们最爱吃热乎乎的火锅。", pinyin: "dōngtiān wǒmen zuì ài chī rèhūhū de huǒguō.", vietnamese: "Giữa ngày lạnh buốt, tụi tớ yêu nhất là được ngồi ăn lẩu nóng hổi." } },
  "天气": { pinyin: "tiānqì", translation: "thời tiết, tiết trời", partOfSpeech: "Danh từ", example: { chinese: "今天天气真好，晴空万里。", pinyin: "jīntiān tiānqì zhēn hǎo, qíngkōng wànlǐ.", vietnamese: "Hôm nay thời tiết đẹp quá trần, trời quang mây tạnh vạn dặm." } },
  "北京": { pinyin: "běijīng", translation: "Bắc Kinh", partOfSpeech: "Danh từ riêng", example: { chinese: "我要去北京长城看雪景。", pinyin: "wie yào qù běijīng chángchéng kàn xuějǐng.", vietnamese: "Tớ sắp sửa ghé Bắc Kinh ngắm cảnh tuyết vạn lý trường thành." } },
  "上海": { pinyin: "shànghǎi", translation: "Thượng Hải", partOfSpeech: "Danh từ riêng", example: { chinese: "上海外滩夜景特别美丽。", pinyin: "shànghǎi wàitān yèjǐng tèbié měilì.", vietnamese: "Đêm đẹp ngút ngàn của bãi Ngoại滩 Thượng Hải thật tráng lệ." } },
  "飞机": { pinyin: "fēijī", translation: "máy bay, phi cơ", partOfSpeech: "Danh từ", example: { chinese: "做飞机去中国很方便。", pinyin: "zuò fēijī qù zhōngguó hěn fāngbiàn.", vietnamese: "Đi máy bay đến Trung Quốc rất thuận tiện." } },
  "火车": { pinyin: "huǒchē", translation: "tàu hỏa, xe lửa", partOfSpeech: "Danh từ", example: { chinese: "这趟列车开得很快。", pinyin: "zhè tàng lièchē kāi de hěn kuài.", vietnamese: "Chuyến tàu hoả này chạy băng băng siêu nhanh." } },
  "地铁": { pinyin: "dìtiě", translation: "tàu điện ngầm", partOfSpeech: "Danh từ", example: { chinese: "每天上班，我都要乘坐地铁。", pinyin: "měitiān shàngbān, wǒ dōu yào chéngzuò dìtiě.", vietnamese: "Mỗi ngày đi làm công sở, tôi đều phải di chuyển bằng tàu ngầm." } },
  "电脑": { pinyin: "diànnǎo", translation: "máy vi tính, laptop", partOfSpeech: "Danh từ", example: { chinese: "电脑里有很多学习资料。", pinyin: "diànnǎo lǐ yǒu hěnduō xuéxí zīliào.", vietnamese: "Trong chiếc laptop của tớ có tơi tả tài liệu học hành bổ ích." } },
  "手机": { pinyin: "shǒujī", translation: "điện thoại di động, phone", partOfSpeech: "Danh từ", example: { chinese: "现在的智能手机用处极大。", pinyin: "xiànzài de zhìnéng shǒujī yòngchù jídà.", vietnamese: "Smartphone thời nay cực kỳ đa năng nhiều tiện ích." } },
  "微信": { pinyin: "wēixìn", translation: "WeChat", partOfSpeech: "Danh từ riêng", example: { chinese: "咱们加微信好友联系吧。", pinyin: "zánmen jiā wēixìn hǎoyǒu liánxì ba.", vietnamese: "Tụi mình kết duyên kết bạn WeChat để liên hệ sau nha." } },
  "支付": { pinyin: "zhīfù", translation: "thanh toán, chi trả", partOfSpeech: "Động từ", example: { chinese: "你能用电子支付付账吗？", pinyin: "nǐ néng yòng diànzǐ zhīfù fùzhàng ma?", vietnamese: "Cậu có thể sử dụng thanh toán điện tử đóng tiền thanh toán không?" } },
  "可乐": { pinyin: "kělè", translation: "nước ngọt Cola", partOfSpeech: "Danh từ", example: { chinese: "可乐冰镇一下最好喝啦。", pinyin: "kělè bīngzhèn yīxià zuì hǎohē la.", vietnamese: "Nước ngọt Cola ướp đá uống xuất sắc nhất rồi đấy." } },
  "便宜": { pinyin: "piányi", translation: "rẻ mạt, giá hời", partOfSpeech: "Tính từ", example: { chinese: "质量很好，价格又便宜。", pinyin: "zhìliàng hěn hǎo, jiàgé yòu piányi.", vietnamese: "Chất lượng lại tuyệt vời, giá cả còn hời rẻ nữa." } }
};

// Generates fallback single-character analysis if no vocabulary matches in custom text.
// This is used as a final safety net for the general segmenter.
export const OFFLINE_CHAR_DICT: Record<string, { pinyin: string; translation: string; partOfSpeech: string }> = {
  "我": { pinyin: "wǒ", translation: "tôi, tớ, ta", partOfSpeech: "Đại từ" },
  "你": { pinyin: "nǐ", translation: "bạn, cậu, em", partOfSpeech: "Đại từ" },
  "他": { pinyin: "tā", translation: "anh ấy, ông ấy", partOfSpeech: "Đại từ" },
  "她": { pinyin: "tā", translation: "cô ấy, bà ấy", partOfSpeech: "Đại từ" },
  "它": { pinyin: "tā", translation: "nó, con vật ấy", partOfSpeech: "Đại từ" },
  "们": { pinyin: "men", translation: "các (hậu tố chỉ số nhiều cho đại từ/nhân xưng)", partOfSpeech: "Trợ từ" },
  "是": { pinyin: "shì", translation: "là, vâng, phải", partOfSpeech: "Động từ" },
  "不": { pinyin: "bù", translation: "không, chẳng", partOfSpeech: "Phó từ" },
  "在": { pinyin: "zài", translation: "ở, tại, đang", partOfSpeech: "Giới từ / Động từ" },
  "有": { pinyin: "yǒu", translation: "có, sở hữu", partOfSpeech: "Động từ" },
  "这": { pinyin: "zhè", translation: "đây, này", partOfSpeech: "Đại từ" },
  "那": { pinyin: "nà", translation: "kia, đó, vậy thì", partOfSpeech: "Đại từ / Liên từ" },
  "的": { pinyin: "de", translation: "của (trợ từ sở hữu)", partOfSpeech: "Trợ từ" },
  "了": { pinyin: "le", translation: "rồi (trợ từ kết thúc hành động)", partOfSpeech: "Trợ từ" },
  "和": { pinyin: "hé", translation: "và, cùng với", partOfSpeech: "Liên từ" },
  "也": { pinyin: "yě", translation: "cũng", partOfSpeech: "Phó từ" },
  "都": { pinyin: "dōu", translation: "đều, tất cả", partOfSpeech: "Phó từ" },
  "很": { pinyin: "hěn", translation: "rất, lắm", partOfSpeech: "Phó từ" },
  "去": { pinyin: "qù", translation: "đi, đi đến, bỏ", partOfSpeech: "Động từ" },
  "来": { pinyin: "lái", translation: "đến, lại gần", partOfSpeech: "Động từ" },
  "看": { pinyin: "kàn", translation: "nhìn, xem, đọc", partOfSpeech: "Động từ" },
  "听": { pinyin: "tīng", translation: "nghe, tuân theo", partOfSpeech: "Động từ" },
  "吃": { pinyin: "chī", translation: "ăn, thưởng thức", partOfSpeech: "Động từ" },
  "喝": { pinyin: "hē", translation: "uống", partOfSpeech: "Động từ" },
  "买": { pinyin: "mǎi", translation: "mua, sắm", partOfSpeech: "Động từ" },
  "卖": { pinyin: "mài", translation: "bán", partOfSpeech: "Động từ" },
  "说": { pinyin: "shuō", translation: "nói, giải thích", partOfSpeech: "Động từ" },
  "话": { pinyin: "huà", translation: "lời nói, câu chuyện", partOfSpeech: "Danh từ" },
  "天": { pinyin: "tiān", translation: "ngày, trời", partOfSpeech: "Danh từ" },
  "人": { pinyin: "rén", translation: "người, nhân vật", partOfSpeech: "Danh từ" },
  "大": { pinyin: "dà", translation: "to, lớn, vĩ đại", partOfSpeech: "Tính từ" },
  "小": { pinyin: "xiǎo", translation: "nhỏ, bé, tiểu", partOfSpeech: "Tính từ" },
  "好": { pinyin: "hǎo", translation: "tốt, khỏe, xong", partOfSpeech: "Tính từ" },
  "多": { pinyin: "duō", translation: "nhiều, hơn", partOfSpeech: "Tính từ" },
  "少": { pinyin: "shǎo", translation: "ít, thiếu", partOfSpeech: "Tính từ" },
  "钱": { pinyin: "qián", translation: "tiền bạc, ngân lượng", partOfSpeech: "Danh từ" },
  "家": { pinyin: "jiā", translation: "nhà, gia đình", partOfSpeech: "Danh từ" },
  "国": { pinyin: "guó", translation: "nước, quốc gia", partOfSpeech: "Danh từ" },
  "中": { pinyin: "zhōng", translation: "trung, ở giữa, Trung Quốc", partOfSpeech: "Danh từ / Trực vị từ" },
  "学": { pinyin: "xué", translation: "học, nghiên cứu", partOfSpeech: "Động từ" },
  "校": { pinyin: "xiào", translation: "trường học", partOfSpeech: "Danh từ" },
  "生": { pinyin: "shēng", translation: "học sinh, sinh đẻ, sống", partOfSpeech: "Danh từ / Động từ" },
  "师": { pinyin: "shī", translation: "thầy, người dạy", partOfSpeech: "Danh từ" },
  "老": { pinyin: "lǎo", translation: "già, đã lâu", partOfSpeech: "Tính từ" },
  "今": { pinyin: "jīn", translation: "nay, bây giờ", partOfSpeech: "Danh từ" },
  "年": { pinyin: "nián", translation: "năm", partOfSpeech: "Lượng từ" },
  "月": { pinyin: "yuè", translation: "tháng, mặt trăng", partOfSpeech: "Danh từ / Lượng từ" },
  "日": { pinyin: "rì", translation: "ngày, mặt trời", partOfSpeech: "Danh từ / Lượng từ" },
  "号": { pinyin: "hào", translation: "ngày (khẩu ngữ), số", partOfSpeech: "Danh từ / Lượng từ" },
  "岁": { pinyin: "suì", translation: "tuổi", partOfSpeech: "Lượng từ" },
  "叫": { pinyin: "jiào", translation: "gọi là, đặt tên", partOfSpeech: "Động từ" },
  "想": { pinyin: "xiǎng", translation: "muốn, nhớ, nghĩ", partOfSpeech: "Động từ năng nguyện" },
  "要": { pinyin: "yào", translation: "muốn, cần, phải", partOfSpeech: "Động từ năng nguyện" },
  "高": { pinyin: "gāo", translation: "cao, vui vẻ", partOfSpeech: "Tính từ" },
  "兴": { pinyin: "xìng", translation: "phấn khởi, vui dồi", partOfSpeech: "Tính từ" },
  "认": { pinyin: "rèn", translation: "nhận biết, thừa nhận", partOfSpeech: "Động từ" },
  "识": { pinyin: "shí", translation: "hiểu biết, nhận diện", partOfSpeech: "Động từ" },
  "什": { pinyin: "shén", translation: "gì, cái gì (trong cụm shénme)", partOfSpeech: "Đại từ" },
  "么": { pinyin: "me", translation: "trợ từ nghi vấn", partOfSpeech: "Trợ từ" },
  "名": { pinyin: "míng", translation: "tên, danh tiếng", partOfSpeech: "Danh từ" },
  "字": { pinyin: "zì", translation: "chữ viết, kí tự", partOfSpeech: "Danh từ" },
  "阿": { pinyin: "ā", translation: "từ đệm đầu câu xưng hô", partOfSpeech: "Trợ từ" },
  "姨": { pinyin: "yí", translation: "dì, cô", partOfSpeech: "Danh từ" },
  "请": { pinyin: "qǐng", translation: "mời, xin vui lòng", partOfSpeech: "Động từ" },
  "问": { pinyin: "wèn", translation: "hỏi", partOfSpeech: "Động từ" },
  "新": { pinyin: "xīn", translation: "mới, tân", partOfSpeech: "Tính từ" },
  "鲜": { pinyin: "xiān", translation: "tươi, ngon", partOfSpeech: "Tính từ" },
  "苹": { pinyin: "píng", translation: "táo (trong píngguǒ)", partOfSpeech: "Danh từ" },
  "果": { pinyin: "guǒ", translation: "quả, trái cây", partOfSpeech: "Danh từ" },
  "斤": { pinyin: "jīn", translation: "cân TQ (500g)", partOfSpeech: "Lượng từ" },
  "块": { pinyin: "kuài", translation: "đồng, tệ / miếng, mẩu", partOfSpeech: "Lượng từ" },
  "贵": { pinyin: "guì", translation: "đắt, quý giá", partOfSpeech: "Tính từ" },
  "宜": { pinyin: "yi", translation: "thích hợp", partOfSpeech: "Tính từ" },
  "点": { pinyin: "diǎn", translation: "chấm, ít, giờ, hạt", partOfSpeech: "Danh từ / Lượng từ" },
  "儿": { pinyin: "er", translation: "con cái / hậu tố âm uốn lưỡi", partOfSpeech: "Hậu tố / Trợ từ" },
  "给": { pinyin: "gěi", translation: "cho, đưa cho", partOfSpeech: "Giới từ / Động từ" },
  "微": { pinyin: "wēi", translation: "nhỏ, vi diệu", partOfSpeech: "Tính từ" },
  "信": { pinyin: "xìn", translation: "tin tức, lá thư, tin tưởng", partOfSpeech: "Danh từ / Động từ" },
  "支": { pinyin: "zhī", translation: "chi, chi trả / lượng từ vật dạng cây", partOfSpeech: "Động từ" },
  "付": { pinyin: "fù", translation: "trả tiền, nộp", partOfSpeech: "Động từ" },
  "当": { pinyin: "dāng", translation: "làm, đương nhiên", partOfSpeech: "Động từ" },
  "然": { pinyin: "rán", translation: "vậy, đúng vậy, nhiên", partOfSpeech: "Hậu từ" },
  "周": { pinyin: "zhōu", translation: "tuần, chu kỳ, chu vi", partOfSpeech: "Danh từ" },
  "末": { pinyin: "mò", translation: "cuối cùng, mạt", partOfSpeech: "Danh từ" },
  "打": { pinyin: "dǎ", translation: "đánh, đập, gõ, chơi thể thao", partOfSpeech: "Động từ" },
  "算": { pinyin: "suàn", translation: "tính toán, coi như", partOfSpeech: "Động từ" },
  "特": { pinyin: "tè", translation: "đặc biệt, vô cùng", partOfSpeech: "Tính từ" },
  "别": { pinyin: "bié", translation: "đừng / ly biệt / khác biệt", partOfSpeech: "Phó từ" },
  "运": { pinyin: "yùn", translation: "vận động, vận may / chở", partOfSpeech: "Danh từ" },
  "动": { pinyin: "dòng", translation: "động, chuyển động, làm", partOfSpeech: "Động từ" },
  "朋": { pinyin: "péng", translation: "bạn bè (trong péngyou)", partOfSpeech: "Danh từ" },
  "友": { pinyin: "yǒu", translation: "bạn hữu", partOfSpeech: "Danh từ" },
  "体": { pinyin: "tǐ", translation: "thân thể, thể dục", partOfSpeech: "Danh từ" },
  "育": { pinyin: "yù", translation: "giáo dục, nuôi nấng", partOfSpeech: "Danh từ" },
  "馆": { pinyin: "guǎn", translation: "quán (nhà nghỉ, hội quán, tiệm ăn)", partOfSpeech: "Danh từ" },
  "蓝": { pinyin: "lán", translation: "màu xanh lam", partOfSpeech: "Tính từ" },
  "球": { pinyin: "qiú", translation: "quả cầu, trái banh", partOfSpeech: "Danh từ" },
  "如": { pinyin: "rú", translation: "nếu như, ví như", partOfSpeech: "Liên từ" },
  "下": { pinyin: "xià", translation: "dưới, hạ xuống, sau", partOfSpeech: "Danh từ phương vị" },
  "雨": { pinyin: "yǔ", translation: "vưa, mưa", partOfSpeech: "Danh từ" },
  "歌": { pinyin: "gē", translation: "bài hát, ca khúc", partOfSpeech: "Danh từ" },
  "电": { pinyin: "diàn", translation: "điện", partOfSpeech: "Danh từ" },
  "影": { pinyin: "yǐng", translation: "bóng, phim ảnh", partOfSpeech: "Danh từ" },
  "静": { pinyin: "jìng", translation: "yên tĩnh, tĩnh mịch", partOfSpeech: "Tính từ" },
  "地": { pinyin: "de", translation: "trợ từ trạng ngữ (hoặc dì: mặt đất, đất)", partOfSpeech: "Trợ từ" },
  "写": { pinyin: "xiě", translation: "viết", partOfSpeech: "Động từ" },
  "汉": { pinyin: "hàn", translation: "người Hán, chữ Hán, đàn ông", partOfSpeech: "Danh từ" },
  "书": { pinyin: "shū", translation: "sách, viết chữ", partOfSpeech: "Danh từ" },
  "公": { pinyin: "gōng", translation: "công (công ty, công cộng)", partOfSpeech: "Tính từ" },
  "司": { pinyin: "sī", translation: "quản lý, ty (công ty)", partOfSpeech: "Danh từ" },
  "常": { pinyin: "cháng", translation: "thường thường, luôn", partOfSpeech: "Phó từ" },
  "非": { pinyin: "fēi", translation: "không phải, phi", partOfSpeech: "Phó từ" },
  "每": { pinyin: "měi", translation: "mỗi, mọi", partOfSpeech: "Đại từ" },
  "加": { pinyin: "jiā", translation: "thêm, tăng, cộng", partOfSpeech: "Động từ" },
  "班": { pinyin: "bān", translation: "lớp học, ca làm việc", partOfSpeech: "Danh từ" },
  "感": { pinyin: "gǎn", translation: "cảm thấy, cảm giác", partOfSpeech: "Động từ" },
  "觉": { pinyin: "jué", translation: "cảm thấy, nhận thức (hoặc jiào: giấc ngủ)", partOfSpeech: "Động từ" },
  "些": { pinyin: "xiē", translation: "một số, một ít, những", partOfSpeech: "Lượng từ" },
  "累": { pinyin: "lèi", translation: "mệt mỏi / dồn tích", partOfSpeech: "Tính từ" },
  "虽": { pinyin: "suī", translation: "tuy, dù (trong suīrán)", partOfSpeech: "Liên từ" },
  "辛": { pinyin: "xīn", translation: "vất vả, cay", partOfSpeech: "Tính từ" },
  "苦": { pinyin: "kǔ", translation: "khổ cực, đắng", partOfSpeech: "Tính từ" },
  "但": { pinyin: "dàn", translation: "nhưng, nhưng mà", partOfSpeech: "Liên từ" },
  "通": { pinyin: "tōng", translation: "thông suốt, đi qua / thông thạo", partOfSpeech: "Động từ" },
  "过": { pinyin: "guò", translation: "qua, trải qua / trợ từ đã từng", partOfSpeech: "Động từ" },
  "项": { pinyin: "xiàng", translation: "hạng mục, cổ", partOfSpeech: "Danh từ" },
  "目": { pinyin: "mù", translation: "mắt, danh mục", partOfSpeech: "Danh từ" },
  "宝": { pinyin: "bǎo", translation: "bảo bối, quý báu", partOfSpeech: "Danh từ" },
  "贝": { pinyin: "bèi", translation: "vỏ sò, bảo bối", partOfSpeech: "Danh từ" },
  "经": { pinyin: "jīng", translation: "qua, kinh qua, kinh điển", partOfSpeech: "Danh từ" },
  "验": { pinyin: "yàn", translation: "kiểm tra, chứng nghiệm", partOfSpeech: "Động từ" },
  "后": { pinyin: "hòu", translation: "sau, phía sau / hoàng hậu", partOfSpeech: "Danh từ phương vị" },
  "前": { pinyin: "qián", translation: "trước, phía trước", partOfSpeech: "Danh từ phương vị" },
  "定": { pinyin: "dìng", translation: "nhất định, cố định", partOfSpeech: "Phó từ" },
  "向": { pinyin: "xiàng", translation: "hướng về, đối với", partOfSpeech: "Giới từ" },
  "理": { pinyin: "lǐ", translation: "quản lý, lí lẽ, sửa sang", partOfSpeech: "Động từ" },
  "假": { pinyin: "jià", translation: "Kỳ nghỉ / nghỉ phép (hoặc jiǎ: giả tạo)", partOfSpeech: "Danh từ" },
  "海": { pinyin: "hǎi", translation: "biển, hải dương", partOfSpeech: "Danh từ" },
  "边": { pinyin: "biān", translation: "bên, bên cạnh, biên giới", partOfSpeech: "Danh từ phương vị" },
  "旅": { pinyin: "lǚ", translation: "lữ hành, du lịch", partOfSpeech: "Động từ" },
  "游": { pinyin: "yóu", translation: "du ngoạn, bơi lội", partOfSpeech: "Động từ" },
  "次": { pinyin: "cì", translation: "lần, thứ tự", partOfSpeech: "Lượng từ" },
  "服": { pinyin: "fú", translation: "phục tùng, quần áo, phục vụ", partOfSpeech: "Động từ" },
  "务": { pinyin: "wù", translation: "vụ, công việc, bắt buộc", partOfSpeech: "Danh từ" },
  "员": { pinyin: "yuán", translation: "thành viên, nhân viên", partOfSpeech: "Danh từ" },
  "鸳": { pinyin: "yuān", translation: "chim uyên", partOfSpeech: "Danh từ" },
  "鸯": { pinyin: "yāng", translation: "chim ương", partOfSpeech: "Danh từ" },
  "火": { pinyin: "huǒ", translation: "lửa, hoả", partOfSpeech: "Danh từ" },
  "锅": { pinyin: "guō", translation: "cái xoong, cái nồi", partOfSpeech: "Danh từ" },
  "辣": { pinyin: "là", translation: "cay, vị cay", partOfSpeech: "Tính từ" },
  "餐": { pinyin: "cān", translation: "thức ăn, bữa ăn", partOfSpeech: "Danh từ" },
  "肥": { pinyin: "féi", translation: "béo, phì nhiêu", partOfSpeech: "Tính từ" },
  "牛": { pinyin: "niú", translation: "con bò, ngưu", partOfSpeech: "Danh từ" },
  "豆": { pinyin: "dòu", translation: "hột đậu, đỗ", partOfSpeech: "Danh từ" },
  "腐": { pinyin: "fǔ", translation: "thối rữa, đậu phụ", partOfSpeech: "Danh từ" },
  "蔬": { pinyin: "shū", translation: "rau (nói chung)", partOfSpeech: "Danh từ" },
  "菜": { pinyin: "cài", translation: "rau, món ăn", partOfSpeech: "Danh từ" },
  "瓶": { pinyin: "píng", translation: "chai, lọ, bình", partOfSpeech: "Lượng từ" },
  "冰": { pinyin: "bīng", translation: "nước đá, đông lạnh", partOfSpeech: "Tính từ" },
  "镇": { pinyin: "zhèn", translation: "thị trấn / ướp đá / đè xuống", partOfSpeech: "Danh từ" },
  "谢": { pinyin: "xiè", translation: "cảm ơn, tạ ơn", partOfSpeech: "Động từ" }
};

// Simple helper to segment arbitrary text using a Maximum Matching lookup dictionary + single characters lookup.
// This prevents ANY call failure even when Gemini is completely 503 down.
export function offlineSegmentText(text: string, customDictKeys: string[] = []): Token[] {
  const tokens: Token[] = [];
  try {
     const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
     const segments = Array.from(segmenter.segment(text));
     
     const customDictSet = new Set(customDictKeys);
     const maxCustomLen = customDictKeys.reduce((max, key) => Math.max(max, key.length), 0);
     const maxVocabLen = Object.keys(OFFLINE_VOCAB_DICT).reduce((max, key) => Math.max(max, key.length), 0);
     const maxLength = Math.max(maxCustomLen, maxVocabLen, 5); // Minimum 5
     
     let i = 0;
     while (i < segments.length) {
         const segmentObj = segments[i];
         const segment = segmentObj.segment;
         const isWordLike = segmentObj.isWordLike;
         
         if (/^\s+$/.test(segment)) {
             tokens.push({ type: "whitespace", text: segment });
             i++;
             continue;
         }
         
         if (!isWordLike || /^[，。？！、；：‘’“”）（【】《》,.;:!?()'"\[\]]/.test(segment)) {
             tokens.push({ type: "punctuation", text: segment });
             i++;
             continue;
         }

         // Forward Maximum Matching for contiguous Chinese characters
         // We look ahead to merge segments if they form a word in customDict or OFFLINE_VOCAB_DICT
         let matched = false;
         for (let len = maxLength; len >= 2; len--) {
            // Build the combined string looking ahead 'len' segments
            let combinedStr = "";
            let k = 0;
            while (i + k < segments.length && combinedStr.length < len) {
               if (!segments[i+k].isWordLike) break;
               // Stop if non-chinese character encountered during merge lookahead (optional, but good for safety)
               if (!/[\u4e00-\u9fa5]/.test(segments[i+k].segment)) break;
               
               combinedStr += segments[i+k].segment;
               k++;

               if (combinedStr.length === len) {
                  if (customDictSet.has(combinedStr)) {
                     tokens.push({ type: "word", text: combinedStr, pinyin: "?", translation: "(Từ chưa rõ nghĩa)", partOfSpeech: "Từ vựng" });
                     i += k;
                     matched = true;
                     break;
                  } else if (OFFLINE_VOCAB_DICT[combinedStr]) {
                     const vocab = OFFLINE_VOCAB_DICT[combinedStr];
                     tokens.push({
                        type: "word",
                        text: combinedStr,
                        pinyin: vocab.pinyin,
                        translation: vocab.translation,
                        partOfSpeech: vocab.partOfSpeech,
                        example: vocab.example
                     });
                     i += k;
                     matched = true;
                     break;
                  }
               }
            }
            if (matched) break;
         }

         if (matched) continue;

         // No lookahead matched, process current standalone segment
         const vocab = OFFLINE_VOCAB_DICT[segment];
         if (vocab) {
            tokens.push({
               type: "word",
               text: segment,
               pinyin: vocab.pinyin,
               translation: vocab.translation,
               partOfSpeech: vocab.partOfSpeech,
               example: vocab.example
            });
         } else {
            let pinyin = "";
            let translationStr = "(Từ chưa rõ nghĩa)";
            let allCharsKnown = true;
            for(let j=0; j<segment.length; j++) {
                const charMatch = OFFLINE_CHAR_DICT[segment[j]];
                if (charMatch) {
                   pinyin += (pinyin ? " " : "") + charMatch.pinyin;
                } else {
                   allCharsKnown = false;
                }
            }
            
            // Further optimization: If Intl segmenter combined characters that shouldn't be combined
            // and we don't know the word, we force split it into single characters if they are known chars.
            if (segment.length > 1 && allCharsKnown && /[\u4e00-\u9fa5]/.test(segment)) {
                // Split them up since we don't have a compound meaning for it
                for(let j=0; j<segment.length; j++) {
                    const char = segment[j];
                    const charMatch = OFFLINE_CHAR_DICT[char];
                    if (charMatch) {
                        tokens.push({
                            type: "word",
                            text: char,
                            pinyin: charMatch.pinyin,
                            translation: charMatch.translation,
                            partOfSpeech: charMatch.partOfSpeech,
                            example: {
                                chinese: `${char}是常用的字。`,
                                pinyin: `${charMatch.pinyin} shì chángyòng de zì.`,
                                vietnamese: `"${char}" là một chữ hán rất thông dụng hằng ngày.`
                            }
                        });
                    }
                }
            } else if (segment.length === 1 && allCharsKnown && OFFLINE_CHAR_DICT[segment]) {
                const charMatch = OFFLINE_CHAR_DICT[segment];
                tokens.push({
                    type: "word",
                    text: segment,
                    pinyin: charMatch.pinyin,
                    translation: charMatch.translation,
                    partOfSpeech: charMatch.partOfSpeech,
                    example: {
                      chinese: `${segment}是常用的字。`,
                      pinyin: `${charMatch.pinyin} shì chángyòng de zì.`,
                      vietnamese: `"${segment}" là một chữ hán rất thông dụng hằng ngày.`
                    }
                });
            } else {
                tokens.push({
                   type: "word",
                   text: segment,
                   pinyin: pinyin || "?",
                   translation: translationStr,
                   partOfSpeech: "Từ vựng"
                });
            }
         }
         i++;
     }

     return tokens;
  } catch (e) {
    // Fallback if Intl.Segmenter is not available
    let index = 0;
    const len = text.length;

    while (index < len) {
      const char = text[index];

      // Handle standard whitespaces
      if (/\s/.test(char)) {
        let wsText = "";
        while (index < len && /\s/.test(text[index])) {
          wsText += text[index];
          index++;
        }
        tokens.push({ type: "whitespace", text: wsText });
        continue;
      }

      // Handle symbols and punctuations
      const isPunc = /^[，。？！、；：‘’“”）（【】《》,.;:!?()'"\[\]]/.test(char);
      if (isPunc) {
        tokens.push({ type: "punctuation", text: char });
        index++;
        continue;
      }

      // Attempt Maximum Matching against known Vocabs (Up to 6 Chinese characters)
      let matched = false;
      for (let currentLen = Math.min(6, len - index); currentLen >= 2; currentLen--) {
        const substring = text.substring(index, index + currentLen);
        if (OFFLINE_VOCAB_DICT[substring]) {
          const vocab = OFFLINE_VOCAB_DICT[substring];
          tokens.push({
            type: "word",
            text: substring,
            pinyin: vocab.pinyin,
            translation: vocab.translation,
            partOfSpeech: vocab.partOfSpeech,
            example: vocab.example
          });
          index += currentLen;
          matched = true;
          break;
        }
      }

      if (matched) continue;

      // Single character lookup fallback
      const singleChar = text[index];
      const dictMatch = OFFLINE_CHAR_DICT[singleChar];
      if (dictMatch) {
        tokens.push({
          type: "word",
          text: singleChar,
          pinyin: dictMatch.pinyin,
          translation: dictMatch.translation,
          partOfSpeech: dictMatch.partOfSpeech,
          example: {
            chinese: `${singleChar}是常用的字。`,
            pinyin: `${dictMatch.pinyin} shì chángyòng de zì.`,
            vietnamese: `"${singleChar}" là một chữ hán rất thông dụng hằng ngày.`
          }
        });
      } else {
        // Complete unknown (could be numbers, English, or exotic chars)
        const isWordType = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(singleChar);
        if (isWordType) {
          tokens.push({
            type: "word",
            text: singleChar,
            pinyin: "?",
            translation: "(Từ chưa rõ nghĩa)",
            partOfSpeech: "Từ vựng",
            example: {
              chinese: `这是个新词汇。`,
              pinyin: "zhè shì gè xīn cíhuì.",
              vietnamese: "Đây là một từ vựng mới mẻ đang đợi bạn khám phá sâu thêm!"
            }
          });
        } else {
          tokens.push({ type: "punctuation", text: singleChar });
        }
      }
      index++;
    }

    return tokens;
  }
}
