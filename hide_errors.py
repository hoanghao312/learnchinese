import re

# 1. Update server.ts
with open('server.ts', 'r') as f:
    server_content = f.read()

# Replace all console.error for Gemini API calls with console.warn
server_content = re.sub(r'console\.error\("([^"]+)", err(or)?\);', r'console.warn("\1", err\2?.message || err\2);', server_content)
server_content = server_content.replace('console.warn("Lỗi hệ thống phân tích văn bản:", error?.message || error);', 'console.warn("Lỗi hệ thống phân tích văn bản:", error?.message || error);')

# specifically for Chat and Notebook Chat error handlers to return the nice message
chat_error_handler = """  } catch (err: any) {
    console.warn("API error:", err?.message || err);
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

server_content = re.sub(r'\} catch \(error: any\) \{\s*console\.warn\("Chat API error:", error\?\.message \|\| error\);\s*if \(!res\.headersSent\) \{\s*res\.status\(500\)\.json\(\{ error: "Lỗi máy chủ khi xử lý chat\." \}\);\s*\} else \{\s*res\.end\(\);\s*\}\s*\}', chat_error_handler, server_content)

with open('server.ts', 'w') as f:
    f.write(server_content)

# 2. Update AssistantChat.tsx
with open('src/components/AssistantChat.tsx', 'r') as f:
    assistant_content = f.read()

assistant_content = assistant_content.replace("console.error('Chat error:', error);", "console.warn('Chat warning (expected if overloaded):', error.message);")

with open('src/components/AssistantChat.tsx', 'w') as f:
    f.write(assistant_content)

# 3. Update NotebookChat.tsx
with open('src/components/NotebookChat.tsx', 'r') as f:
    notebook_content = f.read()

notebook_content = notebook_content.replace('console.error("Chat error:", error);', 'console.warn("Chat warning (expected if overloaded):", error.message);')

with open('src/components/NotebookChat.tsx', 'w') as f:
    f.write(notebook_content)

print("Done")
