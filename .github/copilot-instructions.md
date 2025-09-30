# AI Coding Assistant Instructions

## Quick snapshot
- Next.js 14 App Router project exported statically for GitHub Pages; see `next.config.js` for the `output: 'export'`, Webpack fallbacks, and unoptimized images requirement.
- Runtime is largely client-side: `src/app/layout.tsx` wraps children with `PostHogProvider`, `AccessibilityProvider`, `CartProvider`, `ThemeScript`, and global modals.
- Supabase is the menu source of truth; `src/hooks/useRestaurantBySlug.ts` stitches restaurants, categories, dishes, complement groups, and complements into the `Restaurant` interface from `src/components/data/index.ts` while formatting Brazilian price strings.

## Data + AI flow
- Restaurant routes (`src/app/restaurant/[slug]/`) fetch on the client through `useRestaurantBySlug`; the hook chunks Supabase queries to dodge URL length limits and tolerates missing credentials by surfacing friendly errors.
- Cart state lives in `src/context/CartContext.tsx` with 7-day localStorage persistence, deterministic IDs via `CartUtils`, and analytics hooks—reuse its helpers instead of writing directly to storage.
- Accessibility/theme controls come from `src/components/AccessibilityContext.tsx` plus `ThemeScript.tsx`; update both whenever you add UI-level preferences so meta tags stay in sync.
- Conversational features rely on `useWebLLM.ts`, `ChatBot.tsx`, and `useTextToSpeech.ts`; requests hit the Supabase Edge Function `ai-chat` and fall back to the local API at `src/app/api/ai/chat/route.ts` (Gemini 1.5 Flash). Deployment/fallback procedures are documented in `DEPLOY_EDGE_FUNCTION.md` and `INTEGRATED_SEARCH_LLM.md`.

## UI patterns
- Component naming conventions: animations use the `Animated*` prefix, modals end with `*Modal`, and playground components use `*Demo`; pair specialized CSS (e.g. `dishModal.css`, `journalFlip.css`) with the component.
- Restaurant pages compose `RestaurantClientPage` with menu sections, chat, cart tray, and WhatsApp integrations—follow the same composition to inherit analytics and accessibility wiring.
- Copy, currency, and voice output stay in pt-BR; format prices with comma decimals and respect the existing `MenuItem`/`Restaurant` schema.

## Build + test workflow
- Install and run locally with `npm install` and `npm run dev`.
- `npm run build` executes `node scripts/update-sw-cache.js` (bumps `public/sw.js` cache version) before `next build` and `touch out/.nojekyll`; never bypass this script when preparing deploys.
- Deploy static output via `npm run deploy` (publishes `out/` through `gh-pages`).
- End-to-end tests live under `tests/` with helpers in `tests/utils`; run `npx playwright test`, `npx playwright test --ui`, or project-specific configs. Scripts `test-gemma3.js`, `test-voice.js`, and `test-waiter-call.js` validate AI, TTS, and waiter-call flows.

## Platform specifics
- The service worker (`public/sw.js`) purposefully skips caching `_next/static` assets and expires entries after ~1 hour; adjust exclusion patterns carefully and invoke `node scripts/update-sw-cache.js` whenever caching logic changes.
- Required runtime env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_AI_API_KEY`; analytics keys (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY`) are optional but gate tracking in `src/lib/analytics.ts`.
- Static export means API routes run only in dev or during build; client fetches must handle absent Supabase credentials gracefully, mirroring the error messaging in `useWebLLM.ts`.

## Handy references
- Layout & providers: `src/app/layout.tsx`
- Restaurant data hooks: `src/hooks/useRestaurantBySlug.ts`, `src/hooks/useRestaurantList.ts`
- Cart & analytics: `src/context/CartContext.tsx`, `src/lib/analytics.ts`
- Voice & chat: `src/hooks/useTextToSpeech.ts`, `src/hooks/useWebLLM.ts`, `src/components/ChatBot.tsx`
- Ops & docs: `SETUP_ENVIRONMENT.md`, `DEPLOY_EDGE_FUNCTION.md`, `SERVICE_WORKER_CACHE_FIX.md`, `tests/README.md`