/* =========================================================
   WFESC POSTS EXTRA
   File: posts-featwres/posts-extra.js
   ========================================================= */

(function () {

    "use strict";


    /*
     * -------------------------------------------------------
     * WFESC POSTS FEATURES NAMESPACE
     * -------------------------------------------------------
     */

    window.WFESC_POSTS_FEATURES =
        window.WFESC_POSTS_FEATURES || {};

    const FEATURES =
        window.WFESC_POSTS_FEATURES;


    FEATURES.extra =
        FEATURES.extra || {};

    FEATURES.extra.loaded =
        true;

    FEATURES.extra.version =
        "1.1.0";


    /*
     * -------------------------------------------------------
     * SAFE HELPERS
     * -------------------------------------------------------
     */

    function getElement(
        selector
    ) {

        try {

            return document.querySelector(
                selector
            );

        } catch (
            error
        ) {

            console.error(
                "[WFESC POSTS EXTRA]",
                "خطأ في تحديد العنصر:",
                selector,
                error
            );

            return null;

        }

    }


    function getElements(
        selector
    ) {

        try {

            return Array.from(
                document.querySelectorAll(
                    selector
                )
            );

        } catch (
            error
        ) {

            console.error(
                "[WFESC POSTS EXTRA]",
                "خطأ في تحديد العناصر:",
                selector,
                error
            );

            return [];

        }

    }


    function escapeHtml(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        const element =
            document.createElement(
                "div"
            );

        element.textContent =
            String(value);

        return element.innerHTML;

    }


    /*
     * -------------------------------------------------------
     * POST ELEMENT HELPERS
     * -------------------------------------------------------
     */

    function getPostElement(
        postId
    ) {

        if (
            postId === null ||
            postId === undefined
        ) {

            return null;

        }

        const id =
            String(
                postId
            );

        let escapedId =
            id;

        try {

            escapedId =
                CSS.escape(
                    id
                );

        } catch (
            error
        ) {

            console.warn(
                "[WFESC POSTS EXTRA]",
                "تعذر استخدام CSS.escape:",
                error
            );

        }


        return (
            document.querySelector(
                `.post[data-id="${escapedId}"]`
            )
            ||
            document.querySelector(
                `[data-post-id="${escapedId}"]`
            )
            ||
            document.getElementById(
                `post-${id}`
            )
        );

    }


    function scrollToPost(
        postId,
        behavior = "smooth"
    ) {

        const post =
            getPostElement(
                postId
            );


        if (
            !post
        ) {

            return false;

        }


        try {

            post.scrollIntoView(
                {
                    behavior:
                        behavior,
                    block:
                        "center"
                }
            );

        } catch (
            error
        ) {

            post.scrollIntoView();

        }


        post.classList.remove(
            "wfesc-post-highlight"
        );


        /*
         * إعادة تشغيل التأثير حتى لو تم فتح
         * نفس المنشور أكثر من مرة.
         */
        void post.offsetWidth;


        post.classList.add(
            "wfesc-post-highlight"
        );


        window.clearTimeout(
            post.__wfescHighlightTimer
        );


        post.__wfescHighlightTimer =
            window.setTimeout(
                function () {

                    post.classList.remove(
                        "wfesc-post-highlight"
                    );

                },
                1800
            );


        return true;

    }


    /*
     * -------------------------------------------------------
     * PUBLIC POST HELPERS
     * -------------------------------------------------------
     */

    FEATURES.extra.getPostElement =
        getPostElement;


    FEATURES.extra.scrollToPost =
        scrollToPost;


    FEATURES.extra.escapeHtml =
        escapeHtml;


    FEATURES.extra.getElement =
        getElement;


    FEATURES.extra.getElements =
        getElements;


    /*
     * -------------------------------------------------------
     * ADD SAFE HIGHLIGHT STYLE
     * -------------------------------------------------------
     *
     * لا نستبدل أي CSS موجود.
     * نضيف فقط CSS خاص بالإضافة.
     *
     * -------------------------------------------------------
     */

    function addExtraStyle(){

        if (
            document.getElementById(
                "wfesc-posts-extra-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfesc-posts-extra-style";


        style.textContent = `

            .wfesc-post-highlight {
                animation:
                    wfescPostHighlight
                    1.8s
                    ease
                    both;
            }

            @keyframes wfescPostHighlight {

                0% {
                    transform:
                        scale(1);
                }

                20% {
                    transform:
                        scale(1.015);
                }

                45% {
                    transform:
                        scale(1);
                }

                70% {
                    transform:
                        scale(1.01);
                }

                100% {
                    transform:
                        scale(1);
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /*
     * -------------------------------------------------------
     * POST ID NORMALIZATION
     * -------------------------------------------------------
     */

    function normalizePostId(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        if (
            typeof value === "object"
        ) {

            if (
                value.id !== undefined
            ) {

                return String(
                    value.id
                );

            }

            if (
                value.post_id !== undefined
            ) {

                return String(
                    value.post_id
                );

            }

        }


        return String(
            value
        );

    }


    FEATURES.extra.normalizePostId =
        normalizePostId;


    /*
     * -------------------------------------------------------
     * FEED DEFINITIONS
     * -------------------------------------------------------
     *
     * نستخدم نفس أسماء الـRPC الموجودة فعليًا
     * داخل fetchFeed في posts.html.
     *
     * -------------------------------------------------------
     */

    const FEEDS = {

        public: {
            key: "public",
            label: "الرئيسية",
            rpc: "wfesc_get_public_posts"
        },

        friends: {
            key: "friends",
            label: "الأصدقاء",
            rpc: "wfesc_get_friends_posts",
            requiresAuth: true
        },

        trending: {
            key: "trending",
            label: "الرائج",
            rpc: "wfesc_get_trending_posts"
        },

        saved: {
            key: "saved",
            label: "المحفوظات",
            rpc: "wfesc_get_saved_posts",
            requiresAuth: true
        }

    };


    FEATURES.extra.feeds =
        FEEDS;


    /*
     * -------------------------------------------------------
     * GET CURRENT USER SAFELY
     * -------------------------------------------------------
     */

    function getCurrentUserSafe(){

        try {

            if (
                typeof currentUser !==
                "undefined"
            ) {

                return currentUser ||
                    null;

            }

        } catch (
            error
        ) {

            console.warn(
                "[WFESC POSTS EXTRA]",
                "تعذر الوصول إلى currentUser:",
                error
            );

        }


        try {

            if(
                window.WFESC_POSTS_CORE &&
                typeof
                window.WFESC_POSTS_CORE.getCurrentUser ===
                "function"
            ){

                return (
                    window.WFESC_POSTS_CORE
                        .getCurrentUser()
                    ||
                    null
                );

            }

        } catch (
            error
        ) {

            console.warn(
                "[WFESC POSTS EXTRA]",
                "تعذر الوصول إلى core user:",
                error
            );

        }


        return null;

    }


    FEATURES.extra.getCurrentUser =
        getCurrentUserSafe;


    /*
     * -------------------------------------------------------
     * GET CURRENT FEED SAFELY
     * -------------------------------------------------------
     */

    function getCurrentFeedSafe(){

        try {

            if (
                typeof currentFeed !==
                "undefined"
            ) {

                return String(
                    currentFeed ||
                    "public"
                );

            }

        } catch (
            error
        ) {}

        try {

            if(
                window.WFESC_POSTS_CORE &&
                typeof
                window.WFESC_POSTS_CORE.getCurrentFeed ===
                "function"
            ){

                return String(
                    window.WFESC_POSTS_CORE
                        .getCurrentFeed()
                    ||
                    "public"
                );

            }

        } catch (
            error
        ) {}

        return "public";

    }


    FEATURES.extra.getCurrentFeed =
        getCurrentFeedSafe;


    /*
     * -------------------------------------------------------
     * TOAST SAFE
     * -------------------------------------------------------
     */

    function showExtraToast(
        message
    ){

        try {

            if (
                typeof showToast ===
                "function"
            ) {

                showToast(
                    message
                );

                return;

            }

        } catch (
            error
        ) {}


        try {

            if(
                window.WFESC_POSTS_CORE &&
                typeof
                window.WFESC_POSTS_CORE.showToast ===
                "function"
            ){

                window.WFESC_POSTS_CORE
                    .showToast(
                        message
                    );

                return;

            }

        } catch (
            error
        ) {}


        console.log(
            "[WFESC POSTS EXTRA]",
            message
        );

    }


    FEATURES.extra.showToast =
        showExtraToast;


    /*
     * -------------------------------------------------------
     * SEARCH / VIEW HELPERS
     * -------------------------------------------------------
     */

    function clearSearchAndRestorePosts(){

        try {

            const input =
                getElement(
                    "#post-search-input"
                );

            if(input){

                input.value =
                    "";

            }

        } catch (
            error
        ) {}


        try {

            if(
                typeof hideSearchResultsBox ===
                "function"
            ){

                hideSearchResultsBox();

            }

        } catch (
            error
        ) {}


        try {

            const list =
                getElement(
                    "#posts-list"
                );

            if(list){

                list.style.display =
                    "";

            }

        } catch (
            error
        ) {}

    }


    FEATURES.extra.clearSearchAndRestorePosts =
        clearSearchAndRestorePosts;


    /*
     * -------------------------------------------------------
     * SET ACTIVE FEED BUTTON
     * -------------------------------------------------------
     */

    function setActiveFeedButton(
        feedName
    ){

        const buttons =
            getElements(
                "[data-feed]"
            );


        buttons.forEach(
            button => {

                const current =
                    String(
                        button.dataset.feed ||
                        ""
                    );


                button.classList.toggle(
                    "active",
                    current ===
                    String(
                        feedName
                    )
                );

            }
        );

    }


    FEATURES.extra.setActiveFeedButton =
        setActiveFeedButton;


    /*
     * -------------------------------------------------------
     * LOAD FEED
     * -------------------------------------------------------
     *
     * هذه الدالة هي المسار الإضافي المسؤول
     * عن أزرار:
     *
     * الرئيسية
     * الأصدقاء
     * الرائج
     * المحفوظات
     *
     * -------------------------------------------------------
     */

    async function loadExtraFeed(
        feedName
    ){

        const feed =
            FEEDS[
                String(
                    feedName
                )
            ]
            ||
            FEEDS.public;


        const user =
            getCurrentUserSafe();


        /*
         * الأصدقاء والمحفوظات تحتاج حسابًا
         */
        if(
            feed.requiresAuth &&
            !user
        ){

            setActiveFeedButton(
                "public"
            );


            try {

                if(
                    typeof loadPosts ===
                    "function"
                ){

                    await loadPosts({
                        feed:"public"
                    });

                }

            } catch (
                error
            ) {

                console.error(
                    "[WFESC POSTS EXTRA] public fallback error:",
                    error
                );

            }


            showExtraToast(
                feed.key === "friends"
                    ? "سجّل الدخول حتى تتمكن من مشاهدة منشورات الأصدقاء."
                    : "سجّل الدخول حتى تتمكن من مشاهدة المحفوظات."
            );


            return false;

        }


        clearSearchAndRestorePosts();


        setActiveFeedButton(
            feed.key
        );


        try {

            if(
                typeof profileSummary !==
                "undefined" &&
                profileSummary
            ){

                profileSummary.classList.remove(
                    "show"
                );

            }

        } catch (
            error
        ) {}


        /*
         * نستخدم loadPosts الموجود أصلًا
         * حتى تبقى طريقة بناء البطاقات والإحصائيات
         * والتعليقات والحفظ نفسها بدون تكرار.
         */
        if(
            typeof loadPosts !==
            "function"
        ){

            throw new Error(
                "دالة loadPosts غير متاحة."
            );

        }


        await loadPosts({
            feed:
                feed.key,
            offset:
                0,
            searchText:
                ""
        });


        return true;

    }


    FEATURES.extra.loadFeed =
        loadExtraFeed;


    /*
     * -------------------------------------------------------
     * FEED BUTTON HANDLER
     * -------------------------------------------------------
     *
     * مهم:
     * posts.html يحتوي أصلًا على listener
     * لأزرار data-feed.
     *
     * لذلك نستخدم CAPTURE PHASE هنا حتى نمنع
     * تشغيل listener القديم مرة ثانية.
     *
     * -------------------------------------------------------
     */

    function installFeedButtonController(){

        if(
            FEATURES.extra.feedControllerInstalled
        ){

            return;

        }


        FEATURES.extra.feedControllerInstalled =
            true;


        document.addEventListener(
            "click",
            function(event){

                let target =
                    event.target;


                if(
                    !target ||
                    !target.closest
                ){

                    return;

                }


                const button =
                    target.closest(
                        "[data-feed]"
                    );


                if(!button){

                    return;

                }


                /*
                 * أوقف listener الموجود داخل
                 * posts.html حتى لا يتم تحميل
                 * نفس الـfeed مرتين.
                 */
                event.preventDefault();

                event.stopImmediatePropagation();


                const feedName =
                    String(
                        button.dataset.feed ||
                        "public"
                    );


                if(
                    FEATURES.extra.feedLoading
                ){

                    return;

                }


                FEATURES.extra.feedLoading =
                    true;


                loadExtraFeed(
                    feedName
                )
                .catch(
                    error => {

                        console.error(
                            "[WFESC POSTS EXTRA] feed loading error:",
                            error
                        );


                        showExtraToast(
                            error?.message
                            ||
                            "تعذر تحميل هذا القسم."
                        );

                    }
                )
                .finally(
                    () => {

                        FEATURES.extra.feedLoading =
                            false;

                    }
                );

            },
            true
        );

    }


    FEATURES.extra.installFeedButtonController =
        installFeedButtonController;


    /*
     * -------------------------------------------------------
     * FEED RPC INFORMATION
     * -------------------------------------------------------
     *
     * هذه الدالة فقط للفحص والتشخيص.
     * لا تغيّر قاعدة البيانات.
     *
     * -------------------------------------------------------
     */

    function getFeedRpcName(
        feedName
    ){

        return (
            FEEDS[
                String(
                    feedName
                )
            ]?.rpc
            ||
            FEEDS.public.rpc
        );

    }


    FEATURES.extra.getFeedRpcName =
        getFeedRpcName;


    /*
     * -------------------------------------------------------
     * OPEN POST FROM URL
     * -------------------------------------------------------
     *
     * يدعم:
     *
     * posts.html?post_id=123
     *
     * أو:
     *
     * posts.html#post-123
     *
     * -------------------------------------------------------
     */

    function openPostFromUrl(){

        const params =
            new URLSearchParams(
                window.location.search
            );


        let postId =
            params.get(
                "post_id"
            );


        if (
            !postId &&
            window.location.hash
        ) {

            const hash =
                window.location.hash;


            if (
                hash.startsWith(
                    "#post-"
                )
            ) {

                postId =
                    hash.substring(
                        6
                    );

            }

        }


        if (
            !postId
        ) {

            return;

        }


        const normalized =
            normalizePostId(
                postId
            );


        if(
            !normalized
        ){

            return;

        }


        let attempts =
            0;


        const maxAttempts =
            30;


        const timer =
            window.setInterval(
                function () {

                    attempts++;


                    const found =
                        scrollToPost(
                            normalized
                        );


                    if (
                        found ||
                        attempts >=
                        maxAttempts
                    ) {

                        window.clearInterval(
                            timer
                        );

                    }

                },
                300
            );

    }


    FEATURES.extra.openPostFromUrl =
        openPostFromUrl;


    /*
     * -------------------------------------------------------
     * OPEN POST DIRECTLY
     * -------------------------------------------------------
     *
     * مثال:
     *
     * WFESC_POSTS_FEATURES.extra.openPost(123)
     *
     * -------------------------------------------------------
     */

    function openPost(
        postId
    ){

        const normalized =
            normalizePostId(
                postId
            );


        if(
            !normalized
        ){

            return false;

        }


        const currentPath =
            window.location.pathname;


        const isPostsPage =
            /posts(?:\.html)?$/i
                .test(
                    currentPath
                );


        if(
            !isPostsPage
        ){

            window.location.href =
                "posts.html?post_id=" +
                encodeURIComponent(
                    normalized
                );

            return true;

        }


        const directFound =
            scrollToPost(
                normalized
            );


        if(
            directFound
        ){

            return true;

        }


        window.location.href =
            "posts.html?post_id=" +
            encodeURIComponent(
                normalized
            );


        return true;

    }


    FEATURES.extra.openPost =
        openPost;


    /*
     * -------------------------------------------------------
     * GET FEED LABEL
     * -------------------------------------------------------
     */

    function getFeedLabel(
        feedName
    ){

        return (
            FEEDS[
                String(
                    feedName
                )
            ]?.label
            ||
            "الرئيسية"
        );

    }


    FEATURES.extra.getFeedLabel =
        getFeedLabel;


    /*
     * -------------------------------------------------------
     * FRIENDS / SAVED AUTH GUARD
     * -------------------------------------------------------
     */

    function checkFeedAccess(
        feedName
    ){

        const feed =
            FEEDS[
                String(
                    feedName
                )
            ];


        if(
            !feed
        ){

            return true;

        }


        if(
            feed.requiresAuth &&
            !getCurrentUserSafe()
        ){

            return false;

        }


        return true;

    }


    FEATURES.extra.checkFeedAccess =
        checkFeedAccess;


    /*
     * -------------------------------------------------------
     * FEED STATE
     * -------------------------------------------------------
     */

    function syncFeedState(){

        const current =
            getCurrentFeedSafe();


        setActiveFeedButton(
            current
        );

    }


    FEATURES.extra.syncFeedState =
        syncFeedState;


    /*
     * -------------------------------------------------------
     * INITIALIZATION
     * -------------------------------------------------------
     */

    function initialize(){

        if (
            FEATURES.extra.initialized
        ) {

            return;

        }


        FEATURES.extra.initialized =
            true;


        addExtraStyle();


        installFeedButtonController();


        syncFeedState();


        openPostFromUrl();


        console.log(
            "[WFESC POSTS EXTRA]",
            "تم تحميل posts-extra.js",
            {
                version:
                    FEATURES.extra.version,
                feeds:
                    Object.keys(
                        FEEDS
                    )
            }
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:true
            }
        );

    } else {

        initialize();

    }


})();
