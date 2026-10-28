import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '../lib/format'
import { monthLabel, monthOf, shiftMonth, todayISO } from '../lib/date'

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" style={{ fill: 'var(--accent)' }} />
      <g fill="none" strokeWidth="2.6" strokeLinecap="round" style={{ stroke: 'var(--on-accent)' }}>
        <path d="M9.5 9v14M14 9v14M18.5 9v14M23 9v14" />
        <path d="M6.5 20.5 25.5 11.5" />
      </g>
    </svg>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export function Card({
  title,
  action,
  children,
  className,
  flush,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Let the content run edge to edge (tables, lists); the title keeps its padding. */
  flush?: boolean
}) {
  return (
    <section className={cn('rounded-2xl border border-line bg-surface', flush ? 'pt-4 pb-1 sm:pt-5' : 'p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className={cn('mb-4 flex items-center justify-between gap-3', flush && 'px-4 sm:px-5')}>
          {title && <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'subtle' | 'ghost' | 'danger'; size?: 'sm' | 'md' }

export function Button({ variant = 'subtle', size = 'md', className, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
        size === 'md' ? 'h-9 px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
        variant === 'primary' && 'bg-accent text-on-accent hover:brightness-105 active:brightness-95',
        variant === 'subtle' && 'border border-line bg-surface hover:bg-surface-2',
        variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'text-danger hover:bg-danger/10',
        className,
      )}
    />
  )
}

export function IconButton({ label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cn('grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink', className)}
    />
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Progress ring. `value` is 0..1 (values above 1 are drawn full). */
export function Ring({
  value,
  size = 64,
  stroke = 7,
  color = 'var(--accent)',
  children,
}: {
  value: number | null
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value ?? 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'var(--surface-2)' }} />
        {v > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v)}
            style={{ stroke: color, transition: 'stroke-dashoffset .5s ease' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

/** Multi-segment donut with small gaps between segments. */
export function Donut({
  segments,
  size = 132,
  stroke = 16,
  children,
}: {
  segments: { value: number; color: string; label: string }[]
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  const live = segments.filter((s) => s.value > 0)
  const gap = live.length > 1 ? 3 : 0
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'var(--surface-2)' }} />
        {total > 0 &&
          live.map((s) => {
            const len = (s.value / total) * c
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(len - gap, 0.5)} ${c}`}
                strokeDashoffset={-offset}
                style={{ stroke: s.color }}
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </circle>
            )
            offset += len
            return el
          })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Bar({ value, color = 'var(--accent)', className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
      />
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string; value?: ReactNode }[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: i.color }} />
          <span className="min-w-0 flex-1 truncate text-muted">{i.label}</span>
          {i.value != null && <span className="tnum font-medium">{i.value}</span>}
        </li>
      ))}
    </ul>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'danger' | 'warn' | 'good' }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={cn(
          'tnum mt-1 font-display text-[26px] font-semibold leading-none',
          tone === 'danger' && 'text-danger',
          tone === 'warn' && 'text-warn',
          tone === 'good' && 'text-good',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-faint">{sub}</div>}
    </div>
  )
}

export function MonthNav({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const current = monthOf(todayISO())
  return (
    <div className="flex items-center gap-1">
      {month !== current && (
        <Button size="sm" variant="ghost" onClick={() => onChange(current)}>
          This month
        </Button>
      )}
      <div className="flex items-center rounded-[10px] border border-line bg-surface">
        <IconButton label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
          <ChevronLeft size={16} />
        </IconButton>
        <span className="min-w-[124px] text-center text-sm font-medium">{monthLabel(month)}</span>
        <IconButton label="Next month" onClick={() => onChange(shiftMonth(month, 1))}>
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  )
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">{icon}</div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  )
}

/** Amount input: shows the formatted value, edits the raw number, commits on blur / Enter. */
export function MoneyInput({
  value,
  onCommit,
  format,
  className,
}: {
  value: number
  onCommit: (n: number) => void
  format: (n: number) => string
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    const n = Math.max(0, Number((draft ?? '').replace(',', '.')) || 0)
    if (draft != null && n !== value) onCommit(n)
    setDraft(null)
  }
  return (
    <input
      inputMode="decimal"
      aria-label="Planned amount"
      title="Click to edit"
      value={draft ?? format(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') setDraft(null)
      }}
      onFocus={(e) => {
        setDraft(String(value))
        requestAnimationFrame(() => e.target.select())
      }}
      className={cn(
        'bare tnum w-20 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-right outline-none hover:border-line focus:border-accent-ink focus:bg-surface-2',
        className,
      )}
    />
  )
}

/** Remembers the selected month per page across navigation. */
const monthMemory: Record<string, string> = {}
export function useMonth(page: string) {
  const [month, setMonth] = useState(() => monthMemory[page] ?? monthOf(todayISO()))
  return [month, (m: string) => setMonth((monthMemory[page] = m))] as const
}
