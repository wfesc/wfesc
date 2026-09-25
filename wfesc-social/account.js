/* =========================================================
   WFESC ACCOUNT SYSTEM
   واجهة الحساب
   ========================================================= */

(() => {

    "use strict";

    /* منع التكرار */
    if (window.WFESC_ACCOUNT_LOADED) {
        return;
    }

    window.WFESC_ACCOUNT_LOADED = true;


    /* =====================================================
       إنشاء CSS
       ===================================================== */

    const style = document.createElement("style");

    style.id = "wfesc-account-style";

    style.textContent = `

    /* ===============================
       خلفية النافذة
    =============================== */

    #wfesc-account-overlay{

        position:fixed;

        inset:0;

        display:flex;

        align-items:center;

        justify-content:center;

        padding:18px;

        background:rgba(0,0,0,.68);

        opacity:0;

        visibility:hidden;

        pointer-events:none;

        z-index:100000;

        transition:
            opacity .25s ease,
            visibility .25s ease;

        backdrop-filter:blur(7px);
        -webkit-backdrop-filter:blur(7px);

    }


    #wfesc-account-overlay.active{

        opacity:1;

        visibility:visible;

        pointer-events:auto;

    }


    /* ===============================
       النافذة
    =============================== */

    #wfesc-account-modal{

        width:min(420px,100%);

        max-height:90vh;

        overflow-y:auto;

        background:#0d0d0d;

        color:#fff;

        border:1px solid #292929;

        border-radius:22px;

        padding:22px;

        box-shadow:
            0 25px 80px rgba(0,0,0,.55);

        transform:
            translateY(15px)
            scale(.97);

        opacity:0;

        transition:
            transform .3s ease,
            opacity .3s ease;

    }


    #wfesc-account-overlay.active
    #wfesc-account-modal{

        transform:
            translateY(0)
            scale(1);

        opacity:1;

    }


    /* ===============================
       الرأس
    =============================== */

    .wfesc-account-header{

        display:flex;

        align-items:center;

        justify-content:space-between;

        margin-bottom:22px;

    }


    .wfesc-account-title{

        font-size:21px;

        font-weight:800;

    }


    .wfesc-account-close{

        width:38px;

        height:38px;

        border-radius:11px;

        border:1px solid #292929;

        background:#181818;

        color:#fff;

        font-size:20px;

        cursor:pointer;

    }


    /* ===============================
       العنوان
    =============================== */

    .wfesc-account-intro{

        text-align:center;

        margin-bottom:20px;

    }


    .wfesc-account-icon{

        width:65px;

        height:65px;

        margin:0 auto 12px;

        display:flex;

        align-items:center;

        justify-content:center;

        border-radius:50%;

        background:#181818;

        border:1px solid #292929;

        font-size:28px;

    }


    .wfesc-account-intro h2{

        font-size:20px;

        margin-bottom:5px;

    }


    .wfesc-account-intro p{

        color:#777;

        font-size:13px;

    }


    /* ===============================
       الحقول
    =============================== */

    .wfesc-account-field{

        margin-bottom:13px;

    }


    .wfesc-account-field label{

        display:block;

        margin-bottom:6px;

        color:#aaa;

        font-size:13px;

    }


    .wfesc-account-field input{

        width:100%;

        height:48px;

        padding:0 14px;

        border-radius:13px;

        border:1px solid #292929;

        outline:none;

        background:#151515;

        color:#fff;

        font-size:14px;

    }


    .wfesc-account-field input:focus{

        border-color:#555;

    }


    /* ===============================
       الأزرار
    =============================== */

    .wfesc-account-button{

        width:100%;

        min-height:47px;

        border-radius:13px;

        border:1px solid #292929;

        background:#181818;

        color:#fff;

        font-size:14px;

        font-weight:700;

        cursor:pointer;

        margin-top:8px;

        transition:
            background .2s ease,
            transform .2s ease;

    }


    .wfesc-account-button:hover{

        background:#222;

        transform:translateY(-1px);

    }


    .wfesc-account-button.primary{

        background:#fff;

        color:#080808;

        border-color:#fff;

    }


    .wfesc-account-button.primary:hover{

        background:#e8e8e8;

    }


    .wfesc-account-button.danger{

        color:#ff8d8d;

        border-color:#442020;

        background:#160d0d;

    }


    /* ===============================
       الروابط
    =============================== */

    .wfesc-account-links{

        display:flex;

        justify-content:center;

        gap:15px;

        margin-top:15px;

        flex-wrap:wrap;

    }


    .wfesc-account-link{

        background:none;

        border:0;

        color:#999;

        cursor:pointer;

        font-size:12px;

    }


    .wfesc-account-link:hover{

        color:#fff;

    }


    /* ===============================
       الرسائل
    =============================== */

    .wfesc-account-message{

        display:none;

        margin-top:13px;

        padding:11px;

        border-radius:11px;

        background:#151515;

        border:1px solid #292929;

        color:#aaa;

        font-size:12px;

        text-align:center;

    }


    .wfesc-account-message.active{

        display:block;

    }


    /* ===============================
       الحساب المسجل
    =============================== */

    .wfesc-account-user{

        display:none;

        text-align:center;

    }


    .wfesc-account-user.active{

        display:block;

    }


    .wfesc-account-user-email{

        color:#aaa;

        font-size:13px;

        margin:8px 0 20px;

        word-break:break-word;

    }


    /* ===============================
       الصفحات
    =============================== */

    .wfesc-account-page{

        display:none;

    }


    .wfesc-account-page.active{

        display:block;

    }


    /* ===============================
       Light Mode
    =============================== */

    body.wfesc-light-mode
    #wfesc-account-overlay{

        background:rgba(0,0,0,.3);

    }


    body.wfesc-light-mode
    #wfesc-account-modal{

        background:#fff;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode
    .wfesc-account-close{

        background:#f2f2f2;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode
    .wfesc-account-field label{

        color:#555;

    }


    body.wfesc-light-mode
    .wfesc-account-field input{

        background:#f7f7f7;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode
    .wfesc-account-button{

        background:#f4f4f4;

        color:#111;

        border-color:#ddd;

    }


    body.wfesc-light-mode
    .wfesc-account-button.primary{

        background:#111;

        color:#fff;

        border-color:#111;

    }


    body.wfesc-light-mode
    .wfesc-account-icon{

        background:#f3f3f3;

        border-color:#ddd;

    }


    body.wfesc-light-mode
    .wfesc-account-link{

        color:#666;

    }


    body.wfesc-light-mode
    .wfesc-account-message{

        background:#f5f5f5;

        border-color:#ddd;

        color:#555;

    }


    /* ===============================
       الهاتف
    =============================== */

    @media(max-width:500px){

        #wfesc-account-modal{

            padding:18px;

            border-radius:19px;

        }

    }

    `;

    document.head.appendChild(style);


    /* =====================================================
       إنشاء النافذة
       ===================================================== */

    function createAccountModal(){

        if (
            document.getElementById(
                "wfesc-account-overlay"
            )
        ){
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "wfesc-account-overlay";


        overlay.innerHTML = `

            <div
                id="wfesc-account-modal"
                role="dialog"
                aria-modal="true"
                aria-label="الحساب"
            >

                <div class="wfesc-account-header">

                    <div class="wfesc-account-title">
                        الحساب
                    </div>

                    <button
                        type="button"
                        class="wfesc-account-close"
                        id="wfesc-account-close"
                    >
                        ×
                    </button>

                </div>


                <!-- =========================
                     LOGIN
                ========================== -->

                <div
                    class="wfesc-account-page active"
                    id="wfesc-account-login-page"
                >

                    <div class="wfesc-account-intro">

                        <div class="wfesc-account-icon">
                            👤
                        </div>

                        <h2>
                            تسجيل الدخول
                        </h2>

                        <p>
                            سجّل الدخول إلى حساب WFESC
                        </p>

                    </div>


                    <div class="wfesc-account-field">

                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            id="wfesc-login-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                        >

                    </div>


                    <div class="wfesc-account-field">

                        <label>
                            كلمة المرور
                        </label>

                        <input
                            id="wfesc-login-password"
                            type="password"
                            autocomplete="current-password"
                            placeholder="كلمة المرور"
                        >

                    </div>


                    <button
                        type="button"
                        class="wfesc-account-button primary"
                        id="wfesc-login-button"
                    >
                        تسجيل الدخول
                    </button>


                    <div
                        class="wfesc-account-message"
                        id="wfesc-account-message"
                    ></div>


                    <div class="wfesc-account-links">

                        <button
                            type="button"
                            class="wfesc-account-link"
                            id="wfesc-forgot-button"
                        >
                            نسيت كلمة المرور؟
                        </button>

                        <button
                            type="button"
                            class="wfesc-account-link"
                            id="wfesc-register-link"
                        >
                            إنشاء حساب
                        </button>

                    </div>

                </div>


                <!-- =========================
                     REGISTER
                ========================== -->

                <div
                    class="wfesc-account-page"
                    id="wfesc-account-register-page"
                >

                    <div class="wfesc-account-intro">

                        <div class="wfesc-account-icon">
                            ✨
                        </div>

                        <h2>
                            إنشاء حساب
                        </h2>

                        <p>
                            أنشئ حسابك في WFESC
                        </p>

                    </div>


                    <div class="wfesc-account-field">

                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            id="wfesc-register-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                        >

                    </div>


                    <div class="wfesc-account-field">

                        <label>
                            كلمة المرور
                        </label>

                        <input
                            id="wfesc-register-password"
                            type="password"
                            autocomplete="new-password"
                            placeholder="كلمة المرور"
                        >

                    </div>


                    <button
                        type="button"
                        class="wfesc-account-button primary"
                        id="wfesc-register-button"
                    >
                        إنشاء الحساب
                    </button>


                    <div
                        class="wfesc-account-message"
                        id="wfesc-register-message"
                    ></div>


                    <div class="wfesc-account-links">

                        <button
                            type="button"
                            class="wfesc-account-link"
                            id="wfesc-login-link"
                        >
                            لدي حساب بالفعل
                        </button>

                    </div>

                </div>


                <!-- =========================
                     RESET PASSWORD
                ========================== -->

                <div
                    class="wfesc-account-page"
                    id="wfesc-account-reset-page"
                >

                    <div class="wfesc-account-intro">

                        <div class="wfesc-account-icon">
                            🔐
                        </div>

                        <h2>
                            استعادة الحساب
                        </h2>

                        <p>
                            أرسل رابط إعادة تعيين كلمة المرور
                        </p>

                    </div>


                    <div class="wfesc-account-field">

                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            id="wfesc-reset-email"
                            type="email"
                            autocomplete="email"
                            placeholder="example@email.com"
                        >

                    </div>


                    <button
                        type="button"
                        class="wfesc-account-button primary"
                        id="wfesc-reset-button"
                    >
                        إرسال رابط الاستعادة
                    </button>


                    <div
                        class="wfesc-account-message"
                        id="wfesc-reset-message"
                    ></div>


                    <div class="wfesc-account-links">

                        <button
                            type="button"
                            class="wfesc-account-link"
                            id="wfesc-reset-login-link"
                        >
                            العودة لتسجيل الدخول
                        </button>

                    </div>

                </div>


                <!-- =========================
                     LOGGED USER
                ========================== -->

                <div
                    class="wfesc-account-user"
                    id="wfesc-account-user"
                >

                    <div class="wfesc-account-intro">

                        <div class="wfesc-account-icon">
                            👤
                        </div>

                        <h2>
                            أهلاً بك
                        </h2>

                        <div
                            class="wfesc-account-user-email"
                            id="wfesc-user-email"
                        ></div>

                    </div>


                    <button
                        type="button"
                        class="wfesc-account-button"
                        id="wfesc-profile-button"
                    >
                        الملف الشخصي
                    </button>


                    <button
                        type="button"
                        class="wfesc-account-button danger"
                        id="wfesc-logout-button"
                    >
                        تسجيل الخروج
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(overlay);


        /* إغلاق عند الضغط خارج النافذة */

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ){

                    closeAccount();

                }

            }
        );


        /* زر الإغلاق */

        document
            .getElementById(
                "wfesc-account-close"
            )
            .addEventListener(
                "click",
                closeAccount
            );


        /* تسجيل الدخول */

        document
            .getElementById(
                "wfesc-login-button"
            )
            .addEventListener(
                "click",
                login
            );


        /* إنشاء حساب */

        document
            .getElementById(
                "wfesc-register-button"
            )
            .addEventListener(
                "click",
                register
            );


        /* نسيت كلمة المرور */

        document
            .getElementById(
                "wfesc-forgot-button"
            )
            .addEventListener(
                "click",
                () => showPage("reset")
            );


        /* الانتقال للتسجيل */

        document
            .getElementById(
                "wfesc-register-link"
            )
            .addEventListener(
                "click",
                () => showPage("register")
            );


        /* العودة للدخول */

        document
            .getElementById(
                "wfesc-login-link"
            )
            .addEventListener(
                "click",
                () => showPage("login")
            );


        document
            .getElementById(
                "wfesc-reset-login-link"
            )
            .addEventListener(
                "click",
                () => showPage("login")
            );


        /* الاستعادة */

        document
            .getElementById(
                "wfesc-reset-button"
            )
            .addEventListener(
                "click",
                resetPassword
            );


        /* تسجيل الخروج */

        document
            .getElementById(
                "wfesc-logout-button"
            )
            .addEventListener(
                "click",
                logout
            );


        /* الملف الشخصي */

        document
            .getElementById(
                "wfesc-profile-button"
            )
            .addEventListener(
                "click",
                () => {

                    closeAccount();

                    if (
                        typeof window.WFESC_PROFILE_OPEN ===
                        "function"
                    ){

                        window.WFESC_PROFILE_OPEN();

                    }

                }
            );


        updateAccount();

    }


    /* =====================================================
       الصفحات
       ===================================================== */

    function showPage(page){

        const pages = {

            login:
                "wfesc-account-login-page",

            register:
                "wfesc-account-register-page",

            reset:
                "wfesc-account-reset-page"

        };


        Object.values(pages).forEach(
            id => {

                const element =
                    document.getElementById(id);

                if (element){

                    element.classList.remove(
                        "active"
                    );

                }

            }
        );


        const target =
            document.getElementById(
                pages[page]
            );


        if (target){

            target.classList.add(
                "active"
            );

        }


        const user =
            document.getElementById(
                "wfesc-account-user"
            );


        if (user){

            user.classList.remove(
                "active"
            );

        }

    }


    /* =====================================================
       فتح الحساب
       ===================================================== */

    function openAccount(){

        createAccountModal();

        updateAccount();


        const overlay =
            document.getElementById(
                "wfesc-account-overlay"
            );


        overlay.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       إغلاق الحساب
       ===================================================== */

    function closeAccount(){

        const overlay =
            document.getElementById(
                "wfesc-account-overlay"
            );


        if (!overlay){
            return;
        }


        overlay.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       AUTH
       ===================================================== */

    function getAuth(){

        return window.WFESC_AUTH || null;

    }


    /* =====================================================
       تسجيل الدخول
       ===================================================== */

    async function login(){

        const auth =
            getAuth();


        if (
            !auth ||
            typeof auth.login !==
            "function"
        ){

            showMessage(
                "wfesc-account-message",
                "نظام تسجيل الدخول غير مربوط حالياً."
            );

            return;

        }


        const email =
            document
                .getElementById(
                    "wfesc-login-email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "wfesc-login-password"
                )
                .value;


        if (!email || !password){

            showMessage(
                "wfesc-account-message",
                "أدخل البريد الإلكتروني وكلمة المرور."
            );

            return;

        }


        try{

            const result =
                await auth.login(
                    email,
                    password
                );


            if (
                result &&
                result.error
            ){

                showMessage(
                    "wfesc-account-message",
                    result.error.message ||
                    "تعذر تسجيل الدخول."
                );

                return;

            }


            clearMessage(
                "wfesc-account-message"
            );


            updateAccount();

        }catch(error){

            showMessage(
                "wfesc-account-message",
                error.message ||
                "حدث خطأ أثناء تسجيل الدخول."
            );

        }

    }


    /* =====================================================
       إنشاء الحساب
       ===================================================== */

    async function register(){

        const auth =
            getAuth();


        if (
            !auth ||
            typeof auth.register !==
            "function"
        ){

            showMessage(
                "wfesc-register-message",
                "نظام التسجيل غير مربوط حالياً."
            );

            return;

        }


        const email =
            document
                .getElementById(
                    "wfesc-register-email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "wfesc-register-password"
                )
                .value;


        if (!email || !password){

            showMessage(
                "wfesc-register-message",
                "أدخل البريد الإلكتروني وكلمة المرور."
            );

            return;

        }


        try{

            const result =
                await auth.register(
                    email,
                    password
                );


            if (
                result &&
                result.error
            ){

                showMessage(
                    "wfesc-register-message",
                    result.error.message ||
                    "تعذر إنشاء الحساب."
                );

                return;

            }


            showMessage(
                "wfesc-register-message",
                "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا طُلب منك ذلك."
            );


        }catch(error){

            showMessage(
                "wfesc-register-message",
                error.message ||
                "حدث خطأ أثناء إنشاء الحساب."
            );

        }

    }


    /* =====================================================
       إعادة كلمة المرور
       ===================================================== */

    async function resetPassword(){

        const auth =
            getAuth();


        if (
            !auth ||
            typeof auth.resetPassword !==
            "function"
        ){

            showMessage(
                "wfesc-reset-message",
                "نظام استعادة الحساب غير مربوط حالياً."
            );

            return;

        }


        const email =
            document
                .getElementById(
                    "wfesc-reset-email"
                )
                .value
                .trim();


        if (!email){

            showMessage(
                "wfesc-reset-message",
                "أدخل البريد الإلكتروني."
            );

            return;

        }


        try{

            const result =
                await auth.resetPassword(
                    email
                );


            if (
                result &&
                result.error
            ){

                showMessage(
                    "wfesc-reset-message",
                    result.error.message ||
                    "تعذر إرسال رابط الاستعادة."
                );

                return;

            }


            showMessage(
                "wfesc-reset-message",
                "تم إرسال رابط استعادة كلمة المرور إذا كان البريد مسجلاً."
            );


        }catch(error){

            showMessage(
                "wfesc-reset-message",
                error.message ||
                "حدث خطأ."
            );

        }

    }


    /* =====================================================
       تسجيل الخروج
       ===================================================== */

    async function logout(){

        const auth =
            getAuth();


        if (
            !auth ||
            typeof auth.logout !==
            "function"
        ){

            updateAccount();

            return;

        }


        try{

            await auth.logout();

            updateAccount();

        }catch(error){

            console.error(
                "[WFESC ACCOUNT] Logout error:",
                error
            );

        }

    }


    /* =====================================================
       تحديث حالة الحساب
       ===================================================== */

    function updateAccount(){

        const auth =
            getAuth();


        let user =
            null;


        if (
            auth &&
            typeof auth.getUser ===
            "function"
        ){

            try{

                user =
                    auth.getUser();

            }catch(error){

                console.warn(
                    "[WFESC ACCOUNT]",
                    error
                );

            }

        }


        const loginPage =
            document.getElementById(
                "wfesc-account-login-page"
            );


        const registerPage =
            document.getElementById(
                "wfesc-account-register-page"
            );


        const resetPage =
            document.getElementById(
                "wfesc-account-reset-page"
            );


        const userPage =
            document.getElementById(
                "wfesc-account-user"
            );


        const userEmail =
            document.getElementById(
                "wfesc-user-email"
            );


        if (user){

            if (loginPage)
                loginPage.classList.remove("active");

            if (registerPage)
                registerPage.classList.remove("active");

            if (resetPage)
                resetPage.classList.remove("active");

            if (userPage)
                userPage.classList.add("active");


            if (userEmail){

                userEmail.textContent =
                    user.email ||
                    "حساب WFESC";

            }

        }else{

            if (userPage)
                userPage.classList.remove("active");

            if (loginPage)
                loginPage.classList.add("active");

        }

    }


    /* =====================================================
       الرسائل
       ===================================================== */

    function showMessage(
        id,
        message
    ){

        const element =
            document.getElementById(id);


        if (!element){
            return;
        }


        element.textContent =
            message;


        element.classList.add(
            "active"
        );

    }


    function clearMessage(id){

        const element =
            document.getElementById(id);


        if (!element){
            return;
        }


        element.textContent =
            "";


        element.classList.remove(
            "active"
        );

    }


    /* =====================================================
       أحداث لوحة الإعدادات
       ===================================================== */

    window.addEventListener(
        "wfesc-open-account",
        openAccount
    );


    window.addEventListener(
        "wfesc-auth-state-change",
        updateAccount
    );


    /* =====================================================
       الدوال العامة
       ===================================================== */

    window.WFESC_ACCOUNT_OPEN =
        openAccount;

    window.WFESC_ACCOUNT_CLOSE =
        closeAccount;

    window.WFESC_ACCOUNT_UPDATE =
        updateAccount;


    /* =====================================================
       التشغيل
       ===================================================== */

    function initialize(){

        createAccountModal();

        updateAccount();

    }


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

    }else{

        initialize();

    }


    console.log(
        "[WFESC ACCOUNT] Account module loaded."
    );

})();
