import { chromium } from 'playwright';

const JOBS_URL = 'http://localhost:30001/jobs';
const EXPECTED_SOURCES = [
  '牛客网招聘',
  '北邮人导航招聘',
  '智联招聘',
  'BOSS直聘',
  '拉勾招聘',
  '实习僧'
];

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(JOBS_URL, { waitUntil: 'networkidle' });

  for (const source of EXPECTED_SOURCES) {
    await page.waitForSelector(`text=${source}`, { timeout: 5000 });
  }

  console.log('Playwright verification passed: all sources visible on /jobs.');
  await browser.close();
}

run().catch(async (err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
