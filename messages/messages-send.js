(() => {
    "use strict";

    /*
    ============================================================
    WFESC MESSAGES SEND
    النسخة المستقرة

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
    - الحفاظ على التركيز داخل حقل الكتابة
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
                top: chatMessages.scrollHeight,
                behavior
            });
        });
    }

    function resizeTextarea() {
        if (!messageInput) {
            return;
        }

        messageInput.style.height = "auto";

        const maxHeight = 100;

        const nextHeight =
            Math.min(
                messageInput.scrollHeight,
                maxHeight
            );

        messageInput.style.height =
            `${nextHeight}px`;
    }

    function setSendingState(state) {
        isSending = Boolean(state);

        if (sendButton) {
            sendButton.disabled = isSending;

            sendButton.classList.toggle(
                "sending",
                isSending
            );

            sendButton.textContent =
                isSending ? "…" : "↑";
        }

        /*
           لا نعطل حقل الكتابة.
           هذا مهم للكيبورد.
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

            optimistic: true
        };
    }

    function renderTemporaryMessage(
        message
    ) {
        if (!chatMessages) {
            return null;
        }

        /*
           حذف حالة "لا توجد رسائل"
           فقط إذا كانت موجودة.
        */
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

        chatMessages.appendChild(row);

        /*
           لا نعيد رسم المحادثة.
           فقط نطلب تطبيق الإعدادات إن كانت متاحة.
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

    /*
       استخراج صف الرسالة الحقيقي من أي شكل محتمل
       يرجعه RPC.
    */
    function extractSentMessage(data) {
        if (!data) {
            return null;
        }

        if (Array.isArray(data)) {
            return data[0] || null;
        }

        if (
            data.message &&
            typeof data.message === "object"
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
            typeof data.data === "object"
        ) {
            return data.data;
        }

        /*
           إذا كان RPC يرجع UUID أو قيمة بسيطة،
           لا نحاول اعتبارها رسالة كاملة.
        */
        if (
            typeof data !== "object"
        ) {
            return null;
        }

        /*
           نتأكد أن الكائن يشبه رسالة فعلية.
        */
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

    /*
       تحديث الرسالة المؤقتة بالبيانات الحقيقية
       بدون حذف العنصر من DOM.
    */
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

            /*
               تحديث وقت الرسالة إذا أعاده الخادم.
            */
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
                                hour: "2-digit",
                                minute: "2-digit"
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

        /*
           نحفظ المحادثة والنص.
        */
        const sendingConversationId =
            conversationId;

        const originalContent =
            content;

        /*
           هل كان الحقل مركزاً قبل الإرسال؟
           مهم جداً للكيبورد.
        */
        const hadFocus =
            document.activeElement ===
            messageInput;

        setSendingState(true);

        /*
        ========================================================
        1. إظهار الرسالة فوراً
        ========================================================
        */

        const optimistic =
            createOptimisticMessage(
                originalContent,
                user.id
            );

        const temporaryRow =
            renderTemporaryMessage(
                optimistic
            );

        /*
        ========================================================
        2. تفريغ الحقل فقط
        ========================================================
        */

        messageInput.value = "";

        resizeTextarea();

        /*
        ========================================================
        3. الإرسال إلى Supabase
        ========================================================
        */

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

            /*
            ====================================================
            تأكد أن المستخدم ما زال بنفس المحادثة.
            ====================================================
            */

            const stillSameConversation =
                String(
                    core.getCurrentConversation()
                ) === String(
                    sendingConversationId
                );

            if (
                !stillSameConversation
            ) {
                /*
                   لا نلمس المحادثة الحالية إذا المستخدم
                   انتقل إلى محادثة أخرى أثناء الإرسال.
                */
                return;
            }

            /*
            ====================================================
            استخراج الرسالة الحقيقية إذا كانت موجودة.
            ====================================================
            */

            const sentMessage =
                extractSentMessage(data);

            /*
            ====================================================
            مهم:
            لا نحذف الرسالة المؤقتة.
            نحولها إلى رسالة مؤكدة.
            ====================================================
            */

            confirmTemporaryMessage(
                temporaryRow,
                sentMessage
            );

            /*
            ====================================================
            إذا رجع RPC رسالة كاملة،
            نحدّث currentMessages بدون renderMessages().
            ====================================================
            */

            if (
                sentMessage &&
                typeof core.getMessages ===
                    "function"
            ) {

                /*
                   لا نستخدم addMessageToCurrentConversation
                   هنا حتى لا نضيف الرسالة مرة ثانية
                   إذا كانت موجودة بالفعل في الحالة.

                   الرسالة الظاهرة هي نفسها الرسالة
                   التي أنشأناها فورياً.
                */
                console.log(
                    "WFESC message confirmed:",
                    sentMessage
                );
            }

            /*
            ====================================================
            إبقاء الشاشة عند آخر رسالة.
            ====================================================
            */

            scrollToBottom("smooth");

        } catch (error) {

            console.error(
                "WFESC send message error:",
                error
            );

            /*
            ====================================================
            فشل الإرسال:
            إزالة الرسالة المؤقتة فقط.
            ====================================================
            */

            if (temporaryRow) {
                temporaryRow.remove();
            }

            /*
            ====================================================
            إعادة النص للمستخدم.
            ====================================================
            */

            messageInput.value =
                originalContent;

            resizeTextarea();

            /*
            ====================================================
            تنبيه بصري بسيط بدون تغيير الصفحة.
            ====================================================
            */

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
                        duration: 240
                    }
                );
            } catch (_) {}

        } finally {

            setSendingState(false);

            /*
            ====================================================
            لا نعمل focus إجباري إذا المستخدم فقد التركيز.
            هذا مهم جداً للكيبورد.

            إذا كان الحقل هو الذي كان عليه التركيز أصلاً،
            نعيده بعد انتهاء العملية.
            ====================================================
            */

            if (
                hadFocus &&
                messageInput &&
                document.activeElement !==
                    messageInput
            ) {
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

            resizeTextarea();

            /*
               لا نعمل scroll إضافي هنا.
               حتى لا نسبب حركة ثانية للـ viewport.
            */
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

        /*
           عند فتح الكيبورد:
           لا نعيد رسم الرسائل.
        */
        messageInput.addEventListener(
            "focus",
            () => {

                requestAnimationFrame(() => {

                    scrollToBottom(
                        "smooth"
                    );

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
