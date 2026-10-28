import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { AppState, BudgetCategory, Habit, Settings, Task, Transaction } from './types'
import { makeEmptyState, makeSampleState, uid } from './seed'
import { todayISO } from './date'

const KEY = 'tally:v1'

export function isAppState(s: unknown): s is AppState {
  const v = s as AppState
  return (
    !!v &&
    v.version === 1 &&
    Array.isArray(v.habits) &&
    Array.isArray(v.tasks) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.transactions) &&
    typeof v.habitLog === 'object' &&
    typeof v.settings === 'object'
  )
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isAppState(parsed)) return parsed
    }
  } catch {
    // Storage unavailable or corrupt: fall through to sample data.
  }
  return makeSampleState()
}

function createActions(set: Dispatch<SetStateAction<AppState>>) {
  return {
    addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) =>
      set((s) => ({ ...s, habits: [...s.habits, { ...h, id: uid(), createdAt: todayISO() }] })),
    updateHabit: (id: string, patch: Partial<Habit>) =>
      set((s) => ({ ...s, habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
    deleteHabit: (id: string) =>
      set((s) => {
        const habitLog: AppState['habitLog'] = {}
        for (const [date, ids] of Object.entries(s.habitLog)) {
          const rest = ids.filter((x) => x !== id)
          if (rest.length) habitLog[date] = rest
        }
        return { ...s, habits: s.habits.filter((h) => h.id !== id), habitLog }
      }),
    moveHabit: (id: string, dir: -1 | 1) =>
      set((s) => {
        const i = s.habits.findIndex((h) => h.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= s.habits.length) return s
        const habits = [...s.habits]
        ;[habits[i], habits[j]] = [habits[j], habits[i]]
        return { ...s, habits }
      }),
    toggleHabit: (id: string, date: string) =>
      set((s) => {
        const cur = s.habitLog[date] ?? []
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
        const habitLog = { ...s.habitLog }
        if (next.length) habitLog[date] = next
        else delete habitLog[date]
        return { ...s, habitLog }
      }),

    addTask: (t: Omit<Task, 'id' | 'createdAt'>) =>
      set((s) => ({
        ...s,
        tasks: [
          { ...t, id: uid(), createdAt: todayISO(), completedAt: t.status === 'completed' ? todayISO() : undefined },
          ...s.tasks,
        ],
      })),
    updateTask: (id: string, patch: Partial<Task>) =>
      set((s) => ({
        ...s,
        tasks: s.tasks.map((t) => {
          if (t.id !== id) return t
          const next = { ...t, ...patch }
          if (patch.status === 'completed' && t.status !== 'completed') next.completedAt = todayISO()
          if (patch.status && patch.status !== 'completed') next.completedAt = undefined
          return next
        }),
      })),
    deleteTask: (id: string) => set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),

    addCategory: (c: Omit<BudgetCategory, 'id'>) => set((s) => ({ ...s, categories: [...s.categories, { ...c, id: uid() }] })),
    updateCategory: (id: string, patch: Partial<BudgetCategory>) =>
      set((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    deleteCategory: (id: string) =>
      set((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        transactions: s.transactions.filter((t) => t.categoryId !== id),
      })),

    addTransaction: (t: Omit<Transaction, 'id'>) => set((s) => ({ ...s, transactions: [...s.transactions, { ...t, id: uid() }] })),
    updateTransaction: (id: string, patch: Partial<Transaction>) =>
      set((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    deleteTransaction: (id: string) => set((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),

    updateSettings: (patch: Partial<Settings>) => set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    replaceState: (next: AppState) => set(next),
    startFresh: () => set((s) => makeEmptyState(s.settings)),
    loadSample: () => set((s) => makeSampleState(s.settings)),
  }
}

export type Actions = ReturnType<typeof createActions>

const Ctx = createContext<{ state: AppState; actions: Actions } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load)
  const actions = useMemo(() => createActions(setState), [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Private mode or full storage: the app keeps working in memory.
    }
  }, [state])

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside <AppProvider>')
  return v
}
