# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a single individual — the owner of the deployment — using PulseTick as their
own daily planner. They sit down with it in a desktop browser to capture incoming tasks in
natural language, see what today and this week actually require, keep habits on track with
streaks, and run focused work sessions. They are the only real user in the primary scenario;
sharing a list with a teammate is an occasional side activity, not the reason the product
exists.

Secondary audience, if any: the developer who owns the repository, who reads the code and the
README to understand how the feature set was derived. The README's evidence trail is written
for them.

## Product Purpose

PulseTick is a personal productivity workspace that keeps a single person's tasks, schedule,
habits, and focus time in one place, and lets them see how it is going.

It exists because the daily workflow spans several kinds of work that other tools fragment:
a thought that needs capturing *and* a date, a block of time that has to be placed on a
timeline, a daily practice that has to be checked off consistently, and a retrospective that
has to be read from real recorded data rather than memory.

Success for the owner means: capturing an item takes seconds, the day is legible at a glance,
habit streaks survive a week, and the statistics module tells the truth about what was
actually completed.

## Positioning

PulseTick is a self-hosted, single-tenant personal planner in which the entire loop —
capture, schedule, track, review — lives in one keyboard-driven desktop workspace backed by
the owner's own PostgreSQL database.

What makes it PulseTick rather than a generic to-do list: one workspace carries the capture
layer (natural-language parsing that sets date, time, recurrence, priority, tags and duration
in one line), the scheduling layer (a drag-and-resize timeline that shares tasks with the
calendar), the practice layer (habits with real streaks), the focus layer (pomodoro sessions
linked to tasks) and the review layer (statistics computed from completed records), with ICS
calendar subscriptions imported as scheduled tasks so external commitments land in the same
place as internal ones. It runs against the owner's own PostgreSQL database, so the owner's
data stays the owner's data.

Note on lineage: this feature set was derived from TickTick's public marketing pages and
shipped web bundle. PulseTick is a reimplementation of that capability set, not an official
TickTick product, and future work must not imply affiliation.

## Operating Context

- **Environment.** Desktop browser at `http://localhost:3000`, served by a local Next.js
  dev server. The owner is the sole authenticated user; there is no public sign-up funnel,
  no onboarding marketing, and no support surface.
- **Session.** HTTP-only cookie session (jose + bcryptjs). Sign-in and account creation
  happen in a modal over the app; the app shell is visible behind it.
- **Data.** PostgreSQL via Prisma 6. Registering an account seeds a realistic starting
  workspace: lists (Work, Personal, Learning), tags, tasks, habits, reminders, saved filters,
  countdowns, a collaboration member, and scheduled timeline blocks.
- **Daily rhythm.** The module rail is the spine of the app: Tasks, Calendar, Timeline,
  Habits, Eisenhower Matrix, Pomodoro Focus, Countdowns, Statistics. The owner moves between
  these throughout the day rather than living in one.
- **Capture surfaces.** A task input bar at the top of the Tasks module, and a floating
  quick-add button (bottom-right, every module) that opens a modal. Both accept natural
  language and both show a live "Understood" preview of what was parsed. ⌘K / Ctrl+K opens
  the command palette for module and view jumps.
- **Fidelity to the reference product.** The feature set was derived from the live TickTick
  marketing site and its shipped web bundle via REA reverse-engineering tooling; the README
  carries the observation trail.

## Capabilities and Constraints

Confirmed capability, all shipped and wired to the database:

- **Tasks** — title, description, subtasks, due date and time, start/end, duration, priority
  (0–3), pinning, trash, tags, list membership, bulk actions, list / Kanban layouts, an
  inspector pane, and sorting and grouping.
- **Natural-language capture** — `lib/nlp.ts` parses `tomorrow`, `next monday`, `in 3 days`,
  `every friday`, `every 2 weeks`, `every weekday`, `on the 1st`, `5pm`, `at 9am`, `tonight`,
  `eod`, `end of week`, `for 90m`, `#tag`, `!1`/`!2`/`!3`, and priority words into date, time,
  repeat rule, priority, tags and duration. Voice dictation via the Web Speech API.
