# Utility Functions

Helper functions for validation and common operations.

## Files

| File | Purpose |
|------|---------|
| `validation.ts` | URL, email, form validation |
| `index.ts` | Barrel exports |

## Validation Functions

```typescript
import { isValidUrl, isValidEmail, sanitizeSlug } from '@/lib/utils';

// URL validation
isValidUrl('https://example.com') // true
isValidUrl('not-a-url')           // false

// Email validation  
isValidEmail('user@site.com')     // true

// Slug generation
sanitizeSlug('My Cool Site!')     // 'my-cool-site'
```

## Conventions

- Pure functions, no side effects
- TypeScript strict return types
- Focused, single-purpose helpers
