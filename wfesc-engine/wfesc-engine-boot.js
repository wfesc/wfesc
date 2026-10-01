/* =========================================================
   WFESC ENGINE
   Boot Controller
   Version: 1.0.0
========================================================= */

(function (window) {

    "use strict";

    if (!window.WFESC_ENGINE) {
        console.error("[WFESC ENGINE] Core engine not found.");
        return;
    }

    const ENGINE = window.WFESC_ENGINE;

    const Boot = {

        duration: 4000,
        started: false,
        finished: false,

        start() {

            if (this.started) return;

            this.started = true;

            console.log("[WFESC ENGINE] Boot started");

            const bootScreen =
                document.getElementById("wfesc-engine-boot");

            if (!bootScreen) {
                console.warn(
                    "[WFESC ENGINE] Boot screen not found."
                );
                return;
            }

            bootScreen.classList.remove("wfesc-engine-boot-hidden");

            setTimeout(() => {
                this.finish();
            }, this.duration);
        },

        finish() {

            if (this.finished) return;

            this.finished = true;

            console.log("[WFESC ENGINE] Boot finished");

            const bootScreen =
                document.getElementById("wfesc-engine-boot");

            if (!bootScreen) return;

            bootScreen.classList.add(
                "wfesc-engine-boot-hidden"
            );

            setTimeout(() => {

                if (bootScreen && bootScreen.parentNode) {
                    bootScreen.parentNode.removeChild(
                        bootScreen
                    );
                }

            }, 800);
        }

    };

    ENGINE.boot = Boot;

    function initializeBoot() {

        if (!window.WFESC_ENGINE.initialized) {
            console.warn(
                "[WFESC ENGINE] Engine is not initialized yet."
            );
        }

        Boot.start();
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeBoot,
            { once: true }
        );

    } else {

        initializeBoot();

    }

})(window);
