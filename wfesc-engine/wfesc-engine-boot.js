/* =========================================================
   WFESC ENGINE
   Boot Controller
   TEST 02 DESIGN
========================================================= */

(function (window, document) {

    "use strict";


    /* =====================================================
       CREATE ENGINE BOOT
    ===================================================== */

    function createBoot() {

        /*
         * منع إنشاء المحرك أكثر من مرة
         */

        if (document.getElementById("wfesc-engine-boot")) {
            return;
        }


        /*
         * إنشاء شاشة المحرك
         */

        const boot =
            document.createElement("div");

        boot.id =
            "wfesc-engine-boot";


        /* =================================================
           TEST 02 ENGINE STRUCTURE
        ================================================= */

        boot.innerHTML = `

            <!-- BACKGROUND HALO -->

            <div class="bootHalo"></div>


            <!-- BACKGROUND GRID -->

            <div class="bootGrid"></div>


            <!-- PARTICLES -->

            <div id="particles"></div>


            <!-- ENGINE CORE -->

            <div class="engineCore">

                <div class="energyField"></div>

                <div class="techRing"></div>

                <div class="radar"></div>

                <div class="orbit"></div>


                <!-- REACTOR -->

                <div class="reactor">

                    <div class="reactorShell"></div>

                    <div class="core">

                        <span class="coreText">
                            WFESC
                        </span>

                    </div>

                </div>


                <!-- SCANNER -->

                <div class="scanner"></div>

            </div>


            <!-- DATA LINES -->

            <div class="dataLine line1"></div>

            <div class="dataLine line2"></div>

            <div class="dataLine line3"></div>


            <!-- BRAND -->

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


            <!-- PROGRESS -->

            <div class="progress">

                <div class="progressBar"></div>

            </div>


            <!-- SYSTEM STATUS -->

            <div class="systemStatus">

                <span>
                    WFESC ENGINE CORE
                </span>

                <span class="statusCenter">
                    SYSTEM INITIALIZING
                </span>

                <span>
                    BUILD 0.5.0
                </span>

            </div>


            <!-- FINAL FLASH -->

            <div class="finalFlash"></div>

        `;


        /*
         * إضافة المحرك فوق الموقع بالكامل
         */

        document.body.appendChild(boot);


        /* =================================================
           PARTICLES
        ================================================= */

        const particleContainer =
            boot.querySelector("#particles");


        if (particleContainer) {

            for (
                let i = 0;
                i < 65;
                i++
            ) {

                const particle =
                    document.createElement("div");


                particle.className =
                    "particle";


                particle.style.left =
                    Math.random() * 100 + "%";


                particle.style.top =
                    (45 + Math.random() * 55) + "%";


                particle.style.animationDuration =
                    (2.5 + Math.random() * 4.5) + "s";


                particle.style.animationDelay =
                    (Math.random() * 4) + "s";


                const size =
                    .5 + Math.random() * 1.7;


                particle.style.width =
                    size + "px";


                particle.style.height =
                    size + "px";


                particleContainer.appendChild(
                    particle
                );

            }

        }


        /* =================================================
           ENGINE CORE
        ================================================= */

        if (
            window.WFESC_ENGINE &&
            typeof window.WFESC_ENGINE.init === "function"
        ) {

            window.WFESC_ENGINE.init();

        }


        /* =================================================
           BOOT TIMER
        ================================================= */

        setTimeout(function () {

            /*
             * بدء الخروج
             */

            boot.classList.add("hidden");


            /*
             * إزالة المحرك بعد انتهاء
             * transition
             */

            setTimeout(function () {

                if (boot.parentNode) {

                    boot.parentNode.removeChild(
                        boot
                    );

                }

            }, 1000);

        }, 4000);

    }


    /* =====================================================
       START
    ===================================================== */

    function start() {

        createBoot();

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once:true
            }
        );

    } else {

        start();

    }


})(window, document);
