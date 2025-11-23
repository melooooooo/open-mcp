import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VALID_COMPANY_TYPES = ['民企', '央国企', '外企', '事业单位', '合资', '其他', '国企', '社会组织', '政府机关'];

const VALID_INDUSTRIES = [
  'IT/互联网/游戏', '专利/商标/知识产权', '交通/物流/仓储', '人力资源服务',
  '农林牧渔', '医疗/医药/生物', '咨询', '商务服务业', '快速消费品',
  '房地产业/建筑业', '政府/机构/组织', '教育/培训/科研', '文化/传媒/广告/体育',
  '新能源', '智能硬件', '未明确', '机械/制造业', '检测/认证',
  '汽车制造/维修/零配件', '法律', '生活服务业', '耐用消费品',
  '能源/化工/环保', '财务/审计/税务', '贸易/批发/零售', '通信/电子/半导体', '金融业'
];

async function main() {
  console.log('Verifying database data...');

  // 1. Check Total Count
  const { count, error: countError } = await supabase
    .from('job_listings')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    return;
  }

  console.log(`\nTotal Records in Database: ${count}`);

  // 2. Fetch all data for distribution check
  console.log('Fetching data stats...');

  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('job_listings')
      .select('company_type, industry_category')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching data:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allData = allData.concat(data);

    process.stdout.write(`\rFetched ${allData.length} records...`);

    if (data.length < pageSize) break;
    page++;
  }
  console.log('\nDone fetching.');

  const companyTypeStats: Record<string, number> = {};
  const industryStats: Record<string, number> = {};

  allData.forEach(row => {
    const cType = row.company_type || 'NULL';
    const iType = row.industry_category || 'NULL';

    companyTypeStats[cType] = (companyTypeStats[cType] || 0) + 1;
    industryStats[iType] = (industryStats[iType] || 0) + 1;
  });

  console.log('\n=== Company Type Distribution ===');
  const sortedCompanyTypes = Object.entries(companyTypeStats).sort((a, b) => b[1] - a[1]);
  sortedCompanyTypes.forEach(([key, val]) => console.log(`${key}: ${val}`));

  console.log('\n=== Industry Category Distribution ===');
  const sortedIndustries = Object.entries(industryStats).sort((a, b) => b[1] - a[1]);
  sortedIndustries.forEach(([key, val]) => console.log(`${key}: ${val}`));

  // Validation
  const invalidCompanyTypes = Object.keys(companyTypeStats).filter(t => !VALID_COMPANY_TYPES.includes(t));
  const invalidIndustries = Object.keys(industryStats).filter(t => !VALID_INDUSTRIES.includes(t));

  console.log('\n=== Validation Results ===');

  if (count === 0) {
    console.log('⚠️  Warning: Database is empty!');
  } else {
    if (invalidCompanyTypes.length === 0) {
      console.log('✅ All company types are valid.');
    } else {
      console.log('❌ Invalid company types found:', invalidCompanyTypes);
    }

    if (invalidIndustries.length === 0) {
      console.log('✅ All industry categories are valid.');
    } else {
      console.log('❌ Invalid industry categories found:', invalidIndustries);
    }
  }
}

main();
