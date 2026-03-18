/* ============================================
   KLI BRANDS INTELLIGENCE — Auth Logic
   ============================================ */

// ─────────────────────────────────────────────
// REPLACE THESE VALUES BEFORE GOING LIVE!
// ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID = "827677866237-toga9ql7jqh60ut8tcckl8i5e0u6g6ol.apps.googleusercontent.com";
// ─────────────────────────────────────────────

const LS_THEME = 'kli_theme';
const LS_USER = 'kli_user';
const WEBHOOK_URL = "https://solarx.app.n8n.cloud/webhook/fb7ae151-5676-4763-84d7-7a3e77e6fe5e";

// ============================================
// INITIALIZATION
// ============================================

window.onload = function () {
    // Apply saved theme immediately
    const savedTheme = localStorage.getItem(LS_THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    lucide.createIcons();

    // If already logged in, redirect to app
    if (checkAuth()) {
        redirectToApp();
        return;
    }
};

// ============================================
// THEME HANDLING
// ============================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(LS_THEME, newTheme);

    const iconEl = document.getElementById('themeIcon');
    if (iconEl) {
        const newIconEl = document.createElement('i');
        newIconEl.id = 'themeIcon';
        newIconEl.setAttribute('data-lucide', newTheme === 'light' ? 'moon' : 'sun');
        iconEl.replaceWith(newIconEl);
        lucide.createIcons();
    }
}

function updateThemeIcon(theme) {
    const iconEl = document.getElementById('themeIcon');
    if (iconEl) {
        iconEl.setAttribute('data-lucide', theme === 'light' ? 'moon' : 'sun');
    }
}

// ============================================
// GOOGLE SIGN-IN FLOW
// ============================================

// Callback from Google
async function handleGoogleLogin(response) {
    try {
        const userData = parseJwt(response.credential);

        // Structure payload for n8n
        const payload = {
            event: "user_login_attempt",
            timestamp: new Date().toISOString(),
            user: {
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
                googleId: userData.sub
            }
        };

        // Wait for Webhook Authorization Response
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Webhook auth request failed");

        // Webhook must return JSON like: { "authorized": true, "role": "admin" }
        const authDecision = await res.json();

        if (authDecision.authorized === true) {
            // Authorized! Save to LS and redirect
            const finalUser = {
                ...payload.user, // Fallback to Google data
                ...authDecision, // Override with n8n data (name, email, picture, role, etc)
                loginTime: Date.now()
            };

            localStorage.setItem(LS_USER, JSON.stringify(finalUser));
            window.location.href = `/app/${finalUser.googleId}`;
        } else {
            // Webhook actively rejected the user
            showAccessDenied();
        }

    } catch (e) {
        console.warn("Auth Webhook failed:", e);
        // If n8n completely crashes, fail securely
        showAccessDenied();
    }
}

// ============================================
// SESSION UTILS
// ============================================

function checkAuth() {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;

    try {
        const user = JSON.parse(raw);
        const EIGHT_HOURS = 8 * 60 * 60 * 1000;

        if (Date.now() - user.loginTime > EIGHT_HOURS) {
            localStorage.removeItem(LS_USER);
            return null;
        }
        return user;
    } catch {
        return null;
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("JWT Parse Error", e);
        return {};
    }
}

// ============================================
// VIEW SWAPPING
// ============================================

function showAccessDenied() {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-denied').classList.add('active');
}

function resetLogin() {
    // Disable auto-select so it doesn't try the same blocked account
    if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }

    document.getElementById('view-denied').classList.remove('active');
    document.getElementById('view-login').classList.add('active');
}
