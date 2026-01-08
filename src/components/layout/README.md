# Layout Components

Layout components for TheGoonDude.

## Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Header` | Sticky header with logo, nav, and submit CTA | ✅ Done |
| `Footer` | Multi-column footer with links and age warning | ✅ Done |
| `Sidebar` | Category filter sidebar | 🔲 Planned |

## Usage

```tsx
import { Header, Footer } from '@/components/layout';

<Header />
<main>{children}</main>
<Footer />
```

## Structure

Layout components are automatically included in `layout.tsx`:
- Header is sticky at the top
- Footer includes age verification warning
- Main content area between them

## Conventions

- Layout components handle structure, not content
- Use semantic HTML elements
- Responsive by default (mobile-first)
- Keep files under 250 lines
