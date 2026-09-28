(() => {
    "use strict";

    /*
    ============================================================
       WFESC MESSAGES CONVERSATIONS
       ---------------------------------------------------------
       مسؤول عن قائمة المحادثات الرئيسية فقط

       الوظائف:
       - الاسم الحقيقي
       - الصورة الحقيقية
       - الصورة الافتراضية عند عدم وجود صورة
       - نقطة النشاط الخضراء
       - حالة النشاط الحقيقية
       - جاري الكتابة...
       - تحديث القائمة بدون إعادة تحميل الصفحة
       - الاعتماد على Messages Core
       - الاعتماد على Messages Activity
       - دعم Supabase Realtime
       - عدم إنشاء مستخدمين وهميين
       - إخفاء المستخدمين الذين لا توجد معهم محادثة
    ============================================================
    */

    /* =========================================================
       CONFIG
    ========================================================= */

    const CONFIG = {

        DEBUG:
            false,

        REFRESH_INTERVAL:
            5000,

        TYPING_TIMEOUT:
            3000,

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

    let core =
        null;

    let activity =
        null;

    let conversationList =
        null;

    let refreshTimer =
        null;

    let initialized =
        false;

    let rendering =
        false;

    let currentTypingConversation =
        null;

    let currentTypingUser =
        null;

    let lastRenderedSignature =
        "";

    let eventBound =
        false;


    /* =========================================================
       DEBUG
    ========================================================= */

    function debug(
        ...args
    ) {

        if (
            !CONFIG.DEBUG
        ) {
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

    function escapeHTML(
        value
    ) {

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
       GET CORE
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
       GET ACTIVITY
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
       GET CONVERSATION LIST
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
       GET VALUE
    ========================================================= */

    function firstValue(
        ...values
    ) {

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
       GET USER ID
    ========================================================= */

    function getUserId(
        conversation
    ) {

        if (
            !conversation
        ) {

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
       GET CONTACT
    ========================================================= */

    function getContact(
        conversation
    ) {

        if (
            !conversation
        ) {

            return null;

        }

        return (
            conversation.contact ||
            conversation.profile ||
            conversation.user ||
            conversation
        );

    }


    /* =========================================================
       GET DISPLAY NAME
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

        if (
            name
        ) {

            return String(
                name
            );

        }


        const username =
            firstValue(

                conversation?.username,

                contact?.username

            );

        if (
            username
        ) {

            return String(
                username
            );

        }


        return CONFIG.DEFAULT_NAME;

    }


    /* =========================================================
       GET USERNAME
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
       GET AVATAR
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
       GET CONVERSATION ID
    ========================================================= */

    function getConversationId(
        conversation
    ) {

        if (
            !conversation
        ) {

            return null;

        }

        return firstValue(

            conversation.id,

            conversation.conversation_id

        );

    }


    /* =========================================================
       GET LAST MESSAGE
    ========================================================= */

    function getLastMessage(
        conversation
    ) {

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
       GET LAST MESSAGE TIME
    ========================================================= */

    function getLastMessageTime(
        conversation
    ) {

        return firstValue(

            conversation?.last_message_at,

            conversation?.last_message_created_at,

            conversation?.updated_at,

            conversation?.created_at

        );

    }


    /* =========================================================
       FORMAT TIME
    ========================================================= */

    function formatTime(
        value
    ) {

        if (
            !value
        ) {

            return "";

        }

        const date =
            new Date(
                value
            );

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


        if (
            sameDay
        ) {

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
       GET ACTIVITY STATE
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


        /*
         * الدعم حالة خاصة.
         */

        if (
            contact?.is_support ||
            conversation?.type ===
                "support"
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
            typeof activityApi.getUserActivity ===
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

            } catch (
                error
            ) {

                debug(
                    "activity error",
                    error
                );

            }

        }


        /*
         * fallback من بيانات المحادثة
         */

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
       IS TYPING
    ========================================================= */

    function isConversationTyping(
        conversation
    ) {

        const conversationId =
            getConversationId(
                conversation
            );

        const userId =
            getUserId(
                conversation
            );


        if (
            !conversationId ||
            !userId
        ) {

            return false;

        }


        /*
         * إذا كان Core يوفّر حالة typing
         * نستخدمها مباشرة.
         */

        if (
            core &&
            typeof core.isUserTyping ===
                "function"
        ) {

            try {

                return Boolean(
                    core.isUserTyping(
                        conversationId,
                        userId
                    )
                );

            } catch (_) {}

        }


        /*
         * fallback داخلي للأحداث.
         */

        if (
            currentTypingConversation &&
            String(
                currentTypingConversation
            ) ===
            String(
                conversationId
            ) &&
            currentTypingUser &&
            String(
                currentTypingUser
            ) ===
            String(
                userId
            )
        ) {

            return true;

        }


        return false;

    }


    /* =========================================================
       GET PREVIEW
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


        const message =
            getLastMessage(
                conversation
            );


        if (
            message
        ) {

            return message;

        }


        return "";

    }


    /* =========================================================
       SORT CONVERSATIONS
    ========================================================= */

    function sortConversations(
        list
    ) {

        return [
            ...list
        ].sort(
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

                return (
                    second -
                    first
                );

            }
        );

    }


    /* =========================================================
       REMOVE DUPLICATES
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

            if (
                !id
            ) {

                continue;

            }

            const key =
                String(
                    id
                );

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
       BUILD SIGNATURE
    ========================================================= */

    function buildSignature(
        list
    ) {

        return list
            .map(
                conversation => {

                    const activityState =
                        getActivityState(
                            conversation
                        );

                    return [

                        getConversationId(
                            conversation
                        ),

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

                    ].join(
                        "::"
                    );

                }
            )
            .join(
                "||"
            );

    }


    /* =========================================================
       CREATE STYLE
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
                    0 0 0 2px rgba(32,214,107,.12),
                    0 0 9px rgba(32,214,107,.55);
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


            .wfesc-conversation-card[data-wfesc-conversation]{
                cursor:pointer;
            }


            .wfesc-conversation-card[data-wfesc-conversation]:hover
            .wfesc-conversation-name{
                color:#fff;
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


            .wfesc-conversation-preview.typing{
                animation:
                    wfescTypingPulse
                    1.1s
                    ease-in-out
                    infinite;
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

        if (
            !conversationId
        ) {

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


        /*
         * نستخدم أكثر من class حتى يبقى
         * متوافقاً مع التصميم الموجود.
         */

        card.className =
            [
                "conversation-card",
                "wfesc-conversation-card"
            ].join(
                " "
            );


        card.dataset.wfescConversation =
            String(
                conversationId
            );


        if (
            userId
        ) {

            card.dataset.wfescUserId =
                String(
                    userId
                );

        }


        card.innerHTML = `

            <div
                class="wfesc-conversation-main"
            >

                <div
                    class="wfesc-conversation-avatar-wrap"
                >

                    <img
                        class="wfesc-conversation-avatar"
                        src="${escapeHTML(avatar)}"
                        alt="${escapeHTML(name)}"
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


                <div
                    class="wfesc-conversation-info"
                >

                    <div
                        class="wfesc-conversation-name"
                        title="${escapeHTML(name)}"
                    >
                        ${escapeHTML(name)}
                    </div>


                    <div
                        class="
                            wfesc-conversation-preview
                            ${typing
                                ? "typing"
                                : ""}
                        "
                    >
                        ${escapeHTML(preview)}
                    </div>

                </div>


                ${
                    time
                        ? `
                            <div
                                class="wfesc-conversation-time"
                            >
                                ${escapeHTML(time)}
                            </div>
                        `
                        : ""
                }

            </div>

        `;


        /*
         * إذا الصورة غير موجودة
         * نرجع للصورة الافتراضية.
         */

        const image =
            card.querySelector(
                ".wfesc-conversation-avatar"
            );


        if (
            image
        ) {

            image.addEventListener(
                "error",
                () => {

                    if (
                        image.dataset.fallbackApplied ===
                        "true"
                    ) {

                        return;

                    }

                    image.dataset.fallbackApplied =
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


        /*
         * فتح المحادثة
         */

        card.addEventListener(
            "click",
            event => {

                /*
                 * لا نريد فتح المحادثة
                 * إذا ضغط على رابط داخلي مستقبلاً.
                 */

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
                    typeof messagesCore.openConversation ===
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


                /*
                 * fallback
                 */

                if (
                    typeof window.WFESC_MESSAGES_OPEN_CONVERSATION ===
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
       RENDER
    ========================================================= */

    function render(
        force = false
    ) {

        if (
            rendering
        ) {

            return;

        }


        const listElement =
            getConversationList();


        if (
            !listElement
        ) {

            debug(
                "conversationList غير موجود"
            );

            return;

        }


        const messagesCore =
            getCore();


        if (
            !messagesCore ||
            typeof messagesCore.getConversations !==
                "function"
        ) {

            debug(
                "Messages Core غير جاهز"
            );

            return;

        }


        let conversationsData;


        try {

            conversationsData =
                messagesCore.getConversations();

        } catch (
            error
        ) {

            console.warn(
                "[WFESC CONVERSATIONS] getConversations:",
                error
            );

            return;

        }


        if (
            !Array.isArray(
                conversationsData
            )
        ) {

            conversationsData =
                [];

        }


        /*
         * فقط المحادثات الفعلية.
         */

        conversationsData =
            conversationsData.filter(
                conversation => {

                    return Boolean(
                        getConversationId(
                            conversation
                        )
                    );

                }
            );


        conversationsData =
            uniqueConversations(
                conversationsData
            );


        conversationsData =
            sortConversations(
                conversationsData
            );


        const signature =
            buildSignature(
                conversationsData
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
                !conversationsData.length
            ) {

                /*
                 * لا نضيف مستخدمين وهميين.
                 * نخلي القائمة فارغة حتى Core
                 * أو الواجهة الأصلية تتعامل معها.
                 */

                listElement.innerHTML =
                    "";

            } else {

                conversationsData.forEach(
                    conversation => {

                        const card =
                            createConversationCard(
                                conversation
                            );

                        if (
                            card
                        ) {

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
                signature;

        } finally {

            rendering =
                false;

        }

    }


    /* =========================================================
       REFRESH ACTIVITY ONLY
    ========================================================= */

    function refreshActivity() {

        const listElement =
            getConversationList();


        if (
            !listElement
        ) {

            return;

        }


        const cards =
            listElement.querySelectorAll(
                "[data-wfesc-conversation]"
            );


        cards.forEach(
            card => {

                const conversationId =
                    card.dataset.wfescConversation;


                const messagesCore =
                    getCore();


                if (
                    !messagesCore ||
                    typeof messagesCore.getConversations !==
                        "function"
                ) {

                    return;

                }


                const conversationsData =
                    messagesCore.getConversations();


                const conversation =
                    conversationsData.find(
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


                if (
                    !conversation
                ) {

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


                if (
                    dot
                ) {

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


                const typing =
                    isConversationTyping(
                        conversation
                    );


                if (
                    preview
                ) {

                    const text =
                        getPreview(
                            conversation
                        );


                    preview.textContent =
                        text;


                    preview.classList.toggle(
                        "typing",
                        typing
                    );

                }

            }
        );

    }


    /* =========================================================
       FULL REFRESH
    ========================================================= */

    function refresh(
        force = true
    ) {

        render(
            force
        );

        refreshActivity();

    }


    /* =========================================================
       TYPING EVENT
    ========================================================= */

    function handleTypingEvent(
        event
    ) {

        const detail =
            event?.detail ||
            {};


        const conversationId =
            detail.conversationId ||
            detail.conversation_id ||
            detail.target_conversation_id ||
            null;


        const userId =
            detail.userId ||
            detail.user_id ||
            detail.sender_id ||
            null;


        if (
            detail.typing ===
                false ||
            detail.isTyping ===
                false
        ) {

            if (
                conversationId &&
                String(
                    currentTypingConversation
                ) ===
                    String(
                        conversationId
                    )
            ) {

                currentTypingConversation =
                    null;

                currentTypingUser =
                    null;

            }


            refresh(
                true
            );

            return;

        }


        if (
            !conversationId ||
            !userId
        ) {

            return;

        }


        currentTypingConversation =
            conversationId;

        currentTypingUser =
            userId;


        refresh(
            true
        );


        setTimeout(
            () => {

                if (
                    String(
                        currentTypingConversation
                    ) ===
                        String(
                            conversationId
                        ) &&
                    String(
                        currentTypingUser
                    ) ===
                        String(
                            userId
                        )
                ) {

                    currentTypingConversation =
                        null;

                    currentTypingUser =
                        null;

                    refresh(
                        true
                    );

                }

            },
            CONFIG.TYPING_TIMEOUT
        );

    }


    /* =========================================================
       REALTIME / CORE EVENTS
    ========================================================= */

    function bindEvents() {

        if (
            eventBound
        ) {

            return;

        }


        eventBound =
            true;


        /*
         * النشاط
         */

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
            "wfesc:chat-header-refresh",
            () => {

                refreshActivity();

            }
        );


        /*
         * الكتابة
         */

        window.addEventListener(
            "wfesc:typing",
            handleTypingEvent
        );


        window.addEventListener(
            "wfesc:typing-start",
            handleTypingEvent
        );


        window.addEventListener(
            "wfesc:typing-stop",
            event => {

                handleTypingEvent(
                    {
                        detail:
                            {
                                ...(
                                    event?.detail ||
                                    {}
                                ),

                                typing:
                                    false
                            }
                    }
                );

            }
        );


        window.addEventListener(
            "wfesc:conversation-typing",
            handleTypingEvent
        );


        /*
         * أي تحديث عام للمحادثات.
         */

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
         * Realtime العام لـ Supabase.
         * Core نفسه مسؤول عن الاتصال الحقيقي.
         * نحن فقط نعيد فحص القائمة.
         */

        window.addEventListener(
            "wfesc:activity-state-changed",
            () => {

                refreshActivity();

            }
        );

    }


    /* =========================================================
       PERIODIC ACTIVITY REFRESH
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

                    refreshActivity();

                },
                CONFIG.REFRESH_INTERVAL
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

    function initialize() {

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

        render(
            true
        );

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

        isConversationTyping

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
