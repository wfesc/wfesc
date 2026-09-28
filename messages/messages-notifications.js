/* =========================================================
   WFESC MESSAGES NOTIFICATIONS
   File: messages/messages-notifications.js

   الوظائف:
   - إشعار عند وصول رسالة جديدة من مستخدم آخر
   - يعمل سواء كنت داخل المحادثة أو خارجها
   - لا يصدر إشعاراً عند إرسال المستخدم لرسالته بنفسه
   - يحترم كتم المحادثة
   - الصوت من ملف خارجي قابل للتغيير
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    /*
     * غيّر اسم الملف فقط إذا أردت تغيير الصوت.
     *
     * مثال:
     * ./messages/sounds/message.mp3
     *
     * أو:
     * ./messages/sounds/notification.wav
     */

    const NOTIFICATION_SOUND =
        "./messages/sounds/message.mp3";


    /*
     * مستوى الصوت:
     *
     * 0.0 = صامت
     * 0.5 = نصف الصوت
     * 1.0 = أعلى مستوى
     */

    const NOTIFICATION_VOLUME = 1.0;


    /* =====================================================
       STATE
    ===================================================== */

    let currentConversationId = null;

    let realtimeChannel = null;

    let realtimeStarted = false;

    let audio = null;

    let audioUnlocked = false;


    /* =====================================================
       HELPERS
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

        return window.supabase || null;

    }


    function getCurrentUserId() {

        const core = getCore();

        if (
            core &&
            core.currentUser &&
            core.currentUser.id
        ) {

            return core.currentUser.id;

        }

        return null;

    }


    function getCurrentConversationId() {

        const core = getCore();

        if (
            core &&
            typeof core.getCurrentConversationId === "function"
        ) {

            return core.getCurrentConversationId();

        }

        if (
            core &&
            core.currentConversationId
        ) {

            return core.currentConversationId;

        }

        return currentConversationId;

    }


    /* =====================================================
       AUDIO
    ===================================================== */

    function prepareAudio() {

        if (audio) {

            return audio;

        }


        audio =
            new Audio(
                NOTIFICATION_SOUND
            );


        audio.preload = "auto";

        audio.volume =
            Math.max(
                0,
                Math.min(
                    1,
                    NOTIFICATION_VOLUME
                )
            );


        return audio;

    }


    /*
     * فتح صلاحية تشغيل الصوت بعد تفاعل المستخدم
     * مع الصفحة.
     */

    function unlockAudio() {

        const sound =
            prepareAudio();


        if (!sound) {

            return;

        }


        if (audioUnlocked) {

            return;

        }


        try {

            sound.muted = true;

            sound.currentTime = 0;

            const promise =
                sound.play();


            if (
                promise &&
                typeof promise.then === "function"
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


    /*
     * تشغيل صوت الإشعار.
     */

    function playNotificationSound() {

        const sound =
            prepareAudio();


        if (!sound) {

            return;

        }


        try {

            sound.pause();

            sound.currentTime = 0;

            sound.volume =
                Math.max(
                    0,
                    Math.min(
                        1,
                        NOTIFICATION_VOLUME
                    )
                );


            const promise =
                sound.play();


            if (
                promise &&
                typeof promise.catch === "function"
            ) {

                promise.catch(function () {

                    /*
                     * المتصفح قد يمنع الصوت
                     * إذا لم يحصل تفاعل مسبق.
                     */

                });

            }

        } catch (error) {

        }

    }


    /*
     * أي تفاعل من المستخدم يفتح إمكانية الصوت.
     */

    function setupAudioUnlock() {

        const events = [
            "click",
            "touchstart",
            "pointerdown",
            "keydown"
        ];


        events.forEach(function (eventName) {

            document.addEventListener(
                eventName,
                unlockAudio,
                {
                    passive: true,
                    once: false,
                    capture: true
                }
            );

        });

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function ensureToastStyle() {

        if (
            document.getElementById(
                "wfescMessageNotificationStyle"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfescMessageNotificationStyle";


        style.textContent = `

            .wfesc-message-notification-toast {

                position: fixed;

                right: 18px;

                bottom: 18px;

                z-index: 999999;

                min-width: 250px;

                max-width: calc(100vw - 36px);

                padding: 13px 16px;

                border-radius: 14px;

                background: #111;

                color: #fff;

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    .12
                );

                box-shadow:
                    0 10px 35px rgba(
                        0,
                        0,
                        0,
                        .45
                    );

                font-family:
                    Arial,
                    Tahoma,
                    sans-serif;

                font-size: 14px;

                direction: rtl;

                opacity: 0;

                transform:
                    translateY(12px);

                transition:
                    opacity .2s ease,
                    transform .2s ease;

                pointer-events: none;

            }


            .wfesc-message-notification-toast.show {

                opacity: 1;

                transform:
                    translateY(0);

            }


            .wfesc-message-notification-toast-title {

                font-weight: 700;

                margin-bottom: 5px;

            }


            .wfesc-message-notification-toast-text {

                opacity: .82;

                white-space: nowrap;

                overflow: hidden;

                text-overflow: ellipsis;

            }


            #chatNotificationButton.wfesc-chat-notifications-muted {

                opacity: .75;

            }

        `;


        document.head.appendChild(style);

    }


    function showNotificationToast(
        senderName,
        messageText
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

            toast.className =
                "wfesc-message-notification-toast";


            document.body.appendChild(
                toast
            );

        }


        const safeSender =
            String(
                senderName ||
                "رسالة جديدة"
            );


        const safeMessage =
            String(
                messageText ||
                "لديك رسالة جديدة"
            );


        toast.innerHTML = `

            <div class="
                wfesc-message-notification-toast-title
            ">
                ${escapeHtml(safeSender)}
            </div>

            <div class="
                wfesc-message-notification-toast-text
            ">
                ${escapeHtml(safeMessage)}
            </div>

        `;


        toast.classList.remove(
            "show"
        );


        requestAnimationFrame(function () {

            toast.classList.add(
                "show"
            );

        });


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


    function escapeHtml(value) {

        return String(value || "")
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


    /* =====================================================
       SENDER NAME
    ===================================================== */

    function getSenderName(message) {

        if (!message) {

            return "رسالة جديدة";

        }


        if (
            message.sender &&
            message.sender.display_name
        ) {

            return message.sender.display_name;

        }


        if (
            message.sender &&
            message.sender.full_name
        ) {

            return message.sender.full_name;

        }


        if (
            message.profile &&
            message.profile.display_name
        ) {

            return message.profile.display_name;

        }


        if (
            message.profile &&
            message.profile.full_name
        ) {

            return message.profile.full_name;

        }


        if (
            message.sender_name
        ) {

            return message.sender_name;

        }


        return "رسالة جديدة";

    }


    /* =====================================================
       MESSAGE TEXT
    ===================================================== */

    function getMessageText(message) {

        if (!message) {

            return "لديك رسالة جديدة";

        }


        if (
            typeof message.content === "string" &&
            message.content.trim()
        ) {

            return message.content;

        }


        return "لديك رسالة جديدة";

    }


    /* =====================================================
       MUTED STATE
    ===================================================== */

    async function isConversationMuted(
        conversationId
    ) {

        const client =
            getClient();


        const userId =
            getCurrentUserId();


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

                return false;

            }


            return result.data?.muted === true;

        } catch (error) {

            return false;

        }

    }


    /* =====================================================
       UPDATE BUTTON
    ===================================================== */

    function getNotificationButton() {

        return document.getElementById(
            "chatNotificationButton"
        );

    }


    function renderMuteButton(
        muted
    ) {

        const button =
            getNotificationButton();


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
                "الإشعارات مفعلة"
            );

        }

    }


    async function loadMuteState() {

        const conversationId =
            getCurrentConversationId();


        currentConversationId =
            conversationId || null;


        if (!conversationId) {

            renderMuteButton(
                false
            );

            return;

        }


        const muted =
            await isConversationMuted(
                conversationId
            );


        /*
         * تأكد أن المستخدم لم ينتقل
         * إلى محادثة ثانية أثناء الطلب.
         */

        if (
            getCurrentConversationId() !==
            conversationId
        ) {

            return;

        }


        renderMuteButton(
            muted
        );

    }


    /* =====================================================
       TOGGLE MUTE
    ===================================================== */

    async function toggleMute() {

        const button =
            getNotificationButton();


        const client =
            getClient();


        const userId =
            getCurrentUserId();


        const conversationId =
            getCurrentConversationId();


        if (
            !button ||
            !client ||
            !userId ||
            !conversationId
        ) {

            return;

        }


        if (
            button.dataset.busy === "true"
        ) {

            return;

        }


        button.dataset.busy =
            "true";


        try {

            const currentMuted =
                await isConversationMuted(
                    conversationId
                );


            const newMuted =
                !currentMuted;


            const result =
                await client
                    .from(
                        "conversation_members"
                    )
                    .update({
                        muted: newMuted
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
                    "WFESC notifications mute error:",
                    result.error
                );

                return;

            }


            renderMuteButton(
                newMuted
            );


        } catch (error) {

            console.error(
                "WFESC notifications toggle error:",
                error
            );

        } finally {

            button.dataset.busy =
                "false";

        }

    }


    /* =====================================================
       CURRENT CONVERSATION SYNC
    ===================================================== */

    function setupConversationSync() {

        document.addEventListener(
            "wfesc:chat-header-refresh",
            function (event) {

                const detail =
                    event?.detail || {};


                currentConversationId =
                    detail.conversationId ||
                    null;


                loadMuteState();

            }
        );


        document.addEventListener(
            "visibilitychange",
            function () {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    loadMuteState();

                }

            }
        );


        window.addEventListener(
            "focus",
            function () {

                loadMuteState();

            }
        );

    }


    /* =====================================================
       NOTIFICATION FILTER
    ===================================================== */

    async function handleIncomingMessage(
        payload
    ) {

        const message =
            payload?.new;


        if (!message) {

            return;

        }


        const userId =
            getCurrentUserId();


        /*
         * لا يوجد مستخدم مسجل.
         */

        if (!userId) {

            return;

        }


        /*
         * إذا الرسالة من نفس المستخدم:
         * لا صوت ولا إشعار.
         */

        if (
            message.sender_id ===
            userId
        ) {

            return;

        }


        const conversationId =
            message.conversation_id;


        if (!conversationId) {

            return;

        }


        /*
         * إذا المحادثة مكتومة:
         * لا صوت ولا إشعار.
         */

        const muted =
            await isConversationMuted(
                conversationId
            );


        if (muted) {

            return;

        }


        /*
         * مهم:
         *
         * حتى إذا المستخدم داخل المحادثة
         * سيتم إصدار الصوت لأن الرسالة
         * جاءت من الطرف الآخر.
         */

        playNotificationSound();


        showNotificationToast(
            getSenderName(message),
            getMessageText(message)
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


        if (
            !client ||
            realtimeStarted
        ) {

            return;

        }


        realtimeStarted =
            true;


        realtimeChannel =
            client
                .channel(
                    "wfesc-message-notifications-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages"
                    },
                    function (payload) {

                        handleIncomingMessage(
                            payload
                        );

                    }
                )
                .subscribe(
                    function (status) {

                        if (
                            status ===
                            "SUBSCRIBED"
                        ) {

                            console.log(
                                "WFESC message notifications realtime: connected"
                            );

                        }

                    }
                );

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    function setupButton() {

        const button =
            getNotificationButton();


        if (!button) {

            return false;

        }


        if (
            button.dataset.wfescNotificationsReady ===
            "true"
        ) {

            return true;

        }


        button.dataset.wfescNotificationsReady =
            "true";


        button.addEventListener(
            "click",
            function () {

                unlockAudio();

                toggleMute();

            }
        );


        return true;

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {

        ensureToastStyle();

        prepareAudio();

        setupAudioUnlock();

        setupButton();

        setupConversationSync();

        loadMuteState();

        startRealtime();

    }


    /* =====================================================
       RETRY DOM
    ===================================================== */

    function boot() {

        initialize();


        setTimeout(
            function () {

                setupButton();

                loadMuteState();

            },
            300
        );


        setTimeout(
            function () {

                setupButton();

                loadMuteState();

            },
            1000
        );


        setTimeout(
            function () {

                setupButton();

                loadMuteState();

            },
            2000
        );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.WFESC_MESSAGES_NOTIFICATIONS = {

        getCurrentConversationId:
            function () {

                return currentConversationId;

            },

        isMuted:
            isConversationMuted,

        toggleMute:
            toggleMute,

        playSound:
            playNotificationSound,

        loadMuteState:
            loadMuteState,

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
            boot,
            {
                once: true
            }
        );

    } else {

        boot();

    }


})();
