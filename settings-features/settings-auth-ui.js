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

        if (!window.WFESCSettingsAuth) {

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
           LIMITS
           ================================================= */

        const usernameConfig =
            CONFIG.username || {};

        const usernameMin =
            Number(
                usernameConfig.minLength || 3
            );

        const usernameMax =
            Number(
                usernameConfig.maxLength || 9
            );

        /*
         * كلمة المرور:
         * الحد الأدنى 6
         * الحد الأقصى 16
         */

        const passwordMin =
            6;

        const passwordMax =
            16;


        /* =================================================
           APPLY HTML LIMITS
           ================================================= */

        if (accountUsername) {

            accountUsername.setAttribute(
                "minlength",
                String(usernameMin)
            );

            accountUsername.setAttribute(
                "maxlength",
                String(usernameMax)
            );

            accountUsername.setAttribute(
                "autocomplete",
                "username"
            );

        }


        if (accountPassword) {

            accountPassword.setAttribute(
                "minlength",
                String(passwordMin)
            );

            accountPassword.setAttribute(
                "maxlength",
                String(passwordMax)
            );

            accountPassword.setAttribute(
                "autocomplete",
                "new-password"
            );

        }


        if (accountPasswordConfirm) {

            accountPasswordConfirm.setAttribute(
                "minlength",
                String(passwordMin)
            );

            accountPasswordConfirm.setAttribute(
                "maxlength",
                String(passwordMax)
            );

            accountPasswordConfirm.setAttribute(
                "autocomplete",
                "new-password"
            );

        }


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
                accountPassword.value = "";
            }

            if (accountPasswordConfirm) {
                accountPasswordConfirm.value = "";
            }

            clearFieldErrors();

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


            if (createAccountButton) {

                createAccountButton.disabled =
                    busy;

            }


            if (loginButton) {

                loginButton.disabled =
                    busy;

            }

        }


        /* =================================================
           FIELD ERROR HELPERS
           ================================================= */

        function getFieldContainer(
            element
        ) {

            if (!element) {
                return null;
            }

            return element.parentElement || null;

        }


        function clearFieldError(
            element
        ) {

            const container =
                getFieldContainer(
                    element
                );

            if (container) {

                container
                    .querySelectorAll(
                        ".wfesc-field-error"
                    )
                    .forEach(
                        function (item) {

                            item.remove();

                        }
                    );

            }

            if (element) {

                element.removeAttribute(
                    "aria-invalid"
                );

            }

        }


        function clearFieldErrors() {

            clearFieldError(
                accountUsername
            );

            clearFieldError(
                accountEmail
            );

            clearFieldError(
                accountPassword
            );

            clearFieldError(
                accountPasswordConfirm
            );

        }


        function showFieldError(
            element,
            message
        ) {

            if (!element) {
                return;
            }

            clearFieldError(
                element
            );


            element.setAttribute(
                "aria-invalid",
                "true"
            );


            const container =
                getFieldContainer(
                    element
                );


            if (!container) {
                return;
            }


            const error =
                document.createElement(
                    "div"
                );


            error.className =
                "wfesc-field-error";

            error.textContent =
                message;


            error.style.cssText =
                "color:#ff5c5c;" +
                "font-size:13px;" +
                "margin-top:6px;" +
                "line-height:1.5;";


            container.appendChild(
                error
            );

        }


        /* =================================================
           USERNAME VALIDATION
           ================================================= */

        function validateUsernameInput(
            showError
        ) {

            if (!accountUsername) {
                return true;
            }


            let username =
                String(
                    accountUsername.value || ""
                ).trim();


            /*
             * أحرف إنجليزية فقط
             */
            username =
                username.replace(
                    /[^A-Za-z]/g,
                    ""
                );


            /*
             * الحد الأقصى 9
             *
             * مهم:
             * هنا 9 وليس 3
             */
            username =
                username.slice(
                    0,
                    usernameMax
                );


            accountUsername.value =
                username;


            clearFieldError(
                accountUsername
            );


            if (!username) {

                if (showError) {

                    showFieldError(
                        accountUsername,
                        "يجب وضع اسم المستخدم."
                    );

                }

                return false;

            }


            if (
                username.length <
                usernameMin
            ) {

                if (showError) {

                    showFieldError(
                        accountUsername,
                        "يجب أن يتكون اسم المستخدم من " +
                        usernameMin +
                        " أحرف أو أكثر."
                    );

                }

                return false;

            }


            if (
                username.length >
                usernameMax
            ) {

                if (showError) {

                    showFieldError(
                        accountUsername,
                        "اسم المستخدم يجب ألا يتجاوز " +
                        usernameMax +
                        " أحرف."
                    );

                }

                return false;

            }


            if (
                !/^[A-Za-z]+$/.test(
                    username
                )
            ) {

                if (showError) {

                    showFieldError(
                        accountUsername,
                        "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية فقط، بدون مسافات أو فواصل أو رموز."
                    );

                }

                return false;

            }


            return true;

        }


        /* =================================================
           PASSWORD VALIDATION
           ================================================= */

        function limitPasswordInput(
            input
        ) {

            if (!input) {
                return;
            }


            let value =
                String(
                    input.value || ""
                );


            if (
                value.length >
                passwordMax
            ) {

                value =
                    value.slice(
                        0,
                        passwordMax
                    );

            }


            input.value =
                value;

        }


        function validatePasswordInput(
            input,
            showError
        ) {

            if (!input) {
                return false;
            }


            limitPasswordInput(
                input
            );


            const password =
                String(
                    input.value || ""
                );


            clearFieldError(
                input
            );


            if (!password) {

                if (showError) {

                    showFieldError(
                        input,
                        "يرجى إدخال كلمة المرور."
                    );

                }

                return false;

            }


            if (
                password.length <
                passwordMin
            ) {

                if (showError) {

                    showFieldError(
                        input,
                        "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
                    );

                }

                return false;

            }


            if (
                password.length >
                passwordMax
            ) {

                if (showError) {

                    showFieldError(
                        input,
                        "كلمة المرور يجب ألا تتجاوز 16 حرفًا."
                    );

                }

                return false;

            }


            return true;

        }


        /* =================================================
           PASSWORD MATCH
           ================================================= */

        function validatePasswordMatch(
            showError
        ) {

            if (
                modalMode !== "register" ||
                !accountPassword ||
                !accountPasswordConfirm
            ) {

                return true;

            }


            limitPasswordInput(
                accountPassword
            );

            limitPasswordInput(
                accountPasswordConfirm
            );


            clearFieldError(
                accountPasswordConfirm
            );


            const password =
                String(
                    accountPassword.value || ""
                );


            const confirmPassword =
                String(
                    accountPasswordConfirm.value || ""
                );


            if (!confirmPassword) {

                if (showError) {

                    showFieldError(
                        accountPasswordConfirm,
                        "يرجى تأكيد كلمة المرور."
                    );

                }

                return false;

            }


            if (
                password !==
                confirmPassword
            ) {

                if (showError) {

                    showFieldError(
                        accountPasswordConfirm,
                        "كلمة المرور غير متطابقة."
                    );

                }

                return false;

            }


            return true;

        }


        /* =================================================
           PASSWORD VISIBILITY
           ================================================= */

        function createPasswordEye(
            input
        ) {

            if (!input) {
                return;
            }


            const parent =
                input.parentElement;


            if (!parent) {
                return;
            }


            /*
             * منع إنشاء الزر مرتين
             */
            if (
                parent.querySelector(
                    ".wfesc-password-eye"
                )
            ) {

                return;

            }


            parent.style.position =
                parent.style.position ||
                "relative";


            /*
             * مساحة للزر من جهة اليسار
             */
            input.style.paddingLeft =
                "48px";


            /*
             * الحد الأقصى دائمًا 16
             */
            input.setAttribute(
                "maxlength",
                String(passwordMax)
            );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "wfesc-password-eye";


            button.setAttribute(
                "aria-label",
                "إظهار كلمة المرور"
            );


            button.setAttribute(
                "title",
                "إظهار كلمة المرور"
            );


            /*
             * الشكل المطلوب
             */
            button.textContent =
                "🙉";


            /*
             * جهة اليسار
             * ووسط الحقل
             */
            button.style.cssText =
                "position:absolute;" +
                "left:8px;" +
                "top:50%;" +
                "transform:translateY(-50%);" +
                "width:36px;" +
                "height:36px;" +
                "display:flex;" +
                "align-items:center;" +
                "justify-content:center;" +
                "border:0;" +
                "background:transparent;" +
                "color:inherit;" +
                "cursor:pointer;" +
                "font-size:19px;" +
                "padding:0;" +
                "margin:0;" +
                "line-height:1;" +
                "z-index:5;";


            button.addEventListener(
                "click",
                function () {

                    const isPassword =
                        input.type ===
                        "password";


                    input.type =
                        isPassword
                            ? "text"
                            : "password";


                    /*
                     * تبقى 🙉
                     */
                    button.textContent =
                        "🙉";


                    button.setAttribute(
                        "aria-label",
                        isPassword
                            ? "إخفاء كلمة المرور"
                            : "إظهار كلمة المرور"
                    );


                    button.setAttribute(
                        "title",
                        isPassword
                            ? "إخفاء كلمة المرور"
                            : "إظهار كلمة المرور"
                    );


                    input.focus();

                }
            );


            parent.appendChild(
                button
            );

        }


        function setupPasswordEyes() {

            createPasswordEye(
                accountPassword
            );


            createPasswordEye(
                accountPasswordConfirm
            );

        }


        /* =================================================
           PASSWORD INPUT EVENTS
           ================================================= */

        function setupPasswordInputs() {

            const fields = [

                accountPassword,

                accountPasswordConfirm

            ];


            fields.forEach(
                function (input) {

                    if (!input) {
                        return;
                    }


                    input.setAttribute(
                        "maxlength",
                        String(passwordMax)
                    );


                    input.setAttribute(
                        "minlength",
                        String(passwordMin)
                    );


                    input.addEventListener(
                        "input",
                        function () {

                            limitPasswordInput(
                                input
                            );


                            clearFieldError(
                                input
                            );


                            if (
                                modalMode ===
                                "register"
                            ) {

                                if (
                                    input ===
                                    accountPassword ||
                                    input ===
                                    accountPasswordConfirm
                                ) {

                                    if (
                                        accountPasswordConfirm &&
                                        accountPasswordConfirm.value
                                    ) {

                                        validatePasswordMatch(
                                            true
                                        );

                                    }

                                }

                            }

                        }
                    );


                    input.addEventListener(
                        "blur",
                        function () {

                            if (
                                modalMode ===
                                "register"
                            ) {

                                validatePasswordInput(
                                    input,
                                    true
                                );


                                if (
                                    input ===
                                    accountPasswordConfirm
                                ) {

                                    validatePasswordMatch(
                                        true
                                    );

                                }

                            }

                        }
                    );

                }
            );

        }


        /* =================================================
           LOGIN MODE
           ================================================= */

        function setLoginMode() {

            modalMode =
                "login";


            if (modalTitle) {

                modalTitle.textContent =
                    "تسجيل الدخول";

            }


            if (accountUsername) {

                const parent =
                    accountUsername.parentElement;


                if (parent) {

                    parent.style.display =
                        "none";

                }

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "none";

            }


            if (accountForm) {

                accountForm.style.display =
                    "";

            }


            if (modalAction) {

                modalAction.style.display =
                    "";

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
           REGISTER MODE
           ================================================= */

        function setRegisterMode() {

            modalMode =
                "register";


            if (modalTitle) {

                modalTitle.textContent =
                    "إنشاء حساب";

            }


            if (accountUsername) {

                const parent =
                    accountUsername.parentElement;


                if (parent) {

                    parent.style.display =
                        "";

                }

            }


            if (passwordGroup) {

                passwordGroup.style.display =
                    "";

            }


            if (confirmPasswordGroup) {

                confirmPasswordGroup.style.display =
                    "";

            }


            if (accountForm) {

                accountForm.style.display =
                    "";

            }


            if (modalAction) {

                modalAction.style.display =
                    "";

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
           VERIFY EMAIL MESSAGE
           ================================================= */

        function showVerifyMessage() {

            if (accountForm) {

                accountForm.style.display =
                    "none";

            }


            if (modalTitle) {

                modalTitle.textContent =
                    "تحقق من بريدك الإلكتروني";

            }


            if (modalAction) {

                modalAction.style.display =
                    "none";

            }


            setModalNote(
                "تم إنشاء حسابك بنجاح. تحقق من بريدك الإلكتروني أو الرسائل غير المرغوب فيها."
            );


            setStatus(
                "تم إنشاء الحساب. تحقق من بريدك الإلكتروني.",
                "success"
            );


            const verifyMessage =
                document.getElementById(
                    "verifyMessage"
                ) ||
                document.getElementById(
                    "verify-message"
                );


            if (verifyMessage) {

                verifyMessage.style.display =
                    "";

                verifyMessage.textContent =
                    "تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط على رابط التحقق لإكمال التسجيل.";

            }


            openModal();

        }


        /* =================================================
           LOGGED IN UI
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


            setStatus(
                "تم تسجيل الدخول بنجاح.",
                "success"
            );

        }


        /* =================================================
           LOGGED OUT UI
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
           REFRESH UI
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

            createAccountButton.addEventListener(
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

            loginButton.addEventListener(
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
           CLOSE MODAL
           ================================================= */

        if (closeModalButton) {

            closeModalButton.addEventListener(
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

            accountModal.addEventListener(
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
           MANAGE ACCOUNT
           ================================================= */

        if (manageAccountButton) {

            manageAccountButton.addEventListener(
                "click",
                function () {

                    if (
                        typeof AUTH.getUser ===
                        "function" &&
                        AUTH.getUser()
                    ) {

                        window.location.href =
                            "profile.html";

                    }

                }
            );

        }


        /* =================================================
           FORGOT PASSWORD
           ================================================= */

        if (forgotPasswordButton) {

            forgotPasswordButton.addEventListener(
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

                        if (accountEmail) {
                            accountEmail.focus();
                        }

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
                            getAuthErrorMessage(
                                result.error
                            ),
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

            accountForm.addEventListener(
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


               
                    /* =====================================
                       LOGIN
                       ===================================== */

                    if (
                        modalMode ===
                        "login"
                    ) {

                        if (!email) {

                            setStatus(
                                "يرجى إدخال البريد الإلكتروني.",
                                "error"
                            );

                            if (accountEmail) {
                                accountEmail.focus();
                            }

                            return;

                        }


                        if (!password) {

                            setStatus(
                                "يرجى إدخال كلمة المرور.",
                                "error"
                            );

                            if (accountPassword) {
                                accountPassword.focus();
                            }

                            return;

                        }


                        if (
                            password.length <
                            passwordMin
                        ) {

                            setStatus(
                                "كلمة المرور يجب أن تكون 6 أحرف أو أكثر.",
                                "error"
                            );

                            if (accountPassword) {
                                accountPassword.focus();
                            }

                            return;

                        }


                        if (
                            password.length >
                            passwordMax
                        ) {

                            setStatus(
                                "كلمة المرور يجب ألا تتجاوز 16 حرفًا.",
                                "error"
                            );

                            if (accountPassword) {
                                accountPassword.focus();
                            }

                            return;

                        }


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


                        if (!user || !session) {

                            setStatus(
                                "تعذر إكمال تسجيل الدخول. حاول مرة أخرى.",
                                "error"
                            );

                            return;

                        }


                        refreshUI(
                            user,
                            AUTH.getProfile()
                        );


                        closeModal();

                        return;

                    }


                    /* =====================================
                       REGISTER
                       ===================================== */

                    /* -------------------------------------
                       Username
                       ------------------------------------- */

                    if (
                        !validateUsernameInput(
                            true
                        )
                    ) {

                        setStatus(
                            "يرجى تصحيح اسم المستخدم.",
                            "error"
                        );

                        if (accountUsername) {
                            accountUsername.focus();
                        }

                        return;

                    }


                    /* -------------------------------------
                       Email
                       ------------------------------------- */

                    if (!email) {

                        setStatus(
                            "يرجى إدخال البريد الإلكتروني.",
                            "error"
                        );

                        if (accountEmail) {
                            accountEmail.focus();
                        }

                        return;

                    }


                    /* -------------------------------------
                       Password
                       ------------------------------------- */

                    if (
                        !validatePasswordInput(
                            accountPassword,
                            true
                        )
                    ) {

                        setStatus(
                            "يرجى تصحيح كلمة المرور.",
                            "error"
                        );

                        if (accountPassword) {
                            accountPassword.focus();
                        }

                        return;

                    }


                    /* -------------------------------------
                       Password Confirmation
                       ------------------------------------- */

                    if (
                        !validatePasswordMatch(
                            true
                        )
                    ) {

                        setStatus(
                            "كلمة المرور غير متطابقة.",
                            "error"
                        );

                        if (accountPasswordConfirm) {
                            accountPasswordConfirm.focus();
                        }

                        return;

                    }


                    /* -------------------------------------
                       إنشاء الحساب
                       ------------------------------------- */

                    setLoading(true);


                    setStatus(
                        "جاري إنشاء الحساب...",
                        "info"
                    );


                    const username =
                        accountUsername
                            ? accountUsername.value.trim()
                            : "";


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


                    /* -------------------------------------
                       تأكيد البريد مطلوب
                       ------------------------------------- */

                    if (
                        user &&
                        !session
                    ) {

                        showVerifyMessage();

                        return;

                    }


                    /* -------------------------------------
                       Session موجودة
                       ------------------------------------- */

                    if (
                        user &&
                        session
                    ) {

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
           USERNAME INPUT
           ================================================= */

        if (accountUsername) {

            accountUsername.addEventListener(
                "input",
                function () {

                    let cleaned =
                        String(
                            accountUsername.value || ""
                        );


                    /*
                     * أحرف إنجليزية فقط
                     */
                    cleaned =
                        cleaned.replace(
                            /[^A-Za-z]/g,
                            ""
                        );


                    /*
                     * الحد الأقصى 9
                     *
                     * وليس 3
                     */
                    cleaned =
                        cleaned.slice(
                            0,
                            usernameMax
                        );


                    accountUsername.value =
                        cleaned;


                    if (
                        cleaned.length >=
                        usernameMin &&
                        cleaned.length <=
                        usernameMax
                    ) {

                        clearFieldError(
                            accountUsername
                        );

                    }

                }
            );


            accountUsername.addEventListener(
                "blur",
                function () {

                    validateUsernameInput(
                        true
                    );

                }
            );

        }


        /* =================================================
           PASSWORD EYES
           ================================================= */

        setupPasswordEyes();


        /* =================================================
           PASSWORD INPUTS
           ================================================= */

        setupPasswordInputs();


        /* =================================================
           LOGOUT
           ================================================= */

        if (logoutAccountButton) {

            logoutAccountButton.addEventListener(
                "click",
                async function () {

                    if (busy) {
                        return;
                    }


                    setLoading(true);


                    const result =
                        await AUTH.signOut();


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


                    showLoggedOutUI();


                    setStatus(
                        "تم تسجيل الخروج.",
                        "success"
                    );

                }
            );

        }


        /* =================================================
           AUTH STATE CHANGED
           ================================================= */

        window.addEventListener(
            "WFESCAuthChanged",
            function (event) {

                const detail =
                    event &&
                    event.detail
                        ? event.detail
                        : {};


                refreshUI(
                    detail.user ||
                    null,
                    AUTH.getProfile()
                );

            }
        );


        /* =================================================
           PROFILE UPDATED
           ================================================= */

        window.addEventListener(
            "WFESCProfileUpdated",
            function (event) {

                const profile =
                    event &&
                    event.detail
                        ? event.detail
                        : AUTH.getProfile();


                const user =
                    AUTH.getUser();


                if (user) {

                    showLoggedInUI(
                        user,
                        profile
                    );

                }

            }
        );


        /* =================================================
           EMAIL VERIFIED
           ================================================= */

        window.addEventListener(
            "WFESCEmailVerified",
            function () {

                setStatus(
                    "تم التحقق بنجاح واكتمال التسجيل.",
                    "success"
                );

                setModalNote(
                    "تم التحقق من بريدك الإلكتروني بنجاح واكتمل تسجيل حساب WFESC."
                );

            }
        );


        /* =================================================
           AUTH ERROR TRANSLATION
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
                ).toLowerCase();


            if (
                message.includes(
                    "invalid login credentials"
                )
            ) {

                return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

            }


            if (
                message.includes(
                    "email not confirmed"
                )
            ) {

                return "يجب تأكيد بريدك الإلكتروني أولاً.";

            }


            if (
                message.includes(
                    "user already registered"
                )
            ) {

                return "هذا البريد الإلكتروني مسجل مسبقًا.";

            }


            if (
                message.includes(
                    "password should be at least"
                )
            ) {

                return "كلمة المرور يجب أن تكون 6 أحرف أو أكثر.";

            }


            if (
                message.includes(
                    "password"
                ) &&
                message.includes(
                    "16"
                )
            ) {

                return "كلمة المرور يجب ألا تتجاوز 16 حرفًا.";

            }


            if (
                message.includes(
                    "invalid email"
                )
            ) {

                return "يرجى إدخال بريد إلكتروني صحيح.";

            }


            if (
                message.includes(
                    "rate limit"
                )
            ) {

                return "تم تجاوز عدد المحاولات. حاول لاحقًا.";

            }


            return (
                error.message ||
                "حدث خطأ أثناء تنفيذ العملية."
            );

        }


        /* =================================================
           RESTORE SESSION
           ================================================= */

        async function restore() {

            try {

                const result =
                    await AUTH.restoreSession();


                if (
                    result &&
                    result.error
                ) {

                    console.warn(
                        "WFESC Auth UI: تعذر استعادة الجلسة:",
                        result.error
                    );

                    showLoggedOutUI();

                    return;

                }


                const user =
                    AUTH.getUser();


                const profile =
                    AUTH.getProfile();


                refreshUI(
                    user,
                    profile
                );

            } catch (error) {

                console.error(
                    "WFESC Auth UI: خطأ أثناء استعادة الجلسة:",
                    error
                );


                showLoggedOutUI();

            }

        }


        /* =================================================
           START
           ================================================= */

        restore();

    }


    /* =====================================================
       DOM READY
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
