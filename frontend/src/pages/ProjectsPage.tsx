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

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer group hover:border-brand-500/30 hover:shadow-brand-900/20 hover:shadow-2xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
          <FolderKanban className="w-5 h-5 text-brand-400" />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{project.description}</p>
      )}
      {project.package_name && (
        <p className="text-xs text-slate-600 font-mono mb-3">{project.package_name}</p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Package className="w-3.5 h-3.5" />
          <span>{project.release_count ?? 0} releases</span>
        </div>
        <span className="text-xs text-slate-600">{formatDate(project.created_at)}</span>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" id="create-project-btn">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 pr-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadProjects} />}

      {loading ? (
        <Spinner fullPage />
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-slate-600">
          <FolderKanban className="w-14 h-14 mb-4 opacity-20" />
          <p className="text-sm mb-1">{search ? 'No projects match your search' : 'No projects yet'}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-xs">
              <Plus className="w-3.5 h-3.5" /> Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input
              type="text"
              placeholder="My Awesome App"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="Short description…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">Package name</label>
            <input
              type="text"
              placeholder="com.example.app"
              value={form.package_name}
              onChange={(e) => setForm({ ...form, package_name: e.target.value })}
              className="input font-mono"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 justify-center border border-white/10">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1 justify-center">
              {creating ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
