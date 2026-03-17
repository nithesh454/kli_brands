# AUTH: KLI Brands Intelligence — Authentication Page

## Overview
Build a premium full-screen authentication page for the KLI Brands Intelligence app.
Read `brandguidelines.md` before building anything. All colors, fonts, spacing, and
component rules from that document apply here.

---

## Page Layout

Two-panel full-screen layout on desktop. Stacked on mobile.

```
┌─────────────────────────┬──────────────────────────┐
│                         │                          │
│   LEFT PANEL (45%)      │   RIGHT PANEL (55%)      │
│   Brand / Decorative    │   Login Form             │
│                         │                          │
└─────────────────────────┴──────────────────────────┘

Mobile (< 768px):
┌──────────────────────────┐
│  TOP STRIP               │  ← Left panel becomes compact top bar
│  KLI Logo + Tagline      │
├──────────────────────────┤
│                          │
│  LOGIN CARD (centered)   │
│                          │
└──────────────────────────┘
```

---

## Left Panel

- Full height
- Background: subtle vertical gradient from `var(--accent-soft)` at top to `var(--bg-secondary)` at bottom
- No images, no patterns — clean and minimal

### Content (vertically centered)
```
KLI                         ← Playfair Display 600, var(--accent-primary), 32px
BRANDS                      ← Outfit 500, var(--text-muted), 11px, letter-spacing 0.4em, uppercase

[spacer 32px]

"The Professional           ← Playfair Display 400 italic, var(--text-secondary), 20px
 Beauty Standard"

[spacer 48px]

Feature lines (3 items):
  · Smart product search across your entire catalog
  · AI-powered customer inquiry analysis
  · Real-time wholesale pricing intelligence
```

Feature line style:
- Outfit 400, 14px, `var(--text-secondary)`
- Each line preceded by a 6px circle dot in `var(--accent-primary)`
- 16px vertical gap between lines
- No icons, no emojis — dot only

### Mobile Top Strip
- Height: 80px
- Background: `var(--accent-primary)`
- Show only: KLI BRANDS logo centered, white color
- No feature lines on mobile

---

## Right Panel

Centered vertically and horizontally. Contains a single login card.

### Login Card
- Light theme: bg `#FFFFFF`, border `1px solid var(--border-subtle)`, shadow `var(--shadow-md)`
- Dark theme: bg `var(--bg-secondary)`, border `1px solid var(--border-default)`, shadow `var(--shadow-lg)`
- Border radius: 16px
- Padding: 48px
- Width: 420px max, full width on mobile with 24px margin

### Card Content (top to bottom)

```
"Welcome back"              ← Playfair Display 500, var(--text-primary), 28px

[spacer 8px]

"Sign in to access          ← Outfit 400, var(--text-secondary), 14px
 KLI Intelligence"

[spacer 40px]

[ Google Sign-In Button ]   ← Custom styled (see below)

[spacer 20px]

"Access restricted to       ← Outfit 400, var(--text-muted), 12px, centered
 authorized KLI Brands
 team members only"
```

### Google Sign-In Button (Custom Styled — NOT default Google button)
- Width: 100%
- Height: 48px
- Light theme: bg `#FFFFFF`, border `1px solid var(--border-default)`, text `var(--text-primary)`
- Dark theme: bg `var(--bg-tertiary)`, border `1px solid var(--border-strong)`, text `var(--text-primary)`
- Border radius: 8px
- Font: Outfit 500 14px
- Layout: Google logo SVG on left (20px), text "Continue with Google" centered
- Hover: border-color → `var(--accent-primary)`, transition 150ms
- Active: scale(0.99), transition 100ms
- No shadow on button

Google logo SVG (use this exact inline SVG):
```html
<svg width="20" height="20" viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
```

---

## Theme Toggle

Position: top-right corner of the right panel (or top-right of full page)

- Sun icon (light theme active) / Moon icon (dark theme active)
- Lucide SVG icons, stroke 1.5px, size 20px, color `var(--text-muted)`
- Hover: color → `var(--text-primary)`
- No label text — icon only
- On click: toggle class on `<html>` element between `theme-light` and `theme-noir`
- Save to localStorage key: `kli_theme`
- Load saved theme on page init before rendering

---

## Google OAuth Implementation

### Load Google Identity Services
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Configuration
```javascript
// ─────────────────────────────────────────────
// REPLACE THESE VALUES BEFORE GOING LIVE
// ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID = "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE";

const ALLOWED_USERS = [
  { email: "PASTE_ADMIN_EMAIL_HERE",  role: "admin"    },
  { email: "PASTE_STAFF_EMAIL_HERE",  role: "staff"    },
  { email: "PASTE_VIEWER_EMAIL_HERE", role: "readonly" }
  // Add more users as needed
];
// ─────────────────────────────────────────────
```

### Initialize on Page Load
```javascript
window.onload = function () {
  // Apply saved theme first
  const savedTheme = localStorage.getItem('kli_theme') || 'light';
  document.documentElement.className = `theme-${savedTheme}`;

  // Check if already logged in
  const existingUser = checkAuth();
  if (existingUser) {
    redirectToApp();
    return;
  }

  // Initialize Google Sign-In
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  // Render the button into our custom button element
  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn'),
    { type: 'standard', theme: 'outline', size: 'large' }
  );
};
```

