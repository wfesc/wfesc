<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>اوفِس | اوفس | WFESC</title>

    <meta name="description" content="اوفِس | اوفس | WFESC — منصة تهتم بتاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره.">
    <meta name="keywords" content="اوفِس, اوفس, WFESC, WFEESC, العراق, تاريخ العراق, إنجازات العراق, مشاريع العراق, نوادر العراق">
    <meta name="author" content="WFESC">

    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">

    <link rel="canonical" href="https://wfesc.github.io/wfesc/">

    <meta property="og:title" content="اوفِس | WFESC">
    <meta property="og:description" content="ذاكرة العراق بصورة مختلفة — تاريخ، إنجازات، مشاريع، ممتلكات ونوادر.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://wfesc.github.io/wfesc/">

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "اوفِس | WFESC",
        "alternateName": [
            "اوفِس",
            "اوفس",
            "WFESC"
        ],
        "url": "https://wfesc.github.io/wfesc/",
        "description": "منصة تهتم بتاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره."
    }
    </script>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: Arial, Tahoma, sans-serif;
            background: #070707;
            color: #f5f5f5;
            line-height: 1.8;
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        nav {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(7, 7, 7, 0.94);
            backdrop-filter: blur(15px);
            border-bottom: 1px solid #222;
        }

        .nav-container {
            max-width: 1150px;
            margin: auto;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }

        .logo {
            font-size: 23px;
            font-weight: bold;
            white-space: nowrap;
        }

        .logo span {
            color: #888;
            font-weight: normal;
        }

        .nav-links {
            display: flex;
            gap: 24px;
            list-style: none;
            flex-wrap: wrap;
            justify-content: center;
        }

        .nav-links a {
            color: #aaa;
            transition: 0.3s;
        }

        .nav-links a:hover {
            color: white;
        }

        .hero {
            min-height: 90vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 80px 20px;
            background:
                radial-gradient(circle at center, #242424 0%, #111 25%, #070707 65%);
        }

        .hero-content {
            max-width: 900px;
        }

        .hero-small {
            color: #888;
            font-size: 15px;
            letter-spacing: 4px;
            margin-bottom: 18px;
        }

        .hero h1 {
            font-size: clamp(55px, 13vw, 120px);
            line-height: 1;
            letter-spacing: 6px;
            margin-bottom: 25px;
        }

        .hero h1 span {
            color: #aaa;
        }

        .arabic-brand {
            font-size: clamp(24px, 5vw, 42px);
            margin-bottom: 20px;
            font-weight: bold;
            cursor: pointer;
            user-select: none;
        }

        /* الصورة المضافة فقط */
        .wfesc-main-image {
            width: 110px;
            height: 110px;
            object-fit: cover;
            border-radius: 50%;
            display: block;
            margin: 0 auto 18px;
        }

        .hero h2 {
            font-size: clamp(20px, 4vw, 32px);
            font-weight: normal;
            margin-bottom: 18px;
        }

        .hero p {
            max-width: 720px;
            margin: auto;
            color: #aaa;
            font-size: 18px;
        }

        .hero-button {
            display: inline-block;
            margin-top: 35px;
            padding: 13px 30px;
            border: 1px solid #555;
            border-radius: 30px;
            transition: 0.3s;
        }

        .hero-button:hover {
            background: #fff;
            color: #000;
        }

        section {
            max-width: 1150px;
            margin: auto;
            padding: 90px 20px;
        }

        .section-title {
            text-align: center;
            margin-bottom: 45px;
        }

        .section-title h2 {
            font-size: 36px;
            margin-bottom: 8px;
        }

        .section-title p {
            color: #777;
        }

        .about-box {
            background: #111;
            border: 1px solid #222;
            border-radius: 22px;
            padding: 40px;
            text-align: center;
        }

        .about-box p {
            color: #ccc;
            font-size: 18px;
            max-width: 850px;
            margin: auto;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .card {
            background: #111;
            border: 1px solid #222;
            border-radius: 20px;
            padding: 30px;
            transition: 0.3s;
        }

        .card:hover {
            transform: translateY(-6px);
            border-color: #444;
        }

        .card-icon {
            font-size: 35px;
            margin-bottom: 12px;
        }

        .card h3 {
            font-size: 22px;
            margin-bottom: 10px;
        }

        .card p {
            color: #999;
        }

        .social-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }

        .social {
            background: #111;
            border: 1px solid #222;
            border-radius: 17px;
            padding: 22px;
            text-align: center;
            transition: 0.3s;
        }

        .social:hover {
            background: #181818;
            border-color: #444;
            transform: translateY(-4px);
        }

        .social strong {
            display: block;
            font-size: 18px;
            margin-bottom: 4px;
        }

        .social span {
            color: #777;
            font-size: 14px;
        }

        .share-box {
            background: linear-gradient(145deg, #161616, #0d0d0d);
            border: 1px solid #292929;
            border-radius: 25px;
            padding: 50px 30px;
            text-align: center;
        }

        .share-box h2 {
            font-size: 30px;
            margin-bottom: 15px;
        }

        .share-box p {
            color: #aaa;
            max-width: 750px;
            margin: auto;
        }

        .telegram-button {
            display: inline-block;
            margin-top: 28px;
            padding: 13px 28px;
            border: 1px solid #555;
            border-radius: 30px;
            transition: 0.3s;
        }

        .telegram-button:hover {
            background: white;
            color: black;
        }

        footer {
            border-top: 1px solid #222;
            background: #050505;
            text-align: center;
            padding: 45px 20px;
        }

        footer .brand {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        footer p {
            color: #777;
            font-size: 14px;
        }

        .footer-note {
            margin-top: 15px;
            color: #aaa;
        }

        .copyright {
            margin-top: 20px;
            color: #aaa;
        }

        @media (max-width: 750px) {

            .nav-container {
                flex-direction: column;
            }

            .nav-links {
                gap: 14px;
                font-size: 13px;
            }

            .hero {
                min-height: 80vh;
            }

            .hero h1 {
                letter-spacing: 2px;
            }

            .hero p {
                font-size: 16px;
            }

            .cards,
            .social-grid {
                grid-template-columns: 1fr;
            }

            section {
                padding: 65px 15px;
            }

            .about-box,
            .share-box {
                padding: 28px 20px;
            }
        }


        /* =====================================================
           كود اللغز - كما هو
        ===================================================== */

        #puzzle-app{
            width:100%;
            max-width:600px;
            height:100vh;
            position:relative;
            overflow:hidden;
            background:
                radial-gradient(circle at 50% 20%,#171717 0%,#080808 35%,#020202 100%);
        }

        #puzzle-screen{
            position:fixed;
            inset:0;
            z-index:99999;
            display:none;
            justify-content:center;
            align-items:center;
            background:#030303;
            color:#eee;
            font-family:Arial,Tahoma,sans-serif;
        }

        #puzzle-screen.active{
            display:flex;
        }

        #puzzle-app *{
            -webkit-tap-highlight-color:transparent;
        }

        .p-screen{
            position:absolute;
            inset:0;
            display:none;
            flex-direction:column;
            padding:24px;
            overflow-y:auto;
        }

        .p-screen.active{
            display:flex;
        }

        .p-center{
            justify-content:center;
            align-items:center;
            text-align:center;
        }

        .p-logo{
            font-weight:900;
            letter-spacing:5px;
            font-size:30px;
        }

        .p-red{
            color:#ff3030;
        }

        .p-green{
            color:#52ff91;
        }

        .p-dim{
            color:#777;
        }

        .p-small{
            font-size:12px;
            letter-spacing:2px;
        }

        .p-big{
            font-size:27px;
            line-height:1.5;
            font-weight:800;
        }

        .p-warning{
            border:1px solid #5b1818;
            background:#110606;
            padding:18px;
            margin:18px 0;
            border-radius:10px;
            color:#ff6b6b;
        }

        .p-panel{
            border:1px solid #252525;
            background:#090909;
            border-radius:14px;
            padding:18px;
            margin-top:18px;
        }

        #puzzle-app button{
            width:100%;
            border:1px solid #333;
            background:#111;
            color:#eee;
            padding:15px;
            border-radius:10px;
            margin-top:10px;
            font-size:15px;
            font-weight:bold;
        }

        #puzzle-app button:active{
            transform:scale(.98);
            background:#191919;
        }

        #puzzle-app input{
            width:100%;
            background:#050505;
            border:1px solid #333;
            color:#fff;
            padding:15px;
            border-radius:10px;
            margin-top:12px;
            text-align:center;
            font-size:18px;
            outline:none;
        }

        #puzzle-app input:focus{
            border-color:#777;
        }

        #terminal{
            color:#62ff9b;
            font-family:monospace;
            font-size:13px;
            line-height:1.9;
            white-space:pre-wrap;
        }

        .p-code{
            margin-top:20px;
            padding:18px;
            border:1px dashed #333;
            background:#050505;
            font-family:monospace;
            text-align:center;
            letter-spacing:4px;
            font-size:20px;
        }

        .p-grid{
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:8px;
            margin-top:15px;
        }

        .p-tile{
            height:75px;
            background:#0d0d0d;
            border:1px solid #292929;
            border-radius:9px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:monospace;
            font-size:20px;
        }

        .p-tile.good{
            border-color:#52ff91;
            color:#52ff91;
        }

        .p-progress{
            position:absolute;
            top:0;
            right:0;
            left:0;
            height:3px;
            background:#111;
            z-index:10;
        }

        #pbar{
            width:0%;
            height:100%;
            background:#eee;
            transition:.5s;
        }

        #ptimer{
            position:fixed;
            top:10px;
            left:12px;
            color:#444;
            font:11px monospace;
            z-index:20;
        }

        .p-secret-dot{
            width:5px;
            height:5px;
            background:#161616;
            border-radius:50%;
            position:absolute;
            bottom:12px;
            right:12px;
        }

        .p-footer{
            margin-top:auto;
            padding-top:30px;
            text-align:center;
            color:#333;
            font-size:10px;
        }

        .p-shake{
            animation:pShake .25s;
        }

        @keyframes pShake{
            0%,100%{transform:translateX(0)}
            25%{transform:translateX(-7px)}
            75%{transform:translateX(7px)}
        }

        .p-hidden{
            display:none!important;
        }

        .p-flash{
            animation:pFlash .5s;
        }

        @keyframes pFlash{
            0%{filter:brightness(1)}
            40%{filter:brightness(3)}
            100%{filter:brightness(1)}
        }
    </style>
