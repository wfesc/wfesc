
/* =========================================================
   WFESC NAVIGATION UI
   GLOBAL MAINTENANCE GATE
   Real Page Navigation + Frosted Glass Lock
   ========================================================= */

(function () {
    "use strict";

    if (window.WFESCNavigationUI) return;
    window.WFESCNavigationUI = true;

    function getConfig() {
        return window.WFESCNavigationConfig || null;
    }

    function getCurrentPage() {
        const parts = window.location.pathname.split("/").filter(Boolean);
        const last = parts.length ? parts[parts.length - 1] : "";

        return !last || !last.includes(".")
            ? "index.html"
            : last.toLowerCase();
    }

    function normalizePage(page) {
        try {
            const url = new URL(page, window.location.href);
            return url.pathname.split("/").filter(Boolean).pop()?.toLowerCase()
                || "index.html";
        } catch (_) {
            return String(page || "index.html").toLowerCase();
        }
    }

    function isHomePage(page) {
        const config = getConfig();
        const home = config?.pages?.home || "index.html";

        return normalizePage(page) === normalizePage(home)
            || normalizePage(page) === "index.html";
    }

    /* =====================================================
       NAVIGATION
       ===================================================== */

    function createNavigation() {
        if (document.getElementById("wfesc-navigation")) return;

        const config = getConfig();

        if (!config?.buttons || !config?.pages) {
            console.warn("WFESC: Navigation configuration unavailable.");
            return;
        }

        const navigation = document.createElement("nav");
        navigation.id = "wfesc-navigation";
        navigation.className = "wfesc-navigation";
        navigation.setAttribute("aria-label", "WFESC Navigation");

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

        config.buttons.forEach(function (button) {
            const pageFile = config.pages[button.page] || "index.html";

            const item = document.createElement("a");
            item.className = "wfesc-navigation-item";
            item.href = new URL(pageFile, window.location.href).href;
            item.dataset.navigationId = button.id;
            item.dataset.navigationPage = pageFile;
            item.setAttribute("aria-label", button.title);

            const icon = document.createElement("span");
            icon.className = "wfesc-navigation-icon";
            icon.textContent = button.icon;

            const title = document.createElement("span");
            title.className = "wfesc-navigation-title";
            title.textContent = button.title;

            item.append(icon, title);

            item.addEventListener("click", function (event) {
                // الرئيسية تبقى قابلة للاستخدام بشكل طبيعي.
                if (isHomePage(pageFile)) {
                    if (isHomePage(getCurrentPage())) {
                        event.preventDefault();
                    }
                    return;
                }

                /*
                 * مهم:
                 * لا نلغي الانتقال إلى القسم.
                 * يفتح المتصفح الصفحة المطلوبة فعلياً،
                 * ثم تظهر عليها طبقة الصيانة.
                 */
            });

            navigation.appendChild(item);
        });

        document.documentElement.appendChild(navigation);
        refreshActiveButton();
    }

    /* =====================================================
       PREVENT INTERACTION WITH PAGE CONTENT
       ===================================================== */

    function lockBackground(overlay) {
        document.documentElement.classList.add("wfesc-gate-active");

        if (document.body) {
            document.body.classList.add("wfesc-gate-active");
        }

        /*
         * يمنع التركيز والتفاعل بلوحة المفاتيح مع
         * محتويات الصفحة الواقعة خلف نافذة الصيانة.
         */
        Array.from(document.body.children).forEach(function (element) {
            if (element === overlay) return;

            if (!element.hasAttribute("data-wfesc-inert-original")) {
                element.dataset.wfescInertOriginal =
                    element.hasAttribute("inert") ? "true" : "false";
            }

            element.setAttribute("inert", "");
        });

        /*
         * يمنع التمرير خلف النافذة مع حفظ إعدادات الصفحة.
         */
        if (!document.body.hasAttribute("data-wfesc-overflow-original")) {
            document.body.dataset.wfescOverflowOriginal =
                document.body.style.overflow || "";
        }

        document.body.style.setProperty("overflow", "hidden", "important");
    }

    /* =====================================================
       MAINTENANCE GATE
       ===================================================== */

    function showMaintenanceGate() {
        if (!document.body) return;

        const existing = document.getElementById("wfesc-maintenance-gate");

        if (existing) {
            lockBackground(existing);

            const button = existing.querySelector(".wfesc-gate-home");
            if (button) button.focus({ preventScroll: true });

            return;
        }

        const config = getConfig();
        const homePage = config?.pages?.home || "./index.html";

        const overlay = document.createElement("div");
        overlay.id = "wfesc-maintenance-gate";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "wfesc-gate-title");
        overlay.setAttribute("aria-describedby", "wfesc-gate-description");

        const card = document.createElement("section");
        card.className = "wfesc-gate-card";
        card.dir = "rtl";

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
        homeButton.href = new URL(homePage, window.location.href).href;
        homeButton.textContent = "العودة إلى الصفحة الرئيسية";
        homeButton.setAttribute(
            "aria-label",
            "العودة إلى الصفحة الرئيسية"
        );

        card.append(
            symbol,
            title,
            description,
            signature,
            tagline,
            homeButton
        );

        overlay.appendChild(card);

        /*
         * تُضاف النافذة إلى body حتى تظهر فوق محتوى القسم.
         * CSS مسؤول عن المظهر الزجاجي والشفافية.
         */
        document.body.appendChild(overlay);

        lockBackground(overlay);

        homeButton.focus({ preventScroll: true });
    }

    /* =====================================================
       ACTIVE NAVIGATION ITEM
       ===================================================== */

    function refreshActiveButton() {
        const currentPage = getCurrentPage();

        document.querySelectorAll(".wfesc-navigation-item").forEach(
            function (item) {
                const page = normalizePage(
                    item.dataset.navigationPage || "index.html"
                );

                const active = page === currentPage;

                item.classList.toggle("wfesc-navigation-active", active);

                if (active) {
                    item.setAttribute("aria-current", "page");
                } else {
                    item.removeAttribute("aria-current");
                }
            }
        );
    }

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function init() {
        if (!document.body) return;

        createNavigation();
        refreshActiveButton();

        /*
         * الرئيسية مفتوحة.
         * جميع الصفحات الأخرى تُحمّل فعلياً ثم تُقفل
         * خلف نافذة الصيانة الزجاجية.
         */
        if (!isHomePage(getCurrentPage())) {
            showMaintenanceGate();
        }
    }

    window.WFESCNavigationInit = init;

})();
