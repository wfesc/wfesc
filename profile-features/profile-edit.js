/* =========================================================
   WFESC PROFILE EDIT
   الاسم + اسم المستخدم + النبذة
========================================================= */

(function () {
    "use strict";

    const LOCK_TIME = 4 * 60 * 1000;

    function getSupabaseClient() {
        if (window.WFESCSupabase) {
            return window.WFESCSupabase;
        }

        throw new Error("Supabase client غير متوفر");
    }

    async function getCurrentUser() {
        const supabase = getSupabaseClient();

        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data || !data.user) {
            throw new Error("يجب تسجيل الدخول أولًا");
        }

        return data.user;
    }

    async function getCurrentProfile(userId) {
        const supabase = getSupabaseClient();

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data || null;
    }

    function normalizeUsername(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    function validateUsername(username) {
        if (!username) {
            return "اسم المستخدم مطلوب";
        }

        if (!/^[a-z0-9]{3,9}$/.test(username)) {
            return "اسم المستخدم يجب أن يكون من 3 إلى 9 أحرف أو أرقام إنجليزية";
        }

        return "";
    }

    async function ensureProfile(userId) {
        const supabase = getSupabaseClient();

        let profile = await getCurrentProfile(userId);

        if (profile) {
            return profile;
        }

        const user = await getCurrentUser();

        let username =
            user.user_metadata &&
            user.user_metadata.username
                ? normalizeUsername(user.user_metadata.username)
                : "";

        if (!username || validateUsername(username)) {
            username = "wfesc";
        }

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .insert({
                id: userId,
                username: username
            })
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async function updateProfileSafely(userId, changes) {
        if (!userId) {
            throw new Error("معرّف المستخدم غير موجود");
        }

        changes = changes || {};

        const supabase = getSupabaseClient();

        const currentProfile =
            await ensureProfile(userId);

        const payload = {};

        Object.keys(changes).forEach(function (key) {
            if (
                changes[key] !== undefined &&
                changes[key] !== null
            ) {
                payload[key] = changes[key];
            }
        });

        /*
         * username إجباري في قاعدة البيانات.
         * لذلك لا نرسل تحديثًا بدون username.
         */
        if (
            payload.username === undefined ||
            payload.username === null ||
            payload.username === ""
        ) {
            payload.username =
                currentProfile.username ||
                "wfesc";
        }

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", userId)
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async function saveDisplayName(rawName) {
        const user = await getCurrentUser();

        const name = String(rawName || "").trim();

        if (!name) {
            throw new Error("الاسم لا يمكن أن يكون فارغًا");
        }

        if (name.length > 60) {
            throw new Error("الاسم طويل جدًا");
        }

        const profile =
            await ensureProfile(user.id);

        const updated =
            await updateProfileSafely(
                user.id,
                {
                    username: profile.username,
                    display_name: name,
                    last_display_name_change_at:
                        new Date().toISOString()
                }
            );

        /*
         * تحديث بيانات Auth أيضًا،
         * حتى يبقى الاسم متزامنًا.
         */
        try {
            const supabase = getSupabaseClient();

            await supabase.auth.updateUser({
                data: {
                    display_name: name,
                    name: name
                }
            });
        } catch (authError) {
            console.warn(
                "تعذر تحديث اسم Auth:",
                authError
            );
        }

        return {
            success: true,
            message: "تم تغيير الاسم بنجاح",
            profile: updated,
            lockTime: LOCK_TIME
        };
    }

    async function saveUsername(rawUsername) {
        const user = await getCurrentUser();

        const username =
            normalizeUsername(rawUsername);

        const validation =
            validateUsername(username);

        if (validation) {
            throw new Error(validation);
        }

        const supabase = getSupabaseClient();

        const {
            data: existing,
            error: checkError
        } = await supabase
            .from("profiles")
            .select("id,username")
            .eq("username", username)
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        if (
            existing &&
            existing.id !== user.id
        ) {
            throw new Error(
                "اسم المستخدم مأخوذ مسبقًا"
            );
        }

        const currentProfile =
            await ensureProfile(user.id);

        const updated =
            await updateProfileSafely(
                user.id,
                {
                    username: username,
                    display_name:
                        currentProfile.display_name || undefined,
                    last_username_change_at:
                        new Date().toISOString()
                }
            );

        try {
            const supabaseClient =
                getSupabaseClient();

            await supabaseClient.auth.updateUser({
                data: {
                    username: username
                }
            });
        } catch (authError) {
            console.warn(
                "تعذر تحديث Username في Auth:",
                authError
            );
        }

        return {
            success: true,
            message: "تم تعيين اسم المستخدم بنجاح",
            profile: updated,
            lockTime: LOCK_TIME
        };
    }

    async function saveBio(rawBio) {
        const user = await getCurrentUser();

        const bio =
            String(rawBio || "").trim();

        if (bio.length > 160) {
            throw new Error(
                "النبذة يجب ألا تتجاوز 160 حرفًا"
            );
        }

        const profile =
            await ensureProfile(user.id);

        const updated =
            await updateProfileSafely(
                user.id,
                {
                    username: profile.username,
                    bio: bio
                }
            );

        return {
            success: true,
            message: "تم الحفظ بنجاح",
            profile: updated
        };
    }

    function canChange(lastChange) {
        if (!lastChange) {
            return true;
        }

        const timestamp =
            new Date(lastChange).getTime();

        if (Number.isNaN(timestamp)) {
            return true;
        }

        return (
            Date.now() - timestamp >= LOCK_TIME
        );
    }

    function getRemainingLockTime(lastChange) {
        if (!lastChange) {
            return 0;
        }

        const timestamp =
            new Date(lastChange).getTime();

        if (Number.isNaN(timestamp)) {
            return 0;
        }

        return Math.max(
            0,
            LOCK_TIME -
            (Date.now() - timestamp)
        );
    }

    window.WFESCProfileEdit = {
        LOCK_TIME,
        getCurrentUser,
        getCurrentProfile,
        ensureProfile,
        updateProfileSafely,
        saveDisplayName,
        saveUsername,
        saveBio,
        normalizeUsername,
        validateUsername,
        canChange,
        getRemainingLockTime
    };

})();
