import React, { useState } from 'react'
import { ConfigProvider, Tabs, theme } from 'antd'
import {
  PlusCircleOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import AddRecord from './components/AddRecord'
import RecordList from './components/RecordList'
import Statistics from './components/Statistics'
import CategoryManager from './components/CategoryManager'

// ============================================================
// 黑马记账 — 主应用组件
// 使用标签页布局：记一笔 | 花销列表 | 统计 | 分类管理
// ============================================================

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add')

  // 记一笔成功后，通知列表和统计刷新
  const [refreshKey, setRefreshKey] = useState(0)
  const handleRecordAdded = () => setRefreshKey(k => k + 1)

  // 分类变更后，通知记一笔刷新分类列表
  const [categoryVersion, setCategoryVersion] = useState(0)
  const handleCategoryChanged = () => setCategoryVersion(v => v + 1)

  const tabItems = [
    {
      key: 'add',
      label: (
        <span>
          <PlusCircleOutlined />
          记一笔
        </span>
      ),
      children: <AddRecord categoryVersion={categoryVersion} onSuccess={handleRecordAdded} />
    },
    {
      key: 'list',
      label: (
        <span>
          <UnorderedListOutlined />
          花销列表
        </span>
      ),
      children: <RecordList refreshKey={refreshKey} />
    },
    {
      key: 'stats',
      label: (
        <span>
          <PieChartOutlined />
          统计概览
        </span>
      ),
      children: <Statistics refreshKey={refreshKey} />
    },
    {
      key: 'categories',
      label: (
        <span>
          <AppstoreOutlined />
          分类管理
        </span>
      ),
      children: <CategoryManager onChange={handleCategoryChanged} />
    }
  ]

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8
        }
      }}
    >
      <div className="app-container">
        <header className="app-header">
          <h1>🐴 黑马记账</h1>
        </header>
        <main className="app-main">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            centered
            destroyInactiveTabPane={false}
          />
        </main>
      </div>
    </ConfigProvider>
  )
}

export default App
