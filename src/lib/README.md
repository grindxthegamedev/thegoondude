# Library & Utilities

Shared utilities, hooks, and integrations for TheGoonDude.

## Structure

```
lib/
├── firebase/       # Firebase integration
│   ├── config.ts   # Firebase app initialization
│   ├── sites.ts    # Sites collection API
│   └── index.ts    # Barrel export
├── hooks/          # React hooks
│   ├── useSites.ts # Sites data fetching hooks
│   └── index.ts    # Barrel export
├── types/          # TypeScript types
│   ├── site.ts     # Site, Review, Category types
│   └── index.ts    # Barrel export
└── index.ts        # Main barrel export
```

## Firebase

Firebase integration for Firestore, Auth, and Storage.

### Configuration
Set environment variables in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Sites API
```typescript
import { fetchTopSites, fetchNewSites, fetchSitesByCategory } from '@/lib/firebase';

const topSites = await fetchTopSites(10);
const newSites = await fetchNewSites(10);
const tubeSites = await fetchSitesByCategory('tubes');
```

## Hooks

React hooks for data fetching with loading and error states.

```typescript
import { useTopSites, useNewSites } from '@/lib/hooks';

const { sites, loading, error } = useTopSites(10);
```

## Types

Core data models:
- `Site` - Site listing with status, rating, category
- `Review` - AI-generated review content
- `Category` - Directory category
