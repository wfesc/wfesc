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
   - حماية بيانات المستخدم عند وجود حظر
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


    function getBlock() {

        return (
            window.WFESC_MESSAGES_BLOCK ||
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


    let currentBlockState = {

        blocked: false,

        blockedBy: false

    };


    /*
     * Token لمنع تطبيق نتيجة فحص قديم
     * بعد الانتقال إلى محادثة أخرى.
     */

    let blockCheckToken =
        0;


    /*
     * يمنع تشغيل أكثر من تحديث Header
     * متزامن عند كثرة الأحداث.
     */

    let headerRenderToken =
        0;


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
       صورة مستخدم محظور
       لا تحتوي على أي معلومة عن المستخدم الحقيقي
    ========================================================= */

    const BLOCKED_AVATAR =
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
                    cy="100"
                    r="72"
                    fill="#242424"
                    stroke="#555"
                    stroke-width="5"
                />

                <rect
                    x="58"
                    y="88"
                    width="84"
                    height="58"
                    rx="10"
                    fill="#777"
                />

                <path
                    d="
                        M75 88
                        V70
                        C75 56 86 45 100 45
                        C114 45 125 56 125 70
                        V88
                    "
                    fill="none"
                    stroke="#999"
                    stroke-width="12"
                    stroke-linecap="round"
                />

                <circle
                    cx="100"
                    cy="115"
                    r="7"
                    fill="#151515"
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
       فحص حالة الحظر

       blocked:
       المستخدم الحالي قام بحظر الشخص.

       blockedBy:
       الشخص الحالي قام بحظر المستخدم الحالي.
    ========================================================= */

    async function getBlockState(contact) {

        const block =
            getBlock();


        const userId =
            getContactUserId(
                contact
            );


        if (
            !block ||
            !userId
        ) {

            return {

                blocked: false,

                blockedBy: false

            };

        }


        let blocked =
            false;


        let blockedBy =
            false;


        try {

            if (
                typeof block.isBlocked ===
                "function"
            ) {

                blocked =
                    await block.isBlocked(
                        userId
                    );

            }

        } catch (error) {

            console.warn(
                "[WFESC CHAT HEADER] isBlocked failed:",
                error
            );

        }


        try {

            if (
                typeof block.isBlockedBy ===
                "function"
            ) {

                blockedBy =
                    await block.isBlockedBy(
                        userId
                    );

            }

        } catch (error) {

            console.warn(
                "[WFESC CHAT HEADER] isBlockedBy failed:",
                error
            );

        }


        return {

            blocked:
                blocked === true,

            blockedBy:
                blockedBy === true

        };

    }


    /* =========================================================
       تحديث حالة الحظر الحالية
    ========================================================= */

    async function refreshBlockState(
        contact
    ) {

        const token =
            ++blockCheckToken;


        const normalized =
            normalizeContact(
                contact
            );


        if (!normalized) {

            currentBlockState = {

                blocked: false,

                blockedBy: false

            };

            return currentBlockState;

        }


        const normalizedUserId =
            getContactUserId(
                normalized
            );


        const state =
            await getBlockState(
                normalized
            );


        /*
         * إذا تغيرت المحادثة أثناء الفحص،
         * لا نطبق نتيجة الفحص القديمة.
         */

        if (
            token !== blockCheckToken
        ) {

            return null;

        }


        /*
         * حماية إضافية:
         * نتأكد أن النتيجة تخص المستخدم
         * الموجود حالياً في رأس المحادثة.
         */

        const currentUserId =
            getContactUserId(
                currentContact
            );


        if (
            currentUserId &&
            normalizedUserId &&
            String(currentUserId) !==
            String(normalizedUserId)
        ) {

            return null;

        }


        currentBlockState =
            state;


        return state;

    }


    /* =========================================================
       هل يجب إخفاء هوية المستخدم؟

       فقط إذا كان الطرف الآخر هو الذي حظر المستخدم الحالي.

       إذا المستخدم الحالي هو الذي حظر الطرف الآخر،
       تبقى بيانات الطرف الآخر ظاهرة عنده.
    ========================================================= */

    function isContactBlockedByThem() {

        return (
            currentBlockState?.blockedBy ===
            true
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


        /*
         * إذا المستخدم حاظر الطرف الآخر،
         * لا نحتاج لإظهار حالة النشاط.
         */

        if (
            currentBlockState?.blockedBy ===
            true
        ) {

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


        /*
         * الحظر من الطرف الآخر
         */

        if (
            currentBlockState?.blockedBy ===
            true
        ) {

            return "قام المستخدم بحظرك";

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


        /*
         * إذا الطرف الآخر حاظر المستخدم الحالي،
         * لا نعرض صورته الحقيقية.
         */

        if (
            isContactBlockedByThem()
        ) {

            chatAvatar.src =
                BLOCKED_AVATAR;


            chatAvatar.alt =
                "قام المستخدم بحظرك";


            chatAvatar.onerror =
                null;


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


        /*
         * لا نكشف الاسم الحقيقي
         * لمن قام بحظره.
         */

        if (
            isContactBlockedByThem()
        ) {

            chatName.textContent =
                "قام المستخدم بحظرك";


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

            /*
             * لا تظهر النقطة الخضراء
             * إذا كان المستخدم قد حظرك.
             */

            chatOnlineDot.classList.toggle(
                "active",
                online &&
                !isContactBlockedByThem()
            );

        }

    }


    /* =========================================================
       تحديث رأس المحادثة بالكامل
    ========================================================= */

    async function renderHeader(contact) {

        if (!contact) {
            return;
        }


        const normalized =
            normalizeContact(
                contact
            );


        const renderToken =
            ++headerRenderToken;


        const normalizedUserId =
            getContactUserId(
                normalized
            );


        currentContact =
            normalized;


        /*
         * نتحقق من الحظر قبل عرض
         * الاسم والصورة.
         */

        const blockState =
            await refreshBlockState(
                normalized
            );


        /*
         * إذا تغيرت المحادثة أو بدأ تحديث أحدث،
         * لا نطبق النتيجة القديمة.
         */

        if (
            renderToken !==
            headerRenderToken
        ) {

            return;

        }


        if (
            !blockState
        ) {

            return;

        }


        const latestContactId =
            getContactUserId(
                currentContact
            );


        if (
            normalizedUserId &&
            latestContactId &&
            String(normalizedUserId) !==
            String(latestContactId)
        ) {

            return;

        }


        /*
         * قد تكون المحادثة تغيرت أثناء
         * انتظار فحص الحظر.
         */

        if (
            currentContact !== normalized &&
            getContactUserId(
                currentContact
            ) !==
            normalizedUserId
        ) {

            return;

        }


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

            currentConversationId =
                detail.conversationId ||
                null;


            currentContact =
                normalizeContact(
                    detail.contact
                );


            /*
             * إلغاء أي فحص قديم قبل بدء
             * فحص المحادثة الجديدة.
             */

            ++blockCheckToken;

            ++headerRenderToken;


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

                const normalized =
                    normalizeContact(
                        contact
                    );


                const newUserId =
                    getContactUserId(
                        normalized
                    );


                const oldUserId =
                    getContactUserId(
                        currentContact
                    );


                /*
                 * إذا انتقلنا لمستخدم آخر،
                 * نلغي الفحوص السابقة فوراً.
                 */

                if (
                    String(newUserId || "") !==
                    String(oldUserId || "")
                ) {

                    ++blockCheckToken;

                    ++headerRenderToken;

                    currentBlockState = {

                        blocked: false,

                        blockedBy: false

                    };

                }


                currentContact =
                    normalized;


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
         * إذا كان الطرف الآخر حاظراً للمستخدم،
         * نعيد رسم الرأس فقط بدون كشف النشاط.
         */

        if (
            isContactBlockedByThem()
        ) {

            renderName(
                currentContact
            );


            renderAvatar(
                currentContact
            );


            renderActivity(
                currentContact
            );


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
       أحداث الحظر

       عند الحظر أو إلغاء الحظر:
       - نعيد فحص الحالة
       - نعيد الاسم
       - نعيد الصورة
       - نعيد حالة النشاط
    ========================================================= */

    function handleBlockChanged(event) {

        const changedUserId =
            event?.detail?.userId ||
            event?.detail?.blockedUserId ||
            event?.detail?.blocked_id ||
            null;


        const currentContactId =
            getContactUserId(
                currentContact
            );


        /*
         * إذا كان الحدث متعلقاً
         * بشخص آخر فلا داعي لإعادة الرسم.
         */

        if (
            changedUserId &&
            currentContactId &&
            String(changedUserId) !==
            String(currentContactId)
        ) {

            return;

        }


        /*
         * إلغاء أي فحص سابق.
         */

        ++blockCheckToken;

        ++headerRenderToken;


        currentBlockState = {

            blocked: false,

            blockedBy: false

        };


        if (currentContact) {

            renderHeader(
                currentContact
            );

        } else {

            refreshFromCore();

        }

    }


    window.addEventListener(
        "wfesc:block-changed",
        handleBlockChanged
    );


    window.addEventListener(
        "wfesc:blocked",
        handleBlockChanged
    );


    window.addEventListener(
        "wfesc:unblocked",
        handleBlockChanged
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
                                    currentConversationId,

                                blocked:
                                    currentBlockState.blocked,

                                blockedBy:
                                    currentBlockState.blockedBy

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

            if (
                isContactBlockedByThem()
            ) {

                return "قام المستخدم بحظرك";

            }


            return getDisplayName(
                currentContact
            );

        },


        getAvatarUrl() {

            if (
                isContactBlockedByThem()
            ) {

                return BLOCKED_AVATAR;

            }


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


        isBlocked() {

            return (
                currentBlockState.blocked ===
                true
            );

        },


        isBlockedBy() {

            return (
                currentBlockState.blockedBy ===
                true
            );

        },


        getBlockState() {

            return {

                ...currentBlockState

            };

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
