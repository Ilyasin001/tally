# Tally

Habits, tasks and a monthly budget in one app. It started from the idea behind the
spreadsheet trackers sold at growwithstack.com (one place to track habits, tasks and
spending) and is its own app with its own name and design.

Data stays in the browser (`localStorage`). There's no account and no server.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. On first launch the app loads sample data. Clear it with
**Start fresh** on the Today screen, or under **Settings → Reset**.

```bash
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
```

The build is a static site, so `dist/` can go on any static host. It includes a web
manifest and a small service worker, so it can be installed to a phone or desktop home
screen and opened offline.

## What's in it

- **Today**: today's habit check-ins with streaks, the tasks that need attention, what's
  left to spend this month, and a weekly review that compares the last 7 days with the
  7 before.
- **Habits**: a monthly grid split into weeks with a monthly goal per habit. It also shows
  completion per day, consistency per week, progress by category, and current streaks.
- **Tasks**: category, priority, status and due date for each task. Charts break tasks
  down by status, priority and category. There's a list of upcoming deadlines, plus
  filters, search and quick add.
- **Budget**: planned and actual amounts for income, expenses, bills, savings and debt.
  It includes cash flow, "left to spend", a breakdown of where the money went,
  mark-as-paid for bills, and a transaction log.
- **Settings**: name, currency, light/dark/system theme, JSON backup and restore, and
  reset.

## Code map

- `src/lib/types.ts`: the data model
- `src/lib/store.tsx`: app state, actions and saving to `localStorage`
- `src/lib/selectors.ts`: derived stats (streaks, monthly habit stats, task and budget
  summaries)
- `src/lib/seed.ts`: sample data and default budget categories
- `src/components/ui.tsx`: shared UI (cards, rings, donuts, modal, month picker)
- `src/views/*`: one file per screen

Stack: Vite, React 18, TypeScript, Tailwind CSS v4, lucide-react icons. Charts are plain
SVG and CSS, with no chart library.
