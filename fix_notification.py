import re

with open('src/components/NotebookChat.tsx', 'r') as f:
    content = f.read()

pattern = r'\{/\* Floating Notification for new features \*/\}\s*\{messages\.length === 1 &&  \(\s*<div className="mx-auto mb-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs flex items-center gap-2 border border-emerald-100 shadow-sm max-w-md text-center">\s*<BookOpen className="w-4 h-4" />\s*Gemini Notebook nay đã thông minh hơn\. Hãy thêm nguồn tài liệu để bắt đầu\.\s*</div>\s*\)\}'
content = re.sub(pattern, '', content)

# Also check the default message content
default_msg_pattern = r"Chào mừng bạn đến với Notebook Chat! Hãy thêm tài liệu vào cột bên trái và bắt đầu đặt câu hỏi\. Mình sẽ chỉ trả lời dựa trên những tài liệu bạn đã chọn\."
default_msg_replacement = "Chào mừng bạn đến với Notebook Chat! Mình sẽ tự động sử dụng danh sách từ vựng bạn đã lưu làm ngữ cảnh. Hãy đặt câu hỏi về các từ vựng của bạn nhé!"
content = content.replace(default_msg_pattern, default_msg_replacement)

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(content)

print("Done")
