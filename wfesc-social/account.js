/* =========================================================
   WFESC SOCIAL SYSTEM
   ACCOUNT ENGINE
   نظام الحسابات المستقل
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       منع تشغيل الملف أكثر من مرة
       ===================================================== */

    if (window.WFESC_ACCOUNT_LOADED) {
        return;
    }

    window.WFESC_ACCOUNT_LOADED = true;


    /* =====================================================
       إعدادات النظام
       ===================================================== */

    const WFX_ACCOUNT_SETTINGS = {

        enabled: true,

        rememberSession: true,

        passwordResetRedirect:
            window.location.origin +
            window.location.pathname

    };


    /* =====================================================
       حالة الحساب
       ===================================================== */

    const WFX_ACCOUNT_STATE = {

        initialized: false,

        loggedIn: false,

        user: null,

        session: null

    };


    /* =====================================================
       التحقق من وجود Supabase
       ===================================================== */

    function WFX_ACCOUNT_getSupabase() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "[WFESC ACCOUNT] supabaseClient غير موجود."
            );

            return null;

        }

        return supabaseClient;

    }


    /* =====================================================
       الحصول على المستخدم الحالي
       ===================================================== */

    async function WFX_ACCOUNT_getCurrentUser() {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {
            return null;
        }


        try {

            const result =
                await client.auth.getUser();


            if (result.error) {

                console.error(
                    "[WFESC ACCOUNT] getUser error:",
                    result.error
                );

                return null;

            }


            return result.data.user || null;

        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] User error:",
                error
            );

            return null;

        }

    }


    /* =====================================================
       تحديث حالة الحساب
       ===================================================== */

    async function WFX_ACCOUNT_refreshState() {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {
            return WFX_ACCOUNT_STATE;
        }


        try {

            const sessionResult =
                await client.auth.getSession();


            if (sessionResult.error) {

                console.error(
                    "[WFESC ACCOUNT] Session error:",
                    sessionResult.error
                );

                return WFX_ACCOUNT_STATE;

            }


            const session =
                sessionResult.data.session;


            WFX_ACCOUNT_STATE.session =
                session || null;


            WFX_ACCOUNT_STATE.user =
                session?.user || null;


            WFX_ACCOUNT_STATE.loggedIn =
                Boolean(session?.user);


            WFX_ACCOUNT_STATE.initialized =
                true;


            window.WFESC_CURRENT_USER =
                WFX_ACCOUNT_STATE.user;


            window.WFESC_ACCOUNT_STATE =
                WFX_ACCOUNT_STATE;


            return WFX_ACCOUNT_STATE;


        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] State error:",
                error
            );

            return WFX_ACCOUNT_STATE;

        }

    }


    /* =====================================================
       تسجيل الدخول
       ===================================================== */

    async function WFX_ACCOUNT_login(
        email,
        password
    ) {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {

            return {

                success: false,

                error:
                    "نظام قاعدة البيانات غير متصل."

            };

        }


        if (
            !email ||
            !password
        ) {

            return {

                success: false,

                error:
                    "يرجى إدخال البريد الإلكتروني وكلمة المرور."

            };

        }


        try {

            const result =
                await client.auth.signInWithPassword({

                    email:
                        String(email).trim(),

                    password:
                        String(password)

                });


            if (result.error) {

                console.error(
                    "[WFESC ACCOUNT] Login error:",
                    result.error
                );

                return {

                    success: false,

                    error:
                        result.error.message

                };

            }


            WFX_ACCOUNT_STATE.session =
                result.data.session || null;


            WFX_ACCOUNT_STATE.user =
                result.data.user || null;


            WFX_ACCOUNT_STATE.loggedIn =
                Boolean(result.data.user);


            WFX_ACCOUNT_STATE.initialized =
                true;


            window.WFESC_CURRENT_USER =
                WFX_ACCOUNT_STATE.user;


            window.WFESC_ACCOUNT_STATE =
                WFX_ACCOUNT_STATE;


            WFX_ACCOUNT_dispatchEvent(
                "login",
                WFX_ACCOUNT_STATE.user
            );


            return {

                success: true,

                user:
                    WFX_ACCOUNT_STATE.user,

                session:
                    WFX_ACCOUNT_STATE.session

            };


        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] Login exception:",
                error
            );

            return {

                success: false,

                error:
                    error.message ||
                    "حدث خطأ أثناء تسجيل الدخول."

            };

        }

    }


    /* =====================================================
       إنشاء حساب
       ===================================================== */

    async function WFX_ACCOUNT_register(
        email,
        password,
        metadata = {}
    ) {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {

            return {

                success: false,

                error:
                    "نظام قاعدة البيانات غير متصل."

            };

        }


        if (
            !email ||
            !password
        ) {

            return {

                success: false,

                error:
                    "يرجى إدخال البريد الإلكتروني وكلمة المرور."

            };

        }


        try {

            const result =
                await client.auth.signUp({

                    email:
                        String(email).trim(),

                    password:
                        String(password),

                    options: {

                        data:
                            metadata || {}

                    }

                });


            if (result.error) {

                console.error(
                    "[WFESC ACCOUNT] Register error:",
                    result.error
                );

                return {

                    success: false,

                    error:
                        result.error.message

                };

            }


            /*
             * إذا كان تأكيد البريد الإلكتروني
             * مفعلاً في Supabase، قد لا توجد جلسة
             * مباشرة بعد إنشاء الحساب.
             */

            WFX_ACCOUNT_STATE.session =
                result.data.session || null;


            WFX_ACCOUNT_STATE.user =
                result.data.user || null;


            WFX_ACCOUNT_STATE.loggedIn =
                Boolean(result.data.user);


            window.WFESC_CURRENT_USER =
                WFX_ACCOUNT_STATE.user;


            window.WFESC_ACCOUNT_STATE =
                WFX_ACCOUNT_STATE;


            WFX_ACCOUNT_dispatchEvent(
                "register",
                WFX_ACCOUNT_STATE.user
            );


            return {

                success: true,

                user:
                    WFX_ACCOUNT_STATE.user,

                session:
                    WFX_ACCOUNT_STATE.session

            };


        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] Register exception:",
                error
            );

            return {

                success: false,

                error:
                    error.message ||
                    "حدث خطأ أثناء إنشاء الحساب."

            };

        }

    }


    /* =====================================================
       تسجيل الخروج
       ===================================================== */

    async function WFX_ACCOUNT_logout() {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {

            return {

                success: false,

                error:
                    "نظام قاعدة البيانات غير متصل."

            };

        }


        try {

            const result =
                await client.auth.signOut();


            if (result.error) {

                console.error(
                    "[WFESC ACCOUNT] Logout error:",
                    result.error
                );

                return {

                    success: false,

                    error:
                        result.error.message

                };

            }


            WFX_ACCOUNT_STATE.session =
                null;

            WFX_ACCOUNT_STATE.user =
                null;

            WFX_ACCOUNT_STATE.loggedIn =
                false;


            window.WFESC_CURRENT_USER =
                null;


            window.WFESC_ACCOUNT_STATE =
                WFX_ACCOUNT_STATE;


            WFX_ACCOUNT_dispatchEvent(
                "logout",
                null
            );


            return {

                success: true

            };


        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] Logout exception:",
                error
            );

            return {

                success: false,

                error:
                    error.message ||
                    "حدث خطأ أثناء تسجيل الخروج."

            };

        }

    }


    /* =====================================================
       نسيت كلمة المرور
       ===================================================== */

    async function WFX_ACCOUNT_resetPassword(
        email
    ) {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {

            return {

                success: false,

                error:
                    "نظام قاعدة البيانات غير متصل."

            };

        }


        if (!email) {

            return {

                success: false,

                error:
                    "يرجى إدخال البريد الإلكتروني."

            };

        }


        try {

            const result =
                await client.auth.resetPasswordForEmail(

                    String(email).trim(),

                    {

                        redirectTo:
                            WFX_ACCOUNT_SETTINGS
                                .passwordResetRedirect

                    }

                );


            if (result.error) {

                console.error(
                    "[WFESC ACCOUNT] Password reset error:",
                    result.error
                );

                return {

                    success: false,

                    error:
                        result.error.message

                };

            }


            WFX_ACCOUNT_dispatchEvent(
                "password-reset",
                email
            );


            return {

                success: true

            };


        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] Password reset exception:",
                error
            );

            return {

                success: false,

                error:
                    error.message ||
                    "حدث خطأ أثناء إرسال رابط استعادة كلمة المرور."

            };

        }

    }


    /* =====================================================
       الاستماع لتغير حالة تسجيل الدخول
       ===================================================== */

    function WFX_ACCOUNT_listenAuthChanges() {

        const client =
            WFX_ACCOUNT_getSupabase();

        if (!client) {
            return;
        }


        client.auth.onAuthStateChange(
            (
                event,
                session
            ) => {

                WFX_ACCOUNT_STATE.session =
                    session || null;


                WFX_ACCOUNT_STATE.user =
                    session?.user || null;


                WFX_ACCOUNT_STATE.loggedIn =
                    Boolean(session?.user);


                WFX_ACCOUNT_STATE.initialized =
                    true;


                window.WFESC_CURRENT_USER =
                    WFX_ACCOUNT_STATE.user;


                window.WFESC_ACCOUNT_STATE =
                    WFX_ACCOUNT_STATE;


                WFX_ACCOUNT_dispatchEvent(
                    event,
                    WFX_ACCOUNT_STATE.user
                );

            }
        );

    }


    /* =====================================================
       أحداث النظام
       ===================================================== */

    function WFX_ACCOUNT_dispatchEvent(
        eventName,
        detail
    ) {

        document.dispatchEvent(

            new CustomEvent(
                "wfesc-account-" +
                eventName,

                {

                    detail:

                        detail || null

                }

            )

        );

    }


    /* =====================================================
       تشغيل النظام
       ===================================================== */

    async function WFX_ACCOUNT_start() {

        if (
            !WFX_ACCOUNT_SETTINGS.enabled
        ) {
            return;
        }


        await WFX_ACCOUNT_refreshState();


        WFX_ACCOUNT_listenAuthChanges();


        console.log(
            "[WFESC ACCOUNT] Account engine ready."
        );

    }


    /* =====================================================
       الواجهة العامة
       ===================================================== */

    window.WFESC_ACCOUNT = {

        start:
            WFX_ACCOUNT_start,

        login:
            WFX_ACCOUNT_login,

        register:
            WFX_ACCOUNT_register,

        logout:
            WFX_ACCOUNT_logout,

        resetPassword:
            WFX_ACCOUNT_resetPassword,

        refresh:
            WFX_ACCOUNT_refreshState,

        getUser:
            WFX_ACCOUNT_getCurrentUser,

        getState:
            () => ({
                ...WFX_ACCOUNT_STATE
            })

    };


    /* =====================================================
       بدء التشغيل
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            WFX_ACCOUNT_start
        );

    } else {

        WFX_ACCOUNT_start();

    }


})();
