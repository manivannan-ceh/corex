import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Package, ArrowUpRight, Clock, GitBranch } from 'lucide-react'
import { getProjects, getRecentReleases } from '../services/api'
import type { Project, RecentRelease } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'
import ChannelBadge from '../components/ChannelBadge'
import { useAuth } from '../hooks/useAuth'

function StatCard({
  label, value, sub, icon: Icon, gradient, glow, borderColor, onClick,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; gradient: string; glow: string; borderColor: string
  onClick?: () => void
}) {
  return (
    <div
      className="card-accent p-6 flex items-center gap-5 transition-all duration-200 hover:scale-[1.01]"
      style={{ borderColor, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
           style={{ background: gradient, boxShadow: `0 4px 20px ${glow}` }}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-primary tabular-nums">{value}</p>
        <p className="text-sm text-secondary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatBytes(b: number) {
  if (!b) return '—'
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const TYPE_COLOR: Record<string, string> = {
  feature: 'bg-brand-500/15 text-brand-400',
  patch:   'bg-amber-500/15 text-amber-400',
  hotfix:  'bg-rose-500/15 text-rose-400',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: projects, loading: pLoad, error: pErr, run: runProjects } = useAsync<Project[]>()
  const { data: recentReleases, loading: rLoad, error: rErr, run: runReleases } = useAsync<RecentRelease[]>()

  useEffect(() => {
    runProjects(getProjects())
    runReleases(getRecentReleases())
  }, [])

  const canUpload  = user?.role === 'admin' || user?.role === 'developer'
  const totalReleases = projects?.reduce((acc, p) => acc + (p.release_count ?? 0), 0) ?? 0

  // Most active project (most releases)
  const topProject = projects?.slice().sort((a, b) => (b.release_count ?? 0) - (a.release_count ?? 0))[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = user?.name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {greeting}, <span className="gradient-text">{name}</span>
          </h1>
          <p className="text-secondary text-sm mt-1">Overview of your APK distribution platform.</p>
        </div>
        {canUpload && (
          <button onClick={() => navigate('/upload')} className="btn-primary hidden sm:inline-flex">
            <Package className="w-4 h-4" /> Upload APK
          </button>
        )}
      </div>

      {pErr && <ErrorAlert message={pErr} onRetry={() => runProjects(getProjects())} />}

      {/* Stats */}
      {pLoad ? <Spinner fullPage /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Projects" value={projects?.length ?? 0}
            sub={topProject ? `Most active: ${topProject.name}` : undefined}
            icon={FolderKanban}
            gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)"
            glow="rgba(99,102,241,0.4)" borderColor="rgba(99,102,241,0.2)"
            onClick={() => navigate('/projects')}
          />
          <StatCard
            label="Total Releases" value={totalReleases}
            sub={totalReleases > 0 ? `across ${projects?.length ?? 0} projects` : 'No releases yet'}
            icon={GitBranch}
            gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)"
            glow="rgba(16,185,129,0.4)" borderColor="rgba(16,185,129,0.2)"
          />
          <StatCard
            label="Latest Release"
            value={recentReleases?.[0]?.version_name ?? '—'}
            sub={recentReleases?.[0] ? `${recentReleases[0].project_name} · ${timeAgo(recentReleases[0].created_at)}` : 'Nothing yet'}
            icon={Clock}
            gradient="linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)"
            glow="rgba(139,92,246,0.4)" borderColor="rgba(139,92,246,0.2)"
            onClick={recentReleases?.[0] ? () => navigate(`/projects/${recentReleases[0].project_id}`) : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent releases table — takes 2/3 width */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4"
               style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <h2 className="font-semibold text-primary text-sm">Recent Releases</h2>
            </div>
            <button onClick={() => navigate('/projects')} className="btn-ghost text-xs py-1.5 gap-1">
              All projects <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {rErr && <div className="px-6 py-4"><ErrorAlert message={rErr} onRetry={() => runReleases(getRecentReleases())} /></div>}

          {rLoad ? (
            <div className="p-8"><Spinner /></div>
          ) : !recentReleases || recentReleases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Package className="w-6 h-6 text-muted" />
              </div>
              <p className="text-sm font-medium text-secondary">No releases yet</p>
              {canUpload && (
                <button onClick={() => navigate('/upload')} className="btn-primary text-xs mt-4">
                  <Package className="w-3.5 h-3.5" /> Upload first APK
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Project', 'Version', 'Channel', 'Type', 'Size', 'When'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted tracking-wide uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentReleases.map((r) => (
                    <tr key={r.id} className="table-row-hover cursor-pointer"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onClick={() => navigate(`/projects/${r.project_id}`)}>
                      <td className="px-5 py-3.5 font-medium text-secondary">{r.project_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold text-primary">{r.version_name}</span>
                        <span className="text-muted text-xs ml-1.5 font-mono">({r.version_code})</span>
                      </td>
                      <td className="px-5 py-3.5"><ChannelBadge channel={r.channel} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLOR[r.release_type] || 'bg-slate-500/15 text-slate-400'}`}>
                          {r.release_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted text-xs font-mono">{formatBytes(r.file_size)}</td>
                      <td className="px-5 py-3.5 text-muted text-xs">{timeAgo(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Projects sidebar — 1/3 width */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"
               style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                <FolderKanban className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <h2 className="font-semibold text-primary text-sm">Projects</h2>
            </div>
            <button onClick={() => navigate('/projects')} className="btn-ghost text-xs py-1.5 gap-1">
              All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pLoad ? (
            <div className="p-6"><Spinner /></div>
          ) : !projects || projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FolderKanban className="w-8 h-8 text-muted mb-3 opacity-40" />
              <p className="text-sm text-muted">No projects yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {projects.slice(0, 8).map((p) => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                     className="flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors"
                     style={{ ['--hover-bg' as string]: 'var(--bg-overlay)' }}
                     onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-overlay)')}
                     onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary truncate">{p.name}</p>
                    {p.package_name && (
                      <p className="text-xs text-muted font-mono truncate">{p.package_name}</p>
                    )}
                  </div>
                  <span className="ml-3 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {p.release_count ?? 0}
                  </span>
                </div>
              ))}
              {(projects?.length ?? 0) > 8 && (
                <div className="px-5 py-3 text-center">
                  <button onClick={() => navigate('/projects')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    +{(projects?.length ?? 0) - 8} more projects
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
