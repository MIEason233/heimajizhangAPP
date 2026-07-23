import React, { useState, useEffect } from 'react'
import {
  Form,
  InputNumber,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  message
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Category, AddRecordData } from '../types'

// ============================================================
// "记一笔"组件 — 新增花销记录的表单
// ============================================================

interface Props {
  onSuccess: () => void // 记录添加成功后的回调（刷新列表）
}

const AddRecord: React.FC<Props> = ({ onSuccess }) => {
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // 加载分类数据
  useEffect(() => {
    window.api.getCategories().then(all => {
      setCategories(all)
    })
  }, [])

  // 一级分类列表（parent_id === null）
  const parentCategories = categories.filter(c => c.parent_id === null)

  // 当用户选择一级分类时，更新二级分类选项
  const handleParentChange = (parentId: number) => {
    const subs = categories.filter(c => c.parent_id === parentId)
    setSubCategories(subs)
    form.setFieldValue('categoryId', undefined) // 重置二级分类选择
  }

  // 提交表单
  const handleSubmit = async (values: {
    amount: number
    categoryId: number
    date: dayjs.Dayjs
    note: string
  }) => {
    setLoading(true)
    try {
      const data: AddRecordData = {
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        categoryId: values.categoryId,
        note: values.note || ''
      }
      await window.api.addRecord(data)
      message.success('记账成功！')
      form.resetFields()
      onSuccess()
    } catch (err) {
      message.error('记账失败，请重试')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ maxWidth: 520, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs()
        }}
      >
        {/* 金额 */}
        <Form.Item
          label="金额（元）"
          name="amount"
          rules={[
            { required: true, message: '请输入金额' },
            { type: 'number', min: 0.01, message: '金额必须大于0' }
          ]}
        >
          <InputNumber
            prefix="¥"
            placeholder="0.00"
            precision={2}
            style={{ width: '100%' }}
            size="large"
            autoFocus
          />
        </Form.Item>

        {/* 日期 */}
        <Form.Item
          label="日期"
          name="date"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            size="large"
            allowClear={false}
          />
        </Form.Item>

        {/* 一级分类 */}
        <Form.Item label="一级分类" required>
          <Select
            placeholder="选择大类"
            size="large"
            onChange={handleParentChange}
            options={parentCategories.map(c => ({
              value: c.id,
              label: `${c.icon} ${c.name}`
            }))}
          />
        </Form.Item>

        {/* 二级分类 */}
        <Form.Item
          label="二级分类"
          name="categoryId"
          rules={[{ required: true, message: '请选择二级分类' }]}
        >
          <Select
            placeholder={subCategories.length === 0 ? '请先选择一级分类' : '选择小类'}
            size="large"
            disabled={subCategories.length === 0}
            options={subCategories.map(c => ({
              value: c.id,
              label: `${c.icon} ${c.name}`
            }))}
          />
        </Form.Item>

        {/* 备注 */}
        <Form.Item label="备注（可选）" name="note">
          <Input.TextArea
            placeholder="例如：和同事拼单"
            rows={2}
            maxLength={100}
            showCount
          />
        </Form.Item>

        {/* 提交按钮 */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={loading}
            size="large"
            block
          >
            记一笔
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default AddRecord