</head>

<body>

<nav>
    <div class="nav-container">

        <div class="logo">
            WFESC <span>| اوفِس</span>
        </div>

        <ul class="nav-links">
            <li><a href="#home">الرئيسية</a></li>
            <li><a href="#about">من نحن</a></li>
            <li><a href="#goal">هدفنا</a></li>
            <li><a href="#pages">صفحاتنا</a></li>
            <li><a href="#share">شاركنا</a></li>
        </ul>

    </div>
</nav>


<header class="hero" id="home">

    <div class="hero-content">

        <div class="hero-small">
            اوفِس
        </div>

        <h1>
            <span>WFESC</span>
        </h1>

        <!-- الصورة المضافة -->
        <img src="اوفس.png" class="wfesc-main-image" alt="اوفِس">

        <!-- الضغط 3 مرات على اوفِس يفتح اللغز -->
        <div class="arabic-brand" id="secretTrigger">
            اوفِس | اوفس
        </div>

        <h2>
            ذاكرة العراق... بصورة مختلفة
        </h2>

        <p>
            مساحة تهتم بتاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره،
            ونبحث عن القصص والصور والمعلومات التي تستحق أن تُعرف.
        </p>

        <a href="#about" class="hero-button">
            تعرف علينا
        </a>

    </div>

