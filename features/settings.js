/* =========================================================
   WFESC SETTINGS
   الإعدادات العامة للموقع
   ========================================================= */

(() => {

    "use strict";

    /* =====================================================
       منع تحميل الملف أكثر من مرة
       ===================================================== */

    if (window.WFESC_SETTINGS_LOADED) {
        return;
    }

    window.WFESC_SETTINGS_LOADED = true;


    /* =====================================================
       المفاتيح
       ===================================================== */

    const STORAGE_THEME =
        "WFESC_THEME";

    const STORAGE_ANIMATION =
        "WFESC_ENHANCED_ANIMATION";


    /* =====================================================
       الحالة
       ===================================================== */

    let currentTheme =
        localStorage.getItem(STORAGE_THEME) || "dark";

    let enhancedAnimation =
        localStorage.getItem(STORAGE_ANIMATION) !== "false";


    /* =====================================================
       CSS
       ===================================================== */

    const style = document.createElement("style");

    style.id = "wfesc-settings-style";

    style.textContent = `

    /* =====================================================
       زر الإعدادات
       ===================================================== */

    #wfesc-settings-button{

        position:fixed;

        top:18px;
        left:18px;

        width:46px;
        height:46px;

        border-radius:14px;

        border:1px solid rgba(255,255,255,.12);

        background:rgba(15,15,15,.88);

        color:#fff;

        font-size:21px;

        display:flex;
        align-items:center;
        justify-content:center;

        cursor:pointer;

        z-index:99990;

        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);

        transition:
            transform .25s ease,
            background .25s ease,
            border-color .25s ease,
            box-shadow .25s ease;

    }


    #wfesc-settings-button:hover{

        transform:scale(1.05);

        background:#181818;

        border-color:rgba(255,255,255,.22);

    }


    /* =====================================================
       الخلفية
       ===================================================== */

    #wfesc-settings-overlay{

        position:fixed;

        inset:0;

        background:rgba(0,0,0,.58);

        opacity:0;

        visibility:hidden;

        transition:
            opacity .28s ease,
            visibility .28s ease;

        z-index:99998;

        backdrop-filter:blur(4px);
        -webkit-backdrop-filter:blur(4px);

    }


    #wfesc-settings-overlay.active{

        opacity:1;

        visibility:visible;

    }


    /* =====================================================
       لوحة الإعدادات
       ===================================================== */

    #wfesc-settings-panel{

        position:fixed;

        top:0;
        left:0;

        width:min(390px,92vw);
        height:100vh;

        background:#090909;

        color:#fff;

        border-right:1px solid #242424;

        z-index:99999;

        transform:translateX(-105%);

        transition:
            transform .38s cubic-bezier(.22,.61,.36,1);

        overflow-y:auto;

        box-shadow:10px 0 45px rgba(0,0,0,.35);

    }


    #wfesc-settings-panel.active{

        transform:translateX(0);

    }


    /* =====================================================
       رأس اللوحة
       ===================================================== */

    .wfesc-settings-header{

        position:sticky;

        top:0;

        z-index:5;

        display:flex;

        align-items:center;

        justify-content:space-between;

        padding:20px;

        background:rgba(9,9,9,.88);

        border-bottom:1px solid #202020;

        backdrop-filter:blur(15px);
        -webkit-backdrop-filter:blur(15px);

    }


    .wfesc-settings-title{

        font-size:21px;

        font-weight:800;

    }


    .wfesc-settings-close{

        width:40px;
        height:40px;

        border-radius:12px;

        border:1px solid #292929;

        background:#151515;

        color:#fff;

        font-size:20px;

        cursor:pointer;

        transition:
            background .2s ease,
            transform .2s ease;

    }


    .wfesc-settings-close:hover{

        background:#202020;

        transform:scale(1.04);

    }


    /* =====================================================
       محتوى اللوحة
       ===================================================== */

    .wfesc-settings-content{

        padding:15px;

    }


    .wfesc-settings-section-title{

        color:#666;

        font-size:12px;

        margin:15px 8px 8px;

    }


    /* =====================================================
       عناصر الإعدادات
       ===================================================== */

    .wfesc-setting-item{

        width:100%;

        display:flex;

        align-items:center;

        gap:13px;

        padding:14px;

        margin-bottom:9px;

        border:1px solid #202020;

        border-radius:16px;

        background:#101010;

        color:#fff;

        text-align:right;

        cursor:pointer;

        transition:
            background .25s ease,
            border-color .25s ease,
            transform .25s ease;

    }


    .wfesc-setting-item:hover{

        background:#161616;

        border-color:#303030;

        transform:translateX(3px);

    }


    .wfesc-setting-icon{

        width:43px;
        height:43px;

        flex-shrink:0;

        display:flex;
        align-items:center;
        justify-content:center;

        border-radius:13px;

        background:#181818;

        font-size:20px;

    }


    .wfesc-setting-content{

        flex:1;

        min-width:0;

    }


    .wfesc-setting-title{

        display:block;

        font-size:15px;

        font-weight:700;

        margin-bottom:2px;

    }


    .wfesc-setting-description{

        display:block;

        font-size:12px;

        color:#777;

    }


    .wfesc-setting-arrow{

        color:#666;

        font-size:22px;

    }


    /* =====================================================
       زر التبديل
       ===================================================== */

    .wfesc-switch{

        position:relative;

        width:45px;
        height:25px;

        flex-shrink:0;

        border-radius:30px;

        background:#292929;

        transition:background .25s ease;

    }


    .wfesc-switch::after{

        content:"";

        position:absolute;

        top:3px;
        left:3px;

        width:19px;
        height:19px;

        border-radius:50%;

        background:#888;

        transition:
            transform .25s ease,
            background .25s ease;

    }


    .wfesc-switch.active{

        background:#fff;

    }


    .wfesc-switch.active::after{

        transform:translateX(20px);

        background:#111;

    }


    /* =====================================================
       الوضع الفاتح
       ===================================================== */

    body.wfesc-light-mode{

        background:#fff !important;

        color:#111 !important;

    }


    body.wfesc-light-mode #wfesc-settings-button{

        background:rgba(255,255,255,.9);

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode #wfesc-settings-panel{

        background:#fff;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode .wfesc-settings-header{

        background:rgba(255,255,255,.9);

        border-color:#ddd;

    }


    body.wfesc-light-mode .wfesc-settings-close{

        background:#f3f3f3;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode .wfesc-setting-item{

        background:#f7f7f7;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode .wfesc-setting-item:hover{

        background:#eee;

        border-color:#ccc;

    }


    body.wfesc-light-mode .wfesc-setting-icon{

        background:#eaeaea;

    }


    body.wfesc-light-mode .wfesc-setting-description{

        color:#777;

    }


    body.wfesc-light-mode .wfesc-settings-section-title{

        color:#888;

    }


    body.wfesc-light-mode #wfesc-settings-overlay{

        background:rgba(0,0,0,.25);

    }


    /* =====================================================
       الأنيميشن المعزز
       ===================================================== */

    body.wfesc-enhanced-animation{

        scroll-behavior:smooth;

    }


    body.wfesc-enhanced-animation .wfesc-setting-item{

        transition:
            transform .32s cubic-bezier(.22,.61,.36,1),
            background .32s ease,
            border-color .32s ease;

    }


    /* =====================================================
       عند إيقاف الأنيميشن
       ===================================================== */

    body:not(.wfesc-enhanced-animation) #wfesc-settings-panel{

        transition:none;

    }


    body:not(.wfesc-enhanced-animation)
    #wfesc-settings-overlay{

        transition:none;

    }


    body:not(.wfesc-enhanced-animation)
    .wfesc-setting-item{

        transition:none;

    }


    /* =====================================================
       الهاتف
       ===================================================== */

    @media(max-width:600px){

        #wfesc-settings-button{

            top:13px;
            left:13px;

            width:44px;
            height:44px;

        }

        #wfesc-settings-panel{

            width:92vw;

        }

    }

    `;

    document.head.appendChild(style);


    /* =====================================================
       إنشاء زر الإعدادات
       ===================================================== */

    function createSettingsButton(){

        if (
            document.getElementById(
                "wfesc-settings-button"
            )
        ){
            return;
        }

        const button =
            document.createElement("button");

        button.id =
            "wfesc-settings-button";

        button.type =
            "button";

        button.setAttribute(
            "aria-label",
            "الإعدادات"
        );

        button.innerHTML =
            "⚙️";

        button.addEventListener(
            "click",
            openSettings
        );

        document.body.appendChild(button);

    }


    /* =====================================================
       إنشاء اللوحة
       ===================================================== */

    function createSettingsPanel(){

        if (
            document.getElementById(
                "wfesc-settings-panel"
            )
        ){
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "wfesc-settings-overlay";


        overlay.addEventListener(
            "click",
            closeSettings
        );


        const panel =
            document.createElement("aside");

        panel.id =
            "wfesc-settings-panel";


        panel.innerHTML = `

            <div class="wfesc-settings-header">

                <div class="wfesc-settings-title">
                    الإعدادات
                </div>

                <button
                    type="button"
                    class="wfesc-settings-close"
                    id="wfesc-settings-close"
                    aria-label="إغلاق"
                >
                    ×
                </button>

            </div>


            <div class="wfesc-settings-content">


                <div class="wfesc-settings-section-title">
                    الحساب والموقع
                </div>


                <!-- الحساب -->

                <button
                    type="button"
                    class="wfesc-setting-item"
                    id="wfesc-account-setting"
                >

                    <div class="wfesc-setting-icon">
                        👤
                    </div>

                    <div class="wfesc-setting-content">

                        <span class="wfesc-setting-title">
                            الحساب
                        </span>

                        <span
                            class="wfesc-setting-description"
                            id="wfesc-account-status"
                        >
                            تسجيل الدخول وإدارة الحساب
                        </span>

                    </div>

                    <div class="wfesc-setting-arrow">
                        ‹
                    </div>

                </button>


                <div class="wfesc-settings-section-title">
                    المظهر والتجربة
                </div>


                <!-- الوضع -->

                <button
                    type="button"
                    class="wfesc-setting-item"
                    id="wfesc-theme-setting"
                >

                    <div
                        class="wfesc-setting-icon"
                        id="wfesc-theme-icon"
                    >
                        🌙
                    </div>

                    <div class="wfesc-setting-content">

                        <span class="wfesc-setting-title">
                            الوضع
                        </span>

                        <span
                            class="wfesc-setting-description"
                            id="wfesc-theme-description"
                        >
                            الوضع الداكن
                        </span>

                    </div>

                    <div
                        class="wfesc-switch"
                        id="wfesc-theme-switch"
                    ></div>

                </button>


                <!-- الأنيميشن -->

                <button
                    type="button"
                    class="wfesc-setting-item"
                    id="wfesc-animation-setting"
                >

                    <div class="wfesc-setting-icon">
                        ✨
                    </div>

                    <div class="wfesc-setting-content">

                        <span class="wfesc-setting-title">
                            الأنيميشن المعزز
                        </span>

                        <span
                            class="wfesc-setting-description"
                            id="wfesc-animation-description"
                        >
                            انتقالات وحركات أكثر سلاسة
                        </span>

                    </div>

                    <div
                        class="wfesc-switch"
                        id="wfesc-animation-switch"
                    ></div>

                </button>


                <div class="wfesc-settings-section-title">
                    معلومات WFESC
                </div>


                <!-- تعرف أكثر عنا -->

                <button
                    type="button"
                    class="wfesc-setting-item"
                    id="wfesc-about-setting"
                >

                    <div class="wfesc-setting-icon">
                        ℹ️
                    </div>

                    <div class="wfesc-setting-content">

                        <span class="wfesc-setting-title">
                            تعرف أكثر عنا
                        </span>

                        <span class="wfesc-setting-description">
                            الخصوصية والسياسات والتطوير والتحديثات
                        </span>

                    </div>

                    <div class="wfesc-setting-arrow">
                        ‹
                    </div>

                </button>


            </div>
        `;


        document.body.appendChild(overlay);

        document.body.appendChild(panel);


        /* =================================================
           الأحداث
           ================================================= */

        document
            .getElementById(
                "wfesc-settings-close"
            )
            .addEventListener(
                "click",
                closeSettings
            );


        document
            .getElementById(
                "wfesc-theme-setting"
            )
            .addEventListener(
                "click",
                toggleTheme
            );


        document
            .getElementById(
                "wfesc-animation-setting"
            )
            .addEventListener(
                "click",
                toggleAnimation
            );


        document
            .getElementById(
                "wfesc-about-setting"
            )
            .addEventListener(
                "click",
                openAbout
            );


        document
            .getElementById(
                "wfesc-account-setting"
            )
            .addEventListener(
                "click",
                openAccount
            );


        updateUI();

    }


    /* =====================================================
       فتح الإعدادات
       ===================================================== */

    function openSettings(){

        createSettingsPanel();

        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );

        const overlay =
            document.getElementById(
                "wfesc-settings-overlay"
            );


        panel.classList.add("active");

        overlay.classList.add("active");

        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       إغلاق الإعدادات
       ===================================================== */

    function closeSettings(){

        const panel =
            document.getElementById(
                "wfesc-settings-panel"
            );

        const overlay =
            document.getElementById(
                "wfesc-settings-overlay"
            );


        if (!panel) {
            return;
        }


        panel.classList.remove("active");

        overlay.classList.remove("active");

        document.body.style.overflow = "";

    }


    /* =====================================================
       الوضع الداكن / الفاتح
       ===================================================== */

    function applyTheme(){

        if (currentTheme === "light"){

            document.body.classList.add(
                "wfesc-light-mode"
            );

        } else {

            document.body.classList.remove(
                "wfesc-light-mode"
            );

        }

    }


    function toggleTheme(){

        currentTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";


        localStorage.setItem(
            STORAGE_THEME,
            currentTheme
        );


        applyTheme();

        updateUI();


        window.dispatchEvent(
            new CustomEvent(
                "wfesc-theme-change",
                {
                    detail:{
                        theme:currentTheme
                    }
                }
            )
        );

    }


    /* =====================================================
       الأنيميشن
       ===================================================== */

    
    function applyAnimation(){

        if (enhancedAnimation){

            document.body.classList.add(
                "wfesc-enhanced-animation"
            );

        } else {

            document.body.classList.remove(
                "wfesc-enhanced-animation"
            );

        }

    }


    function toggleAnimation(){

        enhancedAnimation =
            !enhancedAnimation;


        localStorage.setItem(
            STORAGE_ANIMATION,
            String(enhancedAnimation)
        );


        applyAnimation();

        updateUI();


        window.dispatchEvent(
            new CustomEvent(
                "wfesc-animation-change",
                {
                    detail:{
                        enabled:enhancedAnimation
                    }
                }
            )
        );

    }


    /* =====================================================
       فتح صفحة تعرف أكثر عنا
       ===================================================== */

    function openAbout(){

        closeSettings();

        window.location.href =
            "privacy-wfesc.html";

    }


    /* =====================================================
       الحساب
       ===================================================== */

    function openAccount(){

        closeSettings();


        if (
            typeof window.WFESC_ACCOUNT_OPEN ===
            "function"
        ){

            window.WFESC_ACCOUNT_OPEN();

            return;

        }


        /*
         * إذا لم يكن account.js محملاً بعد،
         * نرسل حدثاً يمكن للنظام التقاطه.
         */

        window.dispatchEvent(
            new CustomEvent(
                "wfesc-open-account"
            )
        );

    }


    /* =====================================================
       تحديث واجهة الإعدادات
       ===================================================== */

    function updateUI(){

        const themeSwitch =
            document.getElementById(
                "wfesc-theme-switch"
            );

        const themeDescription =
            document.getElementById(
                "wfesc-theme-description"
            );

        const themeIcon =
            document.getElementById(
                "wfesc-theme-icon"
            );


        const animationSwitch =
            document.getElementById(
                "wfesc-animation-switch"
            );

        const animationDescription =
            document.getElementById(
                "wfesc-animation-description"
            );


        if (themeSwitch){

            themeSwitch.classList.toggle(
                "active",
                currentTheme === "light"
            );

        }


        if (themeDescription){

            themeDescription.textContent =
                currentTheme === "light"
                    ? "الوضع الفاتح"
                    : "الوضع الداكن";

        }


        if (themeIcon){

            themeIcon.textContent =
                currentTheme === "light"
                    ? "☀️"
                    : "🌙";

        }


        if (animationSwitch){

            animationSwitch.classList.toggle(
                "active",
                enhancedAnimation
            );

        }


        if (animationDescription){

            animationDescription.textContent =
                enhancedAnimation
                    ? "الأنيميشن المعزز مفعل"
                    : "الأنيميشن المعزز متوقف";

        }

    }


    /* =====================================================
       تحديث حالة الحساب
       ===================================================== */

    function updateAccountStatus(){

        const status =
            document.getElementById(
                "wfesc-account-status"
            );


        if (!status) {
            return;
        }


        if (
            window.WFESC_AUTH &&
            typeof window.WFESC_AUTH.getUser ===
            "function"
        ){

            const user =
                window.WFESC_AUTH.getUser();


            if (user){

                status.textContent =
                    user.email ||
                    "الحساب مسجل الدخول";

            } else {

                status.textContent =
                    "تسجيل الدخول وإدارة الحساب";

            }

            return;

        }


        status.textContent =
            "تسجيل الدخول وإدارة الحساب";

    }


    /* =====================================================
       تجهيز النظام
       ===================================================== */

    function initialize(){

        applyTheme();

        applyAnimation();

        createSettingsButton();

        createSettingsPanel();

        updateUI();

        updateAccountStatus();


        window.addEventListener(
            "wfesc-auth-state-change",
            updateAccountStatus
        );

    }


    /* =====================================================
       إتاحة الدوال للنظام
       ===================================================== */

    window.WFESC_SETTINGS_OPEN =
        openSettings;

    window.WFESC_SETTINGS_CLOSE =
        closeSettings;

    window.WFESC_SETTINGS_TOGGLE_THEME =
        toggleTheme;

    window.WFESC_SETTINGS_TOGGLE_ANIMATION =
        toggleAnimation;

    window.WFESC_SETTINGS_OPEN_ABOUT =
        openAbout;


    /* =====================================================
       التشغيل
       ===================================================== */

    if (
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

    } else {

        initialize();

    }


})();
