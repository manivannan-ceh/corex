import { Loader2 } from 'lucide-react'

interface Props {
  message?: string
  fullPage?: boolean
}

export default function Spinner({ message = 'Loading...', fullPage = false }: Props) {
  if (fullPage)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    )
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  )
}
