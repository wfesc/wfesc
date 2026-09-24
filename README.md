<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WFESC</title>

<style>
*{
    box-sizing:border-box;
    margin:0;
    padding:0;
}

html{
    scroll-behavior:smooth;
}

body{
    background:#050505;
    color:#eee;
    font-family:Arial,Tahoma,sans-serif;
    overflow-x:hidden;
}

body::after{
    content:"";
    position:fixed;
    inset:0;
    pointer-events:none;
    z-index:99990;
    opacity:0;
    background:#ff0000;
}

body.flash3::after{
    animation:flash3 .5s ease;
}

body.flash4::after{
    animation:flash4 .58s ease;
}

body.flash5::after{
    animation:flash5 .75s ease;
}

@keyframes flash3{
    0%{opacity:0}
    35%{opacity:.08}
    100%{opacity:0}
}

@keyframes flash4{
    0%{opacity:0}
    35%{opacity:.16}
    100%{opacity:0}
}

@keyframes flash5{
    0%{opacity:0}
    25%{opacity:.28}
    50%{opacity:.12}
    100%{opacity:0}
}

@keyframes shake3{
    0%,100%{transform:translate(0)}
    20%{transform:translate(-2px,1px)}
    40%{transform:translate(2px,-1px)}
    60%{transform:translate(-1px,2px)}
    80%{transform:translate(1px,-2px)}
}

@keyframes shake4{
    0%,100%{transform:translate(0)}
    15%{transform:translate(-4px,2px)}
    30%{transform:translate(4px,-2px)}
    45%{transform:translate(-3px,-3px)}
    60%{transform:translate(3px,3px)}
    75%{transform:translate(-2px,2px)}
}

@keyframes shake5{
    0%,100%{transform:translate(0)}
    10%{transform:translate(-7px,4px)}
    20%{transform:translate(7px,-4px)}
    30%{transform:translate(-6px,-5px)}
    40%{transform:translate(6px,5px)}
    50%{transform:translate(-5px,3px)}
    60%{transform:translate(5px,-3px)}
    70%{transform:translate(-4px,-4px)}
    80%{transform:translate(4px,4px)}
}

body.shake3{animation:shake3 .35s}
body.shake4{animation:shake4 .45s}
body.shake5{animation:shake5 .62s}


/* NAVBAR */

nav{
    position:sticky;
    top:0;
    z-index:1000;
    height:70px;
    background:rgba(5,5,5,.94);
    border-bottom:1px solid #171717;
    backdrop-filter:blur(12px);
    display:flex;
    justify-content:center;
    align-items:center;
}

nav a{
    color:#aaa;
    text-decoration:none;
    margin:0 16px;
    font-size:14px;
    transition:.3s;
}

nav a:hover{
    color:#fff;
}


/* HERO */

.hero{
    min-height:calc(100vh - 70px);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:50px 20px;
}

.logo-trigger{
    cursor:pointer;
    user-select:none;
    -webkit-tap-highlight-color:transparent;
}

.logo-trigger img{
    width:145px;
    height:145px;
    object-fit:cover;
    border-radius:50%;
    display:block;
    margin:auto;
    border:1px solid #292929;
    box-shadow:
        0 0 35px rgba(255,255,255,.04),
        0 0 80px rgba(0,0,0,.8);
}

.logo-trigger h1{
    margin-top:18px;
    font-size:45px;
    letter-spacing:4px;
    color:#fff;
}

.hero h2{
    margin-top:20px;
    font-size:19px;
    color:#aaa;
    font-weight:normal;
}

.hero p{
    max-width:650px;
    margin:15px auto 0;
    color:#666;
    line-height:1.9;
}

.main-btn{
    margin-top:30px;
    display:inline-block;
    padding:13px 27px;
    border:1px solid #303030;
    border-radius:12px;
    color:#fff;
    text-decoration:none;
    transition:.3s;
    background:#0b0b0b;
}

.main-btn:hover{
    background:#151515;
    border-color:#555;
}


/* SECTIONS */

section{
    padding:90px 20px;
}

.section-title{
    text-align:center;
    margin-bottom:35px;
}

.section-title h2{
    font-size:31px;
    color:#fff;
}

.section-title p{
    margin-top:10px;
    color:#555;
}

