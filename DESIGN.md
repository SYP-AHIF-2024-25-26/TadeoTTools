---
name: TadeoTTools
description: Open-day guide for HTL Leonding. The visitor GuideApp reads like a printed event programme on the phone, and the organizer dashboard behind it is built on DaisyUI.
colors:
  division-informatics: "#0059A7"
  division-media: "#70B4D9"
  division-electronics: "#CE1223"
  division-medtech: "#f1a102"
  division-fallback: "#80c076"
  guide-orange: "#f97316"
  guide-orange-light: "#fb923c"
  guide-orange-wash: "#fff7ed"
  guide-orange-edge: "#fdba74"
  guide-canvas: "#f9fafb"
  guide-surface: "#ffffff"
  guide-header: "#f3f4f6"
  guide-ink-strong: "#1f2937"
  guide-ink: "#374151"
  guide-ink-muted: "#4b5563"
  guide-stone: "#9ca3af"
  guide-hairline: "#e5e7eb"
  dash-primary: "#1f6fd1"
  dash-primary-deep: "#1a5bb5"
  dash-field: "#4a7aa3"
  dash-field-hover: "#3a6080"
  dash-nav: "#6aa4c9"
  dash-tint: "#cce5ff"
  dash-canvas: "#f1f1f1"
  dash-surface: "#ffffff"
  dash-ink: "#130710"
  dash-error: "#dc2626"
  dash-success: "#22c55e"
  dash-warning: "#facc15"
  dash-dark-canvas: "#0b0f19"
  dash-dark-surface: "#111827"
  dash-dark-primary: "#2563eb"
typography:
  guide-display:
    fontFamily: "Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  guide-headline:
    fontFamily: "Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.33
  guide-title:
    fontFamily: "Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.55
  guide-body:
    fontFamily: "Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  guide-label:
    fontFamily: "Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  dash-headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.33
  dash-title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  dash-body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  dash-label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  md: "6px"
  lg: "8px"
  pill: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  guide-button-primary:
    backgroundColor: "{colors.guide-orange}"
    textColor: "{colors.guide-surface}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "40px"
  guide-button-back:
    backgroundColor: "{colors.guide-stone}"
    textColor: "{colors.guide-surface}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  guide-group-card:
    backgroundColor: "{colors.guide-surface}"
    textColor: "{colors.guide-ink}"
    typography: "{typography.guide-title}"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
    height: "80px"
  guide-stop-card:
    backgroundColor: "{colors.division-fallback}"
    textColor: "{colors.guide-surface}"
    typography: "{typography.guide-label}"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
    height: "80px"
  guide-content-card:
    backgroundColor: "{colors.guide-surface}"
    textColor: "{colors.guide-ink-strong}"
    rounded: "{rounded.lg}"
    padding: "24px"
  guide-option:
    backgroundColor: "{colors.guide-surface}"
    rounded: "{rounded.lg}"
    padding: "12px"
  guide-option-selected:
    backgroundColor: "{colors.guide-orange-wash}"
  guide-bottom-nav:
    backgroundColor: "{colors.guide-surface}"
    rounded: "{rounded.lg}"
    height: "56px"
  dash-button-primary:
    backgroundColor: "{colors.dash-primary}"
    textColor: "{colors.dash-surface}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 16px"
  dash-button-primary-hover:
    backgroundColor: "{colors.dash-primary-deep}"
  dash-button-sm:
    backgroundColor: "{colors.dash-primary}"
    textColor: "{colors.dash-surface}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 12px"
  dash-field-filled:
    backgroundColor: "{colors.dash-field}"
    textColor: "{colors.dash-surface}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 16px"
  dash-field-filled-hover:
    backgroundColor: "{colors.dash-field-hover}"
  dash-nav:
    backgroundColor: "{colors.dash-nav}"
    textColor: "{colors.dash-ink}"
    padding: "16px"
  dash-modal:
    backgroundColor: "{colors.dash-canvas}"
    textColor: "{colors.dash-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
    width: "384px"
---

# Design System: TadeoTTools

## Overview

**Creative North Star: "The Open-Day Programme"**

TadeoTTools works like an open-day programme you carry on your phone. The visitor GuideApp lists the day as a sequence of stop groups and stops, each one a card to open and tick off. It is colored by the school's own divisions (Informatik blue, Medientechnik sky blue, Elektronik red, Medizintechnik amber), so a glance at a card's color tells you which part of the school you are in. One warm orange is the programme's highlighter: it marks the current tab, the main button on a screen and every tick. The welcome heading carries the whole division palette as a slow moving gradient, the one festive gesture on an otherwise quiet gray-and-white page.