</header>


<section id="about">

    <div class="section-title">
        <h2>من نحن؟</h2>
        <p>اوفِس | اوفس | WFESC</p>
    </div>

    <div class="about-box">

        <p>
            اوفِس | WFESC هو مشروع يهتم بتقديم محتوى مميز عن العراق،
            من تاريخه وإنجازاته إلى مشاريعه وممتلكاته ونوادره.
            نبحث عن القصص والصور والمعلومات التي تستحق أن تصل إلى الناس،
            ونسعى إلى تقديمها بطريقة بسيطة ومميزة مع الاهتمام بالمعلومات
            والمصادر قدر الإمكان.
        </p>

    </div>

</section>


<section id="goal">

    <div class="section-title">
        <h2>هدفنا</h2>
        <p>لماذا WFESC؟</p>
    </div>

    <div class="cards">

        <div class="card">
            <div class="card-icon">🇮🇶</div>
            <h3>تاريخ العراق</h3>
            <p>
                تسليط الضوء على أحداث وصور وأماكن وقصص من تاريخ العراق
                وتعريف الأجيال بها.
            </p>
        </div>

        <div class="card">
            <div class="card-icon">🏗️</div>
            <h3>الإنجازات والمشاريع</h3>
            <p>
                التعريف بالمشاريع والإنجازات العراقية القديمة والحديثة
                والقصص المرتبطة بها.
            </p>
        </div>

        <div class="card">
            <div class="card-icon">🔎</div>
            <h3>النوادر</h3>
            <p>
                البحث عن السيارات والقطع والصور والممتلكات والأشياء
                النادرة التي تحمل قصة تستحق أن تُعرف.
            </p>
        </div>

    </div>

