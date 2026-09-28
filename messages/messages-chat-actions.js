/* =========================================================
   WFESC — Chat Actions
   File: messages/messages-chat-actions.js

   الوظائف:
   - قائمة الثلاث نقاط
   - حذف لدي
   - حذف للطرفين
   - تأكيدات الحذف
   - رسالة نجاح الحذف
   - إشعار الطرف الآخر عند حذف الطرفين
   - حظر المستخدم
   - إلغاء الحظر
   ========================================================= */

(function () {
    "use strict";

    const CORE_NAME = "WFESC_MESSAGES_CORE";

    let deleteRealtimeChannel = null;
    let currentDeleteConversationId = null;
    let currentDeleteOtherUserId = null;

    let initialized = false;

    function core() {
        return window[CORE_NAME] || null;
    }

    function client() {
        return core()?.client || window.WFESCSupabase || null;
    }

    function getCurrentUser() {
        return core()?.getCurrentUser?.() || null;
    }

    function getCurrentConversation() {
        return core()?.getCurrentConversation?.() || null;
    }

    function getCurrentContact() {
        return core()?.getCurrentContact?.() || null;
    }

    function getConversationId() {
        const conversation = getCurrentConversation();

        if (!conversation) return null;

        return (
            conversation.conversation_id ||
            conversation.id ||
            conversation.currentConversationId ||
            null
        );
    }

    function getContactUserId() {
        const contact = getCurrentContact();

        if (!contact) return null;

        return (
            contact.user_id ||
            contact.id ||
            null
        );
    }


    /* =========================================================
       أدوات الواجهة
       ========================================================= */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function ensureStyles() {
        if (document.getElementById("wfescChatActionsStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "wfescChatActionsStyles";

        style.textContent = `
            #wfescChatActionsMenu {
                position: fixed;
                z-index: 5000;
                min-width: 220px;
                max-width: calc(100vw - 24px);
                background: rgba(20,20,20,.98);
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 16px;
                padding: 7px;
                box-shadow: 0 18px 50px rgba(0,0,0,.45);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                direction: rtl;
                display: none;
            }

            #wfescChatActionsMenu.open {
                display: block;
                animation: wfescChatActionsMenuIn .16s ease-out;
            }

            @keyframes wfescChatActionsMenuIn {
                from {
                    opacity: 0;
                    transform: translateY(-5px) scale(.98);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .wfesc-chat-action-item {
                width: 100%;
                min-height: 46px;
                border: 0;
                outline: 0;
                background: transparent;
                color: #eee;
                border-radius: 12px;
                padding: 11px 13px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: inherit;
                font-size: 14px;
                text-align: right;
                cursor: pointer;
            }

            .wfesc-chat-action-item:hover {
                background: rgba(255,255,255,.07);
            }

            .wfesc-chat-action-item.danger {
                color: #ff6b6b;
            }

            .wfesc-chat-action-item.warning {
                color: #ffb84d;
            }

            .wfesc-chat-action-icon {
                width: 25px;
                min-width: 25px;
                text-align: center;
                font-size: 18px;
            }

            #wfescChatActionsBackdrop {
                position: fixed;
                inset: 0;
                z-index: 4999;
                background: transparent;
                display: none;
            }

            #wfescChatActionsBackdrop.open {
                display: block;
            }

            #wfescChatConfirmOverlay {
                position: fixed;
                inset: 0;
                z-index: 7000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(0,0,0,.68);
                direction: rtl;
            }

            #wfescChatConfirmOverlay.open {
                display: flex;
                animation: wfescConfirmFade .18s ease-out;
            }

            @keyframes wfescConfirmFade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .wfesc-chat-confirm-box {
                width: min(430px, 100%);
                background: #111;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 20px;
                padding: 21px;
                box-shadow: 0 25px 80px rgba(0,0,0,.6);
            }

            .wfesc-chat-confirm-title {
                font-size: 18px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 12px;
            }

            .wfesc-chat-confirm-text {
                color: #ccc;
                font-size: 14px;
                line-height: 1.8;
                white-space: pre-line;
            }

            .wfesc-chat-confirm-buttons {
                display: flex;
                gap: 9px;
                margin-top: 19px;
            }

            .wfesc-chat-confirm-buttons button {
                flex: 1;
                min-height: 44px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,.12);
                font-family: inherit;
                font-size: 14px;
                cursor: pointer;
            }

            .wfesc-chat-confirm-cancel {
                background: rgba(255,255,255,.06);
                color: #eee;
            }

            .wfesc-chat-confirm-ok {
                background: #fff;
                color: #111;
            }

            .wfesc-chat-confirm-danger {
                background: #c62828;
                color: #fff;
                border-color: #c62828 !important;
            }

            #wfescChatToast {
                position: fixed;
                left: 50%;
                bottom: calc(
                    var(--navigation-height, 68px)
                    + env(safe-area-inset-bottom)
                    + 18px
                );
                transform: translateX(-50%) translateY(15px);
                z-index: 9000;
                max-width: calc(100vw - 30px);
                background: rgba(20,20,20,.97);
                color: #fff;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 14px;
                padding: 12px 17px;
                font-size: 14px;
                text-align: center;
                opacity: 0;
                pointer-events: none;
                transition:
                    opacity .2s ease,
                    transform .2s ease;
                direction: rtl;
                box-shadow: 0 15px 45px rgba(0,0,0,.4);
            }

            #wfescChatToast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            #wfescChatToast.success {
                border-color: rgba(90,210,120,.3);
            }

            #wfescChatToast.error {
                border-color: rgba(255,90,90,.3);
            }

            #wfescRemoteDeleteOverlay {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 22px;
                background: rgba(0,0,0,.92);
                direction: rtl;
            }

            #wfescRemoteDeleteOverlay.open {
                display: flex;
            }

            .wfesc-remote-delete-box {
                width: min(430px, 100%);
                text-align: center;
                background: #111;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 22px;
                padding: 28px 20px;
            }

            .wfesc-remote-delete-icon {
                font-size: 42px;
                margin-bottom: 15px;
            }

            .wfesc-remote-delete-text {
                color: #fff;
                font-size: 16px;
                line-height: 1.8;
                font-weight: 600;
            }
        `;

        document.head.appendChild(style);
    }


    function ensureUI() {
        ensureStyles();

        if (!document.getElementById("wfescChatActionsBackdrop")) {
            const backdrop = document.createElement("div");
            backdrop.id = "wfescChatActionsBackdrop";

            backdrop.addEventListener("click", closeMenu);

            document.body.appendChild(backdrop);
        }

        if (!document.getElementById("wfescChatActionsMenu")) {
            const menu = document.createElement("div");
            menu.id = "wfescChatActionsMenu";

            menu.innerHTML = `
                <button
                    type="button"
                    class="wfesc-chat-action-item danger"
                    id="wfescDeleteChatAction"
                >
                    <span class="wfesc-chat-action-icon">🗑</span>
                    <span>حذف المحادثة</span>
                </button>

                <button
                    type="button"
                    class="wfesc-chat-action-item warning"
                    id="wfescBlockChatAction"
                >
                    <span class="wfesc-chat-action-icon">🚫</span>
                    <span id="wfescBlockChatActionText">حظر المستخدم</span>
                </button>
            `;

            document.body.appendChild(menu);

            document
                .getElementById("wfescDeleteChatAction")
                .addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    closeMenu();
                    openDeleteChoice();
                });

            document
                .getElementById("wfescBlockChatAction")
                .addEventListener("click", async function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    closeMenu();
                    await handleBlock();
                });
        }

        if (!document.getElementById("wfescChatConfirmOverlay")) {
            const overlay = document.createElement("div");
            overlay.id = "wfescChatConfirmOverlay";

            document.body.appendChild(overlay);
        }

        if (!document.getElementById("wfescChatToast")) {
            const toast = document.createElement("div");
            toast.id = "wfescChatToast";

            document.body.appendChild(toast);
        }

        if (!document.getElementById("wfescRemoteDeleteOverlay")) {
            const remote = document.createElement("div");
            remote.id = "wfescRemoteDeleteOverlay";

            remote.innerHTML = `
                <div class="wfesc-remote-delete-box">
                    <div class="wfesc-remote-delete-icon">🗑</div>
                    <div class="wfesc-remote-delete-text">
                        قام الطرف الآخر بحذف الرسائل من كلا الطرفين
                    </div>
                </div>
            `;

            document.body.appendChild(remote);
        }
    }


    /* =========================================================
       القائمة
       ========================================================= */

    function positionMenu() {
        const button = document.getElementById("chatMenuButton");
        const menu = document.getElementById("wfescChatActionsMenu");

        if (!button || !menu) return;

        const rect = button.getBoundingClientRect();

        menu.style.top = `${Math.min(
            window.innerHeight - menu.offsetHeight - 12,
            rect.bottom + 8
        )}px`;

        menu.style.right = `${Math.max(
            12,
            window.innerWidth - rect.right
        )}px`;

        menu.style.left = "auto";
    }


    function openMenu() {
        ensureUI();

        const conversationId = getConversationId();

        if (!conversationId) {
            showToast("لا توجد محادثة مفتوحة", "error");
            return;
        }

        const menu = document.getElementById("wfescChatActionsMenu");
        const backdrop = document.getElementById("wfescChatActionsBackdrop");

        if (!menu || !backdrop) return;

        updateBlockButtonText();

        menu.classList.add("open");
        backdrop.classList.add("open");

        requestAnimationFrame(positionMenu);
    }


    function closeMenu() {
        const menu = document.getElementById("wfescChatActionsMenu");
        const backdrop = document.getElementById("wfescChatActionsBackdrop");

        menu?.classList.remove("open");
        backdrop?.classList.remove("open");
    }


    function toggleMenu() {
        const menu = document.getElementById("wfescChatActionsMenu");

        if (menu?.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }
    }


    /* =========================================================
       نافذة التأكيد
       ========================================================= */

    function showConfirm({
        title,
        text,
        okText = "تأكيد",
        cancelText = "إلغاء",
        danger = false,
        onConfirm
    }) {
        ensureUI();

        const overlay = document.getElementById("wfescChatConfirmOverlay");

        overlay.innerHTML = `
            <div class="wfesc-chat-confirm-box">
                <div class="wfesc-chat-confirm-title">
                    ${escapeHTML(title)}
                </div>

                <div class="wfesc-chat-confirm-text">
                    ${escapeHTML(text)}
                </div>

                <div class="wfesc-chat-confirm-buttons">
                    <button
                        type="button"
                        class="wfesc-chat-confirm-cancel"
                        id="wfescConfirmCancel"
                    >
                        ${escapeHTML(cancelText)}
                    </button>

                    <button
                        type="button"
                        class="${danger
                            ? "wfesc-chat-confirm-danger"
                            : "wfesc-chat-confirm-ok"}"
                        id="wfescConfirmOK"
                    >
                        ${escapeHTML(okText)}
                    </button>
                </div>
            </div>
        `;

        overlay.classList.add("open");

        document
            .getElementById("wfescConfirmCancel")
            .onclick = closeConfirm;

        document
            .getElementById("wfescConfirmOK")
            .onclick = async function () {
                closeConfirm();

                try {
                    await onConfirm?.();
                } catch (error) {
                    console.error(
                        "[WFESC CHAT ACTIONS] Confirmation action failed:",
                        error
                    );

                    showToast(
                        error?.message || "حدث خطأ غير متوقع",
                        "error"
                    );
                }
            };
    }


    function closeConfirm() {
        const overlay = document.getElementById("wfescChatConfirmOverlay");

        overlay?.classList.remove("open");
    }


    /* =========================================================
       اختيار نوع الحذف
       ========================================================= */

    function openDeleteChoice() {
        showConfirm({
            title: "حذف المحادثة",
            text: "اختر طريقة الحذف:\n\nحذف لدي: تختفي الرسائل من حسابك فقط.\n\nحذف للطرفين: تنحذف الرسائل والمحادثة من الطرفين نهائيًا.",
            okText: "حذف لدي",
            cancelText: "إلغاء",
            danger: false,
            onConfirm: function () {
                confirmDeleteForMeStep2();
            }
        });

        /*
         * زر حذف للطرفين يحتاج خيار مستقل.
         * نضيفه داخل نفس النافذة بعد فتحها.
         */
        requestAnimationFrame(() => {
            const box = document.querySelector(
                "#wfescChatConfirmOverlay .wfesc-chat-confirm-box"
            );

            if (!box) return;

            const buttons = box.querySelector(
                ".wfesc-chat-confirm-buttons"
            );

            if (!buttons) return;

            const bothButton = document.createElement("button");

            bothButton.type = "button";
            bothButton.className = "wfesc-chat-confirm-danger";
            bothButton.textContent = "حذف للطرفين";

            bothButton.style.flex = "1";

            bothButton.onclick = function () {
                closeConfirm();
                confirmDeleteForEveryoneStep1();
            };

            buttons.insertBefore(bothButton, buttons.firstChild);
        });
    }


    /* =========================================================
       حذف لدي
       ========================================================= */

    function confirmDeleteForMeStep2() {
        showConfirm({
            title: "تأكيد حذف المحادثة",
            text: "سيتم إخفاء المحادثة والرسائل من حسابك فقط.\n\nالطرف الآخر سيبقى قادرًا على رؤية المحادثة ورسائلها.",
            okText: "متابعة",
            cancelText: "إلغاء",
            danger: false,
            onConfirm: function () {
                confirmDeleteForMeStep3();
            }
        });
    }


    function confirmDeleteForMeStep3() {
        showConfirm({
            title: "التأكيد الأخير",
            text: "هل أنت متأكد من حذف المحادثة لديك؟\n\nهذا الإجراء سيزيلها من قائمة محادثاتك.",
            okText: "حذف لدي",
            cancelText: "إلغاء",
            danger: true,
            onConfirm: deleteForMe
        });
    }


    async function deleteForMe() {
        const conversationId = getConversationId();

        if (!conversationId) {
            throw new Error("لم يتم العثور على المحادثة");
        }

        const supabase = client();

        if (!supabase) {
            throw new Error("اتصال قاعدة البيانات غير متوفر");
        }

        const { error } = await supabase.rpc(
            "hide_my_conversation",
            {
                target_conversation_id: conversationId
            }
        );

        if (error) {
            throw error;
        }

        showToast("تم حذف المحادثة لديك بنجاح", "success");

        setTimeout(() => {
            try {
                core()?.closeConversation?.();
            } catch (error) {
                console.error(error);
            }
        }, 1200);
    }


    /* =========================================================
       حذف للطرفين
       ========================================================= */

    function confirmDeleteForEveryoneStep1() {
        showConfirm({
            title: "تحذير",
            text: "هل أنت متأكد من طلبك بحذف الرسائل؟\n\nتحذير سوف تنحذف من كلا الطرفين ولا يمكن استعادتها نهائيا",
            okText: "متابعة",
            cancelText: "إلغاء",
            danger: true,
            onConfirm: function () {
                confirmDeleteForEveryoneStep2();
            }
        });
    }


    function confirmDeleteForEveryoneStep2() {
        showConfirm({
            title: "أكد طلبك",
            text: "أكد طلبك بحذف الرسائل من الطرفين",
            okText: "متابعة",
            cancelText: "إلغاء",
            danger: true,
            onConfirm: function () {
                confirmDeleteForEveryoneStep3();
            }
        });
    }


    function confirmDeleteForEveryoneStep3() {
        showConfirm({
            title: "التأكيد الأخير",
            text: "هذا هو التأكيد الأخير.\n\nسيتم حذف المحادثة والرسائل من الطرفين نهائيًا ولا يمكن استعادتها.",
            okText: "حذف نهائي",
            cancelText: "إلغاء",
            danger: true,
            onConfirm: deleteForEveryone
        });
    }


    async function deleteForEveryone() {
        const conversationId = getConversationId();

        if (!conversationId) {
            throw new Error("لم يتم العثور على المحادثة");
        }

        const supabase = client();

        if (!supabase) {
            throw new Error("اتصال قاعدة البيانات غير متوفر");
        }

        const user = getCurrentUser();

        const otherUserId = getContactUserId();

        /*
         * نرسل الإشعار قبل الحذف حتى يبقى الطرف الآخر
         * قادرًا على استقبال الـ Broadcast حتى لو اختفت
         * عضوية المحادثة بعد الحذف.
         */
        await broadcastDeleteEvent(
            conversationId,
            user?.id || null
        );

        const { error } = await supabase.rpc(
            "delete_conversation_for_everyone",
            {
                target_conversation_id: conversationId
            }
        );

        if (error) {
            throw error;
        }

        currentDeleteConversationId = null;
        currentDeleteOtherUserId = null;

        showToast("تم حذف المحادثة بنجاح", "success");

        setTimeout(() => {
            try {
                core()?.closeConversation?.();
            } catch (error) {
                console.error(error);
            }
        }, 2000);
    }


    /* =========================================================
       Realtime — إشعار حذف الطرفين
       ========================================================= */

    async function broadcastDeleteEvent(
        conversationId,
        deletedBy
    ) {
        const supabase = client();

        if (!supabase || !conversationId) {
            return;
        }

        try {
            const channelName =
                `wfesc-chat-actions-${conversationId}`;

            const channel =
                supabase.channel(channelName);

            await channel.subscribe();

            await channel.send({
                type: "broadcast",
                event: "conversation_deleted",
                payload: {
                    conversation_id: conversationId,
                    deleted_by: deletedBy || null,
                    deleted_at: new Date().toISOString()
                }
            });

            /*
             * نعطي الـ realtime فرصة لإرسال الحدث.
             */
            setTimeout(() => {
                try {
                    supabase.removeChannel(channel);
                } catch (error) {
                    console.error(error);
                }
            }, 1000);

        } catch (error) {
            /*
             * فشل الـ Broadcast لا يمنع تنفيذ الحذف.
             * الحذف نفسه يبقى محميًا من قاعدة البيانات.
             */
            console.error(
                "[WFESC CHAT ACTIONS] Delete broadcast error:",
                error
            );
        }
    }


    async function subscribeToDeleteEvents() {
        const supabase = client();

        const conversationId = getConversationId();

        if (!supabase || !conversationId) {
            return;
        }

        if (
            deleteRealtimeChannel &&
            deleteRealtimeChannel.__conversationId === conversationId
        ) {
            return;
        }

        await unsubscribeFromDeleteEvents();

        const channelName =
            `wfesc-chat-actions-${conversationId}`;

        const channel =
            supabase.channel(channelName);

        channel.on(
            "broadcast",
            {
                event: "conversation_deleted"
            },
            function (payload) {
                handleRemoteDelete(payload);
            }
        );

        channel.__conversationId = conversationId;

        deleteRealtimeChannel = channel;

        try {
            await channel.subscribe();
        } catch (error) {
            console.error(
                "[WFESC CHAT ACTIONS] Subscribe error:",
                error
            );
        }
    }


    async function unsubscribeFromDeleteEvents() {
        const supabase = client();

        if (!deleteRealtimeChannel) {
            return;
        }

        try {
            if (supabase) {
                await supabase.removeChannel(
                    deleteRealtimeChannel
                );
            }
        } catch (error) {
            console.error(error);
        }

        deleteRealtimeChannel = null;
    }


    async function handleRemoteDelete(payload) {
        const data = payload?.payload || payload || {};

        const conversationId =
            data.conversation_id || null;

        const currentId = getConversationId();

        if (
            !conversationId ||
            !currentId ||
            conversationId !== currentId
        ) {
            return;
        }

        const currentUser = getCurrentUser();

        if (
            currentUser?.id &&
            data.deleted_by === currentUser.id
        ) {
            return;
        }

        showRemoteDeleteOverlay();

        setTimeout(() => {
            hideRemoteDeleteOverlay();

            try {
                core()?.closeConversation?.();
            } catch (error) {
                console.error(error);
            }
        }, 1800);
    }


    function showRemoteDeleteOverlay() {
        ensureUI();

        const overlay =
            document.getElementById(
                "wfescRemoteDeleteOverlay"
            );

        overlay?.classList.add("open");
    }


    function hideRemoteDeleteOverlay() {
        const overlay =
            document.getElementById(
                "wfescRemoteDeleteOverlay"
            );

        overlay?.classList.remove("open");
    }


    /* =========================================================
       الحظر
       ========================================================= */

    async function isUserBlocked(
        blockerId,
        blockedId
    ) {
        const supabase = client();

        if (
            !supabase ||
            !blockerId ||
            !blockedId
        ) {
            return false;
        }

        const { data, error } = await supabase
            .from("user_blocks")
            .select("blocker_id, blocked_id")
            .or(
                `and(blocker_id.eq.${blockerId},blocked_id.eq.${blockedId}),and(blocker_id.eq.${blockedId},blocked_id.eq.${blockerId})`
            )
            .limit(1);

        if (error) {
            console.error(
                "[WFESC CHAT ACTIONS] Block check error:",
                error
            );

            return false;
        }

        return Array.isArray(data) && data.length > 0;
    }


    async function updateBlockButtonText() {
        const buttonText =
            document.getElementById(
                "wfescBlockChatActionText"
            );

        if (!buttonText) return;

        const currentUser = getCurrentUser();
        const otherUserId = getContactUserId();

        if (
            !currentUser?.id ||
            !otherUserId
        ) {
            buttonText.textContent = "حظر المستخدم";
            return;
        }

        try {
            const blocked =
                await isUserBlocked(
                    currentUser.id,
                    otherUserId
                );

            buttonText.textContent =
                blocked
                    ? "إلغاء حظر المستخدم"
                    : "حظر المستخدم";

        } catch (error) {
            buttonText.textContent =
                "حظر المستخدم";
        }
    }


    async function handleBlock() {
        const currentUser = getCurrentUser();
        const otherUserId = getContactUserId();

        if (
            !currentUser?.id ||
            !otherUserId
        ) {
            showToast(
                "تعذر تحديد المستخدم",
                "error"
            );

            return;
        }

        const blocked =
            await isUserBlocked(
                currentUser.id,
                otherUserId
            );

        if (blocked) {
            showConfirm({
                title: "إلغاء الحظر",
                text: "هل تريد إلغاء حظر هذا المستخدم؟",
                okText: "إلغاء الحظر",
                cancelText: "إلغاء",
                danger: false,
                onConfirm: function () {
                    return unblockUser(
                        currentUser.id,
                        otherUserId
                    );
                }
            });

            return;
        }

        showConfirm({
            title: "حظر المستخدم",
            text: "بعد الحظر لن تتمكن من إرسال رسائل جديدة إلى هذا المستخدم.\n\nهل تريد متابعة الحظر؟",
            okText: "حظر",
            cancelText: "إلغاء",
            danger: true,
            onConfirm: function () {
                return blockUser(
                    currentUser.id,
                    otherUserId
                );
            }
        });
    }


    async function blockUser(
        blockerId,
        blockedId
    ) {
        const supabase = client();

        if (!supabase) {
            throw new Error(
                "اتصال قاعدة البيانات غير متوفر"
            );
        }

        const { error } = await supabase
            .from("user_blocks")
            .insert({
                blocker_id: blockerId,
                blocked_id: blockedId
            });

        if (error) {
            /*
             * إذا كان الحظر موجودًا مسبقًا
             */
            if (error.code === "23505") {
                showToast(
                    "المستخدم محظور بالفعل",
                    "success"
                );

                return;
            }

            throw error;
        }

        showToast(
            "تم حظر المستخدم",
            "success"
        );

        /*
         * لا نحذف المحادثة تلقائيًا.
         * المستخدم يستطيع استخدام حذف المحادثة
         * بشكل مستقل.
         */
    }


    async function unblockUser(
        blockerId,
        blockedId
    ) {
        const supabase = client();

        if (!supabase) {
            throw new Error(
                "اتصال قاعدة البيانات غير متوفر"
            );
        }

        const { error } = await supabase
            .from("user_blocks")
            .delete()
            .eq("blocker_id", blockerId)
            .eq("blocked_id", blockedId);

        if (error) {
            throw error;
        }

        showToast(
            "تم إلغاء حظر المستخدم",
            "success"
        );
    }


    /* =========================================================
       Toast
       ========================================================= */

    let toastTimer = null;

    function showToast(
        message,
        type = "success"
    ) {
        ensureUI();

        const toast =
            document.getElementById(
                "wfescChatToast"
            );

        if (!toast) return;

        clearTimeout(toastTimer);

        toast.textContent = message;

        toast.classList.remove(
            "show",
            "success",
            "error"
        );

        toast.classList.add(type);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }


    /* =========================================================
       ربط زر الثلاث نقاط
       ========================================================= */

    function bindMenuButton() {
        const button =
            document.getElementById(
                "chatMenuButton"
            );

        if (!button) {
            return false;
        }

        /*
         * Capture حتى نضمن أن هذا الملف هو المسؤول
         * عن زر الثلاث نقاط ولا يتعارض مع أي handler
         * آخر موجود في ملفات الهيدر.
         */
        if (button.__wfescChatActionsBound) {
            return true;
        }

        button.__wfescChatActionsBound = true;

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                if (typeof event.stopImmediatePropagation === "function") {
                    event.stopImmediatePropagation();
                }

                toggleMenu();
            },
            true
        );

        return true;
    }


    /* =========================================================
       مراقبة فتح المحادثة
       ========================================================= */

    function watchConversation() {
        let lastConversationId = null;

        setInterval(async function () {
            const conversationId =
                getConversationId();

            if (
                conversationId &&
                conversationId !== lastConversationId
            ) {
                lastConversationId =
                    conversationId;

                await subscribeToDeleteEvents();
            }

            if (
                !conversationId &&
                lastConversationId
            ) {
                lastConversationId = null;

                await unsubscribeFromDeleteEvents();
            }
        }, 600);
    }


    /* =========================================================
       إغلاق القوائم عند الضغط خارجها
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Escape") {
                closeMenu();
                closeConfirm();
            }
        }
    );


    window.addEventListener(
        "resize",
        function () {
            const menu =
                document.getElementById(
                    "wfescChatActionsMenu"
                );

            if (
                menu?.classList.contains("open")
            ) {
                positionMenu();
            }
        }
    );


    /* =========================================================
       Init
       ========================================================= */

    function init() {
        if (initialized) return;

        initialized = true;

        ensureUI();

        /*
         * زر الهيدر قد يتم إنشاؤه قبل أو بعد هذا الملف،
         * لذلك نجرب الآن ونراقبه إذا لم يكن موجودًا.
         */
        if (!bindMenuButton()) {
            const observer =
                new MutationObserver(function () {
                    if (bindMenuButton()) {
                        observer.disconnect();
                    }
                });

            observer.observe(
                document.documentElement,
                {
                    childList: true,
                    subtree: true
                }
            );
        }

        watchConversation();
    }


    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }


    /* =========================================================
       Public API
       ========================================================= */

    window.WFESC_MESSAGES_CHAT_ACTIONS = {
        openMenu,
        closeMenu,
        toggleMenu,
        deleteForMe,
        deleteForEveryone,
        blockUser,
        unblockUser,
        isUserBlocked,
        showToast,
        subscribeToDeleteEvents,
        unsubscribeFromDeleteEvents
    };

})();
