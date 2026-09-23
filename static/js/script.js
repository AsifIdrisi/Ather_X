// Weathergpt - Javascript


"use strict";

// Global State

let currentLanguage = localStorage.getItem("weatherGPTLanguage") || "en";
let temperatureUnit = localStorage.getItem("weatherGPTTemperatureUnit") || "celsius";

let currentLocation = null;
let currentLocationName = "";
let autocompleteRequestId = 0;

// ---------------------------------------------------------------------------
// RISK / STATUS LABEL LOCALIZATION
// ---------------------------------------------------------------------------
// Every advisory module (urban, aviation, marine, disaster, hazard) renders
// the same small set of English risk-level enums ("Low", "Moderate", "High",
// "Very High"). These are kept in English internally (CSS classes, sorting,
// comparisons elsewhere all key off the English string), but the *visible*
// label the user reads must follow the selected language. Reuse the
// low/moderate/high/very_high keys already defined for AQI/UV so this needs
// no new translation dictionary entries.
const RISK_LEVEL_KEY_MAP = {
    "very low": "low",
    "low": "low",
    "moderate": "moderate",
    "medium": "moderate",
    "high": "high",
    "very high": "very_high",
    "extreme": "extreme",
};

function translateRiskLevel(level) {
    const raw = String(level == null ? "" : level).trim();
    if (!raw) return raw;
    const key = RISK_LEVEL_KEY_MAP[raw.toLowerCase()];
    if (!key) return raw;
    const translated = t(key);
    // t() falls back to the key itself when missing; guard against that.
    return translated && translated !== key ? translated : raw;
}

// The agriculture advisory's "attention_level" enum ("Low Attention",
// "Moderate Attention", "High Attention", "Very High Attention") follows the
// same low/moderate/high/very_high scale as translateRiskLevel(), just with
// the word "Attention" appended, so it's translated the same way.
const ATTENTION_KEY_MAP = { "low attention": "low", "moderate attention": "moderate", "high attention": "high", "very high attention": "very_high" };

function translateAttentionLevel(level) {
    const raw = String(level == null ? "" : level).trim();
    if (!raw) return raw;
    const key = ATTENTION_KEY_MAP[raw.toLowerCase()];
    if (!key) return raw;
    const translated = t(key);
    return translated && translated !== key ? `${translated} ${t("attention_label")}` : raw;
}

// Same idea as translateRiskLevel(), but for the green/yellow/orange/red
// alert-severity colour words used on the compact alert cards.
const SEVERITY_KEY_MAP = { green: "severity_green", yellow: "severity_yellow", orange: "severity_orange", red: "severity_red" };

function translateSeverityLevel(level) {
    const raw = String(level == null ? "" : level).trim().toLowerCase();
    const key = SEVERITY_KEY_MAP[raw];
    if (!key) return raw.toUpperCase();
    const translated = t(key);
    return translated && translated !== key ? translated : raw.toUpperCase();
}

// ---------------------------------------------------------------------------
// NATIVE DIGIT LOCALIZATION
// ---------------------------------------------------------------------------
// Several Indian languages have their own native numeral glyphs. WeatherGPT
// keeps western digits for languages where western digits are the everyday
// convention (Hindi, Marathi, Bengali, Tamil, Telugu, etc. in modern usage,
// as well as English) and only swaps the glyph set for languages whose
// readers expect native digits by default.
const NATIVE_DIGIT_MAP = {
    ar: "٠١٢٣٤٥٦٧٨٩",
    ur: "٠١٢٣٤٥٦٧٨٩",
    sd: "٠١٢٣٤٥٦٧٨٩",
    ks: "٠١٢٣٤٥٦٧٨٩",
};

function localizeDigits(value, language = currentLanguage) {
    const text = String(value == null ? "" : value);
    const digits = NATIVE_DIGIT_MAP[String(language || "en")];
    if (!digits) return text;
    return text.replace(/[0-9]/g, d => digits[Number(d)] ?? d);
}

// ---------------------------------------------------------------------------
// CHART AXIS LABELS (Chart.js draws these on <canvas>, so they can never be
// picked up by the DOM text-node translator; they must be localized at the
// point the chart configuration is built.)
// ---------------------------------------------------------------------------
const WEEKDAY_SHORT_KEYS = ["weekday_sun", "weekday_mon", "weekday_tue", "weekday_wed", "weekday_thu", "weekday_fri", "weekday_sat"];

function localizedWeekdayShort(date) {
    const key = WEEKDAY_SHORT_KEYS[date.getDay()];
    return t(key);
}

// Persist the last successful location so the app can reuse it on the next run.
const LOCATION_CACHE_KEY = "weatherGPTLastLocation";

function loadCachedLocation() {
    try {
        const cached = JSON.parse(localStorage.getItem(LOCATION_CACHE_KEY) || "null");
        const latitude = Number(cached?.latitude);
        const longitude = Number(cached?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
        currentLocation = { latitude, longitude };
        currentLocationName = cached?.name || "";
        return true;
    } catch (error) {
        console.warn("Could not load cached location:", error);
        return false;
    }
}

function cacheLocation(latitude, longitude, name = "") {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    currentLocation = { latitude: lat, longitude: lon };
    if (name) currentLocationName = name;
    try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
            latitude: lat,
            longitude: lon,
            name: name || currentLocationName || ""
        }));
    } catch (error) {
        console.warn("Could not cache location:", error);
    }
}

let currentWeatherData = null;
let savedLocations = JSON.parse(localStorage.getItem("weatherGPTSavedLocations") || "[]");

let recognition = null;

let isListening = false;
let currentSpeechUtterance = null;

// Chart.js instances
let hourlyWeatherChart = null;
let dailyWeatherChart = null;
let precipitationChart = null;
let climateTemperatureChart = null;
let climateRainChart = null;

// Browser notification preferences
let weatherNotificationsEnabled =
    localStorage.getItem("weatherNotificationsEnabled") === "true";

let lastNotificationSignature =
    localStorage.getItem("weatherNotificationSignature") || "";

// Chat History
const CHAT_HISTORY_KEY = "weatherGPTChatHistoryV1";
function chatHistoryStorageKey() {
    if (!currentUser) {
        return `${CHAT_HISTORY_KEY}:guest`;
    }

    const userKey =
        currentUser.id ??
        currentUser.user_id ??
        currentUser.email ??
        currentUser.username ??
        "unknown";

    return `${CHAT_HISTORY_KEY}:user:${String(userKey).trim().toLowerCase()}`;
}
let chatSessions = [];
let currentChatId = createChatId();
let recentChatsExpanded = false;

function createChatId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return "chat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function loadChatHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(chatHistoryStorageKey()) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn("Could not load chat history:", error);
        return [];
    }
}

function persistChatHistory() {
    try {
        chatSessions = chatSessions
            .filter(chat => chat && Array.isArray(chat.messages) && chat.messages.length)
            .slice(0, 20);
        localStorage.setItem(chatHistoryStorageKey(), JSON.stringify(chatSessions));
    } catch (error) {
        console.warn("Could not save chat history:", error);
    }
}

function saveCurrentChat() {
    const messages = document.querySelectorAll("#messages .message");
    if (!messages.length) return;

    const items = [];
    messages.forEach(el => {
        const type = el.classList.contains("user-message") ? "user" : "ai";
        const content = el.querySelector(".message-content");
        const text = content ? content.textContent.trim() : "";
        if (text) {
            const confidence = el.dataset.forecastConfidence || "";
            items.push({ type, text, confidence: confidence || null });
        }
    });

    if (!items.length) return;

    const titleItem = items.find(item => item.type === "user");
    const existingIndex = chatSessions.findIndex(chat => chat.id === currentChatId);
    const chat = {
        id: currentChatId,
        title: (titleItem?.text || "New Chat").slice(0, 42),
        updatedAt: Date.now(),
        messages: items
    };

    if (existingIndex >= 0) chatSessions.splice(existingIndex, 1);
    chatSessions.unshift(chat);
    persistChatHistory();
    renderChatHistory();
}

function renderChatHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    list.innerHTML = "";
    if (!chatSessions.length) {
        list.innerHTML = '<div class="empty-history">No recent chats</div>';
        return;
    }

    // Keep the Recent Chats sidebar compact: show only the latest 4 by default.
    const visibleChats = recentChatsExpanded ? chatSessions : chatSessions.slice(0, 4);
    visibleChats.forEach(chat => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item" + (chat.id === currentChatId ? " active" : "");
        button.title = chat.title;
        button.textContent = chat.title;
        button.addEventListener("click", () => loadChat(chat.id));
        list.appendChild(button);
    });

    if (chatSessions.length > 4) {
        const moreButton = document.createElement("button");
        moreButton.type = "button";
        moreButton.className = "history-more-btn";
        moreButton.innerHTML = recentChatsExpanded
            ? '<i class="bi bi-chevron-up"></i> Show less'
            : '<i class="bi bi-three-dots"></i> More';
        moreButton.addEventListener("click", () => {
            recentChatsExpanded = !recentChatsExpanded;
            renderChatHistory();
        });
        list.appendChild(moreButton);
    }
}

function loadChat(chatId) {
    const chat = chatSessions.find(item => item.id === chatId);
    if (!chat) return;
    const sidebar = document.getElementById("sidebar")
    if (sidebar) {
        sidebar.classList.remove("open")
    }

    currentChatId = chat.id;
    const messages = document.getElementById("messages");
    const welcome = document.getElementById("welcomeScreen");
    const input = document.getElementById("messageInput");

    if (messages) messages.innerHTML = "";
    if (welcome) welcome.style.display = "none";
    if (input) { input.value = ""; input.style.height = "auto"; }

    (chat.messages || []).forEach(item => addMessage(item.text, item.type, false, item.confidence || null));
    renderChatHistory();
}

// Account / Authentication
let authMode = "login";
let currentUser = null;

async function loadAuthStatus() {
    try {
        const res = await fetch("/auth/status");
        const data = await res.json();
        currentUser = data.authenticated ? data.user : null;
        updateAccountUI();
        chatSessions = loadChatHistory();
        currentChatId = createChatId();
        recentChatsExpanded = false;
        renderChatHistory();
        if (currentUser) await loadAccountSavedLocations();
    } catch (e) { console.warn("Auth status unavailable", e); }
}

function updateAccountUI() {
    const label = document.getElementById("accountLabel");
    if (label) label.textContent = currentUser ? currentUser.name : t("sign_in");
    const submit = document.getElementById("authSubmit");
    const switchBtn = document.getElementById("authSwitch");
    const logoutBtn = document.getElementById("authLogout");
    const profileBtn = document.getElementById("authProfileBtn");
    const forgotBtn = document.getElementById("forgotPasswordLink");
    if (submit) submit.textContent = authMode === "login" ? "Sign In" : "Create Account";
    if (switchBtn) switchBtn.textContent = authMode === "login" ? "New here? Create an account" : "Already have an account? Sign in";
    if (logoutBtn) logoutBtn.classList.toggle("hidden-auth", !currentUser);
    if (profileBtn) profileBtn.classList.toggle("hidden-auth", !currentUser);
    if (forgotBtn) forgotBtn.classList.toggle("hidden-auth", !!currentUser || authMode !== "login");
}

function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    if (currentUser) {
        authMode = "login";
        document.getElementById("authTitle").textContent = `Hi, ${currentUser.name}`;
        document.getElementById("authSubtitle").textContent = currentUser.email;
        const form = document.getElementById("authForm");
        if (form) form.classList.add("hidden-auth");
        const switchBtn = document.getElementById("authSwitch");
        if (switchBtn) switchBtn.classList.add("hidden-auth");
    } else {
        const form = document.getElementById("authForm");
        if (form) form.classList.remove("hidden-auth");
        const switchBtn = document.getElementById("authSwitch");
        if (switchBtn) switchBtn.classList.remove("hidden-auth");
        setAuthMode("login");
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    updateAccountUI();
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
    const form = document.getElementById("authForm");
    if (form) form.classList.remove("hidden-auth");
    const switchBtn = document.getElementById("authSwitch");
    if (switchBtn) switchBtn.classList.remove("hidden-auth");
}

function setAuthMode(mode) {
    authMode = mode;
    const nameWrap = document.getElementById("authNameWrap");
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const error = document.getElementById("authError");
    if (nameWrap) nameWrap.classList.toggle("hidden-auth", mode !== "register");
    if (title) title.textContent = mode === "login" ? "Welcome back" : "Create your WeatherGPT account";
    if (subtitle) subtitle.textContent = mode === "login" ? "Sign in to keep your profile." : "Create an account to personalize your experience.";
    if (error) error.textContent = "";
    updateAccountUI();
}

function toggleAuthMode() { setAuthMode(authMode === "login" ? "register" : "login"); }

async function submitAuth(event) {
    event.preventDefault();
    const error = document.getElementById("authError");
    error.textContent = "";
    const payload = { email: document.getElementById("authEmail").value.trim(), password: document.getElementById("authPassword").value };
    if (authMode === "register") payload.name = document.getElementById("authName").value.trim();
    try {
        const res = await fetch(authMode === "login" ? "/auth/login" : "/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Authentication failed");
        currentUser = data.user;

        // Switch chat history immediately to this account.
        // Do not wait for saved-location syncing, otherwise login can feel slow
        // and the Recent Chats panel may continue showing the previous account.
        chatSessions = loadChatHistory();
        currentChatId = createChatId();
        renderChatHistory();

        updateAccountUI();
        closeAuthModal();

        showToast(`Welcome, ${currentUser.name}!`);

        // Reload the page after successful login so
        // all account-specific data and UI state are refreshed.
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (e) { error.textContent = e.message; }
}

async function logoutUser() {
    try {
        await fetch("/auth/logout", { method: "POST" });
    } catch (e) {
        console.warn("Logout request failed:", e);
    }

    // Immediately switch the UI back to guest state.
    // Do not leave the previous account's Recent Chats visible after logout.
    currentUser = null;
    chatSessions = loadChatHistory();
    currentChatId = createChatId();
    recentChatsExpanded = false;
    // Refresh Recent Chats immediately without requiring a browser refresh.
    renderChatHistory();

    savedLocations = [];
    renderSavedLocations();
    updateSaveLocationButton();
    syncSettingsForm();
    closeAuthModal();
    updateAccountUI();
    showToast("You have been logged out.");
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

function openForgotPassword() {
    closeAuthModal();
    const modal = document.getElementById("forgotPasswordModal");
    if (!modal) return;
    document.getElementById("forgotEmail").value = "";
    document.getElementById("forgotOTP").value = "";
    document.getElementById("resetPassword").value = "";
    document.getElementById("resetPasswordConfirm").value = "";
    document.getElementById("forgotError").textContent = "";
    document.getElementById("forgotStep1").classList.remove("hidden-auth");
    document.getElementById("forgotStep2").classList.add("hidden-auth");
    document.getElementById("forgotStep3").classList.add("hidden-auth");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeForgotPassword() {
    const modal = document.getElementById("forgotPasswordModal");
    if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
}

async function sendResetOTP() {
    const email = document.getElementById("forgotEmail").value.trim();
    const error = document.getElementById("forgotError");
    error.textContent = "";
    if (!email) { error.textContent = "Enter your account email."; return; }
    try {
        const res = await fetch("/auth/forgot-password/request", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email}) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not send OTP.");
        document.getElementById("forgotStep1").classList.add("hidden-auth");
        document.getElementById("forgotStep2").classList.remove("hidden-auth");
        document.getElementById("forgotSubtitle").textContent = `A verification code was sent to ${email}.`;
        showToast("OTP sent to your email.");
    } catch (e) { error.textContent = e.message; }
}

async function verifyResetOTP() {
    const email = document.getElementById("forgotEmail").value.trim();
    const code = document.getElementById("forgotOTP").value.trim();
    const error = document.getElementById("forgotError");
    error.textContent = "";
    try {
        const res = await fetch("/auth/forgot-password/verify", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email, code}) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid OTP.");
        window.passwordResetToken = data.reset_token;
        document.getElementById("forgotStep2").classList.add("hidden-auth");
        document.getElementById("forgotStep3").classList.remove("hidden-auth");
        document.getElementById("forgotSubtitle").textContent = "OTP verified. Create your new password.";
    } catch (e) { error.textContent = e.message; }
}

async function resetForgotPassword() {
    const password = document.getElementById("resetPassword").value;
    const confirm = document.getElementById("resetPasswordConfirm").value;
    const error = document.getElementById("forgotError");
    error.textContent = "";
    if (password.length < 6) { error.textContent = "Password must be at least 6 characters."; return; }
    if (password !== confirm) { error.textContent = "Passwords do not match."; return; }
    try {
        const res = await fetch("/auth/forgot-password/reset", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({reset_token: window.passwordResetToken, password}) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update password.");
        window.passwordResetToken = null;
        closeForgotPassword();
        showToast("Password updated. Please sign in.");
        openAuthModal();
    } catch (e) { error.textContent = e.message; }
}

function openProfileEditor() {
    if (!currentUser) return;
    closeAuthModal();
    document.getElementById("profileName").value = currentUser.name || "";
    document.getElementById("profileEmail").value = currentUser.email || "";
    document.getElementById("profilePassword").value = "";
    document.getElementById("profileError").textContent = "";
    const modal = document.getElementById("profileModal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeProfileEditor() {
    const modal = document.getElementById("profileModal");
    if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
}

async function saveProfile(event) {
    event.preventDefault();
    const error = document.getElementById("profileError");
    error.textContent = "";
    const payload = {
        name: document.getElementById("profileName").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        password: document.getElementById("profilePassword").value
    };
    try {
        const res = await fetch("/auth/profile", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update profile.");
        currentUser = data.user;
        updateAccountUI();
        closeProfileEditor();
        openAuthModal();
        showToast("Profile updated successfully.");
    } catch (e) { error.textContent = e.message; }
}

function showToast(message) {
    let toast = document.getElementById("weatherGPTToast");
    if (!toast) { toast = document.createElement("div"); toast.id = "weatherGPTToast"; toast.className = "weather-toast"; document.body.appendChild(toast); }
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(window.weatherGPTToastTimer); window.weatherGPTToastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// Page Load

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupInput();

        loadAuthStatus();

        setupCitySearch();

    if (typeof setupNotificationPreferences === "function") {
        setupNotificationPreferences();
    }

    if (typeof setupSettingsNotificationToggle === "function") {
        setupSettingsNotificationToggle();
    }

    if (typeof restoreWeatherPushSubscription === "function") {
        restoreWeatherPushSubscription();
    } 
        applySavedSettings();
        renderSavedLocations();
        updateSaveLocationButton();
        renderChatHistory();
        installSafeQuickQuestionHandlers();

        // Use the cached location immediately. GPS can be requested explicitly
        // with the current-location action when a fresh fix is needed.
        detectLocation({
            useCacheFallback: true,
            refreshGps: false,
            forceFresh: true
        });

    }
);

// Input

function setupInput() {

    const input =
        document.getElementById(
            "messageInput"
        );

    if (!input) return;

    input.addEventListener(
        "input",
        () => {

            input.style.height =
                "auto";

            input.style.height =
                Math.min(
                    input.scrollHeight,
                    120
                ) + "px";

        }
    );

}

// City Search Setup

let nwpGfsChart = null;

// Accuracy & Performance Dashboard
const PERF_CLIENT_KEY = "weatherGPTPerformanceV1";
function getPerformanceClientMetrics() { try { return JSON.parse(localStorage.getItem(PERF_CLIENT_KEY) || "{}"); } catch (e) { return {}; } }
function recordClientPerformance(route, elapsedMs, success) {
    const metrics = getPerformanceClientMetrics();
    const bucket = Array.isArray(metrics[route]) ? metrics[route] : [];
    bucket.push({ ms: Math.round(elapsedMs * 10) / 10, success: !!success, at: new Date().toISOString() });
    metrics[route] = bucket.slice(-30);
    try { localStorage.setItem(PERF_CLIENT_KEY, JSON.stringify(metrics)); } catch (e) {}
}
function formatPerfMs(value) { return Number.isFinite(Number(value)) ? `${Math.round(Number(value))} ms` : "--"; }
function clientRouteStats(route) {
    const values = (getPerformanceClientMetrics()[route] || []).filter(x => Number.isFinite(Number(x.ms)));
    if (!values.length) return null;
    return { last: values[values.length - 1].ms, avg: values.reduce((sum, x) => sum + Number(x.ms), 0) / values.length, count: values.length };
}
async function loadPerformanceDashboard() {
    const status = document.getElementById("performanceDashboardStatus");
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    try {
        const response = await fetch("/api/performance", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Performance metrics unavailable.");
        setText("perfSuccessRate", data.success_rate == null ? "--" : `${data.success_rate}%`);
        setText("perfRequestCount", data.requests ?? 0);
        const weather = data.routes?.["/weather"], chat = data.routes?.["/chat"];
        const cw = clientRouteStats("/weather"), cc = clientRouteStats("/chat");
        setText("perfWeatherLatency", cw ? `${formatPerfMs(cw.last)} / ${formatPerfMs(cw.avg)}` : (weather ? `${formatPerfMs(weather.last_ms)} / ${formatPerfMs(weather.avg_ms)}` : "--"));
        setText("perfChatLatency", cc ? `${formatPerfMs(cc.last)} / ${formatPerfMs(cc.avg)}` : (chat ? `${formatPerfMs(chat.last_ms)} / ${formatPerfMs(chat.avg_ms)}` : "--"));
        const table = document.getElementById("performanceRouteTable");
        if (table) { const rows = Object.entries(data.routes || {}); table.innerHTML = rows.length ? rows.map(([route, m]) => `<div class="performance-route-row"><strong>${route}</strong><span>${m.count} ${t("calls_label")}</span><span>${formatPerfMs(m.avg_ms)} ${t("avg_label")}</span><span>${formatPerfMs(m.last_ms)} ${t("last_label")}</span></div>`).join("") : `<div class=performance-empty>${t("no_server_route_calls_yet")}</div>`; }
        const accuracy = data.accuracy || {};
        setText("perfAccuracyValue", accuracy.available ? (accuracy.value || t("evaluated_label")) : t("not_evaluated"));
        setText("perfAccuracyMessage", accuracy.message || t("accuracy_requires_reference_observations"));
        if (status) status.textContent = `${t("live_session_uptime")}: ${Math.round(Number(data.uptime_seconds || 0))}s · ${t("updated")} ${new Date().toLocaleTimeString()}`;
    } catch (error) { console.error("Performance dashboard error:", error);
        if (status) status.textContent = error.message || t("unable_load_weather_intelligence"); }
}

function setupCitySearch() {

    const input =
        document.getElementById(
            "citySearchInput"
        );

    if (!input) return;

    // Chrome ignores a static autocomplete="off" on fields it heuristically
    // decides look like an address/contact field (which triggered it to show
    // saved-address autofill suggestions here). Re-asserting a randomized,
    // unrecognized autocomplete token right as the field is focused is the
    // reliable workaround: Chrome only special-cases the known tokens it
    // recognizes, so a nonsense value is treated like a hard "off".
    const suppressAutofill = () => {
        input.setAttribute("autocomplete", `off-${Date.now()}`);
    };
    input.addEventListener("focus", suppressAutofill);
    suppressAutofill();

    let autocompleteTimer = null;

    // Live location suggestions while typing.
    input.addEventListener("input", () => {
        const query = input.value.trim();

        clearTimeout(autocompleteTimer);

        if (query.length < 2) {
            const resultsBox = document.getElementById("searchResults");
            if (resultsBox) {
                resultsBox.style.display = "none";
                resultsBox.innerHTML = "";
            }
            return;
        }

        autocompleteTimer = setTimeout(() => {
            searchCity(true, ++autocompleteRequestId);
        }, 300);
    });

    input.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchCity(false, ++autocompleteRequestId);
            }
        }
    );

}

// Keyboard

function handleKeyDown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

}

