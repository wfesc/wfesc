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

    const MAX_VISIBLE_NOTIFICATIONS = 3;

    const NOTIFICATION_DURATION = 2000;

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

    let buttonDelegationStarted = false;

    let bootStarted = false;

    const muteCache = new Map();


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
       AUTH
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

            } catch (error) {}

        }


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
                        "WFESC NOTIFICATIONS: sound blocked",
                        error
                    );

                });

            }

        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: sound error",
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
             * تحديث فوري للواجهة والكاش.
             */

            setCachedMute(
                conversationId,
                newMuted
            );


            updateMuteButton(
                newMuted
            );


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

            }

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

                const target =
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

                return null;

            }


            return result.data || null;

        } catch (error) {

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

        const profile =
            await getSenderProfile(
                message.sender_id
            );


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
            "82px";

        notificationPanel.style.right =
            "12px";

        notificationPanel.style.width =
            "min(310px, calc(100vw - 24px))";

        notificationPanel.style.maxHeight =
            "calc(100vh - 110px)";

        notificationPanel.style.overflow =
            "hidden";

        notificationPanel.style.zIndex =
            "999999";

        notificationPanel.style.direction =
            "rtl";

        notificationPanel.style.display =
            "flex";

        notificationPanel.style.flexDirection =
            "column";

        notificationPanel.style.alignItems =
            "flex-end";

        notificationPanel.style.gap =
            "7px";

        notificationPanel.style.pointerEvents =
            "none";


        document.body.appendChild(
            notificationPanel
        );


        return notificationPanel;

    }


    /* =====================================================
       REMOVE NOTIFICATION
    ===================================================== */

    function removeNotificationCard(
        card,
        notificationId
    ) {

        if (!card) {

            return;

        }


        if (
            card.dataset.removing === "true"
        ) {

            return;

        }


        card.dataset.removing =
            "true";


        /*
         * إزالة من الذاكرة.
         */

        notifications =
            notifications.filter(
                function (item) {

                    return (
                        String(item.id) !==
                        String(notificationId)
                    );

                }
            );


        /*
         * Animation
         */

        card.style.transition =
            "transform .22s ease, opacity .22s ease";

        card.style.transform =
            "translateX(120px) scale(.94)";

        card.style.opacity =
            "0";


        setTimeout(
            function () {

                if (
                    card &&
                    card.parentNode
                ) {

                    card.parentNode.removeChild(
                        card
                    );

                }

            },
            230
        );

    }


    /* =====================================================
       RENDER NOTIFICATION
    ===================================================== */

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


        card.dataset.notificationId =
            item.id;


        card.dataset.conversationId =
            item.conversationId;


        card.style.width =
            "100%";

        card.style.maxWidth =
            "310px";

        card.style.boxSizing =
            "border-box";

        card.style.background =
            "#111";

        card.style.color =
            "#fff";

        card.style.border =
            "1px solid rgba(255,255,255,.12)";

        card.style.borderRadius =
            "13px";

        card.style.padding =
            "9px";

        card.style.boxShadow =
            "0 8px 24px rgba(0,0,0,.42)";

        card.style.display =
            "flex";

        card.style.gap =
            "8px";

        card.style.alignItems =
            "flex-start";

        card.style.position =
            "relative";

        card.style.pointerEvents =
            "auto";

        card.style.touchAction =
            "pan-y";

        card.style.transform =
            "translateX(35px) scale(.97)";

        card.style.opacity =
            "0";

        card.style.transition =
            "transform .25s cubic-bezier(.2,.8,.2,1), opacity .25s ease";


        /* =================================================
           CLOSE BUTTON
        ================================================= */

        const closeButton =
            document.createElement(
                "button"
            );


        closeButton.type =
            "button";

        closeButton.textContent =
            "×";


        closeButton.setAttribute(
            "aria-label",
            "إغلاق الإشعار"
        );


        closeButton.style.position =
            "absolute";

        closeButton.style.top =
            "4px";

        closeButton.style.left =
            "5px";

        closeButton.style.width =
            "23px";

        closeButton.style.height =
            "23px";

        closeButton.style.padding =
            "0";

        closeButton.style.border =
            "0";

        closeButton.style.borderRadius =
            "50%";

        closeButton.style.background =
            "rgba(255,255,255,.08)";

        closeButton.style.color =
            "#fff";

        closeButton.style.fontSize =
            "17px";

        closeButton.style.lineHeight =
            "23px";

        closeButton.style.cursor =
            "pointer";

        closeButton.style.zIndex =
            "3";


        closeButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();


                removeNotificationCard(
                    card,
                    item.id
                );

            }
        );


        /* =================================================
           AVATAR
        ================================================= */

        const avatar =
            document.createElement(
                "div"
            );


        avatar.style.width =
            "38px";

        avatar.style.height =
            "38px";

        avatar.style.minWidth =
            "38px";

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

        avatar.style.marginTop =
            "1px";


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


        /* =================================================
           BODY
        ================================================= */

        const body =
            document.createElement(
                "div"
            );


        body.style.flex =
            "1";

        body.style.minWidth =
            "0";

        body.style.paddingLeft =
            "16px";


        const name =
            document.createElement(
                "div"
            );


        name.textContent =
            item.name;


        name.style.fontWeight =
            "700";

        name.style.fontSize =
            "14px";

        name.style.marginBottom =
            "2px";

        name.style.whiteSpace =
            "nowrap";

        name.style.overflow =
            "hidden";

        name.style.textOverflow =
            "ellipsis";


        const text =
            document.createElement(
                "div"
            );


        text.textContent =
            item.content;


        text.style.fontSize =
            "13px";

        text.style.lineHeight =
            "1.4";

        text.style.opacity =
            ".86";

        text.style.wordBreak =
            "break-word";

        text.style.display =
            "-webkit-box";

        text.style.webkitLineClamp =
            "2";

        text.style.webkitBoxOrient =
            "vertical";

        text.style.overflow =
            "hidden";


        /* =================================================
           OPEN BUTTON
        ================================================= */

        const openButton =
            document.createElement(
                "button"
            );


        openButton.type =
            "button";

        openButton.textContent =
            "فتح المحادثة";


        openButton.style.marginTop =
            "6px";

        openButton.style.border =
            "0";

        openButton.style.borderRadius =
            "7px";

        openButton.style.padding =
            "5px 9px";

        openButton.style.cursor =
            "pointer";

        openButton.style.background =
            "#fff";

        openButton.style.color =
            "#111";

        openButton.style.fontSize =
            "12px";

        openButton.style.fontWeight =
            "700";


        openButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();


                removeNotificationCard(
                    card,
                    item.id
                );


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
            closeButton
        );

        card.appendChild(
            avatar
        );

        card.appendChild(
            body
        );


        /*
         * إضافة إلى أعلى القائمة.
         */

        panel.prepend(
            card
        );


        /*
         * Animation الدخول.
         */

        requestAnimationFrame(
            function () {

                requestAnimationFrame(
                    function () {

                        card.style.transform =
                            "translateX(0) scale(1)";

                        card.style.opacity =
                            "1";

                    }
                );

            }
        );


        /*
         * إزالة تلقائية بعد ثانيتين.
         */

        const autoRemoveTimer =
            setTimeout(
                function () {

                    removeNotificationCard(
                        card,
                        item.id
                    );

                },
                NOTIFICATION_DURATION
            );


        card.dataset.autoRemoveTimer =
            String(
                autoRemoveTimer
            );


        /* =================================================
           SWIPE
        ================================================= */

        let startX = 0;

        let currentX = 0;

        let dragging = false;


        card.addEventListener(
            "touchstart",
            function (event) {

                if (
                    !event.touches ||
                    !event.touches[0]
                ) {

                    return;

                }


                startX =
                    event.touches[0].clientX;

                currentX =
                    startX;

                dragging =
                    true;


                card.style.transition =
                    "none";

            },
            {
                passive:
                    true
            }
        );


        card.addEventListener(
            "touchmove",
            function (event) {

                if (
                    !dragging ||
                    !event.touches ||
                    !event.touches[0]
                ) {

                    return;

                }


                currentX =
                    event.touches[0].clientX;


                const delta =
                    currentX -
                    startX;


                /*
                 * السماح بالسحب يمين ويسار.
                 */

                if (
                    Math.abs(delta) >
                    8
                ) {

                    card.style.transform =
                        "translateX(" +
                        delta +
                        "px)";

                    card.style.opacity =
                        String(
                            Math.max(
                                .25,
                                1 -
                                Math.abs(delta) /
                                180
                            )
                        );

                }

            },
            {
                passive:
                    true
            }
        );


        card.addEventListener(
            "touchend",
            function () {

                if (!dragging) {

                    return;

                }


                dragging =
                    false;


                const delta =
                    currentX -
                    startX;


                card.style.transition =
                    "transform .22s ease, opacity .22s ease";


                if (
                    Math.abs(delta) >=
                    70
                ) {

                    removeNotificationCard(
                        card,
                        item.id
                    );

                } else {

                    card.style.transform =
                        "translateX(0) scale(1)";

                    card.style.opacity =
                        "1";

                }

            },
            {
                passive:
                    true
            }
        );


        /*
         * الماوس أيضًا للسحب على الأجهزة التي تدعم pointer.
         */

        let pointerStartX =
            null;


        card.addEventListener(
            "pointerdown",
            function (event) {

                if (
                    event.pointerType ===
                    "mouse"
                ) {

                    pointerStartX =
                        event.clientX;

                }

            }
        );


        card.addEventListener(
            "pointerup",
            function (event) {

                if (
                    pointerStartX ===
                    null
                ) {

                    return;

                }


                const delta =
                    event.clientX -
                    pointerStartX;


                pointerStartX =
                    null;


                if (
                    Math.abs(delta) >=
                    90
                ) {

                    removeNotificationCard(
                        card,
                        item.id
                    );

                }

            }
        );


        /*
         * إبقاء عدد الكروت الظاهرة محدود.
         */

        trimVisibleNotifications();


        return card;

    }


    /* =====================================================
       TRIM VISIBLE NOTIFICATIONS
    ===================================================== */

    function trimVisibleNotifications() {

        if (!notificationPanel) {

            return;

        }


        const cards =
            Array.from(
                notificationPanel.children
            );


        while (
            cards.length >
            MAX_VISIBLE_NOTIFICATIONS
        ) {

            const oldCard =
                cards.pop();


            if (
                oldCard &&
                oldCard.parentNode
            ) {

                const id =
                    oldCard.dataset.notificationId;


                if (id) {

                    notifications =
                        notifications.filter(
                            function (item) {

                                return (
                                    String(item.id) !==
                                    String(id)
                                );

                            }
                        );

                }


                oldCard.parentNode.removeChild(
                    oldCard
                );

            }

        }

    }


    /* =====================================================
       ADD NOTIFICATION
    ===================================================== */

    function addNotification(
        item
    ) {

        const exists =
            notifications.some(
                function (existing) {

                    return (
                        String(existing.id) ===
                        String(item.id)
                    );

                }
            );


        if (exists) {

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
            "min(330px, calc(100vw - 30px))";

        conversationNotice.style.background =
            "#111";

        conversationNotice.style.color =
            "#fff";

        conversationNotice.style.border =
            "1px solid rgba(255,255,255,.12)";

        conversationNotice.style.borderRadius =
            "12px";

        conversationNotice.style.padding =
            "9px 12px";

        conversationNotice.style.direction =
            "rtl";

        conversationNotice.style.boxShadow =
            "0 8px 25px rgba(0,0,0,.4)";

        conversationNotice.style.opacity =
            "0";

        conversationNotice.style.transition =
            "opacity .2s ease, transform .2s ease";


        const title =
            document.createElement(
                "div"
            );


        title.textContent =
            item.name +
            " أرسل لك رسالة";


        title.style.fontWeight =
            "700";

        title.style.fontSize =
            "13px";


        const content =
            document.createElement(
                "div"
            );


        content.textContent =
            item.content;

        content.style.marginTop =
            "3px";

        content.style.opacity =
            ".85";

        content.style.fontSize =
            "12px";

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


        requestAnimationFrame(
            function () {

                conversationNotice.style.opacity =
                    "1";

            }
        );


        setTimeout(
            function () {

                if (!conversationNotice) {

                    return;

                }


                conversationNotice.style.opacity =
                    "0";


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
                    220
                );

            },
            NOTIFICATION_DURATION
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


        if (!message || !message.id) {

            return;

        }


        const user =
            await getUser();


        if (!user) {

            return;

        }


        /*
         * رسالتي أنا:
         * ممنوع إشعار أو صوت.
         */

        if (
            String(message.sender_id) ===
            String(user.id)
        ) {

            return;

        }


        /*
         * الكتم.
         */

        let muted =
            getCachedMute(
                message.conversation_id
            );


        if (muted === null) {

            muted =
                await loadMuteFromDatabase(
                    message.conversation_id,
                    user.id
                );

        }


        if (muted) {

            return;

        }


        /*
         * الصوت فورًا.
         */

        playSound();


        /*
         * معرفة المحادثة المفتوحة.
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
         * إذا المستخدم داخل نفس المحادثة:
         *
         * لا نضيف notification card.
         *
         * الرسالة نفسها تظهر من messages-core.
         *
         * هذا يمنع تكرار الرسالة بصندوق فوق الشاشة.
         */

        if (insideSameConversation) {

            console.log(
                "WFESC NOTIFICATIONS: same conversation - no popup"
            );

            return;

        }


        /*
         * فقط للمحادثة الأخرى:
         * نبني الإشعار.
         */

        const item =
            await buildNotification(
                message
            );


        addNotification(
            item
        );


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
            "WFESC NOTIFICATIONS: incoming notification",
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