- **Reminders** — several per task, independently toggled; `CONSTANT` type; repeat rules with
  interval, weekday selection and end date. A recurring task advances to its next occurrence
  on completion instead of duplicating (`lib/recurrence.ts`).
- **Calendar** — Month, Week, Agenda and Year views, multi-day and multi-week navigation,
  sidebar mini calendar.
- **Timeline** — Gantt-style schedule with drag-to-move, drag-to-resize, duration editing,
  today marker and an unscheduled tray.
- **Smart filters** — saved filter model with a criteria builder (priority, tags, lists, due
  range, status, description/subtask presence, pinned, keyword), server-side translation to a
  Prisma query (`lib/filters.ts`), sidebar entries.
- **Habits** — daily and weekly habits, per-day check-in, streaks, completion rates.
- **Pomodoro** — focus / short break / long break, circular countdown, task linking, today's
  focus minutes and session count, audible feedback through the Web Audio API
  (`lib/sound-utils.ts` also carries task-complete, click and ambient rain / white-noise /
  clock sounds).
- **Eisenhower matrix** — four quadrants with inline quick-add that sets priority and due date.
- **Countdowns** — live day/hour/minute/second ticks, yearly recurrence, progress, emoji and
  colour.
- **Collaboration** — share a list by email, member roles (owner / editor / viewer), task
  assignment, invitation state.
- **Integrations** — subscribe to any public ICS calendar and import its events as scheduled
  tasks (RFC 5545 parser, `lib/ics.ts`); user time zone drives planning and reminders.
- **Statistics** — created/completed over time, completion rate, priority mix, focus time,
  per-list breakdown, habit streaks, busiest days, across week / month / quarter / year.
- **Themes** — 57 workspace themes published as CSS custom properties (`lib/themes.ts`) plus 20
  per-list backgrounds.

Constraints and known gaps, confirmed by the code and the README:

- **Web only.** No native app. Native-only TickTick capabilities — lock-screen reminders,
  location geofencing, system widgets, desktop global shortcut, mobile voice capture — are
  not shipped at all. The reminder kinds in the model are in-app only (`AT_TIME`, `5_MIN`,
  `15_MIN`, `30_MIN`, `1_HOUR`, `1_DAY`, `CONSTANT`); there is no email or location
  notification kind in the schema, contrary to the README's summary of the reference product.
- **Out of scope** — offline sync, multi-device conflict resolution, paid plan tiers.
- **Data model is server-bound.** PostgreSQL is required (`prisma db push`, `prisma generate`).
  Supabase's pooler needs `sslmode=require&pgbouncer=true` and a low `connection_limit`.
- **Email/password only.** No OAuth provider sign-in, no password reset flow, no email
  verification. The reference product advertises Google, Apple and forgot-password; PulseTick
  has none of them.
- **The demo button is self-provisioning.** The auth modal's "Open demo" action signs in as
  `demo@pulsetick.app` and creates that account (with the full seed data) on first use, so it
  never points at an account that does not exist.
- **Single tenant.** One user per deployment in practice; `ListMember` supports sharing but
  there is no invitation-delivery channel — members are recorded by email only.
- **Settings is reachable.** A Settings module (theme id, user time zone, ICS subscriptions,
  per-list backgrounds) is reachable from the module rail.
- **The shell is theme-driven.** The 57 palettes publish CSS custom properties
  (`--tt-accent`, `--tt-panel`, …) and the whole product surface — app background, module rail,
  sidebar, workspace chrome, panels, borders, text and accents — reads them. `:root` ships the
  Midnight palette so the first paint matches the persisted theme; `applyTheme()` publishes the
  selected palette and toggles the `dark` class.
