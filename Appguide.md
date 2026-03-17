# KLI Brands — Antigravity App Guide
## Brand Guidelines · Design System · Skill Prompt

---

## 1. PROJECT OVERVIEW

**Client:** KLI Brands  
**App Type:** B2B Cosmetics Wholesale Intelligence Chat App  
**Purpose:** A professional AI-powered product search and customer inquiry assistant for KLI Brands' sales team and wholesale customers.  
**Backend:** n8n (webhook-based AI agent → Qdrant vector database → Gemini embeddings)  
**Frontend Platform:** Antigravity

The app allows users to:
- Search KLI Brands' wholesale cosmetics catalog by natural language
- Get smart product recommendations with pricing
- Review past customer email inquiries
- Ask complex questions like "Do we have K18 oils under $20?" or "What did the Miami client ask about last month?"

---

## 2. BRAND IDENTITY

### 2.1 Brand Personality
- **Luxury but Accessible** — Premium cosmetics, wholesale prices
- **Confident & Expert** — Knows every SKU, every price, every deal
- **Warm & Professional** — Like a knowledgeable beauty consultant
- **Modern & Sleek** — Clean, uncluttered, fast-feeling

### 2.2 Brand Voice
- Professional but conversational
- Never robotic — always sounds like a smart human sales expert
- Short sentences. Confident tone.
- Uses phrases like: *"Great choice."*, *"Here are your strongest options."*, *"Let me find that for you."*

### 2.3 Brand Name Display
- Full name: **KLI Brands**
- App product name: **KLI Intelligence** or simply **KLI**
- Tagline options: *"Your Wholesale Beauty Expert"* | *"Smart Search. Better Deals."*

---

## 3. DESIGN SYSTEM

### 3.1 Color Palette

```css
:root {
  /* Primary Brand Colors */
  --kli-black:        #0A0A0A;    /* Deep black — primary backgrounds */
  --kli-white:        #F8F4F0;    /* Warm off-white — text on dark */
  --kli-gold:         #C9A84C;    /* Champagne gold — primary accent */
  --kli-gold-light:   #E8C97A;    /* Light gold — hover states */
  --kli-gold-muted:   #8A6E2F;    /* Dark gold — subtle accents */

  /* Surface Colors */
  --kli-surface-1:    #111111;    /* Card backgrounds */
  --kli-surface-2:    #1A1A1A;    /* Input fields, panels */
  --kli-surface-3:    #242424;    /* Borders, dividers */

  /* Functional Colors */
  --kli-success:      #4CAF79;    /* In stock, confirmed */
  --kli-warning:      #E8A045;    /* Low stock, attention */
  --kli-error:        #E05555;    /* Not found, error */
  --kli-info:         #5B9BD5;    /* Info, neutral response */

  /* Text Colors */
  --kli-text-primary:   #F8F4F0;
  --kli-text-secondary: #A09080;
  --kli-text-muted:     #5A5550;
}
```

### 3.2 Typography

```css
/* Heading Font: Cormorant Garamond — Luxury editorial feel */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');

/* Body Font: DM Sans — Clean, readable, modern */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

/* Mono Font: JetBrains Mono — SKUs, prices, codes */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

### 3.3 Spacing & Sizing

```css
:root {
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;
}
```

### 3.4 Shadows & Effects

```css
:root {
  --shadow-card:   0 2px 12px rgba(0,0,0,0.4);
  --shadow-float:  0 8px 32px rgba(0,0,0,0.6);
  --shadow-gold:   0 0 20px rgba(201,168,76,0.15);
  --glow-gold:     0 0 40px rgba(201,168,76,0.2);
}
```

---

## 4. UI COMPONENT SPECIFICATIONS

### 4.1 App Layout

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (260px)    │   MAIN CHAT AREA           │
│  ─────────────      │   ─────────────────────    │
│  [KLI Logo]         │   [Top Bar: Session Name]  │
│                     │                            │
│  [New Chat]         │   [Message Thread]         │
│                     │   ↕ scrollable             │
│  [Chat History]     │                            │
│  - Session 1        │   [Input Bar + Send]       │
│  - Session 2        │                            │
│  - ...              │                            │
│                     │                            │
│  [Settings]         │                            │
└─────────────────────────────────────────────────┘
```

### 4.2 Message Bubbles

**User Message:**
- Background: `--kli-surface-3`
- Border: 1px solid `--kli-gold-muted` (subtle)
- Align: right
- Border radius: 16px 4px 16px 16px
- Font: DM Sans 14px

**AI Response:**
- Background: `--kli-surface-2`
- Left border: 2px solid `--kli-gold`
- Align: left
- Border radius: 4px 16px 16px 16px
- Font: DM Sans 14px

