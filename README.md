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

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>WFESC // DEVELOPER ACCESS</title>

<style>
*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  margin:0;
  width:100%;
  min-height:100%;
  background:#030303;
  color:#eee;
  font-family:Arial,Tahoma,sans-serif;
  overflow:hidden;
}

body{
  display:flex;
  justify-content:center;
  align-items:center;
}

#app{
  width:100%;
  max-width:600px;
  height:100vh;
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(circle at 50% 20%,#171717 0%,#080808 35%,#020202 100%);
}

.screen{
  position:absolute;
  inset:0;
  display:none;
  flex-direction:column;
  padding:24px;
  overflow-y:auto;
}

.screen.active{
  display:flex;
}

.center{
  justify-content:center;
  align-items:center;
  text-align:center;
}

.logo{
  font-weight:900;
  letter-spacing:5px;
  font-size:30px;
}

.red{
  color:#ff3030;
}

.green{
  color:#52ff91;
}

.dim{
  color:#777;
}

.small{
  font-size:12px;
  letter-spacing:2px;
}

.big{
  font-size:27px;
  line-height:1.5;
  font-weight:800;
}

.warning{
  border:1px solid #5b1818;
  background:#110606;
  padding:18px;
  margin:18px 0;
  border-radius:10px;
  color:#ff6b6b;
}

.panel{
  border:1px solid #252525;
  background:#090909;
  border-radius:14px;
  padding:18px;
  margin-top:18px;
}

button{
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

button:active{
  transform:scale(.98);
  background:#191919;
}

input{
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

input:focus{
  border-color:#777;
}

#terminal{
  color:#62ff9b;
  font-family:monospace;
  font-size:13px;
  line-height:1.9;
  white-space:pre-wrap;
}

.code{
  margin-top:20px;
  padding:18px;
  border:1px dashed #333;
  background:#050505;
  font-family:monospace;
  text-align:center;
  letter-spacing:4px;
  font-size:20px;
}

.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-top:15px;
}

.tile{
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

.tile.active{
  background:#171717;
  border-color:#777;
  color:#fff;
}

.tile.good{
  border-color:#52ff91;
  color:#52ff91;
}

.progress{
  position:absolute;
  top:0;
  right:0;
  left:0;
  height:3px;
  background:#111;
}

#bar{
  width:0%;
  height:100%;
  background:#eee;
  transition:.5s;
}

.glitch{
  animation:glitch .12s infinite;
}

@keyframes glitch{
  0%{transform:translate(0)}
  25%{transform:translate(2px,-1px)}
  50%{transform:translate(-2px,1px)}
  75%{transform:translate(1px,2px)}
  100%{transform:translate(0)}
}

.flash{
  animation:flash .5s;
}

@keyframes flash{
  0%{filter:brightness(1)}
  40%{filter:brightness(3)}
  100%{filter:brightness(1)}
}

#timer{
  position:fixed;
  top:10px;
  left:12px;
  color:#444;
  font:11px monospace;
  z-index:20;
}

.choice{
  text-align:right;
  direction:rtl;
}

.choice span{
  display:block;
  margin-bottom:5px;
  color:#888;
  font-size:12px;
}

.secret-dot{
  width:5px;
  height:5px;
  background:#161616;
  border-radius:50%;
  position:absolute;
  bottom:12px;
  right:12px;
}

footer{
  margin-top:auto;
  padding-top:30px;
  text-align:center;
  color:#333;
  font-size:10px;
}

.shake{
  animation:shake .25s;
}

@keyframes shake{
  0%,100%{transform:translateX(0)}
  25%{transform:translateX(-7px)}
  75%{transform:translateX(7px)}
}

.hidden{
  display:none!important;
}

#touchArea{
  position:absolute;
  inset:0;
  z-index:30;
  display:none;
}
</style>
</head>

<body>

<div id="app">

<div class="progress">
  <div id="bar"></div>
</div>

<div id="timer">SESSION 00:00</div>


<!-- =====================================================
     BOOT
===================================================== -->

<section id="boot" class="screen center active">

  <div class="logo">WFESC</div>

  <div class="small dim" style="margin-top:15px">
    PRIVATE SYSTEM
  </div>

  <div class="warning">
    هذه ليست صفحة عامة.
  </div>

  <div id="terminal"></div>

  <button id="beginBtn" class="hidden">
    متابعة
  </button>

