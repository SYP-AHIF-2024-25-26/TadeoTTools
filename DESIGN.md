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
  dash-ink-strong: "#130710"
  dash-ink: "#2a2430"
  dash-ink-muted: "#57525c"
  dash-focus: "#1f6fd1"
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
    width: "448px"
---

# Design System: TadeoTTools

## Overview

**Creative North Star: "The Open-Day Programme"**

TadeoTTools works like an open-day programme you carry on your phone. The visitor GuideApp lists the day as a sequence of stop groups and stops, each one a card to open and tick off. It is colored by the school's own divisions (Informatik blue, Medientechnik sky blue, Elektronik red, Medizintechnik amber), so a glance at a card's color tells you which part of the school you are in. One warm orange is the programme's highlighter: it marks the current tab, the main button on a screen and every tick. The welcome heading carries the whole division palette as a slow moving gradient, the one festive gesture on an otherwise quiet gray-and-white page.

The surfaces are soft, chunky and touch-first. Cards are white or division-filled and lifted on clear shadows. Buttons are rounded pills (16px corners). Rows are tall (80px) because visitors tap them while walking. Type is Roboto throughout the GuideApp, set large (18px body) for reading at arm's length in a corridor.

The organizer dashboard is the programme's back office. It uses the same rounded, lifted vocabulary at office density: DaisyUI components, 14px body text, a sky-blue palette instead of orange, and a full dark mode. Its distinctive habit is **filled blue filter fields**: the search and filter fields above a list sit in solid steel blue (`dash-field`) with white text and placeholders, while form inputs are plain bordered fields. The two apps are documented as separate sub-systems that share only the HTL Leonding logo and the division colors.

