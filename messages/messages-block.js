/* =========================================================
   WFESC MESSAGES BLOCK
   File: messages/messages-block.js
   ========================================================= */

(function () {
    "use strict";

    const SUPABASE_URL =
        "https://mcgbzfgbaxwmutniorlw.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_V9Ha2JDWmhox-XMzj1SK_w_6p5pAK5L";

    const client =
        window.WFESCSupabase ||
        window.supabase?.createClient?.(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    if (!client) {
        console.error(
            "WFESC BLOCK: Supabase client غير متوفر"
        );
        return;
    }

    async function getCurrentUser() {
        try {
            const {
                data,
                error
            } = await client.auth.getUser();

            if (error) {
                console.error(
                    "WFESC BLOCK: getUser error",
                    error
                );
                return null;
            }

            return data?.user || null;

        } catch (error) {
            console.error(
                "WFESC BLOCK: getCurrentUser error",
                error
            );

            return null;
        }
    }

    async function blockUser(userId) {

        if (!userId) {
            throw new Error(
                "معرف المستخدم المطلوب حظره غير موجود"
            );
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new Error(
                "يجب تسجيل الدخول أولاً"
            );
        }

        if (
            String(currentUser.id) ===
            String(userId)
        ) {
            throw new Error(
                "لا يمكنك حظر نفسك"
            );
        }

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .insert({
                blocker_id: currentUser.id,
                blocked_id: userId
            })
            .select()
            .single();

        if (error) {

            if (
                error.code === "23505"
            ) {
                throw new Error(
                    "هذا المستخدم محظور بالفعل"
                );
            }

            console.error(
                "WFESC BLOCK: block error",
                error
            );

            throw error;
        }

        return data;
    }

    async function unblockUser(userId) {

        if (!userId) {
            throw new Error(
                "معرف المستخدم المطلوب إلغاء حظره غير موجود"
            );
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new Error(
                "يجب تسجيل الدخول أولاً"
            );
        }

        const {
            error
        } = await client
            .from("blocked_users")
            .delete()
            .eq(
                "blocker_id",
                currentUser.id
            )
            .eq(
                "blocked_id",
                userId
            );

        if (error) {

            console.error(
                "WFESC BLOCK: unblock error",
                error
            );

            throw error;
        }

        return true;
    }

    async function isBlocked(userId) {

        if (!userId) {
            return false;
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return false;
        }

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select("id")
            .eq(
                "blocker_id",
                currentUser.id
            )
            .eq(
                "blocked_id",
                userId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "WFESC BLOCK: isBlocked error",
                error
            );

            return false;
        }

        return !!data;
    }

    async function isBlockedBy(userId) {

        if (!userId) {
            return false;
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return false;
        }

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select("id")
            .eq(
                "blocker_id",
                userId
            )
            .eq(
                "blocked_id",
                currentUser.id
            )
            .maybeSingle();

        if (error) {

            console.error(
                "WFESC BLOCK: isBlockedBy error",
                error
            );

            return false;
        }

        return !!data;
    }

    async function getBlockedUsers() {

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return [];
        }

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select(
                "id, blocked_id, created_at"
            )
            .eq(
                "blocker_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "WFESC BLOCK: getBlockedUsers error",
                error
            );

            return [];
        }

        return data || [];
    }

    async function getBlockInfo(userId) {

        if (!userId) {
            return null;
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return null;
        }

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select(
                "id, blocked_id, created_at"
            )
            .eq(
                "blocker_id",
                currentUser.id
            )
            .eq(
                "blocked_id",
                userId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "WFESC BLOCK: getBlockInfo error",
                error
            );

            return null;
        }

        return data || null;
    }

    window.WFESC_MESSAGES_BLOCK = {

        client,

        getCurrentUser,

        blockUser,

        unblockUser,

        isBlocked,

        isBlockedBy,

        getBlockedUsers,

        getBlockInfo

    };

    console.log(
        "WFESC BLOCK: module loaded"
    );

})();
