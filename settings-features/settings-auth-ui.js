/* =========================================================
   WFESC SETTINGS AUTH UI
   settings-auth-ui.js
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       منع التحميل أكثر من مرة
    ===================================================== */

    if (window.WFESCSettingsAuthUI) {
        return;
    }


    window.WFESCSettingsAuthUI = true;


    /* =====================================================
       انتظار جاهزية الصفحة
    ===================================================== */

    function start() {

        if (
            !window.WFESCSettingsAuth
        ) {

            console.error(
                "WFESC Auth UI: settings-auth.js غير محمّل."
            );

            return;

        }


        const AUTH =
            window.WFESCSettingsAuth;


        const CONFIG =
            AUTH.config || {};


        /* =================================================
           ELEMENTS
        ================================================= */

        const createAccountButton =
            document.getElementById(
                "createAccountButton"
            );


        const loginButton =
            document.getElementById(
                "loginButton"
            );


        const forgotPasswordButton =
            document.getElementById(
                "forgotPasswordButton"
            );


        const settingsStatus =
            document.getElementById(
                "settingsStatus"
            );


        const accountModal =
            document.getElementById(
                "accountModal"
            );


        const modalTitle =
            document.getElementById(
                "modalTitle"
            );


        const closeModalButton =
            document.getElementById(
                "closeModal"
            );


        const accountForm =
            document.getElementById(
                "accountForm"
            );


        const accountUsername =
            document.getElementById(
                "accountUsername"
            );


        const accountEmail =
            document.getElementById(
                "accountEmail"
            );


        const passwordGroup =
            document.getElementById(
                "passwordGroup"
            );


        const accountPassword =
            document.getElementById(
                "accountPassword"
            );


        const confirmPasswordGroup =
            document.getElementById(
                "confirmPasswordGroup"
            );


        const accountPasswordConfirm =
            document.getElementById(
                "accountPasswordConfirm"
            );


        const modalAction =
            document.getElementById(
                "modalAction"
            );


        const modalNote =
            document.getElementById(
                "modalNote"
            );


        const accountButtons =
            document.getElementById(
                "accountButtons"
            );


        const loggedInAccount =
            document.getElementById(
                "loggedInAccount"
            );


        const loggedInAvatar =
            document.getElementById(
                "loggedInAvatar"
            );


        const loggedInAvatarFallback =
            document.getElementById(
                "loggedInAvatarFallback"
            );


        const loggedInUsername =
            document.getElementById(
                "loggedInUsername"
            );


        const manageAccountButton =
            document.getElementById(
                "manageAccountButton"
            );


        const logoutAccountButton =
            document.getElementById(
                "logoutAccountButton"
            );


        /* =================================================
           STATE
        ================================================= */

        let modalMode =
            "login";


        let busy =
            false;


        /* =================================================
           HELPERS
        ================================================= */

        function setStatus(
            message,
            type
        ) {

            if (!settingsStatus) {
                return;
            }


            settingsStatus.textContent =
                message || "";


            settingsStatus.dataset.type =
                type || "";

        }


        function setModalNote(
            message
        ) {

            if (!modalNote) {
                return;
            }


            modalNote.textContent =
                message || "";

        }


        function openModal() {

            if (!accountModal) {
                return;
            }


            accountModal.classList.add(
                "show"
            );

        }


        function closeModal() {

            if (!accountModal) {
                return;
            }


            accountModal.classList.remove(
                "show"
            );

        }


        function clearForm() {

            if (accountForm) {

                accountForm.reset();

            }


            if (accountPassword) {

                accountPassword.value =
                    "";

            }


            if (accountPasswordConfirm) {

                accountPasswordConfirm.value =
                    "";

            }

        }


        function setLoading(
            loading
        ) {

            busy =
                Boolean(loading);


            if (modalAction) {

                modalAction.disabled =
                    busy;


                if (busy) {

                    modalAction.dataset.oldText =
                        modalAction.textContent;


                    modalAction.textContent =
                        "جاري المعالجة...";

                } else {

                    modalAction.textContent =
                        modalAction.dataset.oldText ||
                        (
                            modalMode === "register"
                                ? "إنشاء الحساب"
                                : "تسجيل الدخول"
                        );

                }

            }


            if (
                createAccountButton
            ) {

                createAccountButton.disabled =
                    busy;

            }


            if (
                loginButton
            ) {

                loginButton.disabled =
                    busy;

            }

        }


        /* =================================================
           إظهار وضع تسجيل الدخول
        ================================================= */

        function setLoginMode() {

            modalMode =
                "login";


            if (modalTitle) {

                modalTitle.textContent =
                    "تسجيل الدخول";

            }


            if (accountUsername) {

                accountUsername
                    .parentElement
                    .style.display =
                    "none";

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "none";

            }


            if (modalAction) {

                modalAction.textContent =
                    "تسجيل الدخول";

            }


            setModalNote(
                "سجّل الدخول إلى حساب WFESC."
            );


            clearForm();

            openModal();

        }


        /* =================================================
           إظهار وضع إنشاء الحساب
        ================================================= */

        function setRegisterMode() {

            modalMode =
                "register";


            if (modalTitle) {

                modalTitle.textContent =
                    "إنشاء حساب";

            }


            if (accountUsername) {

                accountUsername
                    .parentElement
                    .style.display =
                    "";

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "";

            }


            if (modalAction) {

                modalAction.textContent =
                    "إنشاء الحساب";

            }


            setModalNote(
                "أنشئ حساب WFESC جديد."
            );


            clearForm();

            openModal();

        }


        /* =================================================
           إخفاء/إظهار واجهة الحساب
        ================================================= */

        function showLoggedInUI(
            user,
            profile
        ) {

            if (accountButtons) {

                accountButtons.style.display =
                    "none";

            }


            if (loggedInAccount) {

                loggedInAccount.style.display =
                    "";

            }


            const username =
                (
                    profile &&
                    profile.username
                )
                    ? profile.username
                    : (
                        user &&
                        user.user_metadata &&
                        user.user_metadata.username
                    )
                        ? user.user_metadata.username
                        : (
                            user &&
                            user.email
                        )
                            ? user.email.split("@")[0]
                            : "WFESC";


            if (loggedInUsername) {

                loggedInUsername.textContent =
                    username;

            }


            const avatar =
                profile &&
                profile.avatar_url
                    ? profile.avatar_url
                    : null;


            if (
                loggedInAvatar &&
                loggedInAvatarFallback
            ) {

                if (avatar) {

                    loggedInAvatar.src =
                        avatar;

                    loggedInAvatar.style.display =
                        "";

                    loggedInAvatarFallback.style.display =
                        "none";

                } else {

                    loggedInAvatar.removeAttribute(
                        "src"
                    );

                    loggedInAvatar.style.display =
                        "none";

                    loggedInAvatarFallback.style.display =
                        "";

                    loggedInAvatarFallback.textContent =
                        String(
                            username || "W"
                        )
                        .charAt(0)
                        .toUpperCase();

                }

            }


            if (settingsStatus) {

                settingsStatus.textContent =
                    "تم تسجيل الدخول بنجاح.";

            }

        }


        /* =================================================
           إخفاء واجهة الحساب
        ================================================= */

        function showLoggedOutUI() {

            if (accountButtons) {

                accountButtons.style.display =
                    "";

            }


            if (loggedInAccount) {

                loggedInAccount.style.display =
                    "none";

            }


            if (loggedInUsername) {

                loggedInUsername.textContent =
                    "";

            }


            if (loggedInAvatar) {

                loggedInAvatar.removeAttribute(
                    "src"
                );

                loggedInAvatar.style.display =
                    "none";

            }


            if (loggedInAvatarFallback) {

                loggedInAvatarFallback.style.display =
                    "";

                loggedInAvatarFallback.textContent =
                    "W";

            }

        }


        /* =================================================
           فتح الحساب
        ================================================= */

        function refreshUI(
            user,
            profile
        ) {

            if (user) {

                showLoggedInUI(
                    user,
                    profile
                );

            } else {

                showLoggedOutUI();

            }

        }


        /* =================================================
           CREATE ACCOUNT BUTTON
        ================================================= */

        if (createAccountButton) {

            createAccountButton
                .addEventListener(
                    "click",
                    function () {

                        if (busy) {
                            return;
                        }


                        setRegisterMode();

                    }
                );

        }


        /* =================================================
           LOGIN BUTTON
        ================================================= */

        if (loginButton) {

            loginButton
                .addEventListener(
                    "click",
                    function () {

                        if (busy) {
                            return;
                        }


                        setLoginMode();

                    }
                );

        }


        /* =================================================
           CLOSE
        ================================================= */

        if (closeModalButton) {

            closeModalButton
                .addEventListener(
                    "click",
                    function () {

                        if (busy) {
                            return;
                        }


                        closeModal();

                    }
                );

        }


        /* =================================================
           إغلاق بالنقر خارج المودال
        ================================================= */

        if (accountModal) {

            accountModal
                .addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            accountModal
                        ) {

                            if (!busy) {

                                closeModal();

                            }

                        }

                    }
                );

        }


        /* =================================================
           FORGOT PASSWORD
        ================================================= */

        if (forgotPasswordButton) {

            forgotPasswordButton
                .addEventListener(
                    "click",
                    async function () {

                        if (busy) {
                            return;
                        }


                        const email =
                            accountEmail
                                ? accountEmail.value.trim()
                                : "";


                        if (!email) {

                            setStatus(
                                "اكتب بريدك الإلكتروني أولاً.",
                                "error"
                            );

                            return;

                        }


                        setLoading(true);


                        setStatus(
                            "جاري إرسال رابط إعادة تعيين كلمة المرور...",
                            "info"
                        );


                        const result =
                            await AUTH.resetPassword(
                                email
                            );


                        setLoading(false);


                        if (result.error) {

                            setStatus(
                                result.error.message ||
                                "تعذر إرسال رابط إعادة التعيين.",
                                "error"
                            );

                            return;

                        }


                        setStatus(
                            "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
                            "success"
                        );

                    }
                );

        }


        /* =================================================
           FORM SUBMIT
        ================================================= */

        if (accountForm) {

            accountForm
                .addEventListener(
                    "submit",
                    async function (event) {

                        event.preventDefault();


                        if (busy) {
                            return;
                        }


                        const email =
                            accountEmail
                                ? accountEmail.value.trim()
                                : "";


                        const password =
                            accountPassword
                                ? accountPassword.value
                                : "";


                        if (!email) {

                            setStatus(
                                "يرجى إدخال البريد الإلكتروني.",
                                "error"
                            );

                            return;

                        }


                        if (!password) {

                            setStatus(
                                "يرجى إدخال كلمة المرور.",
                                "error"
                            );

                            return;

                        }


                        /* =================================
                           LOGIN
                        ================================= */

                        if (
                            modalMode ===
                            "login"
                        ) {

                            setLoading(true);


                            setStatus(
                                "جاري تسجيل الدخول...",
                                "info"
                            );


                            const result =
                                await AUTH.signIn(
                                    email,
                                    password
                                );


                            setLoading(false);


                            if (result.error) {

                                setStatus(
                                    getAuthErrorMessage(
                                        result.error
                                    ),
                                    "error"
                                );

                                return;

                            }


                            /*
                             * هنا نعتمد على وجود
                             * user/session الحقيقي.
                             */

                            const user =
                                result.data &&
                                result.data.user
                                    ? result.data.user
                                    : AUTH.getUser();


                            const session =
                                result.data &&
                                result.data.session
                                    ? result.data.session
                                    : AUTH.getSession();


                            if (
                                !user ||
                                !session
                            ) {

                                setStatus(
                                    "تمت العملية، لكن لم يتم إنشاء جلسة تسجيل الدخول. تحقق من البريد الإلكتروني.",
                                    "error"
                                );

                                return;

                            }


                            setStatus(
                                "تم تسجيل الدخول بنجاح.",
                                "success"
                            );


                            /*
                             * تحديث الواجهة فوراً
                             */

                            refreshUI(
                                user,
                                AUTH.getProfile()
                            );


                            /*
                             * إغلاق نافذة الدخول
                             */

                            setTimeout(
                                function () {

                                    closeModal();

                                },
                                350
                            );


                            return;

                        }


                        /* =================================
                           REGISTER
                        ================================= */

                        const username =
                            accountUsername
                                ? accountUsername.value.trim()
                                : "";


                        const confirmPassword =
                            accountPasswordConfirm
                                ? accountPasswordConfirm.value
                                : "";


                        if (!username) {

                            setStatus(
                                "يرجى إدخال اسم المستخدم.",
                                "error"
                            );

                            return;

                        }


                        if (
                            password !==
                            confirmPassword
                        ) {

                            setStatus(
                                "كلمتا المرور غير متطابقتين.",
                                "error"
                            );

                            return;

                        }


                        setLoading(true);


                        setStatus(
                            "جاري إنشاء الحساب...",
                            "info"
                        );


                        const result =
                            await AUTH.signUp(
                                email,
                                password,
                                username
                            );


                        setLoading(false);


                        if (result.error) {

                            setStatus(
                                getAuthErrorMessage(
                                    result.error
                                ),
                                "error"
                            );

                            return;

                        }


                        const user =
                            result.data &&
                            result.data.user
                                ? result.data.user
                                : null;


                        const session =
                            result.data &&
                            result.data.session
                                ? result.data.session
                                : null;


                        /*
                         * إذا كان تأكيد البريد مفعلاً
                         * user موجود لكن session غير موجود.
                         */

                        if (
                            user &&
                            !session
                        ) {

                            showVerifyMessage();

                            setStatus(
                                "",
                                ""
                            );


                            return;

                        }


                        /*
                         * إذا كانت الجلسة موجودة مباشرة
                         */

                        if (
                            user &&
                            session
                        ) {

                            await waitForProfile(
                                user.id
                            );


                            refreshUI(
                                user,
                                AUTH.getProfile()
                            );


                            setStatus(
                                "تم إنشاء الحساب وتسجيل الدخول بنجاح.",
                                "success"
                            );


                            setTimeout(
                                function () {

                                    closeModal();

                                },
                                350
                            );


                            return;

                        }


                        setStatus(
                            "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لإكمال التسجيل.",
                            "success"
                        );

                    }
                );

        }


        /* =================================================
           VERIFY MESSAGE
        ================================================= */

        function showVerifyMessage() {

            const verifyMessage =
                document.getElementById(
                    "verifyMessage"
                );


            if (verifyMessage) {

                verifyMessage.classList.add(
                    "show"
                );

            }


            /*
             * بعض نسخ HTML تستخدم verify-message
             */

            const alternate =
                document.getElementById(
                    "verify-message"
                );


            if (alternate) {

                alternate.classList.add(
                    "show"
                );

            }


            if (accountForm) {

                accountForm.style.display =
                    "none";

            }


            if (modalTitle) {

                modalTitle.textContent =
                    "تحقق من بريدك الإلكتروني";

            }


            setModalNote(
                "تم إنشاء حسابك بنجاح. تحقق من بريدك الإلكتروني أو الرسائل غير المرغوب فيها."
            );


            if (modalAction) {

                modalAction.style.display =
                    "none";

            }

        }


        /* =================================================
           انتظار Profile
        ================================================= */

        async function waitForProfile(
            userId
        ) {

            if (!userId) {
                return null;
            }


            try {

                return await AUTH.fetchProfile(
                    userId
                );

            } catch (error) {

                console.warn(
                    "WFESC Auth UI: تعذر جلب profile:",
                    error
                );


                return null;

            }

        }


        /* =================================================
           رسائل Supabase بالعربي
        ================================================= */

        function getAuthErrorMessage(
            error
        ) {

            if (!error) {

                return "حدث خطأ غير معروف.";

            }


            const message =
                String(
                    error.message || ""
                );


            const lower =
                message.toLowerCase();


            if (
                lower.includes(
                    "invalid login credentials"
                )
            ) {

                return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

            }


            if (
                lower.includes(
                    "email not confirmed"
                )
            ) {

                return "يجب تأكيد بريدك الإلكتروني أولاً.";

            }


            if (
                lower.includes(
                    "user already registered"
                )
            ) {

                return "هذا البريد الإلكتروني مسجل بالفعل.";

            }


            if (
                lower.includes(
                    "invalid api key"
                )
            ) {

                return "تعذر الاتصال بخدمة الحساب. تحقق من إعدادات Supabase.";

            }


            if (
                lower.includes(
                    "password should be at least"
                )
            ) {

                return "كلمة المرور قصيرة جدًا.";

            }


            if (
                lower.includes(
                    "rate limit"
                )
            ) {

                return "تم تجاوز عدد المحاولات المسموح بها. حاول لاحقًا.";

            }


            return message ||
                "حدث خطأ أثناء العملية.";

        }


        /* =================================================
           MANAGE ACCOUNT
        ================================================= */

        if (manageAccountButton) {

            manageAccountButton
                .addEventListener(
                    "click",
                    function () {

                        const user =
                            AUTH.getUser();


                        if (!user) {

                            setLoginMode();

                            return;

                        }


                        setStatus(
                            "أنت مسجل الدخول بالفعل.",
                            "success"
                        );

                    }
                );

        }


        /* =================================================
           LOGOUT
        ================================================= */

        if (logoutAccountButton) {

            logoutAccountButton
                .addEventListener(
                    "click",
                    async function () {

                        if (busy) {
                            return;
                        }


                        setLoading(true);


                        setStatus(
                            "جاري تسجيل الخروج...",
                            "info"
                        );


                        const result =
                            await AUTH.signOut();


                        setLoading(false);


                        if (result.error) {

                            setStatus(
                                result.error.message ||
                                "تعذر تسجيل الخروج.",
                                "error"
                            );

                            return;

                        }


                        showLoggedOutUI();


                        setStatus(
                            "تم تسجيل الخروج.",
                            "success"
                        );

                    }
                );

        }


        /* =================================================
           AUTH CHANGED
        ================================================= */

        window.addEventListener(
            "WFESCAuthChanged",
            async function (event) {

                const detail =
                    event.detail || {};


                const user =
                    detail.user || null;


                const session =
                    detail.session || null;


                /*
                 * SIGNED_OUT
                 */

                if (
                    detail.event ===
                    "SIGNED_OUT"
                ) {

                    showLoggedOutUI();


                    return;

                }


                /*
                 * مستخدم + جلسة
                 */

                if (
                    user &&
                    session
                ) {

                    let profile =
                        AUTH.getProfile();


                    /*
                     * إذا profile غير جاهز،
                     * نحاول جلبه بدون تعطيل الواجهة.
                     */

                    if (!profile) {

                        profile =
                            await waitForProfile(
                                user.id
                            );

                    }


                    refreshUI(
                        user,
                        profile
                    );


                    return;

                }


                /*
                 * لا توجد جلسة
                 */

                showLoggedOutUI();

            }
        );


        /* =================================================
           PROFILE UPDATED
        ================================================= */

        window.addEventListener(
            "WFESCProfileUpdated",
            function (event) {

                const user =
                    AUTH.getUser();


                if (!user) {
                    return;
                }


                refreshUI(
                    user,
                    event.detail || null
                );

            }
        );


        /* =================================================
           INITIAL STATE
        ================================================= */

        const initialUser =
            AUTH.getUser();


        const initialSession =
            AUTH.getSession();


        if (
            initialUser &&
            initialSession
        ) {

            refreshUI(
                initialUser,
                AUTH.getProfile()
            );

        } else {

            showLoggedOutUI();

        }


    }


    /* =====================================================
       تشغيل بعد جاهزية DOM
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    } else {

        start();

    }


})();
