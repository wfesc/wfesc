/*
 * WFESC Settings Auth UI
 * Complete UI controller for settings.html
 */

(function () {
    "use strict";

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    window.WFESCSettingsAuthUI = true;

    const CONFIG =
        window.WFESCSettingsAuthConfig || {};

    const PASSWORD_MIN = 6;
    const PASSWORD_MAX = 16;

    const USERNAME_MIN =
        Number(
            CONFIG.username &&
            CONFIG.username.minLength
        ) || 3;

    const USERNAME_MAX =
        Number(
            CONFIG.username &&
            CONFIG.username.maxLength
        ) || 9;

    const SETTINGS_URL =
        "https://wfesc.github.io/wfesc/settings.html";

    let busy = false;
    let verificationTimer = null;

    /* =========================================
       ROOT
    ========================================= */

    function getRoot() {

        return (
            document.querySelector(
                "[data-wfesc-auth]"
            ) ||
            document.querySelector(
                "#wfesc-auth"
            ) ||
            document.querySelector(
                "#wfesc-settings-auth-root"
            )
        );

    }

    function ensureRoot() {

        let root = getRoot();

        if (!root) {

            root =
                document.createElement("div");

            root.id =
                "wfesc-settings-auth-root";

            document.body.appendChild(
                root
            );

        }

        return root;

    }

    /* =========================================
       ELEMENTS
    ========================================= */

    function getElements() {

        const q = function (id) {
            return document.getElementById(id);
        };

        return {

            root:
                q(
                    "wfesc-settings-auth-root"
                ) ||
                getRoot(),

            loginTab:
                q("wfesc-login-tab"),

            registerTab:
                q("wfesc-register-tab"),

            loginForm:
                q("wfesc-login-form"),

            registerForm:
                q("wfesc-register-form"),

            loginEmail:
                q("wfesc-login-email"),

            loginEmailError:
                q("wfesc-login-email-error"),

            loginPassword:
                q("wfesc-login-password"),

            loginPasswordError:
                q("wfesc-login-password-error"),

            loginPasswordToggle:
                q(
                    "wfesc-login-password-toggle"
                ),

            loginSubmit:
                q("wfesc-login-submit"),

            forgotPassword:
                q("wfesc-forgot-password"),

            registerName:
                q("wfesc-register-name"),

            registerNameError:
                q(
                    "wfesc-register-name-error"
                ),

            registerUsername:
                q(
                    "wfesc-register-username"
                ),

            registerUsernameError:
                q(
                    "wfesc-register-username-error"
                ),

            registerEmail:
                q("wfesc-register-email"),

            registerEmailError:
                q(
                    "wfesc-register-email-error"
                ),

            registerPassword:
                q(
                    "wfesc-register-password"
                ),

            registerPasswordError:
                q(
                    "wfesc-register-password-error"
                ),

            registerPasswordToggle:
                q(
                    "wfesc-register-password-toggle"
                ),

            registerConfirm:
                q("wfesc-register-confirm"),

            registerConfirmError:
                q(
                    "wfesc-register-confirm-error"
                ),

            registerConfirmToggle:
                q(
                    "wfesc-register-confirm-toggle"
                ),

            registerSubmit:
                q("wfesc-register-submit"),

            recoveryCard:
                q("wfesc-recovery-card"),

            recoveryEmail:
                q("wfesc-recovery-email"),

            recoveryEmailError:
                q(
                    "wfesc-recovery-email-error"
                ),

            recoverySubmit:
                q("wfesc-recovery-submit"),

            recoveryBack:
                q("wfesc-recovery-back"),

            recoveryPasswordCard:
                q(
                    "wfesc-recovery-password-card"
                ),

            recoveryPassword:
                q(
                    "wfesc-recovery-password"
                ),

            recoveryPasswordToggle:
                q(
                    "wfesc-recovery-password-toggle"
                ),

            recoveryPasswordError:
                q(
                    "wfesc-recovery-password-error"
                ),

            recoveryConfirm:
                q(
                    "wfesc-recovery-confirm"
                ),

            recoveryConfirmToggle:
                q(
                    "wfesc-recovery-confirm-toggle"
                ),

            recoveryConfirmError:
                q(
                    "wfesc-recovery-confirm-error"
                ),

            recoveryPasswordSubmit:
                q(
                    "wfesc-recovery-password-submit"
                ),

            accountCard:
                q("wfesc-account-card"),

            accountAvatar:
                q("wfesc-account-avatar"),

            accountName:
                q("wfesc-account-name"),

            accountVerified:
                q(
                    "wfesc-account-verified"
                ),

            accountUsername:
                q(
                    "wfesc-account-username"
                ),

            accountEmail:
                q(
                    "wfesc-account-email"
                ),

            profileButton:
                q("wfesc-profile-button"),

            changePasswordButton:
                q(
                    "wfesc-change-password-button"
                ),

            logoutButton:
                q("wfesc-logout-button"),

            deleteButton:
                q("wfesc-delete-button"),

            accountStatusText:
                q(
                    "wfesc-account-status-text"
                ),

            status:
                q("wfesc-auth-status"),

            verification:
                q(
                    "wfesc-email-verification"
                ),

            loading:
                q("wfesc-loading")

        };

    }

    /* =========================================
       AUTH ACCESS
    ========================================= */

    function getAuth() {

        return (
            window.WFESCSettingsAuth ||
            null
        );

    }

    async function getCurrentUser() {

        const auth =
            getAuth();

        if (!auth) {
            return null;
        }

        if (
            typeof auth.getCurrentUser ===
            "function"
        ) {

            return await auth.getCurrentUser();

        }

        if (
            typeof auth.getUser ===
            "function"
        ) {

            return await auth.getUser();

        }

        if (
            typeof auth.restoreSession ===
            "function"
        ) {

            const result =
                await auth.restoreSession();

            if (
                result &&
                result.user
            ) {

                return result.user;

            }

        }

        return null;

    }

    async function getCurrentProfile(
        user
    ) {

        const auth =
            getAuth();

        if (!auth) {
            return null;
        }

        if (
            typeof auth.getCurrentProfile ===
            "function"
        ) {

            return await auth.getCurrentProfile(
                user
            );

        }

        if (
            typeof auth.getProfile ===
            "function"
        ) {

            return await auth.getProfile(
                user
            );

        }

        return null;

    }

    /* =========================================
       HELPERS
    ========================================= */

    function sanitizeUsername(
        value
    ) {

        return String(
            value || ""
        )
            .replace(
                /[^A-Za-z0-9]/g,
                ""
            )
            .slice(
                0,
                USERNAME_MAX
            );

    }

    function displayUsername(
        value
    ) {

        const clean =
            sanitizeUsername(value);

        return clean
            ? "@" + clean
            : "";

    }

    function escapeHTML(
        value
    ) {

        return String(
            value == null
                ? ""
                : value
        )
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

    function validateEmail(
        email
    ) {

        const value =
            String(
                email || ""
            ).trim();

        if (!value) {

            return {
                valid: false,
                message:
                    "يرجى إدخال بريدك الإلكتروني."
            };

        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(value)
        ) {

            return {
                valid: false,
                message:
                    "يرجى إدخال بريد إلكتروني صحيح."
            };

        }

        return {
            valid: true,
            value: value
        };

    }

    function validateUsername(
        username
    ) {

        const value =
            sanitizeUsername(
                username
            );

        if (
            value.length <
            USERNAME_MIN
        ) {

            return {
                valid: false,
                message:
                    "اسم المستخدم يجب أن يتكون من " +
                    USERNAME_MIN +
                    " إلى " +
                    USERNAME_MAX +
                    " أحرف أو أرقام."
            };

        }

        return {
            valid: true,
            value: value
        };

    }

    function validatePassword(
        password
    ) {

        const value =
            String(
                password || ""
            );

        if (
            value.length <
            PASSWORD_MIN
        ) {

            return {
                valid: false,
                message:
                    "كلمة المرور يجب أن تكون من 6 إلى 16 خانة."
            };

        }

        if (
            value.length >
            PASSWORD_MAX
        ) {

            return {
                valid: false,
                message:
                    "كلمة المرور يجب ألا تتجاوز 16 خانة."
            };

        }

        return {
            valid: true,
            value: value
        };

    }

    /* =========================================
       ERRORS
    ========================================= */

    function setFieldError(
        input,
        errorElement,
        message
    ) {

        if (input) {

            input.classList.add(
                "wfesc-input-error"
            );

            input.setAttribute(
                "aria-invalid",
                "true"
            );

        }

        if (errorElement) {

            errorElement.textContent =
                message || "";

            errorElement.style.display =
                message
                    ? "block"
                    : "none";

        }

    }

    function clearFieldError(
        input,
        errorElement
    ) {

        if (input) {

            input.classList.remove(
                "wfesc-input-error"
            );

            input.removeAttribute(
                "aria-invalid"
            );

        }

        if (errorElement) {

            errorElement.textContent =
                "";

            errorElement.style.display =
                "none";

        }

    }

    function clearAllErrors() {

        const e =
            getElements();

        clearFieldError(
            e.loginEmail,
            e.loginEmailError
        );

        clearFieldError(
            e.loginPassword,
            e.loginPasswordError
        );

        clearFieldError(
            e.registerName,
            e.registerNameError
        );

        clearFieldError(
            e.registerUsername,
            e.registerUsernameError
        );

        clearFieldError(
            e.registerEmail,
            e.registerEmailError
        );

        clearFieldError(
            e.registerPassword,
            e.registerPasswordError
        );

        clearFieldError(
            e.registerConfirm,
            e.registerConfirmError
        );

        clearFieldError(
            e.recoveryEmail,
            e.recoveryEmailError
        );

        clearFieldError(
            e.recoveryPassword,
            e.recoveryPasswordError
        );

        clearFieldError(
            e.recoveryConfirm,
            e.recoveryConfirmError
        );

    }

    function shake(
        element
    ) {

        if (!element) {
            return;
        }

        element.classList.remove(
            "wfesc-shake"
        );

        void element.offsetWidth;

        element.classList.add(
            "wfesc-shake"
        );

        setTimeout(
            function () {

                element.classList.remove(
                    "wfesc-shake"
                );

            },
            500
        );

    }

    /* =========================================
       STATUS
    ========================================= */

    function showStatus(
        message,
        type
    ) {

        const e =
            getElements();

        if (!e.status) {
            return;
        }

        e.status.textContent =
            message || "";

        e.status.className =
            "wfesc-status " +
            (type || "");

        e.status.style.display =
            message
                ? "block"
                : "none";

    }

    function hideStatus() {

        const e =
            getElements();

        if (!e.status) {
            return;
        }

        e.status.textContent =
            "";

        e.status.style.display =
            "none";

        e.status.className =
            "wfesc-status";

    }

    /* =========================================
       LOADING
    ========================================= */

    function setLoading(
        value
    ) {

        busy =
            Boolean(value);

        const e =
            getElements();

        if (e.loading) {

            e.loading.style.display =
                busy
                    ? "flex"
                    : "none";

        }

        [
            e.loginSubmit,
            e.registerSubmit,
            e.recoverySubmit,
            e.recoveryPasswordSubmit
        ].forEach(
            function (button) {

                if (button) {

                    button.disabled =
                        busy;

                }

            }
        );

    }

    /* =========================================
       MODES
    ========================================= */

    function setMode(
        mode
    ) {

        const e =
            getElements();

        const login =
            mode === "login";

        if (e.loginTab) {

            e.loginTab.classList.toggle(
                "active",
                login
            );

        }

        if (e.registerTab) {

            e.registerTab.classList.toggle(
                "active",
                !login
            );

        }

        if (e.loginForm) {

            e.loginForm.style.display =
                login
                    ? "block"
                    : "none";

        }

        if (e.registerForm) {

            e.registerForm.style.display =
                login
                    ? "none"
                    : "block";

        }

        if (e.recoveryCard) {

            e.recoveryCard.style.display =
                "none";

        }

        if (
            e.recoveryPasswordCard
        ) {

            e.recoveryPasswordCard.style.display =
                "none";

        }

        hideStatus();
        clearAllErrors();

    }

    function showRecoveryEmail() {

        const e =
            getElements();

        if (e.loginForm) {
            e.loginForm.style.display =
                "none";
        }

        if (e.registerForm) {
            e.registerForm.style.display =
                "none";
        }

        if (e.recoveryCard) {
            e.recoveryCard.style.display =
                "block";
        }

        if (
            e.recoveryPasswordCard
        ) {
            e.recoveryPasswordCard.style.display =
                "none";
        }

        hideStatus();
        clearAllErrors();

        if (e.recoveryEmail) {
            e.recoveryEmail.focus();
        }

    }

    function showRecoveryPassword() {

        const e =
            getElements();

        if (e.loginForm) {
            e.loginForm.style.display =
                "none";
        }

        if (e.registerForm) {
            e.registerForm.style.display =
                "none";
        }

        if (e.recoveryCard) {
            e.recoveryCard.style.display =
                "none";
        }

        if (
            e.recoveryPasswordCard
        ) {

            e.recoveryPasswordCard.style.display =
                "block";

        }

        hideStatus();
        clearAllErrors();

        if (
            e.recoveryPassword
        ) {

            e.recoveryPassword.focus();

        }

    }

    /* =========================================
       VERIFICATION MESSAGE
    ========================================= */

    function showVerificationMessage(
        email
    ) {

        const e =
            getElements();

        if (!e.verification) {
            return;
        }

        e.verification.innerHTML =
            "<strong>تحقق من بريدك الإلكتروني</strong>" +
            "<br>" +
            "تم إرسال رابط التحقق إلى " +
            "<b>" +
            escapeHTML(
                email ||
                "بريدك الإلكتروني"
            ) +
            "</b>." +
            "<br>" +
            "إذا لم تجده، افحص الرسائل غير المرغوب فيها أو Spam.";

        e.verification.style.display =
            "block";

        e.verification.classList.remove(
            "wfesc-verification-blink"
        );

        void e.verification.offsetWidth;

        e.verification.classList.add(
            "wfesc-verification-blink"
        );

        if (verificationTimer) {

            clearTimeout(
                verificationTimer
            );

        }

        verificationTimer =
            setTimeout(
                function () {

                    e.verification.style.display =
                        "none";

                },
                5000
            );

    }

    function hideVerificationMessage() {

        const e =
            getElements();

        if (e.verification) {

            e.verification.style.display =
                "none";

        }

        if (verificationTimer) {

            clearTimeout(
                verificationTimer
            );

            verificationTimer =
                null;

        }

    }
    /* =========================================
       ERROR MESSAGE
    ========================================= */

    function getAuthErrorMessage(
        error,
        fallback
    ) {

        const raw =
            String(
                error &&
                error.message
                    ? error.message
                    : error || ""
            ).toLowerCase();

        if (
            raw.includes(
                "invalid login credentials"
            ) ||
            raw.includes(
                "invalid credentials"
            ) ||
            raw.includes(
                "invalid password"
            )
        ) {

            return (
                CONFIG.messages &&
                CONFIG.messages.wrongPassword
            ) ||
            "كلمة المرور غير صحيحة.";

        }

        if (
            raw.includes(
                "email not confirmed"
            ) ||
            raw.includes(
                "email_not_confirmed"
            )
        ) {

            return (
                "يجب تأكيد بريدك الإلكتروني أولًا."
            );

        }

        if (
            raw.includes(
                "already registered"
            ) ||
            raw.includes(
                "user already registered"
            ) ||
            raw.includes(
                "already exists"
            )
        ) {

            return (
                CONFIG.messages &&
                CONFIG.messages.alreadyRegistered
            ) ||
            "أنت مسجل بالفعل، تابع من صفحة لدي حساب.";

        }

        if (
            raw.includes(
                "weak password"
            ) ||
            raw.includes(
                "password should be"
            )
        ) {

            return (
                "كلمة المرور يجب أن تكون من 6 إلى 16 خانة."
            );

        }

        return (
            fallback ||
            "حدث خطأ. حاول مرة أخرى."
        );

    }

    /* =========================================
       ACCOUNT DATA
    ========================================= */

    function getName(
        user,
        profile
    ) {

        const metadata =
            user &&
            user.user_metadata
                ? user.user_metadata
                : {};

        return (
            profile &&
            (
                profile.full_name ||
                profile.name
            )
        ) ||
        metadata.full_name ||
        metadata.name ||
        metadata.fullName ||
        "WFESC";

    }

    function getUsername(
        user,
        profile
    ) {

        const metadata =
            user &&
            user.user_metadata
                ? user.user_metadata
                : {};

        return sanitizeUsername(
            (
                profile &&
                profile.username
            ) ||
            metadata.username ||
            (
                user &&
                user.email
                    ? user.email.split("@")[0]
                    : "WFESC"
            )
        );

    }

    function getAvatar(
        user,
        profile
    ) {

        const metadata =
            user &&
            user.user_metadata
                ? user.user_metadata
                : {};

        return (
            profile &&
            (
                profile.avatar_url ||
                profile.avatar
            )
        ) ||
        metadata.avatar_url ||
        metadata.avatar ||
        "";

    }

    /* =========================================
       RENDER ACCOUNT
    ========================================= */

    function renderAccount(
        user,
        profile
    ) {

        const e =
            getElements();

        if (!user) {

            if (e.accountCard) {

                e.accountCard.style.display =
                    "none";

            }

            if (e.loginTab) {
                e.loginTab.style.display =
                    "";
            }

            if (e.registerTab) {
                e.registerTab.style.display =
                    "";
            }

            return;

        }

        if (e.accountCard) {

            e.accountCard.style.display =
                "block";

        }

        if (e.loginTab) {

            e.loginTab.style.display =
                "none";

        }

        if (e.registerTab) {

            e.registerTab.style.display =
                "none";

        }

        if (e.loginForm) {

            e.loginForm.style.display =
                "none";

        }

        if (e.registerForm) {

            e.registerForm.style.display =
                "none";

        }

        const name =
            getName(
                user,
                profile
            );

        const username =
            getUsername(
                user,
                profile
            );

        const avatar =
            getAvatar(
                user,
                profile
            );

        const verified =
            Boolean(
                profile &&
                profile.verified === true
            );

        if (e.accountName) {

            e.accountName.textContent =
                name;

        }

        if (e.accountUsername) {

            e.accountUsername.textContent =
                displayUsername(
                    username
                );

        }

        if (e.accountEmail) {

            e.accountEmail.textContent =
                user.email || "";

        }

        if (e.accountVerified) {

            e.accountVerified.style.display =
                verified
                    ? "inline-flex"
                    : "none";

        }

        if (e.accountAvatar) {

            if (avatar) {

                e.accountAvatar.innerHTML =
                    '<img src="' +
                    escapeHTML(
                        avatar
                    ) +
                    '" alt="صورة الحساب">';

            } else {

                e.accountAvatar.textContent =
                    String(
                        name || "W"
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase() ||
                    "W";

            }

        }

    }

    /* =========================================
       PASSWORD TOGGLE
    ========================================= */
    
function bindPasswordToggle(
        button,
        input
    ) {

        if (
            !button ||
            !input
        ) {
            return;
        }

        button.addEventListener(
            "click",
            function () {

                const hidden =
                    input.type ===
                    "password";

                input.type =
                    hidden
                        ? "text"
                        : "password";

                button.textContent =
                    hidden
                        ? "🙈"
                        : "🙉";

            }
        );

    }

    /* =========================================
       INPUT CLEANUP
    ========================================= */

    function bindInputCleanup() {

        const e =
            getElements();

        if (
            e.registerUsername
        ) {

            e.registerUsername.addEventListener(
                "input",
                function () {

                    e.registerUsername.value =
                        sanitizeUsername(
                            e.registerUsername.value
                        );

                    clearFieldError(
                        e.registerUsername,
                        e.registerUsernameError
                    );

                }
            );

        }

        if (
            e.registerName
        ) {

            e.registerName.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.registerName,
                        e.registerNameError
                    );

                }
            );

        }

        if (
            e.registerEmail
        ) {

            e.registerEmail.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.registerEmail,
                        e.registerEmailError
                    );

                }
            );

        }

        if (
            e.registerPassword
        ) {

            e.registerPassword.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.registerPassword,
                        e.registerPasswordError
                    );

                    clearFieldError(
                        e.registerConfirm,
                        e.registerConfirmError
                    );

                }
            );

        }

        if (
            e.registerConfirm
        ) {

            e.registerConfirm.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.registerConfirm,
                        e.registerConfirmError
                    );

                }
            );

        }

        if (
            e.loginEmail
        ) {

            e.loginEmail.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.loginEmail,
                        e.loginEmailError
                    );

                }
            );

        }

        if (
            e.loginPassword
        ) {

            e.loginPassword.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.loginPassword,
                        e.loginPasswordError
                    );

                }
            );

        }

        if (
            e.recoveryEmail
        ) {

            e.recoveryEmail.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.recoveryEmail,
                        e.recoveryEmailError
                    );

                }
            );

        }

        if (
            e.recoveryPassword
        ) {

            e.recoveryPassword.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.recoveryPassword,
                        e.recoveryPasswordError
                    );

                }
            );

        }

        if (
            e.recoveryConfirm
        ) {

            e.recoveryConfirm.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        e.recoveryConfirm,
                        e.recoveryConfirmError
                    );

                }
            );

        }

    }

    /* =========================================
       LOGIN
    ========================================= */

    async function handleLogin(
        event
    ) {

        event.preventDefault();

        if (busy) {
            return;
        }

        const e =
            getElements();

        const auth =
            getAuth();

        if (!auth) {

            showStatus(
                "نظام الحساب غير متوفر حاليًا.",
                "error"
            );

            return;

        }

        clearAllErrors();

        const email =
            validateEmail(
                e.loginEmail &&
                e.loginEmail.value
            );

        if (!email.valid) {

            setFieldError(
                e.loginEmail,
                e.loginEmailError,
                email.message
            );

            shake(
                e.loginEmail
            );

            return;

        }

        const password =
            validatePassword(
                e.loginPassword &&
                e.loginPassword.value
            );

        if (!password.valid) {

            setFieldError(
                e.loginPassword,
                e.loginPasswordError,
                password.message
            );

            shake(
                e.loginPassword
            );

            return;

        }

        if (
            typeof auth.signIn !==
            "function"
        ) {

            showStatus(
                "وظيفة تسجيل الدخول غير متوفرة.",
                "error"
            );

            return;

        }

        setLoading(true);

        try {

            const result =
                await auth.signIn(
                    email.value,
                    password.value
                );

            if (
                result &&
                result.error
            ) {

                throw result.error;

            }

            const user =
                result &&
                result.user
                    ? result.user
                    : await getCurrentUser();

            if (!user) {

                throw new Error(
                    "تعذر استعادة الحساب."
                );

            }

            const profile =
                await getCurrentProfile(
                    user
                );

            renderAccount(
                user,
                profile
            );

            showStatus(
                (
                    CONFIG.messages &&
                    CONFIG.messages.loginSuccess
                ) ||
                "تم تسجيل الدخول بنجاح.",
                "success"
            );

            document.dispatchEvent(
                new CustomEvent(
                    "WFESCLoginSuccess",
                    {
                        detail: {
                            user: user,
                            profile: profile
                        }
                    }
                )
            );

            document.dispatchEvent(
                new CustomEvent(
                    "WFESCAuthChanged",
                    {
                        detail: {
                            user: user,
                            profile: profile,
                            loggedIn: true
                        }
                    }
                )
            );

        } catch (error) {

            console.error(
                "WFESC login error:",
                error
            );

            const raw =
                String(
                    error &&
                    error.message
                        ? error.message
                        : error || ""
                ).toLowerCase();

            const message =
                getAuthErrorMessage(
                    error,
                    "تعذر تسجيل الدخول. حاول مرة أخرى."
                );

            if (
                raw.includes(
                    "invalid login credentials"
                ) ||
                raw.includes(
                    "invalid credentials"
                ) ||
                raw.includes(
                    "invalid password"
                )
            ) {

                setFieldError(
                    e.loginPassword,
                    e.loginPasswordError,
                    message
                );

                shake(
                    e.loginPassword
                );

            } else if (
                raw.includes(
                    "email not confirmed"
                )
            ) {

                showStatus(
                    "يجب تأكيد بريدك الإلكتروني أولًا.",
                    "error"
                );

                shake(
                    e.loginEmail
                );

            } else {

                showStatus(
                    message,
                    "error"
                );

            }

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       REGISTER
    ========================================= */

    async function handleRegister(
        event
    ) {

        event.preventDefault();

        if (busy) {
            return;
        }

        const e =
            getElements();

        const auth =
            getAuth();

        if (!auth) {

            showStatus(
                "نظام الحساب غير متوفر حاليًا.",
                "error"
            );

            return;

        }

        clearAllErrors();

        const name =
            String(
                e.registerName &&
                e.registerName.value ||
                ""
            ).trim();

        if (!name) {

            setFieldError(
                e.registerName,
                e.registerNameError,
                "يرجى إدخال اسمك."
            );

            shake(
                e.registerName
            );

            return;

        }

        const username =
            validateUsername(
                e.registerUsername &&
                e.registerUsername.value
            );

        if (!username.valid) {

            setFieldError(
                e.registerUsername,
                e.registerUsernameError,
                username.message
            );

            shake(
                e.registerUsername
            );

            return;

        }

        const email =
            validateEmail(
                e.registerEmail &&
                e.registerEmail.value
            );

        if (!email.valid) {

            setFieldError(
                e.registerEmail,
                e.registerEmailError,
                email.message
            );

            shake(
                e.registerEmail
            );

            return;

        }

        const password =
            validatePassword(
                e.registerPassword &&
                e.registerPassword.value
            );

        if (!password.valid) {

            setFieldError(
                e.registerPassword,
                e.registerPasswordError,
                password.message
            );

            shake(
                e.registerPassword
            );

            return;

        }

        const confirm =
            String(
                e.registerConfirm &&
                e.registerConfirm.value ||
                ""
            );

        if (
            confirm !==
            password.value
        ) {

            const message =
                "كلمتا المرور غير متطابقتين.";

            setFieldError(
                e.registerPassword,
                e.registerPasswordError,
                message
            );

            setFieldError(
                e.registerConfirm,
                e.registerConfirmError,
                message
            );

            shake(
                e.registerPassword
            );

            shake(
                e.registerConfirm
            );

            return;

        }

        if (
            typeof auth.signUp !==
            "function"
        ) {

            showStatus(
                "وظيفة إنشاء الحساب غير متوفرة.",
                "error"
            );

            return;

        }

        setLoading(true);

        try {

            let result;

            /*
             * API الأساسي:
             * signUp(name, email, password, username)
             */

            result =
                await auth.signUp(
                    name,
                    email.value,
                    password.value,
                    username.value
                );

            if (
                result &&
                result.error
            ) {

                throw result.error;

            }

            const user =
                result &&
                result.user
                    ? result.user
                    : (
                        result &&
                        result.data &&
                        result.data.user
                            ? result.data.user
                            : null
                    );

            const session =
                result &&
                result.session
                    ? result.session
                    : (
                        result &&
                        result.data &&
                        result.data.session
                            ? result.data.session
                            : null
                    );

            if (
                user &&
                session
            ) {

                const profile =
                    await getCurrentProfile(
                        user
                    );

                renderAccount(
                    user,
                    profile
                );

                showStatus(
                    "تم إنشاء الحساب وتسجيل الدخول بنجاح.",
                    "success"
                );

                document.dispatchEvent(
                    new CustomEvent(
                        "WFESCAccountCreated",
                        {
                            detail: {
                                user: user,
                                profile: profile,
                                loggedIn: true
                            }
                        }
                    )
                );

                document.dispatchEvent(
                    new CustomEvent(
                        "WFESCAuthChanged",
                        {
                            detail: {
                                user: user,
                                profile: profile,
                                loggedIn: true
                            }
                        }
                    )
                );

            } else {

                showVerificationMessage(
                    email.value
                );

                showStatus(
                    "تم إنشاء الحساب. تحقق من بريدك الإلكتروني.",
                    "success"
                );

                document.dispatchEvent(
                    new CustomEvent(
                        "WFESCAccountCreated",
                        {
                            detail: {
                                user: user,
                                email: email.value,
                                loggedIn: false
                            }
                        }
                    )
                );

            }

        } catch (error) {

            console.error(
                "WFESC register error:",
                error
            );

            const raw =
                String(
                    error &&
                    error.message
                        ? error.message
                        : error || ""
                ).toLowerCase();

            const message =
                getAuthErrorMessage(
                    error,
                    "تعذر إنشاء الحساب. حاول مرة أخرى."
                );

            if (
                raw.includes(
                    "already registered"
                ) ||
                raw.includes(
                    "user already registered"
                ) ||
                raw.includes(
                    "already exists"
                )
            ) {

                setFieldError(
                    e.registerEmail,
                    e.registerEmailError,
                    (
                        CONFIG.messages &&
                        CONFIG.messages.alreadyRegistered
                    ) ||
                    "أنت مسجل بالفعل، تابع من صفحة لدي حساب."
                );

                shake(
                    e.registerEmail
                );

            } else {

                showStatus(
                    message,
                    "error"
                );

            }

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       FORGOT PASSWORD
    ========================================= */
    function handleForgotPassword(
        event
    ) {

        event.preventDefault();

        showRecoveryEmail();

    }

    async function handleRecoverySubmit(
        event
    ) {

        event.preventDefault();

        if (busy) {
            return;
        }

        const e =
            getElements();

        const auth =
            getAuth();

        if (!auth) {
            return;
        }

        clearFieldError(
            e.recoveryEmail,
            e.recoveryEmailError
        );

        const email =
            validateEmail(
                e.recoveryEmail &&
                e.recoveryEmail.value
            );

        if (!email.valid) {

            setFieldError(
                e.recoveryEmail,
                e.recoveryEmailError,
                email.message
            );

            shake(
                e.recoveryEmail
            );

            return;

        }

        if (
            typeof auth.resetPassword !==
            "function"
        ) {

            showStatus(
                "وظيفة استعادة كلمة المرور غير متوفرة.",
                "error"
            );

            return;

        }

        setLoading(true);

        try {

            const result =
                await auth.resetPassword(
                    email.value,
                    SETTINGS_URL
                );

            if (
                result &&
                result.error
            ) {

                throw result.error;

            }

            showStatus(
                (
                    CONFIG.messages &&
                    CONFIG.messages.resetSent
                ) ||
                "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
                "success"
            );

        } catch (error) {

            console.error(
                "WFESC reset error:",
                error
            );

            showStatus(
                getAuthErrorMessage(
                    error,
                    (
                        CONFIG.messages &&
                        CONFIG.messages.resetError
                    ) ||
                    "تعذر إرسال رابط إعادة تعيين كلمة المرور."
                ),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       NEW PASSWORD
    ========================================= */

    async function handleRecoveryPasswordSubmit(
        event
    ) {

        event.preventDefault();

        if (busy) {
            return;
        }

        const e =
            getElements();

        const auth =
            getAuth();

        if (!auth) {
            return;
        }

        const password =
            validatePassword(
                e.recoveryPassword &&
                e.recoveryPassword.value
            );

        clearFieldError(
            e.recoveryPassword,
            e.recoveryPasswordError
        );

        clearFieldError(
            e.recoveryConfirm,
            e.recoveryConfirmError
        );

        if (!password.valid) {

            setFieldError(
                e.recoveryPassword,
                e.recoveryPasswordError,
                password.message
            );

            shake(
                e.recoveryPassword
            );

            return;

        }

        const confirm =
            String(
                e.recoveryConfirm &&
                e.recoveryConfirm.value ||
                ""
            );

        if (
            confirm !==
            password.value
        ) {

            const message =
                "كلمتا المرور غير متطابقتين.";

            setFieldError(
                e.recoveryPassword,
                e.recoveryPasswordError,
                message
            );

            setFieldError(
                e.recoveryConfirm,
                e.recoveryConfirmError,
                message
            );

            shake(
                e.recoveryPassword
            );

            shake(
                e.recoveryConfirm
            );

            return;

        }

        if (
            typeof auth.updatePassword !==
            "function"
        ) {

            showStatus(
                "وظيفة تغيير كلمة المرور غير متوفرة.",
                "error"
            );

            return;

        }

        setLoading(true);

        try {

            const result =
                await auth.updatePassword(
                    password.value
                );

            if (
                result &&
                result.error
            ) {

                throw result.error;

            }

            showStatus(
                "تم تغيير كلمة المرور بنجاح. سيتم تسجيل الخروج.",
                "success"
            );

            setTimeout(
                async function () {

                    if (
                        typeof auth.signOut ===
                        "function"
                    ) {

                        try {

                            await auth.signOut();

                        } catch (error) {

                            console.error(
                                error
                            );

                        }

                    }

                    setMode(
                        "login"
                    );

                    document.dispatchEvent(
                        new CustomEvent(
                            "WFESCAuthChanged",
                            {
                                detail: {
                                    user: null,
                                    profile: null,
                                    loggedIn: false
                                }
                            }
                        )
                    );

                },
                1200
            );

        } catch (error) {

            console.error(
                "WFESC password update error:",
                error
            );

            showStatus(
                getAuthErrorMessage(
                    error,
                    "تعذر تغيير كلمة المرور."
                ),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       CHANGE PASSWORD
    ========================================= */
    
async function handleChangePassword() {

        const auth =
            getAuth();

        if (!auth) {
            return;
        }

        const password =
            window.prompt(
                "اكتب كلمة المرور الجديدة (6 إلى 16 خانة):"
            );

        if (password === null) {
            return;
        }

        const validation =
            validatePassword(
                password
            );

        if (!validation.valid) {

            showStatus(
                validation.message,
                "error"
            );

            return;

        }

        const confirm =
            window.prompt(
                "أعد كتابة كلمة المرور:"
            );

        if (confirm === null) {
            return;
        }

        if (
            confirm !==
            validation.value
        ) {

            showStatus(
                "كلمتا المرور غير متطابقتين.",
                "error"
            );

            return;

        }

        if (
            typeof auth.updatePassword !==
            "function"
        ) {

            showStatus(
                "وظيفة تغيير كلمة المرور غير متوفرة.",
                "error"
            );

            return;

        }

        setLoading(true);

        try {

            const result =
                await auth.updatePassword(
                    validation.value
                );

            if (
                result &&
                result.error
            ) {

                throw result.error;

            }

            showStatus(
                "تم تغيير كلمة المرور بنجاح.",
                "success"
            );

        } catch (error) {

            console.error(
                "WFESC change password error:",
                error
            );

            showStatus(
                getAuthErrorMessage(
                    error,
                    "تعذر تغيير كلمة المرور."
                ),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       LOGOUT
    ========================================= */

    async function handleLogout() {

        const auth =
            getAuth();

        if (!auth) {
            return;
        }

        setLoading(true);

        try {

            if (
                typeof auth.signOut ===
                "function"
            ) {

                const result =
                    await auth.signOut();

                if (
                    result &&
                    result.error
                ) {

                    throw result.error;

                }

            }

            renderAccount(
                null,
                null
            );

            showStatus(
                "تم تسجيل الخروج.",
                "success"
            );

            document.dispatchEvent(
                new CustomEvent(
                    "WFESCAuthChanged",
                    {
                        detail: {
                            user: null,
                            profile: null,
                            loggedIn: false
                        }
                    }
                )
            );

        } catch (error) {

            console.error(
                "WFESC logout error:",
                error
            );

            showStatus(
                "تعذر تسجيل الخروج.",
                "error"
            );

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       DELETE ACCOUNT
    ========================================= */

    async function handleDeleteAccount() {

        const auth =
            getAuth();

        if (!auth) {
            return;
        }

        if (
            !window.confirm(
                "هل أنت متأكد من حذف حسابك نهائيًا؟"
            )
        ) {
            return;
        }

        if (
            !window.confirm(
                "هذا الإجراء نهائي. هل تريد المتابعة؟"
            )
        ) {
            return;
        }

        if (
            typeof auth.deleteAccount !==
            "function"
        ) {

            showStatus(
                "حذف الحساب غير متوفر حاليًا.",
                "error"
            );

            return;

        }

        setLoading(true);

        try {

            const result =
                await auth.deleteAccount();

            if (
                result &&
                result.error
            ) {

                throw result.error;

            }

            renderAccount(
                null,
                null
            );

            showStatus(
                "تم تنفيذ طلب حذف الحساب.",
                "success"
            );

            document.dispatchEvent(
                new CustomEvent(
                    "WFESCAuthChanged",
                    {
                        detail: {
                            user: null,
                            profile: null,
                            loggedIn: false
                        }
                    }
                )
            );

        } catch (error) {

            console.error(
                "WFESC delete account error:",
                error
            );

            showStatus(
                getAuthErrorMessage(
                    error,
                    "تعذر حذف الحساب. حذف auth.users يحتاج إلى إجراء آمن على الخادم."
                ),
                "error"
            );

        } finally {

            setLoading(false);

        }

    }

    /* =========================================
       EVENTS
    ========================================= */

    function bindEvents() {

        const e =
            getElements();

        if (e.loginTab) {

            e.loginTab.addEventListener(
                "click",
                function () {
                    setMode("login");
                }
            );

        }

        if (e.registerTab) {

            e.registerTab.addEventListener(
                "click",
                function () {
                    setMode("register");
                }
            );

        }

        if (e.loginForm) {

            e.loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }

        if (e.registerForm) {

            e.registerForm.addEventListener(
                "submit",
                handleRegister
            );

        }

        if (e.forgotPassword) {

            e.forgotPassword.addEventListener(
                "click",
                handleForgotPassword
            );

        }

        if (e.recoverySubmit) {

            e.recoverySubmit.addEventListener(
                "click",
                handleRecoverySubmit
            );

        }

        if (e.recoveryBack) {

            e.recoveryBack.addEventListener(
                "click",
                function () {
                    setMode("login");
                }
            );

        }

        if (
            e.recoveryPasswordSubmit
        ) {

            e.recoveryPasswordSubmit.addEventListener(
                "click",
                handleRecoveryPasswordSubmit
            );

        }

        if (e.profileButton) {

            e.profileButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "profile.html";

                }
            );

        }

        if (
            e.changePasswordButton
        ) {

            e.changePasswordButton.addEventListener(
                "click",
                handleChangePassword
            );

        }

        if (e.logoutButton) {

            e.logoutButton.addEventListener(
                "click",
                handleLogout
            );

        }

        if (e.deleteButton) {

            e.deleteButton.addEventListener(
                "click",
                handleDeleteAccount
            );

        }

        bindPasswordToggle(
            e.loginPasswordToggle,
            e.loginPassword
        );

        bindPasswordToggle(
            e.registerPasswordToggle,
            e.registerPassword
        );

        bindPasswordToggle(
            e.registerConfirmToggle,
            e.registerConfirm
        );

        bindPasswordToggle(
            e.recoveryPasswordToggle,
            e.recoveryPassword
        );

        bindPasswordToggle(
            e.recoveryConfirmToggle,
            e.recoveryConfirm
        );

        bindInputCleanup();

    }

    /* =========================================
       AUTH EVENTS
    ========================================= */
 