.about-box{
    max-width:850px;
    margin:auto;
    background:linear-gradient(145deg,#111,#090909);
    border:1px solid #202020;
    border-radius:22px;
    padding:42px 38px;
    text-align:center;
    color:#aaa;
    line-height:2;
    box-shadow:0 20px 60px rgba(0,0,0,.3);
}

.about-box strong{
    color:#fff;
}

.cards{
    max-width:1000px;
    margin:auto;
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:18px;
}

.card{
    display:block;
    background:#0b0b0b;
    border:1px solid #1c1c1c;
    border-radius:18px;
    padding:30px 20px;
    text-align:center;
    color:#999;
    transition:.3s;
    text-decoration:none;
    cursor:pointer;
}

.card:hover{
    transform:translateY(-4px);
    border-color:#555;
    background:#101010;
}

.card h3{
    color:#fff;
    margin-bottom:12px;
}

.card p{
    color:#999;
}

.share-box{
    max-width:800px;
    margin:auto;
    text-align:center;
    background:#0b0b0b;
    border:1px solid #1c1c1c;
    border-radius:22px;
    padding:40px 25px;
    color:#999;
    line-height:2;
}

.socials{
    margin-top:25px;
    display:flex;
    flex-wrap:wrap;
    justify-content:center;
    gap:10px;
}

.socials a{
    color:#aaa;
    text-decoration:none;
    border:1px solid #242424;
    background:#080808;
    border-radius:10px;
    padding:10px 16px;
    transition:.3s;
}

.socials a:hover{
    color:#fff;
    border-color:#555;
    background:#111;
}

footer{
    text-align:center;
    padding:35px 20px;
    color:#444;
    border-top:1px solid #151515;
    font-size:13px;
}


/* PUZZLE */

#puzzle-screen{
    position:fixed;
    inset:0;
    z-index:100000;
    background:#020202;
    display:none;
    overflow:auto;
}

#puzzle-screen.active{
    display:block;
}

.p-screen{
    min-height:100vh;
    display:none;
    position:relative;
    overflow:hidden;
}

.p-screen.active{
    display:flex;
}


/* COMMON PUZZLE */

.p-center{
    width:100%;
    max-width:950px;
    margin:auto;
    padding:30px 20px;
    text-align:center;
}

.warning{
    color:#ff3030;
    font-size:13px;
    letter-spacing:1px;
    margin-bottom:20px;
}

.p-title{
    font-size:25px;
    color:#eee;
    margin-bottom:18px;
}

.p-text{
    color:#777;
    line-height:2;
    max-width:700px;
    margin:0 auto 25px;
}

.p-btn{
    border:1px solid #353535;
    background:#0b0b0b;
    color:#ddd;
    padding:13px 28px;
    border-radius:10px;
    cursor:pointer;
    font-size:15px;
    transition:.25s;
}

.p-btn:hover{
    background:#181818;
    border-color:#777;
}

.p-btn.red{
    background:#210505;
    border-color:#a00000;
    color:#ff3a3a;
}

.p-btn.yellow{
    background:#211b05;
    border-color:#927600;
    color:#ffd83d;
}

.p-btn.back{
    margin-top:12px;
}


/* BOOT SCREEN */

#boot{
    background:
        radial-gradient(circle at center,rgba(80,0,0,.08),transparent 50%),
        #020202;
}

.boot-box{
    width:min(850px,92%);
    margin:auto;
    padding:28px;
    border:1px solid #181818;
    background:rgba(5,5,5,.85);
    box-shadow:0 0 80px rgba(0,0,0,.9);
    text-align:left;
    direction:ltr;
    position:relative;
    overflow:hidden;
}

.boot-box::before{
    content:"";
    position:absolute;
    inset:0;
    background:
        repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            rgba(255,255,255,.015) 4px
        );
    pointer-events:none;
}

.boot-top{
    color:#555;
    font-size:12px;
    margin-bottom:20px;
}

.boot-line{
    font-family:monospace;
    color:#5e5e5e;
    font-size:14px;
    margin:8px 0;
}

.boot-line.red{
    color:#a40000;
}

.boot-progress{
    height:10px;
    margin:28px 0 8px;
    border:1px solid #292929;
    background:#080808;
    overflow:hidden;
}

