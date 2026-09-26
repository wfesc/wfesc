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
       
        async function showResetPasswordScreen() {

            await closeModal(
                false
            );


            const email =
                getRecoveryEmail();


            accountApp.innerHTML = `
                <div class="wfesc-reset-view">

                    <div class="wfesc-reset-card">

                        <div class="wfesc-reset-icon">
                            🔐
                        </div>

                        <h2>
                            إعادة تعيين كلمة المرور
                        </h2>

                        <p class="wfesc-reset-description">
                            أكد الحساب ثم ضع كلمة المرور الجديدة.
                        </p>

                        <div class="wfesc-reset-account">
                            <span>الحساب</span>
                            <strong id="wfescRecoveryEmail">
                                ${escapeHtml(
                                    email ||
                                    "تم التحقق من الحساب"
                                )}
                            </strong>
                        </div>

                        <form
                            id="wfescResetPasswordForm"
                            novalidate
                        >

                            <div class="wfesc-reset-field">

                                <label>
                                    كلمة المرور الجديدة
                                </label>

                                <div class="wfesc-password-container wfesc-password-wrap">

                                    <input
                                        id="wfescNewPassword"
                                        type="password"
                                        maxlength="16"
                                        autocomplete="new-password"
                                    >

                                </div>

                                <small
                                    id="wfescNewPasswordError"
                                ></small>

                            </div>


                            <div class="wfesc-reset-field">

                                <label>
                                    تأكيد كلمة المرور
                                </label>

                                <div class="wfesc-password-container wfesc-password-wrap">

                                    <input
                                        id="wfescNewPasswordConfirm"
                                        type="password"
                                        maxlength="16"
                                        autocomplete="new-password"
                                    >

                                </div>

                                <small
                                    id="wfescNewPasswordConfirmError"
                                ></small>

                            </div>


                            <button
                                type="submit"
                                id="wfescSaveNewPassword"
                                class="account-btn primary wfesc-save-password"
                            >
                                حفظ كلمة المرور
                            </button>

                        </form>

                    </div>

                </div>
            `;


            setupRecoveryPasswordEyes();

            setupRecoveryPasswordForm();


            requestAnimationFrame(() => {

                accountApp
                    .querySelector(
                        ".wfesc-reset-view"
                    )
                    ?.classList.add(
                        "wfesc-view-visible"
                    );

            });
        }


        function setupRecoveryPasswordEyes() {

            const newPassword =
                document.getElementById(
                    "wfescNewPassword"
                );

            const confirmPassword =
                document.getElementById(
                    "wfescNewPasswordConfirm"
                );


            createPasswordEye(
                newPassword
            );

            createPasswordEye(
                confirmPassword
            );


            [
                newPassword,
                confirmPassword
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

                        }
                    );

                });
        }


        function setupRecoveryPasswordForm() {

            const form =
                document.getElementById(
                    "wfescResetPasswordForm"
                );


            if (!form) {
                return;
            }


            form.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const password =
                        document.getElementById(
                            "wfescNewPassword"
                        );

                    const confirm =
                        document.getElementById(
                            "wfescNewPasswordConfirm"
                        );

                    const button =
                        document.getElementById(
                            "wfescSaveNewPassword"
                        );

                    const passwordError =
                        document.getElementById(
                            "wfescNewPasswordError"
                        );

                    const confirmError =
                        document.getElementById(
                            "wfescNewPasswordConfirmError"
                        );


                    passwordError.textContent =
                        "";

                    confirmError.textContent =
                        "";


                    if (
                        password.value.length <
                        passwordMin
                    ) {

                        passwordError.textContent =
                            "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";

                        return;
                    }


                    if (
                        password.value.length >
                        passwordMax
                    ) {

                        passwordError.textContent =
                            "كلمة المرور يجب ألا تتجاوز 16 حرفًا.";

                        return;
                    }


                    if (
                        password.value !==
                        confirm.value
                    ) {

                        confirmError.textContent =
                            "كلمة المرور غير متطابقة.";

                        return;
                    }


                    button.disabled =
                        true;

                    button.classList.add(
                        "wfesc-button-loading"
                    );

                    button.innerHTML = `
                        <span class="wfesc-button-spinner"></span>
                        <span>
                            جاري تغيير كلمة المرور...
                        </span>
                    `;


                    try {

                        const result =
                            await AUTH.updatePassword(
                                password.value
                            );


                        if (
                            result?.error
                        ) {

                            throw result.error;

                        }


                        await showPasswordChangedSuccess();


                    }

                    catch (error) {

                        button.disabled =
                            false;

                        button.classList.remove(
                            "wfesc-button-loading"
                        );

                        button.textContent =
                            "حفظ كلمة المرور";


                        showStatus(
                            getAuthErrorMessage(
                                error
                            ),
                            "error",
                            6000
                        );

                    }

                }
            );
        }


        /* =================================================
           PASSWORD CHANGED
           ================================================= */

        async function showPasswordChangedSuccess() {

            accountApp.innerHTML = `
                <div class="wfesc-special-view wfesc-password-success">

                    <div class="wfesc-success-check">
                        ✓
                    </div>

                    <h2>
                        تم تغيير كلمة المرور
                    </h2>

                    <p>
                        تم تغيير كلمة المرور بنجاح.
                    </p>

                    <p class="wfesc-special-small">
                        يرجى تسجيل الدخول باستخدام كلمة المرور الجديدة.
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
                "تم تغيير كلمة المرور بنجاح، يرجى تسجيل الدخول باستخدام كلمة المرور الجديدة.",
                "success",
                6500
            );


            await sleep(2200);


            try {

                const result =
                    await AUTH.signOut();

                if (
                    result?.error
                ) {
                    throw result.error;
                }

            } catch (_) {}


            await sleep(350);


            createAccountInterface(
                true
            );


            await sleep(200);


            openModal(
                "login"
            );

        }


        /* =================================================
           ACCOUNT VIEW
           ================================================= */

        async function renderAccount(
            animate = true
        ) {

            const user =
                AUTH.getUser?.();


            if (!user) {

                createAccountInterface(
                    animate
                );

                return;
            }


            let profile = null;


            try {

                profile =
                    await AUTH.getProfile?.();

            } catch (_) {

                profile = null;

            }


            const username =
                profile?.username ||
                user.user_metadata?.username ||
                "WFESC User";


            const avatar =
                profile?.avatar_url ||
                user.user_metadata?.avatar_url ||
                "";


            accountApp.innerHTML = `
                <div class="logged-in-account wfesc-account-view">

                    <div class="wfesc-account-avatar">

                        ${
                            avatar
                            ?
                            `<img
                                src="${escapeAttribute(avatar)}"
                                alt="صورة الحساب"
                            >`
                            :
                            `<span>
                                ${escapeHtml(
                                    username
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </span>`
                        }

                    </div>

                    <div class="wfesc-account-info">

                        <strong>
                            ${escapeHtml(username)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                user.email || ""
                            )}
                        </span>

                    </div>


                    <div class="wfesc-account-actions">

                        <button
                            type="button"
                            class="account-btn primary"
                            id="wfescManageAccount"
                        >
                            إدارة الحساب
                        </button>

                        <button
                            type="button"
                            class="account-btn secondary"
                            id="wfescLogout"
                        >
                            تسجيل الخروج
                        </button>

                    </div>

                </div>
            `;


            const manage =
                document.getElementById(
                    "wfescManageAccount"
                );


            const logout =
                document.getElementById(
                    "wfescLogout"
                );


            if (manage) {

                manage.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "profile.html";

                    }
                );

            }


            if (logout) {

                logout.addEventListener(
                    "click",
                    handleLogout
                );

            }


            const view =
                accountApp.querySelector(
                    ".wfesc-account-view"
                );


            if (animate) {

                requestAnimationFrame(() => {

                    view?.classList.add(
                        "wfesc-view-visible"
                    );

                });

            } else {

                view?.classList.add(
                    "wfesc-view-visible"
                );

            }
        }


        /* =================================================
           LOGOUT
           ================================================= */
       

        async function handleLogout() {

            if (actionLoading) {
                return;
            }


            actionLoading =
                true;


            const logout =
                document.getElementById(
                    "wfescLogout"
                );


            if (logout) {

                logout.disabled =
                    true;

                logout.classList.add(
                    "wfesc-button-loading"
                );

                logout.innerHTML = `
                    <span class="wfesc-button-spinner"></span>
                    <span>
                        جاري تسجيل الخروج...
                    </span>
                `;

            }


            try {

                const result =
                    await AUTH.signOut();


                if (
                    result?.error
                ) {

                    throw result.error;

                }


                await sleep(500);


                createAccountInterface(
                    true
                );


                showStatus(
                    "تم تسجيل الخروج بنجاح.",
                    "success",
                    4000
                );

            }

            catch (error) {

                actionLoading =
                    false;

                showStatus(
                    getAuthErrorMessage(
                        error
                    ),
                    "error",
                    6000
                );


                await renderAccount(
                    true
                );

            }

            finally {

                actionLoading =
                    false;

            }
        }


        /* =================================================
           PROFILE UPDATED
           ================================================= */

        async function refreshAccount() {

            if (!authReady) {
                pendingAuthRender = true;
                return;
            }


            const user =
                AUTH.getUser?.();


            if (user) {

                await renderAccount(
                    true
                );

            } else {

                createAccountInterface(
                    true
                );

            }
        }


        /* =================================================
           EVENTS
           ================================================= */

        window.addEventListener(
            "WFESCAuthChanged",
            async event => {

                if (!authReady) {

                    pendingAuthRender =
                        true;

                    return;
                }


                const user =
                    event?.detail?.user ||
                    AUTH.getUser?.();


                if (user) {

                    await renderAccount(
                        true
                    );

                } else {

                    createAccountInterface(
                        true
                    );

                }

            }
        );


        window.addEventListener(
            "WFESCProfileUpdated",
            async () => {

                await refreshAccount();

            }
        );


        window.addEventListener(
            "WFESCEmailVerified",
            async () => {

                if (
                    isPasswordRecoveryUrl()
                ) {
                    return;
                }

                await showVerifiedMessage();

            }
        );


        /* =================================================
           INITIALIZATION
           ================================================= */

        async function start() {

            showAccountLoading(
                "جاري التحقق من الحساب..."
            );


            createModal();


            try {

                await AUTH.restoreSession();

            } catch (_) {}


            authReady =
                true;


            /*
             * Password recovery has priority over
             * normal account rendering.
             */

            if (
                isPasswordRecoveryUrl()
            ) {

                await sleep(250);

                await showResetPasswordScreen();

                return;
            }


            const user =
                AUTH.getUser?.();


            if (user) {

                await renderAccount(
                    false
                );

            } else {

                createAccountInterface(
                    false
                );

            }


            if (
                pendingAuthRender
            ) {

                pendingAuthRender =
                    false;

                const currentUser =
                    AUTH.getUser?.();

                if (currentUser) {

                    await renderAccount(
                        false
                    );

                }

            }
        }


        start();


        /* =================================================
           PUBLIC OPEN MODAL
           ================================================= */

        window.WFESCOpenAccountModal =
            function (mode) {

                openModal(
                    mode || "login"
                );

            };


        /* =================================================
           INJECT CSS
           ================================================= */

        function injectStyles() {

            if (
                document.getElementById(
                    "wfesc-auth-ui-styles"
                )
            ) {
                return;
            }


            const style =
                document.createElement(
                    "style"
                );

            style.id =
                "wfesc-auth-ui-styles";


            style.textContent = `

                /* =========================================
                   GENERAL VIEW ANIMATION
                   ========================================= */

                .wfesc-auth-view,
                .wfesc-account-view,
                .wfesc-special-view,
                .wfesc-reset-view {

                    opacity: 0;

                    transform:
                        translateY(10px)
                        scale(.985);

                    transition:
                        opacity .32s ease,
                        transform .32s ease;

                }


                .wfesc-auth-view.wfesc-view-visible,
                .wfesc-account-view.wfesc-view-visible,
                .wfesc-special-view.wfesc-view-visible,
                .wfesc-reset-view.wfesc-view-visible {

                    opacity: 1;

                    transform:
                        translateY(0)
                        scale(1);

                }


                /* =========================================
                   ACCOUNT LOADING
                   ========================================= */

                .wfesc-account-loading {

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    justify-content: center;

                    gap: 13px;

                    min-height: 125px;

                    opacity: .95;

                    animation:
                        wfescLoadingAppear
                        .35s ease;

                }


                .wfesc-loading-spinner {

                    width: 27px;

                    height: 27px;

                    border:
                        3px solid
                        rgba(255,255,255,.12);

                    border-top-color:
                        currentColor;

                    border-radius: 50%;

                    animation:
                        wfescSpin
                        .75s linear infinite;

                }


                .wfesc-loading-text {

                    font-size: 14px;

                    opacity: .72;

                }


                /* =========================================
                   MODAL
                   ========================================= */

                .wfesc-auth-modal {

                    opacity: 0;

                    transition:
                        opacity .22s ease;

                }


                .wfesc-auth-modal.show {

                    opacity: 1;

                }


                .wfesc-auth-modal-box {

                    opacity: 0;

                    transform:
                        translateY(12px)
                        scale(.97);

                    transition:
                        opacity .25s ease,
                        transform .25s ease;

                }


                .wfesc-auth-modal.show
                .wfesc-auth-modal-box {

                    opacity: 1;

                    transform:
                        translateY(0)
                        scale(1);

                }


                .wfesc-auth-modal.wfesc-modal-closing {

                    opacity: 0;

                }


                .wfesc-auth-modal.wfesc-modal-closing
                .wfesc-auth-modal-box {

                    opacity: 0;

                    transform:
                        translateY(10px)
                        scale(.97);

                }


                /* =========================================
                   ERROR ANIMATION
                   ========================================= */

                .wfesc-modal-error {

                    animation:
                        wfescModalShake
                        .42s ease;

                }


                .wfesc-error-shake {

                    animation:
                        wfescFieldShake
                        .42s ease;

                }


                .wfesc-input-message {

                    display: block;

                    opacity: 0;

                    max-height: 0;

                    overflow: hidden;

                    transition:
                        opacity .2s ease,
                        max-height .2s ease;

                }


                .wfesc-input-message.show {

                    opacity: 1;

                    max-height: 50px;

                }


                /* =========================================
                   PASSWORD
                   ========================================= */

                .wfesc-password-wrap {

                    position: relative;

                }


                .wfesc-password-container {

                    position: relative;

                }


                .wfesc-password-container input {

                    padding-left: 52px !important;

                }


                .wfesc-password-eye {

                    position: absolute;

                    left: 7px;

                    top: 50%;

                    transform:
                        translateY(-50%);

                    width: 36px;

                    height: 36px;

                    padding: 0;

                    border: 0;

                    background: transparent;

                    display: none;

                    align-items: center;

                    justify-content: center;

                    cursor: pointer;

                    font-size: 19px;

                    z-index: 4;

                }


                .wfesc-password-eye:hover {

                    transform:
                        translateY(-50%)
                        scale(1.08);

                }


                /* =========================================
                   LOADING BUTTON
                   ========================================= */

                .wfesc-button-loading {

                    pointer-events: none;

                    opacity: .86;

                    display: inline-flex !important;

                    align-items: center;

                    justify-content: center;

                    gap: 8px;

                }


                .wfesc-button-spinner {

                    width: 15px;

                    height: 15px;

                    border:
                        2px solid
                        rgba(255,255,255,.28);

                    border-top-color:
                        currentColor;

                    border-radius: 50%;

                    animation:
                        wfescSpin
                        .65s linear infinite;

                }


                /* =========================================
                   SPECIAL VIEWS
                   ========================================= */

                .wfesc-special-view {

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    justify-content: center;

                    text-align: center;

                    gap: 10px;

                    min-height: 170px;

                    padding: 15px;

                }


                .wfesc-special-icon {

                    font-size: 42px;

                    animation:
                        wfescIconAppear
                        .5s ease;

                }


                .wfesc-special-view h2 {

                    margin: 0;

                }


                .wfesc-special-view p {

                    margin: 0;

                    opacity: .78;

                    line-height: 1.7;

                }


                .wfesc-special-view strong {

                    word-break: break-word;

                    max-width: 100%;

                }


                .wfesc-special-small {

                    font-size: 13px;

                    opacity: .62 !important;

                }


                .wfesc-special-loader {

                    width: 25px;

                    height: 25px;

                    border:
                        2px solid
                        rgba(255,255,255,.13);

                    border-top-color:
                        currentColor;

                    border-radius: 50%;

                    margin-top: 8px;

                    animation:
                        wfescSpin
                        .75s linear infinite;

                }


                .wfesc-success-check {

                    width: 58px;

                    height: 58px;

                    border-radius: 50%;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border:
                        1px solid
                        currentColor;

                    font-size: 30px;

                    animation:
                        wfescSuccessPop
                        .45s ease;

                }


                /* =========================================
                   RESET PASSWORD
                   ========================================= */

                .wfesc-reset-view {

                    display: flex;

                    justify-content: center;

                    padding: 8px 0;

                }


                .wfesc-reset-card {

                    width: 100%;

                    max-width: 440px;

                    padding: 22px;

                    border-radius: 18px;

                    background:
                        rgba(255,255,255,.035);

                    border:
                        1px solid
                        rgba(255,255,255,.09);

                    text-align: center;

                }


                .wfesc-reset-icon {

                    font-size: 39px;

                    margin-bottom: 8px;

                }


                .wfesc-reset-card h2 {

                    margin:
                        0 0 8px;

                }


                .wfesc-reset-description {

                    margin:
                        0 0 16px;

                    opacity: .7;

                    line-height: 1.7;

                    font-size: 14px;

                }


                .wfesc-reset-account {

                    display: flex;

                    flex-direction: column;

                    gap: 5px;

                    padding: 12px;

                    margin-bottom: 18px;

                    border-radius: 12px;

                    background:
                        rgba(255,255,255,.035);

                    border:
                        1px solid
                        rgba(255,255,255,.07);

                }


                .wfesc-reset-account span {

                    font-size: 12px;

                    opacity: .55;

                }


                .wfesc-reset-account strong {

                    font-size: 14px;

                    word-break: break-word;

                }


                .wfesc-reset-field {

                    text-align: right;

                    margin-bottom: 15px;

                }


                .wfesc-reset-field label {

                    display: block;

                    margin-bottom: 7px;

                    font-size: 14px;

                }


                .wfesc-reset-field input {

                    width: 100%;

                    box-sizing: border-box;

                }


                .wfesc-reset-field small {

                    display: block;

                    color:
                        #ff7777;

                    font-size: 12px;

                    margin-top: 5px;

                    min-height: 17px;

                }


                .wfesc-save-password {

                    width: 100%;

                    margin-top: 4px;

                }


                /* =========================================
                   ACCOUNT ACTIONS
                   ========================================= */

                .wfesc-account-view {

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    gap: 12px;

                    text-align: center;

                }


                .wfesc-account-avatar {

                    width: 65px;

                    height: 65px;

                    border-radius: 50%;

                    overflow: hidden;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    background:
                        rgba(255,255,255,.08);

                    border:
                        1px solid
                        rgba(255,255,255,.1);

                    font-size: 24px;

                }


                .wfesc-account-avatar img {

                    width: 100%;

                    height: 100%;

                    object-fit: cover;

                }


                .wfesc-account-info {

                    display: flex;

                    flex-direction: column;

                    gap: 3px;

                }


                .wfesc-account-info strong {

                    font-size: 17px;

                }


                .wfesc-account-info span {

                    font-size: 12px;

                    opacity: .6;

                    word-break: break-word;

                }


                .wfesc-account-actions {

                    display: flex;

                    flex-wrap: wrap;

                    justify-content: center;

                    gap: 8px;

                    margin-top: 5px;

                }


                /* =========================================
                   KEYFRAMES
                   ========================================= */

                @keyframes wfescSpin {

                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }

                }


                @keyframes wfescLoadingAppear {

                    from {

                        opacity: 0;

                        transform:
                            translateY(5px);

                    }

                    to {

                        opacity: 1;

                        transform:
                            translateY(0);

                    }

                }


                @keyframes wfescModalShake {

                    0%,100% {
                        transform: translateX(0);
                    }

                    20% {
                        transform: translateX(-7px);
                    }

                    40% {
                        transform: translateX(7px);
                    }

                    60% {
                        transform: translateX(-5px);
                    }

                    80% {
                        transform: translateX(5px);
                    }

                }


                @keyframes wfescFieldShake {

                    0%,100% {
                        transform: translateX(0);
                    }

                    25% {
                        transform: translateX(-4px);
                    }

                    50% {
                        transform: translateX(4px);
                    }

                    75% {
                        transform: translateX(-3px);
                    }

                }


                @keyframes wfescIconAppear {

                    from {

                        opacity: 0;

                        transform:
                            scale(.7);

                    }

                    to {

                        opacity: 1;

                        transform:
                            scale(1);

                    }

                }


                @keyframes wfescSuccessPop {

                    0% {

                        opacity: 0;

                        transform:
                            scale(.5);

                    }

                    70% {

                        transform:
                            scale(1.08);

                    }

                    100% {

                        opacity: 1;

                        transform:
                            scale(1);

                    }

                }


                /* =========================================
                   REDUCED MOTION
                   ========================================= */

                @media
                (prefers-reduced-motion: reduce) {

                    .wfesc-auth-view,
                    .wfesc-account-view,
                    .wfesc-special-view,
                    .wfesc-reset-view,
                    .wfesc-auth-modal,
                    .wfesc-auth-modal-box {

                        transition: none !important;

                        animation: none !important;

                    }

                    .wfesc-loading-spinner,
                    .wfesc-special-loader,
                    .wfesc-button-spinner {

                        animation: none !important;

                    }

                }

            `;


            document.head.appendChild(
                style
            );
        }

    }

})();
