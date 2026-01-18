# Production Deployment Checklist

## ✅ COMPLETED - Ready for Deploy

### Environment & Secrets
- [x] `.env.example` created with all required variables
- [x] Secret Manager integration in admin functions (`ADMIN_HASH`)
- [x] Functions URL configurable via env

### Functions Configuration
- [x] Node version set to `20` (supported runtime)
- [x] Memory configs set for all functions:
  - Utility endpoints: 128MiB
  - Admin endpoints: 256MiB
  - Backlink checker: 1GiB
  - AI endpoints: 2GiB
- [x] Timeout configs set appropriately
- [x] Global options: maxInstances=10, region=us-central1
- [x] CORS headers properly configured

### Rate Limiting
- [x] Rate limiter module created (`rateLimit.ts`)
- [x] Integrated into AI endpoints:
  - `generateSiteReview`: 10 per hour
  - `processFullReview`: 3 per hour
- [x] Backlink check: 1 per URL per 60 seconds
- [x] Retry-After headers in 429 responses

### Security
- [x] Firestore rules enhanced with helper functions
- [x] Strict validation on site submissions
- [x] Users collection protected
- [x] Rate limits collection (Cloud Functions only)

---

## ⚠️ MANUAL STEPS REQUIRED

### 1. Create `.env.local` from template
```bash
cp .env.example .env.local
# Edit with your Firebase project values
```

### 2. Set Firebase Secrets (Production)
```bash
# Admin password hash
firebase functions:secrets:set ADMIN_HASH

# Payblis payment credentials (when ready)
firebase functions:secrets:set PAYBLIS_API_KEY
firebase functions:secrets:set PAYBLIS_SECRET_KEY
firebase functions:secrets:set PAYBLIS_MERCHANT_ID
```

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Build & Deploy Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 5. Deploy Frontend (If using Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

---

## 📋 Post-Deploy Verification

| Check | Command/URL |
|-------|-------------|
| Health endpoint | `curl https://us-central1-lustlist411.cloudfunctions.net/health` |
| Rate limit status | `curl https://us-central1-lustlist411.cloudfunctions.net/rateLimitStatus` |
| Function logs | `firebase functions:log` |
| Firestore rules test | Firebase Console > Firestore > Rules Playground |

---

## 🔧 Troubleshooting

### "Rate limit exceeded" during testing
Rate limits use sliding window. Wait for window to expire or manually clear `rateLimits` collection.

### "Chrome not found" in local emulator
Ensure Chrome is installed. The crawler auto-detects common paths.

### Functions timeout
Heavy functions (AI, Puppeteer) have 540s timeout. Check logs for actual execution time.
