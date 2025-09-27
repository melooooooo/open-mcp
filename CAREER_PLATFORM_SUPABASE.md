# 秋招应届生辅导平台 - Supabase 架构设计文档

## 🚀 项目概述

基于 Supabase 构建的新一代秋招求职平台，充分利用 Supabase 的实时数据库、认证系统、存储服务和 Edge Functions，为应届生提供全方位的求职辅导服务。

### 🎯 核心优势
- **实时协作**：基于 Supabase Realtime 的实时内推状态更新
- **安全认证**：内置的多种认证方式（邮箱、手机、社交登录）
- **高性能存储**：简历、头像等文件的云端存储
- **智能推荐**：利用 PostgreSQL 的全文搜索和向量数据库能力
- **无服务器架构**：Edge Functions 处理复杂业务逻辑

---

## 🏗️ 技术架构

### Supabase 核心服务集成

```yaml
Supabase 服务架构:
  Database:
    - PostgreSQL 17.4 (托管数据库)
    - Row Level Security (RLS) 行级安全
    - Database Functions & Triggers
    - Full-text Search (全文搜索)
    - pgvector (向量搜索，用于智能匹配)
    
  Authentication:
    - Email/Password 认证
    - Phone/SMS 认证
    - OAuth (GitHub, Google, 微信)
    - Magic Link (无密码登录)
    - JWT Token 管理
    
  Storage:
    - 简历文件存储 (PDF, Word)
    - 用户头像/公司Logo
    - 经验分享附件
    - CDN 加速访问
    
  Realtime:
    - 内推状态实时更新
    - 职位发布即时通知
    - 在线聊天/咨询
    - 协作编辑简历
    
  Edge Functions:
    - AI 简历优化
    - 智能职位匹配
    - 数据统计分析
    - 第三方 API 集成
    
  Vector Embeddings:
    - 职位-简历智能匹配
    - 相似经验推荐
    - 语义搜索
```

### 前端技术栈（优化版）

```typescript
// 前端集成 Supabase
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase' // 自动生成的类型

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 技术栈
前端框架:
├── Next.js 15.3.1 (App Router)
├── @supabase/supabase-js (Supabase 客户端)
├── @supabase/auth-ui-react (认证UI组件)
├── @supabase/realtime-js (实时订阅)
├── TypeScript 5.7.3
├── Tailwind CSS + shadcn/ui
├── React Query (配合 Supabase)
└── Zustand (本地状态管理)
```

---

## 📊 Supabase 数据库设计

### 核心数据表结构

