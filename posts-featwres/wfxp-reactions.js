/* =========================================================
   WFESC POSTS EXTENSION
   WFXP REACTIONS ENGINE
   نظام الإعجابات وعدم الإعجاب المحفوظ في Supabase
   ========================================================= */

(() => {

    "use strict";

    if (window.WFXP_REACTIONS_ENGINE_LOADED) {
        return;
    }

    window.WFXP_REACTIONS_ENGINE_LOADED = true;


    const WFXP_REACTION_SETTINGS = {

        animationDuration: 280,

        enableAnimation: true

    };


    /* =====================================================
       تحديث عدد الإعجابات من Supabase
       ===================================================== */

    async function WFXP_refreshReactionCount(
        commentId,
        likeButton,
        dislikeButton
    ) {

        if (!commentId) {
            return;
        }

        if (
            typeof supabaseClient ===
            "undefined"
        ) {
            return;
        }


        try {

            const likes =
                await supabaseClient
                    .from("comment_likes")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .eq(
                        "comment_id",
                        commentId
                    );


            const dislikes =
                await supabaseClient
                    .from("comment_dislikes")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .eq(
                        "comment_id",
                        commentId
                    );


            if (
                likes.error
            ) {

                console.error(
                    "[WFXP] Likes count error:",
                    likes.error
                );

            }


            if (
                dislikes.error
            ) {

                console.error(
                    "[WFXP] Dislikes count error:",
                    dislikes.error
                );

            }


            if (
                likeButton
            ) {

                const span =
                    likeButton.querySelector(
                        "span"
                    );

                if (span) {

                    span.textContent =
                        likes.count || 0;

                }

            }


            if (
                dislikeButton
            ) {

                const span =
                    dislikeButton.querySelector(
                        "span"
                    );

                if (span) {

                    span.textContent =
                        dislikes.count || 0;

                }

            }


            /*
             * معرفة هل المستخدم الحالي
             * عامل Like أو Dislike
             */

            if (
                typeof currentUser !==
                "undefined" &&
                currentUser
            ) {


                const myLike =
                    await supabaseClient
                        .from("comment_likes")
                        .select("id")
                        .eq(
                            "comment_id",
                            commentId
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        )
                        .maybeSingle();


                const myDislike =
                    await supabaseClient
                        .from("comment_dislikes")
                        .select("id")
                        .eq(
                            "comment_id",
                            commentId
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        )
                        .maybeSingle();


                if (likeButton) {

                    likeButton.classList.toggle(
                        "active",
                        !!myLike.data
                    );

                }


                if (dislikeButton) {

                    dislikeButton.classList.toggle(
                        "active",
                        !!myDislike.data
                    );

                }

            }

        } catch (error) {

            console.error(
                "[WFXP] Reaction refresh error:",
                error
            );

        }

    }


    /* =====================================================
       أنميشن القلب
       ===================================================== */

    function WFXP_animateButton(
        button
    ) {

        if (!button) {
            return;
        }

        if (
            !WFXP_REACTION_SETTINGS
                .enableAnimation
        ) {
            return;
        }


        button.classList.remove(
            "wfxp-reaction-pop"
        );


        void button.offsetWidth;


        button.classList.add(
            "wfxp-reaction-pop"
        );


        setTimeout(
            () => {

                button.classList.remove(
                    "wfxp-reaction-pop"
                );

            },
            WFXP_REACTION_SETTINGS
                .animationDuration
        );

    }


    /* =====================================================
       تجهيز أزرار التفاعل
       ===================================================== */

    function WFXP_prepareReactionButton(
        button
    ) {

        if (!button) {
            return;
        }


        if (
            button.dataset
                .wfxpReactionReady ===
            "true"
        ) {
            return;
        }


        button.dataset
            .wfxpReactionReady =
            "true";


        button.addEventListener(
            "click",
            () => {

                WFXP_animateButton(
                    button
                );


                /*
                 * نترك reactComment()
                 * الأصلي ينفذ أولاً.
                 *
                 * بعدها نعيد قراءة العدد
                 * الحقيقي من Supabase.
                 */

                setTimeout(
                    () => {

                        const wrapper =
                            button.closest(
                                ".comment"
                            );

                        if (!wrapper) {
                            return;
                        }


                        const commentId =
                            wrapper.dataset.id;

                        if (!commentId) {
                            return;
                        }


                        const likeButton =
                            wrapper.querySelector(
                                ".comment-like"
                            );

                        const dislikeButton =
                            wrapper.querySelector(
                                ".comment-dislike"
                            );


                        WFXP_refreshReactionCount(
                            commentId,
                            likeButton,
                            dislikeButton
                        );

                    },
                    250
                );

            }
        );

    }


    /* =====================================================
       تجهيز جميع التعليقات
       ===================================================== */

    function WFXP_prepareReactionButtons(
        root
    ) {

        if (!root) {
            return;
        }


        const buttons =
            root.querySelectorAll(
                ".comment-like, .comment-dislike"
            );


        buttons.forEach(
            button => {

                WFXP_prepareReactionButton(
                    button
                );

            }
        );

    }


    /* =====================================================
       تحديث جميع أعداد التفاعلات
       ===================================================== */

    async function WFXP_refreshAllCounts(
        root
    ) {

        if (!root) {
            return;
        }


        const comments =
            root.querySelectorAll(
                ".comment"
            );


        for (
            const comment
            of comments
        ) {

            const commentId =
                comment.dataset.id;

            if (!commentId) {
                continue;
            }


            const likeButton =
                comment.querySelector(
                    ".comment-like"
                );

            const dislikeButton =
                comment.querySelector(
                    ".comment-dislike"
                );


            await WFXP_refreshReactionCount(
                commentId,
                likeButton,
                dislikeButton
            );

        }

    }


    /* =====================================================
       مراقبة التعليقات الجديدة
       ===================================================== */

    function WFXP_observeReactions(
        list
    ) {

        if (!list) {
            return;
        }


        if (
            list.dataset
                .wfxpReactionObserver ===
            "true"
        ) {
            return;
        }


        list.dataset
            .wfxpReactionObserver =
            "true";


        const observer =
            new MutationObserver(
                () => {

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


    /* =====================================================
       تشغيل النظام
       ===================================================== */

    function WFXP_startReactionsEngine() {

        const lists =
            document.querySelectorAll(
                ".comments-list"
            );


        lists.forEach(
            list => {

                WFXP_prepareReactionButtons(
                    list
                );


                WFXP_refreshAllCounts(
                    list
                );


                WFXP_observeReactions(
                    list
                );

            }
        );


        console.log(
            "[WFXP] Reactions engine ready."
        );

    }


    /* =====================================================
       بدء التشغيل
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            WFXP_startReactionsEngine
        );

    } else {

        WFXP_startReactionsEngine();

    }


    /* =====================================================
       واجهة النظام
       ===================================================== */

    window.WFXP_REACTIONS = {

        refresh:
            WFXP_startReactionsEngine,

        refreshCounts:
            WFXP_refreshAllCounts,

        animate:
            WFXP_animateButton

    };


})();
