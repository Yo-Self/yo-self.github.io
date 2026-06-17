# AGENTS.md — Yoself Digital Menu

> Cardápio digital para restaurantes com chatbot IA, carrinho de compras, checkout via WhatsApp, e PWA instalável.

## Setup

```bash
npm install              # Instalar dependências
npm run dev              # Servidor de desenvolvimento (localhost:3000)
npm run build            # Build de produção (static export → out/)
npm run deploy           # Deploy para GitHub Pages via gh-pages
npx playwright test      # Testes E2E
npx tsc --noEmit         # Verificação de tipos
npx next lint            # Linting
```

### Variáveis de ambiente (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY=your_openreplay_key
```

`NEXT_PUBLIC_*` values are always public in the static browser bundle. Do not put `GOOGLE_AI_API_KEY`, Stripe secret keys, Supabase service role/`sb_secret_*`, webhook secrets, CI tokens, or Telegram bot tokens in public env vars or the GitHub Pages build environment. Runtime secrets for AI, payments, and observability belong in Supabase Edge Function Secrets or the approved secrets platform.

## Tech stack

- **Framework**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Backend**: Supabase (Postgres + Edge Functions)
- **AI**: Google Generative AI (Gemini 2.0 Flash) via Supabase Edge Function `ai-chat`
- **Analytics**: PostHog (events, error tracking, LLM analytics), OpenReplay (session replay)
- **Deploy**: Static export (`output: 'export'` in `next.config.js`) → GitHub Pages
- **PWA**: Service Worker (`public/sw.js`), dynamic manifest, installable

## Architecture & data flow

### Static export constraints

`next.config.js` uses `output: 'export'` which means:
- **API routes do NOT work** in production — they are dev-only. The file `src/app/api/ai/chat/route.ts` is dead code in the deployed build.
- Client fetches must handle missing env vars gracefully.
- Images are unoptimized (`images.unoptimized: true`).
- Webpack fallbacks for `fs`, `net`, `tls`, `crypto` are configured for browser compatibility.

### Provider hierarchy

Root layout (`src/app/layout.tsx`) wraps the app in this order:

```
PostHogProvider → LegacyAppWrapper → ErrorBoundary → RestaurantProvider → CartProvider →
  CustomerDataProvider → CustomerCoordinatesProvider → AccessibilityProvider → children
