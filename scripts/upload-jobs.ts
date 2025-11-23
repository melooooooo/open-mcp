import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

  // Valid company types
  const VALID_COMPANY_TYPES = ['民企', '央国企', '外企', '事业单位', '合资', '其他', '国企', '社会组织', '政府机关'];

  // Valid industry categories
  const VALID_INDUSTRIES = [
    'IT/互联网/游戏', '专利/商标/知识产权', '交通/物流/仓储', '人力资源服务',
    '农林牧渔', '医疗/医药/生物', '咨询', '商务服务业', '快速消费品',
    '房地产业/建筑业', '政府/机构/组织', '教育/培训/科研', '文化/传媒/广告/体育',
    '新能源', '智能硬件', '未明确', '机械/制造业', '检测/认证',
    '汽车制造/维修/零配件', '法律', '生活服务业', '耐用消费品',
    '能源/化工/环保', '财务/审计/税务', '贸易/批发/零售', '通信/电子/半导体', '金融业'
  ];

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




  if (idxSession === -1) {
    // console.log(`Row ${rowIndex}: No session found`);
    return null;
  }

  // Extract Announcement Source
  let announcement_source = "";
  if (idxDelivery !== -1) {
    let idxSource = idxDelivery - 1;
    if (tokens[idxSource] === "投递方式：" || tokens[idxSource] === "投递方式") {
      idxSource--;
    }
    if (idxSource > idxSession) {
      announcement_source = tokens[idxSource] || '';
    }
  }
  // Fallback if not found by delivery anchor
  if (!announcement_source && idxSession + 2 < tokens.length) {
    announcement_source = tokens[idxSession + 2] || '';
  }


  // --- Field Mapping ---
  // Find company_type index (it should be one of the valid types)
  let idxCompanyType = -1;
  for (let i = 2; i < Math.min(tokens.length, 10); i++) {
    if (tokens[i] && VALID_COMPANY_TYPES.includes(tokens[i])) {
      idxCompanyType = i;
      break;
    }
  }

  // If company type not found in expected range, skip this row
  if (idxCompanyType === -1) {
    console.warn('Skipping row: Could not find valid company type:', rowString.substring(0, 80));
    return null;
  }

  let serial_number = tokens[0] || '';
  let source_updated_at = tokens[1] || '';
  // Company name is everything between source_updated_at and company_type
  let company_name = tokens.slice(2, idxCompanyType).join(' ');
  let company_type = tokens[idxCompanyType] || '';
  let industry_category = tokens[idxCompanyType + 1] || '';

  // Validate industry category
  if (industry_category && !VALID_INDUSTRIES.includes(industry_category)) {
    console.warn(`Skipping row: Invalid industry category '${industry_category}':`, rowString.substring(0, 80));
    return null;
  }

  // Job title, location, and deadline will be parsed later based on session anchor
  let job_title = '';
  let work_location = '';
  let deadline = '';

  // Standard mapping for Session and Delivery
  const session = tokens[idxSession] || '';
  const application_method = idxDelivery !== -1 ? tokens[idxDelivery] : "详见公告";

  // Find deadline (should be right before session)
  if (idxSession > 0 && (tokens[idxSession - 1] === "尽快投递" || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(tokens[idxSession - 1] || ''))) {
    deadline = tokens[idxSession - 1] || '';
  }

  // Smart Location & Job Title Parsing
  // Location is usually before Deadline (or Session if Deadline missing)
  let idxLocationEnd = idxSession - 1;
  if (deadline && deadline === tokens[idxSession - 1]) {
    idxLocationEnd = idxSession - 2;
  }

  // Find location start by looking backwards for tokens ending with comma
  let idxLocationStart = idxLocationEnd;
  const minJobTitleStart = idxCompanyType + 2; // After industry_category
  while (idxLocationStart > minJobTitleStart) {
    const prevToken = tokens[idxLocationStart - 1];
    // Heuristic: if previous token ends with comma, it's part of location
    if (prevToken && prevToken.endsWith(',')) {
      idxLocationStart--;
    } else {
      break;
    }
  }

  if (idxLocationStart < minJobTitleStart) idxLocationStart = minJobTitleStart;
  if (idxLocationEnd < idxLocationStart) idxLocationEnd = idxLocationStart;

  // Extract location and job title
  work_location = tokens.slice(idxLocationStart, idxLocationEnd + 1).join(' ');
  job_title = tokens.slice(idxCompanyType + 2, idxLocationStart).join(' ');

  // ... (rest of the parsing logic for degree, batch etc)

  // Helper to clean strings
  const clean = (s: string | null) => s?.replace(/[,，、]+$/, "") || null;

  return {
    serial_number: clean(serial_number),
    source_updated_at: clean(source_updated_at),
    company_name: clean(company_name),
    company_type: clean(company_type),
    industry_category: clean(industry_category),
    job_title: clean(job_title),
    work_location: clean(work_location),
    deadline: clean(deadline),
    session: clean(session),
    degree_requirement: null, // Will be filled by keyword search
    batch: idxSession + 1 < tokens.length ? clean(tokens[idxSession + 1] || '') : null,
    announcement_source: clean(announcement_source),
    application_method: clean(application_method),
    remark: null,
    major_requirement: null,
    has_written_test: null,
    referral_code: null,
  };
}

