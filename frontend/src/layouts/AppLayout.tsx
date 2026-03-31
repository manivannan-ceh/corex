import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  LogOut,
  Package,
  ChevronRight,
  Menu,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', roles: ['admin', 'developer', 'user'] },
  { label: 'Projects', icon: FolderKanban, to: '/projects', roles: ['admin', 'developer', 'user'] },
  { label: 'Upload APK', icon: Upload, to: '/upload', roles: ['admin', 'developer'] },
  { label: 'Users', icon: Users, to: '/users', roles: ['admin'] },
  { label: 'Audit Logs', icon: ShieldCheck, to: '/audit-logs', roles: ['admin'] },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role || '')
  )

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-[#0f1117] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/40">
          <Package className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">CoreX</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(isActive ? 'nav-item-active' : 'nav-item')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Role badge + user section */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
        {user?.role && (
          <div className="px-3">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
              user.role === 'admin'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                : user.role === 'developer'
                ? 'bg-brand-500/15 text-brand-400 border-brand-500/20'
                : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
            }`}>
              {user.role}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold select-none">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 md:px-6 bg-[#0f1117]/80 backdrop-blur-sm flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
            <span className="text-white font-medium">CoreX</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Connected</span>
            </div>
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
