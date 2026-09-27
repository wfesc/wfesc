(() => {
    "use strict";

    /*
    ============================================================
    WFESC MESSAGES SEND
    مسؤول عن:
    - كتابة الرسالة
    - تعديل ارتفاع مربع الكتابة
    - الإرسال
    - منع الإرسال المكرر
    - حالة الإرسال
    - Enter للإرسال
    - إعادة تحميل الرسائل بعد الإرسال
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


    /* =========================================================
       HELPERS
    ========================================================= */

    function scrollToBottom(
        behavior = "smooth"
    ) {

        if (!chatMessages) {
            return;
        }

        chatMessages.scrollTo({
            top:
                chatMessages.scrollHeight,
            behavior
        });
    }


    function resizeTextarea() {

        if (!messageInput) {
            return;
        }

        messageInput.style.height =
            "auto";

        const maxHeight = 100;

        const nextHeight =
            Math.min(
                messageInput.scrollHeight,
                maxHeight
            );

        messageInput.style.height =
            `${nextHeight}px`;
    }


    function setSendingState(
        state
    ) {

        isSending = Boolean(state);


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

            messageInput.disabled =
                isSending;
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
            return;
        }


        const emptyState =
            chatMessages.querySelector(
                ".empty-state"
            );


        if (emptyState) {
            emptyState.remove();
        }


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "message-row mine message-new optimistic";


        row.dataset.messageId =
            String(message.id);


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "message-bubble";


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "message-content";


        content.textContent =
            message.content;


        const time =
            document.createElement(
                "div"
            );


        time.className =
            "message-time";


        time.textContent =
            new Date(
                message.created_at
            ).toLocaleTimeString(
                "ar-IQ",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );


        bubble.appendChild(
            content
        );

        bubble.appendChild(
            time
        );

        row.appendChild(
            bubble
        );


        chatMessages.appendChild(
            row
        );


        scrollToBottom(
            "smooth"
        );


        return row;
    }


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
            typeof data.data ===
                "object"
        ) {

            if (Array.isArray(data.data)) {
                return (
                    data.data[0] ||
                    null
                );
            }

            return data.data;
        }


        return data;
    }


    /* =========================================================
       SEND
    ========================================================= */

    async function sendCurrentMessage() {

        if (isSending) {
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


        if (!messageInput) {
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
        --------------------------------------------------------
        نحفظ النص قبل المسح حتى نرجعه في حال فشل الإرسال
        --------------------------------------------------------
        */

        const originalContent =
            content;


        setSendingState(true);


        /*
        --------------------------------------------------------
        رسالة مؤقتة
        --------------------------------------------------------
        */

        const optimistic =
            createOptimisticMessage(
                content,
                user.id
            );


        const temporaryRow =
            renderTemporaryMessage(
                optimistic
            );


        /*
        --------------------------------------------------------
        نفرغ مربع الكتابة مباشرة
        --------------------------------------------------------
        */

        messageInput.value =
            "";

        resizeTextarea();


        try {

            /*
            ====================================================
            SEND RPC
            ====================================================
            */

            const {
                data,
                error
            } = await core.client.rpc(
                "send_message",
                {
                    target_conversation_id:
                        conversationId,

                    message_content:
                        originalContent
                }
            );


            if (error) {

                throw error;
            }


            /*
            ====================================================
            حذف الرسالة المؤقتة
            ====================================================
            */

            if (temporaryRow) {

                temporaryRow.remove();
            }


            /*
            ====================================================
            نعيد تحميل القائمة من قاعدة البيانات مرة واحدة.
            
            هذا يمنع ظهور الرسالة مرتين قبل إضافة Realtime.
            ====================================================
            */

            await core.loadConversationMessages();


            /*
            ====================================================
            نرجع إلى آخر الرسائل
            ====================================================
            */

            requestAnimationFrame(
                () => {

                    scrollToBottom(
                        "smooth"
                    );
                }
            );


            /*
            ====================================================
            تحديث قائمة المحادثات لاحقاً
            ====================================================
            */

            const sentMessage =
                extractSentMessage(
                    data
                );


            if (sentMessage) {

                console.log(
                    "WFESC message sent:",
                    sentMessage
                );
            }


        } catch (error) {

            console.error(
                "WFESC send message error:",
                error
            );


            /*
            ----------------------------------------------------
            إزالة الرسالة المؤقتة
            ----------------------------------------------------
            */

            if (temporaryRow) {

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
                                "translateX(20px)"
                        }
                    ],
                    {
                        duration:220,
                        easing:
                            "ease"
                    }
                );


                setTimeout(
                    () => {

                        temporaryRow.remove();

                    },
                    220
                );
            }


            /*
            ----------------------------------------------------
            إعادة النص للمستخدم
            ----------------------------------------------------
            */

            messageInput.value =
                originalContent;

            resizeTextarea();


            /*
            ----------------------------------------------------
            تنبيه بصري بسيط
            ----------------------------------------------------
            */

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
                    duration:240
                }
            );

        } finally {

            setSendingState(false);

            messageInput.focus();
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

                /*
                Enter = إرسال
                Shift + Enter = سطر جديد
                */

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

                requestAnimationFrame(
                    () => {
                        scrollToBottom(
                            "smooth"
                        );
                    }
                );
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
