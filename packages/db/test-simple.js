/**
 * 简单的数据库配置检查
 * 不依赖 pg 模块
 */

// 尝试加载 .env 文件
try {
  require('dotenv').config({ path: '../../.env' });
} catch (e) {
  // 如果 dotenv 不存在，尝试手动读取
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      });
    }
  } catch (e) {
    // 忽略错误
  }
}

console.log('===== 数据库配置检查 =====\n');

// 检查环境变量
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('❌ 未找到数据库配置\n');
  console.log('📝 配置说明：');
  console.log('================\n');
  console.log('1. 在项目根目录创建 .env 文件');
  console.log('2. 添加以下配置之一：\n');
  console.log('   本地开发:');
  console.log('   DATABASE_URL=postgresql://starter:starter@localhost:5432/starter\n');
  console.log('   Supabase (如果使用):');
  console.log('   DATABASE_URL=你的Supabase连接字符串\n');
  console.log('3. 确保 PostgreSQL 服务运行中：');
  console.log('   brew services start postgresql  # macOS');
  console.log('   docker run -p 5432:5432 -e POSTGRES_PASSWORD=starter postgres  # Docker\n');
} else {
  console.log('✅ 找到数据库配置\n');
  
  // 解析URL
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
  if (match) {
    console.log('📊 配置详情：');
    console.log(`   用户名: ${match[1]}`);
    console.log(`   主机: ${match[3]}`);
    console.log(`   数据库: ${match[4]}`);
    console.log(`   密码: ****\n`);
    
    // 判断是否为Supabase
    const hostPort = match[3];
    const host = hostPort.split(':')[0];
    
    if (hostPort.includes('supabase')) {
      console.log('🎉 检测到 Supabase 数据库！');
    } else if (host === 'localhost' || host === '127.0.0.1') {
      console.log('💻 使用本地 PostgreSQL 数据库');
    } else {
      console.log('☁️  使用远程 PostgreSQL 数据库');
    }
  }
}

console.log('\n📋 下一步操作：');
console.log('================\n');
console.log('1. 初始化数据库表：');
console.log('   cd packages/db');
console.log('   pnpm db:push      # 推送 schema 到数据库');
console.log('   pnpm db:migrate   # 或运行迁移\n');
console.log('2. 查看数据库：');
console.log('   pnpm db:studio    # 打开 Drizzle Studio 可视化界面\n');

console.log('🔍 关于 Supabase 说明：');
console.log('=======================\n');
console.log('• Supabase 是一个开源的 Firebase 替代品');
console.log('• 提供托管的 PostgreSQL 数据库');
console.log('• 本项目可以使用任何 PostgreSQL 数据库（本地或 Supabase）');
console.log('• 只需配置正确的 DATABASE_URL 即可\n');

console.log('===== 检查完成 =====\n');

// 尝试检查 package.json 中的数据库脚本
try {
  const packageJson = require('./package.json');
  if (packageJson.scripts) {
    console.log('可用的数据库命令：');
    Object.keys(packageJson.scripts)
      .filter(key => key.includes('db'))
      .forEach(key => {
        console.log(`  pnpm ${key}`);
      });
  }
} catch (e) {
  // 忽略错误
}

process.exit(0);