// Send Message

async function sendMessage(
    message = null
) {

    const input =
        document.getElementById(
            "messageInput"
        );

    if (!input) return;

    // Get Message

    if (message === null) {

        message =
            input.value.trim();

    }

    if (!message) {

        return;

    }

    // Is request ka chat yaad rakho — agar user New Chat pe switch kar de
    // response aane se pehle, to purani chat ka reply naye chat mein
    // leak nahi hoga (yehi "blank/purani chat wapas aana" bug tha).
    const requestChatId = currentChatId;

    // Show User Message

    addMessage(
        message,
        "user"
    );

    // Clear Input

    input.value = "";

    input.style.height =
        "auto";

    // Hide Welcome

    const welcome =
        document.getElementById(
            "welcomeScreen"
        );

    if (welcome) {

        welcome.style.display =
            "none";

    }

    // Show Typing

    const typingId =
        showTyping();

    try {

        // Use Current Location

        let location =
            currentLocation;

        // Get GPS If Location Not Available

        if (!location) {

            try {

                const position =
                    await getCurrentPosition();

                location = {

                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude

                };

                currentLocation =
                    location;
                cacheLocation(location.latitude, location.longitude);

            } catch (locationError) {

                console.warn("GPS unavailable:", locationError);
            }
        }

        // Send Request To Flask

        const _chatPerfStarted = performance.now();
        const response =
            await fetch(
                "/chat",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                message,

                            language:
                                currentLanguage,

                            location:
                                location,

                            include_model_intelligence:
                                /model|forecast confidence|gfs|ecmwf|icon|which model|accuracy/i.test(message)


                        })

                }
            );

        let data =
            await response.json();
        recordClientPerformance("/chat", performance.now() - _chatPerfStarted, response.ok);

        // Remove Typing

        removeTyping(
            typingId
        );

        // Server Error

        if (!response.ok) {

            throw new Error(

                data.reply ||
                data.error ||
                "Chat request failed"

            );

        }

        // Agar is beech user New Chat pe ja chuka hai, to yeh purani
        // chat ka reply hai — ab jis chat pe hai usme mat dikhao/save karo.
        if (requestChatId !== currentChatId) {
            return;
        }

        // AI Response

        addMessage(

            data.reply ||
            "Sorry, I couldn't generate a response.",

            "ai",

            true,

            data.forecast_confidence || null

        );

        // Update Location Name

        if (
            data.location &&
            data.location !==
                "Unknown Location"
        ) {

            updateLocationText(
                data.location
            );

        }

    } catch (error) {

        console.error("Chat error:", error);
        removeTyping(typingId);

        if (requestChatId !== currentChatId) {
            return;
        }

        addMessage(

            "Sorry, I couldn't process your request right now.",

            "ai"

        );

    }

}

// Get Current GPS Position
//
// Faster and less annoying location handling:
// - Uses a recent browser GPS fix when available.
// - Falls back to a cached location when GPS is denied/unavailable.
// - Avoids forcing a fresh GPS fix every time the app loads.

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 0
            }
        );
    });
}

// Add Message

function addMessage(
    text,
    type,
    persist = true,
    confidence = null
) {

    const messages =
        document.getElementById(
            "messages"
        );

    if (!messages) return;

    const message =
        document.createElement(
            "div"
        );

    message.className =
        `message ${type}-message`;

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";

    avatar.innerHTML =
        type === "user"

            ? '<i class="bi bi-person-fill"></i>'

            : '<i class="bi bi-cloud-sun-fill"></i>';

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    content.innerHTML =
        formatMessage(
            text
        );

    // Confidence badge is kept outside message-content so chat history
    // still stores only the assistant reply text.
    if (type === "ai" && confidence) {
        message.dataset.forecastConfidence = typeof confidence === "object"
            ? (confidence.confidence || "")
            : String(confidence);
        const badge = document.createElement("div");
        badge.className = "forecast-confidence-badge " + confidenceBadgeClass(confidence);
        const score = typeof confidence === "object" ? confidence.confidence_score : null;
        const label = typeof confidence === "object" ? confidence.confidence : confidence;
        badge.innerHTML = `<i class="bi ${confidenceBadgeIcon(label)}"></i><span>${escapeHtmlConfidence(String(label || "unknown"))} confidence${score != null ? ` · ${Number(score)}%` : ""}</span>`;
        message.appendChild(badge);
    }

    // Add speech controls only to AI messages. The button uses the
    // browser Web Speech API, so no extra backend/API key is required.
    if (type === "ai") {
        const voiceControls = document.createElement("div");
        voiceControls.className = "message-voice-controls";

        const speakButton = document.createElement("button");
        speakButton.type = "button";
        speakButton.className = "message-speak-button";
        speakButton.title = "Listen to this response";
        speakButton.setAttribute("aria-label", "Listen to this response");
        speakButton.innerHTML = '<i class="bi bi-volume-up-fill"></i><span>Listen</span>';
        speakButton.addEventListener("click", () => speakMessage(text, speakButton));

        voiceControls.appendChild(speakButton);
        content.appendChild(voiceControls);
    }

    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );

    messages.appendChild(
        message
    );

    scrollToBottom();

    if (persist) {
        saveCurrentChat();
    }

}


function confidenceBadgeClass(confidence) {
    const label = typeof confidence === "object" ? confidence.confidence : confidence;
    const value = String(label || "").toLowerCase();
    if (value === "high") return "confidence-high";
    if (value === "medium" || value === "moderate") return "confidence-medium";
    return "confidence-low";
}

function confidenceBadgeIcon(confidence) {
    const label = typeof confidence === "object" ? confidence.confidence : confidence;
    const value = String(label || "").toLowerCase();
    if (value === "high") return "bi-check-circle-fill";
    if (value === "medium" || value === "moderate") return "bi-exclamation-circle-fill";
    return "bi-exclamation-triangle-fill";
}

function escapeHtmlConfidence(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format Message

function formatMessage(
    text
) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /\n/g,
            "<br>"
        );

}

// Typing Indicator

