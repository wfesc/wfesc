/* =========================================================
   WFESC SOCIAL SYSTEM
   ACCOUNT ENGINE + ACCOUNT UI
   نظام الحسابات والواجهة التفاعلية
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       منع التكرار
       ===================================================== */

    if (window.WFESC_ACCOUNT_LOADED) {
        return;
    }

    window.WFESC_ACCOUNT_LOADED = true;


    /* =====================================================
       الإعدادات
       ===================================================== */

    const WFX_ACCOUNT_SETTINGS = {

        enabled: true,

        passwordResetRedirect:
            window.location.origin +
            window.location.pathname,

        messageDuration: 5000

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
       أدوات عامة
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


    function WFX_ACCOUNT_dispatchEvent(
        eventName,
        detail = null
    ) {

        document.dispatchEvent(

            new CustomEvent(
                "wfesc-account-" + eventName,
                {
                    detail
                }
            )

        );

    }


    /* =====================================================
       رسائل الواجهة
       ===================================================== */

    function WFX_ACCOUNT_showMessage(
        message,
        type = "info"
    ) {

        const box =
            document.querySelector(
                "#wfesc-account-message"
            );

        if (!box) {
            return;
        }


        box.textContent =
            message;


        box.className =
            "wfesc-social-message wfesc-social-show " +
            "wfesc-message-" +
            type;


        clearTimeout(
            box._wfescTimer
        );


        box._wfescTimer =
            setTimeout(
                () => {

                    box.classList.remove(
                        "wfesc-social-show"
                    );

                },
                WFX_ACCOUNT_SETTINGS
                    .messageDuration
            );

    }


    /* =====================================================
       التحقق من المدخلات
       ===================================================== */

    function WFX_ACCOUNT_validateEmail(
        email
    ) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                String(email).trim()
            );

    }


    function WFX_ACCOUNT_validatePassword(
        password
    ) {

        return (
            typeof password === "string" &&
            password.length >= 6
        );

    }


    /* =====================================================
       زر التحميل
       ===================================================== */

    function WFX_ACCOUNT_setLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            button.dataset.originalText =
                button.textContent;

            button.disabled =
                true;

            button.innerHTML = `
                <span class="wfesc-social-spinner"></span>
                <span>${text}</span>
            `;

            button.classList.add(
                "wfesc-social-loading"
            );

        } else {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                text;

            button.classList.remove(
                "wfesc-social-loading"
            );

        }

    }


    /* =====================================================
       تغيير نوع الصفحة
       ===================================================== */

    function WFX_ACCOUNT_switchView(
        view
    ) {

        const views =
            document.querySelectorAll(
                ".wfesc-account-view"
            );


        views.forEach(
            item => {

                item.classList.remove(
                    "wfesc-account-view-active"
                );

            }
        );


        const target =
            document.querySelector(
                `[data-account-view="${view}"]`
            );


        if (target) {

            target.classList.add(
                "wfesc-account-view-active"
            );

        }


        const box =
            document.querySelector(
                ".wfesc-social-account-box"
            );


        if (box) {

            box.classList.remove(
                "wfesc-account-view-change"
            );

            void box.offsetWidth;

            box.classList.add(
                "wfesc-account-view-change"
            );

        }


        WFX_ACCOUNT_clearMessage();

    }


    function WFX_ACCOUNT_clearMessage() {

        const box =
            document.querySelector(
                "#wfesc-account-message"
            );

        if (!box) {
            return;
        }

        box.classList.remove(
            "wfesc-social-show"
        );

    }


    /* =====================================================
       إظهار / إخفاء كلمة المرور
       🙉 → 🙈
       ===================================================== */

    function WFX_ACCOUNT_togglePassword(
        input,
        button
    ) {

        if (!input || !button) {
            return;
        }


        const hidden =
            input.type === "password";


        input.type =
            hidden
                ? "text"
                : "password";


        button.textContent =
            hidden
                ? "🙈"
                : "🙉";


        button.setAttribute(
            "aria-label",
            hidden
                ? "إخفاء كلمة المرور"
                : "إظهار كلمة المرور"
        );


        button.classList.remove(
            "wfesc-eye-animation"
        );

        void button.offsetWidth;

        button.classList.add(
            "wfesc-eye-animation"
        );

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
                    "نظام الحساب غير متصل حالياً."
            };

        }


        if (!email) {

            return {
                success: false,
                error:
                    "يرجى كتابة البريد الإلكتروني."
            };

        }


        if (
            !WFX_ACCOUNT_validateEmail(
                email
            )
        ) {

            return {
                success: false,
                error:
                    "البريد الإلكتروني غير صحيح."
            };

        }


        if (!password) {

            return {
                success: false,
                error:
                    "يرجى كتابة كلمة المرور."
            };

        }


        try {

            const result =
                await client.auth
                    .signInWithPassword({

                        email:
                            String(email).trim(),

                        password:
                            String(password)

                    });


            if (result.error) {

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
                Boolean(
                    result.data.user
                );


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
                "[WFESC ACCOUNT] Login:",
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
        confirmPassword
    ) {

        const client =
            WFX_ACCOUNT_getSupabase();


        if (!client) {

            return {
                success: false,
                error:
                    "نظام الحساب غير متصل حالياً."
            };

        }


        if (!email) {

            return {
                success: false,
                error:
                    "يرجى كتابة البريد الإلكتروني."
            };

        }


        if (
            !WFX_ACCOUNT_validateEmail(
                email
            )
        ) {

            return {
                success: false,
                error:
                    "البريد الإلكتروني غير صحيح."
            };

        }


        if (!password) {

            return {
                success: false,
                error:
                    "يرجى كتابة كلمة المرور."
            };

        }


        if (
            !WFX_ACCOUNT_validatePassword(
                password
            )
        ) {

            return {
                success: false,
                error:
                    "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
            };

        }


        if (
            password !==
            confirmPassword
        ) {

            return {
                success: false,
                error:
                    "كلمتا المرور غير متطابقتين."
            };

        }


        try {

            const result =
                await client.auth.signUp({

                    email:
                        String(email).trim(),

                    password:
                        String(password)

                });


            if (result.error) {

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
                Boolean(
                    result.data.user
                );


            WFX_ACCOUNT_STATE.initialized =
                true;


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
                "[WFESC ACCOUNT] Register:",
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
                    "نظام الحساب غير متصل."
            };

        }


        try {

            const result =
                await client.auth.signOut();


            if (result.error) {

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
                "logout"
            );


            return {
                success: true
            };


        } catch (error) {

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
                    "نظام الحساب غير متصل."
            };

        }


        if (!email) {

            return {
                success: false,
                error:
                    "يرجى كتابة البريد الإلكتروني."
            };

        }


        if (
            !WFX_ACCOUNT_validateEmail(
                email
            )
        ) {

            return {
                success: false,
                error:
                    "البريد الإلكتروني غير صحيح."
            };

        }


        try {

            const result =
                await client.auth
                    .resetPasswordForEmail(

                        String(email).trim(),

                        {
                            redirectTo:
                                WFX_ACCOUNT_SETTINGS
                                    .passwordResetRedirect
                        }

                    );


            if (result.error) {

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

            return {

                success: false,

                error:
                    error.message ||
                    "تعذر إرسال رابط استعادة كلمة المرور."

            };

        }

    }


    /* =====================================================
       إنشاء واجهة الحساب
       ===================================================== */

    function WFX_ACCOUNT_createUI() {

        if (
            document.querySelector(
                "#wfesc-social-account"
            )
        ) {
            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "wfesc-social-account";


        wrapper.className =
            "wfesc-social-account";


        wrapper.innerHTML = `

            <div
                class="wfesc-social-account-box"
                role="dialog"
                aria-modal="true"
            >

                <button
                    type="button"
                    class="wfesc-social-close"
                    id="wfesc-account-close"
                    aria-label="إغلاق"
                >
                    ×
                </button>


                <div
                    class="wfesc-account-header-icon"
                >
                    👤
                </div>


                <div
                    class="wfesc-social-account-title"
                >
                    WFESC
                </div>


                <div
                    class="wfesc-social-account-description"
                >
                    حسابك في WFESC
                </div>


                <div
                    id="wfesc-account-message"
                    class="wfesc-social-message"
                ></div>


                <!-- ==============================
                     تسجيل الدخول
                =============================== -->

                <section
                    class="wfesc-account-view wfesc-account-view-active"
                    data-account-view="login"
                >

                    <div class="wfesc-account-welcome">
                        <strong>مرحباً بعودتك</strong>
                        <span>سجل دخولك للمتابعة</span>
                    </div>


                    <div class="wfesc-social-field">

                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            id="wfesc-login-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                        >

                    </div>


                    <div class="wfesc-social-field">

                        <label>
                            كلمة المرور
                        </label>

                        <div
                            class="wfesc-password-wrap"
                        >

                            <input
                                id="wfesc-login-password"
                                type="password"
                                autocomplete="current-password"
                                placeholder="كلمة المرور"
                            >

                            <button
                                type="button"
                                class="wfesc-password-eye"
                                data-eye-for="wfesc-login-password"
                                aria-label="إظهار كلمة المرور"
                            >
                                🙉
                            </button>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="wfesc-social-button"
                        id="wfesc-login-button"
                    >
                        تسجيل الدخول
                    </button>


                    <button
                        type="button"
                        class="wfesc-social-link"
              data-account-switch="forgot"
                    >
                        نسيت كلمة المرور؟
                    </button>


                    <div
                        class="wfesc-account-divider"
                    >
                        <span>أو</span>
                    </div>


                    <button
                        type="button"
                        class="wfesc-social-button wfesc-social-button-secondary"
                        data-account-switch="register"
                    >
                        إنشاء حساب جديد
                    </button>

                </section>


                <!-- ==============================
                     إنشاء حساب
                =============================== -->

                <section
                    class="wfesc-account-view"
                    data-account-view="register"
                >

                    <div class="wfesc-account-welcome">
                        <strong>إنشاء حساب جديد</strong>
                        <span>أنشئ حسابك في WFESC</span>
                    </div>


                    <div class="wfesc-social-field">

                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            id="wfesc-register-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                        >

                    </div>


                    <div class="wfesc-social-field">

                        <label>
                            كلمة المرور
                        </label>

                        <div
                            class="wfesc-password-wrap"
                        >

                            <input
                                id="wfesc-register-password"
                                type="password"
                                autocomplete="new-password"
                                placeholder="6 أحرف أو أكثر"
                            >

                            <button
                                type="button"
                                class="wfesc-password-eye"
                                data-eye-for="wfesc-register-password"
                                aria-label="إظهار كلمة المرور"
                            >
                                🙉
                            </button>

                        </div>

                    </div>


                    <div class="wfesc-social-field">

                        <label>
                            تأكيد كلمة المرور
                        </label>

                        <div
                            class="wfesc-password-wrap"
                        >

                            <input
                                id="wfesc-register-confirm"
                                type="password"
                                autocomplete="new-password"
                                placeholder="أعد كتابة كلمة المرور"
                            >

                            <button
                                type="button"
                                class="wfesc-password-eye"
                                data-eye-for="wfesc-register-confirm"
                                aria-label="إظهار كلمة المرور"
                            >
                                🙉
                            </button>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="wfesc-social-button"
                        id="wfesc-register-button"
                    >
                        إنشاء الحساب
                    </button>


                    <button
                        type="button"
                        class="wfesc-social-link"
                        data-account-switch="login"
                    >
                        لدي حساب بالفعل
                    </button>

                </section>


                <!-- ==============================
                     استعادة كلمة المرور
                =============================== -->

                <section
                    class="wfesc-account-view"
                    data-account-view="forgot"
                >

                    <div class="wfesc-account-welcome">
                        <strong>استعادة كلمة المرور</strong>
                        <span>
                            سنرسل لك رابطاً إلى بريدك الإلكتروني
                        </span>
                    </div>


                    <div class="wfesc-social-field">

                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            id="wfesc-forgot-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                        >

                    </div>


                    <button
                        type="button"
                        class="wfesc-social-button"
                        id="wfesc-forgot-button"
                    >
                        إرسال رابط الاستعادة
                    </button>


                    <button
                        type="button"
                        class="wfesc-social-link"
                        data-account-switch="login"
                    >
                        العودة لتسجيل الدخول
                    </button>

                </section>

            </div>

        `;


        document.body.appendChild(
            wrapper
        );


        WFX_ACCOUNT_bindUI();

    }


    /* =====================================================
       ربط أحداث الواجهة
       ===================================================== */

    function WFX_ACCOUNT_bindUI() {

        const wrapper =
            document.querySelector(
                "#wfesc-social-account"
            );


        if (!wrapper) {
            return;
        }


        /* إغلاق */

        const close =
            wrapper.querySelector(
                "#wfesc-account-close"
            );


        close.addEventListener(
            "click",
            WFX_ACCOUNT_close
        );


        /* الضغط خارج الصندوق */

        wrapper.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    wrapper
                ) {

                    WFX_ACCOUNT_close();

                }

            }
        );


        /* التنقل */

        wrapper
            .querySelectorAll(
                "[data-account-switch]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            WFX_ACCOUNT_switchView(
                                button.dataset
                                    .accountSwitch
                            );

                        }
                    );

                }
            );


        /* العيون */

        wrapper
            .querySelectorAll(
                ".wfesc-password-eye"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const input =
                                document.getElementById(
                                    button.dataset
                                        .eyeFor
                                );


                            WFX_ACCOUNT_togglePassword(
                                input,
                                button
                            );

                        }
                    );

                }
            );


        /* تسجيل الدخول */

        wrapper
            .querySelector(
                "#wfesc-login-button"
            )
            .addEventListener(
                "click",
                WFX_ACCOUNT_handleLogin
            );


        /* إنشاء حساب */

        wrapper
            .querySelector(
                "#wfesc-register-button"
            )
            .addEventListener(
                "click",
                WFX_ACCOUNT_handleRegister
            );


        /* استعادة */

        wrapper
            .querySelector(
                "#wfesc-forgot-button"
            )
            .addEventListener(
                "click",
                WFX_ACCOUNT_handleForgot
            );


        /* Enter */

        wrapper.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Enter"
                ) {
                    return;
                }


                const active =
                    wrapper.querySelector(
                        ".wfesc-account-view-active"
                    );


                if (!active) {
                    return;
                }


                if (
                    active.dataset.accountView ===
                    "login"
                ) {

                    WFX_ACCOUNT_handleLogin();

                }


                if (
                    active.dataset.accountView ===
                    "register"
                ) {

                    WFX_ACCOUNT_handleRegister();

                }


                if (
                    active.dataset.accountView ===
                    "forgot"
                ) {

                    WFX_ACCOUNT_handleForgot();

                }

            }
        );

    }


    /* =====================================================
       معالجة تسجيل الدخول
       ===================================================== */

    async function WFX_ACCOUNT_handleLogin() {

        const email =
            document.querySelector(
                "#wfesc-login-email"
            ).value.trim();


        const password =
            document.querySelector(
                "#wfesc-login-password"
            ).value;


        const button =
            document.querySelector(
                "#wfesc-login-button"
            );


        if (!email) {

            WFX_ACCOUNT_showMessage(
                "⚠️ اكتب البريد الإلكتروني أولاً.",
                "error"
            );

            return;

        }


        if (
            !WFX_ACCOUNT_validateEmail(
                email
            )
        ) {

            WFX_ACCOUNT_showMessage(
                "⚠️ البريد الإلكتروني غير صحيح.",
                "error"
            );

            return;

        }


        if (!password) {

            WFX_ACCOUNT_showMessage(
                "⚠️ اكتب كلمة المرور.",
                "error"
            );

            return;

        }


        WFX_ACCOUNT_setLoading(
            button,
            true,
            "جاري تسجيل الدخول..."
        );


        const result =
            await WFX_ACCOUNT_login(
                email,
                password
            );


        WFX_ACCOUNT_setLoading(
            button,
            false,
            "تسجيل الدخول"
        );


        if (!result.success) {

            WFX_ACCOUNT_showMessage(
                "❌ " + result.error,
                "error"
            );

            return;

        }


        WFX_ACCOUNT_showMessage(
            "✓ تم تسجيل الدخول بنجاح.",
            "success"
        );


        setTimeout(
            () => {

                WFX_ACCOUNT_close();

            },
            900
        );

    }


    /* =====================================================
       معالجة إنشاء الحساب
       ===================================================== */

    async function WFX_ACCOUNT_handleRegister() {

        const email =
            document.querySelector(
                "#wfesc-register-email"
            ).value.trim();


        const password =
            document.querySelector(
                "#wfesc-register-password"
            ).value;


        const confirm =
            document.querySelector(
                "#wfesc-register-confirm"
            ).value;


        const button =
            document.querySelector(
                "#wfesc-register-button"
            );


        if (!email) {

            WFX_ACCOUNT_showMessage(
                "⚠️ اكتب البريد الإلكتروني.",
                "error"
            );

            return;

        }


        if (
            !WFX_ACCOUNT_validateEmail(
                email
            )
        ) {

            WFX_ACCOUNT_showMessage(
                "⚠️ البريد الإلكتروني غير صحيح.",
                "error"
            );

            return;

        }


        if (!password) {

            WFX_ACCOUNT_showMessage(
                "⚠️ اكتب كلمة المرور.",
                "error"
            );

            return;

        }


        if (
            password.length < 6
        ) {

            WFX_ACCOUNT_showMessage(
                "⚠️ كلمة المرور يجب أن تحتوي على 6 أحرف أو أكثر.",
                "error"
            );

            return;

        }


        if (!confirm) {

            WFX_ACCOUNT_showMessage(
                "⚠️ أكد كلمة المرور.",
                "error"
            );

            return;

        }


        if (
            password !==
            confirm
        ) {

            WFX_ACCOUNT_showMessage(
                "⚠️ كلمتا المرور غير متطابقتين.",
                "error"
            );

            return;

        }


        WFX_ACCOUNT_setLoading(
            button,
            true,
            "جاري إنشاء الحساب..."
        );


        const result =
            await WFX_ACCOUNT_register(
                email,
                password,
                confirm
            );


        WFX_ACCOUNT_setLoading(
            button,
            false,
            "إنشاء الحساب"
        );


        if (!result.success) {

            WFX_ACCOUNT_showMessage(
                "❌ " + result.error,
                "error"
            );

            return;

        }


        /*
         * إذا لم توجد جلسة فهذا يعني غالباً
         * أن Supabase ينتظر تأكيد البريد.
         */

        if (!result.session) {

            WFX_ACCOUNT_showMessage(
                "📧 تم إنشاء الحساب. تحقق من بريدك الإلكتروني أو مجلد الرسائل غير المرغوب فيها.",
                "success"
            );


            const buttonBox =
                document.querySelector(
                    "#wfesc-register-button"
                );


            if (buttonBox) {

                buttonBox.classList.add(
                    "wfesc-email-sent"
                );

            }


            return;

        }


        WFX_ACCOUNT_showMessage(
            "✓ تم إنشاء الحساب وتسجيل الدخول.",
            "success"
        );


        setTimeout(
            () => {

                WFX_ACCOUNT_close();

            },
            1000
        );

    }


    /* =====================================================
       معالجة نسيت كلمة المرور
       ===================================================== */

    async function WFX_ACCOUNT_handleForgot() {

        const email =
            document.querySelector(
                "#wfesc-forgot-email"
            ).value.trim();


        const button =
            document.querySelector(
                "#wfesc-forgot-button"
            );


        if (!email) {

            WFX_ACCOUNT_showMessage(
                "⚠️ اكتب البريد الإلكتروني.",
                "error"
            );

            return;

        }


        if (
            !WFX_ACCOUNT_validateEmail(
                email
            )
        ) {

            WFX_ACCOUNT_showMessage(
                "⚠️ البريد الإلكتروني غير صحيح.",
                "error"
            );

            return;

        }


        WFX_ACCOUNT_setLoading(
            button,
            true,
            "جاري الإرسال..."
        );


        const result =
            await WFX_ACCOUNT_resetPassword(
                email
            );


        WFX_ACCOUNT_setLoading(
            button,
            false,
            "إرسال رابط الاستعادة"
        );


        if (!result.success) {

            WFX_ACCOUNT_showMessage(
                "❌ " + result.error,
                "error"
            );

            return;

        }


        WFX_ACCOUNT_showMessage(
            "📧 تم إرسال رابط استعادة كلمة المرور. تحقق من البريد والرسائل غير المرغوب فيها.",
            "success"
        );

    }


    /* =====================================================
       فتح الواجهة
       ===================================================== */

    function WFX_ACCOUNT_open(
        view = "login"
    ) {

        WFX_ACCOUNT_createUI();


        const wrapper =
            document.querySelector(
                "#wfesc-social-account"
            );


        if (!wrapper) {
            return;
        }


        WFX_ACCOUNT_switchView(
            view
        );


        wrapper.classList.add(
            "wfesc-social-open"
        );


        document.body.classList.add(
            "wfesc-account-lock-scroll"
        );


        setTimeout(
            () => {

                const firstInput =
                    wrapper.querySelector(
                        ".wfesc-account-view-active input"
                    );


                if (firstInput) {

                    firstInput.focus();

                }

            },
            180
        );

    }


    /* =====================================================
       إغلاق الواجهة
       ===================================================== */

    function WFX_ACCOUNT_close() {

        const wrapper =
            document.querySelector(
                "#wfesc-social-account"
            );


        if (!wrapper) {
            return;
        }


        wrapper.classList.remove(
            "wfesc-social-open"
        );


        document.body.classList.remove(
            "wfesc-account-lock-scroll"
        );

    }


    /* =====================================================
       حالة الحساب من Supabase
       ===================================================== */

    async function WFX_ACCOUNT_refreshState() {

        const client =
            WFX_ACCOUNT_getSupabase();


        if (!client) {
            return WFX_ACCOUNT_STATE;
        }


        try {

            const result =
                await client.auth
                    .getSession();


            if (result.error) {

                console.error(
                    "[WFESC ACCOUNT] Session:",
                    result.error
                );

                return WFX_ACCOUNT_STATE;

            }


            const session =
                result.data.session;


            WFX_ACCOUNT_STATE.session =
                session || null;


            WFX_ACCOUNT_STATE.user =
                session?.user || null;


            WFX_ACCOUNT_STATE.loggedIn =
                Boolean(
                    session?.user
                );


            WFX_ACCOUNT_STATE.initialized =
                true;


            window.WFESC_CURRENT_USER =
                WFX_ACCOUNT_STATE.user;


            window.WFESC_ACCOUNT_STATE =
                WFX_ACCOUNT_STATE;


            return WFX_ACCOUNT_STATE;

        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] Refresh:",
                error
            );


            return WFX_ACCOUNT_STATE;

        }

    }


    /* =====================================================
       مراقبة حالة الدخول
       ===================================================== */

    