```

Reuse this stack in any new layout. `ThemeScript`, install prompts, and manifest updaters are also rendered in the layout.

### Restaurant data pipeline

1. Client routes (`src/app/restaurant/[slug]/`) use `useRestaurantBySlug` hook
2. The hook runs 6+ sequential Supabase queries: restaurants → categories → dishes → dish_categories → complement groups → complements
3. BRL prices are formatted in the transformer — extend menu data there, not in UI components
4. `RestaurantClientPage` owns view state (grid/list mode, tutorial overlays via `localStorage`, sorting via `SortModal`)
5. `useRestaurantList` provides lightweight rows for the restaurant switcher only

### Cart system

- State lives in `src/context/CartContext.tsx` with multi-restaurant support and `localStorage` persistence
- Calculate totals with `CartUtils.calculateUnitPrice` and generate IDs with `CartUtils.generateItemId` — don't write new cart math
- The `useCart` hook (`src/hooks/useCart.ts`) wraps the context and adds utility methods (`incrementQuantity`, `decrementQuantity`, `isEmpty`, `formattedTotalPrice`)
- `useCartAnimations` exists but currently just re-exports `useCart` (no-op wrapper)

### Customer & address data

- `CustomerDataProvider` and `CustomerCoordinatesProvider` (in `src/contexts/`) persist to `localStorage`
- Call their update helpers instead of touching storage directly
- Google Places Autocomplete (`GooglePlacesAutocompleteModern.tsx`) handles address input with country restriction to Brazil
- Reverse geocoding uses multiple search strategies (standard, `result_type`, `location_type`) with intelligent filtering

### Table identification (QR Code)

- `TableParamHandler` captures `?table=XX` from URL, saves to `localStorage` as `table_id`, cleans the URL
- Access with `getTableId()` / `clearTableId()` from `src/components/TableParamHandler.tsx`

## AI chatbot system

### Flow

1. User sends message in `IntegratedChatBot` component (the active implementation; `ChatBot.tsx` is legacy)
2. `useWebLLM` hook calls Supabase Edge Function `ai-chat` at `${SUPABASE_URL}/functions/v1/ai-chat`
3. Edge function uses Google Gemini 2.0 Flash with fallback chain: `gemini-2.0-flash-exp` → `gemini-1.5-pro` → `gemini-pro`
4. Responses may contain dish names wrapped in asterisks (`*Dish Name*`) which are parsed into clickable React spans
5. `searchFallback` in the API route provides keyword-based search when AI is unavailable

### AI prompt structure

The AI receives a system prompt with:
- Restaurant name, welcome message, full menu with categories
- Dish details: name, description, price (BRL format with comma), ingredients, allergens, portion info
- Complement groups with prices and selection rules (required/optional, max selections)
- Instructions to respond in Portuguese (Brazil) and reference dishes by wrapping names in asterisks

### Voice

- `useTextToSpeech` locks onto the Luciana voice (pt-BR) and tracks opt-in in `localStorage`
- Trigger speech through `speak()` and respect the `isEnabled` flag

## Supabase Edge Functions

Located in `supabase-functions/`:

### `ai-chat/index.ts`
- Receives: `{ message, restaurant, history?, distinct_id?, trace_id? }`
- Returns: `{ message, model, trace_id }`
- Uses Google Generative AI SDK with system prompt containing full menu context
- Integrates PostHog LLM Analytics (tracks latency, tokens, cost)
- Deploy: `supabase functions deploy ai-chat`
- Required Supabase Edge Function secrets: `GOOGLE_AI_API_KEY`, `POSTHOG_API_KEY`, `POSTHOG_HOST`

### `waiter-calls/index.ts`
- Manages waiter call requests for dine-in tables
- Only renders when `restaurant.waiter_call_enabled` is true
- Components: `WaiterCallButton`, `WaiterCallNotifications`, `useWaiterCalls`

## PIX checkout (InfinitePay, opt-in)

- **Opt-in only**: `restaurants.pix_payment_enabled` defaults to `false`; production restaurants are unchanged until enabled in DB.
- Edge Functions: `infinitepay-checkout` (JWT on), `infinitepay-webhook` (JWT off — called by InfinitePay).
- Client: `InfinitePayPixButton`, `useInfinitePayCheckout`, `useRestaurantPixPayment` — shown only when PIX is enabled for the restaurant.
- Stripe/WhatsApp flows are untouched; PIX button is additive in `CartModal`.
- Deploy: `supabase functions deploy infinitepay-checkout` and `infinitepay-webhook --no-verify-jwt`.
- Webhook security (official docs): validates `order_nsu` + `invoice_slug`, then calls InfinitePay `payment_check` API before marking order paid. See https://www.infinitepay.io/checkout-documentacao

## Checkout flow (WhatsApp)

1. User fills cart → opens `CartModal`
2. `CartWhatsAppButton` validates: restaurant loaded → WhatsApp enabled → phone number configured
3. Creates order via `orderService.createOrder()` (Supabase insert)
4. Generates formatted WhatsApp message with order details
5. Opens `wa.me/{phone}?text={message}` — with popup-blocked fallback via `window.location.href`

## Service worker & caching

- `public/sw.js` skips `_next/static/**` caching and expires entries after ~1h
- Cache version is updated automatically by `scripts/update-sw-cache.js` (runs as prebuild)
- `ErrorBoundary` component detects cache corruption and offers recovery options
- Legacy cleanup: `LegacyAppWrapper`, `ServiceWorkerCleanup`, `useLegacyAppDetection` — reuse these to avoid orphaned service workers

## Analytics integration

### PostHog
- Provider in `src/components/PostHogProvider.tsx` with `capture_exceptions: true` for auto error tracking
- Analytics helper class in `src/lib/analytics.ts` — use `Analytics.track*()` methods for all event tracking
- LLM analytics: `src/lib/posthog-gemini-server.ts` wraps Gemini calls with `$ai_generation` events
- Ad blocker resilience: errors from blocked PostHog requests are silently suppressed

### OpenReplay
- Session replay via `src/lib/openreplay.ts`
- Disabled in development to avoid noise

## Project structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with all providers
│   ├── page.tsx                  # Homepage (landing page)
│   ├── restaurant/[slug]/        # Dynamic restaurant routes
│   │   ├── page.tsx              # Static export compatible page
│   │   ├── RestaurantClient.tsx  # Error boundary wrapper
│   │   └── RestaurantClientPage.tsx  # Main restaurant view
│   ├── api/ai/chat/route.ts      # Dev-only API route (dead code in prod)
│   ├── offline/                  # Offline fallback page
│   └── organization/             # Organization management
├── components/                   # React components (~76 files)
│   ├── IntegratedChatBot.tsx     # Active chatbot (replaces ChatBot.tsx)
│   ├── CartModal.tsx             # Shopping cart modal
│   ├── CartWhatsAppButton.tsx    # Checkout via WhatsApp
│   ├── DishModal.tsx             # Dish detail modal with complements
│   ├── MenuSection.tsx           # Menu grid/list with sorting
│   ├── CategoriesBar.tsx         # Category navigation bar
│   ├── JournalView.tsx           # Magazine-style menu view (1200+ lines)
│   ├── SearchBar.tsx             # Search with integrated chatbot
│   ├── Header.tsx                # Restaurant header with smart title
│   ├── ErrorBoundary.tsx         # Global error recovery
│   └── data/                     # Legacy data types (prefer types/restaurant.ts)
├── context/                      # Global contexts
│   ├── CartContext.tsx            # Multi-restaurant cart with localStorage
│   └── RestaurantContext.tsx      # Current restaurant state
├── contexts/                     # Additional contexts (should be merged with context/)
│   ├── CustomerDataContext.tsx    # Customer form data
│   └── CustomerCoordinatesContext.tsx  # Geolocation data
├── hooks/                        # Custom hooks (~39 files)
│   ├── useCart.ts                 # Cart utilities wrapper
│   ├── useRestaurantBySlug.ts    # Supabase restaurant fetcher
│   ├── useWebLLM.ts              # AI chat (calls Supabase Edge Function)
│   ├── useTextToSpeech.ts        # Voice synthesis (Luciana pt-BR)
│   └── useWaiterCalls.ts         # Waiter call system
├── lib/                          # Libraries and config
│   ├── analytics.ts              # PostHog analytics helper
│   ├── posthog.ts                # PostHog client config
│   └── supabase/                 # Supabase client
├── services/                     # API services
│   ├── orderService.ts           # Order CRUD (Supabase)
│   ├── restaurants.ts            # Restaurant queries
│   └── organizations.ts          # Organization management
├── types/                        # TypeScript types
│   ├── restaurant.ts             # Restaurant, MenuItem, ComplementGroup
│   └── cart.ts                   # CartItem, CartUtils, serialization
└── utils/                        # Utility functions
supabase-functions/               # Supabase Edge Functions
├── ai-chat/index.ts              # Chatbot AI endpoint
└── waiter-calls/index.ts         # Waiter call endpoint
scripts/                          # Build and utility scripts
├── update-sw-cache.js            # Updates SW cache version (prebuild)
├── test-fallback-search.js       # Test AI fallback search
└── ...                           # Other utility scripts
tests/                            # Playwright E2E tests
public/
├── sw.js                         # Service worker
├── manifest.json                 # PWA manifest
└── icons/                        # App icons
```

## Data types (key interfaces)

```typescript
interface Restaurant {
  id: string;
  name: string;
  slug: string;
  welcome_message: string;
  image: string;
  menu_categories: string[];
  featured_dishes: MenuItem[];
  menu_items: MenuItem[];
  waiter_call_enabled?: boolean;
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: string;                    // BRL format: "35,00"
  image: string;
  tags: string[];                   // "Destaque", "Vegano", etc.
  ingredients: string;
  allergens: string;                // "Contém Lactose", "Sem Glúten", etc.
  portion: string;
  complement_groups?: ComplementGroup[];
}

interface ComplementGroup {
  title: string;
  required: boolean;
  max_selections: number;
  complements: Complement[];
}

interface CartItem {
  id: string;                       // Generated via CartUtils.generateItemId
  dish: MenuItem;
  selectedComplements: Map<string, Set<string>>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

## Code conventions

- Language: TypeScript strict mode with `"use client"` directives for client components
- Styling: Tailwind CSS 4 utility classes; dark mode support via `dark:` prefix
- State: React Context + hooks pattern; `useCallback`/`useMemo` for performance
- Prices: Always in BRL string format (`"35,00"`) — parse with `parseFloat(price.replace(',', '.'))`
- Naming: Components in PascalCase, hooks in camelCase with `use` prefix
- Errors: Use `ErrorBoundary` for React render errors; `Analytics.trackError()` for operational errors
- Console output: No `console.log`/`console.warn` in production code — only `console.error` for actual errors
- Security: Never use `dangerouslySetInnerHTML` — render user/AI content as React nodes
- Documentation: Always update the `README.md` file whenever adding or modifying core features (such as API integration hooks, minimum order constraints, PWA manifest updates, or chatbot models) to guarantee that user-facing features stay aligned with technical capabilities.

## Testing

### Playwright E2E tests

```bash
npx playwright test                    # Run all tests
npx playwright test cart.spec.ts       # Run specific test file
npx playwright test --ui               # Interactive UI mode
npx playwright test --project=chromium # Specific browser
```

Tests use `TestHelpers` from `tests/utils/test-helpers.ts` for common operations. Test files are in `tests/` directory.

### Manual verification scripts

```bash
node scripts/test-fallback-search.js   # Test AI fallback search
```

## Known issues & technical debt

- `src/context/` and `src/contexts/` should be merged into one directory
- `ChatBot.tsx` is legacy — `IntegratedChatBot.tsx` is the active implementation
- `useWebLLM.ts` name is misleading (it calls Supabase, not WebLLM)
- `JournalView.tsx` is 1200+ lines and should be split into sub-components
- Multiple duplicate hooks exist (6 geolocation variants, 5 Google Places variants) — only the latest is used
- Types exist in both `src/components/data/` and `src/types/restaurant.ts` — prefer the latter
