# TypeScript Types

Core data models and interfaces.

## Files

| File | Purpose |
|------|---------|
| `site.ts` | Site, Review, Category, Payment types |
| `index.ts` | Barrel exports |

## Key Types

```typescript
interface Site {
  id: string;
  url: string;
  name: string;
  categories: string[];
  status: 'pending' | 'processing' | 'published' | 'rejected';
  review?: Review;
  crawlData?: CrawlData;
}

interface Review {
  title: string;
  content: string;  // Markdown
  pros: string[];
  cons: string[];
  rating: number;   // 1-10
}
```

## Usage

```typescript
import type { Site, Review, Category } from '@/lib/types';
```
