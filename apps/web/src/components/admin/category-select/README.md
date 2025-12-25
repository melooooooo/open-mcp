# 分类级联选择组件

这是一个支持级联选择的分类选择组件，支持单选和多选模式，具有完整的状态管理功能。

## 功能特性

- ✅ 支持级联选择（父子分类结构）
- ✅ 支持单选和多选模式
- ✅ 搜索功能
- ✅ 完整的状态管理
- ✅ 与 React Hook Form 集成
- ✅ 可自定义样式和布局
- ✅ 支持键盘导航
- ✅ 响应式设计

## 组件结构

```
category-select/
├── README.md                    # 使用文档
├── index.ts                     # 导出文件
└── components/
    ├── CategorySelect.tsx       # 主组件
    ├── CascadeSelect.tsx        # 基础级联选择组件
    └── hooks/
        └── use-category-state.ts # 状态管理hook
```

## 使用方法

### 基础用法

```tsx
import { CategorySelect } from "@/components/admin/category-select";

function MyComponent() {
  const { data: categoriesData } = trpc.categories.search.useQuery({
    limit: 100,
    page: 1,
  });

  return (
    <Form {...(form as any)}>
      <CategorySelect
        categories={categoriesData?.data || []}
        name="categoryId"
        label="选择分类"
        description="选择一个分类"
        placeholder="选择分类..."
        multiple={false}
      />
    </Form>
  );
}
```

### 多选模式

```tsx
<CategorySelect
  categories={categories}
  name="categoryIds"
  label="选择分类"
  description="可以选择多个分类"
  placeholder="选择分类..."
  multiple={true}
/>
```

### 在 GitHub 应用创建中使用

```tsx
// 在 add-github-app.tsx 中
<FormField
  control={form.control as any}
  name="categoryId"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <CategorySelect
          categories={categoriesData?.data || []}
          name="categoryId"
          placeholder="选择应用分类（可选）"
          disabled={isPending}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `categories` | `Category[]` | `[]` | 分类数据数组 |
| `name` | `string` | - | 表单字段名称（必需） |
| `label` | `string` | - | 标签文本 |
| `description` | `string` | - | 描述文本 |
| `placeholder` | `string` | `"选择分类..."` | 占位符文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `multiple` | `boolean` | `false` | 是否多选模式 |
| `className` | `string` | - | 自定义样式类 |

## Category 接口

```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  slug: string;
  status: "online" | "offline";
}
```

## 状态管理 Hook

组件内部使用了 `useCategoryState` hook 来管理状态：

```tsx
import { useCategoryState } from "@/hooks/use-category-state";

const {
  selectedIds,           // 选中的ID数组
  selectedCategories,    // 选中的分类对象数组
  cascadeOptions,        // 级联结构数据
  handleSelect,          // 处理选择
  removeCategory,        // 移除分类
  clearSelection,        // 清空选择
  setSelection,          // 设置选择
  isSelected,           // 检查是否选中
  findCategoryById,      // 根据ID查找分类
} = useCategoryState({
  categories,
  initialSelectedIds: [],
  multiple: false,
});
```

## 数据库集成

### 后端 API 修改

1. **修改 tRPC 输入 schema**：

```typescript
// packages/trpc/routers/admin/apps.ts
createFromGitHub: adminProcedure.input(z.object({
  gitHubURL: z.string().url().startsWith("https://github.com/"),
  type: z.enum(["client", "server", "application"]),
  categoryId: z.string().optional(), // 新增
}))
```

2. **修改数据库访问层**：

```typescript
// packages/db/database/admin/apps.ts
createFromGitHub: async (data: {
  // ... 其他字段
  categoryId?: string; // 新增
}, createdBy: string) => {
  // 在创建应用时设置 categoryId
  const [app] = await tx.insert(apps).values({
    // ... 其他字段
    categoryId: data.categoryId,
  }).returning();
}
```

### 数据库 Schema

分类表支持父子关系：

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES categories(id),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'offline',
  -- ... 其他字段
);
```

## 演示页面

访问 `/admin/categories/demo` 可以查看组件的完整演示，包括：

- 单选模式演示
- 多选模式演示
- 状态管理演示
- 数据结构展示

## 注意事项

1. **性能优化**：组件会自动构建级联结构，对于大量数据建议使用虚拟滚动
2. **表单集成**：组件依赖 React Hook Form，确保在 Form 组件内使用
3. **数据格式**：确保分类数据包含 `parentId` 字段来构建级联关系
4. **状态同步**：组件会自动同步表单状态和内部状态

## 扩展功能

可以根据需要扩展以下功能：

- 虚拟滚动支持
- 拖拽排序
- 自定义渲染
- 异步加载子分类
- 分类图标支持
- 键盘快捷键

## 故障排除

### 常见问题

1. **分类不显示**：检查 `categories` 数据是否正确加载
2. **级联结构错误**：确保 `parentId` 字段正确设置
3. **表单验证失败**：检查 `name` 属性是否与表单字段匹配
4. **样式问题**：确保引入了必要的 CSS 样式

### 调试技巧

1. 使用演示页面测试组件功能
2. 检查浏览器控制台的错误信息
3. 使用 React DevTools 查看组件状态
4. 验证数据结构是否符合接口定义 