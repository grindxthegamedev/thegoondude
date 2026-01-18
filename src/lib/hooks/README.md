# React Hooks

Custom React hooks for data fetching and state management.

## Hooks

| Hook | Purpose |
|------|---------|
| `useSites` | Fetch site listings with filters |
| `useAdmin` | Admin dashboard data (stats, pending) |
| `useDebounce` | Debounced value for search inputs |

## Usage

```typescript
import { useSites, useAdmin, useDebounce } from '@/lib/hooks';

// Fetch top-rated sites
const { sites, loading, error } = useSites({ 
  sort: 'rating', 
  limit: 10 
});

// Admin dashboard data
const { stats, pending, refetch } = useAdmin();

// Debounced search
const debouncedQuery = useDebounce(searchQuery, 300);
```

## Patterns

- All hooks return `{ data, loading, error }`
- Auto-refetch on dependency changes
- TypeScript strict typing
