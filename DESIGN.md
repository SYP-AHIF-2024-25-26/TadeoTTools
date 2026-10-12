---
name: TadeoTTools
description: Open-day guide for HTL Leonding. The visitor GuideApp carries the tour in a night-blue band like htl-leonding.at, and the organizer dashboard behind it is built on DaisyUI.
colors:
  division-informatics: "#0059A7"
  division-media: "#70B4D9"
  division-electronics: "#CE1223"
  division-medtech: "#f1a102"
  division-fallback: "#80c076"
  guide-night: "#021422"
  guide-night-deep: "#04243d"
  guide-night-track: "#0a3556"
  guide-night-gray: "#b9cadb"
  guide-night-white: "#dde7f0"
  guide-act: "#c2410c"
  guide-act-deep: "#9a3412"
  guide-select: "#ea580c"
  guide-select-on-night: "#fb923c"
  guide-mark: "#fed7aa"
  guide-canvas: "#f9fafb"
  guide-surface: "#ffffff"
  guide-no-division: "#d1d5db"
  guide-ink: "#111827"
  guide-ink-secondary: "#374151"
  guide-ink-muted: "#4b5563"
  guide-ink-seen: "#6b7280"
  guide-box-ring: "#9ca3af"
  guide-tab-rest: "#000000"
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
    fontFamily: "Manrope Variable, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: "2.375rem"
    letterSpacing: "-0.025em"
  guide-headline:
    fontFamily: "Manrope Variable, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: "2.125rem"
    letterSpacing: "-0.025em"
  guide-panel-title:
    fontFamily: "Manrope Variable, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.75rem"
  guide-title:
    fontFamily: "Manrope Variable, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
  guide-body:
    fontFamily: "Manrope Variable, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  guide-meta:
    fontFamily: "Manrope Variable, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    fontFeature: "tnum"
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
  control: "12px"
  panel: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  row-gap: "12px"
  md: "16px"
  panel-pad: "20px"
  lg: "24px"
  xl: "32px"
components:
  guide-top-bar:
    backgroundColor: "{colors.guide-night}"
    height: "56px"
    padding: "0 16px"
  guide-title-band:
    backgroundColor: "{colors.guide-night}"
    textColor: "{colors.guide-surface}"
    typography: "{typography.guide-display}"
    padding: "8px 16px 24px"
  guide-back-link:
    textColor: "{colors.guide-night-gray}"
    typography: "{typography.guide-meta}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 8px 0 4px"
  guide-tour-band:
    backgroundColor: "{colors.guide-night-track}"
    rounded: "{rounded.full}"
    height: "12px"
  guide-division-icon:
    size: "40px"
  guide-button-primary:
    backgroundColor: "{colors.guide-act}"
    textColor: "{colors.guide-surface}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px 0 16px"
  guide-button-primary-hover:
    backgroundColor: "{colors.guide-act-deep}"
  guide-group-card:
    backgroundColor: "{colors.guide-surface}"
    textColor: "{colors.guide-ink}"
    typography: "{typography.guide-title}"
    rounded: "{rounded.panel}"
    padding: "8px 6px 8px 20px"
    height: "80px"
  guide-seen-toggle:
    backgroundColor: "{colors.guide-surface}"
    textColor: "{colors.guide-ink}"
    typography: "{typography.guide-title}"
    rounded: "{rounded.panel}"
    padding: "6px 6px 6px 20px"
    height: "56px"
  guide-group-card-seen:
    textColor: "{colors.guide-ink-seen}"
  guide-stop-card:
    backgroundColor: "{colors.guide-no-division}"
    textColor: "{colors.guide-surface}"
    typography: "{typography.guide-title}"
    rounded: "{rounded.panel}"
    padding: "8px 8px 8px 20px"
    height: "80px"
  guide-checkbox:
    backgroundColor: "{colors.guide-surface}"
    rounded: "{rounded.lg}"
    size: "28px"
  guide-checkbox-checked:
    backgroundColor: "{colors.guide-ink}"
    textColor: "{colors.guide-surface}"
  guide-content-panel:
    backgroundColor: "{colors.guide-surface}"
    textColor: "{colors.guide-ink-secondary}"
    typography: "{typography.guide-body}"
    rounded: "{rounded.panel}"
    padding: "20px"
  guide-bottom-nav:
    backgroundColor: "{colors.guide-surface}"
    textColor: "{colors.guide-tab-rest}"
    rounded: "{rounded.lg}"
    height: "56px"
  guide-bottom-nav-active:
    textColor: "{colors.guide-select}"
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

TadeoTTools works like an open-day programme you carry on your phone. The visitor GuideApp follows the Nachtband world of leo-projects, adapted to the phone: a night-blue frame taken from htl-leonding.at carries the logo, the page title and the way on. Each stop group carries its own progress as a bar of stops in their division colours, on its card and in its page's band, because visitors pick one guide tour rather than the whole day. Below the frame the canvas is light, and the day is a list of stop groups and stops, each a white or division-filled panel to open and tick off. The school's own division colours (Informatik blue, Medientechnik sky blue, Elektronik red, Medizintechnik amber, plus whatever the admins set) are the wayfinding signal; a glance at a card's fill tells you which part of the school you are in.

Colour is strictly distributed. Night blue is the frame and never content. Orange only marks what you can do (the "Auf der Karte" link next to the room, "Erneut versuchen"), the active tab and the focus. Status is neutral: a seen stop gets a gray-900 tick, not an orange one. Type is Manrope, the school's typeface, with one extra-bold title per page in the band. Rows are tall (at least 80px) and every tap target is at least 44px, because visitors tap while walking; body text never drops below 16px. There is one motion moment: the tour band grows in once per visit.

