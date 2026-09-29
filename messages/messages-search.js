/* =========================================================
   WFESC MESSAGES SEARCH
   File: messages/messages-search.js

   Optimized:
   - Fast debounced search
   - Search messages across conversations
   - Search users
   - Result count
   - Newest -> oldest ordering
   - Open exact message
   - Search navigation inside conversation
   - Up = older result
   - Down = newer result
   - Green active frame
   - Shake animation on every navigation
   - Keeps search state after opening a result
   - Attempts to load older messages when needed
   - Avoids MutationObserver recursive work
   - Avoids repeated block requests
   - Uses parallel block checks
   - Uses DocumentFragment for faster rendering

   BLOCK INTEGRATION:
   - Detect users who blocked the current user
   - Hide blocked user's identity
   - Hide blocked user's avatar
   - Show "قام المستخدم بحظرك"
   - Prevent opening a blocked user's chat
   - Re-check block state before opening
   - Keep existing messages/history intact
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const SEARCH_DEBOUNCE_MS = 180;

    const OLDER_MESSAGES_MAX_ATTEMPTS = 30;

    const OLDER_MESSAGES_WAIT_MS = 60;


    /* =========================================================
       CORE
    ========================================================= */

    const CORE = () =>
        window.WFESC_MESSAGES_CORE || null;


    const BLOCK = () =>
        window.WFESC_MESSAGES_BLOCK || null;


    let searchMode = "messages";

    let currentSearchText = "";

    let searchRows = [];

    let conversationSearchRows = [];

    let currentResults = [];

    let currentMatchIndex = -1;

    let selectedSearchRowIndex = -1;

    let searchTimer = null;

    let searchRequestToken = 0;

    let navigationToken = 0;

    let pendingMessageId = null;

    let pendingMessageContent = "";

    let observerStarted = false;

    let initialized = false;

    let observerFrame = 0;


    /*
     * Cache حالة الحظر حتى لا نرسل طلبات Supabase
     * لكل عنصر بشكل متكرر.
     */
    const blockStatusCache = new Map();


    const els = {

        input: null,

        messagesButton: null,

        usersButton: null,

        results: null,

        matchNavigator: null,

        matchCount: null,

        matchUp: null,

        matchDown: null

    };


    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    function getCore() {

        return CORE();

    }


    function getBlock() {

        return BLOCK();

    }


    function getClient() {

        return (
            getCore()?.client ||
            getBlock()?.client ||
            window.WFESCSupabase ||
            (
                window.supabase &&
                typeof window.supabase.rpc === "function"
                    ? window.supabase
                    : null
            ) ||
            null
        );

    }


    function getCurrentUser() {

        try {

            return (
                getCore()?.getCurrentUser?.() ||
                null
            );

        } catch (error) {

            return null;

        }

    }


    function getCurrentUserId() {

        const user =
            getCurrentUser();


        if (!user) {

            return null;

        }


        return (
            user.id ||
            user.user_id ||
            user.userId ||
            null
        );

    }


    function getCurrentConversationId() {

        try {

            const value =
                getCore()?.getCurrentConversation?.();


            if (!value) {

                return null;

            }


            if (typeof value === "string") {

                return value;

            }


            if (typeof value === "object") {

                return (
                    value.conversation_id ||
                    value.id ||
                    value.currentConversationId ||
                    null
                );

            }


            return String(value);

        } catch (error) {

            return null;

        }

    }


    function escapeHTML(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    function escapeRegExp(value) {

        return String(value ?? "")
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

    }


    function highlightText(text, query) {

        const safeText =
            escapeHTML(text);


        if (!query) {

            return safeText;

        }


        const safeQuery =
            escapeRegExp(
                String(query).trim()
            );


        if (!safeQuery) {

            return safeText;

        }


        try {

            return safeText.replace(

                new RegExp(
                    `(${safeQuery})`,
                    "gi"
                ),

                '<mark class="wfesc-search-highlight">$1</mark>'

            );

        } catch (error) {

            return safeText;

        }

    }


    function getInitial(name) {

        const text =
            String(name || "").trim();


        if (!text) {

            return "م";

        }


        return text.charAt(0).toUpperCase();

    }


    function getDisplayName(user) {

        return (

            user?.display_name ||

            user?.displayName ||

            user?.full_name ||

            user?.fullName ||

            user?.name ||

            user?.username ||

            "مستخدم"

        );

    }


    function getUsername(user) {

        return (

            user?.username ||

            user?.user_name ||

            user?.userName ||

            ""

        );

    }


    function getAvatar(user) {

        return (

            user?.avatar_url ||

            user?.avatarUrl ||

            user?.avatar ||

            ""

        );

    }


    function getUserId(user) {

        return (

            user?.user_id ||

            user?.id ||

            user?.userId ||

            user?.sender_id ||

            user?.senderId ||

            null

        );

    }


    function getSenderId(row) {

        return (

            row?.sender_id ||

            row?.senderId ||

            row?.user_id ||

            row?.userId ||

            row?.author_id ||

            row?.authorId ||

            null

        );

    }


    function getPossibleOtherUserId(row) {

        const currentUserId =
            normalizeId(
                getCurrentUserId()
            );


        const candidates = [

            row?.other_user_id,

            row?.otherUserId,

            row?.contact_id,

            row?.contactId,

            row?.target_user_id,

            row?.targetUserId,

            row?.receiver_id,

            row?.receiverId,

            row?.recipient_id,

            row?.recipientId,

            row?.participant_id,

            row?.participantId

        ];


        for (
            const candidate of candidates
        ) {

            const id =
                normalizeId(candidate);


            if (
                id &&
                id !== currentUserId
            ) {

                return id;

            }

        }


        const senderId =
            normalizeId(
                getSenderId(row)
            );


        if (
            senderId &&
            senderId !== currentUserId
        ) {

            return senderId;

        }


        return null;

    }


    function isBlockedYou(user) {

        return (

            user?.blocked_you === true ||

            user?.blockedYou === true

        );

    }


    function normalizeId(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value);

    }


    function normalizeSearchText(value) {

        return String(value ?? "")
            .trim()
            .toLocaleLowerCase();

    }


    function getMessageId(row) {

        return (
            row?.message_id ||
            row?.id ||
            null
        );

    }


    function getConversationIdFromRow(row) {

        return (
            row?.conversation_id ||
            row?.conversationId ||
            null
        );

    }


    function getCreatedAt(row) {

        return (
            row?.created_at ||
            row?.createdAt ||
            0
        );

    }


    /* =========================================================
       BLOCK STATUS
    ========================================================= */

    async function getBlockStatus(
        userId,
        forceRefresh = false
    ) {

        const normalizedId =
            normalizeId(userId);


        if (!normalizedId) {

            return {

                blocked: false,

                blockedBy: false

            };

        }


        const currentUserId =
            normalizeId(
                getCurrentUserId()
            );


        /*
         * المستخدم الحالي لا يمكن أن يكون محظورًا من نفسه.
         */
        if (
            normalizedId === currentUserId
        ) {

            return {

                blocked: false,

                blockedBy: false

            };

        }


        if (
            !forceRefresh &&
            blockStatusCache.has(
                normalizedId
            )
        ) {

            return (
                blockStatusCache.get(
                    normalizedId
                )
            );

        }


        const block =
            getBlock();


        if (!block) {

            const fallback = {

                blocked: false,

                blockedBy: false

            };


            blockStatusCache.set(
                normalizedId,
                fallback
            );


            return fallback;

        }


        let blocked = false;

        let blockedBy = false;


        try {

            /*
             * تشغيل الفحصين بالتوازي بدل انتظار الأول ثم الثاني.
             */
            const checks =
                await Promise.all([

                    typeof block.isBlocked ===
                        "function"
                        ? block.isBlocked(
                            userId
                        )
                        : false,

                    typeof block.isBlockedBy ===
                        "function"
                        ? block.isBlockedBy(
                            userId
                        )
                        : false

                ]);


            blocked =
                !!checks[0];


            blockedBy =
                !!checks[1];

        } catch (error) {

            console.warn(
                "[WFESC SEARCH] block status failed:",
                error
            );

        }


        const status = {

            blocked,

            blockedBy

        };


        blockStatusCache.set(
            normalizedId,
            status
        );


        return status;

    }


    function clearBlockStatusCache() {

        blockStatusCache.clear();

    }


    function setupBlockStateListeners() {

        if (
            setupBlockStateListeners.started
        ) {

            return;

        }


        setupBlockStateListeners.started = true;


        const eventNames = [

            "wfesc:block-changed",

            "wfesc:user-blocked",

            "wfesc:user-unblocked",

            "wfesc:blocked",

            "wfesc:unblocked"

        ];


        function handler() {

            clearBlockStatusCache();

        }


        /*
         * بعض الملفات قد ترسل الحدث على window
         * وبعضها على document.
         */
        eventNames.forEach(
            function (eventName) {

                document.addEventListener(
                    eventName,
                    handler
                );


                window.addEventListener(
                    eventName,
                    handler
                );

            }
        );

    }


    setupBlockStateListeners.started = false;


    async function decorateUserBlockStatus(
        users
    ) {

        if (!Array.isArray(users)) {

            return [];

        }


        const result =
            await Promise.all(

                users.map(
                    async function (user) {

                        const userId =
                            getUserId(user);


                        const rpcBlocked =
                            isBlockedYou(user);


                        /*
                         * إذا الـRPC أكد مسبقًا أن المستخدم حاجبنا،
                         * لا داعي لفحص isBlockedBy مرة ثانية.
                         */
                        if (rpcBlocked) {

                            return {

                                user,

                                status: {

                                    blocked: false,

                                    blockedBy: true

                                }

                            };

                        }


                        if (!userId) {

                            return {

                                user,

                                status: {

                                    blocked: false,

                                    blockedBy: false

                                }

                            };

                        }


                        const status =
                            await getBlockStatus(
                                userId
                            );


                        return {

                            user,

                            status: {

                                blocked:
                                    !!status.blocked,

                                blockedBy:
                                    !!status.blockedBy

                            }

                        };

                    }
                )

            );


        return result;

    }


    async function decorateMessageBlockStatus(
        rows
    ) {

        if (!Array.isArray(rows)) {

            return [];

        }


        const ids = [];

        const seen =
            new Set();


        const currentUserId =
            normalizeId(
                getCurrentUserId()
            );


        rows.forEach(
            function (row) {

                const id =
                    normalizeId(
                        getPossibleOtherUserId(
                            row
                        )
                    );


                if (
                    !id ||
                    id === currentUserId ||
                    seen.has(id)
                ) {

                    return;

                }


                seen.add(id);

                ids.push(id);

            }
        );


        const statuses =
            new Map();


        /*
         * كل معرف مرة واحدة فقط + بالتوازي.
         */
        await Promise.all(

            ids.map(
                async function (id) {

                    const status =
                        await getBlockStatus(
                            id
                        );


                    statuses.set(
                        id,
                        status
                    );

                }
            )

        );


        return rows.map(
            function (row) {

                const targetUserId =
                    normalizeId(
                        getPossibleOtherUserId(
                            row
                        )
                    );


                const senderId =
                    normalizeId(
                        getSenderId(row)
                    );


                let status = {

                    blocked: false,

                    blockedBy: false

                };


                if (
                    targetUserId &&
                    targetUserId !== currentUserId
                ) {

                    status =
                        statuses.get(
                            targetUserId
                        ) || status;

                } else if (
                    senderId &&
                    senderId !== currentUserId
                ) {

                    status =
                        statuses.get(
                            senderId
                        ) || status;

                }


                /*
                 * بعض نتائج الـRPC قد تحتوي مباشرة على
                 * blocked_you / blockedYou.
                 */
                if (
                    row?.blocked_you === true ||
                    row?.blockedYou === true
                ) {

                    status = {

                        blocked:
                            !!status.blocked,

                        blockedBy: true

                    };

                }


                return {

                    ...row,

                    __wfescBlockStatus:
                        status

                };

            }
        );

    }


    /* =========================================================
       RESULT VISIBILITY
    ========================================================= */

    function showResultsContainer() {

        if (!els.results) {

            return;

        }


        els.results.classList.add(
            "visible"
        );

    }


    function hideResultsContainer() {

        if (!els.results) {

            return;

        }


        els.results.classList.remove(
            "visible"
        );

    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    function init() {

        if (initialized) {

            return;

        }


        initialized = true;


        els.input =
            document.getElementById(
                "messageSearch"
            );


        els.messagesButton =
            document.getElementById(
                "searchMessagesBtn"
            );


        els.usersButton =
            document.getElementById(
                "searchUsersBtn"
            );


        els.results =
            document.getElementById(
                "searchResults"
            );


        els.matchNavigator =
            document.getElementById(
                "searchMatchNavigator"
            );


        els.matchCount =
            document.getElementById(
                "searchMatchCount"
            );


        els.matchUp =
            document.getElementById(
                "searchMatchUp"
            );


        els.matchDown =
            document.getElementById(
                "searchMatchDown"
            );


        if (!els.input) {

            initialized = false;


            console.warn(
                "[WFESC SEARCH] messageSearch not found."
            );

            return;

        }


        setupStyles();

        setupMainSearch();

        setupMatchNavigator();

        setupConversationObserver();

        setupBlockStateListeners();

        updateModeButtons();

        updateMatchNavigator();


        console.log(
            "[WFESC SEARCH] initialized."
        );

    }


    /* =========================================================
       STYLES
    ========================================================= */

    function setupStyles() {

        if (
            document.getElementById(
                "wfescMessagesSearchStyle"
            )
        ) {

            return;

        }


        const style =
            document.createElement("style");


        style.id =
            "wfescMessagesSearchStyle";


        style.textContent = `

            .wfesc-search-highlight {

                background:#ffe600 !important;

                color:#000 !important;

                border-radius:4px;

                padding:0 2px;

            }


            .wfesc-user-search-result {

                position:relative;

                transition:
                    transform .18s ease,
                    background .18s ease,
                    border-color .18s ease;

                cursor:pointer;

                user-select:none !important;

                -webkit-user-select:none !important;

            }


            .wfesc-user-search-result.wfesc-blocked-you {

                cursor:not-allowed;

            }


            .wfesc-user-search-result.wfesc-blocked-by-me {

                cursor:not-allowed;

            }


            .wfesc-user-search-result.wfesc-blocked-you
            .wfesc-search-blocked-label {

                color:#ff3b30;

            }


            .wfesc-user-search-result.wfesc-blocked-by-me
            .wfesc-search-blocked-label {

                color:#ff9800;

            }


            .wfesc-user-search-result.wfesc-shake {

                animation:
                    wfescSearchBlockedShake
                    .42s
                    ease;

                background:
                    rgba(255,40,40,.14) !important;

                border-color:
                    #ff3030 !important;

            }


            @keyframes wfescSearchBlockedShake {

                0% {
                    transform:translateX(0);
                }

                20% {
                    transform:translateX(-7px);
                }

                40% {
                    transform:translateX(7px);
                }

                60% {
                    transform:translateX(-5px);
                }

                80% {
                    transform:translateX(5px);
                }

                100% {
                    transform:translateX(0);
                }

            }


            .wfesc-search-avatar {

                width:46px;

                height:46px;

                min-width:46px;

                border-radius:50%;

                object-fit:cover;

                display:block;

                background:#222;

            }


            .wfesc-search-avatar-fallback {

                width:46px;

                height:46px;

                min-width:46px;

                border-radius:50%;

                display:flex;

                align-items:center;

                justify-content:center;

                background:#202020;

                color:#fff;

                font-weight:700;

                font-size:18px;

            }


            .wfesc-search-avatar-blocked {

                width:46px;

                height:46px;

                min-width:46px;

                border-radius:50%;

                display:flex;

                align-items:center;

                justify-content:center;

                background:#351515;

                color:#ff3b30;

                border:1px solid rgba(255,59,48,.45);

                font-weight:900;

                font-size:18px;

            }


            .wfesc-search-user-row {

                display:flex;

                align-items:center;

                gap:12px;

                width:100%;

            }


            .wfesc-search-user-info {

                min-width:0;

                flex:1;

            }


            .wfesc-search-user-name {

                font-weight:700;

                color:#fff;

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

            }


            .wfesc-search-user-username {

                margin-top:3px;

                color:#999;

                font-size:13px;

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

            }


            .wfesc-search-blocked-label {

                margin-top:5px;

                font-size:12px;

                font-weight:700;

            }


            .wfesc-search-hidden-identity {

                color:#ff3b30 !important;

            }


            .wfesc-search-message-row {

                cursor:pointer;

                user-select:none !important;

                -webkit-user-select:none !important;

            }


            .wfesc-search-message-row.wfesc-message-blocked-user {

                cursor:not-allowed;

            }


            .wfesc-search-message-count {

                padding:10px 14px;

                color:#aaa;

                font-size:13px;

                text-align:right;

                border-bottom:1px solid rgba(255,255,255,.06);

            }


            .wfesc-search-result-preview {

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

            }


            .wfesc-search-empty {

                padding:20px;

                text-align:center;

                color:#888;

            }


            .wfesc-search-error {

                padding:20px;

                text-align:center;

                color:#ff5252;

            }


            .wfesc-search-loading {

                padding:20px;

                text-align:center;

                color:#aaa;

            }


            .wfesc-search-current-match {

                outline:
                    2px solid #00ff66 !important;

                outline-offset:3px !important;

                border-radius:10px !important;

                box-shadow:
                    0 0 0 2px rgba(0,255,102,.16),
                    0 0 18px rgba(0,255,102,.22) !important;

                animation:
                    wfescSearchMessageShake
                    .42s
                    ease;

            }


            @keyframes wfescSearchMessageShake {

                0% {
                    transform:translateX(0);
                }

                15% {
                    transform:translateX(-5px);
                }

                30% {
                    transform:translateX(5px);
                }

                45% {
                    transform:translateX(-4px);
                }

                60% {
                    transform:translateX(4px);
                }

                75% {
                    transform:translateX(-2px);
                }

                100% {
                    transform:translateX(0);
                }

            }


            #searchMatchNavigator {

                user-select:none !important;

                -webkit-user-select:none !important;

            }


            #searchMatchNavigator button {

                user-select:none !important;

                -webkit-user-select:none !important;

            }

        `;


        document.head.appendChild(style);

    }


    /* =========================================================
       MAIN SEARCH
    ========================================================= */

    function setupMainSearch() {

        if (els.messagesButton) {

            els.messagesButton.addEventListener(
                "click",
                function () {

                    searchMode =
                        "messages";

                    currentSearchText =
                        "";

                    resetSearchState();

                    updateModeButtons();


                    if (els.input) {

                        els.input.placeholder =
                            "ابحث في الرسائل...";

                        els.input.focus();

                    }

                }
            );

        }


        if (els.usersButton) {

            els.usersButton.addEventListener(
                "click",
                function () {

                    searchMode =
                        "users";

                    currentSearchText =
                        "";

                    resetSearchState();

                    updateModeButtons();


                    if (els.input) {

                        els.input.placeholder =
                            "ابحث عن مستخدم...";

                        els.input.focus();

                    }

                }
            );

        }


        els.input.addEventListener(
            "input",
            function () {

                const text =
                    String(
                        els.input.value || ""
                    ).trim();


                currentSearchText =
                    text;


                clearTimeout(
                    searchTimer
                );


                /*
                 * إلغاء نتيجة البحث السابقة منطقيًا فورًا.
                 */
                searchRequestToken++;


                if (!text) {

                    resetSearchState();

                    return;

                }


                searchTimer =
                    setTimeout(
                        function () {

                            performMainSearch(
                                text
                            );

                        },
                        SEARCH_DEBOUNCE_MS
                    );

            }
        );


        els.input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();


                    const text =
                        String(
                            els.input.value ||
                            ""
                        ).trim();


                    if (!text) {

                        return;

                    }


                    clearTimeout(
                        searchTimer
                    );


                    performMainSearch(
                        text
                    );

                }

            }
        );

    }


    function updateModeButtons() {

        if (els.messagesButton) {

            els.messagesButton.classList.toggle(
                "active",
                searchMode === "messages"
            );

        }


        if (els.usersButton) {

            els.usersButton.classList.toggle(
                "active",
                searchMode === "users"
            );

        }

    }


    async function performMainSearch(text) {

        const token =
            ++searchRequestToken;


        if (!els.results) {

            console.warn(
                "[WFESC SEARCH] searchResults not found."
            );

            return;

        }


        showResultsContainer();


        els.results.innerHTML =
            '<div class="wfesc-search-loading">جاري البحث...</div>';


        if (
            searchMode === "users"
        ) {

            await searchUsers(
                text,
                token
            );

        } else {

            await searchMessages(
                text,
                token
            );

        }

    }


    function resetSearchState() {

        navigationToken++;

        searchRows = [];

        conversationSearchRows = [];

        currentResults = [];

        currentMatchIndex = -1;

        selectedSearchRowIndex = -1;

        pendingMessageId = null;

        pendingMessageContent = "";

        updateMatchNavigator();

        clearSearchResults();

    }


    function clearSearchResults() {

        searchRows = [];

        conversationSearchRows = [];

        currentResults = [];

        currentMatchIndex = -1;

        selectedSearchRowIndex = -1;

        pendingMessageId = null;

        pendingMessageContent = "";

        if (els.results) {

            els.results.innerHTML = "";

            hideResultsContainer();

        }


        updateMatchNavigator();

    }


    function hideOnlySearchResults() {

        hideResultsContainer();

    }


    /* =========================================================
       USER SEARCH
    ========================================================= */

    async function searchUsers(
        text,
        token
    ) {

        const client =
            getClient();


        if (
            !client ||
            typeof client.rpc !== "function"
        ) {

            showSearchError(
                "تعذر الاتصال بقاعدة البيانات."
            );

            return;

        }


        try {

            const result =
                await client.rpc(
                    "search_users",
                    {
                        search_text:
                            text
                    }
                );


            if (
                token !==
                searchRequestToken
            ) {

                return;

            }


            if (result.error) {

                console.error(
                    "[WFESC SEARCH] user search error:",
                    result.error
                );


                showSearchError(
                    "حدث خطأ أثناء البحث عن المستخدمين."
                );

                return;

            }


            const users =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            const decoratedUsers =
                await decorateUserBlockStatus(
                    users
                );


            if (
                token !==
                searchRequestToken
            ) {

                return;

            }


            renderUserResults(
                decoratedUsers,
                text
            );

        } catch (error) {

            if (
                token !==
                searchRequestToken
            ) {

                return;

            }


            console.error(
                "[WFESC SEARCH] user search exception:",
                error
            );


            showSearchError(
                "حدث خطأ أثناء البحث عن المستخدمين."
            );

        }

    }


    function renderUserResults(
        users,
        text
    ) {

        if (!els.results) {

            return;

        }


        showResultsContainer();


        if (!users.length) {

            els.results.innerHTML =
                '<div class="wfesc-search-empty">لم يتم العثور على مستخدمين.</div>';

            return;

        }


        els.results.innerHTML =
            "";


        const fragment =
            document.createDocumentFragment();


        users.forEach(
            function (entry) {

                const user =
                    entry?.user || {};


                const status =
                    entry?.status || {

                        blocked: false,

                        blockedBy:
                            isBlockedYou(user)

                    };


                const blockedYou =
                    !!status.blockedBy;


                const blockedByMe =
                    !!status.blocked;


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "search-result wfesc-user-search-result" +

                    (
                        blockedYou
                            ? " wfesc-blocked-you"
                            : ""
                    ) +

                    (
                        blockedByMe
                            ? " wfesc-blocked-by-me"
                            : ""
                    );


                const userId =
                    getUserId(user);


                item.dataset.userId =
                    normalizeId(userId);


                /*
                 * المستخدم الذي حظرنا:
                 * نخفي الاسم + الصورة + username.
                 */
                if (blockedYou) {

                    item.innerHTML = `

                        <div
                            class="wfesc-search-user-row"
                        >

                            <div
                                class="wfesc-search-avatar-blocked"
                                aria-hidden="true"
                            >
                                !
                            </div>

                            <div
                                class="wfesc-search-user-info"
                            >

                                <div
                                    class="wfesc-search-user-name wfesc-search-hidden-identity"
                                >
                                    قام المستخدم بحظرك
                                </div>

                                <div
                                    class="wfesc-search-blocked-label"
                                >
                                    لا يمكنك بدء محادثة مع هذا المستخدم
                                </div>

                            </div>

                        </div>

                    `;

                } else {

                    const avatar =
                        getAvatar(user);


                    const name =
                        getDisplayName(user);


                    const username =
                        getUsername(user);


                    let avatarHTML =
                        "";


                    if (avatar) {

                        avatarHTML = `

                            <img
                                class="wfesc-search-avatar"
                                src="${escapeHTML(avatar)}"
                                alt=""
                                draggable="false"
                            >

                        `;

                    } else {

                        avatarHTML = `

                            <div
                                class="wfesc-search-avatar-fallback"
                            >
                                ${escapeHTML(
                                    getInitial(name)
                                )}
                            </div>

                        `;

                    }


                    let usernameHTML =
                        "";


                    if (username) {

                        usernameHTML = `

                            <div
                                class="wfesc-search-user-username"
                            >
                                @${highlightText(
                                    username,
                                    text
                                )}
                            </div>

                        `;

                    }


                    let blockedHTML =
                        "";


                    if (blockedByMe) {

                        blockedHTML = `

                            <div
                                class="wfesc-search-blocked-label"
                            >
                                قمت بحظر هذا المستخدم
                            </div>

                        `;

                    }


                    item.innerHTML = `

                        <div
                            class="wfesc-search-user-row"
                        >

                            ${avatarHTML}

                            <div
                                class="wfesc-search-user-info"
                            >

                                <div
                                    class="wfesc-search-user-name"
                                >
                                    ${highlightText(
                                        name,
                                        text
                                    )}
                                </div>

                                ${usernameHTML}

                                ${blockedHTML}

                            </div>

                        </div>

                    `;

                }


                item.addEventListener(
                    "click",
                    async function () {

                        if (blockedYou) {

                            shakeBlockedUser(
                                item
                            );

                            return;

                        }


                        if (blockedByMe) {

                            shakeBlockedUser(
                                item
                            );

                            return;

                        }


                        const latestStatus =
                            await getBlockStatus(
                                userId,
                                true
                            );


                        if (
                            latestStatus.blockedBy
                        ) {

                            replaceUserResultWithBlocked(
                                item
                            );


                            shakeBlockedUser(
                                item
                            );


                            return;

                        }


                        if (
                            latestStatus.blocked
                        ) {

                            shakeBlockedUser(
                                item
                            );

                            return;

                        }


                        openUserFromSearch(
                            user
                        );

                    }
                );


                item.addEventListener(
                    "dragstart",
                    function (event) {

                        event.preventDefault();

                    }
                );


                fragment.appendChild(
                    item
                );

            }
        );


        els.results.appendChild(
            fragment
        );

    }


    function replaceUserResultWithBlocked(
        item
    ) {

        if (!item) {

            return;

        }


        item.classList.add(
            "wfesc-blocked-you"
        );


        item.classList.remove(
            "wfesc-blocked-by-me"
        );


        item.innerHTML = `

            <div
                class="wfesc-search-user-row"
            >

                <div
                    class="wfesc-search-avatar-blocked"
                    aria-hidden="true"
                >
                    !
                </div>

                <div
                    class="wfesc-search-user-info"
                >

                    <div
                        class="wfesc-search-user-name wfesc-search-hidden-identity"
                    >
                        قام المستخدم بحظرك
                    </div>

                    <div
                        class="wfesc-search-blocked-label"
                    >
                        لا يمكنك بدء محادثة مع هذا المستخدم
                    </div>

                </div>

            </div>

        `;

    }


    function shakeBlockedUser(
        element
    ) {

        if (!element) {

            return;

        }


        element.classList.remove(
            "wfesc-shake"
        );


        void element.offsetWidth;


        element.classList.add(
            "wfesc-shake"
        );


        setTimeout(
            function () {

                element.classList.remove(
                    "wfesc-shake"
                );

            },
            500
        );

    }


    async function openUserFromSearch(
        user
    ) {

        const userId =
            getUserId(user);


        if (!userId) {

            return;

        }


        const status =
            await getBlockStatus(
                userId,
                true
            );


        if (
            status.blockedBy
        ) {

            showSearchError(
                "قام المستخدم بحظرك ولا يمكن بدء المحادثة."
            );

            return;

        }


        if (
            status.blocked
        ) {

            showSearchError(
                "قمت بحظر هذا المستخدم ولا يمكن بدء المحادثة."
            );

            return;

        }


        const client =
            getClient();


        if (
            !client ||
            typeof client.rpc !== "function"
        ) {

            return;

        }


        try {

            const rpcResult =
                await client.rpc(
                    "get_or_create_direct_conversation",
                    {
                        target_user_id:
                            userId
                    }
                );


            if (rpcResult.error) {

                console.error(
                    "[WFESC SEARCH] open user error:",
                    rpcResult.error
                );


                showSearchError(
                    "لا يمكن بدء المحادثة مع هذا المستخدم."
                );

                return;

            }


            const conversationId =
                extractConversationId(
                    rpcResult.data
                );


            if (!conversationId) {

                showSearchError(
                    "تعذر فتح المحادثة."
                );

                return;

            }


            /*
             * إعادة فحص واحدة فقط بعد RPC.
             */
            const afterRpcStatus =
                await getBlockStatus(
                    userId,
                    true
                );


            if (
                afterRpcStatus.blockedBy
            ) {

                showSearchError(
                    "قام المستخدم بحظرك ولا يمكن فتح المحادثة."
                );

                return;

            }


            const core =
                getCore();


            if (
                core &&
                typeof core.openConversation ===
                    "function"
            ) {

                const contact = {

                    user_id:
                        userId,

                    id:
                        userId,

                    username:
                        getUsername(user),

                    display_name:
                        getDisplayName(user),

                    avatar_url:
                        getAvatar(user)

                };


                await core.openConversation(

                    conversationId,

                    contact,

                    "direct"

                );


                hideOnlySearchResults();

                return;

            }


            document.dispatchEvent(
                new CustomEvent(
                    "wfesc:open-conversation",
                    {
                        detail: {

                            conversationId,

                            contact:
                                user

                        }
                    }
                )
            );

        } catch (error) {

            console.error(
                "[WFESC SEARCH] open user exception:",
                error
            );


            showSearchError(
                "حدث خطأ أثناء فتح المحادثة."
            );

        }

    }


    function extractConversationId(
        data
    ) {

        if (!data) {

            return null;

        }


        if (
            typeof data === "string"
        ) {

            return data;

        }


        if (
            Array.isArray(data)
        ) {

            if (!data.length) {

                return null;

            }


            return extractConversationId(
                data[0]
            );

        }


        if (
            typeof data === "object"
        ) {

            return (

                data.conversation_id ||

                data.id ||

                data.get_or_create_direct_conversation ||

                null

            );

        }


        return null;

    }


    /* =========================================================
       MESSAGE SEARCH
    ========================================================= */

    async function searchMessages(
        text,
        token
    ) {

        const client =
            getClient();


        if (
            !client ||
            typeof client.rpc !== "function"
        ) {

            showSearchError(
                "تعذر الاتصال بقاعدة البيانات."
            );

            return;

        }


        try {

            const result =
                await client.rpc(
                    "search_messages",
                    {
                        search_text:
                            text
                    }
                );


            if (
                token !==
                searchRequestToken
            ) {

                return;

            }


            if (result.error) {

                console.error(
                    "[WFESC SEARCH] message search error:",
                    result.error
                );


                showSearchError(
                    "حدث خطأ أثناء البحث في الرسائل."
                );

                return;

            }


            let rows =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            rows =
                rows.filter(
                    function (row) {

                        return (
                            !row.deleted_at &&
                            !row.deletedAt
                        );

                    }
                );


            /*
             * Newest -> oldest
             */
            rows.sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            getCreatedAt(a)
                        ).getTime();


                    const dateB =
                        new Date(
                            getCreatedAt(b)
                        ).getTime();


                    if (
                        dateA !== dateB
                    ) {

                        return dateB - dateA;

                    }


                    return normalizeId(
                        getMessageId(b)
                    ).localeCompare(
                        normalizeId(
                            getMessageId(a)
                        )
                    );

                }
            );


            rows =
                await decorateMessageBlockStatus(
                    rows
                );


            if (
                token !==
                searchRequestToken
            ) {

                return;

            }


            searchRows =
                rows;


            renderMessageResults(
                rows,
                text
            );

        } catch (error) {

            if (
                token !==
                searchRequestToken
            ) {

                return;

            }


            console.error(
                "[WFESC SEARCH] message search exception:",
                error
            );


            showSearchError(
                "حدث خطأ أثناء البحث في الرسائل."
            );

        }

    }


    function renderMessageResults(
        rows,
        text
    ) {

        if (!els.results) {

            return;

        }


        showResultsContainer();


        if (!rows.length) {

            els.results.innerHTML =
                '<div class="wfesc-search-empty">لم يتم العثور على رسائل مطابقة.</div>';

            return;

        }


        els.results.innerHTML =
            "";


        const count =
            document.createElement("div");


        count.className =
            "wfesc-search-message-count";


        count.textContent =
            `وُجدت ${rows.length} رسالة تحتوي على «${text}»`;


        els.results.appendChild(
            count
        );


        const fragment =
            document.createDocumentFragment();


        rows.forEach(
            function (row, index) {

                const item =
                    document.createElement(
                        "div"
                    );


                const blockStatus =
                    row?.__wfescBlockStatus || {

                        blocked: false,

                        blockedBy: false

                    };


                const blockedBy =
                    !!blockStatus.blockedBy;


                const blockedByMe =
                    !!blockStatus.blocked;


                /*
                 * إذا الطرف حاجبنا:
                 * يمنع فتح المحادثة من خارج المحادثة.
                 *
                 * إذا نحن حاجبين الطرف:
                 * يبقى البحث في السجل مسموحًا لأن السجل موجود.
                 */
                item.className =
                    "search-result wfesc-search-message-row" +

                    (
                        blockedBy
                            ? " wfesc-message-blocked-user"
                            : ""
                    );


                const content =

                    row.content ||

                    row.message ||

                    row.message_content ||

                    row.text ||

                    "";


                const conversationId =
                    getConversationIdFromRow(
                        row
                    );


                const messageId =
                    getMessageId(
                        row
                    );


                const createdAt =
                    getCreatedAt(
                        row
                    );


                let senderName =

                    row.display_name ||

                    row.displayName ||

                    row.sender_name ||

                    row.senderName ||

                    row.username ||

                    "مستخدم";


                let avatar =
                    getAvatar(row);


                /*
                 * نخفي هوية من حظرنا.
                 */
                if (blockedBy) {

                    senderName =
                        "قام المستخدم بحظرك";

                    avatar =
                        "";

                }


                let avatarHTML =
                    "";


                if (blockedBy) {

                    avatarHTML = `

                        <div
                            class="wfesc-search-avatar-blocked"
                            aria-hidden="true"
                        >
                            !
                        </div>

                    `;

                } else if (avatar) {

                    avatarHTML = `

                        <img
                            class="wfesc-search-avatar"
                            src="${escapeHTML(avatar)}"
                            alt=""
                            draggable="false"
                        >

                    `;

                } else {

                    avatarHTML = `

                        <div
                            class="wfesc-search-avatar-fallback"
                        >
                            ${escapeHTML(
                                getInitial(senderName)
                            )}
                        </div>

                    `;

                }


                let blockedLabel =
                    "";


                if (blockedBy) {

                    blockedLabel = `

                        <div
                            class="wfesc-search-blocked-label"
                            style="color:#ff3b30;"
                        >
                            قام المستخدم بحظرك
                        </div>

                    `;

                } else if (blockedByMe) {

                    blockedLabel = `

                        <div
                            class="wfesc-search-blocked-label"
                            style="color:#ff9800;"
                        >
                            قمت بحظر هذا المستخدم
                        </div>

                    `;

                }


                item.innerHTML = `

                    <div
                        class="wfesc-search-user-row"
                    >

                        ${avatarHTML}

                        <div
                            class="result-info wfesc-search-user-info"
                        >

                            <div
                                class="result-name wfesc-search-user-name ${
                                    blockedBy
                                        ? "wfesc-search-hidden-identity"
                                        : ""
                                }"
                            >
                                ${escapeHTML(
                                    senderName
                                )}
                            </div>

                            ${blockedLabel}

                            <div
                                class="result-preview wfesc-search-result-preview"
                            >
                                ${highlightText(
                                    content,
                                    text
                                )}
                            </div>

                            ${
                                createdAt
                                    ? `

                                        <div
                                            class="result-username"
                                        >
                                            ${escapeHTML(
                                                formatDate(
                                                    createdAt
                                                )
                                            )}
                                        </div>

                                      `
                                    : ""
                            }

                        </div>

                    </div>

                `;


                item.dataset.resultIndex =
                    String(index);


                item.dataset.messageId =
                    normalizeId(
                        messageId
                    );


                item.dataset.conversationId =
                    normalizeId(
                        conversationId
                    );


                item.addEventListener(
                    "click",
                    async function () {

                        selectedSearchRowIndex =
                            index;


                        await openMessageSearchResult(
                            {

                                conversationId,

                                messageId,

                                content,

                                row,

                                searchIndex:
                                    index

                            }
                        );

                    }
                );


                item.addEventListener(
                    "dragstart",
                    function (event) {

                        event.preventDefault();

                    }
                );


                fragment.appendChild(
                    item
                );

            }
        );


        els.results.appendChild(
            fragment
        );

    }


    /* =========================================================
       OPEN SEARCH RESULT
    ========================================================= */

    async function openMessageSearchResult(
        result
    ) {

        if (!result) {

            return;

        }


        const conversationId =
            result.conversationId;


        if (!conversationId) {

            return;

        }


        currentSearchText =
            currentSearchText ||
            String(
                els.input?.value || ""
            ).trim();


        pendingMessageId =
            result.messageId ||
            null;


        pendingMessageContent =
            result.content ||
            "";


        const currentConversationId =
            getCurrentConversationId();


        /*
         * المحادثة مفتوحة أصلًا:
         * نسمح بالتنقل حتى لو كان هناك حظر.
         */
        if (

            currentConversationId &&

            normalizeId(
                conversationId
            ) ===
            normalizeId(
                currentConversationId
            )

        ) {

            prepareConversationSearchNavigation(
                conversationId,
                result.messageId,
                result.content
            );


            hideOnlySearchResults();


            await navigateToSelectedSearchResult();


            return;

        }


        let targetUserId =
            getPossibleOtherUserId(
                result.row
            );


        const core =
            getCore();


        let knownConversation =
            null;


        if (
            core &&
            typeof core.getConversations ===
                "function"
        ) {

            try {

                const conversations =
                    core.getConversations?.() ||
                    [];


                if (
                    Array.isArray(
                        conversations
                    )
                ) {

                    knownConversation =
                        conversations.find(
                            function (item) {

                                return (

                                    normalizeId(
                                        item?.conversation_id
                                    ) ===
                                    normalizeId(
                                        conversationId
                                    ) ||

                                    normalizeId(
                                        item?.id
                                    ) ===
                                    normalizeId(
                                        conversationId
                                    )

                                );

                            }
                        ) || null;

                }

            } catch (error) {

                knownConversation = null;

            }

        }


        let contact =
            knownConversation?.contact ||

            knownConversation?.other_user ||

            knownConversation?.user ||

            null;


        if (!targetUserId && contact) {

            targetUserId =
                getUserId(contact);

        }


        /*
         * إذا كنا نعرف الطرف وفعلًا هو حاجبنا:
         * نمنع فتح المحادثة.
         *
         * blockedByMe لا يمنع فتح السجل الحالي
         * لأن المستخدم يستطيع رؤية تاريخه القديم.
         */
        if (targetUserId) {

            const blockStatus =
                await getBlockStatus(
                    targetUserId,
                    true
                );


            if (
                blockStatus.blockedBy
            ) {

                showSearchError(
                    "قام المستخدم بحظرك ولا يمكن فتح هذه المحادثة."
                );

                return;

            }

        }


        if (

            !core ||

            typeof core.openConversation !==
                "function"

        ) {

            document.dispatchEvent(

                new CustomEvent(
                    "wfesc:search-message-open",
                    {
                        detail: result
                    }
                )

            );

            return;

        }


        try {

            /*
             * إذا لم تكن جهة الاتصال معروفة،
             * نحاول جلبها من Core.
             */
            if (
                !contact &&
                typeof core.getConversationContact ===
                    "function"
            ) {

                try {

                    contact =
                        await core.getConversationContact(
                            conversationId
                        );

                } catch (contactError) {

                    /*
                     * لا نخلي فشل جهة الاتصال يوقف البحث
                     * أو يخرب ترتيب النتائج.
                     */
                    console.warn(
                        "[WFESC SEARCH] contact lookup failed:",
                        contactError
                    );

                }

            }


            if (!targetUserId && contact) {

                targetUserId =
                    getUserId(contact);

            }


            /*
             * إعادة فحص واحدة بعد معرفة جهة الاتصال.
             */
            if (targetUserId) {

                const finalBlockStatus =
                    await getBlockStatus(
                        targetUserId,
                        true
                    );


                if (
                    finalBlockStatus.blockedBy
                ) {

                    showSearchError(
                        "قام المستخدم بحظرك ولا يمكن فتح هذه المحادثة."
                    );

                    return;

                }

            }


            await core.openConversation(

                conversationId,

                contact,

                knownConversation?.type ||
                    "direct"

            );


            hideOnlySearchResults();


            prepareConversationSearchNavigation(
                conversationId,
                result.messageId,
                result.content
            );


            await waitForChatRender();


            await navigateToSelectedSearchResult();

        } catch (error) {

            console.error(
                "[WFESC SEARCH] open message conversation error:",
                error
            );


            showSearchError(
                "تعذر فتح المحادثة للوصول إلى الرسالة."
            );

        }

    }


    /* =========================================================
       SEARCH NAVIGATION STATE
    ========================================================= */

    function prepareConversationSearchNavigation(
        conversationId,
        selectedMessageId,
        selectedContent
    ) {

        const targetConversation =
            normalizeId(
                conversationId
            );


        /*
         * searchRows أصلًا مرتبة من الأحدث إلى الأقدم،
         * لذلك لا نعيد الفرز هنا.
         */
        conversationSearchRows =
            searchRows.filter(
                function (row) {

                    return (
                        normalizeId(
                            getConversationIdFromRow(
                                row
                            )
                        ) ===
                        targetConversation
                    );

                }
            );


        let selectedIndex =
            conversationSearchRows.findIndex(
                function (row) {

                    const rowId =
                        getMessageId(
                            row
                        );


                    return (
                        selectedMessageId &&
                        normalizeId(
                            rowId
                        ) ===
                        normalizeId(
                            selectedMessageId
                        )
                    );

                }
            );


        if (
            selectedIndex < 0 &&
            selectedContent
        ) {

            const wanted =
                String(
                    selectedContent || ""
                ).trim();


            if (wanted) {

                selectedIndex =
                    conversationSearchRows.findIndex(
                        function (row) {

                            return (
                                String(
                                    row?.content ||
                                    row?.message ||
                                    row?.message_content ||
                                    row?.text ||
                                    ""
                                ).trim() === wanted
                            );

                        }
                    );

            }

        }


        if (
            selectedIndex < 0
        ) {

            selectedIndex = 0;

        }


        currentMatchIndex =
            selectedIndex;


        currentResults = [];


        pendingMessageId =
            selectedMessageId ||
            getMessageId(
                conversationSearchRows[
                    selectedIndex
                ]
            ) ||
            null;


        pendingMessageContent =
            selectedContent ||
            conversationSearchRows[
                selectedIndex
            ]?.content ||
            conversationSearchRows[
                selectedIndex
            ]?.message ||
            conversationSearchRows[
                selectedIndex
            ]?.message_content ||
            "";


        updateMatchNavigator();

    }


    function getCurrentConversationSearchRow() {

        if (
            !conversationSearchRows.length
        ) {

            return null;

        }


        if (
            currentMatchIndex < 0
        ) {

            currentMatchIndex = 0;

        }


        if (
            currentMatchIndex >=
            conversationSearchRows.length
        ) {

            currentMatchIndex =
                conversationSearchRows.length - 1;

        }


        return (
            conversationSearchRows[
                currentMatchIndex
            ] || null
        );

    }


    /* =========================================================
       CONVERSATION OBSERVER
    ========================================================= */

    function setupConversationObserver() {

        if (observerStarted) {

            return;

        }


        observerStarted = true;


        document.addEventListener(
            "wfesc:chat-opened",
            function () {

                refreshConversationSearchContext();

            }
        );


        document.addEventListener(
            "wfesc:chat-header-refresh",
            function () {

                refreshConversationSearchContext();

            }
        );


        document.addEventListener(
            "wfesc:messages-rendered",
            function () {

                refreshConversationSearchContext();

            }
        );


        const chatMessages =
            document.getElementById(
                "chatMessages"
            );


        if (!chatMessages) {

            return;

        }


        /*
         * مهم:
         * لا نستخدم subtree:true حتى لا نراقب العلامات
         * التي يضيفها البحث لنفسه وندخل في حلقة إعادة معالجة.
         */
        const observer =
            new MutationObserver(
                function (mutations) {

                    if (
                        !currentSearchText ||
                        searchMode !== "messages"
                    ) {

                        return;

                    }


                    let hasDirectChildChanges =
                        false;


                    for (
                        const mutation of mutations
                    ) {

                        if (
                            mutation.type ===
                                "childList"
                        ) {

                            hasDirectChildChanges =
                                true;

                            break;

                        }

                    }


                    if (
                        !hasDirectChildChanges
                    ) {

                        return;

                    }


                    cancelAnimationFrame(
                        observerFrame
                    );


                    observerFrame =
                        requestAnimationFrame(
                            function () {

                                applyCurrentConversationSearch(
                                    currentSearchText,
                                    false
                                );

                            }
                        );

                }
            );


        observer.observe(
            chatMessages,
            {
                childList: true,
                subtree: false
            }
        );

    }


    function refreshConversationSearchContext() {

        if (!currentSearchText) {

            updateMatchNavigator();

            return;

        }


        if (
            searchMode !==
            "messages"
        ) {

            updateMatchNavigator();

            return;

        }


        const conversationId =
            getCurrentConversationId();


        if (!conversationId) {

            updateMatchNavigator();

            return;

        }


        if (searchRows.length) {

            const target =
                normalizeId(
                    conversationId
                );


            /*
             * searchRows مرتبة مسبقًا، لذلك لا نعيد sort.
             */
            conversationSearchRows =
                searchRows.filter(
                    function (row) {

                        return (
                            normalizeId(
                                getConversationIdFromRow(
                                    row
                                )
                            ) ===
                            target
                        );

                    }
                );

        }


        applyCurrentConversationSearch(
            currentSearchText,
            false
        );


        if (pendingMessageId) {

            setTimeout(
                function () {

                    navigateToSelectedSearchResult();

                },
                50
            );

        }

    }


    function refreshCurrentConversationMatches() {

        refreshConversationSearchContext();

    }


    /* =========================================================
       APPLY SEARCH INSIDE CURRENT CHAT
    ========================================================= */

    function applyCurrentConversationSearch(
        text,
        animateCurrent
    ) {

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (!container) {

            currentResults = [];

            updateMatchNavigator();

            return;

        }


        removeSearchMarks(
            container
        );


        const normalizedText =
            normalizeSearchText(text);


        if (!normalizedText) {

            currentResults = [];

            updateMatchNavigator();

            return;

        }


        const bubbles =
            Array.from(
                container.querySelectorAll(
                    ".message-bubble"
                )
            );


        const matches = [];


        bubbles.forEach(
            function (bubble) {

                const content =
                    bubble.querySelector(
                        ".message-content"
                    );


                const target =
                    content ||
                    bubble;


                const rawText =
                    target.textContent || "";


                if (
                    normalizeSearchText(
                        rawText
                    ).includes(
                        normalizedText
                    )
                ) {

                    highlightElementText(
                        target,
                        String(text)
                    );


                    matches.push(
                        bubble
                    );

                }

            }
        );


        if (!matches.length) {

            const contents =
                Array.from(
                    container.querySelectorAll(
                        ".message-content"
                    )
                );


            contents.forEach(
                function (content) {

                    const rawText =
                        content.textContent || "";


                    if (
                        normalizeSearchText(
                            rawText
                        ).includes(
                            normalizedText
                        )
                    ) {

                        highlightElementText(
                            content,
                            String(text)
                        );


                        const bubble =
                            content.closest(
                                ".message-bubble"
                            ) ||
                            content;


                        if (
                            !matches.includes(
                                bubble
                            )
                        ) {

                            matches.push(
                                bubble
                            );

                        }

                    }

                }
            );

        }


        currentResults =
            matches;


        if (
            conversationSearchRows.length
        ) {

            const targetRow =
                getCurrentConversationSearchRow();


            if (targetRow) {

                const targetId =
                    getMessageId(
                        targetRow
                    );


                const targetContent =
                    targetRow.content ||
                    targetRow.message ||
                    targetRow.message_content ||
                    targetRow.text ||
                    "";


                const targetElement =
                    findMessageElement(
                        targetId,
                        targetContent
                    );


                if (
                    targetElement &&
                    animateCurrent !== false
                ) {

                    animateSearchTarget(
                        targetElement
                    );

                }

            }

        }


        updateMatchNavigator();

    }


    function removeSearchMarks(
        container
    ) {

        const oldMarks =
            container.querySelectorAll(
                ".wfesc-search-highlight"
            );


        oldMarks.forEach(
            function (mark) {

                const parent =
                    mark.parentNode;


                if (!parent) {

                    return;

                }


                parent.replaceChild(

                    document.createTextNode(
                        mark.textContent || ""
                    ),

                    mark

                );


                parent.normalize();

            }
        );

    }


    function highlightElementText(
        element,
        query
    ) {

        if (
            !element ||
            !query
        ) {

            return;

        }


        const queryText =
            String(query);


        const lowerQuery =
            queryText.toLocaleLowerCase();


        if (!lowerQuery) {

            return;

        }


        const walker =
            document.createTreeWalker(

                element,

                NodeFilter.SHOW_TEXT,

                {

                    acceptNode:
                        function (node) {

                            if (
                                !node.nodeValue ||
                                !node.nodeValue.trim()
                            ) {

                                return NodeFilter.FILTER_REJECT;

                            }


                            if (
                                node.parentElement &&
                                node.parentElement.closest(
                                    ".wfesc-search-highlight"
                                )
                            ) {

                                return NodeFilter.FILTER_REJECT;

                            }


                            return NodeFilter.FILTER_ACCEPT;

                        }

                }

            );


        const nodes = [];


        let node;


        while (
            (node = walker.nextNode())
        ) {

            nodes.push(node);

        }


        nodes.forEach(
            function (textNode) {

                const value =
                    textNode.nodeValue || "";


                const lowerValue =
                    value.toLocaleLowerCase();


                if (
                    !lowerValue.includes(
                        lowerQuery
                    )
                ) {

                    return;

                }


                const fragment =
                    document.createDocumentFragment();


                let remaining =
                    value;


                while (
                    remaining.length
                ) {

                    const lowerRemaining =
                        remaining.toLocaleLowerCase();


                    const index =
                        lowerRemaining.indexOf(
                            lowerQuery
                        );


                    if (
                        index === -1
                    ) {

                        fragment.appendChild(

                            document.createTextNode(
                                remaining
                            )

                        );

                        break;

                    }


                    if (
                        index > 0
                    ) {

                        fragment.appendChild(

                            document.createTextNode(
                                remaining.slice(
                                    0,
                                    index
                                )
                            )

                        );

                    }


                    const mark =
                        document.createElement(
                            "mark"
                        );


                    mark.className =
                        "wfesc-search-highlight";


                    mark.textContent =
                        remaining.slice(

                            index,

                            index +
                                queryText.length

                        );


                    fragment.appendChild(
                        mark
                    );


                    remaining =
                        remaining.slice(

                            index +
                                queryText.length

                        );

                }


                if (
                    textNode.parentNode
                ) {

                    textNode.parentNode.replaceChild(

                        fragment,

                        textNode

                    );

                }

            }
        );

    }


    /* =========================================================
       NAVIGATOR
    ========================================================= */

    function setupMatchNavigator() {

        if (els.matchUp) {

            els.matchUp.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    moveMatch(1);

                }
            );

        }


        if (els.matchDown) {

            els.matchDown.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    moveMatch(-1);

                }
            );

        }

    }


    async function moveMatch(
        direction
    ) {

        if (
            !conversationSearchRows.length
        ) {

            return;

        }


        const nextIndex =
            currentMatchIndex +
            direction;


        if (
            nextIndex < 0 ||
            nextIndex >=
                conversationSearchRows.length
        ) {

            return;

        }


        currentMatchIndex =
            nextIndex;


        const token =
            ++navigationToken;


        const row =
            getCurrentConversationSearchRow();


        if (!row) {

            return;

        }


        pendingMessageId =
            getMessageId(
                row
            );


        pendingMessageContent =
            row.content ||
            row.message ||
            row.message_content ||
            row.text ||
            "";


        updateMatchNavigator();


        await ensureMessageVisible(
            pendingMessageId,
            pendingMessageContent,
            token
        );


        if (
            token !==
            navigationToken
        ) {

            return;

        }


        const target =
            findMessageElement(
                pendingMessageId,
                pendingMessageContent
            );


        if (!target) {

            return;

        }


        animateSearchTarget(
            target
        );

    }


    function updateMatchNavigator() {

        if (
            !els.matchNavigator
        ) {

            return;

        }


        const total =
            conversationSearchRows.length;


        if (els.matchCount) {

            if (!total) {

                els.matchCount.textContent =
                    "0 / 0";

            } else {

                const safeIndex =
                    Math.max(
                        0,
                        Math.min(
                            currentMatchIndex,
                            total - 1
                        )
                    );


                els.matchCount.textContent =
                    `${safeIndex + 1} / ${total}`;

            }

        }


        els.matchNavigator.style.display =
            total > 0
                ? "flex"
                : "none";


        /*
         * index 0 = الأحدث
         * index الأعلى = الأقدم
         *
         * Up (+1) = أقدم
         * Down (-1) = أحدث
         */
        if (els.matchUp) {

            els.matchUp.disabled =
                total === 0 ||
                currentMatchIndex >=
                    total - 1;

        }


        if (els.matchDown) {

            els.matchDown.disabled =
                total === 0 ||
                currentMatchIndex <= 0;

        }

    }


    /* =========================================================
       NAVIGATION TARGET
    ========================================================= */

    async function navigateToSelectedSearchResult() {

        if (
            !conversationSearchRows.length
        ) {

            if (
                pendingMessageId ||
                pendingMessageContent
            ) {

                const token =
                    ++navigationToken;


                await ensureMessageVisible(
                    pendingMessageId,
                    pendingMessageContent,
                    token
                );


                if (
                    token !==
                    navigationToken
                ) {

                    return;

                }


                const target =
                    findMessageElement(
                        pendingMessageId,
                        pendingMessageContent
                    );


                if (target) {

                    animateSearchTarget(
                        target
                    );

                }

            }

            return;

        }


        const row =
            getCurrentConversationSearchRow();


        if (!row) {

            return;

        }


        pendingMessageId =
            getMessageId(
                row
            ) ||
            pendingMessageId;


        pendingMessageContent =
            row.content ||
            row.message ||
            row.message_content ||
            row.text ||
            pendingMessageContent;


        const token =
            ++navigationToken;


        await ensureMessageVisible(
            pendingMessageId,
            pendingMessageContent,
            token
        );


        if (
            token !==
            navigationToken
        ) {

            return;

        }


        const target =
            findMessageElement(
                pendingMessageId,
                pendingMessageContent
            );


        if (target) {

            animateSearchTarget(
                target
            );

        }


        updateMatchNavigator();

    }


    async function ensureMessageVisible(
        messageId,
        content,
        token
    ) {

        let target =
            findMessageElement(
                messageId,
                content
            );


        if (target) {

            return target;

        }


        const core =
            getCore();


        if (
            !core ||
            typeof core.loadOlderMessages !==
                "function"
        ) {

            return null;

        }


        let previousCount =
            getRenderedMessageCount();


        for (
            let attempt = 0;
            attempt <
                OLDER_MESSAGES_MAX_ATTEMPTS;
            attempt++
        ) {

            if (
                token !==
                navigationToken
            ) {

                return null;

            }


            target =
                findMessageElement(
                    messageId,
                    content
                );


            if (target) {

                return target;

            }


            try {

                const result =
                    await core.loadOlderMessages();


                await wait(
                    OLDER_MESSAGES_WAIT_MS
                );


                target =
                    findMessageElement(
                        messageId,
                        content
                    );


                if (target) {

                    return target;

                }


                const afterCount =
                    getRenderedMessageCount();


                /*
                 * لا يوجد أي تقدم:
                 * نوقف المحاولة بدل إهدار الوقت.
                 */
                if (
                    result === false &&
                    afterCount <= previousCount
                ) {

                    break;

                }


                if (
                    afterCount <= previousCount &&
                    result == null
                ) {

                    break;

                }


                if (
                    afterCount <= previousCount
                ) {

                    break;

                }


                previousCount =
                    afterCount;

            } catch (error) {

                console.warn(
                    "[WFESC SEARCH] older messages load failed:",
                    error
                );


                break;

            }

        }


        return findMessageElement(
            messageId,
            content
        );

    }


    function getRenderedMessageCount() {

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (!container) {

            return 0;

        }


        const bubbles =
            container.querySelectorAll(
                ".message-bubble"
            );


        if (bubbles.length) {

            return bubbles.length;

        }


        return container.children.length;

    }


    function findMessageElement(
        messageId,
        content
    ) {

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (!container) {

            return null;

        }


        let target =
            null;


        if (messageId) {

            const normalizedId =
                String(messageId);


            const elements =
                container.querySelectorAll(
                    "[data-message-id],[data-id]"
                );


            for (
                const element of elements
            ) {

                if (
                    normalizeId(
                        element.dataset?.messageId
                    ) ===
                    normalizedId ||
                    normalizeId(
                        element.dataset?.id
                    ) ===
                    normalizedId
                ) {

                    target =
                        element;

                    break;

                }

            }


            if (!target) {

                const legacyId =
                    `message-${normalizedId}`;


                try {

                    target =
                        container.querySelector(
                            `#${escapeCSS(
                                legacyId
                            )}`
                        );

                } catch (error) {

                    target = null;

                }

            }

        }


        if (
            !target &&
            content
        ) {

            const wanted =
                String(content)
                    .trim()
                    .toLocaleLowerCase();


            if (!wanted) {

                return null;

            }


            const bubbles =
                container.querySelectorAll(
                    ".message-bubble"
                );


            for (
                const bubble
                of bubbles
            ) {

                const value =
                    String(
                        bubble.textContent ||
                        ""
                    )
                        .trim()
                        .toLocaleLowerCase();


                if (
                    value === wanted ||
                    value.includes(wanted)
                ) {

                    target =
                        bubble;

                    break;

                }

            }


            if (!target) {

                const contents =
                    container.querySelectorAll(
                        ".message-content"
                    );


                for (
                    const contentElement
                    of contents
                ) {

                    const value =
                        String(
                            contentElement.textContent ||
                            ""
                        )
                            .trim()
                            .toLocaleLowerCase();


                    if (
                        value === wanted ||
                        value.includes(wanted)
                    ) {

                        target =
                            contentElement.closest(
                                ".message-bubble"
                            ) ||
                            contentElement;

                        break;

                    }

                }

            }

        }


        return target;

    }


    function escapeCSS(value) {

        const text =
            String(value ?? "");


        if (
            typeof CSS !== "undefined" &&
            typeof CSS.escape === "function"
        ) {

            return CSS.escape(text);

        }


        return text.replace(
            /([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
            "\\$1"
        );

    }


    function animateSearchTarget(
        target
    ) {

        if (!target) {

            return;

        }


        const container =
            document.getElementById(
                "chatMessages"
            );


        if (container) {

            container
                .querySelectorAll(
                    ".wfesc-search-current-match"
                )
                .forEach(
                    function (element) {

                        element.classList.remove(
                            "wfesc-search-current-match"
                        );

                    }
                );

        }


        target.classList.remove(
            "wfesc-search-current-match"
        );


        void target.offsetWidth;


        target.classList.add(
            "wfesc-search-current-match"
        );


        try {

            target.scrollIntoView(
                {
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest"
                }
            );

        } catch (error) {

            try {

                target.scrollIntoView();

            } catch (scrollError) {}

        }

    }


    /* =========================================================
       LEGACY SCROLL FUNCTION
    ========================================================= */

    async function scrollToMessage(
        messageId,
        content
    ) {

        const token =
            ++navigationToken;


        const target =
            await ensureMessageVisible(
                messageId,
                content,
                token
            );


        if (!target) {

            return;

        }


        animateSearchTarget(
            target
        );

    }


    /* =========================================================
       WAIT HELPERS
    ========================================================= */

    function wait(
        milliseconds
    ) {

        return new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    milliseconds
                );

            }
        );

    }


    async function waitForChatRender() {

        const maxAttempts = 25;


        for (
            let i = 0;
            i < maxAttempts;
            i++
        ) {

            const container =
                document.getElementById(
                    "chatMessages"
                );


            if (
                container &&
                (
                    container.children.length ||
                    container.querySelector(
                        ".message-bubble"
                    )
                )
            ) {

                return;

            }


            await wait(60);

        }

    }


    /* =========================================================
       ERROR
    ========================================================= */

    function showSearchError(
        message
    ) {

        if (!els.results) {

            return;

        }


        showResultsContainer();


        els.results.innerHTML = `

            <div
                class="wfesc-search-error"
            >
                ${escapeHTML(message)}
            </div>

        `;

    }


    /* =========================================================
       DATE
    ========================================================= */

    function formatDate(
        value
    ) {

        if (!value) {

            return "";

        }


        try {

            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "";

            }


            return date.toLocaleString(
                "ar-IQ",
                {
                    dateStyle: "short",
                    timeStyle: "short"
                }
            );

        } catch (error) {

            return "";

        }

    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.WFESC_MESSAGES_SEARCH = {

        init,

        searchUsers,

        searchMessages,

        clearSearchResults,

        getCurrentSearchText() {

            return currentSearchText;

        },

        getSearchMode() {

            return searchMode;

        },

        refreshCurrentConversationMatches,

        moveMatch,

        scrollToMessage,

        getSearchResults() {

            return searchRows.slice();

        },

        getConversationSearchResults() {

            return conversationSearchRows.slice();

        },

        clearBlockStatusCache

    };


    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }


})();
