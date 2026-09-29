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

    let blockRefreshTimer = null;

    /*
     * آخر مستخدم حصلت له عملية حظر/إلغاء حظر.
     * يستخدم لتثبيت التحديثات ومنع حالات السباق.
     */
    let lastBlockTargetId = null;


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

            #chatView > #chatMessages .message-row {

                padding-inline:
                    var(
                        --message-bubble-edge-gap,
                        12px
                    )
                    !important;

            }


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


        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            ownShape.value =
                safe.ownShape;

        }


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


        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            otherShape.value =
                safe.otherShape;

        }


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


        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            next.ownShape =
                ownShape.value;

        }


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


        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            next.otherShape =
                otherShape.value;

        }


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


    /*
     * جلب نسخة أحدث من جهة الاتصال.
     */
    async function resolveFreshContact(
        contact,
        userId
    ) {

        const core =
            getCore();


        if (
            !userId
        ) {

            return contact || null;

        }


        if (
            core &&
            typeof core.getConversationContact ===
            "function"
        ) {

            try {

                const freshContact =
                    await core.getConversationContact(
                        userId
                    );


                if (
                    freshContact &&
                    typeof freshContact ===
                    "object"
                ) {

                    return Object.assign(
                        {},
                        contact || {},
                        freshContact
                    );

                }

            } catch (error) {

                console.warn(
                    "[WFESC SETTINGS BLOCK] fresh contact lookup failed",
                    error
                );

            }

        }


        /*
         * fallback بسيط للصورة من profiles
         * بدون الاعتماد على أعمدة غير مؤكدة.
         */
        try {

            const block =
                getBlockModule();

            const client =
                block?.client ||
                window.WFESCSupabase ||
                null;


            if (
                client &&
                typeof client
                    .from ===
                "function"
            ) {

                const {
                    data,
                    error
                } =
                    await client
                        .from("profiles")
                        .select(
                            "id, avatar_url"
                        )
                        .eq(
                            "id",
                            userId
                        )
                        .maybeSingle();


                if (
                    !error &&
                    data
                ) {

                    return Object.assign(
                        {},
                        contact || {},
                        data
                    );

                }

            }

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS BLOCK] profile fallback failed",
                error
            );

        }


        return contact || null;

    }


    /*
     * جلب جهة اتصال خاصة بالمستخدم المحظور.
     * نبدأ من Core حتى نحصل على الاسم واليوزر والصورة
     * الصحيحة إن كانت متوفرة.
     */
    async function resolveBlockedUserContact(
        userId
    ) {

        if (!userId) {

            return null;

        }


        const core =
            getCore();


        if (
            core &&
            typeof core.getConversationContact ===
            "function"
        ) {

            try {

                const contact =
                    await core.getConversationContact(
                        userId
                    );


                if (
                    contact &&
                    typeof contact ===
                    "object"
                ) {

                    return contact;

                }

            } catch (error) {

                console.warn(
                    "[WFESC SETTINGS BLOCK] blocked user contact lookup failed",
                    userId,
                    error
                );

            }

        }


        /*
         * fallback من profiles للصورة على الأقل.
         */
        try {

            const block =
                getBlockModule();

            const client =
                block?.client ||
                window.WFESCSupabase ||
                null;


            if (
                client &&
                typeof client
                    .from ===
                "function"
            ) {

                const {
                    data,
                    error
                } =
                    await client
                        .from("profiles")
                        .select(
                            "id, avatar_url"
                        )
                        .eq(
                            "id",
                            userId
                        )
                        .maybeSingle();


                if (
                    !error &&
                    data
                ) {

                    return data;

                }

            }

        } catch (error) {

            console.warn(
                "[WFESC SETTINGS BLOCK] profiles fallback failed",
                userId,
                error
            );

        }


        return {
            id:
                userId
        };

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


    function getSafeAvatar(
        contact,
        userId
    ) {

        const avatar =
            getContactAvatar(
                contact
            );


        if (avatar) {

            return avatar;

        }


        /*
         * صورة افتراضية خفيفة حتى لا يكون
         * src فارغاً.
         */
        return (
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
                `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="96"
                    height="96"
                    viewBox="0 0 96 96"
                >
                    <rect
                        width="96"
                        height="96"
                        rx="48"
                        fill="#191919"
                    />
                    <circle
                        cx="48"
                        cy="36"
                        r="16"
                        fill="#777"
                    />
                    <path
                        d="M20 80c4-17 15-25 28-25s24 8 28 25"
                        fill="#777"
                    />
                </svg>
                `
            )
        );

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


            /* =========================================
               BLOCKED USERS LIST
            ========================================= */

            #wfescSettingsBlockSection
            .wfesc-block-list {

                display:flex;

                flex-direction:column;

                gap:10px;

                margin-top:10px;

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


            #wfescSettingsBlockSection
            .wfesc-block-subtitle {

                margin-top:17px;

                margin-bottom:8px;

                color:#ddd;

                font-size:12px;

                font-weight:800;

            }


            #wfescSettingsBlockSection
            .wfesc-block-list-button {

                margin-top:10px;

                width:100%;

            }


            #wfescSettingsBlockSection
            .wfesc-block-user
            .wfesc-block-card-content {

                min-width:0;

                flex:1;

            }


            #wfescSettingsBlockSection
            .wfesc-block-user
            .wfesc-block-card-button {

                width:auto;

                min-width:95px;

                min-height:38px;

                margin-top:0;

                flex:none;

                padding:8px 10px;

                border-radius:12px;

                color:#baffcf;

                background:
                    rgba(54,226,123,.08);

                border:
                    1px solid
                    rgba(54,226,123,.16);

                font-size:11px;

                font-weight:800;

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
            .wfesc-block-dialog-final {

                margin-top:10px;

                padding:
                    10px 11px;

                border-radius:13px;

                color:#dcdcdc;

                background:
                    rgba(255,255,255,.035);

                border:
                    1px solid
                    rgba(255,255,255,.06);

                font-size:12px;

                font-weight:700;

                line-height:1.8;

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


            @media (
                max-width:520px
            ) {

                #wfescSettingsBlockSection
                .wfesc-block-user {

                    align-items:flex-start;

                }

                #wfescSettingsBlockSection
                .wfesc-block-user
                .wfesc-block-card-button {

                    min-width:84px;

                    padding:
                        8px;

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
       نافذة واحدة فقط
    ===================================================== */

    function openBlockConfirmation(
        mode,
        userId,
        userName
    ) {

        closeBlockConfirmation();


        if (!userId) {

            showBlockToast(
                "تعذر تحديد المستخدم"
            );

            return;

        }


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


        const finalMessage =
            isUnblock
                ? (
                    "سيتم إلغاء الحظر عن المستخدم " +
                    (userName || "المستخدم")
                )
                : (
                    "سيتم حظر المستخدم " +
                    (userName || "المستخدم")
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
                class="wfesc-block-dialog-note"
            >
                ${escapeHTML(
                    note
                )}
            </div>


            <div
                class="wfesc-block-dialog-final"
            >
                ${escapeHTML(
                    finalMessage
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

        lastBlockTargetId =
            userId
                ? String(userId)
                : null;


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
       SCHEDULE BLOCK REFRESH
    ===================================================== */

    function scheduleBlockSectionRefresh() {

        clearTimeout(
            blockRefreshTimer
        );


        blockRefreshTimer =
            setTimeout(
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

                },
                40
            );

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


        if (!userId) {

            showBlockToast(
                "تعذر تحديد المستخدم"
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


                /*
                 * القائمة تتحدث مباشرة.
                 */
                scheduleBlockSectionRefresh();


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
             * لا نغلق المحادثة.
             * التاريخ القديم يبقى موجوداً.
             */
            scheduleBlockSectionRefresh();


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


            scheduleBlockSectionRefresh();

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
                إدارة المستخدمين الذين قمت بحظرهم والحظر المرتبط بالمحادثة الحالية.
            </div>


            <div
                class="wfesc-block-empty"
            >
                جاري تحميل بيانات الحظر...
            </div>

        `;

    }


    /* =====================================================
       BLOCKED USER CARD
    ===================================================== */

    function buildBlockedUserCard(
        item,
        contact
    ) {

        const userId =
            item?.blocked_id ||
            item?.userId ||
            item?.id ||
            null;


        if (!userId) {

            return null;

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
            getSafeAvatar(
                contact,
                userId
            );


        const dateText =
            formatBlockDate(
                item?.created_at
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "wfesc-block-user";


        card.dataset.userId =
            String(
                userId
            );


        card.innerHTML = `

            <img
                class="wfesc-block-avatar"
                src="${escapeHTML(
                    avatar
                )}"
                alt=""
                draggable="false"
            >


            <div
                class="wfesc-block-card-content"
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
                    أنت قمت بحظر هذا المستخدم
                </div>


                <div
                    class="wfesc-block-date"
                >
                    تاريخ ووقت الحظر:
                    ${escapeHTML(
                        dateText
                    )}
                </div>

            </div>


            <button
                type="button"
                class="wfesc-block-card-button"
                data-block-action="unblock"
                data-user-id="${escapeHTML(
                    String(userId)
                )}"
                data-user-name="${escapeHTML(
                    name
                )}"
            >
                🔓 فتح الحظر
            </button>

        `;


        const unblockButton =
            card.querySelector(
                '[data-block-action="unblock"]'
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


        return card;

    }


    /* =====================================================
       RENDER BLOCKED USERS LIST
    ===================================================== */

    function renderBlockedUsersList(
        container,
        blockedUsers
    ) {

        if (!container) {

            return;

        }


        container.innerHTML = "";


        if (
            !Array.isArray(
                blockedUsers
            ) ||
            blockedUsers.length === 0
        ) {

            container.innerHTML = `

                <div
                    class="wfesc-block-empty"
                >
                    لا يوجد مستخدمون قمت بحظرهم حالياً.
                </div>

            `;

            return;

        }


        /*
         * تعرض القائمة حسب created_at القادم من
         * messages-block.js.
         */
        blockedUsers.forEach(
            function (item) {

                const card =
                    item?._resolvedContact
                        ? buildBlockedUserCard(
                            item,
                            item._resolvedContact
                        )
                        : null;


                if (card) {

                    container.appendChild(
                        card
                    );

                }

            }
        );


        if (
            !container.children.length
        ) {

            container.innerHTML = `

                <div
                    class="wfesc-block-empty"
                >
                    تعذر تحميل بيانات المستخدمين المحظورين حالياً.
                </div>

            `;

        }

    }


    /* =====================================================
       BLOCK SECTION - CURRENT CONVERSATION
    ===================================================== */

    function renderCurrentConversationBlock(
        container,
        data
    ) {

        if (!container) {

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


        const name =
            getContactName(
                contact
            );


        const username =
            getContactUsername(
                contact
            );


        const avatar =
            getSafeAvatar(
                contact,
                userId
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


        const wrap =
            document.createElement(
                "div"
            );


        wrap.innerHTML = `

            <div
                class="wfesc-block-subtitle"
            >
                المحادثة الحالية
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

                </div>

            </div>

        `;


        if (blockedByMe) {

            const action =
                document.createElement(
                    "button"
                );


            action.type =
                "button";


            action.className =
                "wfesc-block-action unblock";


            action.textContent =
                "🔓 فتح الحظر";


            action.addEventListener(
                "click",
                function () {

                    openBlockConfirmation(
                        "unblock",
                        userId,
                        name
                    );

                }
            );


            wrap.appendChild(
                action
            );

        } else if (blockedMe) {

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "wfesc-block-empty";


            info.style.marginTop =
                "11px";


            info.textContent =
                "لا يمكنك إدارة حظر هذا المستخدم لأنه قام بحظرك.";


            wrap.appendChild(
                info
            );

        } else {

            const action =
                document.createElement(
                    "button"
                );


            action.type =
                "button";


            action.className =
                "wfesc-block-action block";


            action.textContent =
                "🚫 حظر المستخدم";


            action.addEventListener(
                "click",
                function () {

                    openBlockConfirmation(
                        "block",
                        userId,
                        name
                    );

                }
            );


            wrap.appendChild(
                action
            );

        }


        container.appendChild(
            wrap
        );

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


        section.innerHTML = "";


        /*
         * العنوان.
         */
        const title =
            document.createElement(
                "div"
            );


        title.className =
            "wfesc-block-title";


        title.textContent =
            "🚫 الحظر";


        section.appendChild(
            title
        );


        /*
         * الوصف.
         */
        const description =
            document.createElement(
                "div"
            );


        description.className =
            "wfesc-block-description";


        description.textContent =
            "إدارة المستخدمين الذين قمت بحظرهم والحظر المرتبط بالمحادثة الحالية.";


        section.appendChild(
            description
        );


        /*
         * قائمة كل المحظورين.
         */
        const listTitle =
            document.createElement(
                "div"
            );


        listTitle.className =
            "wfesc-block-subtitle";


        listTitle.textContent =
            "المستخدمون الذين قمت بحظرهم";


        section.appendChild(
            listTitle
        );


        const list =
            document.createElement(
                "div"
            );


        list.className =
            "wfesc-block-list";


        section.appendChild(
            list
        );


        renderBlockedUsersList(
            list,
            data?.blockedUsers || []
        );


        /*
         * المحادثة الحالية.
         */
        const contact =
            data?.contact ||
            null;


        const userId =
            data?.userId ||
            null;


        if (
            contact &&
            userId
        ) {

            renderCurrentConversationBlock(
                section,
                data
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


        const block =
            getBlockModule();


        if (!block) {

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
                        إدارة المستخدمين الذين قمت بحظرهم والحظر المرتبط بالمحادثة الحالية.
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


        let contact =
            getCurrentContact();


        let userId =
            getContactUserId(
                contact
            );


        /*
         * fallback للمحادثة الحالية.
         */
        if (
            !contact ||
            !userId
        ) {

            const core =
                getCore();


            try {

                if (
                    core &&
                    typeof core.getCurrentConversation ===
                    "function"
                ) {

                    const conversation =
                        core.getCurrentConversation();


                    const conversationContact =
                        conversation?.contact ||
                        conversation?.user ||
                        conversation?.other_user ||
                        null;


                    const conversationUserId =
                        getContactUserId(
                            conversationContact
                        );


                    if (
                        conversationContact &&
                        conversationUserId
                    ) {

                        contact =
                            conversationContact;

                        userId =
                            conversationUserId;

                    }

                }

            } catch (error) {

                console.warn(
                    "[WFESC SETTINGS BLOCK] conversation fallback failed",
                    error
                );

            }

        }


        try {

            /*
             * 1) قائمة المحظورين كلها.
             */
            const blockedUsersRaw =
                typeof block.getBlockedUsers ===
                "function"
                    ? await block.getBlockedUsers()
                    : [];


            if (
                token !==
                blockRefreshToken
            ) {

                return;

            }


            const blockedUsers =
                Array.isArray(
                    blockedUsersRaw
                )
                    ? blockedUsersRaw
                    : [];


            /*
             * 2) جلب بيانات كل شخص محظور.
             *
             * لا نعتمد على current contact فقط.
             */
            const blockedResolved =
                await Promise.all(
                    blockedUsers.map(
                        async function (item) {

                            const blockedId =
                                item?.blocked_id ||
                                null;


                            if (!blockedId) {

                                return null;

                            }


                            const freshContact =
                                await resolveBlockedUserContact(
                                    blockedId
                                );


                            return Object.assign(
                                {},
                                item,
                                {
                                    _resolvedContact:
                                        freshContact ||
                                        {
                                            id:
                                                blockedId
                                        }
                                }
                            );

                        }
                    )
                );


            if (
                token !==
                blockRefreshToken
            ) {

                return;

            }


            /*
             * 3) جهة الاتصال الحالية.
             */
            if (
                contact &&
                userId &&
                contact.is_support !== true
            ) {

                contact =
                    await resolveFreshContact(
                        contact,
                        userId
                    );


                if (
                    token !==
                    blockRefreshToken
                ) {

                    return;

                }


                const freshUserId =
                    getContactUserId(
                        contact
                    );


                if (
                    freshUserId
                ) {

                    userId =
                        freshUserId;

                }

            }


            /*
             * 4) حالة حظر المحادثة الحالية.
             */
            let blockedByMeResult =
                false;

            let blockedMeResult =
                false;

            let blockInfoResult =
                null;


            if (
                userId &&
                contact &&
                contact.is_support !== true
            ) {

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


                const results =
                    await Promise.all([
                        blockedByMePromise,
                        blockedMePromise,
                        blockInfoPromise
                    ]);


                blockedByMeResult =
                    Boolean(
                        results[0]
                    );


                blockedMeResult =
                    Boolean(
                        results[1]
                    );


                blockInfoResult =
                    results[2] ||
                    null;

            }


            if (
                token !==
                blockRefreshToken
            ) {

                return;

            }


            /*
             * 5) تثبيت المعرف الذي حصلت عليه عملية الحظر.
             */
            if (
                lastBlockTargetId
            ) {

                const existsInList =
                    blockedUsers.some(
                        function (item) {

                            return (
                                String(
                                    item?.blocked_id
                                ) ===
                                String(
                                    lastBlockTargetId
                                )
                            );

                        }
                    );


                if (existsInList) {

                    /*
                     * فقط تثبيت منطقي.
                     * لا نغيّر البيانات القادمة من DB.
                     */
                    lastBlockTargetId =
                        String(
                            lastBlockTargetId
                        );

                }

            }


            /*
             * 6) عرض كل شيء.
             */
            renderBlockSection(
                section,
                {

                    contact:
                        contact,

                    userId:
                        userId,

                    blockedByMe:
                        blockedByMeResult,

                    blockedMe:
                        blockedMeResult,

                    blockInfo:
                        blockInfoResult &&
                        userId &&
                        String(
                            blockInfoResult.blocked_id
                        ) ===
                        String(
                            userId
                        )
                            ? blockInfoResult
                            : null,

                    blockedUsers:
                        blockedResolved.filter(
                            Boolean
                        )

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
                        إدارة المستخدمين الذين قمت بحظرهم والحظر المرتبط بالمحادثة الحالية.
                    </div>


                    <div
                        class="wfesc-block-empty"
                    >
                        تعذر جلب قائمة المحظورين حالياً.
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
        function (event) {

            const userId =
                event?.detail?.userId ||
                null;


            if (userId) {

                lastBlockTargetId =
                    String(
                        userId
                    );

            }


            scheduleBlockSectionRefresh();

        }
    );


    window.addEventListener(
        "wfesc:user-unblocked",
        function (event) {

            const userId =
                event?.detail?.userId ||
                null;


            if (userId) {

                lastBlockTargetId =
                    String(
                        userId
                    );

            }


            scheduleBlockSectionRefresh();

        }
    );


    window.addEventListener(
        "wfesc:block-changed",
        function (event) {

            const userId =
                event?.detail?.userId ||
                null;


            if (userId) {

                lastBlockTargetId =
                    String(
                        userId
                    );

            }


            scheduleBlockSectionRefresh();

        }
    );


    window.addEventListener(
        "wfesc:chat-header-refresh",
        function () {

            scheduleBlockSectionRefresh();

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


        const ownIntensity =
            $("ownColorIntensity");


        if (ownIntensity) {

            ownIntensity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        const ownOpacity =
            $("ownColorTransparency");


        if (ownOpacity) {

            ownOpacity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            ownShape.addEventListener(
                "change",
                applyDraftLive
            );

        }


        const ownRadius =
            $("ownBubbleRadius");


        if (ownRadius) {

            ownRadius.addEventListener(
                "input",
                applyDraftLive
            );

        }


        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            otherShape.addEventListener(
                "change",
                applyDraftLive
            );

        }


        const otherIntensity =
            $("otherColorIntensity");


        if (otherIntensity) {

            otherIntensity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        const otherOpacity =
            $("otherColorTransparency");


        if (otherOpacity) {

            otherOpacity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        const otherRadius =
            $("otherBubbleRadius");


        if (otherRadius) {

            otherRadius.addEventListener(
                "input",
                applyDraftLive
            );

        }


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
