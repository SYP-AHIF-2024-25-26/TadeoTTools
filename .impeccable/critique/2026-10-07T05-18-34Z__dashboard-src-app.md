---
target: dashboard
total_score: 15
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\htl\\2526\\5AHIF-SYP\\tadeot\\TadeoTTools\\dashboard\\src\\app"
timestamp: 2026-10-07T05-18-34Z
slug: dashboard-src-app
---
Method: dual-agent (A: design-review sub-agent · B: detector sub-agent). Source-based review (no browser tool; the dashboard needs Keycloak and the backend). The P0 and the delete-without-confirmation findings were checked in the code.

# Critique: Organizer Dashboard (dashboard/src/app)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Tour save doesn't wait and shows no result; imports reload the page; empty states flash while loading |
| 2 | Match System / Real World | 2 | Developer labels: "StopGroups", "Ass:/Req:", raw "Accepted/Declined" |
| 3 | User Control and Freedom | 1 | Deletes without asking; no unsaved-changes warning |
| 4 | Consistency and Standards | 1 | Save/Submit/Apply, Approve/Accept, filled vs white filters, random heading levels |
| 5 | Error Prevention | 1 | "Approve All" without count, also approves conflicts; reorder wrong while private groups are hidden |
| 6 | Recognition Rather Than Recall | 2 | Funnel icons and counts help; the tour page hides its stops |
| 7 | Flexibility and Efficiency | 2 | Bulk CSV and filters; no sorting, multi-select, keyboard reorder or linkable filters |
| 8 | Aesthetic and Minimalist Design | 2 | Clean DaisyUI base; every button primary, stacked headings, emoji labels |
| 9 | Error Recovery | 1 | Errors go to console.error or alert() with raw text; error toasts are cyan |
| 10 | Help and Documentation | 2 | CSV hints hidden on mobile; good feedback-editor copy; nothing on conflicts, roles or "Private" |
| **Total** | | **15/40** | **Poor** |

## Design Specificity Verdict

The data model is specific to the school; the interface is a generic DaisyUI admin. The tour is never shown as a tour (group cards with counts only; the sidebar and add-stop dialog aren't wired in). Division colors appear only on the divisions page.
Detector: 6 findings, 1 real (gradient-text in feedback-preview.component.html:16), 5 false (Angular [src]/ngSrc bindings, the loading spinner). Found while checking: the division list image has no alt and a fixed cache-buster value. Two color systems side by side (custom variables and DaisyUI).

## Priority Issues

- [P0] Tour reorder moves the wrong groups while private groups are hidden (onlyPublicGroups=true by default, @if inside the drop list, moveItemInArray on the full array, stop-group-list.component.ts:154); saveChanges doesn't wait, uses forEach(async), no error handling (:169). Fix: map positions back or disable dragging while filtered, wait for the save with a toast, warn on leave, up/down buttons, stops inline. /impeccable harden, /impeccable layout
- [P1] Deletes without confirmation (stop :153, group, division, image, admin admin-overview:28, stop manager); Approve All without count; wipe modal never closes; red delete buttons turn cyan on hover. Fix: one confirmation that names the impact, type-to-confirm with export-first for wipe, count in the bulk button, block self-delete. /impeccable harden
- [P1] No feedback after imports, flags and saves; empty states while loading; feedback title never saved. Fix: toast service, import summary without reload, skeletons. /impeccable harden, /impeccable clarify
- [P1] Contrast: white on #73abea 2.4:1, white on #4590e6 3.3:1, warning button 1.5:1, Pending 1.9:1; unlinked labels; span/div controls; unnamed icon buttons; modals without dialog role, focus trap or Esc; no keyboard alternative to drag; dark-mode delete button invisible. /impeccable audit, /impeccable harden
- [P2] Phones: empty hamburger for non-admins, theme switch doesn't show the saved state, long desktop form for stop managers, ambiguous student page, no wildcard route. /impeccable adapt, /impeccable distill

## Persona Red Flags

- Alex: no sorting, no multi-select, filters can't be linked, only an eye icon opens a stop, mouse-only reorder.
- Sam: unnamed icon buttons, span/div controls, no focus trap, status by color only, 2.4:1 placeholders.
- Admin, the week before: import goes to the wrong tab with no summary, mixed CSV header languages, tour without stops, conflict stays after Reject, lands on /students after login.
- Teacher stop manager on a phone: empty hamburger, empty-state flash, added students lost unless saved at the bottom, no save confirmation.
- Student: irrelevant welcome headline, ambiguous "possible stops", inconsistent status words, no contact.

## Minor Observations

Fixed cache-buster, missing alt, th.flex, label for/id mismatch, group selector commented out, Add Stop collides with the title, getStudentCounts called 4× per row, lang="en"/mixed languages, fragile ngModel + click toggle, ngClass/ngStyle/@HostListener/@Input leftovers.

## Questions to Consider

- Why is there no screen showing the tour the way a visitor walks it?
- A "Bereit für den TdoT?" start page?
- Should Reject ever leave a student marked as a conflict?
- One card instead of a full dashboard for students?
