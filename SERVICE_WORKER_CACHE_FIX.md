# Service Worker Cache Fix Documentation

## Problem
The website was breaking on refresh after new deployments, showing only the "carregando restaurante" page. The issue was caused by the service worker caching Next.js webpack chunks that were deleted during new deployments.

## Root Cause
1. Service worker was caching all requests, including Next.js internal files
2. When a new version was deployed, webpack chunks got new hashes (e.g., `webpack-d3cde24eaa87d3a8.js`)
3. Old chunks were deleted from the server
4. Service worker tried to serve cached old chunks that no longer existed
5. This caused 404 errors and application failures

## Solution

### 1. Updated Service Worker (`public/sw.js`)
- **Cache Exclusion**: Added patterns to never cache Next.js internal files:
  - Webpack chunks (`/_next/static/chunks/webpack-.*\.js$/`)
  - Page chunks (`/_next/static/chunks/pages/.*\.js$/`)
  - CSS files (`/_next/static/css/.*\.css$/`)
  - All other `_next/static` files
- **Automatic Cache Versioning**: Cache version now updates automatically on each build
- **Aggressive Cache Cleaning**: Old caches are cleaned up immediately on activation
- **Better Client Control**: Service worker takes control of all clients immediately

### 2. Automatic Cache Version Updates
- **Build Script**: Created `scripts/update-sw-cache.js` (Node.js) that updates cache version with timestamp
- **Cross-Platform**: Works in GitHub Actions, local development, and any CI environment
- **Package.json**: Added `prebuild` script to run cache update before each build
- **Deployment Process**: Each deployment now gets a unique cache version

### 3. User Experience Improvements
- **Update Detection**: Added `UpdatePrompt` component to notify users of new versions
- **Automatic Refresh**: Service worker can force refresh when caches are cleared
- **Better Error Handling**: Network failures for non-navigation requests fail gracefully

## Files Modified

1. **`public/sw.js`**:
   - Added cache exclusion patterns for Next.js files
   - Implemented automatic cache versioning
   - Added message handling for cache control
   - Improved activation and cleanup logic

2. **`scripts/update-sw-cache.js`**:
   - Node.js script to update cache version with current timestamp
   - Cross-platform compatible (works in GitHub Actions)
   - Runs automatically before each build

3. **`package.json`**:
   - Added `prebuild` script to update cache version

4. **`src/hooks/useServiceWorker.ts`**:
   - Added update detection and handling
   - Added methods for manual cache refresh

5. **`src/components/UpdatePrompt.tsx`**:
   - New component to prompt users for updates

6. **`src/app/layout.tsx`**:
   - Added UpdatePrompt component to global layout

## Usage

### For Development
```bash
npm run build  # Automatically updates cache version and builds
```

### For GitHub Actions / CI
The Node.js script works automatically in GitHub Actions:
```yaml
- name: Build
  run: npm run build  # prebuild script runs automatically
```

No additional setup required - the `prebuild` script runs before the build in any environment.

### For Manual Cache Version Update
```bash
node scripts/update-sw-cache.js
```

### For Users
- Users will automatically get prompted when a new version is available
- They can choose to update immediately or dismiss the prompt
- Hard refresh (Cmd+Shift+R) will always bypass cache

## Testing
1. Deploy a new version
2. Visit the site in a browser
3. Refresh the page - should work correctly
4. Check browser console for service worker logs
5. Verify no 404 errors for webpack chunks

## Prevention
- Always run the build process through `npm run build` for deployments
- The `prebuild` script ensures cache version is updated automatically
- Never manually cache Next.js internal files in service workers
- Use cache exclusion patterns for any dynamic build artifacts

## Monitoring
- Check browser console for service worker logs
- Monitor for 404 errors on `_next/static` resources
- Verify update prompts appear for users on new deployments