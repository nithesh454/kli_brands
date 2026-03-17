# SKILL: KLI Brands Intelligence App

## App Identity
- **Name:** KLI Brands Intelligence
- **Type:** Dark-themed B2B wholesale cosmetics chat assistant + data ingestion tool
- **Client:** KLI Brands — professional cosmetics wholesaler
- **Backend:** Two n8n workflows connected via webhooks

---

## TWO BACKEND WORKFLOWS

### Workflow 1 — Chat / Search
- **Purpose:** AI-powered product search and customer inquiry assistant
- **Webhook ID:** `search`
- **Full URL:** `https://YOUR_N8N_DOMAIN/webhook-test/search`
- **Method:** POST
- **Payload:**
```json
{
  "chatInput": "full user query here",
  "sessionId": "uuid-session-id"
}
```
- **Response:** Natural language string with product info / inquiry results

---

### Workflow 2 — Excel / Data Upload
- **Purpose:** Upload product catalog Excel/CSV files to populate the vector database
- **Webhook ID:** `f5afdefa-89e4-4be5-84f9-64a0cb849eec`
- **Full URL:** `https://YOUR_N8N_DOMAIN/webhook/f5afdefa-89e4-4be5-84f9-64a0cb849eec`
- **Method:** POST
- **Content-Type:** `multipart/form-data`
- **Payload:** File upload (xlsx, xls, csv, ods supported)
- **Response:** Success/status confirmation from n8n

---

## Your Role as Antigravity
Build a **full-screen, production-grade app** for KLI Brands with TWO main sections:
1. **Chat Interface** — AI product search powered by Workflow 1
2. **Data Upload Panel** — Excel/CSV file uploader powered by Workflow 2

This is a premium, dark-luxury app. Every design decision must reflect: *Chanel meets Bloomberg Terminal.*

---

## Visual Direction
- **Theme:** Dark luxury. Deep blacks, layered dark surfaces, champagne gold accents.
- **NOT:** Purple gradients, white backgrounds, generic SaaS blue, neon anything.
- **Fonts:** Cormorant Garamond (brand/headings) + DM Sans (UI/body) + JetBrains Mono (prices/SKUs)
- **Gold is the only accent color** — #C9A84C primary, #E8C97A hover

---

## Layout Structure

```
┌──────────────────────────────────────────────────────┐
│ SIDEBAR 260px      │  MAIN AREA                      │
│ ────────────────   │  ─────────────────────────────  │
│ [KLI Logo]         │  [Top Tabs: Chat | Upload]      │
│                    │                                  │
│ [+ New Chat]       │  ── CHAT TAB ──                 │
│                    │  [Message Thread — scrollable]  │
│ Chat History:      │  User message →                 │
│ • K18 Products     │  ← AI response with cards       │
│ • Sunscreen Q      │                                  │
│ • Miami client     │  [Input Bar fixed at bottom]    │
│                    │  [Quick prompts on empty state] │
│ ────────────────   │                                  │
│ [📤 Upload Data]   │  ── UPLOAD TAB ──               │
│ [⚙ Settings]      │  [Drag & Drop Excel Uploader]   │
└──────────────────────────────────────────────────────┘
```

---

## SECTION 1: CHAT INTERFACE

### Sidebar
- Background: #0A0A0A, width 260px, collapsible on mobile
- Logo: "KLI" Cormorant Garamond 600 #C9A84C 26px / "BRANDS" DM Sans 400 #A09080 10px letter-spacing 0.35em
- "New Chat" button: full width, transparent, 1px gold border, gold text
- Chat history items: DM Sans 14px #A09080, hover → 3px gold left border, active → #1A1A1A bg
- "Upload Data" nav button above Settings (bottom of sidebar)

### User Message Bubble
- Align right, background #242424, border 1px solid rgba(201,168,76,0.3)
- Border radius: 16px 4px 16px 16px, padding 12px 16px, DM Sans 14px #F8F4F0

