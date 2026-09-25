(function () {

    "use strict";

    /*
     * ==========================================
     * WFESC POSTS MODIFICATIONS
     * ==========================================
     *
     * هذا الملف مخصص للتعديلات المستقبلية
     * على posts.html بدون تعديل الملف الأصلي.
     *
     * هنا يمكن:
     * - إخفاء عناصر
     * - إظهار عناصر
     * - تعديل نصوص
     * - إضافة عناصر
     * - إزالة عناصر
     * - تغيير خصائص عناصر
     *
     * لا تعدل posts.html إلا بإضافة ملف التعديلات
     * مرة واحدة.
     */


    /* ==========================================
       الإعدادات
    ========================================== */

    const WFESC_POSTS_MODIFICATIONS = {

        /*
         * إخفاء البروفايل الموجود أعلى اليمين
         */
        hideTopProfile: true,


        /*
         * إمكانية تشغيل / إيقاف التعديلات
         */
        enabled: true

    };


    /* ==========================================
       أدوات مساعدة
    ========================================== */

    function hideElement(element) {

        if (!element) return;

        element.style.display = "none";

    }


    function showElement(element) {

        if (!element) return;

        element.style.display = "";

    }


    function findByText(text) {

        const elements =
            document.querySelectorAll("button, a, div, span");

        for (const element of elements) {

            if (
                element.textContent &&
                element.textContent.trim() === text
            ) {
                return element;
            }

        }

        return null;
    }


    /* ==========================================
       إزالة البروفايل العلوي
    ========================================== */

    function removeTopProfile() {

        if (
            !WFESC_POSTS_MODIFICATIONS.enabled ||
            !WFESC_POSTS_MODIFICATIONS.hideTopProfile
        ) {
            return;
        }


        /*
         * نحاول العثور على زر البروفايل
         * بعدة طرق حتى لا نعتمد على كلاس
         * واحد من الملف الأصلي.
         */

        const possibleElements = [

            document.querySelector(
                '[aria-label="الملف الشخصي"]'
            ),

            document.querySelector(
                '[aria-label="البروفايل"]'
            ),

            document.querySelector(
                '[title="الملف الشخصي"]'
            ),

            document.querySelector(
                '[title="البروفايل"]'
            ),

            findByText("الملف الشخصي"),

            findByText("البروفايل")

        ];


        let profileElement = null;


        for (const element of possibleElements) {

            if (element) {

                profileElement = element;

                break;

            }

        }


        if (!profileElement) {

            /*
             * إذا لم نجده عند التحميل الأول،
             * نترك المراقب يبحث عنه لاحقًا.
             */

            return;

        }


        /*
         * نحاول إخفاء الحاوية المناسبة
         * بدل إخفاء النص فقط.
         */

        let target = profileElement;


        if (
            profileElement.parentElement &&
            profileElement.parentElement.children.length <= 3
        ) {

            target = profileElement.parentElement;

        }


        hideElement(target);

    }


    /* ==========================================
       مراقبة الصفحة
    ========================================== */

    function startModificationObserver() {

        removeTopProfile();


        const observer =
            new MutationObserver(function () {

                removeTopProfile();

            });


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* ==========================================
       التشغيل
    ========================================== */

    function init() {

        if (!WFESC_POSTS_MODIFICATIONS.enabled) {
            return;
        }


        if (document.body) {

            startModificationObserver();

        } else {

            document.addEventListener(
                "DOMContentLoaded",
                startModificationObserver,
                {
                    once: true
                }
            );

        }

    }


    init();


    /*
     * جعل الإعدادات متاحة مستقبلاً
     * للتعديل من ملفات أخرى إذا احتجنا.
     */

    window.WFESCPostsModifications =
        WFESC_POSTS_MODIFICATIONS;


})();
