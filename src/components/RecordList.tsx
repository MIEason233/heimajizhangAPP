import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Select,
  DatePicker,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Empty
} from 'antd'
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Category, RecordWithCategory } from '../types'

// ============================================================
// "花销列表"组件 — 查看、筛选、删除记账记录
// ============================================================

const RecordList: React.FC = () => {
  const [records, setRecords] = useState<RecordWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filterCategory, setFilterCategory] = useState<number | undefined>(undefined)
  const [filterMonth, setFilterMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [loading, setLoading] = useState(false)

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const filters: { categoryId?: number; month?: string } = {}
      if (filterCategory) filters.categoryId = filterCategory
      if (filterMonth) filters.month = filterMonth

      const [allRecords, allCategories] = await Promise.all([
        window.api.getRecords(filters),
        window.api.getCategories()
      ])
      setRecords(allRecords)
      setCategories(allCategories)
    } catch (err) {
      console.error('加载数据失败:', err)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filterCategory, filterMonth])

  // 删除记录
  const handleDelete = async (id: number) => {
    await window.api.deleteRecord(id)
    message.success('已删除')
    loadData()
  }

  // 一级分类选项
  const parentCategories = categories.filter(c => c.parent_id === null)

  // 计算总支出
  const totalAmount = useMemo(
    () => records.reduce((sum, r) => sum + r.amount, 0),
    [records]
  )

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a: RecordWithCategory, b: RecordWithCategory) =>
        a.date.localeCompare(b.date),
      render: (date: string) => (
        <span style={{ color: '#888' }}>{date}</span>
      )
    },
    {
      title: '分类',
      key: 'category',
      width: 200,
      render: (_: unknown, record: RecordWithCategory) => (
        <Space>
          <Tag color="blue">{record.parent_category_icon} {record.parent_category_name}</Tag>
          <span>{record.category_icon} {record.category_name}</span>
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      sorter: (a: RecordWithCategory, b: RecordWithCategory) =>
        a.amount - b.amount,
      render: (amount: number) => (
        <span className="amount-text">¥ {amount.toFixed(2)}</span>
      )
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => (
        <span style={{ color: note ? '#666' : '#ccc' }}>
          {note || '（无备注）'}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: RecordWithCategory) => (
        <Popconfirm
          title="确定删除这条记录吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            删除
          </Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div>
      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <span><SearchOutlined /> 筛选：</span>
          <Select
            placeholder="全部分类"
            allowClear
            style={{ width: 160 }}
            value={filterCategory}
            onChange={setFilterCategory}
            options={parentCategories.map(c => ({
              value: c.id,
              label: `${c.icon} ${c.name}`
            }))}
          />
          <DatePicker
            picker="month"
            value={filterMonth ? dayjs(filterMonth) : null}
            onChange={(d) => setFilterMonth(d ? d.format('YYYY-MM') : '')}
            allowClear
            placeholder="选择月份"
          />
          <Tag color="red" style={{ fontSize: 15, padding: '4px 12px' }}>
            合计：¥ {totalAmount.toFixed(2)}
          </Tag>
        </Space>
      </Card>

      {/* 记录表格 */}
      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="暂无记录，快去记一笔吧！" /> }}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50']
        }}
        size="middle"
      />
    </div>
  )
}

export default RecordList
