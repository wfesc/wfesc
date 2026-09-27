/* =========================================================
   WFESC Messages Settings
   File: messages-settings.js

   المسؤول فقط عن:
   - حجم نص الرسائل
   - لون رسائلي
   - شدة اللون
   - شفافية اللون
   - لون رسائل الطرف الآخر
   - شكل فقاعات الطرف الآخر
   - استدارة الفقاعات
   - المعاينة المباشرة
   - حفظ الإعدادات محلياً
   ========================================================= */

(() => {
    "use strict";

    const STORAGE_PREFIX = "wfesc_message_view_settings_";

    const DEFAULT_SETTINGS = {
        scale: 1,

        ownColor: "#36e27b",
        ownIntensity: 100,
        ownOpacity: 14,
        ownRadius: 18,

        otherColor: "#ffffff",
        otherIntensity: 100,
        otherOpacity: 7,
        otherRadius: 18,
        otherShape: "normal",

        glass: true,
        animations: true
    };

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
        return Math.min(max, Math.max(min, value));
    }

    function isValidHex(value) {
        return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
    }

    function normalizeHex(value, fallback) {
        return isValidHex(value) ? value.toLowerCase() : fallback;
    }

    function getCurrentUserId() {
        try {
            if (
                window.WFESC_MESSAGES &&
                typeof window.WFESC_MESSAGES.getCurrentUser === "function"
            ) {
                const user = window.WFESC_MESSAGES.getCurrentUser();

                if (user && user.id) {
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
        return STORAGE_PREFIX + getCurrentUserId();
    }

    /* =========================================================
       Color
       ========================================================= */

    function hexToRgb(hex) {
        const clean = String(hex || "").replace("#", "");

        if (clean.length !== 6) {
            return {
                r: 255,
                g: 255,
                b: 255
            };
        }

        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    }

    function rgbToString(rgb) {
        return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }

    function getIntensityColor(hex, intensity) {
        const rgb = hexToRgb(hex);

        const amount = clamp(Number(intensity) / 100, 0, 1);

        /*
         * شدة 100% = اللون الأصلي
         * شدة 0% = لون أقل تشبعاً
         */
        const gray =
            rgb.r * 0.299 +
            rgb.g * 0.587 +
            rgb.b * 0.114;

        return {
            r: Math.round(gray + (rgb.r - gray) * amount),
            g: Math.round(gray + (rgb.g - gray) * amount),
            b: Math.round(gray + (rgb.b - gray) * amount)
        };
    }

    function rgba(hex, opacity, intensity) {
        const color = getIntensityColor(hex, intensity);

        const alpha = clamp(
            Number(opacity) / 100,
            0,
            1
        );

        return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }

    /* =========================================================
       Shape
       ========================================================= */

    function getOtherRadius(settings) {
        const radius = clamp(
            Number(settings.otherRadius),
            4,
            40
        );

        switch (settings.otherShape) {
            case "pill":
                return "999px";

            case "soft":
                return `${Math.max(radius, 24)}px`;

            case "square":
                return "8px";

            default:
                return `${radius}px`;
        }
    }

    /* =========================================================
       Sanitize
       ========================================================= */

    function sanitizeSettings(input) {
        const data = input || {};

        return {
            scale: clamp(
                Number(data.scale) || 1,
                0.85,
                1.25
            ),

            ownColor: normalizeHex(
                data.ownColor,
                DEFAULT_SETTINGS.ownColor
            ),

            ownIntensity: clamp(
                Number(data.ownIntensity),
                0,
                100
            ),

            ownOpacity: clamp(
                Number(data.ownOpacity),
                0,
                100
            ),

            ownRadius: clamp(
                Number(data.ownRadius),
                4,
                40
            ),

            otherColor: normalizeHex(
                data.otherColor,
                DEFAULT_SETTINGS.otherColor
            ),

            otherIntensity: clamp(
                Number(data.otherIntensity),
                0,
                100
            ),

            otherOpacity: clamp(
                Number(data.otherOpacity),
                0,
                100
            ),

            otherRadius: clamp(
                Number(data.otherRadius),
                4,
                40
            ),

            otherShape:
                ["normal", "pill", "soft", "square"].includes(
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
            const raw = localStorage.getItem(
                getStorageKey()
            );

            if (!raw) {
                return {
                    ...DEFAULT_SETTINGS
                };
            }

            const parsed = JSON.parse(raw);

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

    function saveSettings(settings) {
        try {
            localStorage.setItem(
                getStorageKey(),
                JSON.stringify(settings)
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
        if (styleElement && document.head.contains(styleElement)) {
            return styleElement;
        }

        styleElement = document.createElement("style");

        styleElement.id =
            "wfesc-message-settings-style";

        document.head.appendChild(styleElement);

        return styleElement;
    }

    function applySettings(settings) {
        const safe = sanitizeSettings(settings);

        const ownColor = rgba(
            safe.ownColor,
            safe.ownOpacity,
            safe.ownIntensity
        );

        const ownBorder = rgba(
            safe.ownColor,
            Math.min(
                100,
                safe.ownOpacity + 12
            ),
            safe.ownIntensity
        );

        const otherColor = rgba(
            safe.otherColor,
            safe.otherOpacity,
            safe.otherIntensity
        );

        const otherBorder = rgba(
            safe.otherColor,
            Math.min(
                100,
                safe.otherOpacity + 10
            ),
            safe.otherIntensity
        );

        const otherRadius =
            getOtherRadius(safe);

        const animationRule =
            safe.animations
                ? ""
                : `
                    .message-bubble,
                    .conversation-item,
                    .send-button,
                    .icon-button,
                    .modal,
                    .modal-card {
                        transition: none !important;
                        animation: none !important;
                    }
                `;

        const glassRule =
            safe.glass
                ? ""
                : `
                    .message-bubble {
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                    }
                `;

        ensureStyleElement();

        styleElement.textContent = `
            /*
             * WFESC Message Settings
             * Generated dynamically
             */

            .message-row.mine .message-bubble {
                background: ${ownColor} !important;
                border-color: ${ownBorder} !important;
                border-radius: ${safe.ownRadius}px !important;
            }

            .message-row.theirs .message-bubble {
                background: ${otherColor} !important;
                border-color: ${otherBorder} !important;
                border-radius: ${otherRadius} !important;
            }

            .message-row.mine .message-bubble,
            .message-row.theirs .message-bubble {
                font-size: calc(
                    1em * ${safe.scale}
                ) !important;
            }

            .settings-preview .preview-message {
                transition:
                    background .2s ease,
                    border-color .2s ease,
                    border-radius .2s ease,
                    transform .2s ease;
            }

            ${animationRule}

            ${glassRule}
        `;

        document.documentElement.style.setProperty(
            "--message-text-scale",
            String(safe.scale)
        );

        currentSettings = {
            ...safe
        };
    }

    /* =========================================================
       Preset Colors
       ========================================================= */

    function createColorButtons() {
        const container = $("ownMessageColors");

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const wrapper = document.createElement("div");

        wrapper.style.display = "grid";
        wrapper.style.gridTemplateColumns =
            "repeat(10, minmax(0, 1fr))";
        wrapper.style.gap = "8px";
        wrapper.style.marginTop = "10px";

        PRESET_COLORS.forEach((color) => {
            const button =
                document.createElement("button");

            button.type = "button";

            button.dataset.color = color;

            button.title = color;

            button.setAttribute(
                "aria-label",
                `اختيار اللون ${color}`
            );

            button.style.width = "100%";
            button.style.aspectRatio = "1";
            button.style.minHeight = "30px";
            button.style.borderRadius = "50%";
            button.style.border =
                "2px solid transparent";
            button.style.background = color;
            button.style.cursor = "pointer";
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
                    button.style.transform =
                        "scale(1)";
                }
            );

            button.addEventListener(
                "click",
                () => {
                    draftSettings.ownColor =
                        color;

                    syncSettingsUI(
                        draftSettings
                    );

                    updatePreview(
                        draftSettings
                    );
                }
            );

            wrapper.appendChild(button);
        });

        container.appendChild(wrapper);
    }

    function updateColorSelection(color) {
        const container = $("ownMessageColors");

        if (!container) {
            return;
        }

        const buttons =
            container.querySelectorAll(
                "button[data-color]"
            );

        buttons.forEach((button) => {
            const selected =
                button.dataset.color.toLowerCase() ===
                String(color).toLowerCase();

            button.style.borderColor =
                selected
                    ? "#ffffff"
                    : "transparent";

            button.style.boxShadow =
                selected
                    ? "0 0 0 2px rgba(255,255,255,.18)"
                    : "0 0 0 1px rgba(255,255,255,.12)";

            button.style.transform =
                selected
                    ? "scale(1.08)"
                    : "scale(1)";
        });
    }

    /* =========================================================
       UI Sync
       ========================================================= */

    function syncSettingsUI(settings) {
        const sizeRange =
            $("messageSizeRange");

        const sizeValue =
            $("messageSizeValue");

        const ownIntensity =
            $("ownColorIntensity");

        const ownIntensityValue =
            $("ownColorIntensityValue");

        const ownTransparency =
            $("ownColorTransparency");

        const ownTransparencyValue =
            $("ownColorTransparencyValue");

        const otherShape =
            $("otherBubbleShape");

        const otherColor =
            $("otherBubbleColor");

        const otherIntensity =
            $("otherColorIntensity");

        const otherIntensityValue =
            $("otherColorIntensityValue");

        const otherTransparency =
            $("otherColorTransparency");

        const otherTransparencyValue =
            $("otherColorTransparencyValue");

        const bubbleRadius =
            $("bubbleRadius");

        const bubbleRadiusValue =
            $("bubbleRadiusValue");

        if (sizeRange) {
            sizeRange.value =
                Math.round(
                    settings.scale * 100
                );
        }

        if (sizeValue) {
            sizeValue.textContent =
                `${Math.round(
                    settings.scale * 100
                )}%`;
        }

        if (ownIntensity) {
            ownIntensity.value =
                settings.ownIntensity;
        }

        if (ownIntensityValue) {
            ownIntensityValue.textContent =
                `${settings.ownIntensity}%`;
        }

        if (ownTransparency) {
            ownTransparency.value =
                settings.ownOpacity;
        }

        if (ownTransparencyValue) {
            ownTransparencyValue.textContent =
                `${settings.ownOpacity}%`;
        }

        if (otherShape) {
            otherShape.value =
                settings.otherShape;
        }

        if (otherColor) {
            otherColor.value =
                settings.otherColor;
        }

        if (otherIntensity) {
            otherIntensity.value =
                settings.otherIntensity;
        }

        if (otherIntensityValue) {
            otherIntensityValue.textContent =
                `${settings.otherIntensity}%`;
        }

        if (otherTransparency) {
            otherTransparency.value =
                settings.otherOpacity;
        }

        if (otherTransparencyValue) {
            otherTransparencyValue.textContent =
                `${settings.otherOpacity}%`;
        }

        if (bubbleRadius) {
            bubbleRadius.value =
                settings.otherRadius;
        }

        if (bubbleRadiusValue) {
            bubbleRadiusValue.textContent =
                `${settings.otherRadius}px`;
        }

        updateColorSelection(
            settings.ownColor
        );
    }

    /* =========================================================
       Live Preview
       ========================================================= */

    function updatePreview(settings) {
        const preview =
            document.querySelector(
                ".settings-preview"
            );

        if (!preview) {
            return;
        }

        let messages =
            preview.querySelector(
                ".wfesc-settings-preview-messages"
            );

        if (!messages) {
            messages =
                document.createElement("div");

            messages.className =
                "wfesc-settings-preview-messages";

            messages.style.display =
                "flex";

            messages.style.flexDirection =
                "column";

            messages.style.gap =
                "10px";

            messages.style.marginTop =
                "12px";

            preview.appendChild(messages);
        }

        messages.innerHTML = "";

        const own =
            document.createElement("div");

        own.textContent =
            "هذه معاينة لرسائلي";

        own.style.alignSelf =
            "flex-start";

        own.style.maxWidth =
            "82%";

        own.style.padding =
            "10px 14px";

        own.style.color =
            "#fff";

        own.style.background =
            rgba(
                settings.ownColor,
                settings.ownOpacity,
                settings.ownIntensity
            );

        own.style.border =
            `1px solid ${rgba(
                settings.ownColor,
                Math.min(
                    100,
                    settings.ownOpacity + 12
                ),
                settings.ownIntensity
            )}`;

        own.style.borderRadius =
            `${settings.ownRadius}px`;

        own.style.fontSize =
            `calc(14px * ${settings.scale})`;

        own.style.transition =
            "all .2s ease";

        const other =
            document.createElement("div");

        other.textContent =
            "هذه معاينة لرسالة الطرف الآخر";

        other.style.alignSelf =
            "flex-end";

        other.style.maxWidth =
            "82%";

        other.style.padding =
            "10px 14px";

        other.style.color =
            "#fff";

        other.style.background =
            rgba(
                settings.otherColor,
                settings.otherOpacity,
                settings.otherIntensity
            );

        other.style.border =
            `1px solid ${rgba(
                settings.otherColor,
                Math.min(
                    100,
                    settings.otherOpacity + 10
                ),
                settings.otherIntensity
            )}`;

        other.style.borderRadius =
            getOtherRadius(settings);

        other.style.fontSize =
            `calc(14px * ${settings.scale})`;

        other.style.transition =
            "all .2s ease";

        messages.appendChild(own);
        messages.appendChild(other);
    }

    /* =========================================================
       Read Draft From UI
       ========================================================= */

    function readDraftFromUI() {
        const sizeRange =
            $("messageSizeRange");

        const ownIntensity =
            $("ownColorIntensity");

        const ownTransparency =
            $("ownColorTransparency");

        const otherShape =
            $("otherBubbleShape");

        const otherColor =
            $("otherBubbleColor");

        const otherIntensity =
            $("otherColorIntensity");

        const otherTransparency =
            $("otherColorTransparency");

        const bubbleRadius =
            $("bubbleRadius");

        if (sizeRange) {
            draftSettings.scale =
                clamp(
                    Number(sizeRange.value) / 100,
                    0.85,
                    1.25
                );
        }

        if (ownIntensity) {
            draftSettings.ownIntensity =
                clamp(
                    Number(ownIntensity.value),
                    0,
                    100
                );
        }

        if (ownTransparency) {
            draftSettings.ownOpacity =
                clamp(
                    Number(
                        ownTransparency.value
                    ),
                    0,
                    100
                );
        }

        if (otherShape) {
            draftSettings.otherShape =
                otherShape.value;
        }

        if (otherColor) {
            draftSettings.otherColor =
                normalizeHex(
                    otherColor.value,
                    DEFAULT_SETTINGS.otherColor
                );
        }

        if (otherIntensity) {
            draftSettings.otherIntensity =
                clamp(
                    Number(
                        otherIntensity.value
                    ),
                    0,
                    100
                );
        }

        if (otherTransparency) {
            draftSettings.otherOpacity =
                clamp(
                    Number(
                        otherTransparency.value
                    ),
                    0,
                    100
                );
        }

        if (bubbleRadius) {
            draftSettings.otherRadius =
                clamp(
                    Number(
                        bubbleRadius.value
                    ),
                    4,
                    40
                );
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

    /* =========================================================
       Modal
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

        /*
         * نقرأ الإعدادات الحالية كل مرة
         * حتى لا تظهر قيم قديمة.
         */
        currentSettings =
            loadSettings();

        draftSettings = {
            ...currentSettings
        };

        syncSettingsUI(
            draftSettings
        );

        updatePreview(
            draftSettings
        );

        modal.classList.add("show");

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeSettings() {
        const modal =
            $("messageViewSettingsModal");

        if (!modal) {
            return;
        }

        modal.classList.remove("show");

        document.body.classList.remove(
            "modal-open"
        );

        /*
         * إلغاء = رجوع للقيم المحفوظة.
         */
        draftSettings = {
            ...currentSettings
        };

        syncSettingsUI(
            draftSettings
        );

        updatePreview(
            draftSettings
        );
    }

    /* =========================================================
       Success Overlay
       ========================================================= */

    function showSuccessOverlay() {
        const overlay =
            $("settingsSuccessOverlay");

        if (!overlay) {
            return;
        }

        overlay.classList.add("show");

        window.setTimeout(() => {
            overlay.classList.remove(
                "show"
            );
        }, 1600);
    }

    /* =========================================================
       Save
       ========================================================= */

    function saveCurrentSettings() {
        /*
         * نحفظ مكان التمرير حتى لا يتغير
         * مكان المستخدم داخل المحادثة.
         */
        const chatMessages =
            $("chatMessages");

        const previousScrollTop =
            chatMessages
                ? chatMessages.scrollTop
                : 0;

        const chatView =
            $("chatView");

        const chatWasOpen =
            !!(
                chatView &&
                chatView.classList.contains(
                    "open"
                )
            );

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

        closeSettings();

        showSuccessOverlay();

        /*
         * إعادة مكان المحادثة كما كان.
         */
        requestAnimationFrame(() => {
            if (
                chatWasOpen &&
                chatMessages
            ) {
                chatMessages.scrollTop =
                    previousScrollTop;
            }
        });
    }

    /* =========================================================
       Events
       ========================================================= */

    function bindRange(id) {
        const element = $(id);

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

    function bindEvents() {
        const openButton =
            $("messageViewSettingsButton");

        const cancelButton =
            $("messageViewSettingsCancel");

        const saveButton =
            $("messageViewSettingsSave");

        if (openButton) {
            openButton.addEventListener(
                "click",
                openSettings
            );
        }

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                closeSettings
            );
        }

        if (saveButton) {
            saveButton.addEventListener(
                "click",
                saveCurrentSettings
            );
        }

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
            "otherColorIntensity"
        );

        bindRange(
            "otherColorTransparency"
        );

        bindRange(
            "bubbleRadius"
        );

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

        const modal =
            $("messageViewSettingsModal");

        if (modal) {
            modal.addEventListener(
                "click",
                (event) => {
                    if (
                        event.target === modal
                    ) {
                        closeSettings();
                    }
                }
            );
        }

        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Escape"
                ) {
                    const modal =
                        $("messageViewSettingsModal");

                    if (
                        modal &&
                        modal.classList.contains(
                            "show"
                        )
                    ) {
                        closeSettings();
                    }
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

        createColorButtons();

        syncSettingsUI(
            currentSettings
        );

        updatePreview(
            currentSettings
        );

        applySettings(
            currentSettings
        );

        bindEvents();

        initialized = true;

        console.log(
            "[WFESC] messages-settings.js جاهز."
        );
    }

    /* =========================================================
       Public API
       ========================================================= */

    window.WFESC_MESSAGE_SETTINGS = {
        init,

        open: openSettings,

        close: closeSettings,

        save: saveCurrentSettings,

        get() {
            return {
                ...currentSettings
            };
        },

        apply(settings) {
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
       Start
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
