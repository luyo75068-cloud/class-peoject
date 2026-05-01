import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CourseComp = lazy(() => import('./pages/Courses'))
const Students = lazy(() => import('./pages/Students'))
const Summary = lazy(() => import('./pages/Summary'))

// 登录验证拦截
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  return children
}

const lazyLoad = (children: React.ReactNode) => (
  <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: '#adb3bd' }}>页面加载中...</div>}>
    {children}
  </Suspense>
)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={lazyLoad(<Login />)} />

        <Route 
          path="/" 
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          
          {/* 将每个页面组件用 lazyLoad 包裹起来 */}
          <Route path="dashboard" element={lazyLoad(<Dashboard />)} />
          <Route path="courses" element={lazyLoad(<CourseComp />)} />
          <Route path="students" element={lazyLoad(<Students />)} />
          <Route path="summary" element={lazyLoad(<Summary />)} />
        </Route>

      </Routes>
    </Router>
  )
}

export default App