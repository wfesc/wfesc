/* =========================================================
   WFESC POSTS EXTENSION
   WFXP COMMENTS ENGINE
   تحسينات التعليقات بدون تعديل النظام الأصلي
   ========================================================= */

(() => {

    "use strict";

    /* -----------------------------------------------------
       منع التشغيل المكرر
       ----------------------------------------------------- */

    if (window.WFXP_COMMENTS_ENGINE_LOADED) {
        return;
    }

    window.WFXP_COMMENTS_ENGINE_LOADED = true;


    /* -----------------------------------------------------
       إعدادات النظام
       ----------------------------------------------------- */

    const WFXP_COMMENT_SETTINGS = {

        animationDuration: 350,

        commentDelay: 110,

        repliesAnimationDuration: 300,

        enableSequentialComments: true,

        enableRepliesButton: true,

        enableReactionAnimation: true

    };


    /* -----------------------------------------------------
       إضافة Class آمن للتعليق
       ----------------------------------------------------- */

    function WFXP_prepareComment(commentElement) {

        if (!commentElement) {
            return;
        }

        commentElement.classList.add(
            "wfxp-comment"
        );

    }


    /* -----------------------------------------------------
       تجهيز الردود
       ----------------------------------------------------- */

    function WFXP_prepareReplies(commentElement) {

        if (!commentElement) {
            return;
        }

        const repliesBox =
            commentElement.querySelector(
                ".replies"
            );

        if (!repliesBox) {
            return;
        }

        const replies =
            Array.from(
                repliesBox.children
            );

        if (!replies.length) {
            return;
        }

        repliesBox.classList.add(
            "wfxp-replies"
        );

        replies.forEach(reply => {

            reply.classList.add(
                "wfxp-comment"
            );

        });

    }


    /* -----------------------------------------------------
       زر عرض الردود
       ----------------------------------------------------- */

    function WFXP_createRepliesButton(
        commentElement
    ) {

        if (!commentElement) {
            return;
        }

        const repliesBox =
            commentElement.querySelector(
                ".replies"
            );

        if (!repliesBox) {
            return;
        }

        const replies =
            Array.from(
                repliesBox.children
            );

        if (!replies.length) {
            return;
        }

        if (
            commentElement.querySelector(
                ".wfxp-show-replies"
            )
        ) {
            return;
        }


        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "wfxp-show-replies";


        button.innerHTML = `
            <span class="wfxp-replies-arrow">
                ↳
            </span>

            <span>
                عرض الردود
            </span>

            <span class="wfxp-replies-count">
                ${replies.length}
            </span>
        `;


        repliesBox.style.display =
            "none";


        button.addEventListener(
            "click",
            () => {

                const isHidden =
                    repliesBox.style.display ===
                    "none";


                if (isHidden) {

                    repliesBox.style.display =
                        "block";

                    button.classList.add(
                        "wfxp-open"
                    );


                    replies.forEach(
                        (reply, index) => {

                            reply.classList.remove(
                                "wfxp-visible"
                            );

                            reply.classList.add(
                                "wfxp-enter"
                            );


                            setTimeout(
                                () => {

                                    reply.classList.remove(
                                        "wfxp-enter"
                                    );

                                    reply.classList.add(
                                        "wfxp-visible"
                                    );

                                },
                                index *
                                WFXP_COMMENT_SETTINGS
                                    .commentDelay
                            );

                        }
                    );

                } else {

                    repliesBox.style.display =
                        "none";

                    button.classList.remove(
                        "wfxp-open"
                    );

                }

            }
        );


        const actions =
            commentElement.querySelector(
                ".comment-actions"
            );


        if (actions) {

            actions.after(
                button
            );

        } else {

            commentElement.appendChild(
                button
            );

        }

    }


    /* -----------------------------------------------------
       تجهيز تعليق واحد
       ----------------------------------------------------- */

    function WFXP_prepareSingleComment(
        commentElement
    ) {

        WFXP_prepareComment(
            commentElement
        );

        WFXP_prepareReplies(
            commentElement
        );

        WFXP_createRepliesButton(
            commentElement
        );

    }


    /* -----------------------------------------------------
       ظهور التعليقات بالتسلسل
       ----------------------------------------------------- */

    function WFXP_animateComments(
        list
    ) {

        if (!list) {
            return;
        }

        const comments =
            Array.from(
                list.children
            ).filter(
                element =>
                    element.classList.contains(
                        "comment"
                    )
            );


        comments.forEach(
            (comment, index) => {

                WFXP_prepareSingleComment(
                    comment
                );


                if (
                    !WFXP_COMMENT_SETTINGS
                        .enableSequentialComments
                ) {

                    comment.classList.add(
                        "wfxp-visible"
                    );

                    return;

                }


                comment.classList.remove(
                    "wfxp-visible"
                );

                comment.classList.add(
                    "wfxp-enter"
                );


                setTimeout(
                    () => {

                        comment.classList.remove(
                            "wfxp-enter"
                        );

                        comment.classList.add(
                            "wfxp-visible"
                        );

                    },
                    index *
                    WFXP_COMMENT_SETTINGS
                        .commentDelay
                );

            }
        );

    }


    /* -----------------------------------------------------
       تحسين تفاعل الأزرار
       ----------------------------------------------------- */

    function WFXP_prepareReactionButtons(
        list
    ) {

        if (!list) {
            return;
        }


        const buttons =
            list.querySelectorAll(
                ".comment-like, .comment-dislike, .comment-reply, .comment-delete"
            );


        buttons.forEach(button => {

            if (
                button.dataset.wfxpReady ===
                "true"
            ) {
                return;
            }


            button.dataset.wfxpReady =
                "true";


            button.addEventListener(
                "click",
                () => {

                    if (
                        !WFXP_COMMENT_SETTINGS
                            .enableReactionAnimation
                    ) {
                        return;
                    }


                    button.classList.remove(
                        "wfxp-click"
                    );


                    void button.offsetWidth;


                    button.classList.add(
                        "wfxp-click"
                    );


                    setTimeout(
                        () => {

                            button.classList.remove(
                                "wfxp-click"
                            );

                        },
                        350
                    );

                }
            );

        });

    }


    /* -----------------------------------------------------
       مراقبة ظهور عناصر جديدة
       ----------------------------------------------------- */

    function WFXP_observeComments(
        list
    ) {

        if (!list) {
            return;
        }


        if (
            list.dataset.wfxpObserver ===
            "true"
        ) {
            return;
        }


        list.dataset.wfxpObserver =
            "true";


        const observer =
            new MutationObserver(
                () => {

                    WFXP_animateComments(
                        list
                    );

                    WFXP_prepareReactionButtons(
                        list
                    );

                }
            );


        observer.observe(
            list,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* -----------------------------------------------------
       تحسين loadComments الأصلي
       ----------------------------------------------------- */

    function WFXP_hookCommentsLoader() {

        if (
            typeof window.loadComments !==
            "function"
        ) {
            return false;
        }


        if (
            window.loadComments.__WFXP_HOOKED__
        ) {
            return true;
        }


        const originalLoadComments =
            window.loadComments;


        async function WFXP_loadComments(
            postId,
            article
        ) {

            const result =
                await originalLoadComments(
                    postId,
                    article
                );


            try {

                const list =
                    article.querySelector(
                        ".comments-list"
                    );


                if (list) {

                    WFXP_animateComments(
                        list
                    );

                    WFXP_prepareReactionButtons(
                        list
                    );

                    WFXP_observeComments(
                        list
                    );

                }

            } catch(error) {

                console.error(
                    "[WFXP] Comments enhancement error:",
                    error
                );

            }


            return result;

        }


        WFXP_loadComments
            .__WFXP_HOOKED__ = true;


        window.loadComments =
            WFXP_loadComments;


        return true;

    }


    /* -----------------------------------------------------
       انتظار النظام الأصلي
       ----------------------------------------------------- */

    function WFXP_waitForComments() {

        if (
            WFXP_hookCommentsLoader()
        ) {

            console.log(
                "[WFXP] Comments engine ready."
            );

            return;

        }


        setTimeout(
            WFXP_waitForComments,
            300
        );

    }


    /* -----------------------------------------------------
       بدء النظام
       ----------------------------------------------------- */

    WFXP_waitForComments();


})();
