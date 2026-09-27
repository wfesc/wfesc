(function () {
    "use strict";

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    window.WFESCSettingsAuthUI = true;

    /*
     * ============================================================
     * WFESC SETTINGS AUTH UI
     * واجهة الحساب الاحترافية داخل صفحة الإعدادات
     * ============================================================
     */

    const CONFIG =
        window.WFESCSettingsAuthConfig || {};

    const AUTH =
        window.WFESCSettingsAuth || null;

    const SETTINGS_URL =
        "https://wfesc.github.io/wfesc/settings.html";

    const USERNAME_MIN =
        Number(CONFIG.username?.minLength || 3);

    const USERNAME_MAX =
        Number(CONFIG.username?.maxLength || 9);

    const NAME_MAX = 15;

    const PASSWORD_MIN = 6;
    const PASSWORD_MAX = 16;

    let liquidGlassEnabled = true;

    let root = null;
    let currentUser = null;
    let currentProfile = null;
    let initialized = false;
    let verificationTimer = null;
    let animationObserver = null;

    /*
     * ============================================================
     * SESSION LISTENER
     * ============================================================
     *
     * مراقبة جلسة Supabase المركزية.
     *
     * مهم:
     * لا نستخدم localStorage لتخزين الحساب.
     * Supabase هو المصدر الرئيسي للجلسة.
     */

    let authSubscription = null;
    let authListenerBound = false;
    let sessionRestoreInProgress = false;

    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    function qs(selector) {
        return root
            ? root.querySelector(selector)
            : null;
    }

    function qsa(selector) {
        return root
            ? Array.from(root.querySelectorAll(selector))
            : [];
    }

    function getAuth() {
        return window.WFESCSettingsAuth || AUTH;
    }

    function safeText(value) {
        return String(value ?? "");
    }

    /*
     * ============================================================
     * USERNAME
     * ============================================================
     */

    function sanitizeUsername(value) {
        return safeText(value)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, USERNAME_MAX);
    }

    function validUsername(value) {
        return new RegExp(
            "^[a-z0-9]{" +
            USERNAME_MIN +
            "," +
            USERNAME_MAX +
            "}$"
        ).test(value);
    }

    /*
     * ============================================================
     * NAME
     * ============================================================
     */

    function sanitizeName(value) {
        return safeText(value)
            .trim()
            .slice(0, NAME_MAX);
    }

    function validName(value) {
        return (
            value.length >= 2 &&
            value.length <= NAME_MAX
        );
    }

    /*
     * ============================================================
     * EMAIL
     * ============================================================
     */

    function validEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                safeText(value).trim()
            );
    }

    /*
     * ============================================================
     * PASSWORD
     * ============================================================
     */

    function validPassword(value) {
        return (
            typeof value === "string" &&
            value.length >= PASSWORD_MIN &&
            value.length <= PASSWORD_MAX
        );
    }

    /*
     * ============================================================
     * REAL USER CHECK
     * ============================================================
     */

    function isRealUser(user) {

        if (!user) {
            return false;
        }

        if (
            typeof user !== "object"
        ) {
            return false;
        }

        if (
            !user.id ||
            typeof user.id !== "string"
        ) {
            return false;
        }

        return true;
    }

    function extractUser(result) {

        if (!result) {
            return null;
        }

        if (
            isRealUser(
                result.user
            )
        ) {
            return result.user;
        }

        if (
            isRealUser(
                result.data?.user
            )
        ) {
            return result.data.user;
        }

        if (
            isRealUser(result)
        ) {
            return result;
        }

        return null;
    }

    /*
     * ============================================================
     * ERROR TYPE CHECKS
     * ============================================================
     */

    function isUsernameTakenError(error) {

        if (!error) {
            return false;
        }

        const code =
            safeText(
                error.code
            ).toLowerCase();

        const message =
            safeText(
                error.message ||
                error.error_description ||
                error.msg ||
                error.details ||
                error.hint ||
                ""
            ).toLowerCase();

        if (
            code === "username_already_exists" ||
            code === "username_exists" ||
            code === "username_taken" ||
            code === "usernametaken" ||
            code === "duplicate_username"
        ) {
            return true;
        }

        if (
            message.includes(
                "اسم المستخدم مأخوذ مسبقًا"
            ) ||
            message.includes(
                "اسم المستخدم ماخوذ مسبقا"
            ) ||
            message.includes(
                "اسم المستخدم مستخدم مسبقًا"
            ) ||
            message.includes(
                "اسم المستخدم مستخدم مسبقا"
            )
        ) {
            return true;
        }

        if (
            code === "23505" &&
            (
                message.includes("username") ||
                message.includes("profiles_username")
            )
        ) {
            return true;
        }

        if (
            message.includes(
                "username already exists"
            ) ||
            message.includes(
                "username already registered"
            ) ||
            message.includes(
                "username is already taken"
            ) ||
            message.includes(
                "duplicate username"
            ) ||
            message.includes(
                "username_taken"
            ) ||
            message.includes(
                "username_exists"
            )
        ) {
            return true;
        }

        return false;
    }

    function isExistingEmailError(error) {

        if (!error) {
            return false;
        }

        const code =
            safeText(
                error.code
            ).toLowerCase();

        const message =
            safeText(
                error.message ||
                error.error_description ||
                error.msg ||
                error.details ||
                ""
            ).toLowerCase();

        if (
            code === "existing_email" ||
            code === "email_already_exists" ||
            code === "user_already_exists"
        ) {
            return true;
        }

        if (
            message.includes(
                "أنت تملك حساب بالفعل"
            )
        ) {
            return true;
        }

        if (
            message.includes(
                "already registered"
            ) ||
            message.includes(
                "user already registered"
            ) ||
            message.includes(
                "email already"
            ) ||
            message.includes(
                "email_exists"
            ) ||
            message.includes(
                "email already exists"
            )
        ) {
            return true;
        }

        if (
            code === "23505" &&
            message.includes("email")
        ) {
            return true;
        }

        return false;
    }

    function isWrongPasswordError(error) {

        if (!error) {
            return false;
        }

        const message =
            safeText(
                error.message ||
                error.error_description ||
                error.msg ||
                ""
            ).toLowerCase();

        return (
            message.includes(
                "invalid login credentials"
            ) ||
            message.includes(
                "invalid credentials"
            ) ||
            message.includes(
                "wrong password"
            ) ||
            message.includes(
                "invalid password"
            ) ||
            message.includes(
                "كلمة المرور خطأ"
            ) ||
            message.includes(
                "كلمة المرور غير صحيحة"
            )
        );
    }

    /*
     * ============================================================
     * ERROR NORMALIZATION
     * ============================================================
     */

    function getErrorMessage(error) {

        if (!error) {
            return "حدث خطأ غير معروف.";
        }

        if (
            typeof error === "string"
        ) {
            return error;
        }

        if (
            isUsernameTakenError(error)
        ) {
            return "اسم المستخدم مأخوذ مسبقًا";
        }

        if (
            isExistingEmailError(error)
        ) {
            return "أنت تملك حساب بالفعل";
        }

        if (
            isWrongPasswordError(error)
        ) {
            return "كلمة المرور خطأ.";
        }

        const raw =
            error.message ||
            error.error_description ||
            error.msg ||
            "";

        const text =
            safeText(raw)
                .toLowerCase();

        if (
            text.includes(
                "invalid login credentials"
            ) ||
            text.includes(
                "invalid credentials"
            ) ||
            text.includes(
                "wrong password"
            ) ||
            text.includes(
                "invalid password"
            )
        ) {
            return "كلمة المرور خطأ.";
        }

        if (
            text.includes(
                "already registered"
            ) ||
            text.includes(
                "user already registered"
            ) ||
            text.includes(
                "email already"
            ) ||
            text.includes(
                "email_exists"
            )
        ) {
            return "أنت تملك حساب بالفعل";
        }

        if (
            text.includes(
                "email not confirmed"
            ) ||
            text.includes(
                "email_not_confirmed"
            )
        ) {
            return "يرجى تأكيد بريدك الإلكتروني أولًا.";
        }

        return (
            raw ||
            "حدث خطأ غير معروف."
        );
    }

    /*
     * ============================================================
     * ANIMATION CONTROL
     * ============================================================
     */

    function animationsEnabled() {

        return !document.documentElement
            .classList.contains(
                "wfesc-animation-off"
            );
    }

    function applyAnimationState() {

        if (!root) {
            return;
        }

        root.classList.toggle(
            "wfesc-auth-no-animation",
            !animationsEnabled()
        );
    }

    function observeAnimationSetting() {

        if (animationObserver) {
            return;
        }

        animationObserver =
            new MutationObserver(
                function () {
                    applyAnimationState();
                }
            );

        animationObserver.observe(
            document.documentElement,
            {
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );
    }

    /*
     * ============================================================
     * LIQUID GLASS
     * ============================================================
     */

    function applyLiquidGlass() {

        if (!root) {
            return;
        }

        root.classList.toggle(
            "wfesc-liquid-glass-enabled",
            liquidGlassEnabled
        );

        root.dataset.liquidGlass =
            liquidGlassEnabled
                ? "on"
                : "off";
    }

    window.WFESCSetAuthLiquidGlass =
        function (enabled) {

            liquidGlassEnabled =
                Boolean(enabled);

            applyLiquidGlass();
        };

    window.WFESCGetAuthLiquidGlass =
        function () {
            return liquidGlassEnabled;
        };

    /*
     * ============================================================
     * SHAKE
     * ============================================================
     */

    function shake(element) {

        if (
            !element ||
            !animationsEnabled()
        ) {
            return;
        }

        element.classList.remove(
            "wfesc-auth-shake"
        );

        void element.offsetWidth;

        element.classList.add(
            "wfesc-auth-shake"
        );

        setTimeout(
            function () {

                element.classList.remove(
                    "wfesc-auth-shake"
                );

            },
            450
        );
    }

    function shakeMany(elements) {

        elements.forEach(
            function (element) {
                shake(element);
            }
        );
    }

    /*
     * ============================================================
     * MESSAGE
     * ============================================================
     */

    function setMessage(
        element,
        text,
        type
    ) {

        if (!element) {
            return;
        }

        element.textContent =
            text || "";

        element.className =
            "wfesc-auth-message " +
            (type || "");
    }

    function clearMessage(element) {

        if (!element) {
            return;
        }

        element.textContent = "";

        element.className =
            "wfesc-auth-message";
    }

    /*
     * ============================================================
     * BUTTON LOADING
     * ============================================================
     */

    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }

        if (loading) {

            if (
                !button.dataset.originalText
            ) {

                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled = true;

            button.textContent =
                text ||
                "جارٍ التنفيذ...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                button.textContent;

            delete button.dataset.originalText;
        }
    }

    /*
     * ============================================================
     * STATUS
     * ============================================================
     */

    function showStatus(
        text,
        type
    ) {

        let status =
            document.getElementById(
                "wfesc-auth-status"
            );

        if (!status) {

            status =
                document.createElement(
                    "div"
                );

            status.id =
                "wfesc-auth-status";

            status.className =
                "settings-status";

            document.body.appendChild(
                status
            );
        }

        status.textContent =
            text || "";

        status.classList.remove(
            "show",
            "error",
            "success"
        );

        if (type) {
            status.classList.add(type);
        }

        void status.offsetWidth;

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
                4500
            );
    }

    /*
     * ============================================================
     * MODALS
     * ============================================================
     */

    function closeAllModals() {

        qsa(".modal").forEach(
            function (modal) {

                modal.classList.remove(
                    "show"
                );
            }
        );
    }

    function openModal(modal) {

        if (!modal) {
            return;
        }

        modal.classList.add(
            "show"
        );

        applyAnimationState();
    }

    function closeModal(modal) {

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "show"
        );
    }

    /*
     * ============================================================
     * CSS
     * ============================================================
     */

    function injectCSS() {

        if (
            document.getElementById(
                "wfesc-settings-auth-ui-css"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "wfesc-settings-auth-ui-css";

        style.textContent = `

            #settingsAccountApp {
                width: 100%;
            }

            #settingsAccountApp,
            #settingsAccountApp * {
                -webkit-tap-highlight-color:
                    transparent;
            }

            .wfesc-auth-shell {
                width: 100%;
                position: relative;
            }

            .wfesc-liquid-glass-enabled
            .wfesc-auth-glass {

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,.055),
                        rgba(255,255,255,.012)
                    ) !important;

                border-color:
                    rgba(255,255,255,.115)
                    !important;

                box-shadow:
                    inset 0 1px 0
                    rgba(255,255,255,.085),

                    inset 0 -1px 0
                    rgba(255,255,255,.018),

                    0 10px 34px
                    rgba(0,0,0,.18)
                    !important;

                backdrop-filter:
                    blur(28px)
                    saturate(155%);

                -webkit-backdrop-filter:
                    blur(28px)
                    saturate(155%);
            }

            .wfesc-liquid-glass-enabled
            .wfesc-auth-input {

                background:
                    rgba(255,255,255,.026);

                border-color:
                    rgba(255,255,255,.105);

                backdrop-filter:
                    blur(20px)
                    saturate(140%);

                -webkit-backdrop-filter:
                    blur(20px)
                    saturate(140%);
            }

            .wfesc-liquid-glass-enabled
            .wfesc-auth-tab,
            .wfesc-liquid-glass-enabled
            .wfesc-auth-button:not(.primary),
            .wfesc-liquid-glass-enabled
            .wfesc-auth-action {

                background:
                    rgba(255,255,255,.032);

                border-color:
                    rgba(255,255,255,.105);

                backdrop-filter:
                    blur(22px)
                    saturate(150%);

                -webkit-backdrop-filter:
                    blur(22px)
                    saturate(150%);
            }

            .wfesc-liquid-glass-enabled
            .wfesc-auth-glass::before {

                content: "";

                position: absolute;

                inset: 0;

                pointer-events: none;

                border-radius:
                    inherit;

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,.045),
                        transparent 35%,
                        transparent 70%,
                        rgba(255,255,255,.012)
                    );

                opacity: .8;
            }

            .wfesc-auth-glass {
                position: relative;
                overflow: hidden;
            }

            .wfesc-auth-tabs {

                display: grid;

                grid-template-columns:
                    1fr 1fr;

                gap: 8px;

                margin-bottom: 15px;
            }

            .wfesc-auth-tab {

                min-height: 45px;

                border:
                    1px solid #292929;

                border-radius: 13px;

                background: #171717;

                color: #999;

                cursor: pointer;

                font-size: 14px;

                font-weight: bold;

                transition:
                    transform .22s ease,
                    background .22s ease,
                    color .22s ease,
                    border-color .22s ease;
            }

            .wfesc-auth-tab.active {

                background: #eee;

                color: #050505;

                border-color: #eee;
            }

            .wfesc-auth-tab:active {

                transform:
                    scale(.98);
            }

            .wfesc-auth-panel {
                display: none;
            }

            .wfesc-auth-panel.active {

                display: block;

                animation:
                    wfescAuthPanelIn
                    .32s ease both;
            }

            .wfesc-auth-form-group {
                margin-bottom: 13px;
            }

            .wfesc-auth-form-group label {

                display: block;

                color: #aaa;

                font-size: 12px;

                margin-bottom: 7px;
            }

            .wfesc-auth-input-wrap {
                position: relative;
            }

            .wfesc-auth-input {

                width: 100%;

                height: 47px;

                border:
                    1px solid #292929;

                border-radius: 13px;

                outline: none;

                background: #181818;

                color: #fff;

                padding: 0 13px;

                font-size: 14px;

                transition:
                    border-color .2s ease,
                    box-shadow .2s ease,
                    background .2s ease,
                    transform .2s ease;
            }

            .wfesc-auth-input:focus {

                border-color:
                    rgba(255,255,255,.42);

                box-shadow:
                    0 0 0 3px
                    rgba(255,255,255,.035);
            }

            .wfesc-auth-input.error {

                border-color:
                    #a84b4b;

                box-shadow:
                    0 0 0 3px
                    rgba(168,75,75,.08);
            }

            .wfesc-auth-password-toggle {

                position: absolute;

                left: 3px;

                top: 3px;

                width: 40px;

                height: 40px;

                border: 0;

                border-radius: 10px;

                background:
                    transparent;

                color: #aaa;

                cursor: pointer;

                font-size: 17px;
            }

            .wfesc-auth-error {

                min-height: 17px;

                color: #df7777;

                font-size: 11px;

                margin-top: 5px;

                line-height: 1.4;
            }

            .wfesc-auth-message {

                min-height: 20px;

                text-align: center;

                color: #888;

                font-size: 12px;

                line-height: 1.6;

                margin-top: 10px;
            }

            .wfesc-auth-message.error {
                color: #df7777;
            }

            .wfesc-auth-message.success {
                color: #aaa;
            }

            .wfesc-auth-button {

                width: 100%;

                min-height: 50px;

                border:
                    1px solid #292929;

                border-radius: 13px;

                background: #171717;

                color: #eee;

                cursor: pointer;

                font-size: 14px;

                font-weight: bold;

                transition:
                    transform .2s ease,
                    opacity .2s ease,
                    background .2s ease;

                margin-top: 5px;
            }

            .wfesc-auth-button.primary {

                background: #eee;

                color: #050505;

                border-color: #eee;
            }

            .wfesc-auth-button:active {

                transform:
                    scale(.985);
            }

            .wfesc-auth-button:disabled {

                opacity: .55;

                cursor: wait;
            }

            .wfesc-auth-link {

                width: 100%;

                min-height: 42px;

                border: 0;

                background: transparent;

                color: #888;

                cursor: pointer;

                font-size: 12px;
            }

            .wfesc-auth-account {
                width: 100%;
            }

            .wfesc-auth-profile {

                display: flex;

                align-items: center;

                gap: 13px;

                padding: 15px;

                margin-bottom: 12px;

                border:
                    1px solid #242424;

                border-radius: 18px;

                background: #111;

                box-shadow:
                    0 8px 25px
                    rgba(0,0,0,.12);
            }

            .wfesc-auth-glass {

                transition:
                    background .25s ease,
                    border-color .25s ease,
                    box-shadow .25s ease;
            }

            .wfesc-auth-avatar-wrap {

                width: 62px;

                height: 62px;

                min-width: 62px;

                border-radius: 50%;

                overflow: hidden;

                border:
                    1px solid #303030;

                background: #1b1b1b;
            }

            .wfesc-auth-avatar {

                width: 100%;

                height: 100%;

                object-fit: cover;

                display: none;
            }

            .wfesc-auth-avatar-fallback {

                width: 100%;

                height: 100%;

                display: flex;

                align-items: center;

                justify-content: center;

                color: #eee;

                font-size: 23px;

                font-weight: bold;
            }

            .wfesc-auth-account-info {

                min-width: 0;

                flex: 1;
            }

            .wfesc-auth-account-name {

                font-size: 17px;

                font-weight: bold;

                margin-bottom: 4px;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;
            }

            .wfesc-auth-account-username {

                color: #aaa;

                font-size: 12px;

                direction: ltr;

                text-align: right;
            }

            .wfesc-auth-account-email {

                color: #777;

                font-size: 11px;

                margin-top: 4px;

                direction: ltr;

                text-align: right;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;
            }

            .wfesc-auth-verified {

                color: #aaa;

                font-size: 10px;

                margin-top: 5px;
            }

            .wfesc-auth-action {

                width: 100%;

                min-height: 58px;

                padding: 10px 14px;

                border:
                    1px solid #292929;

                border-radius: 13px;

                background: #171717;

                color: #eee;

                text-align: right;

                cursor: pointer;

                margin-top: 8px;

                transition:
                    transform .2s ease,
                    background .2s ease,
                    border-color .2s ease;
            }

            .wfesc-auth-action strong {

                display: block;

                font-size: 13px;
            }

            .wfesc-auth-action span {

                display: block;

                color: #777;

                font-size: 10px;

                margin-top: 4px;
            }

            .wfesc-auth-action:active {

                transform:
                    scale(.985);
            }

            .wfesc-auth-action.danger {

                color: #df7777;
            }

            .wfesc-auth-verification {

                display: none;

                padding: 12px;

                margin-bottom: 13px;

                border:
                    1px solid #303030;

                border-radius: 13px;

                background: #171717;

                color: #aaa;

                text-align: center;

                font-size: 11px;

                line-height: 1.7;
            }

            .wfesc-auth-verification.show {

                display: block;

                animation:
                    wfescVerificationIn
                    .3s ease both,
                    wfescVerificationPulse
                    1.1s ease-in-out
                    infinite alternate;
            }

            .wfesc-auth-loading {

                display: none;

                padding: 8px;

                text-align: center;

                color: #777;

                font-size: 11px;
            }

            .wfesc-auth-loading.show {

                display: block;

                animation:
                    wfescAuthFade
                    .25s ease both;
            }

            .wfesc-auth-shake {

                animation:
                    wfescAuthShake
                    .4s ease;
            }

            .wfesc-delete-warning {

                text-align: center;

                padding:
                    5px 0 12px;
            }

            .wfesc-delete-warning-icon {

                font-size: 38px;

                margin-bottom: 8px;
            }

            .wfesc-delete-warning-title {

                font-size: 18px;

                font-weight: bold;

                color: #fff;

                margin-bottom: 9px;
            }

            .wfesc-delete-warning-text {

                color: #aaa;

                font-size: 12px;

                line-height: 1.8;
            }

            .wfesc-delete-warning-text strong {

                color: #df7777;
            }

            .wfesc-delete-final {

                padding:
                    4px 0 8px;
            }

            .wfesc-delete-final-title {

                font-size: 17px;

                font-weight: bold;

                text-align: center;

                margin-bottom: 12px;
            }

            .wfesc-delete-support {

                padding: 12px;

                border-radius: 13px;

                border:
                    1px solid #292929;

                background: #171717;

                color: #999;

                font-size: 11px;

                line-height: 1.7;

                text-align: center;

                margin-bottom: 13px;
            }

            .wfesc-delete-support-button {

                width: 100%;

                min-height: 43px;

                border-radius: 12px;

                border:
                    1px solid #303030;

                background: #202020;

                color: #eee;

                cursor: pointer;

                margin-top: 9px;
            }

            .wfesc-delete-confirm {

                width: 100%;

                min-height: 47px;

                border-radius: 12px;

                border:
                    1px solid #7a3d3d;

                background: #512727;

                color: #fff;

                cursor: pointer;

                font-weight: bold;

                margin-top: 6px;
            }

            .wfesc-delete-cancel {

                width: 100%;

                min-height: 43px;

                border: 0;

                background: transparent;

                color: #888;

                cursor: pointer;
            }

            @keyframes wfescAuthPanelIn {

                from {
                    opacity: 0;
                    transform:
                        translateY(7px);
                }

                to {
                    opacity: 1;
                    transform:
                        translateY(0);
                }
            }

            @keyframes wfescAuthFade {

                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @keyframes wfescVerificationIn {

                from {
                    opacity: 0;
                    transform:
                        translateY(-5px);
                }

                to {
                    opacity: 1;
                    transform:
                        translateY(0);
                }
            }

            @keyframes wfescVerificationPulse {

                from {
                    opacity: .68;
                }

                to {
                    opacity: 1;
                }
            }

            @keyframes wfescAuthShake {

                0%, 100% {
                    transform:
                        translateX(0);
                }

                20% {
                    transform:
                        translateX(6px);
                }

                40% {
                    transform:
                        translateX(-6px);
                }

                60% {
                    transform:
                        translateX(4px);
                }

                80% {
                    transform:
                        translateX(-3px);
                }
            }

            .wfesc-auth-no-animation *,
            .wfesc-auth-no-animation
            *::before,
            .wfesc-auth-no-animation
            *::after {

                animation:
                    none !important;

                transition:
                    none !important;

                scroll-behavior:
                    auto !important;
            }

            @media
            (prefers-reduced-motion: reduce) {

                #settingsAccountApp *,
                #settingsAccountApp
                *::before,
                #settingsAccountApp
                *::after {

                    animation:
                        none !important;

                    transition:
                        none !important;
                }
            }

            @media (max-width: 500px) {

                .wfesc-auth-tabs {
                    gap: 6px;
                }

                .wfesc-auth-input {
                    height: 49px;
                }

                .wfesc-auth-profile {
                    padding: 13px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /*
     * ============================================================
     * ROOT
     * ============================================================
     */

    function ensureRoot() {

        root =
            document.getElementById(
                "settingsAccountApp"
            );

        if (!root) {

            console.error(
                "WFESC: #settingsAccountApp غير موجود."
            );

            return false;
        }

        return true;
    }

    /*
     * ============================================================
     * BUILD UI
     * ============================================================
     */

    function buildUI() {

        if (!root) {
            return;
        }

        root.innerHTML = `

            <div class="wfesc-auth-shell">

                <div
                    id="wfesc-auth-loading"
                    class="wfesc-auth-loading"
                >
                    جارٍ التحقق من الحساب...
                </div>

                <div
                    id="wfesc-email-verification"
                    class="wfesc-auth-verification"
                ></div>

                <div
                    id="wfesc-auth-guest"
                    class="wfesc-auth-account"
                >

                    <div class="wfesc-auth-tabs">

                        <button
                            type="button"
                            class="wfesc-auth-tab active wfesc-auth-glass"
                            data-auth-mode="login"
                        >
                            لدي حساب
                        </button>

                        <button
                            type="button"
                            class="wfesc-auth-tab wfesc-auth-glass"
                            data-auth-mode="register"
                        >
                            إنشاء حساب
                        </button>

                    </div>

                    <div
                        id="wfesc-login-panel"
                        class="wfesc-auth-panel active"
                    >

                        <div class="wfesc-auth-form-group">

                            <label>
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfesc-login-email"
                                class="wfesc-auth-input"
                                type="email"
                                autocomplete="email"
                                placeholder="name@example.com"
                            >

                            <div
                                id="wfesc-login-email-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <div class="wfesc-auth-form-group">

                            <label>
                                كلمة المرور
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-login-password"
                                    class="wfesc-auth-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="current-password"
                                    placeholder="6 إلى 16 خانة"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-login-password"
                                >
                                    🙉
                                </button>

                            </div>

                            <div
                                id="wfesc-login-password-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <button
                            id="wfesc-login-submit"
                            type="button"
                            class="wfesc-auth-button primary"
                        >
                            تسجيل الدخول
                        </button>

                        <button
                            id="wfesc-login-forgot"
                            type="button"
                            class="wfesc-auth-link"
                        >
                            نسيت كلمة المرور؟
                        </button>

                        <div
                            id="wfesc-login-message"
                            class="wfesc-auth-message"
                        ></div>

                    </div>

                    <div
                        id="wfesc-register-panel"
                        class="wfesc-auth-panel"
                    >

                        <div class="wfesc-auth-form-group">

                            <label>
                                الاسم
                            </label>

                            <input
                                id="wfesc-register-name"
                                class="wfesc-auth-input"
                                type="text"
                                maxlength="${NAME_MAX}"
                                autocomplete="name"
                                placeholder="اسمك"
                            >

                            <div
                                id="wfesc-register-name-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <div class="wfesc-auth-form-group">

                            <label>
                                اسم المستخدم
                            </label>

                            <input
                                id="wfesc-register-username"
                                class="wfesc-auth-input"
                                type="text"
                                maxlength="${USERNAME_MAX}"
                                autocomplete="username"
                                spellcheck="false"
                                autocapitalize="none"
                                dir="ltr"
                                placeholder="اسم المستخدم"
                            >

                            <div
                                id="wfesc-register-username-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <div class="wfesc-auth-form-group">

                            <label>
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfesc-register-email"
                                class="wfesc-auth-input"
                                type="email"
                                autocomplete="email"
                                placeholder="name@example.com"
                            >

                            <div
                                id="wfesc-register-email-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <div class="wfesc-auth-form-group">

                            <label>
                                كلمة المرور
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-register-password"
                                    class="wfesc-auth-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="new-password"
                                    placeholder="6 إلى 16 خانة"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-register-password"
                                >
                                    🙉
                                </button>

                            </div>

                            <div
                                id="wfesc-register-password-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <div class="wfesc-auth-form-group">

                            <label>
                                تأكيد كلمة المرور
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-register-confirm"
                                    class="wfesc-auth-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="new-password"
                                    placeholder="أعد كتابة كلمة المرور"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-register-confirm"
                                >
                                    🙉
                                </button>

                            </div>

                            <div
                                id="wfesc-register-confirm-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <button
                            id="wfesc-register-submit"
                            type="button"
                            class="wfesc-auth-button primary"
                        >
                            إنشاء الحساب
                        </button>

                        <div
                            id="wfesc-register-message"
                            class="wfesc-auth-message"
                        ></div>

                    </div>

                    <div
                        id="wfesc-forgot-panel"
                        class="wfesc-auth-panel"
                    >

                        <div
                            class="wfesc-auth-form-group"
                        >

                            <label>
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfesc-forgot-email"
                                class="wfesc-auth-input"
                                type="email"
                                autocomplete="email"
                                placeholder="name@example.com"
                            >

                            <div
                                id="wfesc-forgot-email-error"
                                class="wfesc-auth-error"
                            ></div>

                        </div>

                        <button
                            id="wfesc-forgot-submit"
                            type="button"
                            class="wfesc-auth-button primary"
                        >
                            إرسال رابط الاستعادة
                        </button>

                        <button
                            id="wfesc-forgot-back"
                            type="button"
                            class="wfesc-auth-link"
                        >
                            العودة لتسجيل الدخول
                        </button>

                        <div
                            id="wfesc-forgot-message"
                            class="wfesc-auth-message"
                        ></div>

                    </div>

                </div>

                <div
                    id="wfesc-logged-account"
                    class="wfesc-auth-account"
                    style="display:none;"
                >

                    <div
                        class="wfesc-auth-profile wfesc-auth-glass"
                    >

                        <div
                            class="wfesc-auth-avatar-wrap"
                        >

                            <img
                                id="wfesc-logged-avatar"
                                class="wfesc-auth-avatar"
                                alt="صورة الحساب"
                            >

                            <div
                                id="wfesc-logged-avatar-fallback"
                                class="wfesc-auth-avatar-fallback"
                            >
                                W
                            </div>

                        </div>

                        <div
                            class="wfesc-auth-account-info"
                        >

                            <div
                                id="wfesc-logged-name"
                                class="wfesc-auth-account-name"
                            ></div>

                            <div
                                id="wfesc-logged-username"
                                class="wfesc-auth-account-username"
                            ></div>

                            <div
                                id="wfesc-logged-email"
                                class="wfesc-auth-account-email"
                            ></div>

                            <div
                                id="wfesc-logged-verified"
                                class="wfesc-auth-verified"
                            ></div>

                        </div>

                    </div>

                    <button
                        id="wfesc-profile-button"
                        type="button"
                        class="wfesc-auth-action wfesc-auth-glass"
                    >
                        <strong>
                            👤 الملف الشخصي
                        </strong>
                        <span>
                            تعديل اسم المستخدم والصورة والنبذة
                        </span>
                    </button>

                    <button
                        id="wfesc-change-password-button"
                        type="button"
                        class="wfesc-auth-action wfesc-auth-glass"
                    >
                        <strong>
                            🔐 تغيير كلمة المرور
                        </strong>
                        <span>
                            تحديث كلمة مرور الحساب
                        </span>
                    </button>

                    <button
                        id="wfesc-logout-button"
                        type="button"
                        class="wfesc-auth-action wfesc-auth-glass"
                    >
                        <strong>
                            ↪ تسجيل الخروج
                        </strong>
                        <span>
                            الخروج من الحساب الحالي
                        </span>
                    </button>

                    <button
                        id="wfesc-delete-button"
                        type="button"
                        class="wfesc-auth-action danger wfesc-auth-glass"
                    >
                        <strong>
                            🗑️ حذف الحساب
                        </strong>
                        <span>
                            طلب حذف الحساب
                        </span>
                    </button>

                </div>

                <div
                    id="wfesc-change-password-modal"
                    class="modal"
                >

                    <div class="modal-box">

                        <div class="modal-header">

                            <h3>
                                تغيير كلمة المرور
                            </h3>

                            <button
                                type="button"
                                class="close-modal"
                                data-close-modal
                            >
                                ×
                            </button>

                        </div>

                        <div class="form-group">

                            <label>
                                كلمة المرور الجديدة
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-new-password"
                                    class="form-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="new-password"
                                    placeholder="6 إلى 16 خانة"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-new-password"
                                >
                                    🙉
                                </button>

                            </div>

                        </div>

                        <div class="form-group">

                            <label>
                                تأكيد كلمة المرور
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-new-password-confirm"
                                    class="form-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="new-password"
                                    placeholder="أعد كتابة كلمة المرور"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-new-password-confirm"
                                >
                                    🙉
                                </button>

                            </div>

                        </div>

                        <div
                            id="wfesc-change-password-message"
                            class="wfesc-auth-message"
                        ></div>

                        <button
                            id="wfesc-change-password-submit"
                            type="button"
                            class="modal-action"
                        >
                            حفظ كلمة المرور
                        </button>

                    </div>

                </div>

                <div
                    id="wfesc-recovery-modal"
                    class="modal"
                >

                    <div class="modal-box">

                        <div class="modal-header">

                            <h3>
                                إعادة تعيين كلمة المرور
                            </h3>

                        </div>

                        <div class="form-group">

                            <label>
                                كلمة المرور الجديدة
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-recovery-password"
                                    class="form-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="new-password"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-recovery-password"
                                >
                                    🙉
                                </button>

                            </div>

                        </div>

                        <div class="form-group">

                            <label>
                                تأكيد كلمة المرور
                            </label>

                            <div
                                class="wfesc-auth-input-wrap"
                            >

                                <input
                                    id="wfesc-recovery-confirm"
                                    class="form-input"
                                    type="password"
                                    maxlength="16"
                                    autocomplete="new-password"
                                >

                                <button
                                    type="button"
                                    class="wfesc-auth-password-toggle"
                                    data-password-toggle="wfesc-recovery-confirm"
                                >
                                    🙉
                                </button>

                            </div>

                        </div>

                        <div
                            id="wfesc-recovery-message"
                            class="wfesc-auth-message"
                        ></div>

                        <button
                            id="wfesc-recovery-submit"
                            type="button"
                            class="modal-action"
                        >
                            حفظ كلمة المرور
                        </button>

                    </div>

                </div>

                <div
                    id="wfesc-delete-warning-modal"
                    class="modal"
                >

                    <div class="modal-box">

                        <div class="modal-header">

                            <h3>
                                حذف الحساب
                            </h3>

                            <button
                                type="button"
                                class="close-modal"
                                data-close-modal
                            >
                                ×
                            </button>

                        </div>

                        <div class="wfesc-delete-warning">

                            <div
                                class="wfesc-delete-warning-icon"
                            >
                                ⚠️
                            </div>

                            <div
                                class="wfesc-delete-warning-title"
                            >
                                هل أنت متأكد من خيارك لحذف الحساب؟
                            </div>

                            <div
                                class="wfesc-delete-warning-text"
                            >
                                سيتم حذف حسابك بشكل نهائي خلال أسبوع،
                                <strong>
                                    ويُحذف بالكامل خلال أسبوع.
                                </strong>
                            </div>

                        </div>

                        <button
                            id="wfesc-delete-first-confirm"
                            type="button"
                            class="wfesc-delete-confirm"
                        >
                            موافق على حذف الحساب
                        </button>

                        <button
                            type="button"
                            class="wfesc-delete-cancel"
                            data-close-modal
                        >
                            إلغاء
                        </button>

                    </div>

                </div>

                <div
                    id="wfesc-delete-final-modal"
                    class="modal"
                >

                    <div class="modal-box">

                        <div class="modal-header">

                            <h3>
                                تأكيد حذف الحساب
                            </h3>

                            <button
                                type="button"
                                class="close-modal"
                                data-close-modal
                            >
                                ×
                            </button>

                        </div>

                        <div
                            class="wfesc-delete-final"
                        >

                            <div
                                class="wfesc-delete-final-title"
                            >
                                متأكد من طلبك؟
                            </div>

                            <div
                                class="wfesc-delete-support"
                            >

                                إذا تواجه مشكلة وبسببها تريد حذف الحساب،
                                يمكنك التواصل مع الدعم قبل حذف حسابك.

                                <button
                                    id="wfesc-delete-support-button"
                                    type="button"
                                    class="wfesc-delete-support-button"
                                >
                                    💬 التواصل مع الدعم
                                </button>

                            </div>

                            <button
                                id="wfesc-delete-final-confirm"
                                type="button"
                                class="wfesc-delete-confirm"
                            >
                                تأكيد طلب حذف الحساب
                            </button>

                            <button
                                type="button"
                                class="wfesc-delete-cancel"
                                data-close-modal
                            >
                                العودة
                            </button>

                        </div>

                        <div
                            id="wfesc-delete-message"
                            class="wfesc-auth-message"
                        ></div>

                    </div>

                </div>

            </div>
        `;
    }

    /*
     * ============================================================
     * ELEMENTS
     * ============================================================
     */

    function getElements() {

        return {

            loading:
                qs("#wfesc-auth-loading"),

            verification:
                qs("#wfesc-email-verification"),

            guest:
                qs("#wfesc-auth-guest"),

            logged:
                qs("#wfesc-logged-account"),

            loginPanel:
                qs("#wfesc-login-panel"),

            registerPanel:
                qs("#wfesc-register-panel"),

            forgotPanel:
                qs("#wfesc-forgot-panel"),

            tabs:
                qsa("[data-auth-mode]"),

            loginEmail:
                qs("#wfesc-login-email"),

            loginEmailError:
                qs("#wfesc-login-email-error"),

            loginPassword:
                qs("#wfesc-login-password"),

            loginPasswordError:
                qs("#wfesc-login-password-error"),

            loginSubmit:
                qs("#wfesc-login-submit"),

            loginForgot:
                qs("#wfesc-login-forgot"),

            loginMessage:
                qs("#wfesc-login-message"),

            registerName:
                qs("#wfesc-register-name"),

            registerNameError:
                qs("#wfesc-register-name-error"),

            registerUsername:
                qs("#wfesc-register-username"),

            registerUsernameError:
                qs("#wfesc-register-username-error"),

            registerEmail:
                qs("#wfesc-register-email"),

            registerEmailError:
                qs("#wfesc-register-email-error"),

            registerPassword:
                qs("#wfesc-register-password"),

            registerPasswordError:
                qs("#wfesc-register-password-error"),

            registerConfirm:
                qs("#wfesc-register-confirm"),

            registerConfirmError:
                qs("#wfesc-register-confirm-error"),

            registerSubmit:
                qs("#wfesc-register-submit"),

            registerMessage:
                qs("#wfesc-register-message"),

            forgotEmail:
                qs("#wfesc-forgot-email"),

            forgotEmailError:
                qs("#wfesc-forgot-email-error"),

            forgotSubmit:
                qs("#wfesc-forgot-submit"),

            forgotBack:
                qs("#wfesc-forgot-back"),

            forgotMessage:
                qs("#wfesc-forgot-message"),

            loggedAvatar:
                qs("#wfesc-logged-avatar"),

            loggedAvatarFallback:
                qs("#wfesc-logged-avatar-fallback"),

            loggedName:
                qs("#wfesc-logged-name"),

            loggedUsername:
                qs("#wfesc-logged-username"),

            loggedEmail:
                qs("#wfesc-logged-email"),

            loggedVerified:
                qs("#wfesc-logged-verified"),

            profileButton:
                qs("#wfesc-profile-button"),

            changePasswordButton:
                qs("#wfesc-change-password-button"),

            logoutButton:
                qs("#wfesc-logout-button"),

            deleteButton:
                qs("#wfesc-delete-button"),

            changePasswordModal:
                qs("#wfesc-change-password-modal"),

            newPassword:
                qs("#wfesc-new-password"),

            newPasswordConfirm:
                qs("#wfesc-new-password-confirm"),

            changePasswordSubmit:
                qs("#wfesc-change-password-submit"),

            changePasswordMessage:
                qs("#wfesc-change-password-message"),

            recoveryModal:
                qs("#wfesc-recovery-modal"),

            recoveryPassword:
                qs("#wfesc-recovery-password"),

            recoveryConfirm:
                qs("#wfesc-recovery-confirm"),

            recoverySubmit:
                qs("#wfesc-recovery-submit"),

            recoveryMessage:
                qs("#wfesc-recovery-message"),

            deleteWarningModal:
                qs("#wfesc-delete-warning-modal"),

            deleteFirstConfirm:
                qs("#wfesc-delete-first-confirm"),

            deleteFinalModal:
                qs("#wfesc-delete-final-modal"),

            deleteFinalConfirm:
                qs("#wfesc-delete-final-confirm"),

            deleteSupportButton:
                qs("#wfesc-delete-support-button"),

            deleteMessage:
                qs("#wfesc-delete-message")
        };
    }

    let E = null;

    /*
     * ============================================================
     * MODE
     * ============================================================
     */

    function setMode(mode) {

        if (!E) {
            return;
        }

        E.loginPanel.classList.remove(
            "active"
        );

        E.registerPanel.classList.remove(
            "active"
        );

        E.forgotPanel.classList.remove(
            "active"
        );

        E.tabs.forEach(
            function (tab) {

                tab.classList.remove(
                    "active"
                );
            }
        );

        if (mode === "register") {

            E.registerPanel.classList.add(
                "active"
            );

            const tab =
                qs(
                    '[data-auth-mode="register"]'
                );

            if (tab) {
                tab.classList.add(
                    "active"
                );
            }

            return;
        }

        if (mode === "forgot") {

            E.forgotPanel.classList.add(
                "active"
            );

            return;
        }

        E.loginPanel.classList.add(
            "active"
        );

        const tab =
            qs(
                '[data-auth-mode="login"]'
            );

        if (tab) {
            tab.classList.add(
                "active"
            );
        }
    }

    /*
     * ============================================================
     * PASSWORD TOGGLES
     * ============================================================
     */

    function bindPasswordToggles() {

        qsa(
            "[data-password-toggle]"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.getAttribute(
                                "data-password-toggle"
                            );

                        const input =
                            document.getElementById(
                                id
                            );

                        if (!input) {
                            return;
                        }

                        if (
                            input.type ===
                            "password"
                        ) {

                            input.type =
                                "text";

                            button.textContent =
                                "🙈";

                        } else {

                            input.type =
                                "password";

                            button.textContent =
                                "🙉";
                        }
                    }
                );
            }
        );
    }

    /*
     * ============================================================
     * FIELD ERRORS
     * ============================================================
     */

    function fieldError(
        input,
        errorElement,
        text
    ) {

        if (input) {

            input.classList.add(
                "error"
            );

            shake(input);
        }

        if (errorElement) {

            errorElement.textContent =
                text || "";
        }
    }

    function clearFieldError(
        input,
        errorElement
    ) {

        if (input) {

            input.classList.remove(
                "error"
            );
        }

        if (errorElement) {

            errorElement.textContent =
                "";
        }
    }

    function clearLoginErrors() {

        clearFieldError(
            E.loginEmail,
            E.loginEmailError
        );

        clearFieldError(
            E.loginPassword,
            E.loginPasswordError
        );

        clearMessage(
            E.loginMessage
        );
    }

    function clearRegisterErrors() {

        clearFieldError(
            E.registerName,
            E.registerNameError
        );

        clearFieldError(
            E.registerUsername,
            E.registerUsernameError
        );

        clearFieldError(
            E.registerEmail,
            E.registerEmailError
        );

        clearFieldError(
            E.registerPassword,
            E.registerPasswordError
        );

        clearFieldError(
            E.registerConfirm,
            E.registerConfirmError
        );

        clearMessage(
            E.registerMessage
        );
    }

    /*
     * ============================================================
     * AUTOMATIC NAME / USERNAME
     * ============================================================
     */

    function getEmailName(email) {

        return safeText(email)
            .trim()
            .split("@")[0];
    }

    function autoFillFromEmail() {

        if (!E) {
            return;
        }

        const email =
            E.registerEmail.value
                .trim();

        if (
            !email ||
            !email.includes("@")
        ) {
            return;
        }

        const localPart =
            getEmailName(email);

        if (!localPart) {
            return;
        }

        if (
            !E.registerName.value
                .trim()
        ) {

            E.registerName.value =
                sanitizeName(
                    localPart
                );
        }

        if (
            !E.registerUsername.value
                .trim()
        ) {

            E.registerUsername.value =
                sanitizeUsername(
                    localPart
                );
        }
    }

    /*
     * ============================================================
     * SESSION DISPLAY
     * ============================================================
     */

    function showGuest() {

        if (!E) {
            return;
        }

        E.guest.style.display =
            "";

        E.logged.style.display =
            "none";
    }

    function showLoggedIn() {

        if (!E) {
            return;
        }

        E.guest.style.display =
            "none";

        E.logged.style.display =
            "";
    }

    function getDisplayName(
        user,
        profile
    ) {

        const value =
            profile?.full_name ||
            profile?.name ||
            profile?.display_name ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.user_metadata?.display_name ||
            profile?.username ||
            user?.email?.split("@")[0] ||
            "";

        return safeText(value)
            .trim()
            .slice(0, NAME_MAX);
    }

    function getUsername(
        user,
        profile
    ) {

        const value =
            profile?.username ||
            user?.user_metadata?.username ||
            "";

        return sanitizeUsername(
            value
        );
    }

    function renderAccount(
        user,
        profile
    ) {

        if (!E) {
            return;
        }

        if (
            !isRealUser(user)
        ) {

            currentUser = null;
            currentProfile = null;

            showGuest();

            return;
        }

        currentUser =
            user;

        currentProfile =
            profile || null;

        showLoggedIn();

        const name =
            getDisplayName(
                user,
                profile
            );

        const username =
            getUsername(
                user,
                profile
            );

        const email =
            user.email || "";

        E.loggedName.textContent =
            name || "حساب WFESC";

        E.loggedUsername.textContent =
            username
                ? "@" + username
                : "";

        E.loggedEmail.textContent =
            email;

        if (
            user.email_confirmed_at ||
            user.confirmed_at
        ) {

            E.loggedVerified.textContent =
                "✓ البريد الإلكتروني موثق";

        } else {

            E.loggedVerified.textContent =
                "البريد الإلكتروني غير موثق";
        }

        const avatar =
            profile?.avatar_url ||
            user?.user_metadata?.avatar_url ||
            "";

        if (avatar) {

            E.loggedAvatar.src =
                avatar;

            E.loggedAvatar.style.display =
                "block";

            E.loggedAvatarFallback.style.display =
                "none";

        } else {

            E.loggedAvatar.removeAttribute(
                "src"
            );

            E.loggedAvatar.style.display =
                "none";

            E.loggedAvatarFallback.style.display =
                "flex";

            E.loggedAvatarFallback.textContent =
                safeText(
                    name || "W"
                )
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "W";
        }
    }

    /*
     * ============================================================
     * SESSION EVENT BROADCAST
     * ============================================================
     */

    function broadcastAuthState(
        user,
        profile,
        eventName
    ) {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "WFESCAuthChanged",
                    {
                        detail: {
                            user:
                                user || null,

                            profile:
                                profile || null,

                            event:
                                eventName || null
                        }
                    }
                )
            );

        } catch (_) {}
    }

    /*
     * ============================================================
     * RESTORE SESSION
     * ============================================================
     */

    async function restoreSession() {

        if (!E) {
            return;
        }

        if (sessionRestoreInProgress) {
            return;
        }

        sessionRestoreInProgress = true;

        if (E.loading) {

            E.loading.classList.add(
                "show"
            );
        }

        try {

            const auth =
                getAuth();

            if (!auth) {

                throw new Error(
                    "WFESCSettingsAuth غير موجود."
                );
            }

            let user = null;
            let profile = null;

            /*
             * بعض الإصدارات قد تحتوي restoreSession.
             */

            if (
                typeof auth.restoreSession ===
                "function"
            ) {

                const result =
                    await auth.restoreSession();

                user =
                    extractUser(result);

                profile =
                    result?.profile ||
                    result?.data?.profile ||
                    null;
            }

            /*
             * المصدر الأساسي الحالي:
             * getSession()
             */

            if (
                !isRealUser(user) &&
                typeof auth.getSession ===
                "function"
            ) {

                const result =
                    await auth.getSession();

                const session =
                    result?.data?.session ||
                    result?.session ||
                    null;

                user =
                    session?.user ||
                    null;
            }

            /*
             * إذا لم يوجد User:
             * الحساب غير مسجل الدخول.
             */

            if (
                !isRealUser(user)
            ) {

                currentUser = null;
                currentProfile = null;

                renderAccount(
                    null,
                    null
                );

                broadcastAuthState(
                    null,
                    null,
                    "SIGNED_OUT"
                );

                return;
            }

            /*
             * جلب Profile للحساب الحالي.
             */

            if (
                !profile &&
                typeof auth.fetchProfile ===
                "function"
            ) {

                try {

                    profile =
                        await auth.fetchProfile(
                            user.id
                        );

                } catch (profileError) {

                    console.warn(
                        "WFESC: تعذر جلب Profile أثناء استعادة الجلسة.",
                        profileError
                    );

                    profile = null;
                }
            }

            currentUser =
                user;

            currentProfile =
                profile || null;

            renderAccount(
                currentUser,
                currentProfile
            );

            broadcastAuthState(
                currentUser,
                currentProfile,
                "SESSION_RESTORED"
            );

        } catch (error) {

            console.error(
                "WFESC Auth restore error:",
                error
            );

            currentUser = null;
            currentProfile = null;

            renderAccount(
                null,
                null
            );

            broadcastAuthState(
                null,
                null,
                "SESSION_ERROR"
            );

        } finally {

            sessionRestoreInProgress = false;

            if (E.loading) {

                E.loading.classList.remove(
                    "show"
                );
            }
        }
    }

    /*
     * ============================================================
     * CENTRAL AUTH STATE LISTENER
     * ============================================================
     */

    function bindCentralAuthListener() {

        if (authListenerBound) {
            return;
        }

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.onAuthStateChange !==
            "function"
        ) {
            return;
        }

        authListenerBound = true;

        try {

            const callback =
                async function (
                    event,
                    session,
                    user
                ) {

                    /*
                     * بعض wrappers قد ترسل:
                     *
                     * callback(user, profile)
                     *
                     * لذلك نحاول استخراج المستخدم
                     * بأكثر من شكل.
                     */

                    let nextUser =
                        null;

                    let nextProfile =
                        null;

                    if (
                        isRealUser(user)
                    ) {

                        nextUser =
                            user;

                    } else if (
                        isRealUser(session?.user)
                    ) {

                        nextUser =
                            session.user;

                    } else if (
                        isRealUser(session)
                    ) {

                        nextUser =
                            session;

                    } else if (
                        isRealUser(event)
                    ) {

                        nextUser =
                            event;
                    }

                    /*
                     * تسجيل الخروج.
                     */

                    if (
                        event ===
                            "SIGNED_OUT" ||
                        event ===
                            "SIGNED_OUT_GLOBAL" ||
                        !isRealUser(nextUser)
                    ) {

                        currentUser = null;
                        currentProfile = null;

                        renderAccount(
                            null,
                            null
                        );

                        closeAllModals();

                        broadcastAuthState(
                            null,
                            null,
                            event ||
                            "SIGNED_OUT"
                        );

                        return;
                    }

                    /*
                     * جلب Profile للمستخدم الجديد.
                     */

                    if (
                        typeof auth.fetchProfile ===
                        "function"
                    ) {

                        try {

                            nextProfile =
                                await auth.fetchProfile(
                                    nextUser.id
                                );

                        } catch (profileError) {

                            console.warn(
                                "WFESC: تعذر تحديث Profile بعد تغير الجلسة.",
                                profileError
                            );

                            nextProfile =
                                null;
                        }
                    }

                    currentUser =
                        nextUser;

                    currentProfile =
                        nextProfile;

                    renderAccount(
                        currentUser,
                        currentProfile
                    );

                    broadcastAuthState(
                        currentUser,
                        currentProfile,
                        event ||
                        "SIGNED_IN"
                    );
                };

            const subscription =
                auth.onAuthStateChange(
                    callback
                );

            /*
             * دعم أكثر من شكل لإرجاع subscription.
             */

            if (
                subscription?.data?.subscription
            ) {

                authSubscription =
                    subscription
                        .data
                        .subscription;

            } else if (
                subscription?.subscription
            ) {

                authSubscription =
                    subscription.subscription;

            } else if (
                typeof subscription?.unsubscribe ===
                "function"
            ) {

                authSubscription =
                    subscription;
            }

        } catch (error) {

            console.error(
                "WFESC auth listener error:",
                error
            );

            authListenerBound = false;
        }
    }

    /*
     * ============================================================
     * LOGIN
     * ============================================================
     */

    async function login() {

        clearLoginErrors();

        const email =
            E.loginEmail.value
                .trim();

        const password =
            E.loginPassword.value;

        if (!validEmail(email)) {

            fieldError(
                E.loginEmail,
                E.loginEmailError,
                "يرجى إدخال بريد إلكتروني صحيح."
            );

            return;
        }

        if (!validPassword(password)) {

            fieldError(
                E.loginPassword,
                E.loginPasswordError,
                "كلمة المرور يجب أن تكون من 6 إلى 16 خانة."
            );

            return;
        }

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.signIn !==
            "function"
        ) {

            const error =
                new Error(
                    "دالة signIn غير موجودة في settings-auth.js."
                );

            setMessage(
                E.loginMessage,
                getErrorMessage(error),
                "error"
            );

            return;
        }

        setButtonLoading(
            E.loginSubmit,
            true,
            "جارٍ التحقق..."
        );

        try {

            const result =
                await auth.signIn(
                    email,
                    password
                );

            if (
                result?.error
            ) {

                throw result.error;
            }

            const user =
                extractUser(result);

            if (
                !isRealUser(user)
            ) {

                throw new Error(
                    "تعذر التحقق من بيانات تسجيل الدخول."
                );
            }

            currentUser =
                user;

            currentProfile =
                null;

            if (
                typeof auth.fetchProfile ===
                "function"
            ) {

                try {

                    currentProfile =
                        await auth.fetchProfile(
                            user.id
                        );

                } catch (profileError) {

                    console.warn(
                        "WFESC: تعذر جلب Profile بعد نجاح تسجيل الدخول.",
                        profileError
                    );

                    currentProfile =
                        null;
                }
            }

            renderAccount(
                currentUser,
                currentProfile
            );

            broadcastAuthState(
                currentUser,
                currentProfile,
                "SIGNED_IN"
            );

            showStatus(
                "تم تسجيل الدخول بنجاح.",
                "success"
            );

            E.loginPassword.value =
                "";

        } catch (error) {

            console.error(
                "WFESC login error:",
                error
            );

            const message =
                getErrorMessage(
                    error
                );

            currentUser = null;
            currentProfile = null;

            showGuest();

            if (
                isWrongPasswordError(error) ||
                message === "كلمة المرور خطأ."
            ) {

                setMessage(
                    E.loginMessage,
                    "كلمة المرور خطأ.",
                    "error"
                );

                fieldError(
                    E.loginPassword,
                    E.loginPasswordError,
                    "كلمة المرور خطأ."
                );

            } else {

                setMessage(
                    E.loginMessage,
                    message,
                    "error"
                );

                showStatus(
                    message,
                    "error"
                );
            }

        } finally {

            setButtonLoading(
                E.loginSubmit,
                false
            );
        }
    }

    /*
     * ============================================================
     * REGISTER
     * ============================================================
     */

    async function register() {

        if (
            !E ||
            !E.registerSubmit
        ) {
            return;
        }

        if (
            E.registerSubmit.disabled
        ) {
            return;
        }

        clearRegisterErrors();

        const name =
            sanitizeName(
                E.registerName.value
            );

        const username =
            sanitizeUsername(
                E.registerUsername.value
            );

        const email =
            E.registerEmail.value
                .trim();

        const password =
            E.registerPassword.value;

        const confirm =
            E.registerConfirm.value;

        E.registerName.value =
            name;

        E.registerUsername.value =
            username;

        let valid = true;

        if (!validName(name)) {

            fieldError(
                E.registerName,
                E.registerNameError,
                "يرجى إدخال اسم من 2 إلى 15 حرفًا."
            );

            valid = false;
        }

        if (!validUsername(username)) {

            fieldError(
                E.registerUsername,
                E.registerUsernameError,
                "اسم المستخدم يجب أن يكون من 3 إلى 9 أحرف إنجليزية صغيرة أو أرقام فقط."
            );

            valid = false;
        }

        if (!validEmail(email)) {

            fieldError(
                E.registerEmail,
                E.registerEmailError,
                "يرجى إدخال بريد إلكتروني صحيح."
            );

            valid = false;
        }

        if (!validPassword(password)) {

            fieldError(
                E.registerPassword,
                E.registerPasswordError,
                "كلمة المرور يجب أن تكون من 6 إلى 16 خانة."
            );

            valid = false;
        }

        if (
            password !==
            confirm
        ) {

            fieldError(
                E.registerPassword,
                E.registerPasswordError,
                "كلمة المرور غير متطابقة"
            );

            fieldError(
                E.registerConfirm,
                E.registerConfirmError,
                "كلمة المرور غير متطابقة"
            );

            shakeMany([
                E.registerPassword,
                E.registerConfirm
            ]);

            valid = false;
        }

        if (!valid) {
            return;
        }

        const auth =
            getAuth();

        if (!auth) {

            setMessage(
                E.registerMessage,
                "تعذر الوصول إلى نظام الحساب.",
                "error"
            );

            showStatus(
                "تعذر الوصول إلى نظام الحساب.",
                "error"
            );

            return;
        }

        if (
            typeof auth.signUp !==
            "function"
        ) {

            setMessage(
                E.registerMessage,
                "دالة إنشاء الحساب غير موجودة في settings-auth.js.",
                "error"
            );

            showStatus(
                "دالة إنشاء الحساب غير موجودة.",
                "error"
            );

            return;
        }

        setButtonLoading(
            E.registerSubmit,
            true,
            "جارٍ التحقق..."
        );

        try {

            if (
                typeof auth.usernameExists ===
                "function"
            ) {

                let usernameCheck;

                try {

                    usernameCheck =
                        await auth.usernameExists(
                            username
                        );

                } catch (usernameCheckError) {

                    console.error(
                        "WFESC username check exception:",
                        usernameCheckError
                    );

                    throw usernameCheckError;
                }

                const checkError =
                    usernameCheck?.error ||
                    usernameCheck?.data?.error ||
                    null;

                if (checkError) {
                    throw checkError;
                }

                const usernameExistsValue =
                    usernameCheck?.exists === true ||
                    usernameCheck?.data?.exists === true ||
                    usernameCheck?.taken === true ||
                    usernameCheck?.data?.taken === true;

                if (
                    usernameExistsValue
                ) {

                    const usernameError =
                        new Error(
                            "اسم المستخدم مأخوذ مسبقًا"
                        );

                    usernameError.code =
                        "USERNAME_ALREADY_EXISTS";

                    usernameError.status =
                        409;

                    usernameError.statusCode =
                        409;

                    usernameError.field =
                        "username";

                    throw usernameError;
                }
            }

            const result =
                await auth.signUp(
                    name,
                    email,
                    password,
                    username
                );

            if (
                result?.error
            ) {

                throw result.error;
            }

            if (
                result?.data?.error
            ) {

                throw result.data.error;
            }

            if (
                isUsernameTakenError(
                    result
                ) ||
                isUsernameTakenError(
                    result?.data
                ) ||
                isUsernameTakenError(
                    result?.error
                )
            ) {

                const usernameError =
                    new Error(
                        "اسم المستخدم مأخوذ مسبقًا"
                    );

                usernameError.code =
                    "USERNAME_ALREADY_EXISTS";

                throw usernameError;
            }

            const user =
                extractUser(result);

            if (
                user &&
                (
                    user.email_confirmed_at ||
                    user.confirmed_at
                )
            ) {

                currentUser =
                    user;

                currentProfile =
                    null;

                if (
                    typeof auth.fetchProfile ===
                    "function"
                ) {

                    try {

                        currentProfile =
                            await auth.fetchProfile(
                                user.id
                            );

                    } catch (_) {

                        currentProfile =
                            null;
                    }
                }

                renderAccount(
                    currentUser,
                    currentProfile
                );

                broadcastAuthState(
                    currentUser,
                    currentProfile,
                    "SIGNED_IN"
                );

                showStatus(
                    "تم إنشاء الحساب وتسجيل الدخول بنجاح.",
                    "success"
                );

                return;
            }

            showVerificationMessage();

            setMessage(
                E.registerMessage,
                "تم إنشاء الحساب. تحقق من بريدك الإلكتروني أو مجلد الرسائل غير المرغوب فيها.",
                "success"
            );

        } catch (error) {

            console.error(
                "WFESC registration error:",
                error
            );

            if (
                isUsernameTakenError(error)
            ) {

                E.registerUsername.value =
                    username;

                fieldError(
                    E.registerUsername,
                    E.registerUsernameError,
                    "اسم المستخدم مأخوذ مسبقًا"
                );

                setMessage(
                    E.registerMessage,
                    "اسم المستخدم مأخوذ مسبقًا",
                    "error"
                );

                showStatus(
                    "اسم المستخدم مأخوذ مسبقًا",
                    "error"
                );

                setMode(
                    "register"
                );

                return;
            }

            if (
                isExistingEmailError(error)
            ) {

                fieldError(
                    E.registerEmail,
                    E.registerEmailError,
                    "هذا البريد الإلكتروني مستخدم مسبقًا، يرجى تسجيل الدخول."
                );

                setMessage(
                    E.registerMessage,
                    "أنت تملك حساب بالفعل",
                    "error"
                );

                showStatus(
                    "أنت تملك حساب بالفعل",
                    "error"
                );

                setMode(
                    "register"
                );

                return;
            }

            const errorCode =
                safeText(
                    error?.code
                ).toLowerCase();

            const errorMessage =
                safeText(
                    error?.message ||
                    error?.error_description ||
                    error?.msg ||
                    ""
                ).toLowerCase();

            if (
                errorCode ===
                    "username_check_failed" ||
                errorCode ===
                    "username_check_error"
            ) {

                setMessage(
                    E.registerMessage,
                    "تعذر التحقق من توفر اسم المستخدم حاليًا. حاول مرة أخرى.",
                    "error"
                );

                showStatus(
                    "تعذر التحقق من توفر اسم المستخدم حاليًا.",
                    "error"
                );

                return;
            }

            if (
                errorMessage.includes("username") &&
                (
                    errorMessage.includes("duplicate") ||
                    errorMessage.includes("already") ||
                    errorMessage.includes("unique") ||
                    errorMessage.includes("taken")
                )
            ) {

                E.registerUsername.value =
                    username;

                fieldError(
                    E.registerUsername,
                    E.registerUsernameError,
                    "اسم المستخدم مأخوذ مسبقًا"
                );

                setMessage(
                    E.registerMessage,
                    "اسم المستخدم مأخوذ مسبقًا",
                    "error"
                );

                showStatus(
                    "اسم المستخدم مأخوذ مسبقًا",
                    "error"
                );

                return;
            }

            const message =
                getErrorMessage(
                    error
                );

            setMessage(
                E.registerMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

        } finally {

            setButtonLoading(
                E.registerSubmit,
                false
            );
        }
    }

    /*
     * ============================================================
     * EMAIL VERIFICATION
     * ============================================================
     */

    function showVerificationMessage() {

        if (!E) {
            return;
        }

        E.verification.textContent =
            "✓ تم إنشاء الحساب. تحقق من بريدك الإلكتروني أو الرسائل غير المرغوب فيها. ستختفي هذه الرسالة تلقائيًا.";

        E.verification.classList.add(
            "show"
        );

        clearTimeout(
            verificationTimer
        );

        verificationTimer =
            setTimeout(
                function () {

                    E.verification.classList.remove(
                        "show"
                    );

                },
                5000
            );
    }

    /*
     * ============================================================
     * PASSWORD RESET
     * ============================================================
     */

    async function sendReset() {

        clearFieldError(
            E.forgotEmail,
            E.forgotEmailError
        );

        clearMessage(
            E.forgotMessage
        );

        const email =
            E.forgotEmail.value
                .trim();

        if (!validEmail(email)) {

            fieldError(
                E.forgotEmail,
                E.forgotEmailError,
                "يرجى إدخال بريد إلكتروني صحيح."
            );

            return;
        }

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.resetPassword !==
            "function"
        ) {

            setMessage(
                E.forgotMessage,
                "تعذر الوصول إلى نظام استعادة كلمة المرور.",
                "error"
            );

            return;
        }

        setButtonLoading(
            E.forgotSubmit,
            true,
            "جارٍ الإرسال..."
        );

        try {

            await auth.resetPassword(
                email
            );

            setMessage(
                E.forgotMessage,
                "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
                "success"
            );

            showStatus(
                "تم إرسال رابط إعادة التعيين.",
                "success"
            );

        } catch (error) {

            console.error(
                "WFESC reset error:",
                error
            );

            const message =
                getErrorMessage(
                    error
                );

            setMessage(
                E.forgotMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

        } finally {

            setButtonLoading(
                E.forgotSubmit,
                false
            );
        }
    }

    /*
     * ============================================================
     * CHANGE PASSWORD
     * ============================================================
     */

    function openChangePassword() {

        if (
            !isRealUser(currentUser)
        ) {
            showStatus(
                "يجب تسجيل الدخول أولًا.",
                "error"
            );
            return;
        }

        E.newPassword.value =
            "";

        E.newPasswordConfirm.value =
            "";

        clearMessage(
            E.changePasswordMessage
        );

        openModal(
            E.changePasswordModal
        );
    }

    async function changePassword() {

        clearMessage(
            E.changePasswordMessage
        );

        const password =
            E.newPassword.value;

        const confirm =
            E.newPasswordConfirm.value;

        if (!validPassword(password)) {

            setMessage(
                E.changePasswordMessage,
                "كلمة المرور يجب أن تكون من 6 إلى 16 خانة.",
                "error"
            );

            shake(
                E.newPassword
            );

            return;
        }

        if (
            password !==
            confirm
        ) {

            setMessage(
                E.changePasswordMessage,
                "كلمة المرور غير متطابقة.",
                "error"
            );

            shakeMany([
                E.newPassword,
                E.newPasswordConfirm
            ]);

            return;
        }

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.updatePassword !==
            "function"
        ) {

            setMessage(
                E.changePasswordMessage,
                "تعذر الوصول إلى نظام تغيير كلمة المرور.",
                "error"
            );

            return;
        }

        setButtonLoading(
            E.changePasswordSubmit,
            true,
            "جارٍ الحفظ..."
        );

        try {

            await auth.updatePassword(
                password
            );

            setMessage(
                E.changePasswordMessage,
                "تم تغيير كلمة المرور بنجاح.",
                "success"
            );

            showStatus(
                "تم تغيير كلمة المرور بنجاح.",
                "success"
            );

            setTimeout(
                function () {

                    closeModal(
                        E.changePasswordModal
                    );

                },
                900
            );

        } catch (error) {

            console.error(
                "WFESC change password error:",
                error
            );

            const message =
                getErrorMessage(
                    error
                );

            setMessage(
                E.changePasswordMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

        } finally {

            setButtonLoading(
                E.changePasswordSubmit,
                false
            );
        }
    }

    /*
     * ============================================================
     * RECOVERY
     * ============================================================
     */

    async function recoveryPassword() {

        clearMessage(
            E.recoveryMessage
        );

        const password =
            E.recoveryPassword.value;

        const confirm =
            E.recoveryConfirm.value;

        if (!validPassword(password)) {

            setMessage(
                E.recoveryMessage,
                "كلمة المرور يجب أن تكون من 6 إلى 16 خانة.",
                "error"
            );

            shake(
                E.recoveryPassword
            );

            return;
        }

        if (
            password !==
            confirm
        ) {

            setMessage(
                E.recoveryMessage,
                "كلمة المرور غير متطابقة.",
                "error"
            );

            shakeMany([
                E.recoveryPassword,
                E.recoveryConfirm
            ]);

            return;
        }

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.updatePassword !==
            "function"
        ) {

            setMessage(
                E.recoveryMessage,
                "تعذر تغيير كلمة المرور.",
                "error"
            );

            return;
        }

        setButtonLoading(
            E.recoverySubmit,
            true,
            "جارٍ الحفظ..."
        );

        try {

            await auth.updatePassword(
                password
            );

            setMessage(
                E.recoveryMessage,
                "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
                "success"
            );

            showStatus(
                "تم تغيير كلمة المرور.",
                "success"
            );

            setTimeout(
                async function () {

                    closeModal(
                        E.recoveryModal
                    );

                    if (
                        typeof auth.signOut ===
                        "function"
                    ) {

                        try {
                            await auth.signOut();
                        } catch (_) {}
                    }

                    currentUser = null;
                    currentProfile = null;

                    renderAccount(
                        null,
                        null
                    );

                    broadcastAuthState(
                        null,
                        null,
                        "SIGNED_OUT"
                    );

                    setMode(
                        "login"
                    );

                },
                1000
            );

        } catch (error) {

            console.error(
                "WFESC recovery password error:",
                error
            );

            const message =
                getErrorMessage(
                    error
                );

            setMessage(
                E.recoveryMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

        } finally {

            setButtonLoading(
                E.recoverySubmit,
                false
            );
        }
    }

    /*
     * ============================================================
     * LOGOUT
     * ============================================================
     */

    async function logout() {

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.signOut !==
            "function"
        ) {

            showStatus(
                "تعذر تسجيل الخروج.",
                "error"
            );

            return;
        }

        if (
            E.logoutButton.disabled
        ) {
            return;
        }

        setButtonLoading(
            E.logoutButton,
            true,
            "جارٍ تسجيل الخروج..."
        );

        try {

            await auth.signOut();

            /*
             * نمسح الحالة المحلية فورًا.
             */

            currentUser = null;
            currentProfile = null;

            renderAccount(
                null,
                null
            );

            closeAllModals();

            setMode(
                "login"
            );

            /*
             * إشعار بقية أنظمة WFESC.
             */

            broadcastAuthState(
                null,
                null,
                "SIGNED_OUT"
            );

            showStatus(
                "تم تسجيل الخروج بنجاح.",
                "success"
            );

        } catch (error) {

            console.error(
                "WFESC logout error:",
                error
            );

            showStatus(
                getErrorMessage(error),
                "error"
            );

        } finally {

            setButtonLoading(
                E.logoutButton,
                false
            );
        }
    }

    /*
     * ============================================================
     * DELETE
     * ============================================================
     */

    function openDeleteWarning() {

        if (
            !isRealUser(currentUser)
        ) {

            showStatus(
                "يجب تسجيل الدخول أولًا.",
                "error"
            );

            return;
        }

        clearMessage(
            E.deleteMessage
        );

        closeModal(
            E.deleteFinalModal
        );

        openModal(
            E.deleteWarningModal
        );
    }

    function openDeleteFinal() {

        closeModal(
            E.deleteWarningModal
        );

        clearMessage(
            E.deleteMessage
        );

        openModal(
            E.deleteFinalModal
        );
    }

    async function executeDeleteAccount() {

        clearMessage(
            E.deleteMessage
        );

        const auth =
            getAuth();

        if (
            !auth ||
            typeof auth.deleteAccount !==
            "function"
        ) {

            setMessage(
                E.deleteMessage,
                "تعذر تنفيذ حذف الحساب حاليًا.",
                "error"
            );

            showStatus(
                "تعذر تنفيذ حذف الحساب حاليًا.",
                "error"
            );

            return;
        }

        setButtonLoading(
            E.deleteFinalConfirm,
            true,
            "جارٍ إرسال طلب الحذف..."
        );

        try {

            await auth.deleteAccount();

            currentUser = null;
            currentProfile = null;

            closeAllModals();

            renderAccount(
                null,
                null
            );

            broadcastAuthState(
                null,
                null,
                "ACCOUNT_DELETE_REQUESTED"
            );

            showStatus(
                "تم إرسال طلب حذف الحساب بنجاح.",
                "success"
            );

        } catch (error) {

            console.error(
                "WFESC delete account error:",
                error
            );

            const message =
                getErrorMessage(
                    error
                );

            setMessage(
                E.deleteMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

        } finally {

            setButtonLoading(
                E.deleteFinalConfirm,
                false
            );
        }
    }

    /*
     * ============================================================
     * SUPPORT
     * ============================================================
     */

    function openSupport() {

        window.location.href =
            "messages.html";
    }

    /*
     * ============================================================
     * PROFILE
     * ============================================================
     */

    function openProfile() {

        if (
            !isRealUser(currentUser)
        ) {

            showStatus(
                "يجب تسجيل الدخول أولًا لفتح الملف الشخصي.",
                "error"
            );

            return;
        }

        window.location.href =
            "profile.html";
    }

    /*
     * ============================================================
     * RECOVERY URL
     * ============================================================
     */

    async function handleRecoveryURL() {

        const search =
            window.location.search;

        const hash =
            window.location.hash;

        const isRecovery =
            /type=recovery/i.test(
                search + hash
            ) ||
            /access_token=/i.test(
                search + hash
            ) ||
            /refresh_token=/i.test(
                search + hash
            );

        if (!isRecovery) {
            return;
        }

        const auth =
            getAuth();

        try {

            if (
                auth &&
                typeof auth.restoreSession ===
                "function"
            ) {

                await auth.restoreSession();
            }

            openModal(
                E.recoveryModal
            );

        } catch (error) {

            console.error(
                "WFESC recovery URL error:",
                error
            );

            showStatus(
                getErrorMessage(error),
                "error"
            );
        }
    }

    /*
     * ============================================================
     * AUTH EVENTS
     * ============================================================
     */

    function bindAuthEvents() {

        /*
         * حدث داخلي/عام تستخدمه بقية صفحات WFESC.
         */

        window.addEventListener(
            "WFESCAuthChanged",
            function (event) {

                const detail =
                    event.detail || {};

                const user =
                    detail.user ||
                    null;

                const profile =
                    detail.profile ||
                    null;

                if (
                    isRealUser(user)
                ) {

                    renderAccount(
                        user,
                        profile
                    );

                } else {

                    renderAccount(
                        null,
                        null
                    );
                }
            }
        );

        window.addEventListener(
            "WFESCEmailVerified",
            function () {

                showVerificationMessage();

                showStatus(
                    "تم التحقق من البريد الإلكتروني.",
                    "success"
                );

                restoreSession();
            }
        );

        window.addEventListener(
            "WFESCLiquidGlassChanged",
            function (event) {

                const enabled =
                    event.detail?.enabled;

                if (
                    typeof enabled ===
                    "boolean"
                ) {

                    liquidGlassEnabled =
                        enabled;

                    applyLiquidGlass();
                }
            }
        );

        /*
         * ربط الجلسة المركزية.
         */

        bindCentralAuthListener();
    }

    /*
     * ============================================================
     * EVENTS
     * ============================================================
     */

    function bindEvents() {

        E.tabs.forEach(
            function (tab) {

                tab.addEventListener(
                    "click",
                    function () {

                        const mode =
                            tab.getAttribute(
                                "data-auth-mode"
                            );

                        if (
                            mode ===
                            "register"
                        ) {

                            setMode(
                                "register"
                            );

                            clearLoginErrors();

                        } else {

                            setMode(
                                "login"
                            );

                            clearRegisterErrors();
                        }
                    }
                );
            }
        );

        E.loginSubmit.addEventListener(
            "click",
            login
        );

        E.loginForgot.addEventListener(
            "click",
            function () {

                const email =
                    E.loginEmail.value
                        .trim();

                E.forgotEmail.value =
                    email;

                setMode(
                    "forgot"
                );
            }
        );

        E.registerSubmit.addEventListener(
            "click",
            function (event) {

                if (event) {
                    event.preventDefault();
                }

                register();
            }
        );

        E.forgotBack.addEventListener(
            "click",
            function () {

                setMode(
                    "login"
                );
            }
        );

        E.forgotSubmit.addEventListener(
            "click",
            sendReset
        );

        E.profileButton.addEventListener(
            "click",
            openProfile
        );

        E.changePasswordButton.addEventListener(
            "click",
            openChangePassword
        );

        E.changePasswordSubmit.addEventListener(
            "click",
            changePassword
        );

        E.logoutButton.addEventListener(
            "click",
            logout
        );

        E.deleteButton.addEventListener(
            "click",
            openDeleteWarning
        );

        E.deleteFirstConfirm.addEventListener(
            "click",
            openDeleteFinal
        );

        E.deleteFinalConfirm.addEventListener(
            "click",
            executeDeleteAccount
        );

        E.deleteSupportButton.addEventListener(
            "click",
            openSupport
        );

        E.recoverySubmit.addEventListener(
            "click",
            recoveryPassword
        );

        qsa(
            "[data-close-modal]"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    closeAllModals
                );
            }
        );

        [
            E.changePasswordModal,
            E.recoveryModal,
            E.deleteWarningModal,
            E.deleteFinalModal
        ].forEach(
            function (modal) {

                if (!modal) {
                    return;
                }

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModal(
                                modal
                            );
                        }
                    }
                );
            }
        );

        /*
         * ========================================================
         * USERNAME
         * ========================================================
         */

        E.registerUsername.addEventListener(
            "input",
            function () {

                const original =
                    E.registerUsername.value;

                const cleaned =
                    sanitizeUsername(
                        original
                    );

                if (
                    original !==
                    cleaned
                ) {

                    E.registerUsername.value =
                        cleaned;

                    fieldError(
                        E.registerUsername,
                        E.registerUsernameError,
                        "اسم المستخدم يقبل الأحرف الإنجليزية الصغيرة والأرقام فقط."
                    );

                } else if (
                    validUsername(cleaned)
                ) {

                    clearFieldError(
                        E.registerUsername,
                        E.registerUsernameError
                    );
                }
            }
        );

        E.registerName.addEventListener(
            "input",
            function () {

                const value =
                    E.registerName.value;

                if (
                    value.length >
                    NAME_MAX
                ) {

                    E.registerName.value =
                        value.slice(
                            0,
                            NAME_MAX
                        );
                }

                if (
                    E.registerName.value
                        .trim()
                        .length >= 2
                ) {

                    clearFieldError(
                        E.registerName,
                        E.registerNameError
                    );
                }
            }
        );

        E.registerEmail.addEventListener(
            "input",
            function () {

                autoFillFromEmail();

                if (
                    validEmail(
                        E.registerEmail.value
                            .trim()
                    )
                ) {

                    clearFieldError(
                        E.registerEmail,
                        E.registerEmailError
                    );
                }
            }
        );

        E.registerPassword.addEventListener(
            "input",
            function () {

                if (
                    E.registerConfirm.value &&
                    E.registerPassword.value ===
                    E.registerConfirm.value
                ) {

                    clearFieldError(
                        E.registerPassword,
                        E.registerPasswordError
                    );

                    clearFieldError(
                        E.registerConfirm,
                        E.registerConfirmError
                    );
                }
            }
        );

        E.registerConfirm.addEventListener(
            "input",
            function () {

                if (
                    E.registerPassword.value ===
                    E.registerConfirm.value
                ) {

                    clearFieldError(
                        E.registerPassword,
                        E.registerPasswordError
                    );

                    clearFieldError(
                        E.registerConfirm,
                        E.registerConfirmError
                    );

                } else if (
                    E.registerConfirm.value
                ) {

                    fieldError(
                        E.registerConfirm,
                        E.registerConfirmError,
                        "كلمة المرور غير متطابقة."
                    );
                }
            }
        );

        E.loginPassword.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    login();
                }
            }
        );

        E.loginEmail.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    login();
                }
            }
        );

        E.registerConfirm.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    register();
                }
            }
        );
    }

    /*
     * ============================================================
     * INIT
     * ============================================================
     */

    async function init() {

        if (initialized) {
            return;
        }

        initialized = true;

        if (!ensureRoot()) {
            return;
        }

        injectCSS();

        buildUI();

        E =
            getElements();

        liquidGlassEnabled =
            true;

        applyLiquidGlass();

        applyAnimationState();

        observeAnimationSetting();

        bindPasswordToggles();

        bindEvents();

        bindAuthEvents();

        setMode(
            "login"
        );

        /*
         * إظهار التحميل أثناء فحص الجلسة.
         */

        if (E.loading) {

            E.loading.classList.add(
                "show"
            );
        }

        await handleRecoveryURL();

        await restoreSession();
    }

    /*
     * ============================================================
     * START
     * ============================================================
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );

    } else {

        init();
    }

})();
