(() => {
    "use strict";

    /*
    ============================================================
    WFESC MESSAGES KEYBOARD
    النسخة الأولى

    مسؤول عن:
    - اكتشاف ارتفاع كيبورد الهاتف
    - مراقبة visualViewport
    - تحريك منطقة الكتابة فوق الكيبورد
    - المحافظة على حقل الكتابة داخل الشاشة
    - توفير API لملف messages-send.js
    - عدم إعادة رسم الرسائل
    - عدم تغيير منطق إرسال الرسائل
    ============================================================
    */

    const messageInput =
        document.getElementById("messageInput");

    const messageForm =
        document.getElementById("messageForm");

    const chatMessages =
        document.getElementById("chatMessages");

    /*
       نحاول العثور على منطقة الإدخال.
       إذا كان عندك عنصر محدد لاحقاً نضيف ID له بسهولة.
    */
    const inputArea =
        document.getElementById("messageInputArea") ||
        document.getElementById("chatInputArea") ||
        messageForm;

    if (!messageInput) {
        console.warn(
            "WFESC Keyboard: messageInput غير موجود."
        );
        return;
    }

    /* =========================================================
       STATE
    ========================================================= */

    let keyboardHeight = 0;

    let keyboardVisible = false;

    let lastViewportHeight =
        window.innerHeight;

    let initialized = false;

    let keepKeyboardRequested = false;

    /* =========================================================
       HELPERS
    ========================================================= */

    function getViewport() {
        return window.visualViewport || null;
    }

    function getKeyboardHeight() {

        const viewport =
            getViewport();

        if (!viewport) {
            return 0;
        }

        const windowHeight =
            window.innerHeight;

        const viewportHeight =
            viewport.height;

        const viewportTop =
            viewport.offsetTop || 0;

        /*
           المساحة التي اختفت من نافذة العرض.
        */
        const calculatedHeight =
            windowHeight -
            viewportHeight -
            viewportTop;

        /*
           نتجنب القيم السالبة.
        */
        return Math.max(
            0,
            Math.round(calculatedHeight)
        );
    }

    function detectKeyboard() {

        const previousHeight =
            keyboardHeight;

        keyboardHeight =
            getKeyboardHeight();

        /*
           نعتبر الكيبورد مفتوحاً إذا اختفى جزء
           واضح من نافذة العرض.
        */
        keyboardVisible =
            keyboardHeight > 80;

        /*
           نخزن القيم على الصفحة حتى يمكن استعمالها
           أيضاً من CSS إذا احتجنا ذلك.
        */
        document.documentElement.style.setProperty(
            "--wfesc-keyboard-height",
            `${keyboardHeight}px`
        );

        document.documentElement.style.setProperty(
            "--wfesc-keyboard-visible",
            keyboardVisible
                ? "1"
                : "0"
        );

        /*
           إذا تغير ارتفاع الكيبورد،
           نعيد ضبط مكان منطقة الإدخال.
        */
        if (
            previousHeight !==
            keyboardHeight
        ) {
            updateInputPosition();
        }
    }

    function updateInputPosition() {

        if (!inputArea) {
            return;
        }

        /*
           لا نحرك منطقة الإدخال إذا الكيبورد مغلق.
        */
        if (!keyboardVisible) {

            inputArea.style.removeProperty(
                "bottom"
            );

            inputArea.style.removeProperty(
                "transform"
            );

            return;
        }

        /*
           نحرك المنطقة فوق الكيبورد مباشرة.
        */
        inputArea.style.bottom =
            `${keyboardHeight}px`;

        inputArea.style.transform =
            "translateY(0)";

        /*
           نطلب من المتصفح إعادة الرسم.
        */
        requestAnimationFrame(() => {

            ensureInputVisible();

        });
    }

    function ensureInputVisible() {

        if (
            !messageInput ||
            !keyboardVisible
        ) {
            return;
        }

        const viewport =
            getViewport();

        if (!viewport) {
            return;
        }

        const rect =
            messageInput.getBoundingClientRect();

        const visibleBottom =
            viewport.height +
            viewport.offsetTop;

        /*
           إذا نزل الحقل تحت حدود الشاشة،
           نرفعه قليلاً.
        */
        if (
            rect.bottom >
            visibleBottom
        ) {

            const difference =
                rect.bottom -
                visibleBottom;

            if (inputArea) {

                const currentBottom =
                    parseFloat(
                        getComputedStyle(
                            inputArea
                        ).bottom
                    ) || 0;

                inputArea.style.bottom =
                    `${currentBottom + difference}px`;
            }
        }
    }

    /* =========================================================
       FOCUS
    ========================================================= */

    function focusInput() {

        if (!messageInput) {
            return false;
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

        return (
            document.activeElement ===
            messageInput
        );
    }

    /*
       هذه الدالة سنستخدمها من messages-send.js
       بعد إرسال الرسالة.
    */
    function keepKeyboardOpen() {

        keepKeyboardRequested =
            true;

        /*
           نركز مباشرة.
        */
        focusInput();

        /*
           ننتظر إعادة حساب الـ viewport.
        */
        requestAnimationFrame(() => {

            detectKeyboard();

            focusInput();

            requestAnimationFrame(() => {

                detectKeyboard();

                updateInputPosition();

            });

        });

        /*
           محاولة إضافية بعد تأخير بسيط،
           لأن بعض متصفحات Android تغلق الكيبورد
           بعد انتهاء عملية async.
        */
        setTimeout(() => {

            if (
                keepKeyboardRequested
            ) {
                focusInput();

                detectKeyboard();

                updateInputPosition();
            }

        }, 80);

        setTimeout(() => {

            if (
                keepKeyboardRequested
            ) {
                focusInput();

                detectKeyboard();

                updateInputPosition();
            }

        }, 180);
    }

    function stopKeepingKeyboardOpen() {

        keepKeyboardRequested =
            false;
    }

    /* =========================================================
       VIEWPORT EVENTS
    ========================================================= */

    const viewport =
        getViewport();

    if (viewport) {

        viewport.addEventListener(
            "resize",
            () => {

                detectKeyboard();

                updateInputPosition();

            },
            {
                passive: true
            }
        );

        viewport.addEventListener(
            "scroll",
            () => {

                if (keyboardVisible) {
                    updateInputPosition();
                }

            },
            {
                passive: true
            }
        );
    }

    window.addEventListener(
        "resize",
        () => {

            detectKeyboard();

            updateInputPosition();

        },
        {
            passive: true
        }
    );

    /* =========================================================
       INPUT EVENTS
    ========================================================= */

    messageInput.addEventListener(
        "focus",
        () => {

            /*
               نعطي المتصفح فرصة لفتح الكيبورد.
            */
            requestAnimationFrame(() => {

                detectKeyboard();

                updateInputPosition();

            });

        }
    );

    messageInput.addEventListener(
        "blur",
        () => {

            /*
               لا نعتبر الـ blur وحده دليلاً على إغلاق
               الكيبورد، لأن Android قد يغير الـ focus
               مؤقتاً أثناء تحديث الـ viewport.
            */

            setTimeout(() => {

                detectKeyboard();

            }, 50);

        }
    );

    /* =========================================================
       PAGE VISIBILITY
    ========================================================= */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                !document.hidden
            ) {

                requestAnimationFrame(() => {

                    detectKeyboard();

                    updateInputPosition();

                });

            }

        }
    );

    /* =========================================================
       INITIALIZE
    ========================================================= */

    function init() {

        if (initialized) {
            return;
        }

        initialized = true;

        detectKeyboard();

        updateInputPosition();

        lastViewportHeight =
            window.innerHeight;

        console.log(
            "WFESC Keyboard: initialized"
        );
    }

    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESC_MESSAGES_KEYBOARD = {

        init,

        getKeyboardHeight() {
            return keyboardHeight;
        },

        isKeyboardVisible() {
            return keyboardVisible;
        },

        focusInput,

        keepKeyboardOpen,

        stopKeepingKeyboardOpen,

        updateInputPosition,

        detectKeyboard

    };

    /* =========================================================
       START
    ========================================================= */

    init();

})();
