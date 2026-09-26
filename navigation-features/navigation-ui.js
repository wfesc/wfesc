/* =========================================================
   WFESC NAVIGATION SYSTEM
   navigation-ui.js
   ========================================================= */

(function () {

    "use strict";


    /*
     * منع تشغيل النظام أكثر من مرة
     */

    if (window.WFESCNavigationUI) {
        return;
    }

    window.WFESCNavigationUI = true;


    /*
     * التأكد من وجود إعدادات التنقل
     */

    function waitForSettings(callback) {

        if (window.WFESCNavigationSettings) {
            callback();
            return;
        }

        let attempts = 0;

        const timer = window.setInterval(function () {

            attempts++;

            if (window.WFESCNavigationSettings) {

                window.clearInterval(timer);

                callback();

                return;
            }

            /*
             * منع الانتظار إلى ما لا نهاية
             */

            if (attempts >= 100) {

                window.clearInterval(timer);

                console.error(
                    "WFESC Navigation: navigation-settings.js غير محمل."
                );

            }

        }, 10);

    }


    /*
     * تشغيل النظام بعد توفر الإعدادات
     */

    waitForSettings(function () {

        const settings =
            window.WFESCNavigationSettings;


        /*
         * إنشاء شريط التنقل
         */

        function createNavigation() {

            /*
             * إذا موجود مسبقًا لا ننشئ واحد ثاني
             */

            if (
                document.querySelector(
                    ".wfesc-navigation"
                )
            ) {
                return;
            }


            const navigation =
                document.createElement("nav");


            navigation.className =
                "wfesc-navigation";


            navigation.setAttribute(
                "aria-label",
                "التنقل الرئيسي"
            );


            /*
             * إنشاء الأزرار
             */

            if (
                Array.isArray(settings.buttons)
            ) {

                settings.buttons.forEach(
                    function (button) {

                        const page =
                            settings.pages &&
                            settings.pages[button.page];


                        if (!page) {
                            return;
                        }


                        const link =
                            document.createElement("a");


                        link.className =
                            "wfesc-navigation-item";


                        link.dataset.navigationId =
                            button.id;


                        link.href =
                            page;


                        link.setAttribute(
                            "aria-label",
                            button.title
                        );


                        /*
                         * الأيقونة
                         */

                        const icon =
                            document.createElement("span");


                        icon.className =
                            "wfesc-navigation-icon";


                        icon.textContent =
                            button.icon;


                        icon.setAttribute(
                            "aria-hidden",
                            "true"
                        );


                        /*
                         * اسم الخيار
                         */

                        const title =
                            document.createElement("span");


                        title.className =
                            "wfesc-navigation-title";


                        title.textContent =
                            button.title;


                        /*
                         * تركيب الزر
                         */

                        link.appendChild(icon);

                        link.appendChild(title);

                        navigation.appendChild(link);

                    }
                );

            }


            /*
             * إضافة الشريط للصفحة
             */

            document.body.appendChild(
                navigation
            );


            /*
             * تحديد الصفحة الحالية
             */

            setActiveButton();


            /*
             * تفعيل الانتقال
             */

            setupNavigationClicks();


            /*
             * إضافة مساحة أسفل الصفحة
             */

            document.body.classList.add(
                "wfesc-navigation-active"
            );

        }


        /*
         * معرفة الصفحة الحالية
         */

        function getCurrentPage() {

            let current =
                window.location.pathname
                .split("/")
                .pop();


            /*
             * إذا كانت الصفحة الرئيسية
             */

            if (!current) {

                current =
                    "index.html";

            }


            return current.toLowerCase();

        }


        /*
         * تحديد الزر النشط
         */

        function setActiveButton() {

            const currentPage =
                getCurrentPage();


            const links =
                document.querySelectorAll(
                    ".wfesc-navigation-item"
                );


            links.forEach(function (link) {

                const linkPage =
                    link.getAttribute("href");


                if (!linkPage) {
                    return;
                }


                const cleanPage =
                    linkPage
                        .split("?")[0]
                        .split("#")[0]
                        .split("/")
                        .pop()
                        .toLowerCase();


                if (
                    cleanPage ===
                    currentPage
                ) {

                    link.classList.add(
                        "active"
                    );

                } else {

                    link.classList.remove(
                        "active"
                    );

                }

            });

        }


        /*
         * إظهار شاشة التحميل
         */

        function showLoading() {

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


        /*
         * معرفة حالة الأنميشن العالمية
         */

        function isAnimationEnabled() {

            if (
                window.WFESCGlobalSettings &&
                typeof
                window.WFESCGlobalSettings
                    .getAnimationEnabled ===
                "function"
            ) {

                return window.WFESCGlobalSettings
                    .getAnimationEnabled();

            }


            return true;

        }


        /*
         * الانتقال للصفحة
         */

        function navigateToPage(url) {

            showLoading();


            let delay = 0;


            /*
             * إذا الأنميشن مفعل
             * نستخدم التأخير الموجود بالإعدادات
             */

            if (isAnimationEnabled()) {

                delay =
                    settings.loading &&
                    typeof settings.loading.navigationDelay ===
                    "number"
                        ? settings.loading.navigationDelay
                        : 350;

            }


            /*
             * الانتقال
             */

            window.setTimeout(
                function () {

                    window.location.href =
                        url;

                },
                delay
            );

        }


        /*
         * تفعيل الضغط على الأزرار
         */

        function setupNavigationClicks() {

            const links =
                document.querySelectorAll(
                    ".wfesc-navigation-item"
                );


            links.forEach(function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        /*
                         * السماح بالضغط المطول
                         * وفتح الرابط في تبويب جديد
                         */

                        if (
                            event.ctrlKey ||
                            event.metaKey ||
                            event.shiftKey ||
                            event.altKey ||
                            event.button !== 0
                        ) {

                            return;

                        }


                        const target =
                            link.getAttribute("href");


                        if (!target) {
                            return;
                        }


                        /*
                         * تحويل الرابط إلى URL كامل
                         */

                        let targetURL;

                        let currentURL;

                        try {

                            targetURL =
                                new URL(
                                    target,
                                    window.location.href
                                );


                            currentURL =
                                new URL(
                                    window.location.href
                                );

                        } catch (error) {

                            return;

                        }


                        /*
                         * إذا نفس الصفحة
                         * لا نعيد التحميل
                         */

                        if (
                            targetURL.pathname ===
                            currentURL.pathname
                        ) {

                            event.preventDefault();

                            return;

                        }


                        /*
                         * التأكد أن الرابط
                         * داخل نفس الموقع
                         */

                        if (
                            targetURL.origin !==
                            currentURL.origin
                        ) {

                            return;

                        }


                        /*
                         * إيقاف الانتقال الطبيعي
                         */

                        event.preventDefault();


                        /*
                         * بدء التحميل
                         */

                        navigateToPage(
                            targetURL.href
                        );

                    }
                );

            });

        }


        /*
         * إعادة فحص الزر النشط
         */

        function refreshNavigation() {

            setActiveButton();

        }


        /*
         * الاستماع لتغيير الإعدادات العالمية
         */

        window.addEventListener(
            "wfesc:settings-changed",
            function () {

                /*
                 * تحديث الزر النشط فقط.
                 * إعداد الأنميشن نفسه يتم
                 * تطبيقه من النظام العالمي.
                 */

                refreshNavigation();

            }
        );


        /*
         * تشغيل النظام
         */

        function init() {

            if (!document.body) {

                window.setTimeout(
                    init,
                    10
                );

                return;

            }


            createNavigation();


            /*
             * إعادة تحديد الصفحة الحالية
             */

            window.setTimeout(
                refreshNavigation,
                50
            );

        }


        /*
         * تشغيل بعد تجهيز الصفحة
         */

        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                init,
                {
                    once: true
                }
            );

        } else {

            init();

        }

    });

})();
