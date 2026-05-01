import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import request from '../api/request'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: { username: string; password: string }) => {
  setLoading(true)
  try {
    const res: any = await request.post('/auth/login', values)

    if (res.code === 0) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
      message.success('登录成功')
      navigate('/dashboard')
    } else {
      message.error(res.data.msg || '登录失败')
    }
  } catch (err: any) {
    message.error('账号或密码错误')
  }
  setLoading(false)
}

  return (
    <div style={{
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
      <Card style={{ width: 420, borderRadius: 12, border: '3px solid #000' ,padding:15}}>
        <div style={{ textAlign: 'center', marginBottom: 28 ,marginTop:7 }}>
          <div style={{
            width: 60, height:60, borderRadius: '50%', background: '#e6f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 28, border: '3px solid #000'
          }}>👤</div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>在线学习管理平台</h2>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<span style={{ fontSize: 18 }} >👤</span> }
              placeholder="请输入用户名" size="large" style={{border:'2px solid #b6b6b6'}}/>
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<span style={{ fontSize: 18 }} >🔒</span>}
              placeholder="请输入密码" size="large" style={{border:'2px solid #b6b6b6'}}/>
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}
              style={{ height: 44, fontSize: 20, borderRadius: 8, color:'black', border: '3px solid #000' ,background:'#d0e8ff', fontWeight:600}}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#9da5b1', fontSize: 20 ,fontWeight:500}}>
          测试账号：admin / admin123
        </div>
      </Card>
    </div>
  )
}

export default Login
