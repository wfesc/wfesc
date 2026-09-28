/* =========================================================
   WFESC MESSAGES SETTINGS
   messages/messages-settings.js
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       DEFAULT SETTINGS
    ===================================================== */

    const DEFAULT_SETTINGS = {

        /* حجم النص */
        scale: 1,

        /* حجم/مقاسات الفقاعة الجديدة */
        messageBubbleWidth: 78,
        messageBubbleVerticalPadding: 10,
        messageBubbleEdgeGap: 12,

        /* رسائلي */
        ownColor: "#9aa7ff",
        ownIntensity: 100,
        ownOpacity: 14,
        ownRadius: 18,
        ownShape: "normal",

        /* رسائل الطرف الآخر */
        otherColor: "#ffffff",
        otherIntensity: 100,
        otherOpacity: 7,
        otherRadius: 18,
        otherShape: "normal",

        /* إضافات */
        glass: true,
        animations: true

    };


    /* =====================================================
       PRESET COLORS
    ===================================================== */

    const PRESET_COLORS = [

        "#9aa7ff",
        "#36e27b",
        "#5ee7ff",
        "#ff6b9d",
        "#ff8a4c",
        "#ffd166",
        "#c77dff",
        "#4dabf7",
        "#22c55e",
        "#ef4444",

        "#f97316",
        "#eab308",
        "#14b8a6",
        "#06b6d4",
        "#3b82f6",
        "#6366f1",
        "#8b5cf6",
        "#ec4899",
        "#f43f5e",
        "#ffffff"

    ];


    /* =====================================================
       STATE
    ===================================================== */

    let currentSettings =
        cloneSettings(DEFAULT_SETTINGS);

    let draftSettings =
        cloneSettings(DEFAULT_SETTINGS);

    let initialized = false;

    let styleElement = null;

    let successTimer = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    function cloneSettings(settings) {

        return Object.assign(
            {},
            settings
        );

    }


    function clamp(value, min, max) {

        return Math.min(
            max,
            Math.max(
                min,
                value
            )
        );

    }


    function safeNumber(
        value,
        fallback
    ) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;

    }


    function normalizeHex(
        value,
        fallback
    ) {

        if (
            typeof value !== "string"
        ) {

            return fallback;

        }

        let hex =
            value.trim();

        if (
            !hex.startsWith("#")
        ) {

            hex =
                "#" + hex;

        }

        if (
            /^#[0-9a-fA-F]{3}$/.test(hex)
        ) {

            hex =
                "#" +
                hex[1] + hex[1] +
                hex[2] + hex[2] +
                hex[3] + hex[3];

        }

        if (
            !/^#[0-9a-fA-F]{6}$/.test(hex)
        ) {

            return fallback;

        }

        return hex.toLowerCase();

    }


    function getBubbleRadius(
        shape,
        radius
    ) {

        const r =
            clamp(
                safeNumber(
                    radius,
                    18
                ),
                4,
                40
            );


        switch (shape) {

            case "pill":

                return "999px";


            case "soft":

                return Math.max(
                    r,
                    24
                ) + "px";


            case "square":

                return Math.min(
                    r,
                    7
                ) + "px";


            default:

                return r + "px";

        }

    }


    /* =====================================================
       SANITIZE SETTINGS
    ===================================================== */

    function sanitizeSettings(
        settings
    ) {

        const source =
            settings || {};


        const safe = {

            /* النص */
            scale:
                clamp(
                    safeNumber(
                        source.scale,
                        DEFAULT_SETTINGS.scale
                    ),
                    0.85,
                    1.25
                ),


            /* -------------------------------------------------
               عرض الفقاعة
               45% = ضيقة
               96% = واسعة
               ------------------------------------------------- */

            messageBubbleWidth:
                clamp(
                    safeNumber(
                        source.messageBubbleWidth,
                        DEFAULT_SETTINGS.messageBubbleWidth
                    ),
                    45,
                    96
                ),


            /* -------------------------------------------------
               الارتفاع العمودي للفقاعة
               يتم تطبيقه كـ padding
               حتى لا ينكسر طول الرسالة
               ------------------------------------------------- */

            messageBubbleVerticalPadding:
                clamp(
                    safeNumber(
                        source.messageBubbleVerticalPadding,
                        DEFAULT_SETTINGS.messageBubbleVerticalPadding
                    ),
                    4,
                    24
                ),


            /* -------------------------------------------------
               المسافة عن إطار الشاشة
               ------------------------------------------------- */

            messageBubbleEdgeGap:
                clamp(
                    safeNumber(
                        source.messageBubbleEdgeGap,
                        DEFAULT_SETTINGS.messageBubbleEdgeGap
                    ),
                    0,
                    32
                ),


            /* رسائلي */

            ownColor:
                normalizeHex(
                    source.ownColor,
                    DEFAULT_SETTINGS.ownColor
                ),


            ownIntensity:
                clamp(
                    safeNumber(
                        source.ownIntensity,
                        DEFAULT_SETTINGS.ownIntensity
                    ),
                    0,
                    100
                ),


            ownOpacity:
                clamp(
                    safeNumber(
                        source.ownOpacity,
                        DEFAULT_SETTINGS.ownOpacity
                    ),
                    0,
                    100
                ),


            ownRadius:
                clamp(
                    safeNumber(
                        source.ownRadius,
                        DEFAULT_SETTINGS.ownRadius
                    ),
                    4,
                    40
                ),


            ownShape:
                [
                    "normal",
                    "pill",
                    "soft",
                    "square"
                ].includes(
                    source.ownShape
                )
                    ? source.ownShape
                    : DEFAULT_SETTINGS.ownShape,


            /* الطرف الآخر */

            otherColor:
                normalizeHex(
                    source.otherColor,
                    DEFAULT_SETTINGS.otherColor
                ),


            otherIntensity:
                clamp(
                    safeNumber(
                        source.otherIntensity,
                        DEFAULT_SETTINGS.otherIntensity
                    ),
                    0,
                    100
                ),


            otherOpacity:
                clamp(
                    safeNumber(
                        source.otherOpacity,
                        DEFAULT_SETTINGS.otherOpacity
                    ),
                    0,
                    100
                ),


            otherRadius:
                clamp(
                    safeNumber(
                        source.otherRadius,
                        DEFAULT_SETTINGS.otherRadius
                    ),
                    4,
                    40
                ),


            otherShape:
                [
                    "normal",
                    "pill",
                    "soft",
                    "square"
                ].includes(
                    source.otherShape
                )
                    ? source.otherShape
                    : DEFAULT_SETTINGS.otherShape,


            /* إضافات */

            glass:
                source.glass !== false,


            animations:
                source.animations !== false

        };


        return safe;

    }


    /* =====================================================
       USER STORAGE KEY
    ===================================================== */

    function getCurrentUserId() {

        try {

            const core =
                window.WFESC_MESSAGES_CORE;


            if (
                core &&
                typeof core.getCurrentUser === "function"
            ) {

                const user =
                    core.getCurrentUser();


                if (
                    user &&
                    user.id
                ) {

                    return String(
                        user.id
                    );

                }

            }

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS] user lookup failed",
                error
            );

        }


        return "guest";

    }


    function getStorageKey() {

        return (
            "wfesc_message_settings_" +
            getCurrentUserId()
        );

    }


    /* =====================================================
       LOAD
    ===================================================== */

    function loadSettings() {

        let saved = null;


        try {

            const raw =
                localStorage.getItem(
                    getStorageKey()
                );


            if (raw) {

                saved =
                    JSON.parse(raw);

            }

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS] load failed",
                error
            );

        }


        if (
            !saved ||
            typeof saved !== "object"
        ) {

            return cloneSettings(
                DEFAULT_SETTINGS
            );

        }


        return sanitizeSettings(
            Object.assign(
                {},
                DEFAULT_SETTINGS,
                saved
            )
        );

    }


    /* =====================================================
       SAVE
    ===================================================== */

    function saveSettings(
        settings
    ) {

        const safe =
            sanitizeSettings(
                settings
            );


        try {

            localStorage.setItem(
                getStorageKey(),
                JSON.stringify(safe)
            );

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS] save failed",
                error
            );

        }

    }


    /* =====================================================
       CSS STYLE
    ===================================================== */

    function ensureStyleElement() {

        if (
            styleElement &&
            document.head.contains(
                styleElement
            )
        ) {

            return styleElement;

        }


        styleElement =
            document.createElement(
                "style"
            );


        styleElement.id =
            "wfesc-message-settings-style";


        document.head.appendChild(
            styleElement
        );


        return styleElement;

    }


    /* =====================================================
       APPLY SETTINGS TO PAGE
    ===================================================== */

    function applySettings(
        settings
    ) {

        const safe =
            sanitizeSettings(
                settings
            );


        const root =
            document.documentElement;


        /* -------------------------------------------------
           النسب
           ------------------------------------------------- */

        const ownIntensity =
            safe.ownIntensity / 100;

        const otherIntensity =
            safe.otherIntensity / 100;


        const ownOpacity =
            (safe.ownOpacity / 100) *
            ownIntensity;

        const otherOpacity =
            (safe.otherOpacity / 100) *
            otherIntensity;


        /* -------------------------------------------------
           حدود الفقاعات
           ------------------------------------------------- */

        const ownBorderOpacity =
            0.18 *
            ownIntensity;

        const otherBorderOpacity =
            0.095 *
            otherIntensity;


        /* -------------------------------------------------
           CSS VARIABLES
           ------------------------------------------------- */

        root.style.setProperty(
            "--message-text-scale",
            safe.scale
        );


        /*
         * يبقى 1 حتى لا تتدخل
         * scale القديمة في حجم الفقاعة.
         */
        root.style.setProperty(
            "--message-bubble-scale",
            "1"
        );


        /*
         * عرض الفقاعة:
         * يتحكم في max-width وليس width الإجباري،
         * حتى تبقى الرسائل القصيرة بحجم النص.
         */
        root.style.setProperty(
            "--message-bubble-width",
            safe.messageBubbleWidth + "%"
        );


        /*
         * الارتفاع العمودي:
         * يتحكم بـ padding العلوي والسفلي.
         */
        root.style.setProperty(
            "--message-bubble-vertical-padding",
            safe.messageBubbleVerticalPadding + "px"
        );


        /*
         * المسافة عن إطار الشاشة.
         */
        root.style.setProperty(
            "--message-bubble-edge-gap",
            safe.messageBubbleEdgeGap + "px"
        );


        /*
         * الإعدادات القديمة.
         */

        root.style.setProperty(
            "--own-bubble-radius",
            getBubbleRadius(
                safe.ownShape,
                safe.ownRadius
            )
        );


        root.style.setProperty(
            "--other-bubble-radius",
            getBubbleRadius(
                safe.otherShape,
                safe.otherRadius
            )
        );


        root.style.setProperty(
            "--own-bubble-color",
            safe.ownColor
        );


        root.style.setProperty(
            "--other-bubble-color",
            safe.otherColor
        );


        root.style.setProperty(
            "--own-bubble-opacity",
            ownOpacity
        );


        root.style.setProperty(
            "--other-bubble-opacity",
            otherOpacity
        );


        root.style.setProperty(
            "--own-bubble-border-opacity",
            ownBorderOpacity
        );


        root.style.setProperty(
            "--other-bubble-border-opacity",
            otherBorderOpacity
        );


        root.style.setProperty(
            "--own-bubble-intensity",
            ownIntensity
        );


        root.style.setProperty(
            "--other-bubble-intensity",
            otherIntensity
        );


        /* -------------------------------------------------
           الزجاج
           ------------------------------------------------- */

        if (safe.glass) {

            root.style.setProperty(
                "--wfesc-message-blur",
                "18px"
            );

        } else {

            root.style.setProperty(
                "--wfesc-message-blur",
                "0px"
            );

        }


        /* -------------------------------------------------
           تحديث الفقاعات الموجودة
           ------------------------------------------------- */

        applyBubbleAttributes(
            safe
        );


        /* -------------------------------------------------
           المعاينة
           ------------------------------------------------- */

        updatePreview(
            safe
        );


        /* -------------------------------------------------
           STYLE
           ------------------------------------------------- */

        const style =
            ensureStyleElement();


        style.textContent = `

            /*
             * ============================================
             * حجم الفقاعات
             * ============================================
             */

            #chatView > #chatMessages .message-row {

                padding-inline:
                    var(--message-bubble-edge-gap, 12px)
                    !important;

            }


            #chatView > #chatMessages .message-row
            .message-bubble {

                max-width:
                    var(--message-bubble-width, 78%)
                    !important;

                width:
                    fit-content
                    !important;

                padding-top:
                    var(--message-bubble-vertical-padding, 10px)
                    !important;

                padding-bottom:
                    var(--message-bubble-vertical-padding, 10px)
                    !important;

                box-sizing:
                    border-box
                    !important;

            }


            /*
             * حماية من تجاوز عرض الشاشة
             */

            #chatView > #chatMessages .message-bubble {

                min-width:
                    0
                    !important;

                overflow-wrap:
                    anywhere
                    !important;

                word-break:
                    break-word
                    !important;

            }


            /*
             * ============================================
             * المعاينة
             * ============================================
             */

            .preview-message {

                max-width:
                    var(--message-bubble-width, 78%)
                    !important;

                width:
                    fit-content
                    !important;

                padding-top:
                    var(--message-bubble-vertical-padding, 10px)
                    !important;

                padding-bottom:
                    var(--message-bubble-vertical-padding, 10px)
                    !important;

                box-sizing:
                    border-box
                    !important;

            }


            /*
             * ============================================
             * الزجاج
             * ============================================
             */

            .message-row.mine .message-bubble,
            .message-row.theirs .message-bubble {

                backdrop-filter:
                    blur(var(--wfesc-message-blur,18px))
                    saturate(135%);

                -webkit-backdrop-filter:
                    blur(var(--wfesc-message-blur,18px))
                    saturate(135%);

            }


            .preview-message {

                backdrop-filter:
                    blur(var(--wfesc-message-blur,18px))
                    saturate(135%);

                -webkit-backdrop-filter:
                    blur(var(--wfesc-message-blur,18px))
                    saturate(135%);

            }


            ${
                safe.animations
                    ? ""
                    : `
                    .message-row,
                    .message-new,
                    .preview-message {

                        animation:none !important;
                        transition:none !important;

                    }
                    `
            }

        `;

    }


    /* =====================================================
       APPLY DATA ATTRIBUTES
    ===================================================== */

    function applyBubbleAttributes(
        settings
    ) {

        const safe =
            sanitizeSettings(
                settings
            );


        /*
         * الفقاعات الحقيقية - رسائلي
         */

        const ownBubbles =
            document.querySelectorAll(
                ".message-row.mine .message-bubble"
            );


        ownBubbles.forEach(
            function (bubble) {

                bubble.dataset.bubbleShape =
                    safe.ownShape;

            }
        );


        /*
         * الفقاعات الحقيقية - الطرف الآخر
         */

        const otherBubbles =
            document.querySelectorAll(
                ".message-row.theirs .message-bubble"
            );


        otherBubbles.forEach(
            function (bubble) {

                bubble.dataset.bubbleShape =
                    safe.otherShape;

            }
        );


        /*
         * المعاينة - رسائلي
         */

        const previewOwn =
            $("previewOwnMessage");


        if (previewOwn) {

            previewOwn.dataset.bubbleShape =
                safe.ownShape;

        }


        /*
         * المعاينة - الطرف الآخر
         */

        const previewOther =
            $("previewOtherMessage");


        if (previewOther) {

            previewOther.dataset.bubbleShape =
                safe.otherShape;

        }

    }


    /* =====================================================
       SYNC UI
    ===================================================== */

    function syncSettingsUI(
        settings
    ) {

        const safe =
            sanitizeSettings(
                settings
            );


        /* -------------------------------------------------
           حجم النص
           ------------------------------------------------- */

        const sizeRange =
            $("messageSizeRange");


        const sizeValue =
            $("messageSizeValue");


        if (sizeRange) {

            sizeRange.value =
                Math.round(
                    safe.scale * 100
                );

        }


        if (sizeValue) {

            sizeValue.textContent =
                Math.round(
                    safe.scale * 100
                ) + "%";

        }


        /* -------------------------------------------------
           عرض الفقاعة
           ------------------------------------------------- */

        const bubbleWidth =
            $("messageBubbleWidth");


        const bubbleWidthValue =
            $("messageBubbleWidthValue");


        if (bubbleWidth) {

            bubbleWidth.value =
                safe.messageBubbleWidth;

        }


        if (bubbleWidthValue) {

            bubbleWidthValue.textContent =
                safe.messageBubbleWidth + "%";

        }


        /* -------------------------------------------------
           ارتفاع الفقاعة
           ------------------------------------------------- */

        const bubbleHeight =
            $("messageBubbleHeight");


        const bubbleHeightValue =
            $("messageBubbleHeightValue");


        if (bubbleHeight) {

            bubbleHeight.value =
                safe.messageBubbleVerticalPadding;

        }


        if (bubbleHeightValue) {

            bubbleHeightValue.textContent =
                safe.messageBubbleVerticalPadding + "px";

        }


        /* -------------------------------------------------
           المسافة عن الإطار
           ------------------------------------------------- */

        const bubbleEdgeGap =
            $("messageBubbleEdgeGap");


        const bubbleEdgeGapValue =
            $("messageBubbleEdgeGapValue");


        if (bubbleEdgeGap) {

            bubbleEdgeGap.value =
                safe.messageBubbleEdgeGap;

        }


        if (bubbleEdgeGapValue) {

            bubbleEdgeGapValue.textContent =
                safe.messageBubbleEdgeGap + "px";

        }


        /* -------------------------------------------------
           شدة لون رسائلي
           ------------------------------------------------- */

        const ownIntensity =
            $("ownColorIntensity");


        const ownIntensityValue =
            $("ownColorIntensityValue");


        if (ownIntensity) {

            ownIntensity.value =
                safe.ownIntensity;

        }


        if (ownIntensityValue) {

            ownIntensityValue.textContent =
                safe.ownIntensity + "%";

        }


        /* -------------------------------------------------
           شفافية رسائلي
           ------------------------------------------------- */

        const ownOpacity =
            $("ownColorTransparency");


        const ownOpacityValue =
            $("ownColorTransparencyValue");


        if (ownOpacity) {

            ownOpacity.value =
                safe.ownOpacity;

        }


        if (ownOpacityValue) {

            ownOpacityValue.textContent =
                safe.ownOpacity + "%";

        }


        /* -------------------------------------------------
           شكل رسائلي
           ------------------------------------------------- */

        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            ownShape.value =
                safe.ownShape;

        }


        /* -------------------------------------------------
           استدارة رسائلي
           ------------------------------------------------- */

        const ownRadius =
            $("ownBubbleRadius");


        const ownRadiusValue =
            $("ownBubbleRadiusValue");


        if (ownRadius) {

            ownRadius.value =
                safe.ownRadius;

        }


        if (ownRadiusValue) {

            ownRadiusValue.textContent =
                safe.ownRadius + "px";

        }


        /* -------------------------------------------------
           شكل الطرف الآخر
           ------------------------------------------------- */

        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            otherShape.value =
                safe.otherShape;

        }


        /* -------------------------------------------------
           شدة لون الطرف الآخر
           ------------------------------------------------- */

        const otherIntensity =
            $("otherColorIntensity");


        const otherIntensityValue =
            $("otherColorIntensityValue");


        if (otherIntensity) {

            otherIntensity.value =
                safe.otherIntensity;

        }


        if (otherIntensityValue) {

            otherIntensityValue.textContent =
                safe.otherIntensity + "%";

        }


        /* -------------------------------------------------
           شفافية الطرف الآخر
           ------------------------------------------------- */

        const otherOpacity =
            $("otherColorTransparency");


        const otherOpacityValue =
            $("otherColorTransparencyValue");


        if (otherOpacity) {

            otherOpacity.value =
                safe.otherOpacity;

        }


        if (otherOpacityValue) {

            otherOpacityValue.textContent =
                safe.otherOpacity + "%";

        }


        /* -------------------------------------------------
           استدارة الطرف الآخر
           ------------------------------------------------- */

        const otherRadius =
            $("otherBubbleRadius");


        const otherRadiusValue =
            $("otherBubbleRadiusValue");


        if (otherRadius) {

            otherRadius.value =
                safe.otherRadius;

        }


        if (otherRadiusValue) {

            otherRadiusValue.textContent =
                safe.otherRadius + "px";

        }


        /* -------------------------------------------------
           Color pickers
           ------------------------------------------------- */

        const ownPicker =
            $("ownBubbleColorPicker");


        if (ownPicker) {

            ownPicker.value =
                safe.ownColor;

        }


        const otherPicker =
            $("otherBubbleColorPicker");


        if (otherPicker) {

            otherPicker.value =
                safe.otherColor;

        }


        updateColorGridActiveState(
            "ownMessageColors",
            safe.ownColor
        );


        updateColorGridActiveState(
            "otherMessageColors",
            safe.otherColor
        );

    }


    /* =====================================================
       READ UI
    ===================================================== */

    function readDraftFromUI() {

        const next =
            cloneSettings(
                draftSettings
            );


        /* -------------------------------------------------
           حجم النص
           ------------------------------------------------- */

        const sizeRange =
            $("messageSizeRange");


        if (sizeRange) {

            next.scale =
                clamp(
                    safeNumber(
                        sizeRange.value,
                        100
                    ) / 100,
                    0.85,
                    1.25
                );

        }


        /* -------------------------------------------------
           عرض الفقاعة
           ------------------------------------------------- */

        const bubbleWidth =
            $("messageBubbleWidth");


        if (bubbleWidth) {

            next.messageBubbleWidth =
                clamp(
                    safeNumber(
                        bubbleWidth.value,
                        DEFAULT_SETTINGS.messageBubbleWidth
                    ),
                    45,
                    96
                );

        }


        /* -------------------------------------------------
           ارتفاع الفقاعة
           ------------------------------------------------- */

        const bubbleHeight =
            $("messageBubbleHeight");


        if (bubbleHeight) {

            next.messageBubbleVerticalPadding =
                clamp(
                    safeNumber(
                        bubbleHeight.value,
                        DEFAULT_SETTINGS.messageBubbleVerticalPadding
                    ),
                    4,
                    24
                );

        }


        /* -------------------------------------------------
           المسافة عن الإطار
           ------------------------------------------------- */

        const bubbleEdgeGap =
            $("messageBubbleEdgeGap");


        if (bubbleEdgeGap) {

            next.messageBubbleEdgeGap =
                clamp(
                    safeNumber(
                        bubbleEdgeGap.value,
                        DEFAULT_SETTINGS.messageBubbleEdgeGap
                    ),
                    0,
                    32
                );

        }


        /* -------------------------------------------------
           شدة لون رسائلي
           ------------------------------------------------- */

        const ownIntensity =
            $("ownColorIntensity");


        if (ownIntensity) {

            next.ownIntensity =
                clamp(
                    safeNumber(
                        ownIntensity.value,
                        100
                    ),
                    0,
                    100
                );

        }


        /* -------------------------------------------------
           شفافية رسائلي
           ------------------------------------------------- */

        const ownOpacity =
            $("ownColorTransparency");


        if (ownOpacity) {

            next.ownOpacity =
                clamp(
                    safeNumber(
                        ownOpacity.value,
                        14
                    ),
                    0,
                    100
                );

        }


        /* -------------------------------------------------
           شكل رسائلي
           ------------------------------------------------- */

        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            next.ownShape =
                ownShape.value;

        }


        /* -------------------------------------------------
           استدارة رسائلي
           ------------------------------------------------- */

        const ownRadius =
            $("ownBubbleRadius");


        if (ownRadius) {

            next.ownRadius =
                clamp(
                    safeNumber(
                        ownRadius.value,
                        18
                    ),
                    4,
                    40
                );

        }


        /* -------------------------------------------------
           شكل الطرف الآخر
           ------------------------------------------------- */

        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            next.otherShape =
                otherShape.value;

        }


        /* -------------------------------------------------
           شدة لون الطرف الآخر
           ------------------------------------------------- */

        const otherIntensity =
            $("otherColorIntensity");


        if (otherIntensity) {

            next.otherIntensity =
                clamp(
                    safeNumber(
                        otherIntensity.value,
                        100
                    ),
                    0,
                    100
                );

        }


        /* -------------------------------------------------
           شفافية الطرف الآخر
           ------------------------------------------------- */

        const otherOpacity =
            $("otherColorTransparency");


        if (otherOpacity) {

            next.otherOpacity =
                clamp(
                    safeNumber(
                        otherOpacity.value,
                        7
                    ),
                    0,
                    100
                );

        }


        /* -------------------------------------------------
           استدارة الطرف الآخر
           ------------------------------------------------- */

        const otherRadius =
            $("otherBubbleRadius");


        if (otherRadius) {

            next.otherRadius =
                clamp(
                    safeNumber(
                        otherRadius.value,
                        18
                    ),
                    4,
                    40
                );

        }


        draftSettings =
            sanitizeSettings(
                next
            );


        return draftSettings;

    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    function updatePreview(
        settings
    ) {

        const safe =
            sanitizeSettings(
                settings
            );


        const own =
            $("previewOwnMessage");


        const other =
            $("previewOtherMessage");


        if (own) {

            own.dataset.bubbleShape =
                safe.ownShape;


            own.style.borderRadius =
                getBubbleRadius(
                    safe.ownShape,
                    safe.ownRadius
                );


            own.style.background =
                makeColorMix(
                    safe.ownColor,
                    safe.ownOpacity,
                    safe.ownIntensity
                );


            own.style.borderColor =
                makeBorderColor(
                    safe.ownColor,
                    safe.ownIntensity,
                    0.18
                );


            own.style.fontSize =
                "calc(13px * " +
                safe.scale +
                ")";


            own.style.maxWidth =
                safe.messageBubbleWidth + "%";


            own.style.paddingTop =
                safe.messageBubbleVerticalPadding + "px";


            own.style.paddingBottom =
                safe.messageBubbleVerticalPadding + "px";

        }


        if (other) {

            other.dataset.bubbleShape =
                safe.otherShape;


            other.style.borderRadius =
                getBubbleRadius(
                    safe.otherShape,
                    safe.otherRadius
                );


            other.style.background =
                makeColorMix(
                    safe.otherColor,
                    safe.otherOpacity,
                    safe.otherIntensity
                );


            other.style.borderColor =
                makeBorderColor(
                    safe.otherColor,
                    safe.otherIntensity,
                    0.095
                );


            other.style.fontSize =
                "calc(13px * " +
                safe.scale +
                ")";


            other.style.maxWidth =
                safe.messageBubbleWidth + "%";


            other.style.paddingTop =
                safe.messageBubbleVerticalPadding + "px";


            other.style.paddingBottom =
                safe.messageBubbleVerticalPadding + "px";

        }

    }


    /* =====================================================
       COLOR HELPERS
    ===================================================== */

    function makeColorMix(
        color,
        opacity,
        intensity
    ) {

        const percentage =
            clamp(
                opacity *
                (intensity / 100),
                0,
                100
            );


        return (
            "color-mix(in srgb, " +
            color +
            " " +
            percentage +
            "%, transparent)"
        );

    }


    function makeBorderColor(
        color,
        intensity,
        base
    ) {

        const percentage =
            clamp(
                base *
                (intensity / 100) *
                100,
                0,
                100
            );


        return (
            "color-mix(in srgb, " +
            color +
            " " +
            percentage +
            "%, transparent)"
        );

    }


    /* =====================================================
       COLOR GRID
    ===================================================== */

    function createColorGrid(
        containerId,
        type
    ) {

        const container =
            $(containerId);


        if (!container) {

            return;

        }


        container.innerHTML = "";


        PRESET_COLORS.forEach(
            function (color) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "message-color-option";


                button.dataset.color =
                    color;


                button.title =
                    color;


                button.setAttribute(
                    "aria-label",
                    "اختيار اللون " + color
                );


                button.style.background =
                    color;


                button.addEventListener(
                    "click",
                    function () {

                        if (
                            type === "own"
                        ) {

                            draftSettings.ownColor =
                                normalizeHex(
                                    color,
                                    DEFAULT_SETTINGS.ownColor
                                );

                        } else {

                            draftSettings.otherColor =
                                normalizeHex(
                                    color,
                                    DEFAULT_SETTINGS.otherColor
                                );

                        }


                        syncSettingsUI(
                            draftSettings
                        );


                        applyDraftLive();

                    }
                );


                container.appendChild(
                    button
                );

            }
        );


        updateColorGridActiveState(
            containerId,
            type === "own"
                ? draftSettings.ownColor
                : draftSettings.otherColor
        );

    }


    function updateColorGridActiveState(
        containerId,
        color
    ) {

        const container =
            $(containerId);


        if (!container) {

            return;

        }


        const normalized =
            normalizeHex(
                color,
                ""
            );


        const buttons =
            container.querySelectorAll(
                ".message-color-option"
            );


        buttons.forEach(
            function (button) {

                const buttonColor =
                    normalizeHex(
                        button.dataset.color,
                        ""
                    );


                button.classList.toggle(
                    "active",
                    buttonColor === normalized
                );

            }
        );

    }


    /* =====================================================
       LIVE DRAFT
    ===================================================== */

    function applyDraftLive() {

        const next =
            readDraftFromUI();


        applySettings(
            next
        );


        syncSettingsUI(
            next
        );


        updatePreview(
            next
        );

    }


    /* =====================================================
       OPEN
    ===================================================== */

    function openSettings() {

        const modal =
            $("messageViewSettingsModal");


        if (!modal) {

            console.warn(
                "[WFESC SETTINGS] modal not found"
            );

            return;

        }


        /*
         * عند الفتح نأخذ آخر إعدادات محفوظة.
         */

        currentSettings =
            loadSettings();


        draftSettings =
            cloneSettings(
                currentSettings
            );


        syncSettingsUI(
            draftSettings
        );


        applySettings(
            draftSettings
        );


        updatePreview(
            draftSettings
        );


        modal.classList.add(
            "show"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    /* =====================================================
       CLOSE / CANCEL
    ===================================================== */

    function closeSettings() {

        const modal =
            $("messageViewSettingsModal");


        /*
         * الإلغاء يعيد آخر إعدادات محفوظة.
         */

        draftSettings =
            cloneSettings(
                currentSettings
            );


        applySettings(
            currentSettings
        );


        syncSettingsUI(
            currentSettings
        );


        updatePreview(
            currentSettings
        );


        if (modal) {

            modal.classList.remove(
                "show"
            );

        }


        document.body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       SAVE
    ===================================================== */

    function saveCurrentSettings() {

        const modal =
            $("messageViewSettingsModal");


        const chatMessages =
            $("chatMessages");


        const oldScrollTop =
            chatMessages
                ? chatMessages.scrollTop
                : 0;


        /*
         * قراءة كل القيم الحالية.
         */

        const next =
            readDraftFromUI();


        /*
         * جعلها الإعدادات الرسمية.
         */

        currentSettings =
            cloneSettings(
                next
            );


        draftSettings =
            cloneSettings(
                next
            );


        /*
         * حفظ.
         */

        saveSettings(
            currentSettings
        );


        /*
         * تطبيق نهائي.
         */

        applySettings(
            currentSettings
        );


        syncSettingsUI(
            currentSettings
        );


        updatePreview(
            currentSettings
        );


        /*
         * إغلاق.
         */

        if (modal) {

            modal.classList.remove(
                "show"
            );

        }


        document.body.classList.remove(
            "modal-open"
        );


        /*
         * المحافظة على مكان المحادثة.
         */

        if (chatMessages) {

            requestAnimationFrame(
                function () {

                    chatMessages.scrollTop =
                        oldScrollTop;

                }
            );

        }


        showSuccess();

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    function showSuccess() {

        const overlay =
            $("settingsSuccessOverlay");


        if (!overlay) {

            return;

        }


        overlay.classList.add(
            "show"
        );


        clearTimeout(
            successTimer
        );


        successTimer =
            setTimeout(
                function () {

                    overlay.classList.remove(
                        "show"
                    );

                },
                1300
            );

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetSettings() {

        currentSettings =
            cloneSettings(
                DEFAULT_SETTINGS
            );


        draftSettings =
            cloneSettings(
                DEFAULT_SETTINGS
            );


        saveSettings(
            currentSettings
        );


        applySettings(
            currentSettings
        );


        syncSettingsUI(
            currentSettings
        );


        updatePreview(
            currentSettings
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        /* -------------------------------------------------
           فتح الإعدادات
           ------------------------------------------------- */

        const openButton =
            $("messageViewSettingsButton");


        if (openButton) {

            openButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openSettings();

                }
            );

        }


        /* -------------------------------------------------
           إلغاء
           ------------------------------------------------- */

        const cancelButton =
            $("messageViewSettingsCancel");


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    closeSettings();

                }
            );

        }


        /* -------------------------------------------------
           حفظ
           ------------------------------------------------- */

        const saveButton =
            $("messageViewSettingsSave");


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    saveCurrentSettings();

                }
            );

        }


        /* -------------------------------------------------
           حجم النص
           ------------------------------------------------- */

        const sizeRange =
            $("messageSizeRange");


        if (sizeRange) {

            sizeRange.addEventListener(
                "input",
                function () {

                    draftSettings.scale =
                        clamp(
                            safeNumber(
                                this.value,
                                100
                            ) / 100,
                            0.85,
                            1.25
                        );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           عرض الفقاعة
           ------------------------------------------------- */

        const bubbleWidth =
            $("messageBubbleWidth");


        if (bubbleWidth) {

            bubbleWidth.addEventListener(
                "input",
                function () {

                    draftSettings.messageBubbleWidth =
                        clamp(
                            safeNumber(
                                this.value,
                                DEFAULT_SETTINGS.messageBubbleWidth
                            ),
                            45,
                            96
                        );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           ارتفاع الفقاعة
           ------------------------------------------------- */

        const bubbleHeight =
            $("messageBubbleHeight");


        if (bubbleHeight) {

            bubbleHeight.addEventListener(
                "input",
                function () {

                    draftSettings.messageBubbleVerticalPadding =
                        clamp(
                            safeNumber(
                                this.value,
                                DEFAULT_SETTINGS.messageBubbleVerticalPadding
                            ),
                            4,
                            24
                        );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           المسافة عن إطار الشاشة
           ------------------------------------------------- */

        const bubbleEdgeGap =
            $("messageBubbleEdgeGap");


        if (bubbleEdgeGap) {

            bubbleEdgeGap.addEventListener(
                "input",
                function () {

                    draftSettings.messageBubbleEdgeGap =
                        clamp(
                            safeNumber(
                                this.value,
                                DEFAULT_SETTINGS.messageBubbleEdgeGap
                            ),
                            0,
                            32
                        );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           شدة لون رسائلي
           ------------------------------------------------- */

        const ownIntensity =
            $("ownColorIntensity");


        if (ownIntensity) {

            ownIntensity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           شفافية رسائلي
           ------------------------------------------------- */

        const ownOpacity =
            $("ownColorTransparency");


        if (ownOpacity) {

            ownOpacity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           شكل رسائلي
           ------------------------------------------------- */

        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            ownShape.addEventListener(
                "change",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           استدارة رسائلي
           ------------------------------------------------- */

        const ownRadius =
            $("ownBubbleRadius");


        if (ownRadius) {

            ownRadius.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           شكل الطرف الآخر
           ------------------------------------------------- */

        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            otherShape.addEventListener(
                "change",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           شدة لون الطرف الآخر
           ------------------------------------------------- */

        const otherIntensity =
            $("otherColorIntensity");


        if (otherIntensity) {

            otherIntensity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           شفافية الطرف الآخر
           ------------------------------------------------- */

        const otherOpacity =
            $("otherColorTransparency");


        if (otherOpacity) {

            otherOpacity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           استدارة الطرف الآخر
           ------------------------------------------------- */

        const otherRadius =
            $("otherBubbleRadius");


        if (otherRadius) {

            otherRadius.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /* -------------------------------------------------
           اللون المخصص - رسائلي
           ------------------------------------------------- */

        const ownPicker =
            $("ownBubbleColorPicker");


        if (ownPicker) {

            ownPicker.addEventListener(
                "input",
                function () {

                    draftSettings.ownColor =
                        normalizeHex(
                            this.value,
                            draftSettings.ownColor
                        );


                    updateColorGridActiveState(
                        "ownMessageColors",
                        draftSettings.ownColor
                    );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           اللون المخصص - الطرف الآخر
           ------------------------------------------------- */

        const otherPicker =
            $("otherBubbleColorPicker");


        if (otherPicker) {

            otherPicker.addEventListener(
                "input",
                function () {

                    draftSettings.otherColor =
                        normalizeHex(
                            this.value,
                            draftSettings.otherColor
                        );


                    updateColorGridActiveState(
                        "otherMessageColors",
                        draftSettings.otherColor
                    );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           الضغط خارج المودال
           ------------------------------------------------- */

        const modal =
            $("messageViewSettingsModal");


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        /*
                         * لا نفعل شيئاً.
                         * المستخدم يختار حفظ أو إلغاء.
                         */

                    }

                }
            );

        }

    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        if (initialized) {

            return;

        }


        initialized = true;


        /* -------------------------------------------------
           تحميل الإعدادات
           ------------------------------------------------- */

        currentSettings =
            loadSettings();


        draftSettings =
            cloneSettings(
                currentSettings
            );


        /* -------------------------------------------------
           إنشاء الألوان
           ------------------------------------------------- */

        createColorGrid(
            "ownMessageColors",
            "own"
        );


        createColorGrid(
            "otherMessageColors",
            "other"
        );


        /* -------------------------------------------------
           تطبيق
           ------------------------------------------------- */

        syncSettingsUI(
            currentSettings
        );


        applySettings(
            currentSettings
        );


        updatePreview(
            currentSettings
        );


        /* -------------------------------------------------
           الأحداث
           ------------------------------------------------- */

        bindEvents();


        console.log(
            "[WFESC SETTINGS] initialized"
        );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.WFESC_MESSAGE_SETTINGS = {

        init:init,

        open:openSettings,

        close:closeSettings,

        save:saveCurrentSettings,


        get:function () {

            return cloneSettings(
                currentSettings
            );

        },


        getDraft:function () {

            return cloneSettings(
                draftSettings
            );

        },


        apply:function (
            settings
        ) {

            const safe =
                sanitizeSettings(
                    settings
                );


            currentSettings =
                cloneSettings(
                    safe
                );


            draftSettings =
                cloneSettings(
                    safe
                );


            applySettings(
                safe
            );


            syncSettingsUI(
                safe
            );


            updatePreview(
                safe
            );

        },


        reset:resetSettings

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once:true
            }
        );

    } else {

        init();

    }

})();
