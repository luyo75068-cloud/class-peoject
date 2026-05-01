import { useEffect, useRef, useState } from 'react'
import { Card, Col, Row, message } from 'antd'
import * as echarts from 'echarts'
import request from '../api/request'

interface DashboardData {
  stats: {
    totalCourses: number
    publishedCourses: number
    totalStudents: number
    activeStudents: number
  }
  charts: {
    enrollment: { name: string; value: number }[]
    activity: { date: string; label: string; students: number; duration: number }[]
    statusDist: { name: string; value: number }[]
    categoryDist: { name: string; value: number }[]
  }
}

function useEChart(
  ref: React.RefObject<HTMLDivElement | null>,
  getOption: (data: DashboardData) => echarts.EChartsOption,
  data: DashboardData | null,
  ready: boolean
) {
  useEffect(() => {
    if (!ref.current || !data || !ready) return
    const chart = echarts.init(ref.current)
    chart.setOption(getOption(data))
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [data, ref, getOption, ready])
}


const COLORSt = ["#b8d4f0", '#ffd6d6']
const COLORSs = ['#d0e8ff', '#ffe8b8', '#d4f0d4', '#f0d4f4']

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const barRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const pie1Ref = useRef<HTMLDivElement>(null)
  const pie2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    request.get('/dashboard')
      .then(res => {
        if (res.code === 0) setData(res.data)
        else message.error('加载数据失败')
      })
      .finally(() => setLoading(false))
  }, [])

  const ready = !loading && !!data
  const safeData = data

  useEChart(barRef, (d) => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 120, right: 120, top: 40, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: d.charts.enrollment.map(item => item.name),
      axisLine: { show: true, lineStyle: { width: 1.5 } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [{
      type: 'bar', barMaxWidth: 44,
      data: d.charts.enrollment.map(item => item.value),
      itemStyle: {
        color: '#b8d4f0',
        borderRadius: [4, 4, 0, 0],
        borderColor: '#000',
        borderWidth: 1.5,
      },
    }],
  }), safeData, ready)

  useEChart(lineRef, (d) => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 120, top: 40, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: d.charts.enrollment.map(item => item.name),
      axisLine: { show: true, lineStyle: { width: 1.5 } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
    },
    yAxis: [
      { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
      { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
    ],
    graphic: {
      type: 'text', left: 'center', bottom: 10,
      style: { text: '周一~周日', fontSize: 14, fill: '#000' },
    },
    series: [
      {
        type: 'line', smooth: false, symbol: 'none',
        data: d.charts.activity.map(item => item.students),
        itemStyle: { color: '#1677ff' }, lineStyle: { width: 2 }, areaStyle: { opacity: 0 },
      },
      {
        type: 'line', smooth: false, yAxisIndex: 1, symbol: 'none',
        data: d.charts.activity.map(item => item.duration),
        itemStyle: { color: '#00b42a' }, lineStyle: { width: 2, type: 'dashed' }, areaStyle: { opacity: 0 },
      },
    ],
  }), safeData, ready)

  useEChart(pie1Ref, (d) => ({
    series: [{
      type: 'pie', radius: '70%', center: ['50%', '50%'], startAngle: 45,
      data: d.charts.statusDist.map((item, i) => ({
        ...item,
        itemStyle: {
          color: COLORSt[i % COLORSt.length],
          borderColor: '#333',
          borderWidth: 2
        },
        label: {
          formatter: '{b}',
          position: 'inside',
          color: '#000',
          fontSize: 14
        }
      })),
      emphasis: { scale: false }
    }]
  }), safeData, ready)

  useEChart(pie2Ref, (d) => {
    const processCategoryData = (rawData: { name: string; value: number }[]) => {
      const targets = ['前端开发', '后端开发', '数据库']
      let othersValue = 0
      const filtered = rawData.reduce<{ name: string; value: number }[]>((acc, item) => {
        if (targets.includes(item.name)) acc.push(item)
        else othersValue += item.value
        return acc
      }, [])
      if (othersValue > 0) filtered.push({ name: '其他', value: othersValue })
      return filtered
    }
    const chartData = processCategoryData(d.charts.categoryDist)
    const total = chartData.reduce((sum, v) => sum + v.value, 0)
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}门 ' },
      series: [{
        type: 'custom',
        coordinateSystem: 'none',
        renderItem: (params: any, api: any) => {
          const cx = api.getWidth() / 2
          const cy = api.getHeight() / 2
          const r = Math.min(api.getWidth(), api.getHeight()) * 0.35
          let startPercent = 0
          for (let i = 0; i < params.dataIndex; i++) startPercent += chartData[i].value / total
          const endPercent = startPercent + chartData[params.dataIndex].value / total
          const startAngle = startPercent * Math.PI * 2 - Math.PI / 2
          const endAngle = endPercent * Math.PI * 2 - Math.PI / 2
          const x1 = cx + r * Math.cos(startAngle)
          const y1 = cy + r * Math.sin(startAngle)
          const x2 = cx + r * Math.cos(endAngle)
          const y2 = cy + r * Math.sin(endAngle)
          const isLargeArc = (endAngle - startAngle) > Math.PI ? 1 : 0
          return {
            type: 'path',
            shape: { d: `M ${x1} ${y1} A ${r} ${r} 0 ${isLargeArc} 1 ${x2} ${y2} L ${x1} ${y1} Z` },
            style: api.style({
              fill: COLORSs[params.dataIndex % COLORSs.length],
              stroke: '#333',
              lineWidth: 2,
            }),
            emphasis: {
              style: { fill: COLORSs[params.dataIndex % COLORSs.length], stroke: '#000', lineWidth: 3 }
            }
          }
        },
        label: { show: true, formatter: '{b}', color: '#000' },
        data: chartData
      }]
    }
  }, safeData, ready)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: 16 }}>加载中...</div>
      </div>
    )
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: 50 }}>暂无数据</div>
  }

  const { stats } = data
  const publishRate = stats.totalCourses > 0 ? ((stats.publishedCourses / stats.totalCourses) * 100).toFixed(0) + '%' : '0%'
  const activeRate = stats.totalStudents > 0 ? ((stats.activeStudents / stats.totalStudents) * 100).toFixed(0) + '%' : '0%'

  const statCards = [
    { title: '课程总数', value: stats.totalCourses, icon: '📚', color: 'black', bg: '#e6f4ff' },
    { title: '学生总数', value: stats.totalStudents, icon: '👥', color: 'black', bg: '#f9f0ff' },
    { title: '课程发布率', value: publishRate, icon: '📈', color: 'black', bg: '#e6fffb' },
    { title: '学生活跃率', value: activeRate, icon: '🔥', color: 'black', bg: '#fff7e6' },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 18, marginBottom: 20, fontSize: 28, textAlign: 'left', fontWeight: 700 }}>工作台</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statCards.map(card => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card style={{ borderRadius: 10, border: '2px solid black' ,height:'100%'}}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', width: '100%', gap: '1px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: 18 }}>{card.icon}</div>
                    <span style={{ color: '#807974', fontSize: 14 }}>{card.title}</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: '#9d9d9f' }}>
                    {card.title === '课程总数' && `/ 已发布${stats.publishedCourses}`}
                    {card.title === '学生总数' && `/ 活跃${stats.activeStudents}`}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 10, border: '2px solid black' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>课程选课人数TOP 8</div>
            <div ref={barRef} style={{ height: 280, border: '2.5px dashed #acacac', borderRadius: 10, background: '#fbfbfb' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 10, border: '2px solid black' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>近7天学习活跃度</div>
            <div ref={lineRef} style={{ height: 280, border: '2.5px dashed #acacac', borderRadius: 10, background: '#fbfbfb' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 10, border: '2px solid black' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>学生状态分布</div>
            <div ref={pie1Ref} style={{ height: 280, border: '2.5px dashed #acacac', borderRadius: 10, background: '#fbfbfb' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 10, border: '2px solid black' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>课程分类分布</div>
            <div ref={pie2Ref} style={{ height: 280, border: '2.5px dashed #acacac', borderRadius: 10, background: '#fbfbfb' }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard