import React, { useState, useEffect } from 'react'
import {
  Table, Button, Modal, Input, Select, Tag, Popconfirm, message, Space, Tooltip
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FileOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Category } from '../types'

// ============================================================
// 分类管理 — 查看/新增/修改/删除分类
// 预设分类受保护，只能修改用户自定义的分类
// ============================================================

// 常用图标选择器
const ICON_OPTIONS = [
  '🍜', '🍱', '🍲', '🧋', '🥡', '🍻', '🥐', '🍕', '🍔', '🌮',
  '🚗', '🚇', '🚕', '⛽', '✈️', '🚲', '🚄', '🚌', '🛵', '🚶',
  '🛒', '👗', '📱', '🧴', '💄', '🍷', '🛍️', '👟', '🎒', '⌚',
  '🏠', '🏘️', '💡', '🏢', '🛋️', '🔧', '📶', '🪴', '🖼️', '🛏️',
  '🎮', '🎬', '🏖️', '🏋️', '🐱', '🎯', '🎵', '📺', '🎨', '✈️',
  '💊', '🏥', '🩺', '🏃', '🧘', '💉', '🦷', '👁️', '🧠', '🫀',
  '📚', '📖', '📕', '✏️', '📝', '🎓', '💻', '🔬', '🗺️', '📐',
  '🎁', '🧧', '🎂', '👨‍👩‍👦', '🤝', '💐', '🎉', '💝', '🙏', '🎊',
  '💰', '🏦', '🛡️', '📉', '💳', '💵', '📊', '🏧', '💹', '📈',
  '📦', '🖊️', '📌', '📎', '🗂️', '🧹', '🛠️', '🔖', '📋', '🗑️'
]

/** 构建树形数据结构（Ant Design Table 需要 children 字段） */
interface TreeCategory extends Category {
  children?: TreeCategory[]
}

function buildTree(categories: Category[]): TreeCategory[] {
  const map = new Map<number, TreeCategory>()
  const roots: TreeCategory[] = []

  // 第一遍：建立 id 映射
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] })
  })

  // 第二遍：组装父子关系
  categories.forEach(cat => {
    const node = map.get(cat.id)!
    if (cat.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(cat.parent_id)
      if (parent && parent.children) {
        parent.children.push(node)
      }
    }
  })

  // 清理空的 children 数组（没有子节点的设为 undefined，这样表格不会显示展开箭头）
  const cleanEmpty = (nodes: TreeCategory[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length === 0) {
        delete node.children
      } else if (node.children) {
        cleanEmpty(node.children)
      }
    })
  }
  cleanEmpty(roots)

  return roots
}

interface Props {
  onChange?: () => void
}

