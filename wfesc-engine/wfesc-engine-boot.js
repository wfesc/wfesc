/* =========================================================
   WFESC ENGINE
   Boot Controller
   TEST 02
   Version: 0.5.2
========================================================= */

(function (window, document) {

    "use strict";

    const WINDOW_SESSION_KEY = "WFESC_ENGINE_SESSION";


    function createBoot() {

        /* منع التكرار داخل نفس الصفحة */
        if (document.getElementById("wfesc-engine-boot")) {
            return;
        }

        const boot = document.createElement("div");

        boot.id = "wfesc-engine-boot";

        boot.innerHTML = `

            <div class="bootHalo"></div>

            <div class="bootGrid"></div>

            <div id="particles"></div>

            <div class="engineCore">

                <div class="energyField"></div>

                <div class="techRing"></div>

                <div class="radar"></div>

                <div class="orbit"></div>

                <div class="reactor">

                    <div class="reactorShell"></div>

                    <div class="core">

                        <span class="coreText">
                            WFESC
                        </span>

                    </div>

                </div>

                <div class="scanner"></div>

            </div>

            <div class="dataLine line1"></div>
            <div class="dataLine line2"></div>
            <div class="dataLine line3"></div>

            <div class="bootBrand">

                <div class="powered">
                    POWERED BY
                </div>

                <div class="wfesc">
                    WFESC
                </div>

                <div class="engineLabel">
                    ENGINE
                </div>

            </div>

            <div class="progress">

                <div class="progressBar"></div>

            </div>

            <div class="systemStatus">

                <span>
                    WFESC ENGINE CORE
                </span>

                <span class="statusCenter">
                    SYSTEM INITIALIZING
                </span>

                <span>
                    BUILD 0.5.2
                </span>

            </div>

            <div class="finalFlash"></div>

        `;

        document.body.appendChild(boot);


        /* =========================================
           PARTICLES
        ========================================= */

        const particleContainer =
            boot.querySelector("#particles");

        if (particleContainer) {

            for (let i = 0; i < 65; i++) {

                const particle =
                    document.createElement("div");

                particle.className = "particle";

                particle.style.left =
                    (Math.random() * 100) + "%";

                particle.style.top =
                    (45 + Math.random() * 55) + "%";

                particle.style.animationDuration =
                    (2.5 + Math.random() * 4.5) + "s";

                particle.style.animationDelay =
                    (Math.random() * 4) + "s";

                const size =
                    0.5 + Math.random() * 1.7;

                particle.style.width =
                    size + "px";

                particle.style.height =
                    size + "px";

                particleContainer.appendChild(particle);

            }

        }


        /* =========================================
           ENGINE CORE
        ========================================= */

        if (
            window.WFESC_ENGINE &&
            typeof window.WFESC_ENGINE.init === "function"
        ) {

            window.WFESC_ENGINE.init();

        }


        /* =========================================
           BOOT COMPLETE
        ========================================= */

        setTimeout(function () {

            boot.classList.add("hidden");

            setTimeout(function () {

                if (boot.parentNode) {
                    boot.parentNode.removeChild(boot);
                }

            }, 1000);

        }, 4000);

    }


    /* =========================================
       START
    ========================================= */

    function start() {

        /*
         * window.name يبقى ثابتًا أثناء التنقل
         * بين صفحات نفس التبويب.
         *
         * عند إغلاق التبويب وفتح جلسة جديدة
         * يكون window.name فارغًا من جديد.
         */

        if (window.name === WINDOW_SESSION_KEY) {

            return;

        }


        /* تسجيل أن المحرك ظهر في هذه الجلسة */

        window.name = WINDOW_SESSION_KEY;


        /* تشغيل المحرك */

        createBoot();

    }


    /* =========================================
       DOM READY
    ========================================= */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            { once: true }
        );

    } else {

        start();

    }

})(window, document);