</section>


<!-- =====================================================
     INTRO
===================================================== -->

<section id="intro" class="screen center">

  <div class="small red">UNKNOWN ACCESS</div>

  <div class="big" style="margin-top:20px">
    شلون وصلت لهنا؟
  </div>

  <div class="panel">
    <p>هذه الصفحة لم يتم الإعلان عنها.</p>
    <p class="dim">ولم يكن من المفترض أن تظهر لك.</p>
  </div>

  <div class="warning">
    ⚠ الوصول مخصص للمطورين فقط
  </div>

  <button onclick="startRoute()">
    أعرف ماذا أفعل
  </button>

  <button onclick="leaveFake()">
    رجوع
  </button>

</section>


<!-- =====================================================
     LEVEL 1
===================================================== -->

<section id="level1" class="screen">

  <div class="small red">ACCESS LEVEL 01 / 08</div>

  <h1>أول اختبار</h1>

  <p>
    النظام لا يريد كلمة سر.
  </p>

  <p class="dim">
    يريد منك أن تلاحظ شيئاً لا يبدو مهماً.
  </p>

  <div class="panel">

    <div>
      WFESC
    </div>

    <div class="small dim" style="margin-top:20px">
      ابحث عن الشيء المختلف.
    </div>

    <div class="grid">

      <div class="tile" onclick="wrong(this)">W</div>
      <div class="tile" onclick="wrong(this)">F</div>
      <div class="tile" onclick="wrong(this)">E</div>

      <div class="tile" onclick="wrong(this)">S</div>
      <div class="tile" onclick="correct1(this)">C</div>
      <div class="tile" onclick="wrong(this)">F</div>

      <div class="tile" onclick="wrong(this)">E</div>
      <div class="tile" onclick="wrong(this)">W</div>
      <div class="tile" onclick="wrong(this)">S</div>

    </div>

  </div>

  <div id="hint1" class="dim small"></div>

</section>


<!-- =====================================================
     LEVEL 2
===================================================== -->

<section id="level2" class="screen">

  <div class="small red">ACCESS LEVEL 02 / 08</div>

  <h1>الترتيب</h1>

  <p>
    جيد.
  </p>

  <p class="dim">
    لكن الوصول الحقيقي لا يبدأ من الإجابة...
    يبدأ من فهم التسلسل.
  </p>

  <div class="panel">

    <p>أكمل السلسلة:</p>

    <div class="code">
      2 — 4 — 8 — 16 — ?
    </div>

    <input id="answer2" inputmode="numeric" placeholder="أدخل الرقم">

    <button onclick="check2()">
      تحقق
    </button>

    <div id="msg2" class="small"></div>

  </div>

</section>


<!-- =====================================================
     LEVEL 3
===================================================== -->

<section id="level3" class="screen">

  <div class="small red">ACCESS LEVEL 03 / 08</div>

  <h1>لا تثق بالواجهة</h1>

  <p class="dim">
    بعض الأشياء هنا لا تظهر إلا إذا تعاملت معها بالطريقة الصحيحة.
  </p>

  <div class="panel">

    <p>
      اضغط الكلمات بالترتيب الصحيح:
    </p>

    <div id="words"></div>

    <div id="wordStatus" class="small dim">
      0 / 4
    </div>

  </div>

  <div class="secret-dot" onclick="dotClicked()"></div>

</section>


<!-- =====================================================
     LEVEL 4
===================================================== -->

<section id="level4" class="screen">

  <div class="small red">ACCESS LEVEL 04 / 08</div>

  <h1>الذاكرة</h1>

  <p>
    الآن سنرى إذا كنت تتذكر.
  </p>

  <div class="warning">
    النظام لن يعيد عرض الرمز.
  </div>

  <div id="memoryPanel" class="panel center">

    <div id="memoryCode" class="code">
      جاري التحميل...
    </div>

    <button onclick="hideMemory()">
      حفظت الرمز
    </button>

  </div>

  <div id="memoryInput" class="panel hidden">

    <p class="dim">
      اكتب الرمز الذي ظهر.
    </p>

    <input id="answer4" autocomplete="off">

    <button onclick="check4()">
      تحقق
    </button>

    <div id="msg4" class="small"></div>

  </div>

</section>


<!-- =====================================================
     LEVEL 5
===================================================== -->