function showTyping() {

    const messages =
        document.getElementById(
            "messages"
        );

    if (!messages) return null;

    const id =
        "typing-" +
        Date.now();

    const element =
        document.createElement(
            "div"
        );

    element.id =
        id;

    element.className =
        "message ai-message";

    element.innerHTML = `

        <div class="message-avatar">

            <i class="bi bi-cloud-sun-fill"></i>

        </div>

        <div class="message-content">

            <div class="typing">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;

    messages.appendChild(
        element
    );

    scrollToBottom();

    return id;

}

// Remove Typing

function removeTyping(
    id
) {

    if (!id) return;

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.remove();

    }

}

// Scroll

function scrollToBottom() {

    const chat =
        document.getElementById(
            "chatArea"
        );

    if (!chat) return;

    chat.scrollTo({

        top:
            chat.scrollHeight,

        behavior:
            "smooth"

    });

}

// Quick Question

function installSafeQuickQuestionHandlers() {
    const buttons = document.querySelectorAll('[onclick*="quickQuestion"]');
    if (!buttons.length) return;

    const fallbackQuestions = {
        "today's weather": "What is the weather today?",
        "todays weather": "What is the weather today?",
        "rain forecast": "Will it rain today?",
        "weather alerts": "What are the weather alerts today?",
        "temperature": "What is the current temperature?"
    };

    buttons.forEach(button => {
        const raw = button.getAttribute('onclick') || '';
        button.removeAttribute('onclick');

        let question = '';
        const match = raw.match(/quickQuestion\(\s*[\"']([\s\S]*?)[\"']\s*\)/);
        if (match) question = match[1];

        const label = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!question || /invalid|unexpected/i.test(question)) {
            question = fallbackQuestions[label] || '';
        }

        if (question) {
            button.addEventListener('click', () => quickQuestion(question));
        }
    });
}

function quickQuestion(
    question
) {

    // Quick Access must always return to the normal chat view first.
    showChatHome();

    const input =
        document.getElementById(
            "messageInput"
        );

    if (!input) return;

    input.value =
        question;

    input.dispatchEvent(
        new Event("input")
    );

    sendMessage(
        question
    );

}

// New Chat

function newChat() {

    //Close the mobile sidebar so New Chat actually takes you to the chat view.
    const sidebar = document.getElementById("sidebar")
    if (sidebar) {
        sidebar.classList.remove("open")
    }
    
    showChatHome();

    // Keep the current conversation in Recent Chats before starting a new one.
    saveCurrentChat();
    currentChatId = createChatId();

    const messages =
        document.getElementById(
            "messages"
        );

    if (messages) {
        messages.innerHTML = "";
    }

    const welcome =
        document.getElementById(
            "welcomeScreen"
        );

    if (welcome) {
        welcome.style.display = "block";
    }

    const input =
        document.getElementById(
            "messageInput"
        );

    if (input) {
        input.value = "";
        input.style.height = "auto";
        input.focus();
    }

    renderChatHistory();
}

// Sidebar

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );

    }

}

// Location Detection

async function detectLocation(options = {}) {
    const useCacheFallback = options.useCacheFallback !== false;
    const refreshGps = options.refreshGps !== false;
    const locationStatus = document.getElementById("locationStatus");

    // Show the last successful location immediately.
    // This makes the UI feel instant instead of waiting for GPS.
    const hasCachedLocation = loadCachedLocation();

    if (hasCachedLocation) {
        setLocationText(currentLocationName || "Last known location");

        if (locationStatus) {
            locationStatus.textContent = "Using last known location...";
        }

        try {
            await loadWeather(
                currentLocation.latitude,
                currentLocation.longitude
            );
        } catch (error) {
            console.warn("Cached weather load failed:", error);
        }
    }

    if (!navigator.geolocation || !refreshGps) {
        if (!hasCachedLocation) {
            setLocationText(t("location_unavailable"));
        }
        return;
    }

    // Ask for GPS only when we don't already have a cached location,
    // or when the caller explicitly wants a fresh location.
    if (hasCachedLocation && options.forceFresh !== true) {
        return;
    }

    if (locationStatus) {
        locationStatus.textContent = "Updating current location...";
    }

    try {
        const position = await getCurrentPosition();

        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            throw new Error("Invalid GPS coordinates");
        }

        // Purana location name clear karo
        currentLocationName = "";
        localStorage.removeItem("weatherGPTLastLocation");

        // Fresh GPS coordinates cache karo
        cacheLocation(latitude, longitude, "");
       
        if (locationStatus) {
            locationStatus.textContent = t("gps_location_detected");
        }

        await loadWeather(latitude, longitude);

    } catch (error) {
        console.warn("GPS location unavailable", error);

        // Keep the cached location instead of repeatedly asking for permission.
        // Keep the cached location instead of repeatedly asking for permission.
        if (useCacheFallback && hasCachedLocation) {
            setLocationText(
                currentLocationName || t("last_known_location")
            );

            if (locationStatus) {
                locationStatus.textContent =
                    t("using_last_known_location");
            }

            return;
        }

        if (error && error.code === 1) {
            setLocationText(
                t("location_permission_denied")
            );

            if (locationStatus) {
                locationStatus.textContent =
                    t("location_permission_denied");
            }
        } else if (error && error.code === 3) {
            setLocationText(
                t("location_request_timed_out")
            );

            if (locationStatus) {
                locationStatus.textContent =
                    t("location_request_timed_out");
            }
        } else {
            setLocationText(
                t("location_unavailable")
            );

            if (locationStatus) {
                locationStatus.textContent =
                    t("location_unavailable");
            }
        }
    }
}

function setLocationText(
    text
) {

    const locationName =
        document.getElementById(
            "locationName"
        );

    const welcomeLocation =
        document.getElementById(
            "welcomeLocation"
        );

    const weatherLocation =
        document.getElementById(
            "weatherLocation"
        );

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );

    if (locationName) {

        locationName.textContent =
            text;

    }

    if (welcomeLocation) {

        welcomeLocation.textContent =
            text;

    }

    if (weatherLocation) {

        weatherLocation.textContent =
            text;

    }

    if (locationStatus) {

        locationStatus.textContent =
           t("search_location_manually");

    }

}

// Update Location Text

function updateLocationText(
    location
) {

    const locationName =
        document.getElementById(
            "locationName"
        );

    const welcomeLocation =
        document.getElementById(
            "welcomeLocation"
        );

    const weatherLocation =
        document.getElementById(
            "weatherLocation"
        );

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );

    if (locationName) {

        locationName.textContent =
            location;

    }

    if (welcomeLocation) {

        welcomeLocation.textContent =
            location;

    }

    if (weatherLocation) {

        weatherLocation.textContent =
            location;

    }

    if (locationStatus) {

        locationStatus.textContent =
            "Live weather data";

    }

}


// Voice Output

function getSpeechLocale() {
    const speechLocales = {
        en: "en-IN", as: "as-IN", bn: "bn-IN", brx: "br-IN", doi: "doi-IN",
        gu: "gu-IN", hi: "hi-IN", kn: "kn-IN", ks: "ks-IN", kok: "kok-IN",
        mai: "mai-IN", ml: "ml-IN", mni: "mni-IN", mr: "mr-IN", ne: "ne-NP",
        or: "or-IN", pa: "pa-IN", sa: "sa-IN", sat: "sat-IN", sd: "sd-IN",
        ta: "ta-IN", te: "te-IN", ur: "ur-IN"
    };
    return speechLocales[currentLanguage] || "en-IN";
}

function speakMessage(text, button = null) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        alert("Voice output is not supported in this browser.");
        return;
    }

    // Clicking the same active button stops speech.
    if (currentSpeechUtterance && speechSynthesis.speaking && button?.classList.contains("speaking")) {
        speechSynthesis.cancel();
        resetSpeechButtons();
        currentSpeechUtterance = null;
        return;
    }

    speechSynthesis.cancel();
    resetSpeechButtons();

    const plainText = String(text)
        .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();

    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = getSpeechLocale();
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Prefer an installed voice matching the selected Indian language.
    const voices = speechSynthesis.getVoices();
    const lang = getSpeechLocale().toLowerCase();
    const shortLang = lang.split("-")[0];
    const matchingVoice = voices.find(v => v.lang?.toLowerCase() === lang)
        || voices.find(v => v.lang?.toLowerCase().startsWith(shortLang));
    if (matchingVoice) utterance.voice = matchingVoice;

    if (button) {
        button.classList.add("speaking");
        button.innerHTML = `<i class="bi bi-stop-fill"></i><span>${t("stop_label")}</span>`;
    }

    utterance.onend = () => {
        resetSpeechButtons();
        if (currentSpeechUtterance === utterance) currentSpeechUtterance = null;
    };

    utterance.onerror = () => {
        resetSpeechButtons();
        if (currentSpeechUtterance === utterance) currentSpeechUtterance = null;
    };

    currentSpeechUtterance = utterance;
    speechSynthesis.speak(utterance);
}

function resetSpeechButtons() {
    document.querySelectorAll(".message-speak-button").forEach(button => {
        button.classList.remove("speaking");
        button.innerHTML = `<i class="bi bi-volume-up-fill"></i><span>${t("listen_label")}</span>`;
    });
}

function stopSpeechOutput() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    resetSpeechButtons();
    currentSpeechUtterance = null;
}

// Voice Input

function toggleVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;

    }

    if (isListening) {

        recognition.stop();

        return;

    }

    recognition =
        new SpeechRecognition();

    const speechLocales = {
        en: "en-IN", as: "as-IN", bn: "bn-IN", brx: "br-IN", doi: "doi-IN",
        gu: "gu-IN", hi: "hi-IN", kn: "kn-IN", ks: "ks-IN", kok: "kok-IN",
        mai: "mai-IN", ml: "ml-IN", mni: "mni-IN", mr: "mr-IN", ne: "ne-NP",
        or: "or-IN", pa: "pa-IN", sa: "sa-IN", sat: "sat-IN", sd: "sd-IN",
        ta: "ta-IN", te: "te-IN", ur: "ur-IN"
    };
    recognition.lang = speechLocales[currentLanguage] || "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.onstart =
        () => {

            isListening =
                true;

            const voiceBtn =
                document.getElementById(
                    "voiceBtn"
                );

            if (voiceBtn) {

                voiceBtn.innerHTML =
                    '<i class="bi bi-stop-circle-fill"></i>';

            }

        };

    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0]
                    .transcript;

            const input =
                document.getElementById(
                    "messageInput"
                );

            if (!input) return;

            input.value =
                transcript;

            input.dispatchEvent(
                new Event("input")
            );

            // Automatically submit the completed voice query.
            // Wait briefly so the transcript is fully rendered first.
            setTimeout(() => {
                const query = input.value.trim();
                if (query && !isListening) {
                    sendMessage(query);
                }
            }, 150);

        };

    recognition.onerror =
        error => {

            console.error("Voice recognition error:", error);
        };

    recognition.onend =
        () => {

            isListening =
                false;

            const voiceBtn =
                document.getElementById(
                    "voiceBtn"
                );

            if (voiceBtn) {

                voiceBtn.innerHTML =
                    '<i class="bi bi-mic-fill"></i>';

            }

        };

    recognition.start();

}

// Agriculture Advisory

function displayAgricultureAdvisory(result) {
    const container = document.getElementById("agricultureAdvisoryContent");
    if (!container) return;

    if (!result) {
        container.innerHTML = `
            <div class="recommendation-loading">
                ${t("agriculture_advisory_unavailable")}
            </div>`;
        return;
    }

    const score = Number(result.advisory_score || 0);
    const levelClass = String(result.attention_level || "Low Attention")
        .toLowerCase()
        .replace(/\s+/g, "-");

    const risks = result.risks || [];
    const recommendations = result.recommendations || [];
    const actions = result.actions || [];
    const evidence = result.evidence || [];
    const snapshot = result.weather_snapshot || {};

    container.innerHTML = `
        <div class="agri-overview-card">
            <div>
                <small>${t("weather_based_crop_attention")}</small>
                <strong>${score}/100</strong>
                <span class="agri-risk-badge ${levelClass}">${translateAttentionLevel(result.attention_level || "Low Attention")}</span>
                <p>${result.crop_label || result.crop || t("crop_label")} · ${result.stage || t("not_specified")} · ${result.soil_type || t("not_specified")}</p>
            </div>
            <div class="agri-location">
                <i class="bi bi-geo-alt-fill"></i>
                ${result.location || "Selected Location"}
            </div>
        </div>

        <div class="agri-snapshot-grid">
            <div><small>${t("temperature")}</small><strong>${snapshot.temperature ?? "--"}°C</strong></div>
            <div><small>${t("humidity_label")}</small><strong>${snapshot.humidity ?? "--"}%</strong></div>
            <div><small>${t("rain_probability")}</small><strong>${snapshot.rain_probability ?? "--"}%</strong></div>
            <div><small>${t("wind_label")}</small><strong>${snapshot.wind_speed ?? "--"} km/h</strong></div>
        </div>

        <div class="agri-columns">
            <div class="agri-info-card">
                <h4><i class="bi bi-exclamation-triangle"></i> ${t("weather_risks")}</h4>
                <ul>${risks.map(item => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div class="agri-info-card">
                <h4><i class="bi bi-lightbulb"></i> ${t("recommendations")}</h4>
                <ul>${recommendations.map(item => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div class="agri-info-card">
                <h4><i class="bi bi-check2-circle"></i> ${t("field_actions")}</h4>
                <ul>${actions.map(item => `<li>${item}</li>`).join("")}</ul>
            </div>
        </div>

        ${evidence.length ? `
        <div class="agri-evidence">
            <strong><i class="bi bi-activity"></i> ${t("weather_signals_used")}</strong>
            <span>${evidence.join(" • ")}</span>
        </div>` : ""}

        <div class="agri-disclaimer">
            <i class="bi bi-info-circle"></i>
            ${result.disclaimer || t("advisory_support_only")}
        </div>
    `;
}

async function loadAgricultureAdvisory() {
    const container = document.getElementById("agricultureAdvisoryContent");
    if (!container) return;

    if (!currentLocation || currentLocation.latitude == null || currentLocation.longitude == null) {
        container.innerHTML = `
            <div class="recommendation-loading">
                <i class="bi bi-geo-alt"></i>
                ${t("location_not_available_load_weather")}
            </div>`;
        return;
    }

    const crop = document.getElementById("agriCrop")?.value || "wheat";
    const stage = document.getElementById("agriStage")?.value || "Not specified";
    const soil = document.getElementById("agriSoil")?.value || "Not specified";

    container.innerHTML = `
        <div class="recommendation-loading">
            <i class="bi bi-arrow-repeat spin"></i>
            ${t("generating_advisory")} ${crop}
        </div>`;

    try {
        const response = await fetch("/api/agriculture-advisory", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                crop: crop,
                stage: stage,
                soil_type: soil,
                language: currentLanguage
            })
        });

        let data = await response.json();
        if (currentLanguage !== "en") {
            data = await localizeObjectDeep(data, currentLanguage);
        }

        if (!response.ok) {
            throw new Error(data.error || t("agriculture_advisory_unavailable"));
        }

        window.lastAgricultureAdvisory = data.agriculture_advisory || null;
        displayAgricultureAdvisory(data.agriculture_advisory || null);
        window.lastMarineAdvisory = data.marine_advisory || null;
        displayMarineAdvisory(data.marine_advisory || null);
    } catch (error) {
        console.error("Agriculture advisory error:", error);
        container.innerHTML = `
            <div class="recommendation-loading">
                <i class="bi bi-exclamation-circle"></i>
                ${error.message || "Unable to generate agriculture advisory."}
            </div>`;
    }
}

// Urban / Smart City Decision Support
function displayUrbanAdvisory(result) {
    const container = document.getElementById("urbanAdvisoryContent");
    if (!container) return;
    if (!result) {
        container.innerHTML = `<div class="recommendation-loading">${t("urban_advisory_unavailable")}</div>`;
        return;
    }
    const risks = result.risks || [];
    const top = result.top_priority || risks[0] || {};
    const score = Number(result.overall_risk_score || 0);
    const level = String(result.overall_risk_level || "Low").toLowerCase().replace(/\s+/g, "-");
    container.innerHTML = `
      <div class="urban-overview-card">
        <div>
          <small>${t("smart_city_weather_risk")}</small>
          <strong>${score}/100</strong>
          <span class="urban-risk-badge ${level}">${translateRiskLevel(result.overall_risk_level || "Low")}</span>
          <p>${t("highest_priority")}: <b>${top.category || t("no_major_priority")}</b>${top.reason ? ` — ${top.reason}` : ""}</p>
        </div>
        <div class="urban-location"><i class="bi bi-geo-alt-fill"></i> ${result.location || currentWeatherLocation || "Selected Location"}</div>
      </div>
      <div class="urban-priority-card">
        <h4><i class="bi bi-lightning-charge-fill"></i> ${t("priority_actions")}</h4>
        <ul>${(result.priority_actions || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="urban-risk-grid">
        ${risks.map(item => {
            const cls = String(item.risk_level || "Low").toLowerCase().replace(/\s+/g, "-");
            return `<div class="urban-risk-card">
                <div class="urban-risk-head"><strong>${item.category}</strong><span>${item.risk_score}/100</span></div>
                <span class="urban-risk-badge ${cls}">${translateRiskLevel(item.risk_level)}</span>
                <div class="urban-progress"><span style="width:${Math.max(0, Math.min(100, Number(item.risk_score || 0)))}%"></span></div>
                <p>${item.reason || t("weather_signal_unavailable")}</p>
                <ul>${(item.recommended_actions || []).map(x => `<li>${x}</li>`).join("")}</ul>
            </div>`;
        }).join("")}
      </div>
      <div class="urban-source"><i class="bi bi-database"></i> ${result.source || "WeatherGPT Urban Decision Engine"} • Official warnings: ${result.official_warning_count ?? 0}</div>
      <div class="urban-disclaimer"><i class="bi bi-info-circle"></i> ${result.disclaimer || "Decision-support only. Follow official city and emergency guidance."}</div>`;
}

async function loadUrbanAdvisory() {
    const container = document.getElementById("urbanAdvisoryContent");
    if (!container) return;
    if (!currentLocation || currentLocation.latitude == null || currentLocation.longitude == null) {
        container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-geo-alt"></i> ${t("location_not_available_load_weather")}</div>`;        return;
    }
    container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-arrow-repeat spin"></i> Analyzing city weather risks...</div>`;
    try {
        const response = await fetch("/api/urban-advisory", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({latitude: currentLocation.latitude, longitude: currentLocation.longitude, language: currentLanguage})
        });
        let data = await response.json();
        if (currentLanguage !== "en") {
            data = await localizeObjectDeep(data, currentLanguage);
        }
        if (!response.ok) throw new Error(data.error || t("urban_advisory_unavailable"));
        window.lastUrbanAdvisory = data.urban_advisory || null;
        displayUrbanAdvisory(data.urban_advisory || null);
    } catch (error) {
        console.error("Urban advisory error:", error);
        container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-exclamation-circle"></i> ${error.message || t("unable_generate_urban_advisory")}</div>`;
    }
}

// Aviation Advisory

function displayAviationAdvisory(result) {
    const container = document.getElementById("aviationAdvisoryContent");
    if (!container) return;

    if (!result) {
        container.innerHTML = `<div class="recommendation-loading">Aviation advisory is unavailable.</div>`;
        return;
    }

    const score = Number(result.risk_score || 0);
    const levelClass = String(result.risk_level || "Low").toLowerCase();
    const current = result.current_weather || {};
    const signals = result.forecast_signals || {};
    const risks = result.risks || [];
    const recommendations = result.recommendations || [];
    const evidence = result.evidence || [];

    container.innerHTML = `
        <div class="aviation-overview-card">
            <div>
                <small>${t("weather_related_aviation_risk")}</small>
                <strong>${score}/100</strong>
                <span class="aviation-risk-badge ${levelClass}">${translateRiskLevel(result.risk_level || "Low")}</span>
                <p>${result.summary || "Weather-based operational assessment."}</p>
            </div>
            <div class="aviation-location">
                <i class="bi bi-geo-alt-fill"></i>
                ${result.location || currentWeatherLocation || currentLocationName || "Selected Location"}
            </div>
        </div>

        <div class="aviation-snapshot-grid">
            <div><small>${t("weather_label")}</small><strong>${current.weather || "--"}</strong></div>
            <div><small>${t("wind_label")}</small><strong>${current.wind_speed ?? "--"} km/h</strong></div>
            <div><small>${t("gusts")}</small><strong>${current.wind_gusts ?? "--"} km/h</strong></div>
            <div><small>${t("visibility")}</small><strong>${current.visibility_km ?? "--"} km</strong></div>
            <div><small>${t("cloud_cover")}</small><strong>${current.cloud_cover ?? "--"}%</strong></div>
            <div><small>${t("pressure")}</small><strong>${current.surface_pressure ?? "--"} hPa</strong></div>
        </div>

        <div class="aviation-signal-row">
            <span><i class="bi bi-lightning-charge"></i> ${t("thunderstorm_next_12h")}: <strong>${signals.next_12h_thunderstorm_hours ?? 0}h</strong></span>
            <span><i class="bi bi-cloud-rain"></i> ${t("heavy_rain_next_12h")}: <strong>${signals.next_12h_heavy_rain_hours ?? 0}h</strong></span>
            <span><i class="bi bi-wind"></i> ${t("strong_wind_next_12h")}: <strong>${signals.next_12h_strong_wind_hours ?? 0}h</strong></span>
        </div>

        <div class="aviation-columns">
            <div class="aviation-info-card">
                <h4><i class="bi bi-exclamation-triangle"></i> ${t("weather_risks")}</h4>
                <ul>${risks.map(item => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div class="aviation-info-card">
                <h4><i class="bi bi-check2-circle"></i> ${t("operational_checks")}</h4>
                <ul>${recommendations.map(item => `<li>${item}</li>`).join("")}</ul>
            </div>
        </div>

        ${evidence.length ? `<div class="aviation-evidence"><strong><i class="bi bi-activity"></i> ${t("weather_signals")}</strong><span>${evidence.join(" • ")}</span></div>` : ""}

        <div class="aviation-disclaimer"><i class="bi bi-info-circle"></i> ${result.disclaimer || t("decision_support_only_aviation")}</div>
    `;
}

async function loadAviationAdvisory() {
    const container = document.getElementById("aviationAdvisoryContent");
    if (!container) return;

    if (!currentLocation || currentLocation.latitude == null || currentLocation.longitude == null) {
        container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-geo-alt"></i> ${t("location_not_available_load_weather")}</div>`;        return;
    }

    container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-arrow-repeat spin"></i> ${t("analyzing_aviation_conditions")}</div>`;

    try {
        const response = await fetch("/api/aviation-advisory", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                language: currentLanguage
            })
        });
        let data = await response.json();
        if (currentLanguage !== "en") {
            data = await localizeObjectDeep(data, currentLanguage);
        }
        if (!response.ok) throw new Error(data.error || t("aviation_advisory_unavailable"));
        window.lastAviationAdvisory = data.aviation_advisory || null;
        displayAviationAdvisory(data.aviation_advisory || null);
    } catch (error) {
        console.error("Aviation advisory error:", error);
        container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-exclamation-circle"></i> ${error.message ||t("unable_generate_aviation_advisory")}</div>`;
    }
}

// Disaster Intelligence

function displayHazardWarnings(result) {
    const container = document.getElementById("hazardWarningsContent");
    if (!container) return;
    if (!result) {
        container.innerHTML = `<div class="recommendation-loading">${t("flood_cyclone_unavailable")}</div>`;
        return;
    }

    const card = (item, icon, titleClass) => {
        if (!item) return "";
        const level = String(item.level || "green").toLowerCase();
        const actions = (item.actions || []).map(x => `<li>${x}</li>`).join("");
        const metrics = item.metrics || {};
        const metricHtml = item.hazard === "Flood Warning"
            ? `<span>24h rain: ${metrics.next_24h_precipitation_mm ?? "--"} mm</span><span>48h rain: ${metrics.next_48h_precipitation_mm ?? "--"} mm</span><span>${t("rain_probability")}: ${metrics.max_daily_rain_probability ?? "--"}%</span>`
            : `<span>Max wind: ${metrics.max_wind_kmh ?? "--"} km/h</span><span>Max gust: ${metrics.max_gust_kmh ?? "--"} km/h</span><span>Storm hours: ${metrics.storm_hours ?? "--"}</span>`;
        return `
            <div class="hazard-warning-card ${titleClass} ${level}">
                <div class="hazard-warning-head">
                    <div><i class="bi ${icon}"></i><strong>${item.hazard || t("hazard_warning")}</strong></div>
                    <span class="hazard-warning-badge ${level}">${translateRiskLevel(item.risk_level || "Low")}</span>
                </div>
                <div class="hazard-warning-score"><span style="width:${Math.min(100, item.score || 0)}%"></span></div>
                <p class="hazard-warning-status">${item.status || "Risk assessment"}</p>
                <p>${item.reason || "No additional details available."}</p>
                <div class="hazard-warning-metrics">${metricHtml}</div>
                <div class="hazard-warning-actions"><strong>${t("recommended_actions")}</strong><ul>${actions}</ul></div>
                ${item.official ? `<div class="hazard-official"><i class="bi bi-patch-check-fill"></i> ${t("official_signal_detected")}</div>` : `<div class="hazard-model"><i class="bi bi-cpu"></i> ${t("forecast_rule_risk_estimate")}</div>`}
            </div>`;
    };

    container.innerHTML = `
        <div class="hazard-warning-grid">
            ${card(result.flood, "bi-water", "flood")}
            ${card(result.cyclone, "bi-tornado", "cyclone")}
        </div>
        <div class="hazard-warning-source"><i class="bi bi-database"></i> ${result.source || "WeatherGPT Hazard Warning Engine"}</div>
        <div class="hazard-warning-disclaimer"><i class="bi bi-info-circle"></i> ${result.disclaimer || t("risk_assessment_combines")}</div>
    `;
}

function displayDisasterIntelligence(result) {
    const container = document.getElementById("disasterIntelligenceContent");
    if (!container) return;
    if (!result) {
        container.innerHTML = `<div class="recommendation-loading">${t("disaster_intelligence_unavailable")}</div>`;
        return;
    }
    const hazards = result.hazards || [];
    const top = result.top_hazard || hazards[0];
    const levelClass = String(result.overall_risk_level || "Low").toLowerCase().replace(/\s+/g, "-");
    const official = result.official_warning_count || 0;
    container.innerHTML = `
        <div class="disaster-overview-card">
            <div>
                <small>${t("overall_multihazard_risk")}</small>
                <strong>${result.overall_risk_score ?? 0}/100</strong>
                <span class="disaster-risk-badge ${levelClass}">${translateRiskLevel(result.overall_risk_level || "Low")}</span>
            </div>
            <div class="disaster-official-signal">
                <i class="bi bi-patch-check-fill"></i>
                ${t("official_imd_warnings_detected").replace("{count}", official)}
            </div>
        </div>
        ${top ? `<div class="disaster-top-hazard"><small>${t("top_hazard")}</small><h5>${top.hazard}</h5><p>${top.reason}</p></div>` : ""}
        <div class="disaster-hazard-grid">
            ${hazards.map(h => `
                <div class="disaster-hazard-card">
                    <div class="disaster-hazard-head"><strong>${h.hazard}</strong><span>${h.risk_score}/100</span></div>
                    <div class="disaster-progress"><span style="width:${Math.min(100, h.risk_score)}%"></span></div>
                    <small>${translateRiskLevel(h.risk_level)} ${t("risk")}${h.official_signal ? ` • ${t("official_imd_signal")}` : ""}</small>
                    <p>${h.reason}</p>
                </div>
            `).join("")}
        </div>
        <div class="disaster-method">${result.method || "Risk assessment combines forecast conditions and official warning signals."}</div>
    `;
}

// Load Weather

// Smart Weather Notifications

// True Background Web Push

let pushSubscription = null;

function getNotificationPreferences() {
    return {
        rain: document.getElementById("notifyRain")?.checked !== false,
        extreme: document.getElementById("notifyExtreme")?.checked !== false,
        wind: document.getElementById("notifyWind")?.checked !== false
    };
}

async function registerWeatherPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Background push is not supported by this browser.");
    }
    if (!window.isSecureContext) {
        throw new Error("Push notifications require HTTPS or localhost.");
    }
    if (!currentLocation || currentLocation.latitude == null || currentLocation.longitude == null) {
        throw new Error("Load or detect a location before enabling background alerts.");
    }

    const keyResponse = await fetch("/push/vapid-public-key");
    const keyData = await keyResponse.json();
    if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error(keyData.error || "Push service is not configured on the server.");
    }

    const registration = await navigator.serviceWorker.register("/static/service-worker.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
        });
    }

    pushSubscription = subscription;

    const response = await fetch("/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            subscription: subscription.toJSON(),
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            location_name: currentLocationName || window.currentWeatherLocation || "",
            language: currentLanguage,
            preferences: getNotificationPreferences()
        })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save push subscription.");

    localStorage.setItem("weatherGPTPushEnabled", "true");
    return subscription;
}

async function disableWeatherPush() {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = pushSubscription || await registration?.pushManager.getSubscription();
        if (subscription) {
            await fetch("/push/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
        }
    } finally {
        pushSubscription = null;
        localStorage.setItem("weatherGPTPushEnabled", "false");
    }
}

async function restoreWeatherPushSubscription() {
    try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (!subscription) {
            if (localStorage.getItem("weatherGPTPushEnabled") === "true") {
                localStorage.setItem("weatherGPTPushEnabled", "false");
                weatherNotificationsEnabled = false;
                localStorage.setItem("weatherNotificationsEnabled", "false");
            }
            updateNotificationUI();
            return;
        }

        pushSubscription = subscription;
        if (localStorage.getItem("weatherGPTPushEnabled") === "true") {
            weatherNotificationsEnabled = true;
            localStorage.setItem("weatherNotificationsEnabled", "true");
        }
        updateNotificationUI();
    } catch (error) {
        console.warn("Could not restore background push subscription:", error);
        updateNotificationUI();
    }
}

