
(() => {
    "use strict";

    /*
    ============================================================
    WFESC MESSAGES CORE
    مسؤول عن:
    - Supabase
    - المستخدم الحالي
    - المحادثات
    - فتح المحادثة
    - تحميل الرسائل
    - بيانات جهة الاتصال
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


    function scrollChatToBottom(
        behavior = "smooth"
    ) {

        if (!chatMessages) {
            return;
        }

        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior
        });
    }


    /* =========================================================
       SUPPORT CONTACT
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

            if (typeof data === "string") {
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


        currentConversationId =
            conversationId;


        currentConversationContact =
            contact;


        if (type === "support") {

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
        }


        if (!currentConversationContact) {

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


        await loadConversationMessages();


        markConversationRead(
            conversationId
        );


        scrollChatToBottom(
            "auto"
        );
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
       LOAD MESSAGES
    ========================================================= */

    async function loadConversationMessages() {

        if (!currentConversationId) {
            return;
        }


        if (chatMessages) {

            chatMessages.innerHTML = `
                <div class="empty-state">

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
                    currentConversationId,

                message_limit:
                    100
            }
        );


        if (error) {

            console.error(
                "WFESC messages error:",
                error
            );


            if (chatMessages) {

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
                        a.created_at ||
                        a.sent_at ||
                        0
                    ).getTime()
                    -
                    new Date(
                        b.created_at ||
                        b.sent_at ||
                        0
                    ).getTime()
                );
            }
        );


        renderMessages();
    }


    /* =========================================================
       RENDER MESSAGES
    ========================================================= */

    function renderMessages() {

        if (!chatMessages) {
            return;
        }


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

            return;
        }


        currentMessages.forEach(
            message => {

                const element =
                    createMessageElement(
                        message
                    );

                chatMessages.appendChild(
                    element
                );
            }
        );
    }


    /* =========================================================
       CREATE MESSAGE
    ========================================================= */

    function createMessageElement(
        message
    ) {

        const senderId =
            message.sender_id ||
            message.user_id ||
            message.from_user_id;


        const isMine =
            String(senderId) ===
            String(currentUser?.id);


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


        row.dataset.messageId =
            String(
                message.id ??
                message.message_id ??
                ""
            );


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "message-content";


        content.textContent =
            message.content ||
            message.message ||
            "";


        const time =
            document.createElement(
                "div"
            );


        time.className =
            "message-time";


        time.textContent =
            formatTime(
                message.created_at ||
                message.sent_at
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
       BACK
    ========================================================= */

    function closeConversation() {

        currentConversationId =
            null;

        currentConversationContact =
            null;

        currentMessages =
            [];

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
    }


    /* =========================================================
       EVENTS
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

                closeConversation();

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
            }
        }
    );


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

        markConversationRead
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
            initializeAuth,
            {
                once:true
            }
        );

    } else {

        initializeAuth();
    }

})();
