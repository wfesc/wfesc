
/* =========================================================
   WFESC SETTINGS AUTH UI
   settings-auth-ui.js
   ========================================================= */

(function () {

    alert("AUTH UI اشتغل");

    "use strict";

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    window.WFESCSettingsAuthUI = true;

    /* -----------------------------------------------------
       التأكد من وجود نظام الحساب
    ----------------------------------------------------- */

    if (!window.WFESCSettingsAuth) {
        console.error(
            "WFESC Settings Auth UI: settings-auth.js غير محمل."
        );
        return;
    }

    const AUTH = window.WFESCSettingsAuth;


    /* -----------------------------------------------------
       العناصر
    ----------------------------------------------------- */

    const createAccountButton =
        document.getElementById("createAccountButton");

    const loginButton =
        document.getElementById("loginButton");

    const forgotPasswordButton =
        document.getElementById("forgotPasswordButton");

    const settingsStatus =
        document.getElementById("settingsStatus");

    const accountModal =
        document.getElementById("accountModal");

    const modalTitle =
        document.getElementById("modalTitle");

    const closeModal =
        document.getElementById("closeModal");

    const accountForm =
        document.getElementById("accountForm");

    const accountUsername =
        document.getElementById("accountUsername");

    const accountEmail =
        document.getElementById("accountEmail");

    const passwordGroup =
        document.getElementById("passwordGroup");

    const accountPassword =
        document.getElementById("accountPassword");

    const confirmPasswordGroup =
        document.getElementById("confirmPasswordGroup");

    const accountPasswordConfirm =
        document.getElementById("accountPasswordConfirm");

    const modalAction =
        document.getElementById("modalAction");

    const modalNote =
        document.getElementById("modalNote");


    /* -----------------------------------------------------
       حالة النافذة
    ----------------------------------------------------- */

    let currentMode = null;


    /* -----------------------------------------------------
       إظهار رسالة
    ----------------------------------------------------- */

    function showStatus(message, type = "normal", duration = 0) {

        if (!settingsStatus) {
            return;
        }

        settingsStatus.textContent = message;

        settingsStatus.style.display = "block";

        settingsStatus.dataset.type = type;

        settingsStatus.style.opacity = "1";

        if (duration > 0) {

            setTimeout(function () {

                if (settingsStatus) {

                    settingsStatus.style.opacity = "0";

                    setTimeout(function () {

                        if (
                            settingsStatus &&
                            settingsStatus.textContent === message
                        ) {
                            settingsStatus.textContent = "";
                            settingsStatus.style.display = "none";
                        }

                    }, 300);

                }

            }, duration);

        }

    }


    /* -----------------------------------------------------
       تنظيف الرسائل
    ----------------------------------------------------- */

    function clearStatus() {

        if (!settingsStatus) {
            return;
        }

        settingsStatus.textContent = "";

        settingsStatus.style.display = "none";

        settingsStatus.style.opacity = "0";

    }


    /* -----------------------------------------------------
       رسالة الخطأ
    ----------------------------------------------------- */

    function getErrorMessage(error) {

        if (!error) {
            return "حدث خطأ غير معروف.";
        }

        const message =
            String(error.message || "").toLowerCase();


        if (
            message.includes("user already registered") ||
            message.includes("already registered")
        ) {
            return "هذا البريد الإلكتروني مسجل مسبقاً.";
        }


        if (
            message.includes("invalid login credentials") ||
            message.includes("invalid credentials")
        ) {
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        }


        if (
            message.includes("email not confirmed") ||
            message.includes("email_not_confirmed")
        ) {
            return "يجب تأكيد بريدك الإلكتروني أولاً.";
        }


        if (
            message.includes("password should be at least") ||
            message.includes("password")
        ) {

            if (message.includes("6")) {
                return "كلمة المرور يجب أن تكون 6 أحرف أو أكثر.";
            }

        }


        if (
            message.includes("rate limit") ||
            message.includes("too many requests")
        ) {
            return "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.";
        }


        if (
            message.includes("network") ||
            message.includes("fetch")
        ) {
            return "تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت.";
        }


        return error.message ||
            "حدث خطأ، حاول مرة أخرى.";

    }


    /* -----------------------------------------------------
       فتح النافذة
    ----------------------------------------------------- */

    function openModal(mode) {

        if (!accountModal) {
            return;
        }

        currentMode = mode;


        if (modalAction) {
            modalAction.style.display = "";
            modalAction.disabled = false;
        }


        if (accountForm) {
            accountForm.reset();
        }


        clearStatus();


        /* ---------------- إنشاء حساب ---------------- */

        if (mode === "register") {

            if (modalTitle) {
                modalTitle.textContent =
                    "إنشاء حساب WFESC";
            }

            if (accountUsername) {
                accountUsername.style.display = "";
                accountUsername.required = true;
            }

            if (passwordGroup) {
                passwordGroup.style.display = "";
            }

            if (confirmPasswordGroup) {
                confirmPasswordGroup.style.display = "";
            }

            if (accountPassword) {
                accountPassword.required = true;
            }

            if (accountPasswordConfirm) {
                accountPasswordConfirm.required = true;
            }

            if (modalAction) {
                modalAction.textContent =
                    "إنشاء الحساب";
            }

            if (modalNote) {
                modalNote.textContent =
                    "بعد إنشاء الحساب قد تحتاج إلى تأكيد بريدك الإلكتروني.";
            }

        }


        /* ---------------- تسجيل الدخول ---------------- */

        if (mode === "login") {

            if (modalTitle) {
                modalTitle.textContent =
                    "تسجيل الدخول";
            }

            if (accountUsername) {
                accountUsername.style.display = "none";
                accountUsername.required = false;
            }

            if (passwordGroup) {
                passwordGroup.style.display = "";
            }

            if (confirmPasswordGroup) {
                confirmPasswordGroup.style.display = "none";
            }

            if (accountPassword) {
                accountPassword.required = true;
            }

            if (accountPasswordConfirm) {
                accountPasswordConfirm.required = false;
            }

            if (modalAction) {
                modalAction.textContent =
                    "تسجيل الدخول";
            }

            if (modalNote) {
                modalNote.textContent =
                    "استخدم البريد الإلكتروني وكلمة المرور الخاصة بحسابك.";
            }

        }


        /* ---------------- نسيت كلمة المرور ---------------- */

        if (mode === "forgot") {

            if (modalTitle) {
                modalTitle.textContent =
                    "استعادة كلمة المرور";
            }

            if (accountUsername) {
                accountUsername.style.display = "none";
                accountUsername.required = false;
            }

            if (passwordGroup) {
                passwordGroup.style.display = "none";
            }

            if (confirmPasswordGroup) {
                confirmPasswordGroup.style.display = "none";
            }

            if (accountPassword) {
                accountPassword.required = false;
            }

            if (accountPasswordConfirm) {
                accountPasswordConfirm.required = false;
            }

            if (modalAction) {
                modalAction.textContent =
                    "إرسال رابط الاستعادة";
            }

            if (modalNote) {
                modalNote.textContent =
                    "سيتم إرسال رابط إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور.";
            }

        }


        /* ---------------- الحساب مسجل ---------------- */

        if (mode === "account") {

            const user =
                AUTH.getUser();

            const profile =
                AUTH.getProfile();

            if (modalTitle) {
                modalTitle.textContent =
                    "حساب WFESC";
            }

            if (accountUsername) {
                accountUsername.style.display = "";
                accountUsername.disabled = true;
                accountUsername.required = false;
                accountUsername.value =
                    profile?.username ||
                    user?.user_metadata?.username ||
                    "";
            }

            if (accountEmail) {
                accountEmail.value =
                    user?.email ||
                    "";
                accountEmail.disabled = true;
            }

            if (passwordGroup) {
                passwordGroup.style.display = "none";
            }

            if (confirmPasswordGroup) {
                confirmPasswordGroup.style.display = "none";
            }

            if (modalAction) {
                modalAction.style.display = "none";
            }

            if (modalNote) {
                modalNote.textContent =
                    "أنت مسجل الدخول حالياً بحساب WFESC.";
            }

        }


        accountModal.style.display = "flex";

    }


    /* -----------------------------------------------------
       إغلاق النافذة
    ----------------------------------------------------- */

    function closeAccountModal() {

        if (!accountModal) {
            return;
        }

        accountModal.style.display = "none";

        currentMode = null;

        if (accountForm) {
            accountForm.reset();
        }

        if (accountUsername) {
            accountUsername.disabled = false;
        }

        if (accountEmail) {
            accountEmail.disabled = false;
        }

        clearStatus();

    }


    /* -----------------------------------------------------
       حالة التحميل
    ----------------------------------------------------- */

    function setLoading(isLoading, text) {

        if (!modalAction) {
            return;
        }

        modalAction.disabled = isLoading;

        if (isLoading) {

            modalAction.dataset.oldText =
                modalAction.textContent;

            modalAction.textContent =
                text || "جاري المعالجة...";

        } else {

            if (modalAction.dataset.oldText) {

                modalAction.textContent =
                    modalAction.dataset.oldText;

                delete modalAction.dataset.oldText;

            }

        }

    }


    /* -----------------------------------------------------
       إنشاء حساب
    ----------------------------------------------------- */

    async function handleRegister() {

        const username =
            accountUsername?.value.trim() || "";

        const email =
            accountEmail?.value.trim() || "";

        const password =
            accountPassword?.value || "";

        const confirmPassword =
            accountPasswordConfirm?.value || "";


        if (!username) {

            showStatus(
                "اكتب اسم المستخدم.",
                "error"
            );

            return;

        }


        if (!email) {

            showStatus(
                "اكتب البريد الإلكتروني.",
                "error"
            );

            return;

        }


        if (!password) {

            showStatus(
                "اكتب كلمة المرور.",
                "error"
            );

            return;

        }


        if (password.length < 6) {

            showStatus(
                "كلمة المرور يجب أن تكون 6 أحرف أو أكثر.",
                "error"
            );

            return;

        }


        if (password !== confirmPassword) {

            showStatus(
                "كلمتا المرور غير متطابقتين.",
                "error"
            );

            return;

        }


        try {

            setLoading(
                true,
                "جاري إنشاء الحساب..."
            );


            const result =
                await AUTH.signUp(
                    email,
                    password,
                    username
                );


            const user =
                result?.user ||
                AUTH.getUser();


            const session =
                result?.session ||
                AUTH.getSession();


            if (session && user) {

                closeAccountModal();

                showStatus(
                    "تم إنشاء حسابك وتسجيل الدخول بنجاح.",
                    "success",
                    5000
                );

            } else {

                closeAccountModal();

                showStatus(
                    "تحقق من بريدك الإلكتروني أو الرسائل غير المرغوب فيها لتفعيل حسابك.",
                    "success",
                    5000
                );

            }

        } catch (error) {

            console.error(
                "WFESC Register Error:",
                error
            );

            showStatus(
                getErrorMessage(error),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }


    /* -----------------------------------------------------
       تسجيل الدخول
    ----------------------------------------------------- */

    async function handleLogin() {

        const email =
            accountEmail?.value.trim() || "";

        const password =
            accountPassword?.value || "";


        if (!email) {

            showStatus(
                "اكتب البريد الإلكتروني.",
                "error"
            );

            return;

        }


        if (!password) {

            showStatus(
                "اكتب كلمة المرور.",
                "error"
            );

            return;

        }


        try {

            setLoading(
                true,
                "جاري تسجيل الدخول..."
            );


            await AUTH.signIn(
                email,
                password
            );


            closeAccountModal();

            showStatus(
                "تم تسجيل الدخول بنجاح.",
                "success",
                5000
            );


        } catch (error) {

            console.error(
                "WFESC Login Error:",
                error
            );

            showStatus(
                getErrorMessage(error),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }


    /* -----------------------------------------------------
       استعادة كلمة المرور
    ----------------------------------------------------- */

    async function handleForgotPassword() {

        const email =
            accountEmail?.value.trim() || "";


        if (!email) {

            showStatus(
                "اكتب البريد الإلكتروني أولاً.",
                "error"
            );

            return;

        }


        try {

            setLoading(
                true,
                "جاري إرسال الرابط..."
            );


            await AUTH.client.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            window.location.origin +
                            window.location.pathname
                    }
                );


            closeAccountModal();

            showStatus(
                "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. تحقق من البريد الوارد والرسائل غير المرغوب فيها.",
                "success",
                5000
            );


        } catch (error) {

            console.error(
                "WFESC Password Reset Error:",
                error
            );

            showStatus(
                getErrorMessage(error),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }


    /* -----------------------------------------------------
       تسجيل الخروج
    ----------------------------------------------------- */

    async function handleLogout() {

        try {

            if (createAccountButton) {
                createAccountButton.disabled = true;
            }

            if (loginButton) {
                loginButton.disabled = true;
            }

            if (forgotPasswordButton) {
                forgotPasswordButton.disabled = true;
            }


            await AUTH.signOut();


            showStatus(
                "تم تسجيل الخروج بنجاح.",
                "success",
                5000
            );


        } catch (error) {

            console.error(
                "WFESC Logout Error:",
                error
            );

            showStatus(
                getErrorMessage(error),
                "error"
            );

        }

    }


    /* -----------------------------------------------------
       تحديث واجهة الحساب
    ----------------------------------------------------- */

    function updateAccountUI() {

        const user =
            AUTH.getUser();


        if (user) {

            if (createAccountButton) {
                createAccountButton.textContent =
                    "إدارة الحساب";
            }

            if (loginButton) {
                loginButton.textContent =
                    "تسجيل الخروج";
            }

            if (forgotPasswordButton) {
                forgotPasswordButton.textContent =
                    "تغيير كلمة المرور";
            }

        } else {

            if (createAccountButton) {
                createAccountButton.textContent =
                    "إنشاء حساب";
            }

            if (loginButton) {
                loginButton.textContent =
                    "لدي حساب — تسجيل الدخول";
            }

            if (forgotPasswordButton) {
                forgotPasswordButton.textContent =
                    "نسيت كلمة المرور؟";
            }

        }

    }


    /* -----------------------------------------------------
       زر إنشاء الحساب / إدارة الحساب
    ----------------------------------------------------- */

    if (createAccountButton) {

        createAccountButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopImmediatePropagation();


                if (AUTH.getUser()) {

                    openModal("account");

                } else {

                    openModal("register");

                }

            },
            true
        );

    }


    /* -----------------------------------------------------
       زر الدخول / الخروج
    ----------------------------------------------------- */

    if (loginButton) {

        loginButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopImmediatePropagation();


                if (AUTH.getUser()) {

                    handleLogout();

                } else {

                    openModal("login");

                }

            },
            true
        );

    }


    /* -----------------------------------------------------
       زر نسيت كلمة المرور
    ----------------------------------------------------- */

    if (forgotPasswordButton) {

        forgotPasswordButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopImmediatePropagation();

                openModal("forgot");

            },
            true
        );

    }


    /* -----------------------------------------------------
       إغلاق النافذة
    ----------------------------------------------------- */

    if (closeModal) {

        closeModal.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeAccountModal();

            }
        );

    }


    /* -----------------------------------------------------
       الضغط خارج النافذة
    ----------------------------------------------------- */

    if (accountModal) {

        accountModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === accountModal
                ) {

                    closeAccountModal();

                }

            }
        );

    }


    /* -----------------------------------------------------
       زر Escape
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                accountModal &&
                accountModal.style.display === "flex"
            ) {

                closeAccountModal();

            }

        }
    );


    /* -----------------------------------------------------
       إرسال النموذج
    ----------------------------------------------------- */

    if (accountForm) {

        accountForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();
                event.stopImmediatePropagation();


                if (currentMode === "register") {

                    handleRegister();

                    return;

                }


                if (currentMode === "login") {

                    handleLogin();

                    return;

                }


                if (currentMode === "forgot") {

                    handleForgotPassword();

                    return;

                }

            },
            true
        );

    }


    /* -----------------------------------------------------
       مراقبة تغير الحساب
    ----------------------------------------------------- */

    window.addEventListener(
        "WFESCAuthChanged",
        function () {

            updateAccountUI();

        }
    );


    /* -----------------------------------------------------
       مراقبة تحديث الملف الشخصي
    ----------------------------------------------------- */

    window.addEventListener(
        "WFESCProfileUpdated",
        function () {

            updateAccountUI();

        }
    );


    /* -----------------------------------------------------
       تشغيل الجلسة الحالية
    ----------------------------------------------------- */

    (async function initialize() {

        try {

            await AUTH.restoreSession();

        } catch (error) {

            console.error(
                "WFESC Auth Restore Error:",
                error
            );

        }

        updateAccountUI();

    })();


})();
    
