import fs from 'fs'
const entries = JSON.parse(fs.readFileSync('/tmp/infonav.json','utf8'))
const existingDomains = new Set(['nowcoder.com','byr-navi.com','zhaopin.com','zhipin.com','lagou.com','shixiseng.com'])
const filtered = entries.filter(e => !existingDomains.has(e.domain))
const escape = (str) => str.replace(/'/g,"''")
const rows = filtered.map((site) => {
  const name = escape(site.name)
  const description = escape(site.description)
  const tags = site.tags.map(t => `'${escape(t)}'`).join(',')
  const tagsSql = site.tags.length ? `ARRAY[${tags}]` : 'NULL'
  const url = escape(site.url)
  return `('${name}','${name}',NULL,'${description}',ARRAY['全国'],${tagsSql},'${url}','${description}')`
})
const sql = `insert into career_platform.job_sites (title, company_name, company_logo, department, location, tags, website_url, description)
values\n${rows.join(',\n')};`
console.log(sql)
