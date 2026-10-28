import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Check, Flame, Plus, Sparkles } from 'lucide-react'
import { useApp } from '../lib/store'
import { budgetMonth, currentStreak, isDone, sortTasks, spentBetween } from '../lib/selectors'
import { habitCategory, paletteMap } from '../lib/colors'
import { cn, money, pct, plural } from '../lib/format'
import { addDays, fmtDate, monthOf, todayISO, weekdayLetter } from '../lib/date'
import type { AppState } from '../lib/types'
import { Bar, Button, Card, PageHeader, Ring } from '../components/ui'
import { DueLabel } from '../components/DueLabel'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/** Habit check-ins / possible check-ins over the 7 days ending on `end`. */
function weekConsistency(state: AppState, end: string) {
  if (!state.habits.length) return null
  let done = 0
  for (let i = 0; i < 7; i++) {
    const d = addDays(end, -i)
    done += state.habits.filter((h) => isDone(state.habitLog, h.id, d)).length
  }
  return done / (state.habits.length * 7)
}

export default function Today() {
  const { state, actions } = useApp()
  const today = todayISO()
  const { habits, habitLog, settings } = state
  const cur = settings.currency
  const colorFor = paletteMap(habits.map(habitCategory))

  const doneToday = habits.filter((h) => isDone(habitLog, h.id, today)).length
  const streaks = useMemo(() => habits.map((h) => ({ habit: h, streak: currentStreak(habitLog, h.id, today) })), [habits, habitLog, today])
  const topStreak = streaks.reduce<(typeof streaks)[number] | null>((best, s) => (!best || s.streak > best.streak ? s : best), null)

  const focus = sortTasks(state.tasks.filter((t) => t.status !== 'completed')).slice(0, 6)
  const overdue = state.tasks.filter((t) => t.status !== 'completed' && t.due && t.due < today).length

  const b = useMemo(() => budgetMonth(state, monthOf(today)), [state, today])
  const spent = b.kinds.expense.actual + b.kinds.bill.actual
  const spendPlanned = b.kinds.expense.planned + b.kinds.bill.planned

  // Weekly review: last 7 days against the 7 before.
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const thisWeek = weekConsistency(state, today)
  const lastWeek = weekConsistency(state, addDays(today, -7))
  const tasksDone = (from: string, to: string) => state.tasks.filter((t) => t.completedAt && t.completedAt >= from && t.completedAt <= to).length
  const doneThis = tasksDone(addDays(today, -6), today)
  const doneLast = tasksDone(addDays(today, -13), addDays(today, -7))
  const spendThis = spentBetween(state, addDays(today, -6), today)
  const spendLast = spentBetween(state, addDays(today, -13), addDays(today, -7))

  return (
    <div>
      <PageHeader title={`${greeting()}${settings.name ? `, ${settings.name}` : ''}.`} subtitle={fmtDate(today, { weekday: 'long', month: 'long', day: 'numeric' })} />

      {settings.sample && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent-ink/30 bg-accent/10 px-4 py-3 text-sm">
          <Sparkles size={18} className="shrink-0 text-accent-ink" />
          <p className="min-w-0 flex-1">
            You're looking at <strong className="font-semibold">sample data</strong> so you can see how everything fits together. Clear it when you're ready to track your own.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => confirm('Clear the sample habits, tasks and transactions? Budget categories are kept so you can edit them.') && actions.startFresh()}
          >
            Start fresh
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Today's habits" className="lg:row-span-2">
          {habits.length ? (
            <>
              <div className="mb-4 flex items-center gap-4">
                <Ring value={doneToday / habits.length} size={84} stroke={9}>
                  <span className="tnum font-display text-lg font-semibold">
                    {doneToday}/{habits.length}
                  </span>
                </Ring>
                <div className="text-sm">
                  <div className="font-medium">{doneToday === habits.length ? 'All done. Perfect day.' : `${habits.length - doneToday} to go`}</div>
                  {topStreak && topStreak.streak > 1 && (
                    <div className="mt-1 flex items-center gap-1 text-muted">
                      <Flame size={14} className="text-warn" /> Longest run: {topStreak.habit.name}, {plural(topStreak.streak, 'day')}
                    </div>
                  )}
                </div>
              </div>
              <ul className="space-y-1.5">
                {streaks.map(({ habit, streak }) => {
                  const done = isDone(habitLog, habit.id, today)
                  const color = colorFor(habitCategory(habit))
                  return (
                    <li key={habit.id}>
                      <button
                        onClick={() => actions.toggleHabit(habit.id, today)}
                        aria-pressed={done}
                        className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition', done ? 'border-transparent bg-surface-2' : 'border-line hover:border-muted')}
                      >
                        <span
                          className={cn('grid size-6 shrink-0 place-items-center rounded-[7px] border transition', !done && 'border-line')}
                          style={done ? { background: color, borderColor: color } : undefined}
                        >
                          {done && <Check size={15} strokeWidth={3} className="pop text-black/75" />}
                        </span>
                        <span className={cn('min-w-0 flex-1 truncate text-sm', done && 'text-muted')}>{habit.name}</span>
                        {streak > 0 && (
                          <span className="tnum flex shrink-0 items-center gap-0.5 text-xs text-muted" title={`${plural(streak, 'day')} in a row`}>
                            <Flame size={13} className={streak >= 3 ? 'text-warn' : 'text-faint'} />
                            {streak}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <EmptyLink href="#/habits" text="No habits yet." cta="Add your first habit" />
          )}
        </Card>

        <Card title="Focus" action={overdue > 0 && <span className="text-xs font-medium text-danger">{overdue} overdue</span>}>
          {focus.length ? (
            <ul className="-mx-1 space-y-0.5">
              {focus.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <button
                    onClick={() => actions.updateTask(t.id, { status: 'completed' })}
                    aria-label={`Complete ${t.title}`}
                    className="size-[20px] shrink-0 rounded-full border-2 border-line transition hover:border-good hover:bg-good/20"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <DueLabel task={t} today={today} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing open. Enjoy it.</p>
          )}
          <QuickTask />
        </Card>

        <Card title={`Budget · ${fmtDate(today, { month: 'long' })}`} action={<a href="#/budget" className="text-xs text-muted hover:text-ink">Open</a>}>
          <div className="text-xs text-muted">Left to spend</div>
          <div className={cn('tnum font-display text-[32px] font-semibold leading-tight', b.left < 0 && 'text-danger')}>{money(Math.round(b.left * 100) / 100, cur)}</div>
          <div className="mt-3 mb-1 flex justify-between text-xs">
            <span className="text-muted">Spent on expenses & bills</span>
            <span className="tnum">
              {money(Math.round(spent), cur)} <span className="text-faint">/ {money(spendPlanned, cur)}</span>
            </span>
          </div>
          <Bar value={spendPlanned ? spent / spendPlanned : 0} color={spent > spendPlanned ? 'var(--danger)' : '#fb7185'} />
          <div className="mt-3 mb-1 flex justify-between text-xs">
            <span className="text-muted">Saved</span>
            <span className="tnum">
              {money(Math.round(b.kinds.savings.actual), cur)} <span className="text-faint">/ {money(b.kinds.savings.planned, cur)}</span>
            </span>
          </div>
          <Bar value={b.kinds.savings.planned ? b.kinds.savings.actual / b.kinds.savings.planned : 0} color="#38bdf8" />
        </Card>

        <Card title="Weekly review" className="lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div>
              <div className="flex h-28 items-end gap-2">
                {week.map((d) => {
                  const n = habits.filter((h) => isDone(habitLog, h.id, d)).length
                  const v = habits.length ? n / habits.length : 0
                  return (
                    <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${n}/${habits.length}`}>
                      <span className="tnum text-[10px] text-faint">{habits.length ? Math.round(v * 100) : ''}</span>
                      <div
                        className="w-full max-w-[28px] rounded-md transition-[height] duration-500"
                        style={{ height: `${Math.max(v * 100, 4)}%`, background: d === today ? 'var(--accent)' : `color-mix(in oklab, var(--accent) 55%, var(--surface-2))` }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="mt-1.5 flex gap-2 text-center text-[11px] text-muted">
                {week.map((d) => (
                  <span key={d} className={cn('flex-1', d === today && 'font-semibold text-ink')}>
                    {weekdayLetter(d)}
                  </span>
                ))}
              </div>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:gap-3">
              <Delta label="Habit consistency" value={pct(thisWeek)} now={thisWeek ?? 0} before={lastWeek ?? 0} />
              <Delta label="Tasks finished" value={String(doneThis)} now={doneThis} before={doneLast} />
              <Delta label="Spent" value={money(Math.round(spendThis), cur)} now={spendThis} before={spendLast} lowerIsBetter />
            </ul>
          </div>
          <p className="mt-4 text-xs text-faint">Last 7 days compared with the 7 days before.</p>
        </Card>
      </div>
    </div>
  )
}

function Delta({ label, value, now, before, lowerIsBetter }: { label: string; value: string; now: number; before: number; lowerIsBetter?: boolean }) {
  const diff = now - before
  const better = lowerIsBetter ? diff < 0 : diff > 0
  const change = before ? Math.round((Math.abs(diff) / before) * 100) : null
  return (
    <li className="rounded-xl bg-surface-2 px-3 py-3">
      <div className="text-[11px] leading-tight text-muted">{label}</div>
      <div className="tnum mt-1 truncate font-display text-xl font-semibold">{value}</div>
      {diff !== 0 && change != null ? (
        <div className={cn('mt-1 flex items-center gap-0.5 text-[11px]', better ? 'text-good' : 'text-danger')}>
          {diff > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change}%
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-faint">No change</div>
      )}
    </li>
  )
}

function QuickTask() {
  const { actions } = useApp()
  const [title, setTitle] = useState('')
  return (
    <form
      className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-line px-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        actions.addTask({ title: title.trim(), category: 'General', priority: 'normal', status: 'not_started', due: todayISO() })
        setTitle('')
      }}
    >
      <Plus size={16} className="shrink-0 text-faint" />
      <input className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" placeholder="Add a task for today" value={title} onChange={(e) => setTitle(e.target.value)} />
    </form>
  )
}

function EmptyLink({ href, text, cta }: { href: string; text: string; cta: string }) {
  return (
    <div className="py-6 text-center text-sm text-muted">
      {text}{' '}
      <a href={href} className="font-medium text-accent-ink hover:underline">
        {cta} →
      </a>
    </div>
  )
}
