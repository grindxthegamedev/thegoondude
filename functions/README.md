# Firebase Cloud Functions

Serverless backend functions for LustList 411.

## Structure

```
functions/
├── agents/         # AI agent orchestration
│   ├── crawler.ts  # Site crawling & screenshots
│   ├── analyzer.ts # Content analysis
│   └── writer.ts   # Review generation
├── api/            # HTTP endpoints
└── triggers/       # Firestore triggers
```

## Setup

```bash
cd functions
npm install
firebase deploy --only functions
```

## Environment Variables

Required in Firebase Functions config:
- `VERTEX_AI_PROJECT` - GCP project ID
- `VERTEX_AI_LOCATION` - Region (e.g., us-central1)

## Agents

### Crawler Agent
- Uses Puppeteer to navigate sites
- Captures screenshots
- Extracts SEO metadata
- Measures performance

### Analyzer Agent
- Sends screenshots to Gemini
- Generates pros/cons
- Calculates ratings

### Writer Agent
- Generates PornDude-style reviews
- SEO-optimized content
- Structured format
