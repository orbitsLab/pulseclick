# Product Specification: PulseFlow

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: an independent professional, engineer, creator, or student using PulseFlow as their personal daily planner and focus environment. They use PulseFlow in a desktop or laptop browser to quickly capture incoming tasks in natural language, schedule their day on a visual timeline or calendar, build consistent daily habits through streaks, and execute deep work sessions with the built-in Pomodoro timer.

## Product Purpose

PulseFlow is a personal productivity workspace that unifies task capture, scheduling, habit tracking, and focused execution into a single, cohesive day-first workspace.

Traditional workflows fragment across multiple single-purpose apps: a to-do list for capturing items, a calendar for blocking time, a habit tracker for daily routines, and a timer for deep work sessions. PulseFlow integrates all four pillars into a single keyboard-driven environment where actions flow seamlessly into one another.

### Core Measures of Success
- **Capture Velocity**: Capturing an item and assigning date, time, priority, and tags takes seconds through natural language.
- **Immediate Daily Clarity**: Opening the app instantly answers "what now?" without cognitive overload.
- **Habit Continuity**: Visible streaks, monthly completion heatmaps, and section routines keep habits active and resilient.
- **Truthful Analytics**: Review statistics reflect actual completed tasks and recorded focus minutes.

## Positioning

PulseFlow is a privacy-first, single-tenant personal planner in which the entire productivity loop—capture, schedule, track, execute, and review—lives in one responsive workspace backed by PostgreSQL.

What distinguishes PulseFlow:
1. **Unified State**: A task is the same database record whether viewed in the List, Kanban board, Eisenhower Matrix, Timeline, or Calendar.
2. **Natural Language Parser**: A local date/time/recurrence/priority/tag engine (`lib/nlp.ts`) transforms shorthand typing into structured metadata with real-time visual feedback.
3. **Integrated Audio Synthesis**: Web Audio API generates pleasant ascending completion chimes and customizable ambient noise soundscapes (white noise, rain, cafe, ocean) with zero external media assets.
4. **Theme Flexibility**: 40+ curated light, dark, and OLED midnight themes driven by standard CSS custom properties (`--app-*`).

## Operating Context

- **Environment**: Next.js 16 App Router served locally or self-hosted in a private container.
- **Session**: HTTP-only cookie authentication powered by `jose` JWTs and `bcryptjs`.
- **Database**: PostgreSQL with Prisma ORM 6 schemas.
- **Workspace Navigation**: Persistent leftmost module rail providing instant 1-click or shortcut navigation across 8 core modules: Tasks, Calendar, Timeline, Habits, Eisenhower Matrix, Pomodoro Focus, Countdowns, and Statistics.
- **Global Command Palette**: `⌘K` / `Ctrl+K` for instant module jumps, search, and action dispatching.

## Capabilities

All capabilities are implemented and connected to database models:

- **Tasks & Lists**: Unlimited colored lists, tag management, subtask checklists, due date/time ranges, recurring rules, attachments, and priorities (None, Low, Medium, High).
- **Multiple Task Views**:
  - Unified List View with grouping, sorting, and floating bulk action bar.
  - Kanban Board with status and priority lanes.
  - Eisenhower Matrix with 4-quadrant drag-and-drop reprioritization.
  - Timeline View with Gantt-style time blocking and duration drag-to-resize.
  - Interactive Calendar with Month, Week, Day, and Agenda navigation.
- **Habit Tracker**: Routine sections (Morning, Afternoon, Evening), frequency goals, streaks, check-in histories, and GitHub-style year heatmaps.
- **Pomodoro Timer**: Work and break intervals, ambient soundscapes synthesized via Web Audio API, and task association.
- **Countdowns**: Upcoming milestones, target dates, and live visual countdown timers.
- **Smart Filters**: Dynamic saved filter query builder evaluating priorities, tags, date windows, completion states, and keywords.
- **Collaboration**: List sharing with invite links and assigned member roles (Owner, Editor, Viewer).
- **Calendar Subscriptions**: Import external `.ics` feeds into the scheduled timeline.

## Brand Commitments

- **Name**: **PulseFlow**.
- **Visual Identity**: Modern, minimal, flat-tonal surfaces with subtle hairline borders, clear typography, and a brand accent that highlights decisions.
- **Design Tokens**: Standardized `--app-*` custom properties for surface tones, accents, text, and borders.
- **Tone & Voice**: Direct, calm, and utility-focused. Copy states clearly what an action does without marketing clutter.
- **Demo Workspace**: Pre-seeded with a complete set of sample tasks, habits, and schedules under `demo@pulseflow.app`.

## Architecture & Codebase Layout

- `app/` — App Router endpoints, fonts, metadata, and styling.
- `components/workspace/` — Feature modules, view containers, command palette, and workspace shell.
- `hooks/use-workspace.ts` — TanStack React Query data layer, cache invalidation, and optimistic mutations.
- `context/workspace-context.tsx` — Workspace context and shared state management.
- `lib/` — Independent engines for NLP parsing (`nlp.ts`), recurrence computation (`recurrence.ts`), filter compilation (`filters.ts`), themes (`themes.ts`), and sound generation (`sound-utils.ts`).
- `prisma/schema.prisma` — PostgreSQL schema definitions.
