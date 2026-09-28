/* =========================================================
   WFESC MESSAGES — CHAT HEADER
   messages/messages-chat-header.js

   المسؤول عن:
   - صورة المستخدم
   - اسم المستخدم
   - حالة النشاط
   - النقطة الخضراء / الرمادية
   - مزامنة Presence
   - تحديث الرأس فوراً
   - تجهيز زر الملف الشخصي للمستقبل

   لا يعدل messages-core.js
   لا يعدل messages-activity.js
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       DEBUG
    ===================================================== */

    const HEADER_DEBUG = true;


    function debug(...args) {

        if (!HEADER_DEBUG) {
            return;
        }

        console.log(
            "[WFESC Chat Header]",
            ...args
        );

    }


    function debugError(...args) {

        console.error(
            "[WFESC Chat Header]",
            ...args
        );

    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://mcgbzfgbaxwmutniorlw.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_V9RaHJDWmhox-XMzj1SK_w_6p5pAK5L";


    let client = null;


    function getClient() {

        try {

            if (
                window.WFESCSupabase
            ) {

                return window.WFESCSupabase;

            }


            if (
                window.supabase &&
                typeof window.supabase.createClient ===
                    "function"
            ) {

                return window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );

            }

        } catch (error) {

            debugError(
                "Supabase:",
                error
            );

        }

        return null;

    }


    /* =====================================================
       CORE / ACTIVITY
    ===================================================== */

    function getCore() {

        return (
            window.WFESC_MESSAGES_CORE ||
            null
        );

    }


    function getActivity() {

        return (
            window.WFESC_MESSAGES_ACTIVITY ||
            null
        );

    }


    /* =====================================================
       DOM
    ===================================================== */

    const chatPersonButton =
        document.getElementById(
            "chatPersonButton"
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


    /* =====================================================
       DEFAULT AVATAR
    ===================================================== */

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
                    fill="#151515"
                />

                <circle
                    cx="100"
                    cy="76"
                    r="38"
                    fill="#777"
                />

                <path
                    d="
                        M35 175
                        C42 132 66 112 100 112
                        C134 112 158 132 165 175
                        Z
                    "
                    fill="#777"
                />

            </svg>
        `);


    /* =====================================================
       STATE
    ===================================================== */

    let currentContact = null;

    let currentConversationId = null;

    let profileLoading = false;

    let lastRenderedUserId = null;


    /* =====================================================
       NAME
    ===================================================== */

    function getDisplayName(
        contact
    ) {

        if (!contact) {
            return "مستخدم";
        }

        return (
            contact.display_name ||
            contact.full_name ||
            contact.name ||
            contact.username ||
            "مستخدم"
        );

    }


    /* =====================================================
       AVATAR
    ===================================================== */

    function getAvatarUrl(
        contact
    ) {

        if (!contact) {
            return DEFAULT_AVATAR;
        }

        return (
            contact.avatar_url ||
            contact.avatar ||
            contact.photo_url ||
            DEFAULT_AVATAR
        );

    }


    /* =====================================================
       ACTIVITY VISIBILITY
    ===================================================== */

    function canShowActivity(
        contact
    ) {

        if (!contact) {
            return false;
        }


        return (
            contact.show_activity !== false
        );

    }


    /* =====================================================
       GET ONLINE STATE
    ===================================================== */

    function getOnlineState(
        contact
    ) {

        if (!contact) {
            return false;
        }


        if (
            !canShowActivity(
                contact
            )
        ) {

            return false;

        }


        const activity =
            getActivity();


        if (
            activity &&
            typeof activity.getUserActivity ===
                "function" &&
            contact.user_id
        ) {

            try {

                const result =
                    activity.getUserActivity(
                        contact.user_id
                    );


                if (
                    result &&
                    typeof result.online ===
                        "boolean"
                ) {

                    return result.online;

                }

            } catch (error) {

                debugError(
                    "Activity:",
                    error
                );

            }

        }


        /*
         * احتياط في حالة أن Presence
         * لم يجهز بعد.
         */

        return Boolean(
            contact.is_online
        );

    }


    /* =====================================================
       STATUS TEXT
    ===================================================== */

    function getStatusText(
        contact,
        online
    ) {

        if (!contact) {
            return "";
        }


        if (
            !canShowActivity(
                contact
            )
        ) {

            return "غير نشط";

        }


        if (online) {

            return "نشط الآن";

        }


        return "غير نشط";

    }


    /* =====================================================
       RENDER AVATAR
    ===================================================== */

    function renderAvatar(
        contact
    ) {

        if (!chatAvatar) {
            return;
        }


        const url =
            getAvatarUrl(
                contact
            );


        const name =
            getDisplayName(
                contact
            );


        chatAvatar.alt =
            name;


        /*
         * لا نغير الصورة إذا كانت نفس الصورة
         * لتجنب وميض الصورة عند تحديث Presence.
         */

        if (
            chatAvatar.src !== url
        ) {

            chatAvatar.src =
                url;

        }


        chatAvatar.onerror =
            function () {

                if (
                    chatAvatar.src !==
                    DEFAULT_AVATAR
                ) {

                    chatAvatar.src =
                        DEFAULT_AVATAR;

                }

            };

    }


    /* =====================================================
       RENDER NAME
    ===================================================== */

    function renderName(
        contact
    ) {

        if (!chatName) {
            return;
        }


        chatName.textContent =
            getDisplayName(
                contact
            );

    }


    /* =====================================================
       RENDER ACTIVITY
    ===================================================== */

    function renderActivity(
        contact
    ) {

        if (!contact) {
            return;
        }


        const online =
            getOnlineState(
                contact
            );


        const status =
            getStatusText(
                contact,
                online
            );


        if (chatStatus) {

            chatStatus.textContent =
                status;

        }


        if (chatOnlineDot) {

            chatOnlineDot.classList.toggle(
                "active",
                online
            );

            /*
             * aria إضافية حتى نعرف الحالة
             * بدون التأثير على التصميم.
             */

            chatOnlineDot.setAttribute(
                "aria-label",
                online
                    ? "نشط الآن"
                    : "غير نشط"
            );

        }

    }


    /* =====================================================
       RENDER HEADER
    ===================================================== */

    function renderHeader(
        contact
    ) {

        if (!contact) {
            return;
        }


        currentContact =
            contact;


        lastRenderedUserId =
            contact.user_id ||
            null;


        renderAvatar(
            contact
        );


        renderName(
            contact
        );


        renderActivity(
            contact
        );


        debug(
            "Header updated:",
            contact
        );

    }


    /* =====================================================
       LOAD PROFILE
       
       إذا كان Core أرسل user_id فقط أو كانت
       صورة المستخدم غير موجودة، نجلب البيانات
       مباشرة من profiles.
    ===================================================== */

    async function loadFullProfile(
        contact
    ) {

        if (
            !client ||
            !contact ||
            !contact.user_id
        ) {

            return contact;

        }


        /*
         * إذا البيانات موجودة بالكامل
         * لا داعي لطلب جديد.
         */

        if (
            contact.avatar_url &&
            (
                contact.display_name ||
                contact.username
            )
        ) {

            return contact;

        }


        if (profileLoading) {

            return contact;

        }


        profileLoading =
            true;


        try {

            const result =
                await client
                    .from("profiles")
                    .select(
                        "id,username,display_name,avatar_url,show_activity"
                    )
                    .eq(
                        "id",
                        contact.user_id
                    )
                    .maybeSingle();


            if (
                result.error
            ) {

                debugError(
                    "Profile:",
                    result.error
                );

                return contact;

            }


            if (
                result.data
            ) {

                const merged = {

                    ...contact,

                    ...result.data,

                    user_id:
                        contact.user_id ||
                        result.data.id

                };


                /*
                 * إذا profile يحتوي id فقط
                 */

                if (
                    !merged.user_id
                ) {

                    merged.user_id =
                        result.data.id;

                }


                currentContact =
                    merged;


                renderHeader(
                    merged
                );


                return merged;

            }

        } catch (error) {

            debugError(
                "Load profile:",
                error
            );

        } finally {

            profileLoading =
                false;

        }


        return contact;

    }


    /* =====================================================
       READ CORE
    ===================================================== */

    function readFromCore(
        detail = null
    ) {

        /*
         * الحالة الطبيعية:
         * Core يرسل contact مباشرة.
         */

        if (
            detail &&
            detail.contact
        ) {

            currentConversationId =
                detail.conversationId ||
                null;


            const contact =
                detail.contact;


            renderHeader(
                contact
            );


            /*
             * نتأكد من بيانات Profile
             */

            loadFullProfile(
                contact
            );


            return;

        }


        const core =
            getCore();


        if (
            !core ||
            !core.chatHeader
        ) {

            return;

        }


        let contact =
            null;


        if (
            typeof core.chatHeader.getContact ===
                "function"
        ) {

            contact =
                core.chatHeader.getContact();

        }


        if (!contact) {
            return;
        }


        if (
            typeof core.chatHeader.getConversationId ===
                "function"
        ) {

            currentConversationId =
                core.chatHeader.getConversationId();

        }


        renderHeader(
            contact
        );


        loadFullProfile(
            contact
        );

    }


    /* =====================================================
       REFRESH ACTIVITY
    ===================================================== */

    function refreshActivity() {

        if (!currentContact) {

            readFromCore();

            return;

        }


        renderActivity(
            currentContact
        );

    }


    /* =====================================================
       ACTIVITY SYNC
    ===================================================== */

    window.addEventListener(
        "wfesc:activity-sync",
        event => {

            /*
             * Presence تغير.
             * نعيد قراءة النشاط فوراً.
             */

            if (
                currentContact
            ) {

                renderActivity(
                    currentContact
                );

            }


            debug(
                "Activity sync:",
                event?.detail
            );

        }
    );


    /* =====================================================
       ACTIVITY RESPONSE
    ===================================================== */

    window.addEventListener(
        "wfesc:activity-response",
        event => {

            if (!currentContact) {
                return;
            }


            const detail =
                event?.detail;


            if (
                !detail
            ) {
                return;
            }


            if (
                detail.userId !==
                currentContact.user_id
            ) {

                return;

            }


            /*
             * إذا جاء الرد مباشرة من Activity
             * نستخدمه لتحديث الواجهة.
             */

            const online =
                detail.online === true;


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
    );


    /* =====================================================
       CORE HEADER REFRESH
    ===================================================== */

    window.addEventListener(
        "wfesc:chat-header-refresh",
        event => {

            readFromCore(
                event?.detail || null
            );

        }
    );


    /* =====================================================
       PROFILE CLICK
    ===================================================== */

    if (
        chatPersonButton
    ) {

        chatPersonButton.addEventListener(
            "click",
            () => {

                window.dispatchEvent(
                    new CustomEvent(
                        "wfesc:chat-profile-click",
                        {
                            detail: {

                                contact:
                                    currentContact,

                                conversationId:
                                    currentConversationId

                            }
                        }
                    )
                );

            }
        );

    }


    /* =====================================================
       VISIBILITY
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible"
            ) {

                refreshActivity();

            }

        }
    );


    /* =====================================================
       WINDOW FOCUS
    ===================================================== */

    window.addEventListener(
        "focus",
        () => {

            refreshActivity();

        }
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.WFESC_MESSAGES_CHAT_HEADER = {

        refresh() {

            readFromCore();

        },


        refreshActivity() {

            refreshActivity();

        },


        getContact() {

            return currentContact;

        },


        getConversationId() {

            return currentConversationId;

        },


        getDisplayName() {

            return getDisplayName(
                currentContact
            );

        },


        getAvatarUrl() {

            return getAvatarUrl(
                currentContact
            );

        },


        isOnline() {

            return getOnlineState(
                currentContact
            );

        }

    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        client =
            getClient();


        /*
         * نقرأ Core بعد تحميل جميع الملفات.
         */

        setTimeout(
            () => {

                readFromCore();

            },
            100
        );


        /*
         * محاولة ثانية بعد إعطاء Presence
         * فرصة للتجهيز.
         */

        setTimeout(
            () => {

                refreshActivity();

            },
            1000
        );


        debug(
            "messages-chat-header.js loaded"
        );

    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:true
            }
        );

    } else {

        initialize();

    }


})();
