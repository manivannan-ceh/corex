import { useState } from 'react'
import { Link2, Code2, Copy, RefreshCw, Calendar, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { generateShareCode, generateShareLink } from '../services/api'
import type { Release, ShareCode, ShareLink } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from './Spinner'
import ErrorAlert from './ErrorAlert'

interface Props {
  isOpen: boolean
  onClose: () => void
  release: Release | null
}

type TabId = 'code' | 'link'

export default function ShareModal({ isOpen, onClose, release }: Props) {
  const [tab, setTab] = useState<TabId>('code')
  const { data: shareCode, loading: codeLoading, error: codeError, run: runCode, reset: resetCode } = useAsync<ShareCode>()
  const { data: shareLink, loading: linkLoading, error: linkError, run: runLink, reset: resetLink } = useAsync<ShareLink>()
  const [expiryHours, setExpiryHours] = useState(24)
  const [singleUse, setSingleUse] = useState(false)

  const handleGenerateCode = () => { if (release) runCode(generateShareCode(release.id)) }
  const handleGenerateLink = () => { if (release) runLink(generateShareLink(release.id, expiryHours, singleUse)) }
  const handleCopy = (text: string, label = 'Copied!') => navigator.clipboard.writeText(text).then(() => toast.success(label))

  const handleClose = () => { resetCode(); resetLink(); setTab('code'); onClose() }
  const formatExpiry = (iso: string) => { try { return new Date(iso).toLocaleString() } catch { return iso } }

  const shareUrl = shareLink ? `${window.location.origin}/download?token=${shareLink.token}` : ''

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Share — ${release?.version_name ?? ''}`}>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
        {([['code', 'Access Code', Code2], ['link', 'Share Link', Link2]] as [TabId, string, React.ElementType][]).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'btn-primary shadow-none' : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        )}
      </div>

      {/* Code tab */}
      {tab === 'code' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-sm text-secondary">
            Generate a one-time 8-character code (valid 15 minutes). Share via chat or email.
          </p>

          {codeError && <ErrorAlert message={codeError} />}

          {!shareCode ? (
            <button onClick={handleGenerateCode} disabled={codeLoading} className="btn-primary w-full justify-center">
              {codeLoading ? <Spinner /> : <><RefreshCw className="w-4 h-4" /> Generate Code</>}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div
                  className="flex-1 px-4 py-3 rounded-xl font-mono text-2xl font-bold text-brand-400 tracking-[0.3em] text-center select-all"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  {shareCode.code}
                </div>
                <button onClick={() => handleCopy(shareCode.code, 'Code copied!')}
                  className="btn-ghost flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expires: {formatExpiry(shareCode.expiry_time)}</span>
              </div>
              <p className="text-xs text-muted">
                Recipient goes to{' '}
                <span className="font-mono text-secondary">{window.location.origin}/download</span>{' '}
                and enters the code.
              </p>
              <button onClick={handleGenerateCode} disabled={codeLoading}
                className="btn-ghost text-xs w-full justify-center" style={{ border: '1px solid var(--border)' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Generate new code
              </button>
            </div>
          )}
        </div>
      )}

      {/* Link tab */}
      {tab === 'link' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-sm text-secondary">
            Generate a time-limited shareable link with optional single-use restriction.
          </p>

          {linkError && <ErrorAlert message={linkError} />}

          {!shareLink ? (
            <div className="space-y-4">
              {/* Expiry */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Expiry
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 6, 24, 72].map((h) => (
                    <button key={h} type="button" onClick={() => setExpiryHours(h)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                        expiryHours === h
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'text-secondary hover:text-primary'
                      }`}
                      style={expiryHours !== h ? { borderColor: 'var(--border)', background: 'var(--bg-overlay)' } : {}}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Single use toggle */}
              <button type="button" onClick={() => setSingleUse(!singleUse)}
                className="flex items-center gap-3 w-full p-3 rounded-xl transition-all"
                style={{ border: `1px solid ${singleUse ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`, background: 'var(--bg-overlay)' }}>
                {singleUse
                  ? <ToggleRight className="w-5 h-5 text-brand-400" />
                  : <ToggleLeft className="w-5 h-5 text-muted" />
                }
                <div className="text-left">
                  <p className="text-sm font-medium text-primary">Single-use link</p>
                  <p className="text-xs text-muted">Link expires after first download</p>
                </div>
              </button>

              <button onClick={handleGenerateLink} disabled={linkLoading} className="btn-primary w-full justify-center">
                {linkLoading ? <Spinner /> : <><Link2 className="w-4 h-4" /> Generate Link</>}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="input flex-1 text-xs font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button onClick={() => handleCopy(shareUrl, 'Link copied!')}
                  className="btn-ghost flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Expires: {formatExpiry(shareLink.expiry_time)}
                </span>
                {shareLink.single_use && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    Single-use
                  </span>
                )}
              </div>
              <button onClick={() => { resetLink(); setSingleUse(false) }}
                className="btn-ghost text-xs w-full justify-center" style={{ border: '1px solid var(--border)' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Generate new link
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
