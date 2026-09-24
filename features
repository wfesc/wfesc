(function () {
    "use strict";

    function initSettings() {

        if (document.getElementById("wfesc-settings-button")) {
            return;
        }

        const style = document.createElement("style");

        style.textContent = `
            #wfesc-settings-button {
                position: fixed;
                top: 82px;
                right: 18px;
                z-index: 9998;
                padding: 9px 14px;
                background: rgba(10,10,10,.92);
                color: #fff;
                border: 1px solid #292929;
                border-radius: 8px;
                cursor: pointer;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 13px;
                transition: .2s;
            }

            #wfesc-settings-button:hover {
                background: #fff;
                color: #000;
            }

            #wfesc-settings-panel {
                position: fixed;
                top: 125px;
                right: 18px;
                width: 240px;
                z-index: 9999;
                padding: 20px;
                background: #0b0b0b;
                color: #fff;
                border: 1px solid #242424;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,.45);
                display: none;
            }

            #wfesc-settings-panel.active {
                display: block;
            }

            #wfesc-settings-panel h3 {
                margin: 0 0 18px;
                font-size: 17px;
            }

            .wfesc-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .wfesc-setting-row span {
                font-size: 14px;
            }

            #wfesc-theme-toggle {
                border: 1px solid #333;
                background: #151515;
                color: #fff;
                padding: 7px 12px;
                border-radius: 7px;
                cursor: pointer;
                font-family: inherit;
            }

            #wfesc-theme-toggle:hover {
                background: #fff;
                color: #000;
            }

            body.wfesc-light {
                background: #f5f5f5;
                color: #111;
            }

            body.wfesc-light header {
                background: rgba(255,255,255,.92);
                border-bottom-color: #ddd;
            }

            body.wfesc-light .nav-links a {
                color: #555;
            }

            body.wfesc-light .nav-links a:hover {
                color: #000;
            }

            body.wfesc-light .hero-subtitle {
                color: #555;
            }

            body.wfesc-light section {
                border-top-color: #ddd;
            }

            body.wfesc-light .about-box,
            body.wfesc-light .goal-card,
            body.wfesc-light .social-link,
            body.wfesc-light .share-box {
                background: #fff;
                color: #111;
                border-color: #ddd;
            }

            body.wfesc-light .goal-card p,
            body.wfesc-light .social-user,
            body.wfesc-light .share-box p,
            body.wfesc-light .section-title p {
                color: #666;
            }

            body.wfesc-light .social-link:hover {
                background: #f0f0f0;
                border-color: #bbb;
            }

            body.wfesc-light .share-button {
                border-color: #bbb;
            }

            body.wfesc-light .share-button:hover {
                background: #111;
                color: #fff;
            }

            body.wfesc-light footer {
                border-top-color: #ddd;
            }

            body.wfesc-light .footer-main {
                color: #555;
            }

            body.wfesc-light #wfesc-settings-button {
                background: rgba(255,255,255,.95);
                color: #111;
                border-color: #ccc;
            }

            body.wfesc-light #wfesc-settings-panel {
                background: #fff;
                color: #111;
                border-color: #ccc;
            }

            body.wfesc-light #wfesc-theme-toggle {
                background: #f1f1f1;
                color: #111;
                border-color: #ccc;
            }

            body.wfesc-light #wfesc-theme-toggle:hover {
                background: #111;
                color: #fff;
            }

            @media (max-width: 700px) {
                #wfesc-settings-button {
                    top: 70px;
                    right: 12px;
                }

                #wfesc-settings-panel {
                    top: 112px;
                    right: 12px;
                    width: 220px;
                }
            }
        `;

        document.head.appendChild(style);

        const button = document.createElement("button");

        button.id = "wfesc-settings-button";
        button.type = "button";
        button.textContent = "⚙ الإعدادات";

        document.body.appendChild(button);

        const panel = document.createElement("div");

        panel.id = "wfesc-settings-panel";

        panel.innerHTML = `
            <h3>الإعدادات</h3>

            <div class="wfesc-setting-row">
                <span>مظهر الموقع</span>

                <button
                    id="wfesc-theme-toggle"
                    type="button"
                >
                    الوضع العادي
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        const themeButton =
            document.getElementById("wfesc-theme-toggle");

        const savedTheme =
            localStorage.getItem("wfesc-theme");

        if (savedTheme === "light") {
            document.body.classList.add("wfesc-light");
            themeButton.textContent = "الوضع المظلم";
        }

        button.addEventListener("click", function (event) {
            event.stopPropagation();
            panel.classList.toggle("active");
        });

        document.addEventListener("click", function (event) {
            if (
                panel.classList.contains("active") &&
                !panel.contains(event.target) &&
                event.target !== button
            ) {
                panel.classList.remove("active");
            }
        });

        themeButton.addEventListener("click", function () {

            const light =
                document.body.classList.toggle("wfesc-light");

            if (light) {
                localStorage.setItem("wfesc-theme", "light");
                themeButton.textContent = "الوضع المظلم";
            } else {
                localStorage.setItem("wfesc-theme", "dark");
                themeButton.textContent = "الوضع العادي";
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initSettings
        );
    } else {
        initSettings();
    }

})();
