/* =========================================================
   WFESC SETTINGS AUTH UI
   settings-auth-ui.js
   ========================================================= */

(function () {

    "use strict";

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    window.WFESCSettingsAuthUI = true;

    /* =====================================================
       WAIT FOR AUTH SYSTEM
       ===================================================== */

    function waitForAuth() {

        if (
            window.WFESCSettingsAuth &&
            window.WFESCSettingsAuthConfig
        ) {
            initialize();
            return;
        }

        setTimeout(waitForAuth, 50);
    }

    waitForAuth();


    /* =====================================================
       MAIN
       ===================================================== */

    function initialize() {

        const AUTH =
            window.WFESCSettingsAuth;

        const CONFIG =
            window.WFESCSettingsAuthConfig;


        /* =================================================
           STATE
           ================================================= */

        let modal = null;
        let modalForm = null;

        let usernameInput = null;
        let emailInput = null;
        let passwordInput = null;
        let confirmPasswordInput = null;

        let usernameGroup = null;
        let passwordGroup = null;
        let confirmPasswordGroup = null;

        let modalTitle = null;
        let modalAction = null;
        let modalNote = null;

        let closeModalButton = null;

        let currentMode = null;

        let actionLoading = false;
        let authReady = false;
        let pendingAuthRender = false;

        const usernameMin =
            Number(
                CONFIG?.username?.minLength || 3
            );

        const usernameMax =
            Number(
                CONFIG?.username?.maxLength || 9
            );

        const passwordMin = 6;
        const passwordMax = 16;


        /* =================================================
           ELEMENT
           ================================================= */

        const accountApp =
            document.getElementById(
                "settingsAccountApp"
            );

        if (!accountApp) {
            return;
        }


        /* =================================================
           STYLES
           ================================================= */

        injectStyles();


        /* =================================================
           HELPERS
           ================================================= */

        function sleep(ms) {
            return new Promise(
                resolve => setTimeout(resolve, ms)
            );
        }


        function escapeHtml(value) {

            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }


        function escapeAttribute(value) {
            return escapeHtml(value);
        }


        function isValidEmail(email) {

            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(
                    String(email || "").trim()
                );
        }


        function getAuthErrorMessage(error) {

            if (!error) {
                return "حدث خطأ غير متوقع.";
            }

            const message =
                String(
                    error.message ||
                    error.error_description ||
                    error ||
                    ""
                ).toLowerCase();


            if (
                message.includes(
                    "كلمة المرور غير صحيحة"
                )
            ) {
                return "كلمة المرور غير صحيحة.";
            }


            if (
                message.includes(
                    "invalid login credentials"
                ) ||
                message.includes(
                    "invalid_credentials"
                )
            ) {
                return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            }


            if (
                message.includes(
                    "email not confirmed"
                )
            ) {
                return "يرجى تأكيد بريدك الإلكتروني أولًا.";
            }


            if (
                message.includes(
                    "user already registered"
                ) ||
                message.includes(
                    "already registered"
                )
            ) {
                return "هذا البريد الإلكتروني مسجل مسبقًا.";
            }


            if (
                message.includes(
                    "password"
                ) &&
                message.includes(
                    "at least"
                )
            ) {
                return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
            }


            if (
                message.includes(
                    "password should be at most"
                )
            ) {
                return "كلمة المرور يجب ألا تتجاوز 16 حرفًا.";
            }


            if (
                message.includes(
                    "invalid api key"
                )
            ) {
                return "حدث خطأ في الاتصال بخدمة الحساب.";
            }


            if (
                message.includes(
                    "rate limit"
                )
            ) {
                return "تم تجاوز عدد المحاولات، يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.";
            }


            if (
                message.includes(
                    "network"
                ) ||
                message.includes(
                    "fetch"
                )
            ) {
                return "تعذر الاتصال بالإنترنت.";
            }


            return (
                error.message ||
                "حدث خطأ، يرجى المحاولة مرة أخرى."
            );
        }


        /* =================================================
           STATUS
           ================================================= */

        function showStatus(
            message,
            type = "success",
            duration = 5000
        ) {

            const status =
                document.getElementById(
                    "settingsStatus"
                );

            if (!status) {
                return;
            }

            status.textContent =
                message;

            status.className =
                "settings-status show wfesc-status-" +
                type;

            clearTimeout(
                status._wfescTimer
            );

            status._wfescTimer =
                setTimeout(() => {

                    status.classList.remove(
                        "show"
                    );

                }, duration);
        }


        function clearStatus() {

            const status =
                document.getElementById(
                    "settingsStatus"
                );

            if (!status) {
                return;
            }

            status.classList.remove(
                "show"
            );
        }


        /* =================================================
           ACCOUNT LOADING
           ================================================= */

        function showAccountLoading(
            text = "جاري التحقق من الحساب..."
        ) {

            accountApp.innerHTML = `
                <div class="wfesc-account-loading">
                    <div class="wfesc-loading-spinner"></div>
                    <div class="wfesc-loading-text">
                        ${escapeHtml(text)}
                    </div>
                </div>
            `;
        }


        /* =================================================
           ACCOUNT INTERFACE
           ================================================= */

        function accountButtonsHtml() {

            return `
                <div class="account-buttons wfesc-auth-view">

                    <button
                        type="button"
                        class="account-btn primary wfesc-enter-item"
                        id="wfescCreateAccount"
                    >
                        إنشاء حساب
                    </button>

                    <button
                        type="button"
                        class="account-btn wfesc-enter-item"
                        id="wfescLoginAccount"
                    >
                        لدي حساب
                    </button>

                    <button
                        type="button"
                        class="account-btn secondary wfesc-enter-item"
                        id="wfescForgotAccount"
                    >
                        نسيت كلمة المرور؟
                    </button>

                </div>
            `;
        }


        function createAccountInterface(
            animate = true
        ) {

            accountApp.innerHTML =
                accountButtonsHtml();

            const createButton =
                document.getElementById(
                    "wfescCreateAccount"
                );

            const loginButton =
                document.getElementById(
                    "wfescLoginAccount"
                );

            const forgotButton =
                document.getElementById(
                    "wfescForgotAccount"
                );


            if (createButton) {

                createButton.addEventListener(
                    "click",
                    () => openModal("register")
                );

            }


            if (loginButton) {

                loginButton.addEventListener(
                    "click",
                    () => openModal("login")
                );

            }


            if (forgotButton) {

                forgotButton.addEventListener(
                    "click",
                    () => openModal("forgot")
                );

            }


            if (animate) {

                requestAnimationFrame(() => {

                    accountApp
                        .querySelector(
                            ".wfesc-auth-view"
                        )
                        ?.classList.add(
                            "wfesc-view-visible"
                        );

                });

            } else {

                accountApp
                    .querySelector(
                        ".wfesc-auth-view"
                    )
                    ?.classList.add(
                        "wfesc-view-visible"
                    );

            }
        }


        /* =================================================
           MODAL
           ================================================= */

        function createModal() {

            if (
                document.getElementById(
                    "wfescAuthModal"
                )
            ) {
                return;
            }


            const modalElement =
                document.createElement("div");

            modalElement.id =
                "wfescAuthModal";

            modalElement.className =
                "modal wfesc-auth-modal";


            modalElement.innerHTML = `
                <div class="modal-box wfesc-auth-modal-box">

                    <button
                        type="button"
                        class="modal-close"
                        id="wfescCloseAuthModal"
                        aria-label="إغلاق"
                    >
                        ×
                    </button>

                    <h2 id="wfescAuthModalTitle">
                        تسجيل الدخول
                    </h2>

                    <form
                        id="wfescAuthForm"
                        novalidate
                    >

                        <div
                            class="input-group wfesc-input-group"
                            id="wfescUsernameGroup"
                        >

                            <label for="wfescUsernameInput">
                                اسم المستخدم
                            </label>

                            <input
                                id="wfescUsernameInput"
                                type="text"
                                autocomplete="username"
                                maxlength="9"
                            >

                            <small class="wfesc-input-message"></small>

                        </div>


                        <div
                            class="input-group wfesc-input-group"
                            id="wfescEmailGroup"
                        >

                            <label for="wfescEmailInput">
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfescEmailInput"
                                type="email"
                                autocomplete="email"
                            >

                            <small class="wfesc-input-message"></small>

                        </div>


                        <div
                            class="input-group wfesc-input-group"
                            id="wfescPasswordGroup"
                        >

                            <label for="wfescPasswordInput">
                                كلمة المرور
                            </label>

                            <div class="wfesc-password-wrap">

                                <input
                                    id="wfescPasswordInput"
                                    type="password"
                                    autocomplete="new-password"
                                    maxlength="16"
                                >

                            </div>

                            <small class="wfesc-input-message"></small>

                        </div>


                        <div
                            class="input-group wfesc-input-group"
                            id="wfescConfirmPasswordGroup"
                        >

                            <label for="wfescConfirmPasswordInput">
                                تأكيد كلمة المرور
                            </label>

                            <div class="wfesc-password-wrap">

                                <input
                                    id="wfescConfirmPasswordInput"
                                    type="password"
                                    autocomplete="new-password"
                                    maxlength="16"
                                >

                            </div>

                            <small class="wfesc-input-message"></small>

                        </div>


                        <button
                            type="submit"
                            class="account-btn primary wfesc-modal-action"
                            id="wfescModalAction"
                        >
                            تسجيل الدخول
                        </button>

                    </form>


                    <div
                        class="wfesc-modal-note"
                        id="wfescModalNote"
                    ></div>

                </div>
            `;


            document.body.appendChild(
                modalElement
            );


            connectModalElements();
            setupModalEvents();
            setupUsernameInput();
            setupPasswordInputs();
            setupPasswordEyes();
        }


        function connectModalElements() {

            modal =
                document.getElementById(
                    "wfescAuthModal"
                );

            modalForm =
                document.getElementById(
                    "wfescAuthForm"
                );

            usernameInput =
                document.getElementById(
                    "wfescUsernameInput"
                );

            emailInput =
                document.getElementById(
                    "wfescEmailInput"
                );

            passwordInput =
                document.getElementById(
                    "wfescPasswordInput"
                );

            confirmPasswordInput =
                document.getElementById(
                    "wfescConfirmPasswordInput"
                );

            usernameGroup =
                document.getElementById(
                    "wfescUsernameGroup"
                );

            passwordGroup =
                document.getElementById(
                    "wfescPasswordGroup"
                );

            confirmPasswordGroup =
                document.getElementById(
                    "wfescConfirmPasswordGroup"
                );

            modalTitle =
                document.getElementById(
                    "wfescAuthModalTitle"
                );

            modalAction =
                document.getElementById(
                    "wfescModalAction"
                );

            modalNote =
                document.getElementById(
                    "wfescModalNote"
                );

            closeModalButton =
                document.getElementById(
                    "wfescCloseAuthModal"
                );
        }


        function setupModalEvents() {

            if (closeModalButton) {

                closeModalButton.addEventListener(
                    "click",
                    () => closeModal(true)
                );

            }


            if (modal) {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target === modal
                        ) {
                            closeModal(true);
                        }

                    }
                );

            }


            document.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Escape" &&
                        modal?.classList.contains("show")
                    ) {
                        closeModal(true);
                    }

                }
            );


            if (modalForm) {

                modalForm.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        handleSubmit();

                    }
                );

            }
        }


        /* =================================================
           OPEN / CLOSE
           ================================================= */

   
        function openModal(mode) {

            if (!modal) {
                createModal();
            }

            clearForm();
            clearStatus();

            setMode(mode);

            modal.classList.remove(
                "wfesc-modal-closing"
            );

            modal.classList.add(
                "show"
            );

            requestAnimationFrame(() => {

                modal.classList.add(
                    "wfesc-modal-ready"
                );

            });
        }


        async function closeModal(
            animate = true
        ) {

            if (!modal) {
                return;
            }

            if (
                !modal.classList.contains("show")
            ) {
                return;
            }


            if (animate) {

                modal.classList.add(
                    "wfesc-modal-closing"
                );

                await sleep(220);

            }


            modal.classList.remove(
                "show",
                "wfesc-modal-ready",
                "wfesc-modal-closing"
            );

            actionLoading = false;
        }


        /* =================================================
           CLEAR FORM
           ================================================= */

        function clearForm() {

            actionLoading = false;

            if (usernameInput) {
                usernameInput.value = "";
            }

            if (emailInput) {
                emailInput.value = "";
            }

            if (passwordInput) {
                passwordInput.value = "";
            }

            if (confirmPasswordInput) {
                confirmPasswordInput.value = "";
            }

            clearInputMessages();
            updatePasswordEyes();
        }


        function clearInputMessages() {

            document
                .querySelectorAll(
                    ".wfesc-input-message"
                )
                .forEach(element => {

                    element.textContent = "";
                    element.classList.remove(
                        "show"
                    );

                });


            document
                .querySelectorAll(
                    ".wfesc-input-group"
                )
                .forEach(element => {

                    element.classList.remove(
                        "wfesc-input-error"
                    );

                });
        }


        /* =================================================
           MODES
           ================================================= */

        function setMode(mode) {

            currentMode =
                mode;


            if (!modalTitle) {
                return;
            }


            usernameGroup.style.display =
                "none";

            passwordGroup.style.display =
                "none";

            confirmPasswordGroup.style.display =
                "none";

            emailInput.autocomplete =
                "email";


            if (mode === "register") {

                modalTitle.textContent =
                    "إنشاء حساب";

                usernameGroup.style.display =
                    "";

                passwordGroup.style.display =
                    "";

                confirmPasswordGroup.style.display =
                    "";

                modalAction.textContent =
                    "إنشاء الحساب";

                modalNote.textContent =
                    "بعد إنشاء الحساب سيصلك رابط لتأكيد بريدك الإلكتروني.";

                passwordInput.autocomplete =
                    "new-password";

                confirmPasswordInput.autocomplete =
                    "new-password";

            }


            else if (mode === "login") {

                modalTitle.textContent =
                    "تسجيل الدخول";

                passwordGroup.style.display =
                    "";

                modalAction.textContent =
                    "تسجيل الدخول";

                modalNote.textContent =
                    "";

                passwordInput.autocomplete =
                    "current-password";

            }


            else if (mode === "forgot") {

                modalTitle.textContent =
                    "إعادة تعيين كلمة المرور";

                modalAction.textContent =
                    "إرسال رابط الاستعادة";

                modalNote.textContent =
                    "سنرسل رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.";

            }


            updatePasswordEyes();
        }


        /* =================================================
           USERNAME
           ================================================= */
       
        function setupUsernameInput() {

            if (!usernameInput) {
                return;
            }


            usernameInput.maxLength =
                usernameMax;


            usernameInput.addEventListener(
                "input",
                () => {

                    usernameInput.value =
                        usernameInput.value
                            .replace(
                                /[^A-Za-z]/g,
                                ""
                            )
                            .slice(
                                0,
                                usernameMax
                            );

                    clearFieldError(
                        usernameGroup
                    );

                }
            );


            usernameInput.addEventListener(
                "blur",
                () => {

                    if (
                        currentMode !==
                        "register"
                    ) {
                        return;
                    }

                    const value =
                        usernameInput.value.trim();

                    if (
                        value.length > 0 &&
                        value.length < usernameMin
                    ) {

                        setFieldError(
                            usernameGroup,
                            "يجب أن يتكون اسم المستخدم من 3 أحرف أو أكثر."
                        );

                    }

                }
            );
        }


        function validateUsername() {

            if (
                currentMode !==
                "register"
            ) {
                return true;
            }


            const value =
                usernameInput.value.trim();


            if (
                value.length <
                usernameMin
            ) {

                setFieldError(
                    usernameGroup,
                    "يجب أن يتكون اسم المستخدم من 3 أحرف أو أكثر."
                );

                return false;
            }


            if (
                value.length >
                usernameMax
            ) {

                setFieldError(
                    usernameGroup,
                    "اسم المستخدم يجب ألا يتجاوز 9 أحرف."
                );

                return false;
            }


            if (
                !/^[A-Za-z]+$/.test(value)
            ) {

                setFieldError(
                    usernameGroup,
                    "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية فقط."
                );

                return false;
            }


            return true;
        }


        /* =================================================
           PASSWORD
           ================================================= */

        function limitPasswordInput(
            input
        ) {

            if (!input) {
                return;
            }

            input.maxLength =
                passwordMax;

            input.value =
                input.value.slice(
                    0,
                    passwordMax
                );
        }


        function setupPasswordInputs() {

            [
                passwordInput,
                confirmPasswordInput
            ]
                .forEach(input => {

                    if (!input) {
                        return;
                    }


                    input.maxLength =
                        passwordMax;


                    input.addEventListener(
                        "input",
                        () => {

                            limitPasswordInput(
                                input
                            );

                            if (
                                input ===
                                passwordInput
                            ) {

                                clearFieldError(
                                    passwordGroup
                                );

                            } else {

                                clearFieldError(
                                    confirmPasswordGroup
                                );

                            }

                            if (
                                confirmPasswordInput
                            ) {

                                if (
                                    confirmPasswordInput
                                        .value.length > 0
                                ) {

                                    validatePasswordMatch(
                                        false
                                    );

                                }

                            }

                            updatePasswordEyes();

                        }
                    );

                });
        }


        function validatePassword() {

            if (
                currentMode ===
                "forgot"
            ) {
                return true;
            }


            if (
                currentMode ===
                "login"
            ) {
                if (
                    passwordInput.value.length <
                    passwordMin
                ) {

                    setFieldError(
                        passwordGroup,
                        "كلمة المرور غير صحيحة."
                    );

                    return false;
                }

                return true;
            }


            const password =
                passwordInput.value;


            if (
                password.length <
                passwordMin
            ) {

                setFieldError(
                    passwordGroup,
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
                );

                return false;
            }


            if (
                password.length >
                passwordMax
            ) {

                setFieldError(
                    passwordGroup,
                    "كلمة المرور يجب ألا تتجاوز 16 حرفًا."
                );

                return false;
            }


            return true;
        }


        function validatePasswordMatch(
            showMessage = true
        ) {

            if (
                currentMode !==
                "register"
            ) {
                return true;
            }


            const password =
                passwordInput.value;

            const confirm =
                confirmPasswordInput.value;


            if (
                password !==
                confirm
            ) {

                if (showMessage) {

                    setFieldError(
                        confirmPasswordGroup,
                        "كلمة المرور غير متطابقة."
                    );

                }

                return false;
            }


            return true;
        }


        /* =================================================
           PASSWORD EYES
           ================================================= */

        function createPasswordEye(
            input
        ) {

            if (!input) {
                return;
            }


            const wrapper =
                input.parentElement;


            if (!wrapper) {
                return;
            }


            if (
                wrapper.querySelector(
                    ".wfesc-password-eye"
                )
            ) {
                return;
            }


            wrapper.classList.add(
                "wfesc-password-container"
            );


            const eye =
                document.createElement(
                    "button"
                );

            eye.type =
                "button";

            eye.className =
                "wfesc-password-eye";

            eye.textContent =
                "🙉";

            eye.setAttribute(
                "aria-label",
                "إظهار كلمة المرور"
            );


            eye.addEventListener(
                "click",
                () => {

                    const hidden =
                        input.type ===
                        "password";


                    input.type =
                        hidden
                            ? "text"
                            : "password";


                    eye.textContent =
                        hidden
                            ? "🙈"
                            : "🙉";


                    eye.setAttribute(
                        "aria-label",
                        hidden
                            ? "إخفاء كلمة المرور"
                            : "إظهار كلمة المرور"
                    );

                }
            );


            wrapper.appendChild(
                eye
            );
        }


        function setupPasswordEyes() {

            createPasswordEye(
                passwordInput
            );

            createPasswordEye(
                confirmPasswordInput
            );

            updatePasswordEyes();
        }


        function updatePasswordEyes() {

            [
                passwordInput,
                confirmPasswordInput
            ]
                .forEach(input => {

                    if (!input) {
                        return;
                    }

                    const wrapper =
                        input.parentElement;

                    const eye =
                        wrapper?.querySelector(
                            ".wfesc-password-eye"
                        );

                    if (!eye) {
                        return;
                    }

                    eye.style.display =
                        input.value.length > 0
                            ? "flex"
                            : "none";

                });
        }


        /* =================================================
           FIELD ERRORS
           ================================================= */

        function setFieldError(
            group,
            message
        ) {

            if (!group) {
                return;
            }


            group.classList.add(
                "wfesc-input-error"
            );


            const messageElement =
                group.querySelector(
                    ".wfesc-input-message"
                );


            if (messageElement) {

                messageElement.textContent =
                    message;

                messageElement.classList.add(
                    "show"
                );

            }


            group.classList.remove(
                "wfesc-error-shake"
            );


            void group.offsetWidth;


            group.classList.add(
                "wfesc-error-shake"
            );


            setTimeout(() => {

                group.classList.remove(
                    "wfesc-error-shake"
                );

            }, 420);
        }


        function clearFieldError(
            group
        ) {

            if (!group) {
                return;
            }

            group.classList.remove(
                "wfesc-input-error"
            );

            const messageElement =
                group.querySelector(
                    ".wfesc-input-message"
                );

            if (messageElement) {

                messageElement.textContent =
                    "";

                messageElement.classList.remove(
                    "show"
                );

            }
        }


        /* =================================================
           LOADING BUTTON
           ================================================= */

        function setActionLoading(
            loading,
            text = "جاري..."
        ) {

            actionLoading =
                loading;


            if (!modalAction) {
                return;
            }


            if (loading) {

                modalAction.disabled =
                    true;

                modalAction.classList.add(
                    "wfesc-button-loading"
                );

                modalAction.innerHTML = `
                    <span class="wfesc-button-spinner"></span>
                    <span>${escapeHtml(text)}</span>
                `;

            } else {

                modalAction.disabled =
                    false;

                modalAction.classList.remove(
                    "wfesc-button-loading"
                );

                setMode(
                    currentMode
                );

            }
        }


        /* =================================================
           SUBMIT
           ================================================= */

       
        async function handleSubmit() {

            if (actionLoading) {
                return;
            }


            if (currentMode === "register") {

                await handleRegister();
                return;

            }


            if (currentMode === "login") {

                await handleLogin();
                return;

            }


            if (currentMode === "forgot") {

                await handleForgotPassword();
                return;

            }
        }


        /* =================================================
           REGISTER
           ================================================= */

        async function handleRegister() {

            clearInputMessages();


            const usernameOK =
                validateUsername();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!usernameOK) {
                return;
            }


            if (!isValidEmail(email)) {

                setFieldError(
                    document.getElementById(
                        "wfescEmailGroup"
                    ),
                    "يرجى إدخال بريد إلكتروني صحيح."
                );

                return;
            }


            if (!validatePassword()) {
                return;
            }


            if (!validatePasswordMatch()) {
                return;
            }


            setActionLoading(
                true,
                "جاري إنشاء الحساب..."
            );


            try {

                const result =
                    await AUTH.signUp(
                        email,
                        password,
                        usernameInput.value.trim()
                    );


                if (
                    result?.error
                ) {

                    throw result.error;

                }


                const user =
                    result?.data?.user ||
                    result?.user ||
                    AUTH.getUser?.();


                const session =
                    result?.data?.session ||
                    result?.session ||
                    AUTH.getSession?.();


                await closeModal(
                    true
                );


                if (
                    session ||
                    (
                        user &&
                        user.email_confirmed_at
                    )
                ) {

                    showStatus(
                        "تم إنشاء الحساب وتسجيل الدخول بنجاح.",
                        "success",
                        5000
                    );

                    await renderAccount(
                        true
                    );

                    return;
                }


                showVerifyMessage(
                    email
                );

            }

            catch (error) {

                setActionLoading(
                    false
                );

                showModalError(
                    getAuthErrorMessage(
                        error
                    )
                );

            }
        }


        /* =================================================
           LOGIN
           ================================================= */

        async function handleLogin() {

            clearInputMessages();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!isValidEmail(email)) {

                setFieldError(
                    document.getElementById(
                        "wfescEmailGroup"
                    ),
                    "يرجى إدخال بريد إلكتروني صحيح."
                );

                return;
            }


            if (!validatePassword()) {
                return;
            }


            setActionLoading(
                true,
                "جاري تسجيل الدخول..."
            );


            try {

                const result =
                    await AUTH.signIn(
                        email,
                        password
                    );


                if (
                    result?.error
                ) {

                    throw result.error;

                }


                await closeModal(
                    true
                );


                showStatus(
                    "تم تسجيل الدخول بنجاح.",
                    "success",
                    4000
                );


                await renderAccount(
                    true
                );

            }

            catch (error) {

                setActionLoading(
                    false
                );

                showModalError(
                    getAuthErrorMessage(
                        error
                    )
                );

            }
        }


        /* =================================================
           FORGOT PASSWORD
           ================================================= */

        async function handleForgotPassword() {

            clearInputMessages();


            const email =
                emailInput.value.trim();


            if (!isValidEmail(email)) {

                setFieldError(
                    document.getElementById(
                        "wfescEmailGroup"
                    ),
                    "يرجى إدخال بريد إلكتروني صحيح."
                );

                return;
            }


            setActionLoading(
                true,
                "جاري إرسال الرابط..."
            );


            try {

                const result =
                    await AUTH.resetPassword(
                        email
                    );


                if (
                    result?.error
                ) {

                    throw result.error;

                }


                await closeModal(
                    true
                );


                createAccountInterface(
                    true
                );


                showStatus(
                    "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
                    "success",
                    6500
                );

            }

            catch (error) {

                setActionLoading(
                    false
                );

                showModalError(
                    getAuthErrorMessage(
                        error
                    )
                );

            }
        }


        /* =================================================
           MODAL ERROR
           ================================================= */

        function showModalError(
            message
        ) {

            showStatus(
                message,
                "error",
                6000
            );


            const box =
                modal?.querySelector(
                    ".wfesc-auth-modal-box"
                );


            if (!box) {
                return;
            }


            box.classList.remove(
                "wfesc-modal-error"
            );


            void box.offsetWidth;


            box.classList.add(
                "wfesc-modal-error"
            );


            setTimeout(() => {

                box.classList.remove(
                    "wfesc-modal-error"
                );

            }, 500);
        }


        /* =================================================
           EMAIL VERIFICATION
           ================================================= */

        function showVerifyMessage(
            email
        ) {

            accountApp.innerHTML = `
                <div class="wfesc-special-view wfesc-verify-view">

                    <div class="wfesc-special-icon">
                        ✉️
                    </div>

                    <h2>
                        تحقق من بريدك الإلكتروني
                    </h2>

                    <p>
                        أرسلنا رابط التحقق إلى:
                    </p>

                    <strong>
                        ${escapeHtml(email || "")}
                    </strong>

                    <p class="wfesc-special-small">
                        افحص البريد الوارد والرسائل غير المرغوب فيها.
                    </p>

                    <div class="wfesc-special-loader"></div>

                </div>
            `;

            requestAnimationFrame(() => {

                accountApp
                    .querySelector(
                        ".wfesc-special-view"
                    )
                    ?.classList.add(
                        "wfesc-view-visible"
                    );

            });


            showStatus(
                "تم إنشاء الحساب، يرجى تأكيد بريدك الإلكتروني.",
                "success",
                6000
            );
        }


        /* =================================================
           EMAIL VERIFIED
           ================================================= */

        async function showVerifiedMessage() {

            accountApp.innerHTML = `
                <div class="wfesc-special-view wfesc-success-view">

                    <div class="wfesc-success-check">
                        ✓
                    </div>

                    <h2>
                        تم التحقق بنجاح
                    </h2>

                    <p>
                        تم التحقق من بريدك الإلكتروني وإكمال التسجيل.
                    </p>

                    <div class="wfesc-special-loader"></div>

                </div>
            `;


            requestAnimationFrame(() => {

                accountApp
                    .querySelector(
                        ".wfesc-special-view"
                    )
                    ?.classList.add(
                        "wfesc-view-visible"
                    );

            });


            await sleep(1800);


            await renderAccount(
                true
            );

            showStatus(
                "تم التحقق بنجاح وإكمال التسجيل.",
                "success",
                5000
            );
        }


        /* =================================================
           PASSWORD RECOVERY DETECTION
           ================================================= */

        function isPasswordRecoveryUrl() {

            const hash =
                window.location.hash || "";

            const search =
                window.location.search || "";


            const combined =
                (
                    hash +
                    "&" +
                    search
                ).toLowerCase();


            return (
                combined.includes(
                    "type=recovery"
                ) ||
                combined.includes(
                    "type%3drecovery"
                )
            );
        }


        function getRecoveryEmail() {

            try {

                const user =
                    AUTH.getUser?.();

                if (
                    user?.email
                ) {
                    return user.email;
                }

            } catch (_) {}


            return "";
        }


        /* =================================================
           RESET PASSWORD SCREEN
           ================================================= */
       
