(function () {
    "use strict";

    /* =========================================================
       WFESC SETTINGS AUTH
       نظام الحسابات المركزي لموقع WFESC
       ========================================================= */

    if (window.WFESCSettingsAuth) {
        return;
    }

    /* =========================================================
       التحقق من تحميل Supabase
       ========================================================= */

    if (!window.supabase) {
        console.error("WFESC Auth: مكتبة Supabase غير محمّلة.");
        return;
    }

    /* =========================================================
       الإعدادات
       ========================================================= */

    const CONFIG = window.WFESCSettingsAuthConfig;

    if (!CONFIG) {
        console.error("WFESC Auth: ملف الإعدادات غير محمّل.");
        return;
    }

    const SUPABASE_URL = CONFIG.supabaseUrl;
    const SUPABASE_KEY = CONFIG.supabaseKey;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("WFESC Auth: بيانات Supabase ناقصة.");
        return;
    }

    const client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    /* =========================================================
       متغيرات داخلية
       ========================================================= */

    let cachedUser = null;
    let cachedProfile = null;

    /* =========================================================
       أدوات عامة
       ========================================================= */

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function normalizeUsername(username) {
        return String(username || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, CONFIG.username.maxLength);
    }

    function validateEmail(email) {
        const value = normalizeEmail(email);

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateUsername(username) {
        const value = normalizeUsername(username);

        if (
            value.length < CONFIG.username.minLength ||
            value.length > CONFIG.username.maxLength
        ) {
            return false;
        }

        return /^[a-z0-9]+$/.test(value);
    }

    function validatePassword(password) {
        const value = String(password || "");

        return (
            value.length >= CONFIG.password.minLength &&
            value.length <= CONFIG.password.maxLength
        );
    }

    function validateDisplayName(name) {
        const value = String(name || "").trim();

        return (
            value.length >= CONFIG.displayName.minLength &&
            value.length <= CONFIG.displayName.maxLength
        );
    }

    function createError(message, code, status) {
        const error = new Error(message);

        if (code) {
            error.code = code;
        }

        if (status) {
            error.status = status;
        }

        return error;
    }

    /* =========================================================
       المستخدم الحالي
       ========================================================= */

    async function getUser() {
        try {
            const result = await client.auth.getUser();

            if (result.error) {
                cachedUser = null;
                return null;
            }

            cachedUser = result.data && result.data.user
                ? result.data.user
                : null;

            return cachedUser;
        } catch (error) {
            console.error("WFESC Auth getUser:", error);
            cachedUser = null;
            return null;
        }
    }

    /*
       Alias حتى الصفحات القديمة مثل profile.html
       تقدر تستخدم getCurrentUser()
    */

    const getCurrentUser = getUser;

    /* =========================================================
       الجلسة الحالية
       ========================================================= */

    async function getSession() {
        try {
            const result = await client.auth.getSession();

            if (result.error) {
                return null;
            }

            return result.data && result.data.session
                ? result.data.session
                : null;
        } catch (error) {
            console.error("WFESC Auth getSession:", error);
            return null;
        }
    }

    /* =========================================================
       جلب البروفايل
       ========================================================= */

    async function fetchProfile(userId) {
        try {
            const user = userId
                ? null
                : await getUser();

            const id = userId || (user && user.id);

            if (!id) {
                cachedProfile = null;
                return null;
            }

            const result = await client
                .from(CONFIG.profilesTable)
                .select("*")
                .eq("id", id)
                .maybeSingle();

            if (result.error) {
                console.error(
                    "WFESC Auth fetchProfile:",
                    result.error
                );

                return null;
            }

            cachedProfile = result.data || null;

            return cachedProfile;
        } catch (error) {
            console.error("WFESC Auth fetchProfile:", error);
            return null;
        }
    }

    /* =========================================================
       فحص وجود اسم المستخدم
       ========================================================= */

    async function usernameExists(username, excludeUserId) {
        const value = normalizeUsername(username);

        if (!validateUsername(value)) {
            return {
                exists: false,
                username: value
            };
        }

        try {
            let query = client
                .from(CONFIG.profilesTable)
                .select("id")
                .eq(
                    CONFIG.profileFields.username,
                    value
                )
                .limit(1);

            if (excludeUserId) {
                query = query.neq("id", excludeUserId);
            }

            const result = await query.maybeSingle();

            if (result.error) {
                /*
                   بعض إصدارات Supabase ترجع PGRST116
                   إذا ماكو صف، وهذا مو خطأ حقيقي بالنسبة إلنا.
                */

                if (result.error.code === "PGRST116") {
                    return {
                        exists: false,
                        username: value
                    };
                }

                console.error(
                    "WFESC Auth usernameExists:",
                    result.error
                );

                const error = createError(
                    "تعذر التحقق من اسم المستخدم.",
                    "USERNAME_CHECK_FAILED",
                    result.error.status || 500
                );

                throw error;
            }

            return {
                exists: !!result.data,
                username: value
            };

        } catch (error) {
            if (error && error.code === "USERNAME_CHECK_FAILED") {
                throw error;
            }

            console.error(
                "WFESC Auth usernameExists:",
                error
            );

            throw createError(
                "تعذر التحقق من اسم المستخدم.",
                "USERNAME_CHECK_FAILED",
                500
            );
        }
    }

    /* =========================================================
       فحص أخطاء اسم المستخدم المكرر
       ========================================================= */

    function isUsernameTakenError(error) {
        if (!error) {
            return false;
        }

        const code = String(error.code || "").toLowerCase();

        const message = String(
            error.message || ""
        ).toLowerCase();

        if (
            code === "username_already_exists" ||
            code === "username_exists" ||
            code === "username_taken" ||
            code === "duplicate_username" ||
            code === "username_already_used" ||
            code === "23505"
        ) {
            return true;
        }

        if (
            message.includes("username") &&
            (
                message.includes("already exists") ||
                message.includes("already used") ||
                message.includes("duplicate") ||
                message.includes("taken")
            )
        ) {
            return true;
        }

        if (
            message.includes("اسم المستخدم") &&
            (
                message.includes("موجود") ||
                message.includes("مأخوذ") ||
                message.includes("مكرر")
            )
        ) {
            return true;
        }

        return false;
    }

    /* =========================================================
       إنشاء / تحديث بروفايل
       ========================================================= */

    async function upsertProfile(user, updates) {
        if (!user || !user.id) {
            throw createError(
                "يجب تسجيل الدخول أولًا.",
                "LOGIN_REQUIRED",
                401
            );
        }

        const data = {
            id: user.id
        };

        if (
            updates &&
            Object.prototype.hasOwnProperty.call(
                updates,
                CONFIG.profileFields.username
            )
        ) {
            data[CONFIG.profileFields.username] =
                normalizeUsername(
                    updates[CONFIG.profileFields.username]
                );
        }

        if (
            updates &&
            Object.prototype.hasOwnProperty.call(
                updates,
                CONFIG.profileFields.avatar
            )
        ) {
            data[CONFIG.profileFields.avatar] =
                updates[CONFIG.profileFields.avatar] || null;
        }

        if (
            updates &&
            Object.prototype.hasOwnProperty.call(
                updates,
                CONFIG.profileFields.bio
            )
        ) {
            data[CONFIG.profileFields.bio] =
                String(
                    updates[CONFIG.profileFields.bio] || ""
                );
        }

        /*
           إضافات الملف الشخصي الجديدة
        */

        if (
            updates &&
            Object.prototype.hasOwnProperty.call(
                updates,
                "cover_url"
            )
        ) {
            data.cover_url =
                updates.cover_url || null;
        }

        if (
            updates &&
            Object.prototype.hasOwnProperty.call(
                updates,
                "last_username_change_at"
            )
        ) {
            data.last_username_change_at =
                updates.last_username_change_at || null;
        }

        if (
            updates &&
            Object.prototype.hasOwnProperty.call(
                updates,
                "last_display_name_change_at"
            )
        ) {
            data.last_display_name_change_at =
                updates.last_display_name_change_at || null;
        }

        const result = await client
            .from(CONFIG.profilesTable)
            .upsert(
                data,
                {
                    onConflict: "id"
                }
            )
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        cachedProfile = result.data || data;

        return cachedProfile;
    }

    /* =========================================================
       تحديث بيانات البروفايل
       ========================================================= */

    async function updateProfile(updates) {
        const user = await getUser();

        if (!user) {
            throw createError(
                CONFIG.messages.loginRequired,
                "LOGIN_REQUIRED",
                401
            );
        }

        const source = updates || {};

        const allowedUpdates = {};

        /* -----------------------------------------------------
           Username
           ----------------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                source,
                "username"
            )
        ) {
            const username =
                normalizeUsername(source.username);

            if (!validateUsername(username)) {
                throw createError(
                    CONFIG.messages.invalidUsername,
                    "INVALID_USERNAME",
                    400
                );
            }

            const oldProfile = cachedProfile ||
                await fetchProfile(user.id);

            const oldUsername =
                oldProfile &&
                oldProfile.username
                    ? normalizeUsername(oldProfile.username)
                    : "";

            if (username !== oldUsername) {
                const check =
                    await usernameExists(
                        username,
                        user.id
                    );

                if (check.exists) {
                    throw createError(
                        "اسم المستخدم مأخوذ مسبقًا",
                        "USERNAME_ALREADY_EXISTS",
                        409
                    );
                }

                allowedUpdates.username = username;
            }
        }

        /* -----------------------------------------------------
           Avatar
           ----------------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                source,
                "avatar_url"
            )
        ) {
            allowedUpdates.avatar_url =
                source.avatar_url || null;
        }

        /* -----------------------------------------------------
           Bio
           ----------------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                source,
                "bio"
            )
        ) {
            allowedUpdates.bio =
                String(source.bio || "");
        }

        /* -----------------------------------------------------
           Cover
           ----------------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                source,
                "cover_url"
            )
        ) {
            allowedUpdates.cover_url =
                source.cover_url || null;
        }

        /* -----------------------------------------------------
           وقت تغيير اسم المستخدم
           ----------------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                source,
                "last_username_change_at"
            )
        ) {
            allowedUpdates.last_username_change_at =
                source.last_username_change_at || null;
        }

        /* -----------------------------------------------------
           وقت تغيير اسم العرض
           ----------------------------------------------------- */

        if (
            Object.prototype.hasOwnProperty.call(
                source,
                "last_display_name_change_at"
            )
        ) {
            allowedUpdates.last_display_name_change_at =
                source.last_display_name_change_at || null;
        }

        /*
           لا يوجد شيء لتحديثه في جدول profiles
        */

        if (Object.keys(allowedUpdates).length === 0) {
            return (
                cachedProfile ||
                await fetchProfile(user.id)
            );
        }

        try {
            return await upsertProfile(
                user,
                allowedUpdates
            );
        } catch (error) {
            if (
                isUsernameTakenError(error) &&
                Object.prototype.hasOwnProperty.call(
                    allowedUpdates,
                    "username"
                )
            ) {
                throw createError(
                    "اسم المستخدم مأخوذ مسبقًا",
                    "USERNAME_ALREADY_EXISTS",
                    409
                );
            }

            throw error;
        }
    }

    /* =========================================================
       تحديث اسم الحساب في User Metadata
       ========================================================= */

    async function updateAccountMetadata(metadata) {
        const user = await getUser();

        if (!user) {
            throw createError(
                CONFIG.messages.loginRequired,
                "LOGIN_REQUIRED",
                401
            );
        }

        const currentMetadata =
            user.user_metadata || {};

        const nextMetadata = {
            ...currentMetadata
        };

        if (
            metadata &&
            Object.prototype.hasOwnProperty.call(
                metadata,
                "name"
            )
        ) {
            const name =
                String(metadata.name || "").trim();

            if (!validateDisplayName(name)) {
                throw createError(
                    CONFIG.messages.invalidDisplayName,
                    "INVALID_DISPLAY_NAME",
                    400
                );
            }

            nextMetadata.name = name;
            nextMetadata.display_name = name;
        }

        if (
            metadata &&
            Object.prototype.hasOwnProperty.call(
                metadata,
                "display_name"
            )
        ) {
            const displayName =
                String(
                    metadata.display_name || ""
                ).trim();

            if (!validateDisplayName(displayName)) {
                throw createError(
                    CONFIG.messages.invalidDisplayName,
                    "INVALID_DISPLAY_NAME",
                    400
                );
            }

            nextMetadata.display_name =
                displayName;

            if (!nextMetadata.name) {
                nextMetadata.name =
                    displayName;
            }
        }

        const result =
            await client.auth.updateUser({
                data: nextMetadata
            });

        if (result.error) {
            throw result.error;
        }

        cachedUser = result.data.user || cachedUser;

        return cachedUser;
    }

    /* =========================================================
       إنشاء الحساب
       ========================================================= */

    async function signUp({
        name,
        displayName,
        username,
        email,
        password,
        confirmPassword
    } = {}) {

        const cleanEmail =
            normalizeEmail(email);

        const cleanUsername =
            normalizeUsername(username);

        const cleanName =
            String(
                displayName || name || ""
            ).trim();

        /* -----------------------------------------------------
           Email
           ----------------------------------------------------- */

        if (!validateEmail(cleanEmail)) {
            throw createError(
                CONFIG.messages.invalidEmail,
                "INVALID_EMAIL",
                400
            );
        }

        /* -----------------------------------------------------
           Username
           ----------------------------------------------------- */

        if (!validateUsername(cleanUsername)) {
            throw createError(
                CONFIG.messages.invalidUsername,
                "INVALID_USERNAME",
                400
            );
        }

        /* -----------------------------------------------------
           Name
           ----------------------------------------------------- */

        if (!validateDisplayName(cleanName)) {
            throw createError(
                CONFIG.messages.invalidDisplayName,
                "INVALID_DISPLAY_NAME",
                400
            );
        }

        /* -----------------------------------------------------
           Password
           ----------------------------------------------------- */

        if (!validatePassword(password)) {
            throw createError(
                CONFIG.messages.invalidPassword,
                "INVALID_PASSWORD",
                400
            );
        }

        /* -----------------------------------------------------
           Confirm Password
           ----------------------------------------------------- */

        if (
            String(password) !==
            String(confirmPassword)
        ) {
            throw createError(
                CONFIG.messages.passwordMismatch,
                "PASSWORD_MISMATCH",
                400
            );
        }

        /* -----------------------------------------------------
           فحص اسم المستخدم قبل إنشاء الحساب
           ----------------------------------------------------- */

        let usernameCheck;

        try {
            usernameCheck =
                await usernameExists(
                    cleanUsername
                );
        } catch (error) {
            throw error;
        }

        if (usernameCheck.exists) {
            throw createError(
                "اسم المستخدم مأخوذ مسبقًا",
                "USERNAME_ALREADY_EXISTS",
                409
            );
        }

        /* -----------------------------------------------------
           إنشاء حساب Supabase
           ----------------------------------------------------- */

        let result;

        try {
            result =
                await client.auth.signUp({
                    email: cleanEmail,
                    password: String(password),
                    options: {
                        data: {
                            name: cleanName,
                            display_name: cleanName,
                            username: cleanUsername
                        },
                        emailRedirectTo:
                            CONFIG.urls.settings
                    }
                });
        } catch (error) {
            throw error;
        }

        if (result.error) {
            const error =
                result.error;

            /*
               خطأ Username من قاعدة البيانات
            */

            if (
                isUsernameTakenError(error)
            ) {
                throw createError(
                    "اسم المستخدم مأخوذ مسبقًا",
                    "USERNAME_ALREADY_EXISTS",
                    409
                );
            }

            /*
               البريد مستخدم مسبقًا
               إذا رجعه Supabase بشكل صريح.
            */

            const message =
                String(
                    error.message || ""
                ).toLowerCase();

            if (
                message.includes("already registered") ||
                message.includes("already exists") ||
                message.includes("user already registered")
            ) {
                throw createError(
                    "أنت تملك حساب بالفعل",
                    "EMAIL_ALREADY_EXISTS",
                    409
                );
            }

            throw error;
        }

        const newUser =
            result.data &&
            result.data.user
                ? result.data.user
                : null;

        const session =
            result.data &&
            result.data.session
                ? result.data.session
                : null;

        cachedUser = newUser;

        /*
           إذا الحساب لا يحتاج تحقق بريد
           وكانت هناك Session، نحاول إنشاء البروفايل.
        */

        if (newUser && session) {
            try {
                await upsertProfile(
                    newUser,
                    {
                        username: cleanUsername
                    }
                );

                try {
                    await updateAccountMetadata({
                        name: cleanName,
                        display_name: cleanName
                    });
                } catch (metadataError) {
                    console.warn(
                        "WFESC Auth metadata:",
                        metadataError
                    );
                }

            } catch (profileError) {

                /*
                   إذا كان السبب Username مكرر
                   نرجعه بشكل واضح للواجهة.
                */

                if (
                    isUsernameTakenError(
                        profileError
                    )
                ) {
                    throw createError(
                        "اسم المستخدم مأخوذ مسبقًا",
                        "USERNAME_ALREADY_EXISTS",
                        409
                    );
                }

                console.warn(
                    "WFESC Auth profile creation:",
                    profileError
                );
            }
        }

        return {
            user: newUser,
            session: session,
            needsEmailVerification:
                !session && !!newUser
        };
    }

    /* =========================================================
       تسجيل الدخول
       ========================================================= */

    async function signIn(email, password) {
        const cleanEmail =
            normalizeEmail(email);

        if (!validateEmail(cleanEmail)) {
            throw createError(
                CONFIG.messages.invalidEmail,
                "INVALID_EMAIL",
                400
            );
        }

        if (
            password === undefined ||
            password === null ||
            String(password).length === 0
        ) {
            throw createError(
                "كلمة المرور غير صحيحة.",
                "INVALID_LOGIN_PASSWORD",
                401
            );
        }

        try {
            const result =
                await client.auth.signInWithPassword({
                    email: cleanEmail,
                    password: String(password)
                });

            if (result.error) {
                const message =
                    String(
                        result.error.message || ""
                    ).toLowerCase();

                /*
                   الخطأ الطبيعي من Supabase:
                   Invalid login credentials
                */

                if (
                    message.includes(
                        "invalid login credentials"
                    ) ||
                    message.includes(
                        "invalid_credentials"
                    ) ||
                    message.includes(
                        "invalid credentials"
                    ) ||
                    result.error.status === 400 ||
                    result.error.status === 401
                ) {
                    throw createError(
                        "كلمة المرور غير صحيحة.",
                        "WRONG_PASSWORD",
                        401
                    );
                }

                throw result.error;
            }

            cachedUser =
                result.data &&
                result.data.user
                    ? result.data.user
                    : null;

            return {
                user: cachedUser,
                session:
                    result.data &&
                    result.data.session
                        ? result.data.session
                        : null
            };

        } catch (error) {

            if (
                error &&
                error.code === "WRONG_PASSWORD"
            ) {
                throw error;
            }

            const message =
                String(
                    error &&
                    error.message
                        ? error.message
                        : ""
                ).toLowerCase();

            if (
                message.includes(
                    "invalid login credentials"
                ) ||
                message.includes(
                    "invalid credentials"
                )
            ) {
                throw createError(
                    "كلمة المرور غير صحيحة.",
                    "WRONG_PASSWORD",
                    401
                );
            }

            throw error;
        }
    }

    /* =========================================================
       تسجيل الخروج
       ========================================================= */

    async function signOut() {
        try {
            const result =
                await client.auth.signOut();

            cachedUser = null;
            cachedProfile = null;

            if (result.error) {
                throw result.error;
            }

            return true;

        } catch (error) {
            console.error(
                "WFESC Auth signOut:",
                error
            );

            throw error;
        }
    }

    /* =========================================================
       إرسال إعادة تعيين كلمة المرور
       ========================================================= */

    async function resetPassword(email) {
        const cleanEmail =
            normalizeEmail(email);

        if (!validateEmail(cleanEmail)) {
            throw createError(
                CONFIG.messages.invalidEmail,
                "INVALID_EMAIL",
                400
            );
        }

        try {
            const result =
                await client.auth.resetPasswordForEmail(
                    cleanEmail,
                    {
                        redirectTo:
                            CONFIG.urls.settings
                    }
                );

            if (result.error) {
                throw result.error;
            }

            return true;

        } catch (error) {
            console.error(
                "WFESC Auth resetPassword:",
                error
            );

            throw createError(
                CONFIG.messages.resetError,
                "RESET_PASSWORD_ERROR",
                error.status || 500
            );
        }
    }

    /* =========================================================
       تغيير كلمة المرور
       ========================================================= */

    async function updatePassword(
        password,
        confirmPassword
    ) {
        if (!validatePassword(password)) {
            throw createError(
                CONFIG.messages.invalidPassword,
                "INVALID_PASSWORD",
                400
            );
        }

        if (
            String(password) !==
            String(confirmPassword)
        ) {
            throw createError(
                CONFIG.messages.passwordMismatch,
                "PASSWORD_MISMATCH",
                400
            );
        }

        const user = await getUser();

        if (!user) {
            throw createError(
                CONFIG.messages.loginRequired,
                "LOGIN_REQUIRED",
                401
            );
        }

        const result =
            await client.auth.updateUser({
                password: String(password)
            });

        if (result.error) {
            throw result.error;
        }

        cachedUser =
            result.data &&
            result.data.user
                ? result.data.user
                : cachedUser;

        return true;
    }

    /* =========================================================
       طلب حذف الحساب
       ========================================================= */

    async function requestAccountDeletion() {
        const user = await getUser();

        if (!user) {
            throw createError(
                CONFIG.messages.loginRequired,
                "LOGIN_REQUIRED",
                401
            );
        }

        /*
           ملاحظة:
           حذف مستخدم Supabase Auth بشكل نهائي يحتاج
           Service Role / Edge Function آمنة من الخادم.
           لا نضع Service Role Key داخل الموقع.

           لذلك هذه الدالة ترجع رسالة واضحة بدل تنفيذ
           حذف خطير أو غير آمن من المتصفح.
        */

        throw createError(
            CONFIG.messages.deleteError,
            "DELETE_REQUIRES_SECURE_BACKEND",
            501
        );
    }

    /* =========================================================
       مراقبة تغيّر تسجيل الدخول
       ========================================================= */

    function onAuthStateChange(callback) {
        if (typeof callback !== "function") {
            return {
                data: {
                    subscription: {
                        unsubscribe: function () {}
                    }
                }
            };
        }

        const result =
            client.auth.onAuthStateChange(
                function (event, session) {

                    cachedUser =
                        session && session.user
                            ? session.user
                            : null;

                    if (!session) {
                        cachedProfile = null;
                    }

                    try {
                        callback(
                            event,
                            session
                        );
                    } catch (error) {
                        console.error(
                            "WFESC Auth callback:",
                            error
                        );
                    }
                }
            );

        return result;
    }

    /* =========================================================
       الاستماع لتغيّر الحساب
       ========================================================= */

    client.auth.onAuthStateChange(
        function (event, session) {
            cachedUser =
                session && session.user
                    ? session.user
                    : null;

            if (!session) {
                cachedProfile = null;
            }
        }
    );

    /* =========================================================
       تصدير النظام
       ========================================================= */

    window.WFESCSettingsAuth = {

        /* Supabase */
        client: client,

        /* User */
        getUser: getUser,
        getCurrentUser: getCurrentUser,
        getSession: getSession,

        /* Profile */
        fetchProfile: fetchProfile,
        updateProfile: updateProfile,
        upsertProfile: upsertProfile,
        usernameExists: usernameExists,

        /* Metadata */
        updateAccountMetadata:
            updateAccountMetadata,

        /* Auth */
        signUp: signUp,
        signIn: signIn,
        signOut: signOut,

        /* Password */
        resetPassword: resetPassword,
        updatePassword: updatePassword,

        /* Delete */
        requestAccountDeletion:
            requestAccountDeletion,

        /* Events */
        onAuthStateChange:
            onAuthStateChange,

        /* Validators */
        normalizeUsername:
            normalizeUsername,

        validateUsername:
            validateUsername,

        validateEmail:
            validateEmail,

        validatePassword:
            validatePassword,

        validateDisplayName:
            validateDisplayName,

        /* Error helpers */
        isUsernameTakenError:
            isUsernameTakenError
    };

    console.log(
        "WFESC Auth: تم تحميل نظام الحسابات بنجاح."
    );

})();
