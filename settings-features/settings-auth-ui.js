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

   
