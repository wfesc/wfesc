/* =========================================================
   WFESC ENGINE
   Core Engine
   Version: 1.0.0
========================================================= */

(function (window) {

    "use strict";

    /* =====================================================
       ENGINE CORE
    ===================================================== */

    const WFESC_ENGINE = {

        name: "WFESC ENGINE",

        brand: "WFESC",

        version: "1.0.0",

        status: "ONLINE",

        initialized: false,


        /* =================================================
           INITIALIZE
        ================================================= */

        init() {

            if (this.initialized) {
                return;
            }

            this.initialized = true;

            console.log(
                "[WFESC ENGINE] Engine initialized"
            );

        },


        /* =================================================
           STATUS
        ================================================= */

        getStatus() {

            return this.status;

        },


        /* =================================================
           VERSION
        ================================================= */

        getVersion() {

            return this.version;

        },


        /* =================================================
           ENGINE INFORMATION
        ================================================= */

        getInfo() {

            return {

                name: this.name,

                brand: this.brand,

                version: this.version,

                status: this.status,

                initialized: this.initialized

            };

        }

    };


    /* =====================================================
       GLOBAL ENGINE
    ===================================================== */

    window.WFESC_ENGINE = WFESC_ENGINE;


    /* =====================================================
       AUTO INITIALIZE
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                WFESC_ENGINE.init();

            },
            {
                once: true
            }
        );

    } else {

        WFESC_ENGINE.init();

    }


})(window);
