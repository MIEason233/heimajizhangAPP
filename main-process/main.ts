import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase, getDatabase } from '../src/database/connection'
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../src/database/categories'
import { addRecord, getRecords, deleteRecord, getMonthlyStats } from '../src/database/records'

// ============================================================
// Electron 主进程 — 负责窗口管理、数据库、系统交互
// ============================================================

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: '黑马记账',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 开发模式加载 dev server，生产模式加载打包文件
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ============================================================
// App 生命周期
// ============================================================

app.whenReady().then(() => {
  // 初始化数据库（建表、插入预设分类）
  initDatabase()

  // 注册 IPC 通信接口（渲染进程 ↔ 主进程）
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================================
// IPC 通信处理 — 渲染进程通过 window.api 调用这些方法
// ============================================================

function registerIpcHandlers(): void {
  // ---- 分类相关 ----
  ipcMain.handle('categories:getAll', () => {
    return getAllCategories()
  })

  ipcMain.handle('categories:add', (_event, name: string, parentId: number | null, icon: string) => {
    try {
      return addCategory(name, parentId, icon)
    } catch (err) {
      console.error('添加分类失败:', err)
      throw err
    }
  })

  ipcMain.handle('categories:update', (_event, id: number, name: string, icon?: string) => {
    return updateCategory(id, name, icon)
  })

  ipcMain.handle('categories:delete', (_event, id: number) => {
    return deleteCategory(id)
  })

  // ---- 记账记录相关 ----
  ipcMain.handle('records:add', (_event, data: {
    amount: number
    date: string
    categoryId: number
    note: string
  }) => {
    return addRecord(data.amount, data.date, data.categoryId, data.note)
  })

  ipcMain.handle('records:getAll', (_event, filters?: { categoryId?: number; month?: string }) => {
    return getRecords(filters)
  })

  ipcMain.handle('records:delete', (_event, id: number) => {
    return deleteRecord(id)
  })

  ipcMain.handle('records:getMonthlyStats', (_event, month: string) => {
    return getMonthlyStats(month)
  })
}