const CategoryManager: React.FC<Props> = ({ onChange }) => {
  // ---- 状态 ----
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formParentId, setFormParentId] = useState<number | undefined>(undefined)
  const [formIcon, setFormIcon] = useState('📌')
  const [submitting, setSubmitting] = useState(false)

  // ---- 加载分类 ----
  const loadCategories = async () => {
    setLoading(true)
    try {
      const cats = await window.api.getCategories()
      setCategories(cats)
    } catch {
      message.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])

  // 一级分类列表（用于新增二级分类时选择父分类）
  const parentCategories = categories.filter(c => c.parent_id === null)

  // ---- 打开新增弹窗 ----
  const openAddModal = (parentId?: number) => {
    setEditingCategory(null)
    setFormName('')
    setFormParentId(parentId)
    setFormIcon('📌')
    setModalOpen(true)
  }

  // ---- 打开编辑弹窗 ----
  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormParentId(cat.parent_id ?? undefined)
    setFormIcon(cat.icon)
    setModalOpen(true)
  }

  // ---- 提交（新增或修改） ----
  const handleSubmit = async () => {
    if (!formName.trim()) {
      message.warning('请输入分类名称')
      return
    }
    setSubmitting(true)
    try {
      if (editingCategory) {
        // 修改
        const result = await window.api.updateCategory(editingCategory.id, formName.trim(), formIcon)
        if (result.success) {
          message.success('分类已修改')
        } else {
          message.error('预设分类不可修改')
        }
      } else {
        // 新增：将 undefined 转为 null（数据库需要 null 表示无上级）
        const parentId = formParentId ?? null
        await window.api.addCategory(formName.trim(), parentId, formIcon)
        message.success('分类已添加')
      }
      // 先刷新列表，再关闭弹窗，通知父组件分类已变更
      await loadCategories()
      onChange?.()
      setModalOpen(false)
    } catch (err) {
      console.error('分类操作失败:', err)
      message.error('操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- 删除分类 ----
  const handleDelete = async (id: number) => {
    const result = await window.api.deleteCategory(id)
    if (result.success) {
      message.success('分类已删除')
      await loadCategories()
      onChange?.()
    } else {
      message.error('预设分类不可删除')
    }
  }

  // ---- 表格列定义 ----
  const columns: ColumnsType<TreeCategory> = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      align: 'center',
      render: (icon: string) => <span style={{ fontSize: 20 }}>{icon}</span>
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TreeCategory) => (
        <Space>
          {record.parent_id === null ? (
            <FolderOutlined style={{ color: '#1677ff' }} />
          ) : (
            <FileOutlined style={{ color: '#999', marginLeft: 8 }} />
          )}
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '层级',
      key: 'level',
      width: 80,
      align: 'center',
      render: (_: unknown, record: TreeCategory) => (
        <Tag color={record.parent_id === null ? 'blue' : 'default'}>
          {record.parent_id === null ? '一级' : '二级'}
        </Tag>
      )
    },
    {
      title: '类型',
      key: 'type',
      width: 80,
      align: 'center',
      render: (_: unknown, record: TreeCategory) =>
        record.is_preset === 1 ? (
          <Tag color="orange">预设</Tag>
        ) : (
          <Tag color="green">自定义</Tag>
        )
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_: unknown, record: TreeCategory) => (
        <Space>
          {record.is_preset === 1 ? (
            <Tooltip title="预设分类不可修改">
              <Button size="small" icon={<EditOutlined />} disabled />
            </Tooltip>
          ) : (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            >
              编辑
            </Button>
          )}
          {record.is_preset === 1 ? (
            <Tooltip title="预设分类不可删除">
              <Button size="small" icon={<DeleteOutlined />} disabled />
            </Tooltip>
          ) : (
            <Popconfirm
              title="确定要删除这个分类吗？"
              description={record.children ? '删除一级分类会同时删除其下所有二级分类' : ''}
              onConfirm={() => handleDelete(record.id)}
              okText="确定删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  // ---- 渲染 ----
  const treeData = buildTree(categories)

  return (
    <div className="category-manager">
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#666', fontSize: 13 }}>
            共 {categories.length} 个分类（一级 {parentCategories.length} 个，二级 {categories.length - parentCategories.length} 个）
          </span>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddModal()}>
            新增一级分类
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => {
            if (parentCategories.length === 0) {
              message.warning('请先添加一级分类')
              return
            }
            openAddModal(parentCategories[0].id)
          }}>
            新增二级分类
          </Button>
        </Space>
      </div>

      {/* 分类列表表格（树形） */}
      <Table
        columns={columns}
        dataSource={treeData}
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows
        size="middle"
        locale={{ emptyText: '暂无分类数据' }}
      />

      {/* 新增 / 编辑弹窗 */}
      <Modal
        title={editingCategory ? '修改分类' : '新增分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={editingCategory ? '保存修改' : '添加'}
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          {/* 分类名称 */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>分类名称</div>
            <Input
              placeholder="例如：买咖啡"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              maxLength={10}
              showCount
            />
          </div>

          {/* 父分类（仅新增时可选，编辑时不改层级） */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>
              所属上级
              {editingCategory && editingCategory.parent_id === null && (
                <Tag color="blue" style={{ marginLeft: 8 }}>一级分类</Tag>
              )}
              {editingCategory && editingCategory.parent_id !== null && (
                <Tag style={{ marginLeft: 8 }}>二级分类</Tag>
              )}
            </div>
            {editingCategory ? (
              // 编辑模式：显示所属上级，不可更改
              <Select
                style={{ width: '100%' }}
                value={formParentId}
                disabled
                options={[
                  { value: null as unknown as number, label: '（无上级 — 一级分类）' },
                  ...parentCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))
                ]}
              />
            ) : (
              // 新增模式：可选择上级
              <Select
                style={{ width: '100%' }}
                value={formParentId}
                onChange={val => setFormParentId(val)}
                placeholder="选择上级分类（不选则为一级分类）"
                allowClear
                options={[
                  ...parentCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))
                ]}
              />
            )}
          </div>

          {/* 图标选择 */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>
              图标
              <span style={{ fontSize: 20, marginLeft: 8 }}>{formIcon}</span>
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              maxHeight: 180, overflowY: 'auto',
              border: '1px solid #d9d9d9', borderRadius: 6, padding: 8
            }}>
              {ICON_OPTIONS.map(icon => (
                <span
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  style={{
                    fontSize: 22,
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    border: formIcon === icon ? '2px solid #1677ff' : '2px solid transparent',
                    background: formIcon === icon ? '#e6f4ff' : 'transparent'
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CategoryManager
