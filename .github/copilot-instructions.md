# AI Coding Assistant Instructions

This is a Next.js 14 digital menu application for restaurants with AI chatbot integration using Google Gemma 3 SuperTo.

## Core Architecture

- **Framework**: Next.js 14 with App Router (`src/app/`)
- **AI Integration**: Google Generative AI with fallback chain (Gemma 3 SuperTo → Gemma 3 Flash → Gemini 1.5 Flash)
- **Database**: Supabase with Edge Functions
- **Styling**: Tailwind CSS 4 with extensive custom animations
- **State Management**: React Context (`CartContext`, `AccessibilityContext`)
- **Deployment**: GitHub Pages with static export

## Key Data Structures

The app centers around the `Restaurant` interface defined in `src/components/data/index.ts`:
- `Restaurant` contains `menu_items[]`, `featured_dishes[]`, and metadata
- `MenuItem` includes pricing (Brazilian format: "35,00"), ingredients, allergens, and optional `complement_groups`
- Cart system uses `CartItem` with selected complements and quantity tracking

## Component Patterns

### Naming Convention
- Animated components: `Animated*` prefix (e.g., `AnimatedDishCard.tsx`)
- Modal components: `*Modal` suffix with accompanying CSS files
- Demo components: `*Demo` suffix for development/testing

### Animation System
- Custom Tailwind animations defined in `tailwind.config.js` (fade-in-up, bounce-in, etc.)
- Framer Motion for complex interactions
- CSS files for specialized animations (`dishModal.css`, `journalFlip.css`)

### Hooks Architecture
- `useWebLLM.ts`: Manages AI chat with dish extraction from responses
- `useTextToSpeech.ts`: Voice synthesis with Portuguese support
- `useModalScroll.ts`: Scroll behavior management for modals

## AI Chat Implementation

The chatbot (`ChatBot.tsx`) integrates with:
1. **Primary**: Supabase Edge Function at `/ai-chat` endpoint
2. **Fallback**: Local API route at `/api/ai/chat/route.ts`
3. **Dish Extraction**: Parses AI responses to recommend menu items visually

Restaurant data is injected into AI context for accurate recommendations.

## Configuration Specifics

### Next.js Setup (`next.config.js`)
- Static export for GitHub Pages deployment
- Webpack config for Tone.js compatibility (`self: 'global'`)
- Unoptimized images for static hosting

### Environment Variables
Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_AI_API_KEY`
Optional: PostHog and OpenReplay analytics keys

## Development Workflows

### Testing Scripts
- `test-gemma3.js`: Verify AI model functionality
- `test-voice.js`: Test text-to-speech features
- `test-waiter-call.js`: Validate notification system

### Build Process
- `npm run build`: Generates static export with `.nojekyll` file
- `npm run deploy`: Deploys to GitHub Pages via gh-pages

## Critical Integration Points

1. **Cart System**: Persistent localStorage with version control and 7-day expiry
2. **Analytics**: PostHog and OpenReplay integration in `Analytics.tsx`
3. **Accessibility**: Dark mode, voice features, and accessibility context
4. **WhatsApp Integration**: Cart sharing via `CartWhatsAppButton.tsx`

## File Organization Patterns

- Route-specific components in `src/app/[route]/` directories
- Shared components in `src/components/` with logical grouping
- Type definitions centralized in `src/types/` and component co-location
- Service layer in `src/services/` for external API calls

When working with this codebase, always consider the restaurant context, maintain the Brazilian Portuguese localization, and ensure accessibility features remain functional.