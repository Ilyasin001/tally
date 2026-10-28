import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { ListChecks, Moon, Repeat, Settings2, Sun, SunMedium, Wallet, type LucideIcon } from 'lucide-react'
import { useApp } from './lib/store'
import { cn } from './lib/format'
import { Logo } from './components/ui'
import { BudgetSkeleton, HabitsSkeleton, SettingsSkeleton, TasksSkeleton, TodaySkeleton } from './components/skeletons'

// Each screen is its own chunk; its skeleton shows while the chunk loads.
const LOADERS = {
  today: () => import('./views/Today'),
  habits: () => import('./views/Habits'),
  tasks: () => import('./views/Tasks'),
  budget: () => import('./views/Budget'),
  settings: () => import('./views/Settings'),
}

const ROUTES: { path: string; label: string; icon: LucideIcon; view: ComponentType; skeleton: ComponentType }[] = [
  { path: '/', label: 'Today', icon: SunMedium, view: lazy(LOADERS.today), skeleton: TodaySkeleton },
  { path: '/habits', label: 'Habits', icon: Repeat, view: lazy(LOADERS.habits), skeleton: HabitsSkeleton },
  { path: '/tasks', label: 'Tasks', icon: ListChecks, view: lazy(LOADERS.tasks), skeleton: TasksSkeleton },
  { path: '/budget', label: 'Budget', icon: Wallet, view: lazy(LOADERS.budget), skeleton: BudgetSkeleton },
  { path: '/settings', label: 'Settings', icon: Settings2, view: lazy(LOADERS.settings), skeleton: SettingsSkeleton },
]

/** Fetch the other screens once the first one is up, so switching tabs is instant. */
function usePreloadScreens() {
  useEffect(() => {
    const run = () => Object.values(LOADERS).forEach((load) => load().catch(() => {}))
    // Not every Safari version has requestIdleCallback.
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(run, 1200)
    return () => clearTimeout(id)
  }, [])
}

/** Dev aid: add ?skeleton to the URL to see a screen's loading state instead of the screen. */
const forceSkeleton = import.meta.env.DEV && new URLSearchParams(location.search).has('skeleton')

function useRoute() {
  const read = () => location.hash.replace(/^#/, '') || '/'
  const [path, setPath] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setPath(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

function useTheme() {
  const { state } = useApp()
  const theme = state.settings.theme
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d0e11' : '#f4f4ef')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

export default function App() {
  useTheme()
  usePreloadScreens()
  const { state, actions } = useApp()
  const path = useRoute()
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0]
  const View = route.view
  const Placeholder = route.skeleton
  const { theme } = state.settings
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line px-3 py-5 md:flex">
        <a href="#/" className="mb-7 flex items-center gap-2.5 px-2">
          <Logo />
          <span className="font-display text-xl font-semibold tracking-tight">Tally</span>
        </a>
        <nav className="space-y-0.5">
          {ROUTES.map((r) => (
            <a
              key={r.path}
              href={`#${r.path}`}
              aria-current={r === route ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition',
                r === route ? 'bg-surface-2 font-medium text-ink' : 'text-muted hover:bg-surface-2/60 hover:text-ink',
              )}
            >
              <r.icon size={18} className={r === route ? 'text-accent-ink' : undefined} />
              {r.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <button
            onClick={() => actions.updateSettings({ theme: dark ? 'light' : 'dark' })}
            className="flex items-center gap-2 text-xs text-muted hover:text-ink"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <p className="text-[11px] leading-relaxed text-faint">Saved on this device. No account, no subscription.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:hidden">
          <a href="#/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-display text-lg font-semibold">Tally</span>
          </a>
          <button
            aria-label="Toggle theme"
            onClick={() => actions.updateSettings({ theme: dark ? 'light' : 'dark' })}
            className="grid size-9 place-items-center rounded-lg text-muted"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main key={route.path + String(state.settings.sample)} className="rise mx-auto max-w-[1380px] px-4 pt-5 pb-28 sm:px-6 md:pt-8 md:pb-12 lg:px-8">
          {forceSkeleton ? (
            <Placeholder />
          ) : (
            <Suspense fallback={<Placeholder />}>
              <View />
            </Suspense>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {ROUTES.map((r) => (
          <a
            key={r.path}
            href={`#${r.path}`}
            aria-current={r === route ? 'page' : undefined}
            className={cn('flex flex-col items-center gap-0.5 py-2.5 text-[11px]', r === route ? 'text-accent-ink' : 'text-muted')}
          >
            <r.icon size={20} />
            {r.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
