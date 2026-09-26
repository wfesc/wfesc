/* =========================================================
   WFESC SETTINGS AUTH
   settings-auth.js
   الإصدار المحسن
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       منع التحميل أكثر من مرة
    ===================================================== */

    if (window.WFESCSettingsAuth) {
        return;
    }


    /* =====================================================
       التحقق من CONFIG
    ===================================================== */

    if (!window.WFESCSettingsAuthConfig) {

        console.error(
            "WFESC Auth: settings-auth-config.js غير محمّل."
        );

        return;
    }


    const CONFIG =
        window.WFESCSettingsAuthConfig;


    /* =====================================================
       التحقق من Supabase
    ===================================================== */

    if (!window.supabase) {

        console.error(
            "WFESC Auth: مكتبة Supabase غير محمّلة."
        );

        return;
    }


    /* =====================================================
       اتصال Supabase
    ===================================================== */

    const supabaseClient =
        window.supabase.createClient(
            CONFIG.supabaseUrl,
            CONFIG.supabaseKey
        );


    /* =====================================================
       الحالة
    ===================================================== */

    let currentUser = null;
    let currentSession = null;
    let currentProfile = null;


    /* =====================================================
       روابط النظام
    ===================================================== */

    const SETTINGS_URL =
        "https://wfesc.github.io/wfesc/settings.html";


    const PROFILE_URL =
        "profile.html";


    /* =====================================================
       حدود كلمة المرور
    ===================================================== */

    const PASSWORD_MIN = 6;
    const PASSWORD_MAX = 16;


    /* =====================================================
       حدود اسم العرض
    ===================================================== */

    const DISPLAY_NAME_MIN = 1;
    const DISPLAY_NAME_MAX = 15;


    /* =====================================================
       أدوات عامة
    ===================================================== */

    function getClient() {

        return supabaseClient;

    }


    function getUser() {

        return currentUser;

    }


    function getSession() {

        return currentSession;

    }


    function getProfile() {

        return currentProfile;

    }


    function getCurrentUserId() {

        return currentUser
            ? currentUser.id || null
            : null;

    }


    /* =====================================================
       أحداث النظام
    ===================================================== */

    function dispatchAuthChanged(eventName) {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "WFESCAuthChanged",
                    {
                        detail: {
                            user:
                                currentUser,

                            session:
                                currentSession,

                            profile:
                                currentProfile,

                            event:
                                eventName
                        }
                    }
                )
            );

        } catch (error) {

            console.warn(
                "WFESC Auth: تعذر إرسال حدث المصادقة.",
                error
            );

        }

    }


    function dispatchEmailVerified() {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "WFESCEmailVerified",
                    {
                        detail: {
                            user:
                                currentUser,

                            session:
                                currentSession,

                            profile:
                                currentProfile
                        }
                    }
                )
            );

        } catch (error) {

            console.warn(
                "WFESC Auth: تعذر إرسال حدث التحقق.",
                error
            );

        }

    }


    function dispatchProfileUpdated() {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "WFESCProfileUpdated",
                    {
                        detail:
                            currentProfile
                    }
                )
            );

        } catch (error) {

            console.warn(
                "WFESC Auth: تعذر إرسال حدث تحديث الملف.",
                error
            );

        }

    }


    /* =====================================================
       البريد الإلكتروني
    ===================================================== */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                String(email || "").trim()
            );

    }


    /* =====================================================
       كلمة المرور
    ===================================================== */

    function validatePassword(password) {

        password =
            String(password || "");


        if (!password) {

            return {
                valid: false,

                error:
                    new Error(
                        "يرجى إدخال كلمة المرور."
                    )
            };

        }


        if (
            password.length <
            PASSWORD_MIN
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
                    )
            };

        }


        if (
            password.length >
            PASSWORD_MAX
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "كلمة المرور يجب ألا تتجاوز 16 حرفًا."
                    )
            };

        }


        return {
            valid: true,
            error: null
        };

    }


    /* =====================================================
       اسم العرض

       يسمح بالعربي والإنجليزي والأرقام والرموز.
       الحد الأقصى 15 حرفًا.
    ===================================================== */

    function validateDisplayName(name) {

        name =
            String(name || "").trim();


        if (!name) {

            return {
                valid: false,

                error:
                    new Error(
                        "يرجى إدخال الاسم."
                    )
            };

        }


        const length =
            [...name].length;


        if (
            length <
            DISPLAY_NAME_MIN
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "يرجى إدخال اسم صحيح."
                    )
            };

        }


        if (
            length >
            DISPLAY_NAME_MAX
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "الاسم يجب ألا يتجاوز 15 حرفًا."
                    )
            };

        }


        return {
            valid: true,
            error: null
        };

    }


    /* =====================================================
       حدود اسم المستخدم
    ===================================================== */

    function getUsernameLimits() {

        const usernameConfig =
            CONFIG.username || {};


        return {

            min:
                Number(
                    usernameConfig.minLength || 3
                ),

            max:
                Number(
                    usernameConfig.maxLength || 9
                )

        };

    }


    /* =====================================================
       تنظيف اسم المستخدم

       المسموح:
       a-z
       0-9

       يتم تحويل الأحرف الكبيرة إلى صغيرة.
    ===================================================== */

    function sanitizeUsername(username) {

        username =
            String(username || "")
                .toLowerCase();


        username =
            username.replace(
                /[^a-z0-9]/g,
                ""
            );


        const limits =
            getUsernameLimits();


        return username.slice(
            0,
            limits.max
        );

    }


    /* =====================================================
       التحقق من اسم المستخدم
    ===================================================== */

    function validateUsername(username) {

        username =
            String(username || "").trim();


        const limits =
            getUsernameLimits();


        const length =
            [...username].length;


        if (!username) {

            return {
                valid: false,

                error:
                    new Error(
                        "يرجى إدخال اسم المستخدم."
                    )
            };

        }


        if (
            length <
            limits.min
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "اسم المستخدم يجب أن يتكون من 3 أحرف أو أرقام على الأقل."
                    )
            };

        }


        if (
            length >
            limits.max
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "اسم المستخدم يجب ألا يتجاوز 9 أحرف أو أرقام."
                    )
            };

        }


        if (
            !/^[a-z0-9]+$/.test(
                username
            )
        ) {

            return {
                valid: false,

                error:
                    new Error(
                        "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام فقط."
                    )
            };

        }


        return {
            valid: true,
            error: null
        };

    }


    /* =====================================================
       إنشاء اسم مستخدم افتراضي
    ===================================================== */

    function getDefaultUsername(user) {

        const limits =
            getUsernameLimits();


        if (!user) {

            return "wfesc";

        }


        /* ---------------------------------------------
           من user_metadata
        --------------------------------------------- */

        if (
            user.user_metadata &&
            user.user_metadata.username
        ) {

            const metadataUsername =
                sanitizeUsername(
                    user.user_metadata.username
                );


            if (
                metadataUsername.length >=
                limits.min
            ) {

                return metadataUsername;

            }

        }


        /* ---------------------------------------------
           من البريد
        --------------------------------------------- */

        if (user.email) {

            const emailName =
                String(
                    user.email
                ).split("@")[0];


            const cleaned =
                sanitizeUsername(
                    emailName
                );


            if (
                cleaned.length >=
                limits.min
            ) {

                return cleaned;

            }

        }


        /* ---------------------------------------------
           fallback
        --------------------------------------------- */

        return "wfesc";

    }


    /* =====================================================
       اسم العرض الافتراضي من البريد
    ===================================================== */

    function getDefaultDisplayName(user) {

        if (
            !user ||
            !user.email
        ) {

            return "";

        }


        const emailName =
            String(
                user.email
            ).split("@")[0];


        return [...emailName]
            .slice(
                0,
                DISPLAY_NAME_MAX
            )
            .join("")
            .trim();

    }


    /* =====================================================
       استخراج رسالة الخطأ الأصلية
    ===================================================== */

    function getErrorText(error) {

        if (!error) {
            return "";
        }


        return String(
            error.message ||
            error.error_description ||
            error.msg ||
            ""
        ).trim();

    }


    /* =====================================================
       التعرف على البريد الموجود مسبقًا
    ===================================================== */

    function isExistingEmailError(error) {

        const message =
            getErrorText(
                error
            ).toLowerCase();


        return (
            message.includes(
                "already registered"
            ) ||

            message.includes(
                "user already registered"
            ) ||

            message.includes(
                "already exists"
            ) ||

            message.includes(
                "email already"
            ) ||

            (
                message.includes("email") &&
                message.includes("exist")
            ) ||

            message.includes(
                "duplicate"
            )
        );

    }


    /* =====================================================
       التعرف على خطأ كلمة المرور
    ===================================================== */

    function isWrongPasswordError(error) {

        const message =
            getErrorText(
                error
            ).toLowerCase();


        const code =
            String(
                error &&
                error.code
                    ? error.code
                    : ""
            ).toLowerCase();


        return (
            code ===
                "invalid_credentials" ||

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
            )
        );

    }


    /* =====================================================
       Profile
    ===================================================== */

    async function fetchProfile(userId) {

        if (!userId) {

            currentProfile = null;

            return null;

        }


        let result;


        try {

            result =
                await supabaseClient
                    .from(
                        CONFIG.profilesTable
                    )
                    .select("*")
                    .eq(
                        "id",
                        userId
                    )
                    .maybeSingle();

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ في جلب profile:",
                error
            );

            return null;

        }


        if (result.error) {

            console.error(
                "WFESC Auth: خطأ في جلب profile:",
                result.error
            );

            return null;

        }


        currentProfile =
            result.data || null;


        return currentProfile;

    }


    /* =====================================================
       فحص وجود اسم المستخدم
       
       يتم استخدامه قبل إنشاء حساب جديد.
       لا يتم إنشاء أي حساب إذا كان الاسم مأخوذًا.
    ===================================================== */

    async function usernameExists(username) {

        username =
            sanitizeUsername(
                username
            );


        const validation =
            validateUsername(
                username
            );


        if (!validation.valid) {

            return {
                exists: false,
                error:
                    validation.error
            };

        }


        let result;


        try {

            result =
                await supabaseClient
                    .from(
                        CONFIG.profilesTable
                    )
                    .select("id")
                    .eq(
                        "username",
                        username
                    )
                    .limit(1);

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ أثناء فحص اسم المستخدم:",
                error
            );

            return {
                exists: false,
                error:
                    error
            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: خطأ أثناء فحص اسم المستخدم:",
                result.error
            );

            return {
                exists: false,
                error:
                    result.error
            };

        }


        return {
            exists:
                Array.isArray(
                    result.data
                ) &&
                result.data.length > 0,

            error:
                null
        };

    }


    /* =====================================================
       إنشاء Profile تلقائيًا
    ===================================================== */

    async function ensureProfile(user) {

        if (!user) {

            currentProfile = null;

            return null;

        }


        const existingProfile =
            await fetchProfile(
                user.id
            );


        if (existingProfile) {

            return existingProfile;

        }


        const defaultUsername =
            getDefaultUsername(
                user
            );


        const profileData = {

            id:
                user.id,

            username:
                defaultUsername,

            avatar_url:
                null,

            bio:
                null

        };


        let result;


        try {

            result =
                await supabaseClient
                    .from(
                        CONFIG.profilesTable
                    )
                    .insert(
                        profileData
                    )
                    .select("*")
                    .maybeSingle();

        } catch (error) {

            console.warn(
                "WFESC Auth: تعذر إنشاء profile:",
                error
            );

            currentProfile = null;

            return null;

        }


        if (result.error) {

            /*
             * ممكن يصير تعارض إذا تم إنشاء
             * profile بنفس اللحظة من مكان آخر.
             *
             * لذلك نحاول جلبه مرة ثانية.
             */

            const retryProfile =
                await fetchProfile(
                    user.id
                );


            if (retryProfile) {

                return retryProfile;

            }


            console.warn(
                "WFESC Auth: تعذر إنشاء profile:",
                result.error
            );

            currentProfile = null;

            return null;

        }


        currentProfile =
            result.data || null;


        return currentProfile;

    }


    /* =====================================================
       تحديث Profile
    ===================================================== */

    async function updateProfile(updates) {

        if (!currentUser) {

            return {
                data: null,

                error:
                    new Error(
                        "يجب تسجيل الدخول أولاً."
                    )
            };

        }


        if (
            !updates ||
            typeof updates !== "object"
        ) {

            return {
                data: null,

                error:
                    new Error(
                        "بيانات التحديث غير صحيحة."
                    )
            };

        }


        const allowedUpdates = {};


        /* ---------------------------------------------
           Username
        --------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "username"
            )
        ) {

            const username =
                sanitizeUsername(
                    updates.username
                );


            const validation =
                validateUsername(
                    username
                );


            if (!validation.valid) {

                return {
                    data: null,
                    error:
                        validation.error
                };

            }


            allowedUpdates.username =
                username;

        }


        /* ---------------------------------------------
           Avatar
        --------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "avatar_url"
            )
        ) {

            allowedUpdates.avatar_url =
                updates.avatar_url || null;

        }


        /* ---------------------------------------------
           Bio
        --------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "bio"
            )
        ) {

            allowedUpdates.bio =
                updates.bio || null;

        }


        if (
            Object.keys(
                allowedUpdates
            ).length === 0
        ) {

            return {
                data:
                    currentProfile,

                error:
                    null
            };

        }


        let result;


        try {

            result =
                await supabaseClient
                    .from(
                        CONFIG.profilesTable
                    )
                    .update(
                        allowedUpdates
                    )
                    .eq(
                        "id",
                        currentUser.id
                    )
                    .select("*")
                    .maybeSingle();

        } catch (error) {

            console.error(
                "WFESC Auth: فشل تحديث profile:",
                error
            );

            return {
                data: null,
                error: error
            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تحديث profile:",
                result.error
            );

            return {
                data: null,

                error:
                    result.error
            };

        }


        currentProfile =
            result.data || null;


        dispatchProfileUpdated();


        return {
            data:
                currentProfile,

            error:
                null
        };

    }


    /* =====================================================
       تحديث بيانات الحساب في Auth

       اسم العرض يخزن في user_metadata
       ولا يحتاج عمود جديد في profiles.
    ===================================================== */

    async function updateAccountMetadata(updates) {

        if (!currentUser) {

            return {
                data: null,

                error:
                    new Error(
                        "يجب تسجيل الدخول أولاً."
                    )
            };

        }


        if (
            !updates ||
            typeof updates !== "object"
        ) {

            return {
                data: null,

                error:
                    new Error(
                        "بيانات التحديث غير صحيحة."
                    )
            };

        }


        const metadata = {

            ...(currentUser.user_metadata || {})

        };


        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "name"
            )
        ) {

            const name =
                String(
                    updates.name || ""
                ).trim();


            const validation =
                validateDisplayName(
                    name
                );


            if (!validation.valid) {

                return {
                    data: null,

                    error:
                        validation.error
                };

            }


            metadata.name =
                name;

            metadata.display_name =
                name;

        }


        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "display_name"
            )
        ) {

            const displayName =
                String(
                    updates.display_name || ""
                ).trim();


            const validation =
                validateDisplayName(
                    displayName
                );


            if (!validation.valid) {

                return {
                    data: null,

                    error:
                        validation.error
                };

            }


            metadata.name =
                displayName;

            metadata.display_name =
                displayName;

        }


        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "username"
            )
        ) {

            const username =
                sanitizeUsername(
                    updates.username
                );


            const validation =
                validateUsername(
                    username
                );


            if (!validation.valid) {

                return {
                    data: null,

                    error:
                        validation.error
                };

            }


            metadata.username =
                username;

        }


        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .updateUser({
                        data:
                            metadata
                    });

        } catch (error) {

            console.error(
                "WFESC Auth: فشل تحديث بيانات الحساب:",
                error
            );

            return {
                data: null,
                error: error
            };

        }


        if (result.error) {

            return {
                data: null,

                error:
                    result.error
            };

        }


        if (result.data.user) {

            currentUser =
                result.data.user;

        }


        dispatchAuthChanged(
            "USER_UPDATED"
        );


        return {
            data:
                result.data,

            error:
                null
        };

    }


    /* =====================================================
       إنشاء الحساب

       يدعم الشكل الجديد:
       signUp(name, email, password, username)

       ويدعم الشكل القديم:
       signUp(email, password, username)
    ===================================================== */

    async function signUp(
        name,
        email,
        password,
        username
    ) {

        /*
         * دعم الاستدعاء القديم
         *
         * signUp(email, password, username)
         */

        if (
            arguments.length === 3
        ) {

            username =
                password;

            password =
                email;

            email =
                name;

            name =
                "";

        }


        name =
            String(
                name || ""
            ).trim();

        email =
            String(
                email || ""
            ).trim();

        password =
            String(
                password || ""
            );

        username =
            sanitizeUsername(
                username
            );


        /* ---------------------------------------------
           البريد
        --------------------------------------------- */

        if (!email) {

            return {
                data: null,

                error:
                    new Error(
                        "يرجى إدخال البريد الإلكتروني."
                    )
            };

        }


        if (!isValidEmail(email)) {

            return {
                data: null,

                error:
                    new Error(
                        "يرجى إدخال بريد إلكتروني صحيح."
                    )
            };

        }


        /* ---------------------------------------------
           الاسم
        --------------------------------------------- */

        if (name) {

            const nameValidation =
                validateDisplayName(
                    name
                );


            if (
                !nameValidation.valid
            ) {

                return {
                    data: null,

                    error:
                        nameValidation.error
                };

            }

        } else {

            name =
                getDefaultDisplayName({
                    email:
                        email
                });

        }


        /* ---------------------------------------------
           Username
        --------------------------------------------- */

        const usernameValidation =
            validateUsername(
                username
            );


        if (
            !usernameValidation.valid
        ) {

            return {
                data: null,

                error:
                    usernameValidation.error
            };

        }


        /* ---------------------------------------------
           فحص Username قبل إنشاء الحساب
        --------------------------------------------- */

        const usernameCheck =
            await usernameExists(
                username
            );


        if (
            usernameCheck.error
        ) {

            return {
                data: null,

                error:
                    new Error(
                        "تعذر التحقق من توفر اسم المستخدم حاليًا."
                    )
            };

        }


        if (
            usernameCheck.exists
        ) {

            const usernameError =
                new Error(
                    "اسم المستخدم مأخوذ مسبقًا"
                );

            usernameError.code =
                "USERNAME_ALREADY_EXISTS";


            return {
                data: null,

                error:
                    usernameError
            };

        }


        /* ---------------------------------------------
           Password
        --------------------------------------------- */

        const passwordValidation =
            validatePassword(
                password
            );


        if (
            !passwordValidation.valid
        ) {

            return {
                data: null,

                error:
                    passwordValidation.error
            };

        }


        let result;


        try {

            result =
                await supabaseClient.auth.signUp({

                    email:
                        email,

                    password:
                        password,

                    options: {

                        data: {

                            username:
                                username,

                            name:
                                name,

                            display_name:
                                name

                        },

                        emailRedirectTo:
                            SETTINGS_URL

                    }

                });

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ أثناء إنشاء الحساب:",
                error
            );

            return {
                data: null,
                error: error
            };

        }


        /* ---------------------------------------------
           خطأ Supabase
        --------------------------------------------- */

        if (result.error) {

            let finalError =
                result.error;


            /*
             * Username conflict
             *
             * حماية إضافية في حال حصل تعارض
             * بين الفحص السابق وإنشاء الحساب.
             */

            if (
                String(
                    result.error.code || ""
                ) === "23505"
            ) {

                const errorMessage =
                    getErrorText(
                        result.error
                    ).toLowerCase();


                if (
                    errorMessage.includes(
                        "username"
                    )
                ) {

                    finalError =
                        new Error(
                            "اسم المستخدم مأخوذ مسبقًا"
                        );

                    finalError.code =
                        "USERNAME_ALREADY_EXISTS";

                }

            }


            /*
             * Email conflict
             */

            if (
                isExistingEmailError(
                    result.error
                )
            ) {

                finalError =
                    new Error(
                        "أنت تملك حساب بالفعل"
                    );

                finalError.code =
                    "EMAIL_ALREADY_EXISTS";

            }


            console.error(
                "WFESC Auth: فشل إنشاء الحساب:",
                result.error
            );


            return {
                data: null,

                error:
                    finalError
            };

        }


        currentUser =
            result.data.user || null;

        currentSession =
            result.data.session || null;


        /* ---------------------------------------------
           إنشاء Profile فقط إذا عندنا Session
        --------------------------------------------- */

        if (
            currentUser &&
            currentSession
        ) {

            await ensureProfile(
                currentUser
            );

        }


        dispatchAuthChanged(
            "SIGNED_UP"
        );


        /*
         * إذا Supabase يحتاج تحقق البريد،
         * غالبًا session ستكون null.
         */

        return {
            data:
                result.data,

            error:
                null
        };

    }


    /* =====================================================
       تسجيل الدخول
    ===================================================== */

    async function signIn(
        email,
        password
    ) {

        email =
            String(
                email || ""
            ).trim();

        password =
            String(
                password || ""
            );


        if (!email) {

            return {
                data: null,

                error:
                    new Error(
                        "يرجى إدخال البريد الإلكتروني."
                    )
            };

        }


        if (!isValidEmail(email)) {

            return {
                data: null,

                error:
                    new Error(
                        "يرجى إدخال بريد إلكتروني صحيح."
                    )
            };

        }


        const passwordValidation =
            validatePassword(
                password
            );


        if (
            !passwordValidation.valid
        ) {

            return {
                data: null,

                error:
                    passwordValidation.error
            };

        }


        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            password

                    });

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ أثناء تسجيل الدخول:",
                error
            );

            return {
                data: null,
                error: error
            };

        }


        /* ---------------------------------------------
           خطأ تسجيل الدخول
        --------------------------------------------- */

        if (result.error) {

            let message =
                "تعذر تسجيل الدخول.";


            if (
                isWrongPasswordError(
                    result.error
                )
            ) {

                message =
                    "كلمة المرور غير صحيحة.";

            }


            const finalError =
                new Error(
                    message
                );


            /*
             * نحتفظ بالكود الأصلي أيضًا
             * حتى تستطيع الواجهة التعرف عليه.
             */

            finalError.code =
                result.error.code || "";


            console.error(
                "WFESC Auth: فشل تسجيل الدخول:",
                result.error
            );


            return {
                data: null,

                error:
                    finalError
            };

        }


        currentSession =
            result.data.session || null;

        currentUser =
            result.data.user || null;


        /* ---------------------------------------------
           Profile
        --------------------------------------------- */

        if (currentUser) {

            try {

                await ensureProfile(
                    currentUser
                );

            } catch (error) {

                console.warn(
                    "WFESC Auth: مشكلة profile بعد تسجيل الدخول:",
                    error
                );

            }

        }


        dispatchAuthChanged(
            "SIGNED_IN"
        );


        return {
            data:
                result.data,

            error:
                null
        };

    }


    /* =====================================================
       تغيير كلمة المرور
    ===================================================== */

    async function updatePassword(
        newPassword
    ) {

        if (!currentUser) {

            return {
                data: null,

                error:
                    new Error(
                        "يجب تسجيل الدخول أولاً."
                    )
            };

        }


        newPassword =
            String(
                newPassword || ""
            );


        const validation =
            validatePassword(
                newPassword
            );


        if (!validation.valid) {

            return {
                data: null,

                error:
                    validation.error
            };

        }


        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .updateUser({

                        password:
                            newPassword

                    });

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ أثناء تغيير كلمة المرور:",
                error
            );

            return {
                data: null,
                error: error
            };

        }


        if (result.error) {

            return {
                data: null,

                error:
                    result.error
            };

        }


        if (result.data.user) {

            currentUser =
                result.data.user;

        }


        dispatchAuthChanged(
            "PASSWORD_UPDATED"
        );


        return {
            data:
                result.data,

            error:
                null
        };

    }


    /* =====================================================
       إعادة تعيين كلمة المرور
    ===================================================== */

    async function resetPassword(
        email
    ) {

        email =
            String(
                email || ""
            ).trim();


        if (!email) {

            return {
                data: null,

                error:
                    new Error(
                        "يرجى إدخال البريد الإلكتروني."
                    )
            };

        }


        if (!isValidEmail(email)) {

            return {
                data: null,

                error:
                    new Error(
                        "يرجى إدخال بريد إلكتروني صحيح."
                    )
            };

        }


        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                SETTINGS_URL
                        }
                    );

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ أثناء إعادة تعيين كلمة المرور:",
                error
            );

            return {
                data: null,
                error: error
            };

        }


        if (result.error) {

            return {
                data: null,

                error:
                    result.error
            };

        }


        return {
            data:
                true,

            error:
                null
        };

    }


    /* =====================================================
       حذف الحساب

       مهم:
       لا نضع Service Role Key داخل JavaScript.

       الحذف الكامل من auth.users يحتاج:
       Supabase Edge Function
       أو Backend آمن.
    ===================================================== */

    async function deleteAccount() {

        if (!currentUser) {

            return {
                data: null,

                error:
                    new Error(
                        "يجب تسجيل الدخول أولاً."
                    )
            };

        }


        /*
         * لا نحاول حذف المستخدم مباشرة من المتصفح
         * لأن ذلك غير آمن مع الحسابات.
         */

        return {
            data: null,

            error:
                new Error(
                    "حذف الحساب الكامل يحتاج إلى إعداد آمن في Supabase."
                )
        };

    }


    /* =====================================================
       تسجيل الخروج
    ===================================================== */

    async function signOut() {

        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .signOut();

        } catch (error) {

            console.error(
                "WFESC Auth: خطأ أثناء تسجيل الخروج:",
                error
            );

            return {
                error:
                    error
            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تسجيل الخروج:",
                result.error
            );

            return {
                error:
                    result.error
            };

        }


        currentUser =
            null;

        currentSession =
            null;

        currentProfile =
            null;


        dispatchAuthChanged(
            "SIGNED_OUT"
        );


        return {
            error:
                null
        };

    }


    /* =====================================================
       فحص رابط Auth

       نستخدم URL فقط لمعرفة أن الصفحة
       جاءت من عملية تحقق/استرداد.
    ===================================================== */

    function hasAuthCodeInUrl() {

        try {

            const url =
                new URL(
                    window.location.href
                );


            const params =
                url.searchParams;


            const hash =
                String(
                    url.hash || ""
                );


            return (
                params.has("code") ||
                params.has("access_token") ||
                params.has("refresh_token") ||
                params.has("type") ||
                hash.includes(
                    "access_token="
                ) ||
                hash.includes(
                    "refresh_token="
                )
            );

        } catch (error) {

            return false;

        }

    }


    /* =====================================================
       استعادة الجلسة
    ===================================================== */

    async function restoreSession() {

        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .getSession();

        } catch (error) {

            console.error(
                "WFESC Auth: فشل استعادة الجلسة:",
                error
            );


            currentSession =
                null;

            currentUser =
                null;

            currentProfile =
                null;


            return {
                session:
                    null,

                user:
                    null,

                profile:
                    null,

                error:
                    error
            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل استعادة الجلسة:",
                result.error
            );


            currentSession =
                null;

            currentUser =
                null;

            currentProfile =
                null;


            return {
                session:
                    null,

                user:
                    null,

                profile:
                    null,

                error:
                    result.error
            };

        }


        currentSession =
            result.data.session || null;


        currentUser =
            currentSession
                ? currentSession.user
                : null;


        currentProfile =
            null;


        if (currentUser) {

            try {

                await ensureProfile(
                    currentUser
                );

            } catch (error) {

                console.warn(
                    "WFESC Auth: تعذر استعادة profile:",
                    error
                );

            }

        }


        /*
         * إذا كانت الصفحة عائدة من رابط Auth
         * والـ user موجود، نرسل حدث التحقق.
         */

        if (
            currentUser &&
            hasAuthCodeInUrl()
        ) {

            dispatchEmailVerified();

        }


        dispatchAuthChanged(
            "SESSION_RESTORED"
        );


        return {
            session:
                currentSession,

            user:
                currentUser,

            profile:
                currentProfile,

            error:
                null
        };

    }


    /* =====================================================
       مراقبة تغييرات Auth
    ===================================================== */

    const authListener =
        supabaseClient.auth.onAuthStateChange(
            function (
                event,
                session
            ) {

                currentSession =
                    session || null;


                currentUser =
                    session
                        ? session.user
                        : null;


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    currentProfile =
                        null;

                }


                /*
                 * نؤجل العمليات الإضافية
                 * حتى لا نسبب مشاكل داخل callback
                 * الخاص بـ Supabase.
                 */

                setTimeout(
                    async function () {

                        if (
                            currentUser
                        ) {

                            try {

                                await ensureProfile(
                                    currentUser
                                );

                            } catch (error) {

                                console.warn(
                                    "WFESC Auth: مشكلة profile:",
                                    error
                                );

                            }

                        }


                        if (
                            currentUser &&
                            (
                                event ===
                                "SIGNED_IN" ||

                                event ===
                                "INITIAL_SESSION" ||

                                event ===
                                "USER_UPDATED"
                            ) &&
                            hasAuthCodeInUrl()
                        ) {

                            dispatchEmailVerified();

                        }


                        dispatchAuthChanged(
                            event
                        );

                    },
                    0
                );

            }
        );


    /* =====================================================
       إلغاء Listener
    ===================================================== */

    function unsubscribe() {

        if (
            authListener &&
            authListener.data &&
            authListener.data.subscription
        ) {

            authListener
                .data
                .subscription
                .unsubscribe();

        }

    }


    /* =====================================================
       التصدير
    ===================================================== */

    window.WFESCSettingsAuth = {

        /* Supabase */

        client:
            getClient(),

        config:
            CONFIG,


        /* الحالة */

        getUser:
            getUser,

        getSession:
            getSession,

        getProfile:
            getProfile,

        getCurrentUserId:
            getCurrentUserId,


        /* Profile */

        fetchProfile:
            fetchProfile,

        ensureProfile:
            ensureProfile,

        updateProfile:
            updateProfile,

        usernameExists:
            usernameExists,


        /* Account metadata */

        updateAccountMetadata:
            updateAccountMetadata,


        /* Auth */

        signUp:
            signUp,

        signIn:
            signIn,

        updatePassword:
            updatePassword,

        resetPassword:
            resetPassword,

        deleteAccount:
            deleteAccount,

        signOut:
            signOut,


        /* Session */

        restoreSession:
            restoreSession,


        /* Utilities */

        validateUsername:
            validateUsername,

        sanitizeUsername:
            sanitizeUsername,

        validatePassword:
            validatePassword,

        validateDisplayName:
            validateDisplayName,

        getUsernameLimits:
            getUsernameLimits,

        getDefaultUsername:
            getDefaultUsername,

        getDefaultDisplayName:
            getDefaultDisplayName,

        unsubscribe:
            unsubscribe

    };


    /* =====================================================
       بدء استعادة الجلسة
    ===================================================== */

    restoreSession()
        .catch(
            function (error) {

                console.error(
                    "WFESC Auth: خطأ أثناء استعادة الجلسة:",
                    error
                );

            }
        );


})();
