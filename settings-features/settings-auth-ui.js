(function () {
    "use strict";

    /*
     * =========================================================
     * WFESC SETTINGS AUTH UI
     * الإصدار الكامل
     * =========================================================
     *
     * هذا الملف مسؤول عن واجهة:
     *
     * 1. تسجيل الدخول
     * 2. إنشاء الحساب
     * 3. التحقق من البريد
     * 4. استعادة كلمة المرور
     * 5. عرض الحساب
     * 6. إدارة الحساب
     * 7. تغيير كلمة المرور
     * 8. تسجيل الخروج
     * 9. حذف الحساب
     * 10. عرض التوثيق ✓
     *
     * الاتصال بـ Supabase موجود في:
     *
     * settings-auth.js
     *
     * وهذا الملف لا ينشئ اتصال Supabase جديد.
     *
     * =========================================================
     */

    if (window.WFESCSettingsAuthUI) {
        return;
    }

    if (!window.WFESCSettingsAuth) {
        console.error(
            "WFESC Settings Auth غير موجود."
        );
        return;
    }

    const AUTH =
        window.WFESCSettingsAuth;

    const CONFIG =
        window.WFESCSettingsAuthConfig || {};

    window.WFESCSettingsAuthUI = true;

    /*
     * =========================================================
     * الحالة
     * =========================================================
     */

    const state = {
        mode: "login",

        loading: false,

        statusTimer: null,

        verifyTimer: null,

        passwordVisible: false,

        confirmPasswordVisible: false,

        recoveryPasswordVisible: false,

        recoveryConfirmVisible: false,

        initialized: false,

        loginError: false,

        registerPasswordError: false,

        confirmPasswordError: false
    };

    let root = null;

    /*
     * =========================================================
     * إعدادات عامة
     * =========================================================
     */

    const USERNAME_MIN = 3;

    const USERNAME_MAX = 9;

    const PASSWORD_MIN = 6;

    const PASSWORD_MAX = 16;

    /*
     * =========================================================
     * العثور على مكان الواجهة
     * =========================================================
     */

    function findRoot() {
        return (
            document.querySelector(
                "[data-wfesc-auth]"
            ) ||
            document.querySelector(
                "#wfesc-auth"
            ) ||
            document.querySelector(
                "#wfesc-settings-auth-root"
            ) ||
            document.body
        );
    }

    /*
     * =========================================================
     * حماية HTML
     * =========================================================
     */

    function escapeHTML(value) {
        return String(value || "")
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

    /*
     * =========================================================
     * تنظيف الاسم
     * =========================================================
     *
     * الاسم العادي يسمح بالعربي والإنجليزي.
     */

    function cleanDisplayName(value) {
        return String(value || "")
            .trim()
            .replace(
                /\s+/g,
                " "
            )
            .slice(
                0,
                40
            );
    }

    /*
     * =========================================================
     * تنظيف اسم المستخدم
     * =========================================================
     *
     * المسموح:
     *
     * ali
     * ali12
     * xzz123
     *
     * غير مسموح:
     *
     * ali@
     * ali-12
     * ali_12
     * عربي
     *
     * ويمكن للمستخدم كتابة:
     *
     * @ali12
     *
     * والواجهة تخزن:
     *
     * ali12
     */

    function cleanUsername(value) {
        return String(value || "")
            .trim()
            .replace(
                /^@+/,
                ""
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

    /*
     * =========================================================
     * التحقق من اسم المستخدم
     * =========================================================
     */

    function validateUsername(value) {
        const username =
            cleanUsername(value);

        if (
            username.length <
            USERNAME_MIN
        ) {
            return {
                valid: false,
                message:
                    "اسم المستخدم يجب أن يكون من 3 إلى 9 خانات."
            };
        }

        if (
            username.length >
            USERNAME_MAX
        ) {
            return {
                valid: false,
                message:
                    "اسم المستخدم تجاوز الحد المسموح."
            };
        }

        if (
            !/^[A-Za-z0-9]+$/.test(
                username
            )
        ) {
            return {
                valid: false,
                message:
                    "اسم المستخدم يقبل الأحرف الإنجليزية والأرقام فقط."
            };
        }

        return {
            valid: true,
            value: username
        };
    }

    /*
     * =========================================================
     * عرض اسم المستخدم
     * =========================================================
     *
     * قاعدة البيانات:
     *
     * ali12
     *
     * العرض:
     *
     * @ali12
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
     * =========================================================
     * التوثيق
     * =========================================================
     */

    function verifiedBadge(
        verified
    ) {
        if (
            verified !== true
        ) {
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

    /*
     * =========================================================
     * عرض اسم الحساب + التوثيق
     * =========================================================
     */

    function displayUserNameWithVerification(
        profile
    ) {
        if (!profile) {
            return `
                <span
                    class="wfesc-user-name"
                >
                    @WFESC
                </span>
            `;
        }

        return `
            <span
                class="wfesc-user-name"
            >
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

    /*
     * =========================================================
     * الاسم الظاهر
     * =========================================================
     */

    function getProfileDisplayName(
        profile
    ) {
        if (!profile) {
            return "WFESC";
        }

        const name =
            cleanDisplayName(
                profile.full_name ||
                profile.name ||
                ""
            );

        if (name) {
            return name;
        }

        return displayUsername(
            profile.username
        );
    }

    /*
     * =========================================================
     * الأحرف الأولى للصورة الافتراضية
     * =========================================================
     */

    function getAvatarLetter(
        profile
    ) {
        const name =
            getProfileDisplayName(
                profile
            );

        if (!name) {
            return "W";
        }

        return name
            .charAt(0)
            .toUpperCase();
    }

    /*
     * =========================================================
     * CSS
     * =========================================================
     */

    function injectStyles() {
        if (
            document.getElementById(
                "wfesc-settings-auth-ui-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "wfesc-settings-auth-ui-style";

        style.textContent = `

        /*
         * =====================================================
         * ROOT
         * =====================================================
         */

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

        /*
         * =====================================================
         * CARD
         * =====================================================
         */

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
                rgba(
                    0,
                    0,
                    0,
                    .35
                );
        }

        /*
         * =====================================================
         * HEADER
         * =====================================================
         */

        .wfesc-auth-header {
            text-align: center;
            margin-bottom: 24px;
        }

        .wfesc-auth-logo {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            margin:
                0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #151515;
            border:
                1px solid #303030;
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            box-shadow:
                0 0 0 5px
                rgba(
                    255,
                    255,
                    255,
                    .025
                );
        }

        .wfesc-auth-title {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
        }

        .wfesc-auth-subtitle {
            margin:
                7px 0 0;
            color: #8f8f8f;
            font-size: 13px;
            line-height: 1.7;
        }

        /*
         * =====================================================
         * TABS
         * =====================================================
         */

        .wfesc-auth-tabs {
            display: grid;
            grid-template-columns:
                1fr 1fr;
            gap: 7px;
            padding: 5px;
            margin-bottom: 20px;
            background: #0b0b0b;
            border:
                1px solid #222222;
            border-radius: 13px;
        }

        .wfesc-auth-tab {
            appearance: none;
            border: 0;
            border-radius: 9px;
            min-height: 43px;
            padding:
                9px 10px;
            background:
                transparent;
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

        /*
         * =====================================================
         * FIELDS
         * =====================================================
         */

        .wfesc-field {
            margin-bottom: 14px;
        }

        .wfesc-field label {
            display: block;
            margin:
                0 0 7px;
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
            border:
                1px solid #292929;
            border-radius: 12px;
            outline: none;
            background: #0d0d0d;
            color: #ffffff;
            padding:
                0 14px;
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
                rgba(
                    255,
                    255,
                    255,
                    .035
                );
        }

        .wfesc-input::placeholder {
            color: #626262;
        }

        /*
         * =====================================================
         * INPUT ERROR
         * =====================================================
         */

        .wfesc-input.wfesc-error {
            border-color:
                #a13b3b;
            background:
                #160d0d;
            box-shadow:
                0 0 0 3px
                rgba(
                    161,
                    59,
                    59,
                    .10
                );
        }

        .wfesc-input.wfesc-success {
            border-color:
                #287a49;
            background:
                #0d1711;
        }

        .wfesc-field-error {
            display: none;
            margin-top: 6px;
            color: #ff9696;
            font-size: 11px;
            line-height: 1.6;
        }

        .wfesc-field-error.show {
            display: block;
        }

        /*
         * =====================================================
         * SHAKE
         * =====================================================
         */

        .wfesc-shake {
            animation:
                wfescInputShake
                .38s ease;
        }

        @keyframes wfescInputShake {

            0% {
                transform:
                    translateX(0);
            }

            20% {
                transform:
                    translateX(-7px);
            }

            40% {
                transform:
                    translateX(7px);
            }

            60% {
                transform:
                    translateX(-5px);
            }

            80% {
                transform:
                    translateX(5px);
            }

            100% {
                transform:
                    translateX(0);
            }
        }

        /*
         * =====================================================
         * PASSWORD
         * =====================================================
         */

        .wfesc-password-input {
            padding-left: 50px;
        }

        .wfesc-password-toggle {
            position: absolute;
            left: 6px;
            top: 50%;
            transform:
                translateY(-50%);
            width: 38px;
            height: 38px;
            border: 0;
            border-radius: 9px;
            background:
                transparent;
            color: #8c8c8c;
            cursor: pointer;
            font-size: 18px;
        }

        .wfesc-password-toggle:hover {
            background: #181818;
            color: #ffffff;
        }

        /*
         * =====================================================
         * HINT
         * =====================================================
         */

        .wfesc-hint {
            margin-top: 6px;
            color: #666666;
            font-size: 11px;
            line-height: 1.6;
        }

        /*
         * =====================================================
         * BUTTONS
         * =====================================================
         */

        .wfesc-primary-button,
        .wfesc-secondary-button,
        .wfesc-danger-button {
            width: 100%;
            min-height: 48px;
            border-radius: 12px;
            padding:
                10px 15px;
            border:
                1px solid #2b2b2b;
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
            transform:
                scale(.985);
        }

        .wfesc-secondary-button {
            background: #151515;
            color: #eeeeee;
        }

        .wfesc-secondary-button:hover {
            background: #1d1d1d;
            border-color:
                #3a3a3a;
        }

        .wfesc-danger-button {
            background: #160d0d;
            color: #ff9c9c;
            border-color:
                #3a1919;
        }

        .wfesc-danger-button:hover {
            background: #211010;
        }

        .wfesc-button-row {
            display: grid;
            gap: 9px;
            margin-top: 18px;
        }

        /*
         * =====================================================
         * LINK BUTTON
         * =====================================================
         */

        .wfesc-link-button {
            appearance: none;
            border: 0;
            background:
                transparent;
            color: #999999;
            padding: 8px;
            cursor: pointer;
            font-size: 13px;
        }

        .wfesc-link-button:hover {
            color: #ffffff;
        }

        /*
         * =====================================================
         * STATUS
         * =====================================================
         */

        .wfesc-status {
            display: none;
            margin:
                0 0 16px;
            padding:
                12px 14px;
            border-radius: 12px;
            border:
                1px solid #292929;
            background: #111111;
            color: #dddddd;
            font-size: 13px;
            line-height: 1.7;
            text-align: center;
        }

        .wfesc-status.show {
            display: block;
            animation:
                wfescStatusIn
                .2s ease;
        }

        .wfesc-status.success {
            border-color:
                #19472c;
            background:
                #0d1d13;
            color:
                #9be8b4;
        }

        .wfesc-status.error {
            border-color:
                        #6b2222;
            background:
                #1b0d0d;
            color:
                #ffaaaa;
        }

        @keyframes wfescStatusIn {
            from {
                opacity: 0;
                transform:
                    translateY(-4px);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0);
            }
        }

        /*
         * =====================================================
         * VERIFY BOX
         * =====================================================
         */

        .wfesc-verify-box {
            display: none;
            margin:
                0 0 18px;
            padding:
                15px;
            border-radius: 14px;
            border:
                1px solid #245f3b;
            background:
                linear-gradient(
                    145deg,
                    #0d2115,
                    #0b1710
                );
            color:
                #b8f3c9;
            text-align: center;
            line-height: 1.8;
            font-size: 13px;
        }

        .wfesc-verify-box.show {
            display: block;
            animation:
                wfescVerifyPulse
                1.1s ease-in-out
                infinite;
        }

        .wfesc-verify-icon {
            width: 34px;
            height: 34px;
            margin:
                0 auto 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
                #183d27;
            border:
                1px solid #2c7547;
            color:
                #8ee7aa;
            font-size: 18px;
            font-weight: 900;
        }

        .wfesc-verify-title {
            display: block;
            margin-bottom: 4px;
            color:
                #d8ffe3;
            font-weight: 800;
        }

        .wfesc-verify-text {
            color:
                #98cda8;
            font-size: 12px;
        }

        @keyframes wfescVerifyPulse {
            0%,
            100% {
                opacity: 1;
            }

            50% {
                opacity: .55;
            }
        }

        /*
         * =====================================================
         * ACCOUNT
         * =====================================================
         */

        .wfesc-account-card {
            display: none;
        }

        .wfesc-account-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding:
                15px;
            margin-bottom: 16px;
            border-radius: 15px;
            background:
                #0d0d0d;
            border:
                1px solid #252525;
        }

        .wfesc-account-avatar {
            width: 62px;
            height: 62px;
            flex:
                0 0 62px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
                #1a1a1a;
            border:
                1px solid #333333;
            color:
                #ffffff;
            font-size: 22px;
            font-weight: 900;
        }

        .wfesc-account-avatar img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
        }

        .wfesc-account-info {
            min-width: 0;
            flex: 1;
        }

        .wfesc-account-name-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
        }

        .wfesc-account-name {
            color:
                #ffffff;
            font-size: 17px;
            font-weight: 900;
            word-break: break-word;
        }

        .wfesc-account-username {
            margin-top: 4px;
            color:
                #969696;
            font-size: 13px;
            direction: ltr;
            text-align: right;
            word-break: break-all;
        }

        .wfesc-account-email {
            margin-top: 3px;
            color:
                #666666;
            font-size: 11px;
            direction: ltr;
            text-align: right;
            word-break: break-all;
        }

        /*
         * =====================================================
         * VERIFIED
         * =====================================================
         */

        .wfesc-verified {
            display: inline-flex;
            width: 19px;
            height: 19px;
            flex:
                0 0 19px;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background:
                #20a85a;
            color:
                #ffffff;
            font-size: 12px;
            font-weight: 900;
            line-height: 1;
            vertical-align: middle;
            box-shadow:
                0 0 0 2px
                rgba(
                    32,
                    168,
                    90,
                    .12
                );
        }

        .wfesc-user-name {
            display: inline;
        }

        /*
         * =====================================================
         * ACCOUNT ACTIONS
         * =====================================================
         */

        .wfesc-account-actions {
            display: grid;
            gap: 9px;
        }

        .wfesc-account-action {
            width: 100%;
            min-height: 47px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding:
                10px 13px;
            box-sizing: border-box;
            border-radius: 12px;
            border:
                1px solid #292929;
            background:
                #101010;
            color:
                #eeeeee;
            cursor: pointer;
            text-align: right;
            transition:
                background .18s ease,
                border-color .18s ease;
        }

        .wfesc-account-action:hover {
            background:
                #171717;
            border-color:
                #383838;
        }

        .wfesc-account-action-main {
            min-width: 0;
        }

        .wfesc-account-action-title {
            display: block;
            color:
                #eeeeee;
            font-size: 13px;
            font-weight: 800;
        }

        .wfesc-account-action-description {
            display: block;
            margin-top: 3px;
            color:
                #666666;
            font-size: 10px;
            line-height: 1.5;
        }

        .wfesc-account-action-icon {
            width: 34px;
            height: 34px;
            flex:
                0 0 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background:
                #191919;
            color:
                #aaaaaa;
            font-size: 16px;
        }

        /*
         * =====================================================
         * SECTION
         * =====================================================
         */

        .wfesc-section {
            margin-top: 18px;
            padding-top: 18px;
            border-top:
                1px solid #202020;
        }

        .wfesc-section-title {
            margin:
                0 0 10px;
            color:
                #dddddd;
            font-size: 14px;
            font-weight: 800;
        }

        .wfesc-section-text {
            margin: 0;
            color:
                #777777;
            font-size: 12px;
            line-height: 1.8;
        }

        /*
         * =====================================================
         * LOADING
         * =====================================================
         */

        .wfesc-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            min-height: 130px;
            color:
                #888888;
            font-size: 13px;
        }

        .wfesc-loading-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background:
                #aaaaaa;
            animation:
                wfescLoadingDot
                1s infinite;
        }

        .wfesc-loading-dot:nth-child(2) {
            animation-delay:
                .15s;
        }

        .wfesc-loading-dot:nth-child(3) {
            animation-delay:
                .3s;
        }

        @keyframes wfescLoadingDot {
            0%,
            70%,
            100% {
                opacity: .25;
                transform:
                    translateY(0);
            }

            35% {
                opacity: 1;
                transform:
                    translateY(-4px);
            }
        }

        /*
         * =====================================================
         * DIVIDER
         * =====================================================
         */

        .wfesc-divider {
            height: 1px;
            margin:
                17px 0;
            background:
                #202020;
        }

        /*
         * =====================================================
         * RECOVERY
         * =====================================================
         */

        .wfesc-recovery-card {
            display: none;
        }

        .wfesc-recovery-description {
            margin:
                0 0 17px;
            color:
                #888888;
            font-size: 12px;
            line-height: 1.8;
        }

        /*
         * =====================================================
         * DISABLED
         * =====================================================
         */

        .wfesc-disabled {
            opacity: .55;
            pointer-events: none;
        }

        /*
         * =====================================================
         * RESPONSIVE
         * =====================================================
         */

        @media (
            max-width: 520px
        ) {

            #wfesc-settings-auth-root,
            .wfesc-auth-root {
                margin:
                    18px auto;
                padding:
                    0 10px;
            }

            .wfesc-auth-card {
                padding:
                    18px;
                border-radius:
                    17px;
            }

            .wfesc-auth-title {
                font-size:
                    21px;
            }

            .wfesc-account-header {
                align-items:
                    flex-start;
            }

            .wfesc-account-avatar {
                width:
                    55px;
                height:
                    55px;
                flex-basis:
                    55px;
            }
        }

        `;

        document.head.appendChild(style);
    }

    /*
     * =========================================================
     * إنشاء عنصر الجذر
     * =========================================================
     */

    function ensureRoot() {
        const existing =
            document.querySelector(
                "[data-wfesc-auth]"
            ) ||
            document.querySelector(
                "#wfesc-auth"
            ) ||
            document.querySelector(
                "#wfesc-settings-auth-root"
            );

        if (existing) {
            root = existing;

            root.classList.add(
                "wfesc-auth-root"
            );

            return root;
        }

        root =
            document.createElement(
                "div"
            );

        root.id =
            "wfesc-settings-auth-root";

        root.className =
            "wfesc-auth-root";

        document.body.appendChild(
            root
        );

        return root;
    }

    /*
     * =========================================================
     * HTML
     * =========================================================
     */

    function buildUI() {

        if (!root) {
            ensureRoot();
        }

        root.innerHTML = `

            <div
                class="wfesc-auth-card"
                id="wfesc-auth-card"
            >

                <div
                    class="wfesc-auth-header"
                >

                    <div
                        class="wfesc-auth-logo"
                    >
                        WF
                    </div>

                    <h2
                        class="wfesc-auth-title"
                    >
                        حساب WFESC
                    </h2>

                    <p
                        class="wfesc-auth-subtitle"
                    >
                        تسجيل الدخول وإدارة حسابك
                    </p>

                </div>

                <!-- ===================================== -->
                <!-- STATUS -->
                <!-- ===================================== -->

                <div
                    class="wfesc-status"
                    id="wfesc-status"
                    aria-live="polite"
                ></div>

                <!-- ===================================== -->
                <!-- VERIFY -->
                <!-- ===================================== -->

                <div
                    class="wfesc-verify-box"
                    id="wfesc-verify-box"
                    aria-live="polite"
                >

                    <div
                        class="wfesc-verify-icon"
                    >
                        ✓
                    </div>

                    <span
                        class="wfesc-verify-title"
                    >
                        تم إنشاء الحساب
                    </span>

                    <span
                        class="wfesc-verify-text"
                    >
                        تحقق من بريدك الإلكتروني، وتأكد أيضًا من مجلد الرسائل غير المرغوب فيها.
                    </span>

                </div>

                <!-- ===================================== -->
                <!-- AUTH AREA -->
                <!-- ===================================== -->

                <div
                    id="wfesc-auth-area"
                >

                    <div
                        class="wfesc-auth-tabs"
                    >

                        <button
                            type="button"
                            class="wfesc-auth-tab active"
                            data-mode="login"
                            id="wfesc-login-tab"
                        >
                            تسجيل الدخول
                        </button>

                        <button
                            type="button"
                            class="wfesc-auth-tab"
                            data-mode="register"
                            id="wfesc-register-tab"
                        >
                            إنشاء حساب
                        </button>

                    </div>

                    <!-- ================================= -->
                    <!-- LOGIN -->
                    <!-- ================================= -->

                    <form
                        id="wfesc-login-form"
                        novalidate
                    >

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-login-email"
                            >
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfesc-login-email"
                                class="wfesc-input"
                                type="email"
                                autocomplete="email"
                                inputmode="email"
                                placeholder="example@email.com"
                                maxlength="120"
                            >

                            <div
                                class="wfesc-field-error"
                                id="wfesc-login-email-error"
                            ></div>

                        </div>

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-login-password"
                            >
                                كلمة المرور
                            </label>

                            <div
                                class="wfesc-input-wrap"
                            >

                                <input
                                    id="wfesc-login-password"
                                    class="wfesc-input wfesc-password-input"
                                    type="password"
                                    autocomplete="current-password"
                                    placeholder="أدخل كلمة المرور"
                                    maxlength="16"
                                >

                                <button
                                    type="button"
                                    class="wfesc-password-toggle"
                                    id="wfesc-login-password-toggle"
                                    aria-label="إظهار كلمة المرور"
                                    title="إظهار كلمة المرور"
                                >
                                    🙈
                                </button>

                            </div>

                            <div
                                class="wfesc-field-error"
                                id="wfesc-login-password-error"
                            ></div>

                        </div>

                        <button
                            type="submit"
                            class="wfesc-primary-button"
                            id="wfesc-login-submit"
                        >
                            تسجيل الدخول
                        </button>

                        <div
                            style="
                                text-align:center;
                                margin-top:8px;
                            "
                        >

                            <button
                                type="button"
                                class="wfesc-link-button"
                                id="wfesc-forgot-button"
                            >
                                نسيت كلمة المرور؟
                            </button>

                        </div>

                    </form>

                    <!-- ================================= -->
                    <!-- REGISTER -->
                    <!-- ================================= -->

                    <form
                        id="wfesc-register-form"
                        novalidate
                        style="display:none;"
                    >

                        <!-- NAME -->

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-register-name"
                            >
                                الاسم
                            </label>

                            <input
                                id="wfesc-register-name"
               
                                          class="wfesc-input"
                                type="text"
                                autocomplete="name"
                                placeholder="اكتب اسمك"
                                maxlength="40"
                            >

                            <div
                                class="wfesc-field-error"
                                id="wfesc-register-name-error"
                            ></div>

                        </div>

                        <!-- USERNAME -->

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-register-username"
                            >
                                اسم المستخدم
                            </label>

                            <input
                                id="wfesc-register-username"
                                class="wfesc-input"
                                type="text"
                                autocomplete="username"
                                autocapitalize="none"
                                spellcheck="false"
                                placeholder="مثال: ali12"
                                maxlength="9"
                            >

                            <div
                                class="wfesc-hint"
                            >
                                3 إلى 9 خانات — أحرف إنجليزية وأرقام فقط.
                            </div>

                            <div
                                class="wfesc-field-error"
                                id="wfesc-register-username-error"
                            ></div>

                        </div>

                        <!-- EMAIL -->

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-register-email"
                            >
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfesc-register-email"
                                class="wfesc-input"
                                type="email"
                                autocomplete="email"
                                inputmode="email"
                                placeholder="example@email.com"
                                maxlength="120"
                            >

                            <div
                                class="wfesc-field-error"
                                id="wfesc-register-email-error"
                            ></div>

                        </div>

                        <!-- PASSWORD -->

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-register-password"
                            >
                                كلمة المرور
                            </label>

                            <div
                                class="wfesc-input-wrap"
                            >

                                <input
                                    id="wfesc-register-password"
                                    class="wfesc-input wfesc-password-input"
                                    type="password"
                                    autocomplete="new-password"
                                    placeholder="6 إلى 16 خانة"
                                    maxlength="16"
                                >

                                <button
                                    type="button"
                                    class="wfesc-password-toggle"
                                    id="wfesc-register-password-toggle"
                                    aria-label="إظهار كلمة المرور"
                                    title="إظهار كلمة المرور"
                                >
                                    🙈
                                </button>

                            </div>

                            <div
                                class="wfesc-field-error"
                                id="wfesc-register-password-error"
                            ></div>

                        </div>

                        <!-- CONFIRM PASSWORD -->

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-register-confirm"
                            >
                                تأكيد كلمة المرور
                            </label>

                            <div
                                class="wfesc-input-wrap"
                            >

                                <input
                                    id="wfesc-register-confirm"
                                    class="wfesc-input wfesc-password-input"
                                    type="password"
                                    autocomplete="new-password"
                                    placeholder="أعد كتابة كلمة المرور"
                                    maxlength="16"
                                >

                                <button
                                    type="button"
                                    class="wfesc-password-toggle"
                                    id="wfesc-register-confirm-toggle"
                                    aria-label="إظهار كلمة المرور"
                                    title="إظهار كلمة المرور"
                                >
                                    🙈
                                </button>

                            </div>

                            <div
                                class="wfesc-field-error"
                                id="wfesc-register-confirm-error"
                            ></div>

                        </div>

                        <button
                            type="submit"
                            class="wfesc-primary-button"
                            id="wfesc-register-submit"
                        >
                            إنشاء الحساب
                        </button>

                    </form>

                    <!-- ================================= -->
                    <!-- RECOVERY EMAIL -->
                    <!-- ================================= -->

                    <div
                        class="wfesc-recovery-card"
                        id="wfesc-recovery-card"
                    >

                        <div
                            class="wfesc-section-title"
                        >
                            استعادة كلمة المرور
                        </div>

                        <p
                            class="wfesc-recovery-description"
                        >
                            أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
                        </p>

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-recovery-email"
                            >
                                البريد الإلكتروني
                            </label>

                            <input
                                id="wfesc-recovery-email"
                                class="wfesc-input"
                                type="email"
                                autocomplete="email"
                                placeholder="example@email.com"
                                maxlength="120"
                            >

                            <div
                                class="wfesc-field-error"
                                id="wfesc-recovery-email-error"
                            ></div>

                        </div>

                        <button
                            type="button"
                            class="wfesc-primary-button"
                            id="wfesc-recovery-submit"
                        >
                            إرسال رابط الاستعادة
                        </button>

                        <div
                            style="
                                text-align:center;
                                margin-top:8px;
                            "
                        >

                            <button
                                type="button"
                                class="wfesc-link-button"
                                id="wfesc-recovery-back"
                            >
                                العودة لتسجيل الدخول
                            </button>

                        </div>

                    </div>

                    <!-- ================================= -->
                    <!-- RECOVERY PASSWORD -->
                    <!-- ================================= -->

                    <div
                        class="wfesc-recovery-card"
                        id="wfesc-recovery-password-card"
                    >

                        <div
                            class="wfesc-section-title"
                        >
                            تعيين كلمة مرور جديدة
                        </div>

                        <p
                            class="wfesc-recovery-description"
                        >
                            أدخل كلمة المرور الجديدة ثم أكدها مرة أخرى.
                        </p>

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-recovery-password"
                            >
                                كلمة المرور الجديدة
                            </label>

                            <div
                                class="wfesc-input-wrap"
                            >

                                <input
                                    id="wfesc-recovery-password"
                                    class="wfesc-input wfesc-password-input"
                                    type="password"
                                    autocomplete="new-password"
                                    placeholder="6 إلى 16 خانة"
                                    maxlength="16"
                                >

                                <button
                                    type="button"
                                    class="wfesc-password-toggle"
                                    id="wfesc-recovery-password-toggle"
                                    aria-label="إظهار كلمة المرور"
                                    title="إظهار كلمة المرور"
                                >
                                    🙈
                                </button>

                            </div>

                            <div
                                class="wfesc-field-error"
                                id="wfesc-recovery-password-error"
                            ></div>

                        </div>

                        <div
                            class="wfesc-field"
                        >

                            <label
                                for="wfesc-recovery-confirm"
                            >
                                تأكيد كلمة المرور
                            </label>

                            <div
                                class="wfesc-input-wrap"
                            >

                                <input
                                    id="wfesc-recovery-confirm"
                                    class="wfesc-input wfesc-password-input"
                                    type="password"
                                    autocomplete="new-password"
                                    placeholder="أعد كتابة كلمة المرور"
                                    maxlength="16"
                                >

                                <button
                                    type="button"
                                    class="wfesc-password-toggle"
                                    id="wfesc-recovery-confirm-toggle"
                                    aria-label="إظهار كلمة المرور"
                                    title="إظهار كلمة المرور"
                                >
                                    🙈
                                </button>

                            </div>

                            <div
                                class="wfesc-field-error"
                                id="wfesc-recovery-confirm-error"
                            ></div>

                        </div>

                        <button
                            type="button"
                            class="wfesc-primary-button"
                            id="wfesc-recovery-password-submit"
                        >
                            حفظ كلمة المرور
                        </button>

                    </div>

                </div>

                <!-- ===================================== -->
                <!-- ACCOUNT -->
                <!-- ===================================== -->

                <div
                    class="wfesc-account-card"
                    id="wfesc-account-card"
                >

                    <div
                        class="wfesc-account-header"
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
                                class="wfesc-account-name-row"
                            >

                                <span
                                    class="wfesc-account-name"
                                    id="wfesc-account-name"
                                >
                                    WFESC
                                </span>

                                <span
                                    id="wfesc-account-verified"
                                ></span>

                            </div>

                            <div
                                class="wfesc-account-username"
                                id="wfesc-account-username"
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
                            class="wfesc-account-action"
                            id="wfesc-profile-button"
                        >

                            <span
                                class="wfesc-account-action-main"
                            >

                                <span
                                    class="wfesc-account-action-title"
                                >
                                    إدارة الحساب
                                </span>

                                <span
                                    class="wfesc-account-action-description"
                                >
                                    تعديل الاسم واسم المستخدم والصورة والنبذة
                                </span>

                            </span>

                            <span
                                class="wfesc-account-action-icon"
                            >
                                👤
                            </span>

                        </button>

                        <button
                            type="button"
                            class="wfesc-account-action"
                            id="wfesc-change-password-button"
                        >

                            <span
                                class="wfesc-account-action-main"
                            >

                                <span
                                    class="wfesc-account-action-title"
                                >
                                    تغيير كلمة المرور
                                </span>

                                <span
                                    class="wfesc-account-action-description"
                                >
                                    تحديث كلمة مرور حسابك
                                </span>

                            </span>

                            <span
                                class="wfesc-account-action-icon"
                            >
                                🔐
                            </span>

                        </button>

                        <button
                            type="button"
                            class="wfesc-account-action"
                            id="wfesc-logout-button"
                        >

                            <span
                                class="wfesc-account-action-main"
                            >

                                <span
                                    class="wfesc-account-action-title"
                                >
                                    تسجيل الخروج
                                </span>

                                <span
                                    class="wfesc-account-action-description"
                                >
                                    الخروج من الحساب على هذا الجهاز
                                </span>

                            </span>

                            <span
                                class="wfesc-account-action-icon"
                            >
                                ↪
                            </span>

                        </button>

                        <button
                            type="button"
                            class="wfesc-account-action"
                            id="wfesc-delete-button"
                        >

                            <span
                                class="wfesc-account-action-main"
                            >

                                <span
                                    class="wfesc-account-action-title"
                                >
                                    حذف الحساب
                                </span>

                                <span
                                    class="wfesc-account-action-description"
                                >
                                    حذف الحساب نهائيًا
                                </span>

                            </span>

                            <span
                                class="wfesc-account-action-icon"
                            >
                                🗑
                            </span>

                        </button>

                    </div>

                    <div
                        class="wfesc-section"
                    >

                        <div
                            class="wfesc-section-title"
                        >
                       
