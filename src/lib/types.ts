export interface Habit {
  id: string
  name: string
  category: string
  /** Target number of days per month. */
  goal: number
  createdAt: string
}

export type TaskStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed'
export type Priority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  category: string
  priority: Priority
  status: TaskStatus
  due?: string
  notes?: string
  createdAt: string
  completedAt?: string
}

export type MoneyKind = 'income' | 'expense' | 'bill' | 'savings' | 'debt'

export interface BudgetCategory {
  id: string
  name: string
  kind: MoneyKind
  /** Planned amount per month. */
  planned: number
  /** Day of month a bill or debt payment is due. */
  dueDay?: number
}

export interface Transaction {
  id: string
  date: string
  categoryId: string
  amount: number
  note?: string
}

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  name: string
  currency: string
  theme: Theme
  /** True while the app still holds the generated sample data. */
  sample: boolean
}

export interface AppState {
  version: 1
  habits: Habit[]
  /** ISO date -> ids of habits checked off that day. */
  habitLog: Record<string, string[]>
  tasks: Task[]
  categories: BudgetCategory[]
  transactions: Transaction[]
  settings: Settings
}