async function sendTestBackgroundPush() {
    try {
        if (!pushSubscription && "serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            pushSubscription = await registration?.pushManager.getSubscription() || null;
        }
        if (!pushSubscription) {
            showToast("Enable Alerts first to test background push.");
            return;
        }

        const response = await fetch("/push/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: pushSubscription.endpoint })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Test push failed.");
        showToast("Background test notification sent.");
    } catch (error) {
        showToast(error.message || "Test push failed.");
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function setupNotificationPreferences() {

    ["notifyRain", "notifyExtreme", "notifyWind"].forEach(id => {
        const checkbox = document.getElementById(id);
        if (!checkbox) return;

        const saved = localStorage.getItem(id);
        if (saved !== null) checkbox.checked = saved === "true";

        checkbox.addEventListener("change", async () => {
            localStorage.setItem(id, checkbox.checked);
            if (weatherNotificationsEnabled && pushSubscription) {
                try {
                    await registerWeatherPush();
                } catch (error) {
                    console.warn("Push preference sync failed:", error);
                }
            }
        });
    });

    updateNotificationUI();
}

function setupSettingsNotificationToggle() {
    const toggle = document.getElementById("settingsNotifications");
    if (!toggle) return;

    if (toggle.dataset.notificationBound === "true") return;
    toggle.dataset.notificationBound = "true";

    toggle.addEventListener("change", async () => {
        if (toggle.checked) {
            await toggleWeatherNotifications();
            if (!weatherNotificationsEnabled) {
                toggle.checked = false;
            }
        } else {
            if (weatherNotificationsEnabled) {
                await toggleWeatherNotifications();
            }
        }
    });
}


async function toggleWeatherNotifications() {

    if (weatherNotificationsEnabled) {
        await disableWeatherPush();
        weatherNotificationsEnabled = false;
        localStorage.setItem("weatherNotificationsEnabled", "false");
        updateNotificationUI();
        return;
    }

    if (!("Notification" in window)) {
        updateNotificationUI(t("notifications_not_supported"));
        return;
    }

    if (Notification.permission === "denied") {
        updateNotificationUI(t("notifications_blocked"));
        return;
    }

    try {
        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                updateNotificationUI(t("notification_permission_denied"));
                return;
            }
        }

        // Permission is granted, so enable browser alerts immediately.
        // Background push is an additional capability; if its server setup
        // fails, keep the checkbox enabled so foreground browser alerts
        // can still work instead of silently reverting the checkbox.
        weatherNotificationsEnabled = true;
        localStorage.setItem("weatherNotificationsEnabled", "true");

        let pushReady = false;
        let pushError = null;
        try {
            await registerWeatherPush();
            pushReady = true;
        } catch (pushSetupError) {
            pushError = pushSetupError;
            console.warn("Background push setup failed; keeping browser alerts enabled:", pushSetupError);
            pushSubscription = null;
            localStorage.setItem("weatherGPTPushEnabled", "false");
        }

        updateNotificationUI(
            pushReady
                ? null
                : "Browser alerts are enabled. Background push setup is unavailable, so alerts work while WeatherGPT is open."
        );

        new Notification("WeatherGPT", {
            body: pushReady
                ? "Weather alerts and background push are enabled."
                : "Weather alerts are enabled for this browser session."
        });
    } catch (error) {
        console.error("Background push error:", error);
        updateNotificationUI(error.message || t("unable_enable_notifications"));
    }
}

function updateNotificationUI(message = null) {

    const title = document.getElementById("notificationTitle");
    const status = document.getElementById("notificationStatus");
    const button = document.getElementById("notificationBtn");

    if (!title || !status || !button) return;

    if (message) {
        title.textContent = t("notification_status");
        status.textContent = message;
        button.textContent =t("try_again");
        return;
    }

    if (weatherNotificationsEnabled) {
        title.textContent = t("smart_alerts_enabled");
        status.textContent = t("background_push_enabled");
        button.textContent = "Turn Off";
    } else {
        title.textContent = t("weather_alerts_off");
        status.textContent = t("enable_browser_notifications");
        button.textContent = t("enable_alerts");
    }
}

function processWeatherNotifications(alerts, location) {

    if (!weatherNotificationsEnabled || !alerts.length) return;
    // When true background push is active, let the service worker/server
    // own alert delivery to avoid duplicate browser notifications.
    if (pushSubscription) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notifyRain = document.getElementById("notifyRain")?.checked !== false;
    const notifyExtreme = document.getElementById("notifyExtreme")?.checked !== false;
    const notifyWind = document.getElementById("notifyWind")?.checked !== false;

    const important = alerts.filter(alert => {
        const title = String(alert.title || "").toLowerCase();
        if (title.includes("rain") && !notifyRain) return false;
        if ((title.includes("temperature") || title.includes("heat")) && !notifyExtreme) return false;
        if (title.includes("wind") && !notifyWind) return false;
        return ["red", "orange", "yellow", "danger", "warning"].includes(String(alert.level || alert.severity || "").toLowerCase());
    });

    if (!important.length) return;

    const top = important[0];
    const signature = [location, top.title, top.level, top.message].join("|");
    if (signature === lastNotificationSignature) return;

    lastNotificationSignature = signature;
    localStorage.setItem("weatherNotificationSignature", signature);

    new Notification(`WeatherGPT: ${top.title || "Weather Alert"}`, {
        body: top.message || "An important weather alert is active.",
        tag: "weathergpt-alert"
    });
}



async function loadWeather(
    latitude,
    longitude
) {

    const _perfStarted = performance.now();
    try {

        const response =
            await fetch(
                "/weather",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            latitude:
                                latitude,

                            longitude:
                                longitude,

                            language:
                                currentLanguage

                        })

                }
            );

        let data =
            await response.json();
        recordClientPerformance("/weather", performance.now() - _perfStarted, response.ok);

        if (!response.ok) {

            throw new Error(

                data.error ||
                "Weather unavailable"

            );

        }

        const weather =
            data.weather;

        const location =
            data.location;

        currentLocationName = location || currentLocationName || "";
        cacheLocation(latitude, longitude, currentLocationName);
        updateSaveLocationButton();
        renderSavedLocations();

        // Preserve a stable hazard classification before translating the alert.
        // Safety content must still know whether an alert is about rain, heat,
        // wind, lightning, fog or cyclone after the visible text is localized.
        if (Array.isArray(data.alerts)) {
            data.alerts = data.alerts.map(alert => ({
                ...alert,
                _safety_hazard: getSafetyGuide(alert)
            }));
        }
        
        // Always verify/localize dynamic weather content on the client too.
        // The backend may mark a payload as localized even when a translation
        // provider falls back to the original English text. The old
        // _localized_language check therefore allowed English alert text to
        // leak into a non-English dashboard.
        if (currentLanguage !== "en") {
            try {
                data = await localizeObjectDeep(data, currentLanguage);
            } catch (localizeError) {
                console.warn("Dynamic weather localization fallback failed:", localizeError);
            }
        }

        let localizedAlerts = data.alerts || [];
        let localizedDisaster = data.disaster_intelligence || null;
        let localizedHazards = data.hazard_warnings || null;
        let localizedAgriculture = data.agriculture_advisory || null;
        let localizedUrban = data.urban_advisory || null;

        window.lastWeatherAlerts = localizedAlerts;
        await displayWeatherAlerts(localizedAlerts);
        // The alert/safety cards are generated dynamically after the normal
        // language-pack pass. Translate every newly inserted human-readable
        // string (titles, messages, buttons, safety text, labels) as well.
        if (currentLanguage !== "en") {
            await translateVisibleTextNodes(currentLanguage, "en");
        }

        window.lastDisasterIntelligence = localizedDisaster;
        displayDisasterIntelligence(localizedDisaster);

        window.lastHazardWarnings = localizedHazards;
        displayHazardWarnings(localizedHazards);

        window.lastAgricultureAdvisory = localizedAgriculture;
        displayAgricultureAdvisory(localizedAgriculture);

        window.lastUrbanAdvisory = localizedUrban;
        displayUrbanAdvisory(localizedUrban);

        processWeatherNotifications(
            localizedAlerts || [],
            location
        );

        if (!weather) {

            throw new Error(
                "Weather data missing"
            );

        }

        currentWeatherData = weather;
        window.currentWeatherLocation = location || "";
        window.currentWeatherCoordinates = { latitude, longitude };

        updateWeatherMap(
            latitude,
            longitude,
            location,
            weather
        );

        // Forecast

        displayForecast(
            weather.forecast || []
        );

        display24HourForecast(
            weather.hourly_forecast || []
        );

        displayWeatherCharts(
            weather.hourly_forecast || [],
            weather.forecast || [],
            weather.updated_at
        );

        loadRecommendations(
            weather,
            location
        );

        displayHealthWeatherInsights(
            weather.air_quality || {},
            weather.uv_index,
            weather.forecast || []
        );

        // Location

        updateLocationText(
            location
        );

        // Temperature

        const temperature =
            document.getElementById(
                "temperature"
            );

        if (temperature) {

            temperature.textContent =
                formatTemperatureValue(weather.temperature);

            const unit = temperature.parentElement?.querySelector("sup");
            if (unit) unit.textContent = temperatureUnit === "fahrenheit" ? "°F" : "°C";

        }

        // Humidity

        const humidity =
            document.getElementById(
                "humidity"
            );

        if (humidity) {

            humidity.textContent =
                `${weather.humidity}%`;

        }

        // Wind

        const wind =
            document.getElementById(
                "wind"
            );

        if (wind) {

            wind.textContent =
                `${weather.wind_speed} km/h`;

        }

        // Rain

        const todayForecast =
            weather.forecast?.[0];

        const rainProbability =
            todayForecast
                ?.rain_probability ?? 0;

        const rain =
            document.getElementById(
                "rain"
            );

        if (rain) {

            rain.textContent =
                `${rainProbability}%`;

        }

        // Description

        const description =
            document.getElementById(
                "weatherDescription"
            );

        if (description) {

            description.textContent =
                getWeatherDescription(
                    weather.weather_code
                );

        }
        // Weather Source

        const weatherSource =
            document.getElementById(
                "weatherSource"
            );

        if (weatherSource) {

            weatherSource.textContent =
                weather.source || "Open-Meteo";

        }

        // Weather Updated Time

        const weatherUpdated =
            document.getElementById(
                "weatherUpdated"
            );

        if (
            weatherUpdated &&
            weather.updated_at
        ) {

            const updatedDate =
                new Date(
                    weather.updated_at
                );

            weatherUpdated.textContent =
                updatedDate.toLocaleString(
                    "en-IN",
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                );

        } else if (weatherUpdated) {

            weatherUpdated.textContent =
                "Unavailable";

        }

    } catch (error) {
        console.error("Weather error:", error);
        const description = document.getElementById("weatherDescription");
        if (description) {
            description.textContent = t("unable_load_weather_data");
        }
    }

    // Air Quality + UV Insights

    function getAqiCategory(value) {
        const aqi = Number(value);

        if (!Number.isFinite(aqi))
            return {
                label: t("unavailable"),
                advice: t("aqi_data_unavailable")
            };

        if (aqi <= 50)
            return {
                label: t("good"),
                advice: t("aqi_good")
            };

        if (aqi <= 100)
            return {
                label: t("moderate"),
                advice: t("aqi_moderate")
            };

        if (aqi <= 150)
            return {
                label: t("unhealthy_sensitive"),
                advice: t("aqi_unhealthy_sensitive")
            };

        if (aqi <= 200)
            return {
                label: t("unhealthy"),
                advice: t("aqi_unhealthy")
            };

        if (aqi <= 300)
            return {
                label: t("very_unhealthy"),
                advice: t("aqi_very_unhealthy")
            };

        return {
            label: t("hazardous"),
            advice: t("aqi_hazardous")
        };
    }
    function getUvCategory(value) {
        const uv = Number(value);

        if (!Number.isFinite(uv))
            return {
                label: t("unavailable"),
                advice: t("uv_data_unavailable")
            };

        if (uv < 3)
            return {
                label: t("low"),
                advice: t("uv_low")
            };

        if (uv < 6)
            return {
                label: t("moderate"),
                advice: t("uv_moderate")
            };

        if (uv < 8)
            return {
                label: t("high"),
                advice: t("uv_high")
            };

        if (uv < 11)
            return {
                label: t("very_high"),
                advice: t("uv_very_high")
            };

        return {
            label: t("extreme"),
            advice: t("uv_extreme")
        };
    }

    function displayHealthWeatherInsights(airQuality, currentUv, dailyForecast) {
        const aqiValue = document.getElementById("aqiValue");
        const aqiLabel = document.getElementById("aqiLabel");
        const aqiAdvice = document.getElementById("aqiAdvice");
        const uvValue = document.getElementById("uvValue");
        const uvLabel = document.getElementById("uvLabel");
        const uvAdvice = document.getElementById("uvAdvice");

        const aqi = Number(airQuality?.us_aqi);
        const aqiInfo = getAqiCategory(aqi);
        if (aqiValue) aqiValue.textContent = Number.isFinite(aqi) ? Math.round(aqi) : "--";
        if (aqiLabel) aqiLabel.textContent = aqiInfo.label;
        if (aqiAdvice) aqiAdvice.textContent = aqiInfo.advice;

        let uv = Number(currentUv);
        if (!Number.isFinite(uv)) uv = Number(dailyForecast?.[0]?.uv_index_max);
        const uvInfo = getUvCategory(uv);
        if (uvValue) uvValue.textContent = Number.isFinite(uv) ? uv.toFixed(1) : "--";
        if (uvLabel) uvLabel.textContent = uvInfo.label;
        if (uvAdvice) uvAdvice.textContent = uvInfo.advice;
    }

    // Weather Alerts

    async function displayWeatherAlerts(alerts) {

        const container = document.getElementById("weatherAlerts");
        if (!container) return;
        container.innerHTML = "";

        if (!alerts || alerts.length === 0) return;

        const priority = { red: 3, orange: 2, yellow: 1, green: 0 };
        const sortedAlerts = [...alerts].sort(
            (a, b) => (priority[b.level] || 0) - (priority[a.level] || 0)
        );

        const visibleAlerts = sortedAlerts.slice(0, 3);
        const hiddenAlerts = sortedAlerts.slice(3);

        const panel = document.createElement("section");
        panel.className = "alerts-panel";
        panel.innerHTML = `
            <div class="alerts-panel-header">
                <div>
                    <div class="alerts-title">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        ${t("weather_alerts")}
                    </div>
                    <small>
                        ${alerts.length} ${alerts.length === 1 ? t("active_alert") : t("active_alerts")}
                    </small>
                </div>
                <div class="alerts-status">${t("live_label")}</div>
            </div>
            <div class="alerts-list" id="visibleAlerts"></div>
            ${hiddenAlerts.length > 0 ? `
                <div class="alerts-hidden" id="hiddenAlerts"></div>
                <button type="button" class="alerts-toggle" id="alertsToggle">
                    ${t("view_more_alerts").replace("{count}", hiddenAlerts.length)}
                    <i class="bi bi-chevron-down"></i>
                </button>
            ` : ""}
        `;

        container.appendChild(panel);

        const visibleContainer = panel.querySelector("#visibleAlerts");
        for (const alert of visibleAlerts) {
            visibleContainer.appendChild(await createCompactAlertCard(alert));
        }

        if (hiddenAlerts.length > 0) {
            const hiddenContainer = panel.querySelector("#hiddenAlerts");
            for (const alert of hiddenAlerts) {
                hiddenContainer.appendChild(await createCompactAlertCard(alert));
            }

            const toggle = panel.querySelector("#alertsToggle");
            toggle.addEventListener("click", () => {
                const isOpen = hiddenContainer.classList.toggle("show");
                toggle.innerHTML = isOpen
                    ? `${t("hide_extra_alerts")} <i class="bi bi-chevron-up"></i>`
                    : `${t("view_more_alerts").replace("{count}", hiddenAlerts.length)} <i class="bi bi-chevron-down"></i>`;
            });
        }
    }

    function getSafetyGuide(alert) {
        // Prefer an explicit hazard/type when available. Otherwise detect the
        // hazard from the alert text. Keep common Indian-script keywords too,
        // because alerts may already be localized before reaching the card.
        const explicit = [
            alert?._safety_hazard, alert?.hazard, alert?.hazard_type, alert?.type,
            alert?.category, alert?.code, alert?.name
        ].filter(Boolean).join(" ").toLowerCase();
        const title = String(alert?.title || "").toLowerCase();
        const message = String(alert?.message || "").toLowerCase();
        const text = `${explicit} ${title} ${message}`;

        if (text.includes("cyclone") || text.includes("tropical storm") || text.includes("hurricane") || text.includes("typhoon") || text.includes("चक्रवात") || text.includes("ঘূর্ণিঝড়")) return "cyclone";
        if (text.includes("lightning") || text.includes("thunderstorm") || text.includes("thunder") || text.includes("बिजली") || text.includes("বজ্র")) return "lightning";
        if (text.includes("flood") || text.includes("heavy rain") || text.includes("rain probability") || text.includes("rainfall") || text.includes("flooding") || text.includes("बाढ़") || text.includes("বান") || text.includes("বৃষ্টি")) return "rain";
        if (text.includes("heatwave") || text.includes("heat wave") || text.includes("extreme heat") || text.includes("heat alert") || text.includes("very high temperature") || text.includes("high temperature") || text.includes("extreme temperature") || text.includes("लू") || text.includes("উষ্ণতা")) return "heat";
        if (text.includes("fog") || text.includes("low visibility") || text.includes("dense mist") || text.includes("visibility") || text.includes("कुहरा") || text.includes("কুয়াশা")) return "fog";
        if (text.includes("strong wind") || text.includes("high wind") || text.includes("very strong wind") || text.includes("wind alert") || text.includes("gale") || text.includes("तेज़ हवा") || text.includes("তীব্র বাতাস")) return "wind";
        return null;
    }

    function getSafetyGuideData(alert) {
        const type = getSafetyGuide(alert);
        const guides = {
            cyclone: {
                icon: "🌪️", title: "Cyclone Safety",
                important: "If an official evacuation order is issued for your area, follow it immediately and use the designated safe route.",
                dos: ["Stay indoors in the safest part of your building and keep away from windows.", "Keep your phone charged and keep essential medicines, documents and emergency supplies ready.", "Follow official local warnings and evacuation instructions for your selected location.", "If authorities advise moving to a safer or elevated place, do so before conditions worsen."],
                donts: ["Don't go to coastal, low-lying or evacuated areas while the warning is active.", "Don't cross flooded roads, drains or fast-flowing water.", "Don't touch fallen electrical wires or damaged electrical equipment.", "Don't make unnecessary trips outside during the warning."],
                links: [
                    { label: "IMD Weather Information", url: "https://mausam.imd.gov.in/" },
                    { label: "NDMA SACHET Alerts", url: "https://sachet.ndma.gov.in/" }
                ]
            },
            rain: {
                icon: "🌧️", title: "Heavy Rain / Flood Safety",
                important: "If flooding is reported near your location, move away from low-lying areas and follow local authority instructions.",
                dos: ["Stay in a safe, elevated or secure location when flooding is possible.", "Keep your phone charged and protect important documents, medicines and electronics from water.", "Check official local warnings before leaving your selected location.", "If authorities advise evacuation, leave early using the recommended safe route."],
                donts: ["Don't walk or drive through fast-flowing or unknown-depth water.", "Don't go near open drains, culverts, flooded underpasses or damaged roads.", "Don't attempt to cross a flooded route just because the water looks shallow.", "Don't make unnecessary travel plans during severe rainfall or flooding."],
                links: [
                    { label: "IMD Weather Information", url: "https://mausam.imd.gov.in/" },
                    { label: "NDMA SACHET Alerts", url: "https://sachet.ndma.gov.in/" }
                ]
            },
            lightning: {
                icon: "⚡", title: "Lightning / Thunderstorm Safety",
                important: "When thunder is heard, treat the storm as nearby and move into a substantial building or enclosed vehicle.",
                dos: ["Move indoors or into an enclosed vehicle as soon as a thunderstorm approaches.", "Pause outdoor activities and wait until the storm has safely passed.", "Stay away from exposed windows, doors and outdoor open spaces during severe storms.", "Keep monitoring official thunderstorm warnings for your location."],
                donts: ["Don't stay in open fields, rooftops or other exposed high places.", "Don't shelter under an isolated tree.", "Don't stand close to exposed metal structures or electrical equipment.", "Don't return to outdoor activities while thunderstorm conditions remain active."],
                links: [
                    { label: "IMD Weather Information", url: "https://mausam.imd.gov.in/" },
                    { label: "NDMA SACHET Alerts", url: "https://sachet.ndma.gov.in/" }
                ]
            },
            heat: {
                icon: "🔥", title: "Heatwave Safety",
                important: "During extreme heat, reduce unnecessary outdoor exposure and pay extra attention to hydration and cooling.",
                dos: ["Drink water regularly and keep yourself hydrated.", "Reduce outdoor exposure during the hottest part of the day.", "Stay in a cool, shaded or well-ventilated place whenever possible.", "Check on children, older people and anyone who may need extra support during extreme heat."],
                donts: ["Don't do unnecessary strenuous activity during peak heat.", "Don't stay inside a closed parked vehicle.", "Don't ignore signs of heat-related illness; seek appropriate help when needed.", "Don't remain in direct sunlight for long periods during peak heat."],
                links: [
                    { label: "IMD Weather Information", url: "https://mausam.imd.gov.in/" },
                    { label: "NDMA SACHET Alerts", url: "https://sachet.ndma.gov.in/" }
                ]
            },
            fog: {
                icon: "🌫️", title: "Dense Fog / Low Visibility Safety",
                important: "If visibility is very poor at your location, postpone non-essential travel and use extra caution on roads.",
                dos: ["Reduce speed and increase following distance while travelling.", "Use appropriate vehicle lights and follow road markings carefully.", "Postpone non-essential travel when visibility becomes very poor.", "Pay extra attention at intersections, crossings and turns."],
                donts: ["Don't drive at high speed in low visibility.", "Don't make sudden overtakes, lane changes or sharp manoeuvres.", "Don't assume normal stopping distances when visibility is reduced.", "Don't stop in the middle of a traffic lane unless necessary for safety."],
                links: [
                    { label: "IMD Weather Information", url: "https://mausam.imd.gov.in/" },
                    { label: "NDMA SACHET Alerts", url: "https://sachet.ndma.gov.in/" }
                ]
            },
            wind: {
                icon: "🌬️", title: "Strong Wind Safety",
                important: "If very strong winds are affecting your location, stay indoors and keep away from loose structures and exposed areas.",
                dos: ["Stay indoors and secure loose outdoor objects if it is safe to do so.", "Keep doors and windows properly closed.", "Keep away from exposed balconies, unstable structures and damaged buildings.", "Continue monitoring official warnings because wind conditions can change quickly."],
                donts: ["Don't stand near loose structures, signs, poles or unstable trees.", "Don't approach fallen electrical wires.", "Don't go outside unnecessarily while very strong winds are active.", "Don't park or wait under unstable trees, hoardings or structures."],
                links: [
                    { label: "IMD Weather Information", url: "https://mausam.imd.gov.in/" },
                    { label: "NDMA SACHET Alerts", url: "https://sachet.ndma.gov.in/" }
                ]
            }
        };
        return type ? guides[type] : null;
    }

    function createSafetyGuide(alert) {
        const guide = getSafetyGuideData(alert);
        if (!guide) return "";

        const safeId = `safety-${Math.random().toString(36).slice(2, 10)}`;
        const locationName = currentLocationName || alert?.location || t("your_selected_location");
        const list = items => items.map(item => `<li>${escapeHTML(item)}</li>`).join("");
        const links = guide.links.map(link => `<a class="alert-safety-link" href="${link.url}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> ${escapeHTML(link.label)}</a>`).join("");

        return `
            <div class="alert-safety-context">
                <i class="bi bi-person-check-fill"></i>
                <span>${t("personal_safety_guidance_for")} <strong>${escapeHTML(locationName)}</strong></span>
            </div>
            <div class="alert-safety-actions" data-safety-id="${safeId}">
                <button type="button" class="alert-safety-btn alert-do-btn" data-safety-action="do" aria-expanded="false">
                    <i class="bi bi-check-circle-fill"></i> ${t("safety_dos")}
                </button>
                <button type="button" class="alert-safety-btn alert-dont-btn" data-safety-action="dont" aria-expanded="false">
                    <i class="bi bi-x-circle-fill"></i> ${t("safety_donts")}
                </button>
            </div>
            <div class="alert-safety-details" id="${safeId}" hidden>
                <div class="alert-safety-detail-panel">
                    <div class="alert-safety-detail-head">
                        <span>${guide.icon}</span>
                        <strong>${escapeHTML(guide.title)}</strong>
                    </div>
                    <div class="alert-safety-detail-content">
                        <div class="alert-detail-do" data-safety-detail="do">
                            <strong>✅ ${t("what_you_should_do")}</strong>
                            <ul>${list(guide.dos)}</ul>
                        </div>
                        <div class="alert-detail-dont" data-safety-detail="dont" hidden>
                            <strong>❌ ${t("what_you_should_not_do")}</strong>
                            <ul>${list(guide.donts)}</ul>
                        </div>
                    </div>
                    <div class="alert-safety-important">
                        <div class="alert-safety-important-title"><i class="bi bi-exclamation-circle-fill"></i> ${t("safety_important")}</div>
                        <div class="alert-safety-important-text">${escapeHTML(guide.important)}</div>
                    </div>
                    <div class="alert-safety-links">
                        <div class="alert-safety-links-title"><i class="bi bi-link-45deg"></i> ${t("safety_official_info")}</div>
                        <div class="alert-safety-links-list">${links}</div>
                    </div>
                    <div class="alert-safety-note"><i class="bi bi-info-circle"></i> ${t("follow_official_emergency_instructions")}</div>
                </div>
            </div>
        `;
    }

    async function translateSafetyGuide(card) {
        if (!card || typeof translateDynamicStrings !== "function") return;
        const lang = String(currentLanguage || "en");
        if (lang === "en") return;
        const nodes = card.querySelectorAll(".alert-safety-context span, .alert-safety-btn, .alert-safety-detail-head strong, .alert-safety-detail-content strong, .alert-safety-detail-content li, .alert-safety-important-title, .alert-safety-important-text, .alert-safety-links-title, .alert-safety-link, .alert-safety-note");
        const texts = Array.from(nodes).map(node => node.textContent.trim()).filter(Boolean);
        if (!texts.length) return;
        const translated = await translateDynamicStrings(texts, lang, "en");
        let index = 0;
        nodes.forEach(node => {
            const original = node.textContent.trim();
            if (!original) return;
            const replacement = translated[index++];
            if (replacement && replacement !== original) {
                if (node.classList.contains("alert-safety-btn")) {
                    const icon = node.querySelector("i");
                    node.textContent = "";
                    if (icon) node.appendChild(icon);
                    node.appendChild(document.createTextNode(" " + replacement));
                } else if (node.classList.contains("alert-safety-link")) {
                    const icon = node.querySelector("i");
                    node.textContent = "";
                    if (icon) node.appendChild(icon);
                    node.appendChild(document.createTextNode(" " + replacement));
                } else if (node.classList.contains("alert-safety-context") || node.querySelector("strong")) {
                    node.textContent = replacement;
                } else {
                    node.textContent = replacement;
                }
            }
        });
    }

    function wireSafetyGuide(card, alert) {
        if (!getSafetyGuide(alert)) return;
        const actions = card.querySelector(".alert-safety-actions");
        const details = card.querySelector(".alert-safety-details");
        if (!actions || !details) return;

        const doButton = actions.querySelector('[data-safety-action="do"]');
        const dontButton = actions.querySelector('[data-safety-action="dont"]');
        const doDetail = details.querySelector('[data-safety-detail="do"]');
        const dontDetail = details.querySelector('[data-safety-detail="dont"]');

        const open = type => {
            const isSame = !details.hidden && details.dataset.active === type;
            details.hidden = isSame;
            details.dataset.active = isSame ? "" : type;
            doDetail.hidden = type !== "do" || isSame;
            dontDetail.hidden = type !== "dont" || isSame;
            doButton.setAttribute("aria-expanded", String(!isSame && type === "do"));
            dontButton.setAttribute("aria-expanded", String(!isSame && type === "dont"));
        };

        doButton.addEventListener("click", () => open("do"));
        dontButton.addEventListener("click", () => open("dont"));
        translateSafetyGuide(card);
    }

    async function createCompactAlertCard(alert) {
        const card = document.createElement("div");
        const uiLevel = ["red", "orange", "yellow", "green"].includes(alert.level) ? alert.level : "yellow";
        card.className = `compact-alert alert-${uiLevel}`;

        const title = escapeHTML(alert.title || t("weather_alert"));
        const message = escapeHTML(alert.message || "");
        const levelText = translateSeverityLevel(uiLevel);
        const safetyGuide = createSafetyGuide(alert);

        card.innerHTML = `
            <div class="compact-alert-icon">${getAlertIcon(uiLevel)}</div>
            <div class="compact-alert-body">
                <div class="compact-alert-top">
                    <strong>${title}</strong>
                    <span class="alert-level">${levelText}</span>
                </div>
                <p>${message}</p>
                ${safetyGuide}
            </div>
        `;

        wireSafetyGuide(card, alert);

        // Wait for safety content localization before the card becomes visible.
        // This prevents English safety text from flashing/staying visible when
        // a non-English language is selected.
        await translateSafetyGuide(card);
        return card;
    }

    function getAlertIcon(level) {

        switch (level) {

            case "red":
                return "🔴";

            case "orange":
                return "🟠";

            case "yellow":
                return "🟡";

            default:
                return "🟢";
        }
    }

}

