---
target: dashboard
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\htl\\2526\\5AHIF-SYP\\tadeot\\TadeoTTools\\dashboard\\src\\app"
timestamp: 2026-10-07T10-24-41Z
slug: dashboard-src-app
---
Method: dual-agent (A: design review · B: detector). Source-based (no browser tool; the dashboard needs Keycloak and the backend). Re-critique after #49 / #50 steps 1–6.

# Critique: Organizer Dashboard (dashboard/src/app), second run

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Tour/editors show saving and unsaved state; Stops, Students, Divisions, Stop Managers, Admins lists show "No … found" while loading or after a failure |
| 2 | Match System / Real World | 3 | School terms; Department vs Division still mixed |
| 3 | User Control and Freedom | 2 | Guards exist; no undo for assignment Remove (saves at once), no guard on Feedback, no confirm on tour Cancel |
| 4 | Consistency and Standards | 1 | Edit = eye/gear/pencil/text; h1/h2/h4 mixed; three confirmation styles; Pending orange/yellow/amber |
| 5 | Error Prevention | 2 | Typed-count Delete All; multi-select assign creates conflicts; Add forms silently no-op |
| 6 | Recognition Rather Than Recall | 2 | Tour page hides group contents; conflict modal omits requester |
| 7 | Flexibility and Efficiency | 2 | No sorting, clickable rows or bulk assign |
| 8 | Aesthetic and Minimalist Design | 2 | Clean but templated; three equal primary buttons on Students |
| 9 | Error Recovery | 2 | Good messages where present; several lists/add forms only log to console |
| 10 | Help and Documentation | 1 | Nothing explains the Pending → Approve workflow or "Private" |
| **Total** | | **19/40** | **Poor** |

## Design Specificity Verdict

Still a generic DaisyUI admin template that manages open-day data. Division colours appear only as small swatches, rooms are a column, the tour is never visible as a whole, nothing answers "are we ready?". The specificity lives in the copy. Detector: the same 6 findings, 1 real (gradient title in the feedback preview, not matching the visitor app), 5 false positives.

Fixed during the critique: the darker primary left dark text at 3.99:1 on the active nav link and "Add Admin" (aa740d4).

## Priority Issues

- [P1] Assignment/conflict workflow can't be completed: conflict = any >1 assignment regardless of status; multi-select assign; conflict modal allows two approvals and lacks context; Approve/Reject/Remove/Back to Pending save at once with no busy state, errors or undo. /impeccable harden, /impeccable clarify
- [P1] Silent loading and failure states on Stops, Students, Divisions, Stop Managers, Admins and the Add forms; login without a role spins forever. /impeccable harden
- [P2] The tour is never visible: group cards show only a count, sidebar tour builder is dead code, stops outside the tour aren't flagged; add a readiness strip. /impeccable shape, /impeccable layout
- [P2] Feedback configurator can lose work: no unsaved guard, native confirm(), drag-only reorder, half-filled conditions dropped, title/subtitle not persisted (open decision). /impeccable harden
- [P2] Consistency: focus ring primary-300 2.1:1, flat --text-* scale, four edit icons, mixed headings, tabs without tablist, placeholder-only fields. /impeccable polish, /impeccable typeset

## Persona Red Flags

Alex: no sorting, 12px edit icons. Sam: unlabelled Add Student fields, title-only icon buttons, tabs without tablist, stop picker without focus move. Admin: no readiness view, conflicts unresolvable, countdown under Import & Export. Teacher on phone: empty hamburger, stop cards without room/counts, no hint that added students need approval. Student: clear status, no date/contact, rounded-2xls typo.

## Minor Observations

app.component loading overlay never shown; console.log in student list; "1 stops"; "format shown below" is above; hard-coded departmentMap; confirmation for a local division removal but none for an immediately saved assignment removal.
