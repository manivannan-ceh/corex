import { useState, type FormEvent, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Download, ShieldCheck, ShieldX, Search, Calendar, Hash, Layers, Cpu } from 'lucide-react'
import { verifyCode, verifyLink } from '../services/api'
import type { VerifyResult } from '../services/api'
import toast from 'react-hot-toast'
import ChannelBadge from '../components/ChannelBadge'
import Spinner from '../components/Spinner'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatBytes(b?: number) {
  if (!b) return null
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function PublicDownloadPage() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  const handleVerify = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!code.trim()) return toast.error('Enter a code')
    setLoading(true)
    setResult(null)
    try {
      const data = await verifyCode(code.trim())
      setResult(data)
      if (!data.valid) toast.error(data.message || 'Invalid or expired code')
    } catch {
      toast.error('Could not verify code')
      setResult({ valid: false, message: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result?.download_url) {
      toast.error('No download URL available')
      return
    }
    const a = document.createElement('a')
    a.href = result.download_url
    a.download = `${result.release?.version_name ?? 'release'}.apk`
    a.target = '_blank'
    a.click()
    toast.success('Download started!')
  }

  // Auto-verify from link token
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setLoading(true)
      verifyLink(token)
        .then((data) => {
          setResult(data)
          if (!data.valid) toast.error(data.message || 'Invalid or expired link')
        })
        .catch(() => {
          toast.error('Could not verify link')
          setResult({ valid: false, message: 'An error occurred. Please try again.' })
        })
        .finally(() => setLoading(false))
    } else if (searchParams.get('code')) {
      handleVerify()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-700/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-5 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl shadow-brand-900/50 mx-auto mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CoreX Download</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your access code to download an APK</p>
        </div>

        {/* Code input — only shown when no token in URL */}
        {!searchParams.get('token') && (
          <form onSubmit={handleVerify} className="card p-6 space-y-4">
            <div>
              <label className="label">Access Code</label>
              <input
                type="text"
                placeholder="Enter your code…"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null) }}
                className="input font-mono text-lg tracking-widest text-center uppercase"
                maxLength={12}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? <Spinner /> : <><Search className="w-4 h-4" /> Verify Code</>}
            </button>
          </form>
        )}

        {/* Loading state for link verification */}
        {loading && searchParams.get('token') && (
          <div className="card p-8 flex justify-center">
            <Spinner />
          </div>
        )}

        {/* Result card */}
        {result && (
          <div className={`card p-6 animate-slide-up border ${
            result.valid
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-rose-500/20 bg-rose-500/5'
          }`}>
            {result.valid && result.release ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  Verified — APK ready to download
                </div>

                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  {result.project && (
                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-slate-400">Project:</span>
                      <span className="text-white font-medium">{result.project.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400">Version:</span>
                    <span className="text-white font-mono font-semibold">{result.release.version_name}</span>
                    <span className="text-slate-600 font-mono text-xs">({result.release.version_code})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 ml-6">Channel:</span>
                    <ChannelBadge channel={result.release.channel} />
                  </div>
                  {result.release.min_sdk && (
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-slate-400">SDK:</span>
                      <span className="text-slate-300 font-mono text-xs">min {result.release.min_sdk} / target {result.release.target_sdk}</span>
                    </div>
                  )}
                  {formatBytes(result.release.file_size) && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 ml-6">Size:</span>
                      <span className="text-slate-300">{formatBytes(result.release.file_size)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400">Uploaded:</span>
                    <span className="text-slate-300">{formatDate(result.release.uploaded_at)}</span>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={!result.download_url}
                  className="btn-primary w-full justify-center py-3 mt-2"
                >
                  <Download className="w-4 h-4" /> Download APK
                </button>

                {!result.download_url && (
                  <p className="text-xs text-center text-slate-500">
                    File not yet available for download
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 text-rose-400">
                <ShieldX className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Invalid or Expired</p>
                  <p className="text-xs text-rose-400/70 mt-1">
                    {result.message || 'This code or link is not valid. Please request a new one.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-700 pb-4">
          CoreX · Secure APK Distribution Platform
        </p>
      </div>
    </div>
  )
}
