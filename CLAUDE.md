# CLAUDE.md

## What this is

TadeoTTools manages the HTL Leonding open day ("Tag der offenen Tür"). Four deployables live in one repo, grouped by purpose:

- `backend/` — .NET 10 minimal API + EF Core on PostgreSQL
- `dashboard/` — Angular 22 admin app (Keycloak login) for admins, stop managers and students
- `guide/` — the GuideApp: Angular 22 public PWA for visitors/guides (no login). Docker image is still named `frontend`.
- `kiosk/` — one folder per kiosk app for fixed devices (Angular 19):
  - `kiosk/feedback/` — exit tablets: students enter visitor feedback. Talks to `backend/`, no login. Image `feedback`; see `kiosk/feedback/README.md`.
  - `kiosk/registration/` — entrance tablets: students register arriving visitors. **Talks to the legacy TadeoT backend** (`…/tadeot-api/api/`, separate repo `htl-leo-tadeot`, must stay unchanged), not to `backend/`. Saving needs a connection (no outbox). Image `registration`; see `kiosk/registration/README.md`.
  - `kiosk/cashier/` — buffet counter ("Kassa", replaces the legacy `kassa` app). Sells through `backend/` (`GET /v1/buffets`, `POST /v1/orders`, both `IsCashier`) with a Keycloak login; access is checked at startup via `GET /v1/users/is-cashier`, and an interceptor sends the token with every request. Sales go through a `localStorage` outbox; `POST /v1/orders` is idempotent on `orderNumber`; 400/404 responses are **kept** as "nicht übertragbar" (real money), 401/403 keep the sale queued and send the student back to the login. Products, buffets and menus are managed on the dashboard page `/buffet`. Until 20.11.2026 the legacy backend stays the fallback (pin the old cashier image); the buffet import keeps the legacy ids for that. Image `cashier`, served under `/kassa`; see `kiosk/cashier/README.md`.
  - `kiosk/statistics/` — unattended slideshow of visitor statistics for the hall projector (replaces the legacy `statistics` app). **Reads the legacy backend**, never writes. Image `statistics`, served under `/statistics`; see `kiosk/statistics/README.md`.

CI (`docker-build-push-images.yml`) maps image names to folders in its "Resolve source folder" step; a new kiosk app needs a filter entry there, a `docker pull` line in `deploy-to-vm.yml`, an AppHost resource and (only if it talks to `backend/`, like feedback and cashier) an `AllowedOrigins` entry.

Project docs (`README.md`, `TadeotTools_Dokumentation.md`) are written in German; the latter has the full endpoint list, page list and data model description.

**Functional specification** — `spec/fsd.md` (German) is the agreed behaviour of the whole system: roles and rights, data rules, each app and kiosk, priorities. Read the sections for the area you work on before changing behaviour. Requirements marked **(Lücke)** are decided but not built yet; they are also listed in §18 (Soll/Kann), and §19 holds the points still open. When you close a gap, remove its **(Lücke)** marker and update §18 in the same change; when the code and the FSD disagree, ask instead of picking one. `spec/questions.md` and `spec/answers.md` record how each decision was made (same numbering). `spec/README.md` holds the OpenSpec plan: not set up before the open day (20.11.2026), only the (Lücke) rule applies until then.

## Commands

### Run everything (Aspire)

```bash
cd guide && npm i
cd ../dashboard && npm i
cd ../kiosk/feedback && npm i
cd ../registration && npm i
cd ../cashier && npm i
cd ../statistics && npm i
cd ../../backend/AppHost && dotnet run
```

`AppHost` starts the API plus all Angular apps (`npm start` in each) and injects the API URL and a `PORT`.

- AppHost does **not** start a database (the Postgres resource is commented out). The API expects PostgreSQL at `localhost:4100`, database `tadeot`, user `root` / password `test` (`backend/API/appsettings*.json`).
- `npm start` in any Angular app only works under Aspire: it needs `$PORT` and `services__api__http(s)__0`, and `update_base_url.js` **overwrites the tracked file** `src/environments/environment.development.ts` with the Aspire-assigned URL. Don't commit that change. To run an app standalone, use `npx ng serve` instead.

### Backend

```bash
cd backend
dotnet build backend.sln
dotnet run --project API                      # Swagger at /swagger in Development
dotnet test backend.sln
dotnet test TadeoTIntegrationTests            # xUnit, needs Docker running (Testcontainers Postgres)
dotnet test TadeoTUnitTests                   # NUnit
dotnet test TadeoTIntegrationTests --filter "FullyQualifiedName~StopManagementTests.CreateStop_ShouldReturnOk_WhenStopIsValid"
```

