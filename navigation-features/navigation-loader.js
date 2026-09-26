(function () {
    "use strict";

    if (window.WFESCNavigationLoader) {
        return;
    }

    window.WFESCNavigationLoader = true;

    const currentScript = document.currentScript;

    let basePath = "";

    if (currentScript && currentScript.src) {
        try {
            const scriptUrl = new URL(
                currentScript.src,
                window.location.href
            );

            basePath = scriptUrl.href.substring(
                0,
                scriptUrl.href.lastIndexOf("/") + 1
            );
        } catch (error) {
            basePath = "navigation-features/";
        }
    } else {
        basePath = "navigation-features/";
    }

    const settings = {
        enabled: true,
        minimumTime: 500,
        navigationDelay: 350,
        maximumTime: 10000
    };

    /*
     * =========================================
     * GLOBAL SETTINGS
     * =========================================
     */

    function loadGlobalSettings() {
        return new Promise(function (resolve) {

            if (window.WFESCGlobalSettings) {
                resolve();
                return;
            }

            const script = document.createElement("script");

            script.src =
                basePath +
                "wfesc-global-settings.js";

            script.async = false;

            script.onload = function () {
                resolve();
            };

            script.onerror = function () {
                console.warn(
                    "WFESC: تعذر تحميل wfesc-global-settings.js"
                );

                resolve();
            };

            document.head.appendChild(script);
        });
    }

    /*
     * =========================================
     * NAVIGATION SETTINGS
     * =========================================
     */

    function loadNavigationSettings() {
        return new Promise(function (resolve) {

            if (window.WFESCNavigationSettings) {
                resolve();
                return;
            }

            const script = document.createElement("script");

            script.src =
                basePath +
                "navigation-settings.js";

            script.async = false;

            script.onload = function () {
                resolve();
            };

            script.onerror = function () {
                console.error(
                    "WFESC: تعذر تحميل navigation-settings.js"
                );

                resolve();
            };

            document.head.appendChild(script);
        });
    }

    /*
     * =========================================
     * NAVIGATION STYLE
     * =========================================
     */

    function loadNavigationStyle() {

        if (
            document.querySelector(
                'link[data-wfesc-navigation-style="true"]'
            )
        ) {
            return;
        }

        const link = document.createElement("link");

        link.rel = "stylesheet";

        link.href =
            basePath +
            "navigation-style.css";

        link.dataset.wfescNavigationStyle = "true";

        document.head.appendChild(link);
    }

    /*
     * =========================================
     * LOADING SCREEN
     * =========================================
     */

    function createLoader() {

        if (
            document.querySelector(
                ".wfesc-page-loader"
            )
        ) {
            return;
        }

        const loader = document.createElement("div");

        loader.className =
            "wfesc-page-loader";

        loader.innerHTML = `
            <div class="wfesc-loader-box">

                <div class="wfesc-loader-logo">
                    WFESC
                </div>

                <div class="wfesc-loader-spinner"></div>

                <div class="wfesc-loader-text">
                    جاري التحميل...
                </div>

            </div>
        `;

        document.body.appendChild(loader);
    }

    function showLoader() {

        document.documentElement.classList.add(
            "wfesc-loading"
        );

        const loader =
            document.querySelector(
                ".wfesc-page-loader"
            );

        if (loader) {
            loader.classList.remove(
                "wfesc-loader-hidden"
            );
        }
    }

    function hideLoader() {

        const loader =
            document.querySelector(
                ".wfesc-page-loader"
            );

        if (loader) {

            loader.classList.add(
                "wfesc-loader-hidden"
            );
        }

        document.documentElement.classList.remove(
            "wfesc-loading"
        );
    }

    /*
     * =========================================
     * START
     * =========================================
     */

    const startedAt = Date.now();

    function finishLoading() {

        const elapsed =
            Date.now() - startedAt;

        let minimumTime =
            settings.minimumTime;

        /*
         * إذا الأنميشن مغلق من الإعدادات
         * نقلل وقت الانتظار.
         */

        if (
            window.WFESCGlobalSettings &&
            !window.WFESCGlobalSettings.getAnimationEnabled()
        ) {
            minimumTime = 0;
        }

        const remaining =
            Math.max(
                0,
                minimumTime - elapsed
            );

        setTimeout(
            hideLoader,
            remaining
        );
    }

    /*
     * =========================================
     * INITIALIZATION
     * =========================================
     */

    async function initialize() {

        /*
         * الإعدادات العالمية أول شيء.
         */
        await loadGlobalSettings();

        /*
         * تطبيق الإعدادات مباشرة.
         */
        if (
            window.WFESCGlobalSettings
        ) {
            window.WFESCGlobalSettings.apply();
        }

        /*
         * إظهار التحميل قبل بناء الواجهة.
         */
        showLoader();

        /*
         * تحميل إعدادات التنقل.
         */
        await loadNavigationSettings();

        /*
         * تحميل CSS الخاص بالتنقل.
         */
        loadNavigationStyle();

        /*
         * إنشاء شاشة التحميل.
         */
        createLoader();

        /*
         * التأكد من أن الشاشة موجودة.
         */
        showLoader();

        /*
         * تحميل واجهة التنقل.
         */
        if (
            !window.WFESCNavigationUI
        ) {

            const script =
                document.createElement("script");

            script.src =
                basePath +
                "navigation-ui.js";

            script.async = false;

            document.head.appendChild(
                script
            );
        }

        /*
         * انتظار تحميل الصفحة.
         */
        if (
            document.readyState ===
            "complete"
        ) {

            finishLoading();

        } else {

            window.addEventListener(
                "load",
                finishLoading,
                {
                    once: true
                }
            );
        }

        /*
         * حماية من بقاء التحميل عالقًا.
         */
        setTimeout(
            function () {

                hideLoader();

            },
            settings.maximumTime
        );
    }

    /*
     * =========================================
     * BF CACHE
     * =========================================
     */

    window.addEventListener(
        "pageshow",
        function () {

            if (
                document.readyState ===
                "complete"
            ) {

                setTimeout(
                    function () {
                        hideLoader();
                    },
                    50
                );
            }
        }
    );

    /*
     * =========================================
     * START NOW
     * =========================================
     */

    initialize();

})();
