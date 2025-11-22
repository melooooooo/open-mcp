import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = path.resolve(__dirname, '../职位列表.xlsx');

interface JobRow {
  serial_number: string | null;
  source_updated_at: string | null;
  company_name: string | null;
  company_type: string | null;
  industry_category: string | null;
  job_title: string | null;
  work_location: string | null;
  deadline: string | null;
  session: string | null;
  degree_requirement: string | null;
  batch: string | null;
  announcement_source: string | null;
  application_method: string | null;
  remark: string | null;
  major_requirement: string | null;
  has_written_test: string | null;
  referral_code: string | null;
}

function cleanValue(value: string | undefined): string | null {
  if (!value || value === '/' || value.trim() === '') {
    return null;
  }
  return value.trim();
}

function parseRow(rowString: string): JobRow | null {
  // Remove leading/trailing spaces and split
  const tokens = rowString.trim().split(/\s+/);

  if (tokens.length < 10) {
    console.warn('Skipping row with too few tokens:', rowString.substring(0, 50));
    return null;
  }

  // 1. Find Anchor: Delivery (starts with "http" or looks like a link/email)
  // Expanded to include www, @ (email), and common domains
  let idxDelivery = tokens.findIndex(t =>
    t.startsWith('http') ||
    t.startsWith('www.') ||
    t.includes('@') ||
    t.includes('.com') ||
    t.includes('.cn') ||
    t.includes('.net') ||
    t.includes('.org') ||
    t.includes('.edu')
  );

  // Fallback if no URL found
  if (idxDelivery === -1) {
    // Try to find "投递" keyword, but exclude "尽快投递" (which is usually deadline)
    idxDelivery = tokens.findIndex(t => t.includes('投递') && !t.includes('尽快投递'));

    // If still not found, use heuristic based on end of string
    if (idxDelivery === -1) {
      // Assume it's roughly 5th from end if we have enough tokens
      if (tokens.length > 15) {
        idxDelivery = tokens.length - 5;
      }
    }
  }

  // 2. Find Anchor: Session (contains "届")
  // Search BACKWARDS from idxDelivery (or from end if idxDelivery is invalid/late)
  let searchEnd = idxDelivery !== -1 ? idxDelivery : tokens.length - 1;
  let idxSession = -1;

  for (let i = searchEnd - 1; i >= 0; i--) {
    const token = tokens[i];
    if (!token) continue;

    // Session usually starts with a digit (e.g. "2026届") and is relatively short
    if (token.includes('届')) {
      // Strict check: must start with digit or be very short (< 10 chars)
      // This avoids matching "福州市2026届..." which is a Source/Title
      if (/^\d/.test(token) || token.length < 8) {
        idxSession = i;
        break;
      }
    }
  }

  if (idxSession === -1) {
    // Fallback: search forward
    idxSession = tokens.findIndex(t => t.includes('届') && (/^\d/.test(t) || t.length < 8));
  }

  // If strict check failed, try loose check as last resort
  if (idxSession === -1) {
    idxSession = tokens.findIndex(t => t.includes('届'));
  }

  if (idxSession === -1) {
    console.warn('Skipping row: Could not find "届" anchor:', rowString.substring(0, 50));
    return null;
  }

  if (idxDelivery === -1) {
    idxDelivery = tokens.length - 5;
  }

  // Fields 1-5 (Indices 0-4)
  const serial_number = tokens[0];
  const source_updated_at = tokens[1];
  const company_name = tokens[2];
  const company_type = tokens[3];
  const industry_category = tokens[4];

  // Field 9 (Session)
  const session = tokens[idxSession];

  // Field 8 (Deadline)
  const deadline = tokens[idxSession - 1];

  // Field 7 (Location)
  let idxLocationEnd = idxSession - 2;
  let idxLocationStart = idxLocationEnd;

  while (idxLocationStart > 5) {
    const prevToken = tokens[idxLocationStart - 1];
    if (prevToken && prevToken.endsWith(',')) {
      idxLocationStart--;
    } else {
      break;
    }
  }

  if (idxLocationStart < 6) idxLocationStart = 6;
  if (idxLocationEnd < idxLocationStart) idxLocationEnd = idxLocationStart;

  const work_location = tokens.slice(idxLocationStart, idxLocationEnd + 1).join(' ');

  // Field 6 (Job Title)
  const job_title = tokens.slice(5, idxLocationStart).join(' ');

  // Field 12 (Source)
  const announcement_source = tokens[idxDelivery - 1];

  // Field 13 (Delivery)
  const application_method = tokens[idxDelivery];

  // Fields 10 & 11 (Degree & Batch)
  const midTokens = tokens.slice(idxSession + 1, idxDelivery - 1);

  let degree_requirement = '';
  let batch = '';

  const degreeKeywords = ['本科', '硕士', '博士', '大专', '学历'];
  const batchKeywords = ['实习', '秋招', '春招', '补录', '管培'];

  const degreeParts: string[] = [];
  const batchParts: string[] = [];

  for (const t of midTokens) {
    const isDegree = degreeKeywords.some(k => t.includes(k));
    const isBatch = batchKeywords.some(k => t.includes(k));

    if (isDegree) {
      degreeParts.push(t);
    } else if (isBatch) {
      batchParts.push(t);
    } else {
      if (batchParts.length === 0) {
        degreeParts.push(t);
      } else {
        batchParts.push(t);
      }
    }
  }

  degree_requirement = degreeParts.join(' ');
  batch = batchParts.join(' ');

  // Fields 14-17
  const endTokens = tokens.slice(idxDelivery + 1);

  let remark: string | undefined;
  let major_requirement: string | undefined;
  let has_written_test: string | undefined;
  let referral_code: string | undefined;

  if (endTokens.length >= 4) {
    referral_code = endTokens[endTokens.length - 1];
    has_written_test = endTokens[endTokens.length - 2];
    major_requirement = endTokens[endTokens.length - 3];
    remark = endTokens.slice(0, endTokens.length - 3).join(' ');
  } else {
    if (endTokens.length > 0) remark = endTokens[0];
    if (endTokens.length > 1) major_requirement = endTokens[1];
    if (endTokens.length > 2) has_written_test = endTokens[2];
  }

  return {
    serial_number: cleanValue(serial_number),
    source_updated_at: cleanValue(source_updated_at),
    company_name: cleanValue(company_name),
    company_type: cleanValue(company_type),
    industry_category: cleanValue(industry_category),
    job_title: cleanValue(job_title),
    work_location: cleanValue(work_location),
    deadline: cleanValue(deadline),
    session: cleanValue(session),
    degree_requirement: cleanValue(degree_requirement),
    batch: cleanValue(batch),
    announcement_source: cleanValue(announcement_source),
    application_method: cleanValue(application_method),
    remark: cleanValue(remark),
    major_requirement: cleanValue(major_requirement),
    has_written_test: cleanValue(has_written_test),
    referral_code: cleanValue(referral_code),
  };
}

async function main() {
  console.log(`Reading file from: ${FILE_PATH}`);

  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get raw strings (header: 1 gives array of arrays)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    console.log(`Found ${rawData.length} rows (including header).`);

    const jobs: JobRow[] = [];

    // Skip header (index 0)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || typeof row[0] !== 'string') continue;

      const parsed = parseRow(row[0]);
      if (parsed) {
        jobs.push(parsed);
      }
    }

    console.log(`Successfully parsed ${jobs.length} jobs.`);
    if (jobs.length > 0) {
      console.log('Sample parsed row:', JSON.stringify(jobs[0], null, 2));
    }

    console.log('Uploading to Supabase...');

    const BATCH_SIZE = 100;
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('job_listings')
        .insert(batch);

      if (error) {
        console.error(`Error uploading batch ${i / BATCH_SIZE + 1}:`, error);
      } else {
        if (i % 1000 === 0) console.log(`Uploaded ${i} / ${jobs.length}`);
      }
    }

    console.log('Done!');

  } catch (error) {
    console.error('Error processing file:', error);
  }
}

main();