</section>


<section id="pages">

    <div class="section-title">
        <h2>صفحاتنا</h2>
        <p>تابع اوفِس | WFESC على منصاتنا</p>
    </div>

    <div class="social-grid">

        <a class="social"
           href="https://www.tiktok.com/@wfesc"
           target="_blank"
           rel="noopener">
            <strong>TikTok</strong>
            <span>@wfesc</span>
        </a>

        <a class="social"
           href="https://www.instagram.com/_wfesc"
           target="_blank"
           rel="noopener">
            <strong>Instagram</strong>
            <span>@_wfesc</span>
        </a>

        <a class="social"
           href="https://www.youtube.com/@wfesc"
           target="_blank"
           rel="noopener">
            <strong>YouTube</strong>
            <span>@wfesc</span>
        </a>

        <a class="social"
           href="https://t.me/wfecs"
           target="_blank"
           rel="noopener">
            <strong>Telegram</strong>
            <span>@wfecs</span>
        </a>

        <a class="social"
           href="https://www.facebook.com/wfesc"
           target="_blank"
           rel="noopener">
            <strong>Facebook</strong>
            <span>WFESC</span>
        </a>

        <a class="social"
           href="https://x.com/wfeesc"
           target="_blank"
           rel="noopener">
            <strong>X</strong>
            <span>@wfeesc</span>
        </a>

    </div>

</section>


<section id="share">

    <div class="share-box">

        <h2>
            عندك شيء يستحق أن يُعرف؟
        </h2>

        <p>
            سيارة نادرة، صورة قديمة، مشروع عراقي، اختراع، قطعة مميزة،
            أو معلومة تعتقد أنها تستحق أن تصل إلى الناس؟
            شاركها معنا، ونراجع المعلومات والصور ونختار المواضيع المميزة
            حتى تتحول إلى محتوى WFESC.
        </p>

        <a
            href="https://t.me/wfecs"
            target="_blank"
            rel="noopener"
            class="telegram-button">
            شاركنا عبر التلكرام
        </a>

    </div>

</section>


<footer>

    <div class="brand">
        اوفِس | WFESC
    </div>

    <p>
        تاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره
    </p>

    <p class="footer-note">
        المحتوى مُدار من قبل اوفس 𝑾𝑭𝑬𝑺𝑪
    </p>

    <p class="copyright">
        جميع الحقوق محفوظة لدى اوفس 𝑾𝑭𝑬𝑺𝑪 © 2026
    </p>

</footer>


<!-- =====================================================
     اللغز المخفي
===================================================== -->


<div id="puzzle-screen">

<div id="puzzle-app">

<div class="p-progress">
    <div id="pbar"></div>
</div>

<div id="ptimer">SESSION 00:00</div>


<section id="boot" class="p-screen p-center active">

    <div class="p-logo">WFESC</div>

    <div class="p-small p-dim" style="margin-top:15px">
        PRIVATE SYSTEM
    </div>

    <div class="p-warning">
        هذه ليست صفحة عامة.
    </div>

    <div id="terminal"></div>

    <button id="beginBtn" class="p-hidden">
        متابعة
    </button>

</section>


<section id="intro" class="p-screen p-center">

    <div class="p-small p-red">UNKNOWN ACCESS</div>

    <div class="p-big" style="margin-top:20px">
        شلون وصلت لهنا؟
    </div>

    <div class="p-panel">
        <p>هذه الصفحة لم يتم الإعلان عنها.</p>
        <p class="p-dim">ولم يكن من المفترض أن تظهر لك.</p>
    </div>

    <div class="p-warning">
        ⚠ الوصول مخصص للمطورين فقط
    </div>

    <button onclick="startRoute()">
        أعرف ماذا أفعل
    </button>

    <button onclick="leaveFake()">
        رجوع
    </button>

</section>


