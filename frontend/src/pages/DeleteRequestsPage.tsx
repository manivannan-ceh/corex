import { useEffect, useState } from 'react'
import { Trash2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getDeleteRequests, reviewDeleteRequest } from '../services/api'
import type { DeleteRequest } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_STYLE: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  pending:  { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   icon: Clock,        label: 'Pending'  },
  approved: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: CheckCircle, label: 'Approved' },
  rejected: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/20',   icon: XCircle,      label: 'Rejected' },
}

type Tab = 'pending' | 'all'

export default function DeleteRequestsPage() {
  const { data: requests, loading, error, run } = useAsync<DeleteRequest[]>()
  const [tab, setTab] = useState<Tab>('pending')
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  const load = () => run(getDeleteRequests(tab === 'pending' ? 'pending' : ''))

  useEffect(() => { load() }, [tab])

  const handleReview = async (id: number, approve: boolean) => {
    setReviewingId(id)
    try {
      await reviewDeleteRequest(id, approve)
      toast.success(approve ? 'Request approved — release deleted' : 'Request rejected')
      load()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to review')
    } finally {
      setReviewingId(null)
    }
  }

  const pending = requests?.filter((r) => r.status === 'pending') ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-400" /> Delete Requests
          </h1>
          <p className="text-secondary text-sm mt-0.5">
            Review and approve deletion requests from users and developers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'pending' && pending.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
              {pending.length} pending
            </span>
          )}
          <button onClick={load} className="btn-ghost" style={{ border: '1px solid var(--border)' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)' }}>
        {(['pending', 'all'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={t === tab ? 'tab-active capitalize' : 'tab capitalize'}>
            {t === 'pending' ? 'Pending' : 'All Requests'}
          </button>
        ))}
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8"><Spinner fullPage /></div>
        ) : !requests || requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-secondary">
              {tab === 'pending' ? 'No pending requests' : 'No requests found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Resource', 'Requested by', 'Reason', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted tracking-wide uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const statusConf = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending
                  const StatusIcon = statusConf.icon
                  return (
                    <tr key={req.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-primary font-medium font-mono text-sm">
                            {req.resource_name || `${req.resource} #${req.resource_id}`}
                          </p>
                          <p className="text-xs text-muted capitalize">{req.resource}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-primary text-sm font-medium">{req.requester_name || '—'}</p>
                        <p className="text-xs text-muted">{req.requester_email}</p>
                      </td>
                      <td className="px-5 py-4 text-secondary text-xs max-w-[200px]">
                        <p className="truncate" title={req.reason}>{req.reason || <span className="text-muted italic">No reason</span>}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.cls}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted text-xs whitespace-nowrap">{formatDate(req.created_at)}</td>
                      <td className="px-5 py-4">
                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReview(req.id, true)}
                              disabled={reviewingId === req.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}
                            >
                              {reviewingId === req.id
                                ? <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                : <CheckCircle className="w-3.5 h-3.5" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(req.id, false)}
                              disabled={reviewingId === req.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">{req.reviewed_at ? formatDate(req.reviewed_at) : '—'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
