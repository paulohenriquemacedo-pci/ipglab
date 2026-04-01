import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import xlsx from 'xlsx';

const docsDir = path.join(process.cwd(), '_docs_octomarques');
const outDir = path.join(docsDir, 'txt');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const files = fs.readdirSync(docsDir).filter(f => fs.statSync(path.join(docsDir, f)).isFile());

(async () => {
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(docsDir, file);
    const outPath = path.join(outDir, file + '.txt');
    try {
      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        fs.writeFileSync(outPath, result.value);
        console.log(`Extracted: ${file}`);
      } else if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        fs.writeFileSync(outPath, data.text);
        console.log(`Extracted: ${file}`);
      } else if (ext === '.xlsx') {
        const workbook = xlsx.readFile(filePath);
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
          text += `Sheet: ${sheetName}\n`;
          text += xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n\n';
        });
        fs.writeFileSync(outPath, text);
        console.log(`Extracted: ${file}`);
      }
    } catch(e) {
      console.error(`Error on ${file}:`, e.message);
    }
  }
})();
