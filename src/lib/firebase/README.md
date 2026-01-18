# Firebase Integration

Firestore, Storage, and Cloud Functions client APIs.

## Files

| File | Purpose |
|------|---------|
| `config.ts` | Firebase app initialization |
| `sites.ts` | Sites collection CRUD operations |
| `submissions.ts` | Submission handling |
| `adminActions.ts` | Admin-specific Firestore operations |
| `aiActions.ts` | AI pipeline triggers |
| `index.ts` | Barrel exports |

## Collections

- `sites` - Published site reviews
- `submissions` - Pending site submissions
- `users` - User profiles
- `payments` - Payment records

## Usage

```typescript
import { fetchTopSites, fetchNewSites } from '@/lib/firebase';

const topSites = await fetchTopSites(10);
const newSites = await fetchNewSites(10);
```

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```
