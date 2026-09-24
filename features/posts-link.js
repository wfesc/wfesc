(function () {
    "use strict";

    function setupPostsButton() {

        const aboutButton = document.querySelector(
            '.hero a.main-btn[href="#about"]'
        );

        if (!aboutButton) {
            setTimeout(setupPostsButton, 200);
            return;
        }

        if (document.getElementById("wfesc-posts-button")) {
            return;
        }

        const button = document.createElement("a");

        button.id = "wfesc-posts-button";
        button.className = "main-btn";
        button.href = "./posts.html";
        button.textContent = "عرض المنشورات";
        button.style.marginTop = "12px";

        aboutButton.after(button);


        /* شاشة الانتقال */

        const screen = document.createElement("div");

        screen.id = "wfesc-transition";

        screen.innerHTML = `
            <div class="wfesc-transition-box">

                <div class="wfesc-transition-logo">
                    WFESC
                </div>

                <div class="wfesc-transition-loading">
                    <div></div>
                </div>

                <div class="wfesc-transition-text">
                    جاري تحميل المنشورات...
                </div>

            </div>
        `;

        document.body.appendChild(screen);


        /* التصميم */

        const style = document.createElement("style");

        style.textContent = `
        
        #wfesc-transition {
            position: fixed;
            inset: 0;
            z-index: 999999999;

            background: #050505;

            display: flex;
            align-items: center;
            justify-content: center;

            opacity: 0;
            visibility: hidden;

            transition: opacity .35s ease;
        }

        #wfesc-transition.show {
            opacity: 1;
            visibility: visible;
        }

        .wfesc-transition-box {
            width: 85%;
            max-width: 360px;
            text-align: center;
        }

        .wfesc-transition-logo {
            color: #fff;

            font-family: Arial, sans-serif;

            font-size: 42px;
            font-weight: bold;

            letter-spacing: 9px;

            opacity: 0;

            transform: scale(.8);
        }

        #wfesc-transition.show
        .wfesc-transition-logo {

            animation:
                wfescLogoAnimation
                .7s
                ease
                forwards;
        }

        .wfesc-transition-loading {

            width: 100%;
            height: 2px;

            margin-top: 30px;

            background: #191919;

            overflow: hidden;

            opacity: 0;
        }

        #wfesc-transition.show
        .wfesc-transition-loading {

            opacity: 1;
        }

        .wfesc-transition-loading div {

            width: 35%;
            height: 100%;

            background: #fff;

            transform: translateX(300%);
        }

        #wfesc-transition.show
        .wfesc-transition-loading div {

            animation:
                wfescLoadingAnimation
                1.1s
                ease-in-out
                infinite;
        }

        .wfesc-transition-text {

            margin-top: 16px;

            color: #777;

            font-size: 12px;

            opacity: 0;
        }

        #wfesc-transition.show
        .wfesc-transition-text {

            animation:
                wfescTextAnimation
                .5s
                ease
                .4s
                forwards;
        }

        @keyframes wfescLogoAnimation {

            0% {
                opacity: 0;
                transform: scale(.8);
            }

            60% {
                opacity: 1;
                transform: scale(1.08);
            }

            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes wfescLoadingAnimation {

            0% {
                transform: translateX(300%);
            }

            100% {
                transform: translateX(-300%);
            }
        }

        @keyframes wfescTextAnimation {

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


        /* الضغط على عرض المنشورات */

        button.addEventListener("click", function (event) {

            event.preventDefault();

            screen.classList.add("show");

            /*
             * ننتظر حتى تظهر الشاشة
             * والأنميشن قبل الانتقال
             */

            setTimeout(function () {

                window.location.assign("./posts.html");

            }, 2200);

        });

    }


    setupPostsButton();

})();
