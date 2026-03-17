/* ============================================
   KLI Brands Intelligence — Application Logic v2.0
   ============================================ */

const DEFAULT_CHAT_URL = 'https://solarx.app.n8n.cloud/webhook-test/search';
const DEFAULT_UPLOAD_URL = 'https://solarx.app.n8n.cloud/webhook/f5afdefa-89e4-4be5-84f9-64a0cb849eec';

let sessions = [];
let activeSessionId = null;
let selectedFile = null;
let isLoading = false;

let activeUser = null;
const LS_USER = 'kli_user';
let LS_SESSIONS = 'kli_sessions';
let LS_CHAT_URL = 'kli_chat_webhook';
let LS_UPLOAD_URL = 'kli_upload_webhook';
let LS_UPLOAD_HISTORY = 'kli_upload_history';
let LS_THEME = 'kli_theme';
const GEMINI_API_KEY = 'AIzaSyDcgNyYJav5hCdcLrDQJSerCZ_v6qOfEX0';

class RequestQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }
    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }
    async process() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;
        const { requestFn, resolve, reject } = this.queue.shift();
        try {
            const result = await requestFn();
            resolve(result);
        } catch (err) {
            reject(err);
        } finally {
            this.isProcessing = false;
            this.process();
        }
    }
}
const chatQueue = new RequestQueue();

