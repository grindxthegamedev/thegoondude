# Authentication Utilities

Firebase Auth integration and role management.

## Files

| File | Purpose |
|------|---------|
| `adminAuth.ts` | Admin-only authentication guards |
| `roles.ts` | Role constants and permission checks |
| `useAuth.tsx` | Auth state hook with context provider |
| `index.ts` | Barrel exports |

## Usage

```typescript
import { useAuth, isAdmin, AdminOnly } from '@/lib/auth';

// Hook usage
const { user, loading } = useAuth();

// Role checks
if (isAdmin(user)) { ... }

// Guard component
<AdminOnly>
  <AdminPanel />
</AdminOnly>
```

## Roles

- `user` - Standard user, can submit sites
- `admin` - Full access, can manage all content
