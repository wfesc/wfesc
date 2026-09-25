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
     * التأكد من وجود الإعدادات
     */

    if (!window.WFESCNavigationSettings) {
        console.error(
            "WFESC Navigation: navigation-settings.js غير محمل."
        );

        return;
    }


    const settings =
        window.WFESCNavigationSettings;


    /*
     * إنشاء شريط التنقل
     */

    function createNavigation() {

        // إذا موجود مسبقًا لا ننشئ واحد ثاني
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

        settings.buttons.forEach(function (button) {

            const page =
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


            link.href = page;


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

        });


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
         * ولم يظهر اسم الملف
         */

        if (!current) {
            current = "index.html";
        }


        return current
            .toLowerCase();
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
                cleanPage === currentPage
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
     * الانتقال للصفحة
     */

    function navigateToPage(url) {

        showLoading();


        const delay =
            settings.loading &&
            settings.loading.navigationDelay
                ? settings.loading.navigationDelay
                : 350;


        /*
         * ننتظر قليلًا حتى يظهر
         * تأثير التحميل قبل الانتقال
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
                     * إذا نفس الصفحة
                     * لا نعيد التحميل
                     */

                    const targetURL =
                        new URL(
                            target,
                            window.location.href
                        );


                    const currentURL =
                        new URL(
                            window.location.href
                        );


                    if (
                        targetURL.pathname ===
                        currentURL.pathname
                    ) {

                        event.preventDefault();

                        return;
                    }


                    /*
                     * نتأكد أن الرابط
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
     * تشغيل النظام
     */

    function init() {

        if (
            !document.body
        ) {

            window.setTimeout(
                init,
                10
            );

            return;
        }


        createNavigation();


        /*
         * إعادة تحديد الصفحة الحالية
         * بعد انتهاء كل شيء
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


})();
