// Dates are stored as local "YYYY-MM-DD" strings and months as "YYYY-MM",
// so they sort and compare as plain strings.

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d || 1)
}

export const todayISO = () => toISO(new Date())

export function addDays(iso: string, n: number) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: string, b: string) {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000)
}

export const monthOf = (iso: string) => iso.slice(0, 7)

export function daysInMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function shiftMonth(month: string, n: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthDays(month: string) {
  return Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${pad(i + 1)}`)
}

/** The given day of a month, clamped to the month's length. */
export function dayInMonth(month: string, day: number) {
  return `${month}-${pad(Math.min(Math.max(day, 1), daysInMonth(month)))}`
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  fromISO(iso).toLocaleDateString(undefined, opts)

export const monthLabel = (month: string) => fmtDate(`${month}-01`, { month: 'long', year: 'numeric' })
export const shortDate = (iso: string) => fmtDate(iso, { month: 'short', day: 'numeric' })
export const weekdayLetter = (iso: string) => fmtDate(iso, { weekday: 'narrow' })
export const dayNum = (iso: string) => Number(iso.slice(8))
