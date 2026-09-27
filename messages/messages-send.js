(() => {
    "use strict";

    /*
    ============================================================
    WFESC MESSAGES SEND
    النسخة المستقرة + اتصال نظام الكيبورد

    مسؤول عن:
    - كتابة الرسالة
    - تغيير ارتفاع حقل الكتابة
    - الإرسال
    - منع الإرسال المكرر
    - Enter للإرسال
    - Shift + Enter لسطر جديد
    - ظهور الرسالة فوراً
    - عدم إعادة رسم المحادثة بعد الإرسال
    - الحفاظ على المحادثة مفتوحة
    - الاتصال بملف messages-keyboard.js
    ============================================================
    */

    const core =
        window.WFESC_MESSAGES_CORE;

    if (!core) {
        console.error(
            "WFESC Messages Send: messages-core.js غير موجود."
        );
        return;
    }

    /* =========================================================
       DOM
    ========================================================= */

    const messageForm =
        document.getElementById("messageForm");

    const messageInput =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    const chatMessages =
        document.getElementById("chatMessages");

    /* =========================================================
       STATE
    ========================================================= */

    let isSending = false;

    /* =========================================================
       KEYBOARD MODULE
    ========================================================= */

    function keepKeyboardOpen() {

        const keyboard =
            window.WFESC_MESSAGES_KEYBOARD;

        if (
            keyboard &&
            typeof keyboard.keepKeyboardOpen ===
                "function"
        ) {
            keyboard.keepKeyboardOpen();
            return true;
        }

        /*
           احتياط إذا كان ملف الكيبورد لم يجهز بعد.
        */
        if (messageInput) {

            try {
                messageInput.focus({
                    preventScroll: true
                });
            } catch (_) {

                try {
                    messageInput.focus();
                } catch (_) {}
            }
        }

        return false;
    }

    /* =========================================================
       HELPERS
    ========================================================= */

    function scrollToBottom(
        behavior = "smooth"
    ) {
        if (!chatMessages) {
            return;
        }

        requestAnimationFrame(() => {

            chatMessages.scrollTo({
                top:
                    chatMessages.scrollHeight,
                behavior
            });

        });
    }

    function resizeTextarea() {

        if (!messageInput) {
            return;
        }

        messageInput.style.height =
            "auto";

        const maxHeight =
            100;

        const nextHeight =
            Math.min(
                messageInput.scrollHeight,
                maxHeight
            );

        messageInput.style.height =
            `${nextHeight}px`;
    }

    function setSendingState(state) {

        isSending =
            Boolean(state);

        if (sendButton) {

            sendButton.disabled =
                isSending;

            sendButton.classList.toggle(
                "sending",
                isSending
            );

            sendButton.textContent =
                isSending
                    ? "…"
                    : "↑";
        }

        /*
           لا نعطل حقل الكتابة.
        */
        if (messageInput) {

            messageInput.classList.toggle(
                "sending",
                isSending
            );
        }
    }

    function createOptimisticMessage(
        content,
        userId
    ) {

        return {

            id:
                `temp-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,

            sender_id:
                userId,

            content,

            created_at:
                new Date().toISOString(),

            optimistic:
                true
        };
    }

    function renderTemporaryMessage(
        message
    ) {

        if (!chatMessages) {
            return null;
        }

        const emptyState =
            chatMessages.querySelector(
                ".empty-state"
            );

        if (emptyState) {
            emptyState.remove();
        }

        let row = null;

        if (
            typeof core.createMessageElement ===
            "function"
        ) {

            row =
                core.createMessageElement(
                    message
                );
        }

        if (!row) {

            console.error(
                "WFESC: تعذر إنشاء عنصر الرسالة."
            );

            return null;
        }

        row.classList.add(
            "message-new",
            "optimistic"
        );

        row.dataset.optimisticId =
            String(message.id);

        chatMessages.appendChild(
            row
        );

        /*
           تطبيق إعدادات الرسائل إذا كانت موجودة.
        */
        try {

            const settings =
                window.WFESC_MESSAGE_SETTINGS;

            if (
                settings &&
                typeof settings.apply ===
                    "function"
            ) {

                settings.apply(
                    typeof settings.get ===
                        "function"
                        ? settings.get()
                        : undefined
                );
            }

        } catch (error) {

            console.warn(
                "WFESC message settings:",
                error
            );
        }

        scrollToBottom("smooth");

        return row;
    }

    /* =========================================================
       EXTRACT SENT MESSAGE
    ========================================================= */

    function extractSentMessage(data) {

        if (!data) {
            return null;
        }

        if (Array.isArray(data)) {
            return data[0] || null;
        }

        if (
            data.message &&
            typeof data.message ===
                "object"
        ) {
            return data.message;
        }

        if (
            data.data &&
            Array.isArray(data.data)
        ) {
            return data.data[0] || null;
        }

        if (
            data.data &&
            typeof data.data ===
                "object"
        ) {
            return data.data;
        }

        if (
            typeof data !==
            "object"
        ) {
            return null;
        }

        if (
            data.content !== undefined ||
            data.message !== undefined ||
            data.sender_id !== undefined ||
            data.user_id !== undefined ||
            data.created_at !== undefined ||
            data.id !== undefined
        ) {
            return data;
        }

        return null;
    }

    /* =========================================================
       CONFIRM TEMPORARY MESSAGE
    ========================================================= */

    function confirmTemporaryMessage(
        temporaryRow,
        sentMessage
    ) {

        if (!temporaryRow) {
            return;
        }

        temporaryRow.classList.remove(
            "optimistic"
        );

        temporaryRow.classList.remove(
            "message-new"
        );

        temporaryRow.dataset.confirmed =
            "true";

        if (sentMessage) {

            const realId =
                sentMessage.id ??
                sentMessage.message_id;

            if (realId != null) {

                temporaryRow.dataset.messageId =
                    String(realId);
            }

            const timeElement =
                temporaryRow.querySelector(
                    ".message-time"
                );

            if (
                timeElement &&
                (
                    sentMessage.created_at ||
                    sentMessage.sent_at
                )
            ) {

                const date =
                    new Date(
                        sentMessage.created_at ||
                        sentMessage.sent_at
                    );

                if (
                    !Number.isNaN(
                        date.getTime()
                    )
                ) {

                    timeElement.textContent =
                        date.toLocaleTimeString(
                            "ar-IQ",
                            {
                                hour:
                                    "2-digit",

                                minute:
                                    "2-digit"
                            }
                        );
                }
            }
        }
    }

    /* =========================================================
       SEND
    ========================================================= */

    async function sendCurrentMessage() {

        if (isSending) {
            return;
        }

        if (!messageInput) {
            return;
        }

        const user =
            core.getCurrentUser();

        const conversationId =
            core.getCurrentConversation();

        if (!user) {

            console.warn(
                "WFESC: لا يوجد مستخدم."
            );

            return;
        }

        if (!conversationId) {

            console.warn(
                "WFESC: لم يتم فتح محادثة."
            );

            return;
        }

        const content =
            messageInput.value
                .replace(/\r\n/g, "\n")
                .trim();

        if (!content) {
            return;
        }

        const sendingConversationId =
            conversationId;

        const originalContent =
            content;

        /*
           مهم:
           نعرف هل المستخدم كان يكتب والكيبورد مفتوح.
        */
        const hadFocus =
            document.activeElement ===
            messageInput;

        setSendingState(true);

        /* =====================================================
           1. الرسالة تظهر فوراً
           ===================================================== */

        const optimistic =
            createOptimisticMessage(
                originalContent,
                user.id
            );

        const temporaryRow =
            renderTemporaryMessage(
                optimistic
            );

        /* =====================================================
           2. تفريغ الحقل
           ===================================================== */

        messageInput.value = "";

        resizeTextarea();

        /* =====================================================
           3. الإرسال إلى Supabase
           ===================================================== */

        try {

            const {
                data,
                error
            } = await core.client.rpc(
                "send_message",
                {
                    target_conversation_id:
                        sendingConversationId,

                    message_content:
                        originalContent
                }
            );

            if (error) {
                throw error;
            }

            /* =================================================
               التأكد من بقاء نفس المحادثة
               ================================================= */

            const stillSameConversation =
                String(
                    core.getCurrentConversation()
                ) ===
                String(
                    sendingConversationId
                );

            if (
                !stillSameConversation
            ) {

                return;
            }

            /* =================================================
               استخراج الرسالة الحقيقية
               ================================================= */

            const sentMessage =
                extractSentMessage(data);

            /* =================================================
               تأكيد الرسالة بدون إعادة الرسم
               ================================================= */

            confirmTemporaryMessage(
                temporaryRow,
                sentMessage
            );

            if (
                sentMessage &&
                typeof core.getMessages ===
                    "function"
            ) {

                console.log(
                    "WFESC message confirmed:",
                    sentMessage
                );
            }

            scrollToBottom(
                "smooth"
            );

        } catch (error) {

            console.error(
                "WFESC send message error:",
                error
            );

            if (temporaryRow) {
                temporaryRow.remove();
            }

            messageInput.value =
                originalContent;

            resizeTextarea();

            try {

                messageInput.animate(
                    [
                        {
                            transform:
                                "translateX(0)"
                        },
                        {
                            transform:
                                "translateX(-4px)"
                        },
                        {
                            transform:
                                "translateX(4px)"
                        },
                        {
                            transform:
                                "translateX(0)"
                        }
                    ],
                    {
                        duration:
                            240
                    }
                );

            } catch (_) {}

        } finally {

            setSendingState(
                false
            );

            resizeTextarea();

            /*
            ====================================================
            إعادة إبقاء الكيبورد مفتوح
            ====================================================

            إذا كان المستخدم يكتب قبل الإرسال،
            نطلب من messages-keyboard.js أن يتولى
            إبقاء الكيبورد مفتوحاً.

            لا نتحكم بالـ keyboard من هذا الملف مباشرة.
            ====================================================
            */

            if (hadFocus) {

                /*
                   ننتظر انتهاء عملية الإرسال بالكامل
                   ثم نسلم التحكم لملف الكيبورد.
                */
                requestAnimationFrame(() => {

                    keepKeyboardOpen();

                });

            }
        }
    }

    /* =========================================================
       FORM
    ========================================================= */

    if (messageForm) {

        messageForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendCurrentMessage();

            }
        );
    }

    /* =========================================================
       INPUT
    ========================================================= */

    if (messageInput) {

        messageInput.addEventListener(
            "input",
            resizeTextarea
        );

        messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendCurrentMessage();

                }
            }
        );

        messageInput.addEventListener(
            "focus",
            () => {

                requestAnimationFrame(() => {

                    scrollToBottom(
                        "smooth"
                    );

                    const keyboard =
                        window.WFESC_MESSAGES_KEYBOARD;

                    if (
                        keyboard &&
                        typeof keyboard.updateInputPosition ===
                            "function"
                    ) {

                        keyboard.updateInputPosition();
                    }

                });

            }
        );
    }

    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESC_MESSAGES_SEND = {

        sendCurrentMessage,

        isSending() {
            return isSending;
        },

        resizeTextarea

    };

    /* =========================================================
       INIT
    ========================================================= */

    resizeTextarea();

})();
