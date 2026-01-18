# Review Pages

Dynamic review pages for individual site reviews.

## Route

`/review/[slug]` - SEO-critical dynamic route

## Structure

```
review/
└── [slug]/
    ├── layout.tsx          # Review-specific layout
    ├── page.tsx            # Main review content
    ├── page.module.css     # Page-level styles
    └── styles/             # Modular CSS
        ├── hero.css        # Header/hero section
        ├── gallery.css     # Screenshot gallery
        ├── prose.css       # Review content styling
        ├── verdict.css     # Verdict box
        └── responsive.css  # Mobile breakpoints
```

## Content Sections

1. **Hero**: Site name, rating, categories, favicon
2. **Screenshot Gallery**: Captured site images
3. **Review Content**: AI-generated markdown prose
4. **Pros/Cons**: Bullet list comparison
5. **Verdict**: Final rating and summary

## SEO

- Server-rendered for search indexing
- Dynamic meta tags (title, description)
- Structured data (JSON-LD) ready
- Semantic HTML structure
