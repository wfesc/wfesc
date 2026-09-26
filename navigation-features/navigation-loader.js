(function () {

    "use strict";


    /*
     * منع تشغيل النظام أكثر من مرة
     */

    if (window.WFESCNavigationLoader) {
        return;
    }

    window.WFESCNavigationLoader = true;


    /*
     * تحديد مسار مجلد navigation-features
     */

    const currentScript =
        document.currentScript;

    let basePath =
        "navigation-features/";


    if (
        currentScript &&
        currentScript.src
    ) {

        try {

            const scriptURL =
                new URL(
                    currentScript.src,
                    window.location.href
                );

            basePath =
                scriptURL.href.substring(
                    0,
                    scriptURL.href.lastIndexOf("/") + 1
                );

        } catch (error) {

            basePath =
                "navigation-features/";

        }

    }


    /*
     * إعدادات التحميل
     */

    const loadingSettings = {

        minimumTime: 500,

        navigationDelay: 350,

        maximumTime: 10000

    };


    /*
     * تحميل ملف JavaScript
     */

    function loadScript(
        file,
        globalName
    ) {

        return new Promise(
            function (resolve) {

                /*
                 * إذا محمل مسبقًا
                 */

                if (
                    globalName &&
                    window[globalName]
                ) {

                    resolve(true);

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    basePath + file;


                script.async =
                    false;


                script.onload =
                    function () {

                        resolve(true);

                    };


                script.onerror =
                    function () {

                        console.error(
                            "WFESC: تعذر تحميل " +
                            file
                        );

                        resolve(false);

                    };


                /*
                 * الإضافة إلى HEAD
                 */

                (
                    document.head ||
                    document.documentElement
                ).appendChild(
                    script
                );

            }
        );

    }


    /*
     * تحميل CSS الخاص بالتنقل
     */

    function loadNavigationStyle() {

        if (
            document.querySelector(
                'link[data-wfesc-navigation-style="true"]'
            )
        ) {

            return;

        }


        const link =
            document.createElement(
                "link"
            );


        link.rel =
            "stylesheet";


        link.href =
            basePath +
            "navigation-style.css";


        link.dataset.wfescNavigationStyle =
            "true";


        (
            document.head ||
            document.documentElement
        ).appendChild(
            link
        );

    }


    /*
     * إنشاء شاشة التحميل
     */

    function createLoader() {

        if (
            document.querySelector(
                ".wfesc-page-loader"
            )
        ) {

            return;

        }


        const loader =
            document.createElement(
                "div"
            );


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


        document.body.appendChild(
            loader
        );

    }


    /*
     * إظهار شاشة التحميل
     */

    function showLoader() {

        document.documentElement
            .classList
            .add(
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


    /*
     * إخفاء شاشة التحميل
     */

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


        document.documentElement
            .classList
            .remove(
                "wfesc-loading"
            );

    }


    /*
     * وقت بدء التحميل
     */

    const startedAt =
        Date.now();


    /*
     * إنهاء شاشة التحميل
     */

    function finishLoading() {

        let minimumTime =
            loadingSettings.minimumTime;


        /*
         * إذا الأنميشن مطفأ
         * نخلي التحميل أسرع
         */

        if (
            window.WFESCGlobalSettings &&
            typeof
            window.WFESCGlobalSettings
                .getAnimationEnabled ===
            "function"
        ) {

            if (
                !window.WFESCGlobalSettings
                    .getAnimationEnabled()
            ) {

                minimumTime =
                    0;

            }

        }


        const elapsed =
            Date.now() -
            startedAt;


        const remaining =
            Math.max(
                0,
                minimumTime -
                elapsed
            );


        window.setTimeout(
            function () {

                hideLoader();

            },
            remaining
        );

    }


    /*
     * تحميل نظام التنقل
     */

    function loadNavigationSystem() {

        return new Promise(
            function (resolve) {

                /*
                 * إذا موجود أصلًا
                 */

                if (
                    window.WFESCNavigationUI
                ) {

                    resolve(true);

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    basePath +
                    "navigation-ui.js";


                script.async =
                    false;


                script.onload =
                    function () {

                        resolve(true);

                    };


                script.onerror =
                    function () {

                        console.error(
                            "WFESC: تعذر تحميل navigation-ui.js"
                        );

                        resolve(false);

                    };


                (
                    document.head ||
                    document.documentElement
                ).appendChild(
                    script
                );

            }
        );

    }


    /*
     * التشغيل الرئيسي
     */

    async function initialize() {

        /*
         * لازم يكون body موجود
         */

        if (!document.body) {

            window.setTimeout(
                initialize,
                10
            );

            return;

        }


        /*
         * إظهار التحميل مباشرة
         */

        showLoader();


        /*
         * تحميل الإعدادات العالمية أولًا
         */

        await loadScript(
            "wfesc-global-settings.js",
            "WFESCGlobalSettings"
        );


        /*
         * تطبيق الإعدادات العالمية
         */

        if (
            window.WFESCGlobalSettings &&
            typeof
            window.WFESCGlobalSettings.apply ===
            "function"
        ) {

            window.WFESCGlobalSettings.apply();

        }


        /*
         * تحميل إعدادات التنقل
         */

        await loadScript(
            "navigation-settings.js",
            "WFESCNavigationSettings"
        );


        /*
         * تحميل CSS
         */

        loadNavigationStyle();


        /*
         * إنشاء شاشة التحميل
         */

        createLoader();


        /*
         * إظهارها مرة أخرى بعد إنشائها
         */

        showLoader();


        /*
         * تحميل واجهة التنقل
         */

        await loadNavigationSystem();


        /*
         * التأكد من إخفاء شاشة التحميل
         * بعد انتهاء الصفحة
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
         * حماية من بقاء شاشة التحميل
         */

        window.setTimeout(
            function () {

                hideLoader();

            },
            loadingSettings.maximumTime
        );

    }


    /*
     * عند العودة للصفحة
     */

    window.addEventListener(
        "pageshow",
        function () {

            window.setTimeout(
                function () {

                    hideLoader();

                },
                100
            );

        }
    );


    /*
     * بدء النظام
     */

    if (
        document.readyState ===
        "loading"
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

})();
