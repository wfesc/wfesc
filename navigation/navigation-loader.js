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

                console.warn(
                    "WFESC Navigation CSS could not be loaded."
                );

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

                    existing.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );

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

    async function initialize() {

        if (window.WFESCNavigationInitialized) {
            return;
        }

        window.WFESCNavigationInitialized = true;

        const configPath =
            BASE_PATH + "navigation-config.js";

        const stylePath =
            BASE_PATH + "navigation-style.css";

        const uiPath =
            BASE_PATH + "navigation-ui.js";


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

        }, 100);

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
     * تشغيل نظام التنقل
     */
    start();

})();
