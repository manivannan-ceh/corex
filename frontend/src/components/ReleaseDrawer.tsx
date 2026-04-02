import { useEffect } from 'react'
import {
  X, Download, Share2, Calendar, Hash, Cpu, HardDrive,
  Layers, FileText, Package,
} from 'lucide-react'
import type { Release } from '../services/api'
import ChannelBadge from './ChannelBadge'

interface Props {
  release: Release | null
  onClose: () => void
  onDownload: (r: Release) => void
  onShare: (r: Release) => void
  canShare: boolean
  downloading: boolean
}

const TYPE_COLORS: Record<string, string> = {
  feature: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  patch:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
  hotfix:  'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

function formatBytes(b?: number) {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReleaseDrawer({ release, onClose, onDownload, onShare, canShare, downloading }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!release) return null

  const typeColor = TYPE_COLORS[release.release_type] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20'

  const meta = [
    { icon: Hash,      label: 'Version Code', value: `#${release.version_code}`,              mono: true  },
    { icon: Layers,    label: 'Release Type',  value: release.release_type || 'feature',       mono: false },
    { icon: Cpu,       label: 'Min SDK',        value: `API ${release.min_sdk ?? 21}`,          mono: true  },
    { icon: Cpu,       label: 'Target SDK',     value: `API ${release.target_sdk ?? 34}`,       mono: true  },
    { icon: HardDrive, label: 'File Size',      value: formatBytes(release.file_size),          mono: false },
    { icon: Calendar,  label: 'Uploaded',       value: formatDate(release.uploaded_at || release.created_at), mono: false },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col animate-slide-right"
        style={{
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <ChannelBadge channel={release.channel} />
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${typeColor}`}>
                {release.release_type || 'feature'}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-mono text-primary truncate">{release.version_name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Build #{release.version_code}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl transition-all hover:bg-overlay-2"
            style={{ color: 'var(--text-3)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Metadata grid */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
              Release Info
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {meta.map(({ icon: Icon, label, value, mono }) => (
                <div
                  key={label}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</span>
                  </div>
                  <p
                    className={`text-sm font-semibold capitalize ${mono ? 'font-mono' : ''}`}
                    style={{ color: 'var(--text-1)' }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Changelog */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Changelog
              </p>
            </div>
            {release.changelog ? (
              <div
                className="rounded-xl p-4"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <pre
                  className="text-sm whitespace-pre-wrap font-mono leading-relaxed"
                  style={{ color: 'var(--text-2)' }}
                >
                  {release.changelog}
                </pre>
              </div>
            ) : (
              <div
                className="rounded-xl p-6 flex flex-col items-center justify-center text-center"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <Package className="w-8 h-8 mb-2 opacity-30" style={{ color: 'var(--text-3)' }} />
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>No changelog provided</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => onDownload(release)}
            disabled={downloading}
            className="btn-primary w-full justify-center py-3"
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? 'Preparing download…' : 'Download APK'}
          </button>
          {canShare && (
            <button
              onClick={() => onShare(release)}
              className="btn-ghost w-full justify-center py-2.5"
              style={{ border: '1px solid var(--border-strong)' }}
            >
              <Share2 className="w-4 h-4" /> Share Release
            </button>
          )}
        </div>
      </div>
    </>
  )
}
