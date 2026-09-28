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
   ========================================================= */

(function () {
    "use strict";

    /* =========================================================
       العناصر الأساسية
    ========================================================= */

    const root = document.documentElement;
    const body = document.body;

    /*
     * ارتفاع شريط التنقل الطبيعي.
     *
     * هذا الرقم يجب أن يطابق:
     * --navigation-height
     * الموجود في messages.html
     */
    const navigationHeight = 82;

    /*
     * أقل فرق نعتبره كيبورد.
     *
     * تغييرات الـ viewport الصغيرة بسبب:
     * - شريط النظام
     * - safe area
     * - المتصفح
     * لا تعتبر كيبورد.
     */
    const keyboardThreshold = 80;

    /*
     * آخر ارتفاع مطبق.
     *
     * -1 حتى يتم التطبيق أول مرة.
     */
    let lastKeyboardHeight = -1;

    /*
     * مؤقت التحديث.
     */
    let updateTimer = null;

    /*
     * منع التهيئة أكثر من مرة.
     */
    let initialized = false;

    /*
     * VisualViewport عند توفره.
     */
    let visualViewportInstance = null;

    /*
     * حفظ آخر حالة للكيبورد.
     *
     * يساعد على منع تبديل الحالة بشكل متكرر
     * بسبب تغييرات صغيرة جداً في الـ viewport.
     */
    let keyboardWasOpen = false;


    /* =========================================================
       أدوات عامة
    ========================================================= */

    function getLayoutHeight() {

        const documentHeight =
            Number(document.documentElement.clientHeight) || 0;

        const windowHeight =
            Number(window.innerHeight) || 0;

        /*
         * نأخذ الأكبر حتى لا نعتمد على قيمة ناقصة.
         */
        return Math.max(
            documentHeight,
            windowHeight
        );
    }


    function getViewportBottom() {

        /*
         * عند توفر VisualViewport:
         *
         * bottom =
         * offsetTop + height
         *
         * وهذا أدق من الاعتماد على height وحده.
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
        if (!Number.isFinite(height)) {
            height = 0;
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
         * بعض الأجهزة تعطي فرقاً صغيراً
         * أثناء تغيّر الـviewport.
         *
         * لا نعتبره كيبورد.
         */
        if (
            height < keyboardThreshold
        ) {
            height = 0;
        }

        return height;
    }


    /* =========================================================
       تطبيق ارتفاع الكيبورد
    ========================================================= */

    function applyKeyboardHeight(height) {

        height =
            Math.max(
                0,
                Math.round(
                    Number(height) || 0
                )
            );

        /*
         * إذا لم يتغير الارتفاع،
         * لا نعيد كتابة CSS.
         */
        if (
            height === lastKeyboardHeight
        ) {
            return;
        }

        lastKeyboardHeight =
            height;

        /*
         * متغير ارتفاع الكيبورد.
         */
        root.style.setProperty(
            "--keyboard-height",
            height + "px"
        );


        /* =====================================================
           الكيبورد مفتوح
        ===================================================== */

        if (height > 0) {

            /*
             * خانة الكتابة تصعد فوق الكيبورد.
             */
            root.style.setProperty(
                "--composer-bottom",
                height + "px"
            );

            /*
             * نضيف حالة الكيبورد.
             *
             * الـCSS في messages.html
             * يتعامل مع Navigation بناءً على هذه الكلاس.
             */
            if (!keyboardWasOpen) {

                keyboardWasOpen = true;

                body.classList.add(
                    "wfesc-keyboard-open"
                );

            } else if (
                !body.classList.contains(
                    "wfesc-keyboard-open"
                )
            ) {

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

        if (keyboardWasOpen) {

            keyboardWasOpen = false;

            body.classList.remove(
                "wfesc-keyboard-open"
            );

        } else if (
            body.classList.contains(
                "wfesc-keyboard-open"
            )
        ) {

            body.classList.remove(
                "wfesc-keyboard-open"
            );
        }
    }


    /* =========================================================
       التحديث الأساسي
    ========================================================= */

    function update() {

        if (!initialized) {
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

    function scheduleUpdate(delay) {

        if (updateTimer !== null) {

            clearTimeout(
                updateTimer
            );

            updateTimer = null;
        }

        updateTimer =
            setTimeout(
                function () {

                    updateTimer = null;

                    update();

                },
                Math.max(
                    0,
                    Number(delay) || 0
                )
            );
    }


    /* =========================================================
       التأكد من جاهزية الصفحة
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
         * عند الضغط على حقل الرسالة:
         *
         * VisualViewport قد يتغير بعد لحظات.
         *
         * لذلك نعمل عدة تحديثات قصيرة.
         */

        scheduleUpdate(30);

        setTimeout(
            update,
            100
        );

        setTimeout(
            update,
            250
        );

        setTimeout(
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
         * Android قد يحتاج بعض الوقت
         * حتى يعيد الـviewport لحجمه الطبيعي.
         */

        scheduleUpdate(50);

        setTimeout(
            update,
            150
        );

        setTimeout(
            update,
            350
        );
    }


    /* =========================================================
       تغيير حجم نافذة المتصفح
    ========================================================= */

    function handleWindowResize() {

        /*
         * resize قد يحدث عدة مرات أثناء فتح
         * أو إغلاق الكيبورد.
         */

        scheduleUpdate(20);

        setTimeout(
            update,
            100
        );
    }


    /* =========================================================
       تدوير الشاشة
    ========================================================= */

    function handleOrientationChange() {

        /*
         * عند التدوير تتغير:
         *
         * width
         * height
         * visualViewport
         *
         * لذلك نعيد الحساب عدة مرات.
         */

        scheduleUpdate(50);

        setTimeout(
            update,
            150
        );

        setTimeout(
            update,
            350
        );

        setTimeout(
            update,
            600
        );
    }


    /* =========================================================
       VisualViewport
    ========================================================= */

    function setupVisualViewport() {

        if (!window.visualViewport) {
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

                scheduleUpdate(0);

            },
            {
                passive: true
            }
        );


        /*
         * تغيير موضع VisualViewport.
         *
         * مهم لبعض أجهزة Android.
         */
        visualViewportInstance.addEventListener(
            "scroll",
            function () {

                scheduleUpdate(0);

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
                    scheduleUpdate(0);

                    setTimeout(
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

                scheduleUpdate(50);

                setTimeout(
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
       التهيئة
    ========================================================= */

    function init() {

        /*
         * منع تشغيل init مرتين.
         */
        if (initialized) {
            return;
        }

        initialized = true;


        /* =====================================================
           الحالة الابتدائية
        ===================================================== */

        lastKeyboardHeight = -1;

        keyboardWasOpen = false;


        /*
         * البداية بدون كيبورد.
         */
        root.style.setProperty(
            "--keyboard-height",
            "0px"
        );


        /*
         * خانة الكتابة تكون فوق
         * شريط التنقل الطبيعي.
         */
        root.style.setProperty(
            "--composer-bottom",
            navigationHeight + "px"
        );


        /*
         * تنظيف حالة الكيبورد.
         */
        body.classList.remove(
            "wfesc-keyboard-open"
        );


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

        scheduleUpdate(0);


        /*
         * تحديثات إضافية بعد اكتمال الرسم.
         */
        setTimeout(
            update,
            100
        );

        setTimeout(
            update,
            300
        );

        setTimeout(
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
        init: init,


        /*
         * تحديث يدوي.
         */
        update: function () {

            update();

        },


        /*
         * إرجاع ارتفاع الكيبورد الحالي.
         */
        getHeight: function () {

            return calculateKeyboardHeight();

        },


        /*
         * معرفة هل الكيبورد مفتوح.
         */
        isOpen: function () {

            return (
                calculateKeyboardHeight() > 0
            );

        }
    };


    /* =========================================================
       التشغيل التلقائي
    ========================================================= */

    function boot() {

        /*
         * إذا الصفحة جاهزة،
         * نشغل مباشرة.
         */
        if (isPageReady()) {

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