```sql
-- 用户扩展信息表（Supabase Auth 自动管理基础用户表）
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  education_level TEXT CHECK (education_level IN ('bachelor', 'master', 'phd')),
  target_locations TEXT[],
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_referrer BOOLEAN DEFAULT false,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看和编辑自己的资料
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 公司表
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  industry TEXT,
  size TEXT,
  funding_stage TEXT,
  website TEXT,
  locations TEXT[],
  benefits JSONB,
  culture_score DECIMAL(3,2),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 职位表（支持全文搜索）
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  job_type TEXT CHECK (job_type IN ('fulltime', 'intern', 'parttime')),
  education_requirement TEXT,
  experience_requirement TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  locations TEXT[],
  description TEXT,
  requirements TEXT[],
  benefits TEXT[],
  application_deadline DATE,
  status TEXT DEFAULT 'active',
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  -- 全文搜索向量
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('chinese', 
      coalesce(title, '') || ' ' || 
      coalesce(description, '') || ' ' ||
      coalesce(array_to_string(requirements, ' '), '')
    )
  ) STORED,
  -- 向量嵌入（用于智能匹配）
  embedding vector(1536),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建全文搜索索引
CREATE INDEX jobs_search_idx ON jobs USING GIN (search_vector);
-- 创建向量搜索索引
CREATE INDEX jobs_embedding_idx ON jobs USING ivfflat (embedding vector_cosine_ops);

-- 内推机会表（实时更新）
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  job_id UUID REFERENCES jobs(id),
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT[],
  quota_total INTEGER DEFAULT 5,
  quota_used INTEGER DEFAULT 0,
  valid_until DATE,
  success_rate DECIMAL(5,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE referrals;

-- 内推申请表（实时状态）
CREATE TABLE referral_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES referrals(id),
  applicant_id UUID REFERENCES profiles(id),
  resume_url TEXT,
  introduction TEXT,
  status TEXT DEFAULT 'pending',
  referral_code TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referral_id, applicant_id)
);

-- 启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE referral_applications;

-- 经验分享表
CREATE TABLE experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('interview', 'guide', 'review')),
  company_id UUID REFERENCES companies(id),
  job_title TEXT,
  title TEXT NOT NULL,
  content TEXT, -- Markdown 格式
  tags TEXT[],
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  helpful_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  -- 全文搜索
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('chinese', 
      coalesce(title, '') || ' ' || 
      coalesce(content, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 薪资数据表（匿名处理）
CREATE TABLE salaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  job_title TEXT,
  level TEXT,
  location TEXT,
  education TEXT,
  years_of_experience INTEGER,
  base_salary INTEGER,
  bonus INTEGER,
  stock_option INTEGER,
  total_compensation INTEGER,
  is_verified BOOLEAN DEFAULT false,
  year INTEGER,
  anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略：匿名查看
CREATE POLICY "Anonymous salary viewing" ON salaries
  FOR SELECT USING (
    anonymous = true OR auth.uid() = user_id
  );

-- 简历表（存储在 Storage）
CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  file_url TEXT, -- Supabase Storage URL
  content JSONB, -- 结构化简历数据
  template TEXT,
  is_public BOOLEAN DEFAULT false,
  ai_score DECIMAL(3,2), -- AI 评分
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 消息通知表（实时推送）
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT,
  title TEXT,
  content TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 数据库函数和触发器

```sql
-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
-- 统计职位浏览量
CREATE OR REPLACE FUNCTION increment_job_view_count(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs 
  SET view_count = view_count + 1 
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- 智能职位推荐（基于向量相似度）
CREATE OR REPLACE FUNCTION recommend_jobs(
  user_embedding vector(1536),
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  company_name TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    c.name,
    1 - (j.embedding <=> user_embedding) as similarity
  FROM jobs j
  JOIN companies c ON j.company_id = c.id
  WHERE j.status = 'active'
    AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> user_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 Supabase 认证集成

### 认证流程设计

```typescript
// 认证配置
// app/lib/supabase/auth.ts

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 注册新用户
export async function signUp(email: string, password: string, metadata: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // 存储额外信息
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

// 社交登录
export async function signInWithProvider(provider: 'github' | 'google') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

// 手机号登录
export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true
    }
  })
  return { data, error }
}

// 学生身份验证（使用 Edge Function）
export async function verifyStudentEmail(email: string) {
  const { data, error } = await supabase.functions.invoke('verify-student', {
    body: { email }
  })
  return { data, error }
}
```

### RLS (Row Level Security) 策略

```sql
-- 用户数据隔离
CREATE POLICY "Users can only see their own data"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- 公开数据查看
CREATE POLICY "Public job listings"
  ON jobs FOR SELECT
  USING (status = 'active');

-- 内推人权限
CREATE POLICY "Referrers can manage their referrals"
  ON referrals FOR ALL
  USING (auth.uid() = referrer_id);

-- 申请人权限
CREATE POLICY "Applicants can view their applications"
  ON referral_applications FOR SELECT
  USING (auth.uid() = applicant_id);
```

---

## 📦 Supabase Storage 配置

### 存储桶设计

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('resumes', 'resumes', false),
  ('company-logos', 'company-logos', true),
  ('attachments', 'attachments', false);

-- 存储策略
CREATE POLICY "Avatar upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Resume access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 文件上传示例

```typescript
// 上传简历
export async function uploadResume(file: File, userId: string) {
  const fileName = `${userId}/${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false
    })
    
  if (error) throw error
  
  // 获取公开URL
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName)
    
  return publicUrl
}
```

---

## ⚡ Supabase Edge Functions

### AI 简历优化函数

```typescript
// supabase/functions/optimize-resume/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { resume, jobDescription } = await req.json()
  
  // 调用 OpenAI API 优化简历
  const optimizedResume = await optimizeWithAI(resume, jobDescription)
  
  // 保存优化记录
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  await supabase.from('resume_optimizations').insert({
    user_id: req.headers.get('user-id'),
    original: resume,
    optimized: optimizedResume,
    job_description: jobDescription
  })
  
  return new Response(JSON.stringify({ optimizedResume }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 实时通知函数

```typescript
// supabase/functions/send-notification/index.ts
serve(async (req) => {
  const { userId, type, title, content } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // 插入通知
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    content
  })
  
  // 发送推送通知（可选）
  if (type === 'urgent') {
    await sendPushNotification(userId, title, content)
  }
  
  return new Response('OK')
})
```

---

## 🔄 Supabase Realtime 实时功能

### 内推状态实时更新

```typescript
// 监听内推申请状态变化
export function subscribeToApplicationStatus(applicationId: string) {
  return supabase
    .channel(`application:${applicationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'referral_applications',
        filter: `id=eq.${applicationId}`
      },
      (payload) => {
        console.log('Status updated:', payload.new.status)
        // 更新UI
        updateApplicationStatus(payload.new)
      }
    )
    .subscribe()
}