// Advanced Weather Visualizations

function displayWeatherCharts(
    hourlyForecast,
    dailyForecast,
    updatedAt
) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js is not loaded.");
        return;
    }

    renderHourlyWeatherChart(
        hourlyForecast,
        updatedAt
    );

    renderDailyWeatherChart(
        dailyForecast
    );

    renderDetailedPrecipitation(
        hourlyForecast,
        dailyForecast,
        updatedAt
    );
}

// Smart AI Recommendations

async function loadRecommendations(weather, location) {
    const grid = document.getElementById("recommendationsGrid");
    const note = document.getElementById("recommendationNote");
    if (!grid || !weather) return;

    grid.innerHTML = `
        <div class="recommendation-loading">
            <i class="bi bi-stars"></i>
            Generating smart recommendations...
        </div>`;

    try {
        const response = await fetch("/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                weather: weather,
                location: location || "your location",
                language: currentLanguage
            })
        });

        let data = await response.json();
        if (currentLanguage !== "en") {
            data = await localizeObjectDeep(data, currentLanguage);
        }
        if (!response.ok) throw new Error(data.error || "Recommendation request failed");

        grid.innerHTML = (data.recommendations || []).map(item => {
            const icons = {
                outfit: "bi-person-badge",
                outdoor: "bi-tree",
                travel: "bi-car-front",
                umbrella: "bi-umbrella"
            };
            return `
                <div class="recommendation-card">
                    <div class="recommendation-icon"><i class="bi ${icons[item.type] || "bi-stars"}"></i></div>
                    <div class="recommendation-body">
                        <span class="recommendation-title">${escapeHtml(item.title)}</span>
                        <strong>${escapeHtml(item.recommendation)}</strong>
                        <p>${escapeHtml(item.reason)}</p>
                    </div>
                </div>`;
        }).join("") || `<div class="recommendation-loading">No recommendations available.</div>`;

        if (note && data.summary) note.textContent = data.summary;
    } catch (error) {
        console.error("Recommendations error:", error);
        grid.innerHTML = `<div class="recommendation-loading">Recommendations are temporarily unavailable.</div>`;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderHourlyWeatherChart(
    hourlyForecast,
    updatedAt
) {
    const canvas = document.getElementById(
        "hourlyWeatherChart"
    );

    if (!canvas) return;

    if (hourlyWeatherChart) {
        hourlyWeatherChart.destroy();
        hourlyWeatherChart = null;
    }

    if (!Array.isArray(hourlyForecast) || hourlyForecast.length === 0) {
        return;
    }

    // Show the next 24 available hours, starting from the current API hour.
    let startIndex = 0;

    if (updatedAt) {
        const updatedTime = new Date(updatedAt).getTime();
        const foundIndex = hourlyForecast.findIndex((hour) => {
            const time = new Date(hour.time).getTime();
            return !Number.isNaN(time) && time >= updatedTime;
        });

        if (foundIndex >= 0) {
            startIndex = foundIndex;
        }
    }

    const hours = hourlyForecast.slice(
        startIndex,
        startIndex + 24
    );

    const labels = hours.map((hour) => formatChartHour(hour.time));
    const temperatures = hours.map((hour) => convertTemperature(toNumber(hour.temperature)));
    const rainProbabilities = hours.map((hour) => toNumber(hour.rain_probability));
    const windSpeeds = hours.map((hour) => toNumber(hour.wind_speed));

    hourlyWeatherChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: `${t("temperature")} (${temperatureUnit === "fahrenheit" ? "°F" : "°C"})`,
                    data: temperatures,
                    yAxisID: "temperature",
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    spanGaps: true
                },
                {
                    label: t("rain_probability_percent"),
                    data: rainProbabilities,
                    yAxisID: "rain",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 1,
                    spanGaps: true
                },
                {
                    label: t("wind_kmh"),
                    data: windSpeeds,
                    yAxisID: "wind",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 1,
                    borderDash: [5, 4],
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            if (value === null || value === undefined) {
                                return `${context.dataset.label}: --`;
                            }
                            const unit = context.dataset.label.includes("Temperature")
                                ? "°C"
                                : context.dataset.label.includes("Rain")
                                    ? "%"
                                    : " km/h";
                            return `${context.dataset.label}: ${value}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        maxRotation: 0
                    }
                },
                temperature: {
                    type: "linear",
                    position: "left",
                    title: {
                        display: true,
                        text: temperatureUnit === "fahrenheit" ? "°F" : "°C"
                    }
                },
                rain: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: "Rain %"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                wind: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    display: false,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function renderDailyWeatherChart(dailyForecast) {
    const canvas = document.getElementById(
        "dailyWeatherChart"
    );

    if (!canvas) return;

    if (dailyWeatherChart) {
        dailyWeatherChart.destroy();
        dailyWeatherChart = null;
    }

    if (!Array.isArray(dailyForecast) || dailyForecast.length === 0) {
        return;
    }

    const days = dailyForecast.slice(0, 7);
    const labels = days.map((day, index) => {
        if (index === 0) return t("today_label");

        const date = new Date(`${day.date}T00:00:00`);
        return localizedWeekdayShort(date);
    });

    const maxTemps = days.map((day) => convertTemperature(toNumber(day.max_temp)));
    const minTemps = days.map((day) => convertTemperature(toNumber(day.min_temp)));
    const rainProbabilities = days.map((day) => toNumber(day.rain_probability));

    dailyWeatherChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: `${t("max_temperature")} (${temperatureUnit === "fahrenheit" ? "°F" : "°C"})`,
                    data: maxTemps,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false,
                    spanGaps: true
                },
                {
                    label: `${t("min_temperature")} (${temperatureUnit === "fahrenheit" ? "°F" : "°C"})`,
                    data: minTemps,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false,
                    spanGaps: true
                },
                {
                    label: t("rain_probability_percent"),
                    data: rainProbabilities,
                    yAxisID: "rain",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 2,
                    borderDash: [5, 4],
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 14
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `${t("temperature")} (${temperatureUnit === "fahrenheit" ? "°F" : "°C"})`
                    }
                },
                rain: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: "Rain %"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function formatChartHour(time) {
    const date = new Date(time);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        hour12: true
    });
}

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

// Detailed Precipitation

function renderDetailedPrecipitation(
    hourlyForecast,
    dailyForecast,
    updatedAt
) {
    const summary = document.getElementById("precipitationSummary");
    const canvas = document.getElementById("precipitationChart");
    const note = document.getElementById("precipitationNote");

    if (!summary || !canvas) return;

    if (precipitationChart) {
        precipitationChart.destroy();
        precipitationChart = null;
    }

    if (!Array.isArray(hourlyForecast) || hourlyForecast.length === 0) {
        summary.innerHTML = '<div class="precipitation-empty">Precipitation forecast is currently unavailable.</div>';
        if (note) note.textContent = "No hourly precipitation data is available.";
        return;
    }

    let startIndex = 0;
    if (updatedAt) {
        const updatedTime = new Date(updatedAt).getTime();
        const foundIndex = hourlyForecast.findIndex((hour) => {
            const time = new Date(hour.time).getTime();
            return !Number.isNaN(time) && time >= updatedTime;
        });
        if (foundIndex >= 0) startIndex = foundIndex;
    }

    const hours = hourlyForecast.slice(startIndex, startIndex + 24);
    const precipitation = hours.map((hour) => Math.max(0, toNumber(hour.precipitation) ?? 0));
    const probabilities = hours.map((hour) => toNumber(hour.rain_probability));

    const totalRain = precipitation.reduce((sum, value) => sum + value, 0);
    const peakRain = precipitation.length ? Math.max(...precipitation) : 0;
    const peakProbability = probabilities.filter(v => v !== null).length
        ? Math.max(...probabilities.filter(v => v !== null))
        : 0;
    const rainyHours = precipitation.filter((value, index) =>
        value > 0 || (probabilities[index] !== null && probabilities[index] >= 50)
    ).length;

    summary.innerHTML = `
        <div class="precipitation-stat">
            <i class="bi bi-droplet"></i>
            <div><span>Expected rain</span><strong>${totalRain.toFixed(1)} mm</strong></div>
        </div>
        <div class="precipitation-stat">
            <i class="bi bi-cloud-rain"></i>
            <div><span>Peak hourly rain</span><strong>${peakRain.toFixed(1)} mm</strong></div>
        </div>
        <div class="precipitation-stat">
            <i class="bi bi-percent"></i>
            <div><span>Highest probability</span><strong>${Math.round(peakProbability)}%</strong></div>
        </div>
        <div class="precipitation-stat">
            <i class="bi bi-clock"></i>
            <div><span>Rain-risk hours</span><strong>${rainyHours} / ${hours.length}</strong></div>
        </div>
    `;

    const labels = hours.map(hour => formatChartHour(hour.time));

    precipitationChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: t("rainfall_mm"),
                    data: precipitation,
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: "rainfall",
                    categoryPercentage: 0.72,
                    barPercentage: 0.8
                },
                {
                    type: "line",
                    label: t("rain_probability_percent"),
                    data: probabilities,
                    yAxisID: "probability",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 2,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            if (value === null || value === undefined) return `${context.dataset.label}: --`;
                            return context.dataset.label.includes("probability")
                                ? `${context.dataset.label}: ${Math.round(value)}%`
                                : `${context.dataset.label}: ${value.toFixed(1)} mm`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 8, maxRotation: 0 }
                },
                rainfall: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: t("rainfall_mm") }
                },
                probability: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    max: 100,
                    title: { display: true, text: t("probability_percent") },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });

    const dailyTotal = Array.isArray(dailyForecast)
        ? toNumber(dailyForecast[0]?.precipitation_sum)
        : null;

    if (note) {
        if (dailyTotal !== null) {
            note.textContent = `Today's total precipitation forecast: ${dailyTotal.toFixed(1)} mm. Hourly values show when the rain is most likely to occur.`;
        } else if (peakProbability >= 70) {
            note.textContent = "High rain probability is expected during some hours. Check the hourly chart before planning outdoor activities.";
        } else if (totalRain > 0) {
            note.textContent = "Some precipitation is forecast in the next 24 hours. The chart highlights the wetter hours.";
        } else {
            note.textContent = "No measurable rainfall is currently forecast in the next 24 hours.";
        }
    }
}

// 7 Day Forecast

function displayForecast(
    forecast
) {

    const container =
        document.getElementById(
            "forecastContainer"
        );

    if (!container) return;

    container.innerHTML =
        "";

    if (
        !forecast ||
        forecast.length === 0
    ) {

        container.innerHTML = `

            <p class="text-muted">
                ${t("forecast_unavailable")}
            </p>

        `;

        return;

    }

    forecast
        .slice(0, 7)
        .forEach(
            (day, index) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "forecast-card";

                const date =
                    new Date(
                        `${day.date}T00:00:00`
                    );

                let dayName;

                if (index === 0) {

                    dayName =
                        t("today_label");

                } else {

                    dayName =
                        localizedWeekdayShort(date);

                }

                const icon =
                    getWeatherIcon(
                        day.weather_code
                    );

                const maxTemp =
                    Number(
                        day.max_temp
                    );

                const minTemp =
                    Number(
                        day.min_temp
                    );

                const rainProbability =
                    Number(
                        day.rain_probability || 0
                    );

                card.innerHTML = `

                    <div class="forecast-day">

                        ${escapeHTML(
                            dayName
                        )}

                    </div>

                    <div class="forecast-date">

                        ${escapeHTML(
                            day.date
                        )}

                    </div>

                    <div class="forecast-icon">

                        ${icon}

                    </div>

                    <div class="forecast-temp">

                        <strong>
                            ${Math.round(
                                convertTemperature(maxTemp)
                            )}°
                        </strong>

                        /

                        ${Math.round(
                            convertTemperature(minTemp)
                        )}°

                    </div>

                    <div class="forecast-rain">

                        🌧️ ${rainProbability}%

                    </div>

                `;

                container.appendChild(
                    card
                );

            }
        );

}

