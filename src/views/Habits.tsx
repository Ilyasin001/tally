import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Flame, Plus, Repeat, Trash2 } from 'lucide-react'
import { useApp } from '../lib/store'
import { habitMonth, isDone } from '../lib/selectors'
import { habitCategory, paletteMap } from '../lib/colors'
import { cn, pct } from '../lib/format'
import { daysInMonth, dayNum, monthOf, shortDate, todayISO, weekdayLetter } from '../lib/date'
import type { Habit } from '../lib/types'
import { Bar, Button, Card, Empty, Field, IconButton, Modal, MonthNav, PageHeader, Ring, useMonth } from '../components/ui'

const SUGGESTIONS: [string, string, number][] = [
  ['Wake up on time', 'Sleep', 25],
  ['Drink 2L of water', 'Health', 28],
  ['Move for 30 minutes', 'Fitness', 20],
  ['Read 10 pages', 'Learning', 24],
  ['Deep work block', 'Career', 20],
  ['No phone in bed', 'Mindfulness', 22],
  ['Journal three lines', 'Mindfulness', 20],
  ['Plan tomorrow', 'Productivity', 25],
]

export default function Habits() {
  const { state, actions } = useApp()
  const [month, setMonth] = useMonth('habits')
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const today = todayISO()
  const data = useMemo(() => habitMonth(state, month, today), [state, month, today])
  const { habits, habitLog } = state
  const colorFor = paletteMap(habits.map(habitCategory))
  const gridRef = useRef<HTMLDivElement>(null)

  // On narrow screens, bring today's column into view instead of day 1.
  useEffect(() => {
    const box = gridRef.current
    const cell = box?.querySelector<HTMLElement>('[data-today]')
    if (box && cell) box.scrollLeft = Math.max(0, cell.offsetLeft - box.clientWidth / 2)
  }, [month, habits.length])

  const weeks: string[][] = []
  for (let i = 0; i < data.days.length; i += 7) weeks.push(data.days.slice(i, i + 7).map((d) => d.date))
  const maxCatGoal = Math.max(1, ...data.categories.map((c) => Math.max(c.goal, c.done)))
  const isCurrent = month === monthOf(today)

  return (
    <div>
      <PageHeader title="Habits" subtitle="Check in daily. Watch the month fill up.">
        <MonthNav month={month} onChange={setMonth} />
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> New habit
        </Button>
      </PageHeader>

      {habits.length === 0 ? (
        <Card>
          <Empty icon={<Repeat size={22} />} title="Start with one small habit">
            Pick something you can do on your worst day. Tap a suggestion to add it, or create your own.
          </Empty>
          <div className="flex flex-wrap justify-center gap-2 pb-4">
            {SUGGESTIONS.map(([name, category, goal]) => (
              <button
                key={name}
                onClick={() => actions.addHabit({ name, category, goal })}
                className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-accent-ink hover:text-accent-ink"
              >
                + {name}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <Card title="This month">
              <div className="flex items-center gap-5">
                <Ring value={data.total.goal ? data.total.done / data.total.goal : 0} size={104} stroke={10}>
                  <div>
                    <div className="tnum font-display text-2xl font-semibold">{pct(data.total.goal ? data.total.done / data.total.goal : 0)}</div>
                    <div className="text-[11px] text-muted">of goal</div>
                  </div>
                </Ring>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Check-ins</dt>
                    <dd className="tnum font-display text-xl font-semibold">{data.total.done}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Monthly goal</dt>
                    <dd className="tnum font-display text-xl font-semibold">{data.total.goal}</dd>
                  </div>
                </dl>
              </div>
            </Card>
            <Card title="Weekly consistency">
              <div className="grid grid-cols-5 gap-2">
                {data.weeks.map((w, i) => (
                  <div key={w.label} className="flex flex-col items-center gap-2">
                    <Ring value={w.pct} size={62} stroke={6} color={['#8b7cf6', '#38bdf8', '#22d3ee', '#fb7185', '#34d399'][i]}>
                      <span className="tnum text-[13px] font-semibold">{pct(w.pct)}</span>
                    </Ring>
                    <div className="text-center leading-tight">
                      <div className="text-xs font-medium">{w.label}</div>
                      <div className="text-[11px] text-faint">{w.range}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
            <Card title="Daily completion">
              <div className="flex h-36 items-end gap-[3px] lg:h-56">
                {data.days.map((d) => (
                  <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${shortDate(d.date)}: ${d.done}/${habits.length} (${pct(d.pct)})`}>
                    <div
                      className={cn('w-full rounded-t-[4px] transition-[height] duration-500', d.date === today && 'ring-2 ring-accent-ink ring-offset-2 ring-offset-surface')}
                      style={{
                        height: d.pct == null ? 3 : `${Math.max(d.pct * 100, 2)}%`,
                        background: d.pct == null ? 'var(--surface-2)' : `color-mix(in oklab, var(--accent) ${40 + d.pct * 60}%, #38bdf8)`,
                        opacity: d.pct == null ? 1 : 0.35 + d.pct * 0.65,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-[3px] text-[10px] text-faint">
                {data.days.map((d) => (
                  <div key={d.date} className={cn('tnum flex-1 text-center', d.date === today && 'font-semibold text-accent-ink')}>
                    {dayNum(d.date) % 5 === 1 || d.date === today ? dayNum(d.date) : ''}
                  </div>
                ))}
              </div>
            </Card>
            <Card title="By category">
              <ul className="space-y-2.5">
                {data.categories.map((c) => (
                  <li key={c.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="tnum text-muted">
                        {c.done}/{c.goal}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-2" style={{ width: `${(c.goal / maxCatGoal) * 100}%` }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                        style={{ width: `${Math.min(1, c.done / Math.max(c.goal, 1)) * 100}%`, background: colorFor(c.name) }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* The grid */}
          <Card className="!p-0">
            <div ref={gridRef} className="scroll-x">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-[11px] text-muted">
                    <th rowSpan={2} className="sticky left-0 z-10 w-[150px] min-w-[150px] border-b sm:w-auto sm:min-w-[188px] border-line bg-surface px-4 pt-4 pb-2 text-left font-semibold uppercase tracking-[0.09em]">
                      Habit
                    </th>
                    {weeks.map((w, i) => (
                      <th key={i} colSpan={w.length} className={cn('pt-4 pb-1 font-medium', i > 0 && 'pl-2')}>
                        Week {i + 1}
                      </th>
                    ))}
                    <th rowSpan={2} className="min-w-[148px] border-b border-line px-4 pt-4 pb-2 text-left font-semibold uppercase tracking-[0.09em]">
                      Progress
                    </th>
                  </tr>
                  <tr>
                    {data.days.map((d, i) => (
                      <th key={d.date} data-today={d.date === today || undefined} className={cn('border-b border-line pb-2 font-normal', i % 7 === 0 && i > 0 && 'pl-2')}>
                        <div className={cn('mx-auto w-7 rounded-md py-0.5 leading-tight', d.date === today && 'bg-accent text-on-accent')}>
                          <div className={cn('text-[10px]', d.date === today ? 'text-on-accent/70' : 'text-faint')}>{weekdayLetter(d.date)}</div>
                          <div className="tnum text-[11px] font-medium">{dayNum(d.date)}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map(({ habit, done, pct: p, streak }, rowIdx) => {
                    const color = colorFor(habitCategory(habit))
                    return (
                      <tr key={habit.id} className="group">
                        <td className="sticky left-0 z-10 max-w-[150px] border-b border-line/60 bg-surface px-4 py-1.5 sm:max-w-[240px]">
                          <button onClick={() => setEditing(habit)} className="block w-full text-left" title="Edit habit">
                            <div className="truncate font-medium group-hover:text-accent-ink">{habit.name}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted">
                              <span className="size-1.5 rounded-full" style={{ background: color }} />
                              {habit.category || 'Other'}
                              <span className="text-faint">· {habit.goal}/mo</span>
                            </div>
                          </button>
                        </td>
                        {data.days.map((d, i) => {
                          const checked = isDone(habitLog, habit.id, d.date)
                          const future = d.date > today
                          return (
                            <td key={d.date} className={cn('border-b border-line/60 px-[2px] py-1.5 text-center', i % 7 === 0 && i > 0 && 'pl-2', rowIdx % 2 === 1 && 'bg-surface-2/30')}>
                              <button
                                disabled={future}
                                onClick={() => actions.toggleHabit(habit.id, d.date)}
                                aria-pressed={checked}
                                aria-label={`${habit.name}, ${shortDate(d.date)}`}
                                className={cn(
                                  'mx-auto grid size-[26px] place-items-center rounded-[7px] border transition',
                                  !checked && 'border-line hover:border-muted',
                                  !checked && d.date === today && 'border-accent-ink/70',
                                  future && 'cursor-not-allowed opacity-30',
                                )}
                                style={checked ? { background: color, borderColor: color } : undefined}
                              >
                                {checked && <Check size={15} strokeWidth={3} className="pop text-black/75" />}
                              </button>
                            </td>
                          )
                        })}
                        <td className="border-b border-line/60 px-4 py-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="tnum font-medium">
                              {done}/{habit.goal}
                            </span>
                            <span className={cn('tnum', p >= 1 ? 'text-good' : 'text-muted')}>{pct(p)}</span>
                          </div>
                          <Bar value={p} color={color} className="mt-1" />
                          {isCurrent && streak > 1 && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-warn">
                              <Flame size={12} /> {streak}-day streak
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="text-[11px] text-muted">
                  <tr>
                    <td className="sticky left-0 z-10 bg-surface px-4 pt-2">Done</td>
                    {data.days.map((d, i) => (
                      <td key={d.date} className={cn('tnum pt-2 text-center', i % 7 === 0 && i > 0 && 'pl-2')}>
                        {d.pct == null ? '' : d.done}
                      </td>
                    ))}
                    <td />
                  </tr>
                  <tr>
                    <td className="sticky left-0 z-10 bg-surface px-4 pb-4">Daily %</td>
                    {data.days.map((d, i) => (
                      <td key={d.date} className={cn('tnum pb-4 text-center text-[10px]', i % 7 === 0 && i > 0 && 'pl-2', d.pct === 1 && 'font-semibold text-good')}>
                        {d.pct == null ? '' : Math.round(d.pct * 100)}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          <p className="text-center text-xs text-faint">
            Tap a square to check in. Tap a habit's name to rename it, change its goal or remove it. {daysInMonth(month)} days this month.
          </p>
        </div>
      )}

      <HabitModal key={editing === 'new' ? 'new' : editing?.id} editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function HabitModal({ editing, onClose }: { editing: Habit | 'new' | null; onClose: () => void }) {
  const { state, actions } = useApp()
  const existing = editing && editing !== 'new' ? editing : null
  const [name, setName] = useState(existing?.name ?? '')
  const [category, setCategory] = useState(existing?.category ?? '')
  const [goal, setGoal] = useState(String(existing?.goal ?? 20))
  const categories = [...new Set(state.habits.map((h) => h.category).filter(Boolean))]
  const index = existing ? state.habits.findIndex((h) => h.id === existing.id) : -1

  const save = () => {
    const h = { name: name.trim(), category: category.trim() || 'Other', goal: Math.min(31, Math.max(1, Number(goal) || 1)) }
    if (!h.name) return
    if (existing) actions.updateHabit(existing.id, h)
    else actions.addHabit(h)
    onClose()
  }

  return (
    <Modal open={!!editing} onClose={onClose} title={existing ? 'Edit habit' : 'New habit'}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field label="Habit">
          <input autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 10 pages" />
        </Field>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Field label="Category">
            <input className="field" list="habit-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Health" />
            <datalist id="habit-cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Days / month">
            <input className="field tnum" type="number" min={1} max={31} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </Field>
        </div>
        {existing && (
          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
            <span className="text-muted">Added {shortDate(existing.createdAt)}</span>
            <div className="flex">
              <IconButton label="Move up" disabled={index <= 0} onClick={() => actions.moveHabit(existing.id, -1)}>
                <ArrowUp size={16} />
              </IconButton>
              <IconButton label="Move down" disabled={index >= state.habits.length - 1} onClick={() => actions.moveHabit(existing.id, 1)}>
                <ArrowDown size={16} />
              </IconButton>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          {existing ? (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete "${existing.name}" and all its check-ins?`)) {
                  actions.deleteHabit(existing.id)
                  onClose()
                }
              }}
            >
              <Trash2 size={15} /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>
              {existing ? 'Save' : 'Add habit'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
