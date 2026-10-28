import { useMemo, useState } from 'react'
import { Check, ListChecks, Plus, Search, Trash2 } from 'lucide-react'
import { useApp } from '../lib/store'
import { PRIORITY, PRIORITY_ORDER, STATUS, STATUS_ORDER, sortTasks, taskStats } from '../lib/selectors'
import { paletteMap, tint } from '../lib/colors'
import { cn, pct, plural } from '../lib/format'
import { diffDays, shortDate, todayISO } from '../lib/date'
import type { Priority, Task, TaskStatus } from '../lib/types'
import { Button, Card, Donut, Empty, Field, IconButton, Legend, Modal, PageHeader, Stat } from '../components/ui'

type Filter = 'open' | 'all' | 'completed'

export default function Tasks() {
  const { state } = useApp()
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [filter, setFilter] = useState<Filter>('open')
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const today = todayISO()
  const stats = useMemo(() => taskStats(state.tasks, today), [state.tasks, today])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortTasks(state.tasks).filter(
      (t) =>
        (filter === 'all' || (filter === 'open') === (t.status !== 'completed')) &&
        (!category || t.category === category) &&
        (!q || t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)),
    )
  }, [state.tasks, filter, category, query])

  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.total))
  const colorFor = paletteMap(stats.byCategory.map((c) => c.name))

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={
          stats.open
            ? `${plural(stats.open, 'open task')}${stats.overdue ? `, ${stats.overdue} overdue` : ''}.`
            : stats.total
              ? 'Everything is done. Nice.'
              : 'Get things out of your head and onto a list.'
        }
      >
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> New task
        </Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total tasks" value={stats.total} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Completed" value={pct(stats.donePct)} sub={`${stats.completed} done`} tone="good" />
        <Stat label="Overdue" value={stats.overdue} tone={stats.overdue ? 'danger' : undefined} />
        <Stat label="Due in 7 days" value={stats.dueSoon} tone={stats.dueSoon ? 'warn' : undefined} />
        <Stat label="Due later" value={stats.dueLater} />
      </div>

      {stats.total > 0 && (
        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Status" className="@container">
            <div className="flex flex-col items-center gap-4 @3xs:flex-row">
              <Donut size={112} stroke={14} segments={STATUS_ORDER.map((s, i) => ({ label: STATUS[s].label, color: STATUS[s].color, value: stats.byStatus[i] }))}>
                <div>
                  <div className="tnum font-display text-xl font-semibold">{stats.total}</div>
                  <div className="text-[11px] text-muted">tasks</div>
                </div>
              </Donut>
              <div className="min-w-0 flex-1">
                <Legend items={STATUS_ORDER.map((s, i) => ({ label: STATUS[s].label, color: STATUS[s].color, value: stats.byStatus[i] }))} />
              </div>
            </div>
          </Card>
          <Card title="Open by priority" className="@container">
            <div className="flex flex-col items-center gap-4 @3xs:flex-row">
              <Donut size={112} stroke={14} segments={PRIORITY_ORDER.map((p, i) => ({ label: PRIORITY[p].label, color: PRIORITY[p].color, value: stats.byPriority[i] }))}>
                <div>
                  <div className="tnum font-display text-xl font-semibold">{stats.open}</div>
                  <div className="text-[11px] text-muted">open</div>
                </div>
              </Donut>
              <div className="min-w-0 flex-1">
                <Legend items={PRIORITY_ORDER.map((p, i) => ({ label: PRIORITY[p].label, color: PRIORITY[p].color, value: stats.byPriority[i] }))} />
              </div>
            </div>
          </Card>
          <Card title="Status by category">
            <ul className="space-y-2">
              {stats.byCategory.slice(0, 6).map((c) => (
                <li key={c.name} className="grid grid-cols-[72px_1fr_20px] items-center gap-2 text-xs">
                  <span className="truncate text-muted">{c.name}</span>
                  <div className="flex h-2.5 gap-px overflow-hidden rounded-full" style={{ width: `${(c.total / maxCat) * 100}%` }}>
                    {c.counts.map((n, i) => n > 0 && <div key={i} style={{ flex: n, background: STATUS[STATUS_ORDER[i]].color }} title={`${STATUS[STATUS_ORDER[i]].label}: ${n}`} />)}
                  </div>
                  <span className="tnum text-right">{c.total}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Upcoming deadlines">
            {stats.upcoming.length ? (
              <ol className="space-y-2 text-sm">
                {stats.upcoming.map((t) => (
                  <li key={t.id} className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <DueLabel task={t} today={today} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">No open tasks with a due date.</p>
            )}
          </Card>
        </div>
      )}

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 sm:p-4">
          <div className="flex rounded-[10px] bg-surface-2 p-0.5 text-sm">
            {(['open', 'all', 'completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn('rounded-lg px-3 py-1 capitalize transition', filter === f ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink')}
              >
                {f}
              </button>
            ))}
          </div>
          <select className="field !w-auto !py-1.5" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {stats.byCategory.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="relative ml-auto w-full sm:w-56">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <input className="field !py-1.5 !pl-9" placeholder="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <QuickAdd />

        {visible.length === 0 ? (
          <Empty icon={<ListChecks size={22} />} title={state.tasks.length ? 'Nothing here' : 'No tasks yet'}>
            {state.tasks.length ? 'Try another filter.' : 'Get it out of your head: type a task above and press Enter.'}
          </Empty>
        ) : (
          <ul>
            {visible.map((t) => (
              <TaskRow key={t.id} task={t} today={today} color={colorFor(t.category || 'General')} onEdit={() => setEditing(t)} />
            ))}
          </ul>
        )}
      </Card>

      <TaskModal key={editing === 'new' ? 'new' : editing?.id} editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function QuickAdd() {
  const { actions } = useApp()
  const [title, setTitle] = useState('')
  return (
    <form
      className="flex items-center gap-3 border-b border-line px-3 py-2 sm:px-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        actions.addTask({ title: title.trim(), category: 'General', priority: 'normal', status: 'not_started' })
        setTitle('')
      }}
    >
      <Plus size={18} className="shrink-0 text-faint" />
      <input className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" placeholder="Add a task and press Enter" value={title} onChange={(e) => setTitle(e.target.value)} />
    </form>
  )
}

export function DueLabel({ task, today }: { task: Task; today: string }) {
  if (task.status === 'completed') return <span className="shrink-0 text-xs text-good">Done</span>
  if (!task.due) return <span className="shrink-0 text-xs text-faint">No date</span>
  const n = diffDays(today, task.due)
  const text = n < 0 ? `${-n}d late` : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n <= 7 ? `in ${n}d` : shortDate(task.due)
  return <span className={cn('tnum shrink-0 text-xs', n < 0 ? 'font-medium text-danger' : n <= 1 ? 'text-warn' : 'text-muted')}>{text}</span>
}

function TaskRow({ task, today, color, onEdit }: { task: Task; today: string; color: string; onEdit: () => void }) {
  const { actions } = useApp()
  const done = task.status === 'completed'
  return (
    <li className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line/60 px-3 py-2.5 last:border-0 sm:flex-nowrap sm:px-4">
      <button
        onClick={() => actions.updateTask(task.id, { status: done ? 'not_started' : 'completed' })}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        className={cn('grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition', done ? 'border-good bg-good' : 'border-line hover:border-good')}
      >
        {done && <Check size={13} strokeWidth={3.5} className="pop text-surface" />}
      </button>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className={cn('truncate text-sm', done && 'text-muted line-through')}>{task.title}</div>
        {task.notes && <div className="truncate text-xs text-faint">{task.notes}</div>}
      </button>
      <div className="flex w-full items-center gap-2 pl-[34px] sm:w-auto sm:pl-0">
        <span className="hidden max-w-[100px] truncate text-xs md:block" style={{ color: `color-mix(in oklab, ${color} 70%, var(--text))` }}>
          {task.category}
        </span>
        <select
          className="pill"
          value={task.priority}
          onChange={(e) => actions.updateTask(task.id, { priority: e.target.value as Priority })}
          style={tint(PRIORITY[task.priority].color)}
          aria-label="Priority"
        >
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY[p].label}
            </option>
          ))}
        </select>
        <select
          className="pill"
          value={task.status}
          onChange={(e) => actions.updateTask(task.id, { status: e.target.value as TaskStatus })}
          style={tint(STATUS[task.status].color)}
          aria-label="Status"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </select>
        <span className="ml-auto w-16 text-right sm:ml-0">
          <DueLabel task={task} today={today} />
        </span>
        <IconButton label="Delete task" className="opacity-60 group-hover:opacity-100" onClick={() => actions.deleteTask(task.id)}>
          <Trash2 size={15} />
        </IconButton>
      </div>
    </li>
  )
}

