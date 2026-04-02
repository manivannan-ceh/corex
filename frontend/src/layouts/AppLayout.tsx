import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  LogOut,
  Package,
  Menu,
  Users,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    roles: ['admin', 'developer', 'user'],
    color: 'text-brand-400',
    activeBg: 'from-brand-600/20 to-brand-700/10',
  },
  {
    label: 'Projects',
    icon: FolderKanban,
    to: '/projects',
    roles: ['admin', 'developer', 'user'],
    color: 'text-violet-400',
    activeBg: 'from-violet-600/20 to-violet-700/10',
  },
  {
    label: 'Upload APK',
    icon: Upload,
    to: '/upload',
    roles: ['admin', 'developer'],
    color: 'text-emerald-400',
    activeBg: 'from-emerald-600/20 to-emerald-700/10',
  },
  {
    label: 'Users',
    icon: Users,
    to: '/users',
    roles: ['admin'],
    color: 'text-amber-400',
    activeBg: 'from-amber-600/20 to-amber-700/10',
  },
  {
    label: 'Audit Logs',
    icon: ShieldCheck,
    to: '/audit-logs',
    roles: ['admin'],
    color: 'text-rose-400',
    activeBg: 'from-rose-600/20 to-rose-700/10',
  },
]

const ROLE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  admin:     { label: 'Admin',     color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',     dot: 'bg-rose-400' },
  developer: { label: 'Developer', color: 'text-brand-400 border-brand-500/30 bg-brand-500/10', dot: 'bg-brand-400' },
  user:      { label: 'Viewer',    color: 'text-slate-400 border-slate-500/30 bg-slate-500/10', dot: 'bg-slate-400' },
}

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

  const roleConf = ROLE_CONFIG[user?.role || ''] ?? ROLE_CONFIG.user
  const initials = (user?.name || user?.email || 'U')[0].toUpperCase()

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-[#080c14] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
            <Package className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080c14]" />
        </div>
        <div>
          <span className="font-bold text-base text-white tracking-tight">CoreX</span>
          <p className="text-[10px] text-slate-600 leading-none mt-0.5">APK Distribution</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {visibleItems.map(({ label, icon: Icon, to, color, activeBg }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              isActive
                ? clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-white',
                    `bg-gradient-to-r ${activeBg}`,
                    'border border-white/[0.08]',
                  )
                : clsx('nav-item', color + '/0 hover:' + color)
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-4 h-4 flex-shrink-0 transition-colors', isActive ? color : 'text-slate-500 group-hover:' + color)} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.06] space-y-3 flex-shrink-0">
        {/* Role badge */}
        <div className="px-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConf.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${roleConf.dot}`} />
            {roleConf.label}
          </span>
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || user?.email?.split('@')[0]}</p>
            <p className="text-xs text-slate-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c14]">
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
          <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-4 md:px-6 bg-[#080c14]/90 backdrop-blur-sm flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Breadcrumb placeholder */}
          <div className="hidden md:block" />
          {/* Right side indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
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
