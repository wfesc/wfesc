/* =========================================================
   WFESC POSTS EXTENSION
   WFXP REACTIONS ENGINE
   تحسين تفاعل الإعجاب وعدم الإعجاب
   ========================================================= */

(() => {

    "use strict";

    if (window.WFXP_REACTIONS_ENGINE_LOADED) {
        return;
    }

    window.WFXP_REACTIONS_ENGINE_LOADED = true;


    const WFXP_REACTION_SETTINGS = {

        animationDuration: 280,

        scale: 1.18,

        enableAnimation: true,

        enableInstantFeedback: true

    };


    function WFXP_animateButton(button) {

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


    function WFXP_updateVisualState(
        button
    ) {

        if (!button) {
            return;
        }

        const isActive =
            button.classList.contains(
                "active"
            );

        if (isActive) {

            button.classList.add(
                "wfxp-reaction-active"
            );

        } else {

            button.classList.remove(
                "wfxp-reaction-active"
            );

        }

    }


    function WFXP_prepareButton(
        button
    ) {

        if (!button) {
            return;
        }

        if (
            button.dataset.wfxpReactionReady ===
            "true"
        ) {
            WFXP_updateVisualState(
                button
            );

            return;
        }

        button.dataset.wfxpReactionReady =
            "true";


        button.addEventListener(
            "click",
            () => {

                WFXP_animateButton(
                    button
                );


                /*
                 * ننتظر لحظة قصيرة حتى ينفذ
                 * النظام الأصلي reactComment()
                 * ويحدث حالة active.
                 */

                setTimeout(
                    () => {

                        WFXP_updateVisualState(
                            button
                        );

                    },
                    40
                );

            }
        );


        WFXP_updateVisualState(
            button
        );

    }


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

                WFXP_prepareButton(
                    button
                );

            }
        );

    }


    function WFXP_observeReactionButtons(
        list
    ) {

        if (!list) {
            return;
        }

        if (
            list.dataset.wfxpReactionObserver ===
            "true"
        ) {
            return;
        }

        list.dataset.wfxpReactionObserver =
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
                subtree: true,
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );

    }


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

                WFXP_observeReactionButtons(
                    list
                );

            }
        );


        console.log(
            "[WFXP] Reactions engine ready."
        );

    }


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


    window.WFXP_REACTIONS = {

        refresh:
            WFXP_startReactionsEngine,

        animate:
            WFXP_animateButton

    };


})();
