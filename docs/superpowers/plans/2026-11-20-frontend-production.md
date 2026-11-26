# Frontend Production Conversion Implementation Plan

> **For agentic workers:** Follow the task sequence and verify each deliverable before continuing.

**Goal:** Promote the approved customer and operations interface into `apps/web` with maintainable feature boundaries and a replaceable mock/API layer. The migration is complete; the original workspace is archived locally.

**Architecture:** Build the live web application in `apps/web`, grouping UI by feature and shared components separately. Keep seed data and mock behavior out of UI components; expose a typed service boundary with mock and HTTP implementations, and mount routing and query providers at the application root. The pre-migration source can be restored from the local archive noted in `docs/FRONTEND_READINESS.md`.

**Tech Stack:** Existing React 19, TypeScript, Vite, React Router 7, Lucide, Be Vietnam Pro/Lora; TanStack Query 5 as listed in the implementation plan; Node test runner for focused service tests.

**Spec:** `docs/IMPLEMENTATION_PLAN.md` T08 and API outline; `docs/PROJECT_STRUCTURE.md`; `docs/design/UI_UX_SPECIFICATION.md`; `docs/design/SCREEN_LIST.md`; `docs/design/DESIGN_SYSTEM.md`; `docs/design/PROTOTYPE_REVIEW.md`; `docs/BRS-Nha-hang-Ba-Anh-Em.md`.

## Global Constraints

- Preserve the approved UI, routes, interactions, copy, colors, and behavior; do not redesign or change business policy.
- Preserve the approved UI and keep a recoverable backup before removing the original workspace.
- Do not implement backend/database or claim unresolved BRS decisions as settled.
- Keep all mock data clearly separated from UI and services replaceable through a typed contract.
- Do not claim production readiness while authentication, backend, and contract-generation dependencies remain incomplete.

## Review Focus

- Direct-load and refresh of nested public and operations URLs must continue to render the same route.
- Booking, preorder, deposit, chat, and operations updates must continue to share the same mock state.
- Empty, unavailable, conflict, offline, permission, and expired-session states must remain reachable as designed.
- HTTP errors and malformed responses must produce typed, user-safe service errors.
- Layout must not gain horizontal overflow at 320, 375, 768, 1024, and 1368 px.

---

### Task 1: Define and test the frontend service boundary

**Files:** Create `apps/web/src/services/contracts.ts`, `http-client.ts`, `mock-restaurant-api.ts`, and focused `*.test.ts`; update `apps/web/package.json` test script.

- [ ] Add tests for successful JSON response parsing, structured API errors, malformed JSON, mock seed retrieval, reservation creation conflict, and update visibility across reads.
- [ ] Run focused tests and confirm expected failures before implementation.
- [ ] Implement the typed transport, endpoint contracts already listed in `IMPLEMENTATION_PLAN.md`, and mock adapter without inventing unresolved policy.
- [ ] Run focused tests and existing workspace checks.

### Task 2: Establish the production app shell and feature boundaries

**Files:** Create production `app`, `features`, `shared`, `mocks`, and `services` modules under `apps/web/src`; update web entry, index metadata, and dependencies.

- [x] Copy the approved UI modules and styles into feature-oriented production paths; archive the source before removing its workspace.
- [ ] Extract shared model/access/UI and mock fixtures; remove demo-only chrome from the production app while retaining mock scenarios internally only where needed to exercise approved states.
- [ ] Mount the existing router/layout through the production entry and add QueryClientProvider; keep current route paths and route access behavior.
- [ ] Verify TypeScript, route loading, and visual parity on key public and operations pages.

### Task 3: Wire mock services and validation-ready UI state

**Files:** Production provider/state modules and affected feature modules.

- [ ] Route menu, booking, preorder, deposit, chat, and operations mock reads/writes through the service boundary where the current prototype uses seeded domain data.
- [ ] Preserve current visible pending/success/error/empty states and existing form rules; avoid choosing answers for open BRS questions.
- [ ] Add regression tests for shared state and critical workflow behavior before adapting each mutation path.
- [ ] Run tests after each migrated workflow and check type/lint.

### Task 4: Verify, document API contract, and record readiness

**Files:** `docs/design/api-contract.md`, `FRONTEND_READINESS.md`, `docs/IMPLEMENTATION_PLAN.md`.

- [ ] Document screen inputs/outputs, endpoint mapping, request/response envelope, error codes, validation ownership, mock mode, and unresolved contract decisions.
- [ ] Run lint, formatting, typecheck, unit tests, production build, and browser checks for routes and viewport sizes.
- [ ] Compare key screens to the approved Prototype and record any differences or unverified criteria.
- [ ] Mark T08 only partially complete until server-generated OpenAPI/client, real authentication, and real API smoke checks are available.
