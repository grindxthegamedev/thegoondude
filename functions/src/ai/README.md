# AI Agents

Autonomous AI agents for site crawling, analysis, and review generation.

## Architecture

```
ai/
├── crawler.ts      # Main crawler orchestration
├── crawlerDOM.ts   # DOM parsing and element extraction
├── crawlerDecide.ts # AI-powered decision making
├── crawlerAct.ts   # Action execution (click, scroll)
├── crawlerAuth.ts  # Age gate bypass logic
├── crawlerSmart.ts # Smart crawling with vision
├── crawlerHelpers.ts # Utility functions
├── analyzer.ts     # Screenshot analysis
├── visionAnalyzer.ts # Gemini Vision analysis
├── writer.ts       # Review generation
├── gemini.ts       # Gemini API client
├── prompts.ts      # AI prompt templates
├── storage.ts      # Firebase Storage uploads
├── endpoints.ts    # HTTP function endpoints
└── index.ts        # Barrel exports
```

## Pipeline Stages

1. **Crawler** → Navigate site, bypass age gates, capture screenshots
2. **Analyzer** → Analyze screenshots, extract features, rate content
3. **Writer** → Generate PornDude-style review prose

## Key Features

- **Manus-style Architecture**: Observe → Decide → Act loop
- **Intelligent Age Gate Bypass**: Text-based element clicking
- **Vision Analysis**: Gemini Vision for screenshot understanding
- **Modular Design**: Each module handles specific responsibility

## Gemini Integration

Uses Vertex AI Gemini for:
- Screenshot analysis
- Decision making (what to click)
- Review generation
- Pros/cons extraction
