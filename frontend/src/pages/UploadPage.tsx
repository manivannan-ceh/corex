import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, FileUp, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjects, createRelease, uploadToS3 } from '../services/api'
import type { Project } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import Spinner from '../components/Spinner'
import ErrorAlert from '../components/ErrorAlert'

const CHANNELS = ['stable', 'beta', 'alpha', 'internal'] as const
const RELEASE_TYPES = ['feature', 'patch', 'hotfix'] as const

export default function UploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedProject = searchParams.get('project')

  const { data: projects, loading: pLoad, run: runProjects } = useAsync<Project[]>()

  const [form, setForm] = useState({
    project_id: preselectedProject || '',
    version_name: '',
    version_code: '',
    release_type: 'feature' as typeof RELEASE_TYPES[number],
    channel: 'stable' as typeof CHANNELS[number],
    changelog: '',
    min_sdk: '21',
    target_sdk: '34',
  })
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<'metadata' | 's3'>('metadata')
  const [done, setDone] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => { runProjects(getProjects()) }, [])

  const handleFile = (f: File | undefined) => {
    if (!f) return
    if (!f.name.endsWith('.apk')) return toast.error('Only .apk files are supported')
    if (f.size > 500 * 1024 * 1024) return toast.error('File must be under 500 MB')
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.project_id) return toast.error('Select a project')
    if (!form.version_name.trim()) return toast.error('Version name is required')
    if (!form.version_code.trim()) return toast.error('Version code is required')
    if (!file) return toast.error('Select an APK file')

    setUploading(true)
    setProgress(0)
    setUploadPhase('metadata')

    try {
      // Step 1: Create release metadata → get presigned S3 URL
      const { release, upload_url } = await createRelease(Number(form.project_id), {
        version_name: form.version_name,
        version_code: Number(form.version_code),
        release_type: form.release_type,
        channel: form.channel,
        changelog: form.changelog,
        min_sdk: Number(form.min_sdk),
        target_sdk: Number(form.target_sdk),
      })

      // Step 2: Upload file directly to S3
      setUploadPhase('s3')
      await uploadToS3(upload_url, file, setProgress)

      setCreatedProjectId(String(release.project_id))
      setDone(true)
      toast.success('APK uploaded successfully!')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (err as Error).message ||
        'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setDone(false)
    setFile(null)
    setForm({
      project_id: preselectedProject || '',
      version_name: '',
      version_code: '',
      release_type: 'feature',
      channel: 'stable',
      changelog: '',
      min_sdk: '21',
      target_sdk: '34',
    })
    setProgress(0)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-9 h-9 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Upload Successful!</h2>
        <p className="text-slate-500 text-sm mb-6">Your APK release has been created.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/projects/${createdProjectId}`)} className="btn-primary">
            View releases
          </button>
          <button onClick={resetForm} className="btn-ghost border border-white/10">
            Upload another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload APK</h1>
        <p className="text-slate-500 text-sm mt-0.5">Create a new release for your project</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project */}
        <div>
          <label className="label">Project *</label>
          {pLoad ? <Spinner /> : (
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a project…</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Version fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Version Name *</label>
            <input
              type="text"
              placeholder="e.g. 2.0.1"
              value={form.version_name}
              onChange={(e) => setForm({ ...form, version_name: e.target.value })}
              className="input font-mono"
              required
            />
          </div>
          <div>
            <label className="label">Version Code *</label>
            <input
              type="number"
              placeholder="e.g. 201"
              value={form.version_code}
              onChange={(e) => setForm({ ...form, version_code: e.target.value })}
              className="input font-mono"
              required
              min={1}
            />
          </div>
        </div>

        {/* SDK fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Min SDK</label>
            <input
              type="number"
              placeholder="21"
              value={form.min_sdk}
              onChange={(e) => setForm({ ...form, min_sdk: e.target.value })}
              className="input font-mono"
              min={1}
            />
          </div>
          <div>
            <label className="label">Target SDK</label>
            <input
              type="number"
              placeholder="34"
              value={form.target_sdk}
              onChange={(e) => setForm({ ...form, target_sdk: e.target.value })}
              className="input font-mono"
              min={1}
            />
          </div>
        </div>

        {/* Release Type */}
        <div>
          <label className="label">Release Type</label>
          <div className="grid grid-cols-3 gap-2">
            {RELEASE_TYPES.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => setForm({ ...form, release_type: rt })}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                  form.release_type === rt
                    ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-white/[0.02]'
                }`}
              >
                {rt}
              </button>
            ))}
          </div>
        </div>

        {/* Release Channel */}
        <div>
          <label className="label">Release Channel</label>
          <div className="grid grid-cols-4 gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setForm({ ...form, channel: ch })}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                  form.channel === ch
                    ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-white/[0.02]'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Changelog */}
        <div>
          <label className="label">Changelog</label>
          <textarea
            placeholder="What's new in this release?&#10;• Bug fixes&#10;• Performance improvements"
            value={form.changelog}
            onChange={(e) => setForm({ ...form, changelog: e.target.value })}
            rows={4}
            className="input resize-none font-mono text-xs leading-relaxed"
          />
        </div>

        {/* File drop zone */}
        <div>
          <label className="label">APK File *</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-brand-500 bg-brand-500/10'
                : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/10 bg-white/[0.02] hover:border-brand-500/40 hover:bg-brand-500/5'
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept=".apk"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
                <p className="text-white font-medium text-sm">{file.name}</p>
                <p className="text-slate-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </>
            ) : (
              <>
                <FileUp className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm font-medium">Drop APK here or click to browse</p>
                <p className="text-slate-600 text-xs mt-1">Max 500 MB · .apk files only</p>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{uploadPhase === 'metadata' ? 'Creating release…' : `Uploading to S3…`}</span>
              <span>{uploadPhase === 's3' ? `${progress}%` : ''}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-300"
                style={{ width: uploadPhase === 'metadata' ? '5%' : `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="btn-primary w-full justify-center py-3"
        >
          {uploading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {uploadPhase === 'metadata' ? 'Creating release…' : `Uploading ${progress}%`}</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload Release</>
          )}
        </button>
      </form>
    </div>
  )
}
