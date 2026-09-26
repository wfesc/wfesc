(function () {
    "use strict";

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    if (!window.WFESCSettingsAuth) {
        console.error(
            "WFESC Settings Auth غير موجود."
        );
        return;
    }

    const AUTH = window.WFESCSettingsAuth;
    const CONFIG =
        window.WFESCSettingsAuthConfig || {};

    window.WFESCSettingsAuthUI = true;

    /* =========================================
       العناصر
    ========================================= */

    const state = {
        mode: "login",
        loading: false,
        statusTimer: null,
        passwordVisible: false,
        confirmPasswordVisible: false
    };

    let root = null;

    function findRoot() {
        return (
            document.querySelector(
                "[data-wfesc-auth]"
            ) ||
            document.querySelector(
                "#wfesc-auth"
            ) ||
            document.body
        );
    }

    /* =========================================
       أدوات عامة
    ========================================= */

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function cleanUsername(value) {
        return String(value || "")
            .trim()
            .replace(/^@+/, "")
            .replace(/[^A-Za-z]/g, "")
            .slice(0, 9);
    }

    /*
     * طريقة عرض اسم المستخدم:
     *
     * قاعدة البيانات:
     * xzz
     *
     * الواجهة:
     * @xzz
     */
    function displayUsername(value) {
        const username =
            cleanUsername(value);

        if (!username) {
            return "@WFESC";
        }

        return "@" + username;
    }

    /*
     * التوثيق:
     *
     * verified = true
     * يظهر بجانب الاسم.
     *
     * المستخدم العادي لا يستطيع
     * تفعيل هذه القيمة من الواجهة.
     */
    function verifiedBadge(verified) {
        if (!verified) {
            return "";
        }

        return `
            <span
                class="wfesc-verified"
                title="حساب موثق"
                aria-label="حساب موثق"
            >✓</span>
        `;
    }

    function displayUserNameWithVerification(
        profile
    ) {
        if (!profile) {
            return `
                <span class="wfesc-user-name">
                    @WFESC
                </span>
            `;
        }

        return `
            <span class="wfesc-user-name">
                ${escapeHTML(
                    displayUsername(
                        profile.username
                    )
                )}
            </span>
            ${verifiedBadge(
                profile.verified === true
            )}
        `;
    }

    /* =========================================
       CSS
    ========================================= */

    function injectStyles() {
        if (
            document.getElementById(
                "wfesc-settings-auth-ui-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "wfesc-settings-auth-ui-style";

        style.textContent = `
        #wfesc-settings-auth-root,
        .wfesc-auth-root {
            width: 100%;
            max-width: 560px;
            margin: 30px auto;
            padding: 0 14px;
            box-sizing: border-box;
            color: #eeeeee;
            font-family:
                Arial,
                Tahoma,
                sans-serif;
        }

        .wfesc-auth-card {
            width: 100%;
            box-sizing: border-box;
            background:
                linear-gradient(
                    145deg,
                    #111111,
                    #080808
                );
            border: 1px solid #242424;
            border-radius: 20px;
            padding: 24px;
            box-shadow:
                0 12px 35px
                rgba(0,0,0,.35);
        }

        .wfesc-auth-header {
            text-align: center;
            margin-bottom: 24px;
        }

        .wfesc-auth-logo {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #151515;
            border: 1px solid #303030;
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            box-shadow:
                0 0 0 5px
                rgba(255,255,255,.025);
        }

        .wfesc-auth-title {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
        }

        .wfesc-auth-subtitle {
            margin: 7px 0 0;
            color: #8f8f8f;
            font-size: 13px;
            line-height: 1.7;
        }

        .wfesc-auth-tabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
            padding: 5px;
            margin-bottom: 20px;
            background: #0b0b0b;
            border: 1px solid #222222;
            border-radius: 13px;
        }

        .wfesc-auth-tab {
            appearance: none;
            border: 0;
            border-radius: 9px;
            min-height: 43px;
            padding: 9px 10px;
            background: transparent;
            color: #888888;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition:
                background .18s ease,
                color .18s ease;
        }

        .wfesc-auth-tab:hover {
            color: #ffffff;
        }

        .wfesc-auth-tab.active {
            background: #191919;
            color: #ffffff;
        }

        .wfesc-field {
            margin-bottom: 14px;
        }

        .wfesc-field label {
            display: block;
            margin: 0 0 7px;
            color: #d5d5d5;
            font-size: 13px;
            font-weight: 700;
        }

        .wfesc-input-wrap {
            position: relative;
            width: 100%;
        }

        .wfesc-input {
            width: 100%;
            min-height: 48px;
            box-sizing: border-box;
            border: 1px solid #292929;
            border-radius: 12px;
            outline: none;
            background: #0d0d0d;
            color: #ffffff;
            padding: 0 14px;
            font-size: 15px;
            transition:
                border-color .18s ease,
                background .18s ease,
                box-shadow .18s ease;
        }

        .wfesc-input:focus {
            border-color: #4a4a4a;
            background: #101010;
            box-shadow:
                0 0 0 3px
                rgba(255,255,255,.035);
        }

        .wfesc-input::placeholder {
            color: #626262;
        }

        .wfesc-password-input {
            padding-left: 48px;
        }

        .wfesc-password-toggle {
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            width: 38px;
            height: 38px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: #8c8c8c;
            cursor: pointer;
            font-size: 18px;
        }

        .wfesc-password-toggle:hover {
            background: #181818;
            color: #ffffff;
        }

        .wfesc-hint {
            margin-top: 6px;
            color: #666666;
            font-size: 11px;
            line-height: 1.6;
        }

        .wfesc-primary-button,
        .wfesc-secondary-button,
        .wfesc-danger-button {
            width: 100%;
            min-height: 48px;
            border-radius: 12px;
            padding: 10px 15px;
            border: 1px solid #2b2b2b;
            cursor: pointer;
            font-size: 14px;
            font-weight: 800;
            transition:
                background .18s ease,
                border-color .18s ease,
                transform .12s ease;
        }

        .wfesc-primary-button {
            background: #f1f1f1;
            color: #080808;
            border-color: #f1f1f1;
        }

        .wfesc-primary-button:hover {
            background: #ffffff;
        }

        .wfesc-primary-button:active,
        .wfesc-secondary-button:active,
        .wfesc-danger-button:active {
            transform: scale(.985);
        }

        .wfesc-secondary-button {
            background: #151515;
            color: #eeeeee;
        }

        .wfesc-secondary-button:hover {
            background: #1d1d1d;
            border-color: #3a3a3a;
        }

        .wfesc-danger-button {
            background: #160d0d;
            color: #ff9c9c;
            border-color: #3a1919;
        }

        .wfesc-danger-button:hover {
            background: #211010;
        }

        .wfesc-button-row {
            display: grid;
            gap: 9px;
            margin-top: 18px;
        }

        .wfesc-link-button {
            appearance: none;
            border: 0;
            background: transparent;
            color: #999999;
            padding: 8px;
            cursor: pointer;
            font-size: 13px;
        }

        .wfesc-link-button:hover {
            color: #ffffff;
        }

        .wfesc-status {
            display: none;
            margin: 0 0 16px;
            padding: 12px 14px;
            border-radius: 12px;
            border: 1px solid #292929;
            background: #111111;
            color: #dddddd;
            font-size: 13px;
            line-height: 1.7;
            text-align: center;
        }

        .wfesc-status.show {
            display: block;
            animation:
                wfescStatusIn .2s ease;
        }

        .wfesc-status.success {
            border-color: #19472c;
            background: #0d1d13;
            color: #9be8b4;
        }

        .wfesc-status.error {
            border-color: #492020;
            background: #1d0d0d;
            color: #ffaaaa;
        }

        .wfesc-status.info {
            border-color: #303030;
            background: #111111;
            color: #d4d4d4;
        }

        @keyframes wfescStatusIn {
            from {
                opacity: 0;
                transform: translateY(-4px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .wfesc-verify-box {
            display: none;
            padding: 18px;
            margin-bottom: 17px;
            border-radius: 14px;
            background: #0d1c13;
            border: 1px solid #1e4b2e;
            text-align: center;
        }

        .wfesc-verify-box.show {
            display: block;
        }

        .wfesc-verify-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 10px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #173e25;
            color: #76dc96;
            font-size: 22px;
        }

        .wfesc-verify-title {
            color: #a4e9b8;
            font-size: 15px;
            font-weight: 800;
            margin-bottom: 5px;
        }

        .wfesc-verify-text {
            color: #91b99e;
            font-size: 12px;
            line-height: 1.8;
        }

        .wfesc-account {
            display: none;
        }

        .wfesc-account.show {
            display: block;
        }

        .wfesc-account-top {
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 15px;
            background: #0d0d0d;
            border: 1px solid #242424;
        }

        .wfesc-account-avatar {
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #181818;
            border: 1px solid #303030;
            color: #ffffff;
            font-weight: 800;
        }

        .wfesc-account-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .wfesc-account-info {
            min-width: 0;
            flex: 1;
        }

        .wfesc-account-name {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            word-break: break-word;
        }

        .wfesc-account-email {
            margin-top: 4px;
            color: #737373;
            font-size: 11px;
            overflow-wrap: anywhere;
        }

        .wfesc-verified {
            width: 18px;
            height: 18px;
            flex: 0 0 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #18a957;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            line-height: 1;
            box-shadow:
                0 0 0 2px
                rgba(24,169,87,.10);
        }

        .wfesc-account-actions {
            display: grid;
            gap: 9px;
        }

        .wfesc-recovery {
            display: none;
        }

        .wfesc-recovery.show {
            display: block;
        }

        .wfesc-form {
            display: none;
        }

        .wfesc-form.show {
            display: block;
        }

        .wfesc-small-text {
            margin-top: 12px;
            color: #656565;
            font-size: 11px;
            line-height: 1.8;
            text-align: center;
        }

        .wfesc-loading {
            opacity: .65;
            pointer-events: none;
        }

        .wfesc-spinner {
            display: inline-block;
            width: 15px;
            height: 15px;
            margin-left: 7px;
            vertical-align: -3px;
            border: 2px solid
                rgba(0,0,0,.18);
            border-top-color: #000000;
            border-radius: 50%;
            animation:
                wfescSpin .65s linear infinite;
        }

        @keyframes wfescSpin {
            to {
                transform: rotate(360deg);
            }
        }

        @media (max-width: 480px) {
            .wfesc-auth-root,
            #wfesc-settings-auth-root {
                margin-top: 15px;
                padding: 0 10px;
            }

            .wfesc-auth-card {
                padding: 18px 15px;
                border-radius: 17px;
            }

            .wfesc-auth-title {
                font-size: 21px;
            }

            .wfesc-input {
                min-height: 47px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .wfesc-status.show,
            .wfesc-spinner {
                animation: none;
            }

            .wfesc-auth-tab,
            .wfesc-input,
            .wfesc-primary-button,
            .wfesc-secondary-button,
            .wfesc-danger-button {
                transition: none;
            }
        }
        `;

        document.head.appendChild(style);
    }

    /* =========================================
       HTML
    ========================================= */

    
    function buildUI() {
        root = findRoot();

        if (!root) {
            return;
        }

        injectStyles();

        /*
         * إذا كانت الصفحة تحتوي على
         * data-wfesc-auth أو #wfesc-auth
         * نستخدمه.
         *
         * وإلا ننشئ الحاوية.
         */
        let container =
            document.getElementById(
                "wfesc-settings-auth-root"
            );

        if (!container) {
            container =
                document.createElement("div");

            container.id =
                "wfesc-settings-auth-root";

            container.className =
                "wfesc-auth-root";

            root.appendChild(container);
        }

        container.innerHTML = `
            <section
                class="wfesc-auth-card"
                aria-label="حساب WFESC"
            >

                <header class="wfesc-auth-header">
                    <div
                        class="wfesc-auth-logo"
                        aria-hidden="true"
                    >
                        W
                    </div>

                    <h2
                        class="wfesc-auth-title"
                        id="wfesc-auth-title"
                    >
                        تسجيل الدخول
                    </h2>

                    <p
                        class="wfesc-auth-subtitle"
                        id="wfesc-auth-subtitle"
                    >
                        سجّل الدخول إلى حسابك في WFESC
                    </p>
                </header>

                <div
                    class="wfesc-status"
                    id="wfesc-auth-status"
                    role="status"
                    aria-live="polite"
                ></div>

                <div
                    class="wfesc-verify-box"
                    id="wfesc-verify-box"
                >
                    <div
                        class="wfesc-verify-icon"
                        aria-hidden="true"
                    >
                        ✓
                    </div>

                    <div
                        class="wfesc-verify-title"
                    >
                        تحقق من بريدك الإلكتروني
                    </div>

                    <div
                        class="wfesc-verify-text"
                    >
                        تم إنشاء الحساب.
                        افتح رسالة التحقق من بريدك،
                        وإذا لم تجدها فتفقد الرسائل غير المرغوب فيها.
                    </div>
                </div>

                <div
                    class="wfesc-auth-tabs"
                    id="wfesc-auth-tabs"
                >
                    <button
                        type="button"
                        class="wfesc-auth-tab active"
                        data-auth-tab="login"
                    >
                        لدي حساب
                    </button>

                    <button
                        type="button"
                        class="wfesc-auth-tab"
                        data-auth-tab="register"
                    >
                        إنشاء حساب
                    </button>
                </div>

                <!-- تسجيل الدخول -->

                <form
                    class="wfesc-form show"
                    id="wfesc-login-form"
                    novalidate
                >

                    <div class="wfesc-field">
                        <label
                            for="wfesc-login-email"
                        >
                            البريد الإلكتروني
                        </label>

                        <input
                            class="wfesc-input"
                            id="wfesc-login-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                            maxlength="254"
                            required
                        >
                    </div>

                    <div class="wfesc-field">
                        <label
                            for="wfesc-login-password"
                        >
                            كلمة المرور
                        </label>

                        <div class="wfesc-input-wrap">
                            <input
                                class="wfesc-input wfesc-password-input"
                                id="wfesc-login-password"
                                type="password"
                                autocomplete="current-password"
                                placeholder="كلمة المرور"
                                maxlength="16"
                                required
                            >

                            <button
                                type="button"
                                class="wfesc-password-toggle"
                                data-password-toggle="login"
                                aria-label="إظهار كلمة المرور"
                            >
                                🙈
                            </button>
                        </div>
                    </div>

                    <div class="wfesc-button-row">
                        <button
                            type="submit"
                            class="wfesc-primary-button"
                            id="wfesc-login-submit"
                        >
                            تسجيل الدخول
                        </button>

                        <button
                            type="button"
                            class="wfesc-link-button"
                            id="wfesc-forgot-button"
                        >
                            نسيت كلمة المرور؟
                        </button>
                    </div>
                </form>

                <!-- إنشاء الحساب -->

                <form
                    class="wfesc-form"
                    id="wfesc-register-form"
                    novalidate
                >

                    <div class="wfesc-field">
                        <label
                            for="wfesc-register-username"
                        >
                            اسم المستخدم
                        </label>

                        <input
                            class="wfesc-input"
                            id="wfesc-register-username"
                            type="text"
                            autocomplete="username"
                            placeholder="مثال: xzz"
                            maxlength="9"
                            required
                        >

                        <div class="wfesc-hint">
                            3 إلى 9 أحرف إنجليزية فقط.
                            اكتب الاسم بدون @.
                        </div>
                    </div>

                    <div class="wfesc-field">
                        <label
                            for="wfesc-register-email"
                        >
                            البريد الإلكتروني
                        </label>

                        <input
                            class="wfesc-input"
                            id="wfesc-register-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                            maxlength="254"
                            required
                        >
                    </div>

                    <div class="wfesc-field">
                        <label
                            for="wfesc-register-password"
                        >
                            كلمة المرور
                        </label>

                        <div class="wfesc-input-wrap">
                            <input
                                class="wfesc-input wfesc-password-input"
                                id="wfesc-register-password"
                                type="password"
                                autocomplete="new-password"
                                placeholder="6 إلى 16 حرفًا"
                                maxlength="16"
                                required
                            >

                            <button
                                type="button"
                                class="wfesc-password-toggle"
                                data-password-toggle="register"
                                aria-label="إظهار كلمة المرور"
                            >
                                🙈
                            </button>
                        </div>
                    </div>

                    <div class="wfesc-field">
                        <label
                            for="wfesc-register-confirm"
                        >
                            تأكيد كلمة المرور
                        </label>

                        <div class="wfesc-input-wrap">
                            <input
                                class="wfesc-input wfesc-password-input"
                                id="wfesc-register-confirm"
                                type="password"
                                autocomplete="new-password"
                                placeholder="أعد كتابة كلمة المرور"
                                maxlength="16"
                                required
                            >

                            <button
                                type="button"
                                class="wfesc-password-toggle"
                                data-password-toggle="confirm"
                                aria-label="إظهار كلمة المرور"
                            >
                                🙈
                            </button>
                        </div>
                    </div>

                    <div class="wfesc-button-row">
                        <button
                            type="submit"
                            class="wfesc-primary-button"
                            id="wfesc-register-submit"
                        >
                            إنشاء الحساب
                        </button>
                    </div>

                    <div class="wfesc-small-text">
                        بعد إنشاء الحساب ستحتاج إلى تأكيد بريدك الإلكتروني.
                    </div>
                </form>

                <!-- استعادة كلمة المرور -->

                <div
                    class="wfesc-recovery"
                    id="wfesc-recovery"
                >

                    <div class="wfesc-field">
                        <label
                            for="wfesc-recovery-email"
                        >
                            البريد الإلكتروني
                        </label>

                        <input
                            class="wfesc-input"
                            id="wfesc-recovery-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                            maxlength="254"
                        >
                    </div>

                    <div class="wfesc-button-row">
                        <button
                            type="button"
                            class="wfesc-primary-button"
                            id="wfesc-reset-submit"
                        >
                            إرسال رابط الاستعادة
                        </button>

                        <button
                            type="button"
                            class="wfesc-link-button"
                            id="wfesc-back-login"
                        >
                            العودة لتسجيل الدخول
                        </button>
                    </div>
                </div>

                <!-- الحساب المسجل -->

                <section
                    class="wfesc-account"
                    id="wfesc-account"
                    aria-label="الحساب"
                >

                    <div
                        class="wfesc-account-top"
                    >

                        <div
                            class="wfesc-account-avatar"
                            id="wfesc-account-avatar"
                        >
                            W
                        </div>

                        <div
                            class="wfesc-account-info"
                        >
                            <div
                                class="wfesc-account-name"
                                id="wfesc-account-name"
                            >
                                @WFESC
                            </div>

                            <div
                                class="wfesc-account-email"
                                id="wfesc-account-email"
                            ></div>
                        </div>

                    </div>

                    <div
                        class="wfesc-account-actions"
                    >

                        <button
                            type="button"
                            class="wfesc-secondary-button"
                            id="wfesc-profile-button"
                        >
                            إدارة الحساب
                        </button>

                        <button
                            type="button"
                            class="wfesc-secondary-button"
                            id="wfesc-password-button"
                        >
                            تغيير كلمة المرور
                        </button>

                        <button
                            type="button"
                            class="wfesc-secondary-button"
                            id="wfesc-logout-button"
                        >
                            تسجيل الخروج
                        </button>

                        <button
                            type="button"
                            class="wfesc-danger-button"
                            id="wfesc-delete-button"
                        >
                            حذف الحساب
                        </button>

                    </div>

                </section>

            </section>
        `;

        bindEvents();
        updateUI();
    }

    /* =========================================
       إظهار الرسائل
    ========================================= */
    
    function showStatus(
        message,
        type = "info",
        duration = 5000
    ) {
        const element =
            document.getElementById(
                "wfesc-auth-status"
            );

        if (!element) {
            return;
        }

        clearTimeout(
            state.statusTimer
        );

        element.textContent =
            String(message || "");

        element.className =
            "wfesc-status show " +
            type;

        if (duration > 0) {
            state.statusTimer =
                setTimeout(
                    function () {
                        element.className =
                            "wfesc-status";
                    },
                    duration
                );
        }
    }

    function hideStatus() {
        const element =
            document.getElementById(
                "wfesc-auth-status"
            );

        if (!element) {
            return;
        }

        clearTimeout(
            state.statusTimer
        );

        element.className =
            "wfesc-status";
    }

    /* =========================================
       حالة التحميل
    ========================================= */

    function setLoading(
        loading,
        button
    ) {
        state.loading = loading;

        if (!button) {
            return;
        }

        if (loading) {
            button.dataset.originalText =
                button.textContent;

            button.disabled = true;
            button.classList.add(
                "wfesc-loading"
            );

            button.innerHTML =
                "يرجى الانتظار" +
                '<span class="wfesc-spinner"></span>';
        } else {
            button.disabled = false;
            button.classList.remove(
                "wfesc-loading"
            );

            if (
                button.dataset.originalText
            ) {
                button.textContent =
                    button.dataset.originalText;
            }
        }
    }

    /* =========================================
       التبويبات
    ========================================= */

    function setMode(mode) {
        state.mode = mode;

        const loginForm =
            document.getElementById(
                "wfesc-login-form"
            );

        const registerForm =
            document.getElementById(
                "wfesc-register-form"
            );

        const recovery =
            document.getElementById(
                "wfesc-recovery"
            );

        const tabs =
            document.querySelectorAll(
                ".wfesc-auth-tab"
            );

        const title =
            document.getElementById(
                "wfesc-auth-title"
            );

        const subtitle =
            document.getElementById(
                "wfesc-auth-subtitle"
            );

        const tabBox =
            document.getElementById(
                "wfesc-auth-tabs"
            );

        if (loginForm) {
            loginForm.classList.toggle(
                "show",
                mode === "login"
            );
        }

        if (registerForm) {
            registerForm.classList.toggle(
                "show",
                mode === "register"
            );
        }

        if (recovery) {
            recovery.classList.toggle(
                "show",
                mode === "recovery"
            );
        }

        tabs.forEach(
            function (tab) {
                tab.classList.toggle(
                    "active",
                    tab.dataset.authTab ===
                        mode
                );
            }
        );

        if (tabBox) {
            tabBox.style.display =
                mode === "recovery"
                    ? "none"
                    : "grid";
        }

        if (mode === "login") {
            if (title) {
                title.textContent =
                    "تسجيل الدخول";
            }

            if (subtitle) {
                subtitle.textContent =
                    "سجّل الدخول إلى حسابك في WFESC";
            }
        }

        if (mode === "register") {
            if (title) {
                title.textContent =
                    "إنشاء حساب";
            }

            if (subtitle) {
                subtitle.textContent =
                    "أنشئ حسابك وابدأ استخدام WFESC";
            }
        }

        if (mode === "recovery") {
            if (title) {
                title.textContent =
                    "استعادة كلمة المرور";
            }

            if (subtitle) {
                subtitle.textContent =
                    "سنرسل رابط الاستعادة إلى بريدك الإلكتروني";
            }
        }

        hideStatus();
    }

    /* =========================================
       كلمة المرور
    ========================================= */

    function togglePassword(type) {
        let input = null;
        let button = null;

        if (type === "login") {
            input =
                document.getElementById(
                    "wfesc-login-password"
                );

            button =
                document.querySelector(
                    '[data-password-toggle="login"]'
                );
        }

        if (type === "register") {
            input =
                document.getElementById(
                    "wfesc-register-password"
                );

            button =
                document.querySelector(
                    '[data-password-toggle="register"]'
                );
        }

        if (type === "confirm") {
            input =
                document.getElementById(
                    "wfesc-register-confirm"
                );

            button =
                document.querySelector(
                    '[data-password-toggle="confirm"]'
                );
        }

        if (!input || !button) {
            return;
        }

        const visible =
            input.type === "text";

        input.type =
            visible
                ? "password"
                : "text";

        button.textContent =
            visible
                ? "🙈"
                : "🙉";

        button.setAttribute(
            "aria-label",
            visible
                ? "إظهار كلمة المرور"
                : "إخفاء كلمة المرور"
        );
    }

    /* =========================================
       الحساب
    ========================================= */

    function getCurrentUser() {
        if (
            typeof AUTH.getCurrentUser ===
            "function"
        ) {
            return AUTH.getCurrentUser();
        }

        if (
            typeof AUTH.getUser ===
            "function"
        ) {
            return AUTH.getUser();
        }

        return null;
    }

    function getCurrentProfile() {
        if (
            typeof AUTH.getCurrentProfile ===
            "function"
        ) {
            return AUTH.getCurrentProfile();
        }

        if (
            typeof AUTH.getProfile ===
            "function"
        ) {
            return AUTH.getProfile();
        }

        return null;
    }

    function renderAccount() {
        const account =
            document.getElementById(
                "wfesc-account"
            );

        const forms =
            document.querySelectorAll(
                ".wfesc-form"
            );

        const recovery =
            document.getElementById(
                "wfesc-recovery"
            );

        const tabs =
            document.getElementById(
                "wfesc-auth-tabs"
            );

        const verifyBox =
            document.getElementById(
                "wfesc-verify-box"
            );

        const title =
            document.getElementById(
                "wfesc-auth-title"
            );

        const subtitle =
            document.getElementById(
                "wfesc-auth-subtitle"
            );

        const user =
            getCurrentUser();

        const profile =
            getCurrentProfile();

        if (!user) {
            if (account) {
                account.classList.remove(
                    "show"
                );
            }

            forms.forEach(
                function (form) {
                    form.style.display = "";
                }
            );

            if (recovery) {
                recovery.style.display = "";
            }

            if (tabs) {
                tabs.style.display =
                    state.mode === "recovery"
                        ? "none"
                        : "grid";
            }

            return;
        }

        if (account) {
            account.classList.add(
                "show"
            );
        }

        forms.forEach(
            function (form) {
                form.classList.remove(
                    "show"
                );
                form.style.display =
                    "none";
            }
        );

        if (recovery) {
            recovery.classList.remove(
                "show"
            );
            recovery.style.display =
                "none";
        }

        if (tabs) {
            tabs.style.display =
                "none";
        }

        if (verifyBox) {
            verifyBox.classList.remove(
                "show"
            );
        }

        if (title) {
            title.textContent =
                "حسابك في WFESC";
        }

        if (subtitle) {
            subtitle.textContent =
                "تم تسجيل الدخول إلى حسابك";
        }

        const name =
            document.getElementById(
                "wfesc-account-name"
            );

        const email =
            document.getElementById(
                "wfesc-account-email"
            );

        const avatar =
            document.getElementById(
                "wfesc-account-avatar"
            );

        if (name) {
            name.innerHTML =
                displayUserNameWithVerification(
                    profile
                );
        }

        if (email) {
            email.textContent =
                user.email || "";
        }

        if (avatar) {
            avatar.innerHTML = "";

            if (
                profile &&
                profile.avatar_url
            ) {
                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    profile.avatar_url;

                image.alt =
                    "صورة الحساب";

                image.onerror =
                    function () {
                        avatar.innerHTML =
                            "W";
                    };

                avatar.appendChild(
                    image
                );
            } else {
                avatar.textContent =
                    (
                        profile &&
                        profile.username
                    )
                        ? profile.username
                            .charAt(0)
                            .toUpperCase()
                        : "W";
            }
        }
    }

    function updateUI() {
        renderAccount();
    }

    /* =========================================
       تسجيل الدخول
    ========================================= */

    async function handleLogin(
        event
    ) {
        event.preventDefault();

        if (state.loading) {
            return;
        }

        const email =
            document.getElementById(
                "wfesc-login-email"
            );

        const password =
            document.getElementById(
                "wfesc-login-password"
            );

        const button =
            document.getElementById(
                "wfesc-login-submit"
            );

        if (!email || !password) {
            return;
        }

        const emailValue =
            email.value.trim();

        const passwordValue =
            password.value;

        if (!emailValue) {
            showStatus(
                "يرجى إدخال البريد الإلكتروني.",
                "error"
            );
            email.focus();
            return;
        }

        if (!passwordValue) {
            showStatus(
                "يرجى إدخال كلمة المرور.",
                "error"
            );
            password.focus();
            return;
        }

        setLoading(
            true,
            button
        );

        try {
            await AUTH.signIn(
                emailValue,
                passwordValue
            );

            showStatus(
                CONFIG.messages &&
                CONFIG.messages.loginSuccess
                    ? CONFIG.messages.loginSuccess
                    : "تم تسجيل الدخول بنجاح.",
                "success",
                3000
            );

            updateUI();

        } catch (error) {
            handleAuthError(
                error
            );
        } finally {
            setLoading(
                false,
                button
            );
        }
    }

    /* =========================================
       إنشاء الحساب
    ========================================= */
            
    
