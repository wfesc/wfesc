/* =========================================================
   WFESC POSTS LOADER
   File: posts-featwres/posts-loader.js
   ========================================================= */

(function () {

    "use strict";

    /*
     * -------------------------------------------------------
     * WFESC POSTS FEATURES NAMESPACE
     * -------------------------------------------------------
     */

    window.WFESC_POSTS_FEATURES =
        window.WFESC_POSTS_FEATURES || {};

    const FEATURES =
        window.WFESC_POSTS_FEATURES;


    /*
     * -------------------------------------------------------
     * BASIC STATE
     * -------------------------------------------------------
     */

    FEATURES.loaderLoaded = true;

    FEATURES.version =
        "1.0.0";

    FEATURES.started =
        false;

    FEATURES.ready =
        false;

    FEATURES.loadedFiles =
        [];


    /*
     * -------------------------------------------------------
     * LOG HELPERS
     * -------------------------------------------------------
     */

    function log(
        ...args
    ) {

        console.log(
            "[WFESC POSTS]",
            ...args
        );

    }


    function warn(
        ...args
    ) {

        console.warn(
            "[WFESC POSTS]",
            ...args
        );

    }


    function error(
        ...args
    ) {

        console.error(
            "[WFESC POSTS]",
            ...args
        );

    }


    /*
     * -------------------------------------------------------
     * LOAD SCRIPT
     * -------------------------------------------------------
     *
     * Each secondary file is loaded only once.
     *
     * This loader does NOT:
     *
     * - initialize Supabase
     * - reload posts
     * - replace posts.html functions
     * - create duplicate event listeners
     * - modify the original features.js
     *
     * -------------------------------------------------------
     */

    function loadScript(
        fileName
    ) {

        return new Promise(
            function (
                resolve
            ) {

                const existing =
                    document.querySelector(
                        `script[data-wfesc-posts-feature="${fileName}"]`
                    );

                if(existing){

                    if(
                        existing.dataset.loaded === "true"
                    ){

                        resolve(
                            true
                        );

                        return;

                    }

                    existing.addEventListener(
                        "load",
                        function () {

                            resolve(
                                true
                            );

                        },
                        {
                            once:true
                        }
                    );

                    existing.addEventListener(
                        "error",
                        function () {

                            resolve(
                                false
                            );

                        },
                        {
                            once:true
                        }
                    );

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    new URL(
                        `./${fileName}`,
                        document.currentScript?.src ||
                        window.location.href
                    ).href;

                script.async =
                    false;

                script.dataset.wfescPostsFeature =
                    fileName;


                script.addEventListener(
                    "load",
                    function () {

                        script.dataset.loaded =
                            "true";

                        FEATURES.loadedFiles.push(
                            fileName
                        );

                        log(
                            `تم تحميل الملف: ${fileName}`
                        );

                        resolve(
                            true
                        );

                    },
                    {
                        once:true
                    }
                );


                script.addEventListener(
                    "error",
                    function () {

                        warn(
                            `تعذر تحميل الملف: ${fileName}`
                        );

                        resolve(
                            false
                        );

                    },
                    {
                        once:true
                    }
                );


                document.head.appendChild(
                    script
                );

            }
        );

    }


    /*
     * -------------------------------------------------------
     * FEATURE FILES
     * -------------------------------------------------------
     *
     * ترتيب التحميل مهم.
     *
     * لا نضع هنا posts-loader.js نفسه.
     *
     * -------------------------------------------------------
     */

    const FEATURE_FILES = [

        "posts-extra.js",

        "posts-ui.js",

        "posts-settingrss.js"

    ];


    /*
     * -------------------------------------------------------
     * START FEATURES
     * -------------------------------------------------------
     */

    async function startFeatures(){

        if(
            FEATURES.started
        ){

            return;

        }

        FEATURES.started =
            true;


        log(
            "بدء تشغيل إضافات منشورات WFESC..."
        );


        for(
            const fileName
            of FEATURE_FILES
        ){

            try{

                await loadScript(
                    fileName
                );

            }catch(
                loadError
            ){

                error(
                    `خطأ أثناء تحميل ${fileName}:`,
                    loadError
                );

            }

        }


        /*
         * ---------------------------------------------------
         * READY
         * ---------------------------------------------------
         */

        FEATURES.ready =
            true;


        window.dispatchEvent(
            new CustomEvent(
                "wfesc-posts-features-ready",
                {
                    detail:
                        FEATURES
                }
            )
        );


        log(
            "تم تشغيل نظام إضافات منشورات WFESC."
        );

    }


    /*
     * -------------------------------------------------------
     * DOM READY
     * -------------------------------------------------------
     */

    function initialize(){

        if(
            FEATURES.initialized
        ){

            return;

        }

        FEATURES.initialized =
            true;


        startFeatures();

    }


    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:true
            }
        );

    }else{

        initialize();

    }


    /*
     * -------------------------------------------------------
     * PUBLIC API
     * -------------------------------------------------------
     */

    FEATURES.loadScript =
        loadScript;

    FEATURES.start =
        startFeatures;


})();
