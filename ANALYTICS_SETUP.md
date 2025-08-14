# Analytics Setup Guide

This project includes support for PostHog (analytics) and OpenReplay (session recording).

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# OpenReplay Configuration
NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY=your_openreplay_project_key_here

# Site URL (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. PostHog Setup

1. Create a PostHog account at [posthog.com](https://posthog.com)
2. Create a new project
3. Get your project API key from the project settings
4. Add the API key to your `.env.local` file

### 3. OpenReplay Setup

1. Create an OpenReplay account at [openreplay.com](https://openreplay.com)
2. Create a new project
3. Get your project key from the project settings
4. Add the project key to your `.env.local` file

## Usage

### PostHog Analytics

Use the `usePostHog` hook in your components:

```tsx
import { usePostHog } from '@/hooks/usePostHog'

function MyComponent() {
  const { track, identify, setUserProperties } = usePostHog()

  const handleButtonClick = () => {
    track('button_clicked', {
      button_name: 'cta_button',
      page: 'home'
    })
  }

  const handleUserLogin = (userId: string) => {
    identify(userId, {
      plan: 'premium',
      signup_date: new Date().toISOString()
    })
  }

  return (
    <button onClick={handleButtonClick}>
      Click me
    </button>
  )
}
```

### OpenReplay Session Recording

Use the `useOpenReplay` hook in your components:

```tsx
import { useOpenReplay } from '@/hooks/useOpenReplay'

function MyComponent() {
  const { setUserID, setMetadata, trackEvent } = useOpenReplay()

  const handleUserLogin = (userId: string) => {
    setUserID(userId)
    setMetadata('user_type', 'premium')
  }

  const handleImportantAction = () => {
    trackEvent('important_action_completed', {
      action_type: 'purchase',
      amount: 99.99
    })
  }

  return (
    <div>
      {/* Your component content */}
    </div>
  )
}
```

## Configuration

### Development vs Production

- **Development**: Analytics are disabled by default to avoid noise during development
- **Production**: All tracking features are enabled

### Privacy and GDPR

Both PostHog and OpenReplay respect the `Do Not Track` browser setting by default.

### Customization

You can modify the configuration in:
- `src/lib/posthog.ts` - PostHog settings
- `src/lib/openreplay.ts` - OpenReplay settings

## Available Events

### PostHog Events
- Page views (automatic)
- Button clicks (automatic in production)
- Form submissions (automatic in production)
- Custom events (via `track()` function)

### OpenReplay Events
- Session recordings (automatic)
- User interactions (automatic in production)
- Custom events (via `trackEvent()` function)

## Troubleshooting

### Analytics not working in development
This is expected behavior. Analytics are disabled in development mode to avoid noise.

### Environment variables not loading
Make sure your `.env.local` file is in the root directory and the variable names start with `NEXT_PUBLIC_`.

### TypeScript errors
Make sure you have the latest version of the packages installed:
```bash
npm install posthog-js @openreplay/tracker
```
