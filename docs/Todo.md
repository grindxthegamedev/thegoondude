# LustList 411 - Todo

> Master task list for project development

---

## 📋 Phase 1: Foundation

### Project Setup
- [ ] Initialize Next.js 14 with App Router
- [ ] Configure TypeScript
- [ ] Set up CSS module structure
- [ ] Install dependencies (firebase, lucide-react, etc.)
- [ ] Create folder structure
- [ ] Set up ESLint & Prettier

### Design System Implementation
- [ ] Create CSS variables (tokens)
- [ ] Build base reset/normalize
- [ ] Create typography styles
- [ ] Build utility classes
- [ ] Create component base styles

### Core Components
- [ ] Header/Navigation
- [ ] Footer
- [ ] Button component
- [ ] Card component
- [ ] Badge/Tag component
- [ ] Rating stars component
- [ ] Loading skeleton
- [ ] Modal component

---

## 📋 Phase 2: Pages

### Homepage
- [ ] Hero section with tagline
- [ ] Featured sites grid
- [ ] Category navigation
- [ ] Latest reviews section
- [ ] CTA for submissions

### Directory Pages
- [ ] `/sites` - Main listing page
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
- [ ] Related sites section
- [ ] SEO meta tags

### Submission Flow
- [ ] `/submit` - Submission form
- [ ] URL validation
- [ ] Category selection
- [ ] Description textarea
- [ ] Terms acceptance
- [ ] Payment placeholder (TBD processor)
- [ ] Confirmation page

---

## 📋 Phase 3: Backend

### Firebase Setup
- [ ] Create Firebase project
- [ ] Configure Firestore
- [ ] Set up Firebase Auth
- [ ] Configure Cloud Functions
- [ ] Set up Firebase Storage (screenshots)

### API Routes (Next.js)
- [ ] `POST /api/submit` - Site submission
- [ ] `GET /api/sites` - List sites
- [ ] `GET /api/sites/[id]` - Get site details
- [ ] `GET /api/categories` - List categories

### Cloud Functions
- [ ] Trigger on new submission
- [ ] Queue management
- [ ] Status webhooks

---

## 📋 Phase 4: AI Pipeline

### Crawler Agent
- [ ] Set up Puppeteer in Cloud Functions
- [ ] Screenshot capture logic
- [ ] SEO extraction (meta tags)
- [ ] Mobile responsiveness check
- [ ] Performance metrics

### Analysis Agent
- [ ] Gemini API integration (Vertex AI)
- [ ] Screenshot analysis prompt
- [ ] Feature extraction
- [ ] Pros/cons generation
- [ ] Rating calculation

### Writer Agent
- [ ] Review generation prompt
- [ ] PornDude style guide
- [ ] Content structure template
- [ ] SEO optimization
- [ ] Output validation

### Pipeline Orchestration
- [ ] Queue processing
- [ ] Error handling
- [ ] Retry logic
- [ ] Status updates
- [ ] Notification triggers

---

## 📋 Phase 5: Admin

### Admin Dashboard
- [ ] `/admin` - Overview stats
- [ ] Pending reviews queue
- [ ] Quick approve/reject
- [ ] Revenue tracking

### Site Management
- [ ] `/admin/sites` - All sites table
- [ ] Edit site details
- [ ] Edit/regenerate review
- [ ] Publish/unpublish toggle
- [ ] Delete with confirmation

### User Management
- [ ] `/admin/users` - User list
- [ ] View user submissions
- [ ] Ban/unban user

---

## 📋 Phase 6: Polish

### User Features
- [ ] User authentication
- [ ] User dashboard
- [ ] Submission history
- [ ] Email notifications

### Search
- [ ] Full-text search
- [ ] Algolia or Firestore search
- [ ] Search results page
- [ ] Autocomplete

### Performance
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Core Web Vitals audit

### SEO
- [ ] XML sitemap
- [ ] Robots.txt
- [ ] JSON-LD structured data
- [ ] OpenGraph images

---

## 📋 Phase 7: Launch Prep

### Security
- [ ] Age verification gate
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] CORS configuration

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] 2257 statement
- [ ] DMCA process

### Deployment
- [ ] Firebase hosting setup
- [ ] Domain configuration
- [ ] SSL verification
- [ ] Environment variables

---

## 🐛 Bugs / Issues

_None yet - project starting_

---

## 💡 Future Ideas

- [ ] Affiliate link system
- [ ] Premium featured listings
- [ ] Site owner verification
- [ ] Community ratings/comments
- [ ] Newsletter
- [ ] API for partners
- [ ] Mobile app