<section id="level1" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 01 / 08</div>

    <h1>أول اختبار</h1>

    <p>
        النظام لا يريد كلمة سر.
    </p>

    <p class="p-dim">
        يريد منك أن تلاحظ شيئاً لا يبدو مهماً.
    </p>

    <div class="p-panel">

        <div>
            WFESC
        </div>

        <div class="p-small p-dim" style="margin-top:20px">
            ابحث عن الشيء المختلف.
        </div>

        <div class="p-grid">

            <div class="p-tile" onclick="wrong(this)">W</div>
            <div class="p-tile" onclick="wrong(this)">F</div>
            <div class="p-tile" onclick="wrong(this)">E</div>

            <div class="p-tile" onclick="wrong(this)">S</div>
            <div class="p-tile" onclick="correct1(this)">C</div>
            <div class="p-tile" onclick="wrong(this)">F</div>

            <div class="p-tile" onclick="wrong(this)">E</div>
            <div class="p-tile" onclick="wrong(this)">W</div>
            <div class="p-tile" onclick="wrong(this)">S</div>

        </div>

    </div>

    <div id="hint1" class="p-dim p-small"></div>

</section>


<section id="level2" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 02 / 08</div>

    <h1>الترتيب</h1>

    <p>
        جيد.
    </p>

    <p class="p-dim">
        لكن الوصول الحقيقي لا يبدأ من الإجابة...
        يبدأ من فهم التسلسل.
    </p>

    <div class="p-panel">

        <p>أكمل السلسلة:</p>

        <div class="p-code">
            2 — 4 — 8 — 16 — ?
        </div>

        <input id="answer2" inputmode="numeric" placeholder="أدخل الرقم">

        <button onclick="check2()">
            تحقق
        </button>

        <div id="msg2" class="p-small"></div>

    </div>

</section>


<section id="level3" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 03 / 08</div>

    <h1>لا تثق بالواجهة</h1>

    <p class="p-dim">
        بعض الأشياء هنا لا تظهر إلا إذا تعاملت معها بالطريقة الصحيحة.
    </p>

    <div class="p-panel">

        <p>
            اضغط الكلمات بالترتيب الصحيح:
        </p>

        <div id="words"></div>

        <div id="wordStatus" class="p-small p-dim">
            0 / 4
        </div>

    </div>

    <div class="p-secret-dot" onclick="dotClicked()"></div>

</section>


<section id="level4" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 04 / 08</div>

    <h1>الذاكرة</h1>

    <p>
        الآن سنرى إذا كنت تتذكر.
    </p>

    <div class="p-warning">
        النظام لن يعيد عرض الرمز.
    </div>

    <div id="memoryPanel" class="p-panel p-center">

        <div id="memoryCode" class="p-code">
            جاري التحميل...
        </div>

        <button onclick="hideMemory()">
            حفظت الرمز
        </button>

    </div>

    <div id="memoryInput" class="p-panel p-hidden">

        <p class="p-dim">
            اكتب الرمز الذي ظهر.
        </p>

        <input id="answer4" autocomplete="off">

        <button onclick="check4()">
            تحقق
        </button>

        <div id="msg4" class="p-small"></div>

    </div>

</section>


<section id="level5" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 05 / 08</div>

    <h1>الرسالة الناقصة</h1>

    <p class="p-dim">
        أحياناً أهم شيء هو الشيء المفقود.
    </p>

    <div class="p-panel">

        <div class="p-code">
            W _ E S C
        </div>

        <p>
            الحرف الناقص واضح...
        </p>

        <p class="p-dim">
            لكن النظام لا يريد الحرف.
        </p>

        <p>
            يريد <b>رقم موقعه</b> في الأبجدية الإنجليزية.
        </p>

        <input id="answer5" inputmode="numeric" placeholder="رقم">

        <button onclick="check5()">
            إرسال
        </button>

        <div id="msg5" class="p-small"></div>

    </div>

</section>


<section id="level6" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 06 / 08</div>

    <h1>لا تضغط عشوائياً</h1>

    <p class="p-dim">
        هناك تسلسل واحد فقط.
    </p>

    <div class="p-panel">

        <div class="p-small">
            استخدم الاتجاهات:
        </div>

        <div class="p-grid">

            <button onclick="direction('up')">↑</button>
            <button onclick="direction('right')">→</button>
            <button onclick="direction('down')">↓</button>

            <button onclick="direction('left')">←</button>
            <button onclick="direction('up')">↑</button>
            <button onclick="direction('right')">→</button>

        </div>

        <div id="dirStatus" class="p-code">
            • • • •
        </div>

    </div>

</section>


