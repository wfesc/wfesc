/* =========================================================
   WFESC POSTS EXTENSION
   WFXP REPLIES ENGINE
   نظام الردود الثانوي
   ========================================================= */

(() => {

    "use strict";

    if (window.WFXP_REPLIES_ENGINE_LOADED) {
        return;
    }

    window.WFXP_REPLIES_ENGINE_LOADED = true;


    const WFXP_REPLIES_SETTINGS = {

        animationDuration: 300,

        delayBetweenReplies: 90,

        hideRepliesInitially: true,

        showRepliesText: "عرض الردود",

        hideRepliesText: "إخفاء الردود"

    };


    function WFXP_getRepliesBox(comment) {

        if (!comment) {
            return null;
        }

        return comment.querySelector(
            ".replies"
        );

    }


    function WFXP_getReplies(comment) {

        const repliesBox =
            WFXP_getRepliesBox(comment);

        if (!repliesBox) {
            return [];
        }

        return Array.from(
            repliesBox.children
        );

    }


    function WFXP_updateRepliesButton(
        comment
    ) {

        if (!comment) {
            return;
        }

        const replies =
            WFXP_getReplies(comment);

        const button =
            comment.querySelector(
                ".wfxp-show-replies"
            );

        if (!button) {
            return;
        }

        const count =
            button.querySelector(
                ".wfxp-replies-count"
            );

        if (count) {

            count.textContent =
                replies.length;

        }

    }


    function WFXP_hideReplies(
        comment
    ) {

        const repliesBox =
            WFXP_getRepliesBox(comment);

        if (!repliesBox) {
            return;
        }

        repliesBox.style.display =
            "none";

        repliesBox.classList.remove(
            "wfxp-replies-open"
        );

    }


    function WFXP_showReplies(
        comment
    ) {

        const repliesBox =
            WFXP_getRepliesBox(comment);

        if (!repliesBox) {
            return;
        }

        const replies =
            WFXP_getReplies(comment);

        if (!replies.length) {
            return;
        }

        repliesBox.style.display =
            "block";

        repliesBox.classList.add(
            "wfxp-replies-open"
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
                    WFXP_REPLIES_SETTINGS
                        .delayBetweenReplies
                );

            }
        );

    }


    function WFXP_toggleReplies(
        comment,
        button
    ) {

        const repliesBox =
            WFXP_getRepliesBox(comment);

        if (!repliesBox) {
            return;
        }

        const isHidden =
            repliesBox.style.display ===
            "none";


        if (isHidden) {

            WFXP_showReplies(
                comment
            );

            button.classList.add(
                "wfxp-open"
            );

            const text =
                button.querySelector(
                    "span:nth-child(2)"
                );

            if (text) {

                text.textContent =
                    WFXP_REPLIES_SETTINGS
                        .hideRepliesText;

            }

        } else {

            WFXP_hideReplies(
                comment
            );

            button.classList.remove(
                "wfxp-open"
            );

            const text =
                button.querySelector(
                    "span:nth-child(2)"
                );

            if (text) {

                text.textContent =
                    WFXP_REPLIES_SETTINGS
                        .showRepliesText;

            }

        }

    }


    function WFXP_prepareReplyButton(
        comment
    ) {

        if (!comment) {
            return;
        }

        const button =
            comment.querySelector(
                ".wfxp-show-replies"
            );

        if (!button) {
            return;
        }

        if (
            button.dataset.wfxpRepliesReady ===
            "true"
        ) {
            WFXP_updateRepliesButton(
                comment
            );

            return;
        }

        button.dataset.wfxpRepliesReady =
            "true";


        WFXP_updateRepliesButton(
            comment
        );


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                WFXP_toggleReplies(
                    comment,
                    button
                );

            }
        );

    }


    function WFXP_prepareAllComments(
        list
    ) {

        if (!list) {
            return;
        }

        const comments =
            list.querySelectorAll(
                ".comment"
            );


        comments.forEach(
            comment => {

                WFXP_prepareReplyButton(
                    comment
                );

            }
        );

    }


    function WFXP_hideAllReplies(
        list
    ) {

        if (!list) {
            return;
        }

        const comments =
            list.querySelectorAll(
                ".comment"
            );


        comments.forEach(
            comment => {

                const replies =
                    WFXP_getReplies(
                        comment
                    );

                if (!replies.length) {
                    return;
                }

                const button =
                    comment.querySelector(
                        ".wfxp-show-replies"
                    );

                if (!button) {
                    return;
                }

                WFXP_hideReplies(
                    comment
                );

                button.classList.remove(
                    "wfxp-open"
                );


                const text =
                    button.querySelector(
                        "span:nth-child(2)"
                    );

                if (text) {

                    text.textContent =
                        WFXP_REPLIES_SETTINGS
                            .showRepliesText;

                }

            }
        );

    }


    function WFXP_processReplies(
        list
    ) {

        if (!list) {
            return;
        }

        WFXP_prepareAllComments(
            list
        );


        if (
            WFXP_REPLIES_SETTINGS
                .hideRepliesInitially
        ) {

            WFXP_hideAllReplies(
                list
            );

        }

    }


    function WFXP_observeReplies(
        list
    ) {

        if (!list) {
            return;
        }

        if (
            list.dataset.wfxpRepliesObserver ===
            "true"
        ) {
            return;
        }

        list.dataset.wfxpRepliesObserver =
            "true";


        const observer =
            new MutationObserver(
                () => {

                    WFXP_prepareAllComments(
                        list
                    );

                    WFXP_prepareAllComments(
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


    function WFXP_startRepliesEngine() {

        const lists =
            document.querySelectorAll(
                ".comments-list"
            );


        lists.forEach(
            list => {

                WFXP_processReplies(
                    list
                );

                WFXP_observeReplies(
                    list
                );

            }
        );


        console.log(
            "[WFXP] Replies engine ready."
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            WFXP_startRepliesEngine
        );

    } else {

        WFXP_startRepliesEngine();

    }


    window.WFXP_REPLIES = {

        refresh: WFXP_startRepliesEngine,

        show: WFXP_showReplies,

        hide: WFXP_hideReplies,

        updateCount:
            WFXP_updateRepliesButton

    };


})();
