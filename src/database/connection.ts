import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { insertPresetCategories } from './categories'

// ============================================================
// 数据库连接管理
// ============================================================

let db: Database.Database | null = null

/** 获取数据库文件路径（存在用户数据目录下） */
function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'heimajizhang.db')
}

/** 获取数据库实例 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()')
  }
  return db
}

/** 初始化数据库：建表 + 插入预设数据 */
export function initDatabase(): void {
  const dbPath = getDbPath()
  console.log('数据库路径:', dbPath)

  db = new Database(dbPath)

  // 启用 WAL 模式，提高写入性能
  db.pragma('journal_mode = WAL')

  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      icon TEXT DEFAULT '📌',
      sort_order INTEGER DEFAULT 0,
      is_preset INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  // 创建记账记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)

  // 创建索引（加速按日期和分类查询）
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
    CREATE INDEX IF NOT EXISTS idx_records_category ON records(category_id);
  `)

  // 插入预设分类（只在首次运行时插入）
  insertPresetCategories(db)

  console.log('数据库初始化完成')
}

/** 关闭数据库连接 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