<section id="level7" class="p-screen">

    <div class="p-small p-red">ACCESS LEVEL 07 / 08</div>

    <h1>قريب...</h1>

    <p>
        أنت وصلت إلى مكان لم يكن المستخدم العادي ليصل إليه.
    </p>

    <div class="p-warning">
        ⚠ مستوى الوصول الحالي غير مسجل كمستوى مستخدم.
    </div>

    <div class="p-panel">

        <p class="p-dim">
            هناك ثلاثة أبواب.
        </p>

        <button onclick="door(1)">الباب الأول</button>
        <button onclick="door(2)">الباب الثاني</button>
        <button onclick="door(3)">الباب الثالث</button>

        <div id="doorMsg" class="p-small"></div>

    </div>

</section>


<section id="level8" class="p-screen">

    <div class="p-small p-red">FINAL ACCESS / 08</div>

    <h1>آخر خطوة</h1>

    <p>
        وصلت تقريباً للنهاية.
    </p>

    <div class="p-warning">
        لا توجد كلمة سر أخيرة.
    </div>

    <div class="p-panel">

        <p class="p-dim">
            تذكر أول سؤال سألك إياه النظام.
        </p>

        <p>
            شلون وصلت لهنا؟
        </p>

        <p class="p-dim">
            الجواب ليس مطلوباً كتابته.
            المطلوب أن تعيد نفس الحركة التي أوصلتك إلى هنا.
        </p>

        <button onclick="finalAction()">
            المحاولة الأخيرة
        </button>

        <div id="finalMsg" class="p-small"></div>

    </div>

</section>


<section id="end" class="p-screen p-center">

    <div class="p-small p-green">
        ACCESS GRANTED
    </div>

    <div class="p-big" style="margin-top:20px">
        حسناً...
    </div>

    <div class="p-panel">

        <p>
            وصلت إلى النهاية.
        </p>

        <p class="p-dim">
            هذا القسم لم يكن مصمماً ليكون سهلاً.
        </p>

        <p class="p-dim">
            ولم تكن الإجابات مكتوبة أمامك.
        </p>

        <p>
            أنت اكتشفت الطريق بنفسك.
        </p>

    </div>

    <div class="p-code">
        WFESC // DEVELOPER ROUTE
    </div>

    <p class="p-dim">
        شكراً لأن فضولك كان أقوى من رغبتك في التوقف.
    </p>

    <p class="p-small">
        — WFESC
    </p>

    <button onclick="resetEverything()">
        إعادة التجربة
    </button>

</section>


<section id="fake" class="p-screen p-center">

    <div class="p-small p-red">ACCESS TERMINATED</div>

    <div class="p-big">
        تم إنهاء جلسة الوصول.
    </div>

    <p class="p-dim">
        لكن يبدو أنك لم تكن فضولياً بما يكفي.
    </p>

    <button onclick="go('intro')">
        محاولة أخرى
    </button>

</section>


</div>
</div>


<script>

/* =====================================================
   الضغط 3 مرات على اوفِس
===================================================== */

let secretClicks = 0;
let secretClickTimer = null;

document.getElementById("secretTrigger").addEventListener("click", function(){

    secretClicks++;

    clearTimeout(secretClickTimer);

    secretClickTimer = setTimeout(function(){
        secretClicks = 0;
    }, 1200);

    if(secretClicks === 3){

        secretClicks = 0;

        document.getElementById("puzzle-screen")
            .classList.add("active");

        document.body.style.overflow = "hidden";

        startPuzzle();

    }

});


/* =====================================================
   CONFIG
===================================================== */

const STORAGE_KEY = "wfesc_secret_progress_v1";

let progress = Number(localStorage.getItem(STORAGE_KEY) || 0);

let startTime = Date.now();

let memorySecret = "";

let wordOrder = ["اكتشف","الصمت","ثم","تابع"];
let wordIndex = 0;

let directionSequence = ["up","right","down","left"];
let directionIndex = 0;

let dotClicks = 0;


/* =====================================================
   START PUZZLE
===================================================== */

let puzzleStarted = false;

function startPuzzle(){

    startTime = Date.now();

    document.querySelectorAll("#puzzle-app .p-screen")
        .forEach(x=>x.classList.remove("active"));

    document.getElementById("boot")
        .classList.add("active");

    lineIndex = 0;

    document.getElementById("terminal").textContent = "";

    document.getElementById("beginBtn")
        .classList.add("p-hidden");

    progress = Number(localStorage.getItem(STORAGE_KEY) || 0);

    updateProgress();

    boot();

}


