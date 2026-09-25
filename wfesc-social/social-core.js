/* =========================================================
   WFESC SOCIAL SYSTEM
   SOCIAL CORE
   النظام المركزي للميزات الاجتماعية
   ========================================================= */

(() => {

    "use strict";

    /* منع تشغيل النظام أكثر من مرة */
    if (window.WFESC_SOCIAL_CORE_LOADED) {
        return;
    }

    window.WFESC_SOCIAL_CORE_LOADED = true;


    /* =====================================================
       الإعدادات الأساسية
       ===================================================== */

    window.WFESC_SOCIAL = {

        version: "1.0.0",

        enabled: true,

        modules: {

            account: true,

            profile: true,

            follows: true,

            notifications: true,

            messages: true

        }

    };


    /* =====================================================
       التحقق من تشغيل ميزة معينة
       ===================================================== */

    window.WFESC_SOCIAL_isEnabled = function (
        moduleName
    ) {

        if (
            !window.WFESC_SOCIAL ||
            !window.WFESC_SOCIAL.enabled
        ) {
            return false;
        }

        return (
            window.WFESC_SOCIAL.modules[
                moduleName
            ] === true
        );

    };


    /* =====================================================
       الحصول على إصدار النظام
       ===================================================== */

    window.WFESC_SOCIAL_getVersion = function () {

        return (
            window.WFESC_SOCIAL.version
        );

    };


    /* =====================================================
       حالة النظام
       ===================================================== */

    window.WFESC_SOCIAL_getStatus = function () {

        return {

            enabled:
                window.WFESC_SOCIAL.enabled,

            version:
                window.WFESC_SOCIAL.version,

            modules:
                {
                    ...window.WFESC_SOCIAL.modules
                }

        };

    };


    /* =====================================================
       تشغيل / إيقاف النظام بالكامل
       ===================================================== */

    window.WFESC_SOCIAL_setEnabled = function (
        enabled
    ) {

        window.WFESC_SOCIAL.enabled =
            Boolean(enabled);

    };


    /* =====================================================
       تشغيل / إيقاف ميزة منفردة
       ===================================================== */

    window.WFESC_SOCIAL_setModule = function (
        moduleName,
        enabled
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                window.WFESC_SOCIAL.modules,
                moduleName
            )
        ) {
            return false;
        }

        window.WFESC_SOCIAL.modules[
            moduleName
        ] = Boolean(enabled);

        return true;

    };


    /* =====================================================
       جاهزية النظام
       ===================================================== */

    console.log(
        "[WFESC SOCIAL] Core loaded.",
        window.WFESC_SOCIAL.version
    );


})();
