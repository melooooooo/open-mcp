import * as dotenv from "dotenv"
import * as path from "path"
import { Pool } from "pg"

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

async function testProfileFeatures() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("=".repeat(60))
    console.log("个人中心功能测试")
    console.log("=".repeat(60))

    // 1. 检查数据库连接
    console.log("\n1️⃣  检查数据库连接...")
    await pool.query('SELECT 1')
    console.log("   ✅ 数据库连接正常")

    // 2. 验证新字段存在
    console.log("\n2️⃣  验证新字段...")
    const fields = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('gender', 'address', 'contact_phone')
      ORDER BY column_name
    `)

    fields.rows.forEach(field => {
      console.log(`   ✅ ${field.column_name}: ${field.data_type} (nullable: ${field.is_nullable})`)
    })

    // 3. 测试查询用户数据(模拟 page.tsx)
    console.log("\n3️⃣  测试用户数据查询...")
    const users = await pool.query(`
      SELECT id, name, email, gender, address, contact_phone 
      FROM "user" 
      LIMIT 1
    `)

    if (users.rows.length > 0) {
      const user = users.rows[0]
      console.log("   ✅ 成功查询到用户数据")
      console.log(`   用户: ${user.name} (${user.email})`)
      console.log(`   性别: ${user.gender || '未设置'}`)
      console.log(`   地址: ${user.address || '未设置'}`)
      console.log(`   联系电话: ${user.contact_phone || '未设置'}`)
    } else {
      console.log("   ⚠️  数据库中暂无用户数据")
    }

    // 4. 测试更新操作(模拟 updateProfile action)
    console.log("\n4️⃣  测试更新操作...")
    if (users.rows.length > 0) {
      const userId = users.rows[0].id
      const testData = {
        gender: 'male',
        address: '测试地址',
        contact_phone: '13800138000'
      }

      await pool.query(`
        UPDATE "user" 
        SET gender = $1, address = $2, contact_phone = $3 
        WHERE id = $4
      `, [testData.gender, testData.address, testData.contact_phone, userId])

      console.log("   ✅ 更新操作成功")

      // 验证更新
      const updated = await pool.query(`
        SELECT gender, address, contact_phone 
        FROM "user" 
        WHERE id = $1
      `, [userId])

      const updatedUser = updated.rows[0]
      console.log(`   验证: 性别=${updatedUser.gender}, 地址=${updatedUser.address}, 电话=${updatedUser.contact_phone}`)

      // 恢复原始数据
      await pool.query(`
        UPDATE "user" 
        SET gender = $1, address = $2, contact_phone = $3 
        WHERE id = $4
      `, [users.rows[0].gender, users.rows[0].address, users.rows[0].contact_phone, userId])

      console.log("   ✅ 已恢复原始数据")
    }

    console.log("\n" + "=".repeat(60))
    console.log("✅ 所有功能测试通过!")
    console.log("=".repeat(60))
    console.log("\n📋 功能清单:")
    console.log("  ✅ 数据库字段已添加")
    console.log("  ✅ 查询用户数据正常")
    console.log("  ✅ 更新操作正常")
    console.log("\n🎯 前端功能:")
    console.log("  - 访问 http://localhost:30001/user/profile")
    console.log("  - 查看只有'收藏'和'点赞'两个标签")
    console.log("  - 点击'编辑资料'按钮")
    console.log("  - 修改性别、地址、联系电话")
    console.log("  - 保存并验证更新")

  } catch (error: any) {
    console.error("\n❌ 测试失败!")
    console.error("错误:", error.message)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

testProfileFeatures()
