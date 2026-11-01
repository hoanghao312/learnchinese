import * as fs from 'fs';
import mammoth from 'mammoth';

async function main() {
  const result = await mammoth.convertToHtml({ path: 'test.docx' });
  console.log(result.value);
}
// We need a test docx
