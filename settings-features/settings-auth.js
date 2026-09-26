/* =========================================================
   WFESC SETTINGS AUTH
   settings-auth.js
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
       إنشاء اتصال Supabase
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
       رابط صفحة الإعدادات
    ===================================================== */

    const SETTINGS_URL =
        "https://wfesc.github.io/wfesc/settings.html";


    /* =====================================================
       حدود كلمة المرور
    ===================================================== */

    const PASSWORD_MIN = 6;

    const PASSWORD_MAX = 16;


    /* =====================================================
       GETTERS
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

        if (!currentUser) {

            return null;

        }

        return currentUser.id || null;

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
       التحقق من كلمة المرور
    ===================================================== */

    function validatePassword(password) {

        password =
            String(
                password || ""
            );


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
       التحقق من اسم المستخدم
       
       الشروط:
       - 3 أحرف أو أكثر
       - بحد أقصى 9 أحرف
       - أحرف إنجليزية فقط
       - بدون مسافات
       - بدون أرقام
       - بدون فواصل
       - بدون رموز
    ===================================================== */

    function validateUsername(username) {

        username =
            String(
                username || ""
            ).trim();


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


        if (length < limits.min) {

            return {

                valid: false,

                error:
                    new Error(
                        "يجب أن يتكون اسم المستخدم من 3 أحرف أو أكثر."
                    )

            };

        }


        if (length > limits.max) {

            return {

                valid: false,

                error:
                    new Error(
                        "اسم المستخدم يجب ألا يتجاوز 9 أحرف."
                    )

            };

        }


        if (!/^[A-Za-z]+$/.test(username)) {

            return {

                valid: false,

                error:
                    new Error(
                        "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية فقط، بدون مسافات أو فواصل أو رموز."
                    )

            };

        }


        return {

            valid: true,

            error: null

        };

    }


    /* =====================================================
       تنظيف اسم المستخدم
    ===================================================== */

    function sanitizeUsername(username) {

        username =
            String(
                username || ""
            );


        username =
            username.replace(
                /[^A-Za-z]/g,
                ""
            );


        const limits =
            getUsernameLimits();


        username =
            username.slice(
                0,
                limits.max
            );


        if (
            username.length >=
            limits.min
        ) {

            return username;

        }


        return "WFESC";

    }


    /* =====================================================
       اسم افتراضي
    ===================================================== */

    function getDefaultUsername(user) {

        const limits =
            getUsernameLimits();


        if (!user) {

            return "WFESC";

        }


        if (
            user.user_metadata &&
            user.user_metadata.username
        ) {

            const metadataUsername =
                String(
                    user.user_metadata.username
                ).trim();


            const validation =
                validateUsername(
                    metadataUsername
                );


            if (validation.valid) {

                return metadataUsername;

            }

        }


        if (user.email) {

            const emailName =
                String(
                    user.email
                )
                .split("@")[0]
                .trim();


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


        return "WFESC";

    }


    /* =====================================================
       جلب Profile
    ===================================================== */

    async function fetchProfile(userId) {

        if (!userId) {

            currentProfile = null;

            return null;

        }


        const result =
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
       إنشاء Profile إذا لم يكن موجودًا
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

            currentProfile =
                existingProfile;


            return existingProfile;

        }


        const username =
            getDefaultUsername(
                user
            );


        const profileData = {

            id:
                user.id,

            username:
                username,

            avatar_url:
                null,

            bio:
                null

        };


        const result =
            await supabaseClient
                .from(
                    CONFIG.profilesTable
                )
                .insert(
                    profileData
                )
                .select("*")
                .maybeSingle();


        if (result.error) {

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


        /* =========================
           Username
        ========================= */

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "username"
            )
        ) {

            const username =
                String(
                    updates.username || ""
                ).trim();


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


        /* =========================
           Avatar
        ========================= */

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "avatar_url"
            )
        ) {

            allowedUpdates.avatar_url =
                updates.avatar_url || null;

        }


        /* =========================
           Bio
        ========================= */

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


        const result =
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


        window.dispatchEvent(
            new CustomEvent(
                "WFESCProfileUpdated",
                {
                    detail:
                        currentProfile
                }
            )
        );


        return {

            data:
                currentProfile,

            error:
                null

        };

    }


    /* =====================================================
       إنشاء حساب
    ===================================================== */

    async function signUp(
        email,
        password,
        username
    ) {

        email =
            String(
                email || ""
            ).trim();


        password =
            String(
                password || ""
            );


        username =
            String(
                username || ""
            ).trim();


        /* =========================
           Email
        ========================= */

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


        /* =========================
           Username
        ========================= */

        const usernameValidation =
            validateUsername(
                username
            );


        if (!usernameValidation.valid) {

            return {

                data: null,

                error:
                    usernameValidation.error

            };

        }


        /* =========================
           Password
        ========================= */

        const passwordValidation =
            validatePassword(
                password
            );


        if (!passwordValidation.valid) {

            return {

                data: null,

                error:
                    passwordValidation.error

            };

        }


        /* =========================
           Supabase Sign Up
        ========================= */

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
                                username

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

                error:
                    error

            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل إنشاء الحساب:",
                result.error
            );


            return {

                data: null,

                error:
                    result.error

            };

        }


        currentUser =
            result.data.user || null;


        currentSession =
            result.data.session || null;


        if (
            currentUser &&
            currentSession
        ) {

            await ensureProfile(
                currentUser
            );

        }


        window.dispatchEvent(
            new CustomEvent(
                "WFESCAuthChanged",
                {

                    detail: {

                        user:
                            currentUser,

                        session:
                            currentSession,

                        event:
                            "SIGNED_UP"

                    }

                }
            )
        );


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


        if (!passwordValidation.valid) {

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

                error:
                    error

            };

        }


       
        /* =================================================
           كلمة المرور خاطئة / فشل تسجيل الدخول
        ================================================= */

        if (result.error) {

            console.error(
                "WFESC Auth: فشل تسجيل الدخول:",
                result.error
            );


            let message =
                "تعذر تسجيل الدخول.";


            const errorCode =
                String(
                    result.error.code ||
                    ""
                ).toLowerCase();


            const errorMessage =
                String(
                    result.error.message ||
                    ""
                ).toLowerCase();


            if (
                errorCode ===
                    "invalid_credentials" ||
                errorMessage.includes(
                    "invalid login credentials"
                ) ||
                errorMessage.includes(
                    "invalid credentials"
                )
            ) {

                message =
                    "كلمة المرور غير صحيحة.";

            }


            return {

                data: null,

                error:
                    new Error(
                        message
                    )

            };

        }


        currentSession =
            result.data.session || null;


        currentUser =
            result.data.user || null;


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


        window.dispatchEvent(
            new CustomEvent(
                "WFESCAuthChanged",
                {

                    detail: {

                        user:
                            currentUser,

                        session:
                            currentSession,

                        event:
                            "SIGNED_IN"

                    }

                }
            )
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

                error:
                    error

            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تغيير كلمة المرور:",
                result.error
            );


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

    async function resetPassword(email) {

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

                error:
                    error

            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل إرسال إعادة التعيين:",
                result.error
            );


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
       
       ملاحظة أمنية:
       لا يتم وضع Service Role Key داخل الموقع.
       الحذف الكامل من auth.users يحتاج Edge Function
       أو جهة Server-side آمنة في Supabase.
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


        currentUser = null;

        currentSession = null;

        currentProfile = null;


        window.dispatchEvent(
            new CustomEvent(
                "WFESCAuthChanged",
                {

                    detail: {

                        user:
                            null,

                        session:
                            null,

                        event:
                            "SIGNED_OUT"

                    }

                }
            )
        );


        return {

            error:
                null

        };

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


            currentSession = null;

            currentUser = null;

            currentProfile = null;


            return {

                session: null,

                user: null,

                profile: null,

                error:
                    error

            };

        }


        if (result.error) {

            console.error(
                "WFESC Auth: فشل استعادة الجلسة:",
                result.error
            );


            currentSession = null;

            currentUser = null;

            currentProfile = null;


            return {

                session: null,

                user: null,

                profile: null,

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


        currentProfile = null;


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


        /* =================================================
           معرفة العودة من رابط تأكيد البريد
        ================================================= */

        const currentUrl =
            window.location.href;


        const cameFromEmailVerification =
            currentUrl.includes("code=") ||
            currentUrl.includes("access_token=") ||
            currentUrl.includes("refresh_token=");


        if (
            currentUser &&
            cameFromEmailVerification
        ) {

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

        }


        window.dispatchEvent(
            new CustomEvent(
                "WFESCAuthChanged",
                {

                    detail: {

                        user:
                            currentUser,

                        session:
                            currentSession,

                        event:
                            "SESSION_RESTORED"

                    }

                }
            )
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
       مراقبة Auth
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

                    currentProfile = null;

                }


                setTimeout(
                    async function () {

                        if (currentUser) {

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


                        /* =================================
                           تأكيد البريد
                        ================================= */

                        if (
                            currentUser &&
                            (
                                event ===
                                "SIGNED_IN" ||
                                event ===
                                "INITIAL_SESSION"
                            )
                        ) {

                            const currentUrl =
                                window.location.href;


                            const verifiedFromUrl =
                                currentUrl.includes("code=") ||
                                currentUrl.includes("access_token=") ||
                                currentUrl.includes("refresh_token=");


                            if (verifiedFromUrl) {

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

                            }

                        }


                        window.dispatchEvent(
                            new CustomEvent(
                                "WFESCAuthChanged",
                                {

                                    detail: {

                                        user:
                                            currentUser,

                                        session:
                                            currentSession,

                                        event:
                                            event

                                    }

                                }
                            )
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
       EXPORT
    ===================================================== */

    window.WFESCSettingsAuth = {

        client:
            getClient(),

        config:
            CONFIG,

        getUser:
            getUser,

        getSession:
            getSession,

        getProfile:
            getProfile,

        getCurrentUserId:
            getCurrentUserId,

        fetchProfile:
            fetchProfile,

        ensureProfile:
            ensureProfile,

        updateProfile:
            updateProfile,

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

        restoreSession:
            restoreSession,

        unsubscribe:
            unsubscribe

    };


    /* =====================================================
       تشغيل استعادة الجلسة
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
