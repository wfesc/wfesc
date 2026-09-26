/* =========================================================
   WFESC SETTINGS AUTH CONFIG
   settings-auth-config.js
   ========================================================= */

(function () {

    "use strict";

    /*
     * منع تحميل الملف أكثر من مرة
     */
    if (window.WFESCSettingsAuthConfig) {
        return;
    }

    window.WFESCSettingsAuthConfig = true;


    /* =====================================================
       SUPABASE
       نفس مشروع WFESC المستخدم حالياً
    ===================================================== */

    const SUPABASE_URL =
        "https://mcgbzfgbaxwmutniorlw.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_5b7pTBiGY2D6vDLRsWgVzA_X926lBeM";


    /* =====================================================
       AUTH CONFIG
    ===================================================== */

    const AUTH_CONFIG = {

        /*
         * اتصال Supabase
         */
        supabaseUrl: SUPABASE_URL,

        supabaseKey: SUPABASE_KEY,


        /*
         * أسماء الجداول المستخدمة للحساب
         *
         * profiles موجودة أصلاً في مشروع WFESC.
         */
        profilesTable: "profiles",


        /*
         * الصفحة الرئيسية
         */
        homePage: "index.html",


        /*
         * الصفحات التي تحتاج تسجيل دخول
         */
        protectedPages: [

            "profile.html",
            "publish.html",
            "messages.html",
            "posts.html"

        ],


        /*
         * صفحة إدارة الحساب
         */
        settingsPage: "settings.html",


        /*
         * الصفحة التي يمكن للجميع الوصول إليها
         */
        publicPages: [

            "index.html",
            "settings.html"

        ],


        /*
         * بيانات الحساب الموجودة في profiles
         */
        profileFields: {

            username: "username",

            avatar: "avatar_url",

            bio: "bio"

        }

    };


    /* =====================================================
       EXPORT
       جعل الإعدادات متاحة لباقي ملفات النظام
    ===================================================== */

    window.WFESCSettingsAuthConfig =
        AUTH_CONFIG;


})();
