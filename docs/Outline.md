# LustList 411 - Project Outline

> AI-Powered NSFW Site Directory with Autonomous Reviews

---

## 🎯 Vision

A premium directory for adult websites where AI agents autonomously crawl, analyze, and publish PornDude-style reviews. Users pay a $20 fee to submit their sites for review.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 + React 18 | SSR for SEO, App Router |
| **Styling** | Vanilla CSS Modules | Per user preference, modular |
| **Backend** | Firebase Cloud Functions | Serverless API |
| **Database** | Firestore | NoSQL, real-time |
| **Auth** | Firebase Auth | User management |
| **AI** | Gemini via Vertex AI | Review generation |
| **Crawling** | Puppeteer/Playwright | Site screenshots, SEO extraction |
| **Hosting** | Firebase Hosting | Fast CDN |
| **Payments** | TBD (not Stripe) | $20 submission fee |

---

## 🤖 AI Agent Pipeline

### Stage 1: Crawler Agent
- Navigate to submitted URL
- Take screenshots (homepage, key pages)
- Extract SEO metadata (title, description, keywords)
- Check mobile responsiveness
- Measure page load speed
- Detect content categories/niches

### Stage 2: Analysis Agent (Gemini)
- Analyze screenshots for content type
- Evaluate design quality and UX
- Identify unique features
- Generate pros and cons list
- Calculate rating scores (1-10)

### Stage 3: Writer Agent (Gemini)
- Generate PornDude-style review
- Witty, opinionated, detailed prose
- Structure: Intro → Features → Pros/Cons → Verdict
- SEO-optimized title and meta description
- ~800-1200 words

### Stage 4: Publisher
- Store review in Firestore
- Update site status to "published"
- Trigger any notifications

---

## 📊 Data Models

### Site
```typescript
interface Site {
  id: string;
  url: string;
  name: string;
  description: string;
  categories: string[];
  tags: string[];
  status: 'pending' | 'processing' | 'published' | 'rejected';
  submittedBy: string;
  submittedAt: Timestamp;
  paymentId: string;
  paymentAmount: number; // $20
  crawlData?: CrawlData;
  review?: Review;
  publishedAt?: Timestamp;
}
```

### CrawlData
```typescript
interface CrawlData {
  screenshots: string[]; // Storage URLs
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  performance: {
    loadTime: number;
    mobileScore: number;
  };
  detectedCategories: string[];
  crawledAt: Timestamp;
}
```

### Review
```typescript
interface Review {
  title: string;
  content: string; // Markdown
  excerpt: string; // 150 chars for cards
  pros: string[];
  cons: string[];
  rating: number; // 1-10
  generatedBy: 'ai' | 'manual';
  generatedAt: Timestamp;
  editedAt?: Timestamp;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  submissions: string[]; // Site IDs
  createdAt: Timestamp;
}
```

### Payment
```typescript
interface Payment {
  id: string;
  userId: string;
  siteId: string;
  amount: number; // 20.00
  status: 'pending' | 'completed' | 'refunded';
  processor: string; // e.g., 'crypto', 'ccbill', etc.
  processorRef: string;
  createdAt: Timestamp;
}
```

---

## 📄 Pages

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage - Hero, featured sites, category grid |
| `/sites` | Directory listing with filters |
| `/sites/[category]` | Category-specific listings |
| `/review/[slug]` | Individual review page (SEO-critical) |
| `/submit` | Submission form + payment |
| `/about` | About the directory |
| `/contact` | Contact form |

### Protected Pages
| Route | Description |
|-------|-------------|
| `/dashboard` | User dashboard - submissions |
| `/admin` | Admin panel - review queue, moderation |
| `/admin/sites` | Manage all sites |
| `/admin/users` | Manage users |

---

## 🏷️ Categories

- Amateur
- Professional/Studio
- Cam Sites
- OnlyFans Alternatives
- Tubes
- Premium
- Free
- VR/Interactive
- Hentai/Animated
- Niche/Fetish
- Dating/Hookup
- Games

---

## 💰 Monetization

1. **Submission Fee**: $20 per site review
2. **Affiliate Links**: Earn commission on referrals
3. **Premium Listings**: Featured placement (future)
4. **Advertising**: NSFW-friendly ad networks (future)

---

## 🔒 Security & Compliance

- Age verification gate (18+ warning)
- 2257 compliance considerations
- Content moderation for AI outputs
- Rate limiting on submissions
- DMCA takedown process

---

## 📈 SEO Strategy

- SSR for all review pages
- Dynamic meta tags per review
- JSON-LD structured data
- XML sitemap generation
- Fast Core Web Vitals
- Mobile-first indexing

---

## 🚀 Launch Phases

### Phase 1: MVP
- Homepage, listings, review pages
- Submission form (payment TBD)
- AI crawl + review pipeline
- Admin dashboard basics

### Phase 2: Polish
- User accounts
- Search functionality
- Email notifications
- Payment integration

### Phase 3: Growth
- Affiliate system
- Premium listings
- API for partners
- Community features