.boot-progress-fill{
    width:0;
    height:100%;
    background:linear-gradient(90deg,#320000,#ff1717,#5b0000);
    box-shadow:0 0 15px rgba(255,0,0,.4);
}

.boot-percent{
    color:#777;
    font-family:monospace;
    text-align:right;
    direction:ltr;
}

.boot-glitch{
    min-height:25px;
    margin-top:15px;
    font-family:monospace;
    color:#333;
    letter-spacing:2px;
}

.boot-continue{
    display:none;
    margin-top:25px;
    text-align:center;
    direction:rtl;
}

.boot-continue p{
    color:#c30000;
    margin-bottom:18px;
    animation:glitchText .18s infinite alternate;
}

@keyframes glitchText{
    from{transform:translateX(-1px)}
    to{transform:translateX(1px)}
}


/* FIRST PUZZLE */

#puzzle1{
    background:
        linear-gradient(rgba(30,0,0,.06),rgba(0,0,0,.9)),
        #030303;
}

.p1-terminal{
    max-width:800px;
    margin:auto;
    border:1px solid #252525;
    background:#050505;
    padding:30px;
    box-shadow:0 0 60px rgba(255,0,0,.04);
}

.p1-status{
    font-family:monospace;
    direction:ltr;
    text-align:left;
    color:#555;
    margin-bottom:25px;
}

.missing-words{
    display:flex;
    flex-wrap:wrap;
    justify-content:center;
    gap:15px;
    margin:25px 0;
}

.missing-words input{
    width:150px;
    padding:13px;
    background:#080808;
    border:1px solid #292929;
    border-radius:8px;
    color:#fff;
    text-align:center;
    font-family:monospace;
    outline:none;
}

.missing-words input:focus{
    border-color:#a00000;
}

.p1-error{
    min-height:24px;
    color:#c00000;
    margin:15px;
}


/* SECOND */

#puzzle2{
    background:#030303;
}

.error-interface{
    max-width:800px;
    margin:auto;
    border:1px solid #301010;
    background:
        linear-gradient(135deg,rgba(50,0,0,.08),transparent),
        #070707;
    padding:40px 25px;
    position:relative;
}

.error-interface.glitching{
    animation:interfaceShake .12s infinite;
}

@keyframes interfaceShake{
    0%{transform:translate(0)}
    25%{transform:translate(-2px,1px)}
    50%{transform:translate(2px,-1px)}
    75%{transform:translate(-1px,-2px)}
    100%{transform:translate(1px,2px)}
}

.error-code{
    direction:ltr;
    font-family:monospace;
    color:#4d0000;
    margin:25px 0;
    line-height:1.8;
}

.confirm-box{
    display:none;
    margin-top:25px;
    padding:25px;
    border:1px solid #461010;
    background:#0b0505;
}

.confirm-box p{
    color:#aaa;
    margin-bottom:20px;
}


/* THIRD */

#puzzle3{
    background:#010101;
}

.red-threat{
    position:absolute;
    inset:0;
    background:#020202;
    transition:background 15s linear;
    z-index:0;
}

#puzzle3.danger .red-threat{
    background:#b00000;
}

.p3-content{
    position:relative;
    z-index:2;
    width:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:30px;
}

#puzzle3.danger .p3-content{
    animation:dangerShake .7s infinite;
}

@keyframes dangerShake{
    0%,100%{transform:translate(0)}
    25%{transform:translate(-2px,1px)}
    50%{transform:translate(2px,-1px)}
    75%{transform:translate(-1px,2px)}
}

.timer{
    font-family:monospace;
    font-size:55px;
    color:#ff2020;
    margin:20px 0;
}

.arrow-sequence{
    display:flex;
    justify-content:center;
    gap:12px;
    direction:ltr;
    margin:25px 0;
}

.arrow-btn{
    width:65px;
    height:65px;
    border:1px solid #333;
    background:#090909;
    color:#ddd;
    border-radius:10px;
    font-size:25px;
    cursor:pointer;
    transition:.15s;
}

.arrow-btn:hover{
    background:#181818;
}

.arrow-btn:active{
    transform:scale(.9);
}

.arrow-progress{
    color:#777;
    font-family:monospace;
}

.p3-failed{
    display:none;
    position:absolute;
    inset:0;
    z-index:10;
    background:
        repeating-linear-gradient(
            0deg,
            rgba(255,255,255,.02) 0px,
            rgba(255,255,255,.02) 2px,
            transparent 3px,
            transparent 6px
        ),
        #a90000;
    align-items:center;
    justify-content:center;
    text-align:center;
}