**Key Characteristics:**
- Division colors are the identity and the wayfinding signal; they come from the school, not from the design.
- GuideApp: one orange accent, white cards lifted on `bg-gray-50`, pill buttons, a fixed bottom tab bar.
- Dashboard: DaisyUI `light` / `darkCustom` themes, blue primary, filled blue filter fields, a sticky sky-blue top nav, one left-aligned page header on every page.
- Tall touch targets and a 16px side gutter on mobile; the GuideApp is designed only for phone width.
- Copy: German with du-form in the GuideApp, English in the dashboard (today's state, not a rule).
- Feedback kiosk (`kiosk/feedback/`): the GuideApp's visual language at tablet size, for the exit tablets; see the Feedback Kiosk section.

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
- **Office Gray** (`dash-canvas`): dashboard page background (also used for modals and cards, which are then separated only by shadow). **Dashboard text** has three roles, as CSS variables and Tailwind colours: **Ink Strong** (`--ink-strong`, `text-ink-strong`, near-black with a slight plum tint) for headings, which get it from the base layer; **Ink** (`--ink`, `text-ink`) for body text, table cells and labels, also the `body` colour; **Ink Muted** (`--ink-muted`, `text-ink-muted`) for hints, metadata, empty states and table headers. Muted passes 4.5:1 on every surface it sits on. There are no other text greys: no `text-gray-*`, no `text-secondary-content`, no numbered `text-text-*` steps.
- **Dark mode:** `dash-dark-canvas` / `dash-dark-surface` with `dash-dark-primary`. The dark theme collapses primary, secondary and accent to the same blue range. Text is white (strong), `#f3f4f6` (ink) and `#d8dee6` (muted, still 4.5:1 on the lighter `background-800/900` surfaces).

### Status (Dashboard)
- `dash-error` for destructive buttons and error alerts, `dash-success`, `dash-warning`.
- **Assignment states** (`shared/utils/assignment-status.ts`): Approved green, **Pending teal**, Conflict orange, Unassigned gray. The dashboard doesn't reject requests; duplicates are deleted (with Undo). Red "Rejected" only labels requests stored before that change. Text uses the 700 shade in light mode and the 400 shade in dark mode; badges use the 800 shade on the 100 tint.

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
- **Headline** (bold, 24px, `h1`): the page title such as "Stops" or "Students", left-aligned in the page header. Exactly one per routed page; tabs inside a page do not get their own `h1`.
- **Title** (bold, 18px, `h2`): section, card and dialog headings.
- **Item** (semibold, 16px, `h3`): headings inside a section, such as one question or one stop card.
- **Body** (regular, 14px): tables, forms, lists, the default for almost all dashboard text.
- **Label** (medium, 12px): field labels, chips, table meta.

### Named Rules
**The Arm's-Length Rule.** GuideApp text is read while walking: body 18px, card labels at least 16px. The only 12px text today is the caption under the feedback rating scale.

## Layout

**GuideApp:** a single column at phone width. Content sits in a 16px side gutter (`mx-4`), and cards stack with 24px between them (`mt-6`). The header (logo plus optional welcome) is a gray block at the top. A white tab bar with four icon buttons (Leitfaden, Karte, Feedback, Über uns) is fixed to the bottom with an 8px inset, and pages reserve 112–128px of bottom padding so the last card clears it. Detail pages add a breadcrumb and a back pill above one large content card. Pages scroll vertically only (`touch-pan-y`) and allow swipe gestures. There is no desktop layout; the feedback form caps at `max-w-md` (448px).

**Dashboard:** the top nav is `max-w-screen-xl` (1280px). Every page, list or detail, uses one content shell: the `.page-shell` class in `styles.css` (`mx-auto w-11/12 max-w-6xl pb-10`, 1152px). Pages follow one pattern:

1. **Page header** (`app-page-header`, `title` and optional `subtitle` inputs, actions projected): the `h1` on the left, an optional one-line subtitle under it, and the page's actions on the right. Below `sm` the actions wrap under the title.
2. **Tabs**, if the page has several views (see Tabs).
3. **Filter bar** of filled blue fields (full width on mobile, `max-w-xs` from `sm`), with Clear Filters shown only while a filter is set.
4. The table, card list or form.

Detail editors (stop, stop group) sit in a card inside the same shell, not in a narrower one. The spacing rhythm is 8px / 16px / 24px (`gap-2`, `gap-4`, `p-6`). Below `md`, nav links move into a hamburger dropdown.

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
- **Dashboard primary:** DaisyUI `btn btn-primary` in Dashboard Blue, **one per toolbar, form or dialog**: the action the page exists for (Add Stop, Save Changes, Create Group). Every dashboard button is `btn-sm` (32px); the larger default size is not used.
- **Dashboard secondary:** `btn-outline` for further actions in the same toolbar (Import/Export, Approve N pending next to Add Student). Low-weight actions such as Clear Filters, Cancel and Back are `btn-ghost`.
- **Dashboard Delete / Remove:** Delete (destroys data) is `btn-outline btn-error` and opens a confirmation, whose confirm button is the only solid `btn-error`. Remove (unlinks, data stays) is `btn-ghost`. Conflict actions use `.btn-conflict` (Conflict orange `orange-700`, white text) from `styles.css`, not DaisyUI `btn-warning` yellow; Approve actions use `.btn-approve` (Approved green `green-700`, white text). Both keep the 700 shade in dark mode so white text stays at 4.5:1 or more.
- **Dashboard row actions:** icon buttons at the end of a table row or card: `btn btn-ghost btn-sm` with the shared `app-action-icon` (`edit`, `view`, `delete`; 16px stroke icon), a `title` and an `aria-label` that names the record ("Edit Robotics Lab"). Pencil = edit, eye = view only (read-only pages), trash = delete (in `text-error`). No gear icons and no text "Edit" buttons on cards. Exception, decided 2026-10-09: the Students page keeps its own button weights. The header toolbar is default size with Approve N pending in `.btn-approve`, Add Student `btn-primary` and Import/Export `btn-outline`; the row buttons are Assign Stop `btn-primary btn-sm`, Approve `.btn-approve btn-sm`, Back to Pending is `btn-outline btn-sm`, Remove is `btn-outline btn-error btn-sm`, and Manage Conflict is `.btn-conflict`.

### Cards / Containers
- **Stop group card (GuideApp):** white, 8px corners, `shadow-lg`, 80px tall. Group name in 18px medium gray-700, an optional "3 / 7" progress count, and a checkbox on the right. Tapping the card opens the group; tapping the checkbox ticks the whole group.
- **Stop card (GuideApp, signature):** the same shape, filled with the stop's division color (or a gradient across several divisions), with the stop name in bold white. When ticked it collapses to 48px and 50% opacity, so finished stops visibly step back in the list.
- **Content card (GuideApp):** white, 24px padding, `shadow-md`. Holds the stop title, "Raum: …", the description (HTML from the admin), an "Auf der Karte" pill, and a column of division thumbnails on the right.

### Inputs / Fields
- **GuideApp text field:** white, gray-200 border, 8px corners, 12px × 16px padding. On focus the border disappears and a 2px orange ring appears.
- **GuideApp choice option:** a full-width bordered row (12px padding) with a round radio or square check. When selected, the row turns Orange Wash with an Orange Edge border and an orange dot or fill.
- **GuideApp checkbox (signature):** a 24px rounded square with a 2px gray-500 border. Ticking it pops in a thick orange checkmark (`animate-jump-in`, 600ms).
- **Dashboard filter field:** DaisyUI `input input-bordered` / `select select-bordered` plus the `.field-filter` class from `styles.css`: filled with Filled Field Blue, white text and placeholders (placeholders at 4.5:1 too), darkening on hover. Used only in filter bars above lists.
- **Dashboard form field:** DaisyUI `input` / `select` / `textarea` / `file-input` with `-bordered` on the surface color, `w-full`, never hand-written border classes. Inside dense sub-forms (stop students, stop managers, question conditions) the `-sm` sizes are used. Every field has a visible label above it (`label for` matching the field `id`); a field inside a table row or a list gets an `aria-label` instead. Placeholders only show an example. Required fields get `<span aria-hidden="true">*</span>` after the label and `required` on the field, nothing else.
- **Focus (all controls):** one 2px outline in `--focus-ring` with a 2px offset on every field, button, tab and link (Dashboard Blue `dash-focus` in light mode, `#60a5fa` in dark mode, Ink Strong on the sky-blue nav bar). It is set globally in `styles.css`; templates don't add `focus:ring-*` or `focus:outline-none`.

### Navigation
- **GuideApp bottom tab bar:** a white 56px bar fixed to the bottom, four evenly spaced 20–24px icons, black at rest and Programme Orange when active. Icons only, no labels.
- **GuideApp breadcrumb:** Home icon › group name, 16–20px gray-700 semibold.
- **Dashboard top nav:** sticky Sky Nav bar with the HTL Leonding logo (32px tall) on the left, then text links (the active link gets a primary fill and underline), a theme toggle switch and the user menu on the right. Below `md` the links collapse into a hamburger with a dropdown.
- **Users & Data:** the admin's home for people, master data and visitor-app settings, as tabs: Stop Managers (list, add, CSV import), Admins, Students (student and assignment CSV imports, students export, delete all students), Divisions (cards, Add Division, CSV export) and Visitor App (countdown on/off and date). File actions sit with their data: there is no separate Import & Export tab, the Stops export is in the Stops page header, the feedback answers export is on Feedback > Responses. `/divisions` redirects to `?tab=divisions`; the Students page and the Overview link into the Students and Visitor App tabs. CSV imports use the shared `app-csv-import` (label, expected columns, result).

- **Dashboard tabs:** `.page-tabs` / `.page-tab` from `styles.css` under the page header: a full-width 2px line, tabs in 16px semibold muted text with 20px side padding, and the active tab in strong text on a Pale Blue Tint (`primary-100`) fill with rounded top corners and a 3px Dashboard Blue underline sitting on the line. `role="tablist"` with `role="tab"` and `aria-selected` on each tab (the style keys off `aria-selected`), and the active tab in the URL (`?tab=…`) so other pages can link to it. Used on Feedback and Users & Data.

### Dialogs (Dashboard)
- **Shell:** one shared dialog component (`app-dialog`, `title`, `size` md/lg, `role`, `busy`, `(close)`; actions go in `<div dialog-actions class="contents">`, a form's submit button uses `form="…"`): a `black/50` scrim, a `background-100` panel (`background-800` in dark mode) with 8px corners, 24px padding and `shadow-lg`, the `h2` title with a close button in the header, actions right-aligned at the bottom (primary last). `role="dialog"`, `aria-modal`, labelled by its title, focus trapped (`cdkFocusInitial` picks the first focus, e.g. Cancel in confirmations), Escape closes only the topmost dialog. Widths: `max-w-md` (448px) for confirmations, `max-w-2xl` for forms.
- **Confirmations:** every confirmation goes through `ConfirmDialogService`, never the browser `confirm()`. The text says concretely what happens (which records are deleted or moved, what stays). The inline `app-delete-popup` is replaced with the service whenever a page is reworked.

### Progress Bar (GuideApp feedback)
An 8px rounded track in gray-100, filled with an orange-400 → orange-500 gradient that animates width over 300ms.

## Feedback Kiosk

The kiosk (`kiosk/feedback/`) runs on tablets at the building exit. A student holds or sets up the tablet, talks with the visitor and types in their feedback, so the screen speaks to the visitor (du-form) while a slim status strip speaks to the student. It inherits the GuideApp's world (Roboto, Programme Orange as the only accent, white cards lifted on `gray-50`, 16px pill corners) at tablet scale: question text 30–36px, answers at least 80px tall, footer buttons 64px. There is no dark mode; the hall is lit.

### Colors and tokens
- `tailwind.config.js` names the roles: `accent` (the Tailwind orange scale) and `canvas` (`gray-50`). Templates use `accent-*`, never `orange-*`.
- **accent-600** fills primary buttons, the selected rating, the selected radio dot and checkbox, the selected card border (3px), the focus ring and `theme-color`. White text on accent-600 is 3.56:1, so it is only used at 20px bold or larger (`text-xl font-bold`).
- **accent-700** is the hover fill and the selected rating label; **accent-800** the inline required hint; **accent-50** the selected card background; **accent-400 → 500** the progress gradient and the countdown bar.
- Unselected radio rings and checkboxes are `gray-500` (3:1 or more on white). Secondary text is `gray-600`.
- **Division colors** come at runtime from `GET /v1/divisions` (`DivisionService`, cached in `localStorage`) and are used as-is. Answers that name a division ("Informatik", "Medientechnik", "Elektronik", "Medizintechnik") show a 40px swatch of that division's color at the end of the card; the backend names divisions by code, so the long names are mapped to `HIF`, `HITM`, `HEL`, `HBG` in `division.service.ts`. The thanks screen closes with a band of the four colors. No green: success is the orange check.

### Screens
- **Start:** logo, "Feedback zum Tag der offenen Tür", one orange "Feedback starten". Before the first questions arrive it shows "Fragen werden geladen …"; on failure the cause, an orange "Erneut versuchen" (busy: "Verbinde …") and the last attempt time.
- **Question:** "Frage x von N" with a progress bar that reaches 100% on the last question. N counts the questions that may still appear, so it only shrinks. One question as `h1` with `*` for required; single choice and rating move on 500ms after the tap. "Zurück" and "Überspringen" are white secondary pills, "Weiter" the orange primary; on an unanswered required question "Weiter" stays tappable (`aria-disabled`) and shows "* Pflichtfrage – bitte eine Antwort wählen". After an edit from the overview it reads "Zur Übersicht".
- **Answer density:** choice answers are set by how many there are, so a whole list fits on one screen (`question-page.component.ts`). Up to 6: 1 column on phones, 2 from `sm`, rows 64–80px, 18–20px text. 7–8: 2–3 columns, rows 56–64px. 9 or more: 2 columns on phones, 3 from `md`, 4 from `lg`, rows 44–56px, 16–18px text, 20px heading on phones. Long words may break (`hyphens: auto`, and a break opportunity after "/"). Rows never go below 44px, text never below 16px.
- **Small and low screens:** below `sm` the page chrome tightens (16px gutters, 56px footer buttons). The `short` variant (`max-height: 700px`, in `tailwind.config.js`) does the same for landscape tablets and phones (48px footer buttons, less vertical padding). "Weiter" keeps `text-xl font-bold` at every size, because white on accent-600 needs large text.
- **Review ("Alles richtig?"):** one row per question, tap to edit; ratings read "3 – Sehr gut".
- **Thanks:** orange check, heading, the division band, and a countdown bar; the whole screen is one button ("Nächstes Feedback starten").

### Operator surfaces
- **Status strip** (`app-status-bar`): a `gray-100` strip at the top of every screen, only while there is news: "Offline – zuletzt geladene Fragen" and "N Feedbacks warten auf die Übertragung – Browserdaten nicht löschen" with "Jetzt senden".
- **"Noch da?"**: after 75s without input on a question or the overview, a dialog counts down 15s (text and bar) before discarding. "Weiter ausfüllen" is the primary and gets the focus.

### Dialogs and focus
- One shell, `app-dialog`: `black/50` scrim, white panel with 8px corners, 32px padding and `shadow-2xl`, `role="alertdialog"`. Focus moves to the `data-initial-focus` element, Tab stays inside, Escape and the scrim dismiss, focus returns on close. Used by the cancel confirmation and "Noch da?".
- Every screen's `h1` takes the focus when it appears and on every new question (`appFocusOnShow`), so screen readers announce the step.
- Focus ring everywhere: a 3px `accent-600` outline with a 3px offset (`styles.css`). Zoom is allowed; `touch-action: manipulation` only stops double-tap zoom.
- Single choice and rating groups are `radiogroup`s labelled by the question; arrow keys move between answers without choosing.

## Registration Kiosk

The kiosk (`kiosk/registration/`) runs on tablets at the entrance. As with the feedback kiosk, a student holds the tablet and talks with the arriving family; the screen speaks to the visitor (du-form), the status strip to the student. It uses the feedback kiosk's world unchanged: same `tailwind.config.js` roles (`accent`, `canvas`, `short`), same focus ring, dialog shell, "Noch da?" guard and countdown bar. It talks to the legacy TadeoT backend, so there are no division colours here.

### Shared classes (`styles.css`)
- `.choice`: the white answer card (3px transparent border, `shadow-lg`); `aria-checked="true"` turns it accent-600 edge on accent-50. Carries `.mark-radio` (dot) or `.mark-check` (box) as its first child.
- `.chip`: a short answer in a row (Schulstufe, Begleitpersonen, Schultyp), 64px tall (56px on `short`), same selected state.
- `.btn-primary` (accent-600, `text-xl font-bold`, never wraps) and `.btn-secondary` (white pill) for footers, 56/64/48px tall.

### Screens
- **Status strip** (always shown): a scoreboard from `Visitors/count`, refreshed every 30s: the registered count in 36px bold gray-900 ("352 angemeldet"), the count including adults in 24px bold gray-700 ("834 mit Begleitung"), one size smaller on `short`; "Keine Verbindung zum Server – Anmelden geht gerade nicht" when that refresh fails. The HTL Leonding logo is pinned on the right (32px tall, 24px below `sm`), except on the start screen, which shows the large logo.
- **Start:** logo, "Willkommen zum Tag der offenen Tür", one "Anmeldung starten"; loading and error states as in the feedback kiosk.
- **Step bar:** five named steps (Wohnort · Über dich · Erfahren · Interessen · Foto) as 8px bars with labels; current accent-500 and bold, done accent-300, upcoming gray-200. Below `sm` the labels collapse to "Schritt x von 5: Name".
- **Wohnort:** built-in number pad (64px keys) next to four 80px digit boxes, the next box outlined in accent-600, all red when the postcode is unknown. Towns appear as `.choice` radios once four digits are in; a single town is selected automatically, and a tap on a town moves on after 500ms.
- **Über dich:** four chip groups on one screen, two columns from `lg`.
- **Erfahren:** reasons as a `.choice` grid (1–4 columns); a tap moves on after 500ms, "Anderes" opens a text field instead.
- **Interessen:** `.choice` checkboxes in the two legacy groups ("Tagesschulzweige", "Praxisspezifische Ausbildungen").
- **Foto:** "Ja, Foto machen" / "Nein, ohne Foto"; the camera frame is the saved 3:4 crop, on gray-800, beside the choices from `lg`, below them otherwise. "Aufnehmen" is the primary, "Kamera wechseln" and "Neu aufnehmen" secondary; with several cameras the active one is named below the frame ("Kamera: HP HD Camera"). Camera errors sit on the dark frame in white, with "Andere Kamera" and "Erneut versuchen".
- **Footer:** "Zurück" left, "Weiter" (or "Zur Übersicht") right; on an incomplete step "Weiter" stays tappable (`aria-disabled`) and the accent-800 hint names what is missing ("Noch offen: Schulstufe, Schultyp"). Below `sm` the hint gets its own line above the buttons.
- **Review ("Alles richtig?"):** one white row per field in two columns from `md`, the photo as a tappable thumbnail beside them; a save error appears as a red-bordered panel above the footer and "Anmelden" becomes "Erneut versuchen".
- **Done with photo:** "Du bist angemeldet!", the photo, and the licence number in bold gray-900 at `clamp(6rem, 22dvh, 11rem)`; it waits for "Nächste Anmeldung". **Done without photo:** the feedback kiosk's thank-you screen (whole screen is the button, 5s countdown bar).

## Cashier Kiosk

The kiosk (`kiosk/cashier/`) runs on a tablet at the buffet counter. Unlike the other two kiosks, the screen speaks to the **student** selling, not to the visitor: short imperatives ("Kassieren", "Gegeben", "Rückgeld"), no du-form. It is a till, not a wizard: the product grid is the home screen and a sale takes three to five taps. It keeps the kiosk world unchanged (same `tailwind.config.js` roles, focus ring, dialog shell, `.choice`, `.chip`, `.btn-primary` / `.btn-secondary`) and talks to the legacy TadeoT backend, so there are no division colours. There is no "Noch da?": an open cart is the student's work in progress.

### Shared classes (`styles.css`)
- `.tile`: a product, 144px tall at least (112px on `short`), white with `shadow-lg`; `data-selected` gives it the `.choice` selected state (accent-600 edge on accent-50). `data-voucher` makes an unselected tile dashed gray-400, because a voucher is not a product.
- `.key`: a number-pad key, 64px (56px on `short`), the registration pad's key as a class.

### Screens
- **Till:** the grid fills the screen (`auto-fill`, tiles at least 152px wide on phones, 176px from `sm`). The whole tile adds one; the count sits in an accent-600 badge pinned over the top-right corner (ringed in the canvas colour) so the name keeps its full width; "−" is a separate 56px button in the bottom-right corner, so a hurried tap can only ever add. A voucher tile toggles (`aria-pressed`) and shows a check instead of a count, its price in red-700 with "max. 1 pro Einkauf". Names break after "/" before they break mid-word.
- **Cart:** from `lg` a white panel on the right (22rem): line items ("2×", name, line total), "Summe" at 48px bold, "Kassieren" 80px tall, "Leeren" as a text button. Below `lg` a white bottom bar with the sum at 36px and the buttons; on phones the buttons get their own row so the sum never wraps. A cart that cannot be paid keeps "Kassieren" tappable (`aria-disabled`, 60% opacity) and names the reason in accent-800 ("Gutschein nur zusammen mit einem Einkauf", "Der Gutschein ist mehr wert als der Einkauf"). "Leeren" asks first when more than one item is in the cart.
- **After a sale:** back to an empty till at once. The cart area shows an orange check, "Verkauf gespeichert", "Summe · gegeben" and the change at 48px until the next product is tapped.
- **Kassieren:** a receipt card (items, "Summe" 48px, "Gegeben", and a change box: accent-50 with "Rückgeld" at 60px, a red-700 "Es fehlen noch …", or a gray hint that the amount is optional) beside the input: quick amounts as one row of `.chip` radios ("Passend" wider, then the notes above the sum) and the number pad with comma and backspace. Side by side from `md`, stacked on phones, receipt first so the change stays in view. Footer: "Zurück" and "Verkauf abschließen". A hardware keyboard works (digits, comma, Backspace, Enter, Escape).
- **Status strip:** `gray-100`, always shown: "Buffet OG" in 20px bold (only the location; the legacy `description` is free text left from earlier events and is not shown), "Wechseln" when there are several buffets, and the HTL Leonding logo (32px tall) pinned on the right; everything else wraps beside it. Only after a send failed: "N Verkäufe warten auf Übertragung – Browserdaten nicht löschen" with "Jetzt senden"; refused sales in red-700 bold with "Ansehen" (a wide dialog listing them, "Erneut senden" and "Entfernen …" per sale with a confirmation).
- **Kassastand:** a quiet gray text button below the product grid ("Kassastand dieses Tablets 7,40 €") opens the till-total dialog (sum at 60px, count, "Auf 0 setzen …" with a confirmation). It is for closing time, so it stays out of the way.
- **Start:** only before the first load (logo, "Buffet-Kassa", loading and error states as in the other kiosks) and for choosing the buffet when there are several ("Für welches Buffet kassiert dieses Tablet?", `.choice` radios).

## Do's and Don'ts

### Do:
- **Do** fill stop cards with the stop's runtime division color and fall back to Neutral Meadow Green (`division-fallback`) only when the stop has no division.
- **Do** keep GuideApp tap targets at least 40px tall, and list cards at 80px.
- **Do** use Programme Orange for the single primary action and the active state on a GuideApp screen.
- **Do** reserve bottom padding (at least 112px) on every GuideApp page so the fixed tab bar never covers the last card.
- **Do** keep the HTL Leonding logo at the top of both apps (header block in the GuideApp, nav bar in the dashboard).
- **Do** use DaisyUI component classes (`btn`, `input`, `select`, `table`, `toggle`, `tabs`) in the dashboard and define new colors as theme variables, so dark mode keeps working.
- **Do** start every dashboard page with the shared page header and the `max-w-6xl` shell.

### Don't:
- **Don't** re-tint, desaturate or replace division colors for aesthetic reasons; they are the school's identity.
- **Don't** introduce a second accent color in the GuideApp alongside orange.
- **Don't** use orange in the dashboard or dashboard blue in the GuideApp; each app keeps its own accent.
- **Don't** set GuideApp body text below 16px.
- **Don't** add raw hex colors in dashboard templates; extend the `--primary-*` / `--background-*` variables so both themes stay in sync.
- **Don't** put two `btn-primary` buttons in one dashboard toolbar, form or dialog.
- **Don't** use the filled blue field style for form inputs, or a placeholder in place of a label.