The organizer dashboard is the programme's back office. It uses the same rounded, lifted vocabulary at office density: DaisyUI components, 14px body text, a sky-blue palette instead of orange, and a full dark mode. Its distinctive habit is **filled blue filter fields**: the search and filter fields above a list sit in solid steel blue (`dash-field`) with white text and placeholders, while form inputs are plain bordered fields. The two apps are documented as separate sub-systems that share only the HTL Leonding logo and the division colors.

**Key Characteristics:**
- Division colors are the identity and the wayfinding signal; they come from the school, not from the design.
- GuideApp: Nachtband on the phone: a sticky night top bar and title band, a tour band per stop group, white 16px-radius panels on a light canvas, orange only for action, selection and focus, a fixed bottom tab bar.
- Dashboard: DaisyUI `light` / `darkCustom` themes, blue primary, filled blue filter fields, a sticky sky-blue top nav, one left-aligned page header on every page.
- Tall touch targets (44px or more in the GuideApp) and a 16px side gutter on mobile; the GuideApp is designed only for phone width.
- Copy: German with du-form in the GuideApp, English in the dashboard (today's state, not a rule).
- Feedback kiosk (`kiosk/feedback/`): the earlier GuideApp visual language (Roboto, Programme Orange) at tablet size, for the exit tablets; see the Feedback Kiosk section.
- Statistics kiosk (`kiosk/statistics/`): the same world scaled up for a wall projection, an unattended slideshow; see the Statistics Kiosk section.

## Colors

Two palettes share one set of school colors. The GuideApp is a night-blue frame over a light canvas, with orange only for action, selection and focus. The dashboard is sky blue at several depths.

### Shared: Division Colors
- **Informatik Blue** (`division-informatics`): Informatik. The division's card fill and its segment in the countdown band.
- **Medientechnik Sky** (`division-media`): Medientechnik card fill and its segment in the countdown band.
- **Elektronik Red** (`division-electronics`): Elektronik card fill and its segment in the countdown band.
- **Medizintechnik Amber** (`division-medtech`): Medizintechnik card fill and its segment in the countdown band.
- **Neutral Meadow Green** (`division-fallback`): the dashboard overview's fill for a stop without a division. The GuideApp no longer uses it; it fills such stops with No-Division Gray (`guide-no-division`).

Admins set the real division colors in the dashboard (`Division.Color`), and stop cards and tour band segments render that runtime value exactly (`shared/division-colors.ts`). A stop in several divisions gets a smooth left-to-right linear gradient through all its colors, in a fixed order whatever the stop's `divisionIds` say: HIF, HITM, HEL, HBG, then the rest (user decision 2026-10-12: a HIF & HITM stop starts in HIF blue and ends in HITM light blue). The Tailwind names above are the build-time copies used for the countdown digits.

### Primary (GuideApp)
- **Action Orange** (`guide-act`, accent-700): the fill of the one action button on a screen ("Zur Station", "Erneut versuchen", "Löschen" in the reset confirmation) with white bold text (5.2:1). Hover deepens to **Deep Orange** (`guide-act-deep`, accent-800).
- **Selection Orange** (`guide-select`, accent-600): the active tab icon, the global 3px focus ring and the focus outline of cards and checkboxes.
- **Orange On Night** (`guide-select-on-night`, accent-400): the focus ring inside the night frame (`.on-night`) and the "Auf der Karte" link in the title band, one step lighter so it carries on dark blue (7.3:1 on night-900).
- **Mark** (`guide-mark`, accent-200): text selection, with gray-900 text.

### Secondary: Night Frame (GuideApp)
- **Night** (`guide-night`, night-950): the sticky top bar, the start of the title band gradient, `theme-color` in `index.html` and the manifest.
- **Deep Night** (`guide-night-deep`, night-900): the end of the title band gradient (top to bottom).
- **Track Night** (`guide-night-track`, night-800): the track behind the tour band in the night band. On a white group card the track is gray-200.
- **Night Gray** (`guide-night-gray`, night-200): the back link.
- **Night White** (`guide-night-white`, night-100): meta text in the band (room, "16 Stationen").

White text on night is the default. The palette comes from Nachtband (leo-projects), which took it from htl-leonding.at.

### Primary (Dashboard)
- **Dashboard Blue** (`dash-primary`): DaisyUI `btn-primary` and the active nav link. **Deep Dashboard Blue** (`dash-primary-deep`) is its hover/focus state.
- **Filled Field Blue** (`dash-field`, hover `dash-field-hover`): the background of filter inputs and selects, with white text and placeholders. In dark mode the fields keep the dark `primary-300` fill.
- **Sky Nav** (`dash-nav`): the sticky top bar.
- **Pale Blue Tint** (`dash-tint`): hover backgrounds on list rows and secondary actions.

### Neutral
- **Programme Paper** (`guide-canvas`): GuideApp page background and the manifest `background_color`.
- **Card White** (`guide-surface`): group cards, content panels, the white box behind the checkbox on stop cards, the tab bar.
- **No-Division Gray** (`guide-no-division`, gray-300): the stop card fill and tour band segment for a stop without a division, neutral so it never reads as a fifth division.
- **Ink** (`guide-ink`, gray-900): page text, group names, the checked checkbox. **Secondary Ink** (`guide-ink-secondary`, gray-700): body text in panels and "Raum …". **Muted Ink** (`guide-ink-muted`, gray-600): the "3/7" count on group cards. **Seen Ink** (`guide-ink-seen`, gray-500): the name of a seen stop group.
- **Box Ring** (`guide-box-ring`, gray-400): the 2px ring of an unchecked checkbox. **Tab Rest** (`guide-tab-rest`): inactive tab icons are black.
- **Office Gray** (`dash-canvas`): dashboard page background (also used for modals and cards, which are then separated only by shadow). **Dashboard text** has three roles, as CSS variables and Tailwind colours: **Ink Strong** (`--ink-strong`, `text-ink-strong`, near-black with a slight plum tint) for headings, which get it from the base layer; **Ink** (`--ink`, `text-ink`) for body text, table cells and labels, also the `body` colour; **Ink Muted** (`--ink-muted`, `text-ink-muted`) for hints, metadata, empty states and table headers. Muted passes 4.5:1 on every surface it sits on. There are no other text greys: no `text-gray-*`, no `text-secondary-content`, no numbered `text-text-*` steps.
- **Dark mode:** `dash-dark-canvas` / `dash-dark-surface` with `dash-dark-primary`. The dark theme collapses primary, secondary and accent to the same blue range. Text is white (strong), `#f3f4f6` (ink) and `#d8dee6` (muted, still 4.5:1 on the lighter `background-800/900` surfaces).

### Status (Dashboard)
- `dash-error` for destructive buttons and error alerts, `dash-success`, `dash-warning`.
- **Assignment states** (`shared/utils/assignment-status.ts`): Approved green, **Pending teal**, Conflict orange, Unassigned gray. The dashboard doesn't reject requests; duplicates are deleted (with Undo). Red "Rejected" only labels requests stored before that change. Text uses the 700 shade in light mode and the 400 shade in dark mode; badges use the 800 shade on the 100 tint.

### Named Rules
**The Division Owns Its Color Rule.** Division colors come from the school and the dashboard data. Never re-tint them, and never reuse a division hue for UI states like errors or links.

**The Untinted Identity Rule.** (GuideApp, from Nachtband) Division colours appear exactly as the admin set them, on stop cards and tour band segments. They are never tinted, darkened, faded or overlaid, not even for seen stops. One deliberate exception to Nachtband's no-gradient rule, decided by the user ("the cut is too hard"): a stop in several divisions gets a smooth left-to-right gradient through its exact colours.

**The Orange Means Act Rule.** (GuideApp, from Nachtband) Orange is only action (accent-700 buttons), selection and focus (accent-600, accent-400 on night). Never status, counts or decoration: orange sits next to Medizintechnik amber, and any other orange surface reads as a division.

**The Neutral Status Rule.** (GuideApp, from Nachtband) "Seen" is a status, so it is neutral: a gray-900 box with a white tick, a gray-500 group name, a taller tour band segment. Never orange, never a division colour, never night blue.

**The One Seen Rule.** (GuideApp) A stop is the unit of progress (`ProgressService`, `localStorage` key `finishedStops`). A group is seen when all its stops are seen; ticking a group ticks or unticks all its stops. Only a group without stops is stored as a group (`finishedStopGroups`). Cards, the "3/7" count, the tour band and the count line all read the same state, so they never disagree.

**The Night Is The Frame Rule.** (GuideApp, from Nachtband) Night blue is the top bar, the title band and the tour band track. Never a text, link or surface colour on the canvas.

**The Same White Text Rule.** (GuideApp, user decision) Stop names are white on every fill, with a soft text shadow (`0 1px 2px rgb(0 0 0 / 0.45)`). The user chose this knowingly over a white chip or a per-fill text colour. Its known cost: white fails WCAG contrast on light fills such as HITM, HBG, ALL and ORG.

**The White Text Needs 4.5 Rule.** Any fill that carries white text in the dashboard (primary buttons, filled fields, toasts) must reach 4.5:1. That is why the primary is `#1f6fd1`, not the lighter `#4590e6`, and why status text uses the 700 shades in light mode and the 400 shades in dark mode.

**The Pending Is Not A Warning Rule.** Pending is teal, near Approved green: it means "on track, waiting for a decision". Orange is reserved for Conflict, the one state that needs the admin's attention.

## Typography

**GuideApp font:** Manrope Variable (`@fontsource-variable/manrope`, self-hosted), fallback `system-ui, -apple-system, Segoe UI, sans-serif`.
**Dashboard font:** the Tailwind default system stack (`ui-sans-serif, system-ui, sans-serif`). The dashboard does not load a webfont.

**Character:** Manrope is the typeface of htl-leonding.at and so the school's own; in the GuideApp one extra-bold title per page sets the tone in the band, and below it hierarchy comes from weight and gray value at sizes legible on a phone. The dashboard's system font keeps it native and dense.

### Hierarchy (GuideApp)
- **Display** (extra-bold 800, 32px, 38px line, -0.025em): the title "Tag der offenen Tür" on the start page and the countdown (always, there is no evening event), white in the band, balanced on two lines. Used once.
- **Headline** (extra-bold 800, 28px, 34px line, -0.025em): the page title in the band on every other page (stop group, stop, Karte, Feedback, Über die App), at most three lines. Words are never hyphenated: titles, headings and names break only between words (user decision 2026-10-12, after "Informa-tik"); only a word wider than the line may break (`break-words`).
- **Panel Title** (bold, 20px): the heading of a panel inside the content, such as the load error.
- **Title** (bold, 18px, snug): stop group and stop names on cards, clamped to two lines. Also "Station gesehen" on the seen toggle.
- **Body** (regular, 18px, relaxed, gray-700): stop and group descriptions (HTML from the admin).
- **Meta** (semibold, 16px, tabular figures): the back link, "Raum …" in the band, the group count ("16 Stationen", "5 von 16 gesehen"), the "3/7" count on group cards.

### Hierarchy (Dashboard)
- **Headline** (bold, 24px, `h1`): the page title such as "Stops" or "Students", left-aligned in the page header. Exactly one per routed page; tabs inside a page do not get their own `h1`.
- **Title** (bold, 18px, `h2`): section, card and dialog headings.
- **Item** (semibold, 16px, `h3`): headings inside a section, such as one question or one stop card.
- **Body** (regular, 14px): tables, forms, lists, the default for almost all dashboard text.
- **Label** (medium, 12px): field labels, chips, table meta.

### Named Rules
**The Arm's-Length Rule.** GuideApp text is read while walking: body 18px, meta and card text at least 16px (the phone adaptation of Nachtband's 14px desktop body). The one exception is the room number on stop cards (14px medium, user decision 2026-10-12): it must sit clearly below the 18px bold name.