// 24 Hour Forecast

function display24HourForecast(hourlyForecast) {
    const container = document.getElementById("hourlyForecastContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(hourlyForecast) || hourlyForecast.length === 0) {
        container.innerHTML = '<p class="text-muted">${t("forecast_24h_unavailable")}</p>';
        return;
    }

    const now = new Date();
    let startIndex = hourlyForecast.findIndex((hour) => {
        const time = new Date(hour.time || hour.datetime || hour.date);
        return !Number.isNaN(time.getTime()) && time >= new Date(now.getTime() - 60 * 60 * 1000);
    });
    if (startIndex < 0) startIndex = 0;

    const hours = hourlyForecast.slice(startIndex, startIndex + 24);

    hours.forEach((hour, index) => {
        const card = document.createElement("div");
        card.className = "hourly-forecast-card";

        const timeValue = hour.time || hour.datetime || hour.date;
        const date = new Date(timeValue);
        const validDate = !Number.isNaN(date.getTime());
        const timeLabel = validDate
            ? (index === 0 && date.getTime() <= now.getTime() + 30 * 60 * 1000
                ? "Now"
                : date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }))
            : (hour.time || "--");

        const temp = Number(hour.temperature ?? hour.temperature_2m);
        const rain = Number(hour.rain_probability ?? hour.precipitation_probability);
        const precipitation = Number(hour.precipitation);
        const wind = Number(hour.wind_speed ?? hour.wind_speed_10m);
        const code = Number(hour.weather_code);

        card.innerHTML = `
            <div class="hourly-time">${escapeHTML(timeLabel)}</div>
            <div class="hourly-icon">${getWeatherIcon(code)}</div>
            <div class="hourly-temp">${Number.isFinite(temp) ? `${Math.round(convertTemperature(temp))}°` : "--"}</div>
            <div class="hourly-rain">🌧️ ${Number.isFinite(rain) ? `${Math.round(rain)}%` : "--"}</div>
            <div class="hourly-meta">💧 ${Number.isFinite(precipitation) ? `${precipitation.toFixed(1)} mm` : "--"}</div>
            <div class="hourly-meta">💨 ${Number.isFinite(wind) ? `${Math.round(wind)} km/h` : "--"}</div>
        `;

        container.appendChild(card);
    });
}

// Weather Icon

function getWeatherIcon(
    code
) {

    code =
        Number(code);

    if (code === 0) {

        return "☀️";

    }

    if (
        code === 1 ||
        code === 2
    ) {

        return "🌤️";

    }

    if (code === 3) {

        return "☁️";

    }

    if (
        code === 45 ||
        code === 48
    ) {

        return "🌫️";

    }

    if (
        code >= 51 &&
        code <= 57
    ) {

        return "🌦️";

    }

    if (
        code >= 61 &&
        code <= 67
    ) {

        return "🌧️";

    }

    if (
        code >= 71 &&
        code <= 77
    ) {

        return "❄️";

    }

    if (
        code >= 80 &&
        code <= 82
    ) {

        return "🌦️";

    }

    if (
        code >= 95
    ) {

        return "⛈️";

    }

    return "🌤️";

}

// Weather Description

function getWeatherDescription(
    code
) {

    code =
        Number(code);

    const weatherCodes = {

        0:
            "Clear sky",

        1:
            "Mainly clear",

        2:
            "Partly cloudy",

        3:
            "Overcast",

        45:
            "Foggy",

        48:
            "Foggy",

        51:
            "Light drizzle",

        53:
            "Moderate drizzle",

        55:
            "Heavy drizzle",

        56:
            "Freezing drizzle",

        57:
            "Heavy freezing drizzle",

        61:
            "Slight rain",

        63:
            "Moderate rain",

        65:
            "Heavy rain",

        66:
            "Freezing rain",

        67:
            "Heavy freezing rain",

        71:
            "Light snow",

        73:
            "Moderate snow",

        75:
            "Heavy snow",

        77:
            "Snow grains",

        80:
            "Rain showers",

        81:
            "Moderate rain showers",

        82:
            "Heavy rain showers",

        95:
            "Thunderstorm",

        96:
            "Thunderstorm with hail",

        99:
            "Heavy thunderstorm with hail"

    };

    return (

        weatherCodes[code] ||

        "Weather information available"

    );

}

// Saved Locations

function persistSavedLocations() {
    if (!currentUser) {
        localStorage.setItem("weatherGPTSavedLocations", JSON.stringify(savedLocations));
    }
}

async function loadAccountSavedLocations() {
    if (!currentUser) return false;
    try {
        const res = await fetch("/api/saved-locations");
        const data = await res.json();
        if (!res.ok || !data.authenticated) return false;
        savedLocations = Array.isArray(data.locations) ? data.locations : [];
        renderSavedLocations();
        updateSaveLocationButton();
        syncSettingsForm();
        return true;
    } catch (error) {
        console.warn("Could not load account saved locations:", error);
        return false;
    }
}

async function syncSavedLocationsForAccount() {
    if (!currentUser) return;
    const anonymousLocations = JSON.parse(localStorage.getItem("weatherGPTSavedLocations") || "[]");
    try {
        for (const location of anonymousLocations.slice(0, 8)) {
            await fetch("/api/saved-locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(location)
            });
        }
        localStorage.removeItem("weatherGPTSavedLocations");
        await loadAccountSavedLocations();
    } catch (error) {
        console.warn("Could not sync saved locations:", error);
        await loadAccountSavedLocations();
    }
}

async function saveLocationToAccount(location) {
    if (!currentUser || !location) return;
    try {
        const res = await fetch("/api/saved-locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(location)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Unable to save location");
        }
        await loadAccountSavedLocations();
    } catch (error) {
        console.warn("Account save failed:", error);
        showToast(error.message);
    }
}

async function deleteLocationFromAccount(location) {
    if (!currentUser || !location) return;
    if (location.id) {
        await fetch(`/api/saved-locations/${location.id}`, { method: "DELETE" });
    } else {
        const match = savedLocations.find(item => locationKey(item) === locationKey(location));
        if (match?.id) await fetch(`/api/saved-locations/${match.id}`, { method: "DELETE" });
    }
    await loadAccountSavedLocations();
}

function locationKey(location) {
    return `${Number(location.latitude).toFixed(4)},${Number(location.longitude).toFixed(4)}`;
}

function toggleSaveCurrentLocation() {
    if (!currentLocation || !currentLocationName) return;

    const key = locationKey(currentLocation);
    const index = savedLocations.findIndex(item => locationKey(item) === key);

    let removedLocation = null;
    if (index >= 0) {
        removedLocation = savedLocations[index];
        savedLocations.splice(index, 1);
    } else {
        savedLocations.unshift({
            name: currentLocationName,
            latitude: Number(currentLocation.latitude),
            longitude: Number(currentLocation.longitude)
        });
        savedLocations = savedLocations.slice(0, 8);
    }

    persistSavedLocations();
    renderSavedLocations();
    updateSaveLocationButton();
    if (currentUser) {
        if (index >= 0) {
            deleteLocationFromAccount(removedLocation);
        } else {
            saveLocationToAccount(savedLocations[0]);
        }
    }
}

function updateSaveLocationButton() {
    const button = document.getElementById("saveLocationBtn");
    if (!button) return;

    const saved = currentLocation && savedLocations.some(
        item => locationKey(item) === locationKey(currentLocation)
    );

    button.classList.toggle("saved", !!saved);
    button.title = saved ? "Remove saved location" : "Save current location";
    button.innerHTML = `<i class="bi ${saved ? "bi-star-fill" : "bi-star"}"></i>`;
}

function renderSavedLocations() {
    const box = document.getElementById("savedLocationsList");
    if (!box) return;

    box.innerHTML = "";

    if (!savedLocations.length) {
        box.innerHTML = `<div class="empty-history">No saved locations</div>`;
        return;
    }

    savedLocations.forEach((location, index) => {
        const item = document.createElement("div");
        item.className = "saved-location-item";
        item.innerHTML = `
            <button class="saved-location-main" type="button" title="Load ${escapeHTML(location.name)}">
                <i class="bi bi-geo-alt-fill"></i>
                <span>${escapeHTML(location.name)}</span>
            </button>
            <button class="saved-location-remove" type="button" title="Remove saved location" aria-label="Remove saved location">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        item.querySelector(".saved-location-main").addEventListener("click", () => selectCity(location));
        item.querySelector(".saved-location-remove").addEventListener("click", (event) => {
            event.stopPropagation();
            const removedLocation = savedLocations[index];
            savedLocations.splice(index, 1);
            persistSavedLocations();
            renderSavedLocations();
            updateSaveLocationButton();
            if (currentUser) deleteLocationFromAccount(removedLocation);
        });

        box.appendChild(item);
    });
}

// City Search

async function searchCity(isAutocomplete = false, requestId = 0) {

    const input =
        document.getElementById(
            "citySearchInput"
        );

    const resultsBox =
        document.getElementById(
            "searchResults"
        );

    if (
        !input ||
        !resultsBox
    ) {

        return;

    }

    const query =
        input.value.trim();

    if (!query) {

        resultsBox.style.display =
            "none";

        return;

    }

    resultsBox.style.display =
        "block";

    resultsBox.innerHTML = `

        <div class="search-result">

            🔍 Searching for

            <strong>
                ${escapeHTML(query)}
            </strong>

        </div>

    `;

    try {

        const response =
            await fetch(
                "/search-location",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            query:
                                query

                        })

                }
            );

        let data =
            await response.json();

        if (!response.ok) {

            throw new Error(

                data.error ||
                "Location not found"

            );

        }

        if (isAutocomplete && requestId !== autocompleteRequestId) {
            return;
        }

        displaySearchResults(
            data.locations,
            isAutocomplete
        );

    } catch (error) {
        console.error("City search error:", error);
        resultsBox.innerHTML = `
            <div class="search-result">
                ❌
                ${escapeHTML(error.message)}
            </div>
        `;
    }

}

/* =================================================
   FULL SEARCH SECTION
   ================================================= */

async function performFullSearch() {

    const input =
        document.getElementById("fullSearchInput");

    const resultsBox =
        document.getElementById("fullSearchResults");

    if (!input || !resultsBox) return;

    const query = input.value.trim();

    if (!query) {
        resultsBox.innerHTML = "";
        return;
    }

    resultsBox.innerHTML = `
        <div class="full-search-result">
            🔍 Searching for
            <strong>${escapeHTML(query)}</strong>
        </div>
    `;

    try {

        const response = await fetch(
            "/search-location",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    query: query
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Location not found"
            );
        }

        displayFullSearchResults(data.locations);

    } catch (error) {

        console.error(
            "Full search error:",
            error
        );

        resultsBox.innerHTML = `
            <div class="full-search-result">
                ❌ ${escapeHTML(error.message)}
            </div>
        `;
    }
}


/* Display results in full search section */

function displayFullSearchResults(locations) {

    const resultsBox =
        document.getElementById(
            "fullSearchResults"
        );

    if (!resultsBox) return;

    if (
        !locations ||
        !locations.length
    ) {

        resultsBox.innerHTML = `
            <div class="full-search-result">
                ❌ No locations found
            </div>
        `;

        return;
    }

    resultsBox.innerHTML =
        locations.map((location, index) => {

            const name =
                location.name ||
                location.display_name ||
                "Unknown location";

            const displayName =
                location.display_name ||
                name;

            return `
                <div
                    class="full-search-result"
                    onclick="selectFullSearchLocation(${index})"
                >
                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <div class="search-location-subtext">
                        ${escapeHTML(displayName)}
                    </div>
                </div>
            `;

        }).join("");

    window.fullSearchLocations =
        locations;
}


/* Select location */

async function selectFullSearchLocation(index) {

    const locations =
        window.fullSearchLocations || [];

    const location =
        locations[index];

    if (!location) return;

    // Existing city selection + weather loading
    await selectCity(location);

    // Close full search section
    closeSearchSection();
}

// Display Search Results

function displaySearchResults(
    locations,
    isAutocomplete = false
) {

    const resultsBox =
        document.getElementById(
            "searchResults"
        );

    if (!resultsBox) return;

    if (
        !locations ||
        locations.length === 0
    ) {

        resultsBox.innerHTML = `

            <div class="search-result">

                ❌ No location found

            </div>

        `;

        return;

    }

    resultsBox.innerHTML =
        "";

    locations.forEach(
        location => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "search-result";

            item.innerHTML = `

                <div class="search-result-title">

                    📍

                    ${escapeHTML(
                        location.name || location.place || location.display_name || "Unknown Location"
                    )}

                </div>

                <div class="search-result-subtitle">

                    ${escapeHTML(
                        [
                            location.place,
                            location.district,
                            location.state,
                            location.country
                        ].filter(Boolean).join(", ") || location.display_name || ""
                    )}

                </div>

            `;

            item.addEventListener(
                "click",
                () => {

                    selectCity(
                        location
                    );

                }
            );

            resultsBox.appendChild(
                item
            );

        }
    );

}

// Select City

async function selectCity(
    location
) {

    const latitude =
        Number(
            location.latitude
        );

    const longitude =
        Number(
            location.longitude
        );

    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
    ) {

        console.error(
            "Invalid city coordinates"
        );

        return;

    }

    // Save Selected Location

    cacheLocation(
        latitude,
        longitude,
        location.name || location.display_name || ""
    );

    currentLocationName = location.name || location.display_name || "";
    updateSaveLocationButton();

    // Update Status

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );

    if (locationStatus) {

        locationStatus.textContent =
            "Loading weather...";

    }

    // Update Search Input

    const input =
        document.getElementById(
            "citySearchInput"
        );

    if (input) {

        input.value =
            location.name || location.place || location.display_name || "";

    }

    // Hide Results

    const resultsBox =
        document.getElementById(
            "searchResults"
        );

    if (resultsBox) {

        resultsBox.style.display =
            "none";

    }

    // Load selected location data first
    await loadWeather(
        latitude,
        longitude
    );

    // Reload the complete page so every section
    // uses the newly selected location
    window.location.reload();
}

// Interactive weather map + radar

let weatherMap = null;
let weatherMapMarker = null;
let weatherRadarLayer = null;
let weatherMapInitialized = false;
let weatherMapLocation = null;

let weatherBaseLayer = null;
let weatherLayerControl = null;

function initializeWeatherMap(latitude, longitude) {

    const mapElement = document.getElementById("weatherMap");

    if (!mapElement || typeof L === "undefined") {
        return false;
    }

    if (!weatherMap) {
        weatherMap = L.map(mapElement, {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([latitude, longitude], 10);

        weatherBaseLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "© OpenStreetMap contributors"
            }
        ).addTo(weatherMap);

        weatherLayerControl = L.control.layers(
            {
                "🗺️ Standard Map": weatherBaseLayer
            },
            {},
            {
                collapsed: false,
                position: "topright"
            }
        ).addTo(weatherMap);
        addWeatherRadarControls();

        weatherMapInitialized = true;
    }

    weatherMap.setView([latitude, longitude], 10);

    if (weatherMapMarker) {
        weatherMap.removeLayer(weatherMapMarker);
    }

    weatherMapMarker = L.marker([latitude, longitude])
        .addTo(weatherMap)
        .bindPopup("<strong>Your selected location</strong>")
        .openPopup();

    setTimeout(() => weatherMap.invalidateSize(), 100);

    return true;
}

function updateWeatherMapWeatherInfo(weather) {
    if (!weatherMap || !weather) return;

    const temp =
        weather.temperature ??
        weather.temperature_2m ??
        weather.temp;

    const wind =
        weather.wind_speed ??
        weather.wind_speed_10m ??
        weather.wind;

    const humidity =
        weather.humidity ??
        weather.relative_humidity_2m;

    let html = `
        <div style="
            min-width:190px;
            font-size:13px;
            line-height:1.6;
        ">
            <strong>Current Weather</strong>
            <hr style="margin:6px 0;">
            ${temp != null ? `🌡️ Temperature: <strong>${temp}°C</strong><br>` : ""}
            ${wind != null ? `💨 Wind: <strong>${wind} km/h</strong><br>` : ""}
            ${humidity != null ? `💧 Humidity: <strong>${humidity}%</strong>` : ""}
        </div>
    `;

    if (weatherMapMarker) {
        weatherMapMarker.bindPopup(html);
    }
}
async function updateWeatherMap(
    latitude,
    longitude,
    locationName,
    weather
) {

    weatherMapLocation = {
        latitude,
        longitude,
        locationName,
        weather
    };

    const initialized = initializeWeatherMap(
        latitude,
        longitude
    );

    if (!initialized) {
        return;
    }

    updateWeatherMapWeatherInfo(weather);

    const title = document.getElementById("weatherMapTitle");
    const status = document.getElementById("weatherMapStatus");

    if (title) {
        title.textContent =
            (locationName || "Selected location") + " weather map";
    }

    if (status) {
        status.textContent = "Fetching latest radar...";
    }

    await loadRainViewerRadar();

    if (status) {
        status.textContent =
            weatherRadarLayer
                ? "Latest available radar overlay"
                : "Radar temporarily unavailable";
    }
}

async function loadRainViewerRadar() {

    if (!weatherMap) {
        return;
    }

    try {

        const response = await fetch(
            "https://api.rainviewer.com/public/weather-maps.json",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Radar API unavailable");
        }

        const data = await response.json();

        const past =
            data?.radar?.past || [];

        const nowcast =
            data?.radar?.nowcast || [];

        const frames =
            past.concat(nowcast);

        if (!frames.length) {
            throw new Error("No radar frames available");
        }

        // Prefer the latest nowcast frame, otherwise latest past frame.
        const frame =
            nowcast.length
                ? nowcast[0]
                : frames[frames.length - 1];

        const host =
            data.host || "https://tilecache.rainviewer.com";

        const tileUrl =
            host +
            frame.path +
            "/256/{z}/{x}/{y}/2/1_1.png";

        if (weatherRadarLayer) {
            if (weatherLayerControl) {
                weatherLayerControl.removeLayer(weatherRadarLayer);
            }
            weatherMap.removeLayer(weatherRadarLayer);
        }

        weatherRadarLayer = L.tileLayer(
            tileUrl,
            {
                tileSize: 256,
                opacity: 0.58,
                zIndex: 500,

                // RainViewer provides radar tiles only up to
                // a limited native zoom level.
                maxNativeZoom: 7,
                maxZoom: 19,

                // attribution: "Weather radar © RainViewer"
            }
        ).addTo(weatherMap);

        if (weatherLayerControl) {
            weatherLayerControl.addOverlay(
                weatherRadarLayer,
                "🌧️ Rain Radar"
            );
        }

    } catch (error) {
        console.warn("RainViewer radar error:", error);
        if (weatherRadarLayer) {
            weatherMap.removeLayer(weatherRadarLayer);
            weatherRadarLayer = null;
        }
    }
}

function addWeatherRadarControls() {
    if (!weatherMap || document.getElementById("weatherRadarControls")) {
        return;
    }

    const control = L.control({ position: "bottomleft" });

    control.onAdd = function () {
        const div = L.DomUtil.create(
            "div",
            "weather-radar-controls"
        );

        div.id = "weatherRadarControls";

        div.innerHTML = `
            <div style="
                background: rgba(255,255,255,0.96);
                padding: 12px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.18);
                min-width: 190px;
                font-size: 12px;
            ">
                <div style="
                    font-weight: 700;
                    margin-bottom: 8px;
                    font-size: 13px;
                ">
                    🌧️ Rain Radar
                </div>

                <label style="
                    display:block;
                    margin-bottom:5px;
                    font-weight:600;
                ">
                    Radar opacity
                </label>

                <input
                    id="weatherRadarOpacity"
                    type="range"
                    min="0"
                    max="100"
                    value="58"
                    style="width:100%;"
                >

                <div style="
                    display:flex;
                    justify-content:space-between;
                    color:#64748b;
                    font-size:10px;
                    margin-top:2px;
                ">
                    <span>Light</span>
                    <span id="weatherRadarOpacityValue">58%</span>
                    <span>Strong</span>
                </div>

                <div style="
                    margin-top:10px;
                    padding-top:8px;
                    border-top:1px solid #e2e8f0;
                ">
                    <div style="
                        font-weight:600;
                        margin-bottom:6px;
                    ">
                        Rain intensity
                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:6px;
                        margin-bottom:3px;
                    ">
                        <span style="
                            width:18px;
                            height:8px;
                            background:#4ade80;
                            display:inline-block;
                            border-radius:2px;
                        "></span>
                        Light
                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:6px;
                        margin-bottom:3px;
                    ">
                        <span style="
                            width:18px;
                            height:8px;
                            background:#facc15;
                            display:inline-block;
                            border-radius:2px;
                        "></span>
                        Moderate
                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:6px;
                        margin-bottom:3px;
                    ">
                        <span style="
                            width:18px;
                            height:8px;
                            background:#fb923c;
                            display:inline-block;
                            border-radius:2px;
                        "></span>
                        Heavy
                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:6px;
                    ">
                        <span style="
                            width:18px;
                            height:8px;
                            background:#ef4444;
                            display:inline-block;
                            border-radius:2px;
                        "></span>
                        Very heavy
                    </div>
                </div>
            </div>
        `;

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        return div;
    };

    control.addTo(weatherMap);

    const opacitySlider =
        document.getElementById("weatherRadarOpacity");

    const opacityValue =
        document.getElementById("weatherRadarOpacityValue");

    if (opacitySlider) {
        opacitySlider.addEventListener("input", () => {

            const opacity =
                Number(opacitySlider.value) / 100;

            if (weatherRadarLayer) {
                weatherRadarLayer.setOpacity(opacity);
            }

            if (opacityValue) {
                opacityValue.textContent =
                    `${opacitySlider.value}%`;
            }
        });
    }
}

async function refreshWeatherMap() {

    if (!weatherMapLocation) {
        return;
    }

    const status = document.getElementById("weatherMapStatus");

    if (status) {
        status.textContent = "Refreshing radar...";
    }

    initializeWeatherMap(
        weatherMapLocation.latitude,
        weatherMapLocation.longitude
    );

    await loadRainViewerRadar();

    if (status) {
        status.textContent =
            weatherRadarLayer
                ? "Radar updated"
                : "Radar temporarily unavailable";
    }
}

// Climate & Historical Analysis

function initClimateYearSelectors() {
    const start = document.getElementById("climateStartYear");
    const end = document.getElementById("climateEndYear");
    if (!start || !end || start.options.length) return;

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    for (let year = lastYear; year >= 1940; year--) {
        const a = document.createElement("option");
        const b = document.createElement("option");
        a.value = a.textContent = year;
        b.value = b.textContent = year;
        start.appendChild(a);
        end.appendChild(b);
    }
    start.value = Math.max(1940, lastYear - 9);
    end.value = lastYear;
}

function climateTrendLabel(trend, unit) {
    if (!trend || trend.change_per_year === null) return "Not enough data";
    const change = Math.abs(Number(trend.change_per_year));
    if (trend.direction === "increasing") return `↗ Increasing · ${change.toFixed(2)} ${unit}/year`;
    if (trend.direction === "decreasing") return `↘ Decreasing · ${change.toFixed(2)} ${unit}/year`;
    return "→ Stable trend";
}

async function loadClimateHistory() {
    const status = document.getElementById("climateHistoryStatus");
    if (!currentLocation || !Number.isFinite(Number(currentLocation.latitude)) || !Number.isFinite(Number(currentLocation.longitude))) {
        if (status) status.textContent = "Please search/select a city first.";
        return;
    }

    initClimateYearSelectors();
    const start = Number(document.getElementById("climateStartYear")?.value);
    const end = Number(document.getElementById("climateEndYear")?.value);
    if (!start || !end || start > end) {
        if (status) status.textContent = "Please choose a valid year range.";
        return;
    }

    if (status) status.textContent = `Analyzing ${currentLocationName || "this location"} historical weather...`;

    try {
        const params = new URLSearchParams({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            start_year: start,
            end_year: end
        });
        const response = await fetch(`/api/climate-history?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load climate data.");

        const records = (data.records || []).filter(r => r.avg_temperature !== null || r.total_precipitation !== null);
        const labels = records.map(r => r.year);
        const tempValues = records.map(r => r.avg_temperature);
        const rainValues = records.map(r => r.total_precipitation);
        const summary = data.summary || {};

        const avgTemp = document.getElementById("climateAvgTemp");
        const avgRain = document.getElementById("climateAvgRain");
        const tempTrend = document.getElementById("climateTempTrend");
        const rainTrend = document.getElementById("climateRainTrend");
        if (avgTemp) avgTemp.textContent = summary.average_temperature != null ? `${summary.average_temperature} °C` : "--";
        if (avgRain) avgRain.textContent = summary.average_annual_precipitation != null ? `${summary.average_annual_precipitation} mm` : "--";
        if (tempTrend) tempTrend.textContent = climateTrendLabel(summary.temperature_trend, "°C");
        if (rainTrend) rainTrend.textContent = climateTrendLabel(summary.precipitation_trend, "mm");
        if (status) status.textContent = `Showing ${start}–${end} for ${currentLocationName || "selected location"}.`;

        if (typeof Chart === "undefined") return;
        if (climateTemperatureChart) climateTemperatureChart.destroy();
        if (climateRainChart) climateRainChart.destroy();

        const common = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: "rgba(255,255,255,.65)" }, grid: { display: false } }, y: { ticks: { color: "rgba(255,255,255,.65)" }, grid: { color: "rgba(255,255,255,.07)" } } }
        };
        climateTemperatureChart = new Chart(document.getElementById("climateTemperatureChart"), {
            type: "line",
            data: { labels, datasets: [{ label: t("average_temperature"), data: tempValues, tension: .35, borderWidth: 2, pointRadius: 3, spanGaps: true }] },
            options: common
        });
        climateRainChart = new Chart(document.getElementById("climateRainChart"), {
            type: "bar",
            data: { labels, datasets: [{ label: t("annual_precipitation"), data: rainValues, borderRadius: 5 }] },
            options: common
        });

        const source = document.getElementById("climateHistorySource");
        if (source) source.textContent = `Historical data source: ${data.source || "Open-Meteo Historical Archive"}.`;
    } catch (error) {
        console.error("Climate history error:", error);
        if (status) status.textContent = error.message || "Unable to load historical climate data.";
    }
}

