import Database from 'better-sqlite3'

// ============================================================
// 数据库实例持有者（独立模块，避免循环依赖）
// connection.ts 设置实例，categories.ts / records.ts 获取实例
// ============================================================

let db: Database.Database | null = null

/** 获取数据库实例 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()')
  }
  return db
}

/** 设置数据库实例（由 connection.ts 在初始化时调用） */
export function setDatabase(database: Database.Database): void {
  db = database
}

/** 关闭数据库连接 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
