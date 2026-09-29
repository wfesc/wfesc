 /* =========================================================
   WFESC MESSAGES KEYBOARD
   File:
   messages/messages-keyboard.js

   الوظيفة:
   - اكتشاف ارتفاع كيبورد الهاتف
   - استخدام VisualViewport عند توفره
   - تحريك خانة الكتابة فوق الكيبورد مباشرة
   - دعم تدوير الشاشة
   - دعم فتح/إغلاق المحادثة
   - منع القفزات غير الضرورية
   - المتحكم الوحيد بمنظومة الكيبورد
   - لا يتحكم بشريط التنقل نهائياً
   ========================================================= */

(function () {
    "use strict";


    /* =========================================================
       العناصر الأساسية
    ========================================================= */

    const root =
        document.documentElement;


    /*
     * لا نعتمد على body وقت تحميل الملف
     * حتى لو كان السكربت مبكرًا.
     */
    function getBody() {

        return document.body || null;

    }


    /*
     * ارتفاع شريط التنقل الطبيعي.
     *
     * يجب أن يطابق:
     * --navigation-height
     *
     * الموجود في messages.html
     */
    const navigationHeight =
        82;


    /*
     * أقل فرق نعتبره كيبورد.
     */
    const keyboardThreshold =
        80;


    /*
     * آخر ارتفاع مطبق.
     */
    let lastKeyboardHeight =
        -1;


    /*
     * مؤقت التحديث الرئيسي.
     */
    let updateTimer =
        null;


    /*
     * منع التهيئة أكثر من مرة.
     */
    let initialized =
        false;


    /*
     * VisualViewport.
     */
    let visualViewportInstance =
        null;


    /*
     * حالة الكيبورد السابقة.
     */
    let keyboardWasOpen =
        false;


    /*
     * المؤقتات الإضافية.
     */
    const scheduledTimers =
        new Set();


    /* =========================================================
       أدوات عامة
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


    function getViewportBottom() {

        /*
         * VisualViewport هو المصدر الأساسي
         * عندما يكون متاحًا.
         */
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


        /*
         * fallback.
         */
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


        /*
         * منع القيم غير الصالحة.
         */
        if (
            !Number.isFinite(height)
        ) {

            height =
                0;

        }


        /*
         * منع القيم السالبة.
         */
        height =
            Math.max(
                0,
                Math.round(height)
            );


        /*
         * الفروقات الصغيرة
         * لا تعتبر كيبورد.
         */
        if (
            height <
            keyboardThreshold
        ) {

            height =
                0;

        }


        return height;

    }


    /* =========================================================
       جدولة تحديث آمنة
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
         * لا نعيد كتابة CSS إذا لم يتغير
         * الارتفاع.
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
             * حقل الكتابة يصعد فوق الكيبورد.
             *
             * هذا المتغير للكومبوزر فقط.
             *
             * لا يتم استخدامه لتحريك navigation.
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

        /*
         * Android يحتاج أحيانًا عدة دورات
         * حتى يستقر VisualViewport.
         */
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

        /*
         * بعد إغلاق الكيبورد،
         * ننتظر استقرار الـviewport.
         */
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
       تغيير حجم نافذة المتصفح
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
         * تغيير حجم VisualViewport.
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
         * تغيير موضع VisualViewport.
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

                    /*
                     * عند فتح أو إغلاق المحادثة
                     * قد يتغير الـviewport.
                     */
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

        /*
         * تغيير حجم النافذة.
         */
        window.addEventListener(
            "resize",
            handleWindowResize,
            {
                passive: true
            }
        );


        /*
         * تدوير الشاشة.
         */
        window.addEventListener(
            "orientationchange",
            handleOrientationChange,
            {
                passive: true
            }
        );


        /*
         * الرجوع للصفحة من history.
         */
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

    }


    /* =========================================================
       التهيئة
    ========================================================= */

    function init() {

        /*
         * منع تشغيل init مرتين.
         */
        if (
            initialized
        ) {

            return;

        }


        initialized =
            true;


        /* =====================================================
           الحالة الابتدائية
        ===================================================== */

        resetKeyboardState();


        /* =====================================================
           تشغيل المراقبات
        ===================================================== */

        setupVisualViewport();

        setupInputEvents();

        setupWindowEvents();

        setupChatObserver();


        /* =====================================================
           تحديث أولي
        ===================================================== */

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

        /*
         * تشغيل المتحكم.
         */
        init:
            init,


        /*
         * تحديث يدوي.
         */
        update:
            function () {

                update();

            },


        /*
         * إرجاع ارتفاع الكيبورد الحالي.
         */
        getHeight:
            function () {

                return calculateKeyboardHeight();

            },


        /*
         * معرفة هل الكيبورد مفتوح.
         */
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

    /*
     * نضع جميع الأسماء المتداولة في المشروع
     * حتى لا يصير تعارض بين messages.html
     * وأي كود قديم كان يعتمد على اسم مختلف.
     */

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

        /*
         * إذا الصفحة جاهزة،
         * نشغل مباشرة.
         */
        if (
            isPageReady()
        ) {

            init();

            return;

        }


        /*
         * إذا لم تكن جاهزة،
         * ننتظر DOMContentLoaded.
         */
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