**The One Big Title Rule.** (GuideApp, from Nachtband) Size happens once per page: the extra-bold title in the band. Below it, emphasis is bold and gray-900, not larger.

## Layout

**GuideApp:** a single column at phone width, in two zones. The **night frame** on top: a sticky 56px top bar (with safe-area padding, `viewport-fit=cover`) holding only the white logo, flowing into the title band (8px top, 24px bottom padding). On the start page the band holds the title and the date line (about 175px), so several stop groups fit in the first viewport; on subpages it holds the back link, the title, then the division icons and the room or the group count on one wrapping line, and on a group page with several stops the group's tour band below. The **canvas** below: content in a 16px side gutter (`px-4`), 20px below the band, cards stacked with 12px gaps. A white tab bar is fixed to the bottom with an 8px side inset, and pages reserve 112–128px of bottom padding so the last card clears it. Pages scroll vertically and allow pinch zoom (`touch-pan-y touch-pinch-zoom`; Hammer's `touchAction` is set to `pan-y pinch-zoom` so it does not block zoom) plus horizontal swipe gestures. The viewport never disables zoom. There is no desktop layout.

**Dashboard:** the top nav is `max-w-screen-xl` (1280px). Every page, list or detail, uses one content shell: the `.page-shell` class in `styles.css` (`mx-auto w-11/12 max-w-6xl pb-10`, 1152px). Pages follow one pattern:

