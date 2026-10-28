import type { AppState, BudgetCategory, Habit, Settings, Task, Transaction } from './types'
import { addDays, dayInMonth, dayNum, fromISO, monthDays, monthOf, shiftMonth, todayISO } from './date'
import { defaultCurrency } from './format'

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)

/** Small seeded PRNG so the sample data looks the same on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function defaultCategories(): BudgetCategory[] {
  const rows: Omit<BudgetCategory, 'id'>[] = [
    { name: 'Salary', kind: 'income', planned: 3200 },
    { name: 'Side income', kind: 'income', planned: 300 },
    { name: 'Groceries', kind: 'expense', planned: 380 },
    { name: 'Eating out', kind: 'expense', planned: 120 },
    { name: 'Coffee', kind: 'expense', planned: 45 },
    { name: 'Transport', kind: 'expense', planned: 110 },
    { name: 'Fun', kind: 'expense', planned: 100 },
    { name: 'Shopping', kind: 'expense', planned: 120 },
    { name: 'Rent', kind: 'bill', planned: 1150, dueDay: 1 },
    { name: 'Utilities', kind: 'bill', planned: 140, dueDay: 12 },
    { name: 'Phone & internet', kind: 'bill', planned: 55, dueDay: 18 },
    { name: 'Subscriptions', kind: 'bill', planned: 28, dueDay: 22 },
    { name: 'Emergency fund', kind: 'savings', planned: 250 },
    { name: 'Investments', kind: 'savings', planned: 200 },
    { name: 'Credit card', kind: 'debt', planned: 150, dueDay: 25 },
  ]
  return rows.map((r) => ({ ...r, id: uid() }))
}

function defaultSettings(): Settings {
  return { name: '', currency: defaultCurrency(), theme: 'dark', sample: false }
}

export function makeEmptyState(settings: Settings = defaultSettings()): AppState {
  return {
    version: 1,
    habits: [],
    habitLog: {},
    tasks: [],
    categories: defaultCategories(),
    transactions: [],
    settings: { ...settings, sample: false },
  }
}

export function makeSampleState(settings: Settings = defaultSettings()): AppState {
  const rand = rng(20260101)
  const today = todayISO()

  const habitRows: [string, string, number][] = [
    ['Wake up by 7:00', 'Sleep', 26],
    ['Move for 30 minutes', 'Fitness', 20],
    ['Drink 2L of water', 'Health', 28],
    ['Read 10 pages', 'Learning', 24],
    ['Deep work block', 'Career', 20],
    ['No phone after 10pm', 'Mindfulness', 22],
    ['Journal three lines', 'Mindfulness', 20],
    ['Log every expense', 'Money', 28],
    ['Plan tomorrow', 'Productivity', 25],
  ]
  const habits: Habit[] = habitRows.map(([name, category, goal]) => ({
    id: uid(),
    name,
    category,
    goal,
    createdAt: addDays(today, -75),
  }))

  const habitLog: AppState['habitLog'] = {}
  for (let back = 75; back >= 1; back--) {
    const date = addDays(today, -back)
    // Consistency drifts upward over time, like a real habit streak.
    const lift = (75 - back) / 75
    const ids = habits.filter((h) => rand() < (h.goal / 30) * (0.72 + 0.28 * lift)).map((h) => h.id)
    if (ids.length) habitLog[date] = ids
  }
  habitLog[today] = habits.slice(0, 3).map((h) => h.id)

  const taskRows: [string, string, Task['priority'], Task['status'], number][] = [
    ['Send invoice to client', 'Work', 'high', 'in_progress', 1],
    ['Renew car insurance', 'Finance', 'high', 'not_started', -1],
    ['Book dentist appointment', 'Health', 'high', 'not_started', 2],
    ['Pick up dry cleaning', 'Errands', 'low', 'not_started', 0],
    ['Review monthly budget', 'Finance', 'normal', 'not_started', 3],
    ['Prepare slides for Monday', 'Work', 'normal', 'in_progress', 5],
    ['Fix the leaking tap', 'Home', 'normal', 'in_progress', 6],
    ['Update CV', 'Career', 'normal', 'not_started', 10],
    ['Finish online course module', 'Learning', 'normal', 'on_hold', 12],
    ['Clear out the garage', 'Home', 'low', 'on_hold', 14],
    ['Plan weekend trip', 'Personal', 'low', 'not_started', 20],
    ['Reply to landlord email', 'Home', 'high', 'completed', -1],
    ['Call mum', 'Personal', 'normal', 'completed', -2],
    ['Cancel unused subscription', 'Finance', 'normal', 'completed', -4],
    ['Submit expense report', 'Work', 'normal', 'completed', -6],
  ]
  const tasks: Task[] = taskRows.map(([title, category, priority, status, offset]) => ({
    id: uid(),
    title,
    category,
    priority,
    status,
    due: addDays(today, offset),
    createdAt: addDays(today, -14),
    completedAt: status === 'completed' ? addDays(today, Math.min(offset, 0)) : undefined,
  }))

  const categories = defaultCategories()
  const byName = (name: string) => categories.find((c) => c.name === name)!
  const transactions: Transaction[] = []
  const add = (date: string, name: string, amount: number, note?: string) => {
    if (date <= today) transactions.push({ id: uid(), date, categoryId: byName(name).id, amount: Math.round(amount * 100) / 100, note })
  }

  for (const month of [shiftMonth(monthOf(today), -1), monthOf(today)]) {
    add(dayInMonth(month, 1), 'Salary', 3200, 'Monthly pay')
    add(dayInMonth(month, 15), 'Side income', 180 + Math.round(rand() * 160), 'Freelance project')
    add(dayInMonth(month, 2), 'Emergency fund', 250)
    add(dayInMonth(month, 2), 'Investments', 200, 'Index fund')
    for (const c of categories.filter((c) => c.dueDay)) add(dayInMonth(month, c.dueDay!), c.name, c.planned)

    for (const date of monthDays(month)) {
      const dow = fromISO(date).getDay()
      if (dow === 6) add(date, 'Groceries', 70 + rand() * 30, 'Weekly shop')
      if (dow >= 1 && dow <= 5 && rand() < 0.55) add(date, 'Coffee', 3.2, 'Flat white')
      if (dow === 1) add(date, 'Transport', 22 + rand() * 6, 'Travel card top-up')
      if ((dow === 5 || dow === 0) && rand() < 0.6) add(date, 'Eating out', 14 + rand() * 26)
      if (dayNum(date) % 9 === 4) add(date, 'Fun', 12 + rand() * 30)
      if (dayNum(date) % 11 === 7) add(date, 'Shopping', 20 + rand() * 45)
    }
  }

  return {
    version: 1,
    habits,
    habitLog,
    tasks,
    categories,
    transactions,
    settings: { ...settings, sample: true },
  }
}
