(() => {
    "use strict";

    /*
    ============================================================
       WFESC MESSAGES CONVERSATIONS
       ---------------------------------------------------------
       قائمة المحادثات الرئيسية

       المسؤوليات:
       - عرض المحادثات الحقيقية فقط
       - الاسم الحقيقي
       - الصورة الحقيقية
       - الصورة الافتراضية
       - حالة النشاط
       - نقطة النشاط
       - جاري الكتابة...
       - تحديث القائمة تلقائياً
       - عدم إنشاء مستخدمين وهميين
       - الاعتماد على Messages Core
       - الاعتماد على Messages Activity
       - عدم تغيير messages.html
    ============================================================
    */


    /* =========================================================
       CONFIG
    ========================================================= */

    const CONFIG = {

        DEBUG: false,

        ACTIVITY_REFRESH:
            3000,

        TYPING_TIMEOUT:
            3500,

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

    let initialized = false;

    let rendering = false;

    let activityTimer = null;

    let refreshTimer = null;

    let eventBound = false;

    let lastSignature = "";

    /*
     * أكثر من محادثة يمكن أن يكون فيها typing
     * لذلك نستخدم Map بدلاً من متغير واحد.
     */
    const typingUsers =
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
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================================
       FIRST VALUE
    ========================================================= */

    function firstValue(...values) {

        for (const value of values) {

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
       GET LIST
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
       GET CONTACT
    ========================================================= */

    function getContact(conversation) {

        if (!conversation) {
            return null;
        }

        return (
            conversation.contact ||
            conversation.profile ||
            conversation.user ||
            conversation.other_user ||
            conversation.otherUser ||
            null
        );

    }


    /* =========================================================
       GET USER ID
    ========================================================= */

    function getUserId(conversation) {

        if (!conversation) {
            return null;
        }

        const contact =
            getContact(
                conversation
            );

        return firstValue(

            contact?.user_id,

            contact?.userId,

            contact?.profile_id,

            contact?.profileId,

            contact?.id,

            conversation.other_user_id,

            conversation.otherUserId,

            conversation.contact_user_id,

            conversation.contactUserId,

            conversation.user_id,

            conversation.userId,

            conversation.profile_id,

            conversation.profileId

        );

    }


    /* =========================================================
       GET CONVERSATION ID
    ========================================================= */

    function getConversationId(conversation) {

        if (!conversation) {
            return null;
        }

        return firstValue(

            conversation.id,

            conversation.conversation_id,

            conversation.conversationId

        );

    }


    /* =========================================================
       GET NAME
    ========================================================= */

    function getDisplayName(conversation) {

        const contact =
            getContact(
                conversation
            );

        const name =
            firstValue(

                conversation?.display_name,

                conversation?.displayName,

                contact?.display_name,

                contact?.displayName,

                contact?.full_name,

                contact?.fullName,

                contact?.name,

                conversation?.full_name,

                conversation?.fullName,

                conversation?.name

            );

        if (name) {

            return String(
                name
            );

        }


        const username =
            firstValue(

                conversation?.username,

                contact?.username

            );

        if (username) {

            return String(
                username
            );

        }


        return CONFIG.DEFAULT_NAME;

    }


    /* =========================================================
       GET USERNAME
    ========================================================= */

    function getUsername(conversation) {

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

    function getAvatar(conversation) {

        const contact =
            getContact(
                conversation
            );

        const avatar =
            firstValue(

                conversation?.avatar_url,

                conversation?.avatarUrl,

                conversation?.avatar,

                conversation?.photo_url,

                conversation?.photoUrl,

                contact?.avatar_url,

                contact?.avatarUrl,

                contact?.avatar,

                contact?.photo_url,

                contact?.photoUrl

            );

        return (
            avatar ||
            CONFIG.DEFAULT_AVATAR
        );

    }


    /* =========================================================
       GET LAST MESSAGE
    ========================================================= */

    function getLastMessage(conversation) {

        return String(
            firstValue(

                conversation?.last_message_text,

                conversation?.lastMessageText,

                conversation?.last_message_content,

                conversation?.lastMessageContent,

                conversation?.last_message,

                conversation?.lastMessage,

                conversation?.preview,

                conversation?.message,

                ""

            ) || ""
        );

    }


    /* =========================================================
       GET LAST MESSAGE TIME
    ========================================================= */

    function getLastMessageTime(conversation) {

        return firstValue(

            conversation?.last_message_at,

            conversation?.lastMessageAt,

            conversation?.last_message_created_at,

            conversation?.lastMessageCreatedAt,

            conversation?.updated_at,

            conversation?.updatedAt,

            conversation?.created_at,

            conversation?.createdAt

        );

    }


    /* =========================================================
       FORMAT TIME
    ========================================================= */

    function formatTime(value) {

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
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        }


        return date.toLocaleDateString(
            "ar-IQ",
            {
                day: "2-digit",
                month: "2-digit"
            }
        );

    }


    /* =========================================================
       SUPPORT
    ========================================================= */

    function isSupportConversation(
        conversation
    ) {

        const contact =
            getContact(
                conversation
            );

        return Boolean(

            conversation?.type ===
                "support" ||

            conversation?.is_support ===
                true ||

            contact?.is_support ===
                true

        );

    }


    /* =========================================================
       ACTIVITY
    ========================================================= */

    function getActivityState(
        conversation
    ) {

        if (
            isSupportConversation(
                conversation
            )
        ) {

            return {
                online: true,
                hidden: false,
                available: true
            };

        }


        const userId =
            getUserId(
                conversation
            );

        const contact =
            getContact(
                conversation
            );


        if (
            !userId
        ) {

            return {

                online: false,

                hidden:
                    contact?.show_activity ===
                        false ||
                    conversation?.show_activity ===
                        false,

                available: false

            };

        }


        const activityApi =
            getActivity();


        if (
            activityApi &&
            typeof activityApi.getUserActivity ===
                "function"
        ) {

            try {

                const result =
                    activityApi.getUserActivity(
                        userId
                    );


                if (
                    result &&
                    typeof result ===
                        "object"
                ) {

                    /*
                     * النظام الحالي يعتمد أساساً
                     * على online.
                     *
                     * إذا كان show_activity
                     * غير موجود لا نعتبره مخفياً.
                     */

                    const hidden =
                        result.show_activity ===
                            false;

                    return {

                        online:
                            !hidden &&
                            result.online ===
                                true,

                        hidden,

                        available: true

                    };

                }

            } catch (error) {

                debug(
                    "activity:",
                    error
                );

            }

        }


        /*
         * fallback
         */

        const hidden =
            contact?.show_activity ===
                false ||
            conversation?.show_activity ===
                false;


        return {

            online:
                !hidden &&
                Boolean(
                    contact?.is_online ??
                    conversation?.is_online ??
                    false
                ),

            hidden,

            available: false

        };

    }


    /* =========================================================
       TYPING KEY
    ========================================================= */

    function typingKey(
        conversationId,
        userId
    ) {

        if (
            !conversationId ||
            !userId
        ) {

            return null;

        }

        return (
            String(conversationId) +
            "::" +
            String(userId)
        );

    }


    /* =========================================================
       CORE TYPING
    ========================================================= */

    function checkCoreTyping(
        conversation
    ) {

        const messagesCore =
            getCore();

        const conversationId =
            getConversationId(
                conversation
            );

        const userId =
            getUserId(
                conversation
            );


        if (
            !messagesCore ||
            !conversationId ||
            !userId
        ) {

            return false;

        }


        /*
         * دعم أكثر من اسم محتمل
         * بدون كسر النظام الحالي.
         */

        const functions = [

            "isUserTyping",

            "isTyping",

            "getTypingState"

        ];


        for (
            const functionName
            of functions
        ) {

            if (
                typeof messagesCore[
                    functionName
                ] !==
                    "function"
            ) {

                continue;

            }


            try {

                const result =
                    messagesCore[
                        functionName
                    ](
                        conversationId,
                        userId
                    );


                if (
                    typeof result ===
                        "boolean"
                ) {

                    return result;

                }


                if (
                    result &&
                    typeof result ===
                        "object"
                ) {

                    return Boolean(

                        result.typing ??
                        result.isTyping ??
                        result.online

                    );

                }

            } catch (error) {

                debug(
                    "core typing:",
                    error
                );

            }

        }


        return false;

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
         * أولاً: Core
         */

        if (
            checkCoreTyping(
                conversation
            )
        ) {

            return true;

        }


        /*
         * ثانياً: Events المحلية
         */

        const key =
            typingKey(
                conversationId,
                userId
            );


        if (
            key &&
            typingUsers.has(
                key
            )
        ) {

            const expiresAt =
                typingUsers.get(
                    key
                );


            if (
                Date.now() <
                expiresAt
            ) {

                return true;

            }


            typingUsers.delete(
                key
            );

        }


        /*
         * ثالثاً: بيانات المحادثة
         */

        if (
            conversation?.is_typing ===
                true ||
            conversation?.isTyping ===
                true ||
            conversation?.typing ===
                true
        ) {

            return true;

        }


        return false;

    }


    /* =========================================================
       PREVIEW
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
       UNIQUE
    ========================================================= */

    function uniqueConversations(
        conversations
    ) {

        const result = [];

        const seen =
            new Set();


        for (
            const conversation
            of conversations
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
                seen.has(key)
            ) {

                continue;

            }


            seen.add(key);

            result.push(
                conversation
            );

        }


        return result;

    }


    /* =========================================================
       SORT
    ========================================================= */

    function sortConversations(
        conversations
    ) {

        return [
            ...conversations
        ].sort(
            (a, b) => {

                const aTime =
                    new Date(
                        getLastMessageTime(
                            a
                        ) || 0
                    ).getTime();

                const bTime =
                    new Date(
                        getLastMessageTime(
                            b
                        ) || 0
                    ).getTime();


                return (
                    bTime -
                    aTime
                );

            }
        );

    }


    /* =========================================================
       GET CORE CONVERSATIONS
    ========================================================= */

    function getCoreConversations() {

        const messagesCore =
            getCore();


        if (
            !messagesCore
        ) {

            return [];

        }


        if (
            typeof messagesCore.getConversations !==
                "function"
        ) {

            return [];

        }


        try {

            const result =
                messagesCore.getConversations();


            if (
                Array.isArray(
                    result
                )
            ) {

                return result;

            }

        } catch (error) {

            console.warn(
                "[WFESC CONVERSATIONS]",
                "getConversations error:",
                error
            );

        }


        return [];

    }


    /* =========================================================
       NORMALIZE
    ========================================================= */

    function getConversations() {

        let list =
            getCoreConversations();


        /*
         * فقط المحادثات التي لديها
         * conversation ID حقيقي.
         */

        list =
            list.filter(
                conversation =>
                    Boolean(
                        getConversationId(
                            conversation
                        )
                    )
            );


        return sortConversations(
            uniqueConversations(
                list
            )
        );

    }


    /* =========================================================
       SIGNATURE
    ========================================================= */

    function buildSignature(
        conversations
    ) {

        return conversations
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
       CSS
    ========================================================= */

    function injectStyles() {

        if (
            document.getElementById(
                "wfesc-conversations-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfesc-conversations-style";


        style.textContent = `

            .wfesc-conversation-card{
                position:relative;
            }

            .wfesc-conversation-main{
                display:flex;
                align-items:center;
                width:100%;
                min-width:0;
                gap:11px;
            }

            .wfesc-conversation-avatar-wrap{
                position:relative;
                width:52px;
                height:52px;
                min-width:52px;
                flex:0 0 52px;
            }

            .wfesc-conversation-avatar{
                display:block;
                width:52px;
                height:52px;
                border-radius:50%;
                object-fit:cover;
                background:#111;
                border:1px solid rgba(255,255,255,.10);
            }

            .wfesc-conversation-online{
                position:absolute;
                left:0;
                bottom:1px;
                width:13px;
                height:13px;
                border-radius:50%;
                background:#555;
                border:2px solid #030303;
                box-sizing:border-box;
                transition:
                    background .2s ease,
                    box-shadow .2s ease,
                    transform .2s ease;
            }

            .wfesc-conversation-online.active{
                background:#36e27b;
                box-shadow:
                    0 0 0 2px rgba(54,226,123,.10),
                    0 0 11px rgba(54,226,123,.55);
                transform:scale(1.02);
            }

            .wfesc-conversation-info{
                min-width:0;
                flex:1;
            }

            .wfesc-conversation-name{
                color:#fff;
                font-size:15px;
                font-weight:800;
                line-height:1.35;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            }

            .wfesc-conversation-preview{
                margin-top:4px;
                color:#929292;
                font-size:13px;
                line-height:1.35;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                transition:
                    color .2s ease;
            }

            .wfesc-conversation-preview.typing{
                color:#36e27b;
                font-weight:700;
                animation:
                    wfescTypingPulse
                    1.1s
                    ease-in-out
                    infinite;
            }

            .wfesc-conversation-time{
                align-self:flex-start;
                color:#777;
                font-size:10px;
                white-space:nowrap;
                margin-right:5px;
            }

            .wfesc-conversation-card{
                cursor:pointer;
            }

            @keyframes wfescTypingPulse{
                0%{
                    opacity:.55;
                }

                50%{
                    opacity:1;
                }

                100%{
                    opacity:.55;
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
                        class="wfesc-conversation-avatar avatar"
                        src="${escapeHTML(avatar)}"
                        alt="${escapeHTML(name)}"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                    >

                    <span
                        class="
                            wfesc-conversation-online
                            online-dot
                            ${activityState.online
                                ? "active"
                                : ""}
                        "
                        aria-hidden="true"
                    ></span>

                </div>


                <div
                    class="wfesc-conversation-info conversation-info"
                >

                    <div
                        class="
                            wfesc-conversation-name
                            conversation-name
                        "
                        title="${escapeHTML(name)}"
                    >
                        ${escapeHTML(name)}
                    </div>


                    <div
                        class="
                            wfesc-conversation-preview
                            conversation-preview
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
                                class="
                                    wfesc-conversation-time
                                    conversation-time
                                "
                            >
                                ${escapeHTML(time)}
                            </div>
                        `
                        : ""
                }

            </div>

        `;


        /* =====================================================
           IMAGE FALLBACK
        ===================================================== */

        const image =
            card.querySelector(
                ".wfesc-conversation-avatar"
            );


        if (image) {

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
                    typeof messagesCore.openConversation ===
                        "function"
                ) {

                    try {

                        messagesCore.openConversation(
                            conversationId,
                            getContact(
                                conversation
                            ),
                            conversation.type ||
                            null
                        );

                        return;

                    } catch (error) {

                        debug(
                            "openConversation:",
                            error
                        );

                    }

                }


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

            return;

        }


        const conversations =
            getConversations();


        const signature =
            buildSignature(
                conversations
            );


        if (
            !force &&
            signature ===
                lastSignature
        ) {

            return;

        }


        rendering =
            true;


        try {

            const fragment =
                document.createDocumentFragment();


            if (
                conversations.length ===
                    0
            ) {

                listElement.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            💬
                        </div>

                        <strong>
                            لا توجد محادثات
                        </strong>

                        <p>
                            ستظهر هنا المحادثات التي تبدأ بها.
                        </p>

                    </div>

                `;

            } else {

                conversations.forEach(
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


            lastSignature =
                signature;

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


        if (
            !listElement
        ) {

            return;

        }


        const conversations =
            getConversations();


        const cards =
            listElement.querySelectorAll(
                "[data-wfesc-conversation]"
            );


        cards.forEach(
            card => {

                const conversationId =
                    card.dataset.wfescConversation;


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
                        state.online ===
                            true
                    );

                }


                const preview =
                    card.querySelector(
                        ".wfesc-conversation-preview"
                    );


                if (
                    preview
                ) {

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
       REFRESH
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
       TYPING START
    ========================================================= */

    function setTyping(
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
            typingKey(
                conversationId,
                userId
            );


        if (!key) {
            return;
        }


        typingUsers.set(
            key,
            Date.now() +
            CONFIG.TYPING_TIMEOUT
        );


        refresh(
            true
        );


        setTimeout(
            () => {

                const expiresAt =
                    typingUsers.get(
                        key
                    );


                if (
                    expiresAt &&
                    Date.now() >=
                        expiresAt
                ) {

                    typingUsers.delete(
                        key
                    );


                    refresh(
                        true
                    );

                }

            },
            CONFIG.TYPING_TIMEOUT + 100
        );

    }


    /* =========================================================
       TYPING STOP
    ========================================================= */

    function clearTyping(
        conversationId,
        userId
    ) {

        if (
            !conversationId
        ) {

            return;

        }


        if (
            userId
        ) {

            typingUsers.delete(
                typingKey(
                    conversationId,
                    userId
                )
            );

        } else {

            const prefix =
                String(
                    conversationId
                ) +
                "::";


            for (
                const key
                of typingUsers.keys()
            ) {

                if (
                    key.startsWith(
                        prefix
                    )
                ) {

                    typingUsers.delete(
                        key
                    );

                }

            }

        }


        refresh(
            true
        );

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
            firstValue(

                detail.conversationId,

                detail.conversation_id,

                detail.target_conversation_id,

                detail.targetConversationId

            );


        const userId =
            firstValue(

                detail.userId,

                detail.user_id,

                detail.sender_id,

                detail.senderId

            );


        const typing =
            detail.typing ??
            detail.isTyping ??
            detail.is_typing;


        if (
            typing ===
                false
        ) {

            clearTyping(
                conversationId,
                userId
            );

            return;

        }


        if (
            !conversationId ||
            !userId
        ) {

            return;

        }


        setTyping(
            conversationId,
            userId
        );

    }


    /* =========================================================
       EVENT BINDING
    ========================================================= */

    function bindEvents() {

        if (
            eventBound
        ) {

            return;

        }


        eventBound =
            true;


        /* =====================================================
           ACTIVITY
        ===================================================== */

        const activityEvents = [

            "wfesc:activity-sync",

            "wfesc:activity-response",

            "wfesc:activity-state-changed",

            "wfesc:chat-header-refresh"

        ];


        activityEvents.forEach(
            eventName => {

                window.addEventListener(
                    eventName,
                    () => {

                        refreshActivity();

                    }
                );

            }
        );


        /* =====================================================
           TYPING
        ===================================================== */

        window.addEventListener(
            "wfesc:typing",
            handleTypingEvent
        );


        window.addEventListener(
            "wfesc:typing-start",
            handleTypingEvent
        );


        window.addEventListener(
            "wfesc:conversation-typing",
            handleTypingEvent
        );


        window.addEventListener(
            "wfesc:typing-stop",
            event => {

                const detail =
                    event?.detail ||
                    {};


                handleTypingEvent(
                    {
                        detail: {
                            ...detail,
                            typing: false
                        }
                    }
                );

            }
        );


        /* =====================================================
           CONVERSATIONS
        ===================================================== */

        const conversationEvents = [

            "wfesc:conversations-refresh",

            "wfesc:conversation-updated",

            "wfesc:message-realtime",

            "wfesc:messages-refresh"

        ];


        conversationEvents.forEach(
            eventName => {

                window.addEventListener(
                    eventName,
                    () => {

                        refresh(
                            true
                        );

                    }
                );

            }
        );


        /*
         * بعض الأنظمة قد ترسل حدثاً
         * باسم مختلف عند وصول رسالة.
         */

        window.addEventListener(
            "wfesc:new-message",
            () => {

                refresh(
                    true
                );

            }
        );


        window.addEventListener(
            "wfesc:message-sent",
            () => {

                refresh(
                    true
                );

            }
        );

    }


    /* =========================================================
       START TIMERS
    ========================================================= */

    function startTimers() {

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
                CONFIG.ACTIVITY_REFRESH
            );


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

                    /*
                     * نعيد فحص المحادثات
                     * بدون إجبار إعادة البناء
                     * إذا لم يتغير شيء.
                     */

                    render(
                        false
                    );

                    refreshActivity();

                },
                5000
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

        startTimers();


        debug(
            "WFESC conversations initialized"
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

        getConversations

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
                once: true
            }
        );

    } else {

        waitForCore();

    }

})();