// 实时职位发布通知
export function subscribeToNewJobs(filters: any) {
  return supabase
    .channel('new-jobs')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'jobs',
        filter: buildFilter(filters)
      },
      (payload) => {
        // 显示新职位通知
        showNotification('New job posted!', payload.new)
      }
    )
    .subscribe()
}
```

---

## 🚀 部署架构

### Supabase 项目配置

```yaml
# supabase/config.toml
[project]
id = "nxnmvoqvotdpzurohzdg"
name = "career-platform"
region = "us-east-2"

[api]
enabled = true
url = "https://nxnmvoqvotdpzurohzdg.supabase.co"
key = "your-anon-key"

[database]
enabled = true
port = 5432
pool_size = 10

[storage]
enabled = true
file_size_limit = "50MB"

[auth]
site_url = "https://your-domain.com"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.sms]
enable_signup = true
enable_confirmations = true
```

### 环境变量配置

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://nxnmvoqvotdpzurohzdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 额外配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=秋招求职平台
```

---

## 📈 监控与分析

### Supabase Dashboard 指标

```sql
-- 创建分析视图
CREATE VIEW analytics_daily AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN type = 'signup' THEN user_id END) as new_users,
  COUNT(DISTINCT CASE WHEN type = 'login' THEN user_id END) as active_users,
  COUNT(CASE WHEN type = 'job_view' THEN 1 END) as job_views,
  COUNT(CASE WHEN type = 'application' THEN 1 END) as applications
FROM events
GROUP BY DATE(created_at);

-- 用户活跃度分析
CREATE VIEW user_engagement AS
SELECT 
  p.id,
  p.username,
  COUNT(DISTINCT j.id) as jobs_viewed,
  COUNT(DISTINCT ra.id) as applications_sent,
  COUNT(DISTINCT e.id) as experiences_shared,
  MAX(e.created_at) as last_active
FROM profiles p
LEFT JOIN job_views jv ON p.id = jv.user_id
LEFT JOIN jobs j ON jv.job_id = j.id
LEFT JOIN referral_applications ra ON p.id = ra.applicant_id
LEFT JOIN experiences e ON p.id = e.author_id
GROUP BY p.id, p.username;
```

---

## 🔧 开发工作流

### 1. 初始化 Supabase 项目

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到项目
supabase link --project-ref nxnmvoqvotdpzurohzdg

# 生成类型
supabase gen types typescript --project-id nxnmvoqvotdpzurohzdg > types/supabase.ts
```

### 2. 数据库迁移

```bash
# 创建迁移
supabase migration new create_career_tables

# 应用迁移
supabase db push

# 重置数据库（开发环境）
supabase db reset
```

### 3. 本地开发

```bash
# 启动本地 Supabase
supabase start

# 获取本地配置
supabase status

# 启动 Next.js
pnpm dev
```

---

## 🎯 实施计划

### Phase 1: 基础设施（第1周）
- [x] Supabase 项目创建和配置
- [ ] 数据库表结构创建
- [ ] RLS 策略配置
- [ ] Storage 桶设置
- [ ] 认证系统集成

### Phase 2: 核心功能（第2-3周）
- [ ] 用户注册/登录流程
- [ ] 职位发布和浏览
- [ ] 内推系统基础功能
- [ ] 简历上传和管理

### Phase 3: 实时功能（第4周）
- [ ] 实时状态更新
- [ ] 消息通知系统
- [ ] 在线聊天功能

### Phase 4: AI 功能（第5周）
- [ ] Edge Functions 部署
- [ ] AI 简历优化
- [ ] 智能职位推荐
- [ ] 语义搜索

### Phase 5: 优化和上线（第6周）
- [ ] 性能优化
- [ ] 安全审计
- [ ] 生产环境部署
- [ ] 监控配置

---

## 💡 最佳实践

### 1. 安全性
- 始终使用 RLS 保护数据
- 敏感操作使用 Service Role Key
- 定期审计权限策略

### 2. 性能优化
- 使用索引优化查询
- 实施分页和懒加载
- 缓存常用数据

### 3. 用户体验
- 实时反馈提升交互体验
- 离线支持和错误处理
- 渐进式功能加载

### 4. 可维护性
- 类型安全的数据库操作
- 模块化的函数设计
- 完善的错误日志

---

## 📚 相关资源

- [Supabase 文档](https://supabase.com/docs)
- [项目仪表板](https://app.supabase.com/project/nxnmvoqvotdpzurohzdg)
- [API 文档](https://nxnmvoqvotdpzurohzdg.supabase.co/rest/v1/)
- [实时订阅指南](https://supabase.com/docs/guides/realtime)

---

*本文档基于 Supabase 平台特性优化设计，充分利用其提供的各项服务，实现高效、安全、可扩展的秋招求职平台。*