/* =========================================================
   WFESC MESSAGES NOTIFICATIONS
   File: messages/messages-notifications.js

   الوظائف:
   - إشعار عند وصول رسالة من مستخدم آخر
   - يعمل داخل المحادثة وخارجها
   - لا يصدر صوتًا لرسائل المستخدم نفسه
   - يحترم كتم المحادثة
   - الصوت من ملف خارجي
   - زر 🔔 / 🔕 يعمل لكل محادثة
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const NOTIFICATION_SOUND =
        "./messages/sounds/message.mp3";

    const NOTIFICATION_VOLUME = 1.0;


    /* =====================================================
       STATE
    ===================================================== */

    let currentConversationId = null;

    let realtimeChannel = null;

    let realtimeStarted = false;

    let audio = null;

    let audioUnlocked = false;

    let initialized = false;


    /* =====================================================
       CORE
    ===================================================== */

    function getCore() {

        return window.WFESC_MESSAGES_CORE || null;

    }


    function getClient() {

        const core = getCore();


        if (
            core &&
            core.client
        ) {

            return core.client;

        }


        if (
            window.WFESCSupabase
        ) {

            return window.WFESCSupabase;

        }


        return null;

    }


    async function getUserId() {

        const core = getCore();


        if (
            core &&
            core.currentUser &&
            core.currentUser.id
        ) {

            return core.currentUser.id;

        }


        const client =
            getClient();


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

                return result.data.user.id;

            }

        } catch (error) {

            console.error(
                "WFESC notifications: getUser error",
                error
            );

        }


        return null;

    }


    function getConversationId() {

        const core = getCore();


        /*
         * الطريقة الأولى:
         * من API الأساسي.
         */

        if (
            core &&
            typeof core.getCurrentConversationId ===
            "function"
        ) {

            const id =
                core.getCurrentConversationId();


            if (id) {

                return id;

            }

        }


        /*
         * الطريقة الثانية:
         * من قيمة الـ API المكشوفة.
         */

        if (
            core &&
            core.currentConversationId
        ) {

            return core.currentConversationId;

        }


        /*
         * الطريقة الثالثة:
         * من chat header.
         */

        const header =
            window.WFESC_MESSAGES_CHAT_HEADER;


        if (
            header &&
            typeof header.getConversationId ===
            "function"
        ) {

            const id =
                header.getConversationId();


            if (id) {

                return id;

            }

        }


        return currentConversationId || null;

    }


    /* =====================================================
       AUDIO
    ===================================================== */

    function createAudio() {

        if (audio) {

            return audio;

        }


        audio =
            new Audio(
                NOTIFICATION_SOUND
            );


        audio.preload = "auto";

        audio.volume =
            NOTIFICATION_VOLUME;


        /*
         * تحميل الملف مسبقًا.
         */

        try {

            audio.load();

        } catch (error) {

            console.warn(
                "WFESC notifications: audio load warning",
                error
            );

        }


        return audio;

    }


    function unlockAudio() {

        const sound =
            createAudio();


        if (
            !sound ||
            audioUnlocked
        ) {

            return;

        }


        /*
         * مجرد تجربة صامتة لفتح صلاحية الصوت.
         */

        try {

            sound.muted = true;

            sound.currentTime = 0;


            const promise =
                sound.play();


            if (
                promise &&
                typeof promise.then ===
                "function"
            ) {

                promise
                    .then(function () {

                        sound.pause();

                        sound.currentTime = 0;

                        sound.muted = false;

                        audioUnlocked = true;

                    })
                    .catch(function () {

                        sound.muted = false;

                    });

            } else {

                sound.pause();

                sound.currentTime = 0;

                sound.muted = false;

                audioUnlocked = true;

            }

        } catch (error) {

            sound.muted = false;

        }

    }


    async function playNotificationSound() {

        const sound =
            createAudio();


        if (!sound) {

            return;

        }


        try {

            sound.pause();

            sound.currentTime = 0;

            sound.volume =
                NOTIFICATION_VOLUME;

            sound.muted = false;


            const promise =
                sound.play();


            if (
                promise &&
                typeof promise.catch ===
                "function"
            ) {

                await promise.catch(
                    function (error) {

                        console.warn(
                            "WFESC notifications: sound blocked",
                            error
                        );

                    }
                );

            }

        } catch (error) {

            console.error(
                "WFESC notifications: sound error",
                error
            );

        }

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function ensureToastStyle() {

        if (
            document.getElementById(
                "wfescNotificationStyle"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfescNotificationStyle";


        style.textContent = `

            #wfescMessageNotificationToast {

                position: fixed;

                right: 18px;

                bottom: 18px;

                z-index: 999999;

                width: min(
                    320px,
                    calc(100vw - 36px)
                );

                padding: 14px 16px;

                border-radius: 15px;

                background: #111;

                color: #fff;

                border: 1px solid
                    rgba(255,255,255,.12);

                box-shadow:
                    0 12px 35px
                    rgba(0,0,0,.45);

                direction: rtl;

                font-family:
                    Arial,
                    Tahoma,
                    sans-serif;

                opacity: 0;

                transform:
                    translateY(15px);

                transition:
                    opacity .2s ease,
                    transform .2s ease;

                pointer-events: none;

            }


            #wfescMessageNotificationToast.show {

                opacity: 1;

                transform:
                    translateY(0);

            }


            #wfescMessageNotificationToast
            .wfesc-notification-title {

                font-weight: 700;

                margin-bottom: 5px;

            }


            #wfescMessageNotificationToast
            .wfesc-notification-message {

                opacity: .82;

                overflow: hidden;

                white-space: nowrap;

                text-overflow: ellipsis;

            }


            #chatNotificationButton
            .wfesc-chat-notifications-muted {

                opacity: .75;

            }


            #chatNotificationButton
            .wfesc-notifications-loading {

                opacity: .55;

            }

        `;


        document.head.appendChild(
            style
        );

    }


    function escapeHtml(value) {

        return String(
            value || ""
        )
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


    function showNotification(
        sender,
        message
    ) {

        ensureToastStyle();


        let toast =
            document.getElementById(
                "wfescMessageNotificationToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "wfescMessageNotificationToast";


            document.body.appendChild(
                toast
            );

        }


        toast.innerHTML = `

            <div class="wfesc-notification-title">
                ${escapeHtml(
                    sender || "رسالة جديدة"
                )}
            </div>

            <div class="wfesc-notification-message">
                ${escapeHtml(
                    message || "لديك رسالة جديدة"
                )}
            </div>

        `;


        toast.classList.remove(
            "show"
        );


        requestAnimationFrame(
            function () {

                toast.classList.add(
                    "show"
                );

            }
        );


        clearTimeout(
            toast.__wfescTimer
        );


        toast.__wfescTimer =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                3500
            );

    }


    /* =====================================================
       MUTED
    ===================================================== */

    async function isMuted(
        conversationId
    ) {

        const client =
            getClient();


        const userId =
            await getUserId();


        if (
            !client ||
            !userId ||
            !conversationId
        ) {

            return false;

        }


        try {

            const result =
                await client
                    .from(
                        "conversation_members"
                    )
                    .select(
                        "muted"
                    )
                    .eq(
                        "conversation_id",
                        conversationId
                    )
                    .eq(
                        "user_id",
                        userId
                    )
                    .maybeSingle();


            if (result.error) {

                console.error(
                    "WFESC notifications: muted check error",
                    result.error
                );

                return false;

            }


            return (
                result.data &&
                result.data.muted === true
            );

        } catch (error) {

            console.error(
                "WFESC notifications: muted check exception",
                error
            );

            return false;

        }

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    function getButton() {

        return document.getElementById(
            "chatNotificationButton"
        );

    }


    function renderButton(
        muted
    ) {

        const button =
            getButton();


        if (!button) {

            return;

        }


        if (muted) {

            button.textContent =
                "🔕";

            button.classList.add(
                "wfesc-chat-notifications-muted"
            );

            button.setAttribute(
                "aria-label",
                "تشغيل إشعارات المحادثة"
            );

            button.setAttribute(
                "title",
                "الإشعارات مكتومة"
            );

        } else {

            button.textContent =
                "🔔";

            button.classList.remove(
                "wfesc-chat-notifications-muted"
            );

            button.setAttribute(
                "aria-label",
                "كتم إشعارات المحادثة"
            );

            button.setAttribute(
                "title",
                "كتم إشعارات المحادثة"
            );

        }

    }


    async function refreshButton() {

        const conversationId =
            getConversationId();


        currentConversationId =
            conversationId || null;


        if (!conversationId) {

            return;

        }


        const muted =
            await isMuted(
                conversationId
            );


        /*
         * لا تغيّر الزر إذا المستخدم
         * انتقل لمحادثة ثانية أثناء الطلب.
         */

        if (
            getConversationId() !==
            conversationId
        ) {

            return;

        }


        renderButton(
            muted
        );

    }


    /* =====================================================
       TOGGLE
    ===================================================== */

    async function toggleMute() {

        const button =
            getButton();


        const client =
            getClient();


        const userId =
            await getUserId();


        const conversationId =
            getConversationId();


        console.log(
            "WFESC notifications toggle:",
            {
                button: !!button,
                client: !!client,
                userId: userId,
                conversationId:
                    conversationId
            }
        );


        if (
            !button ||
            !client ||
            !userId ||
            !conversationId
        ) {

            console.warn(
                "WFESC notifications: toggle requirements missing"
            );

            return;

        }


        if (
            button.dataset.wfescBusy ===
            "true"
        ) {

            return;

        }


        button.dataset.wfescBusy =
            "true";


        try {

            const oldMuted =
                await isMuted(
                    conversationId
                );


            const newMuted =
                !oldMuted;


            const result =
                await client
                    .from(
                        "conversation_members"
                    )
                    .update({
                        muted:
                            newMuted
                    })
                    .eq(
                        "conversation_id",
                        conversationId
                    )
                    .eq(
                        "user_id",
                        userId
                    );


            if (result.error) {

                console.error(
                    "WFESC notifications: mute update error",
                    result.error
                );

                return;

            }


            renderButton(
                newMuted
            );


            console.log(
                "WFESC notifications: mute changed",
                newMuted
            );


        } catch (error) {

            console.error(
                "WFESC notifications: toggle error",
                error
            );

        } finally {

            button.dataset.wfescBusy =
                "false";

        }

    }


    /* =====================================================
       BUTTON EVENT
    ===================================================== */

    function bindButton() {

        const button =
            getButton();


        if (!button) {

            return false;

        }


        if (
            button.dataset.wfescNotificationsBound ===
            "true"
        ) {

            return true;

        }


        button.dataset.wfescNotificationsBound =
            "true";


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();


                unlockAudio();

                toggleMute();

            },
            false
        );


        console.log(
            "WFESC notifications: 🔔 button connected"
        );


        return true;

    }


    /* =====================================================
       CORE EVENTS
    ===================================================== */

    function setupCoreEvents() {

        document.addEventListener(
            "wfesc:chat-header-refresh",
            function (event) {

                const detail =
                    event &&
                    event.detail
                        ? event.detail
                        : {};


                currentConversationId =
                    detail.conversationId ||
                    null;


                setTimeout(
                    function () {

                        bindButton();

                        refreshButton();

                    },
                    0
                );

            }
        );


        document.addEventListener(
            "visibilitychange",
            function () {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    bindButton();

                    refreshButton();

                }

            }
        );


        window.addEventListener(
            "focus",
            function () {

                bindButton();

                refreshButton();

            }
        );

    }


    /* =====================================================
       INCOMING MESSAGE
    ===================================================== */

    async function handleIncomingMessage(
        payload
    ) {

        const message =
            payload &&
            payload.new
                ? payload.new
                : null;


        if (!message) {

            return;

        }


        console.log(
            "WFESC notifications: new message",
            message
        );


        const userId =
            await getUserId();


        if (!userId) {

            return;

        }


        /*
         * رسالة المستخدم نفسه:
         * لا صوت ولا إشعار.
         */

        if (
            String(
                message.sender_id
            ) ===
            String(
                userId
            )
        ) {

            return;

        }


        const conversationId =
            message.conversation_id;


        if (!conversationId) {

            return;

        }


        /*
         * الكتم خاص بالمستلم.
         */

        const muted =
            await isMuted(
                conversationId
            );


        if (muted) {

            console.log(
                "WFESC notifications: conversation muted"
            );

            return;

        }


        /*
         * الرسالة من الطرف الآخر:
         * الصوت يعمل سواء داخل المحادثة
         * أو خارجها.
         */

        await playNotificationSound();


        showNotification(
            "رسالة جديدة",
            message.content ||
            "لديك رسالة جديدة"
        );

    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function stopRealtime() {

        const client =
            getClient();


        if (
            client &&
            realtimeChannel
        ) {

            try {

                client.removeChannel(
                    realtimeChannel
                );

            } catch (error) {

                console.error(
                    "WFESC notifications: remove channel error",
                    error
                );

            }

        }


        realtimeChannel =
            null;

        realtimeStarted =
            false;

    }


    function startRealtime() {

        const client =
            getClient();


        if (!client) {

            console.warn(
                "WFESC notifications: Supabase client not ready"
            );

            return false;

        }


        if (realtimeStarted) {

            return true;

        }


        realtimeStarted =
            true;


        console.log(
            "WFESC notifications: starting realtime..."
        );


        realtimeChannel =
            client
                .channel(
                    "wfesc-message-notifications-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event:
                            "INSERT",
                        schema:
                            "public",
                        table:
                            "messages"
                    },
                    function (payload) {

                        handleIncomingMessage(
                            payload
                        );

                    }
                )
                .subscribe(
                    function (status) {

                        console.log(
                            "WFESC notifications realtime:",
                            status
                        );


                        if (
                            status ===
                            "CHANNEL_ERROR"
                        ) {

                            realtimeStarted =
                                false;

                        }


                        if (
                            status ===
                            "TIMED_OUT"
                        ) {

                            realtimeStarted =
                                false;

                        }

                    }
                );


        return true;

    }


    /* =====================================================
       AUDIO UNLOCK
    ===================================================== */

    function setupAudioUnlock() {

        const events = [
            "click",
            "touchstart",
            "pointerdown",
            "keydown"
        ];


        events.forEach(
            function (eventName) {

                document.addEventListener(
                    eventName,
                    unlockAudio,
                    {
                        passive:
                            true,
                        capture:
                            true
                    }
                );

            }
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        if (initialized) {

            return;

        }


        initialized =
            true;


        console.log(
            "WFESC notifications: initializing..."
        );


        ensureToastStyle();

        createAudio();

        setupAudioUnlock();

        setupCoreEvents();

        bindButton();

        refreshButton();

        startRealtime();


        /*
         * لأن بعض عناصر المحادثة قد تُنشأ
         * بعد تحميل الصفحة.
         */

        const retryTimes = [
            300,
            700,
            1200,
            2000,
            3500
        ];


        retryTimes.forEach(
            function (delay) {

                setTimeout(
                    function () {

                        bindButton();

                        refreshButton();

                        startRealtime();

                    },
                    delay
                );

            }
        );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.WFESC_MESSAGES_NOTIFICATIONS = {

        getConversationId:
            getConversationId,

        isMuted:
            isMuted,

        toggleMute:
            toggleMute,

        refresh:
            refreshButton,

        playSound:
            playNotificationSound,

        startRealtime:
            startRealtime,

        stopRealtime:
            stopRealtime

    };


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
                once:
                    true
            }
        );

    } else {

        initialize();

    }


})();
