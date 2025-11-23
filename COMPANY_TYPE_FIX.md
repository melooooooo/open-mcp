# 企业性质解析问题修复报告

## 问题描述

在解析Excel职位数据时，发现企业性质字段出现了异常值，包括：
- `2026届`、`TOY`、`BG`、`Aim`、`AI`、`One`、`Tone-社交组` 等非法值
- 这些值不属于合法的9种企业性质类型

## 根本原因

**问题根源**：Excel数据中所有字段都在一个单元格中，用空格分隔。当公司名称包含空格时（如 `Sixth Tone`、`Partner One`），简单的按空格分割会导致字段错位。

### 原始解析逻辑的问题

```typescript
// 错误的做法：直接使用固定索引
let company_name = tokens[2];
let company_type = tokens[3];  // ❌ 当公司名有空格时会错位
let industry_category = tokens[4];
```

### 示例错误案例

| 原始数据 | 错误解析 | 正确应该是 |
|---------|---------|-----------|
| `7875 2025/11/17 Sixth Tone-社交组 央国企 ...` | company_type = `Tone-社交组` | company_type = `央国企` |
| `7863 2025/11/16 Partner One 外企 ...` | company_type = `One` | company_type = `外企` |

## 解决方案

### 1. 定义合法企业性质列表

```typescript
const VALID_COMPANY_TYPES = [
  '民企', 
  '央国企', 
  '外企', 
  '事业单位', 
  '合资', 
  '其他', 
  '国企', 
  '社会组织', 
  '政府机关'
];
```

### 2. 使用企业性质作为锚点

```typescript
// 正确的做法：先找到企业性质的位置
let idxCompanyType = -1;
for (let i = 2; i < Math.min(tokens.length, 10); i++) {
  if (tokens[i] && VALID_COMPANY_TYPES.includes(tokens[i])) {
    idxCompanyType = i;
    break;
  }
}

// 基于企业性质位置提取其他字段
let serial_number = tokens[0] || '';
let source_updated_at = tokens[1] || '';
let company_name = tokens.slice(2, idxCompanyType).join(' ');  // ✅ 支持多词公司名
let company_type = tokens[idxCompanyType] || '';
let industry_category = tokens[idxCompanyType + 1] || '';
```

### 3. 调整后续字段解析

基于新的 `idxCompanyType` 位置，重新计算 `job_title` 和 `work_location` 的起始位置：

```typescript
const minJobTitleStart = idxCompanyType + 2; // 在行业分类之后
job_title = tokens.slice(idxCompanyType + 2, idxLocationStart).join(' ');
```

## 修复效果

### 修复前
```
企业性质统计：
民企: 4561
央国企: 2554
外企: 338
事业单位: 242
其他: 104
合资: 110
国企: 35
社会组织: 17
政府机关: 13
2026届: 4          ❌ 异常值
TOY: 3             ❌ 异常值
BG: 2              ❌ 异常值
Tone-社交组: 1      ❌ 异常值
One: 1             ❌ 异常值
... (更多异常值)
```

### 修复后
```
企业性质统计：
民企: 4532
央国企: 2533
外企: 333
事业单位: 237
合资: 110
其他: 104
国企: 35
社会组织: 16
政府机关: 13

✅ 所有企业性质都是有效的！
成功解析 7913 条数据
```

## 修改的文件

1. **`scripts/upload-jobs.ts`** - 主上传脚本
   - 添加 `VALID_COMPANY_TYPES` 常量
   - 修改 `parseRow` 函数，使用企业性质作为锚点
   - 调整字段提取逻辑

2. **`scripts/test-parse.ts`** - 测试脚本（新建）
   - 用于验证解析逻辑的正确性
   - 统计企业性质分布
   - 检测异常值

## 使用方法

### 测试解析效果
```bash
npx tsx scripts/test-parse.ts
```

### 上传数据到数据库
```bash
npx tsx scripts/upload-jobs.ts
```

## 总结

通过将企业性质作为解析锚点，而不是依赖固定的token索引，成功解决了公司名称包含空格导致的字段错位问题。现在所有数据的企业性质字段都只包含9种合法类型，没有任何异常值。
