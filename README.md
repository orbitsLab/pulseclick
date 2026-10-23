# PulseTick — Tasks, Schedule, Habits & Focus

A personal productivity workspace built with **Next.js 16**, **React 19**, **Prisma ORM**,
**PostgreSQL**, **TanStack Query v5**, and the **Web Audio API**.

PulseTick is a reimplementation of the capability set that **TickTick** advertises on
ticktick.com — it is not an official TickTick product and carries no TickTick branding.
The feature set was derived from the live product site using the
[REA reverse-engineering tooling](https://github.com/morluto/rea): the public marketing pages were
captured in a real browser (DOM, accessibility tree, network, screenshots) and the shipped web
bundle was statically analysed. Every module below maps to a capability the product advertises.

---

## Evidence trail — what was observed and where it came from

| Evidence | Method | What it produced |
| --- | --- | --- |
| `https://ticktick.com/` | Browser scenario (DOM + a11y + network + screenshot) | Marketing IA, brand palette (`#4772fa`, `#191919`, `#fafafa`), font family, nav structure |
| `https://ticktick.com/features` | Browser scenario + HTML extraction | The authoritative feature inventory reproduced below |
| `https://ticktick.com/signin` | Browser scenario (a11y tree) | Auth surface: email/password, Google, Apple, forgot-password |
| `d107mjio2rjf74.cloudfront.net/web/static/build/...` | `analyze_javascript_application` (REA) | The real web app's SPA bundle graph (807 tools, partial coverage) |
| `https://ticktick.com/sitemap.xml` | HTTP fetch | Full public page inventory |
| The running clone | Browser scenario + screenshot review | Runtime verification of every module |

---

## Feature parity map

Observed on ticktick.com/features → implemented here.

### Capture tasks quickly
- **NLP time setting** — `lib/nlp.ts` parses natural language into date, time, repeat rule,
  priority, tags and duration. Live "Understood" preview in the quick-add bar and the floating
  quick-add modal. Handles `tomorrow`, `next monday`, `in 3 days`, `jan 5 2027`, `25-12`,
  `every friday`, `every 2 weeks`, `every weekday`, `on the 1st`, `5pm`, `at 9am`, `tonight`,
  `eod`, `end of week`, `for 90m`, `#tag`, `!1`/`!2`/`!3`, `high/medium/low`.
- **Voice input** — Web Speech API dictation button in both quick-add surfaces.
- **Quick capture** — floating action button + always-visible task input bar.

### Effortless task management
- **Lists** — unlimited coloured lists with per-list background, task counts, create/rename/delete.
- **Smart filters** — saved filter model (`Filter`), criteria builder (priority, tags, lists,
  due range, status, description/subtask presence, pinned, keyword), live criteria summary,
  sidebar entries, server-side query translation (`lib/filters.ts`).
- **Tags** — coloured tag chips, per-task tag toggles, tag counts.

### Powerful reminder features
- **Multiple notifications** — `Reminder` model, several reminders per task, each independently
  toggled and removable.
- **Constant reminder** — `CONSTANT` reminder type ("keeps ringing until done").
- **Repeat reminder** — daily / weekly / monthly / yearly / custom, with interval, weekday
  selection and an end date; the real recurrence engine (`lib/recurrence.ts`) advances a recurring
  task to its next occurrence on completion instead of duplicating it.
- **Email / location / daily reminders** — *not shipped.* The `Reminder` model carries the
  in-app kinds only (`AT_TIME`, `5_MIN`, `15_MIN`, `30_MIN`, `1_HOUR`, `1_DAY`, `CONSTANT`).
  Email delivery, location geofencing and lock-screen notifications are native-app features.

### Schedule your day
- **Calendar** — Month, **Week**, **Agenda** and **Year** views, multi-day and multi-week
  navigation, mini calendar in the sidebar.
- **Timeline** — Gantt-style schedule with drag-to-move, drag-to-resize, duration editing,
  today marker, unscheduled tray.

### Multiple view modes
- **List** — three-pane layout (lists · tasks · details) with grouping, sorting, bulk actions,
  priority stripes.
- **Kanban** — grouped columns with quick move and quick add.
- **Timeline** — see above.

### Powerful productivity tools
- **Habit tracker** — daily/weekly habits, streaks, completion rates, per-day check-in.
- **Pomodoro** — focus / short break / long break, circular countdown, task linking, today's
  focus minutes and session count.
- **Eisenhower matrix** — four quadrants with inline quick-add that sets priority and due date.
- **Countdown** — event countdowns with live day/hour/minute/second ticks, yearly recurrence,
  progress bars, emoji and colour.

### Explore more features
- **Keyboard shortcuts & command menus** — ⌘K command palette, module rail, filter shortcuts.
- **Collaboration** — share a list by email, member roles (owner / editor / viewer), assign tasks
  to members, invitation state.
- **Integrations** — subscribe to any public ICS calendar and import its events as scheduled
  tasks (RFC 5545 parser in `lib/ics.ts`), plus a timezone setting.
- **Statistics** — created/completed over time, completion rate gauge, priority mix, focus time,
  per-list breakdown, habit streaks, busiest days, with week/month/quarter/year ranges.
- **Themes** — 57 workspace themes published as CSS custom properties (`lib/themes.ts`) plus
  20 per-list backgrounds. Each palette derives a legible accent-text tone and a darker accent
  for filled controls, so the accent stays readable in every theme.
- **List background** — per-list backdrop from the background gallery.
- **Time zone** — user time zone drives schedule planning and reminders while travelling.

---

## Architecture

```
app/
  api/                     Route handlers (Next 16 `params: Promise<{id}>`)
    tasks/                 CRUD + batch + lists + tags + assignees
    filters/  countdowns/  reminders/  stats/  settings/
    calendars/subscriptions/  ICS subscription + sync
    lists/[id]/members/    Collaboration
    habits/  pomodoro/  auth/
components/ticktick/       Product surface (one file per module)
hooks/use-ticktick.ts      TanStack Query data layer + optimistic mutations
app/fonts.ts              Type system: Onest (UI) · Instrument Serif (display) · Geist Mono (data)
lib/
  nlp.ts                   Natural-language task parsing
  recurrence.ts            Recurrence rules and next-occurrence engine
  filters.ts               Smart filter query model → Prisma where
  themes.ts                Theme + list background palettes
  ics.ts                   RFC 5545 calendar reader
lib/prisma.ts              Prisma singleton
prisma/schema.prisma       Data model
```

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 +
PostgreSQL · TanStack Query v5 · Web Audio API · Web Speech API · lucide-react · recharts ·
date-fns · jose + bcryptjs (HTTP-only cookie sessions).

**Type system**: three voices with one job each (`app/fonts.ts`) — Onest for the product
voice (labels, controls, task titles), Instrument Serif for the one display role (the module
title), Geist Mono for the data voice (timers, countdowns, clock times). Size is expressed as
role, not value: `tt-display`, `tt-title`, `tt-heading`, `tt-body`, `tt-label`, `tt-meta`,
`tt-overline`, `tt-figure` (`@utility` in `app/globals.css`).

---

## Getting started

### 1. Database

```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true&connection_limit=5"
JWT_SECRET="change-me"
```

Supabase's pooler needs `sslmode=require&pgbouncer=true`; keep `connection_limit` low because the
pooler caps concurrent clients.

### 2. Schema

```bash
npx prisma db push
npx prisma generate
```

### 3. Run

```bash
pnpm dev     # http://localhost:3000
```

Registering an account automatically seeds lists, tags, tasks, habits, reminders, filters,
countdowns, a collaboration member and scheduled timeline blocks.

---

## Notes and limits

- The clone reproduces the **web** product. Native-only capabilities (lock-screen reminders,
  location geofencing, system widgets, desktop global shortcut, voice capture on mobile) are
  represented in the data model but not shipped as native integrations.
- Offline sync, multi-device conflict resolution and the paid plan tiers are out of scope.
- Static analysis of the real web bundle was partial (REA reported `partial` application and
  semantic coverage with 23,963 retained unknowns), so route and copy reconstruction leaned on
  the public product pages, which are authoritative for the advertised feature set.
