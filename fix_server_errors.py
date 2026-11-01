import re

with open('server.ts', 'r') as f:
    content = f.read()

def replace_error(pattern, replacement):
    global content
    content = re.sub(pattern, replacement, content)

error_handler = """  } catch (err: any) {
    console.error("API error:", err);
    if (!res.headersSent) {
      let errorMessage = "Lỗi máy chủ khi xử lý yêu cầu.";
      const errMsg = (err.message || "").toLowerCase();
      if (err.status === 503 || errMsg.includes('503') || errMsg.includes('unavailable')) {
        errorMessage = "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau vài phút.";
      } else if (err.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted')) {
        errorMessage = "Hệ thống AI đang nhận quá nhiều yêu cầu hoặc đã hết hạn mức miễn phí. Vui lòng chờ 1-2 phút rồi thử lại.";
      }
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }"""

# For notebook-chat
notebook_pattern = r'\} catch \(error\) \{\s*console\.error\("Notebook Chat API error:", error\);\s*if \(!res\.headersSent\) \{\s*res\.status\(500\)\.json\(\{ error: "Lỗi máy chủ khi xử lý notebook chat." \}\);\s*\} else \{\s*res\.end\(\);\s*\}\s*\}'
content = re.sub(notebook_pattern, error_handler, content)

# For chat
chat_pattern = r'\} catch \(error\) \{\s*console\.error\("Chat API error:", error\);\s*if \(!res\.headersSent\) \{\s*res\.status\(500\)\.json\(\{ error: "Lỗi máy chủ khi xử lý chat." \}\);\s*\} else \{\s*res\.end\(\);\s*\}\s*\}'
content = re.sub(chat_pattern, error_handler, content)

with open('server.ts', 'w') as f:
    f.write(content)
print("Done server")
