import { useRef, useState } from 'react'
import { Download, Monitor, Moon, RotateCcw, Sparkles, Sun, Upload } from 'lucide-react'
import { isAppState, useApp } from '../lib/store'
import { CURRENCIES, cn } from '../lib/format'
import { todayISO } from '../lib/date'
import type { Theme } from '../lib/types'
import { Button, Card, Field, PageHeader } from '../components/ui'

export default function SettingsView() {
  const { state, actions } = useApp()
  const { settings } = state
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tally-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Backup downloaded.')
  }

  const importData = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text())
      if (!isAppState(parsed)) throw new Error('bad file')
      if (confirm('Replace everything in Tally with this backup?')) {
        actions.replaceState(parsed)
        setMsg('Backup restored.')
      }
    } catch {
      setMsg("That file doesn't look like a Tally backup.")
    }
  }

  const themes: [Theme, string, typeof Sun][] = [
    ['light', 'Light', Sun],
    ['dark', 'Dark', Moon],
    ['system', 'System', Monitor],
  ]

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Everything is saved in this browser. Nothing leaves your device." />

      <div className="space-y-4">
        <Card title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" hint="Used in the greeting on Today.">
              <input className="field" value={settings.name} onChange={(e) => actions.updateSettings({ name: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Currency">
              <select className="field" value={settings.currency} onChange={(e) => actions.updateSettings({ currency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Appearance">
          <div className="grid grid-cols-3 gap-2">
            {themes.map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => actions.updateSettings({ theme: value })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm transition',
                  settings.theme === value ? 'border-accent-ink bg-accent/10 font-medium' : 'border-line text-muted hover:text-ink',
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Your data">
          <p className="mb-4 text-sm text-muted">
            {state.habits.length} habits, {state.tasks.length} tasks and {state.transactions.length} transactions stored locally. Download a backup now and then, especially before
            clearing your browser.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData}>
              <Download size={15} /> Download backup
            </Button>
            <Button onClick={() => file.current?.click()}>
              <Upload size={15} /> Restore backup
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importData(f)
                e.target.value = ''
              }}
            />
          </div>
          {msg && <p className="mt-3 text-sm text-accent-ink">{msg}</p>}
        </Card>

        <Card title="Reset">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => confirm('Replace your data with sample data?') && actions.loadSample()}>
              <Sparkles size={15} /> Load sample data
            </Button>
            <Button
              variant="danger"
              onClick={() => confirm('Erase all habits, tasks and transactions? This cannot be undone.') && actions.startFresh()}
            >
              <RotateCcw size={15} /> Erase everything
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
