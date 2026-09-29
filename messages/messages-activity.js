/* =========================================================
   WFESC MESSAGES
   ACTIVITY / ONLINE PRESENCE
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const ACTIVITY_DEBUG =
        true;


    const ACTIVITY_TABLE =
        "profiles";


    const ACTIVITY_FIELD =
        "show_activity";


    const ACTIVITY_CHANNEL =
        "wfesc-activity-presence";


    const HEARTBEAT_TIME =
        30000;


    const OFFLINE_AFTER =
        70000;


    const BLOCK_CACHE_TTL =
        30000;


    /* =========================================================
       SUPABASE
    ========================================================= */

    const SUPABASE_URL =
        "https://mcgbzfgbaxwmutniorlw.supabase.co";


    const SUPABASE_KEY =
        "sb_publishable_V9Ha2JDWmhox-XMzj1SK_w6p5pAK5L";


    let client =
        null;


    function getClient() {

        const core =
            window.WFESC_MESSAGES_CORE;


        if (
            core &&
            core.client &&
            typeof core.client.from ===
                "function"
        ) {

            client =
                core.client;


            return client;

        }


        if (
            window.WFESCSupabase &&
            typeof window.WFESCSupabase.from ===
                "function"
        ) {

            client =
                window.WFESCSupabase;


            return client;

        }


        if (
            !client &&
            window.supabase &&
            typeof window.supabase.createClient ===
                "function"
        ) {

            client =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );

        }


        return client;

    }


    /* =========================================================
       STATE
    ========================================================= */

    let currentUser =
        null;


    let showActivity =
        true;


    let presenceChannel =
        null;


    let presenceStarted =
        false;


    let heartbeatTimer =
        null;


    let initialized =
        false;


    let uiReady =
        false;


    let visibilityReady =
        false;


    let lastPresenceState =
        null;


    /*
     * حالة الحظر بالنسبة للنشاط.
     *
     * true =
     * لا نعرض نشاط هذا المستخدم.
     */

    const activityBlockCache =
        new Map();


    /* =========================================================
       DOM
    ========================================================= */

    let activityButton =
        null;


    let activityModal =
        null;


    let activitySwitch =
        null;


    let closeActivityModal =
        null;


    /* =========================================================
       DEBUG
    ========================================================= */

    function debug() {

        if (!ACTIVITY_DEBUG) {

            return;

        }


        try {

            console.log(
                "[WFESC ACTIVITY]",
                ...arguments
            );

        } catch (error) {}

    }


    /* =========================================================
       LOCAL STORAGE
    ========================================================= */

    function getStorageKey() {

        if (!currentUser?.id) {

            return null;

        }


        return (
            "wfesc_activity_" +
            currentUser.id
        );

    }


    /* =========================================================
       LOAD USER
    ========================================================= */

    async function loadUser() {

        const supabaseClient =
            getClient();


        if (!supabaseClient) {

            debug(
                "Supabase client غير موجود"
            );


            return null;

        }


        try {

            const result =
                await supabaseClient.auth.getUser();


            if (result.error) {

                debug(
                    "getUser error:",
                    result.error
                );


                return null;

            }


            currentUser =
                result.data?.user ||
                null;


            debug(
                "Current user:",
                currentUser?.id
            );


            return currentUser;

        } catch (error) {

            debug(
                "loadUser exception:",
                error
            );


            return null;

        }

    }


    /* =========================================================
       LOAD ACTIVITY SETTING
    ========================================================= */

    async function loadSetting() {

        const supabaseClient =
            getClient();


        if (
            !currentUser?.id ||
            !supabaseClient
        ) {

            return;

        }


        let loadedFromDatabase =
            false;


        try {

            const result =
                await supabaseClient
                    .from(
                        ACTIVITY_TABLE
                    )
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
                ] ===
                    "boolean"
            ) {

                showActivity =
                    result.data[
                        ACTIVITY_FIELD
                    ];


                loadedFromDatabase =
                    true;


                debug(
                    "Activity setting from database:",
                    showActivity
                );

            }

        } catch (error) {

            debug(
                "loadSetting database error:",
                error
            );

        }


        /* -----------------------------------------------------
           LOCAL FALLBACK
        ----------------------------------------------------- */

        if (!loadedFromDatabase) {

            try {

                const key =
                    getStorageKey();


                if (key) {

                    const saved =
                        localStorage.getItem(
                            key
                        );


                    if (
                        saved === "true" ||
                        saved === "false"
                    ) {

                        showActivity =
                            saved === "true";

                    }

                }

            } catch (error) {}


            debug(
                "Activity setting from localStorage:",
                showActivity
            );

        }


        updateSwitchUI();


        await publishPresence();

    }


    /* =========================================================
       SAVE ACTIVITY SETTING
    ========================================================= */

    async function saveSetting(
        value
    ) {

        showActivity =
            Boolean(value);


        /* -----------------------------------------------------
           LOCAL STORAGE
        ----------------------------------------------------- */

        try {

            const key =
                getStorageKey();


            if (key) {

                localStorage.setItem(
                    key,
                    String(showActivity)
                );

            }

        } catch (error) {}


        /* -----------------------------------------------------
           DATABASE
        ----------------------------------------------------- */

        const supabaseClient =
            getClient();


        if (
            currentUser?.id &&
            supabaseClient
        ) {

            try {

                const result =
                    await supabaseClient
                        .from(
                            ACTIVITY_TABLE
                        )
                        .update({

                            [ACTIVITY_FIELD]:
                                showActivity

                        })
                        .eq(
                            "id",
                            currentUser.id
                        );


                if (result.error) {

                    debug(
                        "saveSetting database error:",
                        result.error
                    );

                } else {

                    debug(
                        "Activity saved:",
                        showActivity
                    );

                }

            } catch (error) {

                debug(
                    "saveSetting exception:",
                    error
                );

            }

        }


        /* -----------------------------------------------------
           UPDATE UI
        ----------------------------------------------------- */

        updateSwitchUI();


        /* -----------------------------------------------------
           UPDATE PRESENCE
        ----------------------------------------------------- */

        await publishPresence();


        /* -----------------------------------------------------
           INFORM OTHER MODULES
        ----------------------------------------------------- */

        dispatchActivitySync();


        return showActivity;

    }


    /* =========================================================
       SWITCH UI
    ========================================================= */

    function updateSwitchUI() {

        if (!activitySwitch) {

            return;

        }


        activitySwitch.classList.toggle(
            "active",
            showActivity
        );


        activitySwitch.classList.toggle(
            "on",
            showActivity
        );


        activitySwitch.setAttribute(
            "aria-checked",
            String(showActivity)
        );


        activitySwitch.setAttribute(
            "data-active",
            String(showActivity)
        );


        activitySwitch.setAttribute(
            "role",
            "switch"
        );


        if (
            activitySwitch.dataset &&
            activitySwitch.dataset.textMode ===
                "true"
        ) {

            activitySwitch.textContent =
                showActivity
                    ? "تشغيل"
                    : "إيقاف";

        }

    }


    /* =========================================================
       TOGGLE ACTIVITY
    ========================================================= */

    async function toggleActivity() {

        const nextValue =
            !showActivity;


        debug(
            "Toggle activity:",
            showActivity,
            "→",
            nextValue
        );


        await saveSetting(
            nextValue
        );

    }


    /* =========================================================
       OPEN MODAL
    ========================================================= */

    function openActivityModal() {

        if (!activityModal) {

            findDOM();

        }


        if (!activityModal) {

            return;

        }


        updateSwitchUI();


        activityModal.classList.add(
            "active"
        );


        activityModal.classList.add(
            "show"
        );


        activityModal.removeAttribute(
            "hidden"
        );


        activityModal.setAttribute(
            "aria-hidden",
            "false"
        );


        debug(
            "Activity modal opened"
        );

    }


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    function closeActivityModalInternal() {

        if (!activityModal) {

            return;

        }


        activityModal.classList.remove(
            "active"
        );


        activityModal.classList.remove(
            "show"
        );


        activityModal.setAttribute(
            "aria-hidden",
            "true"
        );


        debug(
            "Activity modal closed"
        );

    }


    /* =========================================================
       FIND DOM
    ========================================================= */

    function findDOM() {

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


        updateSwitchUI();


        uiReady =
            true;


        debug(
            "DOM:",
            {

                activityButton:
                    Boolean(activityButton),

                activityModal:
                    Boolean(activityModal),

                activitySwitch:
                    Boolean(activitySwitch),

                closeActivityModal:
                    Boolean(closeActivityModal)

            }
        );

    }


    /* =========================================================
       UI EVENTS
    ========================================================= */

    function setupUI() {

        findDOM();


        /*
         * زر النشاط
         */

        if (
            activityButton &&
            !activityButton.dataset.wfescActivityBound
        ) {

            activityButton.dataset.wfescActivityBound =
                "true";


            activityButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    openActivityModal();

                }
            );

        }


        /*
         * المفتاح
         */

        if (
            activitySwitch &&
            !activitySwitch.dataset.wfescActivityBound
        ) {

            activitySwitch.dataset.wfescActivityBound =
                "true";


            activitySwitch.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    await toggleActivity();

                }
            );


            activitySwitch.addEventListener(
                "keydown",
                async function (event) {

                    if (
                        event.key ===
                            "Enter" ||
                        event.key ===
                            " "
                    ) {

                        event.preventDefault();

                        event.stopPropagation();

                        await toggleActivity();

                    }

                }
            );

        }


        /*
         * زر الإغلاق
         */

        if (
            closeActivityModal &&
            !closeActivityModal.dataset.wfescActivityBound
        ) {

            closeActivityModal.dataset.wfescActivityBound =
                "true";


            closeActivityModal.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    closeActivityModalInternal();

                }
            );

        }


        /*
         * الضغط على خلفية المودال
         */

        if (
            activityModal &&
            !activityModal.dataset.wfescActivityBound
        ) {

            activityModal.dataset.wfescActivityBound =
                "true";


            activityModal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        activityModal
                    ) {

                        closeActivityModalInternal();

                    }

                }
            );

        }

    }


    /* =========================================================
       FALLBACK GLOBAL CLICK
    ========================================================= */

    function setupGlobalActivityClick() {

        if (
            document.documentElement.dataset
                .wfescActivityGlobalClick
        ) {

            return;

        }


        document.documentElement.dataset
            .wfescActivityGlobalClick =
            "true";


        document.addEventListener(
            "click",
            async function (event) {

                const target =
                    event.target;


                if (
                    !target ||
                    typeof target.closest !==
                        "function"
                ) {

                    return;

                }


                const button =
                    target.closest(
                        "#activityButton"
                    );


                if (button) {

                    event.preventDefault();

                    event.stopPropagation();

                    openActivityModal();

                    return;

                }


                const switchButton =
                    target.closest(
                        "#activitySwitch"
                    );


                if (switchButton) {

                    event.preventDefault();

                    event.stopPropagation();

                    await toggleActivity();

                    return;

                }


                const closeButton =
                    target.closest(
                        "#closeActivityModal"
                    );


                if (closeButton) {

                    event.preventDefault();

                    event.stopPropagation();

                    closeActivityModalInternal();

                }

            },
            true
        );

    }


    /* =========================================================
       BLOCK MODULE
    ========================================================= */

    function getBlockModule() {

        return (
            window.WFESC_MESSAGES_BLOCK ||
            null
        );

    }


    function getCachedActivityBlock(
        userId
    ) {

        if (!userId) {

            return null;

        }


        const item =
            activityBlockCache.get(
                String(userId)
            );


        if (!item) {

            return null;

        }


        if (
            Date.now() -
            item.loadedAt >
            BLOCK_CACHE_TTL
        ) {

            activityBlockCache.delete(
                String(userId)
            );


            return null;

        }


        return {

            blocked:
                item.blocked === true,

            blockedBy:
                item.blockedBy === true

        };

    }


    function setCachedActivityBlock(
        userId,
        blocked,
        blockedBy
    ) {

        if (!userId) {

            return;

        }


        activityBlockCache.set(
            String(userId),
            {

                blocked:
                    blocked === true,

                blockedBy:
                    blockedBy === true,

                loadedAt:
                    Date.now()

            }
        );

    }


    async function refreshActivityBlockState(
        userId
    ) {

        if (!userId) {

            return {

                blocked: false,

                blockedBy: false

            };

        }


        const block =
            getBlockModule();


        if (!block) {

            return {

                blocked: false,

                blockedBy: false

            };

        }


        let blocked =
            false;


        let blockedBy =
            false;


        try {

            if (
                typeof block.isBlocked ===
                    "function"
            ) {

                blocked =
                    await block.isBlocked(
                        userId
                    );

            }

        } catch (error) {

            debug(
                "Activity block isBlocked error:",
                error
            );

        }


        try {

            if (
                typeof block.isBlockedBy ===
                    "function"
            ) {

                blockedBy =
                    await block.isBlockedBy(
                        userId
                    );

            }

        } catch (error) {

            debug(
                "Activity block isBlockedBy error:",
                error
            );

        }


        setCachedActivityBlock(
            userId,
            blocked,
            blockedBy
        );


        return {

            blocked:
                blocked === true,

            blockedBy:
                blockedBy === true

        };

    }


    function invalidateActivityBlock(
        userId
    ) {

        if (userId) {

            activityBlockCache.delete(
                String(userId)
            );

        } else {

            activityBlockCache.clear();

        }

    }


    /* =========================================================
       BLOCK EVENTS
    ========================================================= */

    function handleActivityBlockEvent(
        event
    ) {

        const changedUserId =
            event?.detail?.userId ||
            event?.detail?.blockedUserId ||
            event?.detail?.blocked_id ||
            null;


        invalidateActivityBlock(
            changedUserId
        );


        if (changedUserId) {

            refreshActivityBlockState(
                changedUserId
            )
            .then(
                function () {

                    window.dispatchEvent(
                        new CustomEvent(
                            "wfesc:activity-sync",
                            {
                                detail: {

                                    userId:
                                        changedUserId,

                                    blockChanged:
                                        true

                                }
                            }
                        )
                    );

                }
            )
            .catch(
                function () {}
            );

        } else {

            processPresence();

        }

    }


    [
        "wfesc:block-changed",
        "wfesc:blocked",
        "wfesc:unblocked",
        "wfesc:user-blocked",
        "wfesc:user-unblocked"
    ]
    .forEach(
        function (eventName) {

            window.addEventListener(
                eventName,
                handleActivityBlockEvent
            );

        }
    );


    /* =========================================================
       CREATE PRESENCE CHANNEL
    ========================================================= */

    function createPresenceChannel() {

        const supabaseClient =
            getClient();


        if (
            !supabaseClient ||
            !currentUser?.id
        ) {

            return null;

        }


        if (presenceChannel) {

            return presenceChannel;

        }


        debug(
            "Creating presence channel"
        );


        presenceChannel =
            supabaseClient.channel(
                ACTIVITY_CHANNEL,
                {
                    config: {
                        presence: {
                            key:
                                currentUser.id
                        }
                    }
                }
            );


        /*
         * SYNC
         */

        presenceChannel.on(
            "presence",
            {
                event:
                    "sync"
            },
            function () {

                debug(
                    "Presence sync"
                );


                processPresence();

            }
        );


        /*
         * JOIN
         */

        presenceChannel.on(
            "presence",
            {
                event:
                    "join"
            },
            function () {

                debug(
                    "Presence join"
                );


                processPresence();

            }
        );


        /*
         * LEAVE
         */

        presenceChannel.on(
            "presence",
            {
                event:
                    "leave"
            },
            function () {

                debug(
                    "Presence leave"
                );


                processPresence();

            }
        );


        return presenceChannel;

    }


    /* =========================================================
       START PRESENCE
    ========================================================= */

    async function startPresence() {

        if (
            !currentUser?.id ||
            !getClient()
        ) {

            return;

        }


        createPresenceChannel();


        if (!presenceChannel) {

            return;

        }


        if (presenceStarted) {

            await publishPresence();

            return;

        }


        debug(
            "Subscribing to activity presence..."
        );


        presenceChannel.subscribe(
            async function (status) {

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


                    debug(
                        "Presence subscribed"
                    );


                    await publishPresence();


                    processPresence();

                }

            }
        );

    }


    /* =========================================================
       PUBLISH PRESENCE
    ========================================================= */

    async function publishPresence() {

        if (
            !presenceChannel ||
            !currentUser?.id ||
            !presenceStarted
        ) {

            return;

        }


        const visible =
            document.visibilityState !==
            "hidden";


        const payload = {

            user_id:
                currentUser.id,

            online:
                visible &&
                showActivity,

            show_activity:
                showActivity,

            last_seen:
                new Date().toISOString()

        };


        try {

            await presenceChannel.track(
                payload
            );


            debug(
                "Presence published:",
                payload
            );


            processPresence();

        } catch (error) {

            debug(
                "Presence publish error:",
                error
            );

        }

    }


    /* =========================================================
       PROCESS PRESENCE
    ========================================================= */

    function processPresence() {

        if (!presenceChannel) {

            return;

        }


        try {

            const state =
                presenceChannel.presenceState();


            lastPresenceState =
                state;


            window.WFESC_ACTIVITY_STATE =
                state;


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
                "Presence state:",
                state
            );

        } catch (error) {

            debug(
                "processPresence error:",
                error
            );

        }

    }


    /* =========================================================
       GET RAW PRESENCE ENTRY
    ========================================================= */

    function getPresenceEntry(
        userId
    ) {

        if (!presenceChannel || !userId) {

            return null;

        }


        let state;


        try {

            state =
                presenceChannel.presenceState();

        } catch (error) {

            return null;

        }


        const entries =
            state[
                String(userId)
            ] ||
            [];


        if (!entries.length) {

            return null;

        }


        return (
            entries[
                entries.length - 1
            ] ||
            null
        );

    }


    /* =========================================================
       GET USER ACTIVITY
    ========================================================= */

    function getUserActivity(
        userId
    ) {

        if (!userId) {

            return {

                online: false,

                disabled: false,

                show_activity: true,

                last_seen: null

            };

        }


        /*
         * إذا كنا نعرف أن الشخص محظور
         * بأي اتجاه، لا نرجع نشاطه.
         */

        const cachedBlock =
            getCachedActivityBlock(
                userId
            );


        if (
            cachedBlock &&
            (
                cachedBlock.blocked ||
                cachedBlock.blockedBy
            )
        ) {

            return {

                online: false,

                disabled: true,

                show_activity: false,

                last_seen: null,

                blocked: true

            };

        }


        /*
         * إذا بعدنا ما فحصنا الحظر،
         * نبدأ فحصًا بالخلفية بدون تعطيل
         * الواجهة المتزامنة.
         */

        if (!cachedBlock) {

            refreshActivityBlockState(
                userId
            )
            .then(
                function () {

                    window.dispatchEvent(
                        new CustomEvent(
                            "wfesc:activity-sync",
                            {
                                detail: {

                                    userId:
                                        userId,

                                    blockRefresh:
                                        true

                                }
                            }
                        )
                    );

                }
            )
            .catch(
                function () {}
            );

        }


        /*
         * لا توجد قناة بعد.
         */

        if (!presenceChannel) {

            return {

                online: false,

                disabled: false,

                show_activity: true,

                last_seen: null

            };

        }


        const latest =
            getPresenceEntry(
                userId
            );


        if (!latest) {

            return {

                online: false,

                disabled: false,

                show_activity: true,

                last_seen: null

            };

        }


        const lastSeen =
            latest.last_seen ||
            null;


        const timestamp =
            lastSeen
                ? new Date(
                    lastSeen
                ).getTime()
                : 0;


        const recent =
            timestamp > 0 &&
            (
                Date.now() -
                timestamp
            ) <=
            OFFLINE_AFTER;


        /*
         * المستخدم أخفى نشاطه.
         */

        if (
            latest.show_activity ===
            false
        ) {

            return {

                online: false,

                disabled: true,

                show_activity: false,

                last_seen:
                    lastSeen

            };

        }


        return {

            online:
                latest.online === true &&
                recent,

            disabled:
                false,

            show_activity:
                true,

            last_seen:
                lastSeen

        };

    }


    /* =========================================================
       IS USER ONLINE
    ========================================================= */

    function isUserOnline(
        userId
    ) {

        const activity =
            getUserActivity(
                userId
            );


        return (
            activity.online === true
        );

    }


    /* =========================================================
       GET ACTIVITY TEXT
    ========================================================= */

    function getActivityText(
        userId
    ) {

        const activity =
            getUserActivity(
                userId
            );


        /*
         * مخفي بسبب الحظر
         * أو بسبب إعداد المستخدم.
         */

        if (
            activity.blocked === true ||
            activity.disabled === true ||
            activity.show_activity === false
        ) {

            return "عدم النشاط";

        }


        if (
            activity.online === true
        ) {

            return "متصل الآن";

        }


        if (
            !activity.last_seen
        ) {

            return "غير متصل";

        }


        const timestamp =
            new Date(
                activity.last_seen
            ).getTime();


        if (
            !Number.isFinite(
                timestamp
            )
        ) {

            return "غير متصل";

        }


        const diff =
            Date.now() -
            timestamp;


        if (
            diff <
            60000
        ) {

            return "كان نشطًا للتو";

        }


        const minutes =
            Math.floor(
                diff /
                60000
            );


        if (
            minutes <
            60
        ) {

            return (
                "كان نشطًا قبل " +
                minutes +
                " دقيقة"
            );

        }


        const hours =
            Math.floor(
                minutes /
                60
            );


        if (
            hours <
            24
        ) {

            return (
                "كان نشطًا قبل " +
                hours +
                " ساعة"
            );

        }


        const days =
            Math.floor(
                hours /
                24
            );


        return (
            "كان نشطًا قبل " +
            days +
            " يوم"
        );

    }


    /* =========================================================
       ACTIVITY SYNC EVENT
    ========================================================= */

    function dispatchActivitySync() {

        try {

            processPresence();

        } catch (error) {}

    }


    /* =========================================================
       VISIBILITY
    ========================================================= */

    function setupVisibility() {

        if (visibilityReady) {

            return;

        }


        visibilityReady =
            true;


        document.addEventListener(
            "visibilitychange",
            async function () {

                debug(
                    "Visibility:",
                    document.visibilityState
                );


                await publishPresence();


                processPresence();

            }
        );


        window.addEventListener(
            "focus",
            async function () {

                await publishPresence();


                processPresence();

            }
        );


        window.addEventListener(
            "blur",
            async function () {

                await publishPresence();


                processPresence();

            }
        );

    }


    /* =========================================================
       HEARTBEAT
    ========================================================= */

    function startHeartbeat() {

        if (heartbeatTimer) {

            clearInterval(
                heartbeatTimer
            );

        }


        heartbeatTimer =
            setInterval(
                async function () {

                    await publishPresence();


                    processPresence();

                },
                HEARTBEAT_TIME
            );

    }


    /* =========================================================
       ACTIVITY REQUEST
    ========================================================= */

    window.addEventListener(
        "wfesc:activity-request",
        function () {

            window.dispatchEvent(
                new CustomEvent(
                    "wfesc:activity-response",
                    {
                        detail: {

                            state:
                                lastPresenceState,

                            currentUser:
                                currentUser,

                            showActivity:
                                showActivity

                        }
                    }
                )
            );

        }
    );


    /* =========================================================
       AUTH CLEANUP
    ========================================================= */

    async function cleanupPresence() {

        const supabaseClient =
            getClient();


        if (
            heartbeatTimer
        ) {

            clearInterval(
                heartbeatTimer
            );


            heartbeatTimer =
                null;

        }


        if (
            presenceChannel &&
            supabaseClient
        ) {

            try {

                await presenceChannel.untrack();

            } catch (error) {}


            try {

                await supabaseClient.removeChannel(
                    presenceChannel
                );

            } catch (error) {}

        }


        presenceChannel =
            null;


        presenceStarted =
            false;


        lastPresenceState =
            null;


        activityBlockCache.clear();

    }


    /* =========================================================
       AUTH STATE
    ========================================================= */

    function setupAuthListener() {

        const supabaseClient =
            getClient();


        if (
            !supabaseClient ||
            !supabaseClient.auth
        ) {

            return;

        }


        if (
            window.__WFESC_ACTIVITY_AUTH_LISTENER__
        ) {

            return;

        }


        window.__WFESC_ACTIVITY_AUTH_LISTENER__ =
            true;


        supabaseClient.auth.onAuthStateChange(
            async function (
                event,
                session
            ) {

                debug(
                    "Auth event:",
                    event
                );


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    await cleanupPresence();


                    currentUser =
                        null;


                    showActivity =
                        true;


                    updateSwitchUI();


                    return;

                }


                if (
                    event ===
                        "SIGNED_IN" ||
                    event ===
                        "INITIAL_SESSION" ||
                    event ===
                        "TOKEN_REFRESHED"
                ) {

                    const sessionUser =
                        session?.user ||
                        null;


                    if (
                        sessionUser
                    ) {

                        const previousId =
                            currentUser?.id ||
                            null;


                        currentUser =
                            sessionUser;


                        /*
                         * إذا تغير المستخدم،
                         * نعيد بناء Presence بالكامل.
                         */

                        if (
                            previousId &&
                            previousId !==
                                currentUser.id
                        ) {

                            await cleanupPresence();

                        }


                        await loadSetting();


                        await startPresence();


                        processPresence();

                    } else {

                        await loadUser();


                        if (currentUser) {

                            await loadSetting();


                            await startPresence();


                            processPresence();

                        }

                    }

                }

            }
        );

    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    async function initialize() {

        if (initialized) {

            return;

        }


        initialized =
            true;


        debug(
            "Initializing activity..."
        );


        setupUI();


        setupGlobalActivityClick();


        setupVisibility();


        startHeartbeat();


        const supabaseClient =
            getClient();


        if (!supabaseClient) {

            debug(
                "No Supabase client available"
            );


            return;

        }


        setupAuthListener();


        await loadUser();


        if (!currentUser) {

            debug(
                "No authenticated user"
            );


            return;

        }


        await loadSetting();


        await startPresence();


        processPresence();


        debug(
            "Activity initialized successfully"
        );

    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESC_MESSAGES_ACTIVITY = {

        getCurrentUser() {

            return currentUser;

        },


        isActivityVisible() {

            return showActivity;

        },


        async setActivityVisible(
            value
        ) {

            return await saveSetting(
                Boolean(value)
            );

        },


        async toggleActivity() {

            return await toggleActivity();

        },


        openActivityModal() {

            openActivityModal();

        },


        closeActivityModal() {

            closeActivityModalInternal();

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

            if (!presenceChannel) {

                return {};

            }


            try {

                return presenceChannel.presenceState();

            } catch (error) {

                return {};

            }

        },


        async refresh() {

            await publishPresence();


            processPresence();

        },


        async refreshBlockState(
            userId
        ) {

            return await refreshActivityBlockState(
                userId
            );

        },


        clearBlockCache() {

            activityBlockCache.clear();

        }

    };


    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                initialize();

            },
            {
                once:
                    true
            }
        );

    } else {

        initialize();

    }

})();
