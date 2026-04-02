import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FolderKanban, Package, ArrowRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjects, createProject } from '../services/api'
import type { Project } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'
import Modal from '../components/Modal'

const CARD_ACCENTS = [
  { bar: 'from-brand-500 to-violet-500',   icon: 'bg-brand-500/15 text-brand-400',   border: 'rgba(99,102,241,0.25)'  },
  { bar: 'from-violet-500 to-purple-500',  icon: 'bg-violet-500/15 text-violet-400', border: 'rgba(139,92,246,0.25)'  },
  { bar: 'from-cyan-500 to-brand-500',     icon: 'bg-cyan-500/15 text-cyan-400',     border: 'rgba(6,182,212,0.25)'   },
  { bar: 'from-emerald-500 to-teal-500',   icon: 'bg-emerald-500/15 text-emerald-400',border:'rgba(16,185,129,0.25)'  },
  { bar: 'from-amber-500 to-orange-500',   icon: 'bg-amber-500/15 text-amber-400',   border: 'rgba(245,158,11,0.25)'  },
  { bar: 'from-rose-500 to-pink-500',      icon: 'bg-rose-500/15 text-rose-400',     border: 'rgba(244,63,94,0.25)'   },
]

function ProjectCard({ project, onClick, index }: { project: Project; onClick: () => void; index: number }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div
      onClick={onClick}
      className="card group cursor-pointer transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden"
      style={{ ['--hover-border' as string]: accent.border }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent.border)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className={`h-0.5 w-full bg-gradient-to-r ${accent.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent.icon} flex-shrink-0`}>
            <FolderKanban className="w-5 h-5" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
        </div>
        <h3 className="font-semibold text-primary mb-1 line-clamp-1">{project.name}</h3>
        {project.description
          ? <p className="text-sm text-secondary mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
          : <p className="text-sm text-muted mb-3 italic">No description</p>
        }
        {project.package_name && (
          <p className="text-xs text-muted font-mono px-2 py-1 rounded-lg mb-3 truncate"
             style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            {project.package_name}
          </p>
        )}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Package className="w-3.5 h-3.5" />
            <span>{project.release_count ?? 0} release{(project.release_count ?? 0) !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-xs text-muted">{formatDate(project.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { data: projects, loading, error, run } = useAsync<Project[]>()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', package_name: '' })
  const [creating, setCreating] = useState(false)

  const loadProjects = () => run(getProjects())
  useEffect(() => { loadProjects() }, [])

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.package_name?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Project name is required')
    setCreating(true)
    try {
      await createProject({ name: form.name.trim(), description: form.description, package_name: form.package_name })
      toast.success('Project created!')
      setShowCreate(false)
      setForm({ name: '', description: '', package_name: '' })
      loadProjects()
    } catch {
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Projects</h1>
          <p className="text-secondary text-sm mt-0.5">
            {projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" id="create-project-btn">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input type="text" placeholder="Search by name or package…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 pr-10" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadProjects} />}

      {loading ? <Spinner fullPage /> : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
               style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <FolderKanban className="w-9 h-9 text-muted" />
          </div>
          <p className="text-secondary font-medium mb-1">{search ? 'No matching projects' : 'No projects yet'}</p>
          <p className="text-sm text-muted mb-5">{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input type="text" placeholder="My Awesome App" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea placeholder="Short description…" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="input resize-none" />
          </div>
          <div>
            <label className="label">Package name</label>
            <input type="text" placeholder="com.example.app" value={form.package_name}
              onChange={(e) => setForm({ ...form, package_name: e.target.value })}
              className="input font-mono" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 justify-center"
                    style={{ border: '1px solid var(--border)' }}>Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1 justify-center">
              {creating ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
