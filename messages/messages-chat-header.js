/* =========================================================
   WFESC MESSAGES — CHAT HEADER
   الملف: messages-chat-header.js

   المسؤوليات:
   - تحديث صورة الشخص
   - تحديث اسم الشخص
   - تحديث حالة النشاط
   - تحديث النقطة الخضراء
   - الاعتماد على messages-activity.js لمعرفة النشاط
   - الاستماع لتحديثات Core و Activity
   - تجهيز زر رأس المحادثة للمستقبل

   لا يحتوي هذا الملف على:
   - تحميل الرسائل
   - إرسال الرسائل
   - إعدادات المحادثة
   - الإشعارات
   - البحث
========================================================= */

(function () {

    "use strict";


    /* =========================================================
       الانتظار حتى تكون الملفات الأساسية جاهزة
    ========================================================= */

    function getCore() {
        return window.WFESC_MESSAGES_CORE || null;
    }

    function getActivity() {
        return window.WFESC_MESSAGES_ACTIVITY || null;
    }


    /* =========================================================
       عناصر واجهة رأس المحادثة
    ========================================================= */

    const chatPersonButton =
        document.getElementById("chatPersonButton");

    const chatAvatar =
        document.getElementById("chatAvatar");

    const chatName =
        document.getElementById("chatName");

    const chatStatus =
        document.getElementById("chatStatus");

    const chatOnlineDot =
        document.getElementById("chatOnlineDot");


    /* =========================================================
       الحالة الداخلية
    ========================================================= */

    let currentContact = null;
    let currentConversationId = null;


    /* =========================================================
       الصورة الافتراضية
    ========================================================= */

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
                    cy="78"
                    r="38"
                    fill="#777"
                />

                <path
                    d="
                        M35 175
                        C42 130 65 112 100 112
                        C135 112 158 130 165 175
                        Z
                    "
                    fill="#777"
                />
            </svg>
        `);


    /* =========================================================
       الحصول على اسم العرض
    ========================================================= */

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


    /* =========================================================
       الحصول على رابط الصورة
    ========================================================= */

    function getAvatarUrl(contact) {

        if (!contact) {
            return DEFAULT_AVATAR;
        }

        return (
            contact.avatar_url ||
            DEFAULT_AVATAR
        );
    }


    /* =========================================================
       الحصول على حالة إظهار النشاط
    ========================================================= */

    function isActivityVisible(contact) {

        if (!contact) {
            return false;
        }

        return contact.show_activity !== false;
    }


    /* =========================================================
       الحصول على حالة النشاط من Activity Module
    ========================================================= */

    function getOnlineState(contact) {

        if (!contact) {
            return false;
        }


        /*
         * إذا كان المستخدم لا يسمح بإظهار نشاطه،
         * لا نظهره كنشط.
         */

        if (!isActivityVisible(contact)) {
            return false;
        }


        const activity =
            getActivity();


        /*
         * نترك تحديد النشاط لملف
         * messages-activity.js
         */

        if (
            activity &&
            typeof activity.getUserActivity === "function"
        ) {

            try {

                const activityState =
                    activity.getUserActivity(
                        contact.user_id
                    );


                if (
                    activityState &&
                    typeof activityState === "object"
                ) {

                    if (
                        typeof activityState.isOnline === "boolean"
                    ) {
                        return activityState.isOnline;
                    }

                    if (
                        typeof activityState.online === "boolean"
                    ) {
                        return activityState.online;
                    }

                    if (
                        typeof activityState.is_online === "boolean"
                    ) {
                        return activityState.is_online;
                    }
                }


                /*
                 * إذا رجعت الدالة قيمة Boolean مباشرة
                 */

                if (
                    typeof activityState === "boolean"
                ) {
                    return activityState;
                }

            } catch (error) {

                console.warn(
                    "[WFESC CHAT HEADER] Activity check failed:",
                    error
                );

            }

        }


        /*
         * احتياط:
         * نستخدم قيمة Core إذا لم تتوفر
         * معلومات Activity.
         */

        return Boolean(
            contact.is_online
        );
    }


    /* =========================================================
       الحصول على نص حالة النشاط
    ========================================================= */

    function getStatusText(
        contact,
        isOnline
    ) {

        if (!contact) {
            return "";
        }


        /*
         * إذا كانت حالة النشاط مخفية
         */

        if (!isActivityVisible(contact)) {
            return "غير نشط";
        }


        /*
         * دعم خاص لحساب WFESC
         */

        if (
            contact.is_support &&
            contact.show_activity !== false
        ) {

            if (isOnline) {
                return "نشط الآن";
            }

        }


        return isOnline
            ? "نشط الآن"
            : "غير نشط";
    }


    /* =========================================================
       تحديث الصورة
    ========================================================= */

    function renderAvatar(contact) {

        if (!chatAvatar) {
            return;
        }


        const avatar =
            getAvatarUrl(contact);


        chatAvatar.src = avatar;

        chatAvatar.alt =
            getDisplayName(contact);


        /*
         * إذا فشلت الصورة،
         * نستخدم الصورة الافتراضية.
         */

        chatAvatar.onerror = function () {

            if (
                chatAvatar.src !== DEFAULT_AVATAR
            ) {

                chatAvatar.src =
                    DEFAULT_AVATAR;

            }

        };

    }


    /* =========================================================
       تحديث الاسم
    ========================================================= */

    function renderName(contact) {

        if (!chatName) {
            return;
        }


        chatName.textContent =
            getDisplayName(contact);

    }


    /* =========================================================
       تحديث حالة النشاط
    ========================================================= */

    function renderActivity(contact) {

        if (!contact) {
            return;
        }


        const online =
            getOnlineState(contact);


        const statusText =
            getStatusText(
                contact,
                online
            );


        if (chatStatus) {

            chatStatus.textContent =
                statusText;

        }


        if (chatOnlineDot) {

            chatOnlineDot.classList.toggle(
                "active",
                online
            );

        }

    }


    /* =========================================================
       تحديث رأس المحادثة بالكامل
    ========================================================= */

    function renderHeader(contact) {

        if (!contact) {
            return;
        }


        currentContact =
            contact;


        renderAvatar(
            contact
        );


        renderName(
            contact
        );


        renderActivity(
            contact
        );

    }


    /* =========================================================
       قراءة بيانات Core
    ========================================================= */

    function refreshFromCore(detail = null) {

        const core =
            getCore();


        /*
         * إذا أرسل Core البيانات مباشرة
         */

        if (
            detail &&
            detail.contact
        ) {

            currentContact =
                detail.contact;

            currentConversationId =
                detail.conversationId ||
                null;

            renderHeader(
                currentContact
            );

            return;
        }


        /*
         * إذا لم توجد بيانات في الحدث،
         * نقرأها من واجهة Core.
         */

        if (
            core &&
            core.chatHeader
        ) {

            let contact = null;


            if (
                typeof core.chatHeader.getContact ===
                "function"
            ) {

                contact =
                    core.chatHeader.getContact();

            }


            if (contact) {

                currentContact =
                    contact;


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

            }

        }

    }


    /* =========================================================
       تحديث النشاط فقط
    ========================================================= */

    function refreshActivityOnly() {

        if (!currentContact) {

            refreshFromCore();

            return;

        }


        renderActivity(
            currentContact
        );

    }


    /* =========================================================
       حدث تحديث رأس المحادثة من Core
    ========================================================= */

    window.addEventListener(
        "wfesc:chat-header-refresh",
        function (event) {

            const detail =
                event?.detail || null;


            refreshFromCore(
                detail
            );

        }
    );


    /* =========================================================
       أحداث Activity Module
    ========================================================= */

    window.addEventListener(
        "wfesc:activity-sync",
        function () {

            refreshActivityOnly();

        }
    );


    window.addEventListener(
        "wfesc:activity-response",
        function () {

            refreshActivityOnly();

        }
    );


    /* =========================================================
       طلب تحديث النشاط عند الحاجة
    ========================================================= */

    function requestActivityRefresh() {

        window.dispatchEvent(
            new CustomEvent(
                "wfesc:activity-request",
                {
                    detail: {
                        userId:
                            currentContact?.user_id ||
                            null
                    }
                }
            )
        );

    }


    /* =========================================================
       زر الشخص في رأس المحادثة
       
       حالياً لا نفتح الملف الشخصي مباشرة.
       فقط نرسل حدثاً للموديول المسؤول مستقبلاً.
    ========================================================= */

    if (chatPersonButton) {

        chatPersonButton.addEventListener(
            "click",
            function () {

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


    /* =========================================================
       إعادة التحديث عند الرجوع للصفحة
    ========================================================= */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                refreshActivityOnly();

            }

        }
    );


    /* =========================================================
       تحديث عند التركيز
    ========================================================= */

    window.addEventListener(
        "focus",
        function () {

            refreshActivityOnly();

        }
    );


    /* =========================================================
       الواجهة العامة للموديول
    ========================================================= */

    window.WFESC_MESSAGES_CHAT_HEADER = {

        refresh() {

            refreshFromCore();

        },

        refreshActivity() {

            refreshActivityOnly();

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

        },

        requestActivityRefresh() {

            requestActivityRefresh();

        }

    };


    /* =========================================================
       التشغيل الأول
    ========================================================= */

    /*
     * Core قد يكون قد فتح المحادثة قبل تحميل
     * هذا الملف، لذلك نحاول قراءة البيانات
     * مباشرة بعد تشغيل الموديول.
     */

    setTimeout(
        function () {

            refreshFromCore();

        },
        0
    );


    console.log(
        "[WFESC] messages-chat-header.js loaded"
    );


})();
