/* =========================================================
   WFESC POSTS EXTENSION
   WFXP LOADER
   المشغل الرئيسي للنظام الثانوي
   ========================================================= */

(() => {

    "use strict";

    if (window.WFXP_LOADER_STARTED) {
        return;
    }

    window.WFXP_LOADER_STARTED = true;


    function WFXP_start() {

        console.log(
            "[WFXP] Posts extension started."
        );


        /*
         * إعادة تشغيل الوحدات بعد تحميل
         * نظام المنشورات الأصلي.
         */

        setTimeout(() => {

            if (
                window.WFXP_REPLIES &&
                typeof
                window.WFXP_REPLIES.refresh ===
                "function"
            ) {

                window.WFXP_REPLIES.refresh();

            }


            if (
                window.WFXP_REACTIONS &&
                typeof
                window.WFXP_REACTIONS.refresh ===
                "function"
            ) {

                window.WFXP_REACTIONS.refresh();

            }

        }, 500);

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            WFXP_start
        );

    } else {

        WFXP_start();

    }


    window.WFXP_LOADER = {

        start: WFXP_start,

        version: "1.0.0"

    };


})();
