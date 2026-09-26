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
        