async function callWebhookWithRetry(url, payload, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

// ============================================
// INIT
// ============================================

async function init() {
    // Check authentication first
    activeUser = checkAuth();
    if (!activeUser) return;

    // Namespace keys per user
    const userId = activeUser.googleId;
    LS_SESSIONS = `kli_sessions_${userId}`;
    LS_CHAT_URL = `kli_chat_webhook_${userId}`;
    LS_UPLOAD_URL = `kli_upload_webhook_${userId}`;
    LS_UPLOAD_HISTORY = `kli_uploads_${userId}`;
    LS_THEME = `kli_theme_${userId}`;

    // Set personalized browser tab title
    document.title = `${activeUser.name} — KLI Intelligence`;

    // Populate user profile in UI
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    if (userPhoto && activeUser.picture) userPhoto.src = activeUser.picture;
    if (userName && activeUser.name) userName.textContent = activeUser.name;
    if (userEmail && activeUser.email) userEmail.textContent = activeUser.email;

    // Style the role badge dynamically
    if (userRole) {
        const roleText = activeUser.role || 'readonly';
        userRole.textContent = roleText;
        userRole.className = `user-role role-${roleText}`;
    }

    // Role-based UI guards (Hide upload for readonly)
    if (activeUser.role === 'readonly') {
        const tabUpload = document.getElementById('tabUpload');
        const navUpload = document.getElementById('navUpload');
        if (tabUpload) tabUpload.style.display = 'none';
        if (navUpload) navUpload.style.display = 'none';
    }

    initTheme();
    await loadSessions();
    loadSettings();
    renderSessionList();
    renderUploadHistory();
    lucide.createIcons();

    const input = document.getElementById('chatInput');
    input.addEventListener('input', () => {
        document.getElementById('btnSend').disabled = !input.value.trim() || !activeSessionId;
    });

    if (sessions.length > 0) {
        loadSession(sessions[0].sessionId);
    } else {
        input.disabled = true;
        input.placeholder = "Click 'New Chat' to start messaging...";
    }
    
    initSidebarResizer();
}

// ============================================
// THEME
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem(LS_THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(LS_THEME, newTheme);

    // Re-create icon to clear out previous data-lucide
    const iconEl = document.getElementById('themeIcon');
    const newIconEl = document.createElement('i');
    newIconEl.id = 'themeIcon';
    newIconEl.setAttribute('data-lucide', newTheme === 'light' ? 'moon' : 'sun');
    iconEl.replaceWith(newIconEl);
    lucide.createIcons();
}

function updateThemeIcon(theme) {
    const iconEl = document.getElementById('themeIcon');
    if (iconEl) {
        iconEl.setAttribute('data-lucide', theme === 'light' ? 'moon' : 'sun');
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

// Session ID generation now handled by backend

async function loadSessions() {
    // Show a loading indicator in the UI while fetching
    const container = document.getElementById('chatHistory');
    if (container) {
        container.innerHTML = '<div class="chat-history-label">Recent Chats <i data-lucide="loader" class="icon-sm" style="animation: spin 1s linear infinite;"></i></div>';
        lucide.createIcons();
    }

    try {
        const res = await fetch('https://solarx.app.n8n.cloud/webhook/kli-load-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: activeUser.googleId })
        });

        if (res.ok) {
            let data = await res.json();

            // n8n often returns the response as an array of items, so we check and unwrap if needed
            if (Array.isArray(data) && data.length > 0) {
                data = data[0];
            }

            if (data && data.success && Array.isArray(data.sessions)) {
                sessions = data.sessions.map(s => {
                    // Deduplicate messages based on exact content and role
                    const uniqueMessages = [];
                    const seenSignatures = new Set();
                    
                    const sortedMessages = (s.messages || []).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

                    for (const m of sortedMessages) {
                        const sig = `${m.role}|${m.message.trim()}`;
                        if (!seenSignatures.has(sig)) {
                            seenSignatures.add(sig);
                            uniqueMessages.push({
                                role: m.role,
                                content: m.message,
                                timestamp: m.created_at
                            });
                        }
                    }

                    return {
                        sessionId: s.session_id,
                        name: s.session_name || 'Chat',
                        createdAt: s.created_at,
                        updatedAt: s.updated_at,
                        messages: uniqueMessages
                    };
                });
            } else {
                sessions = [];
            }
        } else {
            console.error('Failed to load history from backend, falling back to local storage.');
            try { sessions = JSON.parse(localStorage.getItem(LS_SESSIONS)) || []; } catch { sessions = []; }
        }
    } catch (err) {
        console.error('Error fetching history:', err);
        try { sessions = JSON.parse(localStorage.getItem(LS_SESSIONS)) || []; } catch { sessions = []; }
    }

    // Save to local storage as fallback cache
    saveSessions();
}

function saveSessions() {
    localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
}

function openNewSessionModal() {
    document.getElementById('newSessionNameInput').value = '';
    document.getElementById('newSessionOverlay').classList.add('open');
    closeSidebar();
    setTimeout(() => document.getElementById('newSessionNameInput').focus(), 100);
}

function closeNewSessionModal() {
    document.getElementById('newSessionOverlay').classList.remove('open');
}

async function confirmNewSession() {
    const inputEl = document.getElementById('newSessionNameInput');
    const sessionName = inputEl.value.trim() || 'New Chat';
    const btn = document.getElementById('btnConfirmSession');

    // UI Loading state
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="icon-sm"></i> Creating...';
    lucide.createIcons();
    inputEl.disabled = true;

    try {
        const customSessionId = `${activeUser.googleId}_${Date.now()}`;

        const payload = {
            action: 'create',
            session_id: customSessionId,
            user_id: activeUser.googleId,
            user_email: activeUser.email,
            user_name: activeUser.name,
            session_name: sessionName
        };

        const res = await fetch('https://solarx.app.n8n.cloud/webhook/091354bc-cd66-49bc-824a-73e6285cfbef', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to create session on backend');

        // The backend no longer returns the session_id, we just sent it.
        const sessionId = customSessionId;

        if (!sessionId) throw new Error('Backend did not return a session_id');

        const session = {
            sessionId: sessionId,
            name: sessionName,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        sessions.unshift(session);
        saveSessions();

        closeNewSessionModal();
        loadSession(session.sessionId);
        renderSessionList();
    } catch (err) {
        console.error('Session creation error:', err);
        // Only alert if the backend fetch itself failed (not a JS error after success)
        if (err.message && err.message.includes('Failed to create session')) {
            alert("Failed to create session. Ensure webhook is active.");
        }
    } finally {
        btn.disabled = false;
        btn.innerText = 'Create Chat';
        inputEl.disabled = false;
    }
}

function loadSession(sessionId) {
    activeSessionId = sessionId;
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    // Unlock input
    const input = document.getElementById('chatInput');
    input.disabled = false;
    input.placeholder = "Ask about products, prices, brands...";

    renderSessionList();
    renderMessages(session.messages);
}

function getActiveSession() { return sessions.find(s => s.sessionId === activeSessionId); }

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderSessionList() {
    const list = document.getElementById('chatHistory'); // Changed from 'sessionList' to 'chatHistory' to match existing HTML
    list.innerHTML = '<div class="chat-history-label">Recent Chats</div>' + sessions.map(s => `
    <div class="session-item ${s.sessionId === activeSessionId ? 'active' : ''}" onclick="loadSession('${escapeAttr(s.sessionId)}')">
      <i data-lucide="message-square" class="icon-sm"></i>
      <span class="session-item-name" title="${escapeAttr(s.name)}">${escapeHtml(s.name)}</span>
      
      <button class="session-actions-menu" onclick="toggleSessionMenu(event, '${escapeAttr(s.sessionId)}')">
        <i data-lucide="more-vertical" class="icon-sm"></i>
      </button>

      <div class="session-dropdown" id="dropdown-${escapeAttr(s.sessionId)}">
          <div class="session-dropdown-item" onclick="renameSession(event, '${escapeAttr(s.sessionId)}')">
              <i data-lucide="edit-2" class="icon-sm"></i> Rename
          </div>
          <div class="session-dropdown-item danger" onclick="clearSessionChat(event, '${escapeAttr(s.sessionId)}')">
              <i data-lucide="eraser" class="icon-sm"></i> Clear Chat
          </div>
          <div class="session-dropdown-item danger" onclick="deleteSession(event, '${escapeAttr(s.sessionId)}')">
              <i data-lucide="trash-2" class="icon-sm"></i> Delete
          </div>
      </div>
    </div>
  `).join('');
    lucide.createIcons();

    // Close dropdowns clicking outside
    document.addEventListener('click', closeAllSessionMenus);
}

function toggleSessionMenu(e, id) {
    e.stopPropagation();
    const dropdown = document.getElementById(`dropdown-${id}`);
    const isShowing = dropdown.classList.contains('show');
    closeAllSessionMenus();
    if (!isShowing) dropdown.classList.add('show');
}

function closeAllSessionMenus() {
    document.querySelectorAll('.session-dropdown.show').forEach(d => d.classList.remove('show'));
}

let confirmActionCallback = null;

function closeConfirmModal() {
    document.getElementById('confirmOverlay').classList.remove('open');
    confirmActionCallback = null;
}

function showConfirmModal(title, message, isDanger, isInput, defaultValue, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    const inputGroup = document.getElementById('confirmInputGroup');
    const inputEl = document.getElementById('confirmInput');
    
    if (isInput) {
        inputGroup.style.display = 'block';
        inputEl.value = defaultValue || '';
    } else {
        inputGroup.style.display = 'none';
    }

    const actionBtn = document.getElementById('confirmActionBtn');
    actionBtn.className = isDanger ? 'btn-danger' : 'btn-primary';
    actionBtn.innerHTML = 'Confirm';
    actionBtn.disabled = false;
    
    document.getElementById('confirmCancelBtn').disabled = false;
    document.getElementById('confirmCloseBtn').disabled = false;
    
    if (isInput) inputEl.disabled = false;

    confirmActionCallback = callback;
    document.getElementById('confirmOverlay').classList.add('open');
    
    if (isInput) {
        setTimeout(() => inputEl.focus(), 100);
    }
}

async function executeConfirmAction() {
    if (!confirmActionCallback) return;
    
    const actionBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const closeBtn = document.getElementById('confirmCloseBtn');
    const inputEl = document.getElementById('confirmInput');
    
    actionBtn.disabled = true;
    cancelBtn.disabled = true;
    closeBtn.disabled = true;
    inputEl.disabled = true;
    
    // Show spinner
    const originalText = actionBtn.innerHTML;
    actionBtn.innerHTML = '<i data-lucide="loader" class="icon-sm" style="animation: spin 1s linear infinite;"></i> Executing...';
    lucide.createIcons();

    const inputValue = inputEl.value;
    
    try {
        await confirmActionCallback(inputValue);
        closeConfirmModal();
    } catch (err) {
        console.error(err);
        alert(err.message || 'Action failed.');
        
        // Reset state so they can try again or cancel
        actionBtn.disabled = false;
        cancelBtn.disabled = false;
        closeBtn.disabled = false;
        inputEl.disabled = false;
        actionBtn.innerHTML = originalText;
        lucide.createIcons();
    }
}

function renameSession(e, sessionId) {
    e.stopPropagation();
    closeAllSessionMenus();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    showConfirmModal(
        'Rename Session', 
        'Enter a new name for this session:', 
        false, 
        true, 
        session.name, 
        async (newName) => {
            if (!newName || newName.trim() === "" || newName === session.name) return;
            const oldName = session.name;
            
            // Block until webhook succeeds
            await sendSessionActionWebhook(sessionId, 'rename', { old_name: oldName, new_name: newName });
            
            // Webhook succeeded, update UI
            session.name = newName;
            saveSessions();
            renderSessionList();
        }
    );
}

function clearSessionChat(e, sessionId) {
    e.stopPropagation();
    closeAllSessionMenus();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    showConfirmModal(
        'Clear Chat History', 
        `Are you sure you want to completely clear all messages from "${session.name}"? This action cannot be undone.`, 
        true, 
        false, 
        null, 
        async () => {
            // Block until webhook succeeds
            await sendSessionActionWebhook(sessionId, 'clear', null);
            
            // Webhook succeeded, update UI
            session.messages = [];
            session.updatedAt = new Date().toISOString();
            saveSessions();
            if (activeSessionId === sessionId) renderMessages(session.messages);
        }
    );
}

function deleteSession(e, sessionId) {
    e.stopPropagation();
    closeAllSessionMenus();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    showConfirmModal(
        'Delete Session', 
        `Are you sure you want to permanently delete "${session.name}"? All history will be completely removed.`, 
        true, 
        false, 
        null, 
        async () => {
            // Block until webhook succeeds
            await sendSessionActionWebhook(sessionId, 'delete', null);
            
            // Webhook succeeded, update UI
            sessions = sessions.filter(s => s.sessionId !== sessionId);
            saveSessions();

            if (activeSessionId === sessionId) {
                activeSessionId = null;
                if (sessions.length > 0) {
                    loadSession(sessions[0].sessionId);
                } else {
                    showEmptyState();
                    const input = document.getElementById('chatInput');
                    input.disabled = true;
                    input.placeholder = "Click 'New Chat' to start messaging...";
                    input.value = '';
                    document.getElementById('btnSend').disabled = true;
                }
            } else {
                renderSessionList();
            }
        }
    );
}

async function sendSessionActionWebhook(sessionId, action, additionalData = null) {
    const session = sessions.find(s => s.sessionId === sessionId);
    const sessionName = session ? session.name : "Deleted Session";

    const payload = {
        action: action, // 'create', 'rename', 'clear', 'delete'
        session_id: sessionId,
        user_id: activeUser.googleId,
        user_email: activeUser.email,
        user_name: activeUser.name,
        session_name: sessionName,
        timestamp: new Date().toISOString(),
        ...(additionalData || {})
    };

    try {
        const res = await fetch('https://solarx.app.n8n.cloud/webhook/091354bc-cd66-49bc-824a-73e6285cfbef', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            throw new Error(`Webhook returned status ${res.status}`);
        }
        
    } catch (err) {
        console.error(`Failed to send ${action} webhook:`, err);
        throw new Error('Could not connect to webhook.');
    }
}

function getActiveSession() { return sessions.find(s => s.sessionId === activeSessionId); }

// ============================================
// RENDER FUNCTIONS
// ============================================


function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    const innerWrap = document.getElementById('messagesInnerWrap') || container;
    const emptyState = document.getElementById('emptyState');

    if (!messages || messages.length === 0) {
        showEmptyState();
        return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'flex';

    innerWrap.innerHTML = messages.map((msg, index) => {
        return `
      <div class="message ${msg.role}">
        ${msg.role === 'assistant' ? `<div class="message-avatar"><i data-lucide="sparkles"></i></div>` : ''}
        <div class="message-content-wrapper">
            <div class="message-bubble">${msg.role === 'user' ? escapeHtml(msg.content) : formatAIResponse(msg.content)}</div>
            ${msg.role === 'assistant' ? `
            <div class="message-actions">
                <button class="btn-ghost" onclick="copyMessage(this)" title="Copy"><i data-lucide="copy" class="icon-sm"></i></button>
                ${index === messages.length - 1 ? `<button class="btn-ghost" onclick="retryLastMessage()" title="Retry"><i data-lucide="rotate-cw" class="icon-sm"></i></button>` : ''}
            </div>
            ` : ''}
        </div>
        <div class="message-time">${formatTime(msg.timestamp)}</div>
      </div>`;
    }).join('');
    lucide.createIcons();
    scrollToBottom();
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('messagesContainer').style.display = 'none';
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    requestAnimationFrame(() => container.scrollTop = container.scrollHeight);
}

function appendMessage(role, content, animate = false) {
    const container = document.getElementById('messagesContainer');
    const innerWrap = document.getElementById('messagesInnerWrap') || container;
    const emptyState = document.getElementById('emptyState');
    emptyState.style.display = 'none';
    container.style.display = 'flex';

    const div = document.createElement('div');
    div.className = `message ${role}`;

    if (role === 'assistant') {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i data-lucide="sparkles"></i>';
        div.appendChild(avatar);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    if (!animate) {
        bubble.innerHTML = role === 'user' ? escapeHtml(content) : formatAIResponse(content);
    }
    wrapper.appendChild(bubble);

    if (role === 'assistant') {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.innerHTML = `
            <button class="btn-ghost" onclick="copyMessage(this)" title="Copy"><i data-lucide="copy" class="icon-sm"></i></button>
            <button class="btn-ghost" onclick="retryLastMessage()" title="Retry"><i data-lucide="rotate-cw" class="icon-sm"></i></button>
        `;
        wrapper.appendChild(actions);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date().toISOString());

    div.appendChild(wrapper); div.appendChild(time);
    innerWrap.appendChild(div);
    lucide.createIcons();
    
    if (animate && role === 'assistant') {
        animateTypingHTML(bubble, formatAIResponse(content));
    } else {
        scrollToBottom();
    }
}

function animateTypingHTML(element, htmlString) {
    element.innerHTML = '';
    let i = 0;
    const charsPerFrame = 2; // Controls typing speed

    function frame() {
        if (i < htmlString.length) {
            let chunk = '';
            for(let j=0; j<charsPerFrame && i < htmlString.length; j++) {
                let char = htmlString.charAt(i);
                chunk += char;
                if (char === '<') {
                    // Fast forward to end of HTML tag
                    let tagEnd = htmlString.indexOf('>', i);
                    if (tagEnd !== -1) {
                        chunk += htmlString.substring(i + 1, tagEnd + 1);
                        i = tagEnd;
                    }
                }
                i++;
            }
            element.innerHTML = htmlString.substring(0, i);
            scrollToBottom();
            requestAnimationFrame(frame);
        } else {
            element.innerHTML = htmlString;
            scrollToBottom();
        }
    }
    requestAnimationFrame(frame);
}

function showTypingIndicator() {
    const container = document.getElementById('messagesContainer');
    const innerWrap = document.getElementById('messagesInnerWrap') || container;
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    innerWrap.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function showChatError(errorMsg, userMessage) {
    const container = document.getElementById('messagesContainer');
    const innerWrap = document.getElementById('messagesInnerWrap') || container;
    const div = document.createElement('div');
    div.className = 'message-error';
    div.style.background = 'rgba(220,38,38,0.08)';
    div.style.border = '1px solid rgba(220,38,38,0.2)';
    div.style.padding = '12px 16px';
    div.style.borderRadius = 'var(--radius-lg)';
    div.style.color = 'var(--error)';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = 'var(--space-3)';
    div.style.alignSelf = 'flex-start';

    div.innerHTML = `
    <i data-lucide="alert-circle" class="icon-sm"></i>
    <span>${escapeHtml(errorMsg)}</span>
    <button class="btn-danger" style="margin-left:auto; padding:4px 12px; font-size:12px;" onclick="retrySend('${escapeAttr(userMessage)}')">Retry</button>
  `;
    innerWrap.appendChild(div);
    lucide.createIcons();
    scrollToBottom();
}

// ============================================
// CHAT WEBHOOK
// ============================================

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || isLoading || input.disabled) return;

    if (!activeSessionId) return; // Prevent entirely if somehow bypassed
    const session = getActiveSession();
    if (!session) return;

    if (session.messages.length === 0) {
        session.name = text.substring(0, 40);
        renderSessionList();
    }

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    session.messages.push(userMsg);
    session.updatedAt = new Date().toISOString();
    saveSessions();
    appendMessage('user', text);

    input.value = '';
    input.style.height = 'auto';
    document.getElementById('btnSend').disabled = true;

    isLoading = true;
    showTypingIndicator();

    try {
        const chatUrl = getChatWebhookUrl();
        const payload = {
            chatInput: text,
            sessionId: session.sessionId,
            userId: activeUser.googleId,
            userEmail: activeUser.email,
            userName: activeUser.name,
            role: 'user'
        };

        const data = await chatQueue.add(() => callWebhookWithRetry(chatUrl, payload));
        let aiText = data.output || data.text || data.message || (typeof data === 'string' ? data : JSON.stringify(data));
        
        // Gemini Formatting
        if (GEMINI_API_KEY) {
            aiText = await formatWithGemini(aiText, GEMINI_API_KEY);
        }

        removeTypingIndicator();

        const aiMsg = { role: 'assistant', content: aiText, timestamp: new Date().toISOString() };
        session.messages.push(aiMsg);
        session.updatedAt = new Date().toISOString();
        saveSessions();
        appendMessage('assistant', aiText, true);
    } catch (err) {
        removeTypingIndicator();
        showChatError("Couldn't reach the server. Please try again.", text);
    } finally {
        isLoading = false;
    }
}

function retrySend(text) {
    document.querySelectorAll('.message-error').forEach(e => e.remove());
    const input = document.getElementById('chatInput');
    input.value = text;
    document.getElementById('btnSend').disabled = false;
    sendMessage();
}

function sendQuickPrompt(text) {
    const input = document.getElementById('chatInput');
    input.value = text;
    document.getElementById('btnSend').disabled = false;
    sendMessage();
}

function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResizeInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function formatAIResponse(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // Ensure headings format to bold paragraphs
    html = html.replace(/^###\s+(.+)$/gm, '<p style="margin-bottom:8px"><strong>$1</strong></p>');
    html = html.replace(/^##\s+(.+)$/gm, '<p style="margin-bottom:8px"><strong>$1</strong></p>');
    html = html.replace(/^#\s+(.+)$/gm, '<p style="margin-bottom:8px"><strong>$1</strong></p>');
    html = html.replace(/^[\-•]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><br>/g, '<p>');
    return html;
}

// ============================================
// GEMINI FORMATTING
// ============================================

async function formatWithGemini(rawText, apiKey) {
    if (!apiKey) return rawText;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an AI formatting assistant. Take the following raw text and format it into a clean, highly readable, user-friendly markdown format. 

CRITICAL INSTRUCTIONS:
- Break up large walls of text into smaller, digestible paragraphs.
- Use bullet points for any lists or sequential steps.
- Add relevant emojis beautifully to make the text engaging, even if no lists exist.
- Structure it cleanly so it feels very professional but approachable.
- DO NOT ADD any conversational text. Return ONLY the formatted version of the input text.
- If the text mentions prices or discounts, make them stand out.

RAW TEXT:
${rawText}`
                    }]
                }]
            })
        });
        if (!response.ok) return rawText;
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }
        return rawText;
    } catch (err) {
        console.error("Gemini Formatting Error:", err);
        return rawText;
    }
}

// ============================================
// UPLOAD WEBHOOK
// ============================================

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

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
}

function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); document.getElementById('dropzone').classList.add('drag-over'); }
function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); document.getElementById('dropzone').classList.remove('drag-over'); }
function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    document.getElementById('dropzone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
}

function setSelectedFile(file) {
    const validation = validateFile(file);
    if (!validation.valid) { showUploadError(validation.error); return; }
    selectedFile = file;
    const chip = document.getElementById('fileChip');
    document.getElementById('fileChipName').textContent = file.name;
    document.getElementById('fileChipSize').textContent = formatFileSize(file.size);
    chip.classList.add('visible');
    document.getElementById('btnUpload').disabled = false;
    hideUploadError();
}

function removeSelectedFile() {
    selectedFile = null;
    document.getElementById('fileChip').classList.remove('visible');
    document.getElementById('btnUpload').disabled = true;
    document.getElementById('fileInput').value = '';
}

async function uploadFile() {
    if (!selectedFile) return;

    const btn = document.getElementById('btnUpload');
    const progress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');

    setUploadState('uploading', 'Uploading...');
    progress.classList.add('visible');
    progressBar.style.width = '30%';
    hideUploadError();

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('fileName', selectedFile.name);
        formData.append('userId', activeUser.googleId);
        formData.append('userEmail', activeUser.email);
        formData.append('userName', activeUser.name);
        formData.append('userRole', activeUser.role);

        progressBar.style.width = '60%';
        setUploadState('processing', 'Processing...');

        const uploadUrl = getUploadWebhookUrl();
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });

        progressBar.style.width = '100%';
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

        let result;
        try { result = await res.json(); } catch { result = { status: 'ok' }; }

        setUploadState('success', 'Upload Complete!');
        addUploadHistory(selectedFile.name, 'success', result.rowCount || null);

        setTimeout(() => {
            setUploadState('idle', 'Upload to Database');
            progress.classList.remove('visible');
            progressBar.style.width = '0%';
            removeSelectedFile();
        }, 3000);

    } catch (err) {
        setUploadState('error', 'Upload Failed');
        showUploadError('Upload failed. Check the Upload Webhook URL in Settings.');
        addUploadHistory(selectedFile.name, 'error', null, err.message);

        setTimeout(() => {
            setUploadState('idle', 'Upload to Database');
            progress.classList.remove('visible');
            progressBar.style.width = '0%';
        }, 4000);
    }
}

function setUploadState(state, text) {
    const btn = document.getElementById('btnUpload');
    btn.className = 'btn-upload ' + (state === 'idle' ? 'btn-primary' : 'btn-ghost');

    let icon = 'upload-cloud';
    if (state === 'uploading' || state === 'processing') icon = 'loader';
    if (state === 'success') icon = 'check-circle';
    if (state === 'error') icon = 'x-circle';
    btn.style.color = state === 'success' ? 'var(--success)' : (state === 'error' ? 'var(--error)' : '');

    btn.innerHTML = `<i data-lucide="${icon}"></i> ${text}`;
    btn.disabled = state !== 'idle' || !selectedFile;
    lucide.createIcons();
}

function showUploadError(msg) {
    const el = document.getElementById('uploadErrorMsg');
    el.textContent = msg; el.style.display = 'block';
}
function hideUploadError() { document.getElementById('uploadErrorMsg').style.display = 'none'; }


function getUploadHistory() {
    try { return JSON.parse(localStorage.getItem(LS_UPLOAD_HISTORY)) || []; } catch { return []; }
}

function addUploadHistory(filename, status, rowCount, errorMsg) {
    const history = getUploadHistory();
    history.unshift({ filename, date: new Date().toISOString(), status, rowCount, errorMsg });
    if (history.length > 20) history.length = 20;
    localStorage.setItem(LS_UPLOAD_HISTORY, JSON.stringify(history));
    renderUploadHistory();
}

function renderUploadHistory() {
    const container = document.getElementById('uploadHistoryList');
    const history = getUploadHistory();

    if (history.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:14px; padding:var(--space-4) 0; font-style:italic;">No uploads yet</div>';
        return;
    }

    container.innerHTML = history.slice(0, 10).map(item => `
    <div class="upload-history-item">
      <i data-lucide="${item.status === 'success' ? 'check-circle' : 'x-circle'}" class="icon-sm upload-history-icon ${item.status}"></i>
      <span class="upload-history-name">${escapeHtml(item.filename)}</span>
      <span class="upload-history-date">${formatDate(item.date)}</span>
      ${item.rowCount ? `<span style="color:var(--text-muted); font-size:12px; font-family:var(--font-data);">${item.rowCount} rows</span>` : ''}
      ${item.status === 'error' ? `<span style="color:var(--error); font-size:12px; font-family:var(--font-data);">Failed</span>` : ''}
    </div>
  `).join('');
    lucide.createIcons();
}

// ============================================
// UI LOGIC
// ============================================

function switchTab(tab) {
    document.getElementById('tabChat').classList.toggle('active', tab === 'chat');
    document.getElementById('tabUpload').classList.toggle('active', tab === 'upload');
    document.getElementById('viewChat').classList.toggle('active', tab === 'chat');
    document.getElementById('viewUpload').classList.toggle('active', tab === 'upload');

    if (document.getElementById('navUpload')) {
        document.getElementById('navUpload').classList.toggle('active', tab === 'upload');
    }

    if (tab === 'chat') document.getElementById('chatInput').focus();
    closeSidebar();
}

function switchToUpload() { switchTab('upload'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').style.display = document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').style.display = 'none'; }

// ============================================
// SETTINGS
// ============================================

function getChatWebhookUrl() { return localStorage.getItem(LS_CHAT_URL) || DEFAULT_CHAT_URL; }
function getUploadWebhookUrl() { return localStorage.getItem(LS_UPLOAD_URL) || DEFAULT_UPLOAD_URL; }

function loadSettings() {
    document.getElementById('settingsChatUrl').value = getChatWebhookUrl();
    document.getElementById('settingsUploadUrl').value = getUploadWebhookUrl();
}

function openSettings() { loadSettings(); document.getElementById('settingsOverlay').classList.add('open'); closeSidebar(); }
function closeSettings() {
    const chatUrl = document.getElementById('settingsChatUrl').value.trim();
    const uploadUrl = document.getElementById('settingsUploadUrl').value.trim();
    if (chatUrl) localStorage.setItem(LS_CHAT_URL, chatUrl);
    if (uploadUrl) localStorage.setItem(LS_UPLOAD_URL, uploadUrl);
    document.getElementById('settingsOverlay').classList.remove('open');
}

// ============================================
// PROFILE MODAL
// ============================================

function openProfileModal() {
    if (!activeUser) return;
    
    document.getElementById('modalUserPhoto').src = activeUser.picture || '';
    document.getElementById('modalUserName').textContent = activeUser.name || 'User';
    document.getElementById('modalUserEmail').textContent = activeUser.email || '';
    
    const roleEl = document.getElementById('modalUserRole');
    roleEl.textContent = activeUser.role || 'readonly';
    roleEl.className = `user-role role-${activeUser.role || 'readonly'}`;
    
    document.getElementById('modalUserId').textContent = activeUser.googleId || '';
    
    if (activeUser.loginTime) {
        document.getElementById('modalUserLogin').textContent = new Date(activeUser.loginTime).toLocaleString();
    }
    
    document.getElementById('modalStatSessions').textContent = sessions.length;
    document.getElementById('modalStatUploads').textContent = getUploadHistory().length;

    document.getElementById('profileOverlay').classList.add('open');
    closeSidebar();
}

function closeProfileModal() {
    document.getElementById('profileOverlay').classList.remove('open');
}

// ============================================
// SIDEBAR RESIZER
// ============================================

function initSidebarResizer() {
    const resizer = document.getElementById('sidebarResizer');
    const sidebar = document.getElementById('sidebar');
    
    // Load saved width
    const savedWidth = localStorage.getItem(`kli_sidebar_width_${activeUser?.googleId}`);
    if (savedWidth) {
        sidebar.style.width = savedWidth + 'px';
        sidebar.style.minWidth = savedWidth + 'px';
    }

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        resizer.classList.add('is-resizing');
        // Prevent iframes or text selection from interfering
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        // Calculate new width
        let newWidth = e.clientX;
        
        // Constrain
        if (newWidth < 200) newWidth = 200;
        if (newWidth > window.innerWidth / 2) newWidth = window.innerWidth / 2;
        
        sidebar.style.width = newWidth + 'px';
        sidebar.style.minWidth = newWidth + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            resizer.classList.remove('is-resizing');
            document.body.style.userSelect = 'auto';
            
            // Save width
            if (activeUser) {
                localStorage.setItem(`kli_sidebar_width_${activeUser.googleId}`, sidebar.style.width.replace('px', ''));
            }
        }
    });
}

async function testWebhook(type) {
    const btnId = type === 'chat' ? 'btnTestChat' : 'btnTestUpload';
    const btn = document.getElementById(btnId);
    const url = type === 'chat' ? document.getElementById('settingsChatUrl').value.trim() : document.getElementById('settingsUploadUrl').value.trim();

    if (!url) { btn.innerHTML = '<i data-lucide="x-circle"></i> No URL'; btn.style.color = 'var(--error)'; btn.style.borderColor = 'var(--error)'; lucide.createIcons(); return; }

    btn.innerHTML = '<i data-lucide="loader"></i> ...'; lucide.createIcons();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatInput: 'ping', sessionId: 'test' }), signal: controller.signal });
        clearTimeout(timeout);
        btn.innerHTML = '<i data-lucide="check"></i> Connected'; btn.style.color = 'var(--success)'; btn.style.borderColor = 'var(--success)';
    } catch {
        btn.innerHTML = '<i data-lucide="x"></i> Failed'; btn.style.color = 'var(--error)'; btn.style.borderColor = 'var(--error)';
    }
    lucide.createIcons();
    setTimeout(() => { btn.innerHTML = 'Test'; btn.style.color = ''; btn.style.borderColor = ''; }, 3000);
}

function clearChatHistory() {
    if (!confirm('Clear all chat sessions?')) return;
    sessions = []; activeSessionId = null; saveSessions(); renderSessionList(); showEmptyState();
}

function clearUploadHistory() {
    if (!confirm('Clear upload history?')) return;
    localStorage.removeItem(LS_UPLOAD_HISTORY); renderUploadHistory();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function escapeAttr(text) { return text.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
function formatTime(isoString) { if (!isoString) return ''; return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatDate(isoString) { if (!isoString) return ''; return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function copyMessage(btn) {
    const bubble = btn.closest('.message-content-wrapper').querySelector('.message-bubble');
    if (bubble) {
        navigator.clipboard.writeText(bubble.innerText).then(() => {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" class="icon-sm" style="color:var(--success)"></i>';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                lucide.createIcons();
            }, 2000);
        });
    }
}

function retryLastMessage() {
    if (!activeSessionId) return;
    const session = getActiveSession();
    if (!session || session.messages.length < 2) return;

    // Must be user then assistant
    if (session.messages[session.messages.length - 1].role === 'assistant') {
        session.messages.pop(); // Remove assistant message
        const lastUser = session.messages[session.messages.length - 1]; // Get user message
        if (lastUser && lastUser.role === 'user') {
            session.messages.pop(); // Remove user message too, we will re-send it
            saveSessions();
            renderMessages(session.messages); // Re-render without them
            
            const input = document.getElementById('chatInput');
            input.value = lastUser.content;
            document.getElementById('btnSend').disabled = false;
            sendMessage();
        }
    }
}

function checkAuth() {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) {
        window.location.replace("/auth.html");
        return null;
    }
    try {
        const user = JSON.parse(raw);
        if (Date.now() - user.loginTime > 8 * 60 * 60 * 1000) {
            localStorage.removeItem(LS_USER);
            window.location.replace("/auth.html");
            return null;
        }

        const urlId = window.location.pathname.split('/app/')[1];
        if (urlId && urlId !== user.googleId) {
            window.location.replace(`/app/${user.googleId}`);
            return null;
        }

        return user;
    } catch {
        window.location.replace("/auth.html");
        return null;
    }
}

function signOut() {
    localStorage.removeItem(LS_USER);
    if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }
    window.location.replace("/auth.html");
}

// BOOT
document.addEventListener('DOMContentLoaded', init);
