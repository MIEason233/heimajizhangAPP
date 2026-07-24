// ============================================================
// 数据模型类型定义
// ============================================================

/** 分类 */
export interface Category {
  id: number
  name: string
  parent_id: number | null   // null = 一级分类，有值 = 二级分类
  icon: string                // emoji 图标
  sort_order: number
  is_preset: number           // 1 = 预设（不可删除），0 = 用户自定义
}

/** 一级分类（含子分类列表） */
export interface CategoryWithChildren extends Category {
  children: Category[]
}

/** 记账记录 */
export interface Record {
  id: number
  amount: number
  date: string              // YYYY-MM-DD 格式
  category_id: number
  note: string
  created_at: string
}

/** 记账记录（含关联的分类信息，用于列表展示） */
export interface RecordWithCategory extends Record {
  category_name: string
  category_icon: string
  parent_category_id: number | null
  parent_category_name: string
  parent_category_icon: string
}

/** 月度统计项 */
export interface MonthlyStat {
  category_name: string
  category_icon: string
  parent_category_name: string
  total: number
  count: number
}

/** 新增记录的提交数据 */
export interface AddRecordData {
  amount: number
  date: string
  categoryId: number
  note: string
}

/** Electron API 类型声明（通过 preload 暴露到渲染进程） */
declare global {
  interface Window {
    api: {
      getCategories: () => Promise<Category[]>
      addCategory: (name: string, parentId: number | null, icon: string) => Promise<{ id: number }>
      updateCategory: (id: number, name: string, icon?: string) => Promise<{ success: boolean }>
      deleteCategory: (id: number) => Promise<{ success: boolean }>
      addRecord: (data: AddRecordData) => Promise<{ id: number }>
      getRecords: (filters?: { categoryId?: number; month?: string }) => Promise<RecordWithCategory[]>
      deleteRecord: (id: number) => Promise<{ success: boolean }>
      getMonthlyStats: (month: string) => Promise<MonthlyStat[]>
    }
  }
}

export {}