<section id="level5" class="screen">

  <div class="small red">ACCESS LEVEL 05 / 08</div>

  <h1>الرسالة الناقصة</h1>

  <p class="dim">
    أحياناً أهم شيء هو الشيء المفقود.
  </p>

  <div class="panel">

    <div class="code">
      W _ E S C
    </div>

    <p>
      الحرف الناقص واضح...
    </p>

    <p class="dim">
      لكن النظام لا يريد الحرف.
    </p>

    <p>
      يريد <b>رقم موقعه</b> في الأبجدية الإنجليزية.
    </p>

    <input id="answer5" inputmode="numeric" placeholder="رقم">

    <button onclick="check5()">
      إرسال
    </button>

    <div id="msg5" class="small"></div>

  </div>

</section>


<!-- =====================================================
     LEVEL 6
===================================================== -->

<section id="level6" class="screen">

  <div class="small red">ACCESS LEVEL 06 / 08</div>

  <h1>لا تضغط عشوائياً</h1>

  <p class="dim">
    هناك تسلسل واحد فقط.
  </p>

  <div class="panel">

    <div class="small">
      استخدم الاتجاهات:
    </div>

    <div class="grid">

      <button onclick="direction('up')">↑</button>
      <button onclick="direction('right')">→</button>
      <button onclick="direction('down')">↓</button>

      <button onclick="direction('left')">←</button>
      <button onclick="direction('up')">↑</button>
      <button onclick="direction('right')">→</button>

    </div>

    <div id="dirStatus" class="code">
      • • • •
    </div>

  </div>

</section>


<!-- =====================================================
     LEVEL 7
===================================================== -->

<section id="level7" class="screen">

  <div class="small red">ACCESS LEVEL 07 / 08</div>

  <h1>قريب...</h1>

  <p>
    أنت وصلت إلى مكان لم يكن المستخدم العادي ليصل إليه.
  </p>

  <div class="warning">
    ⚠ مستوى الوصول الحالي غير مسجل كمستوى مستخدم.
  </div>

  <div class="panel">

    <p class="dim">
      هناك ثلاثة أبواب.
    </p>

    <button onclick="door(1)">الباب الأول</button>
    <button onclick="door(2)">الباب الثاني</button>
    <button onclick="door(3)">الباب الثالث</button>

    <div id="doorMsg" class="small"></div>

  </div>

</section>


<!-- =====================================================
     LEVEL 8
===================================================== -->

<section id="level8" class="screen">

  <div class="small red">FINAL ACCESS / 08</div>

  <h1>آخر خطوة</h1>

  <p>
    وصلت تقريباً للنهاية.
  </p>

  <div class="warning">
    لا توجد كلمة سر أخيرة.
  </div>

  <div class="panel">

    <p class="dim">
      تذكر أول سؤال سألك إياه النظام.
    </p>

    <p>
      شلون وصلت لهنا؟
    </p>

    <p class="dim">
      الجواب ليس مطلوباً كتابته.
      المطلوب أن تعيد نفس الحركة التي أوصلتك إلى هنا.
    </p>

    <button onclick="finalAction()">
      المحاولة الأخيرة
    </button>

    <div id="finalMsg" class="small"></div>

  </div>

</section>


<!-- =====================================================
     END
===================================================== -->

<section id="end" class="screen center">

  <div class="small green">
    ACCESS GRANTED
  </div>

  <div class="big" style="margin-top:20px">
    حسناً...
  </div>

  <div class="panel">

    <p>
      وصلت إلى النهاية.
    </p>

    <p class="dim">
      هذا القسم لم يكن مصمماً ليكون سهلاً.
    </p>

    <p class="dim">
      ولم تكن الإجابات مكتوبة أمامك.
    </p>

    <p>
      أنت اكتشفت الطريق بنفسك.
    </p>

  </div>

  <div class="code">
    WFESC // DEVELOPER ROUTE
  </div>

  <p class="dim">
    شكراً لأن فضولك كان أقوى من رغبتك في التوقف.
  </p>

  <p class="small">
    — WFESC
  </p>

  <button onclick="resetEverything()">
    إعادة التجربة
  </button>

</section>


<!-- =====================================================
     FAKE RETURN
===================================================== -->

