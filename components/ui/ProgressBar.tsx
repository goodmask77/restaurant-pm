import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

const colorClass = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
}

export function ProgressBar({ value, max = 100, className, showLabel = true, color = 'blue' }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const barColor = pct >= 100 ? 'green' : pct >= 60 ? color : pct >= 30 ? 'yellow' : 'red'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass[barColor])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500 w-8 text-right">{Math.round(pct)}%</span>
      )}
    </div>
  )
}
