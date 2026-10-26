---
name: PulseFlow
description: A quiet, flat-tonal personal planner that keeps one person's tasks, schedule, habits and focus in a single day-first workspace.
colors:
  primary: "#4772fa"
  primary-foreground: "#ffffff"
  accent-strong: "#3e64dc"
  neutral-bg: "#0f1115"
  neutral-panel: "#171a21"
  neutral-panel-alt: "#1f232c"
  neutral-text: "#eef1f6"
  neutral-muted: "#8b94a7"
  neutral-border: "#262b36"
  neutral-muted-bg: "#f7f8fa"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: "1.15"
    letterSpacing: "-0.018em"
  body:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: "1.55"
  label:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: "1.45"
  figure:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    lineHeight: "1.05"
    fontVariation: "'wght' 700"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
  button-primary-active:
    backgroundColor: "{colors.accent-strong}"
---

# Design System: PulseFlow

## Overview

**Creative North Star: "The Quiet Day"**

PulseFlow's design system is named for the day it serves. The owner of the deployment sits down with the product to capture a thought, place it on a day, keep a practice going, and read what the week actually looked like. The visual system exists to answer "what now?" quietly and precisely, without narrating the process.

The mood is calm plus precise. Calm is carried by flat-tonal surfaces, restrained type and an accent that appears only when a decision is needed. Precision is carried by exact numbers, fixed type scales and named rules that forbid improvisation. The aesthetic philosophy is day-first: each module opens on the view that answers the daily question before the views that answer everything else.

The system was extracted from the incumbent implementation (Tailwind v4 + shadcn token layer, `app/globals.css`, `lib/themes.ts`) and the three-voice type system introduced during the design-quality pass. Only confirmed visual rejections are stated here; nothing is invented about the owner.

**Key Characteristics:**

- The module title is always display type (Instrument Serif, 26px) — one per screen, no exceptions.
- Body text always routes through a named role (`app-body` 13px → `app-heading` 15px → `app-title` 17px → `app-display` 26px); ad-hoc sizes are banned.
- Depth is tonal at rest, never shadow-based for in-app surfaces.
- Priority is expressed as a flag/dot signal, never as a card-edge stripe.

## Colors

Palette character: one brand accent over a neutral slate, carried dark-first (Midnight default) with light themes via the same token layer.

### Primary

