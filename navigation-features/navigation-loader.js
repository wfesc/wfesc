
/* =========================================================
   WFESC NAVIGATION SYSTEM
   navigation-loader.js
   ========================================================= */

(function () {

    "use strict";


    /*
     * منع تحميل النظام أكثر من مرة
     */

    if (window.WFESCNavigationLoader) {
        return;
    }

    window.WFESCNavigationLoader = true;


    /*
     * حفظ مسار هذا الملف مباشرة
     * قبل الدخول إلى الأحداث
     */

    const currentScript =
        document.currentScript;


    const basePath =
        currentScript
            ? new URL(
                ".",
                currentScript.src
            ).href
            : new URL(
                "navigation-features/",
                window.location.href
            ).href;


    /*
     * مسارات ملفات النظام
     */

    const files = {

        settings:
            new URL(
                "navigation-settings.js",
                basePath
            ).href,

        ui:
            new URL(
                "navigation-ui.js",
                basePath
            ).href,

        style:
            new URL(
                "navigation-style.css",
                basePath
            ).href

    };


    /*
     * وقت بداية التحميل
     */

    const startTime =
        performance.now();


    /*
     * تشغيل حالة التحميل
     * بأسرع وقت ممكن
     */

    document.documentElement.classList.add(
        "wfesc-loading"
    );


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
            document.createElement("div");


        loader.className =
            "wfesc-page-loader";


        loader.setAttribute(
            "aria-hidden",
            "true"
        );


        loader.innerHTML = `

            <div class="wfesc-loader-box">

                <div class="wfesc-loader-logo">
                    WFESC
                </div>

                <div
                    class="wfesc-loader-spinner"
                    aria-hidden="true">
                </div>

                <div class="wfesc-loader-text">
                    جاري التحميل
                </div>

                <div class="wfesc-loader-subtext">
                    يرجى الانتظار...
                </div>

            </div>

        `;


        /*
         * إضافة شاشة التحميل
         * في بداية الصفحة
         */

        if (document.body) {

            document.body.prepend(
                loader
            );

        } else {

            document.documentElement.appendChild(
                loader
            );

        }

    }


    /*
     * تحميل CSS
     */

    function loadStyle() {

        return new Promise(
            function (resolve, reject) {

                /*
                 * منع تكرار CSS
                 */

                if (
                    document.querySelector(
                        'link[data-wfesc-navigation-style="true"]'
                    )
                ) {

                    resolve();

                    return;
                }


                const link =
                    document.createElement("link");


                link.rel =
                    "stylesheet";


                link.href =
                    files.style;


                link.dataset.wfescNavigationStyle =
                    "true";


                link.onload =
                    resolve;


                link.onerror =
                    reject;


                document.head.appendChild(
                    link
                );

            }
        );

    }


    /*
     * تحميل JavaScript
     */

    function loadScript(
        src,
        attributeName
    ) {

        return new Promise(
            function (resolve, reject) {

                /*
                 * منع تكرار الملف
                 */

                if (
                    document.querySelector(
                        `script[data-wfesc-navigation="${attributeName}"]`
                    )
                ) {

                    resolve();

                    return;
                }


                const script =
                    document.createElement("script");


                script.src =
                    src;


                script.dataset.wfescNavigation =
                    attributeName;


                script.onload =
                    resolve;


                script.onerror =
                    function () {

                        console.error(
                            "WFESC Navigation: فشل تحميل:",
                            src
                        );

                        reject(
                            new Error(
                                "Failed to load " + src
                            )
                        );

                    };


                document.head.appendChild(
                    script
                );

            }
        );

    }


    /*
     * إخفاء شاشة التحميل
     */

    function hideLoader() {

        const minimumTime =
            window.WFESCNavigationSettings &&
            window.WFESCNavigationSettings.loading &&
            window.WFESCNavigationSettings.loading.minimumTime
                ? window.WFESCNavigationSettings.loading.minimumTime
                : 500;


        const elapsed =
            performance.now() -
            startTime;


        const remaining =
            Math.max(
                0,
                minimumTime - elapsed
            );


        window.setTimeout(
            function () {

                /*
                 * إزالة حالة التحميل
                 */

                document.documentElement.classList.remove(
                    "wfesc-loading"
                );


                /*
                 * إخفاء شاشة التحميل
                 */

                const loader =
                    document.querySelector(
                        ".wfesc-page-loader"
                    );


                if (loader) {

                    loader.classList.add(
                        "wfesc-loader-hidden"
                    );


                    /*
                     * حذفها بعد انتهاء
                     * التأثير البصري
                     */

                    window.setTimeout(
                        function () {

                            if (
                                loader &&
                                loader.parentNode
                            ) {

                                loader.parentNode.removeChild(
                                    loader
                                );

                            }

                        },
                        400
                    );

                }

            },
            remaining
        );

    }


    /*
     * معالجة فشل التحميل
     */

    function handleError(error) {

        console.error(
            "WFESC Navigation Error:",
            error
        );


        /*
         * حتى إذا حدث خطأ في أحد الملفات
         * لا نبقي المستخدم محبوسًا
         */

        window.setTimeout(
            function () {

                document.documentElement.classList.remove(
                    "wfesc-loading"
                );


                const loader =
                    document.querySelector(
                        ".wfesc-page-loader"
                    );


                if (loader) {

                    loader.classList.add(
                        "wfesc-loader-hidden"
                    );

                }

            },
            500
        );

    }


    /*
     * إنهاء التحميل بعد window.load
     */

    let pageLoaded =
        document.readyState ===
        "complete";


    function finishWhenPageLoaded() {

        if (!pageLoaded) {
            return;
        }


        hideLoader();

    }


    /*
     * الصفحة أصبحت محملة بالكامل
     */

    window.addEventListener(
        "load",
        function () {

            pageLoaded = true;

            finishWhenPageLoaded();

        },
        {
            once: true
        }
    );


    /*
     * دعم الرجوع والتقدم بالمتصفح
     */

    window.addEventListener(
        "pageshow",
        function (event) {

            if (
                event.persisted
            ) {

                pageLoaded = true;

                hideLoader();

            }

        }
    );


    /*
     * إنشاء شاشة التحميل فورًا
     */

    createLoader();


    /*
     * تحميل ملفات النظام
     */

    Promise.resolve()

        /*
         * أولًا CSS
         */

        .then(function () {

            return loadStyle();

        })

        /*
         * ثانيًا الإعدادات
         */

        .then(function () {

            return loadScript(
                files.settings,
                "settings"
            );

        })

        /*
         * ثالثًا الواجهة
         */

        .then(function () {

            return loadScript(
                files.ui,
                "ui"
            );

        })

        /*
         * بعد اكتمال ملفات النظام
         * نتحقق من حالة الصفحة
         */

        .then(function () {

            finishWhenPageLoaded();

        })

        /*
         * في حالة وجود خطأ
         */

        .catch(function (error) {

            handleError(
                error
            );

        });


})();