.p3-failed.active{
    display:flex;
}

.p3-failed-inner{
    padding:30px;
    animation:failedGlitch .1s infinite alternate;
}

@keyframes failedGlitch{
    from{transform:translate(-2px)}
    to{transform:translate(2px)}
}


/* FOURTH */

#puzzle4{
    background:#030303;
}

.typing-box{
    max-width:850px;
    margin:auto;
    padding:35px 25px;
    border:1px solid #202020;
    background:#070707;
    min-height:360px;
    display:flex;
    flex-direction:column;
    justify-content:center;
}

.typing-text{
    min-height:150px;
    color:#aaa;
    font-family:monospace;
    direction:rtl;
    text-align:right;
    line-height:2.1;
    font-size:17px;
}

.typing-cursor{
    display:inline-block;
    width:8px;
    height:19px;
    background:#aaa;
    animation:cursorBlink .7s infinite;
    vertical-align:middle;
}

@keyframes cursorBlink{
    50%{opacity:0}
}

.p4-buttons{
    display:none;
    gap:15px;
    justify-content:center;
    margin-top:30px;
    flex-wrap:wrap;
}


/* FIFTH */

#puzzle5{
    background:#030303;
}

.code-analysis{
    max-width:750px;
    margin:auto;
    border:1px solid #202020;
    background:#070707;
    padding:35px 25px;
}

.code-string{
    direction:ltr;
    font-family:monospace;
    font-size:27px;
    letter-spacing:8px;
    color:#ddd;
    margin:25px 0;
    word-break:break-word;
}

.code-input{
    width:min(400px,90%);
    padding:15px;
    background:#020202;
    border:1px solid #333;
    color:#fff;
    text-align:center;
    font-family:monospace;
    font-size:20px;
    outline:none;
    border-radius:9px;
    text-transform:uppercase;
}

.code-input:focus{
    border-color:#777;
}

.code-result{
    min-height:25px;
    margin:15px;
    color:#c00000;
}


/* FINAL */

#final{
    background:
        radial-gradient(circle at center,rgba(0,70,255,.06),transparent 45%),
        #020202;
}

.final-box{
    max-width:850px;
    margin:auto;
    text-align:center;
    padding:40px 25px;
}

.final-box h1{
    font-size:30px;
    margin-bottom:25px;
}

.final-box p{
    color:#888;
    line-height:2;
    margin-bottom:12px;
}

.final-code{
    margin:35px auto;
    width:min(350px,90%);
    padding:25px;
    border:1px solid #1475ff;
    background:#020817;
    color:#4d9bff;
    font-family:monospace;
    font-size:32px;
    letter-spacing:5px;
    box-shadow:0 0 35px rgba(0,90,255,.08);
    direction:ltr;
}


/* MOBILE */

@media(max-width:600px){

    nav a{
        margin:0 6px;
        font-size:12px;
    }

    .hero{
        min-height:calc(100vh - 70px);
    }

    .logo-trigger img{
        width:120px;
        height:120px;
    }

    .logo-trigger h1{
        font-size:35px;
    }

    .p-title{
        font-size:21px;
    }

    .boot-box{
        padding:20px 15px;
    }

    .code-string{
        font-size:20px;
        letter-spacing:4px;
    }

    .arrow-btn{
        width:55px;
        height:55px;
    }

    .timer{
        font-size:43px;
    }
}
</style>
</head>

<body>

<!-- NAVBAR -->

<nav>
    <a href="#home">الرئيسية</a>
    <a href="#about">من نحن</a>
    <a href="#goal">هدفنا</a>
    <a href="#pages">صفحاتنا</a>
    <a href="#share">شاركنا</a>
</nav>


<!-- HOME -->

<main id="home">

<section class="hero">

    <div class="logo-trigger" id="secretTrigger">

        <img src="sorg.jbg" alt="WFESC">

        <h1>WFESC</h1>

    </div>

    <h2>المحتوى مُدار من قبل اوفس 𝑾𝑭𝑬𝑺𝑪</h2>

    <p>
        محتوى يهتم بتاريخ العراق وإنجازاته ومشاريعه وممتلكاته ونوادره،
        ويعيد تقديمها بطريقة مختلفة.
    </p>

    <a class="main-btn" href="#about">تعرف علينا</a>

</section>


<!-- ABOUT -->

