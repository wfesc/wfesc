/* =========================================================
   WFESC POSTS UI
   File: posts-featwres/posts-ui.js
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


    FEATURES.ui =
        FEATURES.ui || {};

    FEATURES.ui.loaded =
        true;

    FEATURES.ui.version =
        "1.0.0";


    /*
     * -------------------------------------------------------
     * STATE
     * -------------------------------------------------------
     */

    const UI_STATE = {

        initialized: false,

        lastActivePost: null,

        lastClickedButton: null,

        observers: [],

        timers: []

    };


    FEATURES.ui.state =
        UI_STATE;


    /*
     * -------------------------------------------------------
     * SAFE ELEMENT HELPERS
     * -------------------------------------------------------
     */

    function getElement(
        selector,
        parent = document
    ) {

        if (
            !selector ||
            !parent
        ) {

            return null;

        }


        try {

            return parent.querySelector(
                selector
            );

        } catch (
            error
        ) {

            console.error(
                "[WFESC POSTS UI]",
                "Selector error:",
                selector,
                error
            );

            return null;

        }

    }


    function getElements(
        selector,
        parent = document
    ) {

        if (
            !selector ||
            !parent
        ) {

            return [];

        }


        try {

            return Array.from(
                parent.querySelectorAll(
                    selector
                )
            );

        } catch (
            error
        ) {

            console.error(
                "[WFESC POSTS UI]",
                "Selector error:",
                selector,
                error
            );

            return [];

        }

    }


    /*
     * -------------------------------------------------------
     * POST DETECTION
     * -------------------------------------------------------
     */

    function findPostFromElement(
        element
    ) {

        if (
            !element
        ) {

            return null;

        }


        const post =
            element.closest(
                ".post"
            );


        if (
            post
        ) {

            return post;

        }


        return element.closest(
            "[data-post-id]"
        );

    }


    function getPostId(
        post
    ) {

        if (
            !post
        ) {

            return "";

        }


        return String(
            post.dataset.id
            ||
            post.dataset.postId
            ||
            ""
        );

    }


    FEATURES.ui.findPostFromElement =
        findPostFromElement;


    FEATURES.ui.getPostId =
        getPostId;


    /*
     * -------------------------------------------------------
     * ACTIVE POST
     * -------------------------------------------------------
     */

    function setActivePost(
        post
    ) {

        if (
            !post
        ) {

            return;

        }


        UI_STATE.lastActivePost =
            post;


        getElements(
            ".wfesc-ui-active-post"
        ).forEach(
            function (
                item
            ) {

                item.classList.remove(
                    "wfesc-ui-active-post"
                );

            }
        );


        post.classList.add(
            "wfesc-ui-active-post"
        );

    }


    function clearActivePost(){

        getElements(
            ".wfesc-ui-active-post"
        ).forEach(
            function (
                item
            ) {

                item.classList.remove(
                    "wfesc-ui-active-post"
                );

            }
        );


        UI_STATE.lastActivePost =
            null;

    }


    FEATURES.ui.setActivePost =
        setActivePost;


    FEATURES.ui.clearActivePost =
        clearActivePost;


    /*
     * -------------------------------------------------------
     * BUTTON FEEDBACK
     * -------------------------------------------------------
     */

    function buttonFeedback(
        button
    ) {

        if (
            !button
        ) {

            return;

        }


        UI_STATE.lastClickedButton =
            button;


        button.classList.remove(
            "wfesc-ui-button-pulse"
        );


        void button.offsetWidth;


        button.classList.add(
            "wfesc-ui-button-pulse"
        );


        const timer =
            window.setTimeout(
                function () {

                    button.classList.remove(
                        "wfesc-ui-button-pulse"
                    );

                },
                380
            );


        UI_STATE.timers.push(
            timer
        );

    }


    FEATURES.ui.buttonFeedback =
        buttonFeedback;


    /*
     * -------------------------------------------------------
     * SAFE TOAST
     * -------------------------------------------------------
     */

    function showToast(
        message
    ) {

        if (
            !message
        ) {

            return;

        }


        let toast =
            document.getElementById(
                "wfesc-posts-ui-toast"
            );


        if (
            !toast
        ) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "wfesc-posts-ui-toast";

            toast.className =
                "wfesc-posts-ui-toast";


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            String(
                message
            );


        toast.classList.add(
            "show"
        );


        window.clearTimeout(
            toast._wfescTimer
        );


        toast._wfescTimer =
            window.setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                2200
            );

    }


    FEATURES.ui.showToast =
        showToast;


    /*
     * -------------------------------------------------------
     * DISABLE / ENABLE BUTTON
     * -------------------------------------------------------
     */

    function setButtonBusy(
        button,
        busy
    ) {

        if (
            !button
        ) {

            return;

        }


        if (
            busy
        ) {

            if (
                button.dataset.wfescOriginalHtml
                === undefined
            ) {

                button.dataset.wfescOriginalHtml =
                    button.innerHTML;

            }


            button.disabled =
                true;

            button.classList.add(
                "wfesc-ui-busy"
            );

        } else {

            button.disabled =
                false;

            button.classList.remove(
                "wfesc-ui-busy"
            );


            if (
                button.dataset.wfescOriginalHtml
                !== undefined
            ) {

                button.innerHTML =
                    button.dataset.wfescOriginalHtml;

            }

        }

    }


    FEATURES.ui.setButtonBusy =
        setButtonBusy;


    /*
     * -------------------------------------------------------
     * EVENT DELEGATION
     * -------------------------------------------------------
     *
     * هذا الملف لا ينفذ عمليات الإعجاب أو التعليق أو الحفظ
     * بنفسه.
     *
     * العمليات الأساسية تبقى داخل posts.html.
     *
     * هنا فقط نوفر تفاعل الواجهة بدون إنشاء
     * مستمعين مكررين لنفس الأزرار.
     *
     * -------------------------------------------------------
     */

    function handlePostClick(
        event
    ) {

        const target =
            event.target;


        if (
            !target
        ) {

            return;

        }


        const button =
            target.closest(
                "button"
            );


        const post =
            findPostFromElement(
                target
            );


        if (
            post
        ) {

            setActivePost(
                post
            );

        }


        if (
            button
        ) {

            buttonFeedback(
                button
            );

        }

    }


    function handlePostFocus(
        event
    ) {

        const post =
            findPostFromElement(
                event.target
            );


        if (
            post
        ) {

            setActivePost(
                post
            );

        }

    }


    /*
     * -------------------------------------------------------
     * ADD EVENT LISTENERS ONCE
     * -------------------------------------------------------
     */

    function bindEvents(){

        if (
            UI_STATE.eventsBound
        ) {

            return;

        }


        UI_STATE.eventsBound =
            true;


        document.addEventListener(
            "click",
            handlePostClick,
            true
        );


        document.addEventListener(
            "focusin",
            handlePostFocus,
            true
        );

    }


    /*
     * -------------------------------------------------------
     * DYNAMIC POST OBSERVER
     * -------------------------------------------------------
     *
     * المنشورات تُنشأ ديناميكياً من posts.html.
     * لذلك لا نعتمد على وجودها لحظة تحميل الملف.
     *
     * -------------------------------------------------------
     */

    function observePosts(){

        if (
            UI_STATE.observer
        ) {

            return;

        }


        const postsList =
            document.getElementById(
                "posts-list"
            );


        if (
            !postsList ||
            !window.MutationObserver
        ) {

            return;

        }


        const observer =
            new MutationObserver(
                function () {

                    /*
                     * لا نعيد تحميل المنشورات.
                     * لا نعيد ربط الأحداث.
                     *
                     * Event delegation يعمل تلقائياً.
                     */

                }
            );


        observer.observe(
            postsList,
            {
                childList:true,
                subtree:true
            }
        );


        UI_STATE.observer =
            observer;


        UI_STATE.observers.push(
            observer
        );

    }


    /*
     * -------------------------------------------------------
     * UI STYLE
     * -------------------------------------------------------
     */

    function addStyle(){

        if (
            document.getElementById(
                "wfesc-posts-ui-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "wfesc-posts-ui-style";


        style.textContent = `

            .wfesc-ui-button-pulse {
                animation:
                    wfescPostsButtonPulse
                    0.38s
                    ease;
            }

            @keyframes wfescPostsButtonPulse {

                0% {
                    transform:
                        scale(1);
                }

                45% {
                    transform:
                        scale(0.90);
                }

                100% {
                    transform:
                        scale(1);
                }

            }


            .wfesc-ui-busy {
                cursor:
                    wait !important;

                opacity:
                    0.65 !important;
            }


            .wfesc-ui-active-post {
                transition:
                    box-shadow
                    0.25s
                    ease;
            }


            .wfesc-posts-ui-toast {

                position:
                    fixed;

                left:
                    50%;

                bottom:
                    28px;

                transform:
                    translate(-50%, 18px);

                opacity:
                    0;

                pointer-events:
                    none;

                z-index:
                    999999;

                padding:
                    10px 16px;

                border-radius:
                    14px;

                background:
                    rgba(20,20,20,0.94);

                color:
                    #fff;

                border:
                    1px solid
                    rgba(255,255,255,0.12);

                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,0.35);

                font-size:
                    13px;

                transition:
                    opacity
                    0.22s
                    ease,
                    transform
                    0.22s
                    ease;

            }


            .wfesc-posts-ui-toast.show {

                opacity:
                    1;

                transform:
                    translate(-50%, 0);

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /*
     * -------------------------------------------------------
     * INITIALIZATION
     * -------------------------------------------------------
     */

    function initialize(){

        if (
            UI_STATE.initialized
        ) {

            return;

        }


        UI_STATE.initialized =
            true;


        addStyle();

        bindEvents();

        observePosts();


        console.log(
            "[WFESC POSTS UI] تم تحميل posts-ui.js"
        );

    }


    /*
     * -------------------------------------------------------
     * WAIT FOR DOM
     * -------------------------------------------------------
     */

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


    /*
     * -------------------------------------------------------
     * PUBLIC INITIALIZER
     * -------------------------------------------------------
     */

    FEATURES.ui.initialize =
        initialize;


})(); 
