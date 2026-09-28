/* =========================================================
   WFESC MESSAGES — NOTIFICATIONS
   الملف: messages/messages-notifications.js

   المسؤوليات:
   - إشعارات المحادثات
   - كتم / إلغاء كتم المحادثة الحالية
   - زر 🔔 / 🔕 في رأس المحادثة
   - حفظ حالة الكتم في conversation_members.muted
   - استقبال الرسائل الجديدة عبر Supabase Realtime
   - تشغيل صوت عند وصول رسالة جديدة
   - عدم التنبيه داخل المحادثة المفتوحة نفسها
   - عدم التنبيه للمحادثات المكتومة
   - مزامنة حالة زر الإشعارات مع المحادثة الحالية

   لا يعدل:
   - messages-core.js
   - messages-chat-actions.js
   - messages-chat-header.js
   - messages-send.js
   - messages-settings.js

========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CORE
    ========================================================= */

    function getCore() {

        return (
            window.WFESC_MESSAGES_CORE ||
            null
        );

    }


    function getClient() {

        const core =
            getCore();

        return (
            core?.client ||
            null
        );

    }


    function getCurrentUser() {

        const core =
            getCore();

        if (
            !core ||
            typeof core.getCurrentUser !==
            "function"
        ) {

            return null;

        }

        return core.getCurrentUser();

    }


    function getConversationId() {

        const core =
            getCore();

        if (
            !core ||
            typeof core.getCurrentConversation !==
            "function"
        ) {

            return null;

        }

        const conversation =
            core.getCurrentConversation();


        if (
            conversation == null
        ) {

            return null;

        }


        if (
            typeof conversation ===
            "string"
        ) {

            return conversation;

        }


        if (
            typeof conversation ===
            "object"
        ) {

            return (
                conversation.conversation_id ||
                conversation.id ||
                conversation.currentConversationId ||
                null
            );

        }


        return null;

    }


    /* =========================================================
       CHAT NOTIFICATION BUTTON
    ========================================================= */

    function getNotificationButton() {

        return (
            document.getElementById(
                "chatNotificationButton"
            ) ||

            document.querySelector(
                '[data-chat-notification-button]'
            )
        );

    }


    /* =========================================================
       STATE
    ========================================================= */

    let currentConversationId =
        null;


    let currentMuted =
        false;


    let realtimeChannel =
        null;


    let realtimeStarted =
        false;


    let buttonReady =
        false;


    let loadingMutedState =
        false;


    let changingMutedState =
        false;


    /* =========================================================
       SOUND
    ========================================================= */

    let audioContext =
        null;


    function createNotificationSound() {

        try {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;


            if (
                !AudioContextClass
            ) {

                return null;

            }


            if (!audioContext) {

                audioContext =
                    new AudioContextClass();

            }


            if (
                audioContext.state ===
                "suspended"
            ) {

                audioContext.resume()
                    .catch(() => {});

            }


            return audioContext;

        } catch (error) {

            console.warn(
                "[WFESC NOTIFICATIONS] Audio unavailable:",
                error
            );

            return null;

        }

    }


    function playNotificationSound() {

        const context =
            createNotificationSound();


        if (!context) {
            return;
        }


        try {

            const oscillator =
                context.createOscillator();


            const gain =
                context.createGain();


            oscillator.type =
                "sine";


            oscillator.frequency.setValueAtTime(
                880,
                context.currentTime
            );


            oscillator.frequency.setValueAtTime(
                660,
                context.currentTime + 0.10
            );


            gain.gain.setValueAtTime(
                0.0001,
                context.currentTime
            );


            gain.gain.exponentialRampToValueAtTime(
                0.12,
                context.currentTime + 0.015
            );


            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                context.currentTime + 0.20
            );


            oscillator.connect(
                gain
            );


            gain.connect(
                context.destination
            );


            oscillator.start(
                context.currentTime
            );


            oscillator.stop(
                context.currentTime + 0.22
            );

        } catch (error) {

            console.warn(
                "[WFESC NOTIFICATIONS] Sound failed:",
                error
            );

        }

    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showNotificationToast(
        message
    ) {

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


            toast.dir =
                "rtl";


            toast.style.cssText = `
                position:fixed;

                left:50%;
                top:78px;

                transform:
                    translateX(-50%)
                    translateY(-10px);

                z-index:99999999;

                width:
                    max-content;

                max-width:
                    calc(100vw - 30px);

                padding:
                    10px 15px;

                border-radius:
                    14px;

                background:
                    rgba(20,20,20,.96);

                color:#fff;

                border:
                    1px solid
                    rgba(255,255,255,.10);

                box-shadow:
                    0 12px 40px
                    rgba(0,0,0,.50);

                font-family:
                    inherit;

                font-size:13px;

                font-weight:700;

                text-align:center;

                opacity:0;

                pointer-events:none;

                transition:
                    opacity .18s ease,
                    transform .18s ease;

                backdrop-filter:
                    blur(14px);

                -webkit-backdrop-filter:
                    blur(14px);
            `;


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.style.opacity =
            "1";


        toast.style.transform =
            "translateX(-50%) translateY(0)";


        clearTimeout(
            toast._wfescTimer
        );


        toast._wfescTimer =
            setTimeout(
                () => {

                    toast.style.opacity =
                        "0";


                    toast.style.transform =
                        "translateX(-50%) translateY(-10px)";

                },
                2200
            );

    }


    /* =========================================================
       UPDATE BUTTON UI
    ========================================================= */

    function updateButtonUI(
        muted
    ) {

        const button =
            getNotificationButton();


        if (!button) {
            return;
        }


        const isMuted =
            muted === true;


        button.textContent =
            isMuted
                ? "🔕"
                : "🔔";


        button.setAttribute(
            "aria-label",
            isMuted
                ? "إلغاء كتم إشعارات المحادثة"
                : "كتم إشعارات المحادثة"
        );


        button.setAttribute(
            "title",
            isMuted
                ? "إلغاء كتم إشعارات المحادثة"
                : "كتم إشعارات المحادثة"
        );


        button.dataset.muted =
            isMuted
                ? "true"
                : "false";


        button.classList.toggle(
            "wfesc-chat-notifications-muted",
            isMuted
        );

    }


    /* =========================================================
       OPTIONAL BUTTON STYLE
    ========================================================= */

    function installButtonStyle() {

        const styleId =
            "wfescChatNotificationsStyle";


        if (
            document.getElementById(
                styleId
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            styleId;


        style.textContent = `

            #chatNotificationButton {
                transition:
                    transform .15s ease,
                    opacity .15s ease;
            }

            #chatNotificationButton:active {
                transform:
                    scale(.90);
            }

            #chatNotificationButton
            .wfesc-chat-notifications-muted {
                opacity:.82;
            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =========================================================
       READ MUTED STATE
    ========================================================= */

    async function loadMutedState(
        conversationId
    ) {

        const client =
            getClient();


        const user =
            getCurrentUser();


        if (
            !client ||
            !user ||
            !conversationId
        ) {

            currentMuted =
                false;

            updateButtonUI(
                false
            );

            return false;

        }


        if (
            loadingMutedState
        ) {

            return currentMuted;

        }


        loadingMutedState =
            true;


        try {

            const {
                data,
                error
            } =
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
                        user.id
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            currentMuted =
                data?.muted === true;


            updateButtonUI(
                currentMuted
            );


            return currentMuted;

        } catch (error) {

            console.error(
                "[WFESC NOTIFICATIONS] Failed to load muted state:",
                error
            );


            currentMuted =
                false;


            updateButtonUI(
                false
            );


            return false;

        } finally {

            loadingMutedState =
                false;

        }

    }


    /* =========================================================
       SAVE MUTED STATE
    ========================================================= */

    async function setMuted(
        conversationId,
        muted
    ) {

        const client =
            getClient();


        const user =
            getCurrentUser();


        if (
            !client ||
            !user ||
            !conversationId
        ) {

            throw new Error(
                "بيانات كتم الإشعارات غير متوفرة"
            );

        }


        const {
            error
        } =
            await client
                .from(
                    "conversation_members"
                )
                .update({

                    muted:
                        muted === true

                })
                .eq(
                    "conversation_id",
                    conversationId
                )
                .eq(
                    "user_id",
                    user.id
                );


        if (error) {
            throw error;
        }


        currentMuted =
            muted === true;


        updateButtonUI(
            currentMuted
        );


        return currentMuted;

    }


    /* =========================================================
       TOGGLE MUTE
    ========================================================= */

    async function toggleMute() {

        if (
            changingMutedState
        ) {

            return;

        }


        const conversationId =
            getConversationId();


        if (!conversationId) {

            showNotificationToast(
                "لا توجد محادثة مفتوحة"
            );

            return;

        }


        const nextMuted =
            !currentMuted;


        changingMutedState =
            true;


        const button =
            getNotificationButton();


        if (button) {

            button.disabled =
                true;

        }


        try {

            await setMuted(
                conversationId,
                nextMuted
            );


            if (nextMuted) {

                showNotificationToast(
                    "تم كتم إشعارات هذه المحادثة"
                );

            } else {

                showNotificationToast(
                    "تم إلغاء كتم إشعارات هذه المحادثة"
                );

            }

        } catch (error) {

            console.error(
                "[WFESC NOTIFICATIONS] Toggle mute failed:",
                error
            );


            showNotificationToast(
                "تعذر تغيير إعدادات الإشعارات"
            );


            /*
             * إعادة القراءة من قاعدة البيانات
             * حتى لا تبقى الواجهة بحالة خاطئة.
             */

            await loadMutedState(
                conversationId
            );

        } finally {

            changingMutedState =
                false;


            if (button) {

                button.disabled =
                    false;

            }

        }

    }


    /* =========================================================
       BUTTON SETUP
    ========================================================= */

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

            buttonReady =
                true;

            return true;

        }


        button.dataset.wfescNotificationsReady =
            "true";


        buttonReady =
            true;


        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                event.stopPropagation();

                await toggleMute();

            }
        );


        installButtonStyle();


        updateButtonUI(
            currentMuted
        );


        return true;

    }


    /* =========================================================
       WAIT FOR BUTTON
    ========================================================= */

    function watchForButton() {

        if (
            setupButton()
        ) {

            return;

        }


        let attempts =
            0;


        const timer =
            setInterval(
                () => {

                    attempts++;


                    if (
                        setupButton() ||
                        attempts >= 60
                    ) {

                        clearInterval(
                            timer
                        );

                    }

                },
                250
            );

    }


    /* =========================================================
       MESSAGE HELPERS
    ========================================================= */

    function getMessageConversationId(
        message
    ) {

        return (
            message?.conversation_id ||
            message?.conversationId ||
            message?.conversation?.id ||
            null
        );

    }


    function getMessageSenderId(
        message
    ) {

        return (
            message?.sender_id ||
            message?.senderId ||
            message?.user_id ||
            message?.userId ||
            message?.sender?.id ||
            null
        );

    }


    function getMessageContent(
        message
    ) {

        return (
            message?.content ||
            message?.message ||
            ""
        );

    }


    /* =========================================================
       CHECK CURRENT CHAT
    ========================================================= */

    function isInsideSameConversation(
        conversationId
    ) {

        const currentId =
            getConversationId();


        if (
            !currentId ||
            !conversationId
        ) {

            return false;

        }


        return (
            String(currentId) ===
            String(conversationId)
        );

    }


    /* =========================================================
       CHECK MESSAGE FROM CURRENT USER
    ========================================================= */

    function isOwnMessage(
        message
    ) {

        const user =
            getCurrentUser();


        const senderId =
            getMessageSenderId(
                message
            );


        if (
            !user?.id ||
            !senderId
        ) {

            return false;

        }


        return (
            String(user.id) ===
            String(senderId)
        );

    }


    /* =========================================================
       READ MUTED STATE FOR ANY CONVERSATION
    ========================================================= */

    async function isConversationMuted(
        conversationId,
        userId
    ) {

        const client =
            getClient();


        if (
            !client ||
            !conversationId ||
            !userId
        ) {

            return false;

        }


        try {

            const {
                data,
                error
            } =
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


            if (error) {

                console.warn(
                    "[WFESC NOTIFICATIONS] Muted check failed:",
                    error
                );


                return false;

            }


            return (
                data?.muted === true
            );

        } catch (error) {

            console.warn(
                "[WFESC NOTIFICATIONS] Muted check exception:",
                error
            );


            return false;

        }

    }


    /* =========================================================
       GET SENDER NAME
    ========================================================= */

    function getSenderName(
        message
    ) {

        const contact =
            message?.sender ||
            message?.profile ||
            message?.user ||
            null;


        return (
            contact?.display_name ||
            contact?.full_name ||
            contact?.name ||
            contact?.username ||
            "رسالة جديدة"
        );

    }


    /* =========================================================
       SHOW NEW MESSAGE NOTIFICATION
    ========================================================= */

    function notifyNewMessage(
        message
    ) {

        const conversationId =
            getMessageConversationId(
                message
            );


        if (!conversationId) {
            return;
        }


        if (
            isOwnMessage(
                message
            )
        ) {

            return;
        }


        /*
         * إذا كان المستخدم داخل نفس المحادثة
         * لا نريد صوت أو إشعار إضافي.
         */

        if (
            isInsideSameConversation(
                conversationId
            )
        ) {

            return;
        }


        /*
         * لا نتحقق من currentMuted هنا
         * لأن الرسالة قد تكون في محادثة ثانية.
         * يتم فحص muted لتلك المحادثة تحديداً.
         */

        const user =
            getCurrentUser();


        if (!user?.id) {
            return;
        }


        isConversationMuted(
            conversationId,
            user.id
        )
        .then(
            muted => {

                if (muted) {
                    return;
                }


                /*
                 * قد يكون المستخدم دخل المحادثة
                 * أثناء انتظار استعلام muted.
                 */

                if (
                    isInsideSameConversation(
                        conversationId
                    )
                ) {

                    return;
                }


                playNotificationSound();


                const senderName =
                    getSenderName(
                        message
                    );


                const content =
                    getMessageContent(
                        message
                    );


                if (
                    document.visibilityState ===
                    "hidden"
                ) {

                    showNotificationToast(
                        "رسالة جديدة من " +
                        senderName
                    );

                } else {

                    showNotificationToast(
                        "رسالة جديدة من " +
                        senderName +
                        (
                            content
                                ? ": " +
                                  String(
                                      content
                                  ).slice(
                                      0,
                                      55
                                  )
                                : ""
                        )
                    );

                }

            }
        )
        .catch(
            error => {

                console.warn(
                    "[WFESC NOTIFICATIONS] Notification check failed:",
                    error
                );

            }
        );

    }


    /* =========================================================
       REALTIME MESSAGE CHANNEL
    ========================================================= */

    async function setupRealtime() {

        const client =
            getClient();


        if (!client) {

            return false;

        }


        if (
            realtimeStarted &&
            realtimeChannel
        ) {

            return true;

        }


        if (
            realtimeChannel
        ) {

            try {

                await client.removeChannel(
                    realtimeChannel
                );

            } catch (_) {}

            realtimeChannel =
                null;

        }


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
                    payload => {

                        const message =
                            payload?.new ||
                            payload?.record ||
                            null;


                        if (!message) {
                            return;
                        }


                        notifyNewMessage(
                            message
                        );

                    }
                );


        realtimeChannel.subscribe(
            status => {

                if (
                    status ===
                    "SUBSCRIBED"
                ) {

                    realtimeStarted =
                        true;


                    console.log(
                        "[WFESC] Message notifications Realtime connected"
                    );

                } else {

                    console.warn(
                        "[WFESC NOTIFICATIONS] Realtime:",
                        status
                    );

                }

            }
        );


        return true;

    }


    /* =========================================================
       CONVERSATION CHANGE
    ========================================================= */

    async function refreshForCurrentConversation() {

        const conversationId =
            getConversationId();


        currentConversationId =
            conversationId ||
            null;


        if (!conversationId) {

            currentMuted =
                false;


            updateButtonUI(
                false
            );


            return;

        }


        await loadMutedState(
            conversationId
        );

    }


    /* =========================================================
       CORE HEADER EVENT
    ========================================================= */

    window.addEventListener(
        "wfesc:chat-header-refresh",
        () => {

            refreshForCurrentConversation();

        }
    );


    /* =========================================================
       PAGE VISIBILITY
    ========================================================= */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible"
            ) {

                refreshForCurrentConversation();

            }

        }
    );


    /* =========================================================
       WINDOW FOCUS
    ========================================================= */

    window.addEventListener(
        "focus",
        () => {

            refreshForCurrentConversation();

        }
    );


    /* =========================================================
       AUTH CHANGE SUPPORT
    ========================================================= */

    window.addEventListener(
        "wfesc:auth-ready",
        () => {

            setupRealtime();

            refreshForCurrentConversation();

        }
    );


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESC_MESSAGES_NOTIFICATIONS = {

        getConversationId,

        isMuted() {

            return currentMuted;

        },

        async loadMutedState(
            conversationId
        ) {

            return await loadMutedState(
                conversationId ||
                getConversationId()
            );

        },

        async setMuted(
            muted
        ) {

            const conversationId =
                getConversationId();


            if (!conversationId) {

                throw new Error(
                    "لا توجد محادثة مفتوحة"
                );

            }


            return await setMuted(
                conversationId,
                muted
            );

        },

        async toggleMute() {

            return await toggleMute();

        },

        async refresh() {

            return await refreshForCurrentConversation();

        },

        playSound() {

            playNotificationSound();

        },

        notifyNewMessage,

        setupRealtime

    };


    /* =========================================================
       START
    ========================================================= */

    function start() {

        watchForButton();

        installButtonStyle();


        /*
         * محاولة مباشرة إذا كان Core جاهزاً.
         */

        setTimeout(
            () => {

                setupRealtime();

                refreshForCurrentConversation();

            },
            0
        );


        /*
         * محاولة ثانية بعد اكتمال بقية الموديولات.
         */

        setTimeout(
            () => {

                setupButton();

                setupRealtime();

                refreshForCurrentConversation();

            },
            300
        );


        /*
         * محاولة ثالثة للتأكد من الجاهزية.
         */

        setTimeout(
            () => {

                setupButton();

                setupRealtime();

                refreshForCurrentConversation();

            },
            1000
        );

    }


    start();


    console.log(
        "[WFESC] messages-notifications.js loaded"
    );


})();
