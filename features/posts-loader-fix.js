/*
 * WFESC Posts Loader Fix
 * يمنع شاشة التحميل من البقاء للأبد
 * ولا يغيّر نظام المنشورات الأصلي
 */

(function () {
    "use strict";

    const MAX_LOADING_TIME = 12000;

    function finishLoading() {
        const selectors = [
            "#loading",
            "#loadingScreen",
            "#loader",
            ".loading-screen",
            ".loading",
            ".loader",
            "[data-loading]"
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.opacity = "0";
                el.style.pointerEvents = "none";

                setTimeout(() => {
                    el.style.display = "none";
                }, 350);
            });
        });

        document.documentElement.classList.remove(
            "loading",
            "is-loading",
            "page-loading"
        );

        document.body.classList.remove(
            "loading",
            "is-loading",
            "page-loading"
        );
    }

    /*
     * نعطي نظام المنشورات وقتًا طبيعيًا للتحميل.
     * إذا فشل طلب Supabase أو علّق، لا تبقى الشاشة للأبد.
     */
    window.addEventListener("load", function () {
        setTimeout(finishLoading, MAX_LOADING_TIME);
    });

    /*
     * إذا الصفحة نفسها أصبحت جاهزة، نراقب عناصر التحميل.
     */
    document.addEventListener("DOMContentLoaded", function () {
        setTimeout(function () {
            const loadingElements = document.querySelectorAll(
                "#loading, #loadingScreen, #loader, .loading-screen, .loader"
            );

            if (!loadingElements.length) {
                return;
            }

            /*
             * لا نخفيها مباشرة حتى لا نخرب
             * التحميل الطبيعي للمنشورات.
             */
        }, 100);
    });

    /*
     * حماية إضافية إذا حصل خطأ JavaScript غير متوقع.
     */
    window.addEventListener("error", function () {
        setTimeout(finishLoading, 500);
    });

    window.addEventListener("unhandledrejection", function () {
        setTimeout(finishLoading, 500);
    });

})();
