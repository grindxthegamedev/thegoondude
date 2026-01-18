# Backlink Verification

Verifies that submitted sites include backlinks to LustList 411.

## Files

| File | Purpose |
|------|---------|
| `backlinkVerifier.ts` | Core verification logic |
| `checkBacklink.ts` | HTTP endpoint for checking |

## Purpose

Encourages site owners to link back to LustList 411 in exchange for:
- Priority in review queue
- Featured placement
- Reduced submission fee (future)

## Verification Process

1. Crawl submitted site
2. Search for links to lustlist411.com
3. Verify link is not `nofollow`
4. Update submission with backlink status

## Usage

```typescript
// Check if site has valid backlink
const hasBacklink = await verifyBacklink(siteUrl);
```
