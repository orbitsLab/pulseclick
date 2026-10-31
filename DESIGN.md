---
name: PulseFlow (Notion Design System)
description: A clean, document-first personal productivity workspace built on Notion's Tatami design system tokens, typography, and component architecture.
colors:
  primary: "#2383e2"
  primary-foreground: "#ffffff"
  accent-strong: "#0077d4"
  neutral-bg: "#191919"
  neutral-panel: "#202020"
  neutral-panel-alt: "#262626"
  neutral-text: "#f0efed"
  neutral-muted: "#999999"
  neutral-border: "#383836"
  neutral-muted-bg: "#f9f8f7"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "1.25"
    letterSpacing: "-0.022em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif"
    fontSize: "14px"
    lineHeight: "1.5"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif"
    fontSize: "12px"
    lineHeight: "1.4"
  figure:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "28px"
    lineHeight: "1.05"
    fontVariation: "'wght' 600"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  "2xl": "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
  button-primary-active:
    backgroundColor: "{colors.accent-strong}"
---

# Design System: PulseFlow (Notion Tatami)

## Overview

**Creative North Star: "The Notion Workspace"**

PulseFlow adopts Notion's design system (**Tatami**), turning the daily planner into a distraction-free, document-grade productivity environment. Everything feels quiet, intentional, and structured like a Notion database or document: crisp 1px hairline borders, muted off-canvas sidebars, understated typography, and gentle 4px–6px corner radii.

The mood is calm, functional, and organized. Restraint outranks flash: surfaces are flat at rest, elevation is indicated by clean tonal shifts or subtle 1px border lines, and color is reserved for meaningful categorization and interactive selection.

**Key Characteristics:**
- **Typography:** Pure Notion `Inter` across all headings, titles, labels, and running text, paired with `Geist Mono` for timer digits, timestamps, and shortcut keys.
- **Surface Hierarchy:**
  - Canvas: Pure White `#ffffff` (Light) / Notion Charcoal `#191919` (Dark).
  - Navigation / Sidebar: Warm Off-White `#f9f8f7` (Light) / Elevated Charcoal `#202020` (Dark).
  - Raised Elements / Cards: `#ffffff` (Light) / `#252525` (Dark).
- **Hairline Geometry:** 1px subtle borders (`#e6e5e3` in light, `#383836` in dark). Rounded corners are restrained: 4px for buttons/inputs, 6px for rows/cards, 8px–10px for dialogs/popovers.
- **Notion 10-Color Tag Palette:** Multi-select pills, priorities, and list badges use Notion's authentic tinted background + saturated text combinations.

## Colors

### Primary Brand
- **Notion Blue** (`#2383e2`): The signature interactive accent for primary buttons, focus rings, and active selections.
- **Notion Blue Hover** (`#0077d4`): Darker interactive hover state.

### Neutral Surfaces
- **Light Theme**:
  - App Canvas (`--app-bg`): `#ffffff`
  - Sidebar & Rail (`--app-rail`, `--app-panel-alt`): `#f9f8f7`
  - Cards & Modals (`--app-panel`): `#ffffff`
  - Primary Text (`--app-text`): `#37352f` (Notion signature charcoal)
  - Secondary Text (`--app-muted`): `#787774`
  - Hairline Border (`--app-border`): `#e6e5e3`
  - Hover Surface: `rgba(55, 53, 47, 0.08)`
- **Dark Theme**:
  - App Canvas (`--app-bg`): `#191919` (Signature Notion dark background)
  - Sidebar & Rail (`--app-rail`, `--app-panel-alt`): `#202020`
  - Cards & Modals (`--app-panel`): `#252525`
  - Primary Text (`--app-text`): `#f0efed`
  - Secondary Text (`--app-muted`): `#999999`
  - Hairline Border (`--app-border`): `#383836` (or `rgba(255, 255, 255, 0.09)`)
  - Hover Surface: `rgba(255, 255, 255, 0.055)`