// Nwp / Gfs Model

async function loadNwpGfs() {
    const status = document.getElementById("nwpGfsStatus");
    if (!currentLocation) {
        if (status) status.textContent = "Choose a location first to load GFS model data.";
        return;
    }

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    if (status) status.textContent = "Loading NOAA GFS model data...";

    try {
        const params = new URLSearchParams({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            forecast_days: 7
        });
        const response = await fetch(`/api/nwp/gfs?${params.toString()}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "GFS model data unavailable.");

        const data = result.data || {};
        const current = data.current || {};
        const hourly = data.hourly || {};
        const times = Array.isArray(hourly.time) ? hourly.time : [];
        const temps = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : [];

        setText("nwpGfsTemp", Number.isFinite(Number(current.temperature_2m)) ? `${Math.round(current.temperature_2m)} °C` : "--");
        setText("nwpGfsHumidity", Number.isFinite(Number(current.relative_humidity_2m)) ? `${Math.round(current.relative_humidity_2m)}%` : "--");
        setText("nwpGfsPrecip", Number.isFinite(Number(current.precipitation)) ? `${current.precipitation} mm` : "--");
        setText("nwpGfsWind", Number.isFinite(Number(current.wind_speed_10m)) ? `${Math.round(current.wind_speed_10m)} km/h` : "--");

        if (typeof Chart !== "undefined") {
            const labels = times.slice(0, 24).map(t => {
                const d = new Date(t);
                return Number.isNaN(d.getTime()) ? t : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            });
            const values = temps.slice(0, 24);
            const canvas = document.getElementById("nwpGfsChart");
            if (canvas && labels.length && values.length) {
                if (nwpGfsChart) nwpGfsChart.destroy();
                nwpGfsChart = new Chart(canvas, {
                    type: "line",
                    data: {
                        labels,
                        datasets: [{
                            label: t("gfs_temperature"),
                            data: values,
                            tension: 0.35,
                            borderWidth: 2,
                            pointRadius: 2,
                            spanGaps: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: "rgba(255,255,255,.65)" }, grid: { display: false } },
                            y: { ticks: { color: "rgba(255,255,255,.65)" }, grid: { color: "rgba(255,255,255,.07)" } }
                        }
                    }
                });
            }
        }

        if (status) {
            status.textContent = `NOAA GFS data loaded for ${currentWeatherLocation || currentLocationName || "selected location"}.`;
        }
    } catch (error) {
        console.error("NWP/GFS error:", error);
        if (status) status.textContent = error.message || "Unable to load GFS model data.";
    }
}

// Settings & Preferences

function convertTemperature(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return temperatureUnit === "fahrenheit" ? (n * 9 / 5) + 32 : n;
}

function formatTemperatureValue(value) {
    const converted = convertTemperature(value);
    return Number.isFinite(Number(converted)) ? Math.round(converted) : "--";
}

function toggleInsightGroup(toggleButton) {
    const group = toggleButton.closest('.insight-group');
    if (!group) return;
    const items = group.querySelector('.insight-group-items');
    const chevron = toggleButton.querySelector('.insight-chevron');
    const expanded = toggleButton.getAttribute('aria-expanded') === 'true';
    toggleButton.setAttribute('aria-expanded', String(!expanded));
    if (items) items.hidden = expanded;
    if (chevron) {
        chevron.classList.toggle('bi-chevron-down', expanded);
        chevron.classList.toggle('bi-chevron-up', !expanded);
    }
}

function openWeatherTool(sectionId) {
    if (sectionId === "climateHistorySection") initClimateYearSelectors();
    if (sectionId === "marineAdvisorySection") loadMarineAdvisory();
    if (sectionId === "aviationAdvisorySection") {
        window.setTimeout(() => loadAviationAdvisory(), 120);
    }
    const section = document.getElementById(sectionId);
    const welcome = document.getElementById('welcomeScreen');
    if (!section || !welcome) return;

    // Quick Access/sendMessage can hide welcomeScreen with an inline style.
    // Clear that state before opening a Weather Insights panel.
    welcome.style.display = "block";

    // Switch from the chat dashboard to one focused feature view.
    document.body.classList.add('feature-view');
    welcome.classList.add('feature-mode');

    // Hide every feature panel and show only the one selected from the sidebar.
    welcome.querySelectorAll('.feature-panel').forEach(panel => {
        panel.classList.remove('feature-active');
    });
    section.classList.add('feature-active');

    // Close the mobile sidebar after choosing a tool.
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 900 && sidebar) {
        sidebar.classList.remove('open');
    }

    // Keep the selected panel visible and move it into view.
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.classList.add('feature-focus');
    window.setTimeout(() => section.classList.remove('feature-focus'), 1400);

    // Weather maps need a little time to calculate their container size.
    if (sectionId === 'weatherMapSection' && typeof weatherMap !== 'undefined' && weatherMap) {
        window.setTimeout(() => weatherMap.invalidateSize(), 250);
    }
    if (sectionId === 'climateHistorySection' && currentLocation) {
        window.setTimeout(() => loadClimateHistory(), 120);
    }
    if (sectionId === 'nwpGfsSection' && currentLocation) {
        window.setTimeout(() => loadNwpGfs(), 120);
    }
    if (sectionId === 'intelligenceSection' && currentLocation) {
        window.setTimeout(() => loadWeatherIntelligence(), 120);
    }
    if (sectionId === 'smartAlertsSection' && currentLocation) {
        window.setTimeout(() => loadSmartAlerts(), 120);
    }
    if (sectionId === 'hazardWarningsSection' && currentLocation && !window.lastHazardWarnings) {
        window.setTimeout(() => loadHazardWarnings(), 120);
    }
    if (sectionId === 'performanceDashboardSection') {
        window.setTimeout(() => loadPerformanceDashboard(), 80);
    }
}

function showChatHome() {
    const welcome = document.getElementById('welcomeScreen');
    document.body.classList.remove('feature-view');
    if (welcome) {
        welcome.style.display = "block";
        welcome.classList.remove('feature-mode');
        welcome.querySelectorAll('.feature-panel').forEach(panel => {
            panel.classList.remove('feature-active');
        });
    }

    const chatArea = document.getElementById('chatArea');
    if (chatArea) chatArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openAboutWeather() {
    const modal = document.getElementById("aboutWeatherModal");
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("settings-open");
}

function closeAboutWeather() {
    const modal = document.getElementById("aboutWeatherModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("settings-open");
}

function openSettings() {
    const modal = document.getElementById("settingsModal");
    if (!modal) return;
    syncSettingsForm();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("settings-open");
}

function closeSettings() {
    const modal = document.getElementById("settingsModal");
    if (!modal) return;

    // Modal hide hone se pehle focus hatao
    if (modal.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
}

function syncSettingsForm() {
    document.querySelectorAll('input[name="temperatureUnit"]').forEach(input => {
        input.checked = input.value === temperatureUnit;
    });
    const lang = document.getElementById("settingsLanguage");
    if (lang) lang.value = currentLanguage;
    const notifications = document.getElementById("settingsNotifications");
    if (notifications) notifications.checked = weatherNotificationsEnabled;
    ["Rain", "Extreme", "Wind"].forEach(type => {
        const source = document.getElementById("notify" + type);
        const target = document.getElementById("settingsNotify" + type);
        if (source && target) target.checked = source.checked;
    });
    const count = document.getElementById("settingsSavedCount");
    if (count) count.textContent = `${savedLocations.length} / 8`;
}

function applySavedSettings() {
    setLanguage(currentLanguage);
}

function saveSettings() {
    const unit = document.querySelector('input[name="temperatureUnit"]:checked');
    const lang = document.getElementById("settingsLanguage");
    temperatureUnit = unit ? unit.value : "celsius";
    currentLanguage = lang ? lang.value : "en";
    localStorage.setItem("weatherGPTTemperatureUnit", temperatureUnit);
    localStorage.setItem("weatherGPTLanguage", currentLanguage);

    ["Rain", "Extreme", "Wind"].forEach(type => {
        const source = document.getElementById("notify" + type);
        const target = document.getElementById("settingsNotify" + type);
        if (source && target) {
            source.checked = target.checked;
            localStorage.setItem("weatherNotify" + type, target.checked ? "true" : "false");
        }
    });
    setLanguage(currentLanguage);
    if (typeof currentWeatherData !== "undefined" && currentWeatherData) {
        // Refresh visible weather cards/charts using the new unit.
        const t = document.getElementById("temperature");
        if (t && currentWeatherData.temperature !== undefined) {
            t.textContent = formatTemperatureValue(currentWeatherData.temperature);
            const u = t.parentElement?.querySelector("sup");
            if (u) u.textContent = temperatureUnit === "fahrenheit" ? "°F" : "°C";
        }
        displayForecast(currentWeatherData.forecast || []);
        displayWeatherCharts(currentWeatherData.hourly_forecast || [], currentWeatherData.forecast || [], currentWeatherData.updated_at);
    }
    updateSaveLocationButton();
    setupNotificationPreferences();
    closeSettings();
}

function resetSettings() {
    temperatureUnit = "celsius";
    currentLanguage = "en";
    localStorage.setItem("weatherGPTTemperatureUnit", "celsius");
    localStorage.setItem("weatherGPTLanguage", "en");
    document.querySelectorAll('input[name="temperatureUnit"]').forEach(input => input.checked = input.value === "celsius");
    const lang = document.getElementById("settingsLanguage");
    if (lang) lang.value = "en";
    const notifications = document.getElementById("settingsNotifications");
    if (notifications) notifications.checked = false;
    weatherNotificationsEnabled = false;
    localStorage.setItem("weatherNotificationsEnabled", "false");
    ["Rain", "Extreme", "Wind"].forEach(type => {
        const el = document.getElementById("settingsNotify" + type);
        if (el) el.checked = true;
    });
}

function clearSavedLocations() {
    if (!savedLocations.length) return;
    if (!window.confirm("Clear all saved locations?")) return;
    savedLocations = [];
    if (currentUser) {
        fetch("/api/saved-locations", { method: "DELETE" }).catch(error => console.warn("Could not clear account locations:", error));
    } else {
        persistSavedLocations();
    }
    renderSavedLocations();
    updateSaveLocationButton();
    syncSettingsForm();
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSettings();
});

// Escape Html

function escapeHTML(
    text
) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

// Live updated time

function updateWeatherUpdatedTime() {

    const element = document.getElementById("weatherUpdated");

    if (!element) {
        return;
    }

    const now = new Date();

    const formattedTime = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    element.textContent = t("updated") + ": " + formattedTime;
}

// Run immediately
updateWeatherUpdatedTime();

// Update every 1 minute
setInterval(updateWeatherUpdatedTime, 60000);

function reportEscape(value) {
    return String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
}

function reportTemp(value) {
    const n = Number(value);
    return Number.isFinite(n) ? formatTemperatureValue(n) : "--";
}

function getReportRows() {
    const weather = currentWeatherData;

    if (!weather) return [];

    const forecast = Array.isArray(weather.forecast)
        ? weather.forecast
        : [];

    return forecast.map(day => ({
        date: day.date || day.day || "",

        // 7-Day Forecast temperature
        max:
            day.max_temp ??
            day.temperature_max ??
            day.max_temperature ??
            day.temp_max,

        min:
            day.min_temp ??
            day.temperature_min ??
            day.min_temperature ??
            day.temp_min,

        // Rain probability
        rain:
            day.rain_probability ??
            day.precipitation_probability ??
            day.rain,

        // Precipitation amount
        precipitation:
            day.precipitation_sum ??
            day.precipitation ??
            day.rain_amount
    }));
}
function openWeatherReport() {
    const modal = document.getElementById("weatherReportModal");
    const content = document.getElementById("weatherReportContent");
    const meta = document.getElementById("reportMeta");
    if (!modal || !content) return;

    if (!currentWeatherData) {
        content.innerHTML = '<div class="report-empty">Please load a city or detect your location first.</div>';
    } else {
        const w = currentWeatherData;
        const aq = w.air_quality || {};
        const uv = Number(w.uv_index);
        const alerts = Array.isArray(window.lastWeatherAlerts) ? window.lastWeatherAlerts : [];
        const rows = getReportRows();
        const location = window.currentWeatherLocation || currentLocationName || "Current location";
        if (meta) meta.textContent = `${location} • Generated ${new Date().toLocaleString()}`;
        content.innerHTML = `
            <div class="report-summary-grid">
                <div><small>${t("temperature")}</small><strong>${reportEscape(reportTemp(w.temperature))}</strong></div>
                <div><small>${t("humidity_label")}</small><strong>${reportEscape(w.humidity)}%</strong></div>
                <div><small>${t("wind_label")}</small><strong>${reportEscape(w.wind_speed)} km/h</strong></div>
                <div><small>Rain chance</small><strong>${reportEscape(w.rain_probability ?? w.rain)}%</strong></div>
                <div><small>US AQI</small><strong>${Number.isFinite(Number(aq.us_aqi)) ? Math.round(Number(aq.us_aqi)) : "--"}</strong></div>
                <div><small>UV Index</small><strong>${Number.isFinite(uv) ? uv.toFixed(1) : "--"}</strong></div>
            </div>
            <div class="report-block">
                <h4><i class="bi bi-calendar3"></i> 7-Day Forecast</h4>
                <div class="report-table-wrap"><table class="report-table"><thead><tr><th>Date</th><th>Max</th><th>Min</th><th>Rain</th><th>Precip.</th></tr></thead><tbody>
                    ${rows.length ? rows.map(r => `<tr><td>${reportEscape(r.date)}</td><td>${reportEscape(reportTemp(r.max))}</td><td>${reportEscape(reportTemp(r.min))}</td><td>${reportEscape(r.rain ?? "--")}${r.rain != null ? "%" : ""}</td><td>${reportEscape(r.precipitation ?? "--")}</td></tr>`).join("") : '<tr><td colspan="5">Forecast details unavailable.</td></tr>'}
                </tbody></table></div>
            </div>
            <div class="report-block">
                <h4><i class="bi bi-exclamation-triangle"></i> Weather Alerts</h4>
                <p>${alerts.length ? alerts.map(a => reportEscape(a.message || a.title || a.description || a)).join(" • ") : "No active weather alerts reported."}</p>
            </div>`;
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeWeatherReport() {
    const modal = document.getElementById("weatherReportModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadWeatherJSON() {
    if (!currentWeatherData) { openWeatherReport(); return; }
    const payload = {
        app: "WeatherGPT",
        location: window.currentWeatherLocation || currentLocationName || "Current location",
        generated_at: new Date().toISOString(),
        weather: currentWeatherData,
        alerts: window.lastWeatherAlerts || []
    };
    downloadFile("weather-report.json", JSON.stringify(payload, null, 2), "application/json");
}

function downloadWeatherCSV() {
    if (!currentWeatherData) { openWeatherReport(); return; }
    const rows = getReportRows();
    const lines = [["Date","Max Temperature","Min Temperature","Rain Probability","Precipitation"], ...rows.map(r => [r.date, reportTemp(r.max), reportTemp(r.min), r.rain ?? "", r.precipitation ?? ""])];
    const csv = lines.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("weather-forecast.csv", csv, "text/csv;charset=utf-8");
}

function printWeatherReport() {
    if (!currentWeatherData) {
        openWeatherReport();
        return;
    }

    const reportContent = document.getElementById("weatherReportContent");
    const meta = document.getElementById("reportMeta")?.textContent || "Live weather summary";
    if (!reportContent) return;

    // Use a dedicated print window and copy only the report content.
    // This avoids depending on the app's theme CSS and prevents malformed HTML.
    const title = `WeatherGPT Report - ${window.currentWeatherLocation || currentLocationName || "Weather"}`;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) {
        if (typeof showWeatherToast === "function") {
            showWeatherToast("Please allow pop-ups to print the report.");
        } else {
            alert("Please allow pop-ups to print the report.");
        }
        return;
    }

    const safeTitle = reportEscape(title);
    const safeMeta = reportEscape(meta);
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,sans-serif;margin:32px;color:#222;background:#fff}
h1{margin:0 0 5px;font-size:26px}
.meta{margin:0 0 24px;color:#666;font-size:13px}
.report-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.report-summary-grid>div{border:1px solid #ddd;border-radius:10px;padding:14px}
.report-summary-grid small{display:block;color:#666;font-size:11px}
.report-summary-grid strong{display:block;font-size:20px;margin-top:4px}
.report-block{margin-top:22px;page-break-inside:avoid}
.report-block h4{font-size:15px;margin:0 0 10px}
.report-block p{font-size:12px;line-height:1.6;color:#444}
.report-table{width:100%;border-collapse:collapse;font-size:11px}
.report-table th,.report-table td{border:1px solid #ddd;padding:8px;text-align:left}
.report-table th{background:#f3f3f3}
@media(max-width:650px){.report-summary-grid{grid-template-columns:repeat(2,1fr)}body{margin:18px}}
@media print{body{margin:12mm}.report-block{break-inside:avoid}}
</style>
</head>
<body>
<h1>WeatherGPT Weather Report</h1>
<p class="meta">${safeMeta}</p>
${reportContent.innerHTML}
<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250)};<\/script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
}

// Background Push Service Worker Bootstrap
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/static/service-worker.js")
            .then(registration => registration.pushManager.getSubscription())
            .then(subscription => {
                if (subscription) pushSubscription = subscription;
            })
            .catch(error => console.warn("Service worker unavailable:", error));
    });
}

// Phase 6 - Weather Intelligence + Smart Alert UI
function intelligenceLocationReady() {
    return currentLocation && Number.isFinite(Number(currentLocation.latitude)) && Number.isFinite(Number(currentLocation.longitude));
}

function intelligenceEscape(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

function findComparison(summary, parameter) {
    return (summary?.comparisons || []).find(item => String(item.parameter || "").toLowerCase() === parameter.toLowerCase());
}

async function loadWeatherIntelligence() {
    const status = document.getElementById("intelligenceStatus");
    const models = document.getElementById("intelligenceModels");
    if (!status || !models) return;
    if (!intelligenceLocationReady()) {
        status.textContent = t("location_not_available_load_weather");
        return;
    }
    status.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Comparing GFS, ECMWF and ICON forecasts...';
    try {
        const params = new URLSearchParams({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            forecast_days: 3,
            models: "gfs_seamless,ecmwf_ifs04,icon_seamless"
        });
        const response = await fetch(`/api/forecast-confidence?${params.toString()}`, {cache:"no-store"});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Forecast confidence unavailable");
        const analysis = data.analysis || {};
        const confidenceEl = document.getElementById("intelligenceConfidence");
        const modelCountEl = document.getElementById("intelligenceModelCount");
        const tempEl = document.getElementById("intelligenceTempSpread");
        const rainEl = document.getElementById("intelligenceRainSpread");
        if (confidenceEl) confidenceEl.textContent = `${String(analysis.confidence || "--").replace(/^./, c => c.toUpperCase())} ${analysis.confidence_score != null ? `(${analysis.confidence_score}%)` : ""}`;
        if (modelCountEl) modelCountEl.textContent = analysis.model_count ?? "--";
        if (tempEl) tempEl.textContent = analysis.temperature_spread != null ? `${analysis.temperature_spread} °C` : "--";
        if (rainEl) rainEl.textContent = analysis.rain_probability_spread != null ? `${analysis.rain_probability_spread} pp` : "--";

        const badge = document.getElementById("intelligenceConfidenceBadge");
        if (badge) {
            badge.className = `confidence-indicator ${confidenceBadgeClass(analysis)}`;
            badge.innerHTML = `<i class="bi ${confidenceBadgeIcon(analysis)}"></i><span>${escapeHtmlConfidence(String(analysis.confidence || "Unknown"))} confidence${analysis.confidence_score != null ? ` · ${Number(analysis.confidence_score)}%` : ""}</span>`;
        }
        const flags = (analysis.flags || []).map(flag => flag.replace(/_/g, " ")).join(" · ");
        const flagEl = document.getElementById("intelligenceDisagreement");
        if (flagEl) flagEl.textContent = flags ? `Disagreement flags: ${flags}` : "No high-disagreement flags detected.";

        console.log("FORECAST CONFIDENCE MODELS:", analysis.models);
        models.innerHTML = (analysis.models || []).map(model => `
            <div class="intelligence-model-card">
                <div class="intelligence-model-head"><strong>${intelligenceEscape(model.model || "Model")}</strong><span>Open-Meteo</span></div>
                <div class="intelligence-model-values">
                    <div><small>${t("temperature")}</small><strong>${model.days?.[0]?.temperature_c ?? "--"} °C</strong></div>
                    <div><small>${t("rain_probability")}</small><strong>${model.days?.[0]?.rain_probability ?? "--"}%</strong></div>
                    <div><small>${t("wind_label")}</small><strong>${model.days?.[0]?.wind_kmh ?? "--"} km/h</strong></div>
                </div>
            </div>`).join("") || '<div class="intelligence-empty">No multi-model data available.</div>';
        status.textContent = analysis.high_disagreement
            ? "Models disagree on one or more important forecast parameters. The AI will communicate the uncertainty instead of presenting false precision."
            : "Forecast models are relatively consistent for this location. Confidence is based on model agreement.";
    } catch (error) {
        console.error("Forecast confidence error:", error);
        status.textContent = error.message || "Unable to load forecast confidence.";
        models.innerHTML = '<div class="intelligence-empty">Forecast confidence could not be loaded.</div>';
    }
}

async function loadSmartAlerts() {
    const status = document.getElementById("smartAlertsStatus");
    const list = document.getElementById("smartAlertsList");
    if (!status || !list) return;
    if (!intelligenceLocationReady()) {
        status.textContent =t("location_not_available_load_weather");
        return;
    }
    status.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> ${t("building_unified_early_warnings")}`;
    try {
        const response = await fetch("/api/alerts/smart", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({latitude: currentLocation.latitude, longitude: currentLocation.longitude, include_model_intelligence: true, language: currentLanguage})
        });
        let data = await response.json();
        if (currentLanguage !== "en") {
            data = await localizeObjectDeep(data, currentLanguage);
        }
        if (!response.ok) throw new Error(data.error || t("smart_alerts_unavailable"));
        document.getElementById("smartAlertHighest").textContent = String(data.highest_level || "green").toUpperCase();
        document.getElementById("smartAlertCount").textContent = data.count ?? 0;
        const alerts = Array.isArray(data.alerts) ? data.alerts : [];
        list.innerHTML = alerts.length ? alerts.map(alert => `
            <div class="smart-alert-item ${intelligenceEscape(String(alert.level || "green").toLowerCase())}">
                <div class="smart-alert-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
                <div><strong>${intelligenceEscape(alert.title || "Weather Alert")}</strong><p>${intelligenceEscape(alert.message || "")}</p><small>${intelligenceEscape(alert.location || currentLocationName || "Selected location")}</small></div>
            </div>`).join("") : `<div class="intelligence-empty"><i class="bi bi-check-circle"></i> ${t("no_active_smart_alerts")}</div>`;
        status.textContent = data.has_high_priority ? t("high_priority_conditions") : t("alert_assessment_complete");
    } catch (error) {
        console.error("Smart alert error:", error);
        status.textContent = error.message || t("unable_load_smart_alerts");
        list.innerHTML = `<div class="intelligence-empty">${t("smart_alerts_load_failed")}</div>`;
    }
}

// Marine Advisory
function displayMarineAdvisory(result) {
    const container = document.getElementById("marineAdvisoryContent");
    if (!container) return;

    if (!result) {
        container.innerHTML = `
            <div class="recommendation-loading">
                ${t("marine_advisory_unavailable")}
            </div>
        `;
        return;
    }

    // -------------------------------------------------
    // NON-MARINE LOCATION
    // -------------------------------------------------
    if (result.is_marine === false) {
        container.innerHTML = `
            <div class="marine-location-unavailable">
                <div class="marine-unavailable-icon">
                    <i class="bi bi-water"></i>
                </div>

                <h3>This location is not a marine location</h3>

                <p>
                    Marine weather information is only available
                    for coastal and sea areas.
                </p>
            </div>
        `;
        return;
    }

    // -------------------------------------------------
    // MARINE LOCATION
    // -------------------------------------------------
    const c = result.current || {};
    const f = result.forecast || {};

    const score = Number(result.risk_score || 0);
    const level = String(result.risk_level || "Low").toLowerCase();

    const reasons = result.reasons || [];
    const recs = result.recommendations || [];

    container.innerHTML = `
        <div class="marine-overview-card">
            <div>
                <small>${t("marine_weather_risk")}</small>

                <strong>${score}/100</strong>

                <span class="marine-risk-badge ${level}">
                    ${translateRiskLevel(result.risk_level || "Low")}
                </span>

                <p>
                    ${result.summary || "Marine weather assessment."}
                </p>
            </div>

            <div class="marine-location">
                <i class="bi bi-geo-alt-fill"></i>
                ${result.location || currentWeatherLocation || "Selected Location"}
            </div>
        </div>

        <div class="marine-snapshot-grid">

            <div>
                <small>${t("wave_height")}</small>
                <strong>${c.wave_height_m ?? "--"} m</strong>
            </div>

            <div>
                <small>${t("wave_period")}</small>
                <strong>${c.wave_period_s ?? "--"} s</strong>
            </div>

            <div>
                <small>${t("wind_wave")}</small>
                <strong>${c.wind_wave_height_m ?? "--"} m</strong>
            </div>

            <div>
                <small>${t("swell")}</small>
                <strong>${c.swell_height_m ?? "--"} m</strong>
            </div>

            <div>
                <small>${t("max_wave")}</small>
                <strong>${f.max_wave_height_m ?? "--"} m</strong>
            </div>

            <div>
                <small>${t("max_swell")}</small>
                <strong>${f.max_swell_height_m ?? "--"} m</strong>
            </div>

        </div>

        <div class="marine-columns">

            <div class="marine-info-card">
                <h4>
                    <i class="bi bi-exclamation-triangle"></i>
                    ${t("marine_risks")}
                </h4>

                <ul>
                    ${reasons.map(x => `<li>${x}</li>`).join("")}
                </ul>
            </div>

            <div class="marine-info-card">
                <h4>
                    <i class="bi bi-check2-circle"></i>
                    ${t("recommendations")}
                </h4>

                <ul>
                    ${recs.map(x => `<li>${x}</li>`).join("")}
                </ul>
            </div>

        </div>

        <div class="marine-source">
            <i class="bi bi-database"></i>
            ${result.source || "Marine forecast data"}
        </div>

        <div class="marine-disclaimer">
            <i class="bi bi-info-circle"></i>
            ${result.disclaimer || t("decision_support_only_marine")}
        </div>
    `;
}
async function loadMarineAdvisory() {
    const container = document.getElementById("marineAdvisoryContent");
    if (!container) return;
    if (!currentLocation || currentLocation.latitude == null || currentLocation.longitude == null) { 
        container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-geo-alt"></i> ${t("location_not_available_load_weather")}</div>`;        return;
    }
    container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-arrow-repeat spin"></i> ${t("analyzing_marine_conditions")}</div>`;
    try {
        const response = await fetch("/api/marine-advisory", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({latitude:currentLocation.latitude, longitude:currentLocation.longitude, language:currentLanguage})});
        let data = await response.json();
        if (currentLanguage !== "en") {
            data = await localizeObjectDeep(data, currentLanguage);
        }
    if (!response.ok) throw new Error(data.error || t("marine_advisory_unavailable"));
        window.lastMarineAdvisory = data.marine_advisory || null;
        displayMarineAdvisory(data.marine_advisory || null);
    } catch (error) {
        console.error("Marine advisory error:", error);
        container.innerHTML = `<div class="recommendation-loading"><i class="bi bi-exclamation-circle"></i> ${error.message || t("unable_generate_marine_advisory")}</div>`;    }
}

