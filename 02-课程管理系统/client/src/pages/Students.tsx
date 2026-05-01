import { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Input, Select, Space, Form, Modal,
  message, Popconfirm, Card, Tag ,Row ,Col , Checkbox
} from 'antd'
import { PlusOutlined ,DeleteOutlined} from '@ant-design/icons'
import type { TableProps } from 'antd'
import request from '../api/request'

const { Option } = Select

interface Student {
  id: number
  name: string
  student_no: string
  class_name: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  course_ids: string | number[]
  created_at: string
}

const Students = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [classList, setClassList] = useState<string[]>([])
  const [allCourses, setAllCourses] = useState<any[]>([])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [className, setClassName] = useState('')
  const [status, setStatus] = useState('')

  const [tempKeyword, setTempKeyword] = useState('')
  const [tempClass, setTempClass] = useState('')
  const [tempStatus, setTempStatus] = useState('')

  const [visible, setVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [, setSubmitting] = useState(false);


  const fetchAllCourses = () => {
    request.get('/courses').then(res => {
      if (res.code === 0) setAllCourses(res.data.list)
    })
  }

  const fetchClasses = () => {
    request.get('/students/classes').then(res => {
      if (res.code === 0) setClassList(res.data)
    })
  }

  const fetchList = useCallback(() => {
    setLoading(true);
    request.get('/students', {
      params: { keyword, className, status, page, pageSize }
    }).then(res => {
      if (res.code === 0) {
        const normalizedList = res.data.list.map((student: any) => ({
          ...student,
          course_ids: Array.isArray(student.course_ids) ? student.course_ids : []
        }));
        
        setList(normalizedList);
        setTotal(res.data.total);
      }
    }).finally(() => setLoading(false));
  }, [page, pageSize, keyword, className, status]);
 

  useEffect(() => {
    fetchClasses()
    fetchAllCourses()
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSearch = () => {
    setKeyword(tempKeyword)
    setClassName(tempClass)
    setStatus(tempStatus)
    setPage(1)
  }

  const openCreate = () => {
    setCurrentId(null)
    form.resetFields()
    setVisible(true)
  }

  // 打开编辑弹窗
  const openEdit = async (record: Student) => {
    form.resetFields(); 
    setCurrentId(record.id);
    setVisible(true);

    try {
      const res = await request.get(`/students/${record.id}`);
      if (res.code === 0) {
        const data = res.data;
      
        data.course_ids = Array.isArray(data.course_ids) ? data.course_ids : [];

        requestAnimationFrame(() => {
          form.setFieldsValue(data);
        });
      }
    } catch (err) {
      message.error("获取详情失败");
    }
  };

  // 提交：新增 / 编辑
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const submitData = {
        ...values,
        course_ids: Array.isArray(values.course_ids) ? values.course_ids : []
      };

      const res = currentId
        ? await request.put(`/students/${currentId}`, submitData)
        : await request.post(`/students`, submitData);

      if (res.code === 0) {
        message.success('保存成功');
        setVisible(false);
        fetchList(); 
      }
    } catch (error) {
      console.error('提交失败', error);
    } finally {
      setSubmitting(false);
    }
  };

// 删除
  const handleDelete = async (id: number) => {
    const originalList = [...list]
    setList(prev => prev.filter(item => item.id !== id))

    try {
      const res = await request.delete(`/students/${id}`)
      if (res.code === 0) {
        message.success('删除成功')
        fetchList()
      } else {
        setList(originalList)
        message.error(res.message || '删除失败')
      }
    } catch (error) {
      setList(originalList)
      message.error('网络错误')
    }
  }

  const renderCourseNames = (ids: any) => {
    const arr = Array.isArray(ids) ? ids : [];

    if (arr.length === 0) return '-';
    if (allCourses.length === 0) return '加载中...';

    const names = arr
      .map(id => {
        const target = allCourses.find(c => String(c.id) === String(id));
        return target ? target.name : null;
      })
      .filter(Boolean); 

    return names.length > 0 ? names.join('、') : '-';
  };
  const showList = isExpanded ? list : list.slice(0, 2)
  const hasMore = list.length > 2

  const columns: TableProps<Student>['columns'] = [
    { title: '姓名', 
      dataIndex: 'name', 
      width: 70,
      render: v => (<div color="#9559df" 
        style={{fontSize:16  , fontWeight:500 }}>
          {v}
          </div> ),
     },
    { title: '学号', dataIndex: 'student_no', width: 90 },
    { title: '班级', 
      dataIndex: 'class_name', 
      width: 120 ,
      render: v => (<Tag color="#9559df" 
        style={{border:'2px solid #9559df' , padding:"5px 10px" ,fontSize:14 , background:'rgb(242, 232, 248)'}}>
          {v}
          </Tag> ),
    },
    {
      title: '联系方式',
      width: 180,
      render: (_, r) => (
        <div style={{ lineHeight: '1.4' }}>
          <div style={{ fontWeight: 480 ,fontSize:16}}>{r.phone}</div>
          <div style={{
          fontSize: '15px',
          color: '#adb3bd',
          marginTop: '2px',
        }}>
          {r.email}
        </div>
        </div>
      )
    },
    {
      title: '已选课程',
      dataIndex: 'course_ids',
      width: 240,
      render: (ids) => (
        <div style={{
          width: 230,               
          whiteSpace: 'nowrap',     
          overflow: 'hidden',       
          textOverflow: 'ellipsis', 
          cursor: 'pointer'       
        }} title={renderCourseNames(ids)}> 
          {renderCourseNames(ids)}
        </div>
  ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: v => (
        <Tag
          style={{
            border: v === 'active' ? '2px solid #60c92c' : '2px solid #adb3bd',
            padding: '3px 10px',
            fontSize: 14,
            color: v === 'active' ? '#5cc625' : '#9c9c9e',
            backgroundColor: v === 'active' ? '#f0fff0' : '#f5f5f5',
          }}
        >
          {v === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)} 
          className="no-border-btn"
          style={{color:'#6d9adb'}}>
            ✏️编辑
          </Button>
          <Popconfirm
            title="确定要删除该课程吗？"
            description="删除后数据将无法恢复"
            onConfirm={() => handleDelete(r.id)}
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
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 18,marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center'  }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>学员管理</h2>
        <Button
          type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#d0e8ff', color: '#000', border: '3.5px solid #000', fontSize: 18, height: 48 }}
        >新增学员</Button>
      </div>

      <Card style={{ borderRadius: 10, border: '3.5px solid #000' }}>
        <Space size={12} wrap style={{ marginBottom: 16, 
          display: 'flex', 
          justifyContent: 'flex-start', 
          }}>
          <Input
            placeholder="搜索姓名/学号" prefix='🔍' allowClear
            value={tempKeyword} onChange={e => setTempKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260, border: '2.5px solid #adadad', height: 44, borderRadius: 8 }}
          />
          <Select
            placeholder="全部班级" allowClear
            value={tempClass || undefined} onChange={v => setTempClass(v ?? '')}
            style={{ width: 140, border: '2.5px solid #adadad', height: 44 }}
          >
            {classList.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Select
            placeholder="全部状态" allowClear
            value={tempStatus || undefined} onChange={v => setTempStatus(v ?? '')}
            style={{ width: 120, border: '2.5px solid #adadad', height: 44 }}
          >
            <Option value="active">活跃</Option>
            <Option value="inactive">非活跃</Option>
          </Select>
          <Button onClick={handleSearch}
            style={{ border: '3px solid #000', background: 'transparent', height: 44 }}>🔍搜索</Button>
        </Space>

        <Table
          rowKey="id" 
          className="custom-brutalist-table"
          loading={loading} 
          columns={columns} 
          dataSource={showList}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize:10,
            total,
            showSizeChanger: false,
            showTotal: t => `共 ${t} 条`,
             showLessItems: true,
          }}
          onChange={(p) => { setPage(p.current!); setPageSize(p.pageSize!) }}
          footer={() => 
            !isExpanded && hasMore ? (
              <div
                onClick={() => setIsExpanded(true)}
                style={{
                  textAlign: 'center',
                  padding: '12px 0',
                  color: '#adb3bd',
                  cursor: 'pointer',
                  borderBottom:"1px dashed #adb3bd",
                  fontSize: 14,
                  backgroundColor: '#fff',
                  margin: 0,
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

      {/* 新增 / 编辑学员弹窗 */}
      <Modal
        title={currentId ? '编辑学员' : '新增学员'}
        open={visible}
        onCancel={() => setVisible(false)}
        width={700} 
        destroyOnHidden
        forceRender={false}
        closeIcon={<span style={{ fontSize: 32, color: '#000' ,position:'relative', top:22 , cursor: 'pointer'}}>✖︎</span>}
        styles={{
          header: { 
            padding: '10px 0 12px', 
            borderBottom: '2.7px solid #000' ,
          },
          title: {
            fontSize: 24,      
            fontWeight: 700,  
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
            style={{ border: '2.5px solid #000', height: 40}}
          >
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSubmit} 
            style={{ background: '#d0e8ff', color: '#000', border: '2.5px solid #000', height: 40 }}
          >
            保存
          </Button>
        ]}
      >
        <Form 
          form={form} 
          layout="horizontal" 
          colon={false}
          labelCol={{ span: 6 }} 
          wrapperCol={{ span: 18 }}
        >
          {/* 第一行：姓名 & 学号 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label={<b style={{ fontSize: 18 }}>姓名</b>} rules={[{ required: true }]}>
                <Input style={{ border: '2px solid #adadad', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="student_no" label={<b style={{ fontSize: 18 }}>学号</b>} rules={[{ required: true }]}>
                <Input style={{ border: '2px solid #adadad', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>

          {/* 第二行：班级 & 状态 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="class_name" label={<b style={{ fontSize: 18 }}>班级</b>}>
                <Select placeholder="请选择" style={{ border: '2px solid #adadad', borderRadius: 8, height: 40 }}>
                  {/* 假设你有一个 classList 数据源 */}
                  {['前端2401班', '后端2402班', '全栈2403班'].map(c => (
                    <Select.Option key={c} value={c}>{c}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={<b style={{ fontSize: 18 }}>状态</b>} initialValue="active">
                <Select style={{ border: '2px solid #adadad', borderRadius: 8, height: 40 }}>
                  <Select.Option value="active">活跃</Select.Option>
                  <Select.Option value="inactive">非活跃</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 第三行：手机号 & 邮箱 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label={<b style={{ fontSize: 18 }}>手机号</b>}>
                <Input style={{ border: '2px solid #adadad', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={<b style={{ fontSize: 18 }}>邮箱</b>}>
                <Input style={{ border: '2px solid #adadad', borderRadius: 8, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>

          {/* 第四行：动态读取后端课程数据 */}
          <Row>
            <Col span={24}>
              <Form.Item 
                name="course_ids" 
                label={<b style={{ fontSize: 18 }}>课程</b>} 
                labelCol={{ span: 3 }} 
                wrapperCol={{ span: 21 }}
              >
                <Checkbox.Group style={{ 
                  border: '3px dashed #adadad', 
                  borderRadius: 12, 
                  padding: '16px',
                  backgroundColor: '#fff',
                  maxHeight: '220px', 
                  overflowY: 'auto' 
                }}>
                    <Row gutter={[0, 12]}>
                      
                      {allCourses.map((course) => (
                        <Col span={8} key={course.id}>
                          <Checkbox value={course.id} style={{ fontSize: 15 }}>
                            {course.name}
                          </Checkbox>
                        </Col>
                      ))}
                      {allCourses.length === 0 && (
                        <span style={{ color: '#999' }}>暂无课程，请先添加课程</span>
                      )}
                    </Row>
                  </Checkbox.Group>
              </Form.Item>
            </Col>
          </Row>
          
        </Form>
      </Modal>
    </div>
  )
}

export default Students