### Notion 10-Color Tag Palette
- **Gray**: Light `bg-[#ebeced] text-[#9b9a97]` | Dark `bg-[#2f2f2f] text-[#9b9b9b]`
- **Brown**: Light `bg-[#e9e5e3] text-[#64473a]` | Dark `bg-[#382d26] text-[#bca290]`
- **Orange**: Light `bg-[#faebdd] text-[#d9730d]` | Dark `bg-[#45362d] text-[#fbebde]`
- **Yellow**: Light `bg-[#fbf3db] text-[#dfab01]` | Dark `bg-[#392e1e] text-[#f9f3dc]`
- **Green**: Light `bg-[#ddedea] text-[#0f7b6c]` | Dark `bg-[#2a533c] text-[#e8f1ec]`
- **Blue**: Light `bg-[#ddebf1] text-[#0b6e99]` | Dark `bg-[#213041] text-[#e5f2fc]`
- **Purple**: Light `bg-[#eae4f2] text-[#6940a5]` | Dark `bg-[#352b42] text-[#f3ebf9]`
- **Pink**: Light `bg-[#f4dfeb] text-[#ad1a72]` | Dark `bg-[#3f2635] text-[#fae9f1]`
- **Red**: Light `bg-[#fbe4e4] text-[#e03e3e]` | Dark `bg-[#3e2626] text-[#fce9e7]`

## Typography

**Primary Font:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Helvetica`, `Arial`, `sans-serif`
**Data/Mono Font:** `Geist Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace`

### Hierarchy Roles
- **Display / Page Title** (`app-display`): Inter, weight 700, 24px, line-height 1.25, letter-spacing -0.022em.
- **Section Heading** (`app-title`): Inter, weight 600, 16px, line-height 1.35, letter-spacing -0.012em.
- **Item Title** (`app-heading`): Inter, weight 500/600, 14px, line-height 1.4.
- **Body Text** (`app-body`): Inter, weight 400, 14px, line-height 1.5.
- **Label / Control** (`app-label`): Inter, weight 500, 12px, line-height 1.4.
- **Meta / Badge** (`app-meta`): Inter, weight 400, 11px, line-height 1.4, letter-spacing 0.004em.
- **Figure / Numbers** (`app-figure`): Geist Mono, weight 600, 28px, line-height 1.05, tabular numbers.

## Elevation & Depth

- **Flat Canvas:** In-app surfaces have zero heavy drop shadows. Elevation is expressed by hairline borders and tonal steps.
- **Floating Menus & Popovers:** Subtle shadow: `0 4px 16px rgba(15, 15, 15, 0.1), 0 0 0 1px rgba(15, 15, 15, 0.08)` in light; `0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)` in dark.
- **Buttons:** Subtle inset stroke `inset 0 0 0 1px rgba(15, 15, 15, 0.1), 0 1px 2px rgba(15, 15, 15, 0.06)`.

## Shapes & Radius Scale

- Controls (buttons, inputs, select triggers): `4px` to `6px` (`rounded-md`).
- Table rows and list items: `4px` (`rounded-[4px]`).
- Checkboxes: `3px` (`rounded-[3px]`).
- Cards and containers: `6px` to `8px` (`rounded-lg`).
- Dialogs and Popovers: `8px` to `10px` (`rounded-xl`).
- Tags & Badges: `3px` to `4px` (`rounded-[3px]`).

## Do's and Don'ts

### Do
- **Do** use Notion's 1px hairline borders to separate layout regions cleanly.
- **Do** use subtle background hovers (`rgba(55,53,47,0.08)` light / `rgba(255,255,255,0.055)` dark).
- **Do** keep corner rounding restrained (4px–6px) rather than hyper-rounded bubbles.
- **Do** render tags with soft tinted backgrounds and matching saturated text.

### Don't
- **Don't** use thick 3px–4px side-stripes or gradient text.
- **Don't** use heavy drop shadows for in-page cards.
- **Don't** introduce disparate font families.
