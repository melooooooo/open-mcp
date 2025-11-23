import * as fs from "fs";
import * as path from "path";
import * as xlsx from "xlsx";

const filePath = path.resolve(__dirname, "../职位列表.xlsx");

function isDate(str: string): boolean {
  return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str);
}

function isDeadline(str: string): boolean {
  return str === "尽快投递" || isDate(str);
}

function parseRow(rowString: string, rowIndex: number) {
  if (!rowString || !rowString.trim()) return null;

  // Split by whitespace
  const tokens = rowString.trim().split(/\s+/);

  // 1. Find Delivery Anchor (http/www/@)
  let idxDelivery = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].toLowerCase();
    if (
      (t.startsWith("http") ||
        t.startsWith("www.") ||
        t.includes("@") ||
        /\.(com|cn|net|org|edu)/.test(t)) &&
      !t.includes("尽快投递")
    ) {
      idxDelivery = i;
      break;
    }
  }

  // 2. Find Session Anchor (must be before Delivery)
  let idxSession = -1;
  const searchEnd = idxDelivery !== -1 ? idxDelivery : tokens.length;
  for (let i = searchEnd - 1; i >= 0; i--) {
    const t = tokens[i];
    // Strict session check: must start with digit (e.g. 2026届) or be very short
    if (t.includes("届") && (/^\d/.test(t) || t.length < 10)) {
      idxSession = i;
      break;
    }
  }

  if (idxSession === -1) {
    // console.log(`Row ${rowIndex}: No session found`);
    return null;
  }

  // Extract Announcement Source (usually after Session)
  // Standard: Session -> Batch -> Announcement Source
  // But sometimes Batch is missing.
  // Announcement Source is usually the token before "投递方式" (Delivery) if Delivery exists.
  // Or it's just after Session/Batch.

  let announcement_source = "";
  // Heuristic: If Delivery exists, Announcement Source is likely the token before it (ignoring "投递方式" label)
  if (idxDelivery !== -1) {
    let idxSource = idxDelivery - 1;
    if (tokens[idxSource] === "投递方式：" || tokens[idxSource] === "投递方式") {
      idxSource--;
    }
    // If the token before delivery is "remark" or something, we might need to be careful.
    // But usually: ... [Session] [Batch] [Source] [Delivery] ...

    // Let's look at the range between Session and Delivery
    if (idxSource > idxSession) {
      // Join tokens between Session and Delivery (excluding Batch if possible)
      // Usually tokens[idxSession+1] is Batch (e.g. 秋招专场)
      // tokens[idxSession+2] is Source

      if (idxSource === idxSession + 1) {
        announcement_source = tokens[idxSource];
      } else if (idxSource >= idxSession + 2) {
        announcement_source = tokens[idxSource];
      }
    }
  }

  // --- NEW LOGIC START ---
  let company_name = tokens[2];
  let job_title = tokens[5]; // Standard index
  let work_location = tokens[6]; // Standard index

  // Check for shifted row
  // If tokens[2] is a Deadline ("尽快投递") or Date, it's likely shifted.
  if (tokens.length > 2 && (tokens[2] === "尽快投递" || isDate(tokens[2]))) {
    console.log(`\n[SHIFTED ROW DETECTED] Row ${rowIndex}`);
    console.log(`Token[2] is: ${tokens[2]}`);

    // Strategy:
    // tokens[0] -> Job Title
    // tokens[1] -> Work Location
    // tokens[2] -> Deadline
    // tokens[3] -> Session

    job_title = tokens[0];
    work_location = tokens[1];
    company_name = announcement_source; // Use Source as Company Name

    console.log(`Mapped Job Title: ${job_title}`);
    console.log(`Mapped Location: ${work_location}`);
    console.log(`Mapped Company (from Source): ${company_name}`);
    console.log(`Original Tokens:`, tokens.slice(0, 5));

    return {
      status: "shifted",
      company_name,
      job_title,
      work_location,
      announcement_source
    };
  }

  return { status: "normal" };
}

async function main() {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

  console.log(`Total rows: ${data.length}`);

  let shiftedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0) {
      const result = parseRow(row[0], i + 1);
      if (result && result.status === "shifted") {
        shiftedCount++;
        if (shiftedCount > 10) break; // Only show first 10
      }
    }
  }
  console.log(`\nTotal Shifted Rows Found: ${shiftedCount}`);
}

main();
