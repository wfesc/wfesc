/* =========================================================
   WFESC NAVIGATION LOADER
   navigation-loader.js
   ========================================================= */

(function () {

    "use strict";

    if (window.WFESCNavigationLoader) {
        return;
    }

    window.WFESCNavigationLoader = true;

    const BASE_PATH = "./navigation/";

    function loadCSS(href) {

        return new Promise(function (resolve) {

            if (document.querySelector('link[href="' + href + '"]')) {
                resolve();
                return;
            }

            const link = document.createElement("link");

            link.rel = "stylesheet";
            link.href = href;

            link.onload = function () {
                resolve();
            };

            link.onerror = function () {
                console.warn("WFESC Navigation CSS could not be loaded.");
                resolve();
            };

            document.head.appendChild(link);

        });

    }

    function loadScript(src) {

        return new Promise(function (resolve) {

            const existing = document.querySelector(
                'script[src="' + src + '"]'
            );

            if (existing) {
                if (window.WFESCNavigationConfig) {
                    resolve();
                } else {
                    existing.addEventListener("load", resolve, {
                        once: true
                    });
                }

                return;
            }

            const script = document.createElement("script");

            script.src = src;
            script.async = false;

            script.onload = function () {
                resolve();
            };

            script.onerror = function () {

                console.warn(
                    "WFESC Navigation script could not be loaded:",
                    src
                );

                resolve();

            };

            document.head.appendChild(script);

        });

    }

    function createLoader() {

        if (document.getElementById("wfesc-navigation-loader")) {
            return;
        }

        const loader = document.createElement("div");

        loader.id = "wfesc-navigation-loader";

        loader.innerHTML = `
            <div class="wfesc-navigation-loader-box">
                <div class="wfesc-navigation-loader-logo">WFESC</div>

                <div class="wfesc-navigation-loader-spinner"></div>

                <div class="wfesc-navigation-loader-text">
                    جاري التحميل...
                </div>
            </div>
        `;

        document.body.appendChild(loader);

    }

    function hideLoader() {

        const loader = document.getElementById(
            "wfesc-navigation-loader"
        );

        if (!loader) {
            return;
        }

        loader.classList.add("wfesc-navigation-loader-hidden");

        setTimeout(function () {

            if (loader && loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }

        }, 450);

    }

    async function initialize() {

        if (window.WFESCNavigationInitialized) {
            return;
        }

        window.WFESCNavigationInitialized = true;

        createLoader();

        const configPath = BASE_PATH + "navigation-config.js";
        const stylePath = BASE_PATH + "navigation-style.css";
        const uiPath = BASE_PATH + "navigation-ui.js";

        /*
         * تحميل التعريفات أولاً
         */
        await loadScript(configPath);

        /*
         * تحميل التصميم
         */
        await loadCSS(stylePath);

        /*
         * تحميل واجهة التنقل
         */
        await loadScript(uiPath);

        /*
         * إعطاء الواجهة وقتاً قصيراً حتى تجهز
         */
        setTimeout(function () {

            if (
                typeof window.WFESCNavigationInit === "function"
            ) {
                window.WFESCNavigationInit();
            }

            hideLoader();

        }, 500);

    }

    function start() {

        if (
            document.readyState === "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                initialize,
                {
                    once: true
                }
            );

        } else {

            initialize();

        }

    }

    /*
     * تشغيل النظام
     */
    start();

})();
