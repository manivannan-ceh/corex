import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { createDeleteRequest } from '../services/api'
import type { Release } from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  release: Release | null
  projectName?: string
}

export default function DeleteRequestModal({ isOpen, onClose, release, projectName }: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!release) return
    setSubmitting(true)
    try {
      await createDeleteRequest('release', release.id, reason.trim())
      toast.success('Delete request submitted — awaiting admin approval')
      setReason('')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to submit request'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Deletion">
      <div className="space-y-4">
        {/* Warning banner */}
        <div className="flex gap-3 p-3.5 rounded-xl"
             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">Admin approval required</p>
            <p className="text-secondary mt-0.5">
              This will send a delete request to an admin. The release will only be removed after approval.
            </p>
          </div>
        </div>

        {/* Release info */}
        {release && (
          <div className="rounded-xl p-3.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs text-muted mb-1">Release to delete</p>
            <p className="font-mono font-semibold text-primary">{release.version_name}</p>
            {projectName && <p className="text-xs text-muted mt-0.5">{projectName}</p>}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="label">Reason <span className="text-muted font-normal">(optional)</span></label>
          <textarea
            placeholder="Why should this release be deleted?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={handleClose} className="btn-ghost flex-1 justify-center"
                  style={{ border: '1px solid var(--border)' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                       text-rose-400 transition-all duration-150 active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Trash2 className="w-4 h-4" /> Submit Request</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}
