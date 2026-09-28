/* =========================================================
   WFESC MESSAGES SEARCH
   File: messages/messages-search.js
   ========================================================= */

(function () {
    "use strict";

    const CORE = () => window.WFESC_MESSAGES_CORE || null;

    let searchMode = "messages";
    let currentSearchText = "";
    let currentResults = [];
    let currentMatchIndex = -1;

    let searchTimer = null;
    let searchRequestToken = 0;

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

    function getClient() {
        return getCore()?.client || window.WFESCSupabase || null;
    }

    function getCurrentUser() {
        try {
            return getCore()?.getCurrentUser?.() || null;
        } catch (error) {
            return null;
        }
    }

    function getCurrentConversationId() {
        try {
            const value = getCore()?.getCurrentConversation?.();

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
        return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlightText(text, query) {
        const safeText = escapeHTML(text);

        if (!query) {
            return safeText;
        }

        const safeQuery = escapeRegExp(query.trim());

        if (!safeQuery) {
            return safeText;
        }

        try {
            return safeText.replace(
                new RegExp(`(${safeQuery})`, "gi"),
                '<mark class="wfesc-search-highlight">$1</mark>'
            );
        } catch (error) {
            return safeText;
        }
    }

    function getInitial(name) {
        const text = String(name || "").trim();

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
            null
        );
    }

    function isBlockedYou(user) {
        return (
            user?.blocked_you === true ||
            user?.blockedYou === true
        );
    }

    /* =========================================================
       INITIALIZE
       ========================================================= */

    function init() {
        els.input = document.getElementById("messageSearch");
        els.messagesButton = document.getElementById("searchMessagesBtn");
        els.usersButton = document.getElementById("searchUsersBtn");
        els.results = document.getElementById("searchResults");

        els.matchNavigator =
            document.getElementById("searchMatchNavigator");

        els.matchCount =
            document.getElementById("searchMatchCount");

        els.matchUp =
            document.getElementById("searchMatchUp");

        els.matchDown =
            document.getElementById("searchMatchDown");

        if (!els.input) {
            return;
        }

        setupStyles();
        setupMainSearch();
        setupMatchNavigator();
        setupConversationObserver();

        updateModeButtons();
        updateMatchNavigator();
    }

    /* =========================================================
       STYLES
       ========================================================= */

    function setupStyles() {
        if (document.getElementById("wfescMessagesSearchStyle")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "wfescMessagesSearchStyle";

        style.textContent = `
            .wfesc-search-highlight {
                background: #ffe600 !important;
                color: #000 !important;
                border-radius: 4px;
                padding: 0 2px;
            }

            .wfesc-user-search-result {
                position: relative;
                transition:
                    transform .18s ease,
                    background .18s ease,
                    border-color .18s ease;
                cursor: pointer;
                user-select: none !important;
                -webkit-user-select: none !important;
            }

            .wfesc-user-search-result.wfesc-blocked-you {
                cursor: not-allowed;
            }

            .wfesc-user-search-result.wfesc-blocked-you
            .wfesc-search-blocked-label {
                color: #ff3b30;
            }

            .wfesc-user-search-result.wfesc-shake {
                animation: wfescSearchBlockedShake .42s ease;
                background: rgba(255, 40, 40, .14) !important;
                border-color: #ff3030 !important;
            }

            @keyframes wfescSearchBlockedShake {
                0% {
                    transform: translateX(0);
                }

                20% {
                    transform: translateX(-7px);
                }

                40% {
                    transform: translateX(7px);
                }

                60% {
                    transform: translateX(-5px);
                }

                80% {
                    transform: translateX(5px);
                }

                100% {
                    transform: translateX(0);
                }
            }

            .wfesc-search-avatar {
                width: 46px;
                height: 46px;
                min-width: 46px;
                border-radius: 50%;
                object-fit: cover;
                display: block;
                background: #222;
            }

            .wfesc-search-avatar-fallback {
                width: 46px;
                height: 46px;
                min-width: 46px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #202020;
                color: #fff;
                font-weight: 700;
                font-size: 18px;
            }

            .wfesc-search-user-row {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
            }

            .wfesc-search-user-info {
                min-width: 0;
                flex: 1;
            }

            .wfesc-search-user-name {
                font-weight: 700;
                color: #fff;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .wfesc-search-user-username {
                margin-top: 3px;
                color: #999;
                font-size: 13px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .wfesc-search-blocked-label {
                margin-top: 5px;
                font-size: 12px;
                font-weight: 700;
            }

            .wfesc-search-message-row {
                cursor: pointer;
                user-select: none !important;
                -webkit-user-select: none !important;
            }

            .wfesc-search-empty {
                padding: 20px;
                text-align: center;
                color: #888;
            }

            .wfesc-search-error {
                padding: 20px;
                text-align: center;
                color: #ff5252;
            }

            .wfesc-search-loading {
                padding: 20px;
                text-align: center;
                color: #aaa;
            }

            .wfesc-search-result-preview {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .wfesc-search-current-match {
                outline: 2px solid #fff;
                outline-offset: 3px;
                border-radius: 10px;
            }
        `;

        document.head.appendChild(style);
    }

    /* =========================================================
       MAIN SEARCH
       ========================================================= */

    function setupMainSearch() {
        if (els.messagesButton) {
            els.messagesButton.addEventListener("click", function () {
                searchMode = "messages";
                currentSearchText = "";
                clearSearchResults();
                updateModeButtons();

                if (els.input) {
                    els.input.placeholder = "ابحث في الرسائل...";
                    els.input.focus();
                }
            });
        }

        if (els.usersButton) {
            els.usersButton.addEventListener("click", function () {
                searchMode = "users";
                currentSearchText = "";
                clearSearchResults();
                updateModeButtons();

                if (els.input) {
                    els.input.placeholder = "ابحث عن مستخدم...";
                    els.input.focus();
                }
            });
        }

        els.input.addEventListener("input", function () {
            const text = String(els.input.value || "").trim();

            currentSearchText = text;

            clearTimeout(searchTimer);

            if (!text) {
                clearSearchResults();
                return;
            }

            searchTimer = setTimeout(function () {
                performMainSearch(text);
            }, 300);
        });

        els.input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();

                const text = String(els.input.value || "").trim();

                if (!text) {
                    return;
                }

                clearTimeout(searchTimer);
                performMainSearch(text);
            }
        });
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
        const token = ++searchRequestToken;

        if (!els.results) {
            return;
        }

        els.results.innerHTML =
            '<div class="wfesc-search-loading">جاري البحث...</div>';

        if (searchMode === "users") {
            await searchUsers(text, token);
        } else {
            await searchMessages(text, token);
        }
    }

    function clearSearchResults() {
        currentResults = [];
        currentMatchIndex = -1;

        if (els.results) {
            els.results.innerHTML = "";
        }

        updateMatchNavigator();
    }

    /* =========================================================
       USER SEARCH
       ========================================================= */

    async function searchUsers(text, token) {
        const client = getClient();

        if (!client) {
            showSearchError("تعذر الاتصال بقاعدة البيانات.");
            return;
        }

        try {
            const result = await client.rpc(
                "search_users",
                {
                    search_text: text
                }
            );

            if (token !== searchRequestToken) {
                return;
            }

            if (result.error) {
                console.error(
                    "[WFESC SEARCH] user search error:",
                    result.error
                );

                showSearchError("حدث خطأ أثناء البحث عن المستخدمين.");
                return;
            }

            const users = Array.isArray(result.data)
                ? result.data
                : [];

            renderUserResults(users, text);
        } catch (error) {
            console.error(
                "[WFESC SEARCH] user search exception:",
                error
            );

            showSearchError("حدث خطأ أثناء البحث عن المستخدمين.");
        }
    }

    function renderUserResults(users, text) {
        if (!els.results) {
            return;
        }

        if (!users.length) {
            els.results.innerHTML =
                '<div class="wfesc-search-empty">لم يتم العثور على مستخدمين.</div>';

            return;
        }

        els.results.innerHTML = "";

        users.forEach(function (user) {
            const blockedYou = isBlockedYou(user);

            const item = document.createElement("div");

            item.className =
                "search-result wfesc-user-search-result" +
                (blockedYou ? " wfesc-blocked-you" : "");

            const avatar = getAvatar(user);
            const name = getDisplayName(user);
            const username = getUsername(user);

            let avatarHTML = "";

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
                    <div class="wfesc-search-avatar-fallback">
                        ${escapeHTML(getInitial(name))}
                    </div>
                `;
            }

            let usernameHTML = "";

            if (username) {
                usernameHTML = `
                    <div class="wfesc-search-user-username">
                        @${highlightText(username, text)}
                    </div>
                `;
            }

            let blockedHTML = "";

            if (blockedYou) {
                blockedHTML = `
                    <div class="wfesc-search-blocked-label">
                        قام بحظرك
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="wfesc-search-user-row">

                    ${avatarHTML}

                    <div class="wfesc-search-user-info">

                        <div class="wfesc-search-user-name">
                            ${highlightText(name, text)}
                        </div>

                        ${usernameHTML}

                        ${blockedHTML}

                    </div>

                </div>
            `;

            item.addEventListener("click", function () {
                if (blockedYou) {
                    shakeBlockedUser(item);
                    return;
                }

                openUserFromSearch(user);
            });

            item.addEventListener("dragstart", function (event) {
                event.preventDefault();
            });

            els.results.appendChild(item);
        });
    }

    function shakeBlockedUser(element) {
        if (!element) {
            return;
        }

        element.classList.remove("wfesc-shake");

        void element.offsetWidth;

        element.classList.add("wfesc-shake");

        setTimeout(function () {
            element.classList.remove("wfesc-shake");
        }, 500);
    }

    async function openUserFromSearch(user) {
        const userId = getUserId(user);

        if (!userId) {
            return;
        }

        const client = getClient();

        if (!client) {
            return;
        }

        try {
            /*
             * نتأكد مرة ثانية أن الطرف الآخر لم يحظرنا
             * قبل إنشاء/فتح المحادثة.
             */

            const blockCheck = await client
                .from("user_blocks")
                .select("blocker_id,blocked_id")
                .or(
                    `blocker_id.eq.${userId},blocked_id.eq.${userId}`
                );

            if (!blockCheck.error && Array.isArray(blockCheck.data)) {
                const myUser = getCurrentUser();
                const myId = myUser?.id;

                const blockedYou = blockCheck.data.some(function (row) {
                    return (
                        row.blocker_id === userId &&
                        row.blocked_id === myId
                    );
                });

                if (blockedYou) {
                    /*
                     * المستخدم صار حاجبنا بعد نتيجة البحث.
                     */
                    const target = document.querySelector(
                        `.wfesc-user-search-result`
                    );

                    if (target) {
                        shakeBlockedUser(target);
                    }

                    return;
                }
            }

            /*
             * إنشاء/الحصول على المحادثة المباشرة.
             */
            const rpcResult = await client.rpc(
                "get_or_create_direct_conversation",
                {
                    target_user_id: userId
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
                extractConversationId(rpcResult.data);

            if (!conversationId) {
                showSearchError(
                    "تعذر فتح المحادثة."
                );

                return;
            }

            /*
             * نحاول استخدام openConversation الموجودة أصلًا
             * بدون تعديل messages-core.js.
             */
            const core = getCore();

            if (core?.openConversation) {
                const contact = {
                    user_id: userId,
                    id: userId,
                    username: getUsername(user),
                    display_name: getDisplayName(user),
                    avatar_url: getAvatar(user)
                };

                await core.openConversation(
                    conversationId,
                    contact,
                    "direct"
                );

                /*
                 * إخفاء نتائج البحث بعد فتح المحادثة.
                 */
                if (els.results) {
                    els.results.innerHTML = "";
                }

                return;
            }

            /*
             * إذا كانت دالة core غير متاحة، نرسل event
             * حتى تبقى الوحدة مستقلة.
             */
            document.dispatchEvent(
                new CustomEvent("wfesc:open-conversation", {
                    detail: {
                        conversationId,
                        contact: user
                    }
                })
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

    function extractConversationId(data) {
        if (!data) {
            return null;
        }

        if (typeof data === "string") {
            return data;
        }

        if (Array.isArray(data)) {
            if (!data.length) {
                return null;
            }

            return extractConversationId(data[0]);
        }

        if (typeof data === "object") {
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

    async function searchMessages(text, token) {
        const client = getClient();

        if (!client) {
            showSearchError("تعذر الاتصال بقاعدة البيانات.");
            return;
        }

        try {
            const result = await client.rpc(
                "search_messages",
                {
                    search_text: text
                }
            );

            if (token !== searchRequestToken) {
                return;
            }

            if (result.error) {
                console.error(
                    "[WFESC SEARCH] message search error:",
                    result.error
                );

                /*
                 * إذا كان RPC موجودًا لكن توقيعه مختلف،
                 * لا نكسر بقية الصفحة.
                 */
                showSearchError("حدث خطأ أثناء البحث في الرسائل.");
                return;
            }

            const rows = Array.isArray(result.data)
                ? result.data
                : [];

            currentResults = rows;

            renderMessageResults(rows, text);
        } catch (error) {
            console.error(
                "[WFESC SEARCH] message search exception:",
                error
            );

            showSearchError("حدث خطأ أثناء البحث في الرسائل.");
        }
    }

    function renderMessageResults(rows, text) {
        if (!els.results) {
            return;
        }

        if (!rows.length) {
            els.results.innerHTML =
                '<div class="wfesc-search-empty">لم يتم العثور على رسائل مطابقة.</div>';

            return;
        }

        els.results.innerHTML = "";

        rows.forEach(function (row, index) {
            const item = document.createElement("div");

            item.className =
                "search-result wfesc-search-message-row";

            const content =
                row.content ||
                row.message ||
                row.message_content ||
                row.text ||
                "";

            const conversationId =
                row.conversation_id ||
                row.conversationId ||
                null;

            const messageId =
                row.message_id ||
                row.id ||
                null;

            const createdAt =
                row.created_at ||
                row.createdAt ||
                "";

            const senderName =
                row.display_name ||
                row.displayName ||
                row.sender_name ||
                row.senderName ||
                row.username ||
                "مستخدم";

            item.innerHTML = `
                <div class="result-info">

                    <div class="result-name">
                        ${escapeHTML(senderName)}
                    </div>

                    <div class="result-preview wfesc-search-result-preview">
                        ${highlightText(content, text)}
                    </div>

                    ${
                        createdAt
                            ? `
                                <div class="result-username">
                                    ${escapeHTML(formatDate(createdAt))}
                                </div>
                              `
                            : ""
                    }

                </div>
            `;

            item.dataset.resultIndex = String(index);

            item.addEventListener("click", function () {
                openMessageSearchResult({
                    conversationId,
                    messageId,
                    content,
                    row
                });
            });

            els.results.appendChild(item);
        });
    }

    async function openMessageSearchResult(result) {
        if (!result) {
            return;
        }

        const currentConversationId =
            getCurrentConversationId();

        /*
         * إذا كانت النتيجة داخل المحادثة المفتوحة حاليًا،
         * ننتقل إليها مباشرة.
         */
        if (
            result.conversationId &&
            currentConversationId &&
            result.conversationId === currentConversationId
        ) {
            scrollToMessage(result.messageId, result.content);
            return;
        }

        /*
         * إذا كانت من محادثة أخرى نحاول فتحها.
         */
        if (
            result.conversationId &&
            getCore()?.openConversation
        ) {
            try {
                const core = getCore();

                const conversations =
                    core.getConversations?.() || [];

                const conversation =
                    Array.isArray(conversations)
                        ? conversations.find(function (item) {
                            return (
                                item?.conversation_id ===
                                    result.conversationId ||
                                item?.id ===
                                    result.conversationId
                            );
                        })
                        : null;

                const contact =
                    conversation?.contact ||
                    conversation?.other_user ||
                    conversation?.user ||
                    null;

                await core.openConversation(
                    result.conversationId,
                    contact,
                    conversation?.type || "direct"
                );

                setTimeout(function () {
                    scrollToMessage(
                        result.messageId,
                        result.content
                    );
                }, 250);

                return;
            } catch (error) {
                console.error(
                    "[WFESC SEARCH] open message conversation error:",
                    error
                );
            }
        }

        /*
         * fallback event
         */
        document.dispatchEvent(
            new CustomEvent("wfesc:search-message-open", {
                detail: result
            })
        );
    }

    /* =========================================================
       CURRENT CHAT MESSAGE SEARCH
       ========================================================= */

    function setupConversationObserver() {
        document.addEventListener(
            "wfesc:chat-opened",
            function () {
                refreshCurrentConversationMatches();
            }
        );

        document.addEventListener(
            "wfesc:chat-header-refresh",
            function () {
                refreshCurrentConversationMatches();
            }
        );

        document.addEventListener(
            "wfesc:messages-rendered",
            function () {
                refreshCurrentConversationMatches();
            }
        );

        /*
         * مراقبة تغييرات chatMessages حتى لو لم يرسل core event.
         */
        const chatMessages =
            document.getElementById("chatMessages");

        if (chatMessages) {
            const observer = new MutationObserver(function () {
                if (!currentSearchText) {
                    return;
                }

                if (searchMode !== "messages") {
                    return;
                }

                applyCurrentConversationSearch(
                    currentSearchText
                );
            });

            observer.observe(chatMessages, {
                childList: true,
                subtree: true
            });
        }
    }

    function refreshCurrentConversationMatches() {
        if (!currentSearchText) {
            return;
        }

        if (searchMode !== "messages") {
            return;
        }

        applyCurrentConversationSearch(
            currentSearchText
        );
    }

    function applyCurrentConversationSearch(text) {
        const container =
            document.getElementById("chatMessages");

        if (!container) {
            updateMatchNavigator();
            return;
        }

        /*
         * نزيل العلامات القديمة أولًا.
         */
        const oldMarks =
            container.querySelectorAll(
                ".wfesc-search-highlight"
            );

        oldMarks.forEach(function (mark) {
            const parent = mark.parentNode;

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
        });

        /*
         * إذا ماكو نص بحث، انتهينا.
         */
        if (!text.trim()) {
            currentMatchIndex = -1;
            currentResults = [];
            updateMatchNavigator();
            return;
        }

        const bubbles =
            container.querySelectorAll(
                ".message-bubble, .message-content"
            );

        const matches = [];

        bubbles.forEach(function (bubble) {
            /*
             * نتجنب تكرار message-content إذا كانت bubble
             * تحتويه.
             */
            if (
                bubble.classList.contains("message-bubble") &&
                bubble.querySelector(".message-content")
            ) {
                return;
            }

            const rawText =
                bubble.textContent || "";

            if (
                rawText
                    .toLocaleLowerCase()
                    .includes(
                        text.toLocaleLowerCase()
                    )
            ) {
                highlightElementText(
                    bubble,
                    text
                );

                matches.push(bubble);
            }
        });

        /*
         * البحث داخل .message-content بشكل منفصل.
         */
        const contents =
            container.querySelectorAll(
                ".message-content"
            );

        contents.forEach(function (content) {
            const rawText =
                content.textContent || "";

            if (
                rawText
                    .toLocaleLowerCase()
                    .includes(
                        text.toLocaleLowerCase()
                    )
            ) {
                highlightElementText(
                    content,
                    text
                );

                const bubble =
                    content.closest(
                        ".message-bubble"
                    ) || content;

                if (!matches.includes(bubble)) {
                    matches.push(bubble);
                }
            }
        });

        currentResults = matches;

        if (!matches.length) {
            currentMatchIndex = -1;
        } else if (
            currentMatchIndex < 0 ||
            currentMatchIndex >= matches.length
        ) {
            currentMatchIndex = 0;
        }

        updateMatchNavigator();
        highlightCurrentMatch();
    }

    function highlightElementText(element, query) {
        if (!element || !query) {
            return;
        }

        /*
         * نحاول فقط على عقد النص المباشرة،
         * حتى لا نخرب بنية bubble.
         */
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (!node.nodeValue.trim()) {
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

        while ((node = walker.nextNode())) {
            nodes.push(node);
        }

        const lowerQuery =
            query.toLocaleLowerCase();

        nodes.forEach(function (textNode) {
            const value =
                textNode.nodeValue || "";

            if (
                !value
                    .toLocaleLowerCase()
                    .includes(lowerQuery)
            ) {
                return;
            }

            const fragment =
                document.createDocumentFragment();

            let remaining = value;

            while (remaining.length) {
                const lowerRemaining =
                    remaining.toLocaleLowerCase();

                const index =
                    lowerRemaining.indexOf(
                        lowerQuery
                    );

                if (index === -1) {
                    fragment.appendChild(
                        document.createTextNode(
                            remaining
                        )
                    );

                    break;
                }

                if (index > 0) {
                    fragment.appendChild(
                        document.createTextNode(
                            remaining.slice(0, index)
                        )
                    );
                }

                const mark =
                    document.createElement("mark");

                mark.className =
                    "wfesc-search-highlight";

                mark.textContent =
                    remaining.slice(
                        index,
                        index + query.length
                    );

                fragment.appendChild(mark);

                remaining =
                    remaining.slice(
                        index + query.length
                    );
            }

            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(
                    fragment,
                    textNode
                );
            }
        });
    }

    /* =========================================================
       MATCH NAVIGATOR
       ========================================================= */

    function setupMatchNavigator() {
        if (els.matchUp) {
            els.matchUp.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    moveMatch(-1);
                }
            );
        }

        if (els.matchDown) {
            els.matchDown.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    moveMatch(1);
                }
            );
        }
    }

    function moveMatch(direction) {
        if (!Array.isArray(currentResults)) {
            return;
        }

        if (!currentResults.length) {
            return;
        }

        currentMatchIndex += direction;

        if (currentMatchIndex < 0) {
            currentMatchIndex =
                currentResults.length - 1;
        }

        if (
            currentMatchIndex >=
            currentResults.length
        ) {
            currentMatchIndex = 0;
        }

        highlightCurrentMatch();
        updateMatchNavigator();
    }

    function highlightCurrentMatch() {
        if (!currentResults.length) {
            return;
        }

        currentResults.forEach(function (element) {
            if (
                element &&
                element.classList
            ) {
                element.classList.remove(
                    "wfesc-search-current-match"
                );
            }
        });

        const current =
            currentResults[currentMatchIndex];

        if (!current) {
            return;
        }

        if (current.classList) {
            current.classList.add(
                "wfesc-search-current-match"
            );
        }

        try {
            current.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        } catch (error) {
            try {
                current.scrollIntoView();
            } catch (scrollError) {}
        }
    }

    function updateMatchNavigator() {
        if (!els.matchNavigator) {
            return;
        }

        const total =
            Array.isArray(currentResults)
                ? currentResults.length
                : 0;

        if (els.matchCount) {
            if (!total) {
                els.matchCount.textContent =
                    "0 / 0";
            } else {
                els.matchCount.textContent =
                    `${currentMatchIndex + 1} / ${total}`;
            }
        }

        els.matchNavigator.style.display =
            total > 0 ? "flex" : "none";
    }

    /* =========================================================
       SCROLL TO MESSAGE
       ========================================================= */

    function scrollToMessage(
        messageId,
        content
    ) {
        const container =
            document.getElementById(
                "chatMessages"
            );

        if (!container) {
            return;
        }

        let target = null;

        if (messageId) {
            const selectors = [
                `[data-message-id="${CSS.escape(String(messageId))}"]`,
                `[data-id="${CSS.escape(String(messageId))}"]`,
                `#message-${CSS.escape(String(messageId))}`
            ];

            for (const selector of selectors) {
                try {
                    target =
                        container.querySelector(
                            selector
                        );

                    if (target) {
                        break;
                    }
                } catch (error) {}
            }
        }

        /*
         * fallback: نبحث بالنص.
         */
        if (!target && content) {
            const bubbles =
                container.querySelectorAll(
                    ".message-bubble, .message-content"
                );

            const wanted =
                String(content)
                    .trim()
                    .toLocaleLowerCase();

            for (const bubble of bubbles) {
                const value =
                    String(
                        bubble.textContent || ""
                    )
                        .trim()
                        .toLocaleLowerCase();

                if (
                    value.includes(wanted)
                ) {
                    target = bubble;
                    break;
                }
            }
        }

        if (!target) {
            return;
        }

        try {
            target.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        } catch (error) {
            try {
                target.scrollIntoView();
            } catch (scrollError) {}
        }

        target.classList.add(
            "wfesc-search-current-match"
        );

        setTimeout(function () {
            target.classList.remove(
                "wfesc-search-current-match"
            );
        }, 1800);
    }

    /* =========================================================
       ERROR
       ========================================================= */

    function showSearchError(message) {
        if (!els.results) {
            return;
        }

        els.results.innerHTML = `
            <div class="wfesc-search-error">
                ${escapeHTML(message)}
            </div>
        `;
    }

    /* =========================================================
       DATE
       ========================================================= */

    function formatDate(value) {
        if (!value) {
            return "";
        }

        try {
            const date =
                new Date(value);

            if (Number.isNaN(date.getTime())) {
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
        refreshCurrentConversationMatches
    };

    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})();
