import { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Input, Select, Space, Form, Modal,
  message, Popconfirm, Tag, Card, Row, Col, 
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import request from '../api/request'

const { Option } = Select
const { TextArea } = Input

interface Course {
  id: number
  name: string
  instructor: string
  category: string
  description: string
  student_count: number
  lesson_count: number
  status: 'draft' | 'published'
  created_at: string
}

const Courses = () => {
  const [isExpanded, setIsExpanded] = useState(false) 
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])

  // 查询参数
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(13)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // 临时搜索参数（用于输入但未点击搜索）
  const [tempKeyword, setTempKeyword] = useState('')
  const [tempStatus, setTempStatus] = useState('')
  const [tempCategory, setTempCategory] = useState('')

  // 弹窗
  const [visible, setVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = () => {
    request.get('/courses/categories').then(res => {
      if (res.code === 0) setCategories(res.data)
    })
  }
  // 获取课程列表，产生变化重新渲染
  const fetchList = useCallback(() => {
    setLoading(true)
    request.get('/courses', {
      params: { page, pageSize, keyword, status, category, sortField, sortOrder },
    }).then(res => {
      if (res.code === 0) {
        setList(res.data.list)
        setTotal(res.data.total)
        setIsExpanded(false)
      }
    }).finally(() => setLoading(false))
  }, [page, pageSize, keyword, status, category, sortField, sortOrder])
  // 刚进页面加载课程分类
  useEffect(() => { fetchCategories() }, [])
  // 监听并重新请求课程列表
  useEffect(() => { fetchList() }, [fetchList])
  // 表格变化触发
  const handleTableChange: TableProps<Course>['onChange'] = (pagination, _, sorter: any) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)  //插
    if (sorter.field === 'student_count') {
      setSortField('student_count')
      setSortOrder(sorter.order || '')
    } else {
      setSortField('')
      setSortOrder('')
    }
  }

  // 点击搜索按钮
  const handleSearch = () => {
    setKeyword(tempKeyword)
    setStatus(tempStatus)
    setCategory(tempCategory)
    setPage(1)
  }

 
  // 新增
  const openCreate = () => {
    setCurrentId(null)
    form.resetFields()
    setVisible(true)
  }
  // 编辑
  const openEdit = (record: Course) => {
    setCurrentId(record.id)
    form.setFieldsValue(record)
    setVisible(true)
  }
  // 提交函数
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const res = currentId
        ? await request.put(`/courses/${currentId}`, values)
        : await request.post('/courses', values)
      if (res.code === 0) {
        message.success(currentId ? '修改成功' : '新增成功')
        setVisible(false)
        fetchList()
        fetchCategories()
      }
    } catch (error) {
      console.error('提交失败', error)
    } finally {
      setSubmitting(false)
    }
  }
  // 删除
  const handleDelete = async (id: number) => {
    const originalList = [...list];
    setList(prev => prev.filter(item => item.id !== id));
    try {
      const res = await request.delete(`/courses/${id}`);
      // 注意：这里根据你全局 res 的结构，通常是 res.code 而不是 res.data.code
      if (res.code === 0) {
        message.success('删除成功');
        fetchList(); // 重新拉取确认数据同步
      } else {
        // 如果后端报错，则恢复原数据
        setList(originalList);
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      setList(originalList);
      message.error('网络错误');
    }
  }
  const showList = isExpanded ? list : list.slice(0, 2);
  const hasMore = list.length > 2;
  // 状态切换
  const handleToggleStatus = async (record: Course) => {
    const res = await request.patch(`/courses/${record.id}/status`)
    if ((res as any).code === 0) {
      message.success(record.status === 'published' ? '已下架' : '已发布')
      fetchList()
    }
  }

  
  // 表格列配置
  const columns: TableProps<Course>['columns'] = [
    {
      title: '课程名称',
      dataIndex: 'name',
      ellipsis: true,
      width: 200,
      render: (v, r) => (
        <div style={{ lineHeight: '1.4' }}>
          <div style={{ fontWeight: 700 ,fontSize:16}}>{v}</div>
          <div style={{
          fontSize: '15px',
          color: '#adb3bd',
          marginTop: '2px',
        }}>     
            {r.description || '暂无描述'}
          </div>
        </div>
      ),
    },
    { title: '讲师', dataIndex: 'instructor', width: 90 },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: v => (v ? <Tag color="#53a4e5" style={{border:'2px solid #619ede' , padding:"5px 10px" ,fontSize:14}}>{v}</Tag> : '-'),
    },
    { title: '课时', dataIndex: 'lesson_count', width: 90 },
    {
      title: '选课人数',
      dataIndex: 'student_count',
      width: 100,
      sorter: true,
      render: v => <span>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: v => (
        <Tag
          style={{
            border: v === 'published' ? '2px solid #60c92c' : '2px solid #adb3bd',
            padding: '3px 10px',
            fontSize: 14,
            color: v === 'published' ? '#5cc625' : '#9c9c9e',
            backgroundColor: v === 'published' ? '#f0fff0' : '#f5f5f5',
          }}
        >
          {v === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 210,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)} 
          className="no-border-btn"
          style={{color:'#6d9adb'}}>
            ✏️编辑
          </Button>
          <Popconfirm
            title={`确定要${record.status === 'published' ? '下架' : '发布'}该课程吗？`}
            onConfirm={() => handleToggleStatus(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              className="no-border-btn"
              style={{color:'#9b9b99'}}
            >
              {record.status === 'published' ? '下架' : '发布'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要删除该课程吗？"
            description="删除后数据将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}
            className="no-border-btn"
            >
            删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="course-manage-container">
      {/* 标题栏：两端对齐 */}
      <div style={{ marginBottom: 18,display: 'flex', justifyContent: 'space-between', alignItems: 'center' , marginTop: 18}}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>课程管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{background:'#d0e8ff' ,fontWeight: 500, color:'black' , border: '3.5px solid black', fontSize:18 , padding:20}}>
          新增课程
        </Button>
      </div>

      {/* 搜索筛选栏：靠左排列，有间隔 */}
      <Card style={{ marginBottom: 16, borderRadius: 10 , border: '3.5px solid black'}}>
        <Space size={12} wrap style={{ marginBottom: 16, 
          display: 'flex', 
          justifyContent: 'flex-start', 
          }}>
          <Input
            placeholder="搜索课程名称 / 讲师"
            prefix='🔍'
            allowClear
            value={tempKeyword}
            onChange={e => setTempKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240, border: '2.5px solid #acacac' ,height:44}}
          />
          <Select
            placeholder="全部状态"
            allowClear
            style={{ width: 120 , border: '2.5px solid #acacac' ,height:44}}
            value={tempStatus || undefined}
            onChange={v => setTempStatus(v ?? '')}
          >
            <Option value="published">已发布</Option>
            <Option value="draft">草稿</Option>
          </Select>
          <Select
            placeholder="全部分类"
            allowClear
            style={{ width: 120 , border: '2.5px solid #acacac' ,height:44}}
            value={tempCategory || undefined}
            onChange={v => setTempCategory(v ?? '')}
          >
            {categories.map(c => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}
          style={{ border: '3px solid black', background:"transparent" , color:'black' ,height:44}}>
            🔍搜索
          </Button>
        </Space>
      {/* 表格 */}
        <Table
          rowKey="id"
          className="custom-brutalist-table"
          loading={loading}
          columns={columns}
          dataSource={showList}
          scroll={{ x: 1000 }}
          onChange={handleTableChange}
          pagination={{
            current: page,
            pageSize:10,
            total,
            showSizeChanger: false,
            showTotal: t => `共 ${t} 条`,
             showLessItems: true,
          }}
          footer={() => 
            !isExpanded && hasMore ? (
              <div
                onClick={() => setIsExpanded(true)}
                style={{
                  textAlign: 'center',
                  padding: '12px 0',
                  color: '#adb3bd',
                  cursor: 'pointer',
                  fontSize: 14,
                  backgroundColor: '#fff',
                  margin: 0,
                  borderBottom:"1px dashed #adb3bd",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.color = '#1677ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#adb3bd';
                }}
              >
                ... 更多数据行 ...
              </div>
            ) : isExpanded ? (
              <div style={{ textAlign: 'center', padding: '8px 16px', color: '#999' }}>
                <Button
                  size="small"
                  type="text"
                  onClick={() => setIsExpanded(false)}
                  style={{ color: '#999' }}
                >
                  收起
                </Button>
              </div>
            ) : null
          }
        />
                
      </Card>

      {/* 新增 / 编辑弹窗 */}
      <Modal
        title={currentId ? '编辑课程' : '新增课程'}
        open={visible}
        onCancel={() => setVisible(false)}
        width={580}
        destroyOnHidden
        closeIcon={<span style={{ fontSize: 32, color: '#000' ,position:'relative', top:22 , cursor: 'pointer'}}>✖︎</span>}
        styles={{
          header: { 
            padding: '10px 0 12px', 
            borderBottom: '2.7px solid #000' ,
          },
          title: {
            fontSize: 24,      // 标题变大
            fontWeight: 700,  // 更粗
            lineHeight: '36px'
          } 
        }}
        style={{
          padding: 0,
          border:'3px solid #000',
          borderRadius: 10
        }}
        className="custom-modal"
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setVisible(false)}
            style={{ 
              border: '2.5px solid #000', 
              // borderRadius: 8, 
              height: 40, 
              // background: '#fff',
              // color: '#000'
            }}
          >
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={submitting} 
            onClick={handleSubmit}
            style={{ 
              background: '#d0e8ff', 
              color: '#000', 
              border: '2.5px solid #000', 
              borderRadius: 8, 
              height: 40, 
            }}
          >
            {currentId ? '修改' : '保存'}
          </Button>,
        ]}
      >
        <Form 
          form={form} 
          layout="horizontal" 
          labelCol={{ span: 5 }} 
          wrapperCol={{ span: 18 }} 
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label={
              <div style={{ fontSize: 19 ,display:'flex' ,alignItems:'center'}}>
                课程名称
              </div>
            }
            colon={false}
          >
            <Input 
              placeholder="请输入课程名称" 
              style={{ 
                border: '2.5px solid #adadad', 
                borderRadius: 8, 
                height: 44 
              }} 
            />
          </Form.Item>

          <Form.Item name="description" 
            label={
              <div style={{ fontSize: 19 ,display:'flex' ,alignItems:'center'}}>
                课程描述
              </div>
            }
            colon={false}
            style={{ alignItems: 'center', marginBottom: 20 }}
          >
            <TextArea 
              rows={1} 
              placeholder="请输入课程描述" 
              style={{ 
                border: '2.5px solid #adadad', 
                borderRadius: 8, 
                minHeight: 55 
              }} 
            />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="instructor" 
                label={
                  <div style={{ fontSize: 18 ,display:'flex' ,alignItems:'center'}}>
                    讲师
                  </div>
                }
                colon={false}
                labelCol={{ span: 10 }} 
                wrapperCol={{ span: 14 }}
              >
                <Input 
                  placeholder="请输入" 
                  style={{ 
                    border: '2.5px solid #adadad', 
                    borderRadius: 8, 
                    height: 44 
                  }} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="category" 
                label={
                  <div style={{ fontSize: 18 ,display:'flex' ,alignItems:'center'}}>
                    分类
                  </div>
                }
                colon={false}
                labelCol={{ span: 10 }} 
                wrapperCol={{ span: 14 }}
              >
                <Select 
                  placeholder="请选择" 
                  allowClear
                  style={{ 
                    border: '2.5px solid #adadad',
                    borderRadius: 8, 
                    height: 44 
                  }} 
                >
                  {categories.map(c => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="lesson_count" 
                label={
                  <div style={{ fontSize: 18 ,display:'flex' ,alignItems:'center'}}>
                    课时数
                  </div>
                }
                colon={false} 
                initialValue={0}
                labelCol={{ span: 10 }} 
                wrapperCol={{ span: 14 }}
              >
                <Input 
                  type="number" 
                  min={0} 
                  style={{ 
                    border: '2.5px solid #adadad', 
                    borderRadius: 8, 
                    height: 44 
                  }} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="status" 
                label={
                  <div style={{ fontSize: 18 ,display:'flex' ,alignItems:'center'}}>
                    状态
                  </div>
                }
                colon={false} 
                initialValue="draft"
                labelCol={{ span: 10 }} 
                wrapperCol={{ span: 14 }}
              >
                <Select
                  style={{ 
                    border: '2.5px solid #adadad',
                    borderRadius: 8, 
                    height: 44 
                  }} 
                >
                  <Option value="draft" style={{color:'#adadad'}}>草稿</Option>
                  <Option value="published">已发布</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Courses