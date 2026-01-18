# App Router Pages

Next.js 14 App Router pages for LustList 411.

## Routes

| Route | Description | Type |
|-------|-------------|------|
| `/` | Homepage with hero, categories, top sites | Static |
| `/about` | About page | Static |
| `/contact` | Contact form | Static |
| `/privacy` | Privacy policy | Static |
| `/terms` | Terms of service | Static |
| `/sites` | Main directory listing | Dynamic |
| `/sites/[category]` | Category-filtered listings | Dynamic |
| `/review/[slug]` | Individual review pages (SEO-critical) | Dynamic |
| `/submit` | Site submission form | Interactive |
| `/admin` | Admin dashboard (protected) | Protected |
| `/admin/sites` | Site management | Protected |
| `/admin/users` | User management | Protected |

## File Conventions

- `page.tsx` - Route component
- `layout.tsx` - Layout wrapper (optional)
- `page.module.css` - Route-specific styles

## Key Files

- `layout.tsx` - Root layout with Header/Footer, font imports
- `globals.css` - Global CSS imports (tokens, reset, typography)
- `page.tsx` - Homepage with hero, category pills, site sections
