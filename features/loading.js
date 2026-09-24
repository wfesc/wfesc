
(function () {
    "use strict";

    function initLoading() {

        if (document.getElementById("wfesc-loading-screen")) {
            return;
        }

        const style = document.createElement("style");

        style.textContent = `
            #wfesc-loading-screen {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: #050505;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                opacity: 1;
                visibility: visible;
                transition:
                    opacity .7s ease,
                    visibility .7s ease;
            }

            #wfesc-loading-screen.wfesc-loading-hide {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }

            .wfesc-loading-logo {
                font-family: Arial, Tahoma, sans-serif;
                font-size: 48px;
                font-weight: 700;
                letter-spacing: 8px;
                color: #fff;
                animation: wfescLogoPulse 1.8s ease-in-out infinite;
            }

            .wfesc-loading-name {
                margin-top: 10px;
                color: #888;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 12px;
                letter-spacing: 4px;
            }

            .wfesc-loading-line {
                width: 180px;
                height: 2px;
                margin-top: 28px;
                background: #222;
                overflow: hidden;
                border-radius: 10px;
            }

            .wfesc-loading-progress {
                width: 0%;
                height: 100%;
                background: #fff;
                border-radius: 10px;
                animation: wfescLoadingProgress 1.8s ease forwards;
            }

            .wfesc-loading-status {
                margin-top: 14px;
                color: #666;
                font-family: monospace;
                font-size: 11px;
            }

            @keyframes wfescLogoPulse {
                0%, 100% {
                    opacity: .45;
                    transform: scale(.98);
                }

                50% {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes wfescLoadingProgress {
                0% {
                    width: 0%;
                }

                35% {
                    width: 38%;
                }

                70% {
                    width: 72%;
                }

                100% {
                    width: 100%;
                }
            }

            @media (max-width: 700px) {
                .wfesc-loading-logo {
                    font-size: 38px;
                    letter-spacing: 6px;
                }

                .wfesc-loading-line {
                    width: 150px;
                }
            }
        `;

        document.head.appendChild(style);

        const loader = document.createElement("div");

        loader.id = "wfesc-loading-screen";

        loader.innerHTML = `
            <div class="wfesc-loading-logo">
                WFESC
            </div>

            <div class="wfesc-loading-name">
                MEMORY OF IRAQ
            </div>

            <div class="wfesc-loading-line">
                <div class="wfesc-loading-progress"></div>
            </div>

            <div class="wfesc-loading-status">
                Initializing...
            </div>
        `;

        document.body.appendChild(loader);

        setTimeout(function () {
            const status =
                loader.querySelector(".wfesc-loading-status");

            if (status) {
                status.textContent = "Ready";
            }
        }, 1200);

        setTimeout(function () {
            loader.classList.add("wfesc-loading-hide");

            setTimeout(function () {
                loader.remove();
            }, 750);

        }, 2100);
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initLoading
        );

    } else {

        initLoading();
    }

})();
