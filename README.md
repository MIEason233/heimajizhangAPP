# 黑马记账 🐴

一个简洁好用的桌面记账应用，帮你轻松管理日常花销。

> 🖥️ 支持 Windows 和 macOS | 💰 专注人民币记账 | 🔒 数据全部存储在本地

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📝 **记一笔** | 记录支出：金额、日期、分类、备注 |
| 📋 **花销列表** | 按时间倒序查看所有记录，支持按分类和月份筛选 |
| 📂 **分类管理** | 预设 10 大类 + 40+ 小类，还可自己新增/修改/删除 |
| 📊 **统计概览** | 按月查看支出汇总，饼图 + 柱状图直观展示 |

---

## 🎯 特点

- 🔒 **数据安全**：所有数据存在本地 SQLite 数据库，不上传任何服务器
- 🌐 **无需联网**：全部功能离线可用
- 🎨 **界面美观**：使用 Ant Design 组件库，操作体验流畅
- 🗂️ **分类完整**：内置餐饮、交通、购物等 10 大类 40+ 小类，覆盖日常生活

---

## 📸 界面截图

> 启动应用后可以看到五个功能标签页：
>
> - **记一笔** — 选择分类、输入金额和日期，一键记录
> - **花销列表** — 表格展示所有记录，可筛选可查看详情
> - **统计概览** — 饼图看分类占比，柱状图看各分类支出
> - **分类管理** — 树形表格管理分类，预设分类受保护
> - **贪吃蛇** — 经典贪吃蛇小游戏，方向键操控，工作之余放松一下

---

## 🚀 开发运行

### 环境要求

- Node.js 18+
- pnpm

### 安装和启动

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发模式
unset ELECTRON_RUN_AS_NODE && npx electron-vite dev
```

> ⚠️ 如果在 VSCode 终端中运行，需要先执行 `unset ELECTRON_RUN_AS_NODE`，否则 Electron 会启动失败。

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 桌面应用框架 |
| React + TypeScript | 前端界面 |
| Ant Design | UI 组件库 |
| ECharts | 统计图表 |
| better-sqlite3 | 本地数据库 |
| Vite | 构建工具 |

---

## 📁 项目结构

```
黑马记账APP/
├── main-process/          # Electron 主进程
│   ├── main.ts           # 窗口创建、应用生命周期
│   └── preload.ts        # 安全桥接
├── src/                   # React 渲染进程（界面）
│   ├── App.tsx           # 根组件
│   ├── components/       # UI 组件
│   │   ├── AddRecord.tsx        # 记一笔
│   │   ├── RecordList.tsx       # 花销列表
│   │   ├── Statistics.tsx       # 统计概览
│   │   ├── CategoryManager.tsx  # 分类管理
│   │   ├── SnakeGame.tsx         # 贪吃蛇小游戏
│   │   └── Layout.tsx           # 整体布局
│   ├── database/         # 数据库操作
│   │   ├── connection.ts
│   │   ├── categories.ts
│   │   ├── records.ts
│   │   └── db.ts
│   └── types/            # 类型定义
│       └── index.ts
├── resources/            # 静态资源
├── CLAUDE.md             # 项目开发文档
└── README.md             # 本文件
```

---

## 📄 许可

MIT License

---

> 🐴 黑马记账 — 让每一笔花销都有迹可循
