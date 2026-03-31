import { AlertCircle } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorAlert({ message, onRetry }: Props) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium text-rose-300 hover:text-white transition-colors"
          >
            Try again →
          </button>
        )}
      </div>
    </div>
  )
}
