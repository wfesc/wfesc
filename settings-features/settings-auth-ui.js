(function () {
    "use strict";

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    window.WFESCSettingsAuthUI = true;

    /*
     * ============================================================
     * WFESC SETTINGS AUTH UI
     * واجهة الحساب داخل صفحة الإعدادات
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

    const PASSWORD_MIN = 6;
    const PASSWORD_MAX = 16;

    let root = null;
    let currentUser = null;
    let currentProfile = null;
    let initialized = false;

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

    function sanitizeUsername(value) {
        return safeText(value)
            .replace(/[^A-Za-z0-9]/g, "")
            .slice(0, USERNAME_MAX);
    }

    function validUsername(value) {
        return new RegExp(
            "^[A-Za-z0-9]{" +
            USERNAME_MIN +
            "," +
            USERNAME_MAX +
            "}$"
        ).test(value);
    }

    function validEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(safeText(value).trim());
    }

    function validPassword(value) {
        return (
            typeof value === "string" &&
            value.length >= PASSWORD_MIN &&
            value.length <= PASSWORD_MAX
        );
    }

    function getErrorMessage(error) {
        if (!error) {
            return "حدث خطأ غير معروف.";
        }

        if (typeof error === "string") {
            return error;
        }

        return (
            error.message ||
            error.error_description ||
            error.msg ||
            "حدث خطأ غير معروف."
        );
    }

    function shake(element) {
        if (!element) return;

        element.classList.remove(
            "wfesc-auth-shake"
        );

        void element.offsetWidth;

        element.classList.add(
            "wfesc-auth-shake"
        );

        setTimeout(function () {
            element.classList.remove(
                "wfesc-auth-shake"
            );
        }, 450);
    }

    function shakeMany(elements) {
        elements.forEach(shake);
    }

    function setMessage(element, text, type) {
        if (!element) return;

        element.textContent = text || "";

        element.className =
            "wfesc-auth-message " +
            (type || "");
    }

    function clearMessage(element) {
        if (!element) return;

        element.textContent = "";
        element.className =
            "wfesc-auth-message";
    }

    function setButtonLoading(button, loading, text) {
        if (!button) return;

        if (loading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled = true;
            button.textContent =
                text || "جارٍ التنفيذ...";
        } else {
            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                button.textContent;

            delete button.dataset.originalText;
        }
    }

    function showStatus(text, type) {
        let status =
            document.getElementById(
                "wfesc-auth-status"
            );

        if (!status) {
            status = document.createElement("div");

            status.id =
                "wfesc-auth-status";

            status.className =
                "settings-status";

            document.body.appendChild(status);
        }

        status.textContent = text || "";

        status.classList.remove(
            "show",
            "error",
            "success"
        );

        if (type) {
            status.classList.add(type);
        }

        void status.offsetWidth;

        status.classList.add("show");

        clearTimeout(
            status._wfescTimer
        );

        status._wfescTimer =
            setTimeout(function () {
                status.classList.remove(
                    "show"
                );
            }, 4500);
    }

    function closeAllModals() {
        qsa(".modal").forEach(function (modal) {
            modal.classList.remove("show");
        });
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
            document.createElement("style");

        style.id =
            "wfesc-settings-auth-ui-css";

        style.textContent = `
            #settingsAccountApp {
                width: 100%;
            }

            .wfesc-auth-shell {
                width: 100%;
            }

            .wfesc-auth-tabs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 15px;
            }

            .wfesc-auth-tab {
                min-height: 45px;
                border: 1px solid #292929;
                border-radius: 13px;
                background: #171717;
                color: #999;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: .2s;
            }

            .wfesc-auth-tab.active {
                background: #eee;
                color: #050505;
                border-color: #eee;
            }

            .wfesc-auth-panel {
                display: none;
            }

            .wfesc-auth-panel.active {
                display: block;
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
                border-radius: 13px;
                border: 1px solid #292929;
                outline: none;
                background: #181818;
                color: #fff;
                padding: 0 13px;
                font-size: 14px;
                transition: .2s;
            }

            .wfesc-auth-input:focus {
                border-color: #777;
            }

            .wfesc-auth-input.error {
                border-color: #a84b4b;
            }

            .wfesc-auth-password-toggle {
                position: absolute;
                left: 3px;
                top: 3px;
                width: 40px;
                height: 40px;
                border: 0;
                background: transparent;
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
                border-radius: 13px;
                border: 1px solid #292929;
                background: #171717;
                color: #eee;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: .2s;
                margin-top: 5px;
            }

            .wfesc-auth-button.primary {
                background: #eee;
                color: #050505;
                border-color: #eee;
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
                padding: 2px 0;
            }

            .wfesc-auth-profile {
                display: flex;
                align-items: center;
                gap: 13px;
                margin-bottom: 15px;
            }

            .wfesc-auth-avatar-wrap {
                width: 62px;
                height: 62px;
                min-width: 62px;
                border-radius: 50%;
                overflow: hidden;
                border: 1px solid #303030;
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
                border: 1px solid #292929;
                border-radius: 13px;
                background: #171717;
                color: #eee;
                text-align: right;
                cursor: pointer;
                margin-top: 8px;
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

            .wfesc-auth-action.danger {
                color: #df7777;
            }

            .wfesc-auth-verification {
                display: none;
                padding: 12px;
                margin-bottom: 13px;
                border: 1px solid #303030;
                border-radius: 13px;
                background: #171717;
                color: #aaa;
                text-align: center;
                font-size: 11px;
                line-height: 1.7;
                animation: wfescVerificationPulse 1s infinite;
            }

            .wfesc-auth-verification.show {
                display: block;
            }

            @keyframes wfescVerificationPulse {
                0%,100% {
                    opacity: 1;
                }
                50% {
                    opacity: .45;
                }
            }

            .wfesc-auth-loading {
                display: none;
                padding: 14px;
                text-align: center;
                color: #888;
                font-size: 12px;
            }

            .wfesc-auth-loading.show {
                display: block;
            }

            .wfesc-auth-shake {
                animation: wfescAuthShake .4s ease;
            }

            @keyframes wfescAuthShake {
                0%,100% {
                    transform: translateX(0);
                }
                20% {
                    transform: translateX(6px);
                }
                40% {
                    transform: translateX(-6px);
                }
                60% {
                    transform: translateX(4px);
                }
                80% {
                    transform: translateX(-3px);
                }
            }

            .wfesc-auth-debug {
                margin-top: 12px;
                padding: 10px;
                border-radius: 10px;
                background: #0d0d0d;
                border: 1px solid #242424;
                color: #666;
                font-size: 9px;
                line-height: 1.5;
                direction: ltr;
                text-align: left;
                word-break: break-word;
            }

            .wfesc-auth-modal-note {
                text-align: center;
                color: #777;
                font-size: 11px;
                line-height: 1.6;
                margin-top: 9px;
            }

            @media (max-width: 500px) {
                .wfesc-auth-tabs {
                    gap: 6px;
                }

                .wfesc-auth-input {
                    height: 49px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /*
     * ============================================================
     * BUILD UI
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

    function buildUI() {
        if (!root) return;

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
                            class="wfesc-auth-tab active"
                            data-auth-mode="login"
                        >
                            لدي حساب
                        </button>

                        <button
                            type="button"
                            class="wfesc-auth-tab"
                            data-auth-mode="register"
                        >
                            إنشاء حساب
                        </button>

                    </div>

                    <!-- LOGIN -->

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

                            <div class="wfesc-auth-input-wrap">

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

                    <!-- REGISTER -->

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
                                dir="ltr"
                                placeholder="ali12"
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

                            <div class="wfesc-auth-input-wrap">

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

                            <div class="wfesc-auth-input-wrap">

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

                    <!-- FORGOT -->

                    <div
                        id="wfesc-forgot-panel"
                        class="wfesc-auth-panel"
                    >

                        <div class="wfesc-auth-form-group">

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

                <!-- LOGGED -->

                <div
                    id="wfesc-logged-account"
                    class="wfesc-auth-account"
                    style="display:none;"
                >

                    <div class="wfesc-auth-profile">

                        <div class="wfesc-auth-avatar-wrap">

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

                        <div class="wfesc-auth-account-info">

                            <div
                                id="wfesc-logged-name"
                                class="wfesc-auth-account-name"
                            >
                                WFESC
                            </div>

                            <div
                                id="wfesc-logged-username"
                                class="wfesc-auth-account-username"
                            >
                                @WFESC
                            </div>

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
                        class="wfesc-auth-action"
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
                        class="wfesc-auth-action"
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
                        class="wfesc-auth-action"
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
                        class="wfesc-auth-action danger"
                    >
                        <strong>
                            🗑️ حذف الحساب
                        </strong>
                        <span>
                            حذف الحساب نهائيًا
                        </span>
                    </button>

                </div>

                <!-- CHANGE PASSWORD MODAL -->

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

                            <div class="wfesc-auth-input-wrap">

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

                            <div class="wfesc-auth-input-wrap">

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

                <!-- RECOVERY PASSWORD MODAL -->

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

                            <div class="wfesc-auth-input-wrap">

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

                            <div class="wfesc-auth-input-wrap">

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
                qs("#wfesc-recovery-message")
        };
    }

    let E = null;

    /*
     * ============================================================
     * MODE
     * ============================================================
     */

    function setMode(mode) {
        if (!E) return;

        E.loginPanel.classList.remove("active");
        E.registerPanel.classList.remove("active");
        E.forgotPanel.classList.remove("active");

        E.tabs.forEach(function (tab) {
            tab.classList.remove("active");
        });

        if (mode === "register") {
            E.registerPanel.classList.add("active");

            const tab =
                qs('[data-auth-mode="register"]');

            if (tab) {
                tab.classList.add("active");
            }

            return;
        }

        if (mode === "forgot") {
            E.forgotPanel.classList.add("active");
            return;
        }

        E.loginPanel.classList.add("active");

        const tab =
            qs('[data-auth-mode="login"]');

        if (tab) {
            tab.classList.add("active");
        }
    }

    /*
     * ============================================================
     * PASSWORD TOGGLE
     * ============================================================
     */

    function bindPasswordToggles() {
        qsa("[data-password-toggle]")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.getAttribute(
                                "data-password-toggle"
                            );

                        const input =
                            document.getElementById(id);

                        if (!input) return;

                        if (
                            input.type ===
                            "password"
                        ) {
                            input.type = "text";
                            button.textContent = "🙈";
                        } else {
                            input.type = "password";
                            button.textContent = "🙉";
                        }
                    }
                );
            });
    }

    /*
     * ============================================================
     * ERROR UI
     * ============================================================
     */

    function fieldError(input, errorElement, text) {
        if (input) {
            input.classList.add("error");
            shake(input);
        }

        if (errorElement) {
            errorElement.textContent =
                text || "";
        }
    }

    function clearFieldError(input, errorElement) {
        if (input) {
            input.classList.remove("error");
        }

        if (errorElement) {
            errorElement.textContent = "";
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

        clearMessage(E.loginMessage);
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

        clearMessage(E.registerMessage);
    }

    /*
     * ============================================================
     * SESSION DISPLAY
     * ============================================================
     */

    function showGuest() {
        if (!E) return;

        E.guest.style.display = "";
        E.logged.style.display = "none";
    }

    function showLoggedIn() {
        if (!E) return;

        E.guest.style.display = "none";
        E.logged.style.display = "";
    }

    function getDisplayName(user, profile) {
        return (
            profile?.full_name ||
            profile?.name ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            profile?.username ||
            user?.email?.split("@")[0] ||
            "WFESC"
        );
    }

    function getUsername(user, profile) {
        const username =
            profile?.username ||
            user?.user_metadata?.username ||
            user?.email?.split("@")[0] ||
            "WFESC";

        return sanitizeUsername(username);
    }

    function renderAccount(user, profile) {
        if (!E) return;

        if (!user) {
            currentUser = null;
            currentProfile = null;

            showGuest();
            return;
        }

        currentUser = user;
        currentProfile = profile || {};

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
            name;

        E.loggedUsername.textContent =
            "@" + username;

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
            E.loggedAvatar.src = avatar;
            E.loggedAvatar.style.display =
                "block";

            E.loggedAvatarFallback.style.display =
                "none";
        } else {
            E.loggedAvatar.removeAttribute("src");

            E.loggedAvatar.style.display =
                "none";

            E.loggedAvatarFallback.style.display =
                "flex";

            E.loggedAvatarFallback.textContent =
                safeText(name)
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "W";
        }
    }

    /*
     * ============================================================
     * RESTORE SESSION
     * ============================================================
     */

    async function restoreSession() {
        if (!E) return;

        E.loading.classList.add("show");

        try {
            const auth = getAuth();

            if (!auth) {
                throw new Error(
                    "WFESCSettingsAuth غير موجود. تأكد من تحميل settings-auth.js قبل settings-auth-ui.js."
                );
            }

            if (
                typeof auth.restoreSession ===
                "function"
            ) {
                const result =
                    await auth.restoreSession();

                if (result?.user) {
                    currentUser =
                        result.user;

                    currentProfile =
                        result.profile || null;

                    renderAccount(
                        currentUser,
                        currentProfile
                    );
                } else {
                    renderAccount(null, null);
                }

                return;
            }

            if (
                typeof auth.getSession ===
                "function"
            ) {
                const result =
                    await auth.getSession();

                const session =
                    result?.data?.session ||
                    result?.session ||
                    result;

                const user =
                    session?.user ||
                    null;

                if (user) {
                    currentUser = user;

                    if (
                        typeof auth.fetchProfile ===
                        "function"
                    ) {
                        currentProfile =
                            await auth.fetchProfile(
                                user.id
                            );
                    }

                    renderAccount(
                        currentUser,
                        currentProfile
                    );
                } else {
                    renderAccount(null, null);
                }

                return;
            }

            throw new Error(
                "دالة restoreSession أو getSession غير موجودة في settings-auth.js."
            );

        } catch (error) {
            console.error(
                "WFESC Auth restore error:",
                error
            );

            renderAccount(null, null);

            showStatus(
                "تعذر استعادة جلسة الحساب.",
                "error"
            );

            showDebugError(error);

        } finally {
            E.loading.classList.remove(
                "show"
            );
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
            E.loginEmail.value.trim();

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

        const auth = getAuth();

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

            showDebugError(error);

            return;
        }

        setButtonLoading(
            E.loginSubmit,
            true,
            "جارٍ تسجيل الدخول..."
        );

        try {
            const result =
                await auth.signIn(
                    email,
                    password
                );

            const user =
                result?.user ||
                result?.data?.user ||
                result;

            if (!user) {
                throw new Error(
                    "تم تنفيذ تسجيل الدخول لكن لم يتم استلام بيانات المستخدم."
                );
            }

            currentUser = user;

            if (
                typeof auth.fetchProfile ===
                "function"
            ) {
                currentProfile =
                    await auth.fetchProfile(
                        user.id
                    );
            }

            renderAccount(
                currentUser,
                currentProfile
            );

            showStatus(
                "تم تسجيل الدخول بنجاح.",
                "success"
            );

            E.loginPassword.value = "";

        } catch (error) {
            console.error(
                "WFESC login error:",
                error
            );

            const message =
                getErrorMessage(error);

            setMessage(
                E.loginMessage,
                message,
                "error"
            );

            shake(E.loginPassword);

            showStatus(
                message,
                "error"
            );

            showDebugError(error);

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
        clearRegisterErrors();

        const name =
            E.registerName.value.trim();

        const username =
            sanitizeUsername(
                E.registerUsername.value
            );

        const email =
            E.registerEmail.value.trim();

        const password =
            E.registerPassword.value;

        const confirm =
            E.registerConfirm.value;

        E.registerUsername.value =
            username;

        let valid = true;

        if (name.length < 2) {
            fieldError(
                E.registerName,
                E.registerNameError,
                "يرجى إدخال الاسم."
            );

            valid = false;
        }

        if (!validUsername(username)) {
            fieldError(
                E.registerUsername,
                E.registerUsernameError,
                "اسم المستخدم يجب أن يتكون من 3 إلى 9 أحرف إنجليزية أو أرقام."
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

        if (password !== confirm) {
            fieldError(
                E.registerPassword,
                E.registerPasswordError,
                "كلمتا المرور غير متطابقتين."
            );

            fieldError(
                E.registerConfirm,
                E.registerConfirmError,
                "كلمتا المرور غير متطابقتين."
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

        const auth = getAuth();

        if (
            !auth ||
            typeof auth.signUp !==
            "function"
        ) {
            const error =
                new Error(
                    "دالة signUp غير موجودة في settings-auth.js."
                );

            setMessage(
                E.registerMessage,
                getErrorMessage(error),
                "error"
            );

            showDebugError(error);

            return;
        }

        setButtonLoading(
            E.registerSubmit,
            true,
            "جارٍ إنشاء الحساب..."
        );

        try {
            const result =
                await auth.signUp(
                    name,
                    email,
                    password,
                    username
                );

            const user =
                result?.user ||
                result?.data?.user ||
                null;

            if (
                user &&
                (
                    user.email_confirmed_at ||
                    user.confirmed_at
                )
            ) {
                currentUser = user;

                if (
                    typeof auth.fetchProfile ===
                    "function"
                ) {
                    currentProfile =
                        await auth.fetchProfile(
                            user.id
                        );
                }

                renderAccount(
                    currentUser,
                    currentProfile
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

            const message =
                getErrorMessage(error);

            setMessage(
                E.registerMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

            showDebugError(error);

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

    let verificationTimer = null;

    function showVerificationMessage() {
        if (!E) return;

        E.verification.textContent =
            "✓ تم إنشاء الحساب. تحقق من بريدك الإلكتروني أو الرسائل غير المرغوب فيها. ستختفي هذه الرسالة تلقائيًا.";

        E.verification.classList.add(
            "show"
        );

        clearTimeout(
            verificationTimer
        );

        verificationTimer =
            setTimeout(function () {
                E.verification.classList.remove(
                    "show"
                );
            }, 5000);
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
            E.forgotEmail.value.trim();

        if (!validEmail(email)) {
            fieldError(
                E.forgotEmail,
                E.forgotEmailError,
                "يرجى إدخال بريد إلكتروني صحيح."
            );

            return;
        }

        const auth = getAuth();

        if (
            !auth ||
            typeof auth.resetPassword !==
            "function"
        ) {
            const error =
                new Error(
                    "دالة resetPassword غير موجودة في settings-auth.js."
                );

            setMessage(
                E.forgotMessage,
                getErrorMessage(error),
                "error"
            );

            showDebugError(error);

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
                getErrorMessage(error);

            setMessage(
                E.forgotMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

            showDebugError(error);

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
        E.newPassword.value = "";
        E.newPasswordConfirm.value = "";

        clearMessage(
            E.changePasswordMessage
        );

        E.changePasswordModal.classList.add(
            "show"
        );
    }

    function closeChangePassword() {
        E.changePasswordModal.classList.remove(
            "show"
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

            shake(E.newPassword);

            return;
        }

        if (password !== confirm) {
            setMessage(
                E.changePasswordMessage,
                "كلمتا المرور غير متطابقتين.",
                "error"
            );

            shakeMany([
                E.newPassword,
                E.newPasswordConfirm
            ]);

            return;
        }

        const auth = getAuth();

        if (
            !auth ||
            typeof auth.updatePassword !==
            "function"
        ) {
            const error =
                new Error(
                    "دالة updatePassword غير موجودة في settings-auth.js."
                );

            setMessage(
                E.changePasswordMessage,
                getErrorMessage(error),
                "error"
            );

            showDebugError(error);

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
                closeChangePassword,
                900
            );

        } catch (error) {
            console.error(
                "WFESC change password error:",
                error
            );

            const message =
                getErrorMessage(error);

            setMessage(
                E.changePasswordMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

            showDebugError(error);

        } finally {
            setButtonLoading(
                E.changePasswordSubmit,
                false
            );
        }
    }

    /*
     * ============================================================
     * RECOVERY PASSWORD
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

            shake(E.recoveryPassword);

            return;
        }

        if (password !== confirm) {
            setMessage(
                E.recoveryMessage,
                "كلمتا المرور غير متطابقتين.",
                "error"
            );

            shakeMany([
                E.recoveryPassword,
                E.recoveryConfirm
            ]);

            return;
        }

        const auth = getAuth();

        if (
            !auth ||
            typeof auth.updatePassword !==
            "function"
        ) {
            const error =
                new Error(
                    "دالة updatePassword غير موجودة في settings-auth.js."
                );

            setMessage(
                E.recoveryMessage,
                getErrorMessage(error),
                "error"
            );

            showDebugError(error);

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
                function () {
                    E.recoveryModal.classList.remove(
                        "show"
                    );

                    if (
                        typeof auth.signOut ===
                        "function"
                    ) {
                        auth.signOut()
                            .catch(function () {});
                    }

                    renderAccount(
                        null,
                        null
                    );

                    setMode("login");
                },
                1000
            );

        } catch (error) {
            console.error(
                "WFESC recovery password error:",
                error
            );

            const message =
                getErrorMessage(error);

            setMessage(
                E.recoveryMessage,
                message,
                "error"
            );

            showStatus(
                message,
                "error"
            );

            showDebugError(error);

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
        const auth = getAuth();

        if (
            !auth ||
            typeof auth.signOut !==
            "function"
        ) {
            const error =
                new Error(
                    "دالة signOut غير موجودة في settings-auth.js."
                );

            showStatus(
                getErrorMessage(error),
                "error"
            );

            showDebugError(error);

            return;
        }

        try {
            await auth.signOut();

            currentUser = null;
            currentProfile = null;

            renderAccount(
                null,
                null
            );

            setMode("login");

            showStatus(
                "تم تسجيل الخروج بنجاح.",
                "success"
            );

        } catch (error) {
            console.error(
                "WFESC logout error:",
                error
            );

            const message =
                getErrorMessage(error);

            showStatus(
                message,
                "error"
            );

            showDebugError(error);
        }
    }

    /*
     * ============================================================
     * DELETE ACCOUNT
     * ============================================================
     */

    async function deleteAccount() {
        const confirmed =
            window.confirm(
                "هل أنت متأكد من حذف حسابك؟ هذا الإجراء نهائي."
            );

        if (!confirmed) {
            return;
        }

        const auth = getAuth();

        if (
            !auth ||
            typeof auth.deleteAccount !==
            "function"
        ) {
            const error =
                new Error(
                    "دالة deleteAccount غير موجودة في settings-auth.js."
                );

            showStatus(
                getErrorMessage(error),
                "error"
            );

            showDebugError(error);

            return;
        }

        try {
            await auth.deleteAccount();

            currentUser = null;
            currentProfile = null;

            renderAccount(
                null,
                null
            );

            showStatus(
                "تم تنفيذ طلب حذف الحساب.",
                "success"
            );

        } catch (error) {
            console.error(
                "WFESC delete account error:",
                error
            );

            const message =
                getErrorMessage(error);

            showStatus(
                message,
                "error"
            );

            showDebugError(error);
        }
    }

    /*
     * ============================================================
     * PROFILE
     * ============================================================
     */

    function openProfile() {
        window.location.href =
            "profile.html";
    }

    /*
     * ============================================================
     * RECOVERY URL
     * ============================================================
     */

    async function handleRecoveryURL() {
        const url =
            window.location.href;

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

        const auth = getAuth();

        try {
            if (
                auth &&
                typeof auth.restoreSession ===
                "function"
            ) {
                await auth.restoreSession();
            }

            E.recoveryModal.classList.add(
                "show"
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

            showDebugError(error);
        }
    }

    /*
     * ============================================================
     * DEBUG ERROR
     * ============================================================
     */

    function showDebugError(error) {
        let debug =
            qs(".wfesc-auth-debug");

        if (!debug) {
            debug =
                document.createElement(
                    "div"
                );

            debug.className =
                "wfesc-auth-debug";

            if (root) {
                root.appendChild(debug);
            }
        }

        debug.textContent =
            "WFESC ERROR: " +
            getErrorMessage(error);
    }

    /*
     * ============================================================
     * AUTH EVENTS
     * ============================================================
     */

    function bindAuthEvents() {
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

                renderAccount(
                    user,
                    profile
                );
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
    }

    /*
     * ============================================================
     * EVENTS
     * ============================================================
     */

    function bindEvents() {
        E.tabs.forEach(function (tab) {

            tab.addEventListener(
                "click",
                function () {

                    const mode =
                        tab.getAttribute(
                            "data-auth-mode"
                        );

                    if (mode === "register") {
                        setMode("register");
                        clearLoginErrors();
                    } else {
                        setMode("login");
                        clearRegisterErrors();
                    }
                }
            );
        });

        E.loginSubmit.addEventListener(
            "click",
            login
        );

        E.registerSubmit.addEventListener(
            "click",
            register
        );

        E.loginForgot.addEventListener(
            "click",
            function () {

                const email =
                    E.loginEmail.value.trim();

                E.forgotEmail.value =
                    email;

                setMode("forgot");

            }
        );

        E.forgotBack.addEventListener(
            "click",
            function () {
                setMode("login");
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
            deleteAccount
        );

        E.recoverySubmit.addEventListener(
            "click",
            recoveryPassword
        );

        qsa("[data-close-modal]")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    closeAllModals
                );

            });

        [E.changePasswordModal, E.recoveryModal]
            .forEach(function (modal) {

                if (!modal) return;

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modal
                        ) {
                            modal.classList.remove(
                                "show"
                            );
                        }

                    }
                );

            });

        E.registerUsername.addEventListener(
            "input",
            function () {

                const clean =
                    sanitizeUsername(
                        E.registerUsername.value
                    );

                E.registerUsername.value =
                    clean;

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
                }

            }
        );

        E.loginPassword.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    login();
                }

            }
        );

        E.loginEmail.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    login();
                }

            }
        );

        E.registerConfirm.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    register();
                }

            }
        );

        /*
         * منع prompt الخاص بالمتصفح.
         */

        window.addEventListener(
            "error",
            function (event) {

                if (
                    event &&
                    event.error
                ) {
                    console.error(
                        "WFESC global error:",
                        event.error
                    );

                    showDebugError(
                        event.error
                    );
                }

            }
        );

        window.addEventListener(
            "unhandledrejection",
            function (event) {

                const reason =
                    event.reason ||
                    new Error(
                        "Unhandled Promise Rejection"
                    );

                console.error(
                    "WFESC promise error:",
                    reason
                );

                showDebugError(
                    reason
                );

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

        E = getElements();

        bindPasswordToggles();

        bindEvents();

        bindAuthEvents();

        setMode("login");

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
