import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

const MainLayout = () => {
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState('dashboard')

  const menus = [
    { key: 'dashboard', label: '📊 工作台', path: '/dashboard' },
    { key: 'courses', label: '📚 课程管理', path: '/courses' },
    { key: 'students', label: '👥 学生管理', path: '/students' },
    { key: 'summary', label: '📝 学习总结', path: '/summary' },
  ]

  const handleMenuClick = (menu: any) => {
    setSelectedKey(menu.key)
    navigate(menu.path)
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#fff',
      margin: 0,
      padding: 0,
    }}>

      {/* 左侧侧边栏 */}
      <div style={{
        width: 260,
        backgroundColor: '#fff',
        color: '#000',
        padding: '20px 0',
        boxSizing: 'border-box',
        borderRight:'3px solid black'
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          margin: "5px 20px",
          paddingBottom: 16,
          borderBottom: '3px solid #1f2d3d',
        }}>
          🎓 学习管理平台
        </div>

        {/* 菜单 */}
        <div>
          {menus.map(item => (
            <div
              key={item.key}
              onClick={() => handleMenuClick(item)}
              style={{
                padding: '14px 24px',
                fontSize: 18,
                fontWeight:550,
                cursor: 'pointer',
                textAlign:'left',
                paddingLeft:50,
                borderRadius:10,
                margin:'0 15px',
                border:selectedKey === item.key ? '2.5px solid #4e92da' : 'none',
                backgroundColor: selectedKey === item.key ? '#e8f0fe' : 'transparent',
                transition: 'all 0.2s',
                marginBottom: 4,
              }}
              onMouseEnter={(e) => {
                if (selectedKey !== item.key) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#e8f0fe'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedKey !== item.key) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧内容 */}
      <div style={{
        flex: 1,
        padding: '24px',
        boxSizing: 'border-box',
      }}>
        {/* --- 新增：顶部 Header --- */}
        <div style={{
          height: 60, 
          borderBottom: '2px dashed #adadad', 
          display: 'flex',
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 24px',
          backgroundColor: '#fff',
        }}>

          <div style={{ 
            fontSize: 28, 
            fontWeight: 900, 
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4e92da')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#000')}
          >
            ☰
          </div>

          {/* 右侧：管理员信息 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            cursor: 'pointer' 
          }}>
          
            {/* 文字 */}
            <span style={{ fontSize: 22, fontWeight: 600 ,color:'black'}}>👤 管理员 ▾</span>
          </div>
        </div>
        <Outlet />
      </div>

    </div>
  )
}

export default MainLayout