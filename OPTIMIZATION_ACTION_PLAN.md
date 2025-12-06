# 性能优化实施计划

## 第一阶段：紧急修复 (1-2天)

### 任务 1: 修复404图片错误
**文件**: `apps/web/src/components/career/home-client-new.tsx` 或相关组件

**问题**: 默认图片路径不存在
```
https://store.yinhangbang.com/experiences/images/default.jpg
```

**解决方案**:
1. 检查数据库中的图片路径
2. 添加默认图片到正确位置
3. 添加图片加载错误处理

```tsx
// 示例代码
<Image
  src={experience.image || '/images/default-experience.jpg'}
  alt={experience.title}
  onError={(e) => {
    e.currentTarget.src = '/images/default-experience.jpg'
  }}
/>
```

### 任务 2: 优化主页数据获取
**文件**: `apps/web/src/components/career/home-data-wrapper-new.tsx`

**当前问题**: 串行数据获取，响应时间2.79秒

**优化方案**:
```tsx
export async function HomeDataWrapperNew() {
  // 并行获取所有数据
  const [jobSites, { items: experiences }, latestJobListings, referrals, stats] = 
    await Promise.all([
      getJobs(),
      getExperiencesList({ limit: 5 }),
      getLatestJobListings(5),
      getReferrals(8),
      getStats() // 将统计查询封装为单独函数
    ])

  return (
    <HomeClientNew
      jobSites={jobSites}
      experiences={experiences}
      latestJobListings={latestJobListings}
      referrals={referrals}
      stats={stats}
    />
  )
}

// 新增统计函数
async function getStats() {
  const supabase = await createServerSupabaseClient()
  
  const [
    { count: jobSitesCount },
    { count: experiencesCount },
    { count: jobListingsCount }
  ] = await Promise.all([
    supabase.from('cp_job_sites').select('*', { count: 'exact', head: true }),
    supabase.from('finance_experiences').select('*', { count: 'exact', head: true }),
    supabase.from('job_listings').select('*', { count: 'exact', head: true })
  ])

  return {
    totalJobSites: jobSitesCount || 0,
    totalExperiences: experiencesCount || 0,
    totalJobListings: jobListingsCount || 0,
  }
}
```

### 任务 3: 添加页面缓存
**文件**: `apps/web/src/app/(web)/page.tsx`

**优化方案**:
```tsx
// 添加重新验证时间
export const revalidate = 3600 // 1小时

export default function Home() {
  return <HomeDataWrapperNew />
}
```

## 第二阶段：图片优化 (2-3天)

### 任务 4: 全面使用 Next.js Image 组件
**影响文件**: 
- `apps/web/src/components/career/home-client-new.tsx`
- `apps/web/src/app/(web)/experiences/page.tsx`
- `apps/web/src/app/(web)/jobs/page.tsx`

**优化步骤**:
1. 查找所有 `<img>` 标签
2. 替换为 Next.js `<Image>` 组件
3. 添加适当的尺寸和懒加载

**示例**:
```tsx
import Image from 'next/image'

// 替换前
<img src={logo} alt={name} />

// 替换后
<Image
  src={logo}
  alt={name}
  width={120}
  height={40}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
/>
```

### 任务 5: 配置图片优化选项
**文件**: `apps/web/next.config.mjs`

**添加配置**:
```js
const nextConfig = {
  // ... 现有配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      // ... 现有配置
    ],
  },
}
```

## 第三阶段：代码优化 (3-5天)

### 任务 6: 实施代码分割
**文件**: 各个页面组件

**优化方案**:
```tsx
import dynamic from 'next/dynamic'

// 动态导入非关键组件
const ExperienceCard = dynamic(() => import('./ExperienceCard'), {
  loading: () => <Skeleton />,
  ssr: true
})

const ReferralSection = dynamic(() => import('./ReferralSection'), {
  loading: () => <Skeleton />,
  ssr: false // 如果不需要SEO
})
```

### 任务 7: 优化字体加载
**文件**: `apps/web/src/app/layout.tsx`

**优化方案**:
```tsx
import { Geist, Geist_Mono } from 'next/font/google'

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-geist-sans',
  fallback: ['system-ui', 'arial']
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-geist-mono',
  fallback: ['Courier New', 'monospace']
})
```

### 任务 8: 修复 Umami 配置
**文件**: 查找 Umami 配置文件

**解决方案**:
1. 检查环境变量中的 `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
2. 确保在生产环境中正确配置
3. 添加条件渲染，仅在配置存在时加载

## 第四阶段：性能监控 (持续)

### 任务 9: 添加 Web Vitals 监控
**文件**: `apps/web/src/app/layout.tsx`

**实施方案**:
```tsx
// 创建 web-vitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)
    // 发送到分析服务
    if (window.umami) {
      window.umami.track('web-vitals', {
        name: metric.name,
        value: metric.value
      })
    }
  })
  
  return null
}
```

## 验证清单

每个任务完成后，需要验证：
- [ ] 页面加载时间是否改善
- [ ] 控制台是否有新的错误或警告
- [ ] 图片是否正常显示
- [ ] 功能是否正常工作
- [ ] 移动端是否正常

## 性能测试工具

使用以下工具进行测试：
1. Chrome DevTools Performance
2. Lighthouse
3. WebPageTest
4. Next.js 内置分析工具

## 预期时间表

- 第一阶段: 2天
- 第二阶段: 3天
- 第三阶段: 5天
- 总计: 10个工作日

## 成功指标

- 页面加载时间 < 3秒
- Lighthouse 性能分数 > 90
- 首次内容绘制 < 1.8秒
- 最大内容绘制 < 2.5秒
- 无404错误
- 无控制台警告

