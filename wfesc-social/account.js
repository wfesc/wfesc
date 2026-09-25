/* =========================================================
   WFESC SOCIAL SYSTEM
   ACCOUNT ENGINE
   نظام الحسابات
   ========================================================= */

(() => {

    "use strict";

    if (window.WFESC_ACCOUNT_LOADED) {
        return;
    }

    window.WFESC_ACCOUNT_LOADED = true;


    /* =====================================================
       الحالة
       ===================================================== */

    const ACCOUNT_STATE = {
        initialized: false,
        loggedIn: false,
        user: null,
        session: null
    };


    /* =====================================================
       Supabase
       ===================================================== */

    function getSupabase() {

        if (
            typeof window.supabaseClient !== "undefined" &&
            window.supabaseClient
        ) {
            return window.supabaseClient;
        }

        return null;
    }


    /* =====================================================
       إنشاء عنصر الحساب داخل الإعدادات
       ===================================================== */

    function createSettingsAccount() {

        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );

        if (!panel) {
            return false;
        }

        if (
            document.getElementById(
                "wfesc-account-setting"
            )
        ) {
            return true;
        }


        const accountBox =
            document.createElement("div");

        accountBox.id =
            "wfesc-account-setting";

        accountBox.innerHTML = `

            <div class="wfesc-account-setting-row">

                <div class="wfesc-account-setting-info">

                    <span>
                        👤 الحساب
                    </span>

                    <small id="wfesc-account-setting-status">
                        غير مسجل الدخول
                    </small>

                </div>

                <button
                    type="button"
                    id="wfesc-account-login-button"
                    class="wfesc-account-setting-button"
                >
                    تسجيل الدخول
                </button>

            </div>

        `;


        const themeRow =
            panel.querySelector(
                ".wfesc-setting-row"
            );


        if (themeRow) {

            panel.insertBefore(
                accountBox,
                themeRow
            );

        } else {

            panel.appendChild(
                accountBox
            );

        }


        const style =
            document.createElement("style");

        style.id =
            "wfesc-account-setting-style";

        style.textContent = `

            #wfesc-account-setting {
                margin-bottom: 18px;
                padding-bottom: 18px;
                border-bottom: 1px solid
                    rgba(255,255,255,.08);
            }

            .wfesc-account-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .wfesc-account-setting-info {
                display: flex;
                flex-direction: column;
                gap: 5px;
                min-width: 0;
            }

            .wfesc-account-setting-info span {
                font-size: 14px;
            }

            .wfesc-account-setting-info small {
                color: #888;
                font-size: 11px;
                transition: color .35s ease;
            }

            .wfesc-account-setting-button {
                border: 1px solid
                    rgba(255,255,255,.16);

                background:
                    rgba(255,255,255,.06);

                color: #fff;

                border-radius: 9px;

                padding: 8px 11px;

                font-family:
                    Arial,
                    Tahoma,
                    sans-serif;

                font-size: 11px;

                cursor: pointer;

                white-space: nowrap;

                transition:
                    background .3s ease,
                    color .3s ease,
                    border-color .3s ease,
                    transform .2s ease;
            }

            .wfesc-account-setting-button:hover {
                background: #fff;
                color: #000;
                border-color: #fff;
                transform: translateY(-1px);
            }

            .wfesc-account-setting-button:active {
                transform: scale(.95);
            }

            body.wfesc-light
            #wfesc-account-setting {
                border-bottom-color: #ddd;
            }

            body.wfesc-light
            .wfesc-account-setting-info small {
                color: #777;
            }

            body.wfesc-light
            .wfesc-account-setting-button {
                background: #f3f3f3;
                color: #111;
                border-color: #ccc;
            }

            body.wfesc-light
            .wfesc-account-setting-button:hover {
                background: #111;
                color: #fff;
                border-color: #111;
            }

            @media (max-width: 700px) {

                .wfesc-account-setting-row {
                    gap: 8px;
                }

                .wfesc-account-setting-button {
                    padding: 8px 9px;
                    font-size: 10px;
                }

            }

        `;

        document.head.appendChild(style);


        const loginButton =
            document.getElementById(
                "wfesc-account-login-button"
            );


        if (loginButton) {

            loginButton.addEventListener(
                "click",
                function () {

                    openAccountUI("login");

                }
            );

        }


        return true;
    }


    /* =====================================================
       نافذة تسجيل الدخول
       ===================================================== */

    function createAccountUI() {

        if (
            document.getElementById(
                "wfesc-social-account"
            )
        ) {
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "wfesc-social-account";

        overlay.innerHTML = `

            <div
                class="wfesc-social-account-box"
                role="dialog"
                aria-modal="true"
            >

                <button
                    type="button"
                    id="wfesc-account-close"
                    class="wfesc-account-close"
                    aria-label="إغلاق"
                >
                    ×
                </button>


                <div class="wfesc-account-header">

                    <div class="wfesc-account-icon">
                        👤
                    </div>

                    <h2>
                        تسجيل الدخول
                    </h2>

                    <p>
                        سجّل الدخول إلى حساب WFESC
                    </p>

                </div>


                <div
                    id="wfesc-account-message"
                    class="wfesc-social-message"
                    aria-live="polite"
                ></div>


                <div
                    id="wfesc-account-login-view"
                    class="wfesc-account-view wfesc-account-view-active"
                >

                    <label>
                        البريد الإلكتروني
                    </label>

                    <input
                        type="email"
                        id="wfesc-login-email"
                        placeholder="البريد الإلكتروني"
                        autocomplete="email"
                    >


                    <label>
                        كلمة المرور
                    </label>

                    <div class="wfesc-password-wrap">

                        <input
                            type="password"
                            id="wfesc-login-password"
                            placeholder="كلمة المرور"
                            autocomplete="current-password"
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


                    <button
                        type="button"
                        id="wfesc-login-button"
                        class="wfesc-account-main-button"
                    >
                        تسجيل الدخول
                    </button>


                    <button
                        type="button"
                        id="wfesc-forgot-link"
                        class="wfesc-account-link"
                    >
                        نسيت كلمة المرور؟
                    </button>


                    <div class="wfesc-account-divider">
                        <span>أو</span>
                    </div>


                    <button
                        type="button"
                        id="wfesc-register-link"
                        class="wfesc-account-secondary-button"
                    >
                        إنشاء حساب
                    </button>

                </div>


                <div
                    id="wfesc-account-forgot-view"
                    class="wfesc-account-view"
                >

                    <label>
                        البريد الإلكتروني
                    </label>

                    <input
                        type="email"
                        id="wfesc-forgot-email"
                        placeholder="البريد الإلكتروني"
                        autocomplete="email"
                    >


                    <button
                        type="button"
                        id="wfesc-forgot-button"
                        class="wfesc-account-main-button"
                    >
                        إرسال رابط الاستعادة
                    </button>


                    <button
                        type="button"
                        id="wfesc-back-login"
                        class="wfesc-account-link"
                    >
                        العودة لتسجيل الدخول
                    </button>

                </div>


                <div
                    id="wfesc-account-register-view"
                    class="wfesc-account-view"
                >

                    <label>
                        البريد الإلكتروني
                    </label>

                    <input
                        type="email"
                        id="wfesc-register-email"
                        placeholder="البريد الإلكتروني"
                        autocomplete="email"
                    >


                    <label>
                        كلمة المرور
                    </label>

                    <div class="wfesc-password-wrap">

                        <input
                            type="password"
                            id="wfesc-register-password"
                            placeholder="كلمة المرور"
                            autocomplete="new-password"
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


                    <label>
                        تأكيد كلمة المرور
                    </label>

                    <div class="wfesc-password-wrap">

                        <input
                            type="password"
                            id="wfesc-register-confirm"
                            placeholder="تأكيد كلمة المرور"
                            autocomplete="new-password"
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


                    <button
                        type="button"
                        id="wfesc-register-button"
                        class="wfesc-account-main-button"
                    >
                        إنشاء حساب
                    </button>


                    <button
                        type="button"
                        id="wfesc-back-login-register"
                        class="wfesc-account-link"
                    >
                        العودة لتسجيل الدخول
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        bindAccountUI();
    }


    /* =====================================================
       تبديل الواجهات
       ===================================================== */

    function switchView(view) {

        const login =
            document.getElementById(
                "wfesc-account-login-view"
            );

        const forgot =
            document.getElementById(
                "wfesc-account-forgot-view"
            );

        const register =
            document.getElementById(
                "wfesc-account-register-view"
            );


        if (!login || !forgot || !register) {
            return;
        }


        login.classList.remove(
            "wfesc-account-view-active"
        );

        forgot.classList.remove(
            "wfesc-account-view-active"
        );

        register.classList.remove(
            "wfesc-account-view-active"
        );


        if (view === "forgot") {

            forgot.classList.add(
                "wfesc-account-view-active"
            );

        } else if (view === "register") {

            register.classList.add(
                "wfesc-account-view-active"
            );

        } else {

            login.classList.add(
                "wfesc-account-view-active"
            );

        }

    }


    /* =====================================================
       الرسائل
       ===================================================== */

    function showMessage(
        message,
        type = "error"
    ) {

        const box =
            document.getElementById(
                "wfesc-account-message"
            );

        if (!box) {
            return;
        }


        box.textContent =
            message;

        box.className =
            "wfesc-social-message wfesc-message-" +
            type;


        box.style.display =
            "block";

    }


    function clearMessage() {

        const box =
            document.getElementById(
                "wfesc-account-message"
            );

        if (!box) {
            return;
        }

        box.textContent = "";

        box.className =
            "wfesc-social-message";

        box.style.display =
            "none";
    }


    /* =====================================================
       فتح وإغلاق الحساب
       ===================================================== */

    function openAccountUI(
        view = "login"
    ) {

        createAccountUI();

        switchView(view);

        clearMessage();


        const overlay =
            document.getElementById(
                "wfesc-social-account"
            );

        if (!overlay) {
            return;
        }


        overlay.classList.add(
            "wfesc-social-open"
        );


        document.body.classList.add(
            "wfesc-account-lock-scroll"
        );

    }


    function closeAccountUI() {

        const overlay =
            document.getElementById(
                "wfesc-social-account"
            );

        if (!overlay) {
            return;
        }


        overlay.classList.remove(
            "wfesc-social-open"
        );


        document.body.classList.remove(
            "wfesc-account-lock-scroll"
        );

    }


    /* =====================================================
       تسجيل الدخول
       ===================================================== */

    async function login() {

        const supabase =
            getSupabase();

        if (!supabase) {

            showMessage(
                "تعذر الاتصال بنظام الحسابات.",
                "error"
            );

            return;
        }


        const email =
            document.getElementById(
                "wfesc-login-email"
            )?.value.trim();


        const password =
            document.getElementById(
                "wfesc-login-password"
            )?.value;


        if (!email) {

            showMessage(
                "يرجى إدخال البريد الإلكتروني.",
                "error"
            );

            return;
        }


        if (!password) {

            showMessage(
                "يرجى إدخال كلمة المرور.",
                "error"
            );

            return;
        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {

            showMessage(
                "يرجى إدخال بريد إلكتروني صحيح.",
                "error"
            );

            return;
        }


        const button =
            document.getElementById(
                "wfesc-login-button"
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "جارٍ تسجيل الدخول...";
        }


        try {

            const result =
                await supabase.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (result.error) {

                showMessage(
                    result.error.message ||
                    "تعذر تسجيل الدخول.",
                    "error"
                );

                return;
            }


            ACCOUNT_STATE.loggedIn =
                true;

            ACCOUNT_STATE.user =
                result.data.user;

            ACCOUNT_STATE.session =
                result.data.session;


            updateSettingsAccount();


            showMessage(
                "تم تسجيل الدخول بنجاح.",
                "success"
            );


            setTimeout(() => {

                closeAccountUI();

            }, 900);


            document.dispatchEvent(
                new CustomEvent(
                    "wfesc:login",
                    {
                        detail: {
                            user:
                                ACCOUNT_STATE.user,

                            session:
                                ACCOUNT_STATE.session
                        }
                    }
                )
            );


        } catch (error) {

            showMessage(
                "حدث خطأ أثناء تسجيل الدخول.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "تسجيل الدخول";
            }

        }

    }


    /* =====================================================
       إنشاء الحساب
       ===================================================== */

    async function register() {

        const supabase =
            getSupabase();

        if (!supabase) {

            showMessage(
                "تعذر الاتصال بنظام الحسابات.",
                "error"
            );

            return;
        }


        const email =
            document.getElementById(
                "wfesc-register-email"
            )?.value.trim();


        const password =
            document.getElementById(
                "wfesc-register-password"
            )?.value;


        const confirm =
            document.getElementById(
                "wfesc-register-confirm"
            )?.value;


        if (!email) {

            showMessage(
                "يرجى إدخال البريد الإلكتروني.",
                "error"
            );

            return;
        }


        if (!password) {

            showMessage(
                "يرجى إدخال كلمة المرور.",
                "error"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
                "error"
            );

            return;
        }


        if (password !== confirm) {

            showMessage(
                "كلمتا المرور غير متطابقتين.",
                "error"
            );

            return;
        }


        const button =
            document.getElementById(
                "wfesc-register-button"
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "جارٍ إنشاء الحساب...";
        }


        try {

            const result =
                await supabase.auth.signUp({

                    email: email,

                    password: password

                });


            if (result.error) {

                showMessage(
                    result.error.message ||
                    "تعذر إنشاء الحساب.",
                    "error"
                );

                return;
            }


            showMessage(
                "📧 تم إنشاء الحساب. تحقق من بريدك الإلكتروني أو مجلد الرسائل غير المرغوب فيها.",
                "success"
            );


        } catch (error) {

            showMessage(
                "حدث خطأ أثناء إنشاء الحساب.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "إنشاء حساب";
            }

        }

    }


    /* =====================================================
       استعادة كلمة المرور
       ===================================================== */

    async function resetPassword() {

        const supabase =
            getSupabase();

        if (!supabase) {

            showMessage(
                "تعذر الاتصال بنظام الحسابات.",
                "error"
            );

            return;
        }


        const email =
            document.getElementById(
                "wfesc-forgot-email"
            )?.value.trim();


        if (!email) {

            showMessage(
                "يرجى إدخال البريد الإلكتروني.",
                "error"
            );

            return;
        }


        const button =
            document.getElementById(
                "wfesc-forgot-button"
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "جارٍ الإرسال...";
        }


        try {

            const redirectTo =
                window.location.origin +
                window.location.pathname;


            const result =
                await supabase.auth.resetPasswordForEmail(

                    email,

                    {
                        redirectTo:
                            redirectTo
                    }

                );


            if (result.error) {

                showMessage(
                    result.error.message ||
                    "تعذر إرسال رابط الاستعادة.",
                    "error"
                );

                return;
            }


            showMessage(
                "📧 تم إرسال رابط استعادة كلمة المرور. تحقق من البريد والرسائل غير المرغوب فيها.",
                "success"
            );


        } catch (error) {

            showMessage(
                "حدث خطأ أثناء إرسال رابط الاستعادة.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "إرسال رابط الاستعادة";
            }

        }

    }


    /* =====================================================
       تحديث حالة الحساب داخل الإعدادات
       ===================================================== */

    function updateSettingsAccount() {

        const status =
            document.getElementById(
                "wfesc-account-setting-status"
            );

        const button =
            document.getElementById(
                "wfesc-account-login-button"
            );


        if (!status || !button) {
            return;
        }


        if (
            ACCOUNT_STATE.loggedIn &&
            ACCOUNT_STATE.user
        ) {

            status.textContent =
                ACCOUNT_STATE.user.email ||
                "مسجل الدخول";


            button.textContent =
                "الحساب";


            button.onclick =
                function () {

                    openAccountUI("login");

                };

        } else {

            status.textContent =
                "غير مسجل الدخول";


            button.textContent =
                "تسجيل الدخول";


            button.onclick =
                function () {

                    openAccountUI("login");

                };

        }

    }


    /* =====================================================
       تسجيل الخروج
       ===================================================== */

    async function logout() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return;
        }


        await supabase.auth.signOut();


        ACCOUNT_STATE.loggedIn =
            false;

        ACCOUNT_STATE.user =
            null;

        ACCOUNT_STATE.session =
            null;


        updateSettingsAccount();


        document.dispatchEvent(
            new CustomEvent(
                "wfesc:logout"
            )
        );

    }


    /* =====================================================
       مراقبة جلسة Supabase
       ===================================================== */

    async function refreshSession() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return;
        }


        try {

            const result =
                await supabase.auth.getSession();


            const session =
                result.data?.session;


            if (session) {

                ACCOUNT_STATE.loggedIn =
                    true;

                ACCOUNT_STATE.session =
                    session;

                ACCOUNT_STATE.user =
                    session.user;

            } else {

                ACCOUNT_STATE.loggedIn =
                    false;

                ACCOUNT_STATE.session =
                    null;

                ACCOUNT_STATE.user =
                    null;

            }


            updateSettingsAccount();


        } catch (error) {

            console.error(
                "[WFESC ACCOUNT] Session error:",
                error
            );

        }

    }


    function listenAuthChanges() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return;
        }


        supabase.auth.onAuthStateChange(

            function (
                event,
                session
            ) {

                ACCOUNT_STATE.session =
                    session || null;

                ACCOUNT_STATE.user =
                    session?.user || null;

                ACCOUNT_STATE.loggedIn =
                    Boolean(session);


                updateSettingsAccount();


                document.dispatchEvent(
                    new CustomEvent(
                        "wfesc:auth-change",
                        {
                            detail: {
                                event:
                                    event,

                                user:
                                    ACCOUNT_STATE.user,

                                session:
                                    ACCOUNT_STATE.session,

                                loggedIn:
                                    ACCOUNT_STATE.loggedIn
                            }
                        }
                    )
                );

            }

        );

    }


    /* =====================================================
       ربط الواجهة
       ===================================================== */

    function bindAccountUI() {

        const close =
            document.getElementById(
                "wfesc-account-close"
            );

        if (close) {

            close.addEventListener(
                "click",
                closeAccountUI
            );

        }


        const overlay =
            document.getElementById(
                "wfesc-social-account"
            );

        if (overlay) {

            overlay.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === overlay
                    ) {

                        closeAccountUI();

                    }

                }
            );

        }


        document
            .querySelectorAll(
                ".wfesc-password-eye"
            )
            .forEach(
                function (eye) {

                    eye.addEventListener(
                        "click",
                        function () {

                            const id =
                                eye.dataset.eyeFor;

                            const input =
                                document.getElementById(
                                    id
                                );

                            if (!input) {
                                return;
                            }


                            if (
                                input.type ===
                                "password"
                            ) {

                                input.type =
                                    "text";

                                eye.textContent =
                                    "🙈";

                            } else {

                                input.type =
                                    "password";

                                eye.textContent =
                                    "🙉";

                            }

                        }
                    );

                }
            );


        document
            .getElementById(
                "wfesc-login-button"
            )
            ?.addEventListener(
                "click",
                login
            );


        document
            .getElementById(
                "wfesc-register-button"
            )
            ?.addEventListener(
                "click",
                register
            );


        document
            .getElementById(
                "wfesc-forgot-button"
            )
            ?.addEventListener(
                "click",
                resetPassword
            );


        document
            .getElementById(
                "wfesc-forgot-link"
            )
            ?.addEventListener(
                "click",
                function () {

                    clearMessage();

                    switchView(
                        "forgot"
                    );

                }
            );


        document
            .getElementById(
                "wfesc-register-link"
            )
            ?.addEventListener(
                "click",
                function () {

                    clearMessage();

                    switchView(
                        "register"
                    );

                }
            );


        document
            .getElementById(
                "wfesc-back-login"
            )
            ?.addEventListener(
                "click",
                function () {

                    clearMessage();

                    switchView(
                        "login"
                    );

                }
            );


        document
            .getElementById(
                "wfesc-back-login-register"
            )
            ?.addEventListener(
                "click",
                function () {

                    clearMessage();

                    switchView(
                        "login"
                    );

                }
            );

    }


    /* =====================================================
       تشغيل النظام
       ===================================================== */
function waitForSettings() {

    return new Promise((resolve) => {

        if (document.getElementById("wfesc-settings-panel")) {
            resolve();
            return;
        }

        const observer = new MutationObserver(() => {

            if (document.getElementById("wfesc-settings-panel")) {

                observer.disconnect();

                resolve();
            }

        });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    });

}
   
    async function start() {

    if (ACCOUNT_STATE.initialized) {
        return;
    }

    ACCOUNT_STATE.initialized = true;

    await waitForSettings();

    createSettingsAccount();

    createAccountUI();

    await refreshSession();

    listenAuthChanges();

    console.log(
        "[WFESC ACCOUNT] Account system loaded."
    );

    }


    /* =====================================================
       API
       ===================================================== */

    window.WFESC_ACCOUNT = {

        start: start,

        open: openAccountUI,

        close: closeAccountUI,

        login: login,

        register: register,

        logout: logout,

        resetPassword: resetPassword,

        getUser: function () {

            return ACCOUNT_STATE.user;

        },

        getSession: function () {

            return ACCOUNT_STATE.session;

        },

        isLoggedIn: function () {

            return ACCOUNT_STATE.loggedIn;

        }

    };


    /* =====================================================
       التشغيل التلقائي
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }


})();
 
