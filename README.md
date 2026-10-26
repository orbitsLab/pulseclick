# PulseFlow — Tasks, Schedule, Habits & Focus

A modern, unified personal productivity workspace built with **Next.js 16**, **React 19**, **Prisma ORM**, **PostgreSQL**, **TanStack Query v5**, and the **Web Audio API**.

PulseFlow combines task management, calendar scheduling, habit tracking, and deep focus into a cohesive, quiet, and fast daily workspace.

---

## Features

### ⚡ Quick Capture & Natural Language Parsing
- **NLP Time Setting** (`lib/nlp.ts`) — Parses natural language directly into dates, times, recurrence rules, priorities, tags, and durations. Features live "Understood" previews in both the quick-add input bar and the modal dialog. Handles expressions like `tomorrow`, `next monday`, `in 3 days`, `every weekday`, `at 5pm`, `#work`, and `!3` (high priority).
- **Voice Dictation** — Speech-to-text capture using the Web Speech API in quick-add surfaces.
- **Global Command Palette** (`⌘K` / `Ctrl+K`) — Jump directly between modules, search tasks and lists, or switch views instantly.

### 📋 Comprehensive Task Management
- **Multiple Views**:
  - **Task List View** — Group by list, tag, date, or priority; sorting, drag-to-reorder, and floating batch actions.
  - **Kanban Board** — Visual columns organized by status or priority with drag-and-drop movement.
  - **Eisenhower Matrix** — 4-quadrant prioritization (Urgent/Important, Important, Urgent, Neither) with drag-to-reprioritize.
  - **Timeline Schedule** — Gantt-style daily timeline with drag-to-move, drag-to-resize duration, and snap-to-grid.
  - **Calendar View** — Full month, week, day, and agenda views with appointment-style time slots and multi-day spans.
- **Task Inspector** — In-depth task sidebar for markdown descriptions, checkable subtasks, file attachments, reminders, due dates, and recurrence rules.
- **Smart Filters** — Saved filter builder with criteria for priorities, tags, lists, due date windows, completion status, and keyword matching.

### 🔥 Daily Habit Tracker
- **Habit Sections** — Organize routines into custom time-of-day sections (e.g., Morning Routine, Afternoon Focus, Evening Wind-down).
- **Streak & Consistency Tracking** — Best and current streaks, completion rates, and monthly consistency.
- **Visual Heatmap** — Year-at-a-glance GitHub-style activity grid showing daily completion density.
- **Value & Check Habits** — Track binary check-offs or numeric targets (glasses of water, pages read, meditation minutes).
- **Habit Logs & Archiving** — Complete historical logging with notes and ability to archive habits without losing data.

### ⏱ Pomodoro & Focus Timer
- **Customizable Intervals** — Standard 25/5 work-rest splits or fully customized durations.
- **Ambient Soundscapes** — Synthesized real-time audio generators for White Noise, Rain, Ocean Waves, and Cafe ambience via the Web Audio API without external audio file dependencies.
- **Task Association & Stats** — Link focus sessions to specific tasks and view daily, weekly, and all-time focus statistics.

### ⏳ Event Countdowns & Milestones
- **Live Countdown Cards** — Track upcoming deadlines, milestones, anniversaries, and holidays.
- **Progress Tracking** — Visual progress bars toward target dates with custom emoji icons and colors.

### 🎨 Personalization & Multi-Theme Engine
- **40+ Themes** (`lib/themes.ts`) — Curated light, dark, and OLED midnight themes with instant CSS variable switching.
- **Custom List Backgrounds** — Gradients and subtle geometric patterns for individual list headers.
- **Three-Voice Typography** — Onest for clean UI grotesque readability, Instrument Serif for elegant editorial display headers, and Geist Mono for tabular figures and clocks.

### 👥 Collaboration & Integrations
- **Shared Lists & Member Roles** — Invite collaborators as Editors or Viewers with task assignments.
- **Calendar Subscriptions** — Subscribe to external `.ics` / iCal calendar feeds.
- **Multi-Notification Reminders** — Configure multiple alarms per task with custom lead times.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server & Client Components) |
| **UI Library** | React 19, Tailwind CSS v4, Lucide Icons |
| **State & Data Layer** | TanStack React Query v5 (Optimistic UI, Query Invalidation) |
| **Database & ORM** | PostgreSQL, Prisma ORM 6 |
| **Audio Engine** | Web Audio API (Synthesized timers, completion chimes, ambient noise) |
| **Drag & Drop** | `@dnd-kit` (Sortable, Core, Modifiers) |
| **Charts** | Recharts (Responsive bar charts, streak analytics) |
| **Authentication** | Jose JWT sessions, Bcrypt password hashing |

---

## Project Structure

```text
├── app/
│   ├── api/                 # REST API endpoints (tasks, habits, filters, settings, auth)
│   ├── fonts.ts             # Typography configurations (Onest, Instrument Serif, Geist Mono)
│   ├── globals.css          # Design system tokens (--app-*) and utility typography
│   ├── layout.tsx           # Root application layout
│   └── page.tsx             # Main workspace client entry
├── components/
│   ├── auth/                # Sign-in & registration modals
│   ├── event-calendar/      # Month, week, day, and agenda calendar components
│   ├── providers/           # TanStack Query client provider
│   ├── ui/                  # Primitives (dialogs, tooltips, buttons, popovers)
│   └── workspace/           # Core product modules
│       ├── command-palette.tsx
│       ├── countdown-view.tsx
│       ├── eisenhower-matrix-view.tsx
│       ├── filter-panel.tsx
│       ├── habit-view.tsx
│       ├── module-rail.tsx
│       ├── pomodoro-view.tsx
│       ├── quick-add-modal.tsx
│       ├── settings-view.tsx
│       ├── sidebar.tsx
│       ├── statistics-view.tsx
│       ├── task-calendar-view.tsx
│       ├── task-input-bar.tsx
│       ├── task-inspector.tsx
│       ├── task-kanban-view.tsx
│       ├── task-list-view.tsx
│       ├── theme-picker.tsx
│       ├── timeline-view.tsx
│       └── workspace-app.tsx
├── context/
│   └── workspace-context.tsx# Global workspace state and mutation context
├── hooks/
│   └── use-workspace.ts     # TanStack Query hooks, caches, and optimistic mutations
├── lib/
│   ├── auth.ts              # JWT signing and session management
│   ├── filters.ts           # Saved filter query compilation
│   ├── nlp.ts               # Natural language task parser
│   ├── recurrence.ts        # Recurring task advance & schedule calculation
│   ├── seed-user.ts         # Initial workspace starter data seeder
│   ├── sound-utils.ts       # Web Audio API chimes and white-noise soundscapes
│   └── themes.ts            # 40+ workspace themes & CSS custom property engine
└── prisma/
    └── schema.prisma        # Database schema definitions
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` or higher
- **PostgreSQL**: Running instance or connection URI

### 2. Environment Setup
Copy the example environment file and set your database connection:

```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pulseflow?schema=public"
JWT_SECRET="your-secure-random-secret"
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Database Migration & Client Generation
```bash
pnpm exec prisma db push
pnpm exec prisma generate
```

### 5. Run the Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

A pre-populated demo account is available out of the box with sample tasks, habits, and schedules:
- **Email**: `demo@pulseflow.app`
- **Password**: `password123`

---

## Build & Production

To verify types and generate an optimized production build:

```bash
# Type check
pnpm exec tsc --noEmit

# Production build
pnpm build

# Start production server
pnpm start
```