EF migrations: `dotnet-ef` is a local tool (`dotnet tool restore` in `backend/`). Migrations live in `Database/Migrations` and are applied automatically at API startup (`Database.MigrateAsync()`).

### Angular apps

```bash
npm run build      # production build (every app)
npm run format     # prettier incl. tailwind class sorting (every app)
npm run lint       # every app except dashboard (angular-eslint)
```

No app has `*.spec.ts` files; guide's `test` script has nothing to run.

### CI/CD

Pushing to `main` builds and pushes the Docker images (one per app folder that changed) to GHCR, then auto-deploys to the staging VM (`.github/workflows/`). CI does not run any tests. Production deployment is manual. `example-docker-compose.yml` shows the runtime shape and env vars.

## Backend architecture

`backend.sln` projects: `API`, `Database`, `AppHost` (Aspire), `ImportConsoleApp` (drops/recreates the DB and imports the planning CSV), `TadeoTIntegrationTests`, `TadeoTUnitTests`.

**Endpoint layout** — each feature folder under `API/Endpoints/<Feature>Management/` has up to three static classes:

- `*Api.cs` — `Map<Feature>Endpoints()` extension: routes, auth policy, `Produces`, endpoint filters. Must be registered in `Program.cs`.
- `*Endpoints.cs` — handlers plus request/response DTO records (nested in the class). Handlers take `TadeoTDbContext` directly and query it with EF; there is no service/repository layer.
- `*Validations.cs` — endpoint filters that read arguments **by position** (`context.GetArgument<T>(index)`). Changing a handler's parameter order silently breaks its filter.

Shared query helpers and DTOs used by several endpoints sit in `Database/Repository/Functions/*Functions.cs` (static methods taking the context).

**Route convention** — everything is under `/v1`. `/v1/api/...` is the authenticated management surface used by the dashboard; `/v1/...` without `api` is what the GuideApp and kiosks read (`/v1/stops`, `/v1/groups`, `/v1/divisions`, `/v1/feedback-questions`, `/v1/featureflags/{name}`).

**Auth** (`API/Setup.cs`) — JWT bearer against the school Keycloak (`auth.htl-leonding.ac.at`, realm `htlleonding`) via the `LeoAuth` package. Roles are **not** taken from the token: the `IsAdmin` and `IsStopManagerOrAdmin` policies look up the token's `preferred_username` (case-insensitive) in the `Admins` / `StopManagers` tables. A user is only an admin if a row exists in `Admins`. `IsCashier` allows a LeoAuth teacher, an admin, or a student with an ACCEPTED assignment to the stop named "Buffet"; `Student` is a plain LeoAuth role check. The seeding described in `API/SETUP.md` (`appsettings.Local.json`, `SeedData:InitialAdminId`) is currently commented out in `Program.cs` and that file is not loaded.

**Startup behaviour** (`Program.cs`) — applies migrations; in Development it also imports `Students.csv`, `Teachers.csv` and `TdoT_Stationsplanung_2025.csv` into empty tables. CORS allows any origin in Development, otherwise a static list plus the `AllowedOrigins` config array (AppHost fills this with the Angular app endpoints).

**Errors** — `GlobalExceptionHandler` maps `ValidationException` → 400 and `DbUpdateException` → 409 as ProblemDetails and sets the response status to match. Unique-constraint violations therefore surface as 409 without explicit checks.

**Data model notes**

- `TadeoTDbContext.SaveChanges*` trims every string property on added/modified entities.
- `FeedbackQuestion` is an abstract TPH hierarchy (`FeedbackTextQuestion`, `FeedbackRatingQuestion`, `FeedbackChoiceQuestion`); `FeedbackDependency` makes a question conditional on another question's answer.
- `StopGroup.Order` and `StopGroupAssignment.Order` define the tour order shown in the GuideApp. There is a single system-wide tour.
- `FeatureFlag` rows are runtime toggles read by the GuideApp (e.g. `showCountdown`).
- CSV exports use `;` separators and UTF-8 with BOM (`Endpoints/Utils.cs`).
- Buffet (`Endpoints/BuffetManagement/`): `Buffet`, `Product` (`PriceCents`, negative = voucher), `BuffetProduct` (menu with `Order`), `CashMovement`, `Order` (unique `OrderNumber`) and `OrderItem`, which stores `UnitPriceCents` so later price changes keep the revenue. `POST /v1/api/legacy-import/buffet` (`Endpoints/LegacyImportManagement/`) copies products, buffets and menus from the legacy API (`LegacyApi:BaseUrl`) into empty tables with explicit ids, then moves the identity sequences past them.

