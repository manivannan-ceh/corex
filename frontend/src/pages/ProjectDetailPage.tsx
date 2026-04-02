import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Download, Share2, Package, Calendar, Code2,
  Upload, Hash, Cpu, Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjects, getReleases, getDownloadUrl } from '../services/api'
import type { Project, Release } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'
import ChannelBadge from '../components/ChannelBadge'
import ShareModal from '../components/ShareModal'
import ReleaseDrawer from '../components/ReleaseDrawer'
import { useAuth } from '../hooks/useAuth'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatBytes(b?: number) {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

const TYPE_COLOR: Record<string, string> = {
  feature: 'bg-brand-500/15 text-brand-400',
  patch:   'bg-amber-500/15 text-amber-400',
  hotfix:  'bg-rose-500/15 text-rose-400',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const projectId = Number(id)

  const { data: projects, loading: pLoad, run: runProjects } = useAsync<Project[]>()
  const { data: releases, loading: rLoad, error: rErr, run: runReleases } = useAsync<Release[]>()
  const [shareRelease,   setShareRelease]   = useState<Release | null>(null)
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)
  const [downloadingId,  setDownloadingId]  = useState<number | null>(null)

  const project   = projects?.find((p) => p.id === projectId)
  const canUpload = user?.role === 'admin' || user?.role === 'developer'
  const canShare  = user?.role === 'admin' || user?.role === 'developer'

  useEffect(() => {
    runProjects(getProjects())
    runReleases(getReleases(projectId))
  }, [projectId])

  const handleDownload = async (release: Release) => {
    setDownloadingId(release.id)
    try {
      const url = await getDownloadUrl(release.id)
      const a = document.createElement('a')
      a.href = url
      a.download = `${release.version_name}.apk`
      a.target = '_blank'
      a.click()
      toast.success('Download started')
    } catch {
      toast.error('Failed to get download URL')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="btn-ghost flex-shrink-0"
          style={{ border: '1px solid var(--border)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          {pLoad ? (
            <div className="h-7 w-48 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
          ) : (
            <>
              <h1 className="text-2xl font-bold text-primary">{project?.name ?? `Project #${projectId}`}</h1>
              {project?.description && <p className="text-slate-500 text-sm mt-0.5">{project.description}</p>}
              {project?.package_name && (
                <p className="text-xs text-muted font-mono mt-1">{project.package_name}</p>
              )}
            </>
          )}
        </div>
        {canUpload && (
          <button
            onClick={() => navigate(`/upload?project=${projectId}`)}
            className="btn-primary flex-shrink-0"
          >
            <Upload className="w-4 h-4" /> Upload APK
          </button>
        )}
      </div>

      {/* Releases */}
      <div>
        <div className="flex gap-1 mb-4">
          <span className="tab-active">Versions ({releases?.length ?? 0})</span>
        </div>

        {rErr && <ErrorAlert message={rErr} onRetry={() => runReleases(getReleases(projectId))} />}

        <div className="card overflow-hidden">
          {rLoad ? (
            <div className="p-8"><Spinner fullPage /></div>
          ) : !releases || releases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Package className="w-7 h-7 text-muted" />
              </div>
              <p className="text-sm font-medium text-secondary mb-1">No versions uploaded yet</p>
              {canUpload && (
                <button onClick={() => navigate(`/upload?project=${projectId}`)} className="btn-primary text-xs mt-3">
                  <Upload className="w-3.5 h-3.5" /> Upload first APK
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                      { label: 'Version', icon: Code2  },
                      { label: 'Code',    icon: Hash   },
                      { label: 'Type',    icon: Layers },
                      { label: 'Channel', icon: null   },
                      { label: 'SDK',     icon: Cpu    },
                      { label: 'Size',    icon: null   },
                      { label: 'Uploaded', icon: Calendar },
                      { label: 'Actions', icon: null  },
                    ].map(({ label }) => (
                      <th key={label} className="text-left px-4 py-3 text-xs font-semibold text-muted tracking-wide uppercase whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: 'none' }}>
                  {releases.map((r) => (
                    <tr
                      key={r.id}
                      className="table-row-hover group cursor-pointer"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onClick={() => setSelectedRelease(r)}
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-primary">{r.version_name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-slate-400 font-mono text-xs px-2 py-0.5 rounded-md"
                              style={{ background: 'var(--bg-elevated)' }}>
                          {r.version_code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLOR[r.release_type] || 'bg-slate-500/15 text-slate-400'}`}>
                          {r.release_type || 'feature'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ChannelBadge channel={r.channel} />
                      </td>
                      <td className="px-4 py-4 text-muted text-xs font-mono whitespace-nowrap">
                        {r.min_sdk ?? 21}–{r.target_sdk ?? 34}
                      </td>
                      <td className="px-4 py-4 text-muted text-xs">{formatBytes(r.file_size)}</td>
                      <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(r.uploaded_at || r.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDownload(r)}
                            disabled={downloadingId === r.id}
                            className="btn-ghost py-1.5 px-3 text-xs"
                            style={{ border: '1px solid var(--border)' }}
                          >
                            {downloadingId === r.id
                              ? <span className="w-3.5 h-3.5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                              : <Download className="w-3.5 h-3.5" />
                            }
                            Download
                          </button>
                          {canShare && (
                            <button
                              onClick={() => setShareRelease(r)}
                              className="btn-ghost py-1.5 px-3 text-xs"
                              style={{ border: '1px solid var(--border)' }}
                            >
                              <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-center text-xs py-3 text-muted">
                Click any row to view full release details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Release detail drawer */}
      <ReleaseDrawer
        release={selectedRelease}
        onClose={() => setSelectedRelease(null)}
        onDownload={(r) => { handleDownload(r) }}
        onShare={(r)    => { setSelectedRelease(null); setShareRelease(r) }}
        canShare={canShare}
        downloading={downloadingId === selectedRelease?.id}
      />

      <ShareModal
        isOpen={!!shareRelease}
        onClose={() => setShareRelease(null)}
        release={shareRelease}
      />
    </div>
  )
}
