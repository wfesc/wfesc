/* =========================================================
   WFESC POSTS SETTINGS
   File: posts-featwres/posts-settingrss.js
   ========================================================= */

(function () {

    "use strict";


    /*
     * -------------------------------------------------------
     * WFESC POSTS FEATURES NAMESPACE
     * -------------------------------------------------------
     */

    window.WFESC_POSTS_FEATURES =
        window.WFESC_POSTS_FEATURES || {};

    const FEATURES =
        window.WFESC_POSTS_FEATURES;


    FEATURES.settings =
        FEATURES.settings || {};

    FEATURES.settings.loaded =
        true;

    FEATURES.settings.version =
        "1.0.0";


    /*
     * -------------------------------------------------------
     * SETTINGS STATE
     * -------------------------------------------------------
     */

    const SETTINGS = {

        animation:
            true,

        darkMode:
            true,

        initialized:
            false

    };


    FEATURES.settings.state =
        SETTINGS;


    /*
     * -------------------------------------------------------
     * STORAGE KEYS
     * -------------------------------------------------------
     */

    const STORAGE_KEYS = {

        animation:
            "wfesc-animation",

        theme:
            "wfesc-theme"

    };


    /*
     * -------------------------------------------------------
     * SAFE STORAGE
     * -------------------------------------------------------
     */

    function readStorage(
        key
    ) {

        try {

            return localStorage.getItem(
                key
            );

        } catch (
            error
        ) {

            console.warn(
                "[WFESC POSTS SETTINGS]",
                "تعذر قراءة الإعداد:",
                key,
                error
            );

            return null;

        }

    }


    function writeStorage(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                value
            );

            return true;

        } catch (
            error
        ) {

            console.warn(
                "[WFESC POSTS SETTINGS]",
                "تعذر حفظ الإعداد:",
                key,
                error
            );

            return false;

        }

    }


    /*
     * -------------------------------------------------------
     * ANIMATION SETTING
     * -------------------------------------------------------
     */

    function getAnimationSetting(){

        const value =
            readStorage(
                STORAGE_KEYS.animation
            );


        if (
            value === null
        ) {

            return true;

        }


        if (
            value === "false"
            ||
            value === "0"
            ||
            value === "off"
        ) {

            return false;

        }


        return true;

    }


    function applyAnimationSetting(
        enabled
    ) {

        SETTINGS.animation =
            Boolean(
                enabled
            );


        document.documentElement
            .classList.toggle(
                "wfesc-no-animation",
                !SETTINGS.animation
            );


        document.body?.classList.toggle(
            "wfesc-no-animation",
            !SETTINGS.animation
        );


        writeStorage(
            STORAGE_KEYS.animation,
            SETTINGS.animation
                ? "true"
                : "false"
        );


        window.dispatchEvent(
            new CustomEvent(
                "wfesc-animation-changed",
                {
                    detail:{
                        enabled:
                            SETTINGS.animation
                    }
                }
            )
        );

    }


    /*
     * -------------------------------------------------------
     * THEME SETTING
     * -------------------------------------------------------
     */

    function getThemeSetting(){

        const value =
            readStorage(
                STORAGE_KEYS.theme
            );


        if (
            value === "light"
        ) {

            return "light";

        }


        return "dark";

    }


    function applyTheme(
        theme
    ) {

        const selectedTheme =
            theme === "light"
                ? "light"
                : "dark";


        SETTINGS.darkMode =
            selectedTheme === "dark";


        document.documentElement
            .setAttribute(
                "data-theme",
                selectedTheme
            );


        document.body?.setAttribute(
            "data-theme",
            selectedTheme
        );


        document.documentElement
            .classList.toggle(
                "wfesc-light-theme",
                selectedTheme === "light"
            );


        document.documentElement
            .classList.toggle(
                "wfesc-dark-theme",
                selectedTheme === "dark"
            );


        document.body?.classList.toggle(
            "wfesc-light-theme",
            selectedTheme === "light"
        );


        document.body?.classList.toggle(
            "wfesc-dark-theme",
            selectedTheme === "dark"
        );


        writeStorage(
            STORAGE_KEYS.theme,
            selectedTheme
        );


        window.dispatchEvent(
            new CustomEvent(
                "wfesc-theme-changed",
                {
                    detail:{
                        theme:
                            selectedTheme
                    }
                }
            )
        );

    }


    /*
     * -------------------------------------------------------
     * APPLY EXISTING SETTINGS
     * -------------------------------------------------------
     */

    function applyCurrentSettings(){

        const animation =
            getAnimationSetting();


        const theme =
            getThemeSetting();


        /*
         * لا نستخدم applyAnimationSetting هنا
         * حتى لا نكتب إلى localStorage من جديد
         * عند كل تحميل للصفحة.
         */

        SETTINGS.animation =
            animation;


        SETTINGS.darkMode =
            theme === "dark";


        document.documentElement
            .classList.toggle(
                "wfesc-no-animation",
                !animation
            );


        document.body?.classList.toggle(
            "wfesc-no-animation",
            !animation
            );


        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );


        document.body?.setAttribute(
            "data-theme",
            theme
        );


        document.documentElement
            .classList.toggle(
                "wfesc-light-theme",
                theme === "light"
            );


        document.documentElement
            .classList.toggle(
                "wfesc-dark-theme",
                theme === "dark"
            );


        document.body?.classList.toggle(
            "wfesc-light-theme",
            theme === "light"
        );


        document.body?.classList.toggle(
            "wfesc-dark-theme",
            theme === "dark"
        );

    }


    /*
     * -------------------------------------------------------
     * PUBLIC API
     * -------------------------------------------------------
     */

    FEATURES.settings.getAnimation =
        function () {

            return SETTINGS.animation;

        };


    FEATURES.settings.setAnimation =
        function (
            enabled
        ) {

            applyAnimationSetting(
                enabled
            );

        };


    FEATURES.settings.getTheme =
        function () {

            return SETTINGS.darkMode
                ? "dark"
                : "light";

        };


    FEATURES.settings.setTheme =
        function (
            theme
        ) {

            applyTheme(
                theme
            );

        };


    FEATURES.settings.apply =
        applyCurrentSettings;


    /*
     * -------------------------------------------------------
     * LISTEN FOR GLOBAL WFESC SETTINGS
     * -------------------------------------------------------
     */

    function bindSettingsEvents(){

        if (
            SETTINGS.eventsBound
        ) {

            return;

        }


        SETTINGS.eventsBound =
            true;


        window.addEventListener(
            "wfesc-animation-changed",
            function (
                event
            ) {

                const enabled =
                    event?.detail?.enabled;


                if (
                    typeof enabled !==
                    "boolean"
                ) {

                    return;

                }


                SETTINGS.animation =
                    enabled;


                document.documentElement
                    .classList.toggle(
                        "wfesc-no-animation",
                        !enabled
                    );


                document.body?.classList.toggle(
                    "wfesc-no-animation",
                    !enabled
                );

            }
        );


        window.addEventListener(
            "wfesc-theme-changed",
            function (
                event
            ) {

                const theme =
                    event?.detail?.theme;


                if (
                    theme !== "dark" &&
                    theme !== "light"
                ) {

                    return;

                }


                SETTINGS.darkMode =
                    theme === "dark";

            }
        );

    }


    /*
     * -------------------------------------------------------
     * INITIALIZATION
     * -------------------------------------------------------
     */

    function initialize(){

        if (
            SETTINGS.initialized
        ) {

            return;

        }


        SETTINGS.initialized =
            true;


        applyCurrentSettings();

        bindSettingsEvents();


        console.log(
            "[WFESC POSTS SETTINGS] تم تحميل posts-settingrss.js"
        );

    }


    /*
     * -------------------------------------------------------
     * DOM READY
     * -------------------------------------------------------
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:true
            }
        );

    } else {

        initialize();

    }


    /*
     * -------------------------------------------------------
     * PUBLIC INITIALIZER
     * -------------------------------------------------------
     */

    FEATURES.settings.initialize =
        initialize;


})();
