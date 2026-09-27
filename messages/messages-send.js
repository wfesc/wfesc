(() => {
    "use strict";

    /*
    ============================================================
       WFESC MESSAGES SEND
       النسخة المتوافقة مع Messages Core الجديد

       مسؤول عن:
       - إرسال الرسائل
       - ظهور الرسالة فوراً
       - منع الإرسال المكرر
       - منع إعادة تحميل الصفحة
       - Enter للإرسال
       - Shift + Enter لسطر جديد
       - الحفاظ على الكيبورد مفتوحاً
       - تحديث الرسالة المؤقتة بعد نجاح الإرسال
       - إيقاف جاري الكتابة عند الإرسال
       ============================================================
    */


    /* =========================================================
       CORE
    ========================================================= */

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
        document.getElementById(
            "messageForm"
        );


    const messageInput =
        document.getElementById(
            "messageInput"
        );


    const sendButton =
        document.getElementById(
            "sendButton"
        );


    const chatMessages =
        document.getElementById(
            "chatMessages"
        );


    /* =========================================================
       STATE
    ========================================================= */

    let isSending = false;


    /*
       يمنع تنفيذ أكثر من عملية إرسال
       لنفس النص في نفس اللحظة.
    */
    let sendLock = false;


    /* =========================================================
       KEYBOARD
    ========================================================= */

    function keepKeyboardOpen() {

        if (!messageInput) {
            return;
        }


        /*
           نعيد التركيز فقط إذا كان الحقل
           ما زال داخل المحادثة الحالية.
        */
        try {

            messageInput.focus({
                preventScroll: true
            });

        } catch (_) {

            try {

                messageInput.focus();

            } catch (_) {}
        }


        /*
           نطلب من محرك الكيبورد إعادة الحساب.
        */
        const keyboard =
            window.WFESC_MESSAGES_KEYBOARD;


        if (
            keyboard &&
            typeof keyboard.update ===
            "function"
        ) {

            setTimeout(
                () => {

                    keyboard.update();

                },
                30
            );

            setTimeout(
                () => {

                    keyboard.update();

                },
                150
            );
        }
    }


    /* =========================================================
       SCROLL
    ========================================================= */

    function scrollToBottom(
        behavior = "smooth"
    ) {

        if (!chatMessages) {
            return;
        }


        requestAnimationFrame(() => {

            const top =
                Math.max(
                    0,
                    chatMessages.scrollHeight -
                    chatMessages.clientHeight
                );


            if (
                typeof chatMessages.scrollTo ===
                "function"
            ) {

                chatMessages.scrollTo({
                    top,
                    behavior
                });

            } else {

                chatMessages.scrollTop =
                    top;
            }

        });
    }


    /* =========================================================
       TEXTAREA
    ========================================================= */

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


    /* =========================================================
       SENDING STATE
    ========================================================= */

    function setSendingState(
        state
    ) {

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


        if (messageInput) {

            messageInput.classList.toggle(
                "sending",
                isSending
            );
        }
    }


    /* =========================================================
       OPTIMISTIC MESSAGE
    ========================================================= */

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

            content:
                content,

            created_at:
                new Date().toISOString(),

            optimistic:
                true
        };
    }


    /* =========================================================
       RENDER OPTIMISTIC MESSAGE
    ========================================================= */

    function renderTemporaryMessage(
        message
    ) {

        if (!chatMessages) {
            return null;
        }


        /*
           إزالة رسالة "لا توجد رسائل".
        */
        const emptyState =
            chatMessages.querySelector(
                ".empty-state"
            );


        if (emptyState) {
            emptyState.remove();
        }


        let row =
            null;


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
                "WFESC: تعذر إنشاء الرسالة المؤقتة."
            );

            return null;
        }


        row.classList.add(
            "message-new",
            "optimistic"
        );


        row.dataset.optimisticId =
            String(message.id);


        /*
           Animation بسيطة للرسالة الجديدة.
        */
        try {

            row.animate(
                [
                    {
                        opacity: 0,
                        transform:
                            "translateY(8px) scale(.98)"
                    },
                    {
                        opacity: 1,
                        transform:
                            "translateY(0) scale(1)"
                    }
                ],
                {
                    duration: 180,
                    easing:
                        "ease-out"
                }
            );

        } catch (_) {}


        chatMessages.appendChild(
            row
        );


        /*
           تطبيق إعدادات الفقاعات.
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


        scrollToBottom(
            "smooth"
        );


        return row;
    }


    /* =========================================================
       EXTRACT SENT MESSAGE
    ========================================================= */

    function extractSentMessage(
        data
    ) {

        if (!data) {
            return null;
        }


        if (Array.isArray(data)) {

            return (
                data[0] ||
                null
            );
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

            return (
                data.data[0] ||
                null
            );
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
       CONFIRM OPTIMISTIC MESSAGE
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


        if (!sentMessage) {
            return;
        }


        const realId =
            sentMessage.id ??
            sentMessage.message_id;


        if (realId != null) {

            temporaryRow.dataset.messageId =
                String(realId);
        }


        /*
           تحديث الوقت.
        */
        const timeElement =
            temporaryRow.querySelector(
                ".message-time"
            );


        const createdAt =
            sentMessage.created_at ||
            sentMessage.sent_at;


        if (
            timeElement &&
            createdAt
        ) {

            const date =
                new Date(
                    createdAt
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


    /* =========================================================
       REMOVE TYPING
    ========================================================= */

    function stopTyping() {

        try {

            if (
                typeof core.stopTyping ===
                "function"
            ) {

                core.stopTyping();
            }

        } catch (error) {

            console.warn(
                "WFESC stop typing:",
                error
            );
        }
    }


    /* =========================================================
       SEND
    ========================================================= */

    async function sendCurrentMessage() {

        /*
           حماية إضافية ضد الإرسال المكرر.
        */
        if (
            isSending ||
            sendLock
        ) {

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
                "WFESC: لا يوجد مستخدم مسجل الدخول."
            );

            return;
        }


        if (!conversationId) {

            console.warn(
                "WFESC: لم يتم فتح محادثة."
            );

            return;
        }


        const originalContent =
            messageInput.value
                .replace(/\r\n/g, "\n")
                .trim();


        if (!originalContent) {
            return;
        }


        const sendingConversationId =
            conversationId;


        /*
           هل كان المستخدم داخل حقل الكتابة؟
        */
        const hadFocus =
            document.activeElement ===
            messageInput;


        /*
           قفل الإرسال.
        */
        sendLock =
            true;


        setSendingState(
            true
        );


        /*
        ========================================================
           1. إيقاف جاري الكتابة
        ========================================================
        */

        stopTyping();


        /*
        ========================================================
           2. إنشاء الرسالة فوراً
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
           3. تفريغ الحقل فوراً
        ========================================================
        */

        messageInput.value =
            "";


        resizeTextarea();


        /*
        ========================================================
           4. إرسال إلى Supabase
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
               التأكد أن المستخدم ما زال في نفس المحادثة
            ====================================================
            */

            const currentConversation =
                core.getCurrentConversation();


            if (
                String(
                    currentConversation
                ) !==
                String(
                    sendingConversationId
                )
            ) {

                return;
            }


            /*
            ====================================================
               استخراج الرسالة الحقيقية
            ====================================================
            */

            const sentMessage =
                extractSentMessage(
                    data
                );


            /*
            ====================================================
               تأكيد الرسالة الموجودة أصلاً
               لا نعيد رسم المحادثة.
            ====================================================
            */

            confirmTemporaryMessage(
                temporaryRow,
                sentMessage
            );


            /*
            ====================================================
               تحديث القائمة محلياً إذا كان لدينا
               آخر وقت/رسالة.
            ====================================================
            */

            if (
                sentMessage &&
                typeof core.getConversations ===
                "function"
            ) {

                /*
                   Realtime سيحدث قائمة المحادثات
                   عند وصول INSERT.
                   لا نحتاج إعادة تحميل كاملة.
                */
            }


            /*
            ====================================================
               التأكد من بقاء الرسالة في الأسفل
            ====================================================
            */

            scrollToBottom(
                "smooth"
            );


        } catch (error) {

            console.error(
                "WFESC send message error:",
                error
            );


            /*
            ====================================================
               فشل الإرسال:
               نحذف النسخة المؤقتة
            ====================================================
            */

            if (temporaryRow) {

                try {

                    temporaryRow.animate(
                        [
                            {
                                opacity: 1,
                                transform:
                                    "translateX(0)"
                            },
                            {
                                opacity: 0,
                                transform:
                                    "translateX(8px)"
                            }
                        ],
                        {
                            duration: 150,
                            easing:
                                "ease-in"
                        }
                    ).finished
                    .then(() => {

                        temporaryRow.remove();

                    })
                    .catch(() => {

                        temporaryRow.remove();

                    });

                } catch (_) {

                    temporaryRow.remove();
                }
            }


            /*
               إعادة النص حتى لا يضيع.
            */
            messageInput.value =
                originalContent;


            resizeTextarea();


            /*
               اهتزاز خفيف عند الخطأ.
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
                                "translateX(-3px)"
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
        }


        /* =====================================================
           FINALLY
        ===================================================== */

        finally {

            setSendingState(
                false
            );


            sendLock =
                false;


            resizeTextarea();


            /*
            ====================================================
               الحفاظ على الكيبورد
            ====================================================
            */

            if (hadFocus) {

                requestAnimationFrame(
                    () => {

                        keepKeyboardOpen();

                    }
                );


                /*
                   Android أحياناً يحتاج تأخير إضافي
                   بعد انتهاء RPC.
                */
                setTimeout(
                    () => {

                        keepKeyboardOpen();

                    },
                    80
                );


                setTimeout(
                    () => {

                        keepKeyboardOpen();

                    },
                    220
                );
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

                /*
                   مهم جداً:
                   preventDefault أول شيء حتى لا يقوم
                   المتصفح بإعادة تحميل الصفحة.
                */
                event.preventDefault();


                event.stopPropagation();


                sendCurrentMessage();
            }
        );
    }


    /* =========================================================
       INPUT
    ========================================================= */

    if (messageInput) {

        /*
           تغيير حجم حقل الكتابة.
        */
        messageInput.addEventListener(
            "input",
            () => {

                resizeTextarea();

            }
        );


        /*
           Enter = إرسال
           Shift + Enter = سطر جديد
        */
        messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();


                    event.stopPropagation();


                    sendCurrentMessage();

                }
            }
        );


        /*
           عند التركيز:
           تحديث الكيبورد والتمرير.
        */
        messageInput.addEventListener(
            "focus",
            () => {

                requestAnimationFrame(
                    () => {

                        scrollToBottom(
                            "smooth"
                        );


                        const keyboard =
                            window.WFESC_MESSAGES_KEYBOARD;


                        if (
                            keyboard &&
                            typeof keyboard.update ===
                            "function"
                        ) {

                            keyboard.update();
                        }

                    }
                );
            }
        );
    }


    /* =========================================================
       SEND BUTTON
    ========================================================= */

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            event => {

                /*
                   حماية إذا الزر استُخدم خارج form.
                */
                event.preventDefault();


                if (
                    !isSending &&
                    !sendLock
                ) {

                    sendCurrentMessage();
                }
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