/* =====================================================
   SCREEN SYSTEM
===================================================== */
function go(id){

    document.querySelectorAll("#puzzle-app .p-screen")
        .forEach(x=>x.classList.remove("active"));

    const el = document.getElementById(id);

    if(el) el.classList.add("active");

    updateProgress();

    window.scrollTo(0,0);

}


/* =====================================================
   PROGRESS
===================================================== */

function updateProgress(){

    const value = Math.min(progress / 8 * 100,100);

    document.getElementById("pbar").style.width=value+"%";

}


/* =====================================================
   TIMER
===================================================== */

setInterval(()=>{

    if(!document.getElementById("puzzle-screen").classList.contains("active"))
        return;

    const seconds=Math.floor((Date.now()-startTime)/1000);

    const min=String(Math.floor(seconds/60)).padStart(2,"0");
    const sec=String(seconds%60).padStart(2,"0");

    document.getElementById("ptimer").textContent=
        `SESSION ${min}:${sec}`;

},1000);


/* =====================================================
   BOOT TERMINAL
===================================================== */

const bootLines=[
    "initializing WFESC system...",
    "checking public interface...",
    "checking developer route...",
    "developer route: FOUND",
    "access status: UNKNOWN",
    "",
    "WARNING: unauthorized route detected."
];

let lineIndex=0;

function boot(){

    if(lineIndex>=bootLines.length){

        document.getElementById("beginBtn")
            .classList.remove("p-hidden");

        return;

    }

    const terminal=document.getElementById("terminal");

    terminal.textContent += bootLines[lineIndex]+"\n";

    lineIndex++;

    setTimeout(boot,420);

}


document.getElementById("beginBtn")
    .onclick=()=>go("intro");


/* =====================================================
   INTRO
===================================================== */

function startRoute(){

    if(progress===0){
        progress=1;
        save();
    }

    go("level1");

}


/* =====================================================
   SAVE
===================================================== */

function save(){

    localStorage.setItem(STORAGE_KEY,String(progress));

}


/* =====================================================
   LEVEL 1
===================================================== */

function wrong(el){

    el.classList.add("p-shake");

    navigator.vibrate?.(60);

    setTimeout(()=>{
        el.classList.remove("p-shake");
    },300);

    document.getElementById("hint1").textContent=
        "ليس هذا... لاحظ الأحرف جيداً.";

}


function correct1(el){

    el.classList.add("good");

    navigator.vibrate?.([40,50,40]);

    setTimeout(()=>{

        progress=2;
        save();
        go("level2");

    },700);

}


/* =====================================================
   LEVEL 2
===================================================== */

function check2(){

    const answer=
        document.getElementById("answer2").value.trim();

    const msg=document.getElementById("msg2");

    if(answer==="32"){

        msg.textContent="مطابق.";
        msg.className="p-small p-green";

        progress=3;
        save();

        setTimeout(()=>setupLevel3(),700);

    }else{

        msg.textContent="لا. فكر بالتسلسل.";
        msg.className="p-small p-red";

    }

}


/* =====================================================
   LEVEL 3
===================================================== */

function setupLevel3(){

    go("level3");

    const box=document.getElementById("words");

    box.innerHTML="";

    const shuffled=[
        "ثم",
        "اكتشف",
        "تابع",
        "الصمت"
    ];

    shuffled.forEach(word=>{

        const b=document.createElement("button");

        b.textContent=word;

        b.onclick=()=>wordClicked(b,word);

        box.appendChild(b);

    });

}


function wordClicked(button,word){

    if(word===wordOrder[wordIndex]){

        button.disabled=true;
        button.style.opacity=".3";

        wordIndex++;

        document.getElementById("wordStatus")
            .textContent=`${wordIndex} / 4`;

        if(wordIndex===4){

            navigator.vibrate?.([50,80,50]);

            progress=4;
            save();

            setTimeout(()=>setupLevel4(),800);

        }

    }else{

        wordIndex=0;

        document.querySelectorAll("#words button")
            .forEach(x=>{
                x.disabled=false;
                x.style.opacity="1";
            });

        document.getElementById("wordStatus")
            .textContent="0 / 4 — التسلسل خطأ";

        navigator.vibrate?.(100);

    }

}


/* =====================================================
   LEVEL 4 MEMORY
===================================================== */

function setupLevel4(){

    go("level4");

    memorySecret=
        String(Math.floor(1000+Math.random()*9000));

    document.getElementById("memoryCode")
        .textContent=memorySecret;

}


