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
       المفتاح الجديد يؤخذ من settings-auth-config.js
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
       حدود اسم المستخدم
    ===================================================== */

    function getUsernameLimits() {

        const usernameConfig =
            CONFIG.username || {};


        return {

            min:
                Number(
                    usernameConfig.minLength || 1
                ),

            max:
                Number(
                    usernameConfig.maxLength || 3
                )

        };

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


        if (length < limits.min) {

            return {

                valid: false,

                error:
                    new Error(
                        "اسم المستخدم قصير جدًا."
                    )

            };

        }


        if (length > limits.max) {

            return {

                valid: false,

                error:
                    new Error(
                        "اسم المستخدم يجب ألا يتجاوز " +
                        limits.max +
                        " أحرف."
                    )

            };

        }


        return {

            valid: true,

            error: null

        };

    }


    /* =====================================================
       اسم افتراضي
    ===================================================== */

    function getDefaultUsername(user) {

        if (!user) {

            return "W";

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


            if (emailName) {

                const limits =
                    getUsernameLimits();


                const shortName =
                    [...emailName]
                        .slice(0, limits.max)
                        .join("");


                if (shortName) {

                    return shortName;

                }

            }

        }


        return "W";

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
       مهم:
       فشل profile لا يمنع تسجيل الدخول
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

            /*
             * تسجيل الدخول لا يفشل إذا كانت
             * مشكلة الـprofile من RLS أو الجدول.
             */

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

        if (!password) {

            return {

                data: null,

                error:
                    new Error(
                        "يرجى إدخال كلمة المرور."
                    )

            };

        }


        if (password.length < 6) {

            return {

                data: null,

                error:
                    new Error(
                        "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
                    )

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
                            window.location.origin +
                            window.location.pathname

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


        /*
         * إذا Supabase أعطى Session مباشرة
         * ننشئ profile.
         *
         * إذا كان تأكيد البريد مطلوبًا
         * فلن توجد Session وهذا طبيعي.
         */

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


        if (!password) {

            return {

                data: null,

                error:
                    new Error(
                        "يرجى إدخال كلمة المرور."
                    )

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


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تسجيل الدخول:",
                result.error
            );


            return {

                data: null,

                error:
                    result.error

            };

        }


        currentSession =
            result.data.session || null;


        currentUser =
            result.data.user || null;


        /*
         * نجاح تسجيل الدخول الحقيقي
         */

        if (currentUser) {

            /*
             * لا ننتظر profile حتى لا تتعطل
             * واجهة الحساب إذا كانت RLS تمنع القراءة.
             */

            ensureProfile(
                currentUser
            ).catch(
                function (error) {

                    console.warn(
                        "WFESC Auth: مشكلة profile بعد تسجيل الدخول:",
                        error
                    );

                }
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


        const redirectUrl =
            window.location.origin +
            window.location.pathname;


        let result;


        try {

            result =
                await supabaseClient
                    .auth
                    .resetPasswordForEmail(
                        email,
                        {

                            redirectTo:
                                redirectUrl

                        }
                    );

        } catch (error) {

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

            data: true,

            error: null

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


                /*
                 * لا ننفذ عمليات Supabase
                 * مباشرة داخل callback.
                 */

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

        resetPassword:
            resetPassword,

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
