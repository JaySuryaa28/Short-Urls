# LinkSnap

A URL shortener with click analytics — shorten links, track clicks by device/browser/OS/country, and share public stats pages.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/url-shortener run dev` — run the frontend (port from $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — express-session secret
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` — Clerk auth
- Frontend env: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PROXY_URL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, wouter, TanStack Query
- API: Express 5, Clerk auth middleware
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Build: esbuild (CJS bundle for API)
- Charts: Recharts
- QR codes: qrcode.react
- User agent parsing: ua-parser-js

## Where things live

- `artifacts/url-shortener/` — React+Vite frontend
- `artifacts/api-server/` — Express 5 API server
- `artifacts/api-server/src/routes/` — url and analytics routes
- `lib/db/src/schema.ts` — DB schema (urls + clicks tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — auto-generated hooks + Zod schemas (do not hand-edit)
- `lib/api-client-react/src/custom-fetch.ts` — base fetch client with cookie-based auth

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas. Never write raw fetch calls in the frontend.
- Cookie-based auth via Clerk: no `Authorization` headers or `getToken()` on the frontend. Clerk proxy middleware handles token forwarding server-side.
- Short URL redirect flow: `/r/:shortCode` is a client-side wouter route that fetches the original URL and redirects with `window.location.href`. This allows click tracking to happen server-side via `/api/redirect/:shortCode`.
- UA parsing happens server-side in the redirect handler using `ua-parser-js` — device type, browser, OS are extracted from the User-Agent header and stored in the `clicks` table.
- Public stats pages (`/public/:shortCode`) require no auth — anyone with the short code can view aggregate click stats.

## Product

- **Dashboard**: Summary stats (total links, clicks, active links, clicks this week) + paginated URL list with search, copy, QR, delete, toggle active, and analytics links.
- **Create URL**: Form with destination URL, optional custom alias, title, and expiry date.
- **Analytics**: Per-URL deep view — daily click area chart (30 days), device/browser/OS/country pie charts, recent clicks table.
- **Public stats**: Public page showing total clicks + 30-day trend — shareable without login.
- **Redirect**: `/r/:shortCode` performs client-side redirect with a brief "Redirecting..." UI.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching frontend code.
- Run `pnpm --filter @workspace/db run push` after any schema change to apply it to the dev DB.
- `tailwindcss({ optimize: false })` is required in `vite.config.ts` to avoid CSS layer ordering bugs with Clerk in production builds.
- The `@layer theme, base, clerk, components, utilities;` declaration must come BEFORE `@import "tailwindcss"` in `index.css`.
- Clerk auth is cookie-based — do NOT call `setAuthTokenGetter` or add `Authorization` headers on the frontend.
- Clerk `<SignIn>` requires `routing="path"` and `path` prop set to the full mounted path including `basePath`.
- Wouter `<Route path="/sign-in/*?">` — the `/*?` is required for Clerk's multi-step routing to work.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