**Product Card (inside AI response):**
```
┌─────────────────────────────────────┐
│  [Brand Name]           [Category]  │
│  Product Full Name                  │
│  ─────────────────────────────────  │
│  Size: 5oz    SKU: KLI-XXXX        │
│                                     │
│  ~~$59.00~~  →  Offer: $25.96      │
│  Discount: 56%    Units: 1830       │
└─────────────────────────────────────┘
```
- Background: `--kli-surface-1`
- Border: 1px solid `--kli-surface-3`
- Gold accent on price/offer

### 4.3 Input Bar

```
┌──────────────────────────────────────────────────┐
│  💬 Ask about products, prices, brands...    [→]  │
└──────────────────────────────────────────────────┘
```
- Background: `--kli-surface-2`
- Border: 1px solid `--kli-surface-3`, on focus → `--kli-gold`
- Border radius: `--radius-full` (pill shape)
- Send button: Gold background, black icon

### 4.4 Sidebar

- Background: `--kli-black`
- Logo area: 64px height, `KLI` in Cormorant Garamond, gold
- New Chat button: subtle gold border, full width
- Chat history items: hover state with gold left border
- Bottom: Version / Settings icon

---

## 5. ANTIGRAVITY SKILL PROMPT

> **Copy this entire block as your skill/system prompt in Antigravity:**

---

```
ANTIGRAVITY APP SKILL: KLI Brands Intelligence App

=== APP IDENTITY ===
App Name: KLI Brands Intelligence
Type: B2B Cosmetics Wholesale Chat Assistant
Client: KLI Brands
Stack: React frontend → n8n webhook backend → Qdrant vector DB

=== VISUAL DIRECTION ===
Theme: Dark luxury cosmetics. Think Chanel meets a Bloomberg terminal.
Primary colors: Deep black (#0A0A0A), champagne gold (#C9A84C), warm off-white (#F8F4F0)
Surfaces: Layered dark grays (#111, #1A1A, #242)
Accent: Gold only — never neon, never purple, never blue
Typography: Cormorant Garamond (headings/brand) + DM Sans (UI/body) + JetBrains Mono (SKUs/prices)

=== LAYOUT ===
Build a full-screen chat interface with:
1. Left sidebar (260px, collapsible on mobile):
   - KLI logo at top (gold lettermark)
   - "New Chat" button
   - Scrollable chat session history list
   - Settings icon at bottom

2. Main chat area:
   - Top bar with current session name
   - Scrollable message thread
   - Fixed input bar at bottom

=== CHAT MESSAGE COMPONENTS ===
User messages:
- Right-aligned, dark surface background, subtle gold border

AI messages:
- Left-aligned, slightly lighter surface, left gold border accent
- Support rendering PRODUCT CARDS inside responses
- Support markdown: bold, bullets, tables

Product Card component (rendered when AI returns products):
- Shows: Product Name, Brand, Size/OZ, SKU, Original Price (struck through), Offer Price (highlighted gold), Discount %, Available Units
- Dark card with gold price highlight
- Clean two-column grid layout for multiple products

=== BACKEND INTEGRATION ===
Webhook URL: [USER WILL CONFIGURE]
Method: POST
Payload format:
{
  "chatInput": "<user message>",
  "sessionId": "<unique session UUID>"
}
Response format: plain text or structured AI response

Show typing indicator (3 gold animated dots) while waiting for response.
Handle errors gracefully: show a subtle error message if webhook fails.

=== INTERACTION PATTERNS ===
- Auto-focus input on load
- Enter key sends message
- Shift+Enter for new line
- Auto-scroll to latest message
- Show timestamps on hover
- Copy button on AI messages
- Session names auto-generated from first message (first 40 chars)

=== SUGGESTED QUICK PROMPTS ===
Show these as pill buttons before first message:
- "Show me K18 hair products"
- "What sunscreens are under $30?"
- "Best deals on skincare today"
- "Find shampoos and hair oils"

=== TONE OF LOADING / EMPTY STATES ===
Empty chat: Show KLI logo centered, tagline "Your Wholesale Beauty Expert", and quick prompt pills
Loading: 3 animated gold dots with text "Finding the best options for you..."
Error: "Something went wrong. Please try again." with retry button

=== ANIMATIONS ===
- Messages fade + slide in from bottom (subtle, 200ms)
- Gold shimmer on product card price on hover
- Input border glows gold on focus
- Sidebar items have left-border reveal on hover

=== MOBILE RESPONSIVE ===
- Sidebar collapses to bottom sheet or hamburger on mobile
- Full screen chat on mobile
- Input bar stays fixed at bottom
- Product cards stack vertically on small screens

=== DO NOT ===
- Do NOT use purple gradients or generic AI aesthetics
- Do NOT use Inter or Roboto fonts
- Do NOT use light backgrounds (this is a dark theme app)
- Do NOT use generic blue chat bubbles
- Do NOT show raw JSON or database field names to users
```

