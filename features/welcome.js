(function () {
    "use strict";

    function initWelcome() {

        if (document.getElementById("wfesc-welcome-screen")) {
            return;
        }

        const style = document.createElement("style");

        style.textContent = `
            #wfesc-welcome-screen {
                position: fixed;
                inset: 0;
                z-index: 99998;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(0,0,0,.92);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                opacity: 0;
                visibility: hidden;
                transition: opacity .5s ease, visibility .5s ease;
            }

            #wfesc-welcome-screen.active {
                opacity: 1;
                visibility: visible;
            }

            .wfesc-welcome-box {
                width: min(430px, 100%);
                padding: 32px 25px;
                text-align: center;
                background: #0b0b0b;
                color: #fff;
                border: 1px solid #252525;
                border-radius: 20px;
                box-shadow: 0 25px 80px rgba(0,0,0,.55);
                transform: translateY(20px) scale(.97);
                transition: transform .5s ease;
            }

            #wfesc-welcome-screen.active .wfesc-welcome-box {
                transform: translateY(0) scale(1);
            }

            .wfesc-welcome-image {
                width: 95px;
                height: 95px;
                object-fit: cover;
                border-radius: 50%;
                display: block;
                margin: 0 auto 22px;
                border: 2px solid #333;
                box-shadow: 0 0 30px rgba(255,255,255,.08);
            }

            .wfesc-welcome-box h2 {
                margin: 0 0 12px;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 23px;
            }

            .wfesc-welcome-box p {
                margin: 0 auto 28px;
                color: #999;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 14px;
                line-height: 1.8;
            }

            #wfesc-welcome-continue {
                width: 100%;
                padding: 13px 20px;
                border: 1px solid #333;
                border-radius: 10px;
                background: #fff;
                color: #000;
                cursor: pointer;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 14px;
                transition: transform .2s ease, background .3s ease;
            }

            #wfesc-welcome-continue:hover {
                background: #ddd;
                transform: translateY(-2px);
            }

            #wfesc-welcome-continue:active {
                transform: scale(.97);
            }

            body.wfesc-light #wfesc-welcome-screen {
                background: rgba(245,245,245,.88);
            }

            body.wfesc-light .wfesc-welcome-box {
                background: #fff;
                color: #111;
                border-color: #ddd;
            }

            body.wfesc-light .wfesc-welcome-box p {
                color: #666;
            }

            @media (max-width: 700px) {
                .wfesc-welcome-box {
                    padding: 28px 20px;
                }

                .wfesc-welcome-box h2 {
                    font-size: 20px;
                }
            }
        `;

        document.head.appendChild(style);

        const screen = document.createElement("div");

        screen.id = "wfesc-welcome-screen";

        screen.innerHTML = `
            <div class="wfesc-welcome-box">

                <img
                    class="wfesc-welcome-image"
                    src="./sorg.jpg"
                    alt="WFESC"
                >

                <h2>
                    مرحباً بك في عالم WFESC
                </h2>

                <p>
                    هل تريد المتابعة وقراءة المزيد؟
                </p>

                <button
                    id="wfesc-welcome-continue"
                    type="button"
                >
                    متابعة
                </button>

            </div>
        `;

        document.body.appendChild(screen);

        setTimeout(function () {
            screen.classList.add("active");
        }, 100);

        const continueButton =
            document.getElementById("wfesc-welcome-continue");

        continueButton.addEventListener("click", function () {

            screen.classList.remove("active");

            setTimeout(function () {
                screen.remove();
            }, 550);

        });
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initWelcome
        );

    } else {

        initWelcome();
    }

})();
