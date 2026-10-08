---
version: 1
slug: "pp-pages-overview-overview-component-html-de6038b0"
primary_target: "dashboard/src/app/pages/overview/overview.component.html"
related_targets: ["dashboard/src/app/pages/overview/overview.component.ts"]
---

# Admin Overview (`/overview`)

Mode: Operate. Admin landing page of the dashboard (replaces `/students` after login).

- Audience: admins at a desk in the weeks before the open day.
- Job: see the tour with its students at a glance, plus student states, feedback and the visitor app switch. Each figure links to where it is changed.
- Data: one admin-only `GET /v1/api/overview`; no invented numbers, no trends.
- Decisions (#64): no to-do list, no hints, no shortcuts. Private stops (not in a public group) and hidden groups are intentional and never listed. Page title "Overview". Countdown toggle asks for confirmation because it replaces the tour for visitors.

## Direction contract

THESIS: The open day read off the tour itself: every stop with its students. Refuses the KPI-tile wall (big number cards with icons) that admin landings default to.

OWN-WORLD: The existing dashboard world: Office Gray ground, Office Gray panels lifted by shadow, Dashboard Blue primary, system sans, 14px body, DaisyUI controls, assignment-state colours (Approved green, Pending teal, Conflict orange, Unassigned gray), runtime division colours untouched. Numbers set in tabular figures.

STORY: Admin scans the tour for stops with few approved students or pending requests, follows the student state links to resolve conflicts and pending requests, and checks feedback and the visitor app switch.

FIRST VIEWPORT: Left-aligned "Overview" title (as on the stop manager page). Left two-thirds: the tour card ("The tour and its students", stops in the tour as a large number top right). Right third, stacked: "Students" (total, state bar, legend links), "Feedback" (questions, responses), "Visitor app" (countdown toggle, link to set the date). On mobile the three cards come first.

FORM: Code-led extension inside the established dashboard world (no concept roll; structure pinned in shape). Signature move: the tour ribbon, every stop a tile in its exact division colour(s), grouped in tour order (public groups only), showing approved students in white with pending requests in brackets, stops with gaps marked by a dot, each tile a link to its stop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
