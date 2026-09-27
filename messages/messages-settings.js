/* =========================================================
   WFESC Messages Settings
   File: messages/messages-settings.js

   المسؤول عن:
   - حجم نص الرسائل
   - لون رسائلي
   - شدة لون رسائلي
   - شفافية رسائلي
   - شكل فقاعات رسائلي
   - استدارة فقاعات رسائلي
   - لون رسائل الطرف الآخر
   - شدة لون الطرف الآخر
   - شفافية لون الطرف الآخر
   - شكل فقاعات الطرف الآخر
   - استدارة فقاعات الطرف الآخر
   - شبكة ألوان الطرفين
   - المعاينة المباشرة
   - تطبيق الإعدادات على الرسائل الحقيقية
   - حفظ الإعدادات محلياً
   - تطبيق فوري بدون Refresh
   ========================================================= */

(() => {
    "use strict";

    const STORAGE_PREFIX =
        "wfesc_message_view_settings_";

    /* =========================================================
       الإعدادات الافتراضية
       ========================================================= */

    const DEFAULT_SETTINGS = {
        scale: 1,

        /* رسائلي */
        ownColor: "#36e27b",
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

        /* خصائص عامة */
        glass: true,
        animations: true
    };

    /* =========================================================
       ألوان جاهزة
       ========================================================= */

    const PRESET_COLORS = [
        "#36e27b",
        "#22c55e",
        "#3b82f6",
        "#06b6d4",
        "#8b5cf6",
        "#a855f7",
        "#ec4899",
        "#f43f5e",
        "#ef4444",
        "#f97316",
        "#f59e0b",
        "#eab308",
        "#84cc16",
        "#14b8a6",
        "#0ea5e9",
        "#6366f1",
        "#d946ef",
        "#fb7185",
        "#f5f5f5",
        "#9ca3af"
    ];

    let currentSettings = {
        ...DEFAULT_SETTINGS
    };

    let draftSettings = {
        ...DEFAULT_SETTINGS
    };

    let styleElement = null;
    let initialized = false;

    /* =========================================================
       Helpers
       ========================================================= */

    function $(id) {
        return document.getElementById(id);
    }

    function clamp(value, min, max) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return min;
        }

        return Math.min(
            max,
            Math.max(min, number)
        );
    }

    function safeNumber(
        value,
        fallback
    ) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function isValidHex(value) {
        return /^#[0-9a-fA-F]{6}$/.test(
            String(value || "")
        );
    }

    function normalizeHex(
        value,
        fallback
    ) {
        return isValidHex(value)
            ? String(value).toLowerCase()
            : fallback;
    }

    function getCurrentUserId() {
        try {
            if (
                window.WFESC_MESSAGES &&
                typeof window.WFESC_MESSAGES
                    .getCurrentUser ===
                    "function"
            ) {
                const user =
                    window.WFESC_MESSAGES
                        .getCurrentUser();

                if (
                    user &&
                    user.id
                ) {
                    return String(user.id);
                }
            }
        } catch (error) {
            console.warn(
                "[WFESC Settings] تعذر الحصول على معرف المستخدم:",
                error
            );
        }

        return "guest";
    }

    function getStorageKey() {
        return (
            STORAGE_PREFIX +
            getCurrentUserId()
        );
    }

    /* =========================================================
       الألوان
       ========================================================= */

    function hexToRgb(hex) {
        const clean =
            String(hex || "")
                .replace("#", "");

        if (clean.length !== 6) {
            return {
                r: 255,
                g: 255,
                b: 255
            };
        }

        return {
            r: parseInt(
                clean.substring(0, 2),
                16
            ),
            g: parseInt(
                clean.substring(2, 4),
                16
            ),
            b: parseInt(
                clean.substring(4, 6),
                16
            )
        };
    }

    function getIntensityColor(
        hex,
        intensity
    ) {
        const rgb =
            hexToRgb(hex);

        const amount =
            clamp(
                intensity,
                0,
                100
            ) / 100;

        /*
         * 100% = اللون الأصلي
         * 0% = أقرب للرمادي
         */

        const gray =
            rgb.r * 0.299 +
            rgb.g * 0.587 +
            rgb.b * 0.114;

        return {
            r: Math.round(
                gray +
                (rgb.r - gray) *
                    amount
            ),

            g: Math.round(
                gray +
                (rgb.g - gray) *
                    amount
            ),

            b: Math.round(
                gray +
                (rgb.b - gray) *
                    amount
            )
        };
    }

    function rgba(
        hex,
        opacity,
        intensity
    ) {
        const color =
            getIntensityColor(
                hex,
                intensity
            );

        const alpha =
            clamp(
                opacity,
                0,
                100
            ) / 100;

        return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }

    /* =========================================================
       الأشكال
       ========================================================= */

    function getBubbleRadius(
        shape,
        radius
    ) {
        const safeRadius =
            clamp(
                radius,
                4,
                40
            );

        switch (shape) {
            case "pill":
                return "999px";

            case "soft":
                return `${Math.max(
                    safeRadius,
                    24
                )}px`;

            case "square":
                return "8px";

            case "normal":
            default:
                return `${safeRadius}px`;
        }
    }

    function getOwnRadius(
        settings
    ) {
        return getBubbleRadius(
            settings.ownShape,
            settings.ownRadius
        );
    }

    function getOtherRadius(
        settings
    ) {
        return getBubbleRadius(
            settings.otherShape,
            settings.otherRadius
        );
    }

    /* =========================================================
       تنظيف الإعدادات
       ========================================================= */

    function sanitizeSettings(
        input
    ) {
        const data = input || {};

        return {
            scale: clamp(
                safeNumber(
                    data.scale,
                    DEFAULT_SETTINGS.scale
                ),
                0.85,
                1.25
            ),

            /* رسائلي */

            ownColor: normalizeHex(
                data.ownColor,
                DEFAULT_SETTINGS.ownColor
            ),

            ownIntensity: clamp(
                safeNumber(
                    data.ownIntensity,
                    DEFAULT_SETTINGS.ownIntensity
                ),
                0,
                100
            ),

            ownOpacity: clamp(
                safeNumber(
                    data.ownOpacity,
                    DEFAULT_SETTINGS.ownOpacity
                ),
                0,
                100
            ),

            ownRadius: clamp(
                safeNumber(
                    data.ownRadius,
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
                    data.ownShape
                )
                    ? data.ownShape
                    : DEFAULT_SETTINGS.ownShape,

            /* الطرف الآخر */

            otherColor: normalizeHex(
                data.otherColor,
                DEFAULT_SETTINGS.otherColor
            ),

            otherIntensity: clamp(
                safeNumber(
                    data.otherIntensity,
                    DEFAULT_SETTINGS.otherIntensity
                ),
                0,
                100
            ),

            otherOpacity: clamp(
                safeNumber(
                    data.otherOpacity,
                    DEFAULT_SETTINGS.otherOpacity
                ),
                0,
                100
            ),

            otherRadius: clamp(
                safeNumber(
                    data.otherRadius,
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
                    data.otherShape
                )
                    ? data.otherShape
                    : DEFAULT_SETTINGS.otherShape,

            glass:
                data.glass !== false,

            animations:
                data.animations !== false
        };
    }

    /* =========================================================
       Load / Save
       ========================================================= */

    function loadSettings() {
        try {
            const raw =
                localStorage.getItem(
                    getStorageKey()
                );

            if (!raw) {
                return {
                    ...DEFAULT_SETTINGS
                };
            }

            const parsed =
                JSON.parse(raw);

            return sanitizeSettings({
                ...DEFAULT_SETTINGS,
                ...parsed
            });
        } catch (error) {
            console.warn(
                "[WFESC Settings] تعذر تحميل الإعدادات:",
                error
            );

            return {
                ...DEFAULT_SETTINGS
            };
        }
    }

    function saveSettings(
        settings
    ) {
        try {
            localStorage.setItem(
                getStorageKey(),
                JSON.stringify(
                    sanitizeSettings(
                        settings
                    )
                )
            );

            return true;
        } catch (error) {
            console.warn(
                "[WFESC Settings] تعذر حفظ الإعدادات:",
                error
            );

            return false;
        }
    }

    /* =========================================================
       Dynamic Style
       ========================================================= */

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

    function applySettings(
        settings
    ) {
        const safe =
            sanitizeSettings(
                settings
            );

        /* -----------------------------------------
           لون رسائلي
           ----------------------------------------- */

        const ownColor =
            rgba(
                safe.ownColor,
                safe.ownOpacity,
                safe.ownIntensity
            );

        const ownBorder =
            rgba(
                safe.ownColor,
                Math.min(
                    100,
                    safe.ownOpacity + 12
                ),
                safe.ownIntensity
            );

        /* -----------------------------------------
           لون الطرف الآخر
           ----------------------------------------- */

        const otherColor =
            rgba(
                safe.otherColor,
                safe.otherOpacity,
                safe.otherIntensity
            );

        const otherBorder =
            rgba(
                safe.otherColor,
                Math.min(
                    100,
                    safe.otherOpacity + 10
                ),
                safe.otherIntensity
            );

        const ownRadius =
            getOwnRadius(
                safe
            );

        const otherRadius =
            getOtherRadius(
                safe
            );

        /* -----------------------------------------
           متغيرات CSS الرئيسية
           ----------------------------------------- */

        const root =
            document.documentElement;

        root.style.setProperty(
            "--message-text-scale",
            String(safe.scale)
        );

        root.style.setProperty(
            "--own-bubble-radius",
            ownRadius
        );

        root.style.setProperty(
            "--other-bubble-radius",
            otherRadius
        );

        root.style.setProperty(
            "--own-bubble-bg",
            ownColor
        );

        root.style.setProperty(
            "--own-bubble-border",
            ownBorder
        );

        root.style.setProperty(
            "--other-bubble-bg",
            otherColor
        );

        root.style.setProperty(
            "--other-bubble-border",
            otherBorder
        );

        /* -----------------------------------------
           متغيرات إضافية للتوافق
           ----------------------------------------- */

        root.style.setProperty(
            "--message-own-color",
            ownColor
        );

        root.style.setProperty(
            "--message-other-color",
            otherColor
        );

        root.style.setProperty(
            "--message-own-border",
            ownBorder
        );

        root.style.setProperty(
            "--message-other-border",
            otherBorder
        );

        /* -----------------------------------------
           CSS مباشر احتياطي
           ----------------------------------------- */

        const animationRule =
            safe.animations
                ? ""
                : `
                    .message-bubble,
                    .conversation-item,
                    .send-button,
                    .icon-button,
                    .modal,
                    .modal-card,
                    .preview-message {
                        transition: none !important;
                        animation: none !important;
                    }
                `;

        const glassRule =
            safe.glass
                ? ""
                : `
                    .message-bubble,
                    .preview-message {
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                    }
                `;

        ensureStyleElement();

        styleElement.textContent = `
            /* ======================================
               WFESC Message Settings
               ====================================== */

            .message-row.mine .message-bubble {
                background:
                    var(--own-bubble-bg, ${ownColor})
                    !important;

                border-color:
                    var(--own-bubble-border, ${ownBorder})
                    !important;

                border-radius:
                    var(--own-bubble-radius, ${ownRadius})
                    !important;

                font-size:
                    calc(
                        1em *
                        var(--message-text-scale, ${safe.scale})
                    )
                    !important;
            }

            .message-row.theirs .message-bubble {
                background:
                    var(--other-bubble-bg, ${otherColor})
                    !important;

                border-color:
                    var(--other-bubble-border, ${otherBorder})
                    !important;

                border-radius:
                    var(--other-bubble-radius, ${otherRadius})
                    !important;

                font-size:
                    calc(
                        1em *
                        var(--message-text-scale, ${safe.scale})
                    )
                    !important;
            }

            /* ======================================
               المعاينة تستخدم نفس المتغيرات
               المستخدمة في الرسائل الحقيقية
               ====================================== */

            .settings-preview
            .preview-message.own {
                background:
                    var(--own-bubble-bg, ${ownColor})
                    !important;

                border-color:
                    var(--own-bubble-border, ${ownBorder})
                    !important;

                border-radius:
                    var(--own-bubble-radius, ${ownRadius})
                    !important;

                font-size:
                    calc(
                        14px *
                        var(--message-text-scale, ${safe.scale})
                    )
                    !important;
            }

            .settings-preview
            .preview-message.other {
                background:
                    var(--other-bubble-bg, ${otherColor})
                    !important;

                border-color:
                    var(--other-bubble-border, ${otherBorder})
                    !important;

                border-radius:
                    var(--other-bubble-radius, ${otherRadius})
                    !important;

                font-size:
                    calc(
                        14px *
                        var(--message-text-scale, ${safe.scale})
                    )
                    !important;
            }

            .wfesc-settings-preview-messages
            .preview-message {
                transition:
                    background .2s ease,
                    border-color .2s ease,
                    border-radius .2s ease,
                    transform .2s ease,
                    box-shadow .2s ease;
            }

            ${animationRule}

            ${glassRule}
        `;

        currentSettings = {
            ...safe
        };
    }

    /* =========================================================
       إنشاء شبكة ألوان
       ========================================================= */

    function createColorGrid(
        containerId,
        side
    ) {
        const container =
            $(containerId);

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "wfesc-message-colors-grid";

        grid.style.display =
            "grid";

        grid.style.gridTemplateColumns =
            "repeat(10, minmax(0, 1fr))";

        grid.style.gap =
            "8px";

        grid.style.marginTop =
            "10px";

        PRESET_COLORS.forEach(
            (color) => {
                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.dataset.color =
                    color;

                button.dataset.side =
                    side;

                button.title =
                    color;

                button.setAttribute(
                    "aria-label",
                    `اختيار اللون ${color}`
                );

                button.style.width =
                    "100%";

                button.style.aspectRatio =
                    "1";

                button.style.minHeight =
                    "30px";

                button.style.padding =
                    "0";

                button.style.borderRadius =
                    "50%";

                button.style.border =
                    "2px solid transparent";

                button.style.background =
                    color;

                button.style.cursor =
                    "pointer";

                button.style.boxShadow =
                    "0 0 0 1px rgba(255,255,255,.12)";

                button.style.transition =
                    "transform .18s ease, border-color .18s ease, box-shadow .18s ease";

                button.addEventListener(
                    "mouseenter",
                    () => {
                        button.style.transform =
                            "scale(1.08)";
                    }
                );

                button.addEventListener(
                    "mouseleave",
                    () => {
                        const selected =
                            isSelectedColor(
                                side,
                                color
                            );

                        button.style.transform =
                            selected
                                ? "scale(1.08)"
                                : "scale(1)";
                    }
                );

                button.addEventListener(
                    "click",
                    () => {
                        if (
                            side ===
                            "own"
                        ) {
                            draftSettings.ownColor =
                                color;
                        } else {
                            draftSettings.otherColor =
                                color;
                        }

                        draftSettings =
                            sanitizeSettings(
                                draftSettings
                            );

                        syncSettingsUI(
                            draftSettings
                        );

                        updatePreview(
                            draftSettings
                        );
                    }
                );

                grid.appendChild(
                    button
                );
            }
        );

        container.appendChild(
            grid
        );
    }

    function createColorButtons() {
        createColorGrid(
            "ownMessageColors",
            "own"
        );

        createColorGrid(
            "otherMessageColors",
            "other"
        );
    }

    function isSelectedColor(
        side,
        color
    ) {
        const current =
            side === "own"
                ? currentSettings.ownColor
                : currentSettings.otherColor;

        const draft =
            side === "own"
                ? draftSettings.ownColor
                : draftSettings.otherColor;

        return (
            String(
                draft || current
            ).toLowerCase() ===
            String(color).toLowerCase()
        );
    }

    function updateColorSelection(
        color,
        side
    ) {
        const container =
            $(
                side === "own"
                    ? "ownMessageColors"
                    : "otherMessageColors"
            );

        if (!container) {
            return;
        }

        const buttons =
            container.querySelectorAll(
                "button[data-color]"
            );

        buttons.forEach(
            (button) => {
                const selected =
                    button.dataset.color
                        .toLowerCase() ===
                    String(
                        color
                    ).toLowerCase();

                button.style.borderColor =
                    selected
                        ? "#ffffff"
                        : "transparent";

                button.style.boxShadow =
                    selected
                        ? "0 0 0 2px rgba(255,255,255,.20)"
                        : "0 0 0 1px rgba(255,255,255,.12)";

                button.style.transform =
                    selected
                        ? "scale(1.08)"
                        : "scale(1)";
            }
        );
    }

    /* =========================================================
       تحديث واجهة الإعدادات
       ========================================================= */

    function setText(
        id,
        value
    ) {
        const element =
            $(id);

        if (element) {
            element.textContent =
                value;
        }
    }

    function setValue(
        id,
        value
    ) {
        const element =
            $(id);

        if (element) {
            element.value =
                value;
        }
    }

    function syncSettingsUI(
        settings
    ) {
        const safe =
            sanitizeSettings(
                settings
            );

        /* حجم النص */

        setValue(
            "messageSizeRange",
            Math.round(
                safe.scale * 100
            )
        );

        setText(
            "messageSizeValue",
            `${Math.round(
                safe.scale * 100
            )}%`
        );

        /* ======================================
           رسائلي
           ====================================== */

        setValue(
            "ownColorIntensity",
            safe.ownIntensity
        );

        setText(
            "ownColorIntensityValue",
            `${safe.ownIntensity}%`
        );

        setValue(
            "ownColorTransparency",
            safe.ownOpacity
        );

        setText(
            "ownColorTransparencyValue",
            `${safe.ownOpacity}%`
        );

        setValue(
            "ownBubbleShape",
            safe.ownShape
        );

        setValue(
            "ownBubbleRadius",
            safe.ownRadius
        );

        setText(
            "ownBubbleRadiusValue",
            `${safe.ownRadius}px`
        );

        /* ======================================
           الطرف الآخر
           ====================================== */

        setValue(
            "otherBubbleShape",
            safe.otherShape
        );

        /*
         * يدعم النظام القديم أيضاً
         * إذا كان input color ما زال موجوداً.
         */
        setValue(
            "otherBubbleColor",
            safe.otherColor
        );

        setValue(
            "otherColorIntensity",
            safe.otherIntensity
        );

        setText(
            "otherColorIntensityValue",
            `${safe.otherIntensity}%`
        );

        setValue(
            "otherColorTransparency",
            safe.otherOpacity
        );

        setText(
            "otherColorTransparencyValue",
            `${safe.otherOpacity}%`
        );

        setValue(
            "otherBubbleRadius",
            safe.otherRadius
        );

        setText(
            "otherBubbleRadiusValue",
            `${safe.otherRadius}px`
        );

        /* ألوان الشبكتين */

        updateColorSelection(
            safe.ownColor,
            "own"
        );

        updateColorSelection(
            safe.otherColor,
            "other"
        );
    }

    /* =========================================================
       قراءة القيم من الواجهة
       ========================================================= */

    function readDraftFromUI() {
        /* حجم النص */

        const sizeRange =
            $("messageSizeRange");

        if (sizeRange) {
            draftSettings.scale =
                clamp(
                    safeNumber(
                        sizeRange.value,
                        100
                    ) / 100,
                    0.85,
                    1.25
                );
        }

        /* ======================================
           رسائلي
           ====================================== */

        const ownIntensity =
            $("ownColorIntensity");

        if (ownIntensity) {
            draftSettings.ownIntensity =
                clamp(
                    ownIntensity.value,
                    0,
                    100
                );
        }

        const ownTransparency =
            $("ownColorTransparency");

        if (ownTransparency) {
            draftSettings.ownOpacity =
                clamp(
                    ownTransparency.value,
                    0,
                    100
                );
        }

        const ownShape =
            $("ownBubbleShape");

        if (ownShape) {
            draftSettings.ownShape =
                ownShape.value;
        }

        const ownRadius =
            $("ownBubbleRadius");

        if (ownRadius) {
            draftSettings.ownRadius =
                clamp(
                    ownRadius.value,
                    4,
                    40
                );
        }

        /* ======================================
           الطرف الآخر
           ====================================== */

        const otherShape =
            $("otherBubbleShape");

        if (otherShape) {
            draftSettings.otherShape =
                otherShape.value;
        }

        const otherColor =
            $("otherBubbleColor");

        if (otherColor) {
            draftSettings.otherColor =
                normalizeHex(
                    otherColor.value,
                    draftSettings.otherColor
                );
        }

        const otherIntensity =
            $("otherColorIntensity");

        if (otherIntensity) {
            draftSettings.otherIntensity =
                clamp(
                    otherIntensity.value,
                    0,
                    100
                );
        }

        const otherTransparency =
            $("otherColorTransparency");

        if (otherTransparency) {
            draftSettings.otherOpacity =
                clamp(
                    otherTransparency.value,
                    0,
                    100
                );
        }

        const otherRadius =
            $("otherBubbleRadius");

        if (otherRadius) {
            draftSettings.otherRadius =
                clamp(
                    otherRadius.value,
                    4,
                    40
                );
        }

        draftSettings =
            sanitizeSettings(
                draftSettings
            );

        /*
         * نطبّق المعاينة فوراً.
         * لا نحفظ هنا حتى لا يتحول كل تحريك للسلايدر
         * إلى عملية حفظ.
         */

        applySettings(
            draftSettings
        );

        syncSettingsUI(
            draftSettings
        );

        updatePreview(
            draftSettings
        );
    }

    /* =========================================================
       المعاينة
       ========================================================= */

    function updatePreview(
        settings
    ) {
        const safe =
            sanitizeSettings(
                settings
            );

        const preview =
            document.querySelector(
                ".settings-preview"
            );

        if (!preview) {
            return;
        }

        /*
         * إذا كانت HTML الجديدة تحتوي على
         * previewOwnMessage و previewOtherMessage
         * نستخدمهما مباشرة.
         */

        let own =
            $("previewOwnMessage");

        let other =
            $("previewOtherMessage");

        /*
         * إذا لم تكن موجودة، نبحث عن العناصر
         * القديمة الموجودة داخل المعاينة.
         */

        if (!own) {
            own =
                preview.querySelector(
                    ".preview-message.own"
                );
        }

        if (!other) {
            other =
                preview.querySelector(
                    ".preview-message.other"
                );
        }

        /*
         * إذا كانت المعاينة الجديدة غير موجودة
         * ننشئها مرة واحدة.
         */

        if (!own || !other) {
            let wrapper =
                preview.querySelector(
                    ".wfesc-settings-preview-messages"
                );

            if (!wrapper) {
                wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "wfesc-settings-preview-messages";

                wrapper.style.display =
                    "flex";

                wrapper.style.flexDirection =
                    "column";

                wrapper.style.gap =
                    "10px";

                wrapper.style.marginTop =
                    "12px";

                preview.appendChild(
                    wrapper
                );
            }

            if (!own) {
                own =
                    document.createElement(
                        "div"
                    );

                own.id =
                    "previewOwnMessage";

                own.className =
                    "preview-message own";

                own.textContent =
                    "هذه معاينة لرسائلي";

                wrapper.appendChild(
                    own
                );
            }

            if (!other) {
                other =
                    document.createElement(
                        "div"
                    );

                other.id =
                    "previewOtherMessage";

                other.className =
                    "preview-message other";

                other.textContent =
                    "هذه معاينة لرسالة الطرف الآخر";

                wrapper.appendChild(
                    other
                );
            }
        }

        /* ======================================
           رسائلي
           ====================================== */

        if (own) {
            own.style.background =
                rgba(
                    safe.ownColor,
                    safe.ownOpacity,
                    safe.ownIntensity
                );

            own.style.borderColor =
                rgba(
                    safe.ownColor,
                    Math.min(
                        100,
                        safe.ownOpacity + 12
                    ),
                    safe.ownIntensity
                );

            own.style.borderRadius =
                getOwnRadius(
                    safe
                );

            own.style.fontSize =
                `calc(14px * ${safe.scale})`;

            own.style.transition =
                "background .2s ease, border-color .2s ease, border-radius .2s ease, transform .2s ease";

            own.dataset.shape =
                safe.ownShape;
        }

        /* ======================================
           الطرف الآخر
           ====================================== */

        if (other) {
            other.style.background =
                rgba(
                    safe.otherColor,
                    safe.otherOpacity,
                    safe.otherIntensity
                );

            other.style.borderColor =
                rgba(
                    safe.otherColor,
                    Math.min(
                        100,
                        safe.otherOpacity + 10
                    ),
                    safe.otherIntensity
                );

            other.style.borderRadius =
                getOtherRadius(
                    safe
                );

            other.style.fontSize =
                `calc(14px * ${safe.scale})`;

            other.style.transition =
                "background .2s ease, border-color .2s ease, border-radius .2s ease, transform .2s ease";

            other.dataset.shape =
                safe.otherShape;
        }

        /*
         * تحديث المتغيرات مرة أخرى لضمان أن المعاينة
         * والرسائل الحقيقية تستخدم نفس القيم.
         */

        applySettings(
            safe
        );
    }

    /* =========================================================
       فتح نافذة الإعدادات
       ========================================================= */

    function openSettings() {
        const modal =
            $("messageViewSettingsModal");

        if (!modal) {
            console.warn(
                "[WFESC Settings] نافذة الإعدادات غير موجودة."
            );

            return;
        }

        currentSettings =
            loadSettings();

        draftSettings = {
            ...currentSettings
        };

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

    /* =========================================================
       إغلاق بدون حفظ
       ========================================================= */

    function closeSettings() {
        const modal =
            $("messageViewSettingsModal");

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "show"
        );

        document.body.classList.remove(
            "modal-open"
        );

        /*
         * نرجع للإعدادات المحفوظة.
         */

        draftSettings = {
            ...currentSettings
        };

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

    /* =========================================================
       رسالة نجاح
       ========================================================= */

    function showSuccessOverlay() {
        const overlay =
            $("settingsSuccessOverlay");

        if (!overlay) {
            return;
        }

        overlay.classList.add(
            "show"
        );

        window.setTimeout(
            () => {
                overlay.classList.remove(
                    "show"
                );
            },
            1600
        );
    }

    /* =========================================================
       حفظ
       ========================================================= */

    function saveCurrentSettings() {
        /*
         * مهم:
         * لا نعيد تحميل الصفحة.
         * ولا نعيد إنشاء المحادثة.
         */

        const chatMessages =
            $("chatMessages");

        const previousScrollTop =
            chatMessages
                ? chatMessages.scrollTop
                : 0;

        readDraftFromUI();

        currentSettings =
            sanitizeSettings(
                draftSettings
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

        closeSettings();

        showSuccessOverlay();

        /*
         * نحافظ على مكان المحادثة.
         */

        requestAnimationFrame(
            () => {
                if (
                    chatMessages
                ) {
                    chatMessages.scrollTop =
                        previousScrollTop;
                }
            }
        );
    }

    /* =========================================================
       ربط السلايدرات
       ========================================================= */

    function bindRange(
        id
    ) {
        const element =
            $(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            "input",
            () => {
                readDraftFromUI();
            }
        );

        element.addEventListener(
            "change",
            () => {
                readDraftFromUI();
            }
        );
    }

    /* =========================================================
       ربط الأحداث
       ========================================================= */

    function bindEvents() {
        const openButton =
            $("messageViewSettingsButton");

        const cancelButton =
            $("messageViewSettingsCancel");

        const saveButton =
            $("messageViewSettingsSave");

        /* فتح */

        if (openButton) {
            openButton.addEventListener(
                "click",
                openSettings
            );
        }

        /* إلغاء */

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                closeSettings
            );
        }

        /* حفظ */

        if (saveButton) {
            saveButton.addEventListener(
                "click",
                (event) => {
                    /*
                     * حماية إضافية إذا كان الزر
                     * داخل form مستقبلاً.
                     */

                    if (
                        event &&
                        typeof event.preventDefault ===
                            "function"
                    ) {
                        event.preventDefault();
                    }

                    saveCurrentSettings();
                }
            );
        }

        /* ======================================
           السلايدرات
           ====================================== */

        bindRange(
            "messageSizeRange"
        );

        bindRange(
            "ownColorIntensity"
        );

        bindRange(
            "ownColorTransparency"
        );

        bindRange(
            "ownBubbleRadius"
        );

        bindRange(
            "otherColorIntensity"
        );

        bindRange(
            "otherColorTransparency"
        );

        bindRange(
            "otherBubbleRadius"
        );

        /* ======================================
           شكل رسائلي
           ====================================== */

        const ownShape =
            $("ownBubbleShape");

        if (ownShape) {
            ownShape.addEventListener(
                "change",
                () => {
                    readDraftFromUI();
                }
            );
        }

        /* ======================================
           شكل الطرف الآخر
           ====================================== */

        const otherShape =
            $("otherBubbleShape");

        if (otherShape) {
            otherShape.addEventListener(
                "change",
                () => {
                    readDraftFromUI();
                }
            );
        }

        /* ======================================
           دعم input color القديم
           ====================================== */

        const otherColor =
            $("otherBubbleColor");

        if (otherColor) {
            otherColor.addEventListener(
                "input",
                () => {
                    readDraftFromUI();
                }
            );
        }

        /* ======================================
           الضغط خارج النافذة
           ====================================== */

        const modal =
            $("messageViewSettingsModal");

        if (modal) {
            modal.addEventListener(
                "click",
                (event) => {
                    if (
                        event.target ===
                        modal
                    ) {
                        closeSettings();
                    }
                }
            );
        }

        /* ======================================
           زر Escape
           ====================================== */

        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                const currentModal =
                    $("messageViewSettingsModal");

                if (
                    currentModal &&
                    currentModal.classList.contains(
                        "show"
                    )
                ) {
                    closeSettings();
                }
            }
        );
    }

    /* =========================================================
       Init
       ========================================================= */

    function init() {
        if (initialized) {
            return;
        }

        currentSettings =
            loadSettings();

        draftSettings = {
            ...currentSettings
        };

        /*
         * إنشاء شبكتي الألوان.
         */

        createColorButtons();

        /*
         * مزامنة الواجهة.
         */

        syncSettingsUI(
            currentSettings
        );

        /*
         * تطبيق الإعدادات على الرسائل.
         */

        applySettings(
            currentSettings
        );

        /*
         * تحديث المعاينة.
         */

        updatePreview(
            currentSettings
        );

        /*
         * ربط الأحداث.
         */

        bindEvents();

        initialized = true;

        console.log(
            "[WFESC] messages-settings.js جاهز بالإصدار الجديد."
        );
    }

    /* =========================================================
       Public API
       ========================================================= */

    window.WFESC_MESSAGE_SETTINGS = {
        init,

        open:
            openSettings,

        close:
            closeSettings,

        save:
            saveCurrentSettings,

        get() {
            return {
                ...currentSettings
            };
        },

        apply(
            settings
        ) {
            currentSettings =
                sanitizeSettings(
                    settings
                );

            draftSettings = {
                ...currentSettings
            };

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
        },

        reset() {
            currentSettings = {
                ...DEFAULT_SETTINGS
            };

            draftSettings = {
                ...DEFAULT_SETTINGS
            };

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
    };

    /* =========================================================
       التشغيل
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    } else {
        init();
    }

})();
