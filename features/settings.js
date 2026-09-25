/* =========================================================
   WFESC SETTINGS SYSTEM
   نظام إعدادات WFESC
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       منع التكرار
    ===================================================== */

    if (window.WFESC_SETTINGS_LOADED) {
        return;
    }

    window.WFESC_SETTINGS_LOADED = true;


    /* =====================================================
       الإعدادات المحفوظة
    ===================================================== */

    const SETTINGS = {

        theme:
            localStorage.getItem("wfesc-theme") || "dark",

        animations:
            localStorage.getItem("wfesc-animations") !== "off"

    };


    /* =====================================================
       CSS
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
               GLOBAL TRANSITIONS
            ================================================= */

            body,
            header,
            section,
            footer,
            button,
            a,
            input,
            textarea,
            select,
            .about-box,
            .goal-card,
            .social-link,
            .share-box {

                transition:
                    background-color .45s ease,
                    color .45s ease,
                    border-color .45s ease,
                    box-shadow .45s ease,
                    transform .35s ease,
                    opacity .35s ease;

            }


            /* =================================================
               SETTINGS BUTTON
            ================================================= */

            #wfesc-settings-button {

                position: fixed;

                top: 82px;
                right: 18px;

                z-index: 9998;

                padding: 9px 15px;

                background:
                    rgba(12,12,12,.88);

                color:
                    #fff;

                border:
                    1px solid rgba(255,255,255,.12);

                border-radius:
                    10px;

                cursor:
                    pointer;

                font-family:
                    Arial,
                    Tahoma,
                    sans-serif;

                font-size:
                    13px;

                backdrop-filter:
                    blur(12px);

                -webkit-backdrop-filter:
                    blur(12px);

                transition:
                    .3s ease;

            }


            #wfesc-settings-button:hover {

                transform:
                    translateY(-2px)
                    scale(1.02);

                background:
                    rgba(255,255,255,.96);

                color:
                    #000;

                border-color:
                    rgba(255,255,255,.35);

                box-shadow:
                    0 8px 30px
                    rgba(0,0,0,.30);

            }


            #wfesc-settings-button:active {

                transform:
                    scale(.94);

            }


            /* =================================================
               SETTINGS PANEL
            ================================================= */

            #wfesc-settings-panel {

                position:
                    fixed;

                top:
                    130px;

                right:
                    18px;

                width:
                    290px;

                max-height:
                    calc(100vh - 155px);

                overflow-y:
                    auto;

                z-index:
                    9999;

                padding:
                    22px;

                background:
                    rgba(12,12,12,.94);

                color:
                    #fff;

                border:
                    1px solid
                    rgba(255,255,255,.10);

                border-radius:
                    17px;

                box-shadow:
                    0 20px 60px
                    rgba(0,0,0,.45);

                backdrop-filter:
                    blur(20px);

                -webkit-backdrop-filter:
                    blur(20px);

                opacity:
                    0;

                visibility:
                    hidden;

                transform:
                    translateY(-12px)
                    scale(.96);

                transform-origin:
                    top right;

                transition:
                    opacity .28s ease,
                    transform .28s ease,
                    visibility .28s ease;

            }


            #wfesc-settings-panel.active {

                opacity:
                    1;

                visibility:
                    visible;

                transform:
                    translateY(0)
                    scale(1);

            }


            #wfesc-settings-panel h3 {

                margin:
                    0 0 18px;

                font-size:
                    19px;

                font-weight:
                    600;

            }


            /* =================================================
               SETTINGS ROW
            ================================================= */

            .wfesc-setting-row {

                display:
                    flex;

                align-items:
                    center;

                justify-content:
                    space-between;

                gap:
                    15px;

                padding:
                    14px 0;

                border-bottom:
                    1px solid
                    rgba(255,255,255,.07);

            }


            .wfesc-setting-info {

                display:
                    flex;

                flex-direction:
                    column;

                gap:
                    5px;

                min-width:
                    0;

            }


            .wfesc-setting-info span {

                font-size:
                    14px;

            }


            .wfesc-setting-info small {

                color:
                    #888;

                font-size:
                    11px;

            }


            /* =================================================
               SWITCH
            ================================================= */

            .wfesc-switch {

                position:
                    relative;

                width:
                    54px;

                height:
                    30px;

                flex-shrink:
                    0;

            }


            .wfesc-switch input {

                opacity:
                    0;

                width:
                    0;

                height:
                    0;

                position:
                    absolute;

            }


            .wfesc-slider {

                position:
                    absolute;

                inset:
                    0;

                cursor:
                    pointer;

                background:
                    #292929;

                border:
                    1px solid
                    #3a3a3a;

                border-radius:
                    30px;

                transition:
                    .35s ease;

            }


            .wfesc-slider::before {

                content:
                    "";

                position:
                    absolute;

                width:
                    22px;

                height:
                    22px;

                left:
                    3px;

                top:
                    3px;

                background:
                    #fff;

                border-radius:
                    50%;

                box-shadow:
                    0 2px 7px
                    rgba(0,0,0,.35);

                transition:
                    transform .35s
                    cubic-bezier(.4,0,.2,1),
                    background .35s ease;

            }


            .wfesc-switch input:checked
            + .wfesc-slider {

                background:
                    #e8e8e8;

                border-color:
                    #fff;

            }


            .wfesc-switch input:checked
            + .wfesc-slider::before {

                transform:
                    translateX(24px);

                background:
                    #111;

            }


            /* =================================================
               DARK MODE
            ================================================= */

            body {

                background:
                    #050505;

                color:
                    #eee;

            }


            /* =================================================
               LIGHT MODE
            ================================================= */

            body.wfesc-light {

                background:
                    #f5f5f5;

                color:
                    #111;

            }


            body.wfesc-light header {

                background:
                    rgba(255,255,255,.94);

                border-bottom-color:
                    #ddd;

            }


            body.wfesc-light .nav-links a {

                color:
                    #555;

            }


            body.wfesc-light .nav-links a:hover {

                color:
                    #000;

            }


            body.wfesc-light .hero-subtitle {

                color:
                    #555;

            }


            body.wfesc-light section {

                border-top-color:
                    #ddd;

            }


            body.wfesc-light .about-box,
            body.wfesc-light .goal-card,
            body.wfesc-light .social-link,
            body.wfesc-light .share-box {

                background:
                    #fff;

                color:
                    #111;

                border-color:
                    #ddd;

            }


            body.wfesc-light .goal-card p,
            body.wfesc-light .social-user,
            body.wfesc-light .share-box p,
            body.wfesc-light .section-title p {

                color:
                    #666;

            }


            body.wfesc-light .social-link:hover {

                background:
                    #f0f0f0;

                border-color:
                    #bbb;

            }


            body.wfesc-light footer {

                border-top-color:
                    #ddd;

            }


            body.wfesc-light
            #wfesc-settings-button {

                background:
                    rgba(255,255,255,.94);

                color:
                    #111;

                border-color:
                    #d5d5d5;

            }


            body.wfesc-light
            #wfesc-settings-button:hover {

                background:
                    #111;

                color:
                    #fff;

                border-color:
                    #111;

            }


            body.wfesc-light
            #wfesc-settings-panel {

                background:
                    rgba(255,255,255,.96);

                color:
                    #111;

                border-color:
                    #ddd;

            }


            body.wfesc-light
            .wfesc-setting-info small {

                color:
                    #777;

            }


            /* =================================================
               ENHANCED ANIMATION SYSTEM
            ================================================= */

            body.wfesc-animations-enabled {

                animation:
                    wfescPageEnter
                    .55s
                    cubic-bezier(.22,1,.36,1);

            }


            body.wfesc-animations-enabled
            .hero {

                animation:
                    wfescHeroEnter
                    .8s
                    cubic-bezier(.22,1,.36,1);

            }


            body.wfesc-animations-enabled
            section {

                animation:
                    wfescSectionEnter
                    .7s
                    both;

            }


            body.wfesc-animations-enabled
            .about-box,
            body.wfesc-animations-enabled
            .goal-card,
            body.wfesc-animations-enabled
            .social-link,
            body.wfesc-animations-enabled
            .share-box {

                animation:
                    wfescCardEnter
                    .65s
                    cubic-bezier(.22,1,.36,1)
                    both;

            }


            body.wfesc-animations-enabled
            button:not(
                #wfesc-settings-button
            ) {

                transition:
                    transform .25s ease,
                    box-shadow .25s ease,
                    background .3s ease,
                    color .3s ease;

            }


            body.wfesc-animations-enabled
            button:not(
                #wfesc-settings-button
            ):hover {

                transform:
                    translateY(-2px);

            }


            body.wfesc-animations-enabled
            a:hover {

                transform:
                    translateY(-1px);

            }


            /* =================================================
               PAGE EXIT
            ================================================= */

            body.wfesc-page-leaving {

                opacity:
                    0;

                transform:
                    scale(.985);

                transition:
                    opacity .35s ease,
                    transform .35s ease;

            }


            /* =================================================
               ANIMATIONS
            ================================================= */

            @keyframes wfescPageEnter {

                from {

                    opacity:
                        0;

                }

                to {

                    opacity:
                        1;

                }

            }


            @keyframes wfescHeroEnter {

                from {

                    opacity:
                        0;

                    transform:
                        translateY(25px)
                        scale(.98);

                }

                to {

                    opacity:
                        1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            @keyframes wfescSectionEnter {

                from {

                    opacity:
                        0;

                    transform:
                        translateY(18px);

                }

                to {

                    opacity:
                        1;

                    transform:
                        translateY(0);

                }

            }


            @keyframes wfescCardEnter {

                from {

                    opacity:
                        0;

                    transform:
                        translateY(15px)
                        scale(.98);

                }

                to {

                    opacity:
                        1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            /* =================================================
               MOBILE
            ================================================= */

            @media (max-width: 700px) {

                #wfesc-settings-button {

                    top:
                        70px;

                    right:
                        12px;

                }


                #wfesc-settings-panel {

                    top:
                        112px;

                    right:
                        12px;

                    width:
                        calc(100vw - 24px);

                    max-width:
                        300px;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       إنشاء زر الإعدادات
       ===================================================== */

    function createButton() {

        if (
            document.getElementById(
                "wfesc-settings-button"
            )
        ) {
            return;
        }


        const button =
            document.createElement("button");


        button.id =
            "wfesc-settings-button";


        button.type =
            "button";


        button.textContent =
            "⚙ الإعدادات";


        document.body.appendChild(button);

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
            return;
        }


        const panel =
            document.createElement("div");


        panel.id =
            "wfesc-settings-panel";


        panel.innerHTML = `

            <h3>
                الإعدادات
            </h3>


            <!-- الوضع الداكن -->

            <div class="wfesc-setting-row">

                <div class="wfesc-setting-info">

                    <span>
                        الوضع الداكن
                    </span>

                    <small
                        id="wfesc-theme-status">
                    </small>

                </div>


                <label class="wfesc-switch">

                    <input
                        type="checkbox"
                        id="wfesc-theme-toggle"
                    >

                    <span class="wfesc-slider"></span>

                </label>

            </div>


            <!-- الأنميشن المعزز -->

            <div class="wfesc-setting-row">

                <div class="wfesc-setting-info">

                    <span>
                        الأنميشن المعزز
                    </span>

                    <small
                        id="wfesc-animation-status">
                    </small>

                </div>


                <label class="wfesc-switch">

                    <input
                        type="checkbox"
                        id="wfesc-animation-toggle"
                    >

                    <span class="wfesc-slider"></span>

                </label>

            </div>

        `;


        document.body.appendChild(panel);

    }


    /* =====================================================
       تطبيق الوضع
       ===================================================== */

    
    function applyTheme(theme) {

        const toggle =
            document.getElementById(
                "wfesc-theme-toggle"
            );


        const status =
            document.getElementById(
                "wfesc-theme-status"
            );


        if (theme === "light") {

            document.body.classList.add(
                "wfesc-light"
            );


            if (toggle) {
                toggle.checked = false;
            }


            if (status) {

                status.textContent =
                    "الوضع العادي";

            }


            return;

        }


        document.body.classList.remove(
            "wfesc-light"
        );


        if (toggle) {
            toggle.checked = true;
        }


        if (status) {

            status.textContent =
                "الوضع الداكن";

        }

    }


    /* =====================================================
       تطبيق الأنميشن
       ===================================================== */

    function applyAnimations(enabled) {

        const toggle =
            document.getElementById(
                "wfesc-animation-toggle"
            );


        const status =
            document.getElementById(
                "wfesc-animation-status"
            );


        if (enabled) {

            document.body.classList.add(
                "wfesc-animations-enabled"
            );


            if (toggle) {
                toggle.checked = true;
            }


            if (status) {

                status.textContent =
                    "مفعّل";

            }

        } else {

            document.body.classList.remove(
                "wfesc-animations-enabled"
            );


            if (toggle) {
                toggle.checked = false;
            }


            if (status) {

                status.textContent =
                    "متوقف";

            }

        }

    }


    /* =====================================================
       انتقال الصفحات
       ===================================================== */

    function initPageTransitions() {

        document.addEventListener(
            "click",
            (event) => {

                const link =
                    event.target.closest("a");


                if (!link) {
                    return;
                }


                if (
                    !SETTINGS.animations
                ) {
                    return;
                }


                const href =
                    link.getAttribute("href");


                if (!href) {
                    return;
                }


                if (
                    href.startsWith("#") ||
                    href.startsWith("javascript:") ||
                    href.startsWith("mailto:") ||
                    href.startsWith("tel:")
                ) {
                    return;
                }


                if (
                    link.target === "_blank" ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                ) {
                    return;
                }


                let destination;


                try {

                    destination =
                        new URL(
                            href,
                            window.location.href
                        );

                } catch {

                    return;

                }


                if (
                    destination.origin !==
                    window.location.origin
                ) {
                    return;
                }


                if (
                    destination.href ===
                    window.location.href
                ) {
                    return;
                }


                event.preventDefault();


                document.body.classList.add(
                    "wfesc-page-leaving"
                );


                setTimeout(() => {

                    window.location.href =
                        destination.href;

                }, 300);

            }
        );

    }


    /* =====================================================
       الأحداث
       ===================================================== */

    function initEvents() {

        const button =
            document.getElementById(
                "wfesc-settings-button"
            );


        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );


        const themeToggle =
            document.getElementById(
                "wfesc-theme-toggle"
            );


        const animationToggle =
            document.getElementById(
                "wfesc-animation-toggle"
            );


        if (
            !button ||
            !panel ||
            !themeToggle ||
            !animationToggle
        ) {
            return;
        }


        /* فتح الإعدادات */

        button.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                panel.classList.toggle(
                    "active"
                );

            }
        );


        /* منع الإغلاق عند الضغط داخل اللوحة */

        panel.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

            }
        );


        /* إغلاق عند الضغط خارجها */

        document.addEventListener(
            "click",
            () => {

                panel.classList.remove(
                    "active"
                );

            }
        );


        /* الوضع الداكن */

        themeToggle.addEventListener(
            "change",
            () => {

                const theme =
                    themeToggle.checked
                        ? "dark"
                        : "light";


                SETTINGS.theme =
                    theme;


                localStorage.setItem(
                    "wfesc-theme",
                    theme
                );


                applyTheme(theme);

            }
        );


        /* الأنميشن */

        animationToggle.addEventListener(
            "change",
            () => {

                const enabled =
                    animationToggle.checked;


                SETTINGS.animations =
                    enabled;


                localStorage.setItem(
                    "wfesc-animations",
                    enabled
                        ? "on"
                        : "off"
                );


                applyAnimations(
                    enabled
                );

            }
        );

    }


    /* =====================================================
       تشغيل النظام
       ===================================================== */

    function initSettings() {

        createStyles();

        createButton();

        createPanel();

        applyTheme(
            SETTINGS.theme
        );

        applyAnimations(
            SETTINGS.animations
        );

        initEvents();

        initPageTransitions();


        /* =================================================
           API للمستقبل
        ================================================= */

        window.WFESC_SETTINGS = {

            getTheme() {

                return SETTINGS.theme;

            },


            setTheme(theme) {

                if (
                    theme !== "dark" &&
                    theme !== "light"
                ) {
                    return false;
                }


                SETTINGS.theme =
                    theme;


                localStorage.setItem(
                    "wfesc-theme",
                    theme
                );


                applyTheme(theme);


                return true;

            },


            getAnimations() {

                return SETTINGS.animations;

            },


            setAnimations(enabled) {

                SETTINGS.animations =
                    Boolean(enabled);


                localStorage.setItem(
                    "wfesc-animations",
                    SETTINGS.animations
                        ? "on"
                        : "off"
                );


                applyAnimations(
                    SETTINGS.animations
                );


                return true;

            }

        };


        console.log(
            "[WFESC SETTINGS] Settings system loaded."
        );

    }


    /* =====================================================
       البداية
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSettings
        );

    } else {

        initSettings();

    }


})();