function TaskModal({ editing, onClose }: { editing: Task | 'new' | null; onClose: () => void }) {
  const { state, actions } = useApp()
  const existing = editing && editing !== 'new' ? editing : null
  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? '')
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'normal')
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? 'not_started')
  const [due, setDue] = useState(existing?.due ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const categories = [...new Set(state.tasks.map((t) => t.category).filter(Boolean))].sort()

  const save = () => {
    if (!title.trim()) return
    const t = { title: title.trim(), category: category.trim() || 'General', priority, status, due: due || undefined, notes: notes.trim() || undefined }
    if (existing) actions.updateTask(existing.id, t)
    else actions.addTask(t)
    onClose()
  }

  return (
    <Modal open={!!editing} onClose={onClose} title={existing ? 'Edit task' : 'New task'}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field label="Task">
          <input autoFocus className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input className="field" list="task-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Work" />
            <datalist id="task-cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Due date">
            <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Priority">
          <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-surface-2 p-1">
            {PRIORITY_ORDER.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn('rounded-lg py-1.5 text-sm transition', priority === p ? 'font-medium shadow-sm' : 'text-muted')}
                style={priority === p ? tint(PRIORITY[p].color) : undefined}
              >
                {PRIORITY[p].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Status">
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="field min-h-[72px] resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </Field>
        <div className="flex items-center justify-between gap-2 pt-1">
          {existing ? (
            <Button
              variant="danger"
              onClick={() => {
                actions.deleteTask(existing.id)
                onClose()
              }}
            >
              <Trash2 size={15} /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!title.trim()}>
              {existing ? 'Save' : 'Add task'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
