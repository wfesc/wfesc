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
   ========================================================= */

(function () {
    "use strict";

    const root = document.documentElement;
    const body = document.body;

    const navigationHeight = 82;
    const keyboardThreshold = 80;

    let lastKeyboardHeight = -1;
    let updateTimer = null;
    let initialized = false;

    let visualViewportInstance = null;

    /* ---------------------------------------------------------
       أدوات عامة
       --------------------------------------------------------- */

    function getLayoutHeight() {
        return Math.max(
            document.documentElement.clientHeight || 0,
            window.innerHeight || 0
        );
    }

    function getViewportBottom() {
        if (visualViewportInstance) {
            return (
                visualViewportInstance.height +
                visualViewportInstance.offsetTop
            );
        }

        return window.innerHeight || getLayoutHeight();
    }

    /* ---------------------------------------------------------
       حساب ارتفاع الكيبورد
       --------------------------------------------------------- */

    function calculateKeyboardHeight() {
        const layoutHeight = getLayoutHeight();
        const viewportBottom = getViewportBottom();

        let height = layoutHeight - viewportBottom;

        if (!Number.isFinite(height)) {
            height = 0;
        }

        height = Math.max(0, Math.round(height));

        /*
         * القيم الصغيرة غالباً تكون بسبب:
         * - شريط النظام
         * - تغييرات بسيطة في الـ viewport
         * - safe area
         *
         * لذلك لا نعتبرها كيبورد.
         */
        if (height < keyboardThreshold) {
            height = 0;
        }

        return height;
    }

    /* ---------------------------------------------------------
       تطبيق ارتفاع الكيبورد
       --------------------------------------------------------- */

    function applyKeyboardHeight(height) {
        height = Math.max(
            0,
            Math.round(Number(height) || 0)
        );

        /*
         * لا نعيد كتابة CSS إذا لم يتغير الارتفاع.
         * هذا يقلل الـ reflow والاهتزاز.
         */
        if (height === lastKeyboardHeight) {
            return;
        }

        lastKeyboardHeight = height;

        root.style.setProperty(
            "--keyboard-height",
            height + "px"
        );

        /*
         * عند فتح الكيبورد:
         *
         * composer-bottom = ارتفاع الكيبورد
         *
         * وبالتالي يصبح الـ composer فوق الكيبورد مباشرة.
         *
         * عند إغلاقه:
         *
         * يرجع فوق شريط التنقل.
         */
        if (height > 0) {
            root.style.setProperty(
                "--composer-bottom",
                height + "px"
            );

            body.classList.add(
                "wfesc-keyboard-open"
            );
        } else {
            root.style.setProperty(
                "--composer-bottom",
                navigationHeight + "px"
            );

            body.classList.remove(
                "wfesc-keyboard-open"
            );
        }
    }

    /* ---------------------------------------------------------
       التحديث الأساسي
       --------------------------------------------------------- */

    function update() {
        if (!initialized) {
            return;
        }

        const height = calculateKeyboardHeight();

        applyKeyboardHeight(height);
    }

    /* ---------------------------------------------------------
       تحديث مؤجل
       --------------------------------------------------------- */

    function scheduleUpdate(delay) {
        if (updateTimer) {
            clearTimeout(updateTimer);
        }

        updateTimer = setTimeout(function () {
            updateTimer = null;
            update();
        }, delay || 0);
    }

    /* ---------------------------------------------------------
       التأكد من أن الصفحة جاهزة
       --------------------------------------------------------- */

    function isPageReady() {
        return (
            document.readyState === "interactive" ||
            document.readyState === "complete"
        );
    }

    /* ---------------------------------------------------------
       التركيز على حقل الرسالة
       --------------------------------------------------------- */

    function handleInputFocus() {
        /*
         * ننتظر قليلاً لأن VisualViewport قد لا يتغير
         * بنفس اللحظة التي يفتح فيها الكيبورد.
         */

        scheduleUpdate(30);

        setTimeout(update, 100);
        setTimeout(update, 250);
        setTimeout(update, 500);
    }

    /* ---------------------------------------------------------
       فقدان التركيز
       --------------------------------------------------------- */

    function handleInputBlur() {
        /*
         * بعد إغلاق الكيبورد قد يحتاج النظام عدة لحظات
         * لإعادة حجم الـ viewport الطبيعي.
         */

        scheduleUpdate(50);

        setTimeout(update, 150);
        setTimeout(update, 350);
    }

    /* ---------------------------------------------------------
       تغيير حجم نافذة المتصفح
       --------------------------------------------------------- */

    function handleWindowResize() {
        scheduleUpdate(20);

        setTimeout(update, 100);
    }

    /* ---------------------------------------------------------
       تدوير الشاشة
       --------------------------------------------------------- */

    function handleOrientationChange() {
        /*
         * بعد تدوير الهاتف يتغير:
         * width
         * height
         * visualViewport
         *
         * لذلك نعمل عدة تحديثات.
         */

        scheduleUpdate(50);

        setTimeout(update, 150);
        setTimeout(update, 350);
        setTimeout(update, 600);
    }

    /* ---------------------------------------------------------
       VisualViewport
       --------------------------------------------------------- */

    function setupVisualViewport() {
        if (!window.visualViewport) {
            return;
        }

        visualViewportInstance = window.visualViewport;

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
                scheduleUpdate(0);
            },
            {
                passive: true
            }
        );
    }

    /* ---------------------------------------------------------
       مراقبة فتح المحادثة
       --------------------------------------------------------- */

    function setupChatObserver() {
        const chatView = document.getElementById(
            "chatView"
        );

        if (!chatView) {
            return;
        }

        const observer = new MutationObserver(
            function () {
                /*
                 * عندما تفتح أو تغلق المحادثة
                 * نعيد حساب الـ viewport.
                 */

                scheduleUpdate(0);

                setTimeout(update, 100);
            }
        );

        observer.observe(chatView, {
            attributes: true,
            attributeFilter: [
                "class"
            ]
        });
    }

    /* ---------------------------------------------------------
       مراقبة حقل الكتابة
       --------------------------------------------------------- */

    function setupInputEvents() {
        const input = document.getElementById(
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

    /* ---------------------------------------------------------
       مراقبة الصفحة
       --------------------------------------------------------- */

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

        /*
         * pageshow مهم عند الرجوع للصفحة من history.
         */
        window.addEventListener(
            "pageshow",
            function () {
                scheduleUpdate(50);

                setTimeout(update, 200);
            },
            {
                passive: true
            }
        );
    }

    /* ---------------------------------------------------------
       التهيئة
       --------------------------------------------------------- */

    function init() {
        if (initialized) {
            return;
        }

        initialized = true;

        /*
         * البداية بدون كيبورد.
         */
        root.style.setProperty(
            "--keyboard-height",
            "0px"
        );

        root.style.setProperty(
            "--composer-bottom",
            navigationHeight + "px"
        );

        body.classList.remove(
            "wfesc-keyboard-open"
        );

        setupVisualViewport();
        setupInputEvents();
        setupWindowEvents();
        setupChatObserver();

        /*
         * تحديث أولي.
         */
        scheduleUpdate(0);

        /*
         * تحديثات إضافية بعد اكتمال رسم الصفحة.
         */
        setTimeout(update, 100);
        setTimeout(update, 300);
        setTimeout(update, 600);
    }

    /* ---------------------------------------------------------
       API عام
       --------------------------------------------------------- */

    window.WFESC_MESSAGE_KEYBOARD = {
        init: init,

        update: function () {
            update();
        },

        getHeight: function () {
            return calculateKeyboardHeight();
        },

        isOpen: function () {
            return calculateKeyboardHeight() > 0;
        }
    };

    /* ---------------------------------------------------------
       تشغيل تلقائي
       --------------------------------------------------------- */

    function boot() {
        if (!isPageReady()) {
            document.addEventListener(
                "DOMContentLoaded",
                init,
                {
                    once: true
                }
            );

            return;
        }

        init();
    }

    boot();

})();
