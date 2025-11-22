import * as XLSX from 'xlsx';
import * as path from 'path';

const FILE_PATH = path.resolve(__dirname, '../职位列表.xlsx');
const TARGET_SERIALS = ['7808', '7777', '7765', '7764'];

function main() {
  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    console.log(`Searching for serials: ${TARGET_SERIALS.join(', ')}`);

    for (let i = 1; i < rawData.length; i++) {
      const rowLine = rawData[i][0];
      if (typeof rowLine !== 'string') continue;

      // Simple check if row starts with one of the serials
      const serial = rowLine.trim().split(/\s+/)[0];
      if (TARGET_SERIALS.includes(serial)) {
        console.log(`\n--- Found Serial ${serial} ---`);
        console.log('Raw Line:', rowLine);
        console.log('Tokens:', rowLine.trim().split(/\s+/));
      }
    }

  } catch (error) {
    console.error('Error processing file:', error);
  }
}

main();
