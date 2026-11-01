import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace general chat error
pattern_chat = r'res\.status\(500\)\.json\(\{ error: "Lỗi máy chủ khi xử lý chat\." \}\);'
replacement_chat = r'''
      if (error.status === 429 || error.message?.includes('429')) {
        res.status(429).json({ error: "Đã vượt quá giới hạn lượt sử dụng AI (Quota exceeded). Vui lòng thử lại sau." });
      } else {
        res.status(500).json({ error: "Lỗi máy chủ khi xử lý chat." });
      }
'''
content = content.replace(pattern_chat, replacement_chat)

# Replace notebook chat error
pattern_notebook = r'res\.status\(500\)\.json\(\{ error: "Lỗi máy chủ khi xử lý notebook chat\." \}\);'
replacement_notebook = r'''
      if (error.status === 429 || error.message?.includes('429')) {
        res.status(429).json({ error: "Đã vượt quá giới hạn lượt sử dụng AI (Quota exceeded). Vui lòng thử lại sau." });
      } else {
        res.status(500).json({ error: "Lỗi máy chủ khi xử lý notebook chat." });
      }
'''
content = content.replace(pattern_notebook, replacement_notebook)

with open('server.ts', 'w') as f:
    f.write(content)

print("Done")
