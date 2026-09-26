/* =========================================================
   WFESC SETTINGS AUTH UI
   settings-auth-ui.js

   مسؤول بالكامل عن:
   - أزرار الحساب
   - نافذة إنشاء الحساب
   - نافذة تسجيل الدخول
   - نسيت كلمة المرور
   - التحقق من البريد
   - واجهة الحساب بعد الدخول
   - تسجيل الخروج
   - إظهار / إخفاء كلمة المرور
   ========================================================= */

(function () {

    "use strict";


    /* =================================================
       منع التشغيل مرتين
    ================================================= */

    if (window.WFESCSettingsAuthUIStarted) {
        return;
    }

    window.WFESCSettingsAuthUIStarted = true;


    /* =================================================
       انتظار Auth
    ================================================= */

    function start() {

        const AUTH =
            window.WFESCSettingsAuth;

        const CONFIG =
            window.WFESCSettingsAuthConfig;


        if (!AUTH || !CONFIG) {

            setTimeout(
                start,
                100
            );

            return;
        }


        const app =
            document.getElementById(
                "settingsAccountApp"
            );


        if (!app) {

            console.error(
                "WFESC: settingsAccountApp غير موجود."
            );

            return;
        }


        /* =================================================
           المتغيرات
        ================================================= */

        let modal = null;

        let form = null;

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

        let currentMode = "register";


        const usernameMin =
            Number(
                CONFIG.username?.minLength
            ) || 3;


        const usernameMax =
            Number(
                CONFIG.username?.maxLength
            ) || 9;


        const passwordMin = 6;

        const passwordMax = 16;


        /* =================================================
           STATUS
        ================================================= */

        function showStatus(message) {

            const status =
                document.getElementById(
                    "settingsStatus"
                );


            if (!status) {
                return;
            }


            status.textContent =
                message;


            status.classList.add(
                "show"
            );


            clearTimeout(
                status._wfescTimer
            );


            status._wfescTimer =
                setTimeout(
                    function () {

                        status.classList.remove(
                            "show"
                        );

                    },
                    5000
                );

        }


        /* =================================================
           HTML إنشاء واجهة الحساب
        ================================================= */

        function createAccountInterface() {

            app.innerHTML = "";


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "account-buttons";


            wrapper.innerHTML = `
                <button
                    class="account-button primary"
                    id="createAccountButton"
                    type="button"
                >
                    إنشاء حساب
                </button>

                <button
                    class="account-button"
                    id="loginButton"
                    type="button"
                >
                    لدي حساب — تسجيل الدخول
                </button>

                <button
                    class="account-button forgot"
                    id="forgotPasswordButton"
                    type="button"
                >
                    نسيت كلمة المرور؟
                </button>
            `;


            app.appendChild(
                wrapper
            );


            const createButton =
                document.getElementById(
                    "createAccountButton"
                );


            const loginButton =
                document.getElementById(
                    "loginButton"
                );


            const forgotButton =
                document.getElementById(
                    "forgotPasswordButton"
                );


            createButton.addEventListener(
                "click",
                function () {

                    openModal(
                        "register"
                    );

                }
            );


            loginButton.addEventListener(
                "click",
                function () {

                    openModal(
                        "login"
                    );

                }
            );


            forgotButton.addEventListener(
                "click",
                function () {

                    openModal(
                        "forgot"
                    );

                }
            );

        }


        /* =================================================
           إنشاء Modal
        ================================================= */

        function createModal() {

            if (document.getElementById("accountModal")) {

                modal =
                    document.getElementById(
                        "accountModal"
                    );

                connectModalElements();

                return;
            }


            modal =
                document.createElement(
                    "div"
                );


            modal.className =
                "modal";


            modal.id =
                "accountModal";


            modal.setAttribute(
                "aria-hidden",
                "true"
            );


            modal.innerHTML = `
                <div class="modal-box">

                    <div class="modal-header">

                        <h2 id="modalTitle">
                            حساب WFESC
                        </h2>

                        <button
                            class="close-modal"
                            id="closeModal"
                            type="button"
                            aria-label="إغلاق"
                        >
                            ×
                        </button>

                    </div>


                    <form id="accountForm">

                        <div
                            class="form-group"
                            id="usernameGroup"
                        >

                            <label for="accountUsername">
                                اسم المستخدم
                            </label>

                            <input
                                class="form-input"
                                id="accountUsername"
                                type="text"
                                maxlength="9"
                                minlength="3"
                                autocomplete="username"
                                placeholder="اسم المستخدم"
                            >

                        </div>


                        <div class="form-group">

                            <label for="accountEmail">
                                البريد الإلكتروني
                            </label>

                            <input
                                class="form-input"
                                id="accountEmail"
                                type="email"
                                autocomplete="email"
                                placeholder="البريد الإلكتروني"
                            >

                        </div>


                        <div
                            class="form-group"
                            id="passwordGroup"
                        >

                            <label for="accountPassword">
                                كلمة المرور
                            </label>

                            <input
                                class="form-input"
                                id="accountPassword"
                                type="password"
                                maxlength="16"
                                minlength="6"
                                autocomplete="current-password"
                                placeholder="كلمة المرور"
                            >

                        </div>


                        <div
                            class="form-group"
                            id="confirmPasswordGroup"
                        >

                            <label for="accountPasswordConfirm">
                                تأكيد كلمة المرور
                            </label>

                            <input
                                class="form-input"
                                id="accountPasswordConfirm"
                                type="password"
                                maxlength="16"
                                minlength="6"
                                autocomplete="new-password"
                                placeholder="أعد كتابة كلمة المرور"
                            >

                        </div>


                        <button
                            class="modal-action"
                            id="modalAction"
                            type="submit"
                        >
                            إنشاء الحساب
                        </button>


                        <div
                            class="modal-note"
                            id="modalNote"
                        ></div>

                    </form>

                </div>
            `;


            document.body.appendChild(
                modal
            );


            connectModalElements();

            setupModalEvents();

            setupPasswordInputs();

            setupPasswordEyes();

        }


        /* =================================================
           ربط عناصر Modal
        ================================================= */

        function connectModalElements() {

            modal =
                document.getElementById(
                    "accountModal"
                );


            if (!modal) {
                return;
            }


            form =
                document.getElementById(
                    "accountForm"
                );


            usernameInput =
                document.getElementById(
                    "accountUsername"
                );


            emailInput =
                document.getElementById(
                    "accountEmail"
                );


            passwordInput =
                document.getElementById(
                    "accountPassword"
                );


            confirmPasswordInput =
                document.getElementById(
                    "accountPasswordConfirm"
                );


            usernameGroup =
                document.getElementById(
                    "usernameGroup"
                );


            passwordGroup =
                document.getElementById(
                    "passwordGroup"
                );


            confirmPasswordGroup =
                document.getElementById(
                    "confirmPasswordGroup"
                );


            modalTitle =
                document.getElementById(
                    "modalTitle"
                );


            modalAction =
                document.getElementById(
                    "modalAction"
                );


            modalNote =
                document.getElementById(
                    "modalNote"
                );


            closeModalButton =
                document.getElementById(
                    "closeModal"
                );

        }


        /* =================================================
           Modal Events
        ================================================= */

        function setupModalEvents() {

            if (!modal) {
                return;
            }


            if (closeModalButton) {

                closeModalButton.addEventListener(
                    "click",
                    closeModal
                );

            }


            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal();

                    }

                }
            );


            document.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Escape" &&
                        modal.classList.contains(
                            "show"
                        )
                    ) {

                        closeModal();

                    }

                }
            );


            if (form) {

                form.addEventListener(
                    "submit",
                    handleSubmit
                );

            }

        }


        /* =================================================
           فتح Modal
        ================================================= */

        function openModal(mode) {

            currentMode =
                mode;


            createModal();

            clearForm();

            setMode(
                mode
            );


            if (!modal) {
                return;
            }


            modal.classList.add(
                "show"
            );


            modal.setAttribute(
                "aria-hidden",
                "false"
            );


            setTimeout(
                function () {

                    if (
                        mode === "forgot"
                    ) {

                        if (emailInput) {
                            emailInput.focus();
                        }

                    } else if (
                        usernameInput &&
                        mode === "register"
                    ) {

                        usernameInput.focus();

                    } else if (
                        emailInput
                    ) {

                        emailInput.focus();

                    }

                },
                50
            );

        }


        window.WFESCOpenAccountModal =
            openModal;


        /* =================================================
           إغلاق Modal
        ================================================= */

        function closeModal() {

            if (!modal) {
                return;
            }


            modal.classList.remove(
                "show"
            );


            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        /* =================================================
           تنظيف الحقول
        ================================================= */

        function clearForm() {

            if (usernameInput) {
                usernameInput.value = "";
            }


            if (emailInput) {
                emailInput.value = "";
            }


            if (passwordInput) {

                passwordInput.value = "";

                passwordInput.type =
                    "password";

            }


            if (confirmPasswordInput) {

                confirmPasswordInput.value = "";

                confirmPasswordInput.type =
                    "password";

            }


            updatePasswordEyes();

        }


        /* =================================================
           أوضاع الحساب
        ================================================= */

        function setMode(mode) {

            currentMode =
                mode;


            if (!modalTitle) {
                return;
            }


            if (mode === "register") {

                modalTitle.textContent =
                    "إنشاء حساب WFESC";


                if (usernameGroup) {
                    usernameGroup.style.display =
                        "block";
                }


                if (passwordGroup) {
                    passwordGroup.style.display =
                        "block";
                }


                if (confirmPasswordGroup) {
                    confirmPasswordGroup.style.display =
                        "block";
                }


                if (modalAction) {
                    modalAction.textContent =
                        "إنشاء الحساب";
                }


                if (modalNote) {

                    modalNote.textContent =
                        "اسم المستخدم من 3 إلى 9 أحرف إنجليزية فقط.";

                }


                if (emailInput) {

                    emailInput.autocomplete =
                        "email";

                }

                return;
            }


            if (mode === "login") {

                modalTitle.textContent =
                    "تسجيل الدخول";


                if (usernameGroup) {
                    usernameGroup.style.display =
                        "none";
                }


                if (passwordGroup) {
                    passwordGroup.style.display =
                        "block";
                }


                if (confirmPasswordGroup) {
                    confirmPasswordGroup.style.display =
                        "none";
                }


                if (modalAction) {
                    modalAction.textContent =
                        "تسجيل الدخول";
                }


                if (modalNote) {

                    modalNote.textContent =
                        "أدخل البريد الإلكتروني وكلمة المرور.";

                }


                if (emailInput) {

                    emailInput.autocomplete =
                        "email";

                }

                return;
            }


            if (mode === "forgot") {

                modalTitle.textContent =
                    "استعادة كلمة المرور";


                if (usernameGroup) {
                    usernameGroup.style.display =
                        "none";
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
                    modalAction.textContent =
                        "إرسال رابط الاستعادة";
                }


                if (modalNote) {

                    modalNote.textContent =
                        "سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.";

                }

            }

        }


        /* =================================================
           Username
        ================================================= */

       
        function setupUsernameInput() {

            if (!usernameInput) {
                return;
            }


            usernameInput.setAttribute(
                "maxlength",
                String(usernameMax)
            );


            usernameInput.setAttribute(
                "minlength",
                String(usernameMin)
            );


            usernameInput.addEventListener(
                "input",
                function () {

                    let value =
                        usernameInput.value;


                    value =
                        value.replace(
                            /[^A-Za-z]/g,
                            ""
                        );


                    value =
                        value.slice(
                            0,
                            usernameMax
                        );


                    usernameInput.value =
                        value;

                }
            );


            usernameInput.addEventListener(
                "blur",
                function () {

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
                        value.length <
                        usernameMin
                    ) {

                        showStatus(
                            "يجب أن يتكون اسم المستخدم من 3 أحرف أو أكثر."
                        );

                    }

                }
            );

        }


        /* =================================================
           Password Input
        ================================================= */

        function limitPasswordInput(
            input
        ) {

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

                    if (
                        input.value.length >
                        passwordMax
                    ) {

                        input.value =
                            input.value.slice(
                                0,
                                passwordMax
                            );

                    }

                }
            );

        }


        function setupPasswordInputs() {

            limitPasswordInput(
                passwordInput
            );


            limitPasswordInput(
                confirmPasswordInput
            );

        }


        /* =================================================
           Password Eyes
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


            input.style.paddingLeft =
                "48px";


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


            button.textContent =
                "🙉";


            button.setAttribute(
                "aria-label",
                "إظهار كلمة المرور"
            );


            button.setAttribute(
                "title",
                "إظهار كلمة المرور"
            );


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


                    button.textContent =
                        isPassword
                            ? "🙈"
                            : "🙉";


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
                passwordInput
            );


            createPasswordEye(
                confirmPasswordInput
            );

        }


        function updatePasswordEyes() {

            const buttons =
                document.querySelectorAll(
                    ".wfesc-password-eye"
                );


            buttons.forEach(
                function (button) {

                    const input =
                        button.parentElement
                            ?.querySelector(
                                "input"
                            );


                    if (!input) {
                        return;
                    }


                    if (
                        input.type ===
                        "password"
                    ) {

                        button.textContent =
                            "🙉";

                    } else {

                        button.textContent =
                            "🙈";

                    }

                }
            );

        }


        /* =================================================
           التحقق من Username
        ================================================= */

        function validateUsername() {

            const username =
                usernameInput?.value.trim() ||
                "";


            if (!username) {

                return {
                    valid: false,
                    message:
                        "يرجى إدخال اسم المستخدم."
                };

            }


            if (
                username.length <
                usernameMin
            ) {

                return {
                    valid: false,
                    message:
                        "يجب أن يتكون اسم المستخدم من 3 أحرف أو أكثر."
                };

            }


            if (
                username.length >
                usernameMax
            ) {

                return {
                    valid: false,
                    message:
                        "اسم المستخدم يجب ألا يتجاوز 9 أحرف."
                };

            }


            if (
                !/^[A-Za-z]+$/.test(
                    username
                )
            ) {

                return {
                    valid: false,
                    message:
                        "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية فقط."
                };

            }


            return {
                valid: true,
                value: username
            };

        }


        /* =================================================
           التحقق من كلمة المرور
        ================================================= */

        function validatePassword() {

            const password =
                passwordInput?.value ||
                "";


            if (
                password.length <
                passwordMin
            ) {

                return {
                    valid: false,
                    message:
                        "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
                };

            }


            if (
                password.length >
                passwordMax
            ) {

                return {
                    valid: false,
                    message:
                        "كلمة المرور يجب ألا تتجاوز 16 حرفًا."
                };

            }


            return {
                valid: true
            };

        }


        /* =================================================
           مطابقة كلمة المرور
        ================================================= */

        function validatePasswordMatch() {

            const password =
                passwordInput?.value ||
                "";


            const confirm =
                confirmPasswordInput?.value ||
                "";


            if (
                password !==
                confirm
            ) {

                return {
                    valid: false,
                    message:
                        "كلمة المرور غير متطابقة."
                };

            }


            return {
                valid: true
            };

        }


        /* =================================================
           معالجة Submit
        ================================================= */

        async function handleSubmit(
            event
        ) {

            event.preventDefault();


            if (
                currentMode ===
                "register"
            ) {

                await handleRegister();

                return;

            }


            if (
                currentMode ===
                "login"
            ) {

                await handleLogin();

                return;

            }


            if (
                currentMode ===
                "forgot"
            ) {

                await handleForgotPassword();

            }

        }


        /* =================================================
           إنشاء الحساب
        ================================================= */

        async function handleRegister() {

            const usernameResult =
                validateUsername();


            if (!usernameResult.valid) {

                showStatus(
                    usernameResult.message
                );

                return;

            }


            const email =
                emailInput?.value.trim() ||
                "";


            const password =
                passwordInput?.value ||
                "";


            if (
                typeof AUTH.isValidEmail ===
                "function" &&
                !AUTH.isValidEmail(email)
            ) {

                showStatus(
                    "يرجى إدخال بريد إلكتروني صحيح."
                );

                return;

            }


            const passwordResult =
                validatePassword();


            if (!passwordResult.valid) {

                showStatus(
                    passwordResult.message
                );

                return;

            }


            const matchResult =
                validatePasswordMatch();


            if (!matchResult.valid) {

                showStatus(
                    matchResult.message
                );

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
                        usernameResult.value
                    );


                if (
                    result &&
                    result.user
                ) {

                    showVerifyMessage();

                    return;

                }


                showStatus(
                    "تم إنشاء الحساب بنجاح."
                );


            } catch (error) {

                console.error(
                    "WFESC Sign Up Error:",
                    error
                );


                showStatus(
                    getAuthErrorMessage(
                        error
                    )
                );

            } finally {

                setActionLoading(
                    false
                );

            }

        }


        /* =================================================
           تسجيل الدخول
        ================================================= */

        async function handleLogin() {

            const email =
                emailInput?.value.trim() ||
                "";


            const password =
                passwordInput?.value ||
                "";


            if (
                !email
            ) {

                showStatus(
                    "يرجى إدخال البريد الإلكتروني."
                );

                return;

            }


            if (
                !password
            ) {

                showStatus(
                    "يرجى إدخال كلمة المرور."
                );

                return;

            }


            if (
                password.length >
                passwordMax
            ) {

                showStatus(
                    "كلمة المرور يجب ألا تتجاوز 16 حرفًا."
                );

                return;

            }


            setActionLoading(
                true,
                "جاري تسجيل الدخول..."
            );


            try {

                await AUTH.signIn(
                    email,
                    password
                );


                closeModal();

                await renderAccount();

                showStatus(
                    "تم تسجيل الدخول بنجاح."
                );


            } catch (error) {

                console.error(
                    "WFESC Sign In Error:",
                    error
                );


                showStatus(
                    getAuthErrorMessage(
                        error
                    )
                );

            } finally {

                setActionLoading(
                    false
                );

            }

        }


        /* =================================================
           نسيت كلمة المرور
        ================================================= */

        async function handleForgotPassword() {

            const email =
                emailInput?.value.trim() ||
                "";


            if (!email) {

                showStatus(
                    "يرجى إدخال بريدك الإلكتروني."
                );

                return;

            }


            if (
                typeof AUTH.isValidEmail ===
                "function" &&
                !AUTH.isValidEmail(email)
            ) {

                showStatus(
                    "يرجى إدخال بريد إلكتروني صحيح."
                );

                return;

            }


            setActionLoading(
                true,
                "جاري إرسال الرابط..."
            );


            try {

                await AUTH.resetPassword(
                    email
                );


                showStatus(
                    "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني."
                );


                closeModal();


            } catch (error) {

                console.error(
                    "WFESC Reset Password Error:",
                    error
                );


                showStatus(
                    getAuthErrorMessage(
                        error
                    )
                );

            } finally {

                setActionLoading(
                    false
                );

            }

        }


        /* =================================================
           رسالة التحقق من البريد
        ================================================= */

        function showVerifyMessage() {

            closeModal();


            app.innerHTML = `
                <div
                    class="account-buttons"
                    style="
                        padding:20px;
                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:34px;
                            margin-bottom:12px;
                        "
                    >
                        ✉️
                    </div>

                    <div
                        style="
                            font-size:17px;
                            font-weight:bold;
                            margin-bottom:8px;
                        "
                    >
                        تم إنشاء حسابك بنجاح
                    </div>

                    <div
                        style="
                            color:#999;
                            font-size:13px;
                            line-height:1.7;
                        "
                    >
                        تحقق من بريدك الإلكتروني لإكمال التسجيل.
                        <br>
                        إذا لم تجد الرسالة، تحقق من الرسائل غير المرغوب فيها.
                    </div>

                </div>
            `;


            showStatus(
                "تم إنشاء الحساب. تحقق من بريدك الإلكتروني."
            );

        }


        /* =================================================
           واجهة الحساب بعد الدخول
        ================================================= */

        async function renderAccount() {

            const user =
                typeof AUTH.getUser ===
                "function"
                    ? AUTH.getUser()
                    : null;


            if (!user) {

                createAccountInterface();

                return;

            }


            let profile = null;


            try {

                if (
                    typeof AUTH.getProfile ===
                    "function"
                ) {

                    profile =
                        AUTH.getProfile();

                }


                if (
                    !profile &&
                    typeof AUTH.fetchProfile ===
                    "function"
                ) {

                    profile =
                        await AUTH.fetchProfile(
                            user.id
                        );

                }

            } catch (error) {

                console.warn(
                    "WFESC Profile:",
                    error
                );

            }


            const username =
                profile?.username ||
                user.user_metadata?.username ||
                user.email?.split("@")[0] ||
                "مستخدم WFESC";


            const avatarUrl =
                profile?.avatar_url ||
                user.user_metadata?.avatar_url ||
                "";


            const firstLetter =
                String(username)
                    .charAt(0)
                    .toUpperCase() ||
                "W";


            app.innerHTML = `
                <div
                    class="logged-in-account"
                    id="loggedInAccount"
                    style="display:block;"
                >

                    <div class="logged-in-profile">

                        <div class="logged-in-avatar-wrap">

                            <img
                                class="logged-in-avatar"
                                id="loggedInAvatar"
                                alt="صورة الحساب"
                                ${avatarUrl
                                    ? `src="${escapeAttribute(avatarUrl)}"`
                                    : ""}
                                style="
                                    display:${avatarUrl ? "block" : "none"};
                                "
                            >

                            <div
                                class="logged-in-avatar-fallback"
                                id="loggedInAvatarFallback"
                                style="
                                    display:${avatarUrl ? "none" : "flex"};
                                "
                            >
                                ${escapeHtml(firstLetter)}
                            </div>

                        </div>


                        <div class="logged-in-info">

                            <div
                                class="logged-in-username"
                                id="loggedInUsername"
                            >
                                ${escapeHtml(username)}
                            </div>

                            <div class="logged-in-status">
                                أنت مسجل الدخول حاليًا
                            </div>

                        </div>

                    </div>


                    <button
                        class="account-button"
                        id="manageAccountButton"
                        type="button"
                    >
                        إدارة الحساب
                    </button>


                    <button
                        class="account-button"
                        id="logoutAccountButton"
                        type="button"
                    >
                        تسجيل الخروج
                    </button>

                </div>
            `;


            const manageButton =
                document.getElementById(
                    "manageAccountButton"
                );


            const logoutButton =
                document.getElementById(
                    "logoutAccountButton"
                );


            if (manageButton) {

                manageButton.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "profile.html";

                    }
                );

            }


            if (logoutButton) {

                logoutButton.addEventListener(
                    "click",
                    handleLogout
                );

            }

        }


        /* =================================================
           تسجيل الخروج
        ================================================= */

        async function handleLogout() {

            const button =
                document.getElementById(
                    "logoutAccountButton"
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "جاري تسجيل الخروج...";

            }


            try {

                await AUTH.signOut();


                createAccountInterface();


                showStatus(
                    "تم تسجيل الخروج بنجاح."
                );


            } catch (error) {

                console.error(
                    "WFESC Logout Error:",
                    error
                );


                showStatus(
                    getAuthErrorMessage(
                        error
                    )
                );


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "تسجيل الخروج";

                }

            }

        }


        /* =================================================
           Email Verification
        ================================================= */

        function showVerifiedMessage() {

            app.innerHTML = `
                <div
                    class="account-buttons"
                    style="
                        padding:20px;
                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:34px;
                            margin-bottom:12px;
                        "
                    >
                        ✅
                    </div>

                    <div
                        style="
                            font-size:17px;
                            font-weight:bold;
                            margin-bottom:8px;
                        "
                    >
                        تم التحقق بنجاح
                    </div>

                    <div
                        style="
                            color:#999;
                            font-size:13px;
                            line-height:1.7;
                        "
                    >
                        تم إكمال تسجيل حساب WFESC بنجاح.
                    </div>

                </div>
            `;


            showStatus(
                "تم التحقق بنجاح وإكمال التسجيل."
            );


            setTimeout(
                function () {

                    renderAccount();

                },
                2500
            );

        }


        /* =================================================
           Auth Error
        ================================================= */

        function getAuthErrorMessage(
            error
        ) {

            const message =
                String(
                    error?.message ||
                    error ||
                    ""
                );


            const lower =
                message.toLowerCase();


            if (
                lower.includes(
                    "invalid login credentials"
                )
            ) {

                return (
                    CONFIG.messages?.wrongPassword ||
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة."
                );

            }


            if (
                lower.includes(
                    "user already registered"
                )
            ) {

                return (
                    CONFIG.messages?.alreadyRegistered ||
                    "أنت مسجل بالفعل."
                );

            }


            if (
                lower.includes(
                    "email not confirmed"
                )
            ) {

                return (
                    "يرجى التحقق من بريدك الإلكتروني أولًا."
                );

            }


            if (
                lower.includes(
                    "invalid api key"
                )
            ) {

                return (
                    "مشكلة في مفتاح Supabase."
                );

            }


            if (
                lower.includes(
                    "rate limit"
                )
            ) {

                return (
                    "تم تجاوز عدد المحاولات، حاول لاحقًا."
                );

            }


            return (
                message ||
                "حدث خطأ، حاول مرة أخرى."
            );

        }


        /* =================================================
           Loading
        ================================================= */

        function setActionLoading(
            loading,
            text
        ) {

            if (!modalAction) {
                return;
            }


            modalAction.disabled =
                loading;


            if (loading) {

                modalAction.dataset.originalText =
                    modalAction.textContent;


                modalAction.textContent =
                    text ||
                    "جاري التنفيذ...";

            } else {

                const original =
                    modalAction.dataset.originalText;


                if (original) {

                    modalAction.textContent =
                        original;

                } else {

                    setMode(
                        currentMode
                    );

                }

            }

        }


        /* =================================================
           Escape HTML
        ================================================= */

        function escapeHtml(
            value
        ) {

            return String(value)
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        function escapeAttribute(
            value
        ) {

            return escapeHtml(
                value
            );

        }


        /* =================================================
           Auth Events
        ================================================= */

        window.addEventListener(
            "WFESCAuthChanged",
            function () {

                renderAccount();

            }
        );


        window.addEventListener(
            "WFESCProfileUpdated",
            function () {

                renderAccount();

            }
        );


        window.addEventListener(
            "WFESCEmailVerified",
            function () {

                showVerifiedMessage();

            }
        );


        /* =================================================
           تشغيل أولي
        ================================================= */

        createAccountInterface();

        createModal();


        if (
            typeof AUTH.restoreSession ===
            "function"
        ) {

            Promise.resolve(
                AUTH.restoreSession()
            )
            .then(
                function () {

                    const user =
                        typeof AUTH.getUser ===
                        "function"
                            ? AUTH.getUser()
                            : null;


                    if (user) {

                        renderAccount();

                    }

                }
            )
            .catch(
                function (error) {

                    console.warn(
                        "WFESC Restore Session:",
                        error
                    );

                    createAccountInterface();

                }
            );

        } else {

            renderAccount();

        }


        /* =================================================
           إعداد الحقول بعد إنشاء Modal
        ================================================= */

        setupUsernameInput();

    }


    /* =================================================
       بدء النظام
    ================================================= */

    start();


})();
   
