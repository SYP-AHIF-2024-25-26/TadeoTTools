---
target: frontend
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\htl\\2526\\5AHIF-SYP\\tadeot\\TadeoTTools\\frontend\\src\\app"
timestamp: 2026-10-07T05-02-28Z
slug: frontend-src-app
---
Method: dual-agent (A: design-review sub-agent · B: detector sub-agent). Browser step skipped (no browser automation was available); source-based review because the backend wasn't running.

# Critique: Visitor GuideApp (frontend/src/app)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No loading, empty or error states; group progress hidden until first tick; feedback thank-you shown before the request is sent |
| 2 | Match System / Real World | 3 | German, real terms; English "Home" in breadcrumb, unlabeled floor arrows |
| 3 | User Control and Freedom | 2 | Reset wipes localStorage without confirmation; "Zur Station" uses history.back() |
| 4 | Consistency and Standards | 2 | du / Sie / English mixed; back buttons gray vs orange; orange used for destructive reset |
| 5 | Error Prevention | 1 | Swipe on feedback loses answers; no reset confirm; group and stop ticks can contradict each other |
| 6 | Recognition Rather Than Recall | 2 | Icon-only nav; no division legend; room only on detail page |
| 7 | Flexibility and Efficiency | 2 | Swipe and PWA help; no "next stop", no room on cards |
| 8 | Aesthetic and Minimalist Design | 2 | ~200px header everywhere, welcome gradient repeated on map, five ways back on detail page |
| 9 | Error Recovery | 1 | Errors go to console only; failed feedback submit looks like success |
| 10 | Help and Documentation | 2 | About page explains pages but is hidden behind an "i"; no first-launch hint |
| **Total** | | **18/40** | **Poor** |

## Design Specificity Verdict

The material is specific to the school (division-colored cards, evening greeting, real U/E/1 floor plans, room-to-map parsing). The layout is generic (Flowbite breadcrumb with English "Home", standard survey wizard, to-do-style white rows). The "Open-Day Programme" idea is not visible yet: no numbering, no room on cards, no "next up", no color legend, no ending.
Detector: 4 findings. 2 real gradient-text (header.component.html:16, next-year-page.component.html:5), on-brand division gradient but repeated on the map. 2 false broken-image (Angular [src] bindings). Missed by the detector: division images have no alt.

## Priority Issues

- [P0] Pinch-zoom disabled (index.html:10 user-scalable=no) and the floor plan can't be zoomed or marked. Fix: allow zoom, pinch/pan inside the map, marker on the target room. /impeccable adapt
- [P1] Cards don't say where to go; white text on #70B4D9/#f1a102/#80c076 is 2.1–2.3:1; ticked cards fade to 50% and clip names. Fix: room and number on cards, color as stripe/chip, tick + muted text, legend. /impeccable colorize, /impeccable layout
- [P1] No loading/error/offline states; feedback.component.ts:159 sets isSubmitted before the await with no try/catch; no ngsw dataGroups. Fix: skeletons, retry card, API caching, success only after the POST. /impeccable harden
- [P1] Nav and checkboxes are tiny and unlabeled; checkbox input hidden; cards are div(click); no safe-area padding; html lang="en". Fix: 48px labeled tabs with aria-current, sr-only input, buttons/links, safe-area padding, lang="de". /impeccable adapt (+ /impeccable audit)
- [P2] Stop detail page is a dead end: no mark-as-visited, no next stop, deep links fail, /tour/undefined links. Fix: primary "Als besucht markieren" → "Weiter: …", load by route id, one back control. /impeccable clarify, /impeccable harden

## Persona Red Flags

- Casey: 24px nav targets; a swipe anywhere switches tabs and on feedback throws away answers; blank list on slow connections; content starts ~300px down.
- Jordan: no first-step hint; Info vs Feedback icons ambiguous; two tap targets per card with no cue; orange reset looks like the main action and wipes everything without asking.
- Sam: lang="en", zoom blocked, div-click cards and options, breadcrumb links without href, missing alt texts, low-contrast countdown digits.
- Prospective pupil: cards show group names in admin order with no rooms; no ending; Sie-form break.
- Student guide: can't tick on the detail page; fading cards lose the overview; stale STOP_COUNTS cache gives totals like "3 / 2".

## Minor Observations

theme_color #1976d2 is the Angular default; title/manifest names differ; countdown blank after the date passes; map findIndex -1 for rooms not starting with U, E or 1; feedback progress shows 0% on question 1, 1–10 scale overflows at 360px, autofocus opens the keyboard; getSortedStops sorts in place; *ngIf/ngClass/ngStyle/@HostListener/standalone:true violate the project's Angular rules; About copy says 4. Jahrgang while the credit says 5AHIF.

## Questions to Consider

- Why doesn't the start screen lead with "Als Nächstes: <Gruppe> · Raum X"?
- Should the division color be a stripe or badge rather than the card background?
- What happens at the last tick?
- Would a guide be better served by a shared group state than per-phone ticks?
