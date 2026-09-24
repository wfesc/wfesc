<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>اوفِس | WFESC</title>

    <meta name="description" content="اوفِس | WFESC — منصة تهتم بتاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره.">
    <meta name="keywords" content="اوفِس, اوفس, WFESC, العراق, تاريخ العراق, إنجازات العراق, مشاريع العراق, نوادر العراق">
    <meta name="author" content="WFESC">

    <meta property="og:title" content="اوفِس | WFESC">
    <meta property="og:description" content="تعرف على اوفِس | WFESC وأهداف المشروع وصفحاتنا ومحتوانا.">
    <meta property="og:type" content="website">

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
            font-family: Arial, "Tahoma", sans-serif;
            background: #080808;
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
            background: rgba(8, 8, 8, 0.92);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #222;
        }

        .nav-container {
            max-width: 1100px;
            margin: auto;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 1px;
        }

        .logo span {
            color: #aaa;
            font-weight: normal;
        }

        .nav-links {
            display: flex;
            gap: 25px;
            list-style: none;
        }

        .nav-links a {
            color: #ccc;
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
                radial-gradient(circle at center, #202020 0%, #080808 55%);
        }

        .hero-content {
            max-width: 850px;
        }

        .hero-small {
            color: #999;
            font-size: 15px;
            letter-spacing: 3px;
            margin-bottom: 15px;
        }

        .hero h1 {
            font-size: clamp(55px, 12vw, 110px);
            line-height: 1;
            margin-bottom: 20px;
            letter-spacing: 5px;
        }

        .hero h1 span {
            color: #aaa;
        }

        .hero h2 {
            font-size: clamp(20px, 4vw, 32px);
            font-weight: normal;
            margin-bottom: 20px;
        }

        .hero p {
            color: #aaa;
            font-size: 18px;
            max-width: 700px;
            margin: auto;
        }

        .hero-button {
            display: inline-block;
            margin-top: 35px;
            padding: 13px 28px;
            border: 1px solid #555;
            border-radius: 30px;
            transition: 0.3s;
        }

        .hero-button:hover {
            background: white;
            color: black;
        }

        section {
            max-width: 1100px;
            margin: auto;
            padding: 90px 20px;
        }

        .section-title {
            text-align: center;
            margin-bottom: 45px;
        }

        .section-title h2 {
            font-size: 36px;
            margin-bottom: 10px;
        }

        .section-title p {
            color: #888;
        }

        .about-box {
            background: #111;
            border: 1px solid #222;
            border-radius: 20px;
            padding: 35px;
            text-align: center;
        }

        .about-box p {
            color: #ccc;
            font-size: 18px;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .card {
            background: #111;
            border: 1px solid #222;
            border-radius: 18px;
            padding: 30px;
            transition: 0.3s;
        }

        .card:hover {
            transform: translateY(-5px);
            border-color: #444;
        }

        .card-icon {
            font-size: 35px;
            margin-bottom: 15px;
        }

        .card h3 {
            margin-bottom: 10px;
            font-size: 22px;
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
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            transition: 0.3s;
        }

        .social:hover {
            background: #181818;
            border-color: #444;
        }

        .social strong {
            display: block;
            font-size: 18px;
            margin-bottom: 5px;
        }

        .social span {
            color: #777;
            font-size: 14px;
        }

        .share-box {
            background: linear-gradient(145deg, #151515, #0d0d0d);
            border: 1px solid #292929;
            border-radius: 22px;
            padding: 45px 30px;
            text-align: center;
        }

        .share-box h2 {
            margin-bottom: 15px;
        }

        .share-box p {
            color: #aaa;
            max-width: 700px;
            margin: auto;
        }

        .telegram-button {
            display: inline-block;
            margin-top: 25px;
            padding: 12px 25px;
            border: 1px solid #555;
            border-radius: 25px;
        }

        .telegram-button:hover {
            background: white;
            color: black;
        }

        footer {
            border-top: 1px solid #222;
            text-align: center;
            padding: 40px 20px;
            background: #050505;
        }

        footer .brand {
            font-size: 22px;
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
            font-size: 14px;
        }

        @media (max-width: 750px) {

            .nav-container {
                flex-direction: column;
                gap: 10px;
            }

            .nav-links {
                gap: 15px;
                font-size: 13px;
                flex-wrap: wrap;
                justify-content: center;
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
                padding: 25px 20px;
            }
        }
    </style>
</head>

<body>

    <!-- شريط التنقل -->
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


    <!-- الرئيسية -->
    <header class="hero" id="home">

        <div class="hero-content">

            <div class="hero-small">
                اوفِس
            </div>

            <h1>
                <span>WFESC</span>
            </h1>

            <h2>
                ذاكرة العراق... بصورة مختلفة
            </h2>

            <p>
                مساحة تهتم بتاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره،
                وتقدم محتوى يسلط الضوء على ما يستحق أن يُعرف.
            </p>

            <a href="#about" class="hero-button">
                تعرف علينا
            </a>

        </div>

    </header>


    <!-- من نحن -->
    <section id="about">

        <div class="section-title">
            <h2>من نحن؟</h2>
            <p>تعرف على اوفِس | WFESC</p>
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


    <!-- الهدف -->
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


    <!-- صفحاتنا -->
    <section id="pages">

        <div class="section-title">
            <h2>صفحاتنا</h2>
            <p>تابع WFESC على منصاتنا</p>
        </div>

        <div class="social-grid">

            <a class="social" href="https://www.tiktok.com/@wfesc" target="_blank">
                <strong>TikTok</strong>
                <span>@wfesc</span>
            </a>

            <a class="social" href="https://www.instagram.com/_wfesc" target="_blank">
                <strong>Instagram</strong>
                <span>@_wfesc</span>
            </a>

            <a class="social" href="https://www.youtube.com/@wfesc" target="_blank">
                <strong>YouTube</strong>
                <span>@wfesc</span>
            </a>

            <a class="social" href="https://t.me/wfecs" target="_blank">
                <strong>Telegram</strong>
                <span>@wfecs</span>
            </a>

            <a class="social" href="https://www.facebook.com/wfesc" target="_blank">
                <strong>Facebook</strong>
                <span>WFESC</span>
            </a>

            <a class="social" href="https://x.com/wfeesc" target="_blank">
                <strong>X</strong>
                <span>@wfeesc</span>
            </a>

        </div>

    </section>


    <!-- مشاركة المتابعين -->
    <section id="share">

        <div class="share-box">

            <h2>عندك شيء يستحق أن يُعرف؟</h2>

            <p>
                سيارة نادرة، صورة قديمة، مشروع عراقي، اختراع، قطعة مميزة،
                أو معلومة تعتقد أنها تستحق أن تصل إلى الناس؟
                شاركها معنا، ونراجع المعلومات والصور ونختار المواضيع المميزة
                حتى تتحول إلى محتوى WFESC.
            </p>

            <a
                href="https://t.me/wfecs"
                target="_blank"
                class="telegram-button">
                شاركنا عبر التلكرام
            </a>

        </div>

    </section>


    <!-- نهاية الموقع -->
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

</body>
</html>
