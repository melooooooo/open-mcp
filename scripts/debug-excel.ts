import * as XLSX from 'xlsx';
import * as path from 'path';

const FILE_PATH = path.resolve(__dirname, '../职位列表.xlsx');

function main() {
  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const row = data[1][0] as string; // First data row

    console.log('Row length:', row.length);
    console.log('Contains tabs?', row.includes('\t'));
    console.log('First 100 chars:', row.substring(0, 100));

    // Replace spaces with [S] to see them clearly
    console.log('Visualized:', row.replace(/ /g, '[S]'));

  } catch (error) {
    console.error('Error processing file:', error);
  }
}

main();
