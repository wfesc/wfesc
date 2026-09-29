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

    /*
     * مهم:
     * نستخدم عميل WFESC الموجود مسبقاً إذا كان موجوداً.
     * لا ننشئ جلسة أو Token جديد للمستخدم.
     */
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

    /* =====================================================
       CACHE
       ===================================================== */

    const BLOCK_CACHE_TIME = 30000;

    const blockStatusCache = new Map();

    const blockInfoCache = new Map();

    const blockedUsersCache = {
        data: null,
        time: 0
    };

    /* =====================================================
       HELPERS
       ===================================================== */

    function normalizeId(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const id = String(value).trim();

        return id || null;
    }

    function clearBlockCache(userId) {

        const normalizedId =
            normalizeId(userId);

        if (normalizedId) {
            blockStatusCache.delete(
                normalizedId
            );

            blockInfoCache.delete(
                normalizedId
            );
        }

        blockedUsersCache.data = null;
        blockedUsersCache.time = 0;
    }

    function clearAllBlockCache() {

        blockStatusCache.clear();
        blockInfoCache.clear();

        blockedUsersCache.data = null;
        blockedUsersCache.time = 0;
    }

    function dispatchBlockEvent(
        type,
        userId,
        extra = {}
    ) {

        const detail = {
            userId:
                normalizeId(userId),
            ...extra
        };

        /*
         * نرسل نفس الحدث على window و document
         * حتى الوحدات القديمة والجديدة تتفاعل.
         */

        try {
            window.dispatchEvent(
                new CustomEvent(
                    type,
                    {
                        detail
                    }
                )
            );
        } catch (error) {
            console.warn(
                "WFESC BLOCK: window event failed",
                error
            );
        }

        try {
            document.dispatchEvent(
                new CustomEvent(
                    type,
                    {
                        detail
                    }
                )
            );
        } catch (error) {
            console.warn(
                "WFESC BLOCK: document event failed",
                error
            );
        }
    }

    /* =====================================================
       CURRENT USER
       ===================================================== */

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

    /* =====================================================
       BLOCK USER
       ===================================================== */

    async function blockUser(userId) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {
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

        const currentUserId =
            normalizeId(currentUser.id);

        if (
            currentUserId ===
            targetId
        ) {
            throw new Error(
                "لا يمكنك حظر نفسك"
            );
        }

        /*
         * نتأكد أولاً من عدم وجود الحظر.
         * هذا يمنع ظهور رسائل تأكيد/أخطاء غير ضرورية.
         */

        const alreadyBlocked =
            await isBlocked(
                targetId,
                true
            );

        if (alreadyBlocked) {

            const existingInfo =
                await getBlockInfo(
                    targetId,
                    true
                );

            throw new Error(
                "هذا المستخدم محظور بالفعل"
            );
        }

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .insert({
                blocker_id:
                    currentUserId,

                blocked_id:
                    targetId
            })
            .select(
                "id, blocker_id, blocked_id, created_at"
            )
            .single();

        if (error) {

            /*
             * duplicate key
             */
            if (
                error.code ===
                "23505"
            ) {

                clearBlockCache(
                    targetId
                );

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

        clearBlockCache(
            targetId
        );

        /*
         * نرسل كل أسماء الأحداث التي تستخدمها
         * الوحدات الحالية حتى تتحدث الواجهة فوراً.
         */

        dispatchBlockEvent(
            "wfesc:block-changed",
            targetId,
            {
                action: "blocked",
                blocked: true,
                blockedBy: false,
                info: data || null
            }
        );

        dispatchBlockEvent(
            "wfesc:blocked",
            targetId,
            {
                action: "blocked",
                blocked: true,
                info: data || null
            }
        );

        dispatchBlockEvent(
            "wfesc:user-blocked",
            targetId,
            {
                action: "blocked",
                blocked: true,
                info: data || null
            }
        );

        return data;
    }

    /* =====================================================
       UNBLOCK USER
       ===================================================== */

    async function unblockUser(userId) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {
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

        const currentUserId =
            normalizeId(currentUser.id);

        const {
            error
        } = await client
            .from("blocked_users")
            .delete()
            .eq(
                "blocker_id",
                currentUserId
            )
            .eq(
                "blocked_id",
                targetId
            );

        if (error) {

            console.error(
                "WFESC BLOCK: unblock error",
                error
            );

            throw error;
        }

        clearBlockCache(
            targetId
        );

        dispatchBlockEvent(
            "wfesc:block-changed",
            targetId,
            {
                action: "unblocked",
                blocked: false,
                blockedBy: false
            }
        );

        dispatchBlockEvent(
            "wfesc:unblocked",
            targetId,
            {
                action: "unblocked",
                blocked: false
            }
        );

        dispatchBlockEvent(
            "wfesc:user-unblocked",
            targetId,
            {
                action: "unblocked",
                blocked: false
            }
        );

        return true;
    }

    /* =====================================================
       IS BLOCKED BY CURRENT USER
       ===================================================== */

    async function isBlocked(
        userId,
        forceRefresh = false
    ) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {
            return false;
        }

        if (!forceRefresh) {

            const cached =
                blockStatusCache.get(
                    targetId
                );

            if (
                cached &&
                (
                    Date.now() -
                    cached.time
                ) <
                    BLOCK_CACHE_TIME
            ) {
                return cached.blocked;
            }
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return false;
        }

        const currentUserId =
            normalizeId(currentUser.id);

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select("id")
            .eq(
                "blocker_id",
                currentUserId
            )
            .eq(
                "blocked_id",
                targetId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "WFESC BLOCK: isBlocked error",
                error
            );

            return false;
        }

        const blocked =
            !!data;

        blockStatusCache.set(
            targetId,
            {
                blocked,
                time: Date.now()
            }
        );

        return blocked;
    }

    /* =====================================================
       IS BLOCKED BY OTHER USER
       ===================================================== */

    async function isBlockedBy(
        userId,
        forceRefresh = false
    ) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {
            return false;
        }

        const cacheKey =
            "by:" + targetId;

        if (!forceRefresh) {

            const cached =
                blockStatusCache.get(
                    cacheKey
                );

            if (
                cached &&
                (
                    Date.now() -
                    cached.time
                ) <
                    BLOCK_CACHE_TIME
            ) {
                return cached.blocked;
            }
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return false;
        }

        const currentUserId =
            normalizeId(currentUser.id);

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select("id")
            .eq(
                "blocker_id",
                targetId
            )
            .eq(
                "blocked_id",
                currentUserId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "WFESC BLOCK: isBlockedBy error",
                error
            );

            return false;
        }

        const blocked =
            !!data;

        blockStatusCache.set(
            cacheKey,
            {
                blocked,
                time: Date.now()
            }
        );

        return blocked;
    }

    /* =====================================================
       GET BLOCK STATUS
       ===================================================== */

    async function getBlockStatus(
        userId,
        forceRefresh = false
    ) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {

            return {
                blocked: false,
                blockedBy: false,
                isBlocked: false,
                isBlockedBy: false,
                info: null
            };
        }

        const [
            blocked,
            blockedBy
        ] = await Promise.all([
            isBlocked(
                targetId,
                forceRefresh
            ),

            isBlockedBy(
                targetId,
                forceRefresh
            )
        ]);

        let info = null;

        if (blocked) {

            info =
                await getBlockInfo(
                    targetId,
                    forceRefresh
                );
        }

        return {
            blocked,
            blockedBy,

            /*
             * أسماء إضافية حتى الوحدات المختلفة
             * تستطيع قراءة نفس الحالة.
             */

            isBlocked: blocked,
            isBlockedBy: blockedBy,

            info
        };
    }

    /* =====================================================
       GET ALL USERS BLOCKED BY CURRENT USER
       ===================================================== */

    async function getBlockedUsers(
        forceRefresh = false
    ) {

        const now =
            Date.now();

        if (
            !forceRefresh &&
            Array.isArray(
                blockedUsersCache.data
            ) &&
            (
                now -
                blockedUsersCache.time
            ) <
                BLOCK_CACHE_TIME
        ) {
            return blockedUsersCache.data;
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return [];
        }

        const currentUserId =
            normalizeId(
                currentUser.id
            );

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select(
                "id, blocker_id, blocked_id, created_at"
            )
            .eq(
                "blocker_id",
                currentUserId
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

        const result =
            Array.isArray(data)
                ? data
                : [];

        blockedUsersCache.data =
            result;

        blockedUsersCache.time =
            now;

        /*
         * نخزن معلومات كل مستخدم أيضاً.
         */

        result.forEach(
            function (item) {

                const id =
                    normalizeId(
                        item?.blocked_id
                    );

                if (!id) {
                    return;
                }

                blockInfoCache.set(
                    id,
                    {
                        ...item
                    }
                );

                blockStatusCache.set(
                    id,
                    {
                        blocked: true,
                        time: now
                    }
                );
            }
        );

        return result;
    }

    /* =====================================================
       GET BLOCK INFO
       ===================================================== */

    async function getBlockInfo(
        userId,
        forceRefresh = false
    ) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {
            return null;
        }

        if (!forceRefresh) {

            const cached =
                blockInfoCache.get(
                    targetId
                );

            if (cached) {
                return cached;
            }
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return null;
        }

        const currentUserId =
            normalizeId(
                currentUser.id
            );

        const {
            data,
            error
        } = await client
            .from("blocked_users")
            .select(
                "id, blocker_id, blocked_id, created_at"
            )
            .eq(
                "blocker_id",
                currentUserId
            )
            .eq(
                "blocked_id",
                targetId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "WFESC BLOCK: getBlockInfo error",
                error
            );

            return null;
        }

        const result =
            data || null;

        if (result) {

            blockInfoCache.set(
                targetId,
                result
            );

            blockStatusCache.set(
                targetId,
                {
                    blocked: true,
                    time: Date.now()
                }
            );
        }

        return result;
    }

    /* =====================================================
       GET COMPLETE BLOCKED USER RECORD
       ===================================================== */

    async function getBlockedUserInfo(
        userId,
        forceRefresh = false
    ) {

        const targetId =
            normalizeId(userId);

        if (!targetId) {
            return null;
        }

        const blockInfo =
            await getBlockInfo(
                targetId,
                forceRefresh
            );

        if (!blockInfo) {
            return null;
        }

        /*
         * نرجع معلومات الحظر بشكل موحد.
         * جلب الاسم والصورة واليوزر يتم لاحقاً من
         * conversations/core لأن profiles قد تختلف
         * حسب بنية المشروع الحالية.
         */

        return {
            id:
                blockInfo.id,

            user_id:
                targetId,

            blocked_id:
                targetId,

            blocker_id:
                blockInfo.blocker_id,

            created_at:
                blockInfo.created_at,

            blocked:
                true
        };
    }

    /* =====================================================
       CLEAR CACHE PUBLIC
       ===================================================== */

    function clearCache(userId) {

        if (userId) {
            clearBlockCache(
                userId
            );
        } else {
            clearAllBlockCache();
        }
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.WFESC_MESSAGES_BLOCK = {

        client,

        getCurrentUser,

        blockUser,

        unblockUser,

        isBlocked,

        isBlockedBy,

        getBlockStatus,

        getBlockedUsers,

        getBlockInfo,

        getBlockedUserInfo,

        clearCache,

        clearBlockCache

    };

    console.log(
        "WFESC BLOCK: module loaded"
    );

})();
