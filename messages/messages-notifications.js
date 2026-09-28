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


    /* =====================================================
       STATE
    ===================================================== */

    let audio = null;

    let realtimeChannel = null;

    let realtimeStarted = false;

    let bound = false;


    /* =====================================================
       SUPABASE
    ===================================================== */

    function getClient() {

        if (window.WFESCSupabase) {

            return window.WFESCSupabase;

        }


        const core =
            window.WFESC_MESSAGES_CORE;


        if (
            core &&
            core.client
        ) {

            return core.client;

        }


        return null;

    }


    /* =====================================================
       USER
    ===================================================== */

    async function getUser() {

        const client =
            getClient();


        if (!client) {

            console.error(
                "WFESC NOTIFICATIONS: Supabase client not found"
            );

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

                return result.data.user;

            }


        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: getUser error",
                error
            );

        }


        return null;

    }


    /* =====================================================
       CURRENT CONVERSATION
    ===================================================== */

    function getConversationId() {

        /*
         * أولاً من Chat Header
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


        /*
         * ثانيًا من Core
         */

        const core =
            window.WFESC_MESSAGES_CORE;


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


        audio.preload = "auto";

        audio.volume =
            NOTIFICATION_VOLUME;


        audio.addEventListener(
            "error",
            function () {

                console.error(
                    "WFESC NOTIFICATIONS: audio file could not be loaded:",
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


        try {

            sound.muted = true;

            sound.currentTime = 0;


            const playPromise =
                sound.play();


            if (
                playPromise &&
                typeof playPromise.then ===
                "function"
            ) {

                playPromise
                    .then(function () {

                        sound.pause();

                        sound.currentTime = 0;

                        sound.muted = false;

                    })
                    .catch(function () {

                        sound.muted = false;

                    });

            }

        } catch (error) {

            sound.muted = false;

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

            sound.currentTime = 0;

            sound.volume =
                NOTIFICATION_VOLUME;

            sound.muted = false;


            const playPromise =
                sound.play();


            if (
                playPromise &&
                typeof playPromise.catch ===
                "function"
            ) {

                playPromise.catch(
                    function (error) {

                        console.warn(
                            "WFESC NOTIFICATIONS: browser blocked sound",
                            error
                        );

                    }
                );

            }

        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: sound error",
                error
            );

        }

    }


    /* =====================================================
       MUTE
    ===================================================== */

    async function getMuted(
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
                    "WFESC NOTIFICATIONS: mute read error",
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
                "WFESC NOTIFICATIONS: mute read exception",
                error
            );

            return false;

        }

    }


    async function toggleMute() {

        const button =
            document.getElementById(
                "chatNotificationButton"
            );


        const client =
            getClient();


        const user =
            await getUser();


        const conversationId =
            getConversationId();


        console.log(
            "WFESC NOTIFICATIONS TOGGLE",
            {
                buttonFound:
                    !!button,

                clientFound:
                    !!client,

                userId:
                    user
                        ? user.id
                        : null,

                conversationId:
                    conversationId
            }
        );


        if (!button) {

            console.error(
                "WFESC NOTIFICATIONS: chatNotificationButton not found"
            );

            return;

        }


        if (!client) {

            console.error(
                "WFESC NOTIFICATIONS: Supabase client not found"
            );

            return;

        }


        if (!user) {

            console.error(
                "WFESC NOTIFICATIONS: user not found"
            );

            return;

        }


        if (!conversationId) {

            console.error(
                "WFESC NOTIFICATIONS: current conversation not found"
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
                await getMuted(
                    conversationId,
                    user.id
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
                        user.id
                    );


            if (result.error) {

                console.error(
                    "WFESC NOTIFICATIONS: mute update failed",
                    result.error
                );

                return;

            }


            if (newMuted) {

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


            console.log(
                "WFESC NOTIFICATIONS: mute changed to",
                newMuted
            );


        } catch (error) {

            console.error(
                "WFESC NOTIFICATIONS: toggle exception",
                error
            );

        } finally {

            button.dataset.wfescBusy =
                "false";

        }

    }


    /* =====================================================
       LOAD CURRENT MUTE STATE
    ===================================================== */

    async function loadMuteState() {

        const button =
            document.getElementById(
                "chatNotificationButton"
            );


        if (!button) {

            return;

        }


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
            await getMuted(
                conversationId,
                user.id
            );


        if (muted) {

            button.textContent =
                "🔕";

            button.classList.add(
                "wfesc-muted"
            );

            button.setAttribute(
                "title",
                "الإشعارات مكتومة"
            );

        } else {

            button.textContent =
                "🔔";

            button.classList.remove(
                "wfesc-muted"
            );

            button.setAttribute(
                "title",
                "كتم إشعارات المحادثة"
            );

        }

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    function bindButton() {

        const button =
            document.getElementById(
                "chatNotificationButton"
            );


        if (!button) {

            console.warn(
                "WFESC NOTIFICATIONS: button not found yet"
            );

            return false;

        }


        if (bound) {

            return true;

        }


        bound = true;


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();


                unlockAudio();


                toggleMute();

            }
        );


        console.log(
            "WFESC NOTIFICATIONS: 🔔 BUTTON CONNECTED"
        );


        loadMuteState();


        return true;

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


        console.log(
            "WFESC NOTIFICATIONS: NEW MESSAGE",
            message
        );


        const user =
            await getUser();


        if (!user) {

            return;

        }


        /*
         * الرسالة من نفس المستخدم:
         * لا صوت ولا إشعار.
         */

        if (
            String(
                message.sender_id
            ) ===
            String(
                user.id
            )
        ) {

            return;

        }


        const muted =
            await getMuted(
                message.conversation_id,
                user.id
            );


        /*
         * المحادثة مكتومة.
         */

        if (muted) {

            console.log(
                "WFESC NOTIFICATIONS: MESSAGE MUTED"
            );

            return;

        }


        /*
         * الطرف الآخر أرسل.
         * الصوت يعمل داخل وخارج المحادثة.
         */

        playSound();


        showToast(
            message.content ||
            "لديك رسالة جديدة"
        );

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message
    ) {

        let toast =
            document.getElementById(
                "wfescMessageToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "wfescMessageToast";


            toast.style.position =
                "fixed";

            toast.style.right =
                "18px";

            toast.style.bottom =
                "18px";

            toast.style.zIndex =
                "999999";

            toast.style.padding =
                "13px 16px";

            toast.style.borderRadius =
                "14px";

            toast.style.background =
                "#111";

            toast.style.color =
                "#fff";

            toast.style.border =
                "1px solid rgba(255,255,255,.12)";

            toast.style.direction =
                "rtl";

            toast.style.maxWidth =
                "calc(100vw - 36px)";

            toast.style.fontFamily =
                "Arial,Tahoma,sans-serif";

            toast.style.boxShadow =
                "0 10px 30px rgba(0,0,0,.4)";

            toast.style.opacity =
                "0";

            toast.style.transition =
                "opacity .2s ease";


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.style.opacity =
            "1";


        clearTimeout(
            toast.__timer
        );


        toast.__timer =
            setTimeout(
                function () {

                    toast.style.opacity =
                        "0";

                },
                3000
            );

    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function startRealtime() {

        const client =
            getClient();


        if (!client) {

            console.error(
                "WFESC NOTIFICATIONS: cannot start realtime, client missing"
            );

            return;

        }


        if (realtimeStarted) {

            return;

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

                    }
                );

    }


    /* =====================================================
       CHAT CHANGE
    ===================================================== */

    document.addEventListener(
        "wfesc:chat-header-refresh",
        function () {

            setTimeout(
                function () {

                    bindButton();

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
                unlockAudio,
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

        createAudio();

        bindButton();

        startRealtime();


        setTimeout(
            function () {

                bindButton();

                loadMuteState();

            },
            300
        );


        setTimeout(
            function () {

                bindButton();

                loadMuteState();

            },
            1000
        );


        setTimeout(
            function () {

                bindButton();

                loadMuteState();

            },
            2000
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
            getConversationId

    };


})();
