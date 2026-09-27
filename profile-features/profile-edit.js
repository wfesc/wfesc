(function () {
    "use strict";

    /*
     * WFESC Profile Edit
     * ------------------
     * مسؤول عن:
     * - تغيير الاسم
     * - تغيير اسم المستخدم
     * - تغيير النبذة
     * - التحقق من توفر اسم المستخدم
     * - الحفاظ على username وعدم إرساله كـ null
     * - أقفال التعديل
     *
     * هذا الملف لا يتولى تخزين الصور.
     * الصور مسؤولة عنها:
     * profile-storage.js
     */

    if (window.WFESCProfileEdit) {
        return;
    }


    /* =========================================================
       CONFIG
    ========================================================= */

    const LOCK_TIME = 4 * 60 * 1000;

    const USERNAME_MIN = 3;
    const USERNAME_MAX = 9;

    const DISPLAY_NAME_MIN = 1;
    const DISPLAY_NAME_MAX = 15;

    const BIO_MAX = 160;


    /* =========================================================
       STATE
    ========================================================= */

    let usernameLockUntil = 0;
    let displayNameLockUntil = 0;

    let usernameTimer = null;
    let displayNameTimer = null;


    /* =========================================================
       AUTH
    ========================================================= */

    function getAuth() {

        const auth = window.WFESCSettingsAuth;

        if (!auth) {
            throw new Error(
                "WFESC_SETTINGS_AUTH_NOT_READY"
            );
        }

        return auth;
    }


    async function getCurrentUser() {

        const auth = getAuth();

        if (
            typeof auth.getCurrentUser === "function"
        ) {
            const result =
                await auth.getCurrentUser();

            const user =
                result?.data?.user ||
                result?.user ||
                result;

            if (user?.id) {
                return user;
            }
        }


        if (
            typeof auth.getUser === "function"
        ) {
            const result =
                await auth.getUser();

            const user =
                result?.data?.user ||
                result?.user ||
                result;

            if (user?.id) {
                return user;
            }
        }

        throw new Error(
            "WFESC_LOGIN_REQUIRED"
        );
    }


    /* =========================================================
       CLIENT
    ========================================================= */

    function getClient() {

        if (
            window.WFESCSettingsAuthClient
        ) {
            return window.WFESCSettingsAuthClient;
        }

        if (
            window.supabase &&
            window.WFESCSettingsAuthConfig
        ) {

            if (
                !window.__WFESCProfileEditClient
            ) {
                const config =
                    window.WFESCSettingsAuthConfig;

                window.__WFESCProfileEditClient =
                    window.supabase.createClient(
                        config.supabaseUrl,
                        config.supabaseKey
                    );
            }

            return window.__WFESCProfileEditClient;
        }

        throw new Error(
            "WFESC_SUPABASE_CLIENT_NOT_READY"
        );
    }


    /* =========================================================
       CONFIG
    ========================================================= */

    function getProfileTable() {

        const config =
            window.WFESCSettingsAuthConfig;

        if (
            config &&
            config.profilesTable
        ) {
            return config.profilesTable;
        }

        return "profiles";
    }


    /* =========================================================
       NORMALIZE USERNAME
    ========================================================= */

    function sanitizeUsername(value) {

        value =
            value == null
                ? ""
                : String(value);

        return value
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, USERNAME_MAX);
    }


    function validateUsername(value) {

        const username =
            sanitizeUsername(value);

        if (
            username.length < USERNAME_MIN ||
            username.length > USERNAME_MAX
        ) {
            return {
                valid: false,
                value: username,
                message:
                    "اسم المستخدم يجب أن يتكون من 3 إلى 9 أحرف أو أرقام."
            };
        }

        if (
            !/^[a-z0-9]+$/.test(username)
        ) {
            return {
                valid: false,
                value: username,
                message:
                    "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط."
            };
        }

        return {
            valid: true,
            value: username,
            message: ""
        };
    }


    /* =========================================================
       DISPLAY NAME
    ========================================================= */

    function normalizeDisplayName(value) {

        value =
            value == null
                ? ""
                : String(value);

        return value
            .trim()
            .slice(0, DISPLAY_NAME_MAX);
    }


    function validateDisplayName(value) {

        const name =
            normalizeDisplayName(value);

        if (
            name.length < DISPLAY_NAME_MIN
        ) {
            return {
                valid: false,
                value: name,
                message:
                    "يرجى إدخال اسم صحيح بحد أقصى 15 حرفًا."
            };
        }

        if (
            name.length > DISPLAY_NAME_MAX
        ) {
            return {
                valid: false,
                value: name,
                message:
                    "اسم العرض يجب ألا يتجاوز 15 حرفًا."
            };
        }

        return {
            valid: true,
            value: name,
            message: ""
        };
    }


    /* =========================================================
       BIO
    ========================================================= */

    function normalizeBio(value) {

        value =
            value == null
                ? ""
                : String(value);

        return value
            .trim()
            .slice(0, BIO_MAX);
    }


    /* =========================================================
       PROFILE FETCH
    ========================================================= */

    async function getProfile(userId) {

        if (!userId) {
            throw new Error(
                "WFESC_USER_ID_REQUIRED"
            );
        }

        const client = getClient();

        const table =
            getProfileTable();

        const { data, error } =
            await client
                .from(table)
                .select("*")
                .eq("id", userId)
                .maybeSingle();

        if (error) {
            throw error;
        }

        return data || null;
    }


    /* =========================================================
       ENSURE PROFILE
    ========================================================= */

    async function ensureProfile(user) {

        if (!user?.id) {
            throw new Error(
                "WFESC_USER_ID_REQUIRED"
            );
        }

        const existing =
            await getProfile(user.id);

        if (existing) {
            return existing;
        }


        /*
         * مهم جدًا:
         * لا ننشئ سجلًا بدون username.
         */

        let username =
            user.user_metadata?.username ||
            user.user_metadata?.user_name ||
            user.email
                ?.split("@")[0] ||
            "";

        username =
            sanitizeUsername(username);


        /*
         * إذا كان اسم البريد غير صالح أو قصير،
         * نستخدم قيمة آمنة مؤقتة.
         */

        if (
            username.length < USERNAME_MIN
        ) {
            username =
                "user" +
                String(user.id)
                    .replace(/[^a-z0-9]/gi, "")
                    .slice(0, 5)
                    .toLowerCase();

            username =
                sanitizeUsername(username);
        }


        /*
         * نتأكد أن الاسم غير مستخدم.
         */

        const available =
            await isUsernameAvailable(
                username,
                user.id
            );

        if (!available) {

            const base =
                username.slice(
                    0,
                    USERNAME_MAX - 2
                );

            username =
                (
                    base +
                    Math.floor(
                        Math.random() * 90 + 10
                    )
                )
                .slice(0, USERNAME_MAX);

            username =
                sanitizeUsername(username);
        }


        const profileData = {
            id: user.id,
            username: username
        };


        /*
         * لا نضع null للحقول الاختيارية.
         */

        const metadata =
            user.user_metadata || {};

        const displayName =
            normalizeDisplayName(
                metadata.display_name ||
                metadata.name ||
                ""
            );

        if (displayName) {
            profileData.display_name =
                displayName;
        }

        if (
            metadata.avatar_url
        ) {
            profileData.avatar_url =
                metadata.avatar_url;
        }

        if (
            metadata.bio
        ) {
            profileData.bio =
                normalizeBio(
                    metadata.bio
                );
        }


        const client =
            getClient();

        const table =
            getProfileTable();


        const { data, error } =
            await client
                .from(table)
                .insert(profileData)
                .select("*")
                .single();

        if (error) {
            throw error;
        }

        return data;
    }


    /* =========================================================
       UPDATE PROFILE SAFELY
    ========================================================= */

    async function updateProfileSafely(
        userId,
        changes
    ) {

        if (!userId) {
            throw new Error(
                "WFESC_USER_ID_REQUIRED"
            );
        }

        if (
            !changes ||
            typeof changes !== "object"
        ) {
            throw new Error(
                "WFESC_INVALID_PROFILE_DATA"
            );
        }


        /*
         * ممنوع إرسال username = null.
         */

        if (
            Object.prototype.hasOwnProperty.call(
                changes,
                "username"
            )
        ) {

            if (
                changes.username === null ||
                changes.username === undefined
            ) {
                delete changes.username;
            }
        }


        /*
         * إذا لم يبق شيء، لا ننفذ طلبًا فارغًا.
         */

        if (
            Object.keys(changes).length === 0
        ) {
            throw new Error(
                "WFESC_NO_PROFILE_CHANGES"
            );
        }


        const client =
            getClient();

        const table =
            getProfileTable();


        /*
         * UPDATE فقط.
         *
         * لا نستخدم upsert هنا.
         *
         * السبب:
         * upsert ممكن يحاول إنشاء صف جديد
         * ناقص username ويعيد نفس الخطأ السابق.
         */

        const { data, error } =
            await client
                .from(table)
                .update(changes)
                .eq("id", userId)
                .select("*")
                .maybeSingle();

        if (error) {
            throw error;
        }


        /*
         * إذا لم يرجع صفًا فهذا يعني أن
         * profile غير موجود.
         */

        if (!data) {

            const user =
                await getCurrentUser();

            const profile =
                await ensureProfile(user);

            /*
             * بعد إنشاء profile نعيد التحديث.
             */

            const retry =
                await client
                    .from(table)
                    .update(changes)
                    .eq("id", profile.id)
                    .select("*")
                    .maybeSingle();

            if (retry.error) {
                throw retry.error;
            }

            if (!retry.data) {
                throw new Error(
                    "WFESC_PROFILE_UPDATE_FAILED"
                );
            }

            return retry.data;
        }

        return data;
    }


    /* =========================================================
       USERNAME EXISTS
    ========================================================= */

    async function isUsernameAvailable(
        username,
        currentUserId
    ) {

        const value =
            sanitizeUsername(username);

        if (!value) {
            return false;
        }

        const client =
            getClient();

        const table =
            getProfileTable();


        const { data, error } =
            await client
                .from(table)
                .select("id,username")
                .eq("username", value)
                .limit(1);


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {
            return true;
        }


        if (
            currentUserId &&
            data[0].id === currentUserId
        ) {
            return true;
        }

        return false;
    }


    /* =========================================================
       SAVE USERNAME
    ========================================================= */

    async function saveUsername(
        rawUsername
    ) {

        if (
            Date.now() < usernameLockUntil
        ) {
            throw new Error(
                "WFESC_USERNAME_LOCKED"
            );
        }


        const validation =
            validateUsername(
                rawUsername
            );

        if (!validation.valid) {
            throw new Error(
                validation.message
            );
        }

        const username =
            validation.value;

        const user =
            await getCurrentUser();


        const available =
            await isUsernameAvailable(
                username,
                user.id
            );


        if (!available) {

            const error =
                new Error(
                    "اسم المستخدم مأخوذ مسبقًا"
                );

            error.code =
                "USERNAME_TAKEN";

            throw error;
        }


        const updated =
            await updateProfileSafely(
                user.id,
                {
                    username: username
                }
            );


        usernameLockUntil =
            Date.now() + LOCK_TIME;


        startUsernameTimer();


        return {
            success: true,
            username: username,
            profile: updated,
            message:
                "تم تعيين اسم المستخدم بنجاح",
            lockedUntil:
                usernameLockUntil
        };
    }


    /* =========================================================
       SAVE DISPLAY NAME
    ========================================================= */

    async function saveDisplayName(
        rawName
    ) {

        if (
            Date.now() <
            displayNameLockUntil
        ) {
            throw new Error(
                "WFESC_DISPLAY_NAME_LOCKED"
            );
        }


        const validation =
            validateDisplayName(
                rawName
            );

        if (!validation.valid) {
            throw new Error(
                validation.message
            );
        }


        const name =
            validation.value;

        const user =
            await getCurrentUser();


        /*
         * الاسم يمكن أن يكون في metadata
         * وكذلك في profiles إذا كان العمود موجودًا.
         *
         * نحاول تحديث profiles أولًا.
         */

        let profile =
            await getProfile(
                user.id
            );


        if (!profile) {
            profile =
                await ensureProfile(
                    user
                );
        }


        const client =
            getClient();


        /*
         * نحدد اسم العمود الموجود.
         */

        let profileNameField =
            null;

        if (
            Object.prototype.hasOwnProperty.call(
                profile,
                "display_name"
            )
        ) {
            profileNameField =
                "display_name";
        } else if (
            Object.prototype.hasOwnProperty.call(
                profile,
                "name"
            )
        ) {
            profileNameField =
                "name";
        }


        /*
         * إذا كان جدول profiles يحتوي
         * على display_name أو name نحدثه.
         */

        if (profileNameField) {

            const changes = {};

            changes[profileNameField] =
                name;

            profile =
                await updateProfileSafely(
                    user.id,
                    changes
                );
        }


        /*
         * تحديث بيانات المستخدم في Auth metadata
         * أيضًا حتى يبقى الاسم متزامنًا.
         */

        if (
            typeof getAuth()
                .updateAccountMetadata ===
            "function"
        ) {

            await getAuth()
                .updateAccountMetadata({
                    display_name: name,
                    name: name
                });
        } else {

            /*
             * احتياط إذا كانت الدالة غير موجودة.
             */

            const { error } =
                await client.auth.updateUser({
                    data: {
                        display_name: name,
                        name: name
                    }
                });

            if (error) {
                throw error;
            }
        }


        displayNameLockUntil =
            Date.now() + LOCK_TIME;

        startDisplayNameTimer();


        return {
            success: true,
            name: name,
            profile: profile,
            message:
                "تم تغيير الاسم بنجاح",
            lockedUntil:
                displayNameLockUntil
        };
    }


    /* =========================================================
       SAVE BIO
    ========================================================= */

    async function saveBio(
        rawBio
    ) {

        const bio =
            normalizeBio(rawBio);

        const user =
            await getCurrentUser();


        const profile =
            await getProfile(
                user.id
            );


        if (!profile) {

            await ensureProfile(
                user
            );
        }


        const updated =
            await updateProfileSafely(
                user.id,
                {
                    bio: bio
                }
            );


        return {
            success: true,
            bio: bio,
            profile: updated,
            message:
                "تم حفظ النبذة بنجاح"
        };
    }


    /* =========================================================
       LOCK HELPERS
    ========================================================= */

    function getUsernameLockRemaining() {

        return Math.max(
            0,
            usernameLockUntil -
            Date.now()
        );
    }


    function getDisplayNameLockRemaining() {

        return Math.max(
            0,
            displayNameLockUntil -
            Date.now()
        );
    }


    function isUsernameLocked() {

        return (
            Date.now() <
            usernameLockUntil
        );
    }


    function isDisplayNameLocked() {

        return (
            Date.now() <
            displayNameLockUntil
        );
    }


    function startUsernameTimer() {

        if (usernameTimer) {
            clearInterval(
                usernameTimer
            );
        }

        usernameTimer =
            setInterval(
                function () {

                    if (
                        !isUsernameLocked()
                    ) {
                        clearInterval(
                            usernameTimer
                        );

                        usernameTimer =
                            null;

                        dispatchLockEvent(
                            "username",
                            0
                        );

                        return;
                    }

                    dispatchLockEvent(
                        "username",
                        getUsernameLockRemaining()
                    );

                },
                1000
            );
    }


    function startDisplayNameTimer() {

        if (displayNameTimer) {
            clearInterval(
                displayNameTimer
            );
        }

        displayNameTimer =
            setInterval(
                function () {

                    if (
                        !isDisplayNameLocked()
                    ) {
                        clearInterval(
                            displayNameTimer
                        );

                        displayNameTimer =
                            null;

                        dispatchLockEvent(
                            "displayName",
                            0
                        );

                        return;
                    }

                    dispatchLockEvent(
                        "displayName",
                        getDisplayNameLockRemaining()
                    );

                },
                1000
            );
    }


    function dispatchLockEvent(
        field,
        remaining
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "WFESCProfileEditLockChanged",
                {
                    detail: {
                        field: field,
                        remaining: remaining,
                        locked:
                            remaining > 0
                    }
                }
            )
        );
    }


    /* =========================================================
       PROFILE EDIT EVENTS
    ========================================================= */

    function dispatchProfileChanged(
        detail
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "WFESCProfileChanged",
                {
                    detail:
                        detail || {}
                }
            )
        );
    }


    /* =========================================================
       SAFE ERROR DETECTION
    ========================================================= */

    function isUsernameTakenError(
        error
    ) {

        if (!error) {
            return false;
        }

        const text =
            (
                error.message ||
                error.details ||
                error.hint ||
                error.code ||
                ""
            )
            .toString()
            .toLowerCase();

        return (
            text.includes(
                "duplicate"
            ) ||
            text.includes(
                "unique"
            ) ||
            text.includes(
                "username"
            ) &&
            (
                text.includes(
                    "already"
                ) ||
                text.includes(
                    "exists"
                ) ||
                text.includes(
                    "taken"
                )
            ) ||
            error.code === "23505"
        );
    }


    /* =========================================================
       ERROR NORMALIZATION
    ========================================================= */

    function getFriendlyError(
        error
    ) {

        if (!error) {
            return "حدث خطأ غير متوقع.";
        }


        if (
            error.code ===
            "USERNAME_TAKEN" ||
            isUsernameTakenError(error)
        ) {
            return "اسم المستخدم مأخوذ مسبقًا";
        }


        if (
            error.message ===
            "WFESC_USERNAME_LOCKED"
        ) {
            return "يمكنك تغيير اسم المستخدم مرة أخرى بعد انتهاء مدة الانتظار.";
        }


        if (
            error.message ===
            "WFESC_DISPLAY_NAME_LOCKED"
        ) {
            return "يمكنك تغيير الاسم مرة أخرى بعد انتهاء مدة الانتظار.";
        }


        if (
            error.message ===
            "WFESC_LOGIN_REQUIRED"
        ) {
            return "يجب تسجيل الدخول أولًا.";
        }


        if (
            error.message
        ) {
            return error.message;
        }


        return "حدث خطأ غير متوقع.";
    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESCProfileEdit = {

        sanitizeUsername:
            sanitizeUsername,

        validateUsername:
            validateUsername,

        normalizeDisplayName:
            normalizeDisplayName,

        validateDisplayName:
            validateDisplayName,

        normalizeBio:
            normalizeBio,

        getCurrentUser:
            getCurrentUser,

        getProfile:
            getProfile,

        ensureProfile:
            ensureProfile,

        updateProfileSafely:
            updateProfileSafely,

        isUsernameAvailable:
            isUsernameAvailable,

        saveUsername:
            saveUsername,

        saveDisplayName:
            saveDisplayName,

        saveBio:
            saveBio,

        isUsernameLocked:
            isUsernameLocked,

        isDisplayNameLocked:
            isDisplayNameLocked,

        getUsernameLockRemaining:
            getUsernameLockRemaining,

        getDisplayNameLockRemaining:
            getDisplayNameLockRemaining,

        isUsernameTakenError:
            isUsernameTakenError,

        getFriendlyError:
            getFriendlyError,

        getClient:
            getClient
    };


    console.log(
        "WFESC Profile Edit loaded."
    );

})();
