/* =========================================================
   WFESC POSTS - DEFAULT USER AVATAR
   ملف مستقل عن النظام الأصلي
========================================================= */

(function () {

    "use strict";

    /* -----------------------------------------------------
       إعداد الصورة الافتراضية
       
       لتغيير الصورة مستقبلًا:
       استبدل ملف wf-default-avatar.jpg فقط
       ولا تحتاج إلى تعديل هذا الكود.
    ----------------------------------------------------- */

    const WFESC_POSTS_AVATAR = {
        defaultImage: "./posts-featwres/wf-default-avatar.jpg"
    };


    /* -----------------------------------------------------
       تحديد هل العنصر يحتوي على صورة مستخدم فعلية
    ----------------------------------------------------- */

    function hasRealImage(img) {

        if (!img) return false;

        const src = img.getAttribute("src");

        if (!src) return false;

        const value = src.trim().toLowerCase();

        if (
            value === "" ||
            value === "#" ||
            value === "null" ||
            value === "undefined"
        ) {
            return false;
        }

        return true;
    }


    /* -----------------------------------------------------
       وضع الصورة الافتراضية فقط عندما لا توجد صورة
    ----------------------------------------------------- */

    function applyDefaultAvatar(img) {

        if (!img) return;

        if (!hasRealImage(img)) {

            img.src = WFESC_POSTS_AVATAR.defaultImage;

            img.setAttribute(
                "data-wfesc-default-avatar",
                "true"
            );

            img.onerror = function () {

                console.warn(
                    "WFESC: Default avatar image could not be loaded."
                );

            };
        }
    }


    /* -----------------------------------------------------
       البحث عن صور المستخدمين
       
       يعتمد على العناصر التي تحمل:
       data-user-avatar
    ----------------------------------------------------- */

    function scanUserAvatars() {

        const avatars = document.querySelectorAll(
            "img[data-user-avatar]"
        );

        avatars.forEach(function (img) {
            applyDefaultAvatar(img);
        });
    }


    /* -----------------------------------------------------
       مراقبة العناصر التي تظهر لاحقًا
       
       مفيد إذا المنشورات يتم تحميلها بعد فتح الصفحة.
    ----------------------------------------------------- */

    function observeNewAvatars() {

        if (!document.body) return;

        const observer = new MutationObserver(function (mutations) {

            mutations.forEach(function (mutation) {

                mutation.addedNodes.forEach(function (node) {

                    if (node.nodeType !== 1) return;

                    if (
                        node.matches &&
                        node.matches("img[data-user-avatar]")
                    ) {
                        applyDefaultAvatar(node);
                    }

                    if (node.querySelectorAll) {

                        const avatars =
                            node.querySelectorAll(
                                "img[data-user-avatar]"
                            );

                        avatars.forEach(function (img) {
                            applyDefaultAvatar(img);
                        });
                    }

                });

            });

        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    /* -----------------------------------------------------
       تشغيل الإضافة
    ----------------------------------------------------- */

    function initialize() {

        scanUserAvatars();
        observeNewAvatars();

        console.log(
            "WFESC Posts Default Avatar Extension Loaded"
        );
    }


    /* -----------------------------------------------------
       تشغيل بعد تحميل الصفحة
    ----------------------------------------------------- */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();
