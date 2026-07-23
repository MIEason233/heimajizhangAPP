import React, { useState } from 'react'
import { ConfigProvider, Tabs, theme } from 'antd'
import {
  PlusCircleOutlined,
  UnorderedListOutlined,
  PieChartOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import AddRecord from './components/AddRecord'
import RecordList from './components/RecordList'
import Statistics from './components/Statistics'

// ============================================================
// 黑马记账 — 主应用组件
// 使用标签页布局：记一笔 | 花销列表 | 统计
// ============================================================

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add')

  // 用于刷新列表的 key（记一笔成功后触发列表刷新）
  const [refreshKey, setRefreshKey] = useState(0)
  const handleRecordAdded = () => setRefreshKey(k => k + 1)

  const tabItems = [
    {
      key: 'add',
      label: (
        <span>
          <PlusCircleOutlined />
          记一笔
        </span>
      ),
      children: <AddRecord onSuccess={handleRecordAdded} />
    },
    {
      key: 'list',
      label: (
        <span>
          <UnorderedListOutlined />
          花销列表
        </span>
      ),
      children: <RecordList key={refreshKey} />
    },
    {
      key: 'stats',
      label: (
        <span>
          <PieChartOutlined />
          统计概览
        </span>
      ),
      children: <Statistics key={refreshKey} />
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
          />
        </main>
      </div>
    </ConfigProvider>
  )
}

export default App
