/* =========================================================
   WFESC SETTINGS AUTH UI
   settings-auth-ui.js
   ========================================================= */

(function () {

    "use strict";


    /* -----------------------------------------------------
       منع تشغيل الملف أكثر من مرة
    ----------------------------------------------------- */

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    window.WFESCSettingsAuthUI = true;


    /* -----------------------------------------------------
       التأكد من نظام الحساب
    ----------------------------------------------------- */

    if (!window.WFESCSettingsAuth) {

        console.error(
            "WFESC Settings Auth UI: settings-auth.js غير محمل."
        );

        return;
    }


    const AUTH =
        window.WFESCSettingsAuth;

    const CONFIG =
        window.WFESCSettingsAuthConfig || {};


    /* -----------------------------------------------------
       عناصر الصفحة
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
       أدوات
    ----------------------------------------------------- */

    function getMessages() {

        return CONFIG.messages || {};

    }


    function showStatus(
        message,
        type = "normal",
        duration = 0
    ) {

        if (!settingsStatus) {
            return;
        }

        settingsStatus.textContent =
            message;

        settingsStatus.dataset.type =
            type;

        settingsStatus.style.display =
            "block";

        settingsStatus.style.opacity =
            "1";


        clearTimeout(
            window.__wfescAuthStatusTimer
        );


        if (duration > 0) {

            window.__wfescAuthStatusTimer =
                setTimeout(function () {

                    if (!settingsStatus) {
                        return;
                    }

                    settingsStatus.style.opacity =
                        "0";


                    setTimeout(function () {

                        if (
                            settingsStatus &&
                            settingsStatus.textContent === message
                        ) {

                            settingsStatus.textContent =
                                "";

                            settingsStatus.style.display =
                                "none";

                        }

                    }, 300);

                }, duration);

        }

    }


    function clearStatus() {

        if (!settingsStatus) {
            return;
        }

        clearTimeout(
            window.__wfescAuthStatusTimer
        );

        settingsStatus.textContent =
            "";

        settingsStatus.style.opacity =
            "0";

        settingsStatus.style.display =
            "none";

    }


    /* -----------------------------------------------------
       التحقق من البريد
    ----------------------------------------------------- */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );

    }


    /* -----------------------------------------------------
       التحقق من اسم المستخدم
       الحد الأقصى 3 أحرف
    ----------------------------------------------------- */

    function isValidUsername(username) {

        const limits =
            CONFIG.username || {};

        const min =
            Number(limits.minLength || 1);

        const max =
            Number(limits.maxLength || 3);

        const length =
            [...username].length;

        return (
            length >= min &&
            length <= max
        );

    }


    /* -----------------------------------------------------
       تحويل أخطاء Supabase
    ----------------------------------------------------- */

    function getErrorMessage(error) {

        if (!error) {

            return "حدث خطأ غير معروف.";

        }


        const rawMessage =
            String(
                error.message ||
                error.error_description ||
                ""
            );

        const message =
            rawMessage.toLowerCase();


        if (
            message.includes("user already registered") ||
            message.includes("already registered") ||
            message.includes("already exists")
        ) {

            return (
                getMessages().alreadyRegistered ||
                "أنت مسجل بالفعل، تابع من صفحة لدي حساب."
            );

        }


        if (
            message.includes("invalid login credentials") ||
            message.includes("invalid credentials")
        ) {

            return (
                getMessages().wrongPassword ||
                "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            );

        }


        if (
            message.includes("email not confirmed") ||
            message.includes("email_not_confirmed")
        ) {

            return "يجب تأكيد بريدك الإلكتروني أولاً.";

        }


        if (
            message.includes("invalid email") ||
            message.includes("email_address_invalid")
        ) {

            return (
                getMessages().invalidEmail ||
                "يرجى إدخال بريد إلكتروني صحيح."
            );

        }


        if (
            message.includes("password") &&
            (
                message.includes("6") ||
                message.includes("weak")
            )
        ) {

            return (
                getMessages().invalidPassword ||
                "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
            );

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


        return (
            rawMessage ||
            "حدث خطأ، حاول مرة أخرى."
        );

    }


    /* -----------------------------------------------------
       فتح نافذة الحساب
    ----------------------------------------------------- */

    function openModal(mode) {

        if (!accountModal) {
            return;
        }


        currentMode =
            mode;


        clearStatus();


        if (accountForm) {
            accountForm.reset();
        }


        if (modalAction) {

            modalAction.style.display =
                "";

            modalAction.disabled =
                false;

            delete modalAction.dataset.oldText;

        }


        /* =================================================
           إنشاء حساب
        ================================================= */

        if (mode === "register") {

            if (modalTitle) {

                modalTitle.textContent =
                    "إنشاء حساب WFESC";

            }


            if (accountUsername) {

                accountUsername.style.display =
                    "";

                accountUsername.disabled =
                    false;

                accountUsername.required =
                    true;

                accountUsername.maxLength =
                    Number(
                        CONFIG.username?.maxLength || 3
                    );

            }


            if (accountEmail) {

                accountEmail.disabled =
                    false;

                accountEmail.required =
                    true;

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "";

            }


            if (accountPassword) {

                accountPassword.required =
                    true;

            }


            if (accountPasswordConfirm) {

                accountPasswordConfirm.required =
                    true;

            }


            if (modalAction) {

                modalAction.textContent =
                    "إنشاء الحساب";

            }


            if (modalNote) {

                modalNote.textContent =
                    "اسم المستخدم يجب ألا يتجاوز 3 أحرف. بعد إنشاء الحساب قد تحتاج إلى تأكيد بريدك الإلكتروني.";

            }

        }


        /* =================================================
           تسجيل الدخول
        ================================================= */

        if (mode === "login") {

            if (modalTitle) {

                modalTitle.textContent =
                    "تسجيل الدخول";

            }


            if (accountUsername) {

                accountUsername.style.display =
                    "none";

                accountUsername.disabled =
                    true;

                accountUsername.required =
                    false;

            }


            if (accountEmail) {

                accountEmail.disabled =
                    false;

                accountEmail.required =
                    true;

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "none";

            }


            if (accountPassword) {

                accountPassword.required =
                    true;

            }


            if (accountPasswordConfirm) {

                accountPasswordConfirm.required =
                    false;

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


        /* =================================================
           نسيت كلمة المرور
        ================================================= */

        if (mode === "forgot") {

            if (modalTitle) {

                modalTitle.textContent =
                    "إعادة تعيين كلمة المرور";

            }


            if (accountUsername) {

                accountUsername.style.display =
                    "none";

                accountUsername.disabled =
                    true;

                accountUsername.required =
                    false;

            }


            if (accountEmail) {

                accountEmail.disabled =
                    false;

                accountEmail.required =
                    true;

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "none";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "none";

            }


            if (accountPassword) {

                accountPassword.required =
                    false;

            }


            if (accountPasswordConfirm) {

                accountPasswordConfirm.required =
                    false;

            }


            if (modalAction) {

                modalAction.textContent =
                    "إرسال رابط الاستعادة";

            }


            if (modalNote) {

                modalNote.textContent =
                    "أدخل بريد حسابك وسيتم إرسال رابط لإعادة تعيين كلمة المرور.";

            }

        }


        /* =================================================
           إدارة الحساب
        ================================================= */

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

                accountUsername.style.display =
                    "";

                accountUsername.disabled =
                    true;

                accountUsername.required =
                    false;

                accountUsername.value =
                    profile?.username ||
                    user?.user_metadata?.username ||
                    "";

            }


            if (accountEmail) {

                accountEmail.value =
                    user?.email ||
                    "";

                accountEmail.disabled =
                    true;

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "none";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "none";

            }


            if (modalAction) {

                modalAction.style.display =
                    "none";

            }


            if (modalNote) {

                modalNote.textContent =
                    "أنت مسجل الدخول حالياً بحساب WFESC.";

            }

        }


        accountModal.classList.add(
            "show"
        );

    }


    /* -----------------------------------------------------
       جعل فتح النافذة متاحًا للملفات الأخرى
    ----------------------------------------------------- */

    window.WFESCOpenAccountModal =
        openModal;


    /* -----------------------------------------------------
       إغلاق النافذة
    ----------------------------------------------------- */

    function closeAccountModal() {

        if (!accountModal) {
            return;
        }


        accountModal.classList.remove(
            "show"
        );


        currentMode =
            null;


        if (accountForm) {
            accountForm.reset();
        }


        if (accountUsername) {

            accountUsername.disabled =
                false;

        }


        if (accountEmail) {

            accountEmail.disabled =
                false;

        }


        clearStatus();

    }


    /* -----------------------------------------------------
       حالة التحميل
    ----------------------------------------------------- */

    function setLoading(
        isLoading,
        text
    ) {

        if (!modalAction) {
            return;
        }


        if (isLoading) {

            if (
                !modalAction.dataset.oldText
            ) {

                modalAction.dataset.oldText =
                    modalAction.textContent;

            }


            modalAction.disabled =
                true;

            modalAction.textContent =
                text ||
                "جاري المعالجة...";

        } else {

            modalAction.disabled =
                false;


            if (
                modalAction.dataset.oldText
            ) {

                modalAction.textContent =
                    modalAction.dataset.oldText;

                delete modalAction.dataset.oldText;

            }

        }

    }


    /* -----------------------------------------------------
       إنشاء الحساب
    ----------------------------------------------------- */

    async function handleRegister() {

        const username =
            accountUsername?.value.trim() ||
            "";

        const email =
            accountEmail?.value.trim() ||
            "";

        const password =
            accountPassword?.value ||
            "";

        const confirmPassword =
            accountPasswordConfirm?.value ||
            "";


        if (!username) {

            showStatus(
                "اكتب اسم المستخدم.",
                "error"
            );

            return;

        }


        if (!isValidUsername(username)) {

            showStatus(
                getMessages().invalidUsername ||
                "اسم المستخدم يجب أن يكون من 1 إلى 3 أحرف.",
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


        if (!isValidEmail(email)) {

            showStatus(
                getMessages().invalidEmail ||
                "يرجى إدخال بريد إلكتروني صحيح.",
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


        if (
            password !==
            confirmPassword
        ) {

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


            /*
             * إذا لم توجد جلسة فهذا غالبًا يعني
             * أن تأكيد البريد الإلكتروني مطلوب.
             */

            closeAccountModal();


            if (
                session &&
                user
            ) {

                showStatus(
                    "تم إنشاء حسابك وتسجيل الدخول بنجاح.",
                    "success",
                    5000
                );

            } else {

                showStatus(
                    "تم إنشاء الحساب. تحقق من بريدك الإلكتروني أو الرسائل غير المرغوب فيها لتفعيل حسابك.",
                    "success",
                    6000
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

            setLoading(
                false
            );

        }

    }


    /* -----------------------------------------------------
       تسجيل الدخول
    ----------------------------------------------------- */

    async function handleLogin() {

        const email =
            accountEmail?.value.trim() ||
            "";

        const password =
            accountPassword?.value ||
            "";


        if (!email) {

            showStatus(
                "اكتب البريد الإلكتروني.",
                "error"
            );

            return;

        }


        if (!isValidEmail(email)) {

            showStatus(
                getMessages().invalidEmail ||
                "يرجى إدخال بريد إلكتروني صحيح.",
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
                getMessages().loginSuccess ||
                "تم تسجيل الدخول بنجاح.",
                "success",
                5000
            );

        } catch (error) {

            console.error(
                "WFESC Login Error:",
                error
            );


            /*
             * لا نغلق النافذة عند الخطأ
             * حتى يستطيع المستخدم تجربة كلمة مرور أخرى
             * أو الانتقال لإعادة التعيين.
             */

            showStatus(
                getErrorMessage(error),
                "error"
            );


            /*
             * إذا كان الخطأ متعلقًا ببيانات الدخول،
             * نظهر خيار إعادة تعيين كلمة المرور.
             */

            const message =
                String(
                    error?.message || ""
                ).toLowerCase();


            if (
                message.includes("invalid login credentials") ||
                message.includes("invalid credentials") ||
                message.includes("wrong password")
            ) {

                showResetPasswordOption();

            }

        } finally {

            setLoading(
                false
            );

        }

    }


    /* -----------------------------------------------------
       إعادة تعيين كلمة المرور
    ----------------------------------------------------- */

    async function handleForgotPassword() {

        const email =
            accountEmail?.value.trim() ||
            "";


        if (!email) {

            showStatus(
                "اكتب البريد الإلكتروني أولاً.",
                "error"
            );

            return;

        }


        if (!isValidEmail(email)) {

            showStatus(
                getMessages().invalidEmail ||
                "يرجى إدخال بريد إلكتروني صحيح.",
                "error"
            );

            return;

        }


        try {

            setLoading(
                true,
                "جاري إرسال الرابط..."
            );


            /*
             * نستخدم نفس Supabase Client
             * الموجود في نظام الحساب.
             */

            if (
                !AUTH.client ||
                !AUTH.client.auth
            ) {

                throw new Error(
                    "تعذر الوصول إلى نظام المصادقة."
                );

            }


            const redirectUrl =
                window.location.origin +
                window.location.pathname;


            const result =
                await AUTH.client.auth.resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            redirectUrl
                    }
                );


            if (result.error) {

                throw result.error;

            }


            closeAccountModal();


            showStatus(
                getMessages().resetSent ||
                "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
                "success",
                7000
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

            setLoading(
                false
            );

        }

    }


    /* -----------------------------------------------------
       إظهار خيار إعادة التعيين بعد خطأ كلمة المرور
    ----------------------------------------------------- */

    function showResetPasswordOption() {

        if (!modalNote) {
            return;
        }


        modalNote.innerHTML =
            "كلمة المرور غير صحيحة.<br><button type=\"button\" id=\"wfescResetFromLogin\" style=\"margin-top:10px;\">إعادة تعيين كلمة المرور</button>";


        const resetButton =
            document.getElementById(
                "wfescResetFromLogin"
            );


        if (resetButton) {

            resetButton.addEventListener(
                "click",
                function () {

                    const email =
                        accountEmail?.value.trim() ||
                        "";

                    openModal("forgot");

                    if (
                        accountEmail &&
                        email
                    ) {

                        accountEmail.value =
                            email;

                    }

                }
            );

        }

    }


    /* -----------------------------------------------------
       تسجيل الخروج
    ----------------------------------------------------- */

    async function handleLogout() {

        try {

            if (createAccountButton) {
                createAccountButton.disabled =
                    true;
            }

            if (loginButton) {
                loginButton.disabled =
                    true;
            }

            if (forgotPasswordButton) {
                forgotPasswordButton.disabled =
                    true;
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

        } finally {

            if (createAccountButton) {
                createAccountButton.disabled =
                    false;
            }

            if (loginButton) {
                loginButton.disabled =
                    false;
            }

            if (forgotPasswordButton) {
                forgotPasswordButton.disabled =
                    false;
            }

        }

    }


    /* -----------------------------------------------------
       تحديث أزرار الحساب
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

                    openModal(
                        "account"
                    );

                } else {

                    openModal(
                        "register"
                    );

                }

            },
            true
        );

    }


    /* -----------------------------------------------------
       زر تسجيل الدخول / الخروج
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

                    openModal(
                        "login"
                    );

                }

            },
            true
        );

    }


    /* -----------------------------------------------------
       نسيت كلمة المرور
    ----------------------------------------------------- */

    if (forgotPasswordButton) {

        forgotPasswordButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopImmediatePropagation();


                openModal(
                    "forgot"
                );

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
       الضغط على الخلفية
    ----------------------------------------------------- */

    if (accountModal) {

        accountModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    accountModal
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
                accountModal.classList.contains("show")
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


                if (
                    currentMode ===
                    "register"
                ) {

                    handleRegister();

                    return;

                }


                if (
                    currentMode ===
                    "login"
                ) {

                    handleLogin();

                    return;

                }


                if (
                    currentMode ===
                    "forgot"
                ) {

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
 
