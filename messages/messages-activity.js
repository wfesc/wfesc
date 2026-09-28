/* =========================================================
   WFESC MESSAGES ACTIVITY
   messages/messages-activity.js

   المسؤول عن:
   - زر النشاط
   - نافذة النشاط
   - Animation
   - تشغيل / إيقاف النشاط
   - حفظ الإعداد
   - Supabase Presence
   - Online / Offline
   - last seen داخل Presence
   - أحداث التواصل مع بقية ملفات الرسائل

   لا يعدل messages-core.js
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const ACTIVITY_DEBUG = true;

    const ACTIVITY_TABLE = "profiles";

    const ACTIVITY_FIELD = "show_activity";

    const ACTIVITY_CHANNEL =
        "wfesc-activity-presence";

    const HEARTBEAT_TIME =
        30000;

    const OFFLINE_AFTER =
        70000;


    /* =====================================================
       STATE
    ===================================================== */

    let client = null;

    let currentUser = null;

    let showActivity = true;

    let activityModal = null;

    let activityButton = null;

    let activitySwitch = null;

    let closeActivityButton = null;

    let presenceChannel = null;

    let presenceStarted = false;

    let heartbeatTimer = null;

    let initialized = false;

    let uiReady = false;

    let visibilityReady = false;


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
       DOM
    ===================================================== */

    function getElements() {

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

        closeActivityButton =
            document.getElementById(
                "closeActivityModal"
            );

    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    function getClient() {

        try {

            if (
                window.WFESCSupabase
            ) {

                return window.WFESCSupabase;

            }


            if (
                window.supabase &&
                typeof window.supabase.createClient ===
                    "function"
            ) {

                return window.supabase.createClient(

                    "https://mcgbzfgbaxwmutniorlw.supabase.co",

                    "sb_publishable_V9RaHJDWmhox-XMzj1SK_w_6p5pAK5L"

                );

            }

        } catch (error) {

            debugError(
                "Supabase:",
                error
            );

        }

        return null;

    }


    /* =====================================================
       USER
    ===================================================== */

    async function loadUser() {

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
                "getUser:",
                error
            );

        }

        return null;

    }


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    function localKey() {

        if (!currentUser) {
            return null;
        }

        return (
            "wfesc_activity_" +
            currentUser.id
        );

    }


    function readLocalSetting() {

        const key =
            localKey();

        if (!key) {
            return null;
        }

        try {

            const value =
                localStorage.getItem(
                    key
                );

            if (
                value === null
            ) {

                return null;

            }

            return value === "true";

        } catch {

            return null;

        }

    }


    function saveLocalSetting(
        value
    ) {

        const key =
            localKey();

        if (!key) {
            return;
        }

        try {

            localStorage.setItem(
                key,
                value ? "true" : "false"
            );

        } catch {}

    }


    /* =====================================================
       UI ANIMATION HELPERS
    ===================================================== */

    function animateElement(
        element,
        animation
    ) {

        if (!element) {
            return;
        }

        element.classList.remove(
            animation
        );

        void element.offsetWidth;

        element.classList.add(
            animation
        );

    }


    function addActivityAnimationStyles() {

        if (
            document.getElementById(
                "wfescActivityAnimations"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfescActivityAnimations";


        style.textContent = `

            /* ================================
               ACTIVITY BUTTON
            ================================= */

            #activityButton{
                transition:
                    transform .22s cubic-bezier(.2,.8,.2,1),
                    opacity .22s ease,
                    filter .22s ease;
            }

            #activityButton.wfesc-activity-click{
                animation:
                    wfescActivityButtonClick
                    .38s
                    cubic-bezier(.2,.8,.2,1);
            }

            @keyframes wfescActivityButtonClick{

                0%{
                    transform:scale(1);
                }

                35%{
                    transform:scale(.84)
                               rotate(-7deg);
                }

                70%{
                    transform:scale(1.08)
                               rotate(4deg);
                }

                100%{
                    transform:scale(1)
                               rotate(0);
                }

            }


            /* ================================
               MODAL
            ================================= */

            #activityModal{
                opacity:0;
                transition:
                    opacity .22s ease;
            }

            #activityModal.show{
                opacity:1;
            }

            #activityModal .modal-card{
                animation:
                    wfescActivityModalIn
                    .32s
                    cubic-bezier(.2,.8,.2,1)
                    both;
            }

            @keyframes wfescActivityModalIn{

                from{
                    opacity:0;
                    transform:
                        translateY(18px)
                        scale(.94);
                }

                60%{
                    opacity:1;
                    transform:
                        translateY(-3px)
                        scale(1.015);
                }

                to{
                    opacity:1;
                    transform:
                        translateY(0)
                        scale(1);
                }

            }


            /* ================================
               SWITCH
            ================================= */

            #activitySwitch{
                transition:
                    background .25s ease,
                    transform .2s ease,
                    box-shadow .25s ease;
            }

            #activitySwitch::after{
                transition:
                    transform .28s
                    cubic-bezier(.2,.8,.2,1),
                    background .25s ease,
                    box-shadow .25s ease;
            }

            #activitySwitch.wfesc-switch-changing{
                animation:
                    wfescSwitchPulse
                    .36s
                    ease;
            }

            #activitySwitch.active{
                box-shadow:
                    0 0 0 5px
                    rgba(154,167,255,.045),
                    0 0 20px
                    rgba(154,167,255,.08);
            }

            @keyframes wfescSwitchPulse{

                0%{
                    transform:scale(1);
                }

                45%{
                    transform:scale(.91);
                }

                100%{
                    transform:scale(1);
                }

            }


            /* ================================
               ACTIVITY BUTTON ICON
            ================================= */

            #activityButton{
                position:relative;
                overflow:hidden;
            }

            #activityButton::after{

                content:"";

                position:absolute;

                width:7px;
                height:7px;

                border-radius:50%;

                background:
                    rgba(54,226,123,.9);

                right:7px;
                top:7px;

                box-shadow:
                    0 0 10px
                    rgba(54,226,123,.55);

                animation:
                    wfescActivityDot
                    2s
                    ease-in-out
                    infinite;

                pointer-events:none;

            }

            @keyframes wfescActivityDot{

                0%,
                100%{
                    opacity:.55;
                    transform:scale(.8);
                }

                50%{
                    opacity:1;
                    transform:scale(1.15);
                }

            }


            /* ================================
               SAVE FEEDBACK
            ================================= */

            #activityModal.wfesc-activity-saving
            .modal-card{

                animation:
                    wfescActivitySaving
                    .42s
                    ease;

            }

            @keyframes wfescActivitySaving{

                0%{
                    transform:scale(1);
                }

                35%{
                    transform:scale(.985);
                }

                70%{
                    transform:scale(1.008);
                }

                100%{
                    transform:scale(1);
                }

            }


            /* ================================
               SUCCESS FLASH
            ================================= */

            #activityModal.wfesc-activity-success
            .modal-card{

                box-shadow:
                    0 20px 70px
                    rgba(0,0,0,.55),
                    0 0 0 1px
                    rgba(54,226,123,.20),
                    0 0 35px
                    rgba(54,226,123,.08);

            }


            /* ================================
               CLOSING
            ================================= */

            #activityModal.wfesc-activity-closing{
                opacity:0;
            }

            #activityModal.wfesc-activity-closing
            .modal-card{

                animation:
                    wfescActivityModalOut
                    .2s
                    ease
                    both;

            }

            @keyframes wfescActivityModalOut{

                from{
                    opacity:1;
                    transform:
                        translateY(0)
                        scale(1);
                }

                to{
                    opacity:0;
                    transform:
                        translateY(10px)
                        scale(.96);
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       ACTIVITY UI
    ===================================================== */

    function updateSwitch() {

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


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openModal() {

        if (!activityModal) {
            return;
        }


        updateSwitch();


        animateElement(
            activityButton,
            "wfesc-activity-click"
        );


        activityModal.classList.remove(
            "wfesc-activity-closing"
        );


        activityModal.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";


        setTimeout(() => {

            if (activitySwitch) {

                activitySwitch.focus({
                    preventScroll:true
                });

            }

        }, 180);

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

        if (!activityModal) {
            return;
        }


        activityModal.classList.add(
            "wfesc-activity-closing"
        );


        setTimeout(() => {

            activityModal.classList.remove(
                "show",
                "wfesc-activity-closing",
                "wfesc-activity-saving",
                "wfesc-activity-success"
            );


            document.body.style.overflow =
                "";

        }, 190);

    }


    /* =====================================================
       LOAD SETTING
    ===================================================== */

    async function loadSetting() {

        if (
            !client ||
            !currentUser
        ) {

            return;

        }


        try {

            const result =
                await client
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
                ] === "boolean"
            ) {

                showActivity =
                    result.data[
                        ACTIVITY_FIELD
                    ];

                saveLocalSetting(
                    showActivity
                );

                updateSwitch();

                return;

            }

        } catch (error) {

            debugError(
                "قراءة النشاط:",
                error
            );

        }


        const local =
            readLocalSetting();


        if (
            typeof local ===
            "boolean"
        ) {

            showActivity =
                local;

        }


        updateSwitch();

    }


    /* =====================================================
       SAVE SETTING
    ===================================================== */

    async function saveSetting(
        value
    ) {

        value =
            Boolean(value);


        showActivity =
            value;


        saveLocalSetting(
            value
        );


        updateSwitch();


        if (
            activityModal
        ) {

            activityModal.classList.add(
                "wfesc-activity-saving"
            );

        }


        if (
            !client ||
            !currentUser
        ) {

            return false;

        }


        try {

            const result =
                await client
                    .from(
                        ACTIVITY_TABLE
                    )
                    .update({

                        [ACTIVITY_FIELD]:
                            value

                    })
                    .eq(
                        "id",
                        currentUser.id
                    );


            if (
                result.error
            ) {

                debug(
                    "تعذر حفظ النشاط:",
                    result.error.message
                );

                return false;

            }


            if (
                activityModal
            ) {

                activityModal.classList.add(
                    "wfesc-activity-success"
                );

            }


            return true;

        } catch (error) {

            debugError(
                "حفظ النشاط:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       TOGGLE
    ===================================================== */

    async function toggleActivity() {

        const newValue =
            !showActivity;


        animateElement(
            activitySwitch,
            "wfesc-switch-changing"
        );


        showActivity =
            newValue;


        updateSwitch();


        await saveSetting(
            newValue
        );


        await publishPresence();


        /*
         * إلغاء Animation الحفظ بعد فترة قصيرة
         */

        setTimeout(() => {

            if (activityModal) {

                activityModal.classList.remove(
                    "wfesc-activity-saving"
                );

            }

        }, 450);

    }


    /* =====================================================
       PRESENCE CHANNEL
    ===================================================== */

    async function createPresence() {

        if (
            !client ||
            !currentUser
        ) {

            return;

        }


        if (
            presenceChannel
        ) {

            return presenceChannel;

        }


        try {

            presenceChannel =
                client.channel(
                    ACTIVITY_CHANNEL,
                    {
                        config:{
                            presence:{
                                key:
                                    currentUser.id
                            }
                        }
                    }
                );


            presenceChannel.on(
                "presence",
                {
                    event:"sync"
                },
                () => {

                    processPresence();

                }
            );


            presenceChannel.on(
                "presence",
                {
                    event:"join"
                },
                () => {

                    processPresence();

                }
            );


            presenceChannel.on(
                "presence",
                {
                    event:"leave"
                },
                () => {

                    processPresence();

                }
            );


            await presenceChannel.subscribe(
                status => {

                    debug(
                        "Presence:",
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


        } catch (error) {

            debugError(
                "Presence:",
                error
            );

            presenceChannel =
                null;

        }

    }


    /* =====================================================
       PUBLISH
    ===================================================== */

    async function publishPresence() {

        if (
            !presenceChannel ||
            !currentUser ||
            !presenceStarted
        ) {

            return;

        }


        try {

            const visible =
                document.visibilityState ===
                "visible";


            const online =
                visible &&
                showActivity;


            await presenceChannel.track({

                user_id:
                    currentUser.id,

                online:
                    online,

                show_activity:
                    showActivity,

                last_seen:
                    new Date().toISOString()

            });


        } catch (error) {

            debugError(
                "publish:",
                error
            );

        }

    }


    /* =====================================================
       PROCESS PRESENCE
    ===================================================== */

    function processPresence() {

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


            window.dispatchEvent(
                new CustomEvent(
                    "wfesc:activity-sync",
                    {
                        detail:{
                            state:
                                state
                        }
                    }
                )
            );


        } catch (error) {

            debugError(
                "processPresence:",
                error
            );

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


            const lastSeen =
                latest &&
                latest.last_seen
                    ? latest.last_seen
                    : null;


            const timestamp =
                lastSeen
                    ? new Date(
                        lastSeen
                    ).getTime()
                    : 0;


            const recent =
                timestamp > 0 &&
                Date.now() -
                    timestamp <=
                    OFFLINE_AFTER;


            return {

                online:
                    latest &&
                    latest.online === true &&
                    latest.show_activity !== false &&
                    recent,

                last_seen:
                    lastSeen

            };

        } catch {

            return {
                online:false,
                last_seen:null
            };

        }

    }


    /* =====================================================
       ONLINE
    ===================================================== */

    function isUserOnline(
        userId
    ) {

        return getUserActivity(
            userId
        ).online;

    }


    /* =====================================================
       LAST SEEN TEXT
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
            !activity.last_seen
        ) {

            return "غير نشط";

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

            return "غير نشط";

        }


        const difference =
            Date.now() -
            timestamp;


        if (
            difference < 60000
        ) {

            return "كان متصلًا الآن";

        }


        const minutes =
            Math.floor(
                difference / 60000
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
                HEARTBEAT_TIME
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
            visibilityReady
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


        visibilityReady =
            true;

    }


    /* =====================================================
       UI EVENTS
    ===================================================== */

    function setupUI() {

        if (
            uiReady
        ) {

            return;

        }


        getElements();


        if (
            activityButton
        ) {

            activityButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openModal();

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
            closeActivityButton
        ) {

            closeActivityButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    closeModal();

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

                        closeModal();

                    }

                }
            );

        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape" &&
                    activityModal &&
                    activityModal.classList.contains(
                        "show"
                    )
                ) {

                    closeModal();

                }

            }
        );


        uiReady =
            true;

    }


    /* =====================================================
       GLOBAL EVENTS
    ===================================================== */

    function setupGlobalEvents() {

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
                            detail:{

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

            const result =
                await saveSetting(
                    Boolean(value)
                );

            await publishPresence();

            return result;

        },


        openActivityModal() {

            openModal();

        },


        closeActivityModal() {

            closeModal();

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

            return publishPresence();

        }

    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        if (
            initialized
        ) {

            return;

        }


        initialized =
            true;


        debug(
            "تشغيل نظام النشاط..."
        );


        getElements();


        /*
         * نضيف Animation من الملف نفسه
         * حتى لا نضطر لتعديل CSS الرئيسي.
         */

        addActivityAnimationStyles();


        setupUI();

        setupGlobalEvents();

        setupVisibility();

        updateSwitch();


        client =
            getClient();


        if (!client) {

            debugError(
                "Supabase client غير موجود."
            );

            return;

        }


        await loadUser();


        if (!currentUser) {

            debug(
                "لا يوجد مستخدم مسجل الدخول."
            );

            return;

        }


        await loadSetting();


        await createPresence();


        startHeartbeat();


        await publishPresence();


        debug(
            "تم تشغيل النشاط بنجاح."
        );

    }


    /* =====================================================
       START
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
