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

        /* حجم/مقاسات الفقاعة */
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

    let blockRefreshToken = 0;

    let blockToastTimer = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    function $(id) {

        const direct =
            document.getElementById(
                id
            );


        if (direct) {

            return direct;

        }


        /*
         * توافق مع IDs الموجودة فعلياً
         * في messages.html والنسخ السابقة.
         */

        const aliases = {

            messageBubbleWidthRange:
                "messageBubbleWidth",

            messageBubbleHeightRange:
                "messageBubbleHeight",

            messageBubbleEdgeRange:
                "messageBubbleEdgeGap",

            messageBubbleEdgeValue:
                "messageBubbleEdgeGapValue"

        };


        const alias =
            aliases[id];


        if (alias) {

            return document.getElementById(
                alias
            );

        }


        return null;

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


    function safeNumber(value, fallback) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;

    }


    function normalizeHex(value, fallback) {

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


    function escapeHTML(value) {

        return String(
            value ?? ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


    function getBubbleRadius(shape, radius) {

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

    function sanitizeSettings(settings) {

        const source =
            settings || {};


        return {

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


            /* عرض الفقاعة */

            messageBubbleWidth:
                clamp(
                    safeNumber(
                        source.messageBubbleWidth,
                        DEFAULT_SETTINGS.messageBubbleWidth
                    ),
                    45,
                    100
                ),


            /* الارتفاع العمودي */

            messageBubbleVerticalPadding:
                clamp(
                    safeNumber(
                        source.messageBubbleVerticalPadding,
                        DEFAULT_SETTINGS.messageBubbleVerticalPadding
                    ),
                    4,
                    24
                ),


            /* المسافة عن الإطار */

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
                typeof core.getCurrentUser ===
                "function"
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

    function saveSettings(settings) {

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
       APPLY SETTINGS
    ===================================================== */

    function applySettings(settings) {

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


        root.style.setProperty(
            "--message-bubble-scale",
            "1"
        );


        root.style.setProperty(
            "--message-bubble-width",
            safe.messageBubbleWidth + "%"
        );


        root.style.setProperty(
            "--message-bubble-vertical-padding",
            safe.messageBubbleVerticalPadding + "px"
        );


        root.style.setProperty(
            "--message-bubble-edge-gap",
            safe.messageBubbleEdgeGap + "px"
        );


        /* -------------------------------------------------
           رسائلي
           ------------------------------------------------- */

        root.style.setProperty(
            "--own-bubble-radius",
            getBubbleRadius(
                safe.ownShape,
                safe.ownRadius
            )
        );


        root.style.setProperty(
            "--own-bubble-color",
            safe.ownColor
        );


        root.style.setProperty(
            "--own-bubble-opacity",
            ownOpacity
        );


        root.style.setProperty(
            "--own-bubble-border-opacity",
            ownBorderOpacity
        );


        root.style.setProperty(
            "--own-bubble-intensity",
            ownIntensity
        );


        /* -------------------------------------------------
           رسائل الطرف الآخر
           ------------------------------------------------- */

        root.style.setProperty(
            "--other-bubble-radius",
            getBubbleRadius(
                safe.otherShape,
                safe.otherRadius
            )
        );


        root.style.setProperty(
            "--other-bubble-color",
            safe.otherColor
        );


        root.style.setProperty(
            "--other-bubble-opacity",
            otherOpacity
        );


        root.style.setProperty(
            "--other-bubble-border-opacity",
            otherBorderOpacity
        );


        root.style.setProperty(
            "--other-bubble-intensity",
            otherIntensity
        );


        /* -------------------------------------------------
           الزجاج
           ------------------------------------------------- */

        root.style.setProperty(
            "--wfesc-message-blur",
            safe.glass
                ? "18px"
                : "0px"
        );


        /* -------------------------------------------------
           تطبيق على الفقاعات الموجودة
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
           STYLE OVERRIDE
           ------------------------------------------------- */

        const style =
            ensureStyleElement();


        style.textContent = `

            /* ============================================
               الصف
               ============================================ */

            #chatView > #chatMessages .message-row {

                padding-inline:
                    var(
                        --message-bubble-edge-gap,
                        12px
                    )
                    !important;

            }


            /* ============================================
               الفقاعة
               ============================================ */

            #chatView > #chatMessages
            .message-row
            .message-bubble {

                width:
                    auto
                    !important;

                min-width:
                    0
                    !important;

                max-width:
                    var(
                        --message-bubble-width,
                        78%
                    )
                    !important;

                flex:
                    0 1 auto
                    !important;

                height:
                    auto
                    !important;

                min-height:
                    0
                    !important;

                box-sizing:
                    border-box
                    !important;

                padding-top:
                    var(
                        --message-bubble-vertical-padding,
                        10px
                    )
                    !important;

                padding-bottom:
                    var(
                        --message-bubble-vertical-padding,
                        10px
                    )
                    !important;

                overflow-wrap:
                    anywhere
                    !important;

                word-break:
                    break-word
                    !important;

            }


            /* ============================================
               محتوى الرسالة
               ============================================ */

            #chatView > #chatMessages
            .message-row
            .message-content {

                font-size:
                    calc(
                        15px *
                        var(
                            --message-text-scale,
                            1
                        )
                    )
                    !important;

            }


            /* ============================================
               المعاينة
               ============================================ */

            .preview-message {

                width:
                    auto
                    !important;

                min-width:
                    0
                    !important;

                max-width:
                    var(
                        --message-bubble-width,
                        78%
                    )
                    !important;

                height:
                    auto
                    !important;

                box-sizing:
                    border-box
                    !important;

                padding-top:
                    var(
                        --message-bubble-vertical-padding,
                        10px
                    )
                    !important;

                padding-bottom:
                    var(
                        --message-bubble-vertical-padding,
                        10px
                    )
                    !important;

                overflow-wrap:
                    anywhere
                    !important;

                word-break:
                    break-word
                    !important;

            }


            /* ============================================
               الزجاج
               ============================================ */

            .message-row.mine
            .message-bubble,

            .message-row.theirs
            .message-bubble,

            .preview-message {

                backdrop-filter:
                    blur(
                        var(
                            --wfesc-message-blur,
                            18px
                        )
                    )
                    saturate(135%);

                -webkit-backdrop-filter:
                    blur(
                        var(
                            --wfesc-message-blur,
                            18px
                        )
                    )
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


        applyDirectBubbleStyles(
            safe
        );

    }


    /* =====================================================
       DIRECT BUBBLE STYLES
    ===================================================== */

    function applyDirectBubbleStyles(settings) {

        const safe =
            sanitizeSettings(
                settings
            );


        const bubbles =
            document.querySelectorAll(
                "#chatView .message-bubble"
            );


        bubbles.forEach(
            function (bubble) {

                bubble.style.width =
                    "auto";

                bubble.style.minWidth =
                    "0";

                bubble.style.maxWidth =
                    safe.messageBubbleWidth + "%";

                bubble.style.height =
                    "auto";

                bubble.style.minHeight =
                    "0";

                bubble.style.paddingTop =
                    safe.messageBubbleVerticalPadding + "px";

                bubble.style.paddingBottom =
                    safe.messageBubbleVerticalPadding + "px";

                bubble.style.boxSizing =
                    "border-box";

                bubble.style.overflowWrap =
                    "anywhere";

                bubble.style.wordBreak =
                    "break-word";

            }
        );


        const rows =
            document.querySelectorAll(
                "#chatView #chatMessages .message-row"
            );


        rows.forEach(
            function (row) {

                row.style.paddingInline =
                    safe.messageBubbleEdgeGap + "px";

            }
        );

    }


    /* =====================================================
       APPLY DATA ATTRIBUTES
    ===================================================== */

    function applyBubbleAttributes(settings) {

        const safe =
            sanitizeSettings(
                settings
            );


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


        const previewOwn =
            $("previewOwnMessage");


        if (previewOwn) {

            previewOwn.dataset.bubbleShape =
                safe.ownShape;

        }


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

    function syncSettingsUI(settings) {

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
            $("messageBubbleWidthRange");


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
            $("messageBubbleHeightRange");


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
            $("messageBubbleEdgeRange");


        const bubbleEdgeGapValue =
            $("messageBubbleEdgeValue");


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
           Color Pickers
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
            $("messageBubbleWidthRange");


        if (bubbleWidth) {

            next.messageBubbleWidth =
                clamp(
                    safeNumber(
                        bubbleWidth.value,
                        DEFAULT_SETTINGS.messageBubbleWidth
                    ),
                    45,
                    100
                );

        }


        /* -------------------------------------------------
           ارتفاع الفقاعة
           ------------------------------------------------- */

        const bubbleHeight =
            $("messageBubbleHeightRange");


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
            $("messageBubbleEdgeRange");


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

    function updatePreview(settings) {

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


            own.style.width =
                "auto";


            own.style.maxWidth =
                safe.messageBubbleWidth + "%";


            own.style.minWidth =
                "0";


            own.style.height =
                "auto";


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


            other.style.width =
                "auto";


            other.style.maxWidth =
                safe.messageBubbleWidth + "%";


            other.style.minWidth =
                "0";


            other.style.height =
                "auto";


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
       BLOCK SYSTEM - HELPERS
    ===================================================== */

    function getCore() {

        return (
            window.WFESC_MESSAGES_CORE ||
            null
        );

    }


    function getBlockModule() {

        return (
            window.WFESC_MESSAGES_BLOCK ||
            null
        );

    }


    function getCurrentContact() {

        const core =
            getCore();


        if (
            !core ||
            typeof core.getCurrentContact !==
            "function"
        ) {

            return null;

        }


        try {

            return (
                core.getCurrentContact() ||
                null
            );

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS BLOCK] contact lookup failed",
                error
            );

            return null;

        }

    }


    function getContactUserId(contact) {

        if (!contact) {

            return null;

        }


        return (
            contact.user_id ||
            contact.userId ||
            contact.profile_id ||
            contact.profileId ||
            contact.id ||
            null
        );

    }


    function getContactName(contact) {

        if (!contact) {

            return "المستخدم";

        }


        return (
            contact.display_name ||
            contact.full_name ||
            contact.name ||
            contact.username ||
            "المستخدم"
        );

    }


    function getContactUsername(contact) {

        if (!contact) {

            return "";

        }


        const username =
            contact.username ||
            "";


        if (!username) {

            return "";

        }


        const clean =
            String(
                username
            )
            .replace(
                /^@+/,
                ""
            );


        return clean
            ? "@" + clean
            : "";

    }


    function getContactAvatar(contact) {

        if (!contact) {

            return "";

        }


        return (
            contact.avatar_url ||
            contact.avatar ||
            contact.photo_url ||
            ""
        );

    }


    function formatBlockDate(value) {

        if (!value) {

            return "غير معروف";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "غير معروف";

        }


        try {

            return new Intl.DateTimeFormat(
                "ar-IQ",
                {
                    year:"numeric",
                    month:"long",
                    day:"numeric",
                    hour:"2-digit",
                    minute:"2-digit"
                }
            ).format(
                date
            );

        } catch (error) {

            return date.toLocaleString(
                "ar-IQ"
            );

        }

    }


    /* =====================================================
       BLOCK CSS
    ===================================================== */

    function ensureBlockStyle() {

        const styleId =
            "wfesc-message-settings-block-style";


        if (
            document.getElementById(
                styleId
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            styleId;


        style.textContent = `

            /* =========================================
               BLOCK SECTION
            ========================================= */

            #wfescSettingsBlockSection {

                margin-top:20px;

                padding:15px;

                border-radius:20px;

                background:
                    linear-gradient(
                        145deg,
                        rgba(255,255,255,.048),
                        rgba(255,255,255,.020)
                    );

                border:
                    1px solid
                    rgba(255,255,255,.09);

                box-shadow:
                    inset
                    0 1px 0
                    rgba(255,255,255,.035);

                backdrop-filter:
                    blur(20px)
                    saturate(140%);

                -webkit-backdrop-filter:
                    blur(20px)
                    saturate(140%);

            }


            #wfescSettingsBlockSection
            .wfesc-block-title {

                font-size:15px;

                font-weight:800;

                color:#fff;

                margin-bottom:5px;

            }


            #wfescSettingsBlockSection
            .wfesc-block-description {

                color:#929292;

                font-size:12px;

                line-height:1.75;

                margin-bottom:13px;

            }


            #wfescSettingsBlockSection
            .wfesc-block-user {

                display:flex;

                align-items:center;

                gap:11px;

                min-width:0;

                padding:11px;

                border-radius:16px;

                background:
                    rgba(255,255,255,.035);

                border:
                    1px solid
                    rgba(255,255,255,.075);

            }


            #wfescSettingsBlockSection
            .wfesc-block-avatar {

                width:48px;

                height:48px;

                flex:none;

                border-radius:50%;

                object-fit:cover;

                background:#111;

                border:
                    1px solid
                    rgba(255,255,255,.10);

            }


            #wfescSettingsBlockSection
            .wfesc-block-info {

                min-width:0;

                flex:1;

            }


            #wfescSettingsBlockSection
            .wfesc-block-name {

                color:#fff;

                font-size:14px;

                font-weight:800;

                white-space:nowrap;

                overflow:hidden;

                text-overflow:ellipsis;

            }


            #wfescSettingsBlockSection
            .wfesc-block-username {

                margin-top:3px;

                color:#929292;

                font-size:11px;

                direction:ltr;

                text-align:right;

                white-space:nowrap;

                overflow:hidden;

                text-overflow:ellipsis;

            }


            #wfescSettingsBlockSection
            .wfesc-block-status {

                margin-top:4px;

                color:#929292;

                font-size:11px;

                line-height:1.7;

            }


            #wfescSettingsBlockSection
            .wfesc-block-date {

                margin-top:8px;

                padding-top:8px;

                border-top:
                    1px solid
                    rgba(255,255,255,.06);

                color:#aaa;

                font-size:11px;

                line-height:1.7;

            }


            #wfescSettingsBlockSection
            .wfesc-block-action {

                width:100%;

                min-height:44px;

                margin-top:11px;

                padding:10px 13px;

                border-radius:14px;

                font-size:13px;

                font-weight:800;

                transition:
                    transform .18s ease,
                    background .18s ease,
                    border-color .18s ease,
                    opacity .18s ease;

            }


            #wfescSettingsBlockSection
            .wfesc-block-action:active {

                transform:
                    scale(.97);

            }


            #wfescSettingsBlockSection
            .wfesc-block-action.block {

                color:#ffb4b4;

                background:
                    rgba(180,40,40,.10);

                border:
                    1px solid
                    rgba(255,100,100,.16);

            }


            #wfescSettingsBlockSection
            .wfesc-block-action.unblock {

                color:#baffcf;

                background:
                    rgba(54,226,123,.08);

                border:
                    1px solid
                    rgba(54,226,123,.16);

            }


            #wfescSettingsBlockSection
            .wfesc-block-empty {

                padding:12px;

                border-radius:14px;

                background:
                    rgba(255,255,255,.03);

                border:
                    1px solid
                    rgba(255,255,255,.06);

                color:#929292;

                font-size:12px;

                line-height:1.8;

            }


            /* =========================================
               CONFIRM OVERLAY
            ========================================= */

            #wfescSettingsBlockOverlay {

                position:fixed;

                inset:0;

                z-index:99999999;

                display:flex;

                align-items:center;

                justify-content:center;

                padding:20px;

                background:
                    rgba(0,0,0,.72);

                backdrop-filter:
                    blur(14px)
                    saturate(130%);

                -webkit-backdrop-filter:
                    blur(14px)
                    saturate(130%);

                animation:
                    wfescBlockOverlayIn
                    .18s
                    ease
                    both;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-dialog {

                width:
                    min(
                        430px,
                        100%
                    );

                padding:22px;

                border-radius:22px;

                background:
                    linear-gradient(
                        145deg,
                        rgba(28,28,28,.97),
                        rgba(11,11,11,.97)
                    );

                border:
                    1px solid
                    rgba(255,255,255,.11);

                box-shadow:
                    0 25px 80px
                    rgba(0,0,0,.72),
                    inset
                    0 1px 0
                    rgba(255,255,255,.045);

                text-align:center;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-icon {

                width:58px;

                height:58px;

                margin:
                    0 auto 13px;

                display:flex;

                align-items:center;

                justify-content:center;

                border-radius:50%;

                background:
                    rgba(184,43,43,.13);

                border:
                    1px solid
                    rgba(255,100,100,.14);

                font-size:25px;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-dialog-title {

                color:#fff;

                font-size:18px;

                font-weight:800;

                line-height:1.6;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-dialog-text {

                margin-top:9px;

                color:#aaa;

                font-size:13px;

                line-height:1.9;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-dialog-note {

                margin-top:9px;

                color:#777;

                font-size:11px;

                line-height:1.9;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-buttons {

                display:flex;

                flex-direction:column;

                gap:8px;

                margin-top:19px;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-button {

                width:100%;

                min-height:44px;

                padding:11px;

                border-radius:14px;

                font-size:13px;

                font-weight:800;

                border:
                    1px solid
                    rgba(255,255,255,.09);

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-confirm {

                color:#fff;

                background:#a52f2f;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-unblock {

                color:#07150d;

                background:#70e49c;

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-cancel {

                color:#ddd;

                background:
                    rgba(255,255,255,.045);

            }


            #wfescSettingsBlockOverlay
            .wfesc-block-button:disabled {

                opacity:.55;

                cursor:wait;

            }


            /* =========================================
               TOAST
            ========================================= */

            #wfescSettingsBlockToast {

                position:fixed;

                left:50%;

                bottom:
                    calc(
                        var(--navigation-height,82px)
                        + 22px
                    );

                transform:
                    translateX(-50%)
                    translateY(15px);

                z-index:100000000;

                max-width:
                    calc(100vw - 30px);

                padding:
                    11px 17px;

                border-radius:14px;

                background:
                    rgba(18,18,18,.97);

                color:#fff;

                border:
                    1px solid
                    rgba(255,255,255,.10);

                box-shadow:
                    0 15px 45px
                    rgba(0,0,0,.55);

                font-size:12px;

                font-weight:700;

                text-align:center;

                opacity:0;

                pointer-events:none;

                transition:
                    opacity .18s ease,
                    transform .18s ease;

                backdrop-filter:
                    blur(18px);

                -webkit-backdrop-filter:
                    blur(18px);

            }


            #wfescSettingsBlockToast.show {

                opacity:1;

                transform:
                    translateX(-50%)
                    translateY(0);

            }


            @keyframes wfescBlockOverlayIn {

                from {

                    opacity:0;

                }

                to {

                    opacity:1;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       BLOCK TOAST
    ===================================================== */

    function showBlockToast(
        message
    ) {

        let toast =
            document.getElementById(
                "wfescSettingsBlockToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "wfescSettingsBlockToast";


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            String(
                message || ""
            );


        toast.classList.add(
            "show"
        );


        clearTimeout(
            blockToastTimer
        );


        blockToastTimer =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                2400
            );

    }


    /* =====================================================
       BLOCK CONFIRM CLOSE
    ===================================================== */

    function closeBlockConfirmation() {

        const overlay =
            document.getElementById(
                "wfescSettingsBlockOverlay"
            );


        if (overlay) {

            overlay.remove();

        }

    }


    /* =====================================================
       BLOCK CONFIRMATION
    ===================================================== */

    function openBlockConfirmation(
        mode,
        userId,
        userName
    ) {

        closeBlockConfirmation();


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "wfescSettingsBlockOverlay";


        const dialog =
            document.createElement(
                "div"
            );


        dialog.className =
            "wfesc-block-dialog";


        const isUnblock =
            mode === "unblock";


        const title =
            isUnblock
                ? "إلغاء الحظر"
                : "حظر المستخدم";


        const message =
            isUnblock
                ? "هل تريد إلغاء حظر المستخدم؟"
                : "هل تريد حظر المستخدم؟";


        const note =
            "لماذا قمت بالحظر؟ فلا يوجد داعي للحظر، كن إنسانًا طيب القلب وراضي";


        dialog.innerHTML = `

            <div
                class="wfesc-block-icon"
            >
                ${
                    isUnblock
                        ? "🔓"
                        : "🚫"
                }
            </div>


            <div
                class="wfesc-block-dialog-title"
            >
                ${escapeHTML(
                    title
                )}
            </div>


            <div
                class="wfesc-block-dialog-text"
            >
                ${escapeHTML(
                    message
                )}
            </div>


            <div
                class="wfesc-block-dialog-note"
            >
                ${escapeHTML(
                    note
                )}
            </div>


            <div
                class="wfesc-block-buttons"
            >

                <button
                    type="button"
                    class="
                        wfesc-block-button
                        ${
                            isUnblock
                                ? "wfesc-block-unblock"
                                : "wfesc-block-confirm"
                        }
                    "
                    data-action="continue"
                >
                    متابعة
                </button>


                <button
                    type="button"
                    class="
                        wfesc-block-button
                        wfesc-block-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>

        `;


        overlay.appendChild(
            dialog
        );


        document.body.appendChild(
            overlay
        );


        const cancel =
            dialog.querySelector(
                '[data-action="cancel"]'
            );


        if (cancel) {

            cancel.addEventListener(
                "click",
                closeBlockConfirmation
            );

        }


        const continueButton =
            dialog.querySelector(
                '[data-action="continue"]'
            );


        if (continueButton) {

            continueButton.addEventListener(
                "click",
                function () {

                    openFinalBlockConfirmation(
                        mode,
                        userId,
                        userName
                    );

                }
            );

        }

    }


    /* =====================================================
       FINAL CONFIRMATION
    ===================================================== */

    function openFinalBlockConfirmation(
        mode,
        userId,
        userName
    ) {

        closeBlockConfirmation();


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "wfescSettingsBlockOverlay";


        const dialog =
            document.createElement(
                "div"
            );


        dialog.className =
            "wfesc-block-dialog";


        const isUnblock =
            mode === "unblock";


        const title =
            isUnblock
                ? "تأكيد إلغاء الحظر"
                : "تأكيد الحظر";


        const message =
            isUnblock
                ? (
                    "سيتم إلغاء الحظر عن المستخدم " +
                    userName
                )
                : (
                    "سيتم حظر المستخدم " +
                    userName
                );


        dialog.innerHTML = `

            <div
                class="wfesc-block-icon"
            >
                ${
                    isUnblock
                        ? "🔓"
                        : "🚫"
                }
            </div>


            <div
                class="wfesc-block-dialog-title"
            >
                ${escapeHTML(
                    title
                )}
            </div>


            <div
                class="wfesc-block-dialog-text"
            >
                ${escapeHTML(
                    message
                )}
            </div>


            <div
                class="wfesc-block-buttons"
            >

                <button
                    type="button"
                    class="
                        wfesc-block-button
                        ${
                            isUnblock
                                ? "wfesc-block-unblock"
                                : "wfesc-block-confirm"
                        }
                    "
                    data-action="confirm"
                >
                    ${
                        isUnblock
                            ? "تأكيد إلغاء الحظر"
                            : "تأكيد الحظر"
                    }
                </button>


                <button
                    type="button"
                    class="
                        wfesc-block-button
                        wfesc-block-cancel
                    "
                    data-action="cancel"
                >
                    إلغاء
                </button>

            </div>

        `;


        overlay.appendChild(
            dialog
        );


        document.body.appendChild(
            overlay
        );


        const cancel =
            dialog.querySelector(
                '[data-action="cancel"]'
            );


        if (cancel) {

            cancel.addEventListener(
                "click",
                closeBlockConfirmation
            );

        }


        const confirm =
            dialog.querySelector(
                '[data-action="confirm"]'
            );


        if (confirm) {

            confirm.addEventListener(
                "click",
                async function () {

                    await executeBlockAction(
                        mode,
                        userId,
                        userName,
                        dialog
                    );

                }
            );

        }

    }


    /* =====================================================
       DISPATCH BLOCK EVENTS
    ===================================================== */

    function dispatchBlockEvent(
        eventName,
        userId
    ) {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    eventName,
                    {
                        detail: {
                            userId:
                                userId
                        }
                    }
                )
            );

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS BLOCK] event dispatch failed",
                error
            );

        }


        try {

            window.dispatchEvent(
                new CustomEvent(
                    "wfesc:block-changed",
                    {
                        detail: {
                            userId:
                                userId
                        }
                    }
                )
            );

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS BLOCK] generic event failed",
                error
            );

        }

    }


    /* =====================================================
       EXECUTE BLOCK ACTION
    ===================================================== */

    async function executeBlockAction(
        mode,
        userId,
        userName,
        dialog
    ) {

        const block =
            getBlockModule();


        if (!block) {

            showBlockToast(
                "نظام الحظر غير متوفر حالياً"
            );

            return;

        }


        const button =
            dialog?.querySelector(
                '[data-action="confirm"]'
            );


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "جاري التنفيذ...";

        }


        try {

            /* -----------------------------------------
               UNBLOCK
            ----------------------------------------- */

            if (
                mode === "unblock"
            ) {

                if (
                    typeof block.unblockUser !==
                    "function"
                ) {

                    throw new Error(
                        "دالة إلغاء الحظر غير متوفرة"
                    );

                }


                await block.unblockUser(
                    userId
                );


                closeBlockConfirmation();


                showBlockToast(
                    "تم إلغاء حظر المستخدم"
                );


                dispatchBlockEvent(
                    "wfesc:user-unblocked",
                    userId
                );


                await refreshBlockSection();


                return;

            }


            /* -----------------------------------------
               BLOCK
            ----------------------------------------- */

            if (
                typeof block.blockUser !==
                "function"
            ) {

                throw new Error(
                    "دالة الحظر غير متوفرة"
                );

            }


            await block.blockUser(
                userId
            );


            closeBlockConfirmation();


            showBlockToast(
                "تم حظر المستخدم"
            );


            dispatchBlockEvent(
                "wfesc:user-blocked",
                userId
            );


            /*
             * الحظر لا يحذف الرسائل.
             * يغلق المحادثة فقط من الواجهة.
             */

            const core =
                getCore();


            if (
                core &&
                typeof core.closeConversation ===
                "function"
            ) {

                try {

                    await core.closeConversation();

                } catch (error) {

                    console.warn(
                        "[WFESC SETTINGS BLOCK] close conversation failed",
                        error
                    );

                }

            }


        } catch (error) {

            console.error(
                "[WFESC SETTINGS BLOCK]",
                error
            );


            closeBlockConfirmation();


            showBlockToast(
                error?.message ||
                (
                    mode === "unblock"
                        ? "تعذر إلغاء حظر المستخدم"
                        : "تعذر حظر المستخدم"
                )
            );


            await refreshBlockSection();

        }

    }


    /* =====================================================
       ENSURE BLOCK SECTION
    ===================================================== */

    function ensureBlockSection() {

        const modal =
            $("messageViewSettingsModal");


        if (!modal) {

            return null;

        }


        const card =
            modal.querySelector(
                ".modal-card"
            );


        if (!card) {

            return null;

        }


        let section =
            document.getElementById(
                "wfescSettingsBlockSection"
            );


        if (
            section &&
            !card.contains(
                section
            )
        ) {

            section = null;

        }


        if (!section) {

            section =
                document.createElement(
                    "div"
                );


            section.id =
                "wfescSettingsBlockSection";


            const saveButton =
                document.getElementById(
                    "messageViewSettingsSave"
                );


            const actionContainer =
                saveButton
                    ? saveButton.closest(
                        ".modal-actions"
                    )
                    : null;


            if (actionContainer) {

                card.insertBefore(
                    section,
                    actionContainer
                );

            } else {

                card.appendChild(
                    section
                );

            }

        }


        return section;

    }


    /* =====================================================
       BLOCK SECTION - LOADING
    ===================================================== */

    function renderBlockLoading(
        section
    ) {

        if (!section) {

            return;

        }


        section.innerHTML = `

            <div
                class="wfesc-block-title"
            >
                🚫 الحظر
            </div>


            <div
                class="wfesc-block-description"
            >
                إدارة حظر المستخدم المرتبط بهذه المحادثة.
            </div>


            <div
                class="wfesc-block-empty"
            >
                جاري تحميل بيانات الحظر...
            </div>

        `;

    }


    /* =====================================================
       BLOCK SECTION - RENDER
    ===================================================== */

    function renderBlockSection(
        section,
        data
    ) {

        if (!section) {

            return;

        }


        const contact =
            data?.contact ||
            null;


        const userId =
            data?.userId ||
            null;


        const blockedByMe =
            Boolean(
                data?.blockedByMe
            );


        const blockedMe =
            Boolean(
                data?.blockedMe
            );


        const blockInfo =
            data?.blockInfo ||
            null;


        if (
            !contact ||
            !userId
        ) {

            section.innerHTML = `

                <div
                    class="wfesc-block-title"
                >
                    🚫 الحظر
                </div>


                <div
                    class="wfesc-block-description"
                >
                    إدارة حظر المستخدم المرتبط بهذه المحادثة.
                </div>


                <div
                    class="wfesc-block-empty"
                >
                    ${
                        contact?.is_support
                            ? "هذه محادثة الدعم، ولا يمكن حظر حساب الدعم."
                            : "لا توجد جهة اتصال صالحة في المحادثة الحالية."
                    }
                </div>

            `;

            return;

        }


        const name =
            getContactName(
                contact
            );


        const username =
            getContactUsername(
                contact
            );


        const avatar =
            getContactAvatar(
                contact
            );


        let statusText =
            "المستخدم غير محظور";


        if (blockedByMe) {

            statusText =
                "أنت قمت بحظر هذا المستخدم";

        } else if (blockedMe) {

            statusText =
                "قام المستخدم بحظرك";

        }


        const dateText =
            blockedByMe &&
            blockInfo?.created_at
                ? formatBlockDate(
                    blockInfo.created_at
                )
                : "";


        section.innerHTML = `

            <div
                class="wfesc-block-title"
            >
                🚫 الحظر
            </div>


            <div
                class="wfesc-block-description"
            >
                إدارة حظر المستخدم المرتبط بهذه المحادثة.
            </div>


            <div
                class="wfesc-block-user"
            >

                <img
                    class="wfesc-block-avatar"
                    src="${escapeHTML(
                        avatar
                    )}"
                    alt=""
                    draggable="false"
                >


                <div
                    class="wfesc-block-info"
                >

                    <div
                        class="wfesc-block-name"
                    >
                        ${escapeHTML(
                            name
                        )}
                    </div>


                    ${
                        username
                            ? `
                                <div
                                    class="wfesc-block-username"
                                >
                                    ${escapeHTML(
                                        username
                                    )}
                                </div>
                            `
                            : ""
                    }


                    <div
                        class="wfesc-block-status"
                    >
                        ${escapeHTML(
                            statusText
                        )}
                    </div>


                    ${
                        dateText
                            ? `
                                <div
                                    class="wfesc-block-date"
                                >
                                    تاريخ ووقت الحظر:
                                    ${escapeHTML(
                                        dateText
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>

            </div>


            ${
                blockedByMe
                    ? `
                        <button
                            type="button"
                            class="
                                wfesc-block-action
                                unblock
                            "
                            id="wfescSettingsUnblockButton"
                        >
                            🔓 فتح الحظر
                        </button>
                    `
                    : blockedMe
                        ? `
                            <div
                                class="
                                    wfesc-block-empty
                                "
                                style="margin-top:11px;"
                            >
                                لا يمكنك إدارة حظر هذا المستخدم لأنه قام بحظرك.
                            </div>
                        `
                        : `
                            <button
                                type="button"
                                class="
                                    wfesc-block-action
                                    block
                                "
                                id="wfescSettingsBlockButton"
                            >
                                🚫 حظر المستخدم
                            </button>
                        `
            }

        `;


        /* -----------------------------------------
           UNBLOCK BUTTON
        ----------------------------------------- */

        const unblockButton =
            section.querySelector(
                "#wfescSettingsUnblockButton"
            );


        if (unblockButton) {

            unblockButton.addEventListener(
                "click",
                function () {

                    openBlockConfirmation(
                        "unblock",
                        userId,
                        name
                    );

                }
            );

        }


        /* -----------------------------------------
           BLOCK BUTTON
        ----------------------------------------- */

        const blockButton =
            section.querySelector(
                "#wfescSettingsBlockButton"
            );


        if (blockButton) {

            blockButton.addEventListener(
                "click",
                function () {

                    openBlockConfirmation(
                        "block",
                        userId,
                        name
                    );

                }
            );

        }

    }


    /* =====================================================
       REFRESH BLOCK SECTION
    ===================================================== */

    async function refreshBlockSection() {

        const token =
            ++blockRefreshToken;


        const section =
            ensureBlockSection();


        if (!section) {

            return;

        }


        renderBlockLoading(
            section
        );


        const contact =
            getCurrentContact();


        const userId =
            getContactUserId(
                contact
            );


        if (
            !contact ||
            !userId ||
            contact.is_support === true
        ) {

            if (
                token ===
                blockRefreshToken
            ) {

                renderBlockSection(
                    section,
                    {
                        contact,
                        userId,
                        blockedByMe:false,
                        blockedMe:false,
                        blockInfo:null
                    }
                );

            }

            return;

        }


        const block =
            getBlockModule();


        if (!block) {

            /*
             * messages-settings.js يتم تحميله
             * قبل messages-block.js، لذلك لا نعتبر
             * عدم وجود الموديول في البداية خطأ نهائياً.
             */

            if (
                token ===
                blockRefreshToken
            ) {

                section.innerHTML = `

                    <div
                        class="wfesc-block-title"
                    >
                        🚫 الحظر
                    </div>


                    <div
                        class="wfesc-block-description"
                    >
                        إدارة حظر المستخدم المرتبط بهذه المحادثة.
                    </div>


                    <div
                        class="wfesc-block-empty"
                    >
                        نظام الحظر لم يتم تحميله بعد.
                    </div>

                `;

            }

            return;

        }


        try {

            const blockedByMePromise =
                typeof block.isBlocked ===
                "function"
                    ? block.isBlocked(
                        userId
                    )
                    : Promise.resolve(
                        false
                    );


            const blockedMePromise =
                typeof block.isBlockedBy ===
                "function"
                    ? block.isBlockedBy(
                        userId
                    )
                    : Promise.resolve(
                        false
                    );


            const blockInfoPromise =
                typeof block.getBlockInfo ===
                "function"
                    ? block.getBlockInfo(
                        userId
                    )
                    : Promise.resolve(
                        null
                    );


            const [
                blockedByMeResult,
                blockedMeResult,
                blockInfoResult
            ] =
                await Promise.all([
                    blockedByMePromise,
                    blockedMePromise,
                    blockInfoPromise
                ]);


            if (
                token !==
                blockRefreshToken
            ) {

                return;

            }


            renderBlockSection(
                section,
                {
                    contact,
                    userId,
                    blockedByMe:
                        Boolean(
                            blockedByMeResult
                        ),
                    blockedMe:
                        Boolean(
                            blockedMeResult
                        ),
                    blockInfo:
                        blockInfoResult ||
                        null
                }
            );

        } catch (error) {

            console.error(
                "[WFESC SETTINGS BLOCK] refresh failed",
                error
            );


            if (
                token ===
                blockRefreshToken
            ) {

                section.innerHTML = `

                    <div
                        class="wfesc-block-title"
                    >
                        🚫 الحظر
                    </div>


                    <div
                        class="wfesc-block-description"
                    >
                        إدارة حظر المستخدم المرتبط بهذه المحادثة.
                    </div>


                    <div
                        class="wfesc-block-empty"
                    >
                        تعذر جلب حالة الحظر حالياً.
                    </div>

                `;

            }

        }

    }


    /* =====================================================
       BLOCK EVENTS
    ===================================================== */

    window.addEventListener(
        "wfesc:user-blocked",
        function () {

            const modal =
                $("messageViewSettingsModal");


            if (
                modal &&
                modal.classList.contains(
                    "show"
                )
            ) {

                refreshBlockSection();

            }

        }
    );


    window.addEventListener(
        "wfesc:user-unblocked",
        function () {

            const modal =
                $("messageViewSettingsModal");


            if (
                modal &&
                modal.classList.contains(
                    "show"
                )
            ) {

                refreshBlockSection();

            }

        }
    );


    window.addEventListener(
        "wfesc:block-changed",
        function () {

            const modal =
                $("messageViewSettingsModal");


            if (
                modal &&
                modal.classList.contains(
                    "show"
                )
            ) {

                refreshBlockSection();

            }

        }
    );


    window.addEventListener(
        "wfesc:chat-header-refresh",
        function () {

            const modal =
                $("messageViewSettingsModal");


            if (
                modal &&
                modal.classList.contains(
                    "show"
                )
            ) {

                setTimeout(
                    refreshBlockSection,
                    0
                );

            }

        }
    );


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


        ensureBlockStyle();

        ensureBlockSection();


        modal.classList.add(
            "show"
        );


        document.body.classList.add(
            "modal-open"
        );


        /*
         * يتم التنفيذ بعد فتح المودال
         * حتى تكون المحادثة الحالية مستقرة.
         */

        setTimeout(
            function () {

                refreshBlockSection();

            },
            0
        );

    }


    /* =====================================================
       CLOSE / CANCEL
    ===================================================== */

    function closeSettings() {

        const modal =
            $("messageViewSettingsModal");


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


        closeBlockConfirmation();


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


        const next =
            readDraftFromUI();


        currentSettings =
            cloneSettings(
                next
            );


        draftSettings =
            cloneSettings(
                next
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


        if (modal) {

            modal.classList.remove(
                "show"
            );

        }


        document.body.classList.remove(
            "modal-open"
        );


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
            $("messageBubbleWidthRange");


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
                            100
                        );


                    applyDraftLive();

                }
            );

        }


        /* -------------------------------------------------
           ارتفاع الفقاعة
           ------------------------------------------------- */

        const bubbleHeight =
            $("messageBubbleHeightRange");


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
           المسافة عن الإطار
           ------------------------------------------------- */

        const bubbleEdgeGap =
            $("messageBubbleEdgeRange");


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
                         * لا نغلق تلقائياً.
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


        currentSettings =
            loadSettings();


        draftSettings =
            cloneSettings(
                currentSettings
            );


        ensureBlockStyle();


        createColorGrid(
            "ownMessageColors",
            "own"
        );


        createColorGrid(
            "otherMessageColors",
            "other"
        );


        syncSettingsUI(
            currentSettings
        );


        applySettings(
            currentSettings
        );


        updatePreview(
            currentSettings
        );


        /*
         * إنشاء القسم فقط.
         * لا نعتمد على messages-block.js هنا
         * لأنه يتم تحميله بعد هذا الملف.
         */

        ensureBlockSection();


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


        apply:function (settings) {

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


        reset:resetSettings,

        refreshBlockSection:
            refreshBlockSection

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
