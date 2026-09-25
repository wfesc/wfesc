/* =========================================================
   WFESC SETTINGS
   نظام إعدادات WFESC
   ---------------------------------------------------------
   المسؤول عن:
   - الوضع المظلم / العادي
   - الأنيميشن المعزز
   - حفظ الإعدادات
   - واجهة الإعدادات
   - خيار الحساب داخل الإعدادات

   تسجيل الدخول نفسه يبقى مسؤولية:
   account.js + auth.js
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       منع التشغيل المكرر
    ===================================================== */

    if (window.WFESC_SETTINGS_LOADED) {
        return;
    }

    window.WFESC_SETTINGS_LOADED = true;


    /* =====================================================
       مفاتيح الحفظ
    ===================================================== */

    const KEYS = {

        theme:
            "wfesc-theme",

        animations:
            "wfesc-animations"

    };


    /* =====================================================
       الحالة الحالية
    ===================================================== */

    const state = {

        theme:
            localStorage.getItem(KEYS.theme)
            || "dark",

        animations:
            localStorage.getItem(KEYS.animations) === null
                ? true
                : localStorage.getItem(KEYS.animations) === "true"

    };


    /* =====================================================
       تطبيق الوضع
    ===================================================== */

    function applyTheme() {

        const light =
            state.theme === "light";


        document.documentElement.classList.toggle(
            "wfesc-light",
            light
        );


        if (document.body) {

            document.body.classList.toggle(
                "wfesc-light",
                light
            );

        }


        document.documentElement.setAttribute(
            "data-wfesc-theme",
            light
                ? "light"
                : "dark"
        );


        localStorage.setItem(
            KEYS.theme,
            state.theme
        );

    }


    /* =====================================================
       تطبيق الأنيميشن
    ===================================================== */

    function applyAnimations() {

        const enabled =
            state.animations;


        document.documentElement.classList.toggle(
            "wfesc-enhanced-animations",
            enabled
        );


        document.documentElement.classList.toggle(
            "wfesc-no-animations",
            !enabled
        );


        if (document.body) {

            document.body.classList.toggle(
                "wfesc-enhanced-animations",
                enabled
            );


            document.body.classList.toggle(
                "wfesc-no-animations",
                !enabled
            );

        }


        localStorage.setItem(
            KEYS.animations,
            String(enabled)
        );

    }


    /* =====================================================
       إنشاء CSS
    ===================================================== */

    function createStyles() {

        if (
            document.getElementById(
                "wfesc-settings-style"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "wfesc-settings-style";


        style.textContent = `

            /* =================================================
               BASE
            ================================================= */

            html,
            body {

                background-color:
                    #050505;

                color:
                    #eee;

            }


            /* =================================================
               LIGHT MODE
            ================================================= */

            html.wfesc-light,
            html.wfesc-light body,
            body.wfesc-light {

                background-color:
                    #ffffff !important;

                color:
                    #111111 !important;

            }


            body.wfesc-light header,
            body.wfesc-light nav,
            body.wfesc-light main,
            body.wfesc-light section,
            body.wfesc-light article,
            body.wfesc-light footer {

                background-color:
                    #ffffff;

                color:
                    #111111;

            }


            body.wfesc-light input,
            body.wfesc-light textarea,
            body.wfesc-light select {

                background:
                    #ffffff;

                color:
                    #111111;

                border-color:
                    #d5d5d5;

            }


            /* =================================================
               SETTINGS BACKDROP
            ================================================= */

            #wfesc-settings-backdrop {

                position:
                    fixed;

                inset:
                    0;

                width:
                    100%;

                height:
                    100%;

                z-index:
                    999997;

                background:
                    rgba(0,0,0,.70);

                backdrop-filter:
                    blur(8px);

                -webkit-backdrop-filter:
                    blur(8px);

                opacity:
                    0;

                visibility:
                    hidden;

                pointer-events:
                    none;

            }


            #wfesc-settings-backdrop.wfesc-settings-open {

                opacity:
                    1;

                visibility:
                    visible;

                pointer-events:
                    auto;

            }


            /* =================================================
               SETTINGS PANEL
            ================================================= */

            #wfesc-settings-panel {

                position:
                    fixed;

                top:
                    50%;

                left:
                    50%;

                width:
                    min(
                        430px,
                        calc(100% - 28px)
                    );

                max-height:
                    calc(100vh - 40px);

                overflow-y:
                    auto;

                transform:
                    translate(-50%,-50%)
                    scale(.94);

                opacity:
                    0;

                visibility:
                    hidden;

                pointer-events:
                    none;

                z-index:
                    999998;

                padding:
                    24px;

                border-radius:
                    20px;

                background:
                    #0b0b0b;

                color:
                    #fff;

                border:
                    1px solid
                    rgba(255,255,255,.12);

                box-shadow:
                    0 30px 100px
                    rgba(0,0,0,.65);

            }


            #wfesc-settings-panel.wfesc-settings-open {

                opacity:
                    1;

                visibility:
                    visible;

                pointer-events:
                    auto;

                transform:
                    translate(-50%,-50%)
                    scale(1);

            }


            /* =================================================
               LIGHT SETTINGS
            ================================================= */

            body.wfesc-light
            #wfesc-settings-panel {

                background:
                    #ffffff;

                color:
                    #111111;

                border-color:
                    #dddddd;

            }


            /* =================================================
               TITLE
            ================================================= */

            .wfesc-settings-title {

                margin:
                    0 0 20px;

                text-align:
                    center;

                font-size:
                    21px;

                font-weight:
                    600;

            }


            /* =================================================
               SETTING ROW
            ================================================= */

            .wfesc-setting-row {

                display:
                    flex;

                align-items:
                    center;

                justify-content:
                    space-between;

                gap:
                    14px;

                padding:
                    16px 0;

                border-bottom:
                    1px solid
                    rgba(255,255,255,.08);

            }


            body.wfesc-light
            .wfesc-setting-row {

                border-bottom-color:
                    #e5e5e5;

            }


            /* =================================================
               INFORMATION
            ================================================= */

            .wfesc-setting-info {

                min-width:
                    0;

            }


            .wfesc-setting-info strong {

                display:
                    block;

                margin-bottom:
                    5px;

                font-size:
                    14px;

            }


            .wfesc-setting-info small {

                display:
                    block;

                color:
                    #888;

                font-size:
                    11px;

                line-height:
                    1.5;

            }


            body.wfesc-light
            .wfesc-setting-info small {

                color:
                    #777;

            }


            /* =================================================
               TOGGLE
            ================================================= */

            .wfesc-toggle {

                position:
                    relative;

                width:
                    50px;

                height:
                    27px;

                flex-shrink:
                    0;

                border:
                    0;

                border-radius:
                    30px;

                background:
                    #444;

                cursor:
                    pointer;

                padding:
                    0;

            }


            .wfesc-toggle::after {

                content:
                    "";

                position:
                    absolute;

                width:
                    21px;

                height:
                    21px;

                top:
                    3px;

                left:
                    3px;

                border-radius:
                    50%;

                background:
                    #fff;

                transition:
                    transform .25s ease;

            }


            .wfesc-toggle.wfesc-toggle-on {

                background:
                    #fff;

            }


            .wfesc-toggle.wfesc-toggle-on::after {

                transform:
                    translateX(23px);

                background:
                    #111;

            }


            body.wfesc-light
            .wfesc-toggle {

                background:
                    #ccc;

            }


            body.wfesc-light
            .wfesc-toggle.wfesc-toggle-on {

                background:
                    #111;

            }


            body.wfesc-light
            .wfesc-toggle.wfesc-toggle-on::after {

                background:
                    #fff;

            }


            /* =================================================
               ACCOUNT
            ================================================= */

            #wfesc-account-setting {

                margin:
                    0;

            }


            .wfesc-account-setting-button {

                flex-shrink:
                    0;

                border:
                    1px solid
                    rgba(255,255,255,.16);

                background:
                    rgba(255,255,255,.06);

                color:
                    #fff;

                border-radius:
                    9px;

                padding:
                    9px 12px;

                font-family:
                    Arial,
                    Tahoma,
                    sans-serif;

                font-size:
                    11px;

                cursor:
                    pointer;

                white-space:
                    nowrap;

            }


            .wfesc-account-setting-button:hover {

                background:
                    #fff;

                color:
                    #000;

            }


            body.wfesc-light
            .wfesc-account-setting-button {

                background:
                    #f3f3f3;

                color:
                    #111;

                border-color:
                    #ccc;

            }


            body.wfesc-light
            .wfesc-account-setting-button:hover {

                background:
                    #111;

                color:
                    #fff;

            }


            /* =================================================
               ENHANCED ANIMATION
            ================================================= */

            html.wfesc-enhanced-animations {

                scroll-behavior:
                    smooth;

            }


            html.wfesc-enhanced-animations body {

                transition:
                    background-color .55s ease,
                    color .55s ease;

            }


            html.wfesc-enhanced-animations
            a {

                transition:
                    transform .25s ease,
                    opacity .25s ease,
                    color .3s ease;

            }


            html.wfesc-enhanced-animations
            button {

                transition:
                    transform .25s ease,
                    opacity .25s ease,
                    background-color .3s ease,
                    color .3s ease,
                    border-color .3s ease;

            }


            html.wfesc-enhanced-animations
            a:hover,
            html.wfesc-enhanced-animations
            button:hover {

                transform:
                    translateY(-1px);

            }


            html.wfesc-enhanced-animations
            img {

                transition:
                    opacity .35s ease,
                    transform .35s ease;

            }


            html.wfesc-enhanced-animations
            #wfesc-settings-panel {

                transition:
                    opacity .35s ease,
                    transform .45s cubic-bezier(
                        .16,
                        1,
                        .3,
                        1
                    ),
                    visibility .35s ease;

            }


            html.wfesc-enhanced-animations
            #wfesc-settings-backdrop {

                transition:
                    opacity .4s ease,
                    visibility .4s ease;

            }


            /* =================================================
               NORMAL MODE
               بدون مؤثرات
            ================================================= */

            html.wfesc-no-animations,
            html.wfesc-no-animations * {

                scroll-behavior:
                    auto !important;

            }


            html.wfesc-no-animations *,
            html.wfesc-no-animations *::before,
            html.wfesc-no-animations *::after {

                animation:
                    none !important;

                transition:
                    none !important;

            }


            html.wfesc-no-animations
            a:hover,

            html.wfesc-no-animations
            button:hover {

                transform:
                    none !important;

            }


            /* =================================================
               MOBILE
            ================================================= */

            @media(max-width:600px) {

                #wfesc-settings-panel {

                    width:
                        calc(100% - 24px);

                    padding:
                        19px;

                    border-radius:
                        16px;

                }


                .wfesc-setting-row {

                    gap:
                        9px;

                }


                .wfesc-account-setting-button {

                    padding:
                        8px 10px;

                    font-size:
                        10px;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       إنشاء لوحة الإعدادات
    ===================================================== */

    function createPanel() {

        if (
            document.getElementById(
                "wfesc-settings-panel"
            )
        ) {

            updateUI();

            return;

        }


        /* BACKDROP */

        const backdrop =
            document.createElement("div");


        backdrop.id =
            "wfesc-settings-backdrop";


        document.body.appendChild(
            backdrop
        );


        /* PANEL */

        const panel =
            document.createElement("div");


        panel.id =
            "wfesc-settings-panel";


        panel.innerHTML = `

            <h2
                class="wfesc-settings-title">

                الإعدادات

            </h2>


            <!-- =========================================
                 ACCOUNT
            ========================================== -->

            <div
                id="wfesc-account-setting"
                class="wfesc-setting-row">

                <div
                    class="wfesc-setting-info">

                    <strong>
                        👤 الحساب
                    </strong>

                    <small
                        id="wfesc-account-setting-status">

                        غير مسجل الدخول

                    </small>

                </div>


                <button
                    type="button"
                    id="wfesc-account-login-button"
                    class="wfesc-account-setting-button">

                    تسجيل الدخول

                </button>

            </div>


            <!-- =========================================
                 THEME
            ========================================== -->

            <div
                class="wfesc-setting-row">

                <div
                    class="wfesc-setting-info">

                    <strong>
                        🌙 الوضع
                    </strong>

                    <small
                        id="wfesc-theme-label">

                        الوضع المظلم

                    </small>

                </div>


                <button
                    type="button"
                    id="wfesc-theme-toggle"
                    class="wfesc-toggle"
                    aria-label="تغيير الوضع">

                </button>

            </div>


            <!-- =========================================
                 ENHANCED ANIMATION
            ========================================== -->

            <div
                class="wfesc-setting-row">

                <div
                    class="wfesc-setting-info">

                    <strong>
                        ✨ الأنيميشن المعزز
                    </strong>

                    <small
                        id="wfesc-animation-label">

                        انتقالات وحركة سلسة

                    </small>

                </div>


                <button
                    type="button"
                    id="wfesc-animation-toggle"
                    class="wfesc-toggle"
                    aria-label="تشغيل الأنيميشن المعزز">

                </button>

            </div>

        `;


        document.body.appendChild(
            panel
        );


        /* =================================================
           BACKDROP CLICK
        ================================================= */

        backdrop.addEventListener(
            "click",
            closePanel
        );


        /* =================================================
           THEME
        ================================================= */

        const themeToggle =
            document.getElementById(
                "wfesc-theme-toggle"
            );


        if (themeToggle) {

            themeToggle.addEventListener(
                "click",
                function () {

                    state.theme =
                        state.theme === "dark"
                            ? "light"
                            : "dark";


                    applyTheme();

                    updateUI();

                }
            );

        }


        /* =================================================
           ANIMATION
        ================================================= */

        const animationToggle =
            document.getElementById(
                "wfesc-animation-toggle"
            );


        if (animationToggle) {

            animationToggle.addEventListener(
                "click",
                function () {

                    state.animations =
                        !state.animations;


                    applyAnimations();

                    updateUI();

                }
            );

        }


        /* =================================================
           ACCOUNT BUTTON
        ================================================= */

        const accountButton =
            document.getElementById(
                "wfesc-account-login-button"
            );


        if (accountButton) {

            accountButton.addEventListener(
                "click",
                function () {

                    closePanel();


                    if (
                        typeof window.WFESC_ACCOUNT_OPEN ===
                        "function"
                    ) {

                        window.WFESC_ACCOUNT_OPEN(
                            "login"
                        );

                    } else {

                        console.warn(
                            "[WFESC SETTINGS] " +
                            "account.js غير جاهز."
                        );

                    }

                }
            );

        }


        /* =================================================
           جاهزية الإعدادات
        ================================================= */

        window.dispatchEvent(
            new CustomEvent(
                "wfesc-settings-ready"
            )
        );


        updateUI();

    }


    /* =====================================================
       تحديث حالة الحساب
    ===================================================== */

    function updateAccountState() {

        const status =
            document.getElementById(
                "wfesc-account-setting-status"
            );


        const button =
            document.getElementById(
                "wfesc-account-login-button"
            );


        if (!status || !button) {
            return;
        }


        const auth =
            window.WFESC_AUTH;


        const user =
            auth &&
            typeof auth.getUser === "function"
                ? auth.getUser()
                : null;


        if (user) {

            const name =
                user.user_metadata &&
                (
                    user.user_metadata.display_name ||
                    user.user_metadata.username ||
                    user.user_metadata.name
                );


            status.textContent =
                name ||
                user.email ||
                "تم تسجيل الدخول";


            button.textContent =
                "الحساب";

        } else {

            status.textContent =
                "غير مسجل الدخول";


            button.textContent =
                "تسجيل الدخول";

        }

    }


    /* =====================================================
       تحديث واجهة الإعدادات
    ===================================================== */

    function updateUI() {

        const themeToggle =
            document.getElementById(
                "wfesc-theme-toggle"
            );


        const animationToggle =
            document.getElementById(
                "wfesc-animation-toggle"
            );


        const themeLabel =
            document.getElementById(
                "wfesc-theme-label"
            );


        const animationLabel =
            document.getElementById(
                "wfesc-animation-label"
            );


        if (themeToggle) {

            themeToggle.classList.toggle(
                "wfesc-toggle-on",
                state.theme === "light"
            );

        }


        if (animationToggle) {

            animationToggle.classList.toggle(
                "wfesc-toggle-on",
                state.animations
            );

        }


        if (themeLabel) {

            themeLabel.textContent =
                state.theme === "light"
                    ? "الوضع العادي"
                    : "الوضع المظلم";

        }


        if (animationLabel) {

            animationLabel.textContent =
                state.animations
                    ? "انتقالات وحركة سلسة"
                    : "الحركة والانتقالات متوقفة";

        }


        updateAccountState();

    }


    /* =====================================================
       فتح الإعدادات
    ===================================================== */

    function openPanel() {

        createPanel();


        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );


        const backdrop =
            document.getElementById(
                "wfesc-settings-backdrop"
            );


        if (panel) {

            panel.classList.add(
                "wfesc-settings-open"
            );

        }


        if (backdrop) {

            backdrop.classList.add(
                "wfesc-settings-open"
            );

        }

    }


    /* =====================================================
       إغلاق الإعدادات
    ===================================================== */

    function closePanel() {

        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );


        const backdrop =
            document.getElementById(
                "wfesc-settings-backdrop"
            );


        if (panel) {

            panel.classList.remove(
                "wfesc-settings-open"
            );

        }


        if (backdrop) {

            backdrop.classList.remove(
                "wfesc-settings-open"
            );

        }

    }


    /* =====================================================
       مراقبة زر الإعدادات
    ===================================================== */

    function connectSettingsButton() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "#wfesc-settings-button"
                    );


                if (!button) {
                    return;
                }


                event.preventDefault();


                openPanel();

            }
        );

    }


    /* =====================================================
       مراقبة الحساب
    ===================================================== */

    function connectAccountEvents() {

        window.addEventListener(
            "wfesc-auth-state-change",
            function () {

                updateAccountState();

            }
        );


        window.addEventListener(
            "wfesc-settings-ready",
            function () {

                updateAccountState();

            }
        );

    }


    /* =====================================================
       API عام
    ===================================================== */

    window.WFESC_SETTINGS = {

        getTheme() {

            return state.theme;

        },


        setTheme(theme) {

            if (
                theme !== "dark" &&
                theme !== "light"
            ) {

                return false;

            }


            state.theme =
                theme;


            applyTheme();

            updateUI();


            return true;

        },


        getAnimations() {

            return state.animations;

        },


        setAnimations(enabled) {

            state.animations =
                Boolean(enabled);


            applyAnimations();

            updateUI();

        },


        open:
            openPanel,


        close:
            closePanel,


        refresh:
            updateUI

    };


    /* =====================================================
       التهيئة
    ===================================================== */

    function init() {

        createStyles();


        applyTheme();


        applyAnimations();


        connectSettingsButton();


        connectAccountEvents();


        /*
         * إذا كان زر الإعدادات موجوداً
         * من الموقع الأصلي، النظام جاهز.
         */

        if (
            document.getElementById(
                "wfesc-settings-button"
            )
        ) {

            console.log(
                "[WFESC SETTINGS] Ready."
            );

        } else {

            console.log(
                "[WFESC SETTINGS] Loaded."
            );

        }

    }


    /* =====================================================
       START
    ===================================================== */

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

})();
