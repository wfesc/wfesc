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
        "sb_publishable_V9RaHJDWmhox-XMzj1SK_w_6p5pAK5L";


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
         * الصفحات العامة
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

        },


        /* =================================================
           قيود اسم المستخدم
        ================================================= */

        username: {

            /*
             * أقل عدد أحرف
             */
            minLength: 1,

            /*
             * أقصى عدد أحرف
             */
            maxLength: 3

        },


        /* =================================================
           رسائل النظام
        ================================================= */

        messages: {

            /*
             * تسجيل الدخول
             */
            userNotFound:
                "أنت غير مسجل مسبقًا بهذا البريد الإلكتروني.",

            wrongPassword:
                "كلمة المرور غير صحيحة.",

            loginSuccess:
                "تم تسجيل الدخول بنجاح.",


            /*
             * إنشاء الحساب
             */
            alreadyRegistered:
                "أنت مسجل بالفعل، تابع من صفحة لدي حساب.",

            invalidUsername:
                "اسم المستخدم يجب أن يكون من 1 إلى 3 أحرف.",

            accountCreated:
                "تم إنشاء الحساب بنجاح.",


            /*
             * إعادة تعيين كلمة المرور
             */
            resetSent:
                "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",

            resetError:
                "تعذر إرسال رابط إعادة تعيين كلمة المرور.",


            /*
             * البريد الإلكتروني
             */
            invalidEmail:
                "يرجى إدخال بريد إلكتروني صحيح.",

            invalidPassword:
                "يرجى إدخال كلمة مرور صحيحة."

        }

    };


    /* =====================================================
       EXPORT
       جعل الإعدادات متاحة لباقي ملفات النظام
    ===================================================== */

    window.WFESCSettingsAuthConfig =
        AUTH_CONFIG;


})();