### AI Message Bubble
- Align left, background #1A1A1A, left border 3px solid #C9A84C
- Border radius: 4px 16px 16px 16px, padding 16px, DM Sans 14px #F8F4F0
- Supports markdown: bold, bullets, inline code

### Product Card (inside AI responses)
```
┌─────────────────────────────────────────────┐
│  EMINENCE                SKINCARE           │
│  Stone Crop Cleansing Oil                   │
│  ─────────────────────────────────────────  │
│  5 oz    |    SKU: EMINENCE-023254          │
│                                             │
│  ~~$59.00~~  →  Offer: $25.96  [-56%]      │
│  Available: 1,830 units                     │
└─────────────────────────────────────────────┘
```
- Background #111111, border 1px solid #242424, radius 12px
- Original price: JetBrains Mono line-through #5A5550
- Offer price: JetBrains Mono 500 #C9A84C 18px
- Discount pill: rgba(201,168,76,0.12) bg, #C9A84C text
- Grid: 2 col desktop, 1 col mobile

### Chat Input Bar
- Pill shape (radius 9999px), background #1A1A1A, border 1px solid #242424
- Focus: border #C9A84C + glow box-shadow
- Send button: circle 40px, background #C9A84C, icon #0A0A0A
- Enter = send, Shift+Enter = newline

