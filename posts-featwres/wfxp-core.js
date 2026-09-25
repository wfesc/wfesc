/* =========================================================
   WFESC POSTS EXTENSION
   WFXP CORE
   المركز الرئيسي لتعديلات المنشورات
   ========================================================= */

(() => {

    "use strict";

    window.WFXP_CORE = {

        version: "1.0.0",

        enabled: true,

        modules: {

            comments: true,

            replies: true,

            reactions: true,

            style: true

        },

        settings: {

            commentsAnimation: true,

            repliesAnimation: true,

            reactionAnimation: true,

            sequentialComments: true,

            commentDelay: 120,

            animationDuration: 350

        }

    };


    /* =====================================================
       فحص النظام
       ===================================================== */

    window.WFXP_isEnabled = function(moduleName) {

        if (!window.WFXP_CORE.enabled) {
            return false;
        }

        return (
            window.WFXP_CORE.modules[moduleName] === true
        );

    };


    /* =====================================================
       تغيير إعداد مستقبلاً
       ===================================================== */

    window.WFXP_setSetting = function(
        settingName,
        value
    ) {

        if (
            window.WFXP_CORE.settings
                .hasOwnProperty(settingName)
        ) {

            window.WFXP_CORE.settings[settingName] =
                value;

        }

    };


    /* =====================================================
       قراءة إعداد
       ===================================================== */

    window.WFXP_getSetting = function(
        settingName
    ) {

        return (
            window.WFXP_CORE.settings[settingName]
        );

    };


    /* =====================================================
       معلومات النظام
       ===================================================== */

    console.log(
        "[WFXP] Posts extension loaded:",
        window.WFXP_CORE.version
    );

})();
