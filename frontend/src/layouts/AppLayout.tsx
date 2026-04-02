import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import {
  LayoutDashboard, FolderKanban, Upload, LogOut, Package,
  Menu, Users, ShieldCheck, Sun, Moon, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/dashboard',  roles: ['admin','developer','user'], accent: '#6366f1' },
  { label: 'Projects',   icon: FolderKanban,    to: '/projects',   roles: ['admin','developer','user'], accent: '#8b5cf6' },
  { label: 'Upload APK', icon: Upload,           to: '/upload',     roles: ['admin','developer'],        accent: '#10b981' },
  { label: 'Users',           icon: Users,       to: '/users',            roles: ['admin'], accent: '#f59e0b' },
  { label: 'Delete Requests', icon: Trash2,      to: '/delete-requests',  roles: ['admin'], accent: '#f43f5e' },
  { label: 'Audit Logs',      icon: ShieldCheck, to: '/audit-logs',       roles: ['admin'], accent: '#94a3b8' },
]

const ROLE_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  admin:     { label: 'Admin',     cls: 'text-rose-400 border-rose-500/30 bg-rose-500/10',     dot: 'bg-rose-400'   },
  developer: { label: 'Developer', cls: 'text-brand-400 border-brand-500/30 bg-brand-500/10', dot: 'bg-brand-400'  },
  user:      { label: 'Viewer',    cls: 'text-slate-400 border-slate-500/30 bg-slate-500/10', dot: 'bg-slate-400'  },
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role || ''))
  const roleConf = ROLE_CONFIG[user?.role || ''] ?? ROLE_CONFIG.user
  const initials  = (user?.name || user?.email || 'U')[0].toUpperCase()

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-sidebar" style={{ borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
          >
            <Package className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-sidebar" />
        </div>
        <div>
          <span className="font-bold text-base text-primary tracking-tight">CoreX</span>
          <p className="text-[10px] text-muted leading-none mt-0.5">APK Distribution</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 text-muted">Navigation</p>
        {visibleItems.map(({ label, icon: Icon, to, accent }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              isActive
                ? 'nav-item-active'
                : 'nav-item'
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="w-4 h-4 flex-shrink-0 transition-colors"
                  style={{ color: isActive ? accent : undefined }}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 pt-2 space-y-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConf.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${roleConf.dot}`} />
            {roleConf.label}
          </span>
        </div>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{user?.name || user?.email?.split('@')[0]}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 flex-shrink-0"><Sidebar /></div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 backdrop-blur-sm"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--topbar-bg)' }}
        >
          <button
            className="md:hidden p-2 rounded-lg text-muted hover:text-primary hover:bg-overlay transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-500 font-medium">Live</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-overlay transition-all"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
