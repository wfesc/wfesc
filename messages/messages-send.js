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
    - Shift + Enter لسطر جديد
    - الإضافة الفورية بدون Refresh
    - الحفاظ على المحادثة مفتوحة
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


        /*
           لا نعطل حقل الكتابة أثناء الإرسال.

           هذا يسمح للمستخدم بكتابة الرسالة التالية
           مباشرة، لكن زر الإرسال يبقى محميًا من التكرار.
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


        /*
           نستخدم Core لإنشاء نفس شكل الرسائل الحقيقي.
           هذا يضمن أن إعدادات الفقاعات تنطبق أيضًا
           على الرسالة المؤقتة.
        */
        let row = null;


        if (
            typeof core.createMessageElement ===
            "function"
        ) {

            row =
                core.createMessageElement(
                    message
                );

        } else {

            /*
               Fallback احتياطي إذا Core قديم.
            */

            row =
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
        }


        row.classList.add(
            "message-new",
            "optimistic"
        );


        chatMessages.appendChild(
            row
        );


        /*
           تطبيق إعدادات الفقاعات فورًا.
        */
        if (
            typeof core.applyMessageSettings ===
            "function"
        ) {

            core.applyMessageSettings();
        }


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

            if (
                Array.isArray(
                    data.data
                )
            ) {

                return (
                    data.data[0] ||
                    null
                );
            }


            return data.data;
        }


        return data;
    }


    function removeTemporaryMessage(
        temporaryRow
    ) {

        if (!temporaryRow) {
            return;
        }


        if (
            typeof temporaryRow.animate ===
            "function"
        ) {

            try {

                temporaryRow.animate(
                    [
                        {
                            opacity: 1,
                            transform:
                                "translateY(0)"
                        },
                        {
                            opacity: 0,
                            transform:
                                "translateY(5px)"
                        }
                    ],
                    {
                        duration: 160,
                        easing: "ease"
                    }
                );

            } catch (error) {

                console.warn(
                    "WFESC temporary animation:",
                    error
                );
            }
        }


        setTimeout(
            () => {

                temporaryRow.remove();

            },
            170
        );
    }


    /* =========================================================
       SEND
    ========================================================= */

    async function sendCurrentMessage() {

        /*
           منع الإرسال المكرر.
        */
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
        نحفظ النص قبل المسح.
        --------------------------------------------------------
        */

        const originalContent =
            content;


        /*
        --------------------------------------------------------
        نثبت رقم المحادثة.
        إذا تغيرت المحادثة أثناء الإرسال،
        لن نضيف النتيجة للمحادثة الخطأ.
        --------------------------------------------------------
        */

        const sendingConversationId =
            conversationId;


        setSendingState(true);


        /*
        --------------------------------------------------------
        رسالة مؤقتة تظهر فورًا.
        --------------------------------------------------------
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
        --------------------------------------------------------
        نفرغ مربع الكتابة مباشرة.
        --------------------------------------------------------
        */

        messageInput.value =
            "";


        resizeTextarea();


        try {

            /*
            ====================================================
            SEND RPC

            نفس RPC الأصلي بدون تغيير.
            ====================================================
            */

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
            تحقق من أن المستخدم ما زال داخل نفس المحادثة.
            ====================================================
            */

            const stillSameConversation =
                String(
                    core.getCurrentConversation()
                ) === String(
                    sendingConversationId
                );


            /*
            ====================================================
            الرسالة المؤقتة انتهى دورها.
            ====================================================
            */

            if (temporaryRow) {

                temporaryRow.classList.remove(
                    "optimistic"
                );


                temporaryRow.dataset.confirmed =
                    "true";
            }


            /*
            ====================================================
            الرسالة الحقيقية من Supabase.
            
            لا نعيد تحميل كامل المحادثة.
            ====================================================
            */

            const sentMessage =
                extractSentMessage(
                    data
                );


            if (
                sentMessage &&
                stillSameConversation &&
                typeof core.addMessageToCurrentConversation ===
                    "function"
            ) {

                /*
                   نحذف المؤقت أولاً.
                */
                if (temporaryRow) {

                    temporaryRow.remove();
                }


                core.addMessageToCurrentConversation(
                    sentMessage,
                    {
                        conversationId:
                            sendingConversationId,

                        appendOnly:
                            true,

                        scroll:
                            true
                    }
                );

            } else {

                /*
                   إذا الـRPC لم يرجع الرسالة نفسها،
                   نبقي الرسالة المؤقتة ظاهرة بدل
                   إعادة تحميل المحادثة كاملة.
                */

                if (temporaryRow) {

                    temporaryRow.classList.remove(
                        "message-new"
                    );

                    temporaryRow.classList.remove(
                        "optimistic"
                    );
                }
            }


            /*
            ====================================================
            تطبيق إعدادات الفقاعات مرة أخيرة.
            ====================================================
            */

            if (
                typeof core.applyMessageSettings ===
                "function"
            ) {

                core.applyMessageSettings();
            }


            /*
            ====================================================
            الحفاظ على آخر الرسائل.
            ====================================================
            */

            requestAnimationFrame(
                () => {

                    if (
                        stillSameConversation
                    ) {

                        scrollToBottom(
                            "smooth"
                        );
                    }
                }
            );


            /*
            ====================================================
            Log فقط.
            ====================================================
            */

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
            إزالة الرسالة المؤقتة.
            ----------------------------------------------------
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
                                    "translateX(20px)"
                            }
                        ],
                        {
                            duration: 220,
                            easing: "ease"
                        }
                    );

                } catch (animationError) {

                    console.warn(
                        "WFESC send animation:",
                        animationError
                    );
                }


                setTimeout(
                    () => {

                        temporaryRow.remove();

                    },
                    220
                );
            }


            /*
            ----------------------------------------------------
            إعادة النص للمستخدم.
            ----------------------------------------------------
            */

            messageInput.value =
                originalContent;


            resizeTextarea();


            /*
            ----------------------------------------------------
            تنبيه بصري بسيط.
            ----------------------------------------------------
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

            } catch (animationError) {

                console.warn(
                    "WFESC input animation:",
                    animationError
                );
            }


        } finally {

            setSendingState(false);


            /*
               إبقاء المؤشر داخل مربع الكتابة
               بدون إغلاق المحادثة.
            */
            if (
                messageInput &&
                document.activeElement !==
                    messageInput
            ) {

                try {

                    messageInput.focus();

                } catch (error) {

                    console.warn(
                        "WFESC focus:",
                        error
                    );
                }
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

                /*
                ================================================
                Enter = إرسال
                Shift + Enter = سطر جديد
                ================================================
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
