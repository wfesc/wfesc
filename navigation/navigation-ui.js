/* =========================================================
   WFESC NAVIGATION UI
   navigation-ui.js
   ========================================================= */

(function () {

    "use strict";

    if (window.WFESCNavigationUI) {
        return;
    }

    window.WFESCNavigationUI = true;

    function getConfig() {
        return window.WFESCNavigationConfig || null;
    }

    function getCurrentPage() {

        const fileName = window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

        return fileName || "index.html";
    }

    function createNavigation() {

        if (document.getElementById("wfesc-navigation")) {
            return;
        }

        const config = getConfig();

        if (!config || !config.buttons) {
            console.warn(
                "WFESC Navigation configuration is unavailable."
            );
            return;
        }

        const navigation = document.createElement("nav");

        navigation.id = "wfesc-navigation";
        navigation.className = "wfesc-navigation";

        /* =====================================================
           FORCE FIXED BOTTOM POSITION
           ===================================================== */

        navigation.style.setProperty(
            "position",
            "fixed",
            "important"
        );

        navigation.style.setProperty(
            "top",
            "auto",
            "important"
        );

        navigation.style.setProperty(
            "bottom",
            "12px",
            "important"
        );

        navigation.style.setProperty(
            "left",
            "12px",
            "important"
        );

        navigation.style.setProperty(
            "right",
            "12px",
            "important"
        );

        navigation.style.setProperty(
            "width",
            "auto",
            "important"
        );

        navigation.style.setProperty(
            "z-index",
            "99990",
            "important"
        );

        navigation.setAttribute(
            "aria-label",
            "WFESC Navigation"
        );

        const currentPage = getCurrentPage();

        config.buttons.forEach(function (button) {

            const pageFile =
                config.pages[button.page] || "index.html";

            const item = document.createElement("a");

            item.className = "wfesc-navigation-item";

            item.href = pageFile;

            item.dataset.navigationId = button.id;

            item.dataset.navigationPage = pageFile;

            item.setAttribute(
                "aria-label",
                button.title
            );

            if (
                pageFile.toLowerCase() === currentPage
            ) {
                item.classList.add(
                    "wfesc-navigation-active"
                );

                item.setAttribute(
                    "aria-current",
                    "page"
                );
            }

            const icon = document.createElement("span");

            icon.className =
                "wfesc-navigation-icon";

            icon.textContent = button.icon;

            const title = document.createElement("span");

            title.className =
                "wfesc-navigation-title";

            title.textContent = button.title;

            item.appendChild(icon);
            item.appendChild(title);

            item.addEventListener(
                "click",
                function (event) {

                    /*
                     * إذا كان المستخدم على نفس الصفحة
                     * لا داعي لإعادة التحميل.
                     */
                    if (
                        pageFile.toLowerCase() === currentPage
                    ) {
                        event.preventDefault();
                        return;
                    }

                    /*
                     * لا تظهر شاشة "جاري الانتقال..."
                     *
                     * يتم الانتقال مباشرة إلى الصفحة.
                     * شاشة "جاري التحميل..." الموجودة في
                     * navigation-loader.js ستظهر عند تحميل
                     * الصفحة الجديدة.
                     */

                }
            );

            navigation.appendChild(item);

        });

        /*
         * وضع شريط التنقل مباشرة داخل HTML
         * لتجنب أي تأثير من CSS الخاص بالـ body.
         */
        document.documentElement.appendChild(
            navigation
        );

    }

    function refreshActiveButton() {

        const config = getConfig();

        if (!config || !config.buttons) {
            return;
        }

        const currentPage = getCurrentPage();

        const items =
            document.querySelectorAll(
                ".wfesc-navigation-item"
            );

        items.forEach(function (item) {

            const page =
                item.dataset.navigationPage || "";

            item.classList.remove(
                "wfesc-navigation-active"
            );

            item.removeAttribute(
                "aria-current"
            );

            if (
                page.toLowerCase() === currentPage
            ) {

                item.classList.add(
                    "wfesc-navigation-active"
                );

                item.setAttribute(
                    "aria-current",
                    "page"
                );

            }

        });

    }

    function init() {

        if (document.body) {

            createNavigation();

            refreshActiveButton();

        }

    }

    window.WFESCNavigationInit = init;

})();
