import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { SearchOutlined, BookOutlined, LogoutOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || '用户';

  const menuItems = [
    { key: '/search', icon: <SearchOutlined />, label: '智能查词' },
    { key: '/vocabulary', icon: <BookOutlined />, label: '我的单词本' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 硬核侧边栏 */}
      <Sider 
        width={240} 
        style={{ 
          background: '#fff', 
          borderRight: '4px solid #000',
          paddingTop: 20 
        }}
      >
        <div style={{ padding: '0 24px 30px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: 24, fontWeight: 900, border: '3px solid #000', 
            padding: '5px', borderRadius: 8, background: '#d0e8ff',
          }}>
           AI 智能单词本
          </div>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ borderRight: 0, fontWeight: 700, fontSize: 16 }}
        />

        <div style={{ position: 'absolute', bottom: 30, width: '100%', padding: '0 20px' }}>
          <div style={{ marginBottom: 15, fontWeight: 800, textAlign: 'center' }}>👤 {username}</div>
          <Button 
            block 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ border: '2px solid #000', fontWeight: 700, height: 40 }}
          >
            退出登录
          </Button>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout style={{ background: '#f0f2f5', padding: '24px' }}>
        <Content>
          {/* 这里会渲染匹配到的子页面 */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;