- **Calm Blue** (#4772fa): the single brand accent; reserved for primary actions and the selected state. When white text must sit on it, the filled-control variant is **Deep Calm Blue** (#3e64dc), which clears 4.5:1 — the base accent does not.
- **Deep Calm Blue** (#3e64dc): filled-control accent (white text on top); derived darker tone of Calm Blue.

### Neutral

- **Night Surface** (#0f1115): app background (Midnight theme).
- **Raised Surface** (#171a21): panels, cards, dialogs' underlying surface.
- **Lifted Surface** (#1f232c): hover states, inputs, tinted rows.
- **Daylight Text** (#eef1f6): primary text.
- **Soft Slate** (#8b94a7): secondary text / muted content.
- **Hairline Slate** (#262b36): borders and dividers.
- **Quiet Paper** (#f7f8fa): light-theme background.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest; elevation is expressed through tonal steps (Night → Raised → Lifted) rather than shadows. Shadows appear only for floating overlays, which use the shadcn popover/card tokens.

## Typography

**Display Font:** Instrument Serif (Georgia, serif)
**Body Font:** Onest (ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (ui-monospace, monospace)

**Character:** a serif display voice carrying the module's name, a humanist grotesque carrying the work, and a mono font carrying the numbers. The pairing is calm plus precise: character without noise.

### Hierarchy

- **Display** (Instrument Serif, weight 400, 26px, line-height 1.15, letter-spacing -0.018em): module title in the workspace header. One per screen; highest prominence, never decorative.
- **Heading** (Onest, weight 600, 15px, line-height 1.4, letter-spacing -0.006em): task, habit and countdown names.
- **Title** (Onest, weight 600, 17px, line-height 1.3, letter-spacing -0.012em): panel and card titles.
- **Body** (Onest, weight 400, 13px, line-height 1.55): running text, descriptions, subtitles.
- **Label** (Onest, weight 600, 12px, line-height 1.45): buttons, controls, nav rows, list rows' secondary text.
- **Meta** (Onest, weight 400, 11px, line-height 1.45, letter-spacing 0.004em): dates, counts, badges, timestamps.
- **Figure** (Onest, weight 700, 28px, line-height 1.05, letter-spacing -0.022em, tabular-nums): the single big number a surface leads with (KPIs, countdowns, focus minutes).

### Named Rules

**The Single-Source Rule.** Every product typeface and size routes through the `@utility` role set (`app-display`, `app-title`, `app-heading`, `app-body`, `app-label`, `app-meta`, `app-overline`, `app-figure`) or the shadcn primitives mapped onto those roles. Ad-hoc font-size utilities (`text-[Npx]`, `text-xs`, `text-sm`) are banned from product surfaces.

## Layout

- Module rail: 64px column (16px) full-height, tonal rail surface, icons at 20px.
- Workspace: module title in display type at the top of the content surface, followed by the module body.
- Density: compact planner rhythm — labels at 12px and meta at 11px to fit the dense daily views; the display and figure sizes bracket the scale.
- Capture surfaces: task input bar at the top of the Tasks module, floating quick-add at bottom-right of any module, ⌘K palette for module/view jumps.

## Elevation & Depth

Flat by default. In-app surfaces are flat: background, panel, panel-alt tones carry depth, not shadows. Floating overlays (dialogs, popovers) use the shadcn card/popover tokens with hairline borders.

### Shadow Vocabulary

- Overlay (dialogs, popovers, menus): shadcn card/popover tokens; hairline border, flat background, no tonal stacking shadow.

## Shapes

Radius scale (shadcn `--radius` base 10px scaled by role): sm 6px, md 8px, lg 10px, xl 14px, 2xl 18px.

- Cards: 18px (2xl).
- Panels: 14px (xl).
- Controls (buttons, inputs, chips): 8px (md/lg).
- Pills and dots: full round.

## Components

For each component, a short character line, then shape, color, states, behavior.

### Buttons

- Shape: 8px radius controls (shadcn md), primary at 10px (shadcn lg) — full values in parentheses.
- Primary: Calm Blue (#4772fa) with white text; Deep Calm Blue (#3e64dc) filled-control variant when white text is used (4.5:1+). Typography: label role (12px) semibold. Padding 12px 16px.
- Hover/Active: Deep Calm Blue.

### Chips

- Style: tinted row — Lifted Surface background, Calm Blue text at the derived accent-text tone, hairline border at ~40% accent.
- Selected: Deep Calm Blue fill, white text, hairline border Deep Calm Blue.

### Cards / Containers

- Corner style: 18px (2xl). Background: Raised Surface. Border: Hairline Slate. Internal padding from the spacing rhythm of the module.

### Inputs / Fields

- Style: Lifted Surface background, Hairline Slate border, focus ring Calm Blue.
- Focus: focus ring at the accent; error/disabled via destructive token where applicable.

### Navigation

- Module rail: 64px column, tonal rail surface, icons 20px, active module marked with accent text on accent tint; labels via Label/Meta roles.

### Task Row (signature component)

- Horizontal rhythm between checkbox, flag/dot priority signal, title, metadata.
- Priority is carried by a coloured flag icon (task row) or a small dot (kanban card) — never a card-edge stripe.

## Do's and Don'ts

### Do

- **Do** use the `app-*` role utilities (or mapped shadcn primitives) for all product typography.
- **Do** keep the module title as display type and let smaller roles carry the rest of the hierarchy.
- **Do** express priority and state through text/icon/dot signals before fill.

### Don't

- **Don't** use a side-tab (border-l-4 / stripe) on cards or task rows.
- **Don't** mix type voices within one element.
- **Don't** introduce ad-hoc font sizes into product surfaces.
- **Don't** use shadow for in-app depth; stay tonal.
