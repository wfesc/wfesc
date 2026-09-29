/* =========================================================
   WFESC MESSAGES KEYBOARD
   File:
   messages/messages-keyboard.js

   الوظيفة:
   - اكتشاف ارتفاع كيبورد الهاتف
   - تحريك خانة الكتابة فقط
   - إبقاء Header المحادثة ثابتًا
   - إبقاء Navigation ثابتًا في مكانه الأصلي
   - عدم تحريك Navigation عند فتح الكيبورد
   - دعم VisualViewport
   - دعم تدوير الشاشة
   - منع تحريك صفحة المحادثة بالكامل
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       منع التحميل المكرر
       ========================================================= */

    if (window.WFESCMessageKeyboardLoaded) {
        return;
    }

    window.WFESCMessageKeyboardLoaded = true;


    /* =========================================================
       العناصر
       ========================================================= */

    const root = document.documentElement;


    function getBody() {
        return document.body || null;
    }


    function getNavigation() {
        return document.getElementById("wfesc-navigation");
    }


    function getChatView() {
        return document.getElementById("chatView");
    }


    function getChatHeader() {

        const chatView = getChatView();

        if (!chatView) {
            return null;
        }

        return chatView.querySelector(".chat-header");
    }


    function getMessageComposer() {
        return document.getElementById("messageComposer");
    }


    function getMessageInput() {
        return document.getElementById("messageInput");
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

    let navigationObserver = null;

    let chatObserver = null;

    let inputEventsAttached = false;


    /* =========================================================
       الحصول على ارتفاع الـ VisualViewport
       ========================================================= */

    function getVisualViewportHeight() {

        if (
            visualViewportInstance
        ) {

            const height =
                Number(
                    visualViewportInstance.height
                ) || 0;

            if (
                height > 0
            ) {

                return height;

            }

        }


        return 0;

    }


    /* =========================================================
       الحصول على ارتفاع الـViewport الطبيعي
       ========================================================= */

    function getWindowViewportHeight() {

        return Math.max(
            Number(window.innerHeight) || 0,
            Number(document.documentElement.clientHeight) || 0
        );

    }


    /* =========================================================
       الحصول على ارتفاع الـViewport الحالي
       ========================================================= */

    function getCurrentViewportHeight() {

        const visualHeight =
            getVisualViewportHeight();


        if (
            visualHeight > 0
        ) {

            return visualHeight;

        }


        return getWindowViewportHeight();

    }


    /* =========================================================
       التقاط ارتفاع الشاشة قبل الكيبورد
       ========================================================= */

    function captureBaseViewportHeight() {

        const visualHeight =
            getVisualViewportHeight();


        const windowHeight =
            getWindowViewportHeight();


        /*
         * نريد الارتفاع الطبيعي فقط.
         *
         * إذا كان الكيبورد مفتوحًا لا نسمح
         * بتسجيل ارتفاعه كارتفاع أساسي.
         */

        if (
            keyboardWasOpen
        ) {

            return;

        }


        const current =
            Math.max(
                visualHeight,
                windowHeight
            );


        if (
            current > 0
        ) {

            baseViewportHeight =
                current;

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


        if (
            current <= 0 ||
            baseViewportHeight <= 0
        ) {

            return 0;

        }


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
         * تجاهل تغيرات صغيرة ليست كيبورد.
         */

        if (
            height < keyboardThreshold
        ) {

            return 0;

        }


        return height;

    }


    /* =========================================================
       تثبيت Navigation
       
       مهم:
       لا نستخدم keyboardHeight هنا إطلاقًا.
       
       الـNavigation يبقى bottom:7px
       ولا نصعده عند فتح الكيبورد.
       ========================================================= */

    function lockNavigation() {

        const navigation =
            getNavigation();


        if (!navigation) {
            return;
        }


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
            navigationBottom + "px",
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
            "z-index",
            "1000",
            "important"
        );


        /*
         * لا نفرض opacity/visibility بالقوة
         * حتى لا نخرب نظام Navigation الأصلي
         * إلا إذا كان النظام يضيف hide أثناء
         * الكيبورد.
         */

        navigation.classList.remove(
            "wfesc-navigation-hide"
        );

    }


    /* =========================================================
       تثبيت Chat View
       
       لا نستخدم 100lvh.
       نستخدم ارتفاع الشاشة الطبيعي المقاس
       ونمنع تغيره بسبب الكيبورد.
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
            "left",
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
            "width",
            "100%",
            "important"
        );


        /*
         * أثناء عدم وجود الكيبورد:
         * نستخدم 100dvh.
         *
         * أثناء وجود الكيبورد:
         * نثبت الارتفاع السابق قبل الكيبورد
         * بالـ px حتى لا ينكمش الـChat.
         */

        if (
            keyboardWasOpen &&
            baseViewportHeight > 0
        ) {

            chatView.style.setProperty(
                "height",
                baseViewportHeight + "px",
                "important"
            );

            chatView.style.setProperty(
                "min-height",
                baseViewportHeight + "px",
                "important"
            );

        } else {

            chatView.style.setProperty(
                "height",
                "100dvh",
                "important"
            );

            chatView.style.setProperty(
                "min-height",
                "0",
                "important"
            );

        }


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


        chatView.style.setProperty(
            "translate",
            "none",
            "important"
        );

    }


    /* =========================================================
       تثبيت Header
       
       الـHeader يبقى عنصر Flex طبيعي
       ولا نسمح لأي translate أو top
       بالتأثير عليه.
       ========================================================= */

    function lockChatHeader() {

        const header =
            getChatHeader();


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
            "right",
            "auto",
            "important"
        );


        header.style.setProperty(
            "bottom",
            "auto",
            "important"
        );


        header.style.setProperty(
            "left",
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
            "flex",
            "0 0 auto",
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


        header.style.setProperty(
            "will-change",
            "auto",
            "important"
        );

    }


    /* =========================================================
       تثبيت Composer
       
       هذا هو العنصر الوحيد الذي يتحرك
       بسبب الكيبورد.
       ========================================================= */

    function applyComposerPosition(
        keyboardHeight
    ) {

        const composer =
            getMessageComposer();


        /*
         * لا نضع bottom مباشرة على العنصر
         * لأن الـCSS الأصلي يستخدم
         * --composer-bottom.
         */

        root.style.setProperty(
            "--keyboard-height",
            keyboardHeight + "px"
        );


        if (
            keyboardHeight > 0
        ) {

            root.style.setProperty(
                "--composer-bottom",
                keyboardHeight + "px"
            );

        } else {

            root.style.setProperty(
                "--composer-bottom",
                navigationHeight + "px"
            );

        }


        if (!composer) {
            return;
        }


        composer.style.setProperty(
            "bottom",
            keyboardHeight > 0
                ? keyboardHeight + "px"
                : navigationHeight + "px",
            "important"
        );

    }


    /* =========================================================
       منع Body من التحرك
       ========================================================= */

    function updateBodyKeyboardState(
        keyboardHeight
    ) {

        const body =
            getBody();


        if (!body) {
            return;
        }


        if (
            keyboardHeight > 0
        ) {

            body.classList.add(
                "wfesc-keyboard-open"
            );

            keyboardWasOpen =
                true;

        } else {

            body.classList.remove(
                "wfesc-keyboard-open"
            );

            keyboardWasOpen =
                false;

        }

    }


    /* =========================================================
       فرض التخطيط
       ========================================================= */

    function enforceLayout(
        keyboardHeight
    ) {

        lockNavigation();

        lockChatView();

        lockChatHeader();

        applyComposerPosition(
            keyboardHeight
        );

    }


    /* =========================================================
       تطبيق حالة الكيبورد
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
         * إذا الكيبورد مغلق:
         * نعيد الحالة الطبيعية أولًا.
         */

        if (
            height <= 0
        ) {

            keyboardWasOpen =
                false;


            /*
             * التقاط الارتفاع الطبيعي
             * قبل تطبيق بقية القواعد.
             */

            const current =
                getCurrentViewportHeight();


            if (
                current > 0
            ) {

                baseViewportHeight =
                    current;

            }


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


            lastKeyboardHeight =
                0;


            enforceLayout(0);


            return;

        }


        /*
         * الكيبورد مفتوح.
         */

        keyboardWasOpen =
            true;


        root.style.setProperty(
            "--keyboard-height",
            height + "px"
        );


        root.style.setProperty(
            "--composer-bottom",
            height + "px"
        );


        const body =
            getBody();


        if (body) {

            body.classList.add(
                "wfesc-keyboard-open"
            );

        }


        lastKeyboardHeight =
            height;


        enforceLayout(height);

    }


    /* =========================================================
       تحديث
       ========================================================= */

    function update() {

        if (
            !initialized
        ) {
            return;
        }


        const height =
            calculateKeyboardHeight();


        /*
         * لا نعيد حساب الـBase أثناء
         * فتح الكيبورد.
         */

        applyKeyboardHeight(
            height
        );

    }


    /* =========================================================
       جدولة التحديث
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

            updateTimer =
                null;

        }


        updateTimer =
            setTimeout(
                function () {

                    updateTimer =
                        null;

                    update();

                },
                Math.max(
                    0,
                    Number(delay) || 0
                )
            );

    }


    /* =========================================================
       Focus
       ========================================================= */

    function handleInputFocus() {

        /*
         * نلتقط ارتفاع الشاشة الطبيعي
         * قبل أن يبدأ الكيبورد بتقليص VisualViewport.
         */

        if (
            !keyboardWasOpen
        ) {

            captureBaseViewportHeight();

        }


        /*
         * ننتظر قليلًا حتى يستقر الكيبورد.
         */

        scheduleUpdate(20);


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
            450
        );

    }


    /* =========================================================
       Blur
       ========================================================= */

    function handleInputBlur() {

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
       Resize
       ========================================================= */

    function handleWindowResize() {

        /*
         * إذا الكيبورد مغلق فقط،
         * نسمح بتحديث الـBase.
         */

        if (
            !keyboardWasOpen
        ) {

            captureBaseViewportHeight();

        }


        scheduleUpdate(20);

    }


    /* =========================================================
       Orientation
       ========================================================= */

    function handleOrientationChange() {

        /*
         * بعد التدوير لا نعتمد على الارتفاع القديم.
         */

        keyboardWasOpen =
            false;


        lastKeyboardHeight =
            -1;


        setTimeout(
            function () {

                captureBaseViewportHeight();

                update();

            },
            300
        );


        setTimeout(
            function () {

                captureBaseViewportHeight();

                update();

            },
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
         * لا نحتاج إلى إعادة تثبيت
         * Navigation بسبب VisualViewport scroll.
         *
         * الـscroll نفسه لا يغير bottom.
         */

        visualViewportInstance.addEventListener(
            "scroll",
            function () {

                /*
                 * فقط نعيد حساب الكيبورد.
                 * لا نغير Navigation position.
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


        if (
            !chatView ||
            chatObserver
        ) {
            return;
        }


        chatObserver =
            new MutationObserver(
                function () {

                    /*
                     * إذا تغيرت class أو style
                     * بسبب فتح/إغلاق المحادثة،
                     * نعيد تطبيق التخطيط الحالي فقط.
                     */

                    const height =
                        calculateKeyboardHeight();


                    enforceLayout(
                        height
                    );

                }
            );


        chatObserver.observe(
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
       مراقبة Navigation
       ========================================================= */

    function setupNavigationObserver() {

        if (
            navigationObserver
        ) {
            return;
        }


        navigationObserver =
            new MutationObserver(
                function () {

                    const navigation =
                        getNavigation();


                    if (!navigation) {
                        return;
                    }


                    /*
                     * لا نستخدم keyboardHeight
                     * لتغيير مكان Navigation.
                     *
                     * فقط نعيد تثبيت bottom:7px.
                     */

                    lockNavigation();

                }
            );


        navigationObserver.observe(
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

        if (
            inputEventsAttached
        ) {
            return;
        }


        const input =
            getMessageInput();


        if (!input) {

            /*
             * قد يتم إنشاء العنصر بعد تحميل الملف.
             * نحاول مرة أخرى لاحقًا.
             */

            setTimeout(
                setupInputEvents,
                250
            );

            return;

        }


        inputEventsAttached =
            true;


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

                keyboardWasOpen =
                    false;


                lastKeyboardHeight =
                    -1;


                captureBaseViewportHeight();


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
       إعادة ضبط
       ========================================================= */

    function resetKeyboardState() {

        keyboardWasOpen =
            false;


        lastKeyboardHeight =
            -1;


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


        lockNavigation();

        lockChatView();

        lockChatHeader();

        applyComposerPosition(0);

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
                    calculateKeyboardHeight() > 0
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