/* ---------------------------------------------------------
   UPDATE LANGUAGE BUTTON
--------------------------------------------------------- */


async function setLanguage(language) {
    return changeAppLanguage(language);
}

function updateLanguageSelector(language) {

    const label =
        document.getElementById(
            "selectedLanguageLabel"
        );

    if (label) {
        label.textContent =
            APP_LANGUAGES[language] ||
            APP_LANGUAGES.en;
    }
}


/* ---------------------------------------------------------
   AI LANGUAGE
--------------------------------------------------------- */

function updateAILanguage(language) {

    window.weatherGPTLanguage =
        language;

    window.weatherGPTLanguageName =
        APP_LANGUAGES[language] ||
        "English";
}


/* ---------------------------------------------------------
   PAGE LOAD
--------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedLanguage =
            localStorage.getItem(
                "weatherGPTLanguage"
            ) || "en";

        currentLanguage =
            APP_LANGUAGES[savedLanguage]
                ? savedLanguage
                : "en";

        restoreCachedLanguagePack(currentLanguage);
        translateApp(currentLanguage);

        ensureLanguagePack(currentLanguage).finally(async () => {
            translateApp(currentLanguage);
            await translateVisibleTextNodes(currentLanguage);
        });

        updateLanguageSelector(
            currentLanguage
        );

        updateAILanguage(
            currentLanguage
        );
    }
);

/* =========================================================
   MULTILINGUAL APP CONTROL
========================================================= */

window.currentLanguage =
    localStorage.getItem(
        "weatherGPTLanguage"
    ) || "en";


async function changeAppLanguage(language) {
    if (
        typeof APP_LANGUAGES === "undefined" ||
        !APP_LANGUAGES[language]
    ) {
        language = "en";
    }

    const previousLanguage = window.currentLanguage || currentLanguage || "en";
    restoreCachedLanguagePack(language);

    currentLanguage = language;
    window.currentLanguage = language;

    localStorage.setItem(
        "weatherGPTLanguage",
        language
    );

    if (previousLanguage !== language) {
        window.location.reload();
        return;
    }

    await ensureLanguagePack(language);

    translateApp(language);
    // Translate content that was already rendered, including chat history,
    // from the language it was actually written in to the newly selected one.
    if (previousLanguage !== language) {
        await translateVisibleTextNodes(language, previousLanguage);
    }
    await translateVisibleTextNodes(language, "en");
    updateLanguageSelector(language);
    updateAILanguage(language);

    // Refresh dynamic backend content so advisories, alerts and hazard
    // explanations are regenerated/localized in the newly selected language.
    if (currentLocation && currentLocation.latitude != null && currentLocation.longitude != null) {
        try {
            await loadWeather(currentLocation.latitude, currentLocation.longitude);
            if (typeof loadAgricultureAdvisory === "function") await loadAgricultureAdvisory();
            if (typeof loadUrbanAdvisory === "function") await loadUrbanAdvisory();
            if (typeof loadAviationAdvisory === "function") await loadAviationAdvisory();
            if (typeof loadMarineAdvisory === "function") await loadMarineAdvisory();
            if (typeof loadSmartAlerts === "function") await loadSmartAlerts();
            // These sections live on tabs that may not be the one currently
            // open, but they keep their own fetched data cached in the DOM,
            // so if the user has visited them this session (or switches to
            // them right after changing language) they must already be in
            // the new language rather than showing stale English/old-language
            // text until manually reloaded.
            if (typeof loadWeatherIntelligence === "function") await loadWeatherIntelligence();
            if (typeof loadNwpGfs === "function") await loadNwpGfs();
            if (typeof loadClimateHistory === "function") await loadClimateHistory();
            if (typeof loadPerformanceDashboard === "function") await loadPerformanceDashboard();

            // Dynamic advisory/alert DOM is rendered after the initial language
            // pass, so run the visible-text translator once more over the newly
            // inserted content.
            await translateVisibleTextNodes(currentLanguage);
        } catch (error) {
            console.warn("Could not refresh localized dynamic content:", error);
        }
    }

    closeLanguageMenu();
     closeLanguageMenu();

    // Reload complete page after language change
    if (previousLanguage !== language) {
        window.location.reload();
    }
}

function updateLanguageSelector(language) {

    const label =
        document.getElementById(
            "selectedLanguageLabel"
        );

    if (label) {
        label.textContent =
            APP_LANGUAGES[language] ||
            APP_LANGUAGES.en;
    }
}


function updateAILanguage(language) {

    window.weatherGPTLanguage =
        language;

    window.weatherGPTLanguageName =
        APP_LANGUAGES[language] ||
        "English";
}


function toggleLanguageMenu() {

    const menu =
        document.getElementById(
            "languageMenu"
        );

    if (!menu) return;

    menu.classList.toggle("open");
}


function closeLanguageMenu() {

    const menu =
        document.getElementById(
            "languageMenu"
        );

    if (!menu) return;

    menu.classList.remove("open");
}


document.addEventListener("click", function (event) {
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.querySelector(".menu-btn");

    if (!sidebar || !sidebar.classList.contains("open")) return;

    // Sidebar ya menu button ke andar click hua to close mat karo
    if (sidebar.contains(event.target) || menuBtn?.contains(event.target)) {
        return;
    }

    // Bahar click → sidebar close
    sidebar.classList.remove("open");
});

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const savedLanguage =
            localStorage.getItem(
                "weatherGPTLanguage"
            ) || "en";

        window.currentLanguage =
            APP_LANGUAGES[savedLanguage]
                ? savedLanguage
                : "en";

        translateApp(
            window.currentLanguage
        );

        updateLanguageSelector(
            window.currentLanguage
        );

        updateAILanguage(
            window.currentLanguage
        );
    }
);

/* =================================================
   FULL SEARCH SECTION
   ================================================= */

function openSearchSection() {

    const section =
        document.getElementById("searchSection");

    if (!section) return;

    section.classList.add("active");

    document.body.style.overflow = "hidden";

    setTimeout(() => {

        document
            .getElementById("fullSearchInput")
            ?.focus();

    }, 100);
}


function closeSearchSection() {

    const section =
        document.getElementById("searchSection");

    if (!section) return;

    section.classList.remove("active");

    document.body.style.overflow = "";

    const input =
        document.getElementById("fullSearchInput");

    const results =
        document.getElementById("fullSearchResults");

    if (input) input.value = "";

    if (results) results.innerHTML = "";
}

if (navigator.permissions) {
    navigator.permissions.query({ name: "geolocation" }).then((permission) => {
        if (permission.state === "prompt" || permission.state === "denied") {
            alert(
                "Please allow your location to use WeatherGPT.\n\n" +
                "Please click the GPS button to detect your current location."
            );
        }
    });
}