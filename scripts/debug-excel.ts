import * as XLSX from 'xlsx';
import * as path from 'path';

const FILE_PATH = path.resolve(__dirname, '../秋招信息.xlsx');

function main() {
  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers and first few rows
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Total rows:', data.length);
    if (data.length > 0) {
      console.log('Headers (Row 0):', JSON.stringify(data[0], null, 2));
    }
    if (data.length > 1) {
      console.log('First Data Row (Row 1):', JSON.stringify(data[1], null, 2));
    }
    if (data.length > 2) {
      console.log('Second Data Row (Row 2):', JSON.stringify(data[2], null, 2));
    }


  } catch (error) {
    console.error('Error processing file:', error);
  }
}

main();
