# Functions Source

Firebase Cloud Functions source code.

## Structure

| Directory | Purpose |
|-----------|---------|
| `ai/` | AI agents (crawler, analyzer, writer) |
| `payments/` | Payment processing (Payblis) |
| `backlink/` | Backlink verification |

## Entry Points

- `index.ts` - Main exports (all Cloud Functions)
- `admin.ts` - Admin-only endpoints

## Deployment

```bash
cd functions
npm install
firebase deploy --only functions
```

## Environment

Set via Firebase Functions config:
- `VERTEX_AI_PROJECT` - GCP project
- `VERTEX_AI_LOCATION` - Region
