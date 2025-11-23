import * as XLSX from 'xlsx';
import * as path from 'path';

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

function parseRow(rowString: string): JobRow | null {
  const tokens = rowString.trim().split(/\s+/);

  if (tokens.length < 10) {
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

  // Find Delivery anchor
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

  if (idxDelivery === -1) {
    idxDelivery = tokens.findIndex(t => t.includes('投递') && !t.includes('尽快投递'));
    if (idxDelivery === -1 && tokens.length > 15) {
      idxDelivery = tokens.length - 5;
    }
  }

  // Find Session anchor
  let searchEnd = idxDelivery !== -1 ? idxDelivery : tokens.length - 1;
  let idxSession = -1;

  for (let i = searchEnd - 1; i >= 0; i--) {
    const token = tokens[i];
    if (!token) continue;
    if (token.includes('届')) {
      if (/^\d/.test(token) || token.length < 8) {
        idxSession = i;
        break;
      }
    }
  }

  if (idxSession === -1) {
    idxSession = tokens.findIndex(t => t.includes('届') && (/^\d/.test(t) || t.length < 8));
  }

  if (idxSession === -1) {
    idxSession = tokens.findIndex(t => t.includes('届'));
  }

  if (idxSession === -1) {
    return null;
  }

  if (idxDelivery === -1) {
    idxDelivery = tokens.length - 5;
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
  if (!announcement_source && idxSession + 2 < tokens.length) {
    announcement_source = tokens[idxSession + 2] || '';
  }

  // Find company_type index
  let idxCompanyType = -1;
  for (let i = 2; i < Math.min(tokens.length, 10); i++) {
    if (tokens[i] && VALID_COMPANY_TYPES.includes(tokens[i])) {
      idxCompanyType = i;
      break;
    }
  }

  if (idxCompanyType === -1) {
    return null;
  }

  let serial_number = tokens[0] || '';
  let source_updated_at = tokens[1] || '';
  let company_name = tokens.slice(2, idxCompanyType).join(' ');
  let company_type = tokens[idxCompanyType] || '';
  let industry_category = tokens[idxCompanyType + 1] || '';

  // Validate industry category
  if (industry_category && !VALID_INDUSTRIES.includes(industry_category)) {
    return null;
  }

  let job_title = '';
  let work_location = '';
  let deadline = '';

  const session = tokens[idxSession] || '';
  const application_method = idxDelivery !== -1 ? tokens[idxDelivery] : "详见公告";

  // Find deadline
  if (idxSession > 0 && (tokens[idxSession - 1] === "尽快投递" || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(tokens[idxSession - 1] || ''))) {
    deadline = tokens[idxSession - 1] || '';
  }

  // Find location
  let idxLocationEnd = idxSession - 1;
  if (deadline && deadline === tokens[idxSession - 1]) {
    idxLocationEnd = idxSession - 2;
  }

  let idxLocationStart = idxLocationEnd;
  const minJobTitleStart = idxCompanyType + 2;
  while (idxLocationStart > minJobTitleStart) {
    const prevToken = tokens[idxLocationStart - 1];
    if (prevToken && prevToken.endsWith(',')) {
      idxLocationStart--;
    } else {
      break;
    }
  }

  if (idxLocationStart < minJobTitleStart) idxLocationStart = minJobTitleStart;
  if (idxLocationEnd < idxLocationStart) idxLocationEnd = idxLocationStart;

  work_location = tokens.slice(idxLocationStart, idxLocationEnd + 1).join(' ');
  job_title = tokens.slice(idxCompanyType + 2, idxLocationStart).join(' ');

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
    degree_requirement: null,
    batch: idxSession + 1 < tokens.length ? clean(tokens[idxSession + 1] || '') : null,
    announcement_source: clean(announcement_source),
    application_method: clean(application_method),
    remark: null,
    major_requirement: null,
    has_written_test: null,
    referral_code: null,
  };
}

async function main() {
  console.log(`Reading file from: ${FILE_PATH}`);

  const workbook = XLSX.readFile(FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
  console.log(`Found ${rawData.length} rows (including header).\n`);

  const jobs: JobRow[] = [];
  const companyTypeStats = new Map<string, number>();
  const industryStats = new Map<string, number>();

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || typeof row[0] !== 'string') continue;

    const parsed = parseRow(row[0]);
    if (parsed) {
      jobs.push(parsed);
      if (parsed.company_type) {
        companyTypeStats.set(parsed.company_type, (companyTypeStats.get(parsed.company_type) || 0) + 1);
      }
      if (parsed.industry_category) {
        industryStats.set(parsed.industry_category, (industryStats.get(parsed.industry_category) || 0) + 1);
      }
    }
  }

  console.log(`Successfully parsed ${jobs.length} jobs.\n`);

  console.log('=== 企业性质统计 ===');
  const sorted = Array.from(companyTypeStats.entries()).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });

  console.log('\n=== 行业分类统计 ===');
  const sortedIndustries = Array.from(industryStats.entries()).sort((a, b) => b[1] - a[1]);
  sortedIndustries.forEach(([industry, count]) => {
    console.log(`${industry}: ${count}`);
  });

  console.log('\n=== 前5条解析示例 ===');
  jobs.slice(0, 5).forEach((job, idx) => {
    console.log(`\n[${idx + 1}] ${job.company_name} (${job.company_type} - ${job.industry_category})`);
    console.log(`    岗位: ${job.job_title}`);
    console.log(`    地点: ${job.work_location}`);
  });

  // Check for any invalid company types
  const VALID_TYPES = ['民企', '央国企', '外企', '事业单位', '合资', '其他', '国企', '社会组织', '政府机关'];
  const invalidTypes = sorted.filter(([type]) => !VALID_TYPES.includes(type));

  // Check for any invalid industries
  const VALID_INDUSTRIES = [
    'IT/互联网/游戏', '专利/商标/知识产权', '交通/物流/仓储', '人力资源服务',
    '农林牧渔', '医疗/医药/生物', '咨询', '商务服务业', '快速消费品',
    '房地产业/建筑业', '政府/机构/组织', '教育/培训/科研', '文化/传媒/广告/体育',
    '新能源', '智能硬件', '未明确', '机械/制造业', '检测/认证',
    '汽车制造/维修/零配件', '法律', '生活服务业', '耐用消费品',
    '能源/化工/环保', '财务/审计/税务', '贸易/批发/零售', '通信/电子/半导体', '金融业'
  ];
  const invalidIndustries = sortedIndustries.filter(([ind]) => !VALID_INDUSTRIES.includes(ind));

  console.log('\n=== 验证结果 ===');
  if (invalidTypes.length > 0) {
    console.log('⚠️  发现无效的企业性质:');
    invalidTypes.forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}条`);
    });
  } else {
    console.log('✅ 所有企业性质都是有效的！');
  }

  if (invalidIndustries.length > 0) {
    console.log('\n⚠️  发现无效的行业分类:');
    invalidIndustries.forEach(([industry, count]) => {
      console.log(`  - ${industry}: ${count}条`);
    });
  } else {
    console.log('✅ 所有行业分类都是有效的！');
  }
}

main();
