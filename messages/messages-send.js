/* =========================================================
   WFESC MESSAGES SEND
   File: messages/messages-send.js

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
   - حماية RPC + Realtime من التكرار
   - منع إعادة optimistic بعد تأكيد الرسالة
   - منع الإرسال عند وجود حظر
   - إظهار خطأ الحظر بجانب الرسالة
   ========================================================= */

(() => {
    "use strict";


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
       BLOCK MODULE
       ========================================================= */

    const block =
        window.WFESC_MESSAGES_BLOCK;


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

    let sendLock = false;


    /* =========================================================
       BLOCK ERROR TIMERS
       ========================================================= */

    const blockErrorTimers =
        new WeakMap();


    /* =========================================================
       KEYBOARD
       ========================================================= */

    function keepKeyboardOpen() {

        if (!messageInput) {
            return;
        }


        try {

            messageInput.focus({
                preventScroll: true
            });

        } catch (_) {

            try {

                messageInput.focus();

            } catch (_) {}
        }


        const keyboard =
            window.WFESC_MESSAGES_KEYBOARD;


        if (
            keyboard &&
            typeof keyboard.update ===
            "function"
        ) {

            setTimeout(
                () => {

                    try {
                        keyboard.update();
                    } catch (_) {}

                },
                30
            );


            setTimeout(
                () => {

                    try {
                        keyboard.update();
                    } catch (_) {}

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
       GET CURRENT CONTACT ID
       ========================================================= */

    function getCurrentContactId() {

        try {

            if (
                typeof core.getCurrentContact ===
                "function"
            ) {

                const contact =
                    core.getCurrentContact();


                if (contact) {

                    return (
                        contact.id ??
                        contact.user_id ??
                        contact.uid ??
                        null
                    );
                }
            }

        } catch (error) {

            console.warn(
                "WFESC SEND: getCurrentContact error:",
                error
            );
        }


        return null;
    }


    /* =========================================================
       BLOCK STATUS
       ========================================================= */

    async function getBlockState(
        contactId
    ) {

        if (
            !block ||
            !contactId
        ) {

            return {
                blocked: false,
                blockedBy: false
            };
        }


        let blocked = false;
        let blockedBy = false;


        try {

            if (
                typeof block.isBlocked ===
                "function"
            ) {

                blocked =
                    await block.isBlocked(
                        contactId
                    );
            }

        } catch (error) {

            console.warn(
                "WFESC SEND: isBlocked error:",
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
                        contactId
                    );
            }

        } catch (error) {

            console.warn(
                "WFESC SEND: isBlockedBy error:",
                error
            );
        }


        return {
            blocked: Boolean(blocked),
            blockedBy: Boolean(blockedBy)
        };
    }


    /* =========================================================
       BLOCK ERROR TEXT
       ========================================================= */

    function getBlockErrorText(
        state
    ) {

        if (
            state &&
            state.blockedBy
        ) {

            return "تعذر الإرسال لأن المستخدم قام بحظرك";
        }


        if (
            state &&
            state.blocked
        ) {

            return "تعذر الإرسال لأنك قمت بحظر المستخدم";
        }


        return "تعذر إرسال الرسالة";
    }


    /* =========================================================
       CREATE OPTIMISTIC MESSAGE
       ========================================================= */

    function createOptimisticMessage(
        content,
        userId
    ) {

        return {

            /*
               هذا ID مؤقت للواجهة فقط.
               لا نرسله إلى Supabase.
            */

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


        const emptyState =
            chatMessages.querySelector(
                ".empty-state"
            );


        if (emptyState) {
            emptyState.remove();
        }


        let row = null;


        if (
            typeof core.addMessageToCurrentConversation ===
            "function"
        ) {

            try {

                const result =
                    core.addMessageToCurrentConversation(
                        message,
                        {
                            appendOnly: true,
                            optimistic: true,
                            scroll: false
                        }
                    );


                if (
                    result &&
                    result.nodeType === 1
                ) {

                    row = result;
                }

            } catch (error) {

                console.warn(
                    "WFESC optimistic core add:",
                    error
                );
            }
        }


        if (!row) {

            if (
                typeof core.createMessageElement ===
                "function"
            ) {

                try {

                    row =
                        core.createMessageElement(
                            message
                        );

                } catch (error) {

                    console.warn(
                        "WFESC createMessageElement:",
                        error
                    );
                }
            }
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


        row.dataset.optimistic =
            "true";


        row.dataset.optimisticId =
            String(message.id);


        if (
            message.sender_id != null
        ) {

            row.dataset.senderId =
                String(message.sender_id);
        }


        if (
            message.content != null
        ) {

            row.dataset.content =
                String(message.content);
        }


        if (
            message.created_at
        ) {

            row.dataset.messageTime =
                String(message.created_at);
        }


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


        if (
            !row.parentElement
        ) {

            chatMessages.appendChild(
                row
            );
        }


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
       BLOCK ERROR INDICATOR
       ========================================================= */

    function addBlockErrorIndicator(
        row,
        errorText
    ) {

        if (!row) {
            return;
        }


        /*
           إزالة خطأ قديم من نفس الرسالة.
        */

        const oldError =
            row.querySelector(
                ".wfesc-message-send-error"
            );


        if (oldError) {
            oldError.remove();
        }


        row.classList.add(
            "wfesc-message-send-failed"
        );


        row.dataset.sendFailed =
            "true";


        row.dataset.sendError =
            errorText;


        /*
        ========================================================
           الحاوية الرئيسية
        ========================================================
        */

        const errorContainer =
            document.createElement(
                "div"
            );


        errorContainer.className =
            "wfesc-message-send-error";


        errorContainer.setAttribute(
            "role",
            "alert"
        );


        /*
        ========================================================
           الدائرة الحمراء
        ========================================================
        */

        const errorIcon =
            document.createElement(
                "span"
            );


        errorIcon.className =
            "wfesc-message-send-error-icon";


        errorIcon.textContent =
            "!";


        /*
        ========================================================
           نص الخطأ
        ========================================================
        */

        const errorTextElement =
            document.createElement(
                "span"
            );


        errorTextElement.className =
            "wfesc-message-send-error-text";


        errorTextElement.textContent =
            errorText;


        errorContainer.appendChild(
            errorIcon
        );


        errorContainer.appendChild(
            errorTextElement
        );


        /*
        ========================================================
           محاولة وضع الخطأ أسفل/بجانب الرسالة
        ========================================================
        */

        const messageBubble =
            row.querySelector(
                ".message-bubble, .bubble, .message-content"
            );


        if (messageBubble) {

            messageBubble.appendChild(
                errorContainer
            );

        } else {

            row.appendChild(
                errorContainer
            );
        }


        /*
        ========================================================
           CSS مباشر
        ========================================================
        */

        Object.assign(
            errorContainer.style,
            {
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "7px",
                direction: "rtl",
                fontSize: "12px",
                lineHeight: "1.4",
                maxWidth: "100%",
                opacity: "1",
                transition:
                    "opacity .25s ease, transform .25s ease"
            }
        );


        Object.assign(
            errorIcon.style,
            {
                width: "22px",
                height: "22px",
                minWidth: "22px",
                borderRadius: "50%",
                background: "#e53935",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "14px",
                lineHeight: "1",
                boxSizing: "border-box",
                boxShadow:
                    "0 0 0 2px rgba(229,57,53,.14)"
            }
        );


        Object.assign(
            errorTextElement.style,
            {
                color: "#ff6b6b",
                fontWeight: "600",
                wordBreak: "break-word"
            }
        );


        /*
        ========================================================
           ظهور سريع
        ========================================================
        */

        try {

            errorContainer.animate(
                [
                    {
                        opacity: 0,
                        transform:
                            "translateY(4px)"
                    },
                    {
                        opacity: 1,
                        transform:
                            "translateY(0)"
                    }
                ],
                {
                    duration: 180,
                    easing: "ease-out"
                }
            );

        } catch (_) {}


        /*
        ========================================================
           إزالة الخطأ بعد 3 ثواني
        ========================================================
        */

        const previousTimer =
            blockErrorTimers.get(
                row
            );


        if (previousTimer) {

            clearTimeout(
                previousTimer
            );
        }


        const timer =
            setTimeout(
                () => {

                    if (
                        !errorContainer ||
                        !errorContainer.isConnected
                    ) {

                        return;
                    }


                    errorContainer.style.opacity =
                        "0";


                    errorContainer.style.transform =
                        "translateY(4px)";


                    setTimeout(
                        () => {

                            if (
                                errorContainer &&
                                errorContainer.isConnected
                            ) {

                                errorContainer.remove();
                            }


                            /*
                               نترك الرسالة نفسها ظاهرة
                               داخل المحادثة.
                            */

                            row.classList.remove(
                                "wfesc-message-send-failed"
                            );


                            row.dataset.sendFailed =
                                "false";


                            row.removeAttribute(
                                "data-send-error"
                            );

                        },
                        250
                    );

                },
                3000
            );


        blockErrorTimers.set(
            row,
            timer
        );


        /*
        ========================================================
           اهتزاز خفيف للرسالة
        ========================================================
        */

        try {

            row.animate(
                [
                    {
                        transform:
                            "translateX(0)"
                    },
                    {
                        transform:
                            "translateX(-3px)"
                    },
                    {
                        transform:
                            "translateX(3px)"
                    },
                    {
                        transform:
                            "translateX(-2px)"
                    },
                    {
                        transform:
                            "translateX(0)"
                    }
                ],
                {
                    duration: 220
                }
            );

        } catch (_) {}


        scrollToBottom(
            "smooth"
        );
    }


    /* =========================================================
       SHOW BLOCKED MESSAGE
       ========================================================= */

    function showBlockedSendMessage(
        content,
        userId,
        errorText
    ) {

        const failedMessage =
            createOptimisticMessage(
                content,
                userId
            );


        failedMessage.send_failed =
            true;


        failedMessage.blocked =
            true;


        const row =
            renderTemporaryMessage(
                failedMessage
            );


        if (!row) {
            return null;
        }


        row.classList.add(
            "send-failed",
            "blocked-send"
        );


        row.dataset.sendFailed =
            "true";


        row.dataset.blocked =
            "true";


        addBlockErrorIndicator(
            row,
            errorText
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


        /*
           إذا Core أكد الرسالة بالفعل،
           لا نلمس العنصر.
        */

        if (
            temporaryRow.dataset.confirmed ===
            "true"
        ) {

            return;
        }


        temporaryRow.classList.add(
            "optimistic"
        );


        temporaryRow.dataset.optimistic =
            "true";


        if (sentMessage) {

            const realId =
                sentMessage.id ??
                sentMessage.message_id;


            if (realId != null) {

                temporaryRow.dataset.messageId =
                    String(realId);
            }


            const senderId =
                sentMessage.sender_id ??
                sentMessage.user_id;


            if (senderId != null) {

                temporaryRow.dataset.senderId =
                    String(senderId);
            }


            const content =
                sentMessage.content ??
                sentMessage.message ??
                null;


            if (content != null) {

                temporaryRow.dataset.content =
                    String(content);
            }


            const createdAt =
                sentMessage.created_at ||
                sentMessage.sent_at;


            if (createdAt) {

                temporaryRow.dataset.messageTime =
                    String(createdAt);


                const timeElement =
                    temporaryRow.querySelector(
                        ".message-time"
                    );


                if (
                    timeElement
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
       REMOVE FAILED MESSAGE
       ========================================================= */

    function removeTemporaryMessage(
        temporaryRow
    ) {

        if (!temporaryRow) {
            return;
        }


        try {

            const animation =
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
                );


            if (
                animation &&
                animation.finished
            ) {

                animation.finished
                    .then(() => {

                        if (
                            temporaryRow &&
                            temporaryRow.isConnected
                        ) {

                            temporaryRow.remove();
                        }

                    })
                    .catch(() => {

                        if (
                            temporaryRow &&
                            temporaryRow.isConnected
                        ) {

                            temporaryRow.remove();
                        }
                    });

            } else {

                temporaryRow.remove();
            }

        } catch (_) {

            try {
                temporaryRow.remove();
            } catch (_) {}
        }
    }


    /* =========================================================
       SEND
       ========================================================= */

    async function sendCurrentMessage() {

        /*
           حماية من الإرسال المكرر.
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


        const hadFocus =
            document.activeElement ===
            messageInput;


        /*
        ========================================================
           قفل الإرسال
        ========================================================
        */

        sendLock =
            true;


        setSendingState(
            true
        );


        /*
        ========================================================
           إيقاف جاري الكتابة
        ========================================================
        */

        stopTyping();


        /*
        ========================================================
           فحص الحظر قبل إنشاء Optimistic عادي
        ========================================================
        */

        try {

            const contactId =
                getCurrentContactId();


            /*
             * FIX:
             * كان ناقصاً القوس ) هنا.
             */

            if (
                block &&
                contactId
            ) {

                const blockState =
                    await getBlockState(
                        contactId
                    );


                /*
                ==================================================
                   المستخدم قام بحظر الطرف الآخر
                ==================================================
                */

                if (
                    blockState.blocked ||
                    blockState.blockedBy
                ) {

                    const errorText =
                        getBlockErrorText(
                            blockState
                        );


                    /*
                       نظهر الرسالة داخل المحادثة
                       لكن لا نرسلها إلى Supabase.
                    */

                    showBlockedSendMessage(
                        originalContent,
                        user.id,
                        errorText
                    );


                    /*
                       نفرغ الحقل لأن محاولة الإرسال
                       تمت بالفعل.
                    */

                    messageInput.value =
                        "";


                    resizeTextarea();


                    /*
                       لا يوجد RPC هنا.
                       لا يتم حفظ محاولة الإرسال
                       كرسالة حقيقية.
                    */

                    return;
                }
            }

        } catch (error) {

            /*
            ====================================================
               إذا فشل فحص الحظر بسبب مشكلة تقنية،
               لا نمنع الرسالة من الإرسال بشكل عشوائي.
               نترك RPC يقوم بالتحقق النهائي أيضاً.
            ====================================================
            */

            console.warn(
                "WFESC SEND: block check failed:",
                error
            );
        }


        /*
        ========================================================
           إنشاء الرسالة المؤقتة
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
           تفريغ الحقل فوراً
        ========================================================
        */

        messageInput.value =
            "";


        resizeTextarea();


        /*
        ========================================================
           إرسال إلى Supabase
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

                /*
                ==================================================
                   حماية إضافية:
                   إذا رفض RPC الإرسال بسبب الحظر،
                   نعرض نفس واجهة الخطأ.
                ==================================================
                */

                const errorString =
                    String(
                        error.message ||
                        error.details ||
                        error.hint ||
                        ""
                    ).toLowerCase();


                const isBlockError =
                    errorString.includes(
                        "block"
                    ) ||
                    errorString.includes(
                        "blocked"
                    ) ||
                    errorString.includes(
                        "حظر"
                    ) ||
                    errorString.includes(
                        "محظور"
                    );


                if (
                    isBlockError
                ) {

                    const blockErrorText =
                        errorString.includes(
                            "حظر"
                        ) ||
                        errorString.includes(
                            "محظور"
                        ) ||
                        errorString.includes(
                            "blocked"
                        )
                            ? "تعذر الإرسال لأن المستخدم قام بحظرك"
                            : "تعذر إرسال الرسالة";


                    /*
                       إزالة optimistic الفاشلة
                       واستبدالها برسالة فشل واضحة.
                    */

                    removeTemporaryMessage(
                        temporaryRow
                    );


                    setTimeout(
                        () => {

                            showBlockedSendMessage(
                                originalContent,
                                user.id,
                                blockErrorText
                            );

                        },
                        160
                    );


                    messageInput.value =
                        "";


                    resizeTextarea();


                    return;
                }


                throw error;
            }


            /*
            =====================================================
               التأكد أن المستخدم ما زال داخل نفس المحادثة
            =====================================================
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
            =====================================================
               استخراج الرسالة الحقيقية
            =====================================================
            */

            const sentMessage =
                extractSentMessage(
                    data
                );


            /*
            =====================================================
               تأكيد الرسالة المؤقتة
            =====================================================
            */

            confirmTemporaryMessage(
                temporaryRow,
                sentMessage
            );


            /*
            =====================================================
               التمرير
            =====================================================
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
            =====================================================
               حذف الرسالة المؤقتة عند الفشل
            =====================================================
            */

            removeTemporaryMessage(
                temporaryRow
            );


            /*
            =====================================================
               إعادة النص حتى لا يضيع
            =====================================================
            */

            messageInput.value =
                originalContent;


            resizeTextarea();


            /*
            =====================================================
               اهتزاز خفيف عند الخطأ
            =====================================================
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


    console.log(
        "WFESC SEND: module loaded"
    );

})();