### Typing Indicator
- 3 gold dots (#C9A84C), staggered opacity pulse 0.4s, delay 0.15s each

### Empty State
- Centered KLI logo 64px, tagline "Your Wholesale Beauty Expert" (Cormorant Garamond 300 italic #A09080)
- 4 quick prompt pills: "Show me K18 hair products" | "Sunscreens under $30" | "Best skincare deals" | "Find shampoos and oils"

### Chat Webhook Call
```javascript
async function sendChatMessage(userMessage, sessionId) {
  const res = await fetch(CHAT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatInput: userMessage,   // FULL query — never shorten or summarize
      sessionId: sessionId      // UUID for conversation continuity
    })
  });
  const data = await res.json();
  return data.output || data.text || data.message || '';
}
```

---

## SECTION 2: DATA UPLOAD PANEL

### Upload Panel Layout
```
┌────────────────────────────────────────────────────┐
│  📊 Upload Product Data                            │
│  Add new catalog sheets or update existing data    │
│  ─────────────────────────────────────────────     │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │     📁  Drag & drop your file here           │  │
│  │         or click to browse                   │  │
│  │                                              │  │
│  │     Supports: .xlsx  .xls  .csv  .ods        │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [📄 product_catalog_nov.xlsx   2.4MB    ✕]        │
│                                                    │
│  [        Upload to Database         ]             │
│                                                    │
│  ── Recent Uploads ──────────────────────────────  │
│  ✅ catalog_oct.xlsx      Oct 15, 2025  342 rows   │
│  ✅ k18_products.xlsx     Oct 10, 2025   48 rows   │
│  ❌ broken_file.csv       Oct 8, 2025   Failed     │
└────────────────────────────────────────────────────┘
```

### Dropzone
- Background #111111, border 2px dashed #242424, radius 16px, min-height 200px
- Drag-over state: border-color #C9A84C, background rgba(201,168,76,0.04)
- Icon: #A09080, text DM Sans 15px #A09080

### File Selected Chip
- DM Sans 13px, background #1A1A1A, border 1px solid #C9A84C, radius 8px
- Show filename + file size + ✕ remove button

### Upload Button States
```
Idle:       [ Upload to Database ]        ← gold bg, black text
Uploading:  [ ⟳  Uploading...   ]        ← disabled, gold progress bar below
Processing: [ ⏳  Processing...  ]        ← "n8n is indexing your data..."
Success:    [ ✅  Upload Complete! ]      ← auto-reset to Idle after 3s
Error:      [ ❌  Upload Failed   ]       ← show error message below + Retry
```
Progress bar: full width, height 3px, background #242424, animated gold fill

### Upload Webhook Call
```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);            // the actual file binary
  formData.append('fileName', file.name);   // filename as metadata

  const res = await fetch(UPLOAD_WEBHOOK_URL, {
    method: 'POST',
    // ⚠️ DO NOT set Content-Type header manually
    // Browser automatically sets multipart/form-data with correct boundary
    body: formData
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return await res.json();
}
```

### Client-side File Validation (run BEFORE uploading)
```javascript
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.ods'];
const MAX_SIZE_MB = 50;

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file type. Please use: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` };
  }
  return { valid: true };
}
```

### Recent Uploads History
- Store in localStorage: `kli_upload_history` (array, max 20 items)
- Each entry: `{ filename, date, status: 'success'|'error', rowCount?, errorMsg? }`
- Display last 10 in reverse chronological order
- ✅ green (#4CAF79) for success, ❌ red (#E05555) for error

---

## SETTINGS PANEL

Slide-out panel from gear icon in sidebar bottom:

```
⚙ Settings
──────────────────────────────────────
Chat Webhook URL
[https://n8n.domain/webhook/9b3b1b...] [Test]

Upload Webhook URL
[https://n8n.domain/webhook/f5afde...] [Test]

──────────────────────────────────────
[🗑 Clear All Chat History ]   ← danger/red
[🗑 Clear Upload History   ]   ← danger/red

v1.0.0
```

- Store URLs in localStorage: `kli_chat_webhook` + `kli_upload_webhook`
- "Test" buttons: send a ping and show ✅ Connected or ❌ Failed

---

## SESSION MANAGEMENT (Chat)

```javascript
// localStorage key: kli_sessions
{
  sessionId: "uuid-v4",
  name: "first 40 chars of first message",
  messages: [
    { role: "user", content: "...", timestamp: "ISO" },
    { role: "assistant", content: "...", timestamp: "ISO" }
  ],
  createdAt: "ISO",
  updatedAt: "ISO"
}
```

---

## ANIMATIONS

| Event              | Animation                              | Duration |
|--------------------|----------------------------------------|----------|
| Message entry      | opacity 0→1, translateY 8px→0         | 200ms    |
| Product card entry | opacity 0→1, scale 0.98→1             | 250ms    |
| Input focus        | gold border glow                       | 150ms    |
| Sidebar hover      | left border gold reveal                | 120ms    |
| Tab switch         | fade cross-dissolve                    | 150ms    |
| Dropzone drag-over | border color + bg tint                 | 150ms    |
| Upload success     | checkmark scale pop                    | 300ms    |

Easing: `cubic-bezier(0.16, 1, 0.3, 1)` on all transitions

---

## MOBILE RESPONSIVE

- `< 768px`: sidebar collapses → hamburger top-left, opens as full overlay
- Bottom nav bar on mobile: [💬 Chat] [📤 Upload] [⚙ Settings]
- Product cards: single column stack
- Upload dropzone: full width, taller touch target (min-height 160px)
- Input bar: fixed bottom, full width

---

## ERROR HANDLING

**Chat errors:** Inline in message thread — "Couldn't reach the server. Please try again." + Retry button (ghost gold style)

**Upload errors:**
- "File type not supported. Use .xlsx, .xls, .csv, or .ods"
- "Upload failed. Check the Upload Webhook URL in Settings."
- "Server timeout. The file may be processing — check n8n."
- "File too large. Maximum 50MB."

---

## ABSOLUTE DON'TS

- ❌ NO white or light backgrounds anywhere
- ❌ NO Inter, Roboto, Arial, system-ui fonts
- ❌ NO purple, teal, or blue accent colors
- ❌ NO raw backend field names shown to user (vectorText, embedding, payload, sku label)
- ❌ NO generic SaaS layouts
- ❌ NO loading spinners — gold 3-dot pulse for chat, gold progress bar for upload
- ❌ NEVER manually set Content-Type on FormData uploads
- ❌ NEVER truncate chatInput before sending to webhook
- ❌ NEVER show JSON blobs or stack traces to the user