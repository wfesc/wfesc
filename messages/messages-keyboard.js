/* =========================================================
   WFESC MESSAGES KEYBOARD
   File:
   messages/messages-keyboard.js

   الوظيفة:
   - اكتشاف ارتفاع كيبورد الهاتف
   - تحريك خانة الكتابة فقط
   - إبقاء Header المحادثة ثابتًا
   - إبقاء Navigation في مكانه الأصلي
   - لا يصعد Navigation فوق الكيبورد
   - دعم VisualViewport
   - دعم تدوير الشاشة
   ========================================================= */

(function () {

    "use strict";

    if (window.WFESCMessageKeyboardLoaded) {
        return;
    }

    window.WFESCMessageKeyboardLoaded = true;


    /* =========================================================
       العناصر الأساسية
       ========================================================= */

    const root =
        document.documentElement;


    function getBody() {
        return document.body || null;
    }


    function getNavigation() {
        return document.getElementById(
            "wfesc-navigation"
        );
    }


    function getChatView() {
        return document.getElementById(
            "chatView"
        );
    }


    function getMessageInput() {
        return document.getElementById(
            "messageInput"
        );
    }


    /* =========================================================
       الإعدادات
       ========================================================= */

    const navigationHeight = 82;

    const navigationBottom = 7;

    const keyboardThreshold = 80;


    /* =========================================================
       الحالة
       ========================================================= */

    let initialized = false;

    let updateTimer = null;

    let visualViewportInstance = null;

    let lastKeyboardHeight = -1;

    let baseViewportHeight = 0;

    let keyboardWasOpen = false;

    const scheduledTimers = new Set();


    /* =========================================================
       الحصول على ارتفاع الـViewport الحالي
       ========================================================= */

    function getCurrentViewportHeight() {

        if (visualViewportInstance) {

            const height =
                Number(
                    visualViewportInstance.height
                ) || 0;

            const offsetTop =
                Number(
                    visualViewportInstance.offsetTop
                ) || 0;

            const total =
                height +
                offsetTop;

            if (
                Number.isFinite(total) &&
                total > 0
            ) {
                return total;
            }
        }


        return (
            Number(window.innerHeight) ||
            Number(document.documentElement.clientHeight) ||
            0
        );
    }


    /* =========================================================
       تحديد ارتفاع الـViewport الأساسي
       ========================================================= */

    function captureBaseViewportHeight() {

        const current =
            getCurrentViewportHeight();


        const inner =
            Number(
                window.innerHeight
            ) || 0;


        baseViewportHeight =
            Math.max(
                current,
                inner,
                baseViewportHeight
            );


        if (
            baseViewportHeight <= 0
        ) {

            baseViewportHeight =
                current ||
                inner ||
                0;

        }

    }


    /* =========================================================
       حساب ارتفاع الكيبورد
       ========================================================= */

    function calculateKeyboardHeight() {

        if (
            baseViewportHeight <= 0
        ) {

            captureBaseViewportHeight();

        }


        const current =
            getCurrentViewportHeight();


        let height =
            baseViewportHeight -
            current;


        if (
            !Number.isFinite(height)
        ) {

            height = 0;

        }


        height =
            Math.max(
                0,
                Math.round(height)
            );


        /*
         * الفروقات الصغيرة ليست كيبورد.
         */

        if (
            height <
            keyboardThreshold
        ) {

            height = 0;

        }


        return height;

    }


    /* =========================================================
       تثبيت الـNavigation
       ========================================================= */

    function lockNavigation(
        keyboardHeight
    ) {

        const navigation =
            getNavigation();


        if (!navigation) {
            return;
        }


        keyboardHeight =
            Math.max(
                0,
                Math.round(
                    Number(
                        keyboardHeight
                    ) || 0
                )
            );


        /*
         * مهم جدًا:
         *
         * عند فتح الكيبورد:
         *
         * bottom = 7px - ارتفاع الكيبورد
         *
         * هذا يعوض تقلص الـVisualViewport
         * ويحافظ على Navigation في مكانه
         * الأصلي بدل أن يصعد فوق الكيبورد.
         */

        const bottom =
            navigationBottom -
            keyboardHeight;


        navigation.style.setProperty(
            "position",
            "fixed",
            "important"
        );


        navigation.style.setProperty(
            "top",
            "auto",
            "important"
        );


        navigation.style.setProperty(
            "bottom",
            bottom + "px",
            "important"
        );


        navigation.style.setProperty(
            "left",
            "7px",
            "important"
        );


        navigation.style.setProperty(
            "right",
            "7px",
            "important"
        );


        navigation.style.setProperty(
            "width",
            "auto",
            "important"
        );


        navigation.style.setProperty(
            "margin",
            "0",
            "important"
        );


        navigation.style.setProperty(
            "transform",
            "none",
            "important"
        );


        navigation.style.setProperty(
            "translate",
            "none",
            "important"
        );


        navigation.style.setProperty(
            "transition",
            "none",
            "important"
        );


        navigation.style.setProperty(
            "animation",
            "none",
            "important"
        );


        navigation.style.setProperty(
            "will-change",
            "auto",
            "important"
        );


        navigation.style.setProperty(
            "opacity",
            "1",
            "important"
        );


        navigation.style.setProperty(
            "visibility",
            "visible",
            "important"
        );


        navigation.style.setProperty(
            "z-index",
            "99990",
            "important"
        );


        /*
         * الشريط يجب ألا يختفي أبدًا.
         */

        navigation.classList.remove(
            "wfesc-navigation-hide"
        );

    }


    /* =========================================================
       تثبيت واجهة المحادثة
       ========================================================= */

    function lockChatView() {

        const chatView =
            getChatView();


        if (!chatView) {
            return;
        }


        chatView.style.setProperty(
            "position",
            "fixed",
            "important"
        );


        chatView.style.setProperty(
            "top",
            "0",
            "important"
        );


        chatView.style.setProperty(
            "right",
            "0",
            "important"
        );


        chatView.style.setProperty(
            "bottom",
            "auto",
            "important"
        );


        chatView.style.setProperty(
            "left",
            "0",
            "important"
        );


        chatView.style.setProperty(
            "width",
            "100%",
            "important"
        );


        /*
         * لا نستخدم 100dvh هنا.
         *
         * نستخدم Largest Viewport حتى لا يصغر
         * الـChat View عند ظهور الكيبورد.
         */

        chatView.style.setProperty(
            "height",
            "100lvh",
            "important"
        );


        chatView.style.setProperty(
            "min-height",
            "100lvh",
            "important"
        );


        chatView.style.setProperty(
            "max-height",
            "none",
            "important"
        );


        chatView.style.setProperty(
            "transform",
            "none",
            "important"
        );

    }


    /* =========================================================
       تثبيت Header المحادثة
       ========================================================= */

    function lockChatHeader() {

        const chatView =
            getChatView();


        if (!chatView) {
            return;
        }


        const header =
            chatView.querySelector(
                ".chat-header"
            );


        if (!header) {
            return;
        }


        header.style.setProperty(
            "position",
            "relative",
            "important"
        );


        header.style.setProperty(
            "top",
            "auto",
            "important"
        );


        header.style.setProperty(
            "bottom",
            "auto",
            "important"
        );


        header.style.setProperty(
            "transform",
            "none",
            "important"
        );


        header.style.setProperty(
            "translate",
            "none",
            "important"
        );


        header.style.setProperty(
            "flex-shrink",
            "0",
            "important"
        );


        header.style.setProperty(
            "transition",
            "none",
            "important"
        );

    }


    /* =========================================================
       تثبيت كل العناصر الحساسة
       ========================================================= */

    function enforceLayout(
        keyboardHeight
    ) {

        lockNavigation(
            keyboardHeight
        );

        lockChatView();

        lockChatHeader();

    }


    /* =========================================================
       تطبيق ارتفاع الكيبورد
       ========================================================= */

    function applyKeyboardHeight(
        height
    ) {

        height =
            Math.max(
                0,
                Math.round(
                    Number(height) || 0
                )
            );


        enforceLayout(
            height
        );


        /*
         * إذا لم تتغير القيمة،
         * لا نعيد كل CSS الخاص بالكومبوزر.
         */

        if (
            height ===
            lastKeyboardHeight
        ) {
            return;
        }


        lastKeyboardHeight =
            height;


        /* =====================================================
           متغير الكيبورد
           ===================================================== */

        root.style.setProperty(
            "--keyboard-height",
            height + "px"
        );


        /* =====================================================
           الكيبورد مفتوح
           ===================================================== */

        if (
            height > 0
        ) {

            root.style.setProperty(
                "--composer-bottom",
                height + "px"
            );


            keyboardWasOpen =
                true;


            const body =
                getBody();


            if (body) {

                body.classList.add(
                    "wfesc-keyboard-open"
                );

            }


            /*
             * منع الصفحة الرئيسية من الانزلاق
             * بسبب التركيز على textarea.
             */

            try {

                window.scrollTo(
                    0,
                    0
                );

            } catch (error) {

            }


            return;
        }


        /* =====================================================
           الكيبورد مغلق
           ===================================================== */

        root.style.setProperty(
            "--composer-bottom",
            navigationHeight + "px"
        );


        keyboardWasOpen =
            false;


        const body =
            getBody();


        if (body) {

            body.classList.remove(
                "wfesc-keyboard-open"
            );

        }


        /*
         * أصبح الـViewport طبيعيًا.
         * نلتقط القيمة الجديدة كأساس.
         */

        const current =
            getCurrentViewportHeight();


        if (
            current > 0
        ) {

            baseViewportHeight =
                current;

        }


        enforceLayout(0);

    }


    /* =========================================================
       تحديث النظام
       ========================================================= */

    function update() {

        if (
            !initialized
        ) {
            return;
        }


        const height =
            calculateKeyboardHeight();


        applyKeyboardHeight(
            height
        );

    }


    /* =========================================================
       Timer آمن
       ========================================================= */

    function safeTimeout(
        callback,
        delay
    ) {

        const timer =
            setTimeout(
                function () {

                    scheduledTimers.delete(
                        timer
                    );


                    try {

                        callback();

                    } catch (error) {

                        console.error(
                            "[WFESC KEYBOARD]",
                            error
                        );

                    }

                },
                Math.max(
                    0,
                    Number(delay) || 0
                )
            );


        scheduledTimers.add(
            timer
        );


        return timer;

    }


    /* =========================================================
       جدولة تحديث
       ========================================================= */

    function scheduleUpdate(
        delay
    ) {

        if (
            updateTimer !== null
        ) {

            clearTimeout(
                updateTimer
            );


            scheduledTimers.delete(
                updateTimer
            );


            updateTimer =
                null;

        }


        updateTimer =
            setTimeout(
                function () {

                    scheduledTimers.delete(
                        updateTimer
                    );


                    updateTimer =
                        null;


                    update();

                },
                Math.max(
                    0,
                    Number(delay) || 0
                )
            );


        scheduledTimers.add(
            updateTimer
        );


        return updateTimer;

    }


    /* =========================================================
       Focus
       ========================================================= */

    function handleInputFocus() {

        /*
         * نثبت الـViewport الأساسي قبل ظهور الكيبورد.
         */

        if (
            !keyboardWasOpen
        ) {

            captureBaseViewportHeight();

        }


        scheduleUpdate(30);

        safeTimeout(
            update,
            100
        );

        safeTimeout(
            update,
            250
        );

        safeTimeout(
            update,
            500
        );

    }


    /* =========================================================
       Blur
       ========================================================= */

    function handleInputBlur() {

        scheduleUpdate(50);

        safeTimeout(
            update,
            150
        );

        safeTimeout(
            update,
            350
        );

    }


    /* =========================================================
       Resize
       ========================================================= */

    function handleWindowResize() {

        scheduleUpdate(20);

        safeTimeout(
            update,
            100
        );

    }


    /* =========================================================
       Orientation
       ========================================================= */

    function handleOrientationChange() {

        safeTimeout(
            function () {

                /*
                 * بعد التدوير نلتقط
                 * الـViewport الطبيعي الجديد.
                 */

                captureBaseViewportHeight();

                lastKeyboardHeight = -1;

                update();

            },
            500
        );


    }


    /* =========================================================
       VisualViewport
       ========================================================= */

    function setupVisualViewport() {

        if (
            !window.visualViewport
        ) {
            return;
        }


        visualViewportInstance =
            window.visualViewport;


        visualViewportInstance.addEventListener(
            "resize",
            function () {

                scheduleUpdate(0);

            },
            {
                passive: true
            }
        );


        visualViewportInstance.addEventListener(
            "scroll",
            function () {

                /*
                 * scroll الخاص بالـVisualViewport
                 * لا يجب أن يحرك Navigation أو Header.
                 */

                scheduleUpdate(0);

            },
            {
                passive: true
            }
        );

    }


    /* =========================================================
       مراقبة Chat
       ========================================================= */

    function setupChatObserver() {

        const chatView =
            getChatView();


        if (!chatView) {
            return;
        }


        const observer =
            new MutationObserver(
                function () {

                    enforceLayout(
                        calculateKeyboardHeight()
                    );

                }
            );


        observer.observe(
            chatView,
            {
                attributes: true,
                attributeFilter: [
                    "class",
                    "style"
                ]
            }
        );

    }


    /* =========================================================
       مراقبة ظهور Navigation
       ========================================================= */

    function setupNavigationObserver() {

        const observer =
            new MutationObserver(
                function () {

                    const navigation =
                        getNavigation();


                    if (!navigation) {
                        return;
                    }


                    enforceLayout(
                        calculateKeyboardHeight()
                    );

                }
            );


        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* =========================================================
       أحداث Input
       ========================================================= */

    function setupInputEvents() {

        const input =
            getMessageInput();


        if (!input) {
            return;
        }


        input.addEventListener(
            "focus",
            handleInputFocus,
            {
                passive: true
            }
        );


        input.addEventListener(
            "blur",
            handleInputBlur,
            {
                passive: true
            }
        );

    }


    /* =========================================================
       أحداث الصفحة
       ========================================================= */

    function setupWindowEvents() {

        window.addEventListener(
            "resize",
            handleWindowResize,
            {
                passive: true
            }
        );


        window.addEventListener(
            "orientationchange",
            handleOrientationChange,
            {
                passive: true
            }
        );


        window.addEventListener(
            "pageshow",
            function () {

                captureBaseViewportHeight();

                lastKeyboardHeight = -1;

                scheduleUpdate(50);

                safeTimeout(
                    update,
                    200
                );

            },
            {
                passive: true
            }
        );

    }


    /* =========================================================
       Reset
       ========================================================= */

    function resetKeyboardState() {

        lastKeyboardHeight =
            -1;


        keyboardWasOpen =
            false;


        root.style.setProperty(
            "--keyboard-height",
            "0px"
        );


        root.style.setProperty(
            "--composer-bottom",
            navigationHeight + "px"
        );


        const body =
            getBody();


        if (body) {

            body.classList.remove(
                "wfesc-keyboard-open"
            );

        }


        captureBaseViewportHeight();

        enforceLayout(0);

    }


    /* =========================================================
       INIT
       ========================================================= */

    function init() {

        if (
            initialized
        ) {
            return;
        }


        initialized =
            true;


        setupVisualViewport();

        captureBaseViewportHeight();

        resetKeyboardState();

        setupInputEvents();

        setupWindowEvents();

        setupChatObserver();

        setupNavigationObserver();


        scheduleUpdate(0);


        safeTimeout(
            update,
            100
        );


        safeTimeout(
            update,
            300
        );


        safeTimeout(
            update,
            600
        );

    }


    /* =========================================================
       API
       ========================================================= */

    window.WFESC_MESSAGE_KEYBOARD = {

        init:
            init,

        update:
            update,

        getHeight:
            function () {

                return calculateKeyboardHeight();

            },

        isOpen:
            function () {

                return (
                    calculateKeyboardHeight() >
                    0
                );

            }

    };


    /* =========================================================
       READY FLAGS
       ========================================================= */

    window.WFESC_MESSAGE_KEYBOARD_READY =
        true;

    window.WFESC_KEYBOARD_FILE_LOADED =
        true;

    window.__WFESC_KEYBOARD_FILE_LOADED__ =
        true;


    /* =========================================================
       BOOT
       ========================================================= */

    function boot() {

        if (
            document.readyState ===
                "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                init,
                {
                    once: true
                }
            );

        } else {

            init();

        }

    }


    boot();

})();
