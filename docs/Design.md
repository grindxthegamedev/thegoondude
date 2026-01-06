# LustList 411 - Design System

> A premium NSFW directory with AI-powered autonomous reviews.

---

## 🎨 Color Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--bg-base` | Deep Charcoal | `#0D0D0D` | Page background |
| `--bg-surface` | Soft Black | `#1A1A1A` | Cards, modals |
| `--bg-elevated` | Dark Gray | `#242424` | Hover states, elevated surfaces |
| `--primary` | Hot Pink | `#FF2D6A` | CTAs, active states, links |
| `--primary-hover` | Deep Pink | `#E6245F` | Primary hover |
| `--accent` | Electric Coral | `#FF6B6B` | Secondary accents, badges |
| `--accent-alt` | Soft Rose | `#FF8FA3` | Tertiary highlights |
| `--text-primary` | Warm White | `#F5F5F5` | Headings, body text |
| `--text-secondary` | Soft Gray | `#A0A0A0` | Captions, muted text |
| `--text-muted` | Dim Gray | `#666666` | Disabled text |
| `--success` | Mint Green | `#4ADE80` | Success states |
| `--warning` | Amber | `#FBBF24` | Warnings |
| `--error` | Red | `#EF4444` | Errors |
| `--border` | Subtle Gray | `#2A2A2A` | Borders, dividers |

---

## 🔤 Typography

### Font Stack
- **Headings**: `'Outfit', sans-serif` - Bold, modern, sexy
- **Body**: `'Inter', sans-serif` - Clean, readable
- **Mono**: `'JetBrains Mono', monospace` - Code, technical

### Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xs` | 12px | 400 | Captions |
| `--text-sm` | 14px | 400 | Small text |
| `--text-base` | 16px | 400 | Body |
| `--text-lg` | 18px | 500 | Large body |
| `--text-xl` | 20px | 600 | Subheadings |
| `--text-2xl` | 24px | 700 | Section headers |
| `--text-3xl` | 30px | 700 | Page titles |
| `--text-4xl` | 36px | 800 | Hero headers |
| `--text-5xl` | 48px | 800 | Display |

---

## 📐 Spacing

Based on 4px grid:

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

---

## 🎭 Effects

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.6);
--shadow-glow: 0 0 20px rgba(255, 45, 106, 0.3);
```

### Glassmorphism
```css
--glass-bg: rgba(26, 26, 26, 0.8);
--glass-blur: blur(12px);
--glass-border: 1px solid rgba(255, 255, 255, 0.1);
```

### Border Radius
| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-full` | 9999px |

---

## 🏃 Animations

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease-out;
```

### Micro-animations
- **Hover lift**: Cards lift 4px on hover with shadow increase
- **Button pulse**: Subtle glow pulse on primary CTAs
- **Fade in**: Content fades in on page load
- **Skeleton shimmer**: Loading states with gradient animation

---

## 🧩 Component Patterns

### Cards
- Dark surface (`--bg-surface`)
- Subtle border (`--border`)
- Rounded corners (`--radius-lg`)
- Hover: lift + glow effect

### Buttons
- **Primary**: Hot pink bg, white text, glow on hover
- **Secondary**: Transparent, pink border, pink text
- **Ghost**: No border, pink text on hover

### Badges/Tags
- Small, rounded pills
- Category-specific colors
- Electric coral for "hot" tags

### Rating Stars
- Filled: Hot pink
- Empty: Dim gray outline
- Interactive pulse on hover

---

## 📱 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

---

## 🖼️ Imagery

- **Screenshots**: Blurred/censored thumbnails on listings, full on review pages
- **Placeholders**: Gradient placeholder with logo watermark
- **Icons**: Lucide React icons (consistent, clean)

---

## 🌟 Design Principles

1. **Premium but Provocative** - High-end feel without being sterile
2. **Dark Mode First** - Easier on eyes, fits the niche
3. **Scannable** - Users browse quickly, make content digestible
4. **Mobile-First** - Responsive from the start
5. **Accessible** - Proper contrast ratios, keyboard nav
