import { cn } from '../lib/format'
import { diffDays, shortDate } from '../lib/date'
import type { Task } from '../lib/types'

export function DueLabel({ task, today }: { task: Task; today: string }) {
  if (task.status === 'completed') return <span className="shrink-0 text-xs text-good">Done</span>
  if (!task.due) return <span className="shrink-0 text-xs text-faint">No date</span>
  const n = diffDays(today, task.due)
  const text = n < 0 ? `${-n}d late` : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n <= 7 ? `in ${n}d` : shortDate(task.due)
  return <span className={cn('tnum shrink-0 text-xs', n < 0 ? 'font-medium text-danger' : n <= 1 ? 'text-warn' : 'text-muted')}>{text}</span>
}