// SQL Helper Functions
function escapeSqlValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  // Escape special characters for PostgreSQL
  const escaped = value
    .replace(/\\/g, '\\\\')   // Backslash
    .replace(/'/g, "''")      // Single quote (SQL standard)
    .replace(/\n/g, '\\n')    // Newline
    .replace(/\r/g, '\\r')    // Carriage return
    .replace(/\t/g, '\\t');   // Tab

  return `'${escaped}'`;
}

function generateInsertSQL(jobs: JobRow[]): string[] {
  const BATCH_SIZE = 100;
  const sqlStatements: string[] = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);

    const values = batch.map(job => {
      return `  (${escapeSqlValue(job.serial_number)}, ${escapeSqlValue(job.source_updated_at)}, ${escapeSqlValue(job.company_name)}, ${escapeSqlValue(job.company_type)}, ${escapeSqlValue(job.industry_category)}, ${escapeSqlValue(job.job_title)}, ${escapeSqlValue(job.work_location)}, ${escapeSqlValue(job.deadline)}, ${escapeSqlValue(job.session)}, ${escapeSqlValue(job.degree_requirement)}, ${escapeSqlValue(job.batch)}, ${escapeSqlValue(job.announcement_source)}, ${escapeSqlValue(job.application_method)}, ${escapeSqlValue(job.remark)}, ${escapeSqlValue(job.major_requirement)}, ${escapeSqlValue(job.has_written_test)}, ${escapeSqlValue(job.referral_code)})`;
    }).join(',\n');

    const sql = `INSERT INTO job_listings (
  serial_number, source_updated_at, company_name, company_type, 
  industry_category, job_title, work_location, deadline, session, 
  degree_requirement, batch, announcement_source, application_method, 
  remark, major_requirement, has_written_test, referral_code
) VALUES
${values};`;

    sqlStatements.push(sql);
  }

  return sqlStatements;
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

    // Check mode: 'sql' or 'upload'
    const mode = process.argv[2] || 'upload';

    if (mode === 'sql') {
      console.log('\n=== Generating SQL files ===');

      // Create output directory
      const sqlDir = path.resolve(__dirname, 'sql');
      if (!require('fs').existsSync(sqlDir)) {
        require('fs').mkdirSync(sqlDir, { recursive: true });
      }

      // Generate SQL statements
      const sqlStatements = generateInsertSQL(jobs);

      // Save each batch to a file
      sqlStatements.forEach((sql, index) => {
        const filename = `batch_${String(index + 1).padStart(3, '0')}.sql`;
        const filepath = path.join(sqlDir, filename);
        require('fs').writeFileSync(filepath, sql, 'utf8');
      });

      // Generate manifest
      const manifest = {
        total_records: jobs.length,
        total_batches: sqlStatements.length,
        batch_size: 100,
        files: sqlStatements.map((_, index) => ({
          index: index + 1,
          file: `batch_${String(index + 1).padStart(3, '0')}.sql`,
          records: Math.min(100, jobs.length - index * 100)
        }))
      };

      const manifestPath = path.join(sqlDir, 'manifest.json');
      require('fs').writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      console.log(`\n✅ Generated ${sqlStatements.length} SQL files in: ${sqlDir}`);
      console.log(`📄 Manifest file: ${manifestPath}`);
      console.log(`\nNext steps:`);
      console.log(`1. Review the SQL files (optional)`);
      console.log(`2. Execute them using the MCP tool`);

      return;
    }

    // Original upload logic
    console.log('Uploading to Supabase...');

    const BATCH_SIZE = 20;
    const RETRY_COUNT = 3;
    const RETRY_DELAY = 1000; // 1 second

    // Helper function for sleep
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      let attempts = 0;
      let success = false;

      while (attempts < RETRY_COUNT && !success) {
        try {
          const { error } = await supabase
            .from('job_listings')
            .insert(batch);

          if (error) {
            throw error;
          }

          success = true;
          // Add a small delay to avoid hitting rate limits
          await sleep(100);
        } catch (error) {
          attempts++;
          console.error(`Error uploading batch ${Math.floor(i / BATCH_SIZE) + 1} (Attempt ${attempts}/${RETRY_COUNT}):`, error);
          if (attempts < RETRY_COUNT) {
            console.log(`Retrying in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY * attempts); // Exponential backoff-ish
          }
        }
      }

      if (!success) {
        console.error(`Failed to upload batch starting at index ${i} after ${RETRY_COUNT} attempts. Stopping.`);
        // Optionally process.exit(1) here if we want to stop completely
      } else {
        if ((i + BATCH_SIZE) % 500 < BATCH_SIZE) {
          console.log(`Uploaded ${Math.min(i + BATCH_SIZE, jobs.length)} / ${jobs.length}`);
        }
      }
    }

    console.log('Done!');

  } catch (error) {
    console.error('Error processing file:', error);
  }
}

main();
