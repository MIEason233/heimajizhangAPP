import React, { useState, useEffect } from 'react'
import { DatePicker, Card, Empty, Spin, Statistic } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { MonthlyStat } from '../types'

// ============================================================
// "统计概览"组件 — 月度支出图表
// ============================================================

const Statistics: React.FC = () => {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [stats, setStats] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [month])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await window.api.getMonthlyStats(month)
      setStats(data)
    } catch (err) {
      console.error('加载统计数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 总金额
  const totalAmount = stats.reduce((sum, s) => sum + s.total, 0)

  // ---- 饼图配置 ----
  const pieOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
        `${params.marker} ${params.name}<br/>¥ ${params.value.toFixed(2)} (${params.percent}%)`
    },
    legend: {
      orient: 'vertical' as const,
      right: 10,
      top: 'center',
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: { name: string; percent: number }) =>
            `{b}\n{per|${params.percent}%}`,
          rich: {
            per: {
              fontSize: 14,
              fontWeight: 'bold',
              color: '#333'
            }
          }
        },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: stats.map(s => ({
          name: `${s.parent_category_name}`,
          value: s.total
        }))
      }
    ]
  }

  // ---- 柱状图配置 ----
  const barOption = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]
        return `${p.name}<br/>¥ ${p.value.toFixed(2)}`
      }
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.map(s => s.parent_category_name),
      axisLabel: {
        rotate: stats.length > 6 ? 45 : 0,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '金额（元）',
      nameTextStyle: { fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: stats.map(s => ({
          name: s.parent_category_name,
          value: s.total
        })),
        itemStyle: {
          color: '#1677ff',
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: { value: number }) =>
            `¥${params.value.toFixed(0)}`
        },
        barMaxWidth: 50
      }
    ]
  }

  // 空数据时的占位图表
  const emptyPieOption = {
    ...pieOption,
    series: [{ ...pieOption.series[0], data: [] }]
  }
  const emptyBarOption = {
    ...barOption,
    series: [{ ...barOption.series[0], data: [] }]
  }

  return (
    <div>
      {/* 月份选择 + 总金额 */}
      <Card size="small" style={{ marginBottom: 24, textAlign: 'center' }}>
        <DatePicker
          picker="month"
          value={dayjs(month)}
          onChange={(d) => setMonth(d ? d.format('YYYY-MM') : dayjs().format('YYYY-MM'))}
          allowClear={false}
          size="large"
          style={{ marginBottom: 12 }}
        />
        <Statistic
          title="本月总支出"
          value={totalAmount}
          precision={2}
          prefix={<WalletOutlined />}
          suffix="元"
          valueStyle={{ color: totalAmount > 0 ? '#cf1322' : '#999', fontWeight: 700 }}
        />
      </Card>

      <Spin spinning={loading}>
        {stats.length === 0 ? (
          <Empty
            description="暂无支出数据，快去记一笔吧！"
            style={{ marginTop: 60 }}
          />
        ) : (
          <div className="stats-container">
            {/* 饼图：各分类占比 */}
            <Card title="📊 分类占比" className="stats-card">
              <ReactECharts
                option={pieOption}
                style={{ height: 320 }}
                opts={{ renderer: 'svg' }}
              />
            </Card>

            {/* 柱状图：各分类金额对比 */}
            <Card title="📈 分类对比" className="stats-card">
              <ReactECharts
                option={barOption}
                style={{ height: 320 }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </div>
        )}
      </Spin>
    </div>
  )
}

export default Statistics
