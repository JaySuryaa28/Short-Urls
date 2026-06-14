---
name: Clerk auth setup for React+Vite web apps
description: Non-obvious Clerk wiring for the pnpm monorepo — proxy URL, routing, Tailwind CSS layers, cookie-based auth
---

## Rules

1. **publishableKey**: Use `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` from `@clerk/react/internal`.
2. **proxyUrl**: Assign `import.meta.env.VITE_CLERK_PROXY_URL` unconditionally (empty string in dev is fine).
3. **Sign-in/sign-up route pattern**: Must be `path="/sign-in/*?"` and `path="/sign-up/*?"` — the `/*?` is required for Clerk's internal multi-step routing.
4. **`<SignIn>` props**: Must have `routing="path"` AND `path={\`\${basePath}/sign-in\`}`.
5. **Cookie-based auth only**: Do NOT call `setAuthTokenGetter`, do NOT add `Authorization` headers, do NOT call `getToken()` on the frontend. Clerk uses cookies automatically.
6. **Logout**: `const { signOut } = useClerk()` → `signOut({ redirectUrl: basePath || "/" })`.
7. **Tailwind CSS layers**: `@layer theme, base, clerk, components, utilities;` MUST appear BEFORE `@import "tailwindcss"` in index.css.
8. **Vite config**: Pass `tailwindcss({ optimize: false })` to avoid CSS layer ordering bugs with Clerk in production builds.
9. **ClerkProvider placement**: Wrap inside `<WouterRouter base={basePath}>` — ClerkProvider must be inside the router so it can use `routerPush`/`routerReplace` with wouter's `setLocation`.
10. **Cache invalidation**: Add a `ClerkQueryClientCacheInvalidator` component that uses `addListener` to clear TanStack Query cache when the signed-in user changes.
11. **Appearance**: Set `cssLayerName: "clerk"` in appearance object. Use `@clerk/themes` `shadcn` theme as base.

**Why:** Clerk's proxy setup requires an unconditional proxyUrl (empty in dev triggers the default, non-empty in prod routes through your API). The `/*?` suffix on route patterns is required because Clerk renders sub-routes (e.g. `/sign-in/factor-one`). Missing Tailwind layer order causes Clerk styles to override app styles in production builds.

**How to apply:** Any time Clerk is added to a React+Vite app in this monorepo.
