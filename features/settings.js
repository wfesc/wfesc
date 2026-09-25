/* =========================================================
   WFESC SOCIAL SYSTEM
   SETTINGS ENGINE
   نظام إعدادات WFESC

   مسؤول عن:
   - الوضع الداكن / الفاتح
   - الأنميشن المعزز
   - حفظ الإعدادات
   - استعادة الإعدادات
   - إضافة إعدادات مستقبلية بسهولة
   ========================================================= */

(() => {

    "use strict";

    /* =====================================================
       منع تشغيل الملف أكثر من مرة
       ===================================================== */

    if (window.WFESC_SETTINGS_LOADED) {
        return;
    }

    window.WFESC_SETTINGS_LOADED = true;


    /* =====================================================
       الإعدادات الأساسية
       ===================================================== */

    const SETTINGS = {

        theme:
            localStorage.getItem("wfesc-theme") ||
            "dark",

        animations:
            localStorage.getItem(
                "wfesc-animations"
            ) !== "off"

    };


    /* =====================================================
       API النظام
       ===================================================== */

    window.WFESC_SETTINGS = {

        version: "1.0.0",

        get(key) {

            return SETTINGS[key];

        },

        set(key, value) {

            SETTINGS[key] = value;

            saveSetting(
                key,
                value
            );

            applySettings();

            updateUI();

        },

        getAll() {

            return {
                ...SETTINGS
            };

        }

    };


    /* =====================================================
       حفظ الإعداد
       ===================================================== */

    function saveSetting(
        key,
        value
    ) {

        if (
            key === "theme"
        ) {

            localStorage.setItem(
                "wfesc-theme",
                value
            );

            return;

        }


        if (
            key === "animations"
        ) {

            localStorage.setItem(
                "wfesc-animations",
                value
                    ? "on"
                    : "off"
            );

        }

    }


    /* =====================================================
       تطبيق الوضعيات
       ===================================================== */

    function applySettings() {

        /* الوضع الداكن / الفاتح */

        if (
            SETTINGS.theme ===
            "light"
        ) {

            document.body.classList.add(
                "wfesc-light"
            );

        } else {

            document.body.classList.remove(
                "wfesc-light"
            );

        }


        /* الأنميشن */

        if (
            SETTINGS.animations
        ) {

            document.body.classList.add(
                "wfesc-animations-enabled"
            );

        } else {

            document.body.classList.remove(
                "wfesc-animations-enabled"
            );

        }

    }


    /* =====================================================
       إنشاء زر الإعدادات
       ===================================================== */

    function createSettingsButton() {

        if (
            document.getElementById(
                "wfesc-settings-button"
            )
        ) {

            return;

        }


        const button =
            document.createElement(
                "button"
            );


        button.id =
            "wfesc-settings-button";


        button.type =
            "button";


        button.setAttribute(
            "aria-label",
            "الإعدادات"
        );


        button.innerHTML =
            "⚙";


        document.body.appendChild(
            button
        );


        button.addEventListener(
            "click",
            openSettings
        );

    }


    /* =====================================================
       إنشاء لوحة الإعدادات
       ===================================================== */

    function createSettingsPanel() {

        if (
            document.getElementById(
                "wfesc-settings-panel"
            )
        ) {

            return;

        }


        const panel =
            document.createElement(
                "div"
            );


        panel.id =
            "wfesc-settings-panel";


        panel.innerHTML = `

            <div
                class="wfesc-settings-box"
                role="dialog"
                aria-modal="true"
                aria-label="إعدادات WFESC"
            >

                <button
                    type="button"
                    id="wfesc-settings-close"
                    class="wfesc-settings-close"
                    aria-label="إغلاق"
                >
                    ×
                </button>


                <div
                    class="wfesc-settings-header"
                >

                    <div
                        class="wfesc-settings-icon"
                    >
                        ⚙
                    </div>

                    <h2>
                        الإعدادات
                    </h2>

                    <p>
                        تخصيص تجربة WFESC
                    </p>

                </div>


                <div
                    class="wfesc-settings-content"
                >

                    <!-- الوضع -->

                    <div
                        class="wfesc-setting-row"
                    >

                        <div
                            class="wfesc-setting-info"
                        >

                            <span>
                                الوضع
                            </span>

                            <small
                                id="wfesc-theme-status"
                            >
                                الوضع الداكن
                            </small>

                        </div>


                        <button
                            type="button"
                            id="wfesc-theme-toggle"
                            class="wfesc-settings-action"
                        >
                            تبديل
                        </button>

                    </div>


                    <!-- الأنميشن -->

                    <div
                        class="wfesc-setting-row"
                    >

                        <div
                            class="wfesc-setting-info"
                        >

                            <span>
                                الأنميشن المعزز
                            </span>

                            <small
                                id="wfesc-animation-status"
                            >
                                مفعّل
                            </small>

                        </div>


                        <label
                            class="wfesc-switch"
                        >

                            <input
                                type="checkbox"
                                id="wfesc-animation-toggle"
                            >

                            <span
                                class="wfesc-slider"
                            ></span>

                        </label>

                    </div>


                    <!-- مكان مخصص لإعدادات مستقبلية -->

                    <div
                        id="wfesc-future-settings"
                    ></div>

                </div>

            </div>

        `;


        document.body.appendChild(
            panel
        );


        bindSettingsPanel();

    }


    /* =====================================================
       ربط أزرار الإعدادات
       ===================================================== */

    function bindSettingsPanel() {

        const closeButton =
            document.getElementById(
                "wfesc-settings-close"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeSettings
            );

        }


        const themeButton =
            document.getElementById(
                "wfesc-theme-toggle"
            );


        if (themeButton) {

            themeButton.addEventListener(
                "click",
                toggleTheme
            );

        }


        const animationToggle =
            document.getElementById(
                "wfesc-animation-toggle"
            );


        if (animationToggle) {

            animationToggle.addEventListener(
                "change",
                function () {

                    SETTINGS.animations =
                        animationToggle.checked;


                    saveSetting(
                        "animations",
                        SETTINGS.animations
                    );


                    applySettings();

                    updateUI();

                }
            );

        }


        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );


        if (panel) {

            panel.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        panel
                    ) {

                        closeSettings();

                    }

                }
            );

        }

    }


    /* =====================================================
       تبديل الوضع
       ===================================================== */

    function toggleTheme() {

        SETTINGS.theme =
            SETTINGS.theme ===
            "dark"
                ? "light"
                : "dark";


        saveSetting(
            "theme",
            SETTINGS.theme
        );


        applySettings();

        updateUI();

    }


    /* =====================================================
       فتح الإعدادات
       ===================================================== */

    function openSettings() {

        createSettingsPanel();

        updateUI();


        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );


        if (!panel) {
            return;
        }


        panel.classList.add(
            "wfesc-settings-open"
        );


        document.body.classList.add(
            "wfesc-settings-lock"
        );

    }


    /* =====================================================
       إغلاق الإعدادات
       ===================================================== */

    function closeSettings() {

        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );


        if (panel) {

            panel.classList.remove(
                "wfesc-settings-open"
            );

        }


        document.body.classList.remove(
            "wfesc-settings-lock"
        );

    }


    /* =====================================================
       تحديث واجهة الإعدادات
       ===================================================== */

    function updateUI() {

        const themeStatus =
            document.getElementById(
                "wfesc-theme-status"
            );


        const animationStatus =
            document.getElementById(
                "wfesc-animation-status"
            );


        const animationToggle =
            document.getElementById(
                "wfesc-animation-toggle"
            );


        if (themeStatus) {

            themeStatus.textContent =
                SETTINGS.theme ===
                "light"
                    ? "الوضع الفاتح"
                    : "الوضع الداكن";

        }


        if (animationStatus) {

            animationStatus.textContent =
                SETTINGS.animations
                    ? "مفعّل"
                    : "متوقف";

        }


        if (animationToggle) {

            animationToggle.checked =
                SETTINGS.animations;

        }

    }


    /* =====================================================
       CSS
       ===================================================== */

    function createSettingsStyle() {

        if (
            document.getElementById(
                "wfesc-settings-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfesc-settings-style";


        style.textContent = `

            #wfesc-settings-button {

                position: fixed;

                bottom: 20px;

                left: 20px;

                z-index: 99990;

                width: 44px;

                height: 44px;

                border-radius: 50%;

                border:
                    1px solid
                    rgba(255,255,255,.15);

                background:
                    rgba(15,15,15,.9);

                color: #fff;

                font-size: 19px;

                cursor: pointer;

                display: flex;

                align-items: center;

                justify-content: center;

                transition:
                    transform .25s ease,
                    background .25s ease;

            }


            #wfesc-settings-button:hover {

                transform:
                    rotate(25deg)
                    scale(1.05);

                background:
                    #1c1c1c;

            }


            #wfesc-settings-panel {

                position: fixed;

                inset: 0;

                z-index: 999999;

                display: flex;

                align-items: center;

                justify-content: center;

                padding: 20px;

                background:
                    rgba(0,0,0,.72);

                backdrop-filter:
                    blur(8px);

                -webkit-backdrop-filter:
                    blur(8px);

                opacity: 0;

                visibility: hidden;

                pointer-events: none;

                transition:
                    opacity .25s ease,
                    visibility .25s ease;

            }


            #wfesc-settings-panel
            .wfesc-settings-box {

                width:
                    min(430px, 100%);

                max-height:
                    calc(100vh - 40px);

                overflow-y: auto;

                padding: 25px;

                position: relative;

                border-radius: 18px;

                background: #0b0b0b;

                color: #fff;

                border:
                    1px solid
                    rgba(255,255,255,.12);

                box-shadow:
                    0 25px 80px
                    rgba(0,0,0,.55);

                transform:
                    translateY(15px)
                    scale(.98);

                transition:
                    transform .25s ease;

            }


            #wfesc-settings-panel
            .wfesc-settings-box {

                transform:
                    translateY(15px)
                    scale(.98);

            }


            #wfesc-settings-panel.wfesc-settings-open {

                opacity: 1;

                visibility: visible;

                pointer-events: auto;

            }


            #wfesc-settings-panel.wfesc-settings-open
            .wfesc-settings-box {

                transform:
                    translateY(0)
                    scale(1);

            }


            .wfesc-settings-close {

                position: absolute;

                top: 12px;

                right: 12px;

                width: 34px;

                height: 34px;

                border: 0;

                border-radius: 50%;

                background:
                    rgba(255,255,255,.07);

                color: #fff;

                font-size: 23px;

                cursor: pointer;

            }


            .wfesc-settings-header {

                text-align: center;

                margin-bottom: 22px;

            }


            .wfesc-settings-icon {

                width: 55px;

                height: 55px;

                margin:
                    0 auto 10px;

                display: flex;

                align-items: center;

                justify-content: center;

                border-radius: 50%;

                background:
                    rgba(255,255,255,.08);

                font-size: 25px;

            }


            .wfesc-settings-header h2 {

                margin: 0 0 6px;

                font-size: 21px;

            }


            .wfesc-settings-header p {

                margin: 0;

                color: #999;

                font-size: 12px;

            }


            .wfesc-setting-row {

                display: flex;

                align-items: center;

                justify-content:
                    space-between;

                gap: 15px;

                padding: 15px 0;

                border-bottom:
                    1px solid
                    rgba(255,255,255,.08);

            }


            .wfesc-setting-info {

                display: flex;

                flex-direction: column;

                gap: 5px;

                min-width: 0;

            }


            .wfesc-setting-info span {

                font-size: 14px;

            }


            .wfesc-setting-info small {

                color: #888;

                font-size: 11px;

            }


            .wfesc-settings-action {

                border:
                    1px solid
                    rgba(255,255,255,.16);

                background:
                    rgba(255,255,255,.06);

                color: #fff;

                border-radius: 9px;

                padding: 8px 12px;

                cursor: pointer;

                font-size: 11px;

            }


            .wfesc-switch {

                position: relative;

                width: 43px;

                height: 23px;

                flex-shrink: 0;

            }


            .wfesc-switch input {

                opacity: 0;

                width: 0;

                height: 0;

            }


            .wfesc-slider {

                position: absolute;

                inset: 0;

                cursor: pointer;

                border-radius: 20px;

                background: #333;

                transition:
                    background .25s ease;

            }


            .wfesc-slider::before {

                content: "";

                position: absolute;

                width: 17px;

                height: 17px;

                left: 3px;

                top: 3px;

                border-radius: 50%;

                background: #fff;

                transition:
                    transform .25s ease;

            }


            .wfesc-switch input:checked
            + .wfesc-slider {

                background: #777;

            }


            .wfesc-switch input:checked
            + .wfesc-slider::before {

                transform:
                    translateX(20px);

            }


            body.wfesc-settings-lock {

                overflow: hidden !important;

            }


            /* الأنميشن المعزز */

            body.wfesc-animations-enabled
            .wfesc-settings-box {

                animation:
                    wfescSettingsEnter
                    .35s ease;

            }


            body.wfesc-animations-enabled
            #wfesc-settings-button {

                animation:
                    wfescSettingsButtonIn
                    .5s ease;

            }


            @keyframes wfescSettingsEnter {

                from {

                    opacity: 0;

                    transform:
                        translateY(20px)
                        scale(.96);

                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            @keyframes wfescSettingsButtonIn {

                from {

                    opacity: 0;

                    transform:
                        scale(.7)
                        rotate(-30deg);

                }

                to {

                    opacity: 1;

                    transform:
                        scale(1)
                        rotate(0);

                }

            }


            body.wfesc-light
            #wfesc-settings-button {

                background: #fff;

                color: #111;

                border-color: #ddd;

            }


            body.wfesc-light
            #wfesc-settings-panel
            .wfesc-settings-box {

                background: #fff;

                color: #111;

                border-color: #ddd;

            }


            body.wfesc-light
            .wfesc-settings-header p {

                color: #777;

            }


            body.wfesc-light
            .wfesc-setting-row {

                border-bottom-color:
                    #ddd;

            }


            body.wfesc-light
            .wfesc-setting-info small {

                color: #777;

            }


            body.wfesc-light
            .wfesc-settings-action {

                background: #f4f4f4;

                color: #111;

                border-color: #ccc;

            }


            body.wfesc-light
            .wfesc-settings-close {

                background: #eee;

                color: #111;

            }


            @media (max-width: 500px) {

                #wfesc-settings-button {

                    bottom: 15px;

                    left: 15px;

                }


                #wfesc-settings-panel {

                    padding: 12px;

                }


                #wfesc-settings-panel
                .wfesc-settings-box {

                    padding: 20px;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       التهيئة
       ===================================================== */

    function initSettings() {

        createSettingsStyle();

        createSettingsButton();

        applySettings();

        updateUI();


        console.log(
            "[WFESC SETTINGS] Loaded.",
            SETTINGS
        );

    }


    /* =====================================================
       تشغيل النظام
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSettings
        );

    } else {

        initSettings();

    }

})();
                    