<section id="about">

    <div class="section-title">
        <h2>من نحن؟</h2>
        <p>WFESC</p>
    </div>

    <div class="about-box">
        <p>
            <strong>WFESC</strong>
            مشروع يهتم بجمع وتوثيق القصص والصور والمعلومات المرتبطة بتاريخ
            العراق وإنجازاته ومشاريعه وممتلكاته ونوادره، وإعادة تقديمها
            بطريقة بسيطة ومختلفة تساعد على إبقاء هذه التفاصيل حاضرة.
        </p>
    </div>

</section>


<!-- GOAL -->

<section id="goal">

    <div class="section-title">
        <h2>هدفنا</h2>
        <p>المعرفة تبقى</p>
    </div>

    <div class="cards">

        <div class="card">
            <h3>التوثيق</h3>
            <p>جمع المعلومات والصور والقصص المهمة وحفظها.</p>
        </div>

        <div class="card">
            <h3>التعريف</h3>
            <p>إظهار جوانب مختلفة من تاريخ العراق وإنجازاته.</p>
        </div>

        <div class="card">
            <h3>المحتوى</h3>
            <p>تقديم المعلومات بطريقة مختصرة ومختلفة.</p>
        </div>

    </div>

</section>


<!-- PAGES -->

<section id="pages">

    <div class="section-title">
        <h2>صفحاتنا</h2>
        <p>WFESC</p>
    </div>

    <div class="cards">

        <a
            class="card"
            href="https://www.tiktok.com/@wfesc"
            target="_blank"
            rel="noopener noreferrer">

            <h3>TikTok</h3>
            <p>مقاطع ومحتوى WFESC.</p>

        </a>


        <a
            class="card"
            href="https://www.instagram.com/_wfesc/"
            target="_blank"
            rel="noopener noreferrer">

            <h3>Instagram</h3>
            <p>صور ومعلومات ومحتوى متنوع.</p>

        </a>


        <a
            class="card"
            href="https://www.youtube.com/@wfesc"
            target="_blank"
            rel="noopener noreferrer">

            <h3>YouTube</h3>
            <p>محتوى الفيديو الخاص بالمشروع.</p>

        </a>


        <a
            class="card"
            href="https://t.me/wfecs"
            target="_blank"
            rel="noopener noreferrer">

            <h3>Telegram</h3>
            <p>التواصل واستقبال المشاركات.</p>

        </a>


        <a
            class="card"
            href="https://www.facebook.com/wfesc"
            target="_blank"
            rel="noopener noreferrer">

            <h3>Facebook</h3>
            <p>صفحة WFESC.</p>

        </a>


        <a
            class="card"
            href="https://x.com/wfeesc"
            target="_blank"
            rel="noopener noreferrer">

            <h3>X</h3>
            <p>حساب WFESC على X.</p>

        </a>

    </div>

</section>


<!-- SHARE -->

<section id="share">

    <div class="section-title">
        <h2>شاركنا</h2>
        <p>هل لديك شيء يستحق أن يعرفه الناس؟</p>
    </div>

    <div class="share-box">

        <p>
            سيارة نادرة، قطعة قديمة، صناعة عراقية، مشروع، اختراع،
            صورة تاريخية أو أي شيء تعتقد أنه يستحق التوثيق؟
            شاركنا به.
        </p>

        <div class="socials">

            <a
                href="https://www.tiktok.com/@wfesc"
                target="_blank"
                rel="noopener noreferrer">
                TikTok
            </a>

            <a
                href="https://www.instagram.com/_wfesc/"
                target="_blank"
                rel="noopener noreferrer">
                Instagram
            </a>

            <a
                href="https://www.youtube.com/@wfesc"
                target="_blank"
                rel="noopener noreferrer">
                YouTube
            </a>

            <a
                href="https://t.me/wfecs"
                target="_blank"
                rel="noopener noreferrer">
                Telegram
            </a>

            <a
                href="https://www.facebook.com/wfesc"
                target="_blank"
                rel="noopener noreferrer">
                Facebook
            </a>

            <a
                href="https://x.com/wfeesc"
                target="_blank"
                rel="noopener noreferrer">
                X
            </a>

        </div>

    </div>

</section>

</main>


<footer>
    المحتوى مُدار من قبل اوفس 𝑾𝑭𝑬𝑺𝑪
</footer>



<!-- ===================================================== -->
<!-- PUZZLE SYSTEM -->
<!-- ===================================================== -->