1. **Page header** (`app-page-header`, `title` and optional `subtitle` inputs, actions projected): the `h1` on the left, an optional one-line subtitle under it, and the page's actions on the right. Below `sm` the actions wrap under the title.
2. **Tabs**, if the page has several views (see Tabs).
3. **Filter bar** of filled blue fields (full width on mobile, `max-w-xs` from `sm`), with Clear Filters shown only while a filter is set.
4. The table, card list or form.

Detail editors (stop, stop group) sit in a card inside the same shell, not in a narrower one. The spacing rhythm is 8px / 16px / 24px (`gap-2`, `gap-4`, `p-6`). Below `md`, nav links move into a hamburger dropdown.

## Elevation & Depth

Both apps are lifted rather than flat: depth comes from Tailwind shadows on white or tinted surfaces, not from borders or tonal layers.

### Shadow Vocabulary
- **Card lift** (`shadow-lg`): dashboard cards and modals. The default resting elevation.
- **Panel lift** (`shadow-md`, on white panels with a 1px `gray-900/5` ring): every GuideApp card and panel (group cards, stop cards, content panels, the map panel) and the orange action buttons.
- **Night frame shadow** (`0 6px 16px rgba(2,20,34,0.35)`): under the sticky GuideApp top bar, so content scrolling under it stays separated.
- **Tab bar float** (`shadow-2xl`): the GuideApp bottom navigation. Its shadow casts downward, below the bar, so it barely separates the bar from the list above (an unchanged leftover, not a rule).
- **Drag preview** (`0 5px 15px rgba(0,0,0,0.1)`): dashboard drag-and-drop of stops and groups (CDK), at 80% opacity.

### Named Rules
**The Lifted Card Rule.** Anything tappable in the GuideApp is a 16px-radius panel on a soft neutral shadow. Ticking changes nothing about the card itself: it keeps its height (at least 80px), shadow, fill and full opacity, so the next row never moves (user decision).

## Shapes

Gently rounded throughout. GuideApp panels and cards use generous 16px corners (`rounded-2xl`), buttons 12px (`rounded-xl`) at 44px height, the checkbox box 8px with a 2px inset ring. The tour band is a fully round 12px bar that clips its segments. Dots, toggles and avatars are fully round. The GuideApp tab bar is rounded only on top (`rounded-t-lg`). The dashboard inherits DaisyUI v4 defaults (8px buttons and inputs, 16px cards). Division icons are square, 40px, with no rounding.

## Components

