/* =========================================================
   WFESC MESSAGES NOTIFICATIONS
   File: messages/messages-notifications.js
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const NOTIFICATION_SOUND =
        "./messages/sounds/message.mp3";

    const NOTIFICATION_VOLUME = 1.0;

    const MAX_NOTIFICATIONS = 50;

    const MUTE_CACHE_TTL = 30000;


    /* =====================================================
       STATE
    ===================================================== */

    let audio = null;

    let audioUnlocked = false;

    let realtimeChannel = null;

    let realtimeStarted = false;

    let notifications = [];

    let notificationPanel = null;

    let conversationNotice = null;

    let cachedUser = null;

    let cachedUserPromise = null;

    /*
     * conversationId -> {
     *   muted: boolean,
     *   loadedAt: number
     * }
     */
    const muteCache = new Map();

    let buttonDelegationStarted = false;

    let bootStarted = false;


    /* =====================================================
       SUPABASE
    ===================================================== */

    function getClient() {

        const core =
            window.WFESC_MESSAGES_CORE;

        if (
            core &&
            core.client &&
            typeof core.client.from === "function"
        ) {

            return core.client;

        }


        if (
            window.WFESCSupabase &&
            typeof window.WFESCSupabase.from === "function"
        ) {

            return window.WFESCSupabase;

        }


        return null;

    }


    /* =====================================================
       USER
    ===================================================== */

    async function getUser() {

        if (cachedUser) {

            return cachedUser;

        }


        if (cachedUserPromise) {

            return cachedUserPromise;

        }


        const client =
            getClient();


        if (!client) {

            return null;

        }


        cachedUserPromise =
            (async function () {

                try {

                    const result =
                        await client.auth.getUser();


                    if (
                        result &&
                        result.data &&
                        result.data.user
                    ) {

                        cachedUser =
                            result.data.user;

                        return cachedUser;

                    }

                } catch (error) {

                    console.error(
                        "WFESC NOTIFICATIONS: getUser error",
                        error
                    );

                }


                return null;

            })();


        try {

            return await cachedUserPromise;

        } finally {

            cachedUserPromise =
                null;

        }

    }


    /* =====================================================
       AUTH CHANGE
    ===================================================== */

    function setupAuthListener() {

        const client =
            getClient();


        if (
            !client ||
            !client.auth ||
            typeof client.auth.onAuthStateChange !== "function"
        ) {

            return;

        }


        if (
            window.__WFESC_NOTIFICATIONS_AUTH_LISTENER__
        ) {

            return;

        }


        window.__WFESC_NOTIFICATIONS_AUTH_LISTENER__ =
            true;


        client.auth.onAuthStateChange(
            function (
                event,
                session
            ) {

                if (
                    session &&
                    session.user
                ) {

                    cachedUser =
                        session.user;

                } else {

                    cachedUser =
                        null;

                    muteCache.clear();

                }

            }
        );

    }


    /* =====================================================
       CURRENT CONVERSATION
    ===================================================== */

    function getConversationId() {

        const core =
            window.WFESC_MESSAGES_CORE;


        const header =
            window.WFESC_MESSAGES_CHAT_HEADER;


        /*
         * أولاً من chat header
         */

        if (
            header &&
            typeof header.getConversationId === "function"
        ) {

            try {

                const id =
                    header.getConversationId();

                if (id) {

                    return id;

                }

            } catch (error) {

                console.warn(
                    "WFESC NOTIFICATIONS: header conversation error",
                    error
                );

            }

        }


        /*
         * من core chatHeader
         */

        if (
            core &&
            core.chatHeader &&
            typeof core.chatHeader.getConversationId === "function"
        ) {

            try {

                const id =
                    core.chatHeader.getConversationId();

                if (id) {

                    return id;

                }

            } catch (error) {}

        }


        /*
         * من getter
         */

        if (
            core &&
            typeof core.getCurrentConversationId === "function"
        ) {

            try {

                const id =
                    core.getCurrentConversationId();

                if (id) {

                    return id;

                }

            } catch (error) {}

        }


        /*
         * من property
         */

        if (
            core &&
            core.currentConversationId
        ) {

            return core.currentConversationId;

        }


        return null;

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


        audio.preload =
            "auto";

        audio.volume =
            NOTIFICATION_VOLUME;


        audio.addEventListener(
            "error",
            function (event) {

                console.error(
                    "WFESC NOTIFICATIONS: audio error",
                    event,
                    NOTIFICATION_SOUND
                );

            }
        );


        return audio;

    }


    function unlockAudio() {

        const sound =
            createAudio();


        if (!sound) {

            return;

        }


        if (audioUnlocked) {

            return;

        }


        try {

            sound.muted =
                true;

            sound.currentTime =
                0;


            const promise =
                sound.play();


            if (
                promise &&
                typeof promise.then === "function"
            ) {

                promise
                    .then(function () {

                        sound.pause();

                        sound.currentTime =
                            0;

                        sound.muted =
                            false;

                        audioUnlocked =
                            true;

                    })
                    .catch(function () {

                        sound.muted =
                            false;

                    });

            }

        } catch (error) {

            sound.muted =
                false;

        }

    }


    function playSound() {

        const sound =
            createAudio();


        if (!sound) {

            return;

        }


        try {

            sound.pause();

            sound.currentTime =
                0;

            sound.volume =
                NOTIFICATION_VOLUME;

            sound.muted =
                false;


            const promise =
                sound.play();


            if (
                promise &&
                typeof promise.catch === "function"
            ) {

                promise.catch(function (error) {

                    console.warn(
                        "WFESC NOTIFICATIONS: sound blocked by browser",
                        error
                    );

                });

            }

        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: playSound error",
                error
            );

        }

    }


    /* =====================================================
       MUTE CACHE
    ===================================================== */

    function getCachedMute(
        conversationId
    ) {

        if (!conversationId) {

            return null;

        }


        const item =
            muteCache.get(
                String(conversationId)
            );


        if (!item) {

            return null;

        }


        if (
            Date.now() -
            item.loadedAt >
            MUTE_CACHE_TTL
        ) {

            muteCache.delete(
                String(conversationId)
            );

            return null;

        }


        return item.muted === true;

    }


    function setCachedMute(
        conversationId,
        muted
    ) {

        if (!conversationId) {

            return;

        }


        muteCache.set(
            String(conversationId),
            {
                muted:
                    muted === true,

                loadedAt:
                    Date.now()
            }
        );

    }


    async function loadMuteFromDatabase(
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

            const result =
                await client
                    .from("conversation_members")
                    .select("muted")
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
                    "WFESC NOTIFICATIONS: mute read error",
                    result.error
                );

                return false;

            }


            const muted =
                !!(
                    result.data &&
                    result.data.muted === true
                );


            setCachedMute(
                conversationId,
                muted
            );


            return muted;

        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: mute exception",
                error
            );

            return false;

        }

    }


    async function getMuted(
        conversationId,
        userId
    ) {

        const cached =
            getCachedMute(
                conversationId
            );


        if (cached !== null) {

            return cached;

        }


        return await loadMuteFromDatabase(
            conversationId,
            userId
        );

    }


    /* =====================================================
       MUTE BUTTON
    ===================================================== */

    function updateMuteButton(
        muted
    ) {

        const button =
            document.getElementById(
                "chatNotificationButton"
            );


        if (!button) {

            return;

        }


        if (muted) {

            button.textContent =
                "🔕";

            button.setAttribute(
                "aria-label",
                "تشغيل إشعارات المحادثة"
            );

            button.setAttribute(
                "title",
                "الإشعارات مكتومة"
            );

            button.classList.add(
                "wfesc-muted"
            );

        } else {

            button.textContent =
                "🔔";

            button.setAttribute(
                "aria-label",
                "كتم إشعارات المحادثة"
            );

            button.setAttribute(
                "title",
                "كتم إشعارات المحادثة"
            );

            button.classList.remove(
                "wfesc-muted"
            );

        }

    }


    async function loadMuteState() {

        const user =
            await getUser();


        const conversationId =
            getConversationId();


        if (
            !user ||
            !conversationId
        ) {

            return;

        }


        const muted =
            await loadMuteFromDatabase(
                conversationId,
                user.id
            );


        updateMuteButton(
            muted
        );

    }


    async function toggleMute() {

        const client =
            getClient();

        const user =
            await getUser();

        const conversationId =
            getConversationId();


        if (
            !client ||
            !user ||
            !conversationId
        ) {

            console.warn(
                "WFESC NOTIFICATIONS: cannot toggle mute",
                {
                    client:
                        !!client,

                    user:
                        !!user,

                    conversationId
                }
            );

            return;

        }


        const button =
            document.getElementById(
                "chatNotificationButton"
            );


        if (
            button &&
            button.dataset.wfescBusy === "true"
        ) {

            return;

        }


        if (button) {

            button.dataset.wfescBusy =
                "true";

        }


        try {

            const oldMuted =
                await getMuted(
                    conversationId,
                    user.id
                );


            const newMuted =
                !oldMuted;


            /*
             * نحدث الواجهة والكاش فورًا.
             */

            setCachedMute(
                conversationId,
                newMuted
            );


            updateMuteButton(
                newMuted
            );


            /*
             * ثم نحفظ في Supabase.
             */

            const result =
                await client
                    .from("conversation_members")
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
                        user.id
                    );


            if (result.error) {

                /*
                 * إذا فشل الحفظ نرجع الحالة القديمة.
                 */

                setCachedMute(
                    conversationId,
                    oldMuted
                );


                updateMuteButton(
                    oldMuted
                );


                console.error(
                    "WFESC NOTIFICATIONS: mute update failed",
                    result.error
                );


                return;

            }


            console.log(
                "WFESC NOTIFICATIONS: mute changed",
                newMuted
            );

        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: toggle exception",
                error
            );

        } finally {

            const currentButton =
                document.getElementById(
                    "chatNotificationButton"
                );


            if (currentButton) {

                currentButton.dataset.wfescBusy =
                    "false";

            }

        }

    }


    /* =====================================================
       BUTTON DELEGATION
    ===================================================== */

    function setupButtonDelegation() {

        if (buttonDelegationStarted) {

            return;

        }


        buttonDelegationStarted =
            true;


        document.addEventListener(
            "click",
            function (event) {

                let target =
                    event.target;


                if (
                    !target ||
                    typeof target.closest !== "function"
                ) {

                    return;

                }


                const button =
                    target.closest(
                        "#chatNotificationButton"
                    );


                if (!button) {

                    return;

                }


                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


                unlockAudio();

                toggleMute();

            },
            true
        );

    }


    /* =====================================================
       PROFILE
    ===================================================== */

    async function getSenderProfile(
        senderId
    ) {

        const client =
            getClient();


        if (
            !client ||
            !senderId
        ) {

            return null;

        }


        try {

            const result =
                await client
                    .from("profiles")
                    .select("*")
                    .eq(
                        "id",
                        senderId
                    )
                    .maybeSingle();


            if (result.error) {

                console.warn(
                    "WFESC NOTIFICATIONS: profile read failed",
                    result.error
                );

                return null;

            }


            return result.data || null;

        } catch (error) {

            console.warn(
                "WFESC NOTIFICATIONS: profile exception",
                error
            );

            return null;

        }

    }


    function getProfileName(
        profile
    ) {

        if (!profile) {

            return "مستخدم WFESC";

        }


        return (
            profile.display_name ||
            profile.full_name ||
            profile.username ||
            profile.name ||
            profile.nickname ||
            "مستخدم WFESC"
        );

    }


    function getProfileAvatar(
        profile
    ) {

        if (!profile) {

            return "";

        }


        return (
            profile.avatar_url ||
            profile.avatar ||
            profile.photo_url ||
            profile.image_url ||
            ""
        );

    }


    /* =====================================================
       NOTIFICATION DATA
    ===================================================== */

    async function buildNotification(
        message
    ) {

        /*
         * الملف الشخصي ليس شرطًا لوصول الإشعار.
         */

        let profile =
            null;


        try {

            profile =
                await getSenderProfile(
                    message.sender_id
                );

        } catch (error) {

            profile =
                null;

        }


        return {

            id:
                message.id,

            conversationId:
                message.conversation_id,

            senderId:
                message.sender_id,

            name:
                getProfileName(
                    profile
                ),

            avatar:
                getProfileAvatar(
                    profile
                ),

            content:
                message.content ||
                "أرسل لك رسالة",

            createdAt:
                message.created_at ||
                new Date().toISOString()

        };

    }


    /* =====================================================
       NOTIFICATION PANEL
    ===================================================== */

    function ensureNotificationPanel() {

        if (
            notificationPanel &&
            document.body.contains(
                notificationPanel
            )
        ) {

            return notificationPanel;

        }


        notificationPanel =
            document.createElement(
                "div"
            );


        notificationPanel.id =
            "wfescIncomingNotifications";


        notificationPanel.style.position =
            "fixed";

        notificationPanel.style.top =
            "76px";

        notificationPanel.style.right =
            "16px";

        notificationPanel.style.width =
            "min(390px, calc(100vw - 32px))";

        notificationPanel.style.maxHeight =
            "calc(100vh - 100px)";

        notificationPanel.style.overflowY =
            "auto";

        notificationPanel.style.zIndex =
            "999999";

        notificationPanel.style.direction =
            "rtl";

        notificationPanel.style.display =
            "flex";

        notificationPanel.style.flexDirection =
            "column";

        notificationPanel.style.gap =
            "10px";


        document.body.appendChild(
            notificationPanel
        );


        return notificationPanel;

    }


    function renderNotification(
        item
    ) {

        const panel =
            ensureNotificationPanel();


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "wfesc-incoming-notification";


        card.dataset.conversationId =
            item.conversationId;


        card.style.background =
            "#111";

        card.style.color =
            "#fff";

        card.style.border =
            "1px solid rgba(255,255,255,.12)";

        card.style.borderRadius =
            "16px";

        card.style.padding =
            "12px";

        card.style.boxShadow =
            "0 12px 35px rgba(0,0,0,.45)";

        card.style.display =
            "flex";

        card.style.gap =
            "11px";

        card.style.alignItems =
            "flex-start";


        const avatar =
            document.createElement(
                "div"
            );


        avatar.style.width =
            "44px";

        avatar.style.height =
            "44px";

        avatar.style.minWidth =
            "44px";

        avatar.style.borderRadius =
            "50%";

        avatar.style.overflow =
            "hidden";

        avatar.style.background =
            "#222";

        avatar.style.display =
            "flex";

        avatar.style.alignItems =
            "center";

        avatar.style.justifyContent =
            "center";


        if (item.avatar) {

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                item.avatar;

            img.alt =
                item.name;


            img.style.width =
                "100%";

            img.style.height =
                "100%";

            img.style.objectFit =
                "cover";


            img.onerror =
                function () {

                    img.remove();

                    avatar.textContent =
                        "👤";

                };


            avatar.appendChild(
                img
            );

        } else {

            avatar.textContent =
                "👤";

        }


        const body =
            document.createElement(
                "div"
            );


        body.style.flex =
            "1";

        body.style.minWidth =
            "0";


        const name =
            document.createElement(
                "div"
            );


        name.textContent =
            item.name;

        name.style.fontWeight =
            "700";

        name.style.marginBottom =
            "4px";


        const text =
            document.createElement(
                "div"
            );


        text.textContent =
            item.content;

        text.style.fontSize =
            "14px";

        text.style.lineHeight =
            "1.5";

        text.style.opacity =
            ".88";

        text.style.wordBreak =
            "break-word";


        const openButton =
            document.createElement(
                "button"
            );


        openButton.type =
            "button";

        openButton.textContent =
            "فتح المحادثة";


        openButton.style.marginTop =
            "9px";

        openButton.style.border =
            "0";

        openButton.style.borderRadius =
            "9px";

        openButton.style.padding =
            "7px 11px";

        openButton.style.cursor =
            "pointer";

        openButton.style.background =
            "#fff";

        openButton.style.color =
            "#111";

        openButton.style.fontWeight =
            "700";


        openButton.addEventListener(
            "click",
            function () {

                openConversation(
                    item.conversationId
                );

            }
        );


        body.appendChild(
            name
        );

        body.appendChild(
            text
        );

        body.appendChild(
            openButton
        );


        card.appendChild(
            avatar
        );

        card.appendChild(
            body
        );


        panel.prepend(
            card
        );


        while (
            panel.children.length >
            MAX_NOTIFICATIONS
        ) {

            panel.lastElementChild.remove();

        }


        return card;

    }


    function addNotification(
        item
    ) {

        /*
         * منع التكرار إذا Realtime أعاد نفس الرسالة.
         */

        const alreadyExists =
            notifications.some(
                function (existing) {

                    return (
                        String(existing.id) ===
                        String(item.id)
                    );

                }
            );


        if (alreadyExists) {

            return;

        }


        notifications.unshift(
            item
        );


        if (
            notifications.length >
            MAX_NOTIFICATIONS
        ) {

            notifications =
                notifications.slice(
                    0,
                    MAX_NOTIFICATIONS
                );

        }


        renderNotification(
            item
        );

    }


    /* =====================================================
       IN-CHAT NOTICE
    ===================================================== */

    function showConversationNotice(
        item
    ) {

        if (conversationNotice) {

            conversationNotice.remove();

            conversationNotice =
                null;

        }


        conversationNotice =
            document.createElement(
                "div"
            );


        conversationNotice.id =
            "wfescConversationIncomingNotice";


        conversationNotice.style.position =
            "fixed";

        conversationNotice.style.top =
            "76px";

        conversationNotice.style.left =
            "50%";

        conversationNotice.style.transform =
            "translateX(-50%)";

        conversationNotice.style.zIndex =
            "999998";

        conversationNotice.style.width =
            "min(430px, calc(100vw - 30px))";

        conversationNotice.style.background =
            "#111";

        conversationNotice.style.color =
            "#fff";

        conversationNotice.style.border =
            "1px solid rgba(255,255,255,.12)";

        conversationNotice.style.borderRadius =
            "14px";

        conversationNotice.style.padding =
            "10px 13px";

        conversationNotice.style.direction =
            "rtl";

        conversationNotice.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.4)";


        const title =
            document.createElement(
                "div"
            );


        title.textContent =
            item.name +
            " أرسل لك رسالة";


        title.style.fontWeight =
            "700";


        const content =
            document.createElement(
                "div"
            );


        content.textContent =
            item.content;

        content.style.marginTop =
            "4px";

        content.style.opacity =
            ".85";

        content.style.wordBreak =
            "break-word";


        conversationNotice.appendChild(
            title
        );

        conversationNotice.appendChild(
            content
        );


        document.body.appendChild(
            conversationNotice
        );


        setTimeout(
            function () {

                if (!conversationNotice) {

                    return;

                }


                conversationNotice.style.opacity =
                    "0";

                conversationNotice.style.transition =
                    "opacity .2s ease";


                setTimeout(
                    function () {

                        if (
                            conversationNotice
                        ) {

                            conversationNotice.remove();

                            conversationNotice =
                                null;

                        }

                    },
                    250
                );

            },
            4000
        );

    }


    /* =====================================================
       OPEN CONVERSATION
    ===================================================== */

    async function openConversation(
        conversationId
    ) {

        if (!conversationId) {

            return;

        }


        const core =
            window.WFESC_MESSAGES_CORE;


        if (
            core &&
            typeof core.openConversation === "function"
        ) {

            try {

                await core.openConversation(
                    conversationId
                );

                return;

            } catch (error) {

                console.warn(
                    "WFESC NOTIFICATIONS: core.openConversation failed",
                    error
                );

            }

        }


        if (
            core &&
            typeof core.openConversationInternal === "function"
        ) {

            try {

                await core.openConversationInternal(
                    conversationId
                );

                return;

            } catch (error) {

                console.warn(
                    "WFESC NOTIFICATIONS: openConversationInternal failed",
                    error
                );

            }

        }


        document.dispatchEvent(
            new CustomEvent(
                "wfesc:open-conversation",
                {
                    detail: {
                        conversationId:
                            conversationId
                    }
                }
            )
        );

    }


    /* =====================================================
       INCOMING MESSAGE
    ===================================================== */

    async function handleMessage(
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


        if (!message.id) {

            return;

        }


        const user =
            await getUser();


        if (!user) {

            return;

        }


        /*
         * رسالتي أنا:
         * لا صوت ولا إشعار.
         */

        if (
            String(message.sender_id) ===
            String(user.id)
        ) {

            return;

        }


        /*
         * نفحص الكتم.
         *
         * إذا موجود بالكاش:
         * لا يوجد انتظار.
         */

        let muted =
            getCachedMute(
                message.conversation_id
            );


        /*
         * إذا غير موجود، نقرأه مرة واحدة فقط.
         */

        if (muted === null) {

            muted =
                await loadMuteFromDatabase(
                    message.conversation_id,
                    user.id
                );

        }


        if (muted) {

            console.log(
                "WFESC NOTIFICATIONS: incoming message muted"
            );

            return;

        }


        /*
         * =================================================
         * الصوت هنا قبل قراءة profile.
         * =================================================
         */

        playSound();


        /*
         * تحديد المحادثة الحالية.
         */

        const currentConversationId =
            getConversationId();


        const insideSameConversation =
            !!(
                currentConversationId &&
                String(currentConversationId) ===
                String(message.conversation_id)
            );


        /*
         * نبني بيانات الإشعار.
         */

        const item =
            await buildNotification(
                message
            );


        /*
         * الإشعار يحفظ دائمًا.
         */

        addNotification(
            item
        );


        /*
         * إذا كان داخل نفس المحادثة.
         */

        if (insideSameConversation) {

            showConversationNotice(
                item
            );

        }


        /*
         * حدث عام لأي جزء آخر بالموقع.
         */

        document.dispatchEvent(
            new CustomEvent(
                "wfesc:incoming-message-notification",
                {
                    detail:
                        item
                }
            )
        );


        console.log(
            "WFESC NOTIFICATIONS: incoming message processed",
            item
        );

    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function startRealtime() {

        const client =
            getClient();


        if (!client) {

            console.warn(
                "WFESC NOTIFICATIONS: client not ready"
            );

            return false;

        }


        if (
            realtimeStarted &&
            realtimeChannel
        ) {

            return true;

        }


        realtimeStarted =
            true;


        console.log(
            "WFESC NOTIFICATIONS: starting realtime"
        );


        realtimeChannel =
            client
                .channel(
                    "wfesc-notifications-channel"
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

                        /*
                         * لا ننتظر.
                         */

                        handleMessage(
                            payload
                        );

                    }
                )
                .subscribe(
                    function (status) {

                        console.log(
                            "WFESC NOTIFICATIONS REALTIME:",
                            status
                        );


                        if (
                            status ===
                            "SUBSCRIBED"
                        ) {

                            console.log(
                                "WFESC NOTIFICATIONS: REALTIME CONNECTED"
                            );

                        }


                        if (
                            status ===
                            "CHANNEL_ERROR" ||
                            status ===
                            "TIMED_OUT"
                        ) {

                            console.error(
                                "WFESC NOTIFICATIONS: REALTIME FAILED",
                                status
                            );

                        }

                    }
                );


        return true;

    }


    /* =====================================================
       CHAT CHANGE
    ===================================================== */

    document.addEventListener(
        "wfesc:chat-header-refresh",
        function () {

            setTimeout(
                function () {

                    loadMuteState();

                },
                50
            );

        }
    );


    /* =====================================================
       AUDIO UNLOCK
    ===================================================== */

    [
        "click",
        "touchstart",
        "pointerdown",
        "keydown"
    ]
    .forEach(
        function (eventName) {

            document.addEventListener(
                eventName,
                function () {

                    unlockAudio();

                },
                {
                    capture:
                        true,

                    passive:
                        true
                }
            );

        }
    );


    /* =====================================================
       BOOT
    ===================================================== */

    function boot() {

        if (bootStarted) {

            return;

        }


        bootStarted =
            true;


        createAudio();

        setupButtonDelegation();

        setupAuthListener();

        startRealtime();

        loadMuteState();


        /*
         * إعادة المحاولة إذا Supabase/Core
         * لم يكن جاهزًا في لحظة تحميل الملف.
         */

        const retryTimes = [
            300,
            800,
            1500,
            3000,
            5000
        ];


        retryTimes.forEach(
            function (delay) {

                setTimeout(
                    function () {

                        setupAuthListener();

                        startRealtime();

                        loadMuteState();

                    },
                    delay
                );

            }
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once:
                    true
            }
        );

    } else {

        boot();

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.WFESC_MESSAGES_NOTIFICATIONS = {

        toggleMute:
            toggleMute,

        loadMuteState:
            loadMuteState,

        playSound:
            playSound,

        startRealtime:
            startRealtime,

        getConversationId:
            getConversationId,

        openConversation:
            openConversation,

        getNotifications:
            function () {

                return notifications.slice();

            },

        clearNotifications:
            function () {

                notifications =
                    [];


                if (
                    notificationPanel
                ) {

                    notificationPanel.innerHTML =
                        "";

                }

            }

    };


})();
