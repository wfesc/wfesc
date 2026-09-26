/* =========================================================
   WFESC SETTINGS AUTH
   settings-auth.js

   مسؤول عن:
   - إنشاء حساب
   - تسجيل الدخول
   - تسجيل الخروج
   - استعادة الجلسة
   - معرفة المستخدم الحالي
   - إنشاء/تحديث ملف المستخدم في profiles
   - مراقبة تغيّر حالة تسجيل الدخول

   يعتمد على:
   settings-auth-config.js
   Supabase JS v2
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       منع تشغيل الملف أكثر من مرة
    ===================================================== */

    if (window.WFESCSettingsAuth) {
        return;
    }


    /* =====================================================
       التحقق من إعدادات WFESC
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
       إنشاء عميل Supabase
       باستخدام نفس اتصال posts.html
    ===================================================== */

    const supabaseClient =
        window.supabase.createClient(
            CONFIG.supabaseUrl,
            CONFIG.supabaseKey
        );


    /* =====================================================
       متغيرات النظام
    ===================================================== */

    let currentUser = null;

    let currentSession = null;

    let currentProfile = null;


    /* =====================================================
       أدوات مساعدة
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
       الحصول على اسم المستخدم الافتراضي
    ===================================================== */

    function getDefaultUsername(user) {

        if (!user) {
            return "WFESC User";
        }


        /*
         * إذا كان username موجودًا في metadata
         */
        if (
            user.user_metadata &&
            user.user_metadata.username
        ) {

            return String(
                user.user_metadata.username
            ).trim();

        }


        /*
         * إذا كان البريد موجودًا،
         * نستخدم الجزء الذي قبل @ كاسم مبدئي
         */
        if (user.email) {

            const emailName =
                String(user.email)
                    .split("@")[0]
                    .trim();

            if (emailName) {
                return emailName;
            }

        }


        return "WFESC User";

    }


    /* =====================================================
       جلب Profile
    ===================================================== */

    async function fetchProfile(userId) {

        if (!userId) {
            return null;
        }


        const result =
            await supabaseClient
                .from(CONFIG.profilesTable)
                .select("*")
                .eq("id", userId)
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
            return null;
        }


        const existingProfile =
            await fetchProfile(user.id);


        /*
         * موجود مسبقًا
         */
        if (existingProfile) {

            return existingProfile;

        }


        const username =
            getDefaultUsername(user);


        const profileData = {

            id: user.id,

            username: username,

            avatar_url: null,

            bio: null

        };


        const result =
            await supabaseClient
                .from(CONFIG.profilesTable)
                .insert(profileData)
                .select("*")
                .maybeSingle();


        if (result.error) {

            /*
             * لا نوقف نظام تسجيل الدخول
             * إذا كانت سياسة RLS تمنع إنشاء profile هنا.
             *
             * يمكن معالجة ذلك لاحقًا من المكان المناسب.
             */

            console.warn(
                "WFESC Auth: تعذر إنشاء profile:",
                result.error
            );

            return null;
        }


        currentProfile =
            result.data || null;


        return currentProfile;

    }


    /* =====================================================
       تحديث Profile
       يستخدم لاحقًا من صفحات الموقع
    ===================================================== */

    async function updateProfile(updates) {

        if (!currentUser) {

            return {

                data: null,

                error: new Error(
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

                error: new Error(
                    "بيانات التحديث غير صحيحة."
                )

            };

        }


        const allowedUpdates = {};


        /*
         * Username
         */
        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "username"
            )
        ) {

            allowedUpdates.username =
                String(
                    updates.username
                ).trim();

        }


        /*
         * Avatar
         */
        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "avatar_url"
            )
        ) {

            allowedUpdates.avatar_url =
                updates.avatar_url || null;

        }


        /*
         * Bio
         */
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

                data: currentProfile,

                error: null

            };

        }


        const result =
            await supabaseClient
                .from(CONFIG.profilesTable)
                .update(allowedUpdates)
                .eq("id", currentUser.id)
                .select("*")
                .maybeSingle();


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تحديث profile:",
                result.error
            );

            return {

                data: null,

                error: result.error

            };

        }


        currentProfile =
            result.data || null;


        /*
         * إرسال حدث حتى تستطيع الصفحات الأخرى
         * تحديث بيانات الحساب عند الحاجة.
         */
        window.dispatchEvent(
            new CustomEvent(
                "WFESCProfileUpdated",
                {
                    detail: currentProfile
                }
            )
        );


        return {

            data: currentProfile,

            error: null

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
            String(email || "").trim();

        password =
            String(password || "");

        username =
            String(username || "").trim();


        if (!email) {

            return {

                data: null,

                error: new Error(
                    "يرجى إدخال البريد الإلكتروني."
                )

            };

        }


        if (!password) {

            return {

                data: null,

                error: new Error(
                    "يرجى إدخال كلمة المرور."
                )

            };

        }


        if (password.length < 6) {

            return {

                data: null,

                error: new Error(
                    "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
                )

            };

        }


        /*
         * إذا لم يدخل المستخدم اسمًا،
         * نستخدم اسم البريد بشكل مؤقت.
         */
        if (!username) {

            username =
                email.split("@")[0];

        }


        /*
         * إنشاء الحساب في Supabase Auth
         */
        const result =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        username: username

                    },

                    /*
                     * بعد تأكيد البريد يمكن إرجاع المستخدم
                     * إلى settings.html.
                     */
                    emailRedirectTo:
                        window.location.origin +
                        window.location.pathname

                }

            });


        if (result.error) {

            console.error(
                "WFESC Auth: فشل إنشاء الحساب:",
                result.error
            );

            return {

                data: null,

                error: result.error

            };

        }


        /*
         * تحديث الحالة المحلية
         */
        currentUser =
            result.data.user || null;

        currentSession =
            result.data.session || null;


        /*
         * إذا تم إنشاء Session مباشرة،
         * ننشئ profile الآن.
         *
         * إذا كان تأكيد البريد مطلوبًا،
         * سيتم إنشاء profile بعد تسجيل الدخول
         * أو بعد استعادة الجلسة.
         */
        if (currentUser && currentSession) {

            await ensureProfile(
                currentUser
            );

        }


        /*
         * إشعار بقية الموقع
         */
        window.dispatchEvent(
            new CustomEvent(
                "WFESCAuthChanged",
                {
                    detail: {

                        user: currentUser,

                        session: currentSession,

                        event: "SIGNED_UP"

                    }
                }
            )
        );


        return {

            data: result.data,

            error: null

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
            String(email || "").trim();

        password =
            String(password || "");


        if (!email) {

            return {

                data: null,

                error: new Error(
                    "يرجى إدخال البريد الإلكتروني."
                )

            };

        }


        if (!password) {

            return {

                data: null,

                error: new Error(
                    "يرجى إدخال كلمة المرور."
                )

            };

        }


        const result =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تسجيل الدخول:",
                result.error
            );

            return {

                data: null,

                error: result.error

            };

        }


        currentSession =
            result.data.session || null;

        currentUser =
            result.data.user || null;


        /*
         * التأكد من وجود Profile
         */
        if (currentUser) {

            await ensureProfile(
                currentUser
            );

        }


        window.dispatchEvent(
            new CustomEvent(
                "WFESCAuthChanged",
                {
                    detail: {

                        user: currentUser,

                        session: currentSession,

                        event: "SIGNED_IN"

                    }
                }
            )
        );


        return {

            data: result.data,

            error: null

        };

    }


    /* =====================================================
       تسجيل الخروج
    ===================================================== */

    async function signOut() {

        const result =
            await supabaseClient.auth.signOut();


        if (result.error) {

            console.error(
                "WFESC Auth: فشل تسجيل الخروج:",
                result.error
            );

            return {

                error: result.error

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

                        user: null,

                        session: null,

                        event: "SIGNED_OUT"

                    }
                }
            )
        );


        return {

            error: null

        };

    }


    /* =====================================================
       استعادة الجلسة الحالية
    ===================================================== */

    async function restoreSession() {

        const result =
            await supabaseClient.auth.getSession();


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

                error: result.error

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

            await ensureProfile(
                currentUser
            );

        }


        return {

            session: currentSession,

            user: currentUser,

            profile: currentProfile,

            error: null

        };

    }


    /* =====================================================
       مراقبة تغيّر حالة المصادقة
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


                /*
                 * عند تسجيل الخروج
                 */
                if (
                    event === "SIGNED_OUT"
                ) {

                    currentProfile = null;

                }


                /*
                 * لا نستدعي Supabase إضافي مباشرة
                 * داخل onAuthStateChange لتجنب مشاكل
                 * إعادة الدخول في نفس دورة المصادقة.
                 */
                setTimeout(
                    async function () {

                        if (currentUser) {

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
       إيقاف مراقبة المصادقة
       متاح إذا احتاجته صفحة مستقبلًا
    ===================================================== */

    function unsubscribe() {

        if (
            authListener &&
            authListener.data &&
            authListener.data.subscription
        ) {

            authListener.data.subscription.unsubscribe();

        }

    }


    /* =====================================================
       تصدير نظام المصادقة
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
        .catch(function (error) {

            console.error(
                "WFESC Auth: خطأ أثناء استعادة الجلسة:",
                error
            );

        });


})();
