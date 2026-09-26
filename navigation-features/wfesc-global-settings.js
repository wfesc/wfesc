(function () {
    "use strict";

    if (window.WFESCGlobalSettings) {
        return;
    }

    const STORAGE_KEYS = {
        theme: "wfescTheme",
        animation: "wfescEnhancedAnimation"
    };

    const DEFAULTS = {
        theme: "dark",
        animation: true
    };

    function getTheme() {
        const saved = localStorage.getItem(STORAGE_KEYS.theme);

        return saved === "light"
            ? "light"
            : DEFAULTS.theme;
    }

    function getAnimationEnabled() {
        const saved = localStorage.getItem(STORAGE_KEYS.animation);

        if (saved === null) {
            return DEFAULTS.animation;
        }

        return saved === "on";
    }

    function applyTheme(theme) {
        const html = document.documentElement;

        if (!html) {
            return;
        }

        const isLight = theme === "light";

        html.dataset.wfescTheme = isLight ? "light" : "dark";
        html.classList.toggle("wfesc-light-mode", isLight);

        if (document.body) {
            document.body.classList.toggle("light-mode", isLight);
        }
    }

    function applyAnimation(enabled) {
        const html = document.documentElement;

        if (!html) {
            return;
        }

        html.classList.toggle("wfesc-no-animation", !enabled);
    }

    function applyAll() {
        applyTheme(getTheme());
        applyAnimation(getAnimationEnabled());
    }

    function notify(type, value) {
        window.dispatchEvent(
            new CustomEvent("wfesc:settings-changed", {
                detail: {
                    type: type,
                    value: value
                }
            })
        );
    }

    function setTheme(theme) {
        theme = theme === "light" ? "light" : "dark";

        localStorage.setItem(
            STORAGE_KEYS.theme,
            theme
        );

        applyTheme(theme);

        notify("theme", theme);
    }

    function setAnimationEnabled(enabled) {
        enabled = Boolean(enabled);

        localStorage.setItem(
            STORAGE_KEYS.animation,
            enabled ? "on" : "off"
        );

        applyAnimation(enabled);

        notify("animation", enabled);
    }

    function toggleAnimation() {
        setAnimationEnabled(!getAnimationEnabled());
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEYS.theme);
        localStorage.removeItem(STORAGE_KEYS.animation);

        applyAll();

        notify("reset", {
            theme: getTheme(),
            animation: getAnimationEnabled()
        });
    }

    function getSettings() {
        return {
            theme: getTheme(),
            animation: getAnimationEnabled()
        };
    }

    function injectGlobalStyle() {
        if (document.getElementById("wfesc-global-settings-style")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "wfesc-global-settings-style";

        style.textContent = `
            /* =========================================
               WFESC GLOBAL SETTINGS
               ========================================= */

            html.wfesc-no-animation,
            html.wfesc-no-animation * {
                scroll-behavior: auto !important;
            }

            html.wfesc-no-animation *,
            html.wfesc-no-animation *::before,
            html.wfesc-no-animation *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }

            /* =========================================
               LIGHT MODE - GLOBAL
               ========================================= */

            html.wfesc-light-mode body {
                background-color: #f4f4f4 !important;
                color: #111 !important;
            }

            html.wfesc-light-mode input,
            html.wfesc-light-mode textarea,
            html.wfesc-light-mode select {
                background-color: #ffffff !important;
                color: #111 !important;
                border-color: #d0d0d0 !important;
            }

            html.wfesc-light-mode input::placeholder,
            html.wfesc-light-mode textarea::placeholder {
                color: #777 !important;
            }

            html.wfesc-light-mode .wfesc-navigation {
                background: rgba(255, 255, 255, 0.94) !important;
                border-top-color: rgba(0, 0, 0, 0.10) !important;
            }

            html.wfesc-light-mode .wfesc-navigation-item {
                color: #555 !important;
            }

            html.wfesc-light-mode .wfesc-navigation-item.active {
                color: #111 !important;
            }

            html.wfesc-light-mode .wfesc-navigation-icon,
            html.wfesc-light-mode .wfesc-navigation-title {
                color: inherit !important;
            }

            html.wfesc-light-mode .wfesc-page-loader {
                background: #f4f4f4 !important;
            }

            html.wfesc-light-mode .wfesc-loader-box {
                background: #ffffff !important;
                color: #111 !important;
                border-color: rgba(0, 0, 0, 0.10) !important;
            }

            /* =========================================
               COMMON WFESC SURFACES
               ========================================= */

            html.wfesc-light-mode .settings-page,
            html.wfesc-light-mode .settings-card,
            html.wfesc-light-mode .settings-section,
            html.wfesc-light-mode .modal-box {
                color: #111;
            }

            html.wfesc-light-mode .settings-card,
            html.wfesc-light-mode .settings-section,
            html.wfesc-light-mode .modal-box {
                background-color: #ffffff !important;
            }

            html.wfesc-light-mode .setting-description,
            html.wfesc-light-mode .modal-note {
                color: #666 !important;
            }

            /* =========================================
               LINKS
               ========================================= */

            html.wfesc-light-mode a {
                color: inherit;
            }

            /* =========================================
               REDUCED MOTION
               ========================================= */

            @media (prefers-reduced-motion: reduce) {
                html * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }
            }
        `;

        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.addEventListener(
                "DOMContentLoaded",
                function () {
                    if (!document.getElementById("wfesc-global-settings-style")) {
                        document.head.appendChild(style);
                    }
                },
                { once: true }
            );
        }
    }

    /*
     * تطبيق الإعدادات بأسرع وقت ممكن
     * حتى لا يظهر الموقع للحظة بإعدادات مختلفة.
     */

    applyAll();
    injectGlobalStyle();

    document.addEventListener("DOMContentLoaded", function () {
        applyAll();
        injectGlobalStyle();
    });

    /*
     * إذا تغيرت الإعدادات من صفحة ثانية أو كود ثاني
     * يتم تطبيقها مباشرة.
     */

    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key === STORAGE_KEYS.theme ||
                event.key === STORAGE_KEYS.animation
            ) {
                applyAll();
            }
        }
    );

    window.WFESCGlobalSettings = {

        version: "1.0.0",

        keys: {
            theme: STORAGE_KEYS.theme,
            animation: STORAGE_KEYS.animation
        },

        defaults: {
            theme: DEFAULTS.theme,
            animation: DEFAULTS.animation
        },

        getTheme: getTheme,

        setTheme: setTheme,

        getAnimationEnabled: getAnimationEnabled,

        setAnimationEnabled: setAnimationEnabled,

        toggleAnimation: toggleAnimation,

        getSettings: getSettings,

        apply: applyAll,

        reset: reset
    };

})();