- **Accent has three tones.** Each palette derives `accentText` (accent-coloured *text*,
  darkened on light surfaces and lightened on dark ones) and `accentStrong` (filled controls
  that carry white text) from its base accent. The base accent stays the brand colour for
  fills, rings and borders.
- **Undecided** — deployment target and hosting are not settled; the app is currently run
  locally.

## Brand Commitments

- **Name: PulseTick.** The product is PulseTick, and visible product copy does not use the
  TickTick name or logo. TickTick is a third-party trademark; the README references it as the
  reference product whose capability set is being reimplemented, but the app itself is not a
  TickTick-branded surface.
- **Resolved — the second name.** "PulseHabit" is gone from the product surface: the document
  title, the auth modal headings and the demo account are all PulseTick. The README is titled
  PulseTick and keeps the reference-product framing in its evidence trail.
- **Logo mark.** A rounded-square badge with a teal-to-indigo gradient carrying a white check
  glyph, used identically in the module rail and the auth modal.
- **Voice.** Direct, second person, benefit-led and terse. The account-creation copy — "Create
  an account to track daily goals, build streaks, and inspect weekly metrics." — is the
  register to match: plain, concrete, and never enthusiastic. The app talks to an owner it
  trusts, so it states what a thing does rather than selling it.
- **Terminology** (as used in the product): task, list, inbox, tag, filter, habit, habit log,
  reminder, countdown, focus session, module, view. The module rail's eight modules and their
  names are the product's own vocabulary.

## Evidence on Hand

- `README.md` — the feature parity map and the observation trail: which pages of
  `ticktick.com` were captured, which bundle was statically analysed, and what each produced.
  The reference palette (`#4772fa`, `#191919`, `#fafafa`), font family and nav structure came
  from the live marketing site.
- `lib/themes.ts` — 57 published theme palettes and 20 list backgrounds, the incumbent
  design-token surface.
- `app/globals.css`, `components/ui/*` — an incumbent Tailwind v4 + shadcn token and component
  system.
- `components/ticktick/*` — one file per module; the running surface.
- `prisma/schema.prisma` — the full data model, including fields for capabilities that are
  modelled but not yet exposed.
- `lib/nlp.ts`, `lib/recurrence.ts`, `lib/filters.ts`, `lib/ics.ts` — the non-trivial
  engines, each documented at the top of the file with the product claim it implements.

Absences future work must not fabricate: there are no testimonials, user quotes, customer
logos, press, case studies, usage analytics, benchmark numbers, pricing or licensing claims.
No real-user research exists. The one collaboration member in the seed data is
`teammate@example.com` and is fixture data, not a customer.

## Product Principles

1. **Capture beats organisation.** The fastest path from a thought to a correctly scheduled
   task matters more than any filing system; the input bar and NLP parser are the front door.
2. **One workspace, one record of truth.** A task is the same object in the list, the calendar,
   the timeline, the matrix and the statistics; no module may hold a private copy of state.
3. **Show the day, not the data.** Each module opens on the view that answers "what now"
   before the view that answers "show me everything".
4. **Practice needs visible continuity.** Habits exist to be kept; streak and completion-rate
   feedback is the reason to open that module.
5. **Honest statistics only.** Every number in Statistics traces to a completed record. Never
   estimate, interpolate or fabricate to fill a chart.

## Accessibility & Inclusion

No formal accessibility standard has been set for this product — that is an open decision,
not a gap to fill with a guess.

What is confirmed by the code: the workspace is operated by keyboard as a first-class path
(⌘K / Ctrl+K command palette, module and view shortcuts, visible focus rings), interactive
icon-only controls carry `aria-label`s, and the theme gallery ships a `high-contrast`
palette. The `High Contrast` theme is a palette, not a compliance claim.

The owner has not stated a target standard (WCAG level, assistive-technology coverage).
Future work must not assert conformance without one being set.
