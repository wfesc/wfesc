/* =========================================================
   WFESC ENGINE
   Boot Controller
========================================================= */

(function (window, document) {

    "use strict";

    function startEngineBoot() {

        /*
         * إنشاء شاشة المحرك
         * بدون تعديل أي شيء من الموقع القديم
         */

        const boot = document.createElement("div");

        boot.id = "wfesc-engine-boot";

        boot.innerHTML = `
            <div class="wfesc-engine-content">

                <div class="wfesc-engine-powered">
                    POWERED BY
                </div>

                <div class="wfesc-engine-title">
                    WFESC
                </div>

                <div class="wfesc-engine-subtitle">
                    ENGINE
                </div>

                <div class="wfesc-engine-loader">
                    <span></span>
                </div>

            </div>
        `;

        /*
         * نضيف المحرك فوق الموقع
         */

        document.body.appendChild(boot);

        /*
         * تشغيل Core Engine إذا كان موجوداً
         */

        if (
            window.WFESC_ENGINE &&
            typeof window.WFESC_ENGINE.init === "function"
        ) {
            window.WFESC_ENGINE.init();
        }

        /*
         * بعد 4 ثواني يختفي المحرك
         */

        setTimeout(function () {

            boot.classList.add("hidden");

            /*
             * بعد انتهاء الأنيميشن نحذفه
             */

            setTimeout(function () {

                if (boot.parentNode) {
                    boot.parentNode.removeChild(boot);
                }

            }, 800);

        }, 4000);

    }


    /*
     * تشغيل المحرك بعد تجهيز الصفحة
     */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            startEngineBoot,
            { once:true }
        );

    } else {

        startEngineBoot();

    }

})(window, document);
