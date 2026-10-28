import type { AppState, BudgetCategory, Habit, MoneyKind, Priority, Task, TaskStatus } from './types'
import { addDays, diffDays, monthDays, monthOf, todayISO } from './date'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/* ---------- Habits ---------- */

export const isDone = (log: AppState['habitLog'], id: string, date: string) => !!log[date]?.includes(id)

/** Consecutive days up to today. A streak stays alive until a full day is missed. */
export function currentStreak(log: AppState['habitLog'], id: string, today = todayISO()) {
  let d = isDone(log, id, today) ? today : addDays(today, -1)
  let n = 0
  while (isDone(log, id, d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export function bestStreak(log: AppState['habitLog'], id: string) {
  const dates = Object.keys(log).filter((d) => log[d].includes(id)).sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export interface HabitMonth {
  days: { date: string; done: number; pct: number | null }[]
  rows: { habit: Habit; done: number; pct: number; streak: number }[]
  weeks: { label: string; range: string; done: number; possible: number; pct: number | null }[]
  categories: { name: string; done: number; goal: number }[]
  total: { done: number; goal: number }
}

export function habitMonth(state: AppState, month: string, today = todayISO()): HabitMonth {
  const { habits, habitLog } = state
  const dates = monthDays(month)

  const days = dates.map((date) => {
    const done = habits.filter((h) => isDone(habitLog, h.id, date)).length
    return { date, done, pct: date > today || !habits.length ? null : done / habits.length }
  })

  const rows = habits.map((habit) => {
    const done = dates.filter((d) => isDone(habitLog, habit.id, d)).length
    return { habit, done, pct: habit.goal ? done / habit.goal : 0, streak: currentStreak(habitLog, habit.id, today) }
  })

  // Weeks are 7-day blocks of the month (1–7, 8–14, …); only elapsed days count.
  const weeks: HabitMonth['weeks'] = []
  for (let i = 0; i < dates.length; i += 7) {
    const block = days.slice(i, i + 7)
    const elapsed = block.filter((d) => d.date <= today).length
    const done = sum(block.map((d) => d.done))
    const possible = elapsed * habits.length
    weeks.push({
      label: `Week ${i / 7 + 1}`,
      range: `${i + 1}–${Math.min(i + 7, dates.length)}`,
      done,
      possible,
      pct: possible ? done / possible : null,
    })
  }

  const byCat = new Map<string, { done: number; goal: number }>()
  for (const r of rows) {
    const key = r.habit.category || 'Other'
    const c = byCat.get(key) ?? { done: 0, goal: 0 }
    c.done += r.done
    c.goal += r.habit.goal
    byCat.set(key, c)
  }
  const categories = [...byCat].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.goal - a.goal)

  return {
    days,
    rows,
    weeks,
    categories,
    total: { done: sum(rows.map((r) => r.done)), goal: sum(rows.map((r) => r.habit.goal)) },
  }
}

/* ---------- Tasks ---------- */

export const STATUS: Record<TaskStatus, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: '#a1a1aa' },
  in_progress: { label: 'In progress', color: '#38bdf8' },
  on_hold: { label: 'On hold', color: '#c084fc' },
  completed: { label: 'Completed', color: '#34d399' },
}
export const STATUS_ORDER = Object.keys(STATUS) as TaskStatus[]

export const PRIORITY: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: '#fb7185' },
  normal: { label: 'Normal', color: '#fbbf24' },
  low: { label: 'Low', color: '#7dd3fc' },
}
export const PRIORITY_ORDER = Object.keys(PRIORITY) as Priority[]

export function taskStats(tasks: Task[], today = todayISO()) {
  const open = tasks.filter((t) => t.status !== 'completed')
  const dated = open.filter((t): t is Task & { due: string } => !!t.due)
  const completed = tasks.length - open.length

  const categories = [...new Set(tasks.map((t) => t.category || 'General'))].sort()
  const byCategory = categories.map((name) => {
    const list = tasks.filter((t) => (t.category || 'General') === name)
    return { name, total: list.length, counts: STATUS_ORDER.map((s) => list.filter((t) => t.status === s).length) }
  })

  return {
    total: tasks.length,
    open: open.length,
    completed,
    donePct: tasks.length ? completed / tasks.length : 0,
    overdue: dated.filter((t) => t.due < today).length,
    dueSoon: dated.filter((t) => t.due >= today && diffDays(today, t.due) <= 7).length,
    dueLater: dated.filter((t) => diffDays(today, t.due) > 7).length,
    byStatus: STATUS_ORDER.map((s) => tasks.filter((t) => t.status === s).length),
    byPriority: PRIORITY_ORDER.map((p) => open.filter((t) => t.priority === p).length),
    byCategory,
    upcoming: [...dated].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5),
  }
}

/** Open tasks first by due date (undated last), then completed ones. */
export function sortTasks(tasks: Task[]) {
  const rank = (t: Task) => (t.status === 'completed' ? 2 : t.due ? 0 : 1)
  return [...tasks].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.due ?? '').localeCompare(b.due ?? '') ||
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  )
}

/* ---------- Budget ---------- */

export const KINDS: Record<MoneyKind, { label: string; single: string; color: string }> = {
  income: { label: 'Income', single: 'Income', color: '#34d399' },
  expense: { label: 'Expenses', single: 'Expense', color: '#fb7185' },
  bill: { label: 'Bills', single: 'Bill', color: '#8b7cf6' },
  savings: { label: 'Savings', single: 'Saving', color: '#38bdf8' },
  debt: { label: 'Debt payments', single: 'Debt', color: '#fbbf24' },
}
export const KIND_ORDER = Object.keys(KINDS) as MoneyKind[]
export const OUTFLOWS: MoneyKind[] = ['expense', 'bill', 'savings', 'debt']

export type CategoryWithActual = BudgetCategory & { actual: number }

export function budgetMonth(state: AppState, month: string) {
  const tx = state.transactions.filter((t) => monthOf(t.date) === month).sort((a, b) => b.date.localeCompare(a.date))
  const actual = new Map<string, number>()
  for (const t of tx) actual.set(t.categoryId, (actual.get(t.categoryId) ?? 0) + t.amount)

  const cats: CategoryWithActual[] = state.categories.map((c) => ({ ...c, actual: actual.get(c.id) ?? 0 }))
  const kinds = Object.fromEntries(
    KIND_ORDER.map((k) => {
      const list = cats.filter((c) => c.kind === k)
      return [k, { planned: sum(list.map((c) => c.planned)), actual: sum(list.map((c) => c.actual)), cats: list }]
    }),
  ) as Record<MoneyKind, { planned: number; actual: number; cats: CategoryWithActual[] }>

  const outActual = sum(OUTFLOWS.map((k) => kinds[k].actual))
  const outPlanned = sum(OUTFLOWS.map((k) => kinds[k].planned))

  return {
    tx,
    cats,
    kinds,
    outActual,
    outPlanned,
    left: kinds.income.actual - outActual,
    leftPlanned: kinds.income.planned - outPlanned,
  }
}

/** Spending (expenses + bills) between two dates, inclusive. */
export function spentBetween(state: AppState, from: string, to: string) {
  const kindOf = new Map(state.categories.map((c) => [c.id, c.kind]))
  return sum(
    state.transactions
      .filter((t) => t.date >= from && t.date <= to)
      .filter((t) => {
        const k = kindOf.get(t.categoryId)
        return k === 'expense' || k === 'bill'
      })
      .map((t) => t.amount),
  )
}
