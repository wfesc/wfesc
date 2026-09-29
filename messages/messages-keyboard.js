/* =========================================================
   WFESC MESSAGES KEYBOARD
   File:
   messages/messages-keyboard.js

   الوظيفة:
   - منع Android من رفع واجهة المحادثة عند ظهور الكيبورد
   - إبقاء Header ثابتًا
   - إبقاء Search داخل Header ثابتًا
   - إبقاء Navigation في أسفل الشاشة
   - تحريك Composer فقط فوق الكيبورد
   - دعم VirtualKeyboard API
   - دعم VisualViewport كـ fallback
   - دعم تدوير الشاشة
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


    function getChatHeader() {

        const chatView =
            getChatView();

        if (!chatView) {
            return null;
        }

        return chatView.querySelector(
            ".chat-header"
        );

    }


    function getComposer() {
        return document.getElementById(
            "messageComposer"
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

    const navigationHeight =
        82;

    const mobileNavigationBottom =
        7;

    const desktopNavigationBottom =
        12;

    const keyboardThreshold =
        50;


    /* =========================================================
       الحالة
       ========================================================= */

    let initialized =
        false;

    let keyboardOpen =
        false;

    let keyboardHeight =
        0;

    let baseViewportHeight =
        0;

    let updateTimer =
        null;

    let visualViewportInstance =
        null;

    let virtualKeyboardInstance =
        null;

    let navigationObserver =
        null;

    let inputEventsAttached =
        false;

    let lastOrientation =
        window.innerWidth >
        window.innerHeight
            ? "landscape"
            : "portrait";


    /* =========================================================
       تحديد مكان Navigation الأصلي
       ========================================================= */

    function getNavigationBottom() {

        if (
            window.matchMedia &&
            window.matchMedia(
                "(max-width:600px)"
            ).matches
        ) {

            return mobileNavigationBottom;

        }

        return desktopNavigationBottom;

    }


    /* =========================================================
       تفعيل نظام VirtualKeyboard
       
       هذا أهم جزء:
       يمنع المتصفح من تحريك/إعادة تحجيم
       الصفحة تلقائيًا عند ظهور الكيبورد.
       ========================================================= */

    function setupVirtualKeyboard() {

        if (
            !("virtualKeyboard" in navigator)
        ) {

            return;

        }


        try {

            virtualKeyboardInstance =
                navigator.virtualKeyboard;


            virtualKeyboardInstance.overlaysContent =
                true;


            virtualKeyboardInstance.addEventListener(
                "geometrychange",
                function () {

                    scheduleUpdate(0);

                },
                {
                    passive: true
                }
            );

        } catch (error) {

            console.warn(
                "[WFESC KEYBOARD] VirtualKeyboard:",
                error
            );

        }

    }


    /* =========================================================
       تحديث Meta Viewport برمجيًا كـ fallback
       ========================================================= */

    function ensureInteractiveWidgetMeta() {

        try {

            const meta =
                document.querySelector(
                    'meta[name="viewport"]'
                );


            if (!meta) {
                return;
            }


            let content =
                meta.getAttribute(
                    "content"
                ) || "";


            if (
                !/interactive-widget\s*=/.test(
                    content
                )
            ) {

                content =
                    content.replace(
                        /\s*,?\s*$/,
                        ""
                    );


                if (
                    content.trim() !== ""
                ) {

                    content +=
                        ", ";

                }


                content +=
                    "interactive-widget=overlays-content";


                meta.setAttribute(
                    "content",
                    content
                );

            }

        } catch (error) {

            console.warn(
                "[WFESC KEYBOARD] viewport meta:",
                error
            );

        }

    }


    /* =========================================================
       VirtualKeyboard boundingRect
       ========================================================= */

    function getVirtualKeyboardHeight() {

        if (
            !virtualKeyboardInstance
        ) {
            return 0;
        }


        try {

            const rect =
                virtualKeyboardInstance.boundingRect;


            if (!rect) {
                return 0;
            }


            const height =
                Number(
                    rect.height
                ) || 0;


            if (
                height > keyboardThreshold
            ) {

                return Math.round(
                    height
                );

            }

        } catch (_) {}

        return 0;

    }


    /* =========================================================
       VisualViewport fallback
       ========================================================= */

    function getVisualViewportHeight() {

        if (
            visualViewportInstance
        ) {

            return Number(
                visualViewportInstance.height
            ) || 0;

        }

        return 0;

    }


    function getWindowViewportHeight() {

        return Math.max(
            Number(
                window.innerHeight
            ) || 0,
            Number(
                document.documentElement.clientHeight
            ) || 0
        );

    }


    /* =========================================================
       التقاط ارتفاع الشاشة الطبيعي
       ========================================================= */

    function captureBaseViewportHeight() {

        if (
            keyboardOpen
        ) {

            return;

        }


        const visualHeight =
            getVisualViewportHeight();


        const windowHeight =
            getWindowViewportHeight();


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
       حساب الكيبورد
       ========================================================= */

    function calculateKeyboardHeight() {

        /*
         * الأولوية لـ VirtualKeyboard API
         */

        const virtualHeight =
            getVirtualKeyboardHeight();


        if (
            virtualHeight > 0
        ) {

            return virtualHeight;

        }


        /*
         * fallback إلى VisualViewport
         */

        if (
            !keyboardOpen &&
            baseViewportHeight <= 0
        ) {

            captureBaseViewportHeight();

        }


        const visualHeight =
            getVisualViewportHeight();


        if (
            visualHeight > 0 &&
            baseViewportHeight > 0
        ) {

            const difference =
                baseViewportHeight -
                visualHeight;


            if (
                difference >
                keyboardThreshold
            ) {

                return Math.round(
                    difference
                );

            }

        }


        return 0;

    }


    /* =========================================================
       تثبيت Navigation
       
       ملاحظة:
       keyboardHeight لا يدخل هنا نهائيًا.
       ========================================================= */

    function lockNavigation() {

        const navigation =
            getNavigation();


        if (!navigation) {
            return;
        }


        const bottom =
            getNavigationBottom();


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
            "will-change",
            "auto",
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
            "z-index",
            "1000",
            "important"
        );

    }


    /* =========================================================
       تثبيت Chat View
       
       بما أن الكيبورد صار Overlay:
       لا نحتاج تحريك الـChat View.
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


        chatView.style.setProperty(
            "height",
            "100dvh",
            "important"
        );


        chatView.style.setProperty(
            "min-height",
            "100dvh",
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


        chatView.style.setProperty(
            "translate",
            "none",
            "important"
        );

    }


    /* =========================================================
       تثبيت Header
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
            "will-change",
            "auto",
            "important"
        );


        header.style.setProperty(
            "transition",
            "none",
            "important"
        );

    }


    /* =========================================================
       تحريك Composer فقط
       ========================================================= */

    function applyComposerPosition(
        height
    ) {

        height =
            Math.max(
                0,
                Math.round(
                    Number(height) || 0
                )
            );


        root.style.setProperty(
            "--keyboard-height",
            height + "px"
        );


        if (
            height > 0
        ) {

            root.style.setProperty(
                "--composer-bottom",
                height + "px"
            );

        } else {

            root.style.setProperty(
                "--composer-bottom",
                navigationHeight + "px"
            );

        }


        const composer =
            getComposer();


        if (!composer) {
            return;
        }


        composer.style.setProperty(
            "position",
            "absolute",
            "important"
        );


        composer.style.setProperty(
            "left",
            "0",
            "important"
        );


        composer.style.setProperty(
            "right",
            "0",
            "important"
        );


        composer.style.setProperty(
            "bottom",
            (
                height > 0
                    ? height
                    : navigationHeight
            ) + "px",
            "important"
        );


        composer.style.setProperty(
            "z-index",
            "18",
            "important"
        );

    }


    /* =========================================================
       حالة Body
       ========================================================= */

    function updateBodyState(
        height
    ) {

        const body =
            getBody();


        if (!body) {
            return;
        }


        if (
            height > 0
        ) {

            body.classList.add(
                "wfesc-keyboard-open"
            );

        } else {

            body.classList.remove(
                "wfesc-keyboard-open"
            );

        }

    }


    /* =========================================================
       تطبيق التخطيط
       ========================================================= */

    function applyLayout(
        height
    ) {

        height =
            Math.max(
                0,
                Math.round(
                    Number(height) || 0
                )
            );


        keyboardHeight =
            height;


        keyboardOpen =
            height > 0;


        updateBodyState(
            height
        );


        lockNavigation();

        lockChatView();

        lockChatHeader();

        applyComposerPosition(
            height
        );

    }


    /* =========================================================
       Update
       ========================================================= */

    function update() {

        if (
            !initialized
        ) {
            return;
        }


        const height =
            calculateKeyboardHeight();


        applyLayout(
            height
        );

    }


    /* =========================================================
       جدولة Update
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
         * نلتقط الحالة الطبيعية قبل ظهور الكيبورد.
         */

        if (
            !keyboardOpen
        ) {

            captureBaseViewportHeight();

        }


        /*
         * لا:
         *
         * window.scrollTo()
         *
         * لا:
         *
         * scrollIntoView()
         *
         * لا:
         *
         * translate للـChat
         */

        scheduleUpdate(0);


        setTimeout(
            update,
            80
        );


        setTimeout(
            update,
            180
        );


        setTimeout(
            update,
            350
        );

    }


    /* =========================================================
       Blur
       ========================================================= */

    function handleInputBlur() {

        setTimeout(
            update,
            50
        );


        setTimeout(
            function () {

                keyboardOpen =
                    false;

                captureBaseViewportHeight();

                update();

            },
            250
        );

    }


    /* =========================================================
       Resize
       ========================================================= */

    function handleResize() {

        const currentOrientation =
            window.innerWidth >
            window.innerHeight
                ? "landscape"
                : "portrait";


        if (
            currentOrientation !==
            lastOrientation
        ) {

            lastOrientation =
                currentOrientation;


            keyboardOpen =
                false;


            keyboardHeight =
                0;


            root.style.setProperty(
                "--keyboard-height",
                "0px"
            );


            root.style.setProperty(
                "--composer-bottom",
                navigationHeight + "px"
            );


            setTimeout(
                function () {

                    captureBaseViewportHeight();

                    update();

                },
                300
            );


            return;

        }


        if (
            !keyboardOpen
        ) {

            captureBaseViewportHeight();

        }


        scheduleUpdate(0);

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
                 * لا نغير position.
                 * فقط نعيد قراءة حالة الكيبورد.
                 */

                scheduleUpdate(0);

            },
            {
                passive: true
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
            handleResize,
            {
                passive: true
            }
        );


        window.addEventListener(
            "orientationchange",
            handleResize,
            {
                passive: true
            }
        );


        window.addEventListener(
            "pageshow",
            function () {

                keyboardOpen =
                    false;

                keyboardHeight =
                    0;

                captureBaseViewportHeight();

                applyLayout(0);

            },
            {
                passive: true
            }
        );

    }


    /* =========================================================
       Reset
       ========================================================= */

    function resetState() {

        keyboardOpen =
            false;

        keyboardHeight =
            0;


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


        /*
         * لازم يكون قبل أي Focus.
         */

        ensureInteractiveWidgetMeta();

        setupVirtualKeyboard();

        setupVisualViewport();

        captureBaseViewportHeight();

        resetState();

        setupInputEvents();

        setupWindowEvents();

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

                return keyboardHeight;

            },

        isOpen:
            function () {

                return keyboardOpen;

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

        /*
         * VirtualKeyboard لازم يتفعل
         * قبل تفاعل المستخدم.
         */

        try {

            if (
                "virtualKeyboard" in navigator
            ) {

                navigator.virtualKeyboard
                    .overlaysContent = true;

            }

        } catch (_) {}


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
