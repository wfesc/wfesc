(function () {
    "use strict";

    function addPostsButton() {

        if (document.getElementById("wfesc-posts-button")) {
            return;
        }

        const aboutButton = document.querySelector(
            '.hero a.main-btn[href="#about"]'
        );

        if (!aboutButton) {
            return;
        }

        const postsButton = document.createElement("a");

        postsButton.id = "wfesc-posts-button";
        postsButton.className = "main-btn";
        postsButton.href = "./posts.html";
        postsButton.textContent = "عرض المنشورات";
        postsButton.style.marginTop = "12px";

        aboutButton.insertAdjacentElement(
            "afterend",
            postsButton
        );


        /* شاشة الانتقال */

        const transition = document.createElement("div");

        transition.id = "wfesc-page-transition";

        transition.innerHTML = `
            <div class="wfesc-transition-content">

                <div class="wfesc-transition-logo">
                    WFESC
                </div>

                <div class="wfesc-transition-line">
                    <span></span>
                </div>

                <div class="wfesc-transition-text">
                    جاري الانتقال إلى المنشورات...
                </div>

            </div>
        `;

        document.body.appendChild(transition);


        /* CSS الخاص بالانتقال */

        const style = document.createElement("style");

        style.textContent = `

            #wfesc-page-transition {
                position: fixed;
                inset: 0;
                z-index: 999999;

                background: #050505;

                display: flex;
                align-items: center;
                justify-content: center;

                opacity: 0;
                visibility: hidden;

                pointer-events: none;

                transition:
                    opacity .45s ease,
                    visibility .45s ease;
            }

            #wfesc-page-transition.active {
                opacity: 1;
                visibility: visible;
                pointer-events: all;
            }

            .wfesc-transition-content {
                width: 85%;
                max-width: 380px;

                text-align: center;
            }

            .wfesc-transition-logo {
                font-size: 42px;
                font-weight: bold;

                letter-spacing: 9px;

                opacity: 0;

                transform: scale(.85);

                animation: none;
            }

            #wfesc-page-transition.active
            .wfesc-transition-logo {

                animation:
                    wfescLogoIn .7s ease forwards;
            }

            .wfesc-transition-line {

                width: 100%;
                height: 2px;

                margin-top: 30px;

                background: #191919;

                overflow: hidden;

                opacity: 0;
            }

            #wfesc-page-transition.active
            .wfesc-transition-line {

                animation:
                    wfescLineIn .4s ease .35s forwards;
            }

            .wfesc-transition-line span {

                display: block;

                width: 35%;
                height: 100%;

                background: #fff;

                transform: translateX(300%);
            }

            #wfesc-page-transition.active
            .wfesc-transition-line span {

                animation:
                    wfescLoading 1.15s ease-in-out .4s infinite;
            }

            .wfesc-transition-text {

                margin-top: 15px;

                color: #777;

                font-size: 12px;

                opacity: 0;
            }

            #wfesc-page-transition.active
            .wfesc-transition-text {

                animation:
                    wfescTextIn .5s ease .55s forwards;
            }

            @keyframes wfescLogoIn {

                0% {
                    opacity: 0;
                    transform: scale(.85);
                }

                60% {
                    opacity: 1;
                    transform: scale(1.05);
                }

                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes wfescLineIn {

                from {
                    opacity: 0;
                    transform: scaleX(.3);
                }

                to {
                    opacity: 1;
                    transform: scaleX(1);
                }
            }

            @keyframes wfescLoading {

                0% {
                    transform: translateX(300%);
                }

                100% {
                    transform: translateX(-300%);
                }
            }

            @keyframes wfescTextIn {

                from {
                    opacity: 0;
                    transform: translateY(8px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

        `;

        document.head.appendChild(style);


        /* عند الضغط */

        postsButton.addEventListener("click", function (event) {

            event.preventDefault();

            transition.classList.add("active");

            setTimeout(function () {

                window.location.href = "./posts.html";

            }, 1700);

        });

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            addPostsButton
        );

    } else {

        addPostsButton();

    }

})();
