# Review Page Styles

This folder contains the modularized CSS for the review page.

## Structure

| File | Description | Lines |
|------|-------------|-------|
| `hero.css` | Hero section, title, rating box | ~60 |
| `gallery.css` | Screenshot gallery, scrollbar | ~65 |
| `prose.css` | Markdown content styling | ~60 |
| `verdict.css` | Pros/cons boxes, verdict section | ~90 |
| `responsive.css` | Tablet+ media queries | ~35 |

## Usage

All files are imported via `../page.module.css` which acts as a hub.

## Adding New Styles

1. Check if the style fits an existing module
2. If not, create a new `.css` file here
3. Import it in `../page.module.css`
4. Keep each file under 100 lines
