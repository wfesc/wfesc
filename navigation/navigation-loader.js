
/* =========================================================
   WFESC NAVIGATION LOADER
   navigation/navigation-loader.js
   Stable paths + reliable loading + cache refresh
   ========================================================= */

(function () {
    "use strict";

    if (window.WFESCNavigationLoader) {
        return;
    }

    window.WFESCNavigationLoader = true;

    /*
     * غيّر رقم الإصدار عند تحديث ملفات التنقل
     * حتى لا يستخدم المتصفح نسخة قديمة من الكاش.
     */
    const VERSION = "20261011-5";

    /*
     * تحديد مسار مجلد navigation من موقع هذا الملف نفسه،
     * وليس من الصفحة الحالية.
     */
    function getNavigationBase() {
        let loaderScript = document.currentScript;

        if (!loaderScript) {
            const scripts = document.getElementsByTagName("script");

            for (let i = scripts.length - 1; i >= 0; i--) {
                const src = scripts[i].src || "";

                if (src.includes("navigation-loader.js")) {
                    loaderScript = scripts[i];
                    break;
                }
            }
        }

        if (loaderScript && loaderScript.src) {
            return new URL(".", loaderScript.src).href;
        }

        /*
         * مسار احتياطي لمشروع GitHub Pages.
         */
        const path = window.location.pathname;
        const projectPath = path.split("/").filter(Boolean)[0];

        if (projectPath && !projectPath.includes(".")) {
            return new URL(
                "/" + projectPath + "/navigation/",
                window.location.origin
            ).href;
        }

        return new URL(
            "./navigation/",
            window.location.href
        ).href;
    }

    const BASE_URL = getNavigationBase();

    function assetURL(fileName) {
        const url = new URL(fileName, BASE_URL);
        url.searchParams.set("v", VERSION);
        return url.href;
    }

    function loadCSS(href) {
        return new Promise(function (resolve, reject) {
            const links = document.querySelectorAll(
                'link[data-wfesc-navigation-css="true"]'
            );

            for (const link of links) {
                if (link.href === href && link.dataset.loaded === "true") {
                    resolve();
                    return;
                }
            }

            const link = document.createElement("link");

            link.rel = "stylesheet";
            link.href = href;
            link.dataset.wfescNavigationCss = "true";

            link.onload = function () {
                link.dataset.loaded = "true";
                resolve();
            };

            link.onerror = function () {
                link.remove();

                reject(
                    new Error("تعذّر تحميل ملف تنسيق التنقل: " + href)
                );
            };

            document.head.appendChild(link);
        });
    }

    function loadScript(src, isReady) {
        return new Promise(function (resolve, reject) {
            /*
             * إذا كان الملف قد حمّل وتعريفه موجوداً،
             * لا نحمّله مرة ثانية.
             */
            if (typeof isReady === "function" && isReady()) {
                resolve();
                return;
            }

            const script = document.createElement("script");

            script.src = src;
            script.async = false;
            script.dataset.wfescNavigationScript = "true";

            script.onload = function () {
                if (typeof isReady === "function" && !isReady()) {
                    reject(
                        new Error(
                            "تم تحميل الملف لكن التعريف المطلوب غير موجود: " +
                            src
                        )
                    );
                    return;
                }

                resolve();
            };

            script.onerror = function () {
                script.remove();

                reject(
                    new Error("تعذّر تحميل ملف التنقل: " + src)
                );
            };

            document.head.appendChild(script);
        });
    }

    async function initialize() {
        if (window.WFESCNavigationInitialized) {
            return;
        }

        if (window.WFESCNavigationInitializing) {
            return;
        }

        window.WFESCNavigationInitializing = true;

        try {
            /*
             * 1. تحميل إعدادات التنقل.
             */
            await loadScript(
                assetURL("navigation-config.js"),
                function () {
                    return !!window.WFESCNavigationConfig;
                }
            );

            /*
             * 2. تحميل تصميم التنقل وبوابة الإغلاق.
             */
            await loadCSS(
                assetURL("navigation-style.css")
            );

            /*
             * 3. تحميل واجهة التنقل.
             */
            await loadScript(
                assetURL("navigation-ui.js"),
                function () {
                    return (
                        typeof window.WFESCNavigationInit === "function"
                    );
                }
            );

            /*
             * لا نعلن نجاح التهيئة إلا بعد تحميل الملفات.
             */
            if (document.body) {
                window.WFESCNavigationInit();
                window.WFESCNavigationInitialized = true;
            } else {
                throw new Error("صفحة WFESC لم تجهز بعد.");
            }

        } catch (error) {
            console.error(
                "WFESC Navigation initialization failed:",
                error
            );

            /*
             * السماح بمحاولة جديدة عند استدعاء التهيئة لاحقاً.
             */
            window.WFESCNavigationInitialized = false;

        } finally {
            window.WFESCNavigationInitializing = false;
        }
    }

    function start() {
        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                initialize,
                { once: true }
            );
        } else {
            initialize();
        }
    }

    start();

})();
