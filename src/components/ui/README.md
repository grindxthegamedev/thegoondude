# UI Components

Reusable UI components for TheGoonDude.

## Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Button` | Primary, secondary, ghost, danger variants | ✅ Done |
| `Badge` | Category/tag badges (default, hot, new, premium, free) | ✅ Done |
| `Rating` | Star rating display (0-10 scale) | ✅ Done |
| `SiteListing` | 411-style site listing row | ✅ Done |
| `Modal` | Dialog/modal component | 🔲 Planned |
| `Skeleton` | Loading skeleton states | 🔲 Planned |

## Usage

```tsx
import { Button, Badge, Rating, SiteListing } from '@/components';

<Button variant="primary" href="/submit">Submit Site</Button>
<Badge variant="hot">Hot</Badge>
<Rating score={8.5} />
<SiteListing site={siteData} rank={1} />
```

## Conventions

- Each component has its own folder with `index.ts`, `Component.tsx`, and `Component.module.css`
- Export from barrel file (`index.ts`)
- Use CSS modules for component-specific styles
- Rely on design tokens from `tokens.css`
- Keep all files under 250 lines
