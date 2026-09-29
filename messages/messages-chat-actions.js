/* =========================================================
   WFESC MESSAGES CHAT ACTIONS
   File: messages/messages-chat-actions.js
   ========================================================= */

(() => {
    "use strict";

    /*
    ============================================================
       المسؤول عن:

    - قائمة الثلاث نقاط داخل المحادثة
    - حذف المحادثة
    - حذف لدي
    - حذف للطرفين
    - تأكيدات الحذف
    - حظر المستخدم
    - إلغاء الحظر
    - ربط الحظر مع messages-block.js
    - إشعار الواجهة بحالة الحظر
    - إشعار الطرف الآخر عند حذف المحادثة للطرفين
    - إخراج الطرف الآخر من المحادثة عبر Realtime

    ملاحظة:
    نظام الحظر الفعلي موجود في:

        messages-block.js

    وهذا الملف يستدعيه فقط ولا ينفذ عمليات
    blocked_users مباشرة.
    ============================================================
    */


    /* =========================================================
       CORE
       ========================================================= */

    const CORE = () =>
        window.WFESC_MESSAGES_CORE || null;


    /* =========================================================
       BLOCK MODULE
       ========================================================= */

    const BLOCK = () =>
        window.WFESC_MESSAGES_BLOCK || null;


    /* =========================================================
       HELPERS
       ========================================================= */

    function getClient() {

        const core = CORE();

        return core?.client || null;
    }


    function getCurrentUser() {

        const core = CORE();

        if (
            !core ||
            typeof core.getCurrentUser !== "function"
        ) {
            return null;
        }

        return core.getCurrentUser();
    }


    /* =========================================================
       CONVERSATION ID
       ========================================================= */

    function getConversationId() {

        const core = CORE();

        if (
            !core ||
            typeof core.getCurrentConversation !==
                "function"
        ) {
            return null;
        }

        const conversation =
            core.getCurrentConversation();

        if (conversation == null) {
            return null;
        }

        if (
            typeof conversation ===
            "string"
        ) {
            return conversation;
        }

        if (
            typeof conversation ===
            "object"
        ) {

            return (
                conversation.conversation_id ||
                conversation.id ||
                conversation.currentConversationId ||
                null
            );
        }

        return null;
    }


    /* =========================================================
       CURRENT CONTACT
       ========================================================= */

    function getCurrentContact() {

        const core = CORE();

        if (
            !core ||
            typeof core.getCurrentContact !==
                "function"
        ) {
            return null;
        }

        return core.getCurrentContact();
    }


    /* =========================================================
       CONTACT USER ID
       ========================================================= */

    function getContactUserId(
        contact = getCurrentContact()
    ) {

        if (!contact) {
            return null;
        }

        return (
            contact.user_id ||
            contact.userId ||
            contact.profile_id ||
            contact.profileId ||
            contact.id ||
            null
        );
    }


    /* =========================================================
       CONTACT NAME
       ========================================================= */

    function getContactName(
        contact = getCurrentContact()
    ) {

        if (!contact) {
            return "المستخدم";
        }

        return (
            contact.display_name ||
            contact.full_name ||
            contact.username ||
            contact.name ||
            contact.nickname ||
            "المستخدم"
        );
    }


    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHtml(value) {

        return String(value ?? "")
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
       TOAST
       ========================================================= */

    function showToast(
        message,
        duration = 2200
    ) {

        let toast =
            document.getElementById(
                "wfescChatActionsToast"
            );

        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "wfescChatActionsToast";

            toast.dir =
                "rtl";

            toast.style.cssText = `
                position:fixed;
                left:50%;
                bottom:92px;
                transform:
                    translateX(-50%)
                    translateY(15px);
                z-index:9999999;
                max-width:
                    calc(100vw - 32px);
                padding:12px 18px;
                border-radius:14px;
                background:
                    rgba(18,18,18,.96);
                color:#fff;
                border:
                    1px solid
                    rgba(255,255,255,.10);
                box-shadow:
                    0 15px 45px
                    rgba(0,0,0,.55);
                font-size:13px;
                font-weight:600;
                text-align:center;
                opacity:0;
                pointer-events:none;
                transition:
                    opacity .18s ease,
                    transform .18s ease;
                backdrop-filter:blur(14px);
                -webkit-backdrop-filter:blur(14px);
            `;

            document.body.appendChild(
                toast
            );
        }

        toast.textContent =
            String(message ?? "");

        toast.style.opacity =
            "1";

        toast.style.transform =
            "translateX(-50%) translateY(0)";

        clearTimeout(
            toast._wfescTimer
        );

        toast._wfescTimer =
            setTimeout(() => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateX(-50%) translateY(15px)";

            }, duration);
    }


    /* =========================================================
       ACTION MENU
       ========================================================= */

    let menu = null;

    let menuOutsideHandler = null;


    function closeMenu() {

        if (
            menuOutsideHandler
        ) {

            document.removeEventListener(
                "pointerdown",
                menuOutsideHandler,
                true
            );

            menuOutsideHandler =
                null;
        }

        if (!menu) {
            return;
        }

        menu.remove();
        menu = null;
    }


    /* =========================================================
       BLOCK STATUS
       ========================================================= */

    async function getCurrentBlockStatus() {

        const userId =
            getContactUserId();

        if (!userId) {

            return {
                blockedByMe: false,
                blockedMe: false,
                userId: null,
                info: null
            };
        }

        const block =
            BLOCK();

        if (!block) {

            return {
                blockedByMe: false,
                blockedMe: false,
                userId,
                info: null
            };
        }

        try {

            if (
                typeof block.getBlockStatus ===
                "function"
            ) {

                const status =
                    await block.getBlockStatus(
                        userId,
                        false
                    );

                return {
                    blockedByMe:
                        Boolean(
                            status?.blocked ??
                            status?.isBlocked
                        ),

                    blockedMe:
                        Boolean(
                            status?.blockedBy ??
                            status?.isBlockedBy
                        ),

                    userId,

                    info:
                        status?.info ||
                        null
                };
            }


            const [
                blockedByMe,
                blockedMe
            ] =
                await Promise.all([
                    typeof block.isBlocked ===
                        "function"
                        ? block.isBlocked(
                            userId
                        )
                        : false,

                    typeof block.isBlockedBy ===
                        "function"
                        ? block.isBlockedBy(
                            userId
                        )
                        : false
                ]);


            let info = null;

            if (
                blockedByMe &&
                typeof block.getBlockInfo ===
                    "function"
            ) {

                info =
                    await block.getBlockInfo(
                        userId
                    );
            }


            return {
                blockedByMe:
                    Boolean(
                        blockedByMe
                    ),

                blockedMe:
                    Boolean(
                        blockedMe
                    ),

                userId,

                info
            };

        } catch (error) {

            console.warn(
                "WFESC BLOCK STATUS:",
                error
            );

            return {
                blockedByMe: false,
                blockedMe: false,
                userId,
                info: null
            };
        }
    }


    /* =========================================================
       CREATE MENU
       ========================================================= */

    async function createMenu() {

        closeMenu();

        menu =
            document.createElement(
                "div"
            );

        menu.id =
            "wfescChatActionsMenu";

        menu.dir =
            "rtl";

        menu.style.cssText = `
            position:fixed;
            z-index:999998;
            top:64px;
            left:16px;
            width:220px;
            padding:7px;
            background:
                rgba(15,15,15,.97);
            border:
                1px solid
                rgba(255,255,255,.10);
            border-radius:16px;
            box-shadow:
                0 18px 55px
                rgba(0,0,0,.65);
            backdrop-filter:blur(18px);
            -webkit-backdrop-filter:blur(18px);
            animation:
                wfescChatActionsMenuIn
                .16s ease both;
        `;


        const styleId =
            "wfescChatActionsMenuStyle";


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

                @keyframes wfescChatActionsMenuIn {

                    from {
                        opacity:0;
                        transform:
                            translateY(-6px)
                            scale(.97);
                    }

                    to {
                        opacity:1;
                        transform:
                            translateY(0)
                            scale(1);
                    }
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-item {

                    width:100%;
                    display:flex;
                    align-items:center;
                    gap:10px;
                    border:0;
                    background:transparent;
                    color:#fff;
                    padding:12px 13px;
                    border-radius:11px;
                    font-family:inherit;
                    font-size:13px;
                    text-align:right;
                    cursor:pointer;
                    transition:
                        background .15s ease;
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-item:hover {

                    background:
                        rgba(255,255,255,.07);
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-item.danger {

                    color:#ff6b6b;
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-item.block {

                    color:#ffb0b0;
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-item.unblock {

                    color:#d7ffd7;
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-item.disabled {

                    color:#777;
                    cursor:default;
                }

                #wfescChatActionsMenu
                .wfesc-chat-action-divider {

                    height:1px;
                    margin:5px 8px;
                    background:
                        rgba(255,255,255,.07);
                }
            `;

            document.head.appendChild(
                style
            );
        }


        /* =====================================================
           DELETE
           ===================================================== */

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type =
            "button";

        deleteButton.className =
            "wfesc-chat-action-item danger";

        deleteButton.innerHTML = `
            <span>🗑️</span>
            <span>حذف المحادثة</span>
        `;

        deleteButton.addEventListener(
            "click",
            () => {

                closeMenu();

                openDeleteChoice();

            }
        );


        /* =====================================================
           DIVIDER
           ===================================================== */

        const divider =
            document.createElement(
                "div"
            );

        divider.className =
            "wfesc-chat-action-divider";


        /* =====================================================
           BLOCK BUTTON
           ===================================================== */

        const blockButton =
            document.createElement(
                "button"
            );

        blockButton.type =
            "button";

        blockButton.className =
            "wfesc-chat-action-item block";

        blockButton.innerHTML = `
            <span>⏳</span>
            <span>جارٍ التحقق...</span>
        `;

        /*
         * نضيف القائمة أولاً حتى تظهر مباشرة،
         * ثم نتحقق من حالة الحظر في الخلفية.
         */

        menu.appendChild(
            deleteButton
        );

        menu.appendChild(
            divider
        );

        menu.appendChild(
            blockButton
        );

        document.body.appendChild(
            menu
        );


        /* =====================================================
           LOAD BLOCK STATUS
           ===================================================== */

        const status =
            await getCurrentBlockStatus();


        /*
         * إذا المستخدم أغلق القائمة أثناء
         * طلب Supabase، لا نعدل القائمة القديمة.
         */

        if (!menu) {
            return;
        }


        if (
            status.blockedByMe
        ) {

            blockButton.className =
                "wfesc-chat-action-item unblock";

            blockButton.innerHTML = `
                <span>🔓</span>
                <span>إلغاء الحظر</span>
            `;

            blockButton.onclick =
                () => {

                    closeMenu();

                    openBlockConfirmation(
                        "unblock"
                    );
                };


        } else if (
            status.blockedMe
        ) {

            blockButton.className =
                "wfesc-chat-action-item disabled";

            blockButton.innerHTML = `
                <span>🚫</span>
                <span>قام المستخدم بحظرك</span>
            `;

            blockButton.disabled =
                true;


        } else {

            blockButton.className =
                "wfesc-chat-action-item block";

            blockButton.innerHTML = `
                <span>🚫</span>
                <span>حظر المستخدم</span>
            `;

            blockButton.onclick =
                () => {

                    closeMenu();

                    openBlockConfirmation(
                        "block"
                    );
                };
        }


        /* =====================================================
           OUTSIDE CLICK
           ===================================================== */

        const currentMenu =
            menu;

        menuOutsideHandler =
            event => {

                if (
                    !currentMenu ||
                    !currentMenu.contains(
                        event.target
                    )
                ) {

                    closeMenu();
                }
            };


        setTimeout(
            () => {

                if (
                    menu ===
                    currentMenu
                ) {

                    document.addEventListener(
                        "pointerdown",
                        menuOutsideHandler,
                        true
                    );
                }

            },
            0
        );
    }


    /* =========================================================
       FIND THREE DOT BUTTON
       ========================================================= */

    function getChatMenuButton() {

        return (
            document.getElementById(
                "chatMenuButton"
            ) ||

            document.querySelector(
                "[data-chat-menu-button]"
            ) ||

            document.querySelector(
                ".chat-menu-button"
            )
        );
    }


    /* =========================================================
       CONFIRMATION OVERLAY
       ========================================================= */

    function createOverlay() {

        closeOverlay();

        const overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "wfescChatActionsOverlay";

        overlay.dir =
            "rtl";

        overlay.style.cssText = `
            position:fixed;
            inset:0;
            z-index:9999998;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:
                rgba(0,0,0,.72);
            backdrop-filter:blur(12px);
            -webkit-backdrop-filter:blur(12px);
            animation:
                wfescActionsOverlayIn
                .18s ease both;
        `;


        const styleId =
            "wfescActionsOverlayStyle";


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

                @keyframes wfescActionsOverlayIn {

                    from {
                        opacity:0;
                    }

                    to {
                        opacity:1;
                    }
                }

                #wfescChatActionsOverlay
                .wfesc-actions-card {

                    width:
                        min(430px, 100%);

                    padding:22px;
                    border-radius:20px;

                    background:
                        rgba(18,18,18,.98);

                    border:
                        1px solid
                        rgba(255,255,255,.10);

                    box-shadow:
                        0 25px 80px
                        rgba(0,0,0,.7);

                    text-align:center;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-title {

                    color:#fff;
                    font-size:17px;
                    font-weight:800;
                    line-height:1.7;
                    margin-bottom:10px;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-message {

                    color:#aaa;
                    font-size:13px;
                    line-height:1.8;
                    margin-bottom:20px;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-buttons {

                    display:flex;
                    gap:9px;
                    flex-direction:column;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-button {

                    width:100%;
                    border:0;
                    border-radius:12px;
                    padding:12px;
                    font-family:inherit;
                    font-size:13px;
                    font-weight:700;
                    cursor:pointer;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-button:disabled {

                    opacity:.55;
                    cursor:wait;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-confirm {

                    background:#fff;
                    color:#000;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-danger {

                    background:#b82b2b;
                    color:#fff;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-cancel {

                    background:#222;
                    color:#ddd;
                }

                #wfescChatActionsOverlay
                .wfesc-actions-choice {

                    background:#191919;
                    color:#fff;
                    border:
                        1px solid
                        rgba(255,255,255,.08);
                }

                #wfescChatActionsOverlay
                .wfesc-block-icon {

                    width:56px;
                    height:56px;
                    margin:0 auto 12px;
                    border-radius:50%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:
                        rgba(184,43,43,.14);
                    border:
                        1px solid
                        rgba(255,100,100,.15);
                    font-size:26px;
                }

                #wfescChatActionsOverlay
                .wfesc-block-name {

                    color:#fff;
                    font-size:15px;
                    font-weight:800;
                    margin:4px 0 12px;
                }
            `;

            document.head.appendChild(
                style
            );
        }

        return overlay;
    }


    function closeOverlay() {

        const old =
            document.getElementById(
                "wfescChatActionsOverlay"
            );

        if (old) {
            old.remove();
        }
    }


    /* =========================================================
       DELETE CHOICE
       ========================================================= */

    function openDeleteChoice() {

        const conversationId =
            getConversationId();

        if (!conversationId) {

            showToast(
                "لا توجد محادثة مفتوحة"
            );

            return;
        }


        const overlay =
            createOverlay();

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "wfesc-actions-card";

        card.innerHTML = `

            <div class="wfesc-actions-title">
                حذف المحادثة
            </div>

            <div class="wfesc-actions-message">
                اختر طريقة حذف الرسائل
            </div>

            <div class="wfesc-actions-buttons">

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-choice
                    "
                    data-action="me"
                >
                    حذف لدي
                </button>

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-danger
                    "
                    data-action="everyone"
                >
                    حذف للطرفين
                </button>

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>
        `;


        overlay.appendChild(
            card
        );

        document.body.appendChild(
            overlay
        );


        card
            .querySelector(
                '[data-action="me"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openDeleteConfirmation(
                        "me"
                    );

                }
            );


        card
            .querySelector(
                '[data-action="everyone"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openDeleteConfirmation(
                        "everyone"
                    );

                }
            );


        card
            .querySelector(
                '[data-action="cancel"]'
            )
            ?.addEventListener(
                "click",
                closeOverlay
            );
    }


    /* =========================================================
       DELETE CONFIRMATION
       ========================================================= */

    function openDeleteConfirmation(
        mode
    ) {

        const conversationId =
            getConversationId();

        if (!conversationId) {

            closeOverlay();

            showToast(
                "لا توجد محادثة مفتوحة"
            );

            return;
        }


        const overlay =
            createOverlay();

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "wfesc-actions-card";


        let title =
            "هل أنت متأكد؟";

        let message =
            "";


        if (
            mode === "everyone"
        ) {

            title =
                "هل أنت متأكد من طلبك بحذف الرسائل؟";

            message =
                "سيتم تطبيق حذف الطرفين مع إبقاء سجل الحذف محفوظاً في قاعدة البيانات للمراجعة الإدارية عند الحاجة.";

        } else {

            title =
                "هل أنت متأكد من حذف الرسائل لديك؟";

            message =
                "ستختفي المحادثة من حسابك فقط، بينما تبقى بيانات الطرف الآخر محفوظة.";
        }


        card.innerHTML = `

            <div class="wfesc-actions-title">
                ${escapeHtml(title)}
            </div>

            <div class="wfesc-actions-message">
                ${escapeHtml(message)}
            </div>

            <div class="wfesc-actions-buttons">

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-danger
                    "
                    data-action="confirm"
                >
                    متابعة
                </button>

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>
        `;


        overlay.appendChild(
            card
        );

        document.body.appendChild(
            overlay
        );


        card
            .querySelector(
                '[data-action="confirm"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    openFinalDeleteConfirmation(
                        mode
                    );

                }
            );


        card
            .querySelector(
                '[data-action="cancel"]'
            )
            ?.addEventListener(
                "click",
                closeOverlay
            );
    }


    /* =========================================================
       FINAL DELETE CONFIRMATION
       ========================================================= */

    function openFinalDeleteConfirmation(
        mode
    ) {

        const conversationId =
            getConversationId();

        if (!conversationId) {

            closeOverlay();

            showToast(
                "لا توجد محادثة مفتوحة"
            );

            return;
        }


        const overlay =
            createOverlay();

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "wfesc-actions-card";


        let title =
            "";

        let message =
            "";


        if (
            mode === "everyone"
        ) {

            title =
                "أكد طلبك بحذف الرسائل من الطرفين";

            message =
                "سيتم إخفاء الرسائل من واجهة الطرفين، مع الاحتفاظ بالسجل غير المعروض في قاعدة البيانات وفق نظام الحذف الخاص بـ WFESC.";

        } else {

            title =
                "أكد طلبك بحذف الرسائل لديك";

            message =
                "ستختفي الرسائل من حسابك فقط.";
        }


        card.innerHTML = `

            <div class="wfesc-actions-title">
                ${escapeHtml(title)}
            </div>

            <div class="wfesc-actions-message">
                ${escapeHtml(message)}
            </div>

            <div class="wfesc-actions-buttons">

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-danger
                    "
                    data-action="final"
                >
                    تأكيد الحذف
                </button>

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>
        `;


        overlay.appendChild(
            card
        );

        document.body.appendChild(
            overlay
        );


        card
            .querySelector(
                '[data-action="final"]'
            )
            ?.addEventListener(
                "click",
                async () => {

                    await executeDelete(
                        mode,
                        conversationId
                    );

                }
            );


        card
            .querySelector(
                '[data-action="cancel"]'
            )
            ?.addEventListener(
                "click",
                closeOverlay
            );
    }


    /* =========================================================
       DELETE FOR ME
       ========================================================= */

    async function deleteForMe(
        conversationId
    ) {

        const client =
            getClient();

        const user =
            getCurrentUser();


        if (
            !client ||
            !user ||
            !conversationId
        ) {

            throw new Error(
                "بيانات الحذف غير متوفرة"
            );
        }


        const {
            error
        } =
            await client.rpc(
                "hide_my_conversation",
                {
                    target_conversation_id:
                        conversationId
                }
            );


        if (error) {
            throw error;
        }


        return true;
    }


    /* =========================================================
       DELETE FOR EVERYONE
       ========================================================= */

    async function deleteForEveryone(
        conversationId
    ) {

        const client =
            getClient();

        const user =
            getCurrentUser();


        if (
            !client ||
            !user ||
            !conversationId
        ) {

            throw new Error(
                "بيانات الحذف غير متوفرة"
            );
        }


        await broadcastConversationDeleted(
            conversationId,
            user.id
        );


        const {
            data,
            error
        } =
            await client.rpc(
                "delete_conversation_for_everyone",
                {
                    target_conversation_id:
                        conversationId
                }
            );


        if (error) {
            throw error;
        }


        if (data === false) {

            throw new Error(
                "لم يتم حذف المحادثة"
            );
        }


        return true;
    }


    /* =========================================================
       EXECUTE DELETE
       ========================================================= */

    async function executeDelete(
        mode,
        conversationId
    ) {

        if (!conversationId) {

            closeOverlay();

            showToast(
                "لا توجد محادثة مفتوحة"
            );

            return;
        }


        const button =
            document.querySelector(
                "#wfescChatActionsOverlay [data-action='final']"
            );


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "جارٍ الحذف...";
        }


        try {

            if (
                mode === "everyone"
            ) {

                await deleteForEveryone(
                    conversationId
                );

            } else {

                await deleteForMe(
                    conversationId
                );
            }


            closeOverlay();


            /*
             * لا نعرض رسالة نجاح طويلة داخل
             * المحادثة في هذه المرحلة.
             * نظام تحديث الواجهة الكامل سيُصلح
             * في خطوة الحذف القادمة.
             */

            showToast(
                "تم تنفيذ الحذف",
                1500
            );


            const core =
                CORE();


            if (
                core &&
                typeof core.closeConversation ===
                    "function"
            ) {

                await core.closeConversation();
            }


            if (
                core &&
                typeof core.loadConversations ===
                    "function"
            ) {

                await core.loadConversations();
            }


        } catch (error) {

            console.error(
                "WFESC delete conversation:",
                error
            );


            closeOverlay();


            showToast(
                "تعذر تنفيذ حذف المحادثة"
            );


            try {

                const core =
                    CORE();


                if (
                    core &&
                    typeof core.debugError ===
                        "function"
                ) {

                    core.debugError(
                        "فشل حذف المحادثة",
                        error,
                        {
                            conversation_id:
                                conversationId,

                            mode:
                                mode
                        }
                    );
                }

            } catch (_) {}
        }
    }


    /* =========================================================
       REMOTE DELETE CHANNELS
       ========================================================= */

    const deleteChannels =
        new Map();


    async function getDeleteChannel(
        conversationId
    ) {

        const client =
            getClient();

        if (
            !client ||
            !conversationId
        ) {
            return null;
        }


        const key =
            String(
                conversationId
            );


        let entry =
            deleteChannels.get(
                key
            );


        if (
            entry?.channel
        ) {
            return entry.channel;
        }


        const channelName =
            "wfesc-chat-actions-" +
            key;


        const channel =
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


        entry = {
            channel,
            subscribed: false,
            subscribing: false,
            listenerReady: false
        };


        deleteChannels.set(
            key,
            entry
        );


        if (
            !entry.subscribing
        ) {

            entry.subscribing =
                true;

            await new Promise(
                resolve => {

                    let finished =
                        false;

                    const finish =
                        () => {

                            if (
                                finished
                            ) {
                                return;
                            }

                            finished =
                                true;

                            resolve();
                        };


                    channel.subscribe(
                        status => {

                            if (
                                status ===
                                "SUBSCRIBED"
                            ) {

                                entry.subscribed =
                                    true;

                                finish();

                            } else if (
                                status ===
                                    "CHANNEL_ERROR" ||
                                status ===
                                    "TIMED_OUT" ||
                                status ===
                                    "CLOSED"
                            ) {

                                finish();
                            }
                        }
                    );


                    setTimeout(
                        finish,
                        1500
                    );
                }
            );

            entry.subscribing =
                false;
        }


        return channel;
    }


    /* =========================================================
       BROADCAST REMOTE DELETE
       ========================================================= */

    async function broadcastConversationDeleted(
        conversationId,
        userId
    ) {

        const channel =
            await getDeleteChannel(
                conversationId
            );


        if (!channel) {
            return;
        }


        try {

            await channel.send({

                type:
                    "broadcast",

                event:
                    "conversation_deleted",

                payload: {

                    conversation_id:
                        conversationId,

                    deleted_by:
                        userId || null
                }

            });

        } catch (error) {

            console.warn(
                "WFESC delete broadcast:",
                error
            );
        }
    }


    /* =========================================================
       LISTEN FOR REMOTE DELETE
       ========================================================= */

    async function setupRemoteDeleteListener(
        conversationId
    ) {

        if (!conversationId) {
            return;
        }


        const channel =
            await getDeleteChannel(
                conversationId
            );


        if (!channel) {
            return;
        }


        const key =
            String(
                conversationId
            );


        const entry =
            deleteChannels.get(
                key
            );


        if (
            entry?.listenerReady
        ) {
            return;
        }


        if (entry) {
            entry.listenerReady =
                true;
        }


        channel.on(
            "broadcast",
            {
                event:
                    "conversation_deleted"
            },
            async payload => {

                const data =
                    payload?.payload ||
                    payload ||
                    {};


                const deletedConversationId =
                    data?.conversation_id;


                if (
                    !deletedConversationId ||
                    String(
                        deletedConversationId
                    ) !==
                    String(
                        conversationId
                    )
                ) {
                    return;
                }


                const currentUser =
                    getCurrentUser();


                if (
                    currentUser?.id &&
                    data?.deleted_by &&
                    String(
                        currentUser.id
                    ) ===
                    String(
                        data.deleted_by
                    )
                ) {
                    return;
                }


                showRemoteDeleteOverlay();
            }
        );
    }


    /* =========================================================
       REMOTE DELETE OVERLAY
       ========================================================= */

    function showRemoteDeleteOverlay() {

        closeOverlay();


        const overlay =
            createOverlay();


        overlay.style.zIndex =
            "99999999";


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "wfesc-actions-card";


        card.innerHTML = `

            <div
                style="
                    font-size:38px;
                    margin-bottom:12px;
                "
            >
                🗑️
            </div>

            <div class="wfesc-actions-title">
                تم تحديث المحادثة
            </div>

            <div class="wfesc-actions-message">
                تم إخفاء الرسائل المحذوفة.
            </div>

        `;


        overlay.appendChild(
            card
        );

        document.body.appendChild(
            overlay
        );


        setTimeout(
            async () => {

                closeOverlay();


                const core =
                    CORE();


                if (
                    core &&
                    typeof core.closeConversation ===
                        "function"
                ) {

                    try {

                        await core.closeConversation();

                    } catch (_) {}
                }

            },
            1200
        );
    }


    /* =========================================================
       BLOCK CONFIRMATION
       ========================================================= */

    async function openBlockConfirmation(
        action = "block"
    ) {

        const userId =
            getContactUserId();


        if (!userId) {

            showToast(
                "لا يمكن تنفيذ العملية على هذا المستخدم"
            );

            return;
        }


        const contact =
            getCurrentContact();


        const name =
            getContactName(
                contact
            );


        const block =
            BLOCK();


        if (!block) {

            showToast(
                "نظام الحظر غير متوفر حالياً"
            );

            return;
        }


        /*
         * إذا لم يتم تحديد العملية، نتحقق من
         * الحالة الحالية.
         */

        if (
            action !== "block" &&
            action !== "unblock"
        ) {

            const status =
                await getCurrentBlockStatus();

            action =
                status.blockedByMe
                    ? "unblock"
                    : "block";
        }


        const overlay =
            createOverlay();


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "wfesc-actions-card";


        if (
            action === "unblock"
        ) {

            card.innerHTML = `

                <div class="wfesc-block-icon">
                    🔓
                </div>

                <div class="wfesc-actions-title">
                    إلغاء حظر المستخدم
                </div>

                <div class="wfesc-block-name">
                    ${escapeHtml(name)}
                </div>

                <div class="wfesc-actions-message">
                    هل تريد إلغاء الحظر عن المستخدم؟
                    <br>
                    لماذا قمت بالحظر؟ فلا يوجد داعي للحظر،
                    كن إنسانًا طيب القلب وراضي.
                    <br><br>
                    سيتم إلغاء الحظر عن المستخدم
                    ${escapeHtml(name)}
                </div>

                <div class="wfesc-actions-buttons">

                    <button
                        type="button"
                        class="
                            wfesc-actions-button
                            wfesc-actions-confirm
                        "
                        data-action="unblock"
                    >
                        إلغاء الحظر
                    </button>

                    <button
                        type="button"
                        class="
                            wfesc-actions-button
                            wfesc-actions-cancel
                        "
                        data-action="cancel"
                    >
                        إلغاء
                    </button>

                </div>
            `;

        } else {

            card.innerHTML = `

                <div class="wfesc-block-icon">
                    🚫
                </div>

                <div class="wfesc-actions-title">
                    هل تريد حظر المستخدم؟
                </div>

                <div class="wfesc-block-name">
                    ${escapeHtml(name)}
                </div>

                <div class="wfesc-actions-message">
                    سيتم حظر هذا المستخدم ولن يتمكن
                    من إرسال رسائل جديدة إليك.
                    <br><br>
                    ستبقى المحادثة والرسائل القديمة
                    محفوظة ولن يتم حذفها.
                </div>

                <div class="wfesc-actions-buttons">

                    <button
                        type="button"
                        class="
                            wfesc-actions-button
                            wfesc-actions-danger
                        "
                        data-action="block"
                    >
                        تأكيد الحظر
                    </button>

                    <button
                        type="button"
                        class="
                            wfesc-actions-button
                            wfesc-actions-cancel
                        "
                        data-action="cancel"
                    >
                        إلغاء
                    </button>

                </div>
            `;
        }


        overlay.appendChild(
            card
        );

        document.body.appendChild(
            overlay
        );


        /* =====================================================
           BLOCK
           ===================================================== */

        card
            .querySelector(
                '[data-action="block"]'
            )
            ?.addEventListener(
                "click",
                async () => {

                    const button =
                        card.querySelector(
                            '[data-action="block"]'
                        );

                    if (button) {

                        button.disabled =
                            true;

                        button.textContent =
                            "جارٍ الحظر...";
                    }


                    const success =
                        await blockUser(
                            userId
                        );


                    if (
                        !success &&
                        button
                    ) {

                        button.disabled =
                            false;

                        button.textContent =
                            "تأكيد الحظر";
                    }
                }
            );


        /* =====================================================
           UNBLOCK
           ===================================================== */

        card
            .querySelector(
                '[data-action="unblock"]'
            )
            ?.addEventListener(
                "click",
                async () => {

                    const button =
                        card.querySelector(
                            '[data-action="unblock"]'
                        );

                    if (button) {

                        button.disabled =
                            true;

                        button.textContent =
                            "جارٍ إلغاء الحظر...";
                    }


                    const success =
                        await unblockUser(
                            userId
                        );


                    if (
                        !success &&
                        button
                    ) {

                        button.disabled =
                            false;

                        button.textContent =
                            "إلغاء الحظر";
                    }
                }
            );


        card
            .querySelector(
                '[data-action="cancel"]'
            )
            ?.addEventListener(
                "click",
                closeOverlay
            );
    }


    /* =========================================================
       BLOCK USER
       ========================================================= */

    async function blockUser(
        blockedUserId
    ) {

        const block =
            BLOCK();


        if (
            !block ||
            !blockedUserId
        ) {

            showToast(
                "تعذر تنفيذ الحظر"
            );

            return false;
        }


        try {

            if (
                typeof block.blockUser !==
                    "function"
            ) {

                throw new Error(
                    "blockUser API غير موجود"
                );
            }


            await block.blockUser(
                blockedUserId
            );


            closeOverlay();


            showToast(
                "تم حظر المستخدم"
            );


            /*
             * لا نرسل wfesc:user-blocked
             * مرة ثانية هنا.
             *
             * messages-block.js أرسله بالفعل.
             */


            return true;


        } catch (error) {

            console.error(
                "WFESC block user:",
                error
            );


            showToast(
                error?.message ||
                "تعذر حظر المستخدم"
            );


            return false;
        }
    }


    /* =========================================================
       UNBLOCK USER
       ========================================================= */

    async function unblockUser(
        blockedUserId
    ) {

        const block =
            BLOCK();


        if (
            !block ||
            !blockedUserId
        ) {

            showToast(
                "تعذر تنفيذ إلغاء الحظر"
            );

            return false;
        }


        try {

            if (
                typeof block.unblockUser !==
                    "function"
            ) {

                throw new Error(
                    "unblockUser API غير موجود"
                );
            }


            await block.unblockUser(
                blockedUserId
            );


            closeOverlay();


            showToast(
                "تم إلغاء حظر المستخدم"
            );


            /*
             * messages-block.js يتولى
             * إرسال أحداث التحديث.
             */


            return true;


        } catch (error) {

            console.error(
                "WFESC unblock user:",
                error
            );


            showToast(
                error?.message ||
                "تعذر إلغاء حظر المستخدم"
            );


            return false;
        }
    }


    /* =========================================================
       CURRENT CHAT BLOCK WARNING
       ========================================================= */

    async function showBlockedConversationWarning(
        type
    ) {

        const contact =
            getCurrentContact();


        const name =
            getContactName(
                contact
            );


        closeOverlay();


        const overlay =
            createOverlay();


        overlay.style.zIndex =
            "99999999";


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "wfesc-actions-card";


        let title =
            "تعذر التواصل";

        let message =
            "";


        if (
            type ===
            "blocked-by-me"
        ) {

            title =
                "قمت بحظر هذا المستخدم";

            message =
                `لا يمكنك إرسال رسائل جديدة إلى ${name} حالياً.`;

        } else {

            title =
                "قام المستخدم بحظرك";

            message =
                "لا يمكنك إرسال رسائل جديدة إلى هذا المستخدم لأنه قام بحظرك.";
        }


        card.innerHTML = `

            <div class="wfesc-block-icon">
                🚫
            </div>

            <div class="wfesc-actions-title">
                ${escapeHtml(title)}
            </div>

            <div class="wfesc-block-name">
                ${escapeHtml(name)}
            </div>

            <div class="wfesc-actions-message">
                ${escapeHtml(message)}
            </div>

            <div class="wfesc-actions-buttons">

                <button
                    type="button"
                    class="
                        wfesc-actions-button
                        wfesc-actions-cancel
                    "
                    data-action="close"
                >
                    إغلاق
                </button>

            </div>
        `;


        overlay.appendChild(
            card
        );

        document.body.appendChild(
            overlay
        );


        card
            .querySelector(
                '[data-action="close"]'
            )
            ?.addEventListener(
                "click",
                closeOverlay
            );
    }


    /* =========================================================
       SETUP CURRENT CONVERSATION
       ========================================================= */

    function setupForCurrentConversation() {

        const conversationId =
            getConversationId();


        if (!conversationId) {
            return;
        }


        setupRemoteDeleteListener(
            conversationId
        );
    }


    /* =========================================================
       CHAT HEADER EVENT
       ========================================================= */

    window.addEventListener(
        "wfesc:chat-header-refresh",
        () => {

            setupForCurrentConversation();

        }
    );


    /* =========================================================
       MENU BUTTON
       ========================================================= */

    function setupMenuButton() {

        const button =
            getChatMenuButton();


        if (!button) {
            return false;
        }


        if (
            button.dataset
                .wfescActionsReady ===
            "true"
        ) {

            return true;
        }


        button.dataset
            .wfescActionsReady =
            "true";


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const conversationId =
                    getConversationId();


                if (!conversationId) {

                    showToast(
                        "لا توجد محادثة مفتوحة"
                    );

                    return;
                }


                createMenu();

            }
        );


        return true;
    }


    /* =========================================================
       RETRY BUTTON SETUP
       ========================================================= */

    function watchForMenuButton() {

        if (
            setupMenuButton()
        ) {
            return;
        }


        let attempts =
            0;


        const timer =
            setInterval(
                () => {

                    attempts++;


                    if (
                        setupMenuButton() ||
                        attempts >= 60
                    ) {

                        clearInterval(
                            timer
                        );
                    }

                },
                250
            );
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.WFESC_MESSAGES_CHAT_ACTIONS = {

        getConversationId,

        getCurrentContact,

        getContactUserId,

        getContactName,

        getCurrentBlockStatus,

        showBlockedConversationWarning,

        openDeleteChoice,

        openBlockConfirmation,

        closeMenu,

        closeOverlay,

        deleteForMe,

        deleteForEveryone,

        blockUser,

        unblockUser,

        setupForCurrentConversation

    };


    /* =========================================================
       BLOCK EVENTS
       ========================================================= */

    window.addEventListener(
        "wfesc:user-blocked",
        event => {

            console.log(
                "WFESC BLOCK EVENT:",
                "user blocked",
                event?.detail?.userId ||
                null
            );

        }
    );


    window.addEventListener(
        "wfesc:user-unblocked",
        event => {

            console.log(
                "WFESC BLOCK EVENT:",
                "user unblocked",
                event?.detail?.userId ||
                null
            );

        }
    );


    /* =========================================================
       START
       ========================================================= */

    function start() {

        watchForMenuButton();


        setTimeout(
            () => {

                setupForCurrentConversation();

            },
            0
        );
    }


    start();

})();
