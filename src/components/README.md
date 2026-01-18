# Components

Reusable React components for LustList 411.

## Structure

| Directory | Purpose |
|-----------|---------|
| `layout/` | Page structure (Header, Footer) |
| `ui/` | UI primitives (Button, Badge, Rating, etc.) |

## Usage

Import from barrel files:

```tsx
import { Header, Footer } from '@/components/layout';
import { Button, Badge, Rating, SiteListing } from '@/components/ui';
```

Or from the root:

```tsx
import { Button, Badge, Rating } from '@/components';
```

## Conventions

- Each component has its own folder
- Folder contains: `ComponentName.tsx`, `ComponentName.module.css`, `index.ts`
- CSS modules for encapsulated styles
- Barrel exports for clean imports
- All files under 250 lines