**Tests**

- Integration tests derive from `BaseIntegrationTest`: a real Postgres container per test class, schema via `EnsureCreated` (not migrations) and dropped after each test. `FakePolicyEvaluator` makes every request authorized, so these tests never exercise the auth policies.
- In `TadeoTUnitTests`, only `Entities/*` (data-annotation validation tests) are live; the `*FunctionsUT.cs` files are fully commented-out leftovers from the earlier MySQL version.

**Stale files** — `backend/docker-compose.yml` and `assets/docker-compose.yml` still define MySQL; the app is PostgreSQL-only (`UseNpgsql`). README's "MySQL" mention is likewise outdated.

## Angular apps

All six apps are zoneless (`provideZonelessChangeDetection` in dashboard and guide, `provideExperimentalZonelessChangeDetection` in the Angular 19 kiosks), standalone-only, and styled with Tailwind (dashboard additionally DaisyUI). Services wrap `HttpClient` calls in `firstValueFrom` and return Promises. Folder layout: `core/` (services, guards), `pages/` (statistics: `slides/`), `shared/` (components, modals, `models/types.ts`).

**API base URL** — every app injects a `BASE_URL` token defined in `app.config.ts`. In production it comes from `window.__env.backendURL`, written to `env.js` by `docker-entrypoint.sh` from the `BACKEND_URL` container env; otherwise from `environment.apiBaseUrl`. What it points at differs:

- dashboard: `BASE_URL` **includes** `/v1`; services call `${baseUrl}/api/stops`.
- guide and feedback kiosk: `BASE_URL` **excludes** `/v1`; `ApiFetchService` calls `baseURL + '/v1/stops'`.
- cashier: `backend/`, `BASE_URL` **excludes** `/v1`; `authInterceptor` adds the Keycloak token to every request under `BASE_URL`.
- registration, statistics: the legacy backend, `BASE_URL` **excludes** `/api`.

**Kiosks** — no router. `env.js` sits next to `index.html` (dashboard and guide: `assets/env.js`) so the service worker's hash check does not break when the entrypoint rewrites it. `<base href="./">` is relative on purpose: the service worker resolves the `./` paths in `ngsw.json` against its scope, so one image works at `/` and behind any path prefix.

**Path aliases** — dashboard: `@/*` → `src/app/*`, `@env/*`. Guide: `@app/*`, `@pages/*`, `@core/*`, `@shared/*`, `@env/*`, `@assets/*`.

**Dashboard auth** — `keycloak-angular` with `onLoad: 'login-required'`; the bearer interceptor attaches the token only to URLs matching `BASE_URL`. Route guards decide roles by calling the backend (`/users/is-admin`, `/users/in-database`) rather than inspecting the token, and redirect non-admins to `/stop-manager` or `/student`. Detail pages use a single route with query params (`/stop`, `/stopgroup`, `/division`), not `:id` segments.

**Feedback kiosk** — finished feedback goes through a `localStorage` outbox (`OutboxService`) and is retried until the backend accepts it; 400/409 responses are dropped. Only non-empty answers are sent, since `AddValidation()` rejects empty `Answer` strings.

**Guide state** — no login and no server-side visitor state. Tour progress (finished stops/groups) is kept in the browser under the keys in `shared/constants/constants.ts`. It is a PWA (`ngsw-config.json`) and uses HammerJS for swipe gestures.

### Angular code rules

From `dashboard/.github/copilot-instructions.md`, `guide/.github/copilot-instructions.md` and `.agent/rules/tadeot-angular-code-style.md`:

- Signals for state: `signal()`, `computed()` for derived state, `input()` / `output()` / `model()` instead of decorators. Use `set`/`update`, never `mutate`.
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- Native control flow (`@if`, `@for`, `@switch`) only; no `*ngIf` / `*ngFor`.
- `inject()` instead of constructor injection; services are `providedIn: 'root'`.
- Do not write `standalone: true` (it is the default since Angular 19; the `.agent` rule saying otherwise predates that).
- No `@HostBinding` / `@HostListener` (use the `host` object); no `ngClass` / `ngStyle` (use `class` / `style` bindings).
- Reactive forms over template-driven; `NgOptimizedImage` for static images.
- No `any`; use `unknown` when the type is uncertain.

## Up-to-date documentation

Look up current docs instead of relying on memory:

- .NET, C#, EF Core, ASP.NET Core: the `microsoft-docs` skill.
- Creating an Angular app: the `angular-new-app` skill.
- Before writing a larger piece of Angular code: read the `angular-developer` skill.
- Any other library detail (API signature, config option, how-to): the `find-docs` skill (Context7).
