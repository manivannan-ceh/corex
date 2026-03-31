import { useEffect } from 'react'
import { ShieldCheck, RefreshCw } from 'lucide-react'
import { getAuditLogs } from '../services/api'
import type { AuditLog } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'

const actionColor: Record<string, string> = {
  login: 'bg-emerald-500/15 text-emerald-400',
  login_failed: 'bg-rose-500/15 text-rose-400',
  upload_apk: 'bg-brand-500/15 text-brand-400',
  download_apk: 'bg-sky-500/15 text-sky-400',
  share_code_created: 'bg-purple-500/15 text-purple-400',
  share_code_used: 'bg-amber-500/15 text-amber-400',
  share_link_created: 'bg-purple-500/15 text-purple-400',
  failed_code_attempt: 'bg-rose-500/15 text-rose-400',
  create_user: 'bg-teal-500/15 text-teal-400',
  delete_user: 'bg-rose-500/15 text-rose-400',
  update_role: 'bg-orange-500/15 text-orange-400',
  create: 'bg-emerald-500/15 text-emerald-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function ActionBadge({ action }: { action: string }) {
  const color = actionColor[action] || 'bg-slate-500/15 text-slate-400'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {action.replace(/_/g, ' ')}
    </span>
  )
}

export default function AuditLogPage() {
  const { data: logs, loading, error, run } = useAsync<AuditLog[]>()

  useEffect(() => { run(getAuditLogs()) }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-400" /> Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Recent platform activity — last 100 events</p>
        </div>
        <button onClick={() => run(getAuditLogs())} className="btn-ghost border border-white/10">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => run(getAuditLogs())} />}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8"><Spinner fullPage /></div>
        ) : !logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No audit events recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Time', 'User', 'Action', 'Resource', 'Details', 'IP'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 tracking-wide uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log) => (
                  <tr key={log.id} className="table-row-hover">
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      {log.user_name ? (
                        <div>
                          <p className="text-white text-xs font-medium">{log.user_name}</p>
                          <p className="text-slate-600 text-xs">{log.user_email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">anonymous</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs capitalize">{log.resource}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs font-mono">{log.ip_address || '—'}</td>
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
