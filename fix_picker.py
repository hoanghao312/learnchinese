import re

with open('src/components/Practice.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'\{showDrivePicker && \([\s\S]*?<GoogleDrivePickerModal[\s\S]*?/>\s*\)\}', '', content)

with open('src/components/Practice.tsx', 'w') as f:
    f.write(content)