### Buttons
- **GuideApp primary:** Action Orange (accent-700), 12px corners, 44px tall, 16px left / 20px right padding, 16px bold white text, `shadow-md`, an optional leading 20px stroke icon. Hover deepens to accent-800; press scales to 98%. One per screen at most.
- **GuideApp map link:** "Auf der Karte" is not a button. On the stop page and on a single-stop group page it follows "Raum 101" in the title band (`app-room-line`) as a bold 16px Orange On Night text link with a leading 20px map pin, 44px tall, no fill or shadow; accent-300 on hover. It only shows when the room text names a room on the floor plans. Decided 2026-10-12: a filled button inside the content panel was the loudest thing on the page, although reading and ticking are what the page is for.
- **GuideApp back:** there is no back button. Every subpage starts its band with a 44px back link to the parent ("‹ Rundgang" from a group, "‹ <group name>" from a stop) in Night Gray, semibold 16px, white on hover.
- **Dashboard primary:** DaisyUI `btn btn-primary` in Dashboard Blue, **one per toolbar, form or dialog**: the action the page exists for (Add Stop, Save Changes, Create Group). Every dashboard button is `btn-sm` (32px); the larger default size is not used.
- **Dashboard secondary:** `btn-outline` for further actions in the same toolbar (Import/Export, Approve N pending next to Add Student). Low-weight actions such as Clear Filters, Cancel and Back are `btn-ghost`.
- **Dashboard Delete / Remove:** Delete (destroys data) is `btn-outline btn-error` and opens a confirmation, whose confirm button is the only solid `btn-error`. Remove (unlinks, data stays) is `btn-ghost`. Conflict actions use `.btn-conflict` (Conflict orange `orange-700`, white text) from `styles.css`, not DaisyUI `btn-warning` yellow; Approve actions use `.btn-approve` (Approved green `green-700`, white text). Both keep the 700 shade in dark mode so white text stays at 4.5:1 or more.
- **Dashboard row actions:** icon buttons at the end of a table row or card: `btn btn-ghost btn-sm` with the shared `app-action-icon` (`edit`, `view`, `delete`; 16px stroke icon), a `title` and an `aria-label` that names the record ("Edit Robotics Lab"). Pencil = edit, eye = view only (read-only pages), trash = delete (in `text-error`). No gear icons and no text "Edit" buttons on cards. Exception, decided 2026-10-09: the Students page keeps its own button weights. The header toolbar is default size with Approve N pending in `.btn-approve`, Add Student `btn-primary` and Import/Export `btn-outline`; the row buttons are Assign Stop `btn-primary btn-sm`, Approve `.btn-approve btn-sm`, Back to Pending is `btn-outline btn-sm`, Remove is `btn-outline btn-error btn-sm`, and Manage Conflict is `.btn-conflict`.

### Cards / Containers
- **Stop group card (GuideApp):** white, 16px corners, `shadow-md`, gray-900/5 ring, at least 80px tall. Group name in 18px bold gray-900 (two lines max); below it, for a group with several stops, the group's tour band on a gray-200 track and, while partly seen, a "5/16" count in semibold gray-600 next to it; the checkbox on the right. The whole card opens the group; the checkbox ticks or unticks all its stops. Seen (all stops seen, The One Seen Rule): the name turns gray-500 and the count disappears.
- **Stop card (GuideApp, signature):** the same shape, filled with the stop's exact division colour, a smooth gradient through several, or No-Division Gray. The name is bold white with the soft text shadow on every fill (The Same White Text Rule), and below it the room number alone ("E24", "U34, U36, U38", no "Raum" label) in 14px medium white with the same shadow: a quiet second line, clearly below the name, so a visitor sees where to go without opening the stop. The checkbox sits on a white 12px-radius box at the right end. Seen: only the checkbox changes; height, fill and opacity stay.
- **Content panel (GuideApp):** white, 16px corners, 20px padding, `shadow-md`, gray-900/5 ring. Holds only the description; room and map link sit in the title band, and without a description there is no panel. When a group has one stop, the panel shows that stop's text without a title: the band already names it.
- **Seen toggle (GuideApp):** a full-width white row under the content panel on the stop page and on a single-stop group page: "Station gesehen" in 18px bold (gray-500 once ticked) and the checkbox box at the right end, at least 56px tall, the whole row is the `label`. Focus draws the 3px accent-600 outline around the row. It lets the visitor tick a stop where they read about it.
- **Countdown page (GuideApp):** the only page while the `showCountdown` flag is on, without tab bar, so the night frame fills the whole screen like a poster. The event is the headline: "Tag der offenen Tür" as Display, below it the date line (The Date Line). The tone is friendly, not formal: "Bald geht’s los!" (from the start time "Heute geht’s los!") in 20px bold white above a 2×2 grid of night-800 tiles (Tage, Stunden, Minuten, Sekunden) with large extra-bold white tabular digits (between 48px and 88px, sized by width and height so the page fills a tall phone and still fits a 667px one) that tick every second and 18px night-200 labels. The countdown block takes the free space and sits in its middle; the closing line and link stay at the bottom. Then a 12px band of four equal segments in the exact Informatik, Medientechnik, Elektronik and Medizintechnik colours (the tour band's form, no progress), "Wir freuen uns auf dich!" and a night-200 link "Mehr auf htl-leonding.at" with an external-link icon. From the start time the tiles disappear; without a date only the title, the closing line and the link show.
- **Über die App (GuideApp):** kept as short as possible, help first and credit last, all in content panels. "So funktioniert's" lists four one-line items (Rundgang, Abhaken, Karte, Feedback), each led by the icon the visitor sees in the app (the tab bar icons and the checked box), then one muted line on privacy. Below it a quiet white row "Häkchen zurücksetzen": the first tap turns the panel into an in-place question ("Alle Häkchen auf diesem Handy löschen?" with Abbrechen and an Action Orange "Löschen"); it clears only the ticks and the last opened group and stop (`ProgressService.reset()`), keeps the offline data and the "feedback sent" mark, and confirms with "Alle Häkchen sind gelöscht." in a status line. Then the team panel (photo, names, class, one neutral sentence about the project) and an "Impressum" link row with an external-link icon.
- **Stop pager (GuideApp):** under the seen toggle on the stop page, two white panels side by side (16px corners, `shadow-md`, gray-900/5 ring, at least 56px tall): left "‹ Zurück" with the previous stop's name, right "Weiter ›" with the next one's, in the group's order; the direction in 16px semibold gray-600, the name in 16px bold gray-900, at most three lines. The first stop has no left panel (the band's back link leads to the group); on the last stop the right panel reads "Fertig mit <group name>" and opens the group. A group with one stop has no pager. Neutral on purpose: orange is for actions, not for moving through the group. Paging keeps the page and follows the route, scrolling back to the top.
- **Loading and error (GuideApp):** while a list loads, static white card outlines with a gray-200 bar (`app-card-skeleton`, no shimmer: The One Motion Rule) and a hidden "Wird geladen …" status. When loading fails and nothing is stored, a content panel (`app-load-error`, `role="alert"`) names the problem ("Der Rundgang konnte nicht geladen werden"), says what to do and that the ticks stay on the phone, with "Erneut versuchen" as the screen's one Action Orange button. Reads of groups, stops, divisions and feedback questions keep their last answer in `localStorage` (`lastKnown:<path>`) and fall back to it offline, so the error only shows before the first successful load. A group with no stops and no text says "Zu dieser Gruppe gibt es keine eigenen Stationen."

