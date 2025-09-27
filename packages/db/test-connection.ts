/**
 * 数据库连接测试脚本
 * 测试当前项目的数据库配置是否正常
 */

import { Pool } from 'pg';

async function testConnection() {
  console.log('===== 数据库连接测试 =====\n');
  
  // 使用项目的默认配置
  const databaseUrl = process.env.DATABASE_URL || 
                     process.env.POSTGRES_URL || 
                     'postgresql://starter:starter@localhost:5432/starter';
  
  console.log('📊 测试配置：');
  
  // 解析并显示连接信息（隐藏密码）
  const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
  if (urlMatch) {
    console.log(`  用户: ${urlMatch[1]}`);
    console.log(`  主机: ${urlMatch[3]}`);
    console.log(`  数据库: ${urlMatch[4]}`);
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('\n🔄 连接中...');
    const client = await pool.connect();
    
    console.log('✅ 连接成功！\n');
    
    // 获取版本
    const version = await client.query('SELECT version()');
    console.log('PostgreSQL版本:');
    console.log(version.rows[0].version.split('on')[0].trim());
    
    // 获取表数量
    const tables = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log(`\n数据库表数量: ${tables.rows[0].count}`);
    
    // 检查主要表是否存在
    const mainTables = ['mcpApps', 'repos', 'users', 'ads'];
    console.log('\n检查核心表:');
    
    for (const tableName of mainTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = $1
        )
      `, [tableName]);
      
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
    }
    
    client.release();
    
    console.log('\n===== 测试完成 =====\n');
    console.log('💡 数据库状态说明：');
    console.log('-------------------');
    console.log('• 当前项目使用 PostgreSQL + Drizzle ORM');
    console.log('• 不使用 Supabase，但可以通过修改 DATABASE_URL 连接到 Supabase');
    console.log('• 如需初始化数据库表，请运行: pnpm db:push 或 pnpm db:migrate');
    
    return true;
  } catch (error: any) {
    console.error('\n❌ 连接失败！');
    console.error('错误:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决方案：');
      console.log('1. 确保 PostgreSQL 已安装并运行');
      console.log('2. macOS: brew services start postgresql');
      console.log('3. Linux: sudo systemctl start postgresql');
      console.log('4. Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=starter -e POSTGRES_USER=starter -e POSTGRES_DB=starter postgres');
    } else if (error.code === '28P01') {
      console.log('\n💡 用户名或密码错误，请检查配置');
    } else if (error.code === '3D000') {
      console.log('\n💡 数据库不存在，请先创建：');
      console.log('createdb starter');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

// 运行测试
testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('脚本错误:', err);
    process.exit(1);
  });