---

## 6. ANTIGRAVITY brandguidelines.md FILE

> **Save this as `brandguidelines.md` in your Antigravity project:**

---

```markdown
# KLI Brands — Brand Guidelines

## Identity
- **Brand Name:** KLI Brands
- **App Name:** KLI Intelligence
- **Industry:** Professional Cosmetics Wholesale
- **Tagline:** "Your Wholesale Beauty Expert"

## Colors
| Token           | Hex       | Usage                        |
|-----------------|-----------|------------------------------|
| kli-black       | #0A0A0A   | Page background              |
| kli-surface-1   | #111111   | Card backgrounds             |
| kli-surface-2   | #1A1A1A   | Inputs, panels               |
| kli-surface-3   | #242424   | Borders, dividers            |
| kli-gold        | #C9A84C   | Primary accent, prices       |
| kli-gold-light  | #E8C97A   | Hover states                 |
| kli-white       | #F8F4F0   | Primary text                 |
| kli-text-muted  | #A09080   | Secondary text               |
| kli-success     | #4CAF79   | In stock                     |
| kli-warning     | #E8A045   | Low stock                    |
| kli-error       | #E05555   | Errors                       |

## Typography
- **Display/Brand:** Cormorant Garamond (weights: 300, 400, 500, 600)
- **UI/Body:** DM Sans (weights: 300, 400, 500, 600)
- **Code/SKU/Price:** JetBrains Mono (weights: 400, 500)

## Component Rules
- All cards use 1px border `#242424`, radius 12px
- Active/selected states use gold left border (3px)
- Prices always in JetBrains Mono, offers in gold
- Buttons: primary = gold bg + black text; secondary = transparent + gold border

## Logo Usage
- Use "KLI" in Cormorant Garamond 600 weight, gold color
- Below: "BRANDS" in DM Sans 400, letter-spacing 0.3em, muted color
- Never change the font or color of the logo
- Minimum size: 32px height

## Voice & Tone
- Professional, warm, expert
- Never say "database", "vector", "embedding", "RAG"
- Always present products naturally, never as raw data
- End responses with helpful offer for more assistance
```

---

## 7. FILE STRUCTURE FOR ANTIGRAVITY PROJECT

```
kli-brands-app/
├── brandguidelines.md          ← Brand colors, fonts, rules
├── SKILL.md                    ← Antigravity app skill prompt
├── components/
│   ├── ChatInterface.jsx       ← Main chat layout
│   ├── MessageBubble.jsx       ← User & AI message bubbles
│   ├── ProductCard.jsx         ← Product display component
│   ├── Sidebar.jsx             ← Chat history sidebar
│   ├── InputBar.jsx            ← Message input + send
│   └── QuickPrompts.jsx        ← Suggested prompt pills
├── hooks/
│   ├── useChat.js              ← Chat state management
│   └── useWebhook.js           ← n8n webhook integration
├── styles/
│   └── tokens.css              ← CSS variables / design tokens
└── utils/
    └── parseResponse.js        ← Parse AI response → product cards
```

---

## 8. n8n WEBHOOK INTEGRATION SPEC

Your Antigravity app talks to n8n via:

```js
// POST to your n8n webhook
const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatInput: userMessage,      // Full user query (never shorten!)
    sessionId: currentSessionId  // UUID for conversation memory
  })
});

const data = await response.json();
// data.output or data.text → AI response string
```

**Important rules from your n8n workflow:**
- Always send the FULL user query — never truncate
- Include `sessionId` for conversation continuity
- The AI agent handles routing: product search, email search, or both
- Response is a natural language string (already formatted by AI agent)

---

## 9. PRODUCT CARD PARSING

When the AI returns products, parse them from the text response and render as cards. The AI formats product details naturally. You can detect product info with patterns:

```js
// Simple heuristic: if response contains price patterns, render product cards
const hasProducts = /\$[\d.]+/.test(responseText) && 
                    /(oz|ml|sku|offer|wholesale)/i.test(responseText);

// Render text normally if no products detected
// Render with product card grid if products detected
```

---

## 10. QUICK REFERENCE CHECKLIST

Before launching to client, verify:

- [ ] Dark theme applied consistently (no white backgrounds)
- [ ] KLI logo in Cormorant Garamond, gold
- [ ] Input bar connects to correct n8n webhook URL
- [ ] Typing indicator shows while waiting for response
- [ ] Product cards render with gold price highlight
- [ ] Quick prompt pills show on empty state
- [ ] Chat history saves to local/session storage
- [ ] Mobile responsive layout works
- [ ] Error state handled gracefully
- [ ] No raw field names shown to user (no "vectorText", "sku" labels)

---

*Document Version: 1.0 | KLI Brands Intelligence App | Built with n8n + Qdrant + Gemini + Antigravity*