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


    /* =========================================================
       عناصر واجهة رأس المحادثة
    ========================================================= */

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


    /* =========================================================
       الحالة الداخلية
    ========================================================= */

    let currentContact =
        null;


    let currentConversationId =
        null;


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
       الحصول على معرف المستخدم من بيانات Contact
       
       يدعم:
       user_id
       id
       userId
       profile.user_id
       profile.id
       user.user_id
       user.id
       contact.user_id
       contact.id
    ========================================================= */

    function getContactUserId(contact) {

        if (!contact) {
            return null;
        }


        return (
            contact.user_id ||
            contact.userId ||
            contact.id ||
            contact.profile?.user_id ||
            contact.profile?.userId ||
            contact.profile?.id ||
            contact.user?.user_id ||
            contact.user?.userId ||
            contact.user?.id ||
            contact.contact?.user_id ||
            contact.contact?.userId ||
            contact.contact?.id ||
            null
        );

    }


    /* =========================================================
       توحيد بيانات Contact
    ========================================================= */

    function normalizeContact(contact) {

        if (!contact) {
            return null;
        }


        const nestedProfile =
            contact.profile ||
            contact.user ||
            contact.contact ||
            null;


        const userId =
            getContactUserId(
                contact
            );


        return {

            ...(
                nestedProfile &&
                typeof nestedProfile === "object"
                    ? nestedProfile
                    : {}
            ),

            ...contact,


            user_id:
                userId || null,


            display_name:
                contact.display_name ||
                contact.full_name ||
                contact.name ||
                nestedProfile?.display_name ||
                nestedProfile?.full_name ||
                nestedProfile?.name ||
                contact.username ||
                nestedProfile?.username ||
                "مستخدم",


            username:
                contact.username ||
                nestedProfile?.username ||
                null,


            avatar_url:
                contact.avatar_url ||
                contact.avatar ||
                contact.photo_url ||
                nestedProfile?.avatar_url ||
                nestedProfile?.avatar ||
                nestedProfile?.photo_url ||
                DEFAULT_AVATAR

        };

    }


    /* =========================================================
       الحصول على اسم العرض
    ========================================================= */

    function getDisplayName(contact) {

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


    /* =========================================================
       الحصول على رابط الصورة
    ========================================================= */

    function getAvatarUrl(contact) {

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


    /* =========================================================
       الحصول على حالة إظهار النشاط
       
       ملاحظة:
       لا نستخدم هذه القيمة وحدها لتحديد النشاط.
       
       Activity Module هو المصدر الأساسي.
       هذا فقط fallback في حالة عدم وجود Activity.
    ========================================================= */

    function isActivityVisible(contact) {

        if (!contact) {
            return false;
        }


        return (
            contact.show_activity !== false
        );

    }


    /* =========================================================
       الحصول على حالة النشاط من Activity Module
    ========================================================= */

    function getActivityState(contact) {

        if (!contact) {

            return {

                online: false,

                disabled: false,

                show_activity: true,

                last_seen: null

            };

        }


        const activity =
            getActivity();


        const userId =
            getContactUserId(
                contact
            );


        /*
         * لا يوجد Activity Module بعد
         */

        if (
            !activity ||
            typeof activity.getUserActivity !==
                "function"
        ) {

            return {

                online:
                    Boolean(
                        contact.is_online
                    ),

                disabled:
                    contact.show_activity === false,

                show_activity:
                    contact.show_activity !== false,

                last_seen:
                    contact.last_seen ||
                    null

            };

        }


        /*
         * بدون معرف مستخدم
         */

        if (!userId) {

            return {

                online: false,

                disabled:
                    contact.show_activity === false,

                show_activity:
                    contact.show_activity !== false,

                last_seen:
                    contact.last_seen ||
                    null

            };

        }


        try {

            const result =
                activity.getUserActivity(
                    userId
                );


            if (
                result &&
                typeof result === "object"
            ) {

                return {

                    online:
                        result.online === true ||
                        result.isOnline === true ||
                        result.is_online === true,

                    disabled:
                        result.disabled === true ||
                        result.show_activity === false,

                    show_activity:
                        result.show_activity !== false &&
                        result.disabled !== true,

                    last_seen:
                        result.last_seen ||
                        null

                };

            }


            /*
             * دعم الإصدارات التي ترجع Boolean
             */

            if (
                typeof result === "boolean"
            ) {

                return {

                    online:
                        result,

                    disabled: false,

                    show_activity: true,

                    last_seen: null

                };

            }

        } catch (error) {

            console.warn(
                "[WFESC CHAT HEADER] Activity check failed:",
                error
            );

        }


        /*
         * Fallback من بيانات Core
         */

        return {

            online:
                Boolean(
                    contact.is_online
                ),

            disabled:
                contact.show_activity === false,

            show_activity:
                contact.show_activity !== false,

            last_seen:
                contact.last_seen ||
                null

        };

    }


    /* =========================================================
       الحصول على حالة النشاط
    ========================================================= */

    function getOnlineState(contact) {

        if (!contact) {
            return false;
        }


        const state =
            getActivityState(
                contact
            );


        return (
            state.online === true &&
            state.disabled !== true &&
            state.show_activity !== false
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


        const state =
            getActivityState(
                contact
            );


        /*
         * المستخدم اختار إخفاء نشاطه
         */

        if (
            state.disabled === true ||
            state.show_activity === false
        ) {

            return "عدم النشاط";

        }


        /*
         * حساب WFESC
         */

        if (
            contact.is_support
        ) {

            if (isOnline) {
                return "نشط الآن";
            }

            return "غير نشط";

        }


        /*
         * مستخدم عادي
         */

        if (isOnline) {

            return "نشط الآن";

        }


        return "غير نشط";

    }


    /* =========================================================
       تحديث الصورة
    ========================================================= */

    function renderAvatar(contact) {

        if (!chatAvatar) {
            return;
        }


        const normalized =
            normalizeContact(
                contact
            );


        const avatar =
            getAvatarUrl(
                normalized
            );


        chatAvatar.src =
            avatar;


        chatAvatar.alt =
            getDisplayName(
                normalized
            );


        /*
         * إذا فشلت الصورة،
         * نستخدم الصورة الافتراضية.
         */

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


    /* =========================================================
       تحديث الاسم
    ========================================================= */

    function renderName(contact) {

        if (!chatName) {
            return;
        }


        const normalized =
            normalizeContact(
                contact
            );


        chatName.textContent =
            getDisplayName(
                normalized
            );

    }


    /* =========================================================
       تحديث حالة النشاط
    ========================================================= */

    function renderActivity(contact) {

        if (!contact) {
            return;
        }


        const normalized =
            normalizeContact(
                contact
            );


        const online =
            getOnlineState(
                normalized
            );


        const statusText =
            getStatusText(
                normalized,
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


        const normalized =
            normalizeContact(
                contact
            );


        currentContact =
            normalized;


        renderAvatar(
            normalized
        );


        renderName(
            normalized
        );


        renderActivity(
            normalized
        );

    }


    /* =========================================================
       قراءة بيانات Core
    ========================================================= */

    function refreshFromCore(
        detail = null
    ) {

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
                normalizeContact(
                    detail.contact
                );


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

            let contact =
                null;


            if (
                typeof
                core.chatHeader.getContact ===
                "function"
            ) {

                contact =
                    core.chatHeader.getContact();

            }


            if (contact) {

                currentContact =
                    normalizeContact(
                        contact
                    );


                if (
                    typeof
                    core.chatHeader.getConversationId ===
                    "function"
                ) {

                    currentConversationId =
                        core.chatHeader.getConversationId();

                }


                renderHeader(
                    currentContact
                );

            }

        }

    }


    /* =========================================================
       تحديث النشاط فقط
    ========================================================= */

    function refreshActivityOnly() {

        /*
         * إذا لم توجد محادثة حالية،
         * نحاول أخذها من Core.
         */

        if (!currentContact) {

            refreshFromCore();

            return;

        }


        /*
         * نعيد توحيد البيانات كل مرة.
         */

        currentContact =
            normalizeContact(
                currentContact
            );


        /*
         * إعادة قراءة النشاط مباشرة.
         */

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
                event?.detail ||
                null;


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
                            getContactUserId(
                                currentContact
                            )

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

                refreshFromCore();

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
       تحديث دوري خفيف لرأس المحادثة
       
       لا ينشئ Presence جديد.
       فقط يقرأ الحالة الحالية.
    ========================================================= */

    let activityRefreshTimer =
        null;


    function startActivityRefreshTimer() {

        if (
            activityRefreshTimer
        ) {

            clearInterval(
                activityRefreshTimer
            );

        }


        activityRefreshTimer =
            setInterval(
                function () {

                    if (
                        document.visibilityState !==
                        "hidden"
                    ) {

                        refreshActivityOnly();

                    }

                },
                3000
            );

    }


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


        getUserId() {

            return getContactUserId(
                currentContact
            );

        },


        getActivityState() {

            return getActivityState(
                currentContact
            );

        },


        isOnline() {

            return getOnlineState(
                currentContact
            );

        },


        getStatusText() {

            return getStatusText(
                currentContact,
                getOnlineState(
                    currentContact
                )
            );

        },


        requestActivityRefresh() {

            requestActivityRefresh();

        }

    };


    /* =========================================================
       التشغيل الأول
       
       Core قد يكون قد فتح المحادثة قبل تحميل
       هذا الملف، لذلك نحاول قراءة البيانات
       مباشرة بعد تشغيل الموديول.
    ========================================================= */

    setTimeout(
        function () {

            refreshFromCore();

            startActivityRefreshTimer();

        },
        0
    );


    /*
     * محاولة ثانية بعد تحميل باقي الموديولات.
     */

    setTimeout(
        function () {

            refreshFromCore();

            refreshActivityOnly();

        },
        250
    );


    /*
     * محاولة ثالثة للتأكد من اكتمال Core.
     */

    setTimeout(
        function () {

            refreshFromCore();

            refreshActivityOnly();

        },
        1000
    );


    console.log(
        "[WFESC] messages-chat-header.js loaded"
    );


})();