### Inputs / Fields
- **GuideApp feedback answers:** choice answers are full-width white rows (16px corners, `shadow-md`, gray-900/5 ring, at least 56px tall, 18px text) holding a native radio or checkbox; the mark sits at the right end in a 44px area, a 28px circle (single choice) or 8px-radius box (multiple choice, with "Mehrere Antworten möglich" above). Selected: a 2px accent-600 ring on the row, an accent-600 dot or filled box with a white tick, the text bold; never an orange wash. An answer that names a division ("Informatik", "Medientechnik", "Elektronik", "Medizintechnik", or its short code; `divisionColorFor` in `shared/division-colors.ts`) is filled with that division's exact colour like a stop card: bold white text with the soft shadow, no ring at rest, the mark on a white 12px-radius box, and when selected the accent-600 ring with a 2px canvas offset so it never touches the fill. Without loaded divisions the answers stay white. Ratings are one row of equal 56px tiles with bold tabular numbers (two rows above 7 values), the first and last label under the ends and the chosen one written out ("4 – Gut"). Text answers are a white 16px-radius textarea that grows with the text (`field-sizing: content`), with the admin's placeholder or none. Focus draws the 3px accent-600 outline around the whole row.
- **GuideApp checkbox (signature):** a 44px tap target holding a 28px box with 8px corners. Unchecked: white with a 2px gray-400 ring. Checked: gray-900 fill and ring with a white 3px-stroke tick, a 150ms colour transition. The label names the item ("Gaming Garden gesehen"). Focus is a 3px accent-600 outline on the box.
- **GuideApp focus:** one 3px accent-600 outline with a 3px offset everywhere (`styles.css`), accent-400 inside the night frame. Cards draw it around the whole card (an `::after` over the card), not around the inner button.
- **Dashboard filter field:** DaisyUI `input input-bordered` / `select select-bordered` plus the `.field-filter` class from `styles.css`: filled with Filled Field Blue, white text and placeholders (placeholders at 4.5:1 too), darkening on hover. Used only in filter bars above lists.
- **Dashboard form field:** DaisyUI `input` / `select` / `textarea` / `file-input` with `-bordered` on the surface color, `w-full`, never hand-written border classes. Inside dense sub-forms (stop students, stop managers, question conditions) the `-sm` sizes are used. Every field has a visible label above it (`label for` matching the field `id`); a field inside a table row or a list gets an `aria-label` instead. Placeholders only show an example. Required fields get `<span aria-hidden="true">*</span>` after the label and `required` on the field, nothing else.
- **Focus (all controls):** one 2px outline in `--focus-ring` with a 2px offset on every field, button, tab and link (Dashboard Blue `dash-focus` in light mode, `#60a5fa` in dark mode, Ink Strong on the sky-blue nav bar). It is set globally in `styles.css`; templates don't add `focus:ring-*` or `focus:outline-none`.

### Navigation
- **GuideApp top bar:** night-950, sticky, 56px plus the safe area, the white HTL Leonding logo (32px tall) linking to the start page. Nothing else: no menu, no login.
- **GuideApp title band:** night-950 → night-900 top to bottom, white title, then per page: on the start page and the countdown the date line ("Freitag, 20. November 2026, 13–19 Uhr", 18px semibold night-100); on subpages the back link above the title and the division icons plus room or group count below it, and the group's tour band on a group page. It replaces the earlier breadcrumb and "Zurück" pill. Karte, Feedback (with its step line and step band), Über die App and the countdown get the band without a back link.
- **GuideApp bottom tab bar:** a white 56px bar fixed to the bottom with an 8px side inset, four evenly spaced 20–24px icons in 44px buttons (Rundgang, Karte, Feedback, Über die App), black at rest and Selection Orange (accent-600) when active, `aria-current="page"`. Icons only, with `aria-label`s. Position and icons are unchanged by the redesign (user decision).
- **Dashboard top nav:** sticky Sky Nav bar with the HTL Leonding logo (32px tall) on the left, then text links (the active link gets a primary fill and underline), a theme toggle switch and the user menu on the right. Below `md` the links collapse into a hamburger with a dropdown.
- **Users & Data:** the admin's home for people, master data and visitor-app settings, as tabs: Stop Managers (list, add, CSV import), Admins, Students (student and assignment CSV imports, students export, delete all students), Divisions (cards, Add Division, CSV export) and Visitor App (countdown on/off and date). File actions sit with their data: there is no separate Import & Export tab, the Stops export is in the Stops page header, the feedback answers export is on Feedback > Responses. `/divisions` redirects to `?tab=divisions`; the Students page and the Overview link into the Students and Visitor App tabs. CSV imports use the shared `app-csv-import` (label, expected columns, result).

