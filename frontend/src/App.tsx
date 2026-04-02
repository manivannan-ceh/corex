import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import { ThemeContext, useThemeProvider } from './hooks/useTheme'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import UploadPage from './pages/UploadPage'
import PublicDownloadPage from './pages/PublicDownloadPage'
import UsersPage from './pages/UsersPage'
import AuditLogPage from './pages/AuditLogPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  } catch {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  const auth = useAuthProvider()
  const themeCtx = useThemeProvider()

  return (
    <ThemeContext.Provider value={themeCtx}>
      <AuthContext.Provider value={auth}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-strong)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/download" element={<PublicDownloadPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"   element={<DashboardPage />} />
              <Route path="/projects"    element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/upload"      element={<UploadPage />} />
              <Route path="/users"       element={<AdminRoute><UsersPage /></AdminRoute>} />
              <Route path="/audit-logs"  element={<AdminRoute><AuditLogPage /></AdminRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
