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
        "1.0.0";


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


        return (
            document.querySelector(
                `.post[data-id="${CSS.escape(id)}"]`
            )
            ||
            document.querySelector(
                `[data-post-id="${CSS.escape(id)}"]`
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


        post.classList.add(
            "wfesc-post-highlight"
        );


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


        let attempts =
            0;


        const maxAttempts =
            20;


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


        openPostFromUrl();


        console.log(
            "[WFESC POSTS EXTRA] تم تحميل posts-extra.js"
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
