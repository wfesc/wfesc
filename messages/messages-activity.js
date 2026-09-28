/* =========================================================
   WFESC MESSAGES — ACTIVITY
   File: messages-activity.js
   Version: 1.0
   ========================================================= */

(function () {
    "use strict";

    /* =========================================================
       CONFIG
       ========================================================= */

    const ACTIVITY_CHANNEL_NAME = "wfesc-activity";

    const ONLINE_TIMEOUT = 30000;

    const HEARTBEAT_INTERVAL = 10000;

    const ACTIVITY_EVENT = "wfesc:activity:update";

    /* =========================================================
       STATE
       ========================================================= */

    let client = null;

    let currentUser = null;

    let activityChannel = null;

    let initialized = false;

    let realtimeStarted = false;

    let heartbeatTimer = null;

    let onlineUsers = new Map();

    let lastSeenUsers = new Map();

    let currentPresenceState = {};

    /* =========================================================
       HELPERS
       ========================================================= */

    function log(...args) {
        console.log("[WFESC Activity]", ...args);
    }

    function warn(...args) {
        console.warn("[WFESC Activity]", ...args);
    }

    function error(...args) {
        console.error("[WFESC Activity]", ...args);
    }

    function now() {
        return Date.now();
    }

    function normalizeUserId(value) {
        if (!value) return null;

        return String(value);
    }

    function getCore() {
        return window.WFESC_MESSAGES_CORE || null;
    }

    function getClient() {
        if (client) {
            return client;
        }

        const core = getCore();

        if (core && core.client) {
            client = core.client;
        }

        return client;
    }

    function getCurrentUser() {
        const core = getCore();

        if (core && typeof core.getCurrentUser === "function") {
            return core.getCurrentUser();
        }

        return currentUser;
    }

    /* =========================================================
       EVENT SYSTEM
       ========================================================= */

    function dispatchActivityEvent(detail) {
        try {
            window.dispatchEvent(
                new CustomEvent(ACTIVITY_EVENT, {
                    detail: detail || {}
                })
            );
        } catch (err) {
            warn("Could not dispatch activity event:", err);
        }
    }

    /* =========================================================
       FORMAT LAST SEEN
       ========================================================= */

    function formatLastSeen(timestamp) {
        if (!timestamp) {
            return "غير معروف";
        }

        const time =
            timestamp instanceof Date
                ? timestamp.getTime()
                : new Date(timestamp).getTime();

        if (!Number.isFinite(time)) {
            return "غير معروف";
        }

        const difference = Math.max(0, now() - time);

        const seconds = Math.floor(difference / 1000);

        if (seconds < 10) {
            return "الآن";
        }

        if (seconds < 60) {
            return `منذ ${seconds} ثانية`;
        }

        const minutes = Math.floor(seconds / 60);

        if (minutes === 1) {
            return "منذ دقيقة";
        }

        if (minutes < 60) {
            return `منذ ${minutes} دقيقة`;
        }

        const hours = Math.floor(minutes / 60);

        if (hours === 1) {
            return "منذ ساعة";
        }

        if (hours < 24) {
            return `منذ ${hours} ساعة`;
        }

        const days = Math.floor(hours / 24);

        if (days === 1) {
            return "منذ يوم";
        }

        if (days < 7) {
            return `منذ ${days} أيام`;
        }

        return new Date(time).toLocaleDateString("ar-IQ");
    }

    /* =========================================================
       ONLINE STATUS
       ========================================================= */

    function isUserOnline(userId) {
        userId = normalizeUserId(userId);

        if (!userId) {
            return false;
        }

        const data = onlineUsers.get(userId);

        if (!data) {
            return false;
        }

        if (!data.lastHeartbeat) {
            return true;
        }

        return now() - data.lastHeartbeat <= ONLINE_TIMEOUT;
    }

    function getUserActivity(userId) {
        userId = normalizeUserId(userId);

        if (!userId) {
            return {
                userId: null,
                online: false,
                lastSeen: null,
                lastSeenText: "غير معروف"
            };
        }

        const online = isUserOnline(userId);

        const onlineData = onlineUsers.get(userId);

        const lastSeen =
            onlineData?.lastSeen ||
            lastSeenUsers.get(userId) ||
            null;

        return {
            userId,
            online,
            lastSeen,
            lastSeenText: online
                ? "متصل الآن"
                : formatLastSeen(lastSeen)
        };
    }

    /* =========================================================
       PRESENCE STATE
       ========================================================= */

    function extractPresenceUsers(state) {
        const result = new Map();

        if (!state || typeof state !== "object") {
            return result;
        }

        Object.keys(state).forEach((presenceKey) => {
            const entries = Array.isArray(state[presenceKey])
                ? state[presenceKey]
                : [];

            entries.forEach((entry) => {
                if (!entry) {
                    return;
                }

                const userId =
                    entry.user_id ||
                    entry.userId ||
                    entry.uid ||
                    entry.id;

                if (!userId) {
                    return;
                }

                const normalizedId = normalizeUserId(userId);

                const heartbeat =
                    entry.last_heartbeat ||
                    entry.lastHeartbeat ||
                    now();

                const previous = result.get(normalizedId);

                result.set(normalizedId, {
                    userId: normalizedId,
                    lastHeartbeat:
                        previous?.lastHeartbeat || heartbeat,
                    lastSeen:
                        previous?.lastSeen || heartbeat,
                    presenceKey
                });
            });
        });

        return result;
    }

    /* =========================================================
       APPLY PRESENCE STATE
       ========================================================= */

    function applyPresenceState(state) {
        currentPresenceState = state || {};

        const newOnlineUsers = extractPresenceUsers(
            currentPresenceState
        );

        const previousOnlineUsers = onlineUsers;

        newOnlineUsers.forEach((data, userId) => {
            const oldData = previousOnlineUsers.get(userId);

            onlineUsers.set(userId, {
                ...data,
                lastHeartbeat:
                    data.lastHeartbeat || oldData?.lastHeartbeat || now(),
                lastSeen:
                    data.lastSeen || oldData?.lastSeen || now()
            });
        });

        previousOnlineUsers.forEach((data, userId) => {
            if (!newOnlineUsers.has(userId)) {
                if (data?.lastSeen) {
                    lastSeenUsers.set(
                        userId,
                        data.lastSeen
                    );
                } else {
                    lastSeenUsers.set(
                        userId,
                        now()
                    );
                }

                onlineUsers.delete(userId);
            }
        });

        dispatchActivityEvent({
            type: "presence",
            onlineUsers: getOnlineUsers()
        });

        updateActivityElements();

        log(
            "Presence updated:",
            onlineUsers.size,
            "online users"
        );
    }

    /* =========================================================
       GET ONLINE USERS
       ========================================================= */

    function getOnlineUsers() {
        const result = [];

        onlineUsers.forEach((data, userId) => {
            if (isUserOnline(userId)) {
                result.push({
                    userId,
                    lastHeartbeat:
                        data.lastHeartbeat || null
                });
            }
        });

        return result;
    }

    /* =========================================================
       START REALTIME
       ========================================================= */

    async function startRealtime() {
        if (realtimeStarted) {
            return true;
        }

        const supabase = getClient();

        if (!supabase) {
            warn("Supabase client is not available.");

            return false;
        }

        currentUser = getCurrentUser();

        if (!currentUser || !currentUser.id) {
            warn("No authenticated user.");

            return false;
        }

        try {
            activityChannel = supabase.channel(
                ACTIVITY_CHANNEL_NAME,
                {
                    config: {
                        presence: {
                            key: String(currentUser.id)
                        }
                    }
                }
            );

            activityChannel
                .on(
                    "presence",
                    {
                        event: "sync"
                    },
                    () => {
                        try {
                            const state =
                                activityChannel.presenceState();

                            applyPresenceState(state);
                        } catch (err) {
                            error(
                                "Presence sync error:",
                                err
                            );
                        }
                    }
                )
                .on(
                    "presence",
                    {
                        event: "join"
                    },
                    ({ key, newPresences }) => {
                        log(
                            "User joined:",
                            key,
                            newPresences
                        );

                        try {
                            const state =
                                activityChannel.presenceState();

                            applyPresenceState(state);
                        } catch (err) {
                            error(
                                "Presence join error:",
                                err
                            );
                        }
                    }
                )
                .on(
                    "presence",
                    {
                        event: "leave"
                    },
                    ({ key, leftPresences }) => {
                        log(
                            "User left:",
                            key,
                            leftPresences
                        );

                        try {
                            const state =
                                activityChannel.presenceState();

                            applyPresenceState(state);
                        } catch (err) {
                            error(
                                "Presence leave error:",
                                err
                            );
                        }
                    }
                );

            const status =
                await activityChannel.subscribe(
                    async (subscriptionStatus) => {
                        log(
                            "Activity channel:",
                            subscriptionStatus
                        );

                        if (
                            subscriptionStatus ===
                            "SUBSCRIBED"
                        ) {
                            realtimeStarted = true;

                            await trackCurrentUser();

                            startHeartbeat();

                            dispatchActivityEvent({
                                type: "connected"
                            });
                        }
                    }
                );

            if (status !== "SUBSCRIBED") {
                log(
                    "Activity channel status:",
                    status
                );
            }

            return true;
        } catch (err) {
            error(
                "Could not start activity realtime:",
                err
            );

            activityChannel = null;
            realtimeStarted = false;

            return false;
        }
    }

    /* =========================================================
       TRACK CURRENT USER
       ========================================================= */

    async function trackCurrentUser() {
        if (!activityChannel) {
            return false;
        }

        currentUser = getCurrentUser();

        if (!currentUser || !currentUser.id) {
            return false;
        }

        const timestamp =
            new Date().toISOString();

        const presenceData = {
            user_id: String(currentUser.id),

            last_heartbeat: timestamp,

            last_seen: timestamp
        };

        try {
            await activityChannel.track(
                presenceData
            );

            onlineUsers.set(
                String(currentUser.id),
                {
                    userId: String(currentUser.id),

                    lastHeartbeat: now(),

                    lastSeen: now()
                }
            );

            dispatchActivityEvent({
                type: "online",
                userId: String(currentUser.id)
            });

            updateActivityElements();

            return true;
        } catch (err) {
            error(
                "Could not track current user:",
                err
            );

            return false;
        }
    }

    /* =========================================================
       HEARTBEAT
       ========================================================= */

    function startHeartbeat() {
        stopHeartbeat();

        heartbeatTimer = setInterval(
            async () => {
                if (!activityChannel) {
                    return;
                }

                if (!currentUser) {
                    currentUser = getCurrentUser();
                }

                if (!currentUser?.id) {
                    return;
                }

                await trackCurrentUser();
            },
            HEARTBEAT_INTERVAL
        );
    }

    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);

            heartbeatTimer = null;
        }
    }

    /* =========================================================
       PAGE VISIBILITY
       ========================================================= */

    function setupVisibilityTracking() {
        document.addEventListener(
            "visibilitychange",
            async () => {
                if (document.visibilityState === "visible") {
                    await trackCurrentUser();

                    return;
                }

                if (
                    currentUser?.id
                ) {
                    const id =
                        String(currentUser.id);

                    const timestamp = now();

                    lastSeenUsers.set(
                        id,
                        timestamp
                    );

                    const existing =
                        onlineUsers.get(id);

                    if (existing) {
                        existing.lastSeen =
                            timestamp;
                    }
                }

                updateActivityElements();
            }
        );

        window.addEventListener(
            "beforeunload",
            () => {
                if (
                    currentUser?.id
                ) {
                    lastSeenUsers.set(
                        String(currentUser.id),
                        now()
                    );
                }

                stopHeartbeat();
            }
        );
    }

    /* =========================================================
       DOM ACTIVITY ELEMENTS
       ========================================================= */

    function updateActivityElements() {
        const elements =
            document.querySelectorAll(
                "[data-wfesc-user-id]"
            );

        elements.forEach((element) => {
            const userId =
                element.getAttribute(
                    "data-wfesc-user-id"
                );

            if (!userId) {
                return;
            }

            const activity =
                getUserActivity(userId);

            element.classList.toggle(
                "wfesc-user-online",
                activity.online
            );

            element.classList.toggle(
                "wfesc-user-offline",
                !activity.online
            );

            element.setAttribute(
                "data-online",
                activity.online
                    ? "true"
                    : "false"
            );

            element.setAttribute(
                "data-last-seen",
                activity.lastSeenText
            );
        });
    }

    /* =========================================================
       ACTIVITY STATUS TEXT
       ========================================================= */

    function getStatusText(userId) {
        const activity =
            getUserActivity(userId);

        return activity.online
            ? "متصل الآن"
            : activity.lastSeenText;
    }

    /* =========================================================
       UPDATE SINGLE ELEMENT
       ========================================================= */

    function updateUserElement(
        element,
        userId
    ) {
        if (!element) {
            return;
        }

        userId = normalizeUserId(userId);

        if (!userId) {
            return;
        }

        const activity =
            getUserActivity(userId);

        element.setAttribute(
            "data-wfesc-user-id",
            userId
        );

        element.setAttribute(
            "data-online",
            activity.online
                ? "true"
                : "false"
        );

        element.setAttribute(
            "data-last-seen",
            activity.lastSeenText
        );

        element.classList.toggle(
            "wfesc-user-online",
            activity.online
        );

        element.classList.toggle(
            "wfesc-user-offline",
            !activity.online
        );
    }

    /* =========================================================
       CREATE STATUS DOT
       ========================================================= */

    function createStatusDot(userId) {
        const dot =
            document.createElement("span");

        dot.className =
            "wfesc-activity-dot";

        updateUserElement(
            dot,
            userId
        );

        return dot;
    }

    /* =========================================================
       CREATE STATUS TEXT
       ========================================================= */

    function createStatusElement(userId) {
        const status =
            document.createElement("span");

        status.className =
            "wfesc-activity-status";

        updateUserElement(
            status,
            userId
        );

        status.textContent =
            getStatusText(userId);

        return status;
    }

    /* =========================================================
       PERIODIC DOM REFRESH
       ========================================================= */

    let domRefreshTimer = null;

    function startDOMRefresh() {
        stopDOMRefresh();

        domRefreshTimer =
            setInterval(
                () => {
                    updateActivityElements();

                    document
                        .querySelectorAll(
                            ".wfesc-activity-status"
                        )
                        .forEach((element) => {
                            const userId =
                                element.getAttribute(
                                    "data-wfesc-user-id"
                                );

                            if (!userId) {
                                return;
                            }

                            element.textContent =
                                getStatusText(
                                    userId
                                );
                        });
                },
                5000
            );
    }

    function stopDOMRefresh() {
        if (domRefreshTimer) {
            clearInterval(
                domRefreshTimer
            );

            domRefreshTimer = null;
        }
    }

    /* =========================================================
       INITIALIZE
       ========================================================= */

    async function initialize() {
        if (initialized) {
            return true;
        }

        client = getClient();

        if (!client) {
            warn(
                "WFESC Messages Core / Supabase client not found."
            );

            return false;
        }

        currentUser = getCurrentUser();

        if (!currentUser?.id) {
            log(
                "Waiting for authenticated user..."
            );

            return false;
        }

        setupVisibilityTracking();

        startDOMRefresh();

        const started =
            await startRealtime();

        initialized = started;

        if (started) {
            log(
                "messages-activity.js initialized."
            );
        }

        return started;
    }

    /* =========================================================
       RETRY AFTER AUTH
       ========================================================= */

    let retryTimer = null;

    function startAuthRetry() {
        if (retryTimer) {
            return;
        }

        retryTimer =
            setInterval(
                async () => {
                    if (initialized) {
                        clearInterval(
                            retryTimer
                        );

                        retryTimer = null;

                        return;
                    }

                    const user =
                        getCurrentUser();

                    if (!user?.id) {
                        return;
                    }

                    const success =
                        await initialize();

                    if (success) {
                        clearInterval(
                            retryTimer
                        );

                        retryTimer = null;
                    }
                },
                3000
            );
    }

    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.WFESC_MESSAGES_ACTIVITY = {
        initialize,

        startRealtime,

        trackCurrentUser,

        isUserOnline,

        getUserActivity,

        getStatusText,

        getOnlineUsers,

        createStatusDot,

        createStatusElement,

        updateUserElement,

        updateActivityElements,

        formatLastSeen,

        getCurrentUser() {
            return currentUser;
        },

        getChannel() {
            return activityChannel;
        },

        isInitialized() {
            return initialized;
        },

        isRealtimeStarted() {
            return realtimeStarted;
        }
    };

    /* =========================================================
       AUTO START
       ========================================================= */

    function boot() {
        const start = async () => {
            const success =
                await initialize();

            if (!success) {
                startAuthRetry();
            }
        };

        if (
            document.readyState ===
            "loading"
        ) {
            document.addEventListener(
                "DOMContentLoaded",
                start,
                {
                    once: true
                }
            );
        } else {
            start();
        }
    }

    boot();

})();
