# LustList 411 - Todo

> Master task list for project development

---

## 📋 Phase 1: Foundation ✅

### Project Setup
- [x] Initialize Next.js 14 with App Router
- [x] Configure TypeScript
- [x] Set up CSS module structure
- [x] Create folder structure
- [x] Set up ESLint

### Design System Implementation
- [x] Create CSS variables (tokens)
- [x] Build base reset/normalize
- [x] Create typography styles
- [x] Build utility classes (split into layout.css + visual.css)

### Core Components
- [x] Header/Navigation
- [x] Footer
- [x] Button component (4 variants, 3 sizes)
- [x] Badge/Tag component (6 variants)
- [x] Rating stars component
- [x] SiteListing component (411-style rows)
- [ ] Loading skeleton
- [ ] Modal component

---

## 📋 Phase 2: Pages (In Progress)

### Homepage
- [x] Hero section with tagline
- [x] Category navigation pills
- [x] Top rated section (API-ready)
- [x] New additions section (API-ready)
- [x] CTA for submissions

### Directory Pages
- [/] `/sites` - Main listing page (structure ready)
- [ ] Category filter sidebar
- [ ] Sort options (rating, date, etc.)
- [ ] Pagination/infinite scroll
- [ ] `/sites/[category]` - Category pages

### Review Pages
- [ ] `/review/[slug]` - Individual review
- [ ] Review header (title, rating, meta)
- [ ] Screenshot gallery
- [ ] Review content (markdown render)
- [ ] Pros/Cons section
- [ ] Verdict box

### Submission Flow
- [ ] `/submit` - Submission form
- [ ] URL validation
- [ ] Category selection
- [ ] Terms acceptance
- [ ] Payment placeholder

---

## 📋 Phase 3: Backend (Current Focus)

### Firebase Setup
- [/] Create Firebase project structure
- [ ] Configure Firestore collections
- [ ] Set up Firebase Auth
- [ ] Configure Cloud Functions
- [ ] Set up Firebase Storage (screenshots)

### API Layer
- [/] Create API hooks structure
- [ ] `useSites()` - Fetch sites with filters
- [ ] `useSite(slug)` - Fetch single site
- [ ] `useCategories()` - Fetch categories
- [ ] `useSubmission()` - Submit new site

### Next.js API Routes
- [ ] `GET /api/sites` - List sites
- [ ] `GET /api/sites/[slug]` - Get site details
- [ ] `POST /api/submit` - Site submission
- [ ] `GET /api/categories` - List categories

---

## 📋 Phase 4: AI Pipeline

### Crawler Agent
- [ ] Puppeteer in Cloud Functions
- [ ] Screenshot capture
- [ ] SEO extraction
- [ ] Performance metrics

### Analysis Agent (Gemini)
- [ ] Screenshot analysis
- [ ] Pros/cons generation
- [ ] Rating calculation

### Writer Agent (Gemini)
- [ ] Review generation prompt
- [ ] PornDude style
- [ ] SEO optimization

---

## 📋 Phase 5: Admin

- [ ] `/admin` - Dashboard
- [ ] Pending reviews queue
- [ ] Site management
- [ ] User management

---

## 📋 Phase 6: Polish

- [ ] User authentication
- [ ] User dashboard
- [ ] Search functionality
- [ ] SEO (sitemap, JSON-LD)
- [ ] Performance optimization

---

## 📋 Phase 7: Launch

- [ ] Age verification gate
- [ ] Legal pages (ToS, Privacy)
- [ ] Firebase hosting
- [ ] Domain setup

---

## 🐛 Bugs / Issues

_None yet_

---

## 💡 Future Ideas

- [ ] Affiliate links
- [ ] Premium listings
- [ ] Community ratings
- [ ] Newsletter
- [ ] API for partners
