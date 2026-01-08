# LustList 411

> AI-Powered NSFW Site Directory with Autonomous Reviews

## Overview

LustList 411 is a premium directory for adult websites where AI agents autonomously crawl, analyze, and publish detailed reviews. Site owners pay a $20 submission fee to get their sites reviewed.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Vanilla CSS Modules
- **Backend**: Firebase (Firestore, Auth, Functions, Hosting)
- **AI**: Gemini via Vertex AI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── docs/                 # Project documentation
│   ├── Design.md        # Design system
│   ├── Outline.md       # Architecture
│   └── Todo.md          # Task list
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable components
│   │   ├── layout/      # Header, Footer, etc.
│   │   └── ui/          # Button, Card, etc.
│   ├── lib/             # Utilities & integrations
│   └── styles/          # CSS modules
├── functions/           # Firebase Cloud Functions
└── public/              # Static assets
```

## Features

- 🤖 **AI Reviews** - Autonomous crawling and review generation
- 🔥 **Modern UI** - Dark theme with hot pink accents
- 📱 **Responsive** - Mobile-first design
- 🔍 **SEO Optimized** - SSR for search rankings
- 💰 **Monetization** - $20 submission fee

## Documentation

See the `/docs` folder for detailed documentation:

- [Design System](./docs/Design.md)
- [Project Outline](./docs/Outline.md)
- [Todo List](./docs/Todo.md)

## License

Proprietary - All rights reserved.
