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


<section id="intro" class="p-scre
