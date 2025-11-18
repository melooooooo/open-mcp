#!/bin/bash

# Logo Migration Script
# 此脚本将职位站点的 favicon 下载并上传到 R2，然后更新数据库

set -e  # 遇到错误立即退出

echo "==================================="
echo "Logo Migration to R2"
echo "==================================="
echo ""

# Step 1: 准备数据
echo "Step 1/3: Preparing data from database..."
node scripts/prepare-logos-data.mjs
if [ $? -ne 0 ]; then
    echo "❌ Failed to prepare data"
    exit 1
fi
echo "✓ Data prepared successfully"
echo ""

# Step 2: 下载并上传到 R2
echo "Step 2/3: Downloading favicons and uploading to R2..."
node scripts/migrate-logos-to-r2.mjs
if [ $? -ne 0 ]; then
    echo "❌ Failed to migrate logos to R2"
    exit 1
fi
echo "✓ Logos migrated to R2 successfully"
echo ""

# Step 3: 更新数据库
echo "Step 3/3: Updating database with R2 URLs..."
node scripts/update-logos-in-db.mjs
if [ $? -ne 0 ]; then
    echo "❌ Failed to update database"
    exit 1
fi
echo "✓ Database updated successfully"
echo ""

echo "==================================="
echo "✅ Logo migration completed!"
echo "==================================="

