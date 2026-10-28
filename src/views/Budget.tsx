import { useMemo, useState } from 'react'
import { Check, Plus, Receipt, Trash2 } from 'lucide-react'
import { useApp } from '../lib/store'
import { budgetMonth, KIND_ORDER, KINDS, OUTFLOWS, type CategoryWithActual } from '../lib/selectors'
import { PALETTE, tint } from '../lib/colors'
import { cn, money } from '../lib/format'
import { dayInMonth, monthOf, shortDate, todayISO } from '../lib/date'
import type { BudgetCategory, MoneyKind, Transaction } from '../lib/types'
import { Bar, Button, Card, Donut, Empty, Field, Legend, Modal, MoneyInput, MonthNav, PageHeader, useMonth } from '../components/ui'

type TxDraft = Transaction | { new: true; categoryId?: string }

export default function Budget() {
  const { state } = useApp()
  const [month, setMonth] = useMonth('budget')
  const [tx, setTx] = useState<TxDraft | null>(null)
  const [cat, setCat] = useState<BudgetCategory | { new: true; kind: MoneyKind } | null>(null)
  const b = useMemo(() => budgetMonth(state, month), [state, month])
  const cur = state.settings.currency
  const m = (n: number) => money(n, cur)

  const spent = b.kinds.expense.actual + b.kinds.bill.actual
  const spendPlanned = b.kinds.expense.planned + b.kinds.bill.planned
  const overCats = b.cats.filter((c) => (c.kind === 'expense' || c.kind === 'bill') && c.planned > 0 && c.actual > c.planned)
  const status = b.left < 0 ? { label: 'Overspent', tone: 'text-danger' } : overCats.length ? { label: `${overCats.length} over budget`, tone: 'text-warn' } : { label: 'On track', tone: 'text-good' }

  // Where the money went: top outflow categories, rest grouped.
  const outCats = b.cats.filter((c) => OUTFLOWS.includes(c.kind) && c.actual > 0).sort((a, z) => z.actual - a.actual)
  const top = outCats.slice(0, 6).map((c, i) => ({ label: c.name, value: Math.round(c.actual), color: PALETTE[i] }))
  const rest = outCats.slice(6).reduce((s, c) => s + c.actual, 0)
  if (rest > 0) top.push({ label: 'Other', value: Math.round(rest), color: '#71717a' })

  const flowMax = Math.max(1, ...KIND_ORDER.map((k) => Math.max(b.kinds[k].planned, b.kinds[k].actual)))

  return (
    <div>
      <PageHeader title="Budget" subtitle="Plan the month, log what you spend, see where it goes.">
        <MonthNav month={month} onChange={setMonth} />
        <Button variant="primary" onClick={() => setTx({ new: true })}>
          <Plus size={16} /> Add transaction
        </Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(['income', 'expense', 'savings', 'debt'] as MoneyKind[]).map((k) => {
          const actual = k === 'expense' ? spent : b.kinds[k].actual
          const planned = k === 'expense' ? spendPlanned : b.kinds[k].planned
          return (
            <div key={k} className="rounded-2xl border border-line bg-surface px-4 py-3.5">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="size-2 rounded-full" style={{ background: KINDS[k].color }} />
                {k === 'expense' ? 'Expenses & bills' : KINDS[k].label}
              </div>
              <div className="tnum mt-1 truncate font-display text-[24px] font-semibold leading-tight">{m(actual)}</div>
              <div className="tnum mt-0.5 mb-2 text-xs text-faint">of {m(planned)} planned</div>
              <Bar value={planned ? actual / planned : 0} color={k === 'expense' && actual > planned ? 'var(--danger)' : KINDS[k].color} />
            </div>
          )
        })}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card title="Left to spend">
          <div className={cn('tnum font-display text-[40px] font-semibold leading-none', b.left < 0 && 'text-danger')}>{m(Math.round(b.left * 100) / 100)}</div>
          <div className={cn('mt-2 text-sm font-medium', status.tone)}>{status.label}</div>
          <p className="mt-3 text-sm text-muted">
            Income received minus everything paid out this month. Planned: <span className="tnum text-ink">{m(b.leftPlanned)}</span>.
          </p>
          {overCats.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs">
              {overCats.slice(0, 3).map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span className="text-muted">{c.name}</span>
                  <span className="tnum text-warn">+{m(Math.round((c.actual - c.planned) * 100) / 100)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Cash flow">
          <ul className="space-y-3">
            {KIND_ORDER.map((k) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">{KINDS[k].label}</span>
                  <span className="tnum">
                    {m(Math.round(b.kinds[k].actual))} <span className="text-faint">/ {m(b.kinds[k].planned)}</span>
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(b.kinds[k].planned / flowMax) * 100}%`, background: `color-mix(in oklab, ${KINDS[k].color} 30%, transparent)` }}
                    title="Planned"
                  />
                  <div className="h-1.5 rounded-full transition-[width] duration-500" style={{ width: `${(b.kinds[k].actual / flowMax) * 100}%`, background: KINDS[k].color }} title="Actual" />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-4 text-[11px] text-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-muted/35" /> Planned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-muted" /> Actual
            </span>
          </div>
        </Card>

        <Card title="Where your money went">
          {top.length ? (
            <div className="@container">
            <div className="flex flex-col items-center gap-4 @xs:flex-row">
              <Donut size={120} stroke={15} segments={top}>
                <div>
                  <div className="tnum font-display text-base font-semibold">{m(Math.round(b.outActual))}</div>
                  <div className="text-[11px] text-muted">paid out</div>
                </div>
              </Donut>
              <div className="w-full min-w-0 flex-1">
                <Legend items={top.map((t) => ({ ...t, value: m(t.value) }))} />
              </div>
            </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No spending logged this month yet.</p>
          )}
        </Card>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        {(['expense', 'bill', 'savings', 'debt', 'income'] as MoneyKind[]).map((k) => (
          <CategoryTable key={k} kind={k} rows={b.kinds[k].cats} month={month} onEdit={setCat} onAdd={() => setCat({ new: true, kind: k })} />
        ))}
      </div>

      <Card
        title={`Transactions · ${b.tx.length}`}
        action={
          <Button size="sm" onClick={() => setTx({ new: true })}>
            <Plus size={14} /> Add
          </Button>
        }
        flush
      >
        {b.tx.length === 0 ? (
          <Empty icon={<Receipt size={22} />} title="No transactions this month">
            Log income and spending as it happens. It takes five seconds.
          </Empty>
        ) : (
          <ul>
            {b.tx.map((t) => {
              const c = state.categories.find((x) => x.id === t.categoryId)
              if (!c) return null
              return (
                <li key={t.id}>
                  <button onClick={() => setTx(t)} className="flex w-full items-center gap-3 border-t border-line/60 px-4 py-2.5 text-left text-sm transition hover:bg-surface-2/50 sm:px-5">
                    <span className="tnum w-14 shrink-0 text-xs text-muted">{shortDate(t.date)}</span>
                    <span className="pill hidden shrink-0 sm:inline" style={tint(KINDS[c.kind].color)}>
                      {KINDS[c.kind].single}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {c.name}
                      {t.note && <span className="text-faint"> · {t.note}</span>}
                    </span>
                    <span className={cn('tnum shrink-0 font-medium', c.kind === 'income' && 'text-good')}>
                      {c.kind === 'income' ? '+' : '−'}
                      {m(t.amount)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <TxModal key={tx && 'id' in tx ? tx.id : tx ? 'tx-new' : 'tx-closed'} draft={tx} month={month} onClose={() => setTx(null)} />
      <CategoryModal key={cat && 'id' in cat ? cat.id : cat ? `cat-new-${cat.kind}` : 'cat-closed'} draft={cat} onClose={() => setCat(null)} />
    </div>
  )
}

function CategoryTable({
  kind,
  rows,
  month,
  onEdit,
  onAdd,
}: {
  kind: MoneyKind
  rows: CategoryWithActual[]
  month: string
  onEdit: (c: BudgetCategory) => void
  onAdd: () => void
}) {
  const { state, actions } = useApp()
  const m = (n: number) => money(n, state.settings.currency)
  const hasDue = kind === 'bill' || kind === 'debt'
  const goodWhenOver = kind === 'income' || kind === 'savings'
  const planned = rows.reduce((s, r) => s + r.planned, 0)
  const actual = rows.reduce((s, r) => s + r.actual, 0)
  const today = todayISO()

  const markPaid = (c: CategoryWithActual) => {
    const due = dayInMonth(month, c.dueDay ?? 1)
    const date = month === monthOf(today) && due > today ? today : due
    actions.addTransaction({ date, categoryId: c.id, amount: Math.round((c.planned - c.actual) * 100) / 100, note: 'Marked paid' })
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: KINDS[kind].color }} />
          {KINDS[kind].label}
        </span>
      }
      action={
        <Button size="sm" variant="ghost" onClick={onAdd}>
          <Plus size={14} /> Category
        </Button>
      }
      flush
    >
      <div className="scroll-x">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="text-left text-[11px] text-faint">
              <th className="px-4 pb-2 font-medium sm:px-5">Category</th>
              {hasDue && <th className="pb-2 font-medium">Due</th>}
              <th className="pb-2 text-right font-medium">Planned</th>
              <th className="pb-2 pl-3 text-right font-medium">Actual</th>
              <th className="w-[26%] px-4 pb-2 font-medium sm:px-5">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const p = c.planned ? c.actual / c.planned : c.actual > 0 ? 1 : 0
              const over = !goodWhenOver && c.planned > 0 && c.actual > c.planned
              const paid = c.planned > 0 && c.actual >= c.planned
              return (
                <tr key={c.id} className="border-t border-line/60">
                  <td className="px-4 py-1.5 sm:px-5">
                    <div className="flex items-center gap-2">
                      {hasDue && (
                        <button
                          onClick={() => !paid && markPaid(c)}
                          disabled={paid || c.planned <= 0}
                          title={paid ? 'Paid' : 'Mark as paid'}
                          aria-label={paid ? `${c.name} paid` : `Mark ${c.name} as paid`}
                          className={cn('grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition', paid ? 'border-good bg-good' : 'border-line hover:border-good')}
                        >
                          {paid && <Check size={12} strokeWidth={3.5} className="text-surface" />}
                        </button>
                      )}
                      <button onClick={() => onEdit(c)} className="truncate text-left hover:text-accent-ink">
                        {c.name}
                      </button>
                    </div>
                  </td>
                  {hasDue && <td className="tnum text-xs text-muted">{c.dueDay ? shortDate(dayInMonth(month, c.dueDay)) : '—'}</td>}
                  <td className="text-right">
                    <MoneyInput value={c.planned} format={m} onCommit={(n) => actions.updateCategory(c.id, { planned: n })} />
                  </td>
                  <td className={cn('tnum pl-3 text-right', over && 'text-danger')}>{m(Math.round(c.actual * 100) / 100)}</td>
                  <td className="px-4 sm:px-5">
                    <div className="flex items-center gap-2">
                      <Bar value={p} color={over ? 'var(--danger)' : KINDS[kind].color} />
                      <span className={cn('tnum w-9 text-right text-[11px]', over ? 'text-danger' : p >= 1 && goodWhenOver ? 'text-good' : 'text-muted')}>{Math.round(p * 100)}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-3 text-sm text-faint">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-line text-xs font-medium">
                <td className="px-4 pt-2 sm:px-5">Total</td>
                {hasDue && <td />}
                <td className="tnum pt-2 pr-1.5 text-right">{m(planned)}</td>
                <td className="tnum pt-2 pl-3 text-right">{m(Math.round(actual * 100) / 100)}</td>
                <td className="px-4 pt-2 text-right text-muted sm:px-5">{planned ? `${Math.round((actual / planned) * 100)}%` : ''}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  )
}

function TxModal({ draft, month, onClose }: { draft: TxDraft | null; month: string; onClose: () => void }) {
  const { state, actions } = useApp()
  const existing = draft && 'id' in draft ? draft : null
  const today = todayISO()
  const [date, setDate] = useState(existing?.date ?? (monthOf(today) === month ? today : `${month}-01`))
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? (draft && !existing ? draft.categoryId : undefined) ?? state.categories.find((c) => c.kind === 'expense')?.id ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [note, setNote] = useState(existing?.note ?? '')
  const value = Number(amount.replace(',', '.'))
  const valid = !!categoryId && value > 0 && !!date

  const save = () => {
    if (!valid) return
    const t = { date, categoryId, amount: Math.round(value * 100) / 100, note: note.trim() || undefined }
    if (existing) actions.updateTransaction(existing.id, t)
    else actions.addTransaction(t)
    onClose()
  }

  return (
    <Modal open={!!draft} onClose={onClose} title={existing ? 'Edit transaction' : 'Add transaction'}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Amount (${state.settings.currency})`}>
            <input autoFocus className="field tnum" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Date">
            <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Category">
          <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {KIND_ORDER.map((k) => (
              <optgroup key={k} label={KINDS[k].label}>
                {state.categories
                  .filter((c) => c.kind === k)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Note">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </Field>
        <div className="flex items-center justify-between gap-2 pt-1">
          {existing ? (
            <Button
              variant="danger"
              onClick={() => {
                actions.deleteTransaction(existing.id)
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
            <Button variant="primary" type="submit" disabled={!valid}>
              {existing ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function CategoryModal({ draft, onClose }: { draft: BudgetCategory | { new: true; kind: MoneyKind } | null; onClose: () => void }) {
  const { state, actions } = useApp()
  const existing = draft && 'id' in draft ? draft : null
  const [name, setName] = useState(existing?.name ?? '')
  const [kind, setKind] = useState<MoneyKind>(existing?.kind ?? (draft && !existing ? draft.kind : 'expense'))
  const [planned, setPlanned] = useState(existing ? String(existing.planned) : '')
  const [dueDay, setDueDay] = useState(existing?.dueDay ? String(existing.dueDay) : '')
  const hasDue = kind === 'bill' || kind === 'debt'
  const txCount = existing ? state.transactions.filter((t) => t.categoryId === existing.id).length : 0

  const save = () => {
    if (!name.trim()) return
    const day = Number(dueDay)
    const c = { name: name.trim(), kind, planned: Math.max(0, Number(planned.replace(',', '.')) || 0), dueDay: hasDue && day >= 1 && day <= 31 ? day : undefined }
    if (existing) actions.updateCategory(existing.id, c)
    else actions.addCategory(c)
    onClose()
  }

  return (
    <Modal open={!!draft} onClose={onClose} title={existing ? 'Edit category' : 'New category'}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field label="Name">
          <input autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gym membership" />
        </Field>
        <Field label="Type">
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value as MoneyKind)}>
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {KINDS[k].label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Planned per month">
            <input className="field tnum" inputMode="decimal" value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder="0" />
          </Field>
          {hasDue && (
            <Field label="Due day of month">
              <input className="field tnum" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="1–31" />
            </Field>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          {existing ? (
            <Button
              variant="danger"
              onClick={() => {
                const msg = txCount ? `Delete "${existing.name}" and its ${txCount} transaction${txCount === 1 ? '' : 's'}?` : `Delete "${existing.name}"?`
                if (confirm(msg)) {
                  actions.deleteCategory(existing.id)
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
              {existing ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
