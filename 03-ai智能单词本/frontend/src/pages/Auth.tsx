import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Auth = () => {
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true) // 切换登录/注册
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    setLoading(true)
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    
    try {
      // 对接你的 Go 后端端口 8080
      const res = await axios.post(endpoint, values)
      
      // 成功处理
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
      localStorage.setItem('username', values.username)
      message.success(isLogin ? '欢迎回来！' : '注册成功，请登录')
      
      if (isLogin) {
        navigate('/search') // 登录成功跳转
      } else {
        setIsLogin(true) // 注册成功切回登录
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || '账号或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white' // 浅灰背景衬托卡片
    }}>
      <Card style={{ 
        width: 420, 
        borderRadius: 16, 
        border: '3px solid #000', 
        padding: '20px 15px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: '#d0e8ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 32, border: '3px solid #000'
          }}>
            {isLogin ? '📖' : '✍️'}
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
            {isLogin ? 'AI智能单词本' : '创建新账号'}
          </h2>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item 
            name="username" 
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<span style={{ fontSize: 18 }}>👤</span>}
              placeholder="用户名" 
              size="large" 
              style={{ border: '2px solid #000', borderRadius: 8, height: 45 }}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<span style={{ fontSize: 18 }}>🔒</span>}
              placeholder="密码" 
              size="large" 
              style={{ border: '2px solid #000', borderRadius: 8, height: 45 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large" 
              loading={loading}
              style={{ 
                height: 50, 
                fontSize: 18, 
                borderRadius: 10, 
                color: '#000', 
                border: '3px solid #000', 
                background: isLogin ? '#d0e8ff' : '#b7eb8f', // 登录蓝，注册绿
                fontWeight: 700,
              }}
            >
              {isLogin ? '登 录' : '立 即 注 册'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button 
            type="link" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}
          >
            {isLogin ? '还没有账号？点击去注册' : '已有账号？返回登录'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Auth