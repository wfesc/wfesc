/* =========================================================
   WFESC MESSAGES ACTIVITY
   File:
   messages/messages-activity.js

   مسؤول فقط عن:
   - زر النشاط
   - نافذة حالة النشاط
   - تشغيل / إيقاف حالة النشاط
   - حفظ الإعداد في Supabase
   - تحديث Online Presence
   - الاستماع لحالة المستخدمين
   - عدم تعديل messages-core.js
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const ACTIVITY_DEBUG = true;

    const ACTIVITY_TABLE = "profiles";

    const ACTIVITY_FIELD = "show_activity";

    const ACTIVITY_PRESENCE_CHANNEL = "wfesc-activity-presence";

    const ACTIVITY_HEARTBEAT = 30000;

    const ACTIVITY_OFFLINE_AFTER = 70000;


    /* =====================================================
       STATE
    ===================================================== */

    let client = null;

    let currentUser = null;

    let showActivity = true;

    let activityInitialized = false;

    let activityModal = null;

    let activitySwitch = null;

    let activityButton = null;

    let closeActivityModal = null;

    let presenceChannel = null;

    let heartbeatTimer = null;

    let presenceStarted = false;

    let visibilityHandlerAttached = false;

    let lastPresenceState = null;


    /* =====================================================
       DOM
    ===================================================== */

    function getDOM() {

        activityButton =
            document.getElementById(
                "activityButton"
            );

        activityModal =
            document.getElementById(
                "activityModal"
            );

        activitySwitch =
            document.getElementById(
                "activitySwitch"
            );

        closeActivityModal =
            document.getElementById(
                "closeActivityModal"
            );

    }


    /* =====================================================
       DEBUG
    ===================================================== */

    function debug(...args) {

        if (!ACTIVITY_DEBUG) {
            return;
        }

        console.log(
            "[WFESC Activity]",
            ...args
        );

    }


    function debugError(...args) {

        console.error(
            "[WFESC Activity]",
            ...args
        );

    }


    /* =====================================================
       SUPABASE CLIENT
    ===================================================== */

    function getSupabaseClient() {

        try {

            if (
                window.WFESCSupabase
            ) {

                return window.WFESCSupabase;

            }


            if (
                window.supabase &&
                typeof window.supabase.createClient === "function"
            ) {

                const url =
                    "https://mcgbzfgbaxwmutniorlw.supabase.co";

                const key =
                    "sb_publishable_V9RaHJDWmhox-XMzj1SK_w_6p5pAK5L";

                return window.supabase.createClient(
                    url,
                    key
                );

            }

        } catch (error) {

            debugError(
                "تعذر إنشاء Supabase client:",
                error
            );

        }

        return null;

    }


    /* =====================================================
       CURRENT USER
    ===================================================== */

    async function loadCurrentUser() {

        if (!client) {
            return null;
        }


        try {

            const result =
                await client.auth.getUser();


            if (
                result &&
                result.data &&
                result.data.user
            ) {

                currentUser =
                    result.data.user;

                return currentUser;

            }


        } catch (error) {

            debugError(
                "خطأ في جلب المستخدم:",
                error
            );

        }


        return null;

    }


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    function getLocalActivityPreference() {

        if (!currentUser) {
            return null;
        }


        try {

            const key =
                "wfesc_activity_" +
                currentUser.id;

            const value =
                localStorage.getItem(
                    key
                );


            if (value === null) {
                return null;
            }


            return value === "true";

        } catch (error) {

            debugError(
                "خطأ LocalStorage:",
                error
            );

            return null;

        }

    }


    function saveLocalActivityPreference(
        value
    ) {

        if (!currentUser) {
            return;
        }


        try {

            const key =
                "wfesc_activity_" +
                currentUser.id;

            localStorage.setItem(
                key,
                value ? "true" : "false"
            );

        } catch (error) {

            debugError(
                "تعذر حفظ الإعداد محليًا:",
                error
            );

        }

    }


    /* =====================================================
       LOAD ACTIVITY SETTING
    ===================================================== */

    async function loadActivitySetting() {

        if (!client || !currentUser) {
            return;
        }


        /*
         * أولاً نحاول قراءة الإعداد من profiles.
         */

        try {

            const result =
                await client
                    .from(ACTIVITY_TABLE)
                    .select(
                        ACTIVITY_FIELD
                    )
                    .eq(
                        "id",
                        currentUser.id
                    )
                    .maybeSingle();


            if (
                !result.error &&
                result.data &&
                typeof result.data[
                    ACTIVITY_FIELD
                ] === "boolean"
            ) {

                showActivity =
                    result.data[
                        ACTIVITY_FIELD
                    ];

                saveLocalActivityPreference(
                    showActivity
                );

                updateActivityUI();

                return;

            }


            if (result.error) {

                debug(
                    "لم يتم العثور على show_activity في profiles:",
                    result.error.message
                );

            }

        } catch (error) {

            debugError(
                "خطأ أثناء قراءة إعداد النشاط:",
                error
            );

        }


        /*
         * إذا لم يوجد العمود أو لم تتم القراءة،
         * نستخدم القيمة المحلية إن وجدت.
         */

        const localValue =
            getLocalActivityPreference();


        if (
            typeof localValue === "boolean"
        ) {

            showActivity =
                localValue;

        }


        updateActivityUI();

    }


    /* =====================================================
       SAVE ACTIVITY SETTING
    ===================================================== */

    async function saveActivitySetting(
        value
    ) {

        value =
            Boolean(value);


        showActivity =
            value;


        saveLocalActivityPreference(
            value
        );


        updateActivityUI();


        if (!client || !currentUser) {

            return false;

        }


        try {

            const result =
                await client
                    .from(ACTIVITY_TABLE)
                    .update({

                        [ACTIVITY_FIELD]:
                            value

                    })
                    .eq(
                        "id",
                        currentUser.id
                    );


            if (result.error) {

                /*
                 * لا نكسر النشاط إذا كان العمود
                 * غير موجود بعد.
                 */

                debug(
                    "تعذر حفظ show_activity في Supabase:",
                    result.error.message
                );

                return false;

            }


            debug(
                "تم حفظ حالة النشاط:",
                value
            );


            return true;

        } catch (error) {

            debugError(
                "خطأ أثناء حفظ حالة النشاط:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       UI
    ===================================================== */

    function updateActivityUI() {

        if (!activitySwitch) {
            return;
        }


        if (showActivity) {

            activitySwitch.classList.add(
                "active"
            );

            activitySwitch.setAttribute(
                "aria-pressed",
                "true"
            );

        } else {

            activitySwitch.classList.remove(
                "active"
            );

            activitySwitch.setAttribute(
                "aria-pressed",
                "false"
            );

        }

    }


    function openActivityModal() {

        if (!activityModal) {
            return;
        }


        updateActivityUI();


        activityModal.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeActivityModalNow() {

        if (!activityModal) {
            return;
        }


        activityModal.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       ACTIVITY TOGGLE
    ===================================================== */

    async function toggleActivity() {

        const newValue =
            !showActivity;


        /*
         * تحديث فوري للواجهة.
         */

        showActivity =
            newValue;

        updateActivityUI();


        /*
         * حفظ.
         */

        await saveActivitySetting(
            newValue
        );


        /*
         * إعادة بث الحالة.
         */

        await publishPresence();

    }


    /* =====================================================
       PRESENCE
    ===================================================== */

    async function createPresenceChannel() {

        if (!client || !currentUser) {
            return null;
        }


        if (presenceChannel) {

            return presenceChannel;

        }


        try {

            presenceChannel =
                client.channel(
                    ACTIVITY_PRESENCE_CHANNEL,
                    {
                        config: {

                            presence: {
                                key:
                                    currentUser.id
                            }

                        }

                    }
                );


            presenceChannel
                .on(
                    "presence",
                    {
                        event: "sync"
                    },
                    () => {

                        debug(
                            "Presence sync"
                        );

                        processPresenceState();

                    }
                );


            presenceChannel
                .on(
                    "presence",
                    {
                        event: "join"
                    },
                    payload => {

                        debug(
                            "Presence join:",
                            payload
                        );

                        processPresenceState();

                    }
                );


            presenceChannel
                .on(
                    "presence",
                    {
                        event: "leave"
                    },
                    payload => {

                        debug(
                            "Presence leave:",
                            payload
                        );

                        processPresenceState();

                    }
                );


            const result =
                await presenceChannel.subscribe(
                    status => {

                        debug(
                            "Presence status:",
                            status
                        );


                        if (
                            status ===
                            "SUBSCRIBED"
                        ) {

                            presenceStarted =
                                true;

                            publishPresence();

                        }

                    }
                );


            return presenceChannel;

        } catch (error) {

            debugError(
                "فشل إنشاء Presence:",
                error
            );

            presenceChannel =
                null;

            return null;

        }

    }


    /* =====================================================
       PUBLISH PRESENCE
    ===================================================== */

    async function publishPresence() {

        if (
            !presenceChannel ||
            !currentUser
        ) {

            return;

        }


        if (
            !presenceStarted
        ) {

            return;

        }


        try {

            const online =
                document.visibilityState ===
                    "visible" &&
                showActivity;


            const payload = {

                user_id:
                    currentUser.id,

                online:
                    online,

                show_activity:
                    showActivity,

                last_seen:
                    new Date().toISOString()

            };


            lastPresenceState =
                payload;


            await presenceChannel.track(
                payload
            );


            debug(
                "Presence published:",
                payload
            );

        } catch (error) {

            debugError(
                "فشل نشر Presence:",
                error
            );

        }

    }


    /* =====================================================
       PRESENCE PROCESSING
    ===================================================== */

    function processPresenceState() {

        if (
            !presenceChannel
        ) {

            return;

        }


        try {

            const state =
                presenceChannel.presenceState();


            window.WFESC_ACTIVITY_STATE =
                state;


            /*
             * نرسل حدث عام لباقي ملفات WFESC.
             *
             * هذا يسمح لـ messages-core.js
             * أو أي ملف مستقبلي باستخدام النشاط
             * بدون تعديل هذا الملف.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "wfesc:activity-sync",
                    {
                        detail: {
                            state:
                                state
                        }
                    }
                )
            );


            debug(
                "Activity state updated:",
                state
            );

        } catch (error) {

            debugError(
                "خطأ معالجة Presence state:",
                error
            );

        }

    }


    /* =====================================================
       CHECK USER ONLINE
    ===================================================== */

    function isUserOnline(
        userId
    ) {

        if (
            !userId ||
            !presenceChannel
        ) {

            return false;

        }


        try {

            const state =
                presenceChannel.presenceState();


            const entries =
                state[userId];


            if (
                !Array.isArray(entries) ||
                entries.length === 0
            ) {

                return false;

            }


            const latest =
                entries[
                    entries.length - 1
                ];


            if (
                !latest
            ) {

                return false;

            }


            if (
                latest.online !== true
            ) {

                return false;

            }


            if (
                latest.show_activity ===
                false
            ) {

                return false;

            }


            if (
                latest.last_seen
            ) {

                const lastSeen =
                    new Date(
                        latest.last_seen
                    ).getTime();


                const now =
                    Date.now();


                if (
                    Number.isFinite(
                        lastSeen
                    ) &&
                    now - lastSeen >
                        ACTIVITY_OFFLINE_AFTER
                ) {

                    return false;

                }

            }


            return true;

        } catch (error) {

            debugError(
                "خطأ فحص Online:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       GET USER ACTIVITY
    ===================================================== */

    function getUserActivity(
        userId
    ) {

        if (
            !userId ||
            !presenceChannel
        ) {

            return {
                online:false,
                last_seen:null
            };

        }


        try {

            const state =
                presenceChannel.presenceState();


            const entries =
                state[userId];


            if (
                !Array.isArray(entries) ||
                entries.length === 0
            ) {

                return {
                    online:false,
                    last_seen:null
                };

            }


            const latest =
                entries[
                    entries.length - 1
                ];


            return {

                online:
                    isUserOnline(
                        userId
                    ),

                last_seen:
                    latest &&
                    latest.last_seen
                        ? latest.last_seen
                        : null

            };

        } catch (error) {

            debugError(
                "خطأ قراءة نشاط المستخدم:",
                error
            );

            return {
                online:false,
                last_seen:null
            };

        }

    }


    /* =====================================================
       ACTIVITY TEXT
    ===================================================== */

    function getActivityText(
        userId
    ) {

        const activity =
            getUserActivity(
                userId
            );


        if (
            activity.online
        ) {

            return "متصل الآن";

        }


        if (
            activity.last_seen
        ) {

            return formatLastSeen(
                activity.last_seen
            );

        }


        return "غير نشط";

    }


    function formatLastSeen(
        value
    ) {

        const timestamp =
            new Date(
                value
            ).getTime();


        if (
            !Number.isFinite(
                timestamp
            )
        ) {

            return "غير نشط";

        }


        const diff =
            Date.now() -
            timestamp;


        if (
            diff < 60000
        ) {

            return "كان متصلًا الآن";

        }


        const minutes =
            Math.floor(
                diff / 60000
            );


        if (
            minutes < 60
        ) {

            return (
                "كان متصلًا قبل " +
                minutes +
                " دقيقة"
            );

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (
            hours < 24
        ) {

            return (
                "كان متصلًا قبل " +
                hours +
                " ساعة"
            );

        }


        const days =
            Math.floor(
                hours / 24
            );


        if (
            days === 1
        ) {

            return "كان متصلًا أمس";

        }


        if (
            days < 7
        ) {

            return (
                "كان متصلًا قبل " +
                days +
                " أيام"
            );

        }


        return "غير نشط";

    }


    /* =====================================================
       HEARTBEAT
    ===================================================== */

    function startHeartbeat() {

        stopHeartbeat();


        heartbeatTimer =
            setInterval(
                () => {

                    publishPresence();

                },
                ACTIVITY_HEARTBEAT
            );

    }


    function stopHeartbeat() {

        if (
            heartbeatTimer
        ) {

            clearInterval(
                heartbeatTimer
            );

            heartbeatTimer =
                null;

        }

    }


    /* =====================================================
       VISIBILITY
    ===================================================== */

    function setupVisibility() {

        if (
            visibilityHandlerAttached
        ) {

            return;

        }


        document.addEventListener(
            "visibilitychange",
            () => {

                publishPresence();

            }
        );


        window.addEventListener(
            "focus",
            () => {

                publishPresence();

            }
        );


        window.addEventListener(
            "blur",
            () => {

                publishPresence();

            }
        );


        visibilityHandlerAttached =
            true;

    }


    /* =====================================================
       UI EVENTS
    ===================================================== */

    function setupUI() {

        getDOM();


        if (
            activityButton
        ) {

            activityButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openActivityModal();

                }
            );

        }


        if (
            activitySwitch
        ) {

            activitySwitch.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    toggleActivity();

                }
            );

        }


        if (
            closeActivityModal
        ) {

            closeActivityModal.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    closeActivityModalNow();

                }
            );

        }


        if (
            activityModal
        ) {

            activityModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        activityModal
                    ) {

                        closeActivityModalNow();

                    }

                }
            );

        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeActivityModalNow();

                }

            }
        );

    }


    /* =====================================================
       GLOBAL ACTIVITY EVENTS
    ===================================================== */

    function setupGlobalEvents() {

        /*
         * عندما يتغير نشاط مستخدم:
         * نرسل حدث يمكن لباقي ملفات الرسائل
         * الاستماع إليه.
         */

        window.addEventListener(
            "wfesc:activity-request",
            event => {

                const userId =
                    event &&
                    event.detail
                        ? event.detail.userId
                        : null;


                if (!userId) {
                    return;
                }


                const activity =
                    getUserActivity(
                        userId
                    );


                window.dispatchEvent(
                    new CustomEvent(
                        "wfesc:activity-response",
                        {
                            detail: {

                                userId:
                                    userId,

                                online:
                                    activity.online,

                                last_seen:
                                    activity.last_seen,

                                text:
                                    getActivityText(
                                        userId
                                    )

                            }
                        }
                    )
                );

            }
        );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    function exposeAPI() {

        window.WFESC_MESSAGES_ACTIVITY = {

            getCurrentUser() {

                return currentUser;

            },


            isActivityVisible() {

                return showActivity;

            },


            setActivityVisible(
                value
            ) {

                return saveActivitySetting(
                    Boolean(value)
                );

            },


            openActivityModal() {

                openActivityModal();

            },


            closeActivityModal() {

                closeActivityModalNow();

            },


            isUserOnline(
                userId
            ) {

                return isUserOnline(
                    userId
                );

            },


            getUserActivity(
                userId
            ) {

                return getUserActivity(
                    userId
                );

            },


            getActivityText(
                userId
            ) {

                return getActivityText(
                    userId
                );

            },


            getPresenceState() {

                if (
                    !presenceChannel
                ) {

                    return {};

                }


                try {

                    return presenceChannel
                        .presenceState();

                } catch {

                    return {};

                }

            },


            refresh() {

                publishPresence();

            }

        };

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        if (
            activityInitialized
        ) {

            return;

        }


        activityInitialized =
            true;


        debug(
            "بدء messages-activity.js"
        );


        getDOM();


        /*
         * تجهيز الواجهة حتى لو لم يكن المستخدم
         * مسجل الدخول.
         */

        updateActivityUI();

        setupUI();

        setupGlobalEvents();

        setupVisibility();

        exposeAPI();


        /*
         * جلب Supabase.
         */

        client =
            getSupabaseClient();


        if (!client) {

            debugError(
                "Supabase client غير موجود."
            );

            return;

        }


        /*
         * المستخدم الحالي.
         */

        await loadCurrentUser();


        if (!currentUser) {

            debug(
                "لا يوجد مستخدم مسجل دخول."
            );

            return;

        }


        /*
         * قراءة إعداد النشاط.
         */

        await loadActivitySetting();


        /*
         * إنشاء Presence.
         */

        await createPresenceChannel();


        /*
         * Heartbeat.
         */

        startHeartbeat();


        /*
         * أول بث.
         */

        await publishPresence();


        debug(
            "تم تشغيل نظام النشاط بنجاح."
        );

    }


    /* =====================================================
       START AFTER DOM
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:true
            }
        );

    } else {

        initialize();

    }


})();
