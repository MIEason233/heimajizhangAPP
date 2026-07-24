import { contextBridge, ipcRenderer } from 'electron'

// ============================================================
// Preload 脚本 — 安全地在渲染进程和主进程之间建立桥梁
// 渲染进程通过 window.api 调用这些方法
// ============================================================

const api = {
  // ---- 分类 ----
  getCategories: (): Promise<any[]> =>
    ipcRenderer.invoke('categories:getAll'),

  addCategory: (name: string, parentId: number | null, icon: string): Promise<any> =>
    ipcRenderer.invoke('categories:add', name, parentId, icon),

  updateCategory: (id: number, name: string, icon?: string): Promise<any> =>
    ipcRenderer.invoke('categories:update', id, name, icon),

  deleteCategory: (id: number): Promise<any> =>
    ipcRenderer.invoke('categories:delete', id),

  // ---- 记账记录 ----
  addRecord: (data: { amount: number; date: string; categoryId: number; note: string }): Promise<any> =>
    ipcRenderer.invoke('records:add', data),

  getRecords: (filters?: { categoryId?: number; month?: string }): Promise<any[]> =>
    ipcRenderer.invoke('records:getAll', filters),

  deleteRecord: (id: number): Promise<any> =>
    ipcRenderer.invoke('records:delete', id),

  getMonthlyStats: (month: string): Promise<any[]> =>
    ipcRenderer.invoke('records:getMonthlyStats', month)
}

contextBridge.exposeInMainWorld('api', api)

// 类型声明（让 TypeScript 认识 window.api）
export type ElectronAPI = typeof api
