import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Package, ArrowUpRight, Clock, TrendingUp } from 'lucide-react'
import { getProjects, getReleases } from '../services/api'
import type { Project, Release } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'
import ChannelBadge from '../components/ChannelBadge'
import { useAuth } from '../hooks/useAuth'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  gradient: string
  glow: string
  border: string
}

function StatCard({ label, value, icon: Icon, gradient, glow, border }: StatCardProps) {
  return (
    <div
      className="card-accent p-6 flex items-center gap-5 transition-all duration-200 group hover:scale-[1.01] cursor-default"
      style={{ borderColor: border }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient, boxShadow: `0 4px 20px ${glow}` }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: projects, loading: pLoad, error: pErr, run: runProjects } = useAsync<Project[]>()
  const { data: recentReleases, loading: rLoad, run: runReleases } = useAsync<Release[]>()

  useEffect(() => {
    runProjects(getProjects())
  }, [])

  useEffect(() => {
    if (projects && projects.length > 0) {
      Promise.all(projects.slice(0, 3).map((p) => getReleases(p.id)))
        .then((arrays) => {
          const flat = arrays.flat().sort(
            (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
          )
          runReleases(Promise.resolve(flat.slice(0, 8)))
        })
        .catch(() => {})
    }
  }, [projects])

  const totalReleases = projects?.reduce((acc, p) => acc + (p.release_count || 0), 0) ?? 0

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  const projectMap = new Map(projects?.map((p) => [p.id, p.name]) ?? [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = user?.name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="gradient-text">{name}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here's what's happening with your releases.</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary hidden sm:inline-flex"
        >
          <Package className="w-4 h-4" /> Upload APK
        </button>
      </div>

      {pErr && <ErrorAlert message={pErr} onRetry={() => runProjects(getProjects())} />}

      {/* Stats */}
      {pLoad ? (
        <Spinner fullPage />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Projects"
            value={projects?.length ?? 0}
            icon={FolderKanban}
            gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            glow="rgba(99,102,241,0.4)"
            border="rgba(99,102,241,0.2)"
          />
          <StatCard
            label="Total Releases"
            value={totalReleases}
            icon={Package}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            glow="rgba(16,185,129,0.4)"
            border="rgba(16,185,129,0.2)"
          />
          <StatCard
            label="Recent Uploads"
            value={recentReleases?.length ?? 0}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            glow="rgba(139,92,246,0.4)"
            border="rgba(139,92,246,0.2)"
          />
        </div>
      )}

      {/* Recent Uploads */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <h2 className="font-semibold text-white text-sm">Recent Uploads</h2>
          </div>
          <button onClick={() => navigate('/projects')} className="btn-ghost text-xs py-1.5 gap-1">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {rLoad ? (
          <div className="p-8"><Spinner /></div>
        ) : !recentReleases || recentReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Package className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium text-slate-500">No releases yet</p>
            <p className="text-xs text-slate-600 mt-1 mb-4">Upload your first APK to get started</p>
            <button onClick={() => navigate('/upload')} className="btn-primary text-xs">
              <Package className="w-3.5 h-3.5" /> Upload APK
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Project', 'Version', 'Channel', 'Uploaded'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-600 tracking-wide uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentReleases.map((r) => (
                  <tr
                    key={r.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/projects/${r.project_id}`)}
                  >
                    <td className="px-6 py-3.5 text-slate-300 font-medium">
                      {projectMap.get(r.project_id) ?? `Project #${r.project_id}`}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-white font-mono text-sm">{r.version_name}</span>
                      <span className="text-slate-600 text-xs ml-1.5 font-mono">({r.version_code})</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <ChannelBadge channel={r.channel} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{formatDate(r.uploaded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
