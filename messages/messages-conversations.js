(() => {
    "use strict";

    /*
     * =========================================================
     * WFESC MESSAGES CONVERSATIONS
     * =========================================================
     *
     * مسؤول عن:
     *
     * 1. عرض المحادثات الموجودة فعلياً فقط
     * 2. الاسم الحقيقي
     * 3. الصورة الحقيقية
     * 4. النشاط Online / Offline
     * 5. جاري الكتابة...
     * 6. الاتصال بقنوات Supabase Typing الحقيقية
     * 7. تحديث آخر رسالة
     * 8. فتح المحادثة
     * 9. تحديث قائمة المحادثات بشكل فوري عبر Realtime
     *
     * لا يعدل messages-core.js
     * ولا يعدل messages-activity.js
     * =========================================================
     */

    const CONFIG = {

        DEBUG: false,

        REFRESH_INTERVAL:
            5000,

        ACTIVITY_REFRESH_INTERVAL:
            30000,

        TYPING_TIMEOUT:
            3000,

        CONTACT_CACHE_TIME:
            60000,

        DEFAULT_NAME:
            "مستخدم",

        DEFAULT_USERNAME:
            "user",

        DEFAULT_AVATAR:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                >
                    <rect
                        width="200"
                        height="200"
                        rx="100"
                        fill="#111"
                    />
                    <circle
                        cx="100"
                        cy="75"
                        r="34"
                        fill="#777"
                    />
                    <path
                        d="M42 174c8-35 30-53 58-53s50 18 58 53"
                        fill="#777"
                    />
                </svg>
            `)
    };


    /* =========================================================
       STATE
       ========================================================= */

    let core = null;

    let activity = null;

    let conversationList = null;

    let refreshTimer = null;

    let activityTimer = null;

    let realtimeChannel = null;

    let realtimeStarting = false;

    let initialized = false;

    let rendering = false;

    let eventBound = false;

    let lastRenderedSignature = "";

    /*
     * conversationId -> {
     *     content,
     *     created_at,
     *     sender_id
     * }
     *
     * هذا يخلي قائمة المحادثات تعرف آخر رسالة
     * فور وصولها عبر Realtime حتى لو الـCore
     * لم ينتهِ بعد من تحديث قائمته الداخلية.
     */
    const liveMessageOverrides =
        new Map();


    /*
     * conversationId -> Supabase channel
     */
    const typingChannels =
        new Map();


    /*
     * conversationId -> {
     *     userId,
     *     timer
     * }
     */
    const typingStates =
        new Map();


    /*
     * conversationId -> {
     *     contact,
     *     timestamp
     * }
     */
    const contactCache =
        new Map();


    /* =========================================================
       DEBUG
       ========================================================= */

    function debug(...args) {

        if (!CONFIG.DEBUG) {
            return;
        }

        console.log(
            "[WFESC CONVERSATIONS]",
            ...args
        );
    }


    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHTML(value) {

        return String(
            value ?? ""
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


    /* =========================================================
       CORE
       ========================================================= */

    function getCore() {

        if (
            window.WFESC_MESSAGES_CORE
        ) {

            core =
                window.WFESC_MESSAGES_CORE;
        }

        return core;
    }


    /* =========================================================
       ACTIVITY
       ========================================================= */

    function getActivity() {

        if (
            window.WFESC_MESSAGES_ACTIVITY
        ) {

            activity =
                window.WFESC_MESSAGES_ACTIVITY;
        }

        return activity;
    }


    /* =========================================================
       LIST
       ========================================================= */

    function getConversationList() {

        if (
            conversationList &&
            document.contains(
                conversationList
            )
        ) {

            return conversationList;
        }

        conversationList =
            document.getElementById(
                "conversationList"
            );

        return conversationList;
    }


    /* =========================================================
       SUPABASE CLIENT
       ========================================================= */

    function getSupabaseClient() {

        const messagesCore =
            getCore();

        return (
            messagesCore?.client ||
            window.WFESCSupabase ||
            window.supabase ||
            null
        );
    }


    /* =========================================================
       FIRST VALUE
       ========================================================= */

    function firstValue(...values) {

        for (
            const value of values
        ) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;
            }
        }

        return null;
    }


    /* =========================================================
       USER ID
       ========================================================= */

    function getUserId(
        conversation
    ) {

        if (!conversation) {
            return null;
        }

        const contact =
            conversation.contact ||
            conversation.profile ||
            conversation.user ||
            null;

        return firstValue(

            contact?.user_id,

            contact?.userId,

            contact?.profile_id,

            contact?.id,

            conversation.user_id,

            conversation.userId,

            conversation.profile_id,

            conversation.contact_user_id,

            conversation.other_user_id

        );
    }


    /* =========================================================
       CONTACT
       ========================================================= */

    function getContact(
        conversation
    ) {

        if (!conversation) {
            return null;
        }

        return (
            conversation.contact ||
            conversation.profile ||
            conversation.user ||
            null
        );
    }


    /* =========================================================
       CONVERSATION ID
       ========================================================= */

    function getConversationId(
        conversation
    ) {

        if (!conversation) {
            return null;
        }

        return firstValue(

            conversation.id,

            conversation.conversation_id

        );
    }


    /* =========================================================
       SUPPORT
       ========================================================= */

    function isSupportConversation(
        conversation
    ) {

        return Boolean(

            conversation?.type ===
                "support" ||

            getContact(
                conversation
            )?.is_support

        );
    }


    /* =========================================================
       NORMALIZE CONTACT
       ========================================================= */

    function normalizeContact(
        contact,
        fallback = null
    ) {

        const source =
            contact ||
            fallback ||
            {};

        return {

            ...source,

            user_id:
                firstValue(

                    source.user_id,

                    source.userId,

                    source.profile_id,

                    source.id,

                    fallback?.user_id,

                    fallback?.userId,

                    fallback?.profile_id,

                    fallback?.id

                ),

            display_name:
                firstValue(

                    source.display_name,

                    source.full_name,

                    source.name,

                    fallback?.display_name,

                    fallback?.full_name,

                    fallback?.name

                ),

            username:
                firstValue(

                    source.username,

                    fallback?.username

                ),

            avatar_url:
                firstValue(

                    source.avatar_url,

                    source.avatar,

                    source.photo_url,

                    fallback?.avatar_url,

                    fallback?.avatar,

                    fallback?.photo_url

                ),

            is_online:
                source.is_online ??
                fallback?.is_online ??
                false,

            show_activity:
                source.show_activity ??
                fallback?.show_activity ??
                true

        };
    }


    /* =========================================================
       CONTACT FROM CACHE
       ========================================================= */

    function getCachedContact(
        conversationId
    ) {

        const cached =
            contactCache.get(
                String(
                    conversationId
                )
            );

        if (!cached) {
            return null;
        }

        if (
            Date.now() -
            cached.timestamp >
            CONFIG.CONTACT_CACHE_TIME
        ) {

            contactCache.delete(
                String(
                    conversationId
                )
            );

            return null;
        }

        return cached.contact;
    }


    /* =========================================================
       LOAD REAL CONTACT
       ========================================================= */

    async function resolveContact(
        conversation
    ) {

        if (!conversation) {
            return null;
        }

        const conversationId =
            getConversationId(
                conversation
            );

        if (!conversationId) {
            return null;
        }

        const existing =
            getContact(
                conversation
            );

        const existingId =
            getUserId(
                conversation
            );

        /*
         * إذا عندنا contact كامل بالفعل
         */
        if (
            existing &&
            existingId
        ) {

            const normalized =
                normalizeContact(
                    existing,
                    conversation
                );

            contactCache.set(
                String(
                    conversationId
                ),
                {
                    contact:
                        normalized,

                    timestamp:
                        Date.now()
                }
            );

            return normalized;
        }

        const cached =
            getCachedContact(
                conversationId
            );

        if (cached) {
            return cached;
        }

        /*
         * Support
         */
        if (
            isSupportConversation(
                conversation
            )
        ) {

            const supportContact =
                normalizeContact(
                    existing ||
                    conversation
                );

            contactCache.set(
                String(
                    conversationId
                ),
                {
                    contact:
                        supportContact,

                    timestamp:
                        Date.now()
                }
            );

            return supportContact;
        }

        const messagesCore =
            getCore();

        if (
            !messagesCore ||
            typeof
                messagesCore.getConversationContact !==
                "function"
        ) {

            return normalizeContact(
                existing ||
                conversation
            );
        }

        try {

            const contact =
                await messagesCore.getConversationContact(
                    conversationId,
                    conversation.type ||
                        null
                );

            if (contact) {

                const normalized =
                    normalizeContact(
                        contact,
                        conversation
                    );

                contactCache.set(
                    String(
                        conversationId
                    ),
                    {
                        contact:
                            normalized,

                        timestamp:
                            Date.now()
                    }
                );

                return normalized;
            }

        } catch (error) {

            debug(
                "getConversationContact error:",
                error
            );
        }

        return normalizeContact(
            existing ||
            conversation
        );
    }


    /* =========================================================
       DISPLAY NAME
       ========================================================= */

    function getDisplayName(
        conversation
    ) {

        const contact =
            getContact(
                conversation
            );

        const name =
            firstValue(

                conversation?.display_name,

                contact?.display_name,

                contact?.full_name,

                contact?.name,

                conversation?.full_name,

                conversation?.name

            );

        if (name) {
            return String(name);
        }

        const username =
            firstValue(

                conversation?.username,

                contact?.username

            );

        if (username) {
            return String(username);
        }

        return CONFIG.DEFAULT_NAME;
    }


    /* =========================================================
       USERNAME
       ========================================================= */

    function getUsername(
        conversation
    ) {

        const contact =
            getContact(
                conversation
            );

        return String(
            firstValue(

                conversation?.username,

                contact?.username,

                CONFIG.DEFAULT_USERNAME

            )
        );
    }


    /* =========================================================
       AVATAR
       ========================================================= */

    function getAvatar(
        conversation
    ) {

        const contact =
            getContact(
                conversation
            );

        return firstValue(

            conversation?.avatar_url,

            conversation?.avatar,

            conversation?.photo_url,

            contact?.avatar_url,

            contact?.avatar,

            contact?.photo_url,

            CONFIG.DEFAULT_AVATAR

        );
    }


    /* =========================================================
       LAST MESSAGE
       ========================================================= */

    function getLastMessage(
        conversation
    ) {

        const conversationId =
            getConversationId(
                conversation
            );

        const live =
            conversationId
                ? liveMessageOverrides.get(
                    String(
                        conversationId
                    )
                )
                : null;

        /*
         * إذا وصلت رسالة جديدة عبر Realtime
         * نعتمد عليها مباشرة.
         */
        if (live) {

            return String(

                firstValue(

                    live.content,

                    live.message,

                    ""

                ) || ""

            );
        }

        return String(

            firstValue(

                conversation?.last_message_text,

                conversation?.last_message,

                conversation?.preview,

                conversation?.last_message_content,

                ""

            ) || ""

        );
    }


    /* =========================================================
       LAST MESSAGE TIME
       ========================================================= */

    function getLastMessageTime(
        conversation
    ) {

        const conversationId =
            getConversationId(
                conversation
            );

        const live =
            conversationId
                ? liveMessageOverrides.get(
                    String(
                        conversationId
                    )
                )
                : null;

        if (live) {

            return firstValue(

                live.created_at,

                live.message_created_at

            );
        }

        return firstValue(

            conversation?.last_message_at,

            conversation?.last_message_created_at,

            conversation?.updated_at,

            conversation?.created_at

        );
    }


    /* =========================================================
       APPLY LIVE MESSAGE
       ========================================================= */

    function applyLiveMessage(
        message
    ) {

        if (!message) {
            return;
        }

        const conversationId =
            firstValue(

                message.conversation_id,

                message.conversationId

            );

        if (!conversationId) {
            return;
        }

        const content =
            firstValue(

                message.content,

                message.message,

                ""

            );

        const createdAt =
            firstValue(

                message.created_at,

                message.createdAt,

                new Date().toISOString()

            );

        const key =
            String(
                conversationId
            );

        const old =
            liveMessageOverrides.get(
                key
            );

        /*
         * لا نسمح لرسالة قديمة أن تستبدل
         * رسالة أحدث وصلت قبلها.
         */
        if (
            old?.created_at &&
            createdAt
        ) {

            const oldTime =
                new Date(
                    old.created_at
                ).getTime();

            const newTime =
                new Date(
                    createdAt
                ).getTime();

            if (
                Number.isFinite(
                    oldTime
                ) &&
                Number.isFinite(
                    newTime
                ) &&
                newTime < oldTime
            ) {

                return;
            }
        }

        liveMessageOverrides.set(
            key,
            {

                content:
                    String(
                        content
                    ),

                created_at:
                    createdAt,

                sender_id:
                    message.sender_id ||
                    null

            }
        );

        debug(
            "Live message applied:",
            key,
            content
        );
    }


    /* =========================================================
       GET CURRENT CONVERSATIONS
       ========================================================= */

    function getCurrentConversations() {

        const messagesCore =
            getCore();

        if (
            !messagesCore ||
            typeof
                messagesCore.getConversations !==
                "function"
        ) {

            return [];
        }

        let data;

        try {

            data =
                messagesCore.getConversations();

        } catch (error) {

            console.warn(
                "[WFESC CONVERSATIONS] getConversations:",
                error
            );

            return [];
        }

        if (
            !Array.isArray(data)
        ) {

            return [];
        }

        /*
         * نضيف تحديثات Realtime إلى نسخة
         * العرض بدون تعديل الـCore نفسه.
         */
        const merged =
            data.map(
                conversation => {

                    const conversationId =
                        getConversationId(
                            conversation
                        );

                    if (!conversationId) {
                        return conversation;
                    }

                    const live =
                        liveMessageOverrides.get(
                            String(
                                conversationId
                            )
                        );

                    if (!live) {
                        return conversation;
                    }

                    return {

                        ...conversation,

                        last_message_text:
                            live.content,

                        last_message:
                            live.content,

                        last_message_content:
                            live.content,

                        last_message_at:
                            live.created_at,

                        last_message_created_at:
                            live.created_at

                    };

                }
            );

        return sortConversations(
            uniqueConversations(
                merged.filter(
                    conversation =>
                        Boolean(
                            getConversationId(
                                conversation
                            )
                        )
                )
            )
        );
    }


    /* =========================================================
       REALTIME MESSAGE HANDLER
       ========================================================= */

    async function handleRealtimeMessage(
        payload
    ) {

        const message =
            payload?.new ||
            payload?.record ||
            payload?.payload?.new ||
            null;

        if (!message) {
            return;
        }

        const conversationId =
            firstValue(

                message.conversation_id,

                message.conversationId

            );

        if (!conversationId) {
            return;
        }

        /*
         * تأكد أن المحادثة موجودة في القائمة الحالية.
         */
        const conversations =
            getCurrentConversations();

        const exists =
            conversations.some(
                conversation =>
                    String(
                        getConversationId(
                            conversation
                        )
                    ) ===
                    String(
                        conversationId
                    )
            );

        /*
         * إذا لم تكن موجودة حالياً،
         * نطلب من الـCore تحديث قائمته إن كان
         * يملك أحد هذه الـAPIs.
         */
        if (!exists) {

            const messagesCore =
                getCore();

            const possibleRefreshMethods = [

                "refreshConversations",

                "loadConversations",

                "fetchConversations",

                "refresh"

            ];

            for (
                const method
                of possibleRefreshMethods
            ) {

                if (
                    messagesCore &&
                    typeof
                        messagesCore[method] ===
                        "function"
                ) {

                    try {

                        await messagesCore[
                            method
                        ]();

                        break;

                    } catch (_) {}
                }
            }
        }

        /*
         * نخزن آخر رسالة فوراً.
         */
        applyLiveMessage(
            message
        );

        /*
         * نحدث القائمة فوراً.
         */
        await refresh(
            true
        );

        /*
         * نخلي بقية أجزاء نظام WFESC
         * تعرف أن هناك رسالة Realtime.
         */
        try {

            window.dispatchEvent(
                new CustomEvent(
                    "wfesc:conversation-live-message",
                    {
                        detail: {
                            message:
                                message,

                            conversationId:
                                conversationId
                        }
                    }
                )
            );

        } catch (_) {}
    }


    /* =========================================================
       START MESSAGE REALTIME
       ========================================================= */

    async function startMessageRealtime() {

        if (realtimeChannel) {
            return;
        }

        if (realtimeStarting) {
            return;
        }

        realtimeStarting =
            true;

        const supabaseClient =
            getSupabaseClient();

        if (
            !supabaseClient ||
            typeof
                supabaseClient.channel !==
                "function"
        ) {

            realtimeStarting =
                false;

            debug(
                "Supabase client غير جاهز للـ conversations realtime"
            );

            return;
        }

        try {

            const channel =
                supabaseClient.channel(
                    "wfesc-conversations-realtime"
                );

            channel.on(

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

                    handleRealtimeMessage(
                        payload
                    );

                }

            );

            /*
             * UPDATE مهم إذا صار تعديل على رسالة
             * ويجب أن يظهر في المعاينة.
             */
            channel.on(

                "postgres_changes",

                {
                    event:
                        "UPDATE",

                    schema:
                        "public",

                    table:
                        "messages"
                },

                payload => {

                    handleRealtimeMessage(
                        payload
                    );

                }

            );

            realtimeChannel =
                channel;

            channel.subscribe(
                status => {

                    debug(
                        "Messages realtime status:",
                        status
                    );

                    if (
                        status ===
                        "SUBSCRIBED"
                    ) {

                        realtimeStarting =
                            false;

                        return;
                    }

                    if (
                        status ===
                            "CHANNEL_ERROR" ||
                        status ===
                            "TIMED_OUT" ||
                        status ===
                            "CLOSED"
                    ) {

                        realtimeChannel =
                            null;

                        realtimeStarting =
                            false;

                    }

                }
            );

        } catch (error) {

            realtimeChannel =
                null;

            realtimeStarting =
                false;

            console.warn(
                "[WFESC CONVERSATIONS] realtime:",
                error
            );
        }
    }


    /* =========================================================
       STOP MESSAGE REALTIME
       ========================================================= */

    async function stopMessageRealtime() {

        if (!realtimeChannel) {
            return;
        }

        const channel =
            realtimeChannel;

        realtimeChannel =
            null;

        realtimeStarting =
            false;

        try {

            const supabaseClient =
                getSupabaseClient();

            if (
                supabaseClient &&
                typeof
                    supabaseClient.removeChannel ===
                    "function"
            ) {

                await supabaseClient.removeChannel(
                    channel
                );
            }

        } catch (_) {}
    }


    /* =========================================================
       FORMAT TIME
       ========================================================= */

    function formatTime(
        value
    ) {

        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }

        const now =
            new Date();

        const sameDay =
            date.toDateString() ===
            now.toDateString();

        if (sameDay) {

            return date.toLocaleTimeString(
                "ar-IQ",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );
        }

        return date.toLocaleDateString(
            "ar-IQ",
            {
                day:
                    "2-digit",

                month:
                    "2-digit"
            }
        );
    }


    /* =========================================================
       ACTIVITY STATE
       ========================================================= */

    function getActivityState(
        conversation
    ) {

        const contact =
            getContact(
                conversation
            );

        const userId =
            getUserId(
                conversation
            );

        if (
            isSupportConversation(
                conversation
            )
        ) {

            return {

                available:
                    true,

                online:
                    true,

                hidden:
                    false

            };
        }

        const activityApi =
            getActivity();

        if (
            activityApi &&
            userId &&
            typeof
                activityApi.getUserActivity ===
                "function"
        ) {

            try {

                const state =
                    activityApi.getUserActivity(
                        userId
                    );

                if (
                    state &&
                    typeof state ===
                        "object"
                ) {

                    const hidden =
                        state.show_activity ===
                            false ||
                        contact?.show_activity ===
                            false ||
                        conversation?.show_activity ===
                            false;

                    return {

                        available:
                            true,

                        online:
                            hidden
                                ? false
                                : Boolean(
                                    state.online
                                ),

                        hidden

                    };
                }

            } catch (error) {

                debug(
                    "activity error:",
                    error
                );
            }
        }

        const hidden =
            contact?.show_activity ===
                false ||
            conversation?.show_activity ===
                false;

        return {

            available:
                false,

            online:
                hidden
                    ? false
                    : Boolean(

                        contact?.is_online ??
                        conversation?.is_online ??
                        false

                    ),

            hidden

        };
    }


    /* =========================================================
       TYPING STATE
       ========================================================= */

    function getTypingState(
        conversationId
    ) {

        if (!conversationId) {
            return null;
        }

        const state =
            typingStates.get(
                String(
                    conversationId
                )
            );

        if (!state) {
            return null;
        }

        return state;
    }


    /* =========================================================
       IS TYPING
       ========================================================= */

    function isConversationTyping(
        conversation
    ) {

        const conversationId =
            getConversationId(
                conversation
            );

        if (!conversationId) {
            return false;
        }

        return Boolean(
            getTypingState(
                conversationId
            )
        );
    }


    /* =========================================================
       TYPING PREVIEW
       ========================================================= */

    function getPreview(
        conversation
    ) {

        if (
            isConversationTyping(
                conversation
            )
        ) {

            return "جاري الكتابة...";
        }

        return getLastMessage(
            conversation
        );
    }


    /* =========================================================
       SORT
       ========================================================= */

    function sortConversations(
        list
    ) {

        return [...list].sort(
            (
                a,
                b
            ) => {

                const first =
                    new Date(
                        getLastMessageTime(
                            a
                        ) || 0
                    ).getTime();

                const second =
                    new Date(
                        getLastMessageTime(
                            b
                        ) || 0
                    ).getTime();

                return second - first;
            }
        );
    }


    /* =========================================================
       UNIQUE
       ========================================================= */

    function uniqueConversations(
        list
    ) {

        const result =
            [];

        const seen =
            new Set();

        for (
            const conversation
            of list
        ) {

            const id =
                getConversationId(
                    conversation
                );

            if (!id) {
                continue;
            }

            const key =
                String(id);

            if (
                seen.has(
                    key
                )
            ) {

                continue;
            }

            seen.add(
                key
            );

            result.push(
                conversation
            );
        }

        return result;
    }


    /* =========================================================
       SIGNATURE
       ========================================================= */

    function buildSignature(
        list
    ) {

        return list.map(
            conversation => {

                const activityState =
                    getActivityState(
                        conversation
                    );

                const conversationId =
                    getConversationId(
                        conversation
                    );

                return [

                    conversationId,

                    getUserId(
                        conversation
                    ),

                    getDisplayName(
                        conversation
                    ),

                    getAvatar(
                        conversation
                    ),

                    getLastMessage(
                        conversation
                    ),

                    getLastMessageTime(
                        conversation
                    ),

                    activityState.online,

                    activityState.hidden,

                    isConversationTyping(
                        conversation
                    )

                ].join("::");

            }
        ).join("||");
    }


    /* =========================================================
       STYLES
       ========================================================= */

    function injectStyles() {

        const styleId =
            "wfesc-conversations-style";

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

            .wfesc-conversation-card{
                position:relative;
            }

            .wfesc-conversation-avatar-wrap{
                position:relative;
                width:52px;
                height:52px;
                min-width:52px;
                flex:0 0 52px;
            }

            .wfesc-conversation-avatar{
                width:52px;
                height:52px;
                border-radius:50%;
                object-fit:cover;
                display:block;
                background:#111;
                border:1px solid #292929;
            }

            .wfesc-conversation-online{
                position:absolute;
                right:1px;
                bottom:1px;
                width:13px;
                height:13px;
                border-radius:50%;
                background:#242424;
                border:2px solid #080808;
                box-sizing:border-box;
                transition:
                    background .2s ease,
                    box-shadow .2s ease;
            }

            .wfesc-conversation-online.active{
                background:#20d66b;
                box-shadow:
                    0 0 0 2px rgba(
                        32,
                        214,
                        107,
                        .12
                    ),
                    0 0 9px rgba(
                        32,
                        214,
                        107,
                        .55
                    );
            }

            .wfesc-conversation-info{
                min-width:0;
                flex:1;
            }

            .wfesc-conversation-name{
                font-weight:700;
                color:#fff;
                font-size:15px;
                line-height:1.35;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            }

            .wfesc-conversation-preview{
                margin-top:4px;
                color:#8e8e8e;
                font-size:13px;
                line-height:1.3;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                transition:
                    color .2s ease;
            }

            .wfesc-conversation-preview.typing{
                color:#20d66b;
                font-weight:600;
                animation:
                    wfescTypingPulse
                    1.1s
                    ease-in-out
                    infinite;
            }

            .wfesc-conversation-time{
                align-self:flex-start;
                color:#777;
                font-size:11px;
                white-space:nowrap;
                margin-right:6px;
            }

            .wfesc-conversation-main{
                display:flex;
                align-items:center;
                gap:11px;
                width:100%;
                min-width:0;
            }

            .wfesc-conversation-card[
                data-wfesc-conversation
            ]{
                cursor:pointer;
            }

            @keyframes wfescTypingPulse{

                0%{
                    opacity:.45;
                }

                50%{
                    opacity:1;
                }

                100%{
                    opacity:.45;
                }

            }

        `;

        document.head.appendChild(
            style
        );
    }


    /* =========================================================
       CREATE CARD
       ========================================================= */

    function createConversationCard(
        conversation
    ) {

        const conversationId =
            getConversationId(
                conversation
            );

        if (!conversationId) {
            return null;
        }

        const userId =
            getUserId(
                conversation
            );

        const name =
            getDisplayName(
                conversation
            );

        const username =
            getUsername(
                conversation
            );

        const avatar =
            getAvatar(
                conversation
            );

        const activityState =
            getActivityState(
                conversation
            );

        const typing =
            isConversationTyping(
                conversation
            );

        const preview =
            getPreview(
                conversation
            );

        const time =
            formatTime(
                getLastMessageTime(
                    conversation
                )
            );

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "conversation-card wfesc-conversation-card";

        card.dataset.wfescConversation =
            String(
                conversationId
            );

        if (userId) {

            card.dataset.wfescUserId =
                String(
                    userId
                );
        }

        card.innerHTML = `

            <div class="wfesc-conversation-main">

                <div class="wfesc-conversation-avatar-wrap">

                    <img
                        class="wfesc-conversation-avatar"
                        src="${escapeHTML(
                            avatar
                        )}"
                        alt="${escapeHTML(
                            name
                        )}"
                        title="${escapeHTML(
                            username
                        )}"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                    >

                    <span
                        class="
                            wfesc-conversation-online
                            ${activityState.online
                                ? "active"
                                : ""}
                        "
                        aria-hidden="true"
                    ></span>

                </div>

                <div class="wfesc-conversation-info">

                    <div
                        class="wfesc-conversation-name"
                        title="${escapeHTML(
                            name
                        )}"
                    >
                        ${escapeHTML(
                            name
                        )}
                    </div>

                    <div
                        class="
                            wfesc-conversation-preview
                            ${typing
                                ? "typing"
                                : ""}
                        "
                    >
                        ${escapeHTML(
                            preview
                        )}
                    </div>

                </div>

                ${
                    time
                        ? `
                            <div
                                class="
                                    wfesc-conversation-time
                                "
                            >
                                ${escapeHTML(
                                    time
                                )}
                            </div>
                        `
                        : ""
                }

            </div>
        `;

        const image =
            card.querySelector(
                ".wfesc-conversation-avatar"
            );

        if (image) {

            image.addEventListener(
                "error",
                () => {

                    if (
                        image.dataset
                            .fallbackApplied ===
                        "true"
                    ) {

                        return;
                    }

                    image.dataset
                        .fallbackApplied =
                        "true";

                    image.src =
                        CONFIG.DEFAULT_AVATAR;

                },
                {
                    once:
                        true
                }
            );
        }


        /* =====================================================
           OPEN CONVERSATION
           ===================================================== */

        card.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "a"
                    )
                ) {

                    return;
                }

                const messagesCore =
                    getCore();

                if (
                    messagesCore &&
                    typeof
                        messagesCore.openConversation ===
                        "function"
                ) {

                    messagesCore.openConversation(

                        conversationId,

                        getContact(
                            conversation
                        ),

                        conversation.type ||
                            null

                    );

                    return;
                }

                if (
                    typeof
                        window.WFESC_MESSAGES_OPEN_CONVERSATION ===
                        "function"
                ) {

                    window.WFESC_MESSAGES_OPEN_CONVERSATION(
                        conversationId
                    );
                }

            }
        );

        return card;
    }


    /* =========================================================
       RESOLVE CONTACTS
       ========================================================= */

    async function resolveConversationContacts(
        conversations
    ) {

        if (
            !Array.isArray(
                conversations
            ) ||
            !conversations.length
        ) {

            return;
        }

        await Promise.all(

            conversations.map(
                async conversation => {

                    const contact =
                        getContact(
                            conversation
                        );

                    const userId =
                        getUserId(
                            conversation
                        );

                    const hasName =
                        Boolean(
                            firstValue(

                                conversation?.display_name,

                                contact?.display_name,

                                contact?.full_name,

                                contact?.name,

                                conversation?.username,

                                contact?.username

                            )
                        );

                    const hasAvatar =
                        Boolean(
                            firstValue(

                                conversation?.avatar_url,

                                conversation?.avatar,

                                contact?.avatar_url,

                                contact?.avatar

                            )
                        );

                    if (
                        userId &&
                        hasName &&
                        hasAvatar
                    ) {

                        return;
                    }

                    await resolveContact(
                        conversation
                    );

                }
            )

        );
    }


    /* =========================================================
       MERGE CONTACT INTO CONVERSATION
       ========================================================= */

    function mergeCachedContacts(
        conversations
    ) {

        return conversations.map(
            conversation => {

                const conversationId =
                    getConversationId(
                        conversation
                    );

                const cached =
                    conversationId
                        ? getCachedContact(
                            conversationId
                        )
                        : null;

                if (!cached) {
                    return conversation;
                }

                return {

                    ...conversation,

                    contact:
                        cached,

                    user_id:
                        firstValue(

                            conversation.user_id,

                            cached.user_id

                        ),

                    display_name:
                        firstValue(

                            conversation.display_name,

                            cached.display_name

                        ),

                    username:
                        firstValue(

                            conversation.username,

                            cached.username

                        ),

                    avatar_url:
                        firstValue(

                            conversation.avatar_url,

                            cached.avatar_url

                        ),

                    is_online:
                        conversation.is_online ??
                        cached.is_online,

                    show_activity:
                        conversation.show_activity ??
                        cached.show_activity

                };

            }
        );
    }


    /* =========================================================
       RENDER
       ========================================================= */

    async function render(
        force = false
    ) {

        if (rendering) {
            return;
        }

        const listElement =
            getConversationList();

        if (!listElement) {
            return;
        }

        let conversations =
            getCurrentConversations();

        await resolveConversationContacts(
            conversations
        );

        conversations =
            mergeCachedContacts(
                getCurrentConversations()
            );

        const signature =
            buildSignature(
                conversations
            );

        if (
            !force &&
            signature ===
                lastRenderedSignature
        ) {

            return;
        }

        rendering =
            true;

        try {

            const fragment =
                document.createDocumentFragment();

            if (
                !conversations.length
            ) {

                listElement.innerHTML =
                    "";

            } else {

                conversations.forEach(
                    conversation => {

                        const card =
                            createConversationCard(
                                conversation
                            );

                        if (card) {

                            fragment.appendChild(
                                card
                            );
                        }

                    }
                );

                listElement.innerHTML =
                    "";

                listElement.appendChild(
                    fragment
                );
            }

            lastRenderedSignature =
                buildSignature(
                    conversations
                );

        } finally {

            rendering =
                false;
        }
    }


    /* =========================================================
       REFRESH ACTIVITY
       ========================================================= */

    function refreshActivity() {

        const listElement =
            getConversationList();

        if (!listElement) {
            return;
        }

        const messagesCore =
            getCore();

        if (
            !messagesCore ||
            typeof
                messagesCore.getConversations !==
                "function"
        ) {

            return;
        }

        const conversations =
            getCurrentConversations();

        const cards =
            listElement.querySelectorAll(
                "[data-wfesc-conversation]"
            );

        cards.forEach(
            card => {

                const conversationId =
                    card.dataset
                        .wfescConversation;

                const conversation =
                    conversations.find(
                        item =>
                            String(
                                getConversationId(
                                    item
                                )
                            ) ===
                            String(
                                conversationId
                            )
                    );

                if (!conversation) {
                    return;
                }

                const state =
                    getActivityState(
                        conversation
                    );

                const dot =
                    card.querySelector(
                        ".wfesc-conversation-online"
                    );

                if (dot) {

                    dot.classList.toggle(
                        "active",
                        Boolean(
                            state.online
                        )
                    );
                }

                const preview =
                    card.querySelector(
                        ".wfesc-conversation-preview"
                    );

                if (preview) {

                    const typing =
                        isConversationTyping(
                            conversation
                        );

                    preview.textContent =
                        getPreview(
                            conversation
                        );

                    preview.classList.toggle(
                        "typing",
                        typing
                    );
                }

            }
        );
    }


    /* =========================================================
       UPDATE ONE TYPING CARD
       ========================================================= */

    function updateTypingCard(
        conversationId
    ) {

        const listElement =
            getConversationList();

        if (!listElement) {
            return;
        }

        const card =
            listElement.querySelector(
                `[data-wfesc-conversation="${CSS.escape(
                    String(
                        conversationId
                    )
                )}"]`
            );

        if (!card) {
            return;
        }

        const conversations =
            getCurrentConversations();

        const conversation =
            conversations.find(
                item =>
                    String(
                        getConversationId(
                            item
                        )
                    ) ===
                    String(
                        conversationId
                    )
            );

        if (!conversation) {
            return;
        }

        const preview =
            card.querySelector(
                ".wfesc-conversation-preview"
            );

        if (!preview) {
            return;
        }

        const typing =
            isConversationTyping(
                conversation
            );

        preview.textContent =
            getPreview(
                conversation
            );

        preview.classList.toggle(
            "typing",
            typing
        );
    }


    /* =========================================================
       CLEAR TYPING
       ========================================================= */

    function clearTypingState(
        conversationId,
        userId = null
    ) {

        const key =
            String(
                conversationId
            );

        const current =
            typingStates.get(
                key
            );

        if (!current) {
            return;
        }

        if (
            userId &&
            String(
                current.userId
            ) !==
            String(
                userId
            )
        ) {

            return;
        }

        if (
            current.timer
        ) {

            clearTimeout(
                current.timer
            );
        }

        typingStates.delete(
            key
        );

        updateTypingCard(
            conversationId
        );
    }


    /* =========================================================
       REGISTER TYPING
       ========================================================= */

    function registerTypingState(
        conversationId,
        userId
    ) {

        if (
            !conversationId ||
            !userId
        ) {

            return;
        }

        const key =
            String(
                conversationId
            );

        const existing =
            typingStates.get(
                key
            );

        if (
            existing?.timer
        ) {

            clearTimeout(
                existing.timer
            );
        }

        const timer =
            setTimeout(
                () => {

                    clearTypingState(
                        conversationId,
                        userId
                    );

                },
                CONFIG.TYPING_TIMEOUT
            );

        typingStates.set(
            key,
            {

                userId:
                    userId,

                timer:
                    timer

            }
        );

        updateTypingCard(
            conversationId
        );
    }


    /* =========================================================
       HANDLE TYPING PAYLOAD
       ========================================================= */

    function handleTypingPayload(
        conversationId,
        payload
    ) {

        const data =
            payload?.payload ||
            payload ||
            {};

        const userId =
            data.user_id ||
            data.userId ||
            null;

        if (
            !userId
        ) {

            return;
        }

        const messagesCore =
            getCore();

        const currentUser =
            messagesCore &&
            typeof
                messagesCore.getCurrentUser ===
                "function"
                ? messagesCore.getCurrentUser()
                : null;

        if (
            currentUser?.id &&
            String(
                currentUser.id
            ) ===
            String(
                userId
            )
        ) {

            return;
        }

        if (
            data.typing ===
            true
        ) {

            registerTypingState(
                conversationId,
                userId
            );

        } else {

            clearTypingState(
                conversationId,
                userId
            );
        }
    }


    /* =========================================================
       SUBSCRIBE TYPING CHANNEL
       ========================================================= */

    async function subscribeTypingChannel(
        conversation
    ) {

        const conversationId =
            getConversationId(
                conversation
            );

        if (!conversationId) {
            return;
        }

        if (
            isSupportConversation(
                conversation
            )
        ) {

            return;
        }

        const key =
            String(
                conversationId
            );

        if (
            typingChannels.has(
                key
            )
        ) {

            return;
        }

        const messagesCore =
            getCore();

        const supabaseClient =
            messagesCore?.client ||
            window.WFESCSupabase ||
            null;

        if (
            !supabaseClient ||
            typeof
                supabaseClient.channel !==
                "function"
        ) {

            debug(
                "Supabase client غير جاهز للـ typing"
            );

            return;
        }

        const channelName =
            "wfesc-typing-" +
            key;

        try {

            const channel =
                supabaseClient.channel(
                    channelName,
                    {

                        config: {

                            broadcast: {

                                self:
                                    false

                            }

                        }

                    }
                );

            channel.on(

                "broadcast",

                {
                    event:
                        "typing"
                },

                payload => {

                    handleTypingPayload(
                        conversationId,
                        payload
                    );

                }

            );

            typingChannels.set(
                key,
                channel
            );

            channel.subscribe(
                status => {

                    if (
                        status !==
                        "SUBSCRIBED"
                    ) {

                        debug(
                            "Typing channel:",
                            key,
                            status
                        );
                    }

                }
            );

        } catch (error) {

            console.warn(
                "[WFESC CONVERSATIONS] typing channel:",
                error
            );
        }
    }


    /* =========================================================
       SYNC TYPING CHANNELS
       ========================================================= */

    async function syncTypingChannels(
        conversations
    ) {

        const wanted =
            new Set();

        conversations.forEach(
            conversation => {

                const id =
                    getConversationId(
                        conversation
                    );

                if (
                    id &&
                    !isSupportConversation(
                        conversation
                    )
                ) {

                    wanted.add(
                        String(id)
                    );
                }

            }
        );

        for (
            const [
                key,
                channel
            ]
            of typingChannels
        ) {

            if (
                wanted.has(
                    key
                )
            ) {

                continue;
            }

            try {

                const messagesCore =
                    getCore();

                const supabaseClient =
                    messagesCore?.client ||
                    window.WFESCSupabase ||
                    null;

                if (
                    supabaseClient &&
                    typeof
                        supabaseClient.removeChannel ===
                        "function"
                ) {

                    await supabaseClient.removeChannel(
                        channel
                    );
                }

            } catch (_) {}

            typingChannels.delete(
                key
            );

            clearTypingState(
                key
            );
        }

        for (
            const conversation
            of conversations
        ) {

            await subscribeTypingChannel(
                conversation
            );

        }
    }


    /* =========================================================
       REFRESH
       ========================================================= */

    async function refresh(
        force = true
    ) {

        const conversations =
            getCurrentConversations();

        await resolveConversationContacts(
            conversations
        );

        const merged =
            mergeCachedContacts(
                getCurrentConversations()
            );

        await syncTypingChannels(
            merged
        );

        await render(
            force
        );

        refreshActivity();
    }


    /* =========================================================
       EVENTS
       ========================================================= */

    function bindEvents() {

        if (eventBound) {
            return;
        }

        eventBound =
            true;


        window.addEventListener(
            "wfesc:activity-sync",
            () => {

                refreshActivity();

            }
        );


        window.addEventListener(
            "wfesc:activity-response",
            () => {

                refreshActivity();

            }
        );


        window.addEventListener(
            "wfesc:activity-state-changed",
            () => {

                refreshActivity();

            }
        );


        window.addEventListener(
            "wfesc:chat-header-refresh",
            () => {

                refreshActivity();

            }
        );


        window.addEventListener(
            "wfesc:conversations-refresh",
            () => {

                refresh(
                    true
                );

            }
        );


        window.addEventListener(
            "wfesc:conversation-updated",
            () => {

                refresh(
                    true
                );

            }
        );


        window.addEventListener(
            "wfesc:message-realtime",
            () => {

                refresh(
                    true
                );

            }
        );


        window.addEventListener(
            "wfesc:messages-refresh",
            () => {

                refresh(
                    true
                );

            }
        );


        /*
         * Realtime مستقل للقائمة.
         */
        window.addEventListener(
            "wfesc:conversation-live-message",
            () => {

                /*
                 * الحدث هنا موجود فقط للتكامل
                 * مع أي ملفات أخرى مستقبلاً.
                 */

            }
        );


        window.addEventListener(
            "wfesc:typing",
            event => {

                const detail =
                    event?.detail ||
                    {};

                const conversationId =
                    detail.conversationId ||
                    detail.conversation_id;

                if (
                    conversationId
                ) {

                    handleTypingPayload(
                        conversationId,
                        detail
                    );
                }

            }
        );


        window.addEventListener(
            "wfesc:typing-start",
            event => {

                const detail =
                    event?.detail ||
                    {};

                const conversationId =
                    detail.conversationId ||
                    detail.conversation_id;

                if (
                    conversationId
                ) {

                    handleTypingPayload(
                        conversationId,
                        {
                            ...detail,
                            typing:
                                true
                        }
                    );
                }

            }
        );


        window.addEventListener(
            "wfesc:typing-stop",
            event => {

                const detail =
                    event?.detail ||
                    {};

                const conversationId =
                    detail.conversationId ||
                    detail.conversation_id;

                if (
                    conversationId
                ) {

                    handleTypingPayload(
                        conversationId,
                        {
                            ...detail,
                            typing:
                                false
                        }
                    );
                }

            }
        );

    }


    /* =========================================================
       REFRESH TIMER
       ========================================================= */

    function startRefreshTimer() {

        if (
            refreshTimer
        ) {

            clearInterval(
                refreshTimer
            );
        }

        refreshTimer =
            setInterval(
                () => {

                    refresh(
                        false
                    );

                },
                CONFIG.REFRESH_INTERVAL
            );


        if (
            activityTimer
        ) {

            clearInterval(
                activityTimer
            );
        }

        activityTimer =
            setInterval(
                () => {

                    refreshActivity();

                },
                CONFIG.ACTIVITY_REFRESH_INTERVAL
            );
    }


    /* =========================================================
       WAIT FOR CORE
       ========================================================= */

    function waitForCore() {

        const attempt =
            () => {

                const messagesCore =
                    getCore();

                const list =
                    getConversationList();

                if (
                    messagesCore &&
                    list
                ) {

                    initialize();

                    return;
                }

                setTimeout(
                    attempt,
                    250
                );

            };

        attempt();
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    async function initialize() {

        if (
            initialized
        ) {

            return;
        }

        initialized =
            true;

        conversationList =
            getConversationList();

        injectStyles();

        bindEvents();

        await refresh(
            true
        );

        /*
         * تشغيل Realtime الخاص بقائمة المحادثات
         * بعد جاهزية Core وSupabase.
         */
        await startMessageRealtime();

        startRefreshTimer();

        debug(
            "messages-conversations.js initialized"
        );
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.WFESC_MESSAGES_CONVERSATIONS = {

        refresh,

        render,

        refreshActivity,

        getConversationList,

        getUserId,

        getDisplayName,

        getAvatar,

        getActivityState,

        getPreview,

        isConversationTyping,

        subscribeTypingChannel,

        syncTypingChannels,

        resolveContact,

        startMessageRealtime,

        stopMessageRealtime,

        getCurrentConversations

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
            waitForCore,
            {
                once:
                    true
            }
        );

    } else {

        waitForCore();

    }

})();
