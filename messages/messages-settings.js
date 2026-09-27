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

        scale: 1,

        ownColor: "#9aa7ff",
        ownIntensity: 100,
        ownOpacity: 14,
        ownRadius: 18,
        ownShape: "normal",

        otherColor: "#ffffff",
        otherIntensity: 100,
        otherOpacity: 7,
        otherRadius: 18,
        otherShape: "normal",

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


    function sanitizeSettings(
        settings
    ) {

        const source =
            settings || {};


        const safe = {

            scale:
                clamp(
                    safeNumber(
                        source.scale,
                        DEFAULT_SETTINGS.scale
                    ),
                    0.85,
                    1.25
                ),


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


        /*
         * النسب.
         */

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


        /*
         * حدود الفقاعات.
         */

        const ownBorderOpacity =
            0.18 *
            ownIntensity;

        const otherBorderOpacity =
            0.095 *
            otherIntensity;


        /*
         * CSS variables الأساسية التي يستخدمها
         * messages.html فعلياً.
         */

        root.style.setProperty(
            "--message-text-scale",
            safe.scale
        );


        root.style.setProperty(
            "--message-bubble-scale",
            "1"
        );


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


        /*
         * الزجاج.
         */

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


        /*
         * تحديث الفقاعات الموجودة فعلياً.
         */

        applyBubbleAttributes(
            safe
        );


        /*
         * تحديث المعاينة.
         */

        updatePreview(
            safe
        );


        /*
         * الأنيميشن.
         */

        const style =
            ensureStyleElement();


        style.textContent = `

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
         * الفقاعات الحقيقية.
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
         * المعاينة.
         */

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

    function syncSettingsUI(
        settings
    ) {

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


        /*
         * Color pickers.
         */

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
         * الإلغاء يجب أن يعيد
         * آخر إعدادات محفوظة.
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
         * جعلها هي الإعدادات الرسمية.
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


        /*
         * حجم النص.
         */

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


        /*
         * شدة لون رسائلي.
         */

        const ownIntensity =
            $("ownColorIntensity");


        if (ownIntensity) {

            ownIntensity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /*
         * شفافية رسائلي.
         */

        const ownOpacity =
            $("ownColorTransparency");


        if (ownOpacity) {

            ownOpacity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /*
         * شكل رسائلي.
         */

        const ownShape =
            $("ownBubbleShape");


        if (ownShape) {

            ownShape.addEventListener(
                "change",
                applyDraftLive
            );

        }


        /*
         * استدارة رسائلي.
         */

        const ownRadius =
            $("ownBubbleRadius");


        if (ownRadius) {

            ownRadius.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /*
         * شكل الطرف الآخر.
         */

        const otherShape =
            $("otherBubbleShape");


        if (otherShape) {

            otherShape.addEventListener(
                "change",
                applyDraftLive
            );

        }


        /*
         * شدة لون الطرف الآخر.
         */

        const otherIntensity =
            $("otherColorIntensity");


        if (otherIntensity) {

            otherIntensity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /*
         * شفافية الطرف الآخر.
         */

        const otherOpacity =
            $("otherColorTransparency");


        if (otherOpacity) {

            otherOpacity.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /*
         * استدارة الطرف الآخر.
         */

        const otherRadius =
            $("otherBubbleRadius");


        if (otherRadius) {

            otherRadius.addEventListener(
                "input",
                applyDraftLive
            );

        }


        /*
         * اللون المخصص - رسائلي.
         */

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


        /*
         * اللون المخصص - الطرف الآخر.
         */

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


        /*
         * الضغط خارج المودال لا يحفظ ولا يلغي.
         * فقط يمنع إغلاقه بالغلط.
         */

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


        /*
         * تحميل الإعدادات.
         */

        currentSettings =
            loadSettings();


        draftSettings =
            cloneSettings(
                currentSettings
            );


        /*
         * إنشاء الألوان.
         */

        createColorGrid(
            "ownMessageColors",
            "own"
        );


        createColorGrid(
            "otherMessageColors",
            "other"
        );


        /*
         * تطبيق.
         */

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
         * الأحداث.
         */

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