The surfaces are soft, chunky and touch-first. Cards are white or division-filled and lifted on clear shadows. Buttons are rounded pills (16px corners). Rows are tall (80px) because visitors tap them while walking. Type is Roboto throughout the GuideApp, set large (18px body) for reading at arm's length in a corridor.

The organizer dashboard is the programme's back office. It uses the same rounded, lifted vocabulary at office density: DaisyUI components, 14px body text, a sky-blue palette instead of orange, and a full dark mode. Its distinctive habit is **filled blue fields**: filters and selects sit in solid steel blue (`dash-field`) with white text and placeholders rather than white inputs with outlines. The two apps are documented as separate sub-systems that share only the HTL Leonding logo and the division colors.

**Key Characteristics:**
- Division colors are the identity and the wayfinding signal; they come from the school, not from the design.
- GuideApp: one orange accent, white cards lifted on `bg-gray-50`, pill buttons, a fixed bottom tab bar.
- Dashboard: DaisyUI `light` / `darkCustom` themes, blue primary, filled blue form fields, a sticky sky-blue top nav.
- Tall touch targets and a 16px side gutter on mobile; the GuideApp is designed only for phone width.
- Copy: German with du-form in the GuideApp, English in the dashboard (today's state, not a rule).

## Colors

Two palettes share one set of school colors. The GuideApp is gray-white with an orange highlighter. The dashboard is sky blue at several depths.

### Shared: Division Colors
- **Informatik Blue** (`division-informatics`): Informatik. First stop of the welcome gradient and the division's card fill.
- **Medientechnik Sky** (`division-media`): Medientechnik card fill and countdown accent.
- **Elektronik Red** (`division-electronics`): Elektronik card fill and the middle of the welcome gradient.
- **Medizintechnik Amber** (`division-medtech`): Medizintechnik card fill and the end of the welcome gradient.
- **Neutral Meadow Green** (`division-fallback`): the stop card fill when a stop has no division.

Admins set the real division colors in the dashboard (`Division.Color`), and stop cards render that runtime value. A stop in several divisions gets a left-to-right gradient of all its colors. The Tailwind names above are the build-time copies used for the gradient heading and the countdown.

### Primary (GuideApp)
- **Programme Orange** (`guide-orange`): active bottom-nav icon, primary buttons ("Auf der Karte", "Weiter"), the checkmark in ticked cards, selected radio dots. **Light Orange** (`guide-orange-light`) is the start of the feedback progress gradient. **Orange Wash** (`guide-orange-wash`) and **Orange Edge** (`guide-orange-edge`) fill and outline the selected answer option.

### Primary (Dashboard)
- **Dashboard Blue** (`dash-primary`): DaisyUI `btn-primary` and the active nav link. **Deep Dashboard Blue** (`dash-primary-deep`) is its hover/focus state.
- **Filled Field Blue** (`dash-field`, hover `dash-field-hover`): the background of filter inputs and selects, with white text and placeholders. In dark mode the fields keep the dark `primary-300` fill.
- **Sky Nav** (`dash-nav`): the sticky top bar.
- **Pale Blue Tint** (`dash-tint`): hover backgrounds on list rows and secondary actions.

### Neutral
- **Programme Paper** (`guide-canvas`): GuideApp page background.
- **Card White** (`guide-surface`): cards, bottom nav, button text.
- **Header Gray** (`guide-header`): the logo header block.
- **Ink** (`guide-ink-strong` for titles, `guide-ink` for card labels, `guide-ink-muted` for body text): the gray-800/700/600 steps.
- **Stone** (`guide-stone`): the neutral "Zurück" button. **Hairline** (`guide-hairline`): borders on inputs and unselected options.
- **Office Gray** (`dash-canvas`): dashboard page background (also used for modals and cards, which are then separated only by shadow). **Dashboard Ink** (`dash-ink`): near-black with a slight plum tint, used for all dashboard text.
- **Dark mode:** `dash-dark-canvas` / `dash-dark-surface` with `dash-dark-primary`. The dark theme collapses primary, secondary and accent to the same blue range and uses white text.

### Status (Dashboard)
- `dash-error` for destructive buttons and error alerts, `dash-success`, `dash-warning`.
- **Assignment states** (`shared/utils/assignment-status.ts`): Approved green, **Pending teal**, Conflict orange, Rejected red, Unassigned gray. Text uses the 700 shade in light mode and the 400 shade in dark mode; badges use the 800 shade on the 100 tint.

### Named Rules
**The Division Owns Its Color Rule.** Division colors come from the school and the dashboard data. Never re-tint them, and never reuse a division hue for UI states like errors or links.

**The One Highlighter Rule.** In the GuideApp, orange is the only accent: active tab, primary action, ticks, selections. A second accent color competes with the division colors.

**The White Text Needs 4.5 Rule.** Any fill that carries white text in the dashboard (primary buttons, filled fields, toasts) must reach 4.5:1. That is why the primary is `#1f6fd1`, not the lighter `#4590e6`, and why status text uses the 700 shades in light mode and the 400 shades in dark mode.

**The Pending Is Not A Warning Rule.** Pending is teal, near Approved green: it means "on track, waiting for a decision". Orange is reserved for Conflict, the one state that needs the admin's attention.

## Typography

**GuideApp font:** Roboto (300/400/500/700, Google Fonts), fallback `sans-serif`.
**Dashboard font:** the Tailwind default system stack (`ui-sans-serif, system-ui, sans-serif`). The dashboard does not load a webfont.

**Character:** Roboto at generous sizes gives the GuideApp a plain, friendly voice that stays legible on small screens. The dashboard's system font keeps it native and dense.

### Hierarchy (GuideApp)
- **Display** (bold, 30px): the "Willkommen am Tag der offenen Tür!" heading, centered and filled with the animated division gradient. Used once, on the start page. The countdown page scales up to 72px on large screens.
- **Headline** (medium, 24px): stop titles and About section headings.
- **Title** (medium, 18–20px): stop group names on cards, "Raum: …", breadcrumb.
- **Body** (regular, 18px, gray-600): stop descriptions and About text. Body text in the GuideApp is never smaller than 16px.
- **Label** (bold, 16px, white): stop names on division-colored cards, clamped to two lines.

### Hierarchy (Dashboard)
- **Headline** (bold, 24px): page titles such as "Stops" or "Students", centered above the page actions.
- **Title** (semibold, 18px): section and modal headings.
- **Body** (regular, 14px): tables, forms, lists, the default for almost all dashboard text.
- **Label** (medium, 12px): field labels, chips, table meta.

### Named Rules
**The Arm's-Length Rule.** GuideApp text is read while walking: body 18px, card labels at least 16px. The only 12px text today is the caption under the feedback rating scale.

## Layout

**GuideApp:** a single column at phone width. Content sits in a 16px side gutter (`mx-4`), and cards stack with 24px between them (`mt-6`). The header (logo plus optional welcome) is a gray block at the top. A white tab bar with four icon buttons (Leitfaden, Karte, Feedback, Über uns) is fixed to the bottom with an 8px inset, and pages reserve 112–128px of bottom padding so the last card clears it. Detail pages add a breadcrumb and a back pill above one large content card. Pages scroll vertically only (`touch-pan-y`) and allow swipe gestures. There is no desktop layout; the feedback form caps at `max-w-md` (448px).

**Dashboard:** content is centered with a `max-w-screen-xl` (1280px) top nav and `max-w-6xl`/`max-w-7xl` content areas. Pages follow one pattern: centered bold title, a row of outline/primary buttons, a collapsible filter row of filled blue fields (full width on mobile, `max-w-xs` from `sm`), then a table or card list. The spacing rhythm is 8px / 16px / 24px (`gap-2`, `gap-4`, `p-6`). Below `md`, nav links move into a hamburger dropdown.

## Elevation & Depth

Both apps are lifted rather than flat: depth comes from Tailwind shadows on white or tinted surfaces, not from borders or tonal layers.

### Shadow Vocabulary
- **Card lift** (`shadow-lg`): GuideApp group and stop cards, dashboard cards and modals. The default resting elevation.
- **Content lift** (`shadow-md`): GuideApp stop detail card and pill buttons.
- **Tab bar float** (`shadow-2xl`): the GuideApp bottom navigation, the strongest shadow, so the bar visibly floats above the scrolling list.
- **Drag preview** (`0 5px 15px rgba(0,0,0,0.1)`): dashboard drag-and-drop of stops and groups (CDK), at 80% opacity.

### Named Rules
**The Lifted Card Rule.** Anything tappable in the GuideApp is a card on a shadow. Ticked cards do not lose their shadow; they shrink (80px → 48px) and fade to 50% opacity.

## Shapes

Gently rounded throughout. Cards and containers use 8px corners (`rounded-lg`). GuideApp buttons are fat pills with 16px corners (`rounded-2xl`) at 40px height. Checkboxes use 6px corners and a 2px gray border. Dots, toggles and avatars are fully round. The GuideApp tab bar is rounded only on top (`rounded-t-lg`). The dashboard inherits DaisyUI v4 defaults (8px buttons and inputs, 16px cards). Division images in stop detail are square, 48px thumbnails with no rounding.

## Components

### Buttons
- **GuideApp primary:** orange pill (16px corners, 40px tall, 8px × 16px padding), white medium text, `shadow-md`, with an optional leading 20px stroke icon. Disabled state is 50% opacity.
- **GuideApp back ("Zurück"):** the same pill in stone gray, darkening to gray-500 on hover, with a left-arrow icon.
- **Dashboard primary:** DaisyUI `btn btn-primary` in Dashboard Blue. Most actions use `btn-sm` (32px). Secondary actions are `btn-outline` and turn primary on hover. Destructive actions use `btn-error`. Icon-only actions use `btn-ghost` / `btn-circle`.

### Cards / Containers
- **Stop group card (GuideApp):** white, 8px corners, `shadow-lg`, 80px tall. Group name in 18px medium gray-700, an optional "3 / 7" progress count, and a checkbox on the right. Tapping the card opens the group; tapping the checkbox ticks the whole group.
- **Stop card (GuideApp, signature):** the same shape, filled with the stop's division color (or a gradient across several divisions), with the stop name in bold white. When ticked it collapses to 48px and 50% opacity, so finished stops visibly step back in the list.
- **Content card (GuideApp):** white, 24px padding, `shadow-md`. Holds the stop title, "Raum: …", the description (HTML from the admin), an "Auf der Karte" pill, and a column of division thumbnails on the right.
- **Dashboard modal:** a black/50 scrim, a 384px panel in `dash-canvas` with 8px corners and 24px padding, a title over a hairline rule, and right-aligned actions.

### Inputs / Fields
- **GuideApp text field:** white, gray-200 border, 8px corners, 12px × 16px padding. On focus the border disappears and a 2px orange ring appears.
- **GuideApp choice option:** a full-width bordered row (12px padding) with a round radio or square check. When selected, the row turns Orange Wash with an Orange Edge border and an orange dot or fill.
- **GuideApp checkbox (signature):** a 24px rounded square with a 2px gray-500 border. Ticking it pops in a thick orange checkmark (`animate-jump-in`, 600ms).
- **Dashboard filled field:** DaisyUI `input input-bordered` / `select select-bordered` filled with Filled Field Blue, white text and placeholders, darkening on hover. Plain bordered inputs on `bg-background-100` appear in detail forms. Focus uses a 2px `primary-300` ring.

### Navigation
- **GuideApp bottom tab bar:** a white 56px bar fixed to the bottom, four evenly spaced 20–24px icons, black at rest and Programme Orange when active. Icons only, no labels.
- **GuideApp breadcrumb:** Home icon › group name, 16–20px gray-700 semibold.
- **Dashboard top nav:** sticky Sky Nav bar with the HTL Leonding logo (32px tall) on the left, then text links (the active link gets a primary fill and underline), a theme toggle switch and the user menu on the right. Below `md` the links collapse into a hamburger with a dropdown.

### Progress Bar (GuideApp feedback)
An 8px rounded track in gray-100, filled with an orange-400 → orange-500 gradient that animates width over 300ms.

## Do's and Don'ts

### Do:
- **Do** fill stop cards with the stop's runtime division color and fall back to Neutral Meadow Green (`division-fallback`) only when the stop has no division.
- **Do** keep GuideApp tap targets at least 40px tall, and list cards at 80px.
- **Do** use Programme Orange for the single primary action and the active state on a GuideApp screen.
- **Do** reserve bottom padding (at least 112px) on every GuideApp page so the fixed tab bar never covers the last card.
- **Do** keep the HTL Leonding logo at the top of both apps (header block in the GuideApp, nav bar in the dashboard).
- **Do** use DaisyUI component classes (`btn`, `input`, `select`, `table`, `toggle`) in the dashboard and define new colors as theme variables, so dark mode keeps working.

### Don't:
- **Don't** re-tint, desaturate or replace division colors for aesthetic reasons; they are the school's identity.
- **Don't** introduce a second accent color in the GuideApp alongside orange.
- **Don't** use orange in the dashboard or dashboard blue in the GuideApp; each app keeps its own accent.
- **Don't** set GuideApp body text below 16px.
- **Don't** add raw hex colors in dashboard templates; extend the `--primary-*` / `--background-*` variables so both themes stay in sync.