<section id="fake" class="screen center">

  <div class="small red">ACCESS TERMINATED</div>

  <div class="big">
    تم إنهاء جلسة الوصول.
  </div>

  <p class="dim">
    لكن يبدو أنك لم تكن فضولياً بما يكفي.
  </p>

  <button onclick="go('intro')">
    محاولة أخرى
  </button>

</section>


</div>


<script>

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
   SCREEN SYSTEM
===================================================== */

function go(id){

  document.querySelectorAll(".screen")
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

  document.getElementById("bar").style.width=value+"%";

}


/* =====================================================
   TIMER
===================================================== */

setInterval(()=>{

  const seconds=Math.floor((Date.now()-startTime)/1000);

  const min=String(Math.floor(seconds/60)).padStart(2,"0");
  const sec=String(seconds%60).padStart(2,"0");

  document.getElementById("timer").textContent=
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
      .classList.remove("hidden");

    return;

  }

  const terminal=document.getElementById("terminal");

  terminal.textContent += bootLines[lineIndex]+"\n";

  lineIndex++;

  setTimeout(boot,420);

}

boot();


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

  el.classList.add("shake");

  navigator.vibrate?.(60);

  setTimeout(()=>{
    el.classList.remove("shake");
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
    msg.className="small green";

    progress=3;
    save();

    setTimeout(()=>setupLevel3(),700);

  }else{

    msg.textContent="لا. فكر بالتسلسل.";
    msg.className="small red";

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
    .classList.add("hidden");

  document.getElementById("memoryInput")
    .classList.remove("hidden");

}


function check4(){

  const value=
    document.getElementById("answer4").value.trim();

  const msg=document.getElementById("msg4");

  if(value===memorySecret){

    msg.textContent="ذاكرة جيدة.";
    msg.className="small green";

    progress=5;
    save();

    setTimeout(()=>go("level5"),700);

  }else{

    msg.textContent="الرمز غير مطابق.";
    msg.className="small red";

  }

}


/* =====================================================
   LEVEL 5
===================================================== */

function check5(){

  const value=
    document.getElementById("answer5").value.trim();

  const msg=document.getElementById("msg5");

  /*
    WFESC
    W F E S C

    الحرف الناقص في:
    W _ E S C
    هو F
    F = 6
  */

  if(value==="6"){

    msg.textContent="الرسالة مقبولة.";
    msg.className="small green";

    progress=6;
    save();

    setTimeout(()=>go("level6"),700);

  }else{

    msg.textContent="أنت قريب... لكن الإجابة ليست الرقم المطلوب.";
    msg.className="small red";

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

    document.getElementById("app")
      .classList.add("shake");

    setTimeout(()=>{
      document.getElementById("app")
        .classList.remove("shake");
    },300);

  }

}


/* =====================================================
   LEVEL 7 DOORS
===================================================== */


<section id="level7" class="screen">

  <div class="small red">ACCESS LEVEL 07 / 08</div>

  <h1>قريب...</h1>

  <p>
    أنت وصلت إلى مكان لم يكن المستخدم العادي ليصل إليه.
  </p>

  <div class="warning">
    ⚠ مستوى الوصول الحالي غير مسجل كمستوى مستخدم.
  </div>

  <div class="panel">

    <p class="dim">
      هناك ثلاثة أبواب.
    </p>

    <button onclick="door(1)">الباب الأول</button>
    <button onclick="door(2)">الباب الثاني</button>
    <button onclick="door(3)">الباب الثالث</button>

    <div id="doorMsg" class="small"></div>

  </div>

</section>


<!-- =====================================================
     LEVEL 8
===================================================== -->

<section id="level8" class="screen">

  <div class="small red">FINAL ACCESS / 08</div>

  <h1>آخر خطوة</h1>

  <p>
    وصلت تقريباً للنهاية.
  </p>

  <div class="warning">
    لا توجد كلمة سر أخيرة.
  </div>

  <div class="panel">

    <p class="dim">
      تذكر أول سؤال سألك إياه النظام.
    </p>

    <p>
      شلون وصلت لهنا؟
    </p>

    <p class="dim">
      الجواب ليس مطلوباً كتابته.
      المطلوب أن تعيد نفس الحركة التي أوصلتك إلى هنا.
    </p>

    <button onclick="finalAction()">
      المحاولة الأخيرة
    </button>

    <div id="finalMsg" class="small"></div>

  </div>

</section>


<!-- =====================================================
     END
===================================================== -->

<section id="end" class="screen center">

  <div class="small green">
    ACCESS GRANTED
  </div>

  <div class="big" style="margin-top:20px">
    حسناً...
  </div>

  <div class="panel">

    <p>
      وصلت إلى النهاية.
    </p>

    <p class="dim">
      هذا القسم لم يكن مصمماً ليكون سهلاً.
    </p>

    <p class="dim">
      ولم تكن الإجابات مكتوبة أمامك.
    </p>

    <p>
      أنت اكتشفت الطريق بنفسك.
    </p>

  </div>

  <div class="code">
    WFESC // DEVELOPER ROUTE
  </div>

  <p class="dim">
    شكراً لأن فضولك كان أقوى من رغبتك في التوقف.
  </p>

  <p class="small">
    — WFESC
  </p>

  <button onclick="resetEverything()">
    إعادة التجربة
  </button>

</section>


<!-- =====================================================
     FAKE RETURN
===================================================== -->

<section id="fake" class="screen center">

  <div class="small red">ACCESS TERMINATED</div>

  <div class="big">
    تم إنهاء جلسة الوصول.
  </div>

  <p class="dim">
    لكن يبدو أنك لم تكن فضولياً بما يكفي.
  </p>

  <button onclick="go('intro')">
    محاولة أخرى
  </button>

</section>


</div>


<script>

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
   SCREEN SYSTEM
===================================================== */

function go(id){

  document.querySelectorAll(".screen")
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

  document.getElementById("bar").style.width=value+"%";

}


/* =====================================================
   TIMER
===================================================== */

setInterval(()=>{

  const seconds=Math.floor((Date.now()-startTime)/1000);

  const min=String(Math.floor(seconds/60)).padStart(2,"0");
  const sec=String(seconds%60).padStart(2,"0");

  document.getElementById("timer").textContent=
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
      .classList.remove("hidden");

    return;

  }

  const terminal=document.getElementById("terminal");

  terminal.textContent += bootLines[lineIndex]+"\n";

  lineIndex++;

  setTimeout(boot,420);

}

boot();


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

  el.classList.add("shake");

  navigator.vibrate?.(60);

  setTimeout(()=>{
    el.classList.remove("shake");
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
    msg.className="small green";

    progress=3;
    save();

    setTimeout(()=>setupLevel3(),700);

  }else{

    msg.textContent="لا. فكر بالتسلسل.";
    msg.className="small red";

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
    .classList.add("hidden");

  document.getElementById("memoryInput")
    .classList.remove("hidden");

}


function check4(){

  const value=
    document.getElementById("answer4").value.trim();

  const msg=document.getElementById("msg4");

  if(value===memorySecret){

    msg.textContent="ذاكرة جيدة.";
    msg.className="small green";

    progress=5;
    save();

    setTimeout(()=>go("level5"),700);

  }else{

    msg.textContent="الرمز غير مطابق.";
    msg.className="small red";

  }

}


/* =====================================================
   LEVEL 5
===================================================== */

function check5(){

  const value=
    document.getElementById("answer5").value.trim();

  const msg=document.getElementById("msg5");

  /*
    WFESC
    W F E S C

    الحرف الناقص في:
    W _ E S C
    هو F
    F = 6
  */

  if(value==="6"){

    msg.textContent="الرسالة مقبولة.";
    msg.className="small green";

    progress=6;
    save();

    setTimeout(()=>go("level6"),700);

  }else{

    msg.textContent="أنت قريب... لكن الإجابة ليست الرقم المطلوب.";
    msg.className="small red";

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

    document.getElementById("app")
      .classList.add("shake");

    setTimeout(()=>{
      document.getElementById("app")
        .classList.remove("shake");
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

    msg.className="small green";

    setTimeout(()=>go("level8"),1200);

  }else{

    const texts={
      1:"تم رفض الوصول.",
      3:"هذا المسار لا يحتوي على شيء."
    };

    msg.textContent=texts[number];

    msg.className="small red";

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

  msg.className="small green";

  setTimeout(()=>{

    progress=8;
    save();

    document.getElementById("app")
      .classList.add("flash");

    navigator.vibrate?.([80,80,150]);

    setTimeout(()=>{

      document.getElementById("app")
        .classList.remove("flash");

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

    status.className="small red";

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

    go("end");

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
