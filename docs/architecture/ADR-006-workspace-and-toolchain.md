# ADR-006 — Workspace layout and toolchain versions

**Status:** Accepted (P0) · **Date:** 2026-11-05 · **Owner:** Integrator (root manifests, lockfile, CI)

## Decisions

- **pnpm workspaces + Turborepo**, default isolated `node_modules` (no `node-linker=hoisted`). All versions are pinned exactly, except Expo-managed native packages, which keep the `~` ranges `expo install` chose for SDK 58. The lockfile is committed.
- **Internal packages ship TypeScript source** (`exports: ./src/index.ts`), with no package build step. Next.js transpiles them (`transpilePackages`), Metro and Jest handle them natively, and the API is bundled with esbuild (`apps/api/build.mjs`), which inlines `@smart-parking/*` and keeps third-party deps external.
- Turbo `transit` task: lint/typecheck/test caches invalidate when a dependency package's source changes.

## Versions chosen (registry checked 2026-11-05)

| Tool | Version | Why not latest |
|---|---|---|
| Node | 24 LTS (`.nvmrc`), engines `^22.12 \|\| ^24` | — |
| pnpm | 9.12.0 (installed locally) | pnpm 12 is current. **Recommend upgrading** (pnpm ≥10 blocks dependency install scripts by default); update `packageManager` and lockfile together. |
| TypeScript | **6.0.3** | TS 7.0 (native Go compiler) is out, but `typescript-eslint` supports `<6.1`, and Expo SDK 58 pins `~6.0.3`. |
| ESLint | **9.39.5** | ESLint 10 is out, but `eslint-plugin-react`, `-import` and `-jsx-a11y` (used by the Next/Expo configs) don't declare ESLint 10 support. |
| Next.js / React | 16.4.5 / **19.3.0** | React pinned to Expo SDK 58's version so the workspace has one React. |
| Tailwind (web) | 4.3.4 | — |
| Expo / React Native | SDK 58 / 0.88.1 | — |
| NativeWind (native) | **4.2.7 + Tailwind 3.4.19** | NativeWind 5 is still RC. |
| Zod / TanStack Query | 4.6.7 / 5.105.3 | — |
| Express | 5.3.0 | — |
| Vitest / Jest | 5.1.0 (web, API, packages) / 30 + `jest-expo` (native) | — |
| Prisma (for P1) | **7.10.x** | `latest` dist-tag points at an 8.0 RC; do not adopt an RC for the financial core. P1 DB owner confirms driver adapter + Supabase pooler setup. |

## Known workspace quirks

- NativeWind's Babel preset injects `react-native-css-interop/*` imports, so each native app lists `react-native-css-interop` (same version NativeWind uses) as a direct dependency. Bump the two together.
- TS 6 type-checks side-effect imports, so native apps declare `*.css` in `nativewind-env.d.ts`.
- Tests that create a `QueryClient` use `gcTime: Infinity`, so Jest exits without open timers.

## Design-token precedence note

Near-black values follow `01_MASTER_BUILD_PROMPT.md` (`#0A0A0A` for light ink/action and dark canvas/action-ink), which takes precedence over the v1.3 design-system table (`#111111` / `#0B0B0C`). The difference is visually negligible. The P1 Design System session may propose otherwise through the Integrator.
