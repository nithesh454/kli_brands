# KLI Brands — Brand Guidelines v2.0

---

## Brand Identity

- **Brand Name:** KLI Brands
- **App Name:** KLI Intelligence
- **Industry:** Professional Cosmetics Wholesale (B2B)
- **Tagline:** "The Professional Beauty Standard"
- **Audience:** Wholesale buyers, sales reps, retail store owners
- **Feel:** Premium cosmetics retail — think Nykaa meets a professional B2B tool. Clean, confident, beautiful.

---

## Theme System

The app supports two themes. Users can switch between them via a toggle in the top bar or sidebar. Both themes must feel equally premium — not just "dark mode on/off."

### LIGHT THEME — "Pearl"
The default. Clean, bright, premium beauty retail energy.

```css
/* Light Theme: Pearl */
--bg-primary:       #FFFFFF;
--bg-secondary:     #F7F5F3;   /* Warm off-white surfaces */
--bg-tertiary:      #F0EDE9;   /* Cards, input backgrounds */
--bg-overlay:       #EAE6E1;   /* Hover states, dividers */

--accent-primary:   #E8386D;   /* KLI signature rose-pink — primary CTA */
--accent-secondary: #C41F5A;   /* Deeper rose — hover, pressed */
--accent-soft:      #FCE8EF;   /* Light rose tint — badges, tags */

--text-primary:     #1A1A1A;   /* Near black */
--text-secondary:   #5C5C5C;   /* Medium gray */
--text-muted:       #9E9E9E;   /* Placeholders, timestamps */
--text-on-accent:   #FFFFFF;   /* Text on pink buttons */

--border-subtle:    #E8E3DE;
--border-default:   #D4CEC8;
--border-strong:    #B8B0A8;

--success:          #2E9E6B;
--warning:          #D97706;
--error:            #DC2626;
--info:             #2563EB;

--shadow-sm:  0 1px 3px rgba(0,0,0,0.08);
--shadow-md:  0 4px 16px rgba(0,0,0,0.10);
--shadow-lg:  0 8px 32px rgba(0,0,0,0.12);
```

### DARK THEME — "Noir"
A true premium dark — not just grey boxes. Deep navy-black with rose accents.

```css
/* Dark Theme: Noir */
--bg-primary:       #0D0D0F;   /* Near black with a cool undertone */
--bg-secondary:     #16161A;   /* Card backgrounds */
--bg-tertiary:      #1E1E24;   /* Input fields, panels */
--bg-overlay:       #26262E;   /* Hover, dividers */

--accent-primary:   #F04E80;   /* Brighter rose for dark bg visibility */
--accent-secondary: #D93A6C;   /* Hover state */
--accent-soft:      #2A1020;   /* Tinted dark rose background for badges */

--text-primary:     #F2F0ED;   /* Warm white */
--text-secondary:   #A8A4A0;   /* Secondary text */
--text-muted:       #5E5A58;   /* Timestamps, placeholders */
--text-on-accent:   #FFFFFF;

--border-subtle:    #1E1E24;
--border-default:   #2A2A32;
--border-strong:    #3A3A44;

--success:          #34D399;
--warning:          #FBBF24;
--error:            #F87171;
--info:             #60A5FA;

--shadow-sm:  0 1px 3px rgba(0,0,0,0.3);
--shadow-md:  0 4px 16px rgba(0,0,0,0.4);
--shadow-lg:  0 8px 32px rgba(0,0,0,0.5);
```

---

## Color Philosophy

