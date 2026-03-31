import clsx from 'clsx'

type Channel = 'stable' | 'beta' | 'alpha' | 'internal'

const channelStyles: Record<Channel, string> = {
  stable:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  beta:     'bg-blue-500/15 text-blue-400 border-blue-500/20',
  alpha:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  internal: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

interface Props {
  channel: string
}

export default function ChannelBadge({ channel }: Props) {
  const key = (channel?.toLowerCase() || 'internal') as Channel
  const styles = channelStyles[key] || channelStyles.internal
  return (
    <span className={clsx('badge-channel border', styles)}>
      {channel || 'internal'}
    </span>
  )
}