### Handle Login Response
```javascript
function handleGoogleLogin(response) {
  // Decode JWT from Google
  const userData = parseJwt(response.credential);

  // Check allowlist
  const allowed = ALLOWED_USERS.find(u => u.email === userData.email);

  if (!allowed) {
    showAccessDenied(userData.email);
    return;
  }

  // Build user object
  const user = {
    email:     userData.email,
    name:      userData.name,
    picture:   userData.picture,
    role:      allowed.role,
    googleId:  userData.sub,
    loginTime: Date.now()
  };

  // Save session
  localStorage.setItem('kli_user', JSON.stringify(user));

  // Send to n8n webhook then redirect
  sendLoginEventToWebhook(user);
}
```

### JWT Decoder
```javascript
function parseJwt(token) {
  const base64 = token.split('.')[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}
```

---

## Webhook — Send Login Event to n8n

Fire this immediately after successful login, before redirecting to the app.

```javascript
async function sendLoginEventToWebhook(user) {
  try {
    await fetch(
      "https://solarx.app.n8n.cloud/webhook-test/fb7ae151-5676-4763-84d7-7a3e77e6fe5e",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event:     "user_login",
          timestamp: new Date().toISOString(),
          user: {
            email:     user.email,
            name:      user.name,
            picture:   user.picture,
            role:      user.role,
            googleId:  user.googleId,
            loginTime: user.loginTime
          }
        })
      }
    );
  } catch (err) {
    // Webhook failure should NOT block login
    console.warn("Webhook notification failed:", err);
  } finally {
    // Always redirect regardless of webhook result
    redirectToApp();
  }
}
```

**Important:** Webhook failure must never block the user from logging in.
Always redirect in the `finally` block.

---

## Session Management

### Check Auth (run on every page before rendering)
```javascript
function checkAuth() {
  const raw = localStorage.getItem('kli_user');
  if (!raw) return null;

  const user = JSON.parse(raw);
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;

  if (Date.now() - user.loginTime > EIGHT_HOURS) {
    localStorage.removeItem('kli_user');
    return null;
  }

  return user;
}
```

### Redirect to App
```javascript
function redirectToApp() {
  window.location.href = "/app"; // update to actual app route
}
```

### Sign Out (call from app sidebar)
```javascript
function signOut() {
  localStorage.removeItem('kli_user');
  google.accounts.id.disableAutoSelect();
  window.location.href = "/login";
}
```

---

## Access Denied Screen

Show this instead of the login card when the Google account is not in the allowlist.
Do NOT redirect — stay on the same page and swap the card content.

```
┌──────────────────────────────────────┐
│                                      │
│   Access Denied                      │  ← Playfair Display 500, accent-primary, 24px
│                                      │
│   Your account is not authorized     │  ← Outfit 400, text-secondary, 14px
│   to access KLI Intelligence.        │
│                                      │
│   Contact your KLI Brands            │  ← Outfit 400, text-muted, 12px
│   administrator to request access.   │
│                                      │
│   [ Try a different account ]        │  ← Secondary button style
│                                      │
└──────────────────────────────────────┘
```

"Try a different account" button onclick:
```javascript
function resetLogin() {
  google.accounts.id.disableAutoSelect();
  showLoginCard(); // swap back to the normal login card
}
```

---

## Loading State

Between clicking "Continue with Google" and the response arriving:
- Disable the button
- Replace button text with a subtle spinner (CSS animation, accent-primary color, no emoji)
- Spinner: 18px circle, 2px border, accent-primary top border, border-default rest, rotate 0.7s linear infinite
- Do not show any loading overlay on the full page — button state only

---

## Animations

| Element            | Animation                          | Duration |
|--------------------|------------------------------------|----------|
| Page load          | Right panel fade in + slide up 12px | 300ms   |
| Card appear        | opacity 0→1, translateY 8px→0      | 250ms    |
| Button hover       | border-color transition            | 150ms    |
| Access denied swap | fade cross-dissolve                | 200ms    |
| Theme toggle       | all CSS vars transition            | 200ms    |

Easing: `cubic-bezier(0.16, 1, 0.3, 1)` on all

---

## Mobile Responsive

- Below 768px: left panel becomes a top strip (80px, accent-primary bg, logo only)
- Login card: full width, 24px horizontal margin, reduced padding (28px)
- Theme toggle: moves to top-right of the top strip
- Font sizes scale down by ~10%

---

## What Data the n8n Webhook Receives

Every successful login sends this exact payload:

```json
{
  "event": "user_login",
  "timestamp": "2026-03-10T10:30:00.000Z",
  "user": {
    "email": "john@klibrands.com",
    "name": "John Smith",
    "picture": "https://lh3.googleusercontent.com/...",
    "role": "admin",
    "googleId": "108234567890123456789",
    "loginTime": 1741600200000
  }
}
```

In n8n you can use this to:
- Log every login to a Google Sheet
- Send a Slack/email alert when someone logs in
- Track usage per user over time
- Detect unauthorized access attempts (webhook fires but role check already blocked them — add a separate webhook call for denied attempts if needed)

---

## Absolute Rules

- No emojis anywhere on this page
- No gold or yellow colors
- No default Google button styling — always use the custom styled button
- No blocking the redirect if the webhook fails
- No showing the app content before auth check completes
- Both Pearl (light) and Noir (dark) themes must look equally premium
- Fonts: Playfair Display + Outfit only — no Inter, Roboto, or system fonts
- Icons: Lucide SVG stroke only — no filled icons