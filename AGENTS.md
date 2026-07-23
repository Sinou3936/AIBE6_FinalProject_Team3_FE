# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository.

## Commands

```bash
npm install
npm run dev            # dev server at http://localhost:3000
npm run build           # production build + type check
npm run lint             # ESLint
npm run format:check     # Prettier check
npm run format           # Prettier write
npm run start             # run the production build
```

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
```

`NEXT_PUBLIC_USE_MOCK_DATA=true` runs the app against `app/mocks/init` instead of the Spring Boot API — useful when the backend isn't running locally.

Backend endpoint paths never carry an `/api` prefix (team convention) — `NEXT_PUBLIC_API_BASE_URL` must be just the origin.

## Architecture

- Next.js App Router, TypeScript, Tailwind CSS, React 18.
- **Data flow**: `page.tsx` (Server Component) → `app/services` → real mode: `app/lib/api` (`requestJson<T>()` unwraps `ApiResponse<T>.data`, throws `ApiError` on non-2xx / `success: false` / parse failure) / mock mode: `app/repositories` + `app/mocks/init` → `app/mappers` (DTO → domain) → component props.
- Screens never call `fetch` directly and never touch endpoint strings — only `app/services` does. If a route needs backend URLs to change, edit `services` only.
- Only `*Client.tsx` components hold browser state (`useState`, browser events, tabs, search/filter, map/chart rendering, checklist toggling); everything else stays a Server Component.
- `app/types/api.ts` (backend DTO shape) and `app/types/domain.ts` (UI-facing shape) are kept separate even when they look identical — this isolates backend field renames, display-value changes, and Tailwind className mapping from the DTO layer. Mappers in `app/mappers` do the DTO → domain conversion and must not embed new business logic, only shape conversion.
- `app/data` (static UI copy/config, e.g. tab labels, card copy) and `app/mocks/init` (DTO-shaped fake API responses) look similar but serve different purposes — don't mix them up.

## Copy / wording policy (문구 정책)

This service never issues definitive risk verdicts, safety guarantees, or fraud accusations — only fact-based, count-based phrasing.

Avoid: `안전합니다`, `위험 매물입니다`, `허위매물입니다`, `위험도`, `LOW`/`MEDIUM`/`HIGH` grading, point scores (e.g. `점수 80점`).

Prefer: `확인 필요 신호 N개`, `전세가율 82%`, `시세보다 20% 낮은 가격이에요 — 이유를 확인해보세요`, `이 결과는 참고용 정보이며 안전을 보장하지 않습니다`.

## Current screens

`/` (랜딩) · `/home` · `/properties` · `/properties/register` · `/properties/[id]` · `/checklist` · `/contract/upload` · `/contract/result` · `/mypage`

## Deeper reference

- [docs/FRONTEND_STRUCTURE.md](./docs/FRONTEND_STRUCTURE.md) — quick-start structure guide, folder roles, "add a new feature" steps
- [docs/FRONTEND_STRUCTURE_DETAIL.md](./docs/FRONTEND_STRUCTURE_DETAIL.md) — real API vs. mock flow examples, type/mapper conventions, endpoint draft, pre-work checklist
- [README.md](./README.md) — stack summary and getting-started commands
