import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Shield, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsers, createUser, updateUserRole, deleteUser } from '../services/api'
import type { User } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'

const ROLES = ['admin', 'developer', 'user'] as const
type Role = typeof ROLES[number]

const roleColor: Record<string, string> = {
  admin:     'bg-rose-500/15 text-rose-400 border-rose-500/20',
  developer: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  user:      'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function UsersPage() {
  const { data: users, loading, error, run } = useAsync<User[]>()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'developer' as Role })
  const [creating, setCreating] = useState(false)

  useEffect(() => { run(getUsers()) }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      await createUser(form)
      toast.success(`User ${form.email} created`)
      setShowCreate(false)
      setForm({ email: '', password: '', name: '', role: 'developer' })
      run(getUsers())
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create user')
    } finally { setCreating(false) }
  }

  const handleRoleChange = async (userId: number, role: string) => {
    try { await updateUserRole(userId, role); toast.success('Role updated'); run(getUsers()) }
    catch { toast.error('Failed to update role') }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return
    try { await deleteUser(u.id); toast.success('User deleted'); run(getUsers()) }
    catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" /> User Management
          </h1>
          <p className="text-secondary text-sm mt-0.5">Manage platform users and their roles</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => run(getUsers())} />}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="card w-full max-w-md p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-primary">Add New User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input type="text" className="input" placeholder="John Doe"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="user@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input" placeholder="Min. 6 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required minLength={6} />
              </div>
              <div>
                <label className="label">Role *</label>
                <select className="input" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="btn-primary flex-1 justify-center">
                  {creating ? <Spinner /> : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="btn-ghost flex-1 justify-center" style={{ border: '1px solid var(--border)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8"><Spinner fullPage /></div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Role', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted tracking-wide uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="table-row-hover group" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)' }}>
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs font-medium border cursor-pointer bg-transparent ${roleColor[u.role] || roleColor.user}`}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted text-xs">{u.created_at ? formatDate(u.created_at) : '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                        title="Delete user">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="card p-4">
        <p className="text-xs font-medium text-muted mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Role Permissions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-secondary">
          {(['admin','developer','user'] as const).map((r) => (
            <div key={r} className="space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded-full border font-medium ${roleColor[r]}`}>{r}</span>
              <p>{r === 'admin'
                ? 'Full access — manage users, create projects, upload & share APKs, view audit logs'
                : r === 'developer'
                ? 'Create projects, upload & share APKs, view releases'
                : 'View projects and download APKs only'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
