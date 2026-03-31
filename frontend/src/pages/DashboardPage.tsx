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

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <div className="card p-6 flex items-center gap-4 group hover:border-white/[0.12] transition-all duration-200">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
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
      // Fetch releases for up to first 3 projects and flatten
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.name || user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your releases today.</p>
      </div>

      {pErr && <ErrorAlert message={pErr} onRetry={() => runProjects(getProjects())} />}

      {/* Stats */}
      {pLoad ? (
        <Spinner fullPage />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Projects"
            value={projects?.length ?? 0}
            icon={FolderKanban}
            color="bg-brand-600/20 text-brand-400"
          />
          <StatCard
            label="Total Releases"
            value={totalReleases}
            icon={Package}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            label="Recent Uploads"
            value={recentReleases?.length ?? 0}
            icon={TrendingUp}
            color="bg-purple-500/20 text-purple-400"
          />
        </div>
      )}

      {/* Recent Uploads */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-white text-sm">Recent Uploads</h2>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="btn-ghost text-xs py-1.5"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {rLoad ? (
          <div className="p-6"><Spinner /></div>
        ) : !recentReleases || recentReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No releases yet — upload your first APK!</p>
            <button onClick={() => navigate('/upload')} className="btn-primary mt-4 text-xs">
              Upload APK
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Project', 'Version', 'Channel', 'Uploaded'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-500 tracking-wide uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentReleases.map((r) => (
                  <tr key={r.id} className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/projects/${r.project_id}`)}>
                    <td className="px-6 py-3.5 text-slate-300 font-medium">
                      {projectMap.get(r.project_id) ?? `Project #${r.project_id}`}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-white font-mono">{r.version_name}</span>
                      <span className="text-slate-500 text-xs ml-1.5">({r.version_code})</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <ChannelBadge channel={r.channel} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(r.uploaded_at)}</td>
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
