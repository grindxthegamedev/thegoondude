# Styles

CSS architecture for TheGoonDude.

## Structure

| File | Description | Lines |
|------|-------------|-------|
| `tokens.css` | Design tokens (colors, spacing, typography, effects) | ~120 |
| `reset.css` | Modern CSS reset with dark theme defaults | ~100 |
| `typography.css` | Font imports and text styles | ~170 |
| `layout.css` | Layout utilities (flex, grid, spacing) | ~75 |
| `visual.css` | Visual utilities (backgrounds, borders, shadows) | ~40 |

## Usage

All styles are imported through `globals.css` in the app directory:

```css
@import '../styles/tokens.css';
@import '../styles/reset.css';
@import '../styles/typography.css';
@import '../styles/layout.css';
@import '../styles/visual.css';
```

## Design Tokens

Use CSS custom properties from `tokens.css`:

```css
.my-component {
  background: var(--bg-surface);
  color: var(--text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}
```