- **Dashboard tabs:** `.page-tabs` / `.page-tab` from `styles.css` under the page header: a full-width 2px line, tabs in 16px semibold muted text with 20px side padding, and the active tab in strong text on a Pale Blue Tint (`primary-100`) fill with rounded top corners and a 3px Dashboard Blue underline sitting on the line. `role="tablist"` with `role="tab"` and `aria-selected` on each tab (the style keys off `aria-selected`), and the active tab in the URL (`?tab=…`) so other pages can link to it. Used on Feedback and Users & Data.

### Dialogs (Dashboard)
- **Shell:** one shared dialog component (`app-dialog`, `title`, `size` md/lg, `role`, `busy`, `(close)`; actions go in `<div dialog-actions class="contents">`, a form's submit button uses `form="…"`): a `black/50` scrim, a `background-100` panel (`background-800` in dark mode) with 8px corners, 24px padding and `shadow-lg`, the `h2` title with a close button in the header, actions right-aligned at the bottom (primary last). `role="dialog"`, `aria-modal`, labelled by its title, focus trapped (`cdkFocusInitial` picks the first focus, e.g. Cancel in confirmations), Escape closes only the topmost dialog. Widths: `max-w-md` (448px) for confirmations, `max-w-2xl` for forms.
- **Confirmations:** every confirmation goes through `ConfirmDialogService`, never the browser `confirm()`. The text says concretely what happens (which records are deleted or moved, what stays). The inline `app-delete-popup` is replaced with the service whenever a page is reworked.

### Tour Band (GuideApp, signature)
A stop group's progress as one bar: a 12px fully rounded track with one segment per stop in the group's order, each in its exact division fill. Seen segments stand 12px tall, unseen ones are 4px lines in full colour, never transparent (every segment is 12px, unseen ones `scale-y` to a third, so ticking animates a transform, not the layout). Gaps are 2px, 1px above 30 stops. Ticking raises a segment in 300ms. It appears in two places, only for groups with several stops: on the group card (gray-200 track, under the name) and in the band of the group page (night-800 track, under the icons and "5 von 16 gesehen").

**The Per Group Rule.** (GuideApp, user decision 2026-10-12) Most visitors pick one guide tour, so progress is never shown across the whole day: a bar over all 37 stops would tell them they never finish. Each group shows its own progress.

**The Date Line.** Under the title of the start page and the countdown page: weekday, date and year, then the opening hours from the start time of the countdown setting to the fixed end at 19:00 ("Freitag, 20. November 2026, 13–19 Uhr", `shared/open-day.ts`); "Uhr" never wraps alone. The start page shows it only for today or a later date, so last year's date never appears; without a date the band holds only the title. The start page has no "next stop" line: progress lives on the group cards, and the stop pager leads on.

**The One Motion Rule.** (GuideApp, from Nachtband) The group page's tour band growing in from the left is the GuideApp's one motion moment (900ms, `cubic-bezier(0.16, 1, 0.3, 1)`, once per group and visit, remembered in `sessionStorage`); the bands on the cards don't grow. Everything else is a short state transition. `prefers-reduced-motion` turns it and all transitions off. The band is `aria-hidden`; the count next to it carries the same information.

### Division Icon (GuideApp)
The division's own icon as uploaded in the dashboard (`/v1/divisions/{id}/image`), 40px square, no rounding, no frame, in the band of stop group and stop pages (a group shows every division of its stops once). Visitors don't know the short names ("HIF", "HITM", "ALL"), so the GuideApp never shows them. A division without an icon (today ALL and ORG) shows nothing: the image hides itself on a 404. The icon is decorative (`alt=""`); the stop's colours and text carry the meaning.

**The No Short Names Rule.** (GuideApp, user decision 2026-10-12) Division short names are organizer vocabulary. The GuideApp shows a division only by its colour and its icon.

### Feedback Page (GuideApp)
One question per screen, inside the night frame. The band holds "Feedback", the meta line "Frage 2 von 6" and a **step band**: the tour band's form, neutral (night-800 track, white tall segments up to the current question, thin night-200 ones after it; no orange, no division colour, no grow-in). N counts the questions that may still appear, so it only shrinks (`shared/feedback-answers.ts`, shared logic with the kiosk). Below: on question 1 one muted line ("Anonym – hilft uns, den nächsten Tag der offenen Tür besser zu machen."), the question as a 20px bold `h2` with `*` when required, the answers, then "‹ Zurück" (white secondary, not on question 1) and the screen's one Action Orange button: "Weiter", "Überspringen" for an unanswered optional question, "Absenden" on the last. A single choice or rating tap moves on after 500ms, never past the last question. An unanswered required question keeps the button tappable (`aria-disabled`) and says "* Pflichtfrage – bitte wähl eine Antwort". Each step scrolls to the top and focuses the question. Answers in progress stay in `sessionStorage` (`feedbackDraft`), so switching tabs keeps them.

Sending goes through `FeedbackOutboxService` (`localStorage` `feedbackOutbox`, only non-empty answers, retried on app start, on `online` and every 30s; 400/409 are dropped). The thanks screen is a white panel with the gray-900 check box, "Danke für dein Feedback!", one sentence and a status line ("Gesendet." or "Noch nicht gesendet – wir senden es, sobald du wieder Netz hast."), then a quiet white row "Noch ein Feedback geben". It shows whenever the page is reopened after sending (`feedbackSubmitted`), unless a new feedback is in progress.

The map's disabled floor arrows (accent-700 at 50% opacity) are an unchanged leftover, recorded, not canonized.

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

## Statistics Kiosk

The kiosk (`kiosk/statistics/`) is a slideshow projected onto a wall in the lit hall. Nobody operates it and nobody touches it: visitors walk past, 3–10 m away, and look for a few seconds. So each slide makes one statement, readable in about two seconds, and there are no buttons, dialogs or error screens. It keeps the kiosk world (Roboto, `accent` orange, `canvas`, the HTL Leonding logo) scaled up for projection: every size is in `vmin`, so a 1920×1080 beamer, a 1280×720 one and a 4:3 screen show the same slide. Light, not dark: in a lit hall the projector's black is the grey wall, so dark type on the light canvas keeps the most contrast. It reads the legacy TadeoT backend only.

### Slides
- **Headline** (`.slide-title`): a statement in 6.4vmin bold gray-900 ("Das interessiert unsere Gäste"), an optional gray-600 note below in 3.2vmin ("Mehrfachnennungen möglich"). No eyebrow, no axis titles.
- **Total:** the count at 40vmin bold, a short accent-500 bar under it, then "haben sich schon angemeldet." (9vmin) and "Mit Begleitung sind das 854 Gäste." (5.6vmin).
- **Bars** (interests, sources, schools, districts): horizontal, sorted, right-aligned labels beside the bars, the value in bold at every bar tip (the wall has no tooltip), optionally followed by a gray-600 unit or share ("17 Gemeinden", "213 · 59 %", "< 1 %" for a real count that rounds to 0). Type steps down with the number of bars (4.6 / 3.9 / 3.4vmin); at most 12 bars, the rest summed as gray "n weitere". Bars are accent-500 (`--bar`) with a rounded data end; on the interests slide the four divisions wear their division colours as-is, the other schools gray-400.
- **Hours:** one row of columns per day (the latest day plus the days with registrations in the week before it, at most 3), on a shared hour axis and one shared scale, the date in bold at the start of each row ("Fr., 21. Nov."), the note names the range ("am 21.–22. November 2025"). Each day's busiest hour is accent-600, the others accent-400, the value on each cap, "14–15 Uhr" below the last row (just "14–15" when more than eight hours).
- **Gender:** the two figures (17vmin) above the ends of one split bar, each named beside a square swatch; two neutral grays (gray-700, gray-400), never blue and pink.
- **Welcome** (no data yet, or no registration yet): the large logo and "Tag der offenen Tür"; only with data and zero registrations also "Hier erscheinen gleich die ersten Anmeldungen."

### Motion and status
- The one authored moment: when a slide comes up, its bars grow from their baseline (1.1s exponential ease-out, 60ms stagger) and the values fade in after them. The outgoing slide fades out in 350ms, the new one fades in. Nothing moves while a slide stands, except the current slide marker filling up. `prefers-reduced-motion` turns all of it off.
- **Status strip** (top, `gray-100`, 9vmin): one 5vmin marker per slide (done gray-500, upcoming gray-300, the current one fills with accent-500 over the slide time), "Stand 14:32" in small gray-600 (with the date once the data is from another day), and the logo pinned on the right. Failures are never shown; "Stand" simply stops moving. The mouse cursor is hidden.

## Do's and Don'ts

### Do:
- **Do** fill GuideApp stop cards and tour band segments with the stop's exact runtime division colour, a left-to-right gradient through the exact colours for several divisions, and No-Division Gray (`guide-no-division`) only when the stop has no division.
- **Do** keep GuideApp tap targets at least 44px, list cards at least 80px, and body text at least 16px.
- **Do** use Action Orange (accent-700) for the one action button on a GuideApp screen, and Selection Orange (accent-600) for the active tab and focus.
- **Do** start every GuideApp page with the night frame: the 56px top bar and a title band with one extra-bold title; subpages get a back link to their parent in the band.
- **Do** show "seen" neutrally in the GuideApp: the gray-900 checkbox, the gray-500 group name, the 12px tour band segment.
- **Do** reserve bottom padding (at least 112px) on every GuideApp page so the fixed tab bar never covers the last card.
- **Do** keep the HTL Leonding logo at the top of both apps (white logo in the night top bar in the GuideApp, nav bar in the dashboard).
- **Do** use DaisyUI component classes (`btn`, `input`, `select`, `table`, `toggle`, `tabs`) in the dashboard and define new colors as theme variables, so dark mode keeps working.
- **Do** start every dashboard page with the shared page header and the `max-w-6xl` shell.

### Don't:
- **Don't** re-tint, desaturate or replace division colors for aesthetic reasons; they are the school's identity.
- **Don't** introduce a second accent color in the GuideApp alongside orange, or use orange for status, counts or decoration.
- **Don't** tint, darken, fade or overlay division fills in the GuideApp, also not for seen stops.
- **Don't** shrink, fade or move GuideApp rows when they are ticked.
- **Don't** use night blue on the GuideApp canvas (text, links, badges); it is the frame only.
- **Don't** add a second motion moment to the GuideApp beyond the tour band growing in.
- **Don't** use orange in the dashboard or dashboard blue in the GuideApp; each app keeps its own accent.
- **Don't** set GuideApp body text below 16px.
- **Don't** add raw hex colors in dashboard templates; extend the `--primary-*` / `--background-*` variables so both themes stay in sync.
- **Don't** put two `btn-primary` buttons in one dashboard toolbar, form or dialog.
- **Don't** use the filled blue field style for form inputs, or a placeholder in place of a label.
