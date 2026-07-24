import type { RecordWithCategory, MonthlyStat } from '../types'
import { getDatabase } from './db'

// ============================================================
// 记账记录 — 数据库操作
// ============================================================

/** 新增一条记账记录 */
export function addRecord(
  amount: number,
  date: string,
  categoryId: number,
  note: string
): { id: number } {
  const db = getDatabase()
  const result = db.prepare(
    'INSERT INTO records (amount, date, category_id, note) VALUES (?, ?, ?, ?)'
  ).run(amount, date, categoryId, note)
  return { id: Number(result.lastInsertRowid) }
}

/** 查询记账记录（支持按分类、月份筛选，按日期倒序排列） */
export function getRecords(filters?: {
  categoryId?: number
  month?: string
}): RecordWithCategory[] {
  const db = getDatabase()

  let sql = `
    SELECT
      r.*,
      c.name as category_name,
      c.icon as category_icon,
      pc.id as parent_category_id,
      pc.name as parent_category_name,
      pc.icon as parent_category_icon
    FROM records r
    JOIN categories c ON r.category_id = c.id
    LEFT JOIN categories pc ON c.parent_id = pc.id
    WHERE 1=1
  `
  const params: (number | string)[] = []

  if (filters?.categoryId) {
    // 如果选了一级分类，筛选该一级分类下所有二级分类的记录
    sql += ` AND (c.parent_id = ? OR c.id = ?)`
    params.push(filters.categoryId, filters.categoryId)
  }

  if (filters?.month) {
    // 按月筛选：格式 YYYY-MM
    sql += ` AND strftime('%Y-%m', r.date) = ?`
    params.push(filters.month)
  }

  sql += ` ORDER BY r.date DESC, r.created_at DESC`

  return db.prepare(sql).all(...params) as RecordWithCategory[]
}

/** 删除一条记账记录 */
export function deleteRecord(id: number): { success: boolean } {
  const db = getDatabase()
  db.prepare('DELETE FROM records WHERE id = ?').run(id)
  return { success: true }
}

/** 获取月度统计：按一级分类汇总支出 */
export function getMonthlyStats(month: string): MonthlyStat[] {
  const db = getDatabase()

  const sql = `
    SELECT
      COALESCE(pc.name, c.name) as parent_category_name,
      COALESCE(pc.icon, c.icon) as parent_category_icon,
      SUM(r.amount) as total,
      COUNT(*) as count
    FROM records r
    JOIN categories c ON r.category_id = c.id
    LEFT JOIN categories pc ON c.parent_id = pc.id
    WHERE strftime('%Y-%m', r.date) = ?
    GROUP BY COALESCE(pc.id, c.id)
    ORDER BY total DESC
  `

  return db.prepare(sql).all(month) as MonthlyStat[]
}
