# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

TadeoTTools serves one event, the HTL Leonding open day ("Tag der offenen Tür", TdoT), from two sides. Both sides carry equal weight in design trade-offs.

**Visitors (public GuideApp, `frontend/`)**
- Prospective pupils (about 14, finishing lower secondary school) and their parents. They use their own phones while walking through the school building on the open day.
- Student guides lead groups through the same app and tick off the stops their group has seen.
- Job: know where to go next, what each stop is about and where its room is, keep track of what they have already seen, and give feedback at the end. No login, no account.

**Organizers (dashboard, `dashboard/`, school Keycloak login)**
- **Admins**: build the one system-wide tour (order of stop groups and stops), manage stops, divisions, students and stop managers, resolve student assignment conflicts, configure the feedback questionnaire, import/export CSVs and toggle feature flags such as the countdown.
- **Stop managers** (teachers or students): maintain the stops assigned to them and see the students working there.
- **Students working the event**: look up the one stop they are assigned to for the day.

## Product Purpose

A digital guide ("Leitfaden") for the open day plus the back office that prepares it. Visitors get one ordered path through the building instead of a paper plan. Organizers get one place to plan stations, staff them and collect visitor feedback. Success means visitors find their way and see what matters to them, organizers can prepare the day without spreadsheets passed around by email, and the feedback is usable for the next year.

## Positioning

It is built for this one school's open day, by HTL Leonding students (5AHIF SYP project, first used in January 2025). It models the event's real structure: divisions (Abteilungen), stop groups, stops with room numbers, the school's floor plans, and the school's own staff and pupils as stop managers and guides. A generic event app would not have that structure.

## Operating Context

- **Open day:** visitors use their phones while moving through corridors and rooms, often with a guide talking to them, and look at the screen only briefly. The PWA is installable and supports swipe gestures. Tour progress is stored only in the browser, and the About page has a reset.
- **Before the event:** admins set up data in the dashboard at a desk, including CSV imports of students, teachers and the station plan (`TdoT_Stationsplanung_*.csv`). Exports are `;`-separated CSV files with a UTF-8 BOM, meant to be opened in Excel.
- **Between events:** the public app can show a countdown to the next open day instead of the tour (`showCountdown` feature flag).
- The dashboard is used only by school members. They log in through the school SSO (Keycloak, `auth.htl-leonding.ac.at`).

## Capabilities and Constraints

- Visitor app pages: tour start (list of stop groups), stop group view, stop detail (description, room, mark as done), floor map with room highlighting (`stockwerk-U/E/1`), feedback form, About/Impressum, countdown.
- Dashboard pages: stop groups (tour order), stops (plus stop manager assignment), divisions (color, image, stops), students (assignments and conflicts), stop managers, user management (admins, stop managers, CSV import/export, wipe, feature flags), feedback configurator (text, rating and choice questions, with conditional dependencies).
- There is one tour for the whole system. Its order (`StopGroup.Rank`, `StopGroupAssignment.Order`) decides what visitors see.
- Feedback is anonymous.
- Terminology (German in the visitor app, English in the dashboard): Station / Stop, Stationsgruppe / Stop Group, Leitfaden (the tour), Abteilung / Division, Stop-Manager, Guide, Tag der offenen Tür / TdoT.
- **Open:** the visitor app is German (du-form toward visitors) and the dashboard is English; neither language choice is a confirmed commitment. Performance targets for low-end phones and poor Wi-Fi were not confirmed as requirements.
- Possible future features (README, not committed): shift planning, queue management, buffet voucher management, a standardized solution for other schools.

## Brand Commitments

- **HTL Leonding identity is binding:** keep the school's name and logo (`dashboard/src/assets/Leonding_Logo.svg`, `frontend/src/assets/logo.png`), and respect the per-division colors and images that admins configure in the dashboard.
- Product name in the visitor app: "Tadeot GuideApp". The repository and system are called TadeoTTools.
- The Impressum links to https://www.htl-leonding.at/impressum.

## Evidence on Hand

- Real floor plans: `frontend/src/assets/stockwerk-U.png`, `stockwerk-E.png`, `stockwerk-1.png`.
- Team photo: `frontend/src/assets/team.png` / `team.jpg`, used on the About page.
- Real station planning data is imported from CSV at startup in Development.
- There are no testimonials, usage statistics or feedback results in the repo. Future work must not invent visitor numbers, quotes or ratings.

## Product Principles

1. **Glanceable on the move.** A visitor walking a corridor should know where to go next and where it is within a second or two.
2. **One tour, curated by the school.** The order is the admins' editorial decision. The visitor app presents it and does not reorganize it.
3. **The school's divisions are the identity.** Division colors and images are real school identity, not decoration to override.
4. **Organizers should prepare the day without busywork.** Bulk import/export, conflict visibility and role-scoped views come before showing every option.
5. **No login for visitors, no hidden tracking.** Progress stays on the device and feedback stays anonymous.
