
/* =========================================================
   WFESC NAVIGATION UI + TEMPORARY SERVICE GATE
   ========================================================= */

(function () {
    "use strict";

    if (window.WFESCNavigationUI) return;
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
        if (document.getElementById("wfesc-navigation")) return;

        const config = getConfig();

        if (!config || !config.buttons) {
            console.warn("WFESC Navigation configuration is unavailable.");
            return;
        }

        const navigation = document.createElement("nav");
        navigation.id = "wfesc-navigation";
        navigation.className = "wfesc-navigation";

        Object.entries({
            position: "fixed",
            top: "auto",
            bottom: "7px",
            left: "7px",
            right: "7px",
            width: "auto",
            height: "auto",
            margin: "0",
            "z-index": "99990"
        }).forEach(([property, value]) => {
            navigation.style.setProperty(property, value, "important");
        });

        navigation.setAttribute("aria-label", "WFESC Navigation");

        const currentPage = getCurrentPage();

        config.buttons.forEach(function (button) {
            const pageFile = config.pages[button.page] || "index.html";
            const item = document.createElement("a");

            item.className = "wfesc-navigation-item";
            item.href = pageFile;
            item.dataset.navigationId = button.id;
            item.dataset.navigationPage = pageFile;
            item.setAttribute("aria-label", button.title);

            if (pageFile.toLowerCase() === currentPage) {
                item.classList.add("wfesc-navigation-active");
                item.setAttribute("aria-current", "page");
            }

            const icon = document.createElement("span");
            icon.className = "wfesc-navigation-icon";
            icon.textContent = button.icon;

            const title = document.createElement("span");
            title.className = "wfesc-navigation-title";
            title.textContent = button.title;

            item.append(icon, title);

            item.addEventListener("click", function (event) {
                if (pageFile.toLowerCase() === currentPage) {
                    event.preventDefault();
                }
            });

            navigation.appendChild(item);
        });

        document.documentElement.appendChild(navigation);
    }

    /*
     * الصفحة الرئيسية مستثناة.
     * كل صفحة أخرى تعرض رسالة إجبارية.
     */
    function createMaintenanceGate() {
        const currentPage = getCurrentPage();

        if (currentPage === "index.html") return;

        if (document.getElementById("wfesc-maintenance-gate")) return;

        const config = getConfig();
        const homePage =
            config && config.pages && config.pages.home
                ? config.pages.home
                : "./index.html";

        const overlay = document.createElement("div");
        overlay.id = "wfesc-maintenance-gate";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "wfesc-gate-title");
        overlay.setAttribute("aria-describedby", "wfesc-gate-description");

        const card = document.createElement("section");
        card.className = "wfesc-gate-card";

        const symbol = document.createElement("div");
        symbol.className = "wfesc-gate-symbol";
        symbol.setAttribute("aria-hidden", "true");
        symbol.textContent = "⌁";

        const title = document.createElement("h1");
        title.id = "wfesc-gate-title";
        title.textContent = "القسم مغلق مؤقتاً";

        const description = document.createElement("p");
        description.id = "wfesc-gate-description";
        description.textContent =
            "نعتذر عن عدم توفر هذه الخدمة حالياً بسبب عدم توفر السيرفر. عند توفر السيرفر، ستعود الخدمات ليصبح WFESC تطبيقاً متكاملاً.";

        const signature = document.createElement("p");
        signature.className = "wfesc-gate-signature";
        signature.textContent = "تحياتي، فريق اوفس WFESC";

        const tagline = document.createElement("p");
        tagline.className = "wfesc-gate-tagline";
        tagline.textContent = "ذاكرة العراق... بصورة مختلفة";

        const homeButton = document.createElement("a");
        homeButton.className = "wfesc-gate-home";
        homeButton.href = homePage;
        homeButton.textContent = "العودة إلى الصفحة الرئيسية";
        homeButton.setAttribute("aria-label", "العودة إلى الصفحة الرئيسية");

        card.append(
            symbol,
            title,
            description,
            signature,
            tagline,
            homeButton
        );

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        /*
         * منع التمرير والتفاعل مع الصفحة الخلفية.
         * النافذة لا تحتوي على زر إغلاق.
         */
        document.documentElement.classList.add("wfesc-gate-active");
        document.body.classList.add("wfesc-gate-active");

        /*
         * إبقاء التركيز داخل النافذة على زر العودة.
         */
        homeButton.focus({ preventScroll: true });
    }

    function refreshActiveButton() {
        const currentPage = getCurrentPage();

        document.querySelectorAll(".wfesc-navigation-item")
            .forEach(function (item) {
                const page = (
                    item.dataset.navigationPage || ""
                ).toLowerCase();

                item.classList.remove("wfesc-navigation-active");
                item.removeAttribute("aria-current");

                if (page === currentPage) {
                    item.classList.add("wfesc-navigation-active");
                    item.setAttribute("aria-current", "page");
                }
            });
    }

    function init() {
        if (!document.body) return;

        createNavigation();
        refreshActiveButton();
        createMaintenanceGate();
    }

    window.WFESCNavigationInit = init;
})();
