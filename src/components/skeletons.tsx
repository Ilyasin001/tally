import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../lib/format'

// Placeholders that mirror each screen's layout while its code loads.

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
/** Stable pseudo-random percentage so bars and lines look natural but never jump. */
const vary = (i: number, min: number, span: number) => min + ((i * 37 + 11) % span)

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} />
}

function Loading({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

function Frame({ children, className, title = true }: { children: ReactNode; className?: string; title?: boolean }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4 sm:p-5', className)}>
      {title && <Skeleton className="mb-4 h-3 w-24" />}
      {children}
    </div>
  )
}

function Header({ actions = [] }: { actions?: string[] }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Skeleton className="h-8 w-40 sm:h-9" />
        <Skeleton className="mt-2 h-4 w-64 max-w-[70vw]" />
      </div>
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((w, i) => (
            <Skeleton key={i} className={cn('h-9 rounded-[10px]', w)} />
          ))}
        </div>
      )}
    </div>
  )
}

function Lines({ n, className }: { n: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {range(n).map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3.5" style={{ width: `${vary(i, 40, 45)}%` }} />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
      ))}
    </div>
  )
}

function DonutCard() {
  return (
    <Frame>
      <div className="flex items-center gap-4">
        <Skeleton className="size-[112px] shrink-0 rounded-full" />
        <Lines n={4} className="flex-1" />
      </div>
    </Frame>
  )
}

function StatTile() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2.5 h-6 w-14" />
    </div>
  )
}

function ListRows({ n }: { n: number }) {
  return (
    <div>
      {range(n).map((i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 sm:px-5">
          <Skeleton className="size-[22px] shrink-0 rounded-full" />
          <Skeleton className="h-3.5" style={{ width: `${vary(i, 30, 35)}%` }} />
          <div className="ml-auto hidden gap-2 sm:flex">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export function TodaySkeleton() {
  return (
    <Loading label="Loading today">
      <Header />
      <div className="grid gap-4 lg:grid-cols-3">
        <Frame className="lg:row-span-2">
          <div className="mb-4 flex items-center gap-4">
            <Skeleton className="size-[84px] shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            {range(7).map((i) => (
              <Skeleton key={i} className="h-[46px] rounded-xl" />
            ))}
          </div>
        </Frame>
        <Frame>
          <div className="space-y-1">
            {range(5).map((i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <Skeleton className="h-3.5" style={{ width: `${vary(i, 45, 35)}%` }} />
                <Skeleton className="ml-auto h-3 w-10" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-3 h-9 rounded-xl" />
        </Frame>
        <Frame>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-9 w-40" />
          <Skeleton className="mt-5 h-1.5 rounded-full" />
          <Skeleton className="mt-5 h-1.5 rounded-full" />
        </Frame>
        <Frame className="lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="flex h-28 items-end gap-2">
              {range(7).map((i) => (
                <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${vary(i, 35, 60)}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {range(3).map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </Frame>
      </div>
    </Loading>
  )
}

export function HabitsSkeleton() {
  return (
    <Loading label="Loading habits">
      <Header actions={['w-44', 'w-32']} />
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <Frame>
            <div className="flex items-center gap-5">
              <Skeleton className="size-[104px] shrink-0 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </Frame>
          <Frame>
            <div className="grid grid-cols-5 gap-2">
              {range(5).map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="size-[62px] shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </Frame>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <Frame>
            <div className="flex h-36 items-end gap-[3px] lg:h-56">
              {range(31).map((i) => (
                <Skeleton key={i} className="flex-1 rounded-b-none rounded-t-[4px]" style={{ height: `${vary(i, 40, 55)}%` }} />
              ))}
            </div>
          </Frame>
          <Frame>
            <div className="space-y-4">
              {range(6).map((i) => (
                <div key={i}>
                  <div className="mb-1.5 flex justify-between">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-2 rounded-full" style={{ width: `${vary(i, 50, 50)}%` }} />
                </div>
              ))}
            </div>
          </Frame>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {range(8).map((i) => (
            <div key={i} className="flex items-center gap-[4px] border-b border-line/60 py-2 pr-4 last:border-0">
              <div className="w-[150px] shrink-0 space-y-1.5 px-4 sm:w-[188px]">
                <Skeleton className="h-3.5" style={{ width: `${vary(i, 60, 35)}%` }} />
                <Skeleton className="h-2.5 w-20" />
              </div>
              {range(31).map((d) => (
                <Skeleton key={d} className={cn('size-[26px] shrink-0 rounded-[7px]', d % 7 === 0 && d > 0 && 'ml-2')} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Loading>
  )
}

export function TasksSkeleton() {
  return (
    <Loading label="Loading tasks">
      <Header actions={['w-28']} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {range(6).map((i) => (
          <StatTile key={i} />
        ))}
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DonutCard />
        <DonutCard />
        <Frame>
          <Lines n={5} />
        </Frame>
        <Frame>
          <Lines n={5} />
        </Frame>
      </div>
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 sm:p-4">
          <Skeleton className="h-8 w-48 rounded-[10px]" />
          <Skeleton className="h-8 w-32 rounded-[10px]" />
          <Skeleton className="ml-auto h-8 w-full rounded-[10px] sm:w-56" />
        </div>
        <ListRows n={8} />
      </div>
    </Loading>
  )
}

export function BudgetSkeleton() {
  return (
    <Loading label="Loading budget">
      <Header actions={['w-44', 'w-40']} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {range(4).map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface px-4 py-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-6 w-24" />
            <Skeleton className="mt-2 h-2.5 w-16" />
            <Skeleton className="mt-3 h-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Frame>
          <Skeleton className="h-10 w-44" />
          <Skeleton className="mt-3 h-3.5 w-20" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </Frame>
        <Frame>
          <div className="space-y-4">
            {range(5).map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-1.5 rounded-full" style={{ width: `${vary(i, 30, 70)}%` }} />
              </div>
            ))}
          </div>
        </Frame>
        <DonutCard />
      </div>
      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        {range(4).map((c) => (
          <Frame key={c}>
            <div className="space-y-3">
              {range(c % 2 ? 4 : 5).map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-3.5" style={{ width: `${vary(i + c, 22, 18)}%` }} />
                  <Skeleton className="ml-auto h-3 w-14" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-1.5 w-[22%] rounded-full" />
                </div>
              ))}
            </div>
          </Frame>
        ))}
      </div>
      <Frame>
        <div className="space-y-4">
          {range(6).map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
              <Skeleton className="h-3.5" style={{ width: `${vary(i, 25, 30)}%` }} />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </div>
          ))}
        </div>
      </Frame>
    </Loading>
  )
}

export function SettingsSkeleton() {
  return (
    <Loading label="Loading settings" className="max-w-2xl">
      <Header />
      <div className="space-y-4">
        <Frame>
          <div className="grid gap-4 sm:grid-cols-2">
            {range(2).map((i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-10 rounded-[10px]" />
              </div>
            ))}
          </div>
        </Frame>
        <Frame>
          <div className="grid grid-cols-3 gap-2">
            {range(3).map((i) => (
              <Skeleton key={i} className="h-[68px] rounded-xl" />
            ))}
          </div>
        </Frame>
        <Frame>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-2/3" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-40 rounded-[10px]" />
            <Skeleton className="h-9 w-36 rounded-[10px]" />
          </div>
        </Frame>
        <Frame>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-40 rounded-[10px]" />
            <Skeleton className="h-9 w-36 rounded-[10px]" />
          </div>
        </Frame>
      </div>
    </Loading>
  )
}