function hideMemory(){

    document.getElementById("memoryPanel")
        .classList.add("p-hidden");

    document.getElementById("memoryInput")
        .classList.remove("p-hidden");

}


function check4(){

    const value=
        document.getElementById("answer4").value.trim();

    const msg=document.getElementById("msg4");

    if(value===memorySecret){

        msg.textContent="ذاكرة جيدة.";
        msg.className="p-small p-green";

        progress=5;
        save();

        setTimeout(()=>go("level5"),700);

    }else{

        msg.textContent="الرمز غير مطابق.";
        msg.className="p-small p-red";

    }

}


/* =====================================================
   LEVEL 5
===================================================== */

function check5(){

    const value=
        document.getElementById("answer5").value.trim();

    const msg=document.getElementById("msg5");

    if(value==="6"){

        msg.textContent="الرسالة مقبولة.";
        msg.className="p-small p-green";

        progress=6;
        save();

        setTimeout(()=>go("level6"),700);

    }else{

        msg.textContent="أنت قريب... لكن الإجابة ليست الرقم المطلوب.";
        msg.className="p-small p-red";

    }

}


/* =====================================================
   LEVEL 6
===================================================== */

function direction(dir){

    if(dir===directionSequence[directionIndex]){

        directionIndex++;

        const dots=
            "● ".repeat(directionIndex)+
            "○ ".repeat(4-directionIndex);

        document.getElementById("dirStatus")
            .textContent=dots;

        navigator.vibrate?.(40);

        if(directionIndex===4){

            progress=7;
            save();

            setTimeout(()=>go("level7"),800);

        }

    }else{

        directionIndex=0;

        document.getElementById("dirStatus")
            .textContent="○ ○ ○ ○";

        navigator.vibrate?.(100);

        document.getElementById("puzzle-app")
            .classList.add("p-shake");

        setTimeout(()=>{
            document.getElementById("puzzle-app")
                .classList.remove("p-shake");
        },300);

    }

}


/* =====================================================
   LEVEL 7 DOORS
===================================================== */

function door(number){

    const msg=document.getElementById("doorMsg");

    if(number===2){

        msg.textContent=
            "الباب الثاني لا يؤدي إلى النهاية... لكنه الوحيد الذي لا يعيدك للخلف.";

        msg.className="p-small p-green";

        setTimeout(()=>go("level8"),1200);

    }else{

        const texts={
            1:"تم رفض الوصول.",
            3:"هذا المسار لا يحتوي على شيء."
        };

        msg.textContent=texts[number];

        msg.className="p-small p-red";

        navigator.vibrate?.(70);

    }

}


/* =====================================================
   FINAL
===================================================== */

function finalAction(){

    const msg=document.getElementById("finalMsg");

    msg.textContent=
        "تذكّر: ضغطت على «اوفِس» لأنك كنت تبحث عن شيء مخفي.";

    msg.className="p-small p-green";

    setTimeout(()=>{

        progress=8;
        save();

        document.getElementById("puzzle-app")
            .classList.add("p-flash");

        navigator.vibrate?.([80,80,150]);

        setTimeout(()=>{

            document.getElementById("puzzle-app")
                .classList.remove("p-flash");

            go("end");

        },700);

    },1600);

}


/* =====================================================
   SECRET DOT
===================================================== */

function dotClicked(){

    dotClicks++;

    if(dotClicks===3){

        const status=
            document.getElementById("wordStatus");

        status.textContent=
            "لاحظت شيئاً آخر... لكن هذا ليس الطريق.";

        status.className="p-small p-red";

    }

}


/* =====================================================
   FAKE EXIT
===================================================== */

function leaveFake(){

    go("fake");

}


/* =====================================================
   RESET
===================================================== */

function resetEverything(){

    localStorage.removeItem(STORAGE_KEY);

    progress=0;
    wordIndex=0;
    directionIndex=0;
    dotClicks=0;

    location.reload();

}


/* =====================================================
   RESUME
===================================================== */

window.addEventListener("load",()=>{

    if(progress>=8){

        /* يبقى الموقع الرئيسي كما هو */
        progress=8;

    }

});


/* =====================================================
   PREVENT ACCIDENTAL ZOOM
===================================================== */

document.addEventListener("gesturestart",e=>{
    e.preventDefault();
});

document.addEventListener("dblclick",e=>{
    e.preventDefault();
});

</script>

</body>
</html>
