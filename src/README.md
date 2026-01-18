# Source Directory

Main application source code for LustList 411.

## Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js 14 App Router pages and layouts |
| `components/` | Reusable React components (layout + UI) |
| `lib/` | Utilities, hooks, Firebase integration, types |
| `styles/` | CSS modules and design tokens |

## Architecture

```
src/
├── app/               # Route pages (SSR for SEO)
│   ├── layout.tsx     # Root layout with Header/Footer
│   ├── page.tsx       # Homepage
│   ├── admin/         # Admin panel (protected)
│   ├── review/[slug]/ # Dynamic review pages
│   ├── sites/         # Directory listings
│   └── submit/        # Site submission form
├── components/        # Modular components
│   ├── layout/        # Header, Footer
│   └── ui/            # Button, Badge, Rating, etc.
├── lib/               # Business logic
│   ├── auth/          # Authentication utilities
│   ├── firebase/      # Firestore/Storage API
│   ├── hooks/         # React hooks
│   ├── types/         # TypeScript interfaces
│   └── utils/         # Validation helpers
└── styles/            # CSS architecture
    ├── tokens.css     # Design tokens
    ├── reset.css      # CSS reset
    └── typography.css # Font styles
```

## Conventions

- All files under 250 lines
- CSS modules for component-specific styles
- Barrel exports (`index.ts`) for clean imports
- TypeScript strict mode enabled
