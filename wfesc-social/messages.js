/* =========================================================
   WFESC MESSAGES SYSTEM
   messages.js

   هذا الملف مستقل ومتكامل لنظام الرسائل.
   أي تعديل مستقبلي على الرسائل يوضع داخل هذا الملف فقط.

   المزايا:
   - صفحة رسائل كاملة
   - قائمة المستخدمين
   - فتح محادثة
   - إرسال واستقبال رسائل تجريبية
   - اسم المستخدم + @username
   - صورة الحساب
   - وقت الرسالة
   - أنميشن للرسائل والإرسال
   - بحث عن المستخدمين
   - مؤشر متصل
   - عداد رسائل غير مقروءة
   - سحب بين الرئيسية والرسائل
   - تصميم RTL
   - جاهز لاحقاً للربط مع auth.js وSupabase
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       منع تحميل الملف مرتين
    ===================================================== */

    if (window.WFESC_MESSAGES_LOADED) {
        return;
    }

    window.WFESC_MESSAGES_LOADED = true;


    /* =====================================================
       إعدادات النظام
    ===================================================== */

    const CONFIG = {

        version: "1.0.0",

        demoMode: true,

        autoReply: true,

        autoReplyDelay: 900,

        animation: true,

        storageKey: "WFESC_MESSAGES_DEMO",

        currentUser: {

            name: "WFESC",

            username: "@wfesc",

            avatar: "",

            online: true

        }

    };


    /* =====================================================
       المستخدمون التجريبيون

       مستقبلاً يتم استبدال هذه البيانات ببيانات Supabase.
    ===================================================== */

    const USERS = [

        {
            id: "demo_ali",
            name: "علي",
            username: "@ali_wfesc",
            avatar: "",
            online: true,
            lastMessage: "هلا بيك 👋",
            unread: 2
        },

        {
            id: "demo_daniel",
            name: "دانيال",
            username: "@danoshdodo",
            avatar: "",
            online: true,
            lastMessage: "شفت المنشور الجديد؟",
            unread: 1
        },

        {
            id: "demo_sara",
            name: "سارة",
            username: "@sara_demo",
            avatar: "",
            online: true,
            lastMessage: "أهلاً 👋",
            unread: 0
        },

        {
            id: "demo_ahmed",
            name: "أحمد",
            username: "@ahmed_demo",
            avatar: "",
            online: false,
            lastMessage: "نتواصل بعدين",
            unread: 0
        }

    ];


    /* =====================================================
       رسائل تجريبية
    ===================================================== */

    const DEMO_MESSAGES = {

        demo_ali: [

            {
                id: "ali_1",
                sender: "demo_ali",
                text: "هلا بيك 👋",
                time: "10:30"
            },

            {
                id: "ali_2",
                sender: "demo_ali",
                text: "شلونك؟",
                time: "10:31"
            }

        ],

        demo_daniel: [

            {
                id: "daniel_1",
                sender: "demo_daniel",
                text: "مرحباً WFESC",
                time: "11:05"
            },

            {
                id: "daniel_2",
                sender: "demo_daniel",
                text: "شفت المنشور الجديد؟",
                time: "11:06"
            }

        ],

        demo_sara: [

            {
                id: "sara_1",
                sender: "demo_sara",
                text: "أهلاً 👋",
                time: "12:20"
            },

            {
                id: "sara_2",
                sender: "demo_sara",
                text: "ممكن نتواصل هنا؟",
                time: "12:21"
            }

        ],

        demo_ahmed: [

            {
                id: "ahmed_1",
                sender: "demo_ahmed",
                text: "مرحباً",
                time: "09:15"
            }

        ]

    };


    /* =====================================================
       حالة النظام
    ===================================================== */

    const STATE = {

        page: "home",

        selectedUser: null,

        users: [...USERS],

        conversations: {},

        search: "",

        startX: null

    };


    /* =====================================================
       تجهيز الرسائل
    ===================================================== */

    function initializeMessages() {

        Object.keys(DEMO_MESSAGES).forEach(id => {

            STATE.conversations[id] =
                DEMO_MESSAGES[id].map(message => ({
                    ...message
                }));

        });

        loadStoredMessages();

    }


    /* =====================================================
       التخزين المحلي
    ===================================================== */

    function saveMessages() {

        if (!CONFIG.demoMode) {
            return;
        }

        try {

            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(
                    STATE.conversations
                )
            );

        } catch (error) {

            console.warn(
                "[WFESC MESSAGES] Storage unavailable.",
                error
            );

        }

    }


    function loadStoredMessages() {

        if (!CONFIG.demoMode) {
            return;
        }

        try {

            const saved =
                localStorage.getItem(
                    CONFIG.storageKey
                );

            if (!saved) {
                return;
            }

            const parsed =
                JSON.parse(saved);

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                Object.keys(parsed).forEach(id => {

                    if (Array.isArray(parsed[id])) {

                        STATE.conversations[id] =
                            parsed[id];

                    }

                });

            }

        } catch (error) {

            console.warn(
                "[WFESC MESSAGES] Could not load storage.",
                error
            );

        }

    }


    /* =====================================================
       الوقت
    ===================================================== */

    function getCurrentTime() {

        return new Date()
            .toLocaleTimeString(
                "ar-IQ",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }


    /* =====================================================
       التاريخ الكامل
    ===================================================== */

    function getCurrentDateTime() {

        return new Date().toISOString();

    }


    /* =====================================================
       حماية HTML
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;

    }


    /* =====================================================
       صورة المستخدم
    ===================================================== */

    function getAvatarHTML(user) {

        if (
            user &&
            user.avatar
        ) {

            return `
                <img
                    src="${escapeHTML(user.avatar)}"
                    alt="${escapeHTML(user.username)}"
                >
            `;

        }

        return "👤";

    }


    /* =====================================================
       البحث عن مستخدم
    ===================================================== */

    function getUserById(id) {

        if (id === "current") {
            return CONFIG.currentUser;
        }

        return STATE.users.find(
            user => user.id === id
        ) || null;

    }


    /* =====================================================
       CSS
    ===================================================== */

    function injectStyles() {

        if (
            document.getElementById(
                "wfesc-messages-style"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            "wfesc-messages-style";


        style.textContent = `

        #wfesc-messages-root{

            position:fixed;

            inset:0;

            z-index:2147483000;

            display:none;

            background:
                rgba(0,0,0,.72);

            backdrop-filter:
                blur(12px);

            -webkit-backdrop-filter:
                blur(12px);

            font-family:
                Arial,Tahoma,sans-serif;

            color:#fff;

        }


        #wfesc-messages-root.active{

            display:block;

        }


        .wf-msg-window{

            position:absolute;

            inset:0;

            margin:auto;

            width:min(100%,720px);

            height:100%;

            overflow:hidden;

            background:#080808;

        }


        .wf-msg-track{

            width:200%;

            height:100%;

            display:flex;

            direction:ltr;

            transition:
                transform
                .42s
                cubic-bezier(.22,.61,.36,1);

            touch-action:pan-y;

        }


        .wf-msg-page{

            width:50%;

            flex:0 0 50%;

            height:100%;

            box-sizing:border-box;

            padding:18px;

            direction:rtl;

            overflow-y:auto;

        }


        .wf-msg-header{

            display:flex;

            align-items:center;

            gap:10px;

            min-height:52px;

            border-bottom:
                1px solid #292929;

        }


        .wf-msg-title{

            flex:1;

            min-width:0;

        }


        .wf-msg-title-main{

            font-size:21px;

            font-weight:800;

        }


        .wf-msg-title-sub{

            color:#777;

            font-size:11px;

            margin-top:4px;

        }


        .wf-msg-btn{

            border:
                1px solid #303030;

            background:#151515;

            color:#fff;

            border-radius:13px;

            min-height:42px;

            padding:
                9px 12px;

            cursor:pointer;

            transition:
                transform .18s ease,
                opacity .18s ease;

        }


        .wf-msg-btn:active{

            transform:
                scale(.93);

        }


        .wf-msg-search{

            margin-top:14px;

            width:100%;

            box-sizing:border-box;

            background:#111;

            border:
                1px solid #292929;

            color:#fff;

            border-radius:14px;

            padding:12px;

            outline:none;

        }


        .wf-msg-section{

            margin-top:18px;

            margin-bottom:9px;

            color:#999;

            font-size:12px;

            font-weight:700;

        }


        .wf-msg-user{

            display:flex;

            align-items:center;

            gap:11px;

            padding:12px;

            margin-top:8px;

            background:#101010;

            border:
                1px solid #292929;

            border-radius:17px;

            cursor:pointer;

            transition:
                transform .18s ease,
                background .18s ease;

        }


        .wf-msg-user:active{

            transform:
                scale(.98);

        }


        .wf-msg-avatar{

            width:46px;

            height:46px;

            min-width:46px;

            border-radius:50%;

            overflow:hidden;

            background:#202020;

            display:flex;

            align-items:center;

            justify-content:center;

            font-size:20px;

        }


        .wf-msg-avatar img{

            width:100%;

            height:100%;

            object-fit:cover;

        }


        .wf-msg-user-info{

            flex:1;

            min-width:0;

        }


        .wf-msg-name{

            font-size:14px;

            font-weight:700;

        }


        .wf-msg-username{

            color:#777;

            font-size:11px;

            margin-top:3px;

        }


        .wf-msg-preview{

            color:#888;

            font-size:11px;

            margin-top:5px;

            white-space:nowrap;

            overflow:hidden;

            text-overflow:ellipsis;

        }


        .wf-msg-online{

            font-size:10px;

            color:#6f6;

            margin-top:4px;

        }


        .wf-msg-offline{

            font-size:10px;

            color:#666;

            margin-top:4px;

        }


        .wf-msg-unread{

            min-width:21px;

            height:21px;

            padding:0 6px;

            border-radius:20px;

            display:flex;

            align-items:center;

            justify-content:center;

            background:#fff;

            color:#000;

            font-size:10px;

            font-weight:800;

        }


        .wf-msg-arrow{

            color:#666;

            font-size:20px;

        }


        .wf-msg-chat{

            height:100%;

            display:flex;

            flex-direction:column;

        }


        .wf-msg-chat-header{

            display:flex;

            align-items:center;

            gap:10px;

            padding-bottom:12px;

            border-bottom:
                1px solid #292929;

        }


        .wf-msg-chat-info{

            flex:1;

            min-width:0;

        }


        .wf-msg-messages{

            flex:1;

            overflow-y:auto;

            display:flex;

            flex-direction:column;

            gap:10px;

            padding:
                14px 2px;

        }


        .wf-msg-message{

            max-width:84%;

            display:flex;

            gap:7px;

            opacity:0;

            transform:
                translateY(12px)
                scale(.96);

            animation:
                wfescMessageIn
                .3s
                cubic-bezier(.22,.61,.36,1)
                forwards;

        }


        .wf-msg-message.me{

            align-self:flex-end;

            flex-direction:row-reverse;

        }


        .wf-msg-message.other{

            align-self:flex-start;

        }


        .wf-msg-message-avatar{

            width:32px;

            height:32px;

            min-width:32px;

            border-radius:50%;

            overflow:hidden;

            background:#202020;

        }


        .wf-msg-message-avatar img{

            width:100%;

            height:100%;

            object-fit:cover;

        }


        .wf-msg-message-body{

            min-width:0;

        }


        .wf-msg-message-user{

            color:#888;

            font-size:10px;

            margin-bottom:3px;

        }


        .wf-msg-bubble{

            background:#171717;

            border:
                1px solid #292929;

            border-radius:15px;

            padding:
                9px 12px;

            font-size:13px;

            line-height:1.65;

            word-break:break-word;

        }


        .wf-msg-message.me
        .wf-msg-bubble{

            background:#202020;

        }


        .wf-msg-time{

            color:#666;

            font-size:9px;

            margin-top:3px;

        }


        .wf-msg-compose{

            display:flex;

            gap:8px;

            padding-top:11px;

            border-top:
                1px solid #292929;

        }


        .wf-msg-input{

            flex:1;

            min-width:0;

            background:#111;

            border:
                1px solid #292929;

            color:#fff;

            border-radius:14px;

            padding:12px;

            outline:none;

        }


        .wf-msg-send{

            width:48px;

            min-width:48px;

            border:0;

            border-radius:14px;

            background:#fff;

            color:#000;

            cursor:pointer;

            transition:
                transform .2s ease;

        }


        .wf-msg-send.sending{

            animation:
                wfescSend
                .32s
                ease;

        }


        .wf-msg-empty{

            text-align:center;

            color:#666;

            padding:35px 10px;

            font-size:12px;

        }


        @keyframes wfescMessageIn{

            from{

                opacity:0;

                transform:
                    translateY(12px)
                    scale(.96);

            }

            to{

                opacity:1;

                transform:
                    translateY(0)
                    scale(1);

            }

        }


        @keyframes wfescSend{

            50%{

                transform:
                    scale(.8)
                    rotate(-8deg);

            }

        }


        @media(max-width:600px){

            .wf-msg-page{

                padding:14px;

            }

            .wf-msg-title-main{

                font-size:19px;

            }

        }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       بناء الواجهة
    ===================================================== */

    function createInterface() {

        if (
            document.getElementById(
                "wfesc-messages-root"
            )
        ) {
            return;
        }


        const root =
            document.createElement("div");

        root.id =
            "wfesc-messages-root";

        root.dir =
            "rtl";


        root.innerHTML = `

            <div class="wf-msg-window">

                <div
                    class="wf-msg-track"
                    id="wfesc-msg-track"
                >

                    <!-- =================================
                         USERS PAGE
                    ================================= -->

                    <section
                        class="wf-msg-page"
                        id="wfesc-msg-users-page"
                    >

                        <div class="wf-msg-header">

                            <button
                                class="wf-msg-btn"
                                id="wfesc-msg-close"
                                type="button"
                            >
                                ×
                            </button>

                            <div class="wf-msg-title">

                                <div class="wf-msg-title-main">
                                    الرسائل
                                </div>

                                <div class="wf-msg-title-sub">
                                    اختر مستخدماً لبدء المحادثة
                                </div>

                            </div>

                        </div>


                        <input
                            id="wfesc-msg-search"
                            class="wf-msg-search"
                            type="search"
                            placeholder="ابحث عن مستخدم..."
                            autocomplete="off"
                        >


                        <div class="wf-msg-section">
                            المستخدمون
                        </div>


                        <div id="wfesc-msg-users"></div>

                    </section>


          
                    <!-- =================================
                         CHAT PAGE
                    ================================= -->

                    <section
                        class="wf-msg-page"
                        id="wfesc-msg-chat-page"
                    >

                        <div class="wf-msg-chat">

                            <div class="wf-msg-chat-header">

                                <button
                                    class="wf-msg-btn"
                                    id="wfesc-msg-back"
                                    type="button"
                                >
                                    ←
                                </button>


                                <div
                                    class="wf-msg-avatar"
                                    id="wfesc-msg-chat-avatar"
                                >
                                    👤
                                </div>


                                <div class="wf-msg-chat-info">

                                    <div
                                        class="wf-msg-name"
                                        id="wfesc-msg-chat-name"
                                    >
                                        المستخدم
                                    </div>

                                    <div
                                        class="wf-msg-username"
                                        id="wfesc-msg-chat-username"
                                    >
                                        @user
                                    </div>

                                </div>

                            </div>


                            <div
                                class="wf-msg-messages"
                                id="wfesc-msg-chat-messages"
                            ></div>


                            <form
                                class="wf-msg-compose"
                                id="wfesc-msg-form"
                            >

                                <input
                                    class="wf-msg-input"
                                    id="wfesc-msg-input"
                                    type="text"
                                    placeholder="اكتب رسالة..."
                                    autocomplete="off"
                                    maxlength="4000"
                                >


                                <button
                                    class="wf-msg-send"
                                    id="wfesc-msg-send"
                                    type="submit"
                                >
                                    ➤
                                </button>

                            </form>

                        </div>

                    </section>

                </div>

            </div>

        `;


        document.body.appendChild(root);


        bindEvents();

    }


    /* =====================================================
       عرض المستخدمين
    ===================================================== */

    function renderUsers() {

        const container =
            document.getElementById(
                "wfesc-msg-users"
            );

        if (!container) {
            return;
        }


        const query =
            STATE.search
                .trim()
                .toLowerCase();


        const filtered =
            STATE.users.filter(user => {

                if (!query) {
                    return true;
                }

                return (
                    user.name
                        .toLowerCase()
                        .includes(query) ||

                    user.username
                        .toLowerCase()
                        .includes(query)
                );

            });


        if (!filtered.length) {

            container.innerHTML = `
                <div class="wf-msg-empty">
                    لم يتم العثور على مستخدم
                </div>
            `;

            return;

        }


        container.innerHTML =
            filtered.map(user => {

                const preview =
                    getLastMessage(user.id);


                const unread =
                    Number(user.unread || 0);


                return `

                    <div
                        class="wf-msg-user"
                        data-user-id="${escapeHTML(user.id)}"
                    >

                        <div class="wf-msg-avatar">

                            ${getAvatarHTML(user)}

                        </div>


                        <div class="wf-msg-user-info">

                            <div class="wf-msg-name">
                                ${escapeHTML(user.name)}
                            </div>

                            <div class="wf-msg-username">
                                ${escapeHTML(user.username)}
                            </div>

                            <div class="wf-msg-preview">
                                ${escapeHTML(preview)}
                            </div>

                            <div class="${
                                user.online
                                    ? "wf-msg-online"
                                    : "wf-msg-offline"
                            }">

                                ${
                                    user.online
                                        ? "● متصل الآن"
                                        : "● غير متصل"
                                }

                            </div>

                        </div>


                        ${
                            unread > 0
                                ? `
                                    <div class="wf-msg-unread">
                                        ${unread}
                                    </div>
                                  `
                                : ""
                        }


                        <div class="wf-msg-arrow">
                            ‹
                        </div>

                    </div>

                `;

            }).join("");


        container
            .querySelectorAll(
                ".wf-msg-user"
            )
            .forEach(card => {

                card.addEventListener(
                    "click",
                    () => {

                        openConversation(
                            card.dataset.userId
                        );

                    }
                );

            });

    }


    /* =====================================================
       آخر رسالة
    ===================================================== */

    function getLastMessage(userId) {

        const messages =
            STATE.conversations[userId] || [];


        if (!messages.length) {

            const user =
                getUserById(userId);

            return user?.lastMessage || "";

        }


        return messages[
            messages.length - 1
        ].text || "";

    }


    /* =====================================================
       فتح المحادثة
    ===================================================== */

    function openConversation(userId) {

        const user =
            getUserById(userId);


        if (!user) {
            return;
        }


        STATE.selectedUser =
            user;


        user.unread =
            0;


        updateChatHeader();


        renderConversation();


        showChat();


        setTimeout(() => {

            const input =
                document.getElementById(
                    "wfesc-msg-input"
                );

            if (input) {
                input.focus();
            }

        }, 150);


        renderUsers();

    }


    /* =====================================================
       تحديث رأس المحادثة
    ===================================================== */

    function updateChatHeader() {

        const user =
            STATE.selectedUser;


        if (!user) {
            return;
        }


        const avatar =
            document.getElementById(
                "wfesc-msg-chat-avatar"
            );


        const name =
            document.getElementById(
                "wfesc-msg-chat-name"
            );


        const username =
            document.getElementById(
                "wfesc-msg-chat-username"
            );


        avatar.innerHTML =
            getAvatarHTML(user);


        name.textContent =
            user.name;


        username.textContent =
            user.username;

    }


    /* =====================================================
       عرض المحادثة
    ===================================================== */

    function renderConversation() {

        const container =
            document.getElementById(
                "wfesc-msg-chat-messages"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        if (!STATE.selectedUser) {

            return;

        }


        const messages =
            STATE.conversations[
                STATE.selectedUser.id
            ] || [];


        messages.forEach(message => {

            renderMessage(
                message,
                false
            );

        });


        scrollChat();

    }


    /* =====================================================
       رسم رسالة
    ===================================================== */

    function renderMessage(
        message,
        animate = true
    ) {

        const container =
            document.getElementById(
                "wfesc-msg-chat-messages"
            );


        if (!container) {
            return;
        }


        const isMe =
            message.sender === "current";


        const user =
            isMe
                ? CONFIG.currentUser
                : getUserById(
                    message.sender
                );


        if (!user) {
            return;
        }


        const element =
            document.createElement("div");


        element.className =
            "wf-msg-message " +
            (
                isMe
                    ? "me"
                    : "other"
            );


        if (!CONFIG.animation || !animate) {

            element.style.animation =
                "none";

            element.style.opacity =
                "1";

            element.style.transform =
                "none";

        }


        element.innerHTML = `

            <div class="wf-msg-message-avatar">

                ${getAvatarHTML(user)}

            </div>


            <div class="wf-msg-message-body">

                <div class="wf-msg-message-user">

                    ${escapeHTML(user.name)}
                    ·
                    ${escapeHTML(user.username)}

                </div>


                <div class="wf-msg-bubble">

                    ${escapeHTML(message.text)}

                </div>


                <div class="wf-msg-time">

                    ${escapeHTML(message.time)}

                </div>

            </div>

        `;


        container.appendChild(
            element
        );

    }


    /* =====================================================
       إرسال رسالة
    ===================================================== */

    function sendMessage(text) {

        if (!STATE.selectedUser) {
            return;
        }


        const cleanText =
            text.trim();


        if (!cleanText) {
            return;
        }


        const message = {

            id:
                "msg_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            sender:
                "current",

            text:
                cleanText,

            time:
                getCurrentTime(),

            date:
                getCurrentDateTime()

        };


        const id =
            STATE.selectedUser.id;


        if (!STATE.conversations[id]) {

            STATE.conversations[id] =
                [];

        }


        STATE.conversations[id]
            .push(message);


        renderMessage(
            message,
            true
        );


        saveMessages();


        scrollChat();


        renderUsers();


        if (CONFIG.autoReply) {

            scheduleDemoReply(
                STATE.selectedUser
            );

        }

    }


    /* =====================================================
       الرد التجريبي
    ===================================================== */

    function scheduleDemoReply(user) {

        setTimeout(() => {

            if (
                !STATE.selectedUser ||
                STATE.selectedUser.id !== user.id
            ) {
                return;
            }


            const replies = [

                "وصلتني رسالتك 👍",

                "تمام، شكراً إلك 👌",

                "أكيد، نتواصل هنا.",

                "حاضر 👋",

                "ممتاز، فهمت عليك."

            ];


            const reply =
                replies[
                    Math.floor(
                        Math.random() *
                        replies.length
                    )
                ];


            const message = {

                id:
                    "reply_" +
                    Date.now(),

                sender:
                    user.id,

                text:
                    reply,

                time:
                    getCurrentTime(),

                date:
                    getCurrentDateTime()

            };


            STATE.conversations[user.id]
                .push(message);


            renderMessage(
                message,
                true
            );


            saveMessages();


            scrollChat();


            renderUsers();

        }, CONFIG.autoReplyDelay);

    }


    /* =====================================================
       التمرير لآخر رسالة
    ===================================================== */

    function scrollChat() {

        const container =
            document.getElementById(
                "wfesc-msg-chat-messages"
            );


        if (!container) {
            return;
        }


        requestAnimationFrame(() => {

            container.scrollTo({

                top:
                    container.scrollHeight,

                behavior:
                    "smooth"

            });

        });

    }


    /* =====================================================
       عرض الرسائل
    ===================================================== */

    function showMessages() {

        const root =
            document.getElementById(
                "wfesc-messages-root"
            );


        if (!root) {
            return;
        }


        root.classList.add(
            "active"
        );


        showUsers();

        renderUsers();


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       إخفاء الرسائل
    ===================================================== */

    function closeMessages() {

        const root =
            document.getElementById(
                "wfesc-messages-root"
            );


        if (!root) {
            return;
        }


        root.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       شاشة المستخدمين
    ===================================================== */

    function showUsers() {

        const track =
            document.getElementById(
                "wfesc-msg-track"
            );


        if (!track) {
            return;
        }


        track.style.transform =
            "translateX(0)";


        STATE.page =
            "users";

    }


    /* =====================================================
       شاشة المحادثة
    ===================================================== */

    function showChat() {

        const track =
            document.getElementById(
                "wfesc-msg-track"
            );


        if (!track) {
            return;
        }


        track.style.transform =
            "translateX(50%)";


        STATE.page =
            "chat";

    }


  
    /* =====================================================
       ربط الأحداث
    ===================================================== */

    function bindEvents() {

        const close =
            document.getElementById(
                "wfesc-msg-close"
            );


        const back =
            document.getElementById(
                "wfesc-msg-back"
            );


        const search =
            document.getElementById(
                "wfesc-msg-search"
            );


        const form =
            document.getElementById(
                "wfesc-msg-form"
            );


        const input =
            document.getElementById(
                "wfesc-msg-input"
            );


        const send =
            document.getElementById(
                "wfesc-msg-send"
            );


        if (close) {

            close.addEventListener(
                "click",
                closeMessages
            );

        }


        if (back) {

            back.addEventListener(
                "click",
                showUsers
            );

        }


        if (search) {

            search.addEventListener(
                "input",
                event => {

                    STATE.search =
                        event.target.value;

                    renderUsers();

                }
            );

        }


        if (form) {

            form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();


                    const value =
                        input.value;


                    if (!value.trim()) {
                        return;
                    }


                    if (send) {

                        send.classList.remove(
                            "sending"
                        );


                        void send.offsetWidth;


                        send.classList.add(
                            "sending"
                        );


                        setTimeout(() => {

                            send.classList.remove(
                                "sending"
                            );

                        }, 350);

                    }


                    sendMessage(value);


                    input.value =
                        "";

                    input.focus();

                }
            );

        }


        const windowElement =
            document.querySelector(
                ".wf-msg-window"
            );


        if (windowElement) {

            windowElement.addEventListener(
                "pointerdown",
                event => {

                    STATE.startX =
                        event.clientX;

                }
            );


            windowElement.addEventListener(
                "pointerup",
                event => {

                    if (
                        STATE.startX === null
                    ) {
                        return;
                    }


                    const distance =
                        event.clientX -
                        STATE.startX;


                    if (
                        Math.abs(distance) > 60
                    ) {

                        if (
                            STATE.page === "users"
                        ) {

                            if (
                                distance < 0
                            ) {
                                showChat();
                            }

                        } else {

                            if (
                                distance > 0
                            ) {
                                showUsers();
                            }

                        }

                    }


                    STATE.startX =
                        null;

                }
            );

        }

    }


    /* =====================================================
       ربط زر الرسائل الموجود بالموقع
    ===================================================== */

    function bindExternalButtons() {

        document
            .querySelectorAll(
                "[data-wfesc-open-messages]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    showMessages
                );

            });


        window.addEventListener(
            "wfesc-open-messages",
            showMessages
        );

    }


    /* =====================================================
       تحديث بيانات الحساب الحالي
       auth.js يستطيع استدعاء هذه الدالة لاحقاً.
    ===================================================== */

    function setCurrentUser(user) {

        if (!user) {
            return;
        }


        CONFIG.currentUser = {

            name:
                user.name ||
                user.displayName ||
                "WFESC",

            username:
                user.username ||
                user.user_name ||
                "@wfesc",

            avatar:
                user.avatar ||
                user.avatar_url ||
                "",

            online:
                user.online !== false

        };

    }


    /* =====================================================
       تحديث مستخدم
       يمكن لـ profile.js أو Supabase استخدامه لاحقاً.
    ===================================================== */

    function updateUser(userId, data) {

        const user =
            getUserById(userId);


        if (!user) {
            return false;
        }


        Object.assign(
            user,
            data || {}
        );


        renderUsers();


        if (
            STATE.selectedUser &&
            STATE.selectedUser.id === userId
        ) {

            updateChatHeader();

        }


        return true;

    }


    /* =====================================================
       إضافة مستخدم جديد
    ===================================================== */

    function addUser(user) {

        if (
            !user ||
            !user.id
        ) {
            return false;
        }


        const exists =
            getUserById(user.id);


        if (exists) {

            Object.assign(
                exists,
                user
            );

        } else {

            STATE.users.push({

                id:
                    user.id,

                name:
                    user.name ||
                    "مستخدم",

                username:
                    user.username ||
                    "@user",

                avatar:
                    user.avatar ||
                    "",

                online:
                    user.online === true,

                lastMessage:
                    "",

                unread:
                    0

            });

        }


        renderUsers();


        return true;

    }


    /* =====================================================
       حذف مستخدم من التجربة
    ===================================================== */

    function removeUser(userId) {

        const index =
            STATE.users.findIndex(
                user => user.id === userId
            );


        if (index === -1) {
            return false;
        }


        STATE.users.splice(
            index,
            1
        );


        delete STATE.conversations[
            userId
        ];


        renderUsers();


        return true;

    }


    /* =====================================================
       API عامة للنظام
    ===================================================== */

    window.WFESC_MESSAGES = {

        version:
            CONFIG.version,

        open:
            showMessages,

        close:
            closeMessages,

        openConversation:
            openConversation,

        send:
            sendMessage,

        getUsers:
            () => [...STATE.users],

        getCurrentUser:
            () => ({
                ...CONFIG.currentUser
            }),

        setCurrentUser:
            setCurrentUser,

        addUser:
            addUser,

        updateUser:
            updateUser,

        removeUser:
            removeUser,

        getState:
            () => ({
                page:
                    STATE.page,

                selectedUser:
                    STATE.selectedUser,

                users:
                    [...STATE.users]

            })

    };


    /* =====================================================
       اختصارات عامة
    ===================================================== */

    window.WFESC_MESSAGES_OPEN =
        showMessages;


    window.WFESC_MESSAGES_CLOSE =
        closeMessages;


    window.WFESC_MESSAGES_OPEN_USER =
        openConversation;


    /* =====================================================
       بدء النظام
    ===================================================== */

    function init() {

        initializeMessages();

        injectStyles();

        createInterface();

        bindExternalButtons();


        console.log(
            "[WFESC MESSAGES] Loaded.",
            CONFIG.version
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once:true
            }
        );

    } else {

        init();

    }


})();
