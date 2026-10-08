---
version: 1
slug: "pp-pages-overview-overview-component-html-de6038b0"
primary_target: "dashboard/src/app/pages/overview/overview.component.html"
related_targets: ["dashboard/src/app/pages/overview/overview.component.ts"]
---

# Admin Overview (`/overview`)

Mode: Operate. Admin landing page of the dashboard (replaces `/students` after login).

- Audience: admins at a desk in the weeks before the open day.
- Job: "What still stands between us and a ready open day?" Every gap links to where it is fixed; an empty list means ready.
- Data: one admin-only `GET /v1/api/overview`; no invented numbers, no trends.
- Decisions: staffing/room/description gaps and students without a request are quieter hints (every name listed, no "and N more"), below the to-dos (conflicts, pending requests, stops invisible to visitors, empty/hidden groups). Page title "Overview". Countdown toggle asks for confirmation because it replaces the tour for visitors.

## Direction contract

THESIS: The readiness of the open day, read as a short to-do list over the tour itself. Refuses the KPI-tile wall (big number cards with icons) that admin landings default to.

OWN-WORLD: The existing dashboard world: Office Gray ground, Office Gray panels lifted by shadow, Dashboard Blue primary, system sans, 14px body, DaisyUI controls, assignment-state colours (Approved green, Pending teal, Conflict orange, Unassigned gray), runtime division colours untouched. Numbers set in tabular figures.

STORY: Admin sees in one sentence whether anything is open, works the to-do rows top-down (each row: count, what it means for visitors, one link), glances at figures, and checks the tour ribbon for gaps.

FIRST VIEWPORT: Left-aligned "Overview" title (as on the stop manager page) with the status sentence beneath. Left two-thirds: to-do list panel, then quieter hints. Right third: "At a glance" figures incl. the student state bar, countdown state with toggle, quick actions. Below the to-dos, left two-thirds: the tour ribbon (the aside spans both rows).

FORM: Code-led extension inside the established dashboard world (no concept roll; structure pinned in shape). Signature move: the tour ribbon, every stop a tile in its exact division colour(s), grouped in tour order, stops with gaps marked, each tile a link to its stop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
