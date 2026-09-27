(() => {
    "use strict";

    /*
    ============================================================
       WFESC MESSAGES CORE
       الإصدار المحسن

       مسؤول عن:
       - Supabase
       - المستخدم الحالي
       - المحادثات
       - فتح المحادثة
       - تحميل الرسائل
       - فتح المحادثة من آخر رسالة
       - Realtime للرسائل
       - جاري الكتابة
       - بيانات جهة الاتصال
       - رسم الرسائل
       - منع تكرار الرسائل
       - ربط إعدادات الفقاعات
    ============================================================
    */


    /* =========================================================
       SUPABASE
    ========================================================= */

    const SUPABASE_URL =
        "https://mcgbzfgbaxwmutniorlw.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_V9RaHJDWmhox-XMzj1SK_w_6p5pAK5L";

    const client =
        window.WFESCSupabase ||
        window.supabase?.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    if (!client) {
        console.error(
            "WFESC: Supabase client لم يتم تحميله."
        );
        return;
    }


    /* =========================================================
       CONSTANTS
    ========================================================= */

    const SUPPORT_AVATAR =
        "./sborts-wfesc-help.jpg";

    const SUPPORT_NAME =
        "تواصل مع فريق الدعم الشامل";


    const DEFAULT_AVATAR =
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
        `);


    /* =========================================================
       STATE
    ========================================================= */

    let currentUser = null;

    let currentConversationId = null;

    let currentConversationContact = null;

    let conversations = [];

    let currentMessages = [];

    let messageChannel = null;

    let typingChannel = null;

    let presenceChannel = null;

    let notificationChannel = null;

    let initialized = false;

    let conversationLoadToken = 0;

    let typingTimer = null;

    let isTyping = false;

    let typingUsers = new Set();

    let realtimeStarted = false;

    let realtimeConversationId = null;

    let lastRenderedMessageId = null;


    /* =========================================================
       DOM
    ========================================================= */

    const page =
        document.getElementById(
            "messagesPage"
        );

    const conversationList =
        document.getElementById(
            "conversationList"
        );

    const searchSection =
        document.getElementById(
            "searchSection"
        );

    const chatView =
        document.getElementById(
            "chatView"
        );

    const chatMessages =
        document.getElementById(
            "chatMessages"
        );

    const backChatButton =
        document.getElementById(
            "backChatButton"
        );

    const chatAvatar =
        document.getElementById(
            "chatAvatar"
        );

    const chatName =
        document.getElementById(
            "chatName"
        );

    const chatStatus =
        document.getElementById(
            "chatStatus"
        );

    const chatOnlineDot =
        document.getElementById(
            "chatOnlineDot"
        );

    const messageInput =
        document.getElementById(
            "messageInput"
        );


    /* =========================================================
       HELPERS
    ========================================================= */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


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

        return date.toLocaleTimeString(
            "ar-IQ",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function getDisplayName(contact) {

        if (!contact) {
            return "مستخدم";
        }

        return (
            contact.display_name ||
            contact.username ||
            "مستخدم"
        );
    }


    function avatarUrl(contact) {

        return (
            contact?.avatar_url ||
            DEFAULT_AVATAR
        );
    }


    function getMessageId(message) {

        if (!message) {
            return null;
        }

        return (
            message.id ??
            message.message_id ??
            null
        );
    }


    function getMessageTime(message) {

        return (
            message?.created_at ||
            message?.sent_at ||
            message?.inserted_at ||
            null
        );
    }


    function getMessageSenderId(message) {

        return (
            message?.sender_id ??
            message?.user_id ??
            message?.from_user_id ??
            null
        );
    }


    function getMessageContent(message) {

        return (
            message?.content ??
            message?.message ??
            message?.message_content ??
            ""
        );
    }


    function isMessageMine(message) {

        const senderId =
            getMessageSenderId(message);

        return (
            senderId != null &&
            currentUser?.id != null &&
            String(senderId) ===
            String(currentUser.id)
        );
    }


    /* =========================================================
       SCROLL SYSTEM
    ========================================================= */

    function scrollChatToBottom(
        behavior = "smooth"
    ) {

        if (!chatMessages) {
            return;
        }

        const target =
            Math.max(
                0,
                chatMessages.scrollHeight -
                chatMessages.clientHeight
            );

        if (
            typeof chatMessages.scrollTo ===
            "function"
        ) {

            chatMessages.scrollTo({
                top: target,
                behavior
            });

        } else {

            chatMessages.scrollTop =
                target;
        }
    }


    function forceScrollToBottom() {

        if (!chatMessages) {
            return;
        }

        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }


    function isNearBottom() {

        if (!chatMessages) {
            return true;
        }

        return (
            chatMessages.scrollHeight -
            chatMessages.scrollTop -
            chatMessages.clientHeight
        ) < 150;
    }


    /*
       عند فتح المحادثة لا نترك المستخدم يشاهد
       الرسائل من البداية ثم ننزل للأسفل.

       نرسم الرسائل،
       نضع الموضع مباشرة في النهاية،
       وبعدها نسمح بالتمرير الطبيعي.
    */
    function revealChatAtBottom() {

        if (!chatMessages) {
            return;
        }

        chatMessages.style.visibility =
            "hidden";

        forceScrollToBottom();

        requestAnimationFrame(() => {

            forceScrollToBottom();

            chatMessages.style.visibility =
                "visible";

            /*
               تحديث إضافي بعد اكتمال الصور/الخطوط.
            */
            setTimeout(() => {

                forceScrollToBottom();

            }, 50);

            setTimeout(() => {

                forceScrollToBottom();

            }, 180);
        });
    }


    /* =========================================================
       MESSAGE SETTINGS
    ========================================================= */

    function applyMessageSettings() {

        try {

            const settings =
                window.WFESC_MESSAGE_SETTINGS;

            if (!settings) {
                return;
            }


            /*
               النسخة الجديدة من settings
               تستخدم apply / get.
            */
            if (
                typeof settings.apply ===
                "function"
            ) {

                if (
                    typeof settings.get ===
                    "function"
                ) {

                    settings.apply(
                        settings.get()
                    );

                } else {

                    settings.apply();
                }

                return;
            }


            /*
               دعم النسخة القديمة أيضًا.
            */
            if (
                typeof settings.applySettings ===
                "function"
            ) {

                if (
                    typeof settings.getSettings ===
                    "function"
                ) {

                    settings.applySettings(
                        settings.getSettings()
                    );

                } else {

                    settings.applySettings();
                }
            }

        } catch (error) {

            console.warn(
                "WFESC message settings:",
                error
            );
        }
    }


    function scheduleMessageSettingsApply() {

        if (
            typeof requestAnimationFrame ===
            "function"
        ) {

            requestAnimationFrame(
                applyMessageSettings
            );

        } else {

            setTimeout(
                applyMessageSettings,
                0
            );
        }
    }


    /* =========================================================
       SUPPORT
    ========================================================= */

    function getSupportContact() {

        return {

            user_id: null,

            display_name:
                SUPPORT_NAME,

            username:
                "wfesc",

            avatar_url:
                SUPPORT_AVATAR,

            is_online: true,

            show_activity: true,

            is_support: true
        };
    }


    /* =========================================================
       GET CONTACT
    ========================================================= */

    async function getConversationContact(
        conversationId,
        type
    ) {

        if (type === "support") {
            return getSupportContact();
        }

        const {
            data,
            error
        } = await client.rpc(
            "get_conversation_contacts",
            {
                target_conversation_id:
                    conversationId
            }
        );

        if (error) {

            console.error(
                "WFESC contact error:",
                error
            );

            return null;
        }

        if (!data) {
            return null;
        }

        if (Array.isArray(data)) {
            return data[0] || null;
        }

        return data;
    }


    /* =========================================================
       SUPPORT CONVERSATION
    ========================================================= */

    async function ensureSupportConversation() {

        try {

            const {
                data,
                error
            } = await client.rpc(
                "get_or_create_support_conversation"
            );

            if (error) {

                console.error(
                    "WFESC support error:",
                    error
                );

                return null;
            }

            if (!data) {
                return null;
            }

            if (
                typeof data ===
                "string"
            ) {

                return data;
            }

            return (
                data.conversation_id ||
                data.id ||
                data[0]?.conversation_id ||
                data[0]?.id ||
                null
            );

        } catch (error) {

            console.error(
                "WFESC support exception:",
                error
            );

            return null;
        }
    }


    /* =========================================================
       LOAD CONVERSATIONS
    ========================================================= */

    async function loadConversations() {

        if (!currentUser) {
            return [];
        }

        const {
            data,
            error
        } = await client.rpc(
            "get_my_conversations"
        );

        if (error) {

            console.error(
                "WFESC conversations error:",
                error
            );

            return [];
        }

        conversations =
            Array.isArray(data)
                ? [...data]
                : [];


        conversations.sort(
            (a, b) => {

                const first =
                    new Date(
                        a.last_message_at ||
                        a.updated_at ||
                        0
                    ).getTime();

                const second =
                    new Date(
                        b.last_message_at ||
                        b.updated_at ||
                        0
                    ).getTime();

                return second - first;
            }
        );


        renderConversations();

        return conversations;
    }


    /* =========================================================
       RENDER CONVERSATIONS
    ========================================================= */

    function renderConversations() {

        if (!conversationList) {
            return;
        }

        conversationList.innerHTML = "";

        if (!conversations.length) {

            conversationList.innerHTML = `
                <div class="empty-state glass">

                    <div class="empty-icon">
                        💬
                    </div>

                    <strong>
                        لا توجد محادثات
                    </strong>

                    <p>
                        ابدأ محادثة جديدة
                    </p>

                </div>
            `;

            return;
        }


        conversations.forEach(
            conversation => {

                const card =
                    createConversationCard(
                        conversation
                    );

                conversationList.appendChild(
                    card
                );
            }
        );
    }


    /* =========================================================
       CREATE CONVERSATION CARD
    ========================================================= */

    function createConversationCard(
        conversation
    ) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "conversation-card";


        const contact =
            conversation.contact ||
            conversation.profile ||
            conversation.user ||
            null;


        const name =
            conversation.display_name ||
            contact?.display_name ||
            conversation.username ||
            contact?.username ||
            "مستخدم";


        const avatar =
            conversation.avatar_url ||
            contact?.avatar_url ||
            (
                conversation.type === "support"
                    ? SUPPORT_AVATAR
                    : DEFAULT_AVATAR
            );


        const preview =
            conversation.last_message ||
            conversation.last_message_text ||
            "لا توجد رسائل";


        const time =
            formatTime(
                conversation.last_message_at ||
                conversation.updated_at
            );


        const unread =
            Number(
                conversation.unread_count ||
                0
            );


        card.innerHTML = `

            <div class="avatar-wrap">

                <img
                    class="avatar"
                    src="${escapeHtml(avatar)}"
                    alt=""
                    loading="lazy"
                >

                <span
                    class="online-dot ${
                        conversation.is_online
                            ? "active"
                            : ""
                    }"
                ></span>

            </div>


            <div class="conversation-info">

                <div class="conversation-name">

                    <span>
                        ${escapeHtml(name)}
                    </span>

                    ${
                        unread > 0
                            ? `
                                <span
                                    style="
                                        color:var(--green);
                                        font-size:10px;
                                    "
                                >
                                    ${unread}
                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="conversation-preview">
                    ${escapeHtml(preview)}
                </div>

            </div>


            <div class="conversation-time">
                ${escapeHtml(time)}
            </div>
        `;


        card.addEventListener(
            "click",
            () => {

                openConversation(
                    conversation.id ||
                    conversation.conversation_id,
                    contact ||
                    conversation,
                    conversation.type
                );

            }
        );


        return card;
    }


    /* =========================================================
       CHAT HEADER
    ========================================================= */

    function updateChatHeader() {

        if (!currentConversationContact) {
            return;
        }


        const contact =
            currentConversationContact;


        if (chatAvatar) {

            chatAvatar.src =
                avatarUrl(contact);

            chatAvatar.alt =
                getDisplayName(contact);
        }


        if (chatName) {

            chatName.textContent =
                getDisplayName(contact);
        }


        const online =
            Boolean(
                contact.is_online
            );


        if (chatStatus) {

            chatStatus.textContent =
                online
                    ? "نشط الآن"
                    : "غير نشط";
        }


        if (chatOnlineDot) {

            chatOnlineDot.classList.toggle(
                "active",
                online
            );
        }
    }


    /* =========================================================
       TYPING UI
    ========================================================= */

    function ensureTypingElement() {

        if (!chatMessages) {
            return null;
        }


        let typing =
            document.getElementById(
                "wfescTypingIndicator"
            );


        if (typing) {
            return typing;
        }


        typing =
            document.createElement(
                "div"
            );


        typing.id =
            "wfescTypingIndicator";


        typing.className =
            "wfesc-typing-indicator";


        typing.innerHTML = `
            <div class="wfesc-typing-bubble">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <span class="wfesc-typing-text">
                جاري الكتابة...
            </span>
        `;


        typing.style.cssText = `
            display:none;
            align-items:center;
            gap:8px;
            padding:5px 12px 9px;
            color:#999;
            font-size:12px;
            direction:rtl;
            animation:wfescTypingFade .18s ease;
        `;


        const styleId =
            "wfescTypingStyle";


        if (
            !document.getElementById(
                styleId
            )
        ) {

            const style =
                document.createElement(
                    "style"
                );

            style.id =
                styleId;


            style.textContent = `
                @keyframes wfescTypingFade {
                    from {
                        opacity:0;
                        transform:translateY(5px);
                    }

                    to {
                        opacity:1;
                        transform:translateY(0);
                    }
                }

                @keyframes wfescTypingDot {
                    0%,
                    60%,
                    100% {
                        transform:translateY(0);
                        opacity:.35;
                    }

                    30% {
                        transform:translateY(-4px);
                        opacity:1;
                    }
                }

                .wfesc-typing-bubble {
                    display:flex;
                    align-items:center;
                    gap:3px;
                    padding:7px 9px;
                    border-radius:14px;
                    background:rgba(255,255,255,.07);
                    border:1px solid rgba(255,255,255,.08);
                }

                .wfesc-typing-bubble span {
                    width:5px;
                    height:5px;
                    border-radius:50%;
                    background:#aaa;
                    animation:wfescTypingDot 1.1s infinite;
                }

                .wfesc-typing-bubble span:nth-child(2) {
                    animation-delay:.15s;
                }

                .wfesc-typing-bubble span:nth-child(3) {
                    animation-delay:.3s;
                }
            `;

            document.head.appendChild(
                style
            );
        }


        chatMessages.appendChild(
            typing
        );


        return typing;
    }


    function showTypingIndicator() {

        if (!chatMessages) {
            return;
        }


        const element =
            ensureTypingElement();


        if (!element) {
            return;
        }


        element.style.display =
            "flex";


        if (isNearBottom()) {

            requestAnimationFrame(() => {

                scrollChatToBottom(
                    "smooth"
                );

            });
        }
    }


    function hideTypingIndicator() {

        const element =
            document.getElementById(
                "wfescTypingIndicator"
            );


        if (!element) {
            return;
        }


        element.style.display =
            "none";
    }


    function updateTypingIndicator() {

        /*
           نستثني المستخدم الحالي.
        */

        if (
            typingUsers.size > 0
        ) {

            showTypingIndicator();

        } else {

            hideTypingIndicator();
        }
    }


    /* =========================================================
       TYPING REALTIME
    ========================================================= */

    async function stopTyping() {

        if (!typingChannel) {
            return;
        }


        if (!isTyping) {
            return;
        }


        isTyping = false;


        try {

            await typingChannel.send({
                type: "broadcast",
                event: "typing",
                payload: {
                    user_id:
                        currentUser?.id || null,

                    typing: false
                }
            });

        } catch (error) {

            console.warn(
                "WFESC typing stop:",
                error
            );
        }
    }


    async function sendTypingState() {

        if (
            !typingChannel ||
            !currentUser ||
            !currentConversationId
        ) {
            return;
        }


        if (!isTyping) {

            isTyping = true;

            try {

                await typingChannel.send({
                    type: "broadcast",
                    event: "typing",
                    payload: {
                        user_id:
                            currentUser.id,

                        typing: true
                    }
                });

            } catch (error) {

                console.warn(
                    "WFESC typing start:",
                    error
                );
            }
        }


        if (typingTimer) {

            clearTimeout(
                typingTimer
            );
        }


        typingTimer =
            setTimeout(
                () => {

                    stopTyping();

                },
                1800
            );
    }


    async function setupTypingChannel(
        conversationId
    ) {

        await removeTypingChannel();


        if (
            !conversationId ||
            !currentUser
        ) {
            return;
        }


        const channelName =
            "wfesc-typing-" +
            String(
                conversationId
            );


        typingChannel =
            client.channel(
                channelName,
                {
                    config: {
                        broadcast: {
                            self: false
                        }
                    }
                }
            );


        typingChannel.on(
            "broadcast",
            {
                event: "typing"
            },
            payload => {

                const data =
                    payload?.payload ||
                    payload ||
                    {};


                const userId =
                    data.user_id;


                if (
                    !userId ||
                    String(userId) ===
                    String(currentUser.id)
                ) {
                    return;
                }


                if (data.typing) {

                    typingUsers.add(
                        String(userId)
                    );

                    updateTypingIndicator();


                    /*
                       إذا توقف الطرف الآخر عن
                       إرسال heartbeat، نخفي المؤشر
                       تلقائيًا بعد مدة قصيرة.
                    */
                    setTimeout(() => {

                        typingUsers.delete(
                            String(userId)
                        );

                        updateTypingIndicator();

                    }, 3000);

                } else {

                    typingUsers.delete(
                        String(userId)
                    );

                    updateTypingIndicator();
                }
            }
        );


        typingChannel.subscribe(
            status => {

                if (
                    status !==
                    "SUBSCRIBED"
                ) {

                    console.warn(
                        "WFESC typing channel:",
                        status
                    );
                }
            }
        );
    }


    async function removeTypingChannel() {

        if (typingTimer) {

            clearTimeout(
                typingTimer
            );

            typingTimer =
                null;
        }


        isTyping =
            false;


        typingUsers.clear();


        hideTypingIndicator();


        if (typingChannel) {

            try {

                await client.removeChannel(
                    typingChannel
                );

            } catch (error) {

                console.warn(
                    "WFESC remove typing channel:",
                    error
                );
            }
        }


        typingChannel =
            null;
    }


    /* =========================================================
       INPUT TYPING EVENTS
    ========================================================= */

    function setupTypingInput() {

        const input =
            document.getElementById(
                "messageInput"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                if (
                    input.value.trim()
                ) {

                    sendTypingState();

                } else {

                    stopTyping();
                }
            }
        );


        input.addEventListener(
            "blur",
            () => {

                stopTyping();

            }
        );
    }


    /* =========================================================
       REALTIME MESSAGES
    ========================================================= */

    function normalizeRealtimeMessage(
        payload
    ) {

        if (!payload) {
            return null;
        }


        /*
           Supabase postgres_changes:
           payload.new
        */

        const record =
            payload.new ||
            payload.record ||
            payload;


        if (!record) {
            return null;
        }


        return record;
    }


    function messageBelongsToCurrentConversation(
        message
    ) {

        if (!message) {
            return false;
        }


        const conversationId =
            message.conversation_id ??
            message.target_conversation_id;


        if (!conversationId) {
            return false;
        }


        return (
            String(conversationId) ===
            String(currentConversationId)
        );
    }


    function messageAlreadyExists(
        message
    ) {

        const messageId =
            getMessageId(message);


        if (
            messageId == null
        ) {
            return false;
        }


        return currentMessages.some(
            existing =>
                String(
                    getMessageId(existing)
                ) ===
                String(messageId)
        );
    }


    function updateConversationPreview(
        message
    ) {

        if (!message) {
            return;
        }


        const conversationId =
            message.conversation_id ??
            message.target_conversation_id;


        if (!conversationId) {
            return;
        }


        const index =
            conversations.findIndex(
                conversation =>
                    String(
                        conversation.id ??
                        conversation.conversation_id
                    ) ===
                    String(conversationId)
            );


        if (index < 0) {
            return;
        }


        const conversation =
            conversations[index];


        conversation.last_message =
            getMessageContent(message);


        conversation.last_message_text =
            getMessageContent(message);


        conversation.last_message_at =
            getMessageTime(message);


        conversations.splice(
            index,
            1
        );


        conversations.unshift(
            conversation
        );


        renderConversations();
    }


    function handleRealtimeMessage(
        payload
    ) {

        const message =
            normalizeRealtimeMessage(
                payload
            );


        if (!message) {
            return;
        }


        /*
           تحديث قائمة المحادثات حتى لو
           المستخدم ليس داخل المحادثة.
        */
        updateConversationPreview(
            message
        );


        /*
           إذا الرسالة تخص محادثة ثانية
           لا نضيفها داخل الشاشة الحالية.
        */
        if (
            !messageBelongsToCurrentConversation(
                message
            )
        ) {
            return;
        }


        /*
           منع التكرار.
        */
        if (
            messageAlreadyExists(
                message
            )
        ) {
            return;
        }


        const wasAtBottom =
            isNearBottom();


        currentMessages.push(
            message
        );


        currentMessages.sort(
            (a, b) => {

                return (
                    new Date(
                        getMessageTime(a) || 0
                    ).getTime()
                    -
                    new Date(
                        getMessageTime(b) || 0
                    ).getTime()
                );
            }
        );


        if (chatMessages) {

            const element =
                createMessageElement(
                    message
                );


            chatMessages.appendChild(
                element
            );


            scheduleMessageSettingsApply();


            if (wasAtBottom) {

                requestAnimationFrame(
                    () => {

                        scrollChatToBottom(
                            "smooth"
                        );

                    }
                );
            }
        }


        /*
           الرسالة وصلت، نخفي جاري الكتابة.
        */
        typingUsers.clear();

        hideTypingIndicator();
    }


    async function setupMessageRealtime() {

        if (
            realtimeStarted &&
            messageChannel
        ) {
            return;
        }


        if (messageChannel) {

            try {

                await client.removeChannel(
                    messageChannel
                );

            } catch (_) {}
        }


        /*
           القناة تستمع إلى رسائل جدول messages.
           إذا كان جدول الرسائل عندك اسمه مختلف،
           نغيره فقط هنا بدون لمس بقية النظام.
        */
        messageChannel =
            client
                .channel(
                    "wfesc-messages-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages"
                    },
                    payload => {

                        handleRealtimeMessage(
                            payload
                        );
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "messages"
                    },
                    payload => {

                        const message =
                            normalizeRealtimeMessage(
                                payload
                            );


                        if (!message) {
                            return;
                        }


                        updateConversationPreview(
                            message
                        );
                    }
                );


        messageChannel.subscribe(
            status => {

                if (
                    status ===
                    "SUBSCRIBED"
                ) {

                    realtimeStarted =
                        true;

                    console.log(
                        "WFESC: Messages Realtime connected"
                    );

                } else {

                    console.warn(
                        "WFESC Messages Realtime:",
                        status
                    );
                }
            }
        );
    }


    /* =========================================================
       OPEN CONVERSATION
    ========================================================= */

    async function openConversation(
        conversationId,
        contact = null,
        type = null
    ) {

        if (!conversationId) {
            return;
        }


        const loadToken =
            ++conversationLoadToken;


        /*
           إيقاف حالة الكتابة للمحادثة السابقة.
        */
        await removeTypingChannel();


        currentConversationId =
            conversationId;


        currentConversationContact =
            contact;


        typingUsers.clear();


        hideTypingIndicator();


        if (
            type === "support"
        ) {

            currentConversationContact =
                getSupportContact();
        }


        if (
            !currentConversationContact
        ) {

            currentConversationContact =
                await getConversationContact(
                    conversationId,
                    type
                );


            if (
                loadToken !==
                conversationLoadToken
            ) {
                return;
            }
        }


        if (
            !currentConversationContact
        ) {

            currentConversationContact = {

                display_name:
                    "مستخدم",

                username:
                    "user",

                avatar_url:
                    DEFAULT_AVATAR,

                is_online:
                    false
            };
        }


        page?.classList.add(
            "chat-active"
        );


        chatView?.classList.add(
            "open"
        );


        if (searchSection) {

            searchSection.classList.add(
                "hidden"
            );
        }


        updateChatHeader();


        /*
           نجهز قناة الكتابة فور فتح المحادثة.
        */
        setupTypingChannel(
            conversationId
        );


        await loadConversationMessages(
            loadToken
        );


        if (
            loadToken !==
            conversationLoadToken
        ) {
            return;
        }


        await markConversationRead(
            conversationId
        );


        /*
           تأكيد الوصول للنهاية بعد اكتمال
           جميع عمليات الرسم.
        */
        revealChatAtBottom();
    }


    /* =========================================================
       LOAD MESSAGES
    ========================================================= */

    async function loadConversationMessages(
        expectedLoadToken =
            conversationLoadToken
    ) {

        if (!currentConversationId) {
            return;
        }


        const requestedConversationId =
            currentConversationId;


        if (chatMessages) {

            /*
               نخفي المحتوى المؤقت حتى لا يرى
               المستخدم المحادثة وهي تبدأ من الأعلى.
            */
            chatMessages.style.visibility =
                "hidden";


            chatMessages.innerHTML = `
                <div
                    class="empty-state"
                    style="
                        min-height:120px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                    "
                >

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <strong>
                        جاري تحميل الرسائل
                    </strong>

                </div>
            `;
        }


        const {
            data,
            error
        } = await client.rpc(
            "get_conversation_messages",
            {
                target_conversation_id:
                    requestedConversationId,

                message_limit:
                    100
            }
        );


        if (
            expectedLoadToken !==
            conversationLoadToken ||
            requestedConversationId !==
            currentConversationId
        ) {

            return;
        }


        if (error) {

            console.error(
                "WFESC messages error:",
                error
            );


            if (chatMessages) {

                chatMessages.style.visibility =
                    "visible";


                chatMessages.innerHTML = `
                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <strong>
                            تعذر تحميل الرسائل
                        </strong>

                        <p>
                            حاول مرة أخرى
                        </p>

                    </div>
                `;
            }

            return;
        }


        currentMessages =
            Array.isArray(data)
                ? [...data]
                : [];


        currentMessages.sort(
            (a, b) => {

                return (
                    new Date(
                        getMessageTime(a) || 0
                    ).getTime()
                    -
                    new Date(
                        getMessageTime(b) || 0
                    ).getTime()
                );
            }
        );


        renderMessages({
            initialLoad: true
        });
    }


    /* =========================================================
       RENDER MESSAGES
    ========================================================= */

    function renderMessages(
        options = {}
    ) {

        if (!chatMessages) {
            return;
        }


        const initialLoad =
            Boolean(
                options.initialLoad
            );


        const oldScrollTop =
            chatMessages.scrollTop;


        const oldScrollHeight =
            chatMessages.scrollHeight;


        const oldClientHeight =
            chatMessages.clientHeight;


        const wasNear =
            (
                oldScrollHeight -
                oldScrollTop -
                oldClientHeight
            ) < 150;


        chatMessages.innerHTML = "";


        if (!currentMessages.length) {

            chatMessages.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        💬
                    </div>

                    <strong>
                        لا توجد رسائل بعد
                    </strong>

                    <p>
                        ابدأ المحادثة الآن
                    </p>

                </div>
            `;


            chatMessages.style.visibility =
                "visible";


            scheduleMessageSettingsApply();

            return;
        }


        const fragment =
            document.createDocumentFragment();


        currentMessages.forEach(
            message => {

                const element =
                    createMessageElement(
                        message
                    );

                fragment.appendChild(
                    element
                );
            }
        );


        chatMessages.appendChild(
            fragment
        );


        scheduleMessageSettingsApply();


        if (initialLoad) {

            /*
               أهم جزء:
               نحدد الأسفل قبل إظهار المحتوى،
               لذلك المستخدم لن يشاهد القائمة
               وهي تبدأ من أول رسالة.
            */
            forceScrollToBottom();


            requestAnimationFrame(() => {

                forceScrollToBottom();

                chatMessages.style.visibility =
                    "visible";


                /*
                   تحديث بعد حساب أبعاد الرسائل.
                */
                setTimeout(() => {

                    forceScrollToBottom();

                }, 40);


                setTimeout(() => {

                    forceScrollToBottom();

                }, 160);

            });


            return;
        }


        if (wasNear) {

            requestAnimationFrame(() => {

                scrollChatToBottom(
                    "smooth"
                );

            });

        } else {

            const heightDifference =
                chatMessages.scrollHeight -
                oldScrollHeight;


            chatMessages.scrollTop =
                oldScrollTop +
                Math.max(
                    0,
                    heightDifference
                );
        }
    }


    /* =========================================================
       CREATE MESSAGE
    ========================================================= */

    function createMessageElement(
        message
    ) {

        const isMine =
            isMessageMine(
                message
            );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "message-row " +
            (
                isMine
                    ? "mine"
                    : "theirs"
            );


        const messageId =
            getMessageId(
                message
            );


        if (messageId != null) {

            row.dataset.messageId =
                String(messageId);
        }


        /*
           نضيف نوع الرسالة للـDOM
           حتى تقدر الملفات الأخرى تتعامل معها.
        */
        row.dataset.senderId =
            String(
                getMessageSenderId(
                    message
                ) || ""
            );


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        bubble.dataset.side =
            isMine
                ? "mine"
                : "theirs";


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "message-content";


        content.textContent =
            getMessageContent(
                message
            );


        const time =
            document.createElement(
                "div"
            );


        time.className =
            "message-time";


        time.textContent =
            formatTime(
                getMessageTime(
                    message
                )
            );


        bubble.appendChild(
            content
        );


        bubble.appendChild(
            time
        );


        row.appendChild(
            bubble
        );


        return row;
    }


    /* =========================================================
       ADD MESSAGE
    ========================================================= */

    function addMessageToCurrentConversation(
        message,
        options = {}
    ) {

        if (!message) {
            return null;
        }


        if (
            options.conversationId &&
            String(
                options.conversationId
            ) !== String(
                currentConversationId
            )
        ) {

            return null;
        }


        const messageId =
            getMessageId(
                message
            );


        if (
            messageId != null &&
            messageAlreadyExists(
                message
            )
        ) {

            return null;
        }


        const wasAtBottom =
            isNearBottom();


        currentMessages.push(
            message
        );


        currentMessages.sort(
            (a, b) => {

                return (
                    new Date(
                        getMessageTime(a) || 0
                    ).getTime()
                    -
                    new Date(
                        getMessageTime(b) || 0
                    ).getTime()
                );
            }
        );


        if (
            options.appendOnly &&
            chatMessages
        ) {

            const element =
                createMessageElement(
                    message
                );


            chatMessages.appendChild(
                element
            );


            scheduleMessageSettingsApply();


            if (
                options.scroll !== false &&
                wasAtBottom
            ) {

                requestAnimationFrame(
                    () => {

                        scrollChatToBottom(
                            "smooth"
                        );

                    }
                );
            }


            return element;
        }


        renderMessages();


        if (
            options.scroll !== false
        ) {

            requestAnimationFrame(
                () => {

                    scrollChatToBottom(
                        "smooth"
                    );

                }
            );
        }


        return true;
    }


    /* =========================================================
       MARK READ
    ========================================================= */

    async function markConversationRead(
        conversationId
    ) {

        if (!conversationId) {
            return;
        }


        try {

            const {
                error
            } = await client.rpc(
                "mark_conversation_read",
                {
                    target_conversation_id:
                        conversationId
                }
            );


            if (error) {

                console.warn(
                    "WFESC mark read:",
                    error
                );
            }

        } catch (error) {

            console.warn(
                "WFESC mark read exception:",
                error
            );
        }
    }


    /* =========================================================
       CLOSE
    ========================================================= */

    async function closeConversation() {

        conversationLoadToken++;


        await removeTypingChannel();


        currentConversationId =
            null;


        currentConversationContact =
            null;


        currentMessages =
            [];


        typingUsers.clear();


        chatView?.classList.remove(
            "open"
        );


        page?.classList.remove(
            "chat-active"
        );


        if (searchSection) {

            searchSection.classList.remove(
                "hidden"
            );
        }


        if (chatMessages) {

            chatMessages.innerHTML =
                "";

            chatMessages.style.visibility =
                "visible";
        }
    }


    /* =========================================================
       BACK
    ========================================================= */

    if (backChatButton) {

        backChatButton.addEventListener(
            "click",
            closeConversation
        );
    }


    /* =========================================================
       AUTH
    ========================================================= */

    async function initializeAuth() {

        try {

            const {
                data,
                error
            } = await client.auth.getSession();


            if (error) {

                console.error(
                    "WFESC auth error:",
                    error
                );

                return;
            }


            currentUser =
                data?.session?.user ||
                null;


            if (!currentUser) {

                console.warn(
                    "WFESC: لا يوجد مستخدم مسجل الدخول."
                );

                return;
            }


            await loadConversations();


            const supportId =
                await ensureSupportConversation();


            if (supportId) {

                await loadConversations();
            }


            /*
               تشغيل Realtime مرة واحدة.
            */
            await setupMessageRealtime();


            initialized =
                true;


            console.log(
                "WFESC Messages Core initialized"
            );

        } catch (error) {

            console.error(
                "WFESC initialize error:",
                error
            );
        }
    }


    /* =========================================================
       AUTH STATE CHANGES
    ========================================================= */

    client.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            currentUser =
                session?.user ||
                null;


            if (!currentUser) {

                await closeConversation();


                conversations =
                    [];


                currentMessages =
                    [];


                renderConversations();


                return;
            }


            if (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION"
            ) {

                await loadConversations();


                const supportId =
                    await ensureSupportConversation();


                if (supportId) {

                    await loadConversations();
                }


                await setupMessageRealtime();
            }
        }
    );


    /* =========================================================
       INITIAL INPUT EVENTS
    ========================================================= */

    function setupInputEvents() {

        const input =
            document.getElementById(
                "messageInput"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                if (
                    input.value.trim()
                ) {

                    sendTypingState();

                } else {

                    stopTyping();
                }
            }
        );


        input.addEventListener(
            "blur",
            () => {

                stopTyping();

            }
        );
    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESC_MESSAGES_CORE = {

        client,


        getCurrentUser() {
            return currentUser;
        },


        getCurrentConversation() {
            return currentConversationId;
        },


        getCurrentContact() {
            return currentConversationContact;
        },


        getConversations() {
            return [
                ...conversations
            ];
        },


        getMessages() {
            return [
                ...currentMessages
            ];
        },


        loadConversations,


        loadConversationMessages,


        openConversation,


        closeConversation,


        ensureSupportConversation,


        getConversationContact,


        markConversationRead,


        renderMessages,


        createMessageElement,


        addMessageToCurrentConversation,


        applyMessageSettings,


        scrollChatToBottom,


        forceScrollToBottom,


        setupMessageRealtime,


        setupTypingChannel,


        sendTypingState,


        stopTyping,


        showTypingIndicator,


        hideTypingIndicator
    };


    /* =========================================================
       START
    ========================================================= */

    function start() {

        setupInputEvents();


        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                initializeAuth,
                {
                    once: true
                }
            );

        } else {

            initializeAuth();
        }
    }


    start();

})();
