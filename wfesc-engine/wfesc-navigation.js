/* =========================================================
   WFESC ENGINE
   Navigation Controller
   Version: 1.0.0
========================================================= */

(function (window) {

    "use strict";


    /* =====================================================
       WAIT FOR ENGINE
    ===================================================== */

    if (!window.WFESC_ENGINE) {

        console.error(
            "[WFESC ENGINE] Core engine not found."
        );

        return;

    }


    const ENGINE =
        window.WFESC_ENGINE;


    /* =====================================================
       NAVIGATION STATE
    ===================================================== */

    const Navigation = {

        currentPage: null,

        previousPage: null,

        isNavigating: false,


        /* =================================================
           INITIALIZE
        ================================================= */

        init() {

            this.currentPage =
                window.location.pathname;

            console.log(
                "[WFESC ENGINE] Navigation initialized"
            );

        },


        /* =================================================
           NAVIGATE
        ================================================= */

        navigate(url) {

            if (!url) {
                return;
            }


            if (this.isNavigating) {
                return;
            }


            if (
                url ===
                window.location.pathname
            ) {

                return;

            }


            this.isNavigating = true;


            this.previousPage =
                this.currentPage;


            this.currentPage =
                url;


            console.log(
                "[WFESC ENGINE] Navigating:",
                url
            );


            window.location.href = url;

        },


        /* =================================================
           BACK
        ================================================= */

        back() {

            if (this.isNavigating) {
                return;
            }


            if (history.length > 1) {

                this.isNavigating = true;

                history.back();

            }

        },


        /* =================================================
           GET CURRENT PAGE
        ================================================= */

        getCurrentPage() {

            return this.currentPage;

        },


        /* =================================================
           GET PREVIOUS PAGE
        ================================================= */

        getPreviousPage() {

            return this.previousPage;

        }

    };


    /* =====================================================
       ATTACH TO ENGINE
    ===================================================== */

    ENGINE.navigation =
        Navigation;


    /* =====================================================
       INITIALIZE
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                Navigation.init();

            },
            {
                once: true
            }
        );

    } else {

        Navigation.init();

    }


})(window);
