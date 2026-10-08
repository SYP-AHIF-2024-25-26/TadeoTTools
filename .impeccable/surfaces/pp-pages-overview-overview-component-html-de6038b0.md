---
version: 1
slug: "pp-pages-overview-overview-component-html-de6038b0"
primary_target: "dashboard/src/app/pages/overview/overview.component.html"
related_targets: ["dashboard/src/app/pages/overview/overview.component.ts"]
---

# Admin Overview (`/overview`)

Mode: Operate. Admin landing page of the dashboard (replaces `/students` after login).

- Audience: admins at a desk in the weeks before the open day.
- Job: see every stop with its students (tour groups and internal stops), the student states, the visitor app switch and feedback. Each figure links to where it is changed.
- Data: one admin-only `GET /v1/api/overview`; no invented numbers, no trends.
- Decisions (#64, #66): no to-do list, no hints, no shortcuts. Internal stops (hidden groups, no group) are shown, but apart from the tour. Page title "Overview". Countdown toggle asks for confirmation because it replaces the tour for visitors.

## Direction contract

THESIS: The open day read off its stops: every stop group with its student totals, open it for the stops.

OWN-WORLD: The existing dashboard world: Office Gray ground, Office Gray panels lifted by shadow, Dashboard Blue primary, system sans, 14px body, DaisyUI controls, assignment-state colours (Approved green, Pending teal, Conflict orange, Unassigned gray), runtime division colours untouched. Numbers set in tabular figures.

STORY: Admin scans the stop group totals, opens a group to see which stops lack students, follows the student state links to resolve conflicts and pending requests, and checks the visitor app switch and feedback.

FIRST VIEWPORT: Left-aligned "Overview" title. Left two-thirds: "Stops and their students" (total stops large top right, "N in the tour" below), collapsible rows per public stop group in tour order plus an "Internal stops" row. Right third, stacked: "Students" (total, state bar, legend links), "Visitor app" (countdown toggle; feedback below it, the block links to the questions). On mobile the right cards come first.

FORM: Code-led extension inside the established dashboard world. Signature move: stop chips, a stripe in the stop's exact division colour(s) (gray for internal stops without a division), the name, approved students, pending in brackets, a dot for gaps; each chip links to its stop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
