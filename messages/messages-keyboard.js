/* =========================================================
   WFESC MESSAGES KEYBOARD
   File:
   messages/messages-keyboard.js

   الوظيفة:
   - اكتشاف ارتفاع كيبورد الهاتف
   - تحريك خانة الكتابة فقط فوق الكيبورد
   - تثبيت شريط WFESC Navigation أسفل الشاشة
   - منع Navigation من الصعود فوق الكيبورد
   - دعم VisualViewport
   - دعم تدوير الشاشة
   - دعم فتح/إغلاق المحادثة
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       العناصر الأساسية
       ========================================================= */

    const root =
        document.documentElement;


    function getBody() {

        return document.body || null;

    }


    /*
     * ارتفاع شريط التنقل الطبيعي.
     *
     * هذا هو مكانه الطبيعي فوق أزرار الهاتف.
     */
    const navigationHeight =
        82;


    /*
     * المسافة الصغيرة بين شريط WFESC
     * وأسفل الشاشة.
     */
    const navigationBottom =
        7;


    /*
     * أقل فرق نعتبره كيبورد.
     */
    const keyboardThreshold =
        80;


    let lastKeyboardHeight =
        -1;


    let updateTimer =
        null;


    let initialized =
        false;


    let visualViewportInstance =
        null;


    let keyboardWasOpen =
        false;


    const scheduledTimers =
        new Set();


    /* =========================================================
       العثور على شريط التنقل
       ========================================================= */

    function getNavigation() {

        return document.getElementById(
            "wfesc-navigation"
        );

    }


    /* =========================================================
       تثبيت شريط التنقل
       ========================================================= */

    function lockNavigationPosition(
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
                    Number(keyboardHeight) || 0
                )
            );


        /*
         * عندما يكون الكيبورد مغلقًا:
         *
         * navigationBottom = 7px
         *
         * وعندما يفتح الكيبورد:
         *
         * نطرح ارتفاع الكيبورد.
         *
         * النتيجة:
         * يبقى شريط WFESC في مكانه الأصلي
         * أسفل الشاشة/الـlayout ولا يصعد فوق الكيبورد.
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
            "margin-bottom",
            "0px",
            "important"
        );


        navigation.style.setProperty(
            "transform",
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

    }


    /* =========================================================
       ارتفاع الـLayout
       ========================================================= */

    function getLayoutHeight() {

        const documentHeight =
            Number(
                document.documentElement.clientHeight
            ) || 0;


        const windowHeight =
            Number(
                window.innerHeight
            ) || 0;


        return Math.max(
            documentHeight,
            windowHeight
        );

    }


    /* =========================================================
       أسفل الـViewport
       ========================================================= */

    function getViewportBottom() {

        if (visualViewportInstance) {

            const viewportHeight =
                Number(
                    visualViewportInstance.height
                ) || 0;


            const viewportOffsetTop =
                Number(
                    visualViewportInstance.offsetTop
                ) || 0;


            const bottom =
                viewportHeight +
                viewportOffsetTop;


            if (
                Number.isFinite(bottom) &&
                bottom > 0
            ) {

                return bottom;

            }

        }


        return (
            Number(window.innerHeight) ||
            getLayoutHeight()
        );

    }


    /* =========================================================
       حساب ارتفاع الكيبورد
       ========================================================= */

    function calculateKeyboardHeight() {

        const layoutHeight =
            getLayoutHeight();


        const viewportBottom =
            getViewportBottom();


        let height =
            layoutHeight -
            viewportBottom;


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


        if (
            height <
            keyboardThreshold
        ) {

            height = 0;

        }


        return height;

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
                            "[WFESC KEYBOARD] Timer error:",
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


        /*
         * حتى إذا لم يتغير ارتفاع الكيبورد،
         * نعيد تثبيت Navigation.
         *
         * لأن Android قد يغير الـviewport
         * بدون تغيير القيمة المحسوبة.
         */

        lockNavigationPosition(
            height
        );


        /*
         * لا نعيد حساب باقي النظام
         * إذا لم تتغير القيمة.
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
           متغير ارتفاع الكيبورد
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

            /*
             * هذا للكومبوزر فقط.
             *
             * لا يستخدم لتحريك Navigation.
             */

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
         * إعادة تثبيت Navigation
         * بعد إغلاق الكيبورد.
         */

        lockNavigationPosition(
            0
        );

    }


    /* =========================================================
       التحديث الأساسي
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
       تحديث مؤجل
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
       جاهزية الصفحة
       ========================================================= */

    function isPageReady() {

        return (
            document.readyState ===
                "interactive" ||
            document.readyState ===
                "complete"
        );

    }


    /* =========================================================
       التركيز على حقل الرسالة
       ========================================================= */

    function handleInputFocus() {

        scheduleUpdate(
            30
        );


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
       فقدان التركيز
       ========================================================= */

    function handleInputBlur() {

        scheduleUpdate(
            50
        );


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
       تغيير حجم النافذة
       ========================================================= */

    function handleWindowResize() {

        scheduleUpdate(
            20
        );


        safeTimeout(
            update,
            100
        );

    }


    /* =========================================================
       تدوير الشاشة
       ========================================================= */

    function handleOrientationChange() {

        scheduleUpdate(
            50
        );


        safeTimeout(
            update,
            150
        );


        safeTimeout(
            update,
            350
        );


        safeTimeout(
            update,
            600
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


        /*
         * تغيير الحجم.
         */

        visualViewportInstance.addEventListener(
            "resize",
            function () {

                scheduleUpdate(
                    0
                );

            },
            {
                passive: true
            }
        );


        /*
         * تغيير موضع الـViewport.
         */

        visualViewportInstance.addEventListener(
            "scroll",
            function () {

                scheduleUpdate(
                    0
                );

            },
            {
                passive: true
            }
        );

    }


    /* =========================================================
       مراقبة فتح وإغلاق المحادثة
       ========================================================= */

    function setupChatObserver() {

        const chatView =
            document.getElementById(
                "chatView"
            );


        if (!chatView) {

            return;

        }


        const observer =
            new MutationObserver(
                function () {

                    scheduleUpdate(
                        0
                    );


                    safeTimeout(
                        update,
                        100
                    );

                }
            );


        observer.observe(
            chatView,
            {
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );

    }


    /* =========================================================
       مراقبة حقل الكتابة
       ========================================================= */

    function setupInputEvents() {

        const input =
            document.getElementById(
                "messageInput"
            );


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
       مراقبة الصفحة
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

                scheduleUpdate(
                    50
                );


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
       تنظيف حالة الكيبورد
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


        /*
         * تثبيت Navigation في مكانه
         * منذ البداية.
         */

        lockNavigationPosition(
            0
        );

    }


    /* =========================================================
       التهيئة
       ========================================================= */

    function init() {

        if (
            initialized
        ) {

            return;

        }


        initialized =
            true;


        resetKeyboardState();


        setupVisualViewport();

        setupInputEvents();

        setupWindowEvents();

        setupChatObserver();


        scheduleUpdate(
            0
        );


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
       API عام
       ========================================================= */

    window.WFESC_MESSAGE_KEYBOARD = {

        init:
            init,

        update:
            function () {

                update();

            },

        getHeight:
            function () {

                return calculateKeyboardHeight();

            },

        isOpen:
            function () {

                return (
                    calculateKeyboardHeight() > 0
                );

            }

    };


    /* =========================================================
       إشارات الجاهزية
       ========================================================= */

    window.WFESC_MESSAGE_KEYBOARD_READY =
        true;


    window.WFESC_KEYBOARD_FILE_LOADED =
        true;


    window.__WFESC_KEYBOARD_FILE_LOADED__ =
        true;


    /* =========================================================
       التشغيل التلقائي
       ========================================================= */

    function boot() {

        if (
            isPageReady()
        ) {

            init();

            return;

        }


        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    }


    boot();

})();
