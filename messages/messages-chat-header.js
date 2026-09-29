/* =========================================================
   WFESC MESSAGES — CHAT HEADER
   الملف: messages/messages-chat-header.js

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
       الحصول على الموديولات
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
     * يمنع تطبيق نتيجة فحص حظر قديم
     * بعد الانتقال إلى محادثة أخرى.
     */

    let blockCheckToken =
        0;


    /*
     * يمنع تطبيق رسم قديم للرأس
     * بعد بدء تحديث أحدث.
     */

    let headerRenderToken =
        0;


    /*
     * مؤقت النشاط.
     */

    let activityRefreshTimer =
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
       صورة مستخدم محظور
       لا تحتوي على معلومات حقيقية عن المستخدم
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
       الحصول على معرف المستخدم من Contact
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
       الحصول على معرف المحادثة
    ========================================================= */

    function getConversationId(
        conversation
    ) {

        if (!conversation) {

            return null;

        }


        return (
            conversation.id ||
            conversation.conversation_id ||
            conversation.conversationId ||
            conversation.chat_id ||
            conversation.chatId ||
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
                typeof nestedProfile ===
                "object"
                    ? nestedProfile
                    : {}
            ),

            ...contact,


            user_id:
                userId ||
                null,


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
    ========================================================= */

    async function getBlockState(
        contact
    ) {

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
         * لا نطبق النتيجة القديمة.
         */

        if (
            token !== blockCheckToken
        ) {

            return null;

        }


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
       هل الطرف الآخر حظر المستخدم الحالي؟
    ========================================================= */

    function isContactBlockedByThem() {

        return (
            currentBlockState?.blockedBy ===
            true
        );

    }


    /* =========================================================
       الحصول على حالة النشاط
    ========================================================= */

    function getActivityState(
        contact
    ) {

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
         * إذا لم يكن Activity Module
         * جاهزًا بعد، نستخدم بيانات Core.
         */

        if (
            !activity ||
            typeof activity.getUserActivity !==
            "function"
        ) {

            return {

                online:
                    contact.is_online === true,

                disabled:
                    contact.show_activity === false,

                show_activity:
                    contact.show_activity !== false,

                last_seen:
                    contact.last_seen ||
                    null

            };

        }


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


            /*
             * دعم الموديولات التي ترجع
             * Promise.
             */

            if (
                result &&
                typeof result.then ===
                "function"
            ) {

                return {

                    online:
                        contact.is_online === true,

                    disabled:
                        contact.show_activity === false,

                    show_activity:
                        contact.show_activity !== false,

                    last_seen:
                        contact.last_seen ||
                        null

                };

            }


            if (
                result &&
                typeof result ===
                "object"
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


            if (
                typeof result ===
                "boolean"
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
         * Fallback من Core.
         */

        return {

            online:
                contact.is_online === true,

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
       الحصول على حالة النشاط الحالية
    ========================================================= */

    function getOnlineState(
        contact
    ) {

        if (!contact) {

            return false;

        }


        /*
         * إذا قام الطرف الآخر بحظرنا،
         * لا تظهر النقطة الخضراء.
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
         * إذا الطرف الآخر قام بحظر المستخدم.
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
         * المستخدم أخفى نشاطه.
         */

        if (
            state.disabled === true ||
            state.show_activity === false
        ) {

            return "عدم النشاط";

        }


        /*
         * حساب الدعم.
         */

        if (
            contact.is_support
        ) {

            return isOnline
                ? "نشط الآن"
                : "غير نشط";

        }


        /*
         * مستخدم عادي.
         */

        return isOnline
            ? "نشط الآن"
            : "غير نشط";

    }


    /* =========================================================
       تحديث الصورة
    ========================================================= */

    function renderAvatar(
        contact
    ) {

        if (!chatAvatar) {

            return;

        }


        /*
         * إذا الطرف الآخر حظرنا،
         * نخفي صورته الحقيقية.
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

    function renderName(
        contact
    ) {

        if (!chatName) {

            return;

        }


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

    function renderActivity(
        contact
    ) {

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
                online &&
                !isContactBlockedByThem()
            );

        }

    }


    /* =========================================================
       تحديث رأس المحادثة بالكامل
    ========================================================= */

    async function renderHeader(
        contact
    ) {

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


        const blockState =
            await refreshBlockState(
                normalized
            );


        /*
         * إذا بدأ تحديث أحدث،
         * نتجاهل هذا التحديث.
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
       جلب Contact الحالي من Core
    ========================================================= */

    function getContactFromCore() {

        const core =
            getCore();


        if (!core) {

            return {

                contact: null,

                conversationId: null

            };

        }


        let contact =
            null;


        let conversationId =
            null;


        /*
         * المسار الأساسي الحالي:
         * getCurrentContact()
         */

        try {

            if (
                typeof core.getCurrentContact ===
                "function"
            ) {

                contact =
                    core.getCurrentContact();

            }

        } catch (error) {

            console.warn(
                "[WFESC CHAT HEADER] getCurrentContact failed:",
                error
            );

        }


        /*
         * نقرأ المحادثة الحالية كمسار إضافي.
         */

        try {

            if (
                typeof core.getCurrentConversation ===
                "function"
            ) {

                const conversation =
                    core.getCurrentConversation();


                if (conversation) {

                    conversationId =
                        getConversationId(
                            conversation
                        );


                    if (!contact) {

                        contact =
                            conversation.contact ||
                            conversation.user ||
                            conversation.other_user ||
                            conversation.otherUser ||
                            conversation.recipient ||
                            null;

                    }

                }

            }

        } catch (error) {

            console.warn(
                "[WFESC CHAT HEADER] getCurrentConversation failed:",
                error
            );

        }


        /*
         * توافق مع إصدارات قديمة
         * تستخدم core.chatHeader.
         */

        try {

            if (
                core.chatHeader
            ) {

                if (
                    !contact &&
                    typeof
                    core.chatHeader.getContact ===
                    "function"
                ) {

                    contact =
                        core.chatHeader.getContact();

                }


                if (
                    !conversationId &&
                    typeof
                    core.chatHeader.getConversationId ===
                    "function"
                ) {

                    conversationId =
                        core.chatHeader.getConversationId();

                }

            }

        } catch (error) {

            console.warn(
                "[WFESC CHAT HEADER] chatHeader fallback failed:",
                error
            );

        }


        return {

            contact:
                contact
                    ? normalizeContact(
                        contact
                    )
                    : null,

            conversationId:
                conversationId ||
                null

        };

    }


    /* =========================================================
       تحديث الرأس من Core
    ========================================================= */

    function refreshFromCore(
        detail = null
    ) {

        let contact =
            null;


        let conversationId =
            null;


        /*
         * إذا الحدث أرسل Contact مباشر.
         */

        if (
            detail &&
            detail.contact
        ) {

            contact =
                normalizeContact(
                    detail.contact
                );


            conversationId =
                detail.conversationId ||
                detail.conversation_id ||
                detail.chatId ||
                detail.chat_id ||
                null;

        }


        /*
         * إذا الحدث لم يرسل Contact،
         * نأخذه من Core مباشرة.
         */

        if (!contact) {

            const result =
                getContactFromCore();


            contact =
                result.contact;


            conversationId =
                result.conversationId;

        }


        /*
         * لا توجد محادثة حالياً.
         */

        if (!contact) {

            currentConversationId =
                conversationId ||
                null;


            currentContact =
                null;


            currentBlockState = {

                blocked: false,

                blockedBy: false

            };


            ++blockCheckToken;

            ++headerRenderToken;


            return;

        }


        const newUserId =
            getContactUserId(
                contact
            );


        const oldUserId =
            getContactUserId(
                currentContact
            );


        /*
         * إذا تغير المستخدم الحالي،
         * نلغي الفحوص القديمة فوراً.
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


        currentConversationId =
            conversationId ||
            currentConversationId ||
            null;


        currentContact =
            contact;


        renderHeader(
            currentContact
        );

    }


    /* =========================================================
       تحديث النشاط فقط
    ========================================================= */

    function refreshActivityOnly() {

        if (!currentContact) {

            refreshFromCore();

            return;

        }


        /*
         * إذا الطرف الآخر حاظرنا،
         * لا نحاول عرض نشاطه.
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


        currentContact =
            normalizeContact(
                currentContact
            );


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

            refreshFromCore(
                event?.detail ||
                null
            );

        }
    );


    /* =========================================================
       تحديثات Activity
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
       تحديثات الحظر
    ========================================================= */

    function handleBlockChanged(
        event
    ) {

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
         * إذا الحدث متعلق بمستخدم آخر،
         * لا نحدث الرأس.
         */

        if (
            changedUserId &&
            currentContactId &&
            String(changedUserId) !==
            String(currentContactId)
        ) {

            return;

        }


        ++blockCheckToken;

        ++headerRenderToken;


        currentBlockState = {

            blocked: false,

            blockedBy: false

        };


        if (
            currentContact
        ) {

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


    window.addEventListener(
        "wfesc:user-blocked",
        handleBlockChanged
    );


    window.addEventListener(
        "wfesc:user-unblocked",
        handleBlockChanged
    );


    /* =========================================================
       طلب تحديث النشاط
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
       تحديث عند الرجوع للصفحة
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
       مؤقت النشاط
    ========================================================= */

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
       الواجهة العامة
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
    ========================================================= */

    setTimeout(
        function () {

            refreshFromCore();

            startActivityRefreshTimer();

        },
        0
    );


    /* =========================================================
       محاولة ثانية بعد تحميل الموديولات
    ========================================================= */

    setTimeout(
        function () {

            refreshFromCore();

            refreshActivityOnly();

        },
        250
    );


    /* =========================================================
       محاولة ثالثة
    ========================================================= */

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