- **No gold. No yellow. No gradients unless very subtle.**
- The signature color is **rose-pink (#E8386D light / #F04E80 dark)** — used for primary buttons, active states, price highlights, and the logo mark.
- Backgrounds are **neutral** — warm whites in light theme, cool near-blacks in dark theme.
- Typography carries the premium weight — not color.
- Price highlights use the accent color, not a separate gold or green.

---

## Typography

### Font Stack
```css
/* Primary: Outfit — Modern, geometric, premium feel */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

/* Secondary/Editorial: Playfair Display — For brand name and section headers */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');

/* Data/Mono: IBM Plex Mono — For SKUs, prices, codes */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --font-ui:       'Outfit', sans-serif;
  --font-display:  'Playfair Display', Georgia, serif;
  --font-data:     'IBM Plex Mono', monospace;
}
```

### Type Scale
| Role            | Font              | Size  | Weight | Usage                      |
|-----------------|-------------------|-------|--------|----------------------------|
| Brand / Logo    | Playfair Display  | 22px  | 600    | "KLI Brands" wordmark      |
| Page Title      | Outfit            | 20px  | 600    | Section headers            |
| Card Title      | Outfit            | 15px  | 600    | Product names              |
| Body            | Outfit            | 14px  | 400    | Chat messages, descriptions|
| Label / Meta    | Outfit            | 12px  | 500    | Brand names, categories    |
| Small           | Outfit            | 11px  | 400    | Timestamps, helper text    |
| Price / SKU     | IBM Plex Mono     | 14px  | 500    | All numeric data           |

---

## Logo

```
KLI            ← Playfair Display 600, var(--accent-primary), 22px
BRANDS         ← Outfit 500, var(--text-muted), 10px, letter-spacing 0.4em, uppercase
```

- Always on clean background — never on a busy image
- Minimum height: 28px
- Pink accent dot or underline can be used as a logo device

---

## Component Specifications

### Buttons

| Type       | Light Theme                          | Dark Theme                           |
|------------|--------------------------------------|--------------------------------------|
| Primary    | bg #E8386D, text #FFF, radius 8px    | bg #F04E80, text #FFF, radius 8px    |
| Secondary  | bg transparent, border #E8386D, text #E8386D | bg transparent, border #F04E80, text #F04E80 |
| Ghost      | bg #F0EDE9, text #5C5C5C             | bg #1E1E24, text #A8A4A0             |
| Danger     | bg transparent, border #DC2626, text #DC2626 | bg transparent, border #F87171, text #F87171 |

- Border radius: 8px standard, 99px for pill/tags
- Font: Outfit 500 14px
- Hover: 8% opacity darken (light) / lighten (dark)
- No shadows on buttons

### Cards

**Light:** bg #FFFFFF, border 1px solid #E8E3DE, radius 12px, shadow-sm  
**Dark:** bg #16161A, border 1px solid #2A2A32, radius 12px, shadow-md

Hover: border-color shifts to accent (20% opacity), subtle lift (translateY -1px)

### Input Fields

**Light:** bg #F7F5F3, border 1px solid #D4CEC8, radius 8px  
**Dark:** bg #1E1E24, border 1px solid #2A2A32, radius 8px

Focus (both): border-color = --accent-primary, box-shadow = 0 0 0 3px accent at 12% opacity  
Font: Outfit 14px  
Placeholder: --text-muted

### Product Price Display

```
Original price:  IBM Plex Mono 13px, line-through, --text-muted
Offer price:     IBM Plex Mono 16px 500, --accent-primary
Discount badge:  Outfit 11px 600, bg --accent-soft, text --accent-primary, radius 4px, padding 2px 6px
```

### Chat Message Bubbles

**User bubble:**
- Light: bg #F0EDE9, border 1px solid #E8E3DE
- Dark: bg #26262E, border 1px solid #2A2A32
- Align: right, radius 16px 4px 16px 16px

**AI bubble:**
- Light: bg #FFFFFF, left border 3px solid #E8386D
- Dark: bg #16161A, left border 3px solid #F04E80
- Align: left, radius 4px 16px 16px 16px

### Tags / Category Pills

Light: bg #F0EDE9, text #5C5C5C, border 1px solid #E8E3DE  
Dark: bg #1E1E24, text #A8A4A0, border 1px solid #2A2A32  
Radius: 99px, font Outfit 12px 500, padding 4px 10px

---

## Theme Toggle

- Position: top right of header OR bottom of sidebar
- Visual: a clean switch — sun icon (light) / moon icon (dark)
- No emojis — use clean SVG icons only
- Transition: 200ms on all color changes (use CSS transitions on :root vars)
- Store preference: localStorage key `kli_theme`
- Default: light theme

---

## Spacing & Sizing

```css
:root {
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   20px;
  --radius-full: 9999px;

  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

---

## Motion & Animation

```css
/* Standard easing */
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);

/* Durations */
--duration-fast:   120ms;
--duration-normal: 200ms;
--duration-slow:   350ms;
```

- Message entry: `opacity 0→1, translateY 6px→0` over 200ms
- Card entry: `opacity 0→1, scale 0.99→1` over 200ms
- Theme switch: all CSS variables transition 200ms
- Hover states: 120ms
- No bounces. No spring animations. Clean and controlled.

---

## Icons

- Use **Lucide icons** only (clean, consistent stroke-based)
- Stroke width: 1.5px
- Size: 16px (inline), 20px (buttons), 24px (nav)
- Never filled icons — stroke only
- No emojis anywhere in the UI

---

## What NOT To Do

- No gold, yellow, or bronze colors
- No gradient backgrounds (subtle gradient on hero image only if needed)
- No emoji in the UI
- No drop shadows on text
- No Inter or Roboto fonts
- No full-black (#000000) backgrounds — use #0D0D0F
- No neon colors
- No rounded corners above 16px on cards
- Never show raw backend field names (vectorText, embedding, payload, sku)
- No generic SaaS layouts — this is a cosmetics brand tool

---

## Reference Aesthetic

Inspired by: **Nykaa** (clean structured product layout, category navigation, professional cosmetics retail) and **Purplle** (friendly but clean, good product card structure, clear pricing hierarchy).

KLI Intelligence sits above both — it is a **professional B2B tool**, not a consumer store. So it takes the clean visual language but applies it with more restraint, more whitespace, and higher information density for power users.