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
                padding: 9px 15px;
                background: rgba(12,12,12,.88);
                color: #fff;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 10px;
                cursor: pointer;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 13px;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                transition:
                    background .35s ease,
                    color .35s ease,
                    border-color .35s ease,
                    transform .2s ease,
                    box-shadow .35s ease;
            }

            #wfesc-settings-button:hover {
                transform: translateY(-2px);
                background: rgba(255,255,255,.96);
                color: #000;
                border-color: rgba(255,255,255,.35);
                box-shadow: 0 8px 25px rgba(0,0,0,.25);
            }

            #wfesc-settings-button:active {
                transform: scale(.96);
            }

            #wfesc-settings-panel {
                position: fixed;
                top: 130px;
                right: 18px;
                width: 270px;
                z-index: 9999;
                padding: 22px;
                background: rgba(12,12,12,.92);
                color: #fff;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 16px;
                box-shadow:
                    0 20px 60px rgba(0,0,0,.45),
                    0 0 0 1px rgba(255,255,255,.02);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);

                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px) scale(.97);
                transform-origin: top right;

                transition:
                    opacity .25s ease,
                    transform .25s ease,
                    visibility .25s ease,
                    background .4s ease,
                    color .4s ease,
                    border-color .4s ease;
            }

            #wfesc-settings-panel.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            #wfesc-settings-panel h3 {
                margin: 0 0 20px;
                font-size: 18px;
                font-weight: 600;
            }

            .wfesc-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
            }

            .wfesc-setting-info {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .wfesc-setting-info span {
                font-size: 14px;
            }

            .wfesc-setting-info small {
                color: #888;
                font-size: 11px;
                transition: color .4s ease;
            }

            .wfesc-switch {
                position: relative;
                width: 54px;
                height: 30px;
                flex-shrink: 0;
            }

            .wfesc-switch input {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
            }

            .wfesc-slider {
                position: absolute;
                inset: 0;
                cursor: pointer;
                background: #292929;
                border: 1px solid #3a3a3a;
                border-radius: 30px;
                transition:
                    background .35s ease,
                    border-color .35s ease,
                    box-shadow .35s ease;
            }

            .wfesc-slider::before {
                content: "";
                position: absolute;
                width: 22px;
                height: 22px;
                left: 3px;
                top: 3px;
                background: #fff;
                border-radius: 50%;
                box-shadow: 0 2px 7px rgba(0,0,0,.35);
                transition:
                    transform .35s cubic-bezier(.4,0,.2,1),
                    background .35s ease;
            }

            .wfesc-switch input:checked + .wfesc-slider {
                background: #e8e8e8;
                border-color: #fff;
            }

            .wfesc-switch input:checked + .wfesc-slider::before {
                transform: translateX(24px);
                background: #111;
            }

            .wfesc-switch input:focus-visible + .wfesc-slider {
                box-shadow: 0 0 0 3px rgba(255,255,255,.15);
            }

            body,
            header,
            section,
            footer,
            .about-box,
            .goal-card,
            .social-link,
            .share-box,
            #wfesc-settings-button,
            #wfesc-settings-panel {
                transition:
                    background-color .55s ease,
                    color .55s ease,
                    border-color .55s ease;
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
                background: rgba(255,255,255,.92);
                color: #111;
                border-color: #d5d5d5;
            }

            body.wfesc-light #wfesc-settings-button:hover {
                background: #111;
                color: #fff;
                border-color: #111;
            }

            body.wfesc-light #wfesc-settings-panel {
                background: rgba(255,255,255,.94);
                color: #111;
                border-color: #ddd;
            }

            body.wfesc-light .wfesc-setting-info small {
                color: #777;
            }

            @media (max-width: 700px) {

                #wfesc-settings-button {
                    top: 70px;
                    right: 12px;
                }

                #wfesc-settings-panel {
                    top: 112px;
                    right: 12px;
                    width: 235px;
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

                <div class="wfesc-setting-info">
                    <span>الوضع الداكن</span>
                    <small id="wfesc-theme-status">
                        مفعّل
                    </small>
                </div>

                <label class="wfesc-switch">
                    <input
                        type="checkbox"
                        id="wfesc-theme-toggle"
                    >
                    <span class="wfesc-slider"></span>
                </label>

            </div>
        `;

        document.body.appendChild(panel);

        const themeToggle =
            document.getElementById("wfesc-theme-toggle");

        const themeStatus =
            document.getElementById("wfesc-theme-status");

        const savedTheme =
            localStorage.getItem("wfesc-theme");

        if (savedTheme === "light") {

            document.body.classList.add("wfesc-light");

            themeToggle.checked = false;

            themeStatus.textContent = "مفعّل";
        } else {

            themeToggle.checked = true;

            themeStatus.textContent = "مفعّل";
        }

        button.addEventListener("click", function (event) {

            event.stopPropagation();

            panel.classList.toggle("active");
        });

        panel.addEventListener("click", function (event) {

            event.stopPropagation();
        });

        document.addEventListener("click", function () {

            panel.classList.remove("active");
        });

        themeToggle.addEventListener("change", function () {

            if (themeToggle.checked) {

                document.body.classList.remove("wfesc-light");

                localStorage.setItem(
                    "wfesc-theme",
                    "dark"
                );

                themeStatus.textContent = "الوضع الداكن";

            } else {

                document.body.classList.add("wfesc-light");

                localStorage.setItem(
                    "wfesc-theme",
                    "light"
                );

                themeStatus.textContent = "الوضع العادي";
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
