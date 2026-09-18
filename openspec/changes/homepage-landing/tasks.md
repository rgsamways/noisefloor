## 1. Theme

- [ ] 1.1 Add IBM Plex Sans/Mono via Google Fonts link in `apps/web/index.html`; verify fonts load (network tab / rendered font)
- [ ] 1.2 Re-theme `apps/web/src/index.css`: ink/paper/body-grey/caption-grey tokens, `--font-sans`/`--font-mono` set to the Plex stacks, remove the Phase 0 placeholder dark theme and accent tokens; verify existing pages (`SignIn`) still render (no broken class references)

## 2. Stub chart (packages/dashboards)

- [ ] 2.1 Add `packages/dashboards/src/crm/LinkCapacityChart.tsx`: fixed demo data (48 bars, used/remaining split), mono header, legend, prompt caption, per `homepage/DESIGN-NOTES.md` §"The chart on the homepage"; comment marking it explicitly as a stub superseded by Phase 1; verify it renders as real DOM elements (spec requirement: not a static image)
- [ ] 2.2 Export it from `packages/dashboards/src/index.ts`; verify `pnpm --filter @noisefloor/dashboards typecheck` passes

## 3. Site chrome

- [ ] 3.1 Add `apps/web/src/components/BottomNav.tsx`: Home/Cases/Gotchas/Me, laptop and phone layouts via responsive classes, active-item lift + tick, `aria-current="page"` on the active item; verify each item is a real `<a>`/`Link` element with an accessible name
- [ ] 3.2 Add it to every existing route's rendered output (landing and the relocated `/me` placeholder at minimum); verify it appears on both

## 4. Landing page

- [ ] 4.1 Add `apps/web/src/pages/Landing.tsx`: top strip (wordmark + sign-in link), hero (headline/sub/CTA + stub chart), three-column Play/Build/Prove section, per `homepage/DESIGN-NOTES.md`; verify it matches the mockups' content and structure at both a laptop and a phone viewport width
- [ ] 4.2 Wire `/` to `Landing` (public, no `RequireAuth`) in `apps/web/src/App.tsx`; verify an unauthenticated request to `/` renders it directly, no redirect to `/sign-in`
- [ ] 4.3 Move the existing authenticated placeholder from `/` to `/me`, still behind `RequireAuth`; verify a signed-in visit to `/me` still shows it and an unauthenticated visit redirects to `/sign-in`

## 5. Verification

- [ ] 5.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 5.2 Manually verify every scenario in `specs/landing-page/spec.md` against the running app (`pnpm dev:web`)
