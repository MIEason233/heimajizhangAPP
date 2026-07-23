import type Database from 'better-sqlite3'
import type { Category } from '../types'

// ============================================================
// 预设分类数据（见 CLAUDE.md 分类体系设计）
// ============================================================

interface PresetCategory {
  name: string
  icon: string
  children: { name: string; icon: string }[]
}

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    name: '餐饮饮食', icon: '🍜',
    children: [
      { name: '早餐', icon: '🥐' },
      { name: '午餐', icon: '🍱' },
      { name: '晚餐', icon: '🍲' },
      { name: '零食饮料', icon: '🧋' },
      { name: '外卖', icon: '🥡' },
      { name: '聚餐请客', icon: '🍻' }
    ]
  },
  {
    name: '交通出行', icon: '🚗',
    children: [
      { name: '公交地铁', icon: '🚇' },
      { name: '网约车/出租车', icon: '🚕' },
      { name: '加油充电', icon: '⛽' },
      { name: '停车费', icon: '🅿️' },
      { name: '火车飞机', icon: '✈️' },
      { name: '共享单车', icon: '🚲' }
    ]
  },
  {
    name: '购物消费', icon: '🛒',
    children: [
      { name: '衣服鞋帽', icon: '👗' },
      { name: '数码产品', icon: '📱' },
      { name: '日用品', icon: '🧴' },
      { name: '美妆护肤', icon: '💄' },
      { name: '烟酒茶叶', icon: '🍷' },
      { name: '其他购物', icon: '🛍️' }
    ]
  },
  {
    name: '住房居家', icon: '🏠',
    children: [
      { name: '房租/房贷', icon: '🏘️' },
      { name: '水电燃气', icon: '💡' },
      { name: '物业费', icon: '🏢' },
      { name: '家具家电', icon: '🛋️' },
      { name: '维修保养', icon: '🔧' },
      { name: '宽带通讯', icon: '📶' }
    ]
  },
  {
    name: '娱乐休闲', icon: '🎮',
    children: [
      { name: '电影演出', icon: '🎬' },
      { name: '游戏充值', icon: '🎮' },
      { name: '旅游度假', icon: '🏖️' },
      { name: '运动健身', icon: '🏋️' },
      { name: '宠物开销', icon: '🐱' },
      { name: '其他娱乐', icon: '🎯' }
    ]
  },
  {
    name: '医疗健康', icon: '💊',
    children: [
      { name: '看病买药', icon: '🏥' },
      { name: '体检检查', icon: '🩺' },
      { name: '保健品', icon: '💊' },
      { name: '健身卡', icon: '🏃' }
    ]
  },
  {
    name: '教育学习', icon: '📚',
    children: [
      { name: '课程培训', icon: '📖' },
      { name: '图书资料', icon: '📕' },
      { name: '文具用品', icon: '✏️' },
      { name: '考试报名', icon: '📝' }
    ]
  },
  {
    name: '人情往来', icon: '🎁',
    children: [
      { name: '红包礼物', icon: '🧧' },
      { name: '婚礼生日', icon: '🎂' },
      { name: '孝敬父母', icon: '👨‍👩‍👦' },
      { name: '慈善捐款', icon: '🤝' }
    ]
  },
  {
    name: '金融理财', icon: '💰',
    children: [
      { name: '银行手续费', icon: '🏦' },
      { name: '保险保费', icon: '🛡️' },
      { name: '投资亏损', icon: '📉' },
      { name: '贷款利息', icon: '💳' }
    ]
  },
  {
    name: '其他支出', icon: '📦',
    children: [
      { name: '快递物流', icon: '📦' },
      { name: '办公用品', icon: '🖊️' },
      { name: '其他杂项', icon: '📌' }
    ]
  }
]

// ============================================================
// 数据库操作
// ============================================================

/** 插入预设分类（仅在 categories 表为空时执行） */
export function insertPresetCategories(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (count.count > 0) return // 已有数据，跳过

  const insertCategory = db.prepare(
    'INSERT INTO categories (name, parent_id, icon, sort_order, is_preset) VALUES (?, ?, ?, ?, 1)'
  )

  const insertMany = db.transaction(() => {
    PRESET_CATEGORIES.forEach((cat, i) => {
      const result = insertCategory.run(cat.name, null, cat.icon, i)
      const parentId = result.lastInsertRowid as number
      cat.children.forEach((child, j) => {
        insertCategory.run(child.name, parentId, child.icon, j)
      })
    })
  })

  insertMany()
}

/** 获取所有分类（含层级结构） */
export function getAllCategories(): Category[] {
  const db = getDB()
  return db.prepare(
    'SELECT * FROM categories ORDER BY parent_id IS NULL DESC, sort_order ASC'
  ).all() as Category[]
}

/** 添加自定义分类 */
export function addCategory(name: string, parentId: number | null, icon: string): { id: number } {
  const db = getDB()
  const result = db.prepare(
    'INSERT INTO categories (name, parent_id, icon, is_preset) VALUES (?, ?, ?, 0)'
  ).run(name, parentId || null, icon)
  return { id: Number(result.lastInsertRowid) }
}

/** 删除分类（预设分类不可删除，只能删除用户自定义的） */
export function deleteCategory(id: number): { success: boolean } {
  const db = getDB()
  const cat = db.prepare('SELECT is_preset FROM categories WHERE id = ?').get(id) as Category | undefined
  if (!cat || cat.is_preset === 1) {
    return { success: false }
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  return { success: true }
}

// 循环引用处理：在 connection.ts 的 initDatabase 之后才能用 getDatabase
function getDB(): Database.Database {
  const { getDatabase } = require('./connection')
  return getDatabase()
}
