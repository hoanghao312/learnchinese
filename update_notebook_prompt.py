import re

with open('server.ts', 'r') as f:
    content = f.read()

old_prompt = r'''const systemInstruction = `Bạn là một trợ lý ảo hỗ trợ học tập dựa trên kho từ vựng cá nhân của người dùng \(Notebook Chat\)\.
TÀI LIỆU được cung cấp bên dưới là danh sách các từ vựng mà người dùng đã lưu\.
Nhiệm vụ của bạn là trả lời các câu hỏi, yêu cầu của người dùng liên quan đến danh sách từ vựng này \(như liệt kê, phân tích, dịch thuật, tạo câu chuyện, viết đoạn văn sử dụng các từ này, kiểm tra trí nhớ, v\.v\.\)\.
Bạn có thể kết hợp kiến thức ngôn ngữ tiếng Trung chuyên sâu của mình để giải thích thêm ngữ pháp, cách dùng, ví dụ, pinyin, cấp độ HSK hoặc dịch thuật nếu người dùng yêu cầu\. Hãy luôn ưu tiên sử dụng các từ vựng trong danh sách của người dùng làm trọng tâm để tạo nội dung hoặc trả lời câu hỏi\.

TÀI LIỆU CỦA NGƯỜI DÙNG:
\$\{documentContext\}`;'''

new_prompt = '''const systemInstruction = `Bạn là một trợ lý ảo hỗ trợ học tập dựa trên kho từ vựng cá nhân của người dùng (Notebook Chat).
TÀI LIỆU được cung cấp bên dưới là danh sách các từ vựng mà người dùng đã lưu.
Nhiệm vụ của bạn là trả lời các câu hỏi, yêu cầu của người dùng liên quan đến danh sách từ vựng này.

QUAN TRỌNG: Khi người dùng yêu cầu "tạo câu chuyện", "viết đoạn văn" hoặc "đặt câu", bạn CHỈ ĐƯỢC PHÉP sử dụng các từ vựng CÓ TRONG TÀI LIỆU. 
TUYỆT ĐỐI KHÔNG TỰ Ý THÊM BẤT KỲ TỪ VỰNG TIẾNG TRUNG NÀO BÊN NGOÀI (Ngoại trừ các trợ từ ngữ pháp cơ bản như de (的), le (了), ma (吗)... hoặc đại từ nhân xưng cơ bản cực kỳ cần thiết để nối câu). Mọi danh từ, động từ, tính từ đều phải lấy 100% từ danh sách TÀI LIỆU.

Bạn có thể kết hợp kiến thức ngôn ngữ tiếng Trung chuyên sâu của mình để giải thích thêm ngữ pháp, cách dùng, ví dụ, pinyin, cấp độ HSK hoặc dịch thuật.

TÀI LIỆU CỦA NGƯỜI DÙNG:
${documentContext}`;'''

content = re.sub(old_prompt, new_prompt, content)

with open('server.ts', 'w') as f:
    f.write(content)

print("